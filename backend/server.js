const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Track active streams (where host is present)
const activeStreams = new Set();
// Track active polls per stream
const activePolls = new Map();
// Track stream squads for revenue splits
// Map<streamId, Array<{ username: string, split: number }>>
const streamSquads = new Map();

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_beacon_key_123';

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access denied' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Prepare statements once for performance
const updateCreditsStmt = db.prepare('UPDATE Users SET credits = credits + ? WHERE username = ?');
const getCreditsStmt = db.prepare('SELECT credits FROM Users WHERE username = ?');

// Helper to distribute credits to a stream's squad and notify online members
const distributeCredits = (streamId, amount) => {
  const squad = streamSquads.get(streamId) || [{ username: streamId, split: 100 }];

  // Optimization: Pre-calculate active sockets per username
  const usernameToSockets = new Map();
  for (const [id, socket] of io.sockets.sockets) {
    if (socket.username) {
      if (!usernameToSockets.has(socket.username)) {
        usernameToSockets.set(socket.username, []);
      }
      usernameToSockets.get(socket.username).push(socket);
    }
  }

  // Use a transaction for the entire distribution
  const distributionTx = db.transaction((squadMembers, totalAmount) => {
    for (const member of squadMembers) {
      const cut = totalAmount * (member.split / 100);
      if (cut > 0) {
        updateCreditsStmt.run(cut, member.username);
        const row = getCreditsStmt.get(member.username);
        if (row && usernameToSockets.has(member.username)) {
          for (const socket of usernameToSockets.get(member.username)) {
            socket.emit('wallet-update', { balance: row.credits });
          }
        }
      }
    }
  });

  try {
    distributionTx(squad, amount);
  } catch (err) {
    console.error(`Failed to distribute credits for stream ${streamId}:`, err);
    throw err; // Re-throw to allow caller to handle failure
  }
};

// REST API Endpoints

// Register
app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

  try {
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    // Provide a default avatar (null)
    const defaultAvatar = null;

    try {
      const stmt = db.prepare('INSERT INTO Users (username, password_hash, avatar_url, bio, credits) VALUES (?, ?, ?, ?, ?)');
      const info = stmt.run(username, password_hash, defaultAvatar, 'I love streaming on Beacon!', 0.0);

      const token = jwt.sign({ id: info.lastInsertRowid, username }, JWT_SECRET, { expiresIn: '24h' });
      res.status(201).json({ token, user: { id: info.lastInsertRowid, username, avatar_url: defaultAvatar, bio: 'I love streaming on Beacon!', follower_count: 0, credits: 0.0 } });
    } catch (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(409).json({ error: 'Username already exists' });
        }
        return res.status(500).json({ error: 'Database error' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

  try {
    const stmt = db.prepare('SELECT * FROM Users WHERE username = ?');
    const user = stmt.get(username);

    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });

    // Don't send password hash back
    const { password_hash, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (err) {
      res.status(500).json({ error: 'Database error' });
  }
});

// Get User Profile
app.get('/api/users/:username', (req, res) => {
  try {
    const stmt = db.prepare('SELECT id, username, avatar_url, bio, follower_count FROM Users WHERE username = ?');
    const user = stmt.get(req.params.username);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
      res.status(500).json({ error: 'Database error' });
  }
});

// Get Wallet Balance
app.get('/api/wallet', authenticateToken, (req, res) => {
  try {
    const stmt = db.prepare('SELECT credits FROM Users WHERE username = ?');
    const row = stmt.get(req.user.username);
    if (!row) return res.status(404).json({ error: 'User not found' });
    res.json({ balance: row.credits });
  } catch (err) {
      res.status(500).json({ error: 'Database error' });
  }
});

// Tip Stream (Revenue Split Logic)
app.post('/api/tip', authenticateToken, (req, res) => {
  const { streamId, amount } = req.body;
  const tipper = req.user.username;

  if (!streamId || !amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid tip parameters' });
  }

  try {
    const tipTransaction = db.transaction(() => {
      const tipperRow = getCreditsStmt.get(tipper);

      if (!tipperRow || tipperRow.credits < amount) {
        throw new Error('INSUFFICIENT_FUNDS');
      }

      // Deduct from tipper
      updateCreditsStmt.run(-amount, tipper);

      // Distribute to squad
      distributeCredits(streamId, amount);
    });

    tipTransaction();

    // Notify tipper of their new balance
    const updatedTipperRow = getCreditsStmt.get(tipper);
    for (const [id, socket] of io.sockets.sockets) {
      if (socket.username === tipper) {
        socket.emit('wallet-update', { balance: updatedTipperRow.credits });
       for (const member of squad) {
         const cut = amount * (member.split / 100);
         if (cut > 0) {
            // Only update if the user exists
            const addStmt = db.prepare('UPDATE Users SET credits = credits + ? WHERE username = ?');
            addStmt.run(cut, member.username);
         }
       }
       return squad;
    });

    const squad = updateCredits();

    // Notify tipper of new balance
    const tipperRowUpdated = db.prepare('SELECT credits FROM Users WHERE username = ?').get(tipper);
    if (tipperRowUpdated) {
      io.to(`user:${tipper}`).emit('wallet-update', { balance: tipperRowUpdated.credits });
    }

    // Notify squad members of new balance
    for (const member of squad) {
      const row = db.prepare('SELECT credits FROM Users WHERE username = ?').get(member.username);
      if (row) {
        io.to(`user:${member.username}`).emit('wallet-update', { balance: row.credits });
      }
    }

    // Emit event to the room so chat can show the tip
    io.to(streamId).emit('chat-message', {
      id: Date.now(),
      user: 'System',
      text: `${tipper} just tipped ${amount} credits!`,
      color: 'text-beacon-400 font-bold',
      senderId: 'system',
    });

    res.json({ success: true, message: 'Tip distributed successfully' });
  } catch (err) {
    if (err.message === 'INSUFFICIENT_FUNDS') {
      return res.status(400).json({ error: 'Insufficient funds' });
    }
    console.error('Tip transaction failed:', err);
    res.status(500).json({ error: 'Database transaction failed' });
  }
});

// Trigger Ad Break (Distribute Ad Revenue)
app.post('/api/ads/trigger', authenticateToken, (req, res) => {
  const { streamId } = req.body;
  const broadcaster = req.user.username;

  if (broadcaster !== streamId) {
    return res.status(403).json({ error: 'Only the broadcaster can trigger an ad break' });
  }

  try {
    const viewersCount = io.sockets.adapter.rooms.get(streamId)?.size || 0;
    // Ad revenue formula: 0.5 CR per viewer during the break
    const adRevenue = viewersCount * 0.5;

    if (adRevenue > 0) {
      distributeCredits(streamId, adRevenue);

      io.to(streamId).emit('chat-message', {
        id: Date.now(),
        user: 'System',
        text: `Ad break started! Broadcaster earned ${adRevenue.toFixed(2)} CR from ${viewersCount} viewers.`,
        color: 'text-green-400 italic',
        senderId: 'system',
      });
    }

    res.json({ success: true, revenue: adRevenue });
  } catch (err) {
    console.error('Ad revenue distribution failed:', err);
    res.status(500).json({ error: 'Failed to distribute ad revenue' });
  }
});

// --- P2P Mesh Tracker ---
// Track the topology of peers in each stream
// Map<streamId, Map<socketId, { children: Set<socketId>, parent: socketId | null }>>
const streamMeshTopology = new Map();

// Configuration
const MAX_CHILDREN_PER_NODE = 2; // Keep it low for browser WebRTC stability

function addNodeToMesh(streamId, socketId, isBroadcaster = false) {
  if (!streamMeshTopology.has(streamId)) {
    streamMeshTopology.set(streamId, new Map());
  }

  const mesh = streamMeshTopology.get(streamId);
  mesh.set(socketId, { children: new Set(), parent: null, isBroadcaster, metrics: { latency: 0, uploadMbps: 0 } });

  if (isBroadcaster) {
    return; // Broadcaster has no parent
  }

  // Find a parent for the new viewer
  // Advanced Routing: Prefer nodes with lower latency and higher upload capacity
  let assignedParent = null;

  // Get all potential parent nodes that can still accept children
  const potentialParents = [];
  for (const [id, node] of mesh.entries()) {
    if (id !== socketId && node.children.size < MAX_CHILDREN_PER_NODE) {
      // Prioritize broadcaster, then use metrics
      let score = 0;
      if (node.isBroadcaster) {
        score = 10000; // Extremely high score to prefer direct connection
      } else {
        // Higher score is better: High upload speed and low latency
        const uploadScore = (node.metrics && node.metrics.uploadMbps > 0) ? node.metrics.uploadMbps * 10 : 5;
        const latencyPenalty = (node.metrics && node.metrics.latency > 0) ? node.metrics.latency : 100;
        score = (uploadScore / latencyPenalty) * 100;
      }
      potentialParents.push({ id, score, childrenCount: node.children.size });
    }
  }

  // Sort by score (descending), then by fewest children to balance the tree
  potentialParents.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.childrenCount - b.childrenCount;
  });

  if (potentialParents.length > 0) {
    assignedParent = potentialParents[0].id;
  }

  if (assignedParent) {
    const parentNode = mesh.get(assignedParent);
    parentNode.children.add(socketId);
    mesh.get(socketId).parent = assignedParent;

    // Notify the parent to initiate a connection with the new child
    io.to(assignedParent).emit('p2p-initiate-connection', { childId: socketId });
    console.log(`[Mesh] Assigned ${socketId} as child of ${assignedParent} in stream ${streamId}`);
  } else {
    console.log(`[Mesh] Warning: Could not find parent for ${socketId} in stream ${streamId}`);
  }
}

function removeNodeFromMesh(streamId, socketId) {
  if (!streamMeshTopology.has(streamId)) return;

  const mesh = streamMeshTopology.get(streamId);
  const node = mesh.get(socketId);
  if (!node) return;

  // If node had a parent, remove from parent's children
  if (node.parent) {
    const parentNode = mesh.get(node.parent);
    if (parentNode) {
      parentNode.children.delete(socketId);
    }
  }

  // If node had children, they are orphaned. Re-add them to the mesh.
  const orphans = Array.from(node.children);
  mesh.delete(socketId);

  for (const orphanId of orphans) {
    if (mesh.has(orphanId)) {
      mesh.get(orphanId).parent = null;
      // Re-add to find a new parent
      addNodeToMesh(streamId, orphanId, false);
    }
  }
}

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('join-stream', (data) => {
    const streamId = (typeof data === 'string' ? data : data?.streamId) || null;
    const accountName = typeof data === 'object' ? data?.username : null;
    let username = accountName;

    if (username) {
      // Security: Prevent users from impersonating the host
      // If the stream is active, the real host is already connected.
      // Anyone else claiming to be the host gets a fallback name.
      if (username === streamId && activeStreams.has(streamId)) {
        username = `${username}-viewer`;
      }

      // Leave old user room if identity changed
      if (socket.accountName && socket.accountName !== accountName) {
        socket.leave(`user:${socket.accountName}`);
      }

      socket.username = username;
      socket.accountName = accountName;
      socket.join(`user:${accountName}`);
    }

    // Leave previous room if any to prevent double counting or stale state
    if (socket.currentRoom && socket.currentRoom !== streamId) {
       const prevRoom = socket.currentRoom;

       // activeStreams logic: If host leaves, redirect viewers
       if (socket.username === prevRoom && activeStreams.has(prevRoom)) {
          activeStreams.delete(prevRoom);
          streamSquads.delete(prevRoom);
          // Check for active poll and clear its timeout
          if (activePolls.has(prevRoom)) {
              const poll = activePolls.get(prevRoom);
              if (poll.timeoutId) {
                  clearTimeout(poll.timeoutId);
              }
              activePolls.delete(prevRoom);
          }
          const otherStreams = Array.from(activeStreams);
          const redirect = otherStreams.length > 0 ? otherStreams[Math.floor(Math.random() * otherStreams.length)] : null;
          socket.to(prevRoom).emit('stream-ended', { redirect });
       }

       socket.leave(prevRoom);
       // Notify previous room
       const prevCount = io.sockets.adapter.rooms.get(prevRoom)?.size || 0;
       io.to(prevRoom).emit('room-users-update', prevCount);
       socket.to(prevRoom).emit('user-disconnected', { id: socket.id, username: socket.username });
       socket.currentRoom = null;
    }

    if (streamId) {
        if (socket.currentRoom !== streamId) {
            socket.join(streamId);
            socket.currentRoom = streamId;
            console.log(`Socket ${socket.id} (${socket.username || 'unknown'}) joined stream ${streamId}`);

            // Notify others for potential P2P connection
            socket.to(streamId).emit('user-connected', { id: socket.id, username: socket.username });
        }

        // If the user is the host, mark stream as active
        if (socket.username === streamId) {
          activeStreams.add(streamId);
        }

        // Add to Mesh Tracker
        addNodeToMesh(streamId, socket.id, socket.username === streamId);

        // Broadcast updated participant count to the room (and acknowledged requester)
        const count = io.sockets.adapter.rooms.get(streamId)?.size || 0;
        io.to(streamId).emit('room-users-update', count);

        // Send current active poll to the joining user
        if (activePolls.has(streamId)) {
          socket.emit('poll-update', activePolls.get(streamId));
        }
    }
  });

  socket.on('leave-stream', () => {
    if (socket.currentRoom) {
       const room = socket.currentRoom;

       // activeStreams logic: If host leaves, redirect viewers
       if (socket.username === room && activeStreams.has(room)) {
          activeStreams.delete(room);
          streamSquads.delete(room);
          // Check for active poll and clear its timeout
          if (activePolls.has(room)) {
              const poll = activePolls.get(room);
              if (poll.timeoutId) {
                  clearTimeout(poll.timeoutId);
              }
              activePolls.delete(room);
          }
          const otherStreams = Array.from(activeStreams);
          const redirect = otherStreams.length > 0 ? otherStreams[Math.floor(Math.random() * otherStreams.length)] : null;
          socket.to(room).emit('stream-ended', { redirect });
       }

       socket.leave(room);

       // Remove from Mesh Tracker
       removeNodeFromMesh(room, socket.id);

       const count = io.sockets.adapter.rooms.get(room)?.size || 0;
       io.to(room).emit('room-users-update', count);
       socket.to(room).emit('user-disconnected', { id: socket.id, username: socket.username });
       socket.currentRoom = null;
       console.log(`Socket ${socket.id} left stream ${room}`);
    }
  });

  socket.on('chat-message', ({ streamId, user, text, color }) => {
    // Validate streamId and ensure user is in the room
    if (!streamId || socket.currentRoom !== streamId) {
      return;
    }

    // Rate limiting: 1 message per 500ms
    const now = Date.now();
    if (socket.lastMessageTime && now - socket.lastMessageTime < 500) {
      return;
    }
    socket.lastMessageTime = now;

    // Input validation
    if (typeof text !== 'string' || text.trim().length === 0 || text.length > 500) {
      return;
    }

    // Sanitize color (basic check to allow only alphanumeric and dashes for tailwind classes)
    // If invalid or missing, let the frontend handle default or use a safe fallback here
    const safeColor = (typeof color === 'string' && /^[a-zA-Z0-9-]+$/.test(color)) ? color : null;

    // Use server-side username to prevent spoofing
    const safeUser = socket.username || 'Anonymous';

    io.to(streamId).emit('chat-message', {
      id: Date.now(),
      user: safeUser,
      text,
      color: safeColor,
      senderId: socket.id
    });
  });

  // --- Metrics Reporting ---
  socket.on('metrics-report', ({ streamId, latency, uploadMbps }) => {
    if (!streamId || socket.currentRoom !== streamId) return;

    // Credit Economy Calculation
    if (socket.accountName && uploadMbps > 0) {
      const earnedCredits = uploadMbps * 0.01; // Match frontend logic

      try {
        // Increment user credits in DB
        const stmt = db.prepare('UPDATE Users SET credits = credits + ? WHERE username = ?');
        stmt.run(earnedCredits, socket.accountName);

        // Fetch new balance to broadcast back
        const getStmt = db.prepare('SELECT credits FROM Users WHERE username = ?');
        const row = getStmt.get(socket.accountName);

        if (row) {
          io.to(`user:${socket.accountName}`).emit('wallet-update', { balance: row.credits });
        }
      } catch (err) {
        console.error('Error updating credits:', err);
      }
    }

    if (streamMeshTopology.has(streamId)) {
      const mesh = streamMeshTopology.get(streamId);
      const node = mesh.get(socket.id);

      if (node) {
        node.metrics = { latency, uploadMbps };

        // Advanced Mesh Routing: Handling "Bad" Nodes
        // If upload is terribly slow or latency is very high, forcefully evict children to keep the tree healthy
        if ((uploadMbps > 0 && uploadMbps < 0.5) || latency > 1000) {
           if (node.children.size > 0) {
             console.log(`[Mesh] Node ${socket.id} in stream ${streamId} identified as poor performing (upload: ${uploadMbps}Mbps, lat: ${latency}ms). Re-parenting children...`);
             const orphans = Array.from(node.children);
             for (const orphanId of orphans) {
                // Remove from parent
                node.children.delete(orphanId);
                const orphanNode = mesh.get(orphanId);
                if (orphanNode) orphanNode.parent = null;

                // Disconnect their P2P connection
                io.to(orphanId).emit('user-disconnected', { id: socket.id });
                io.to(socket.id).emit('user-disconnected', { id: orphanId });

                // Find a new parent
                addNodeToMesh(streamId, orphanId, false);
             }
           }
        }
      }
    }
  });

  // --- Co-Streaming Squad Logic ---
  socket.on('update-squad', ({ streamId, squad }) => {
    if (!streamId || socket.currentRoom !== streamId) return;

    // Only host can update squad
    if (socket.username !== streamId) return;

    if (!Array.isArray(squad)) return;

    // Validate split percentages equal 100
    const totalSplit = squad.reduce((sum, member) => sum + (Number(member.split) || 0), 0);
    if (Math.abs(totalSplit - 100) > 0.01) {
       console.log(`[Squad] Invalid split percentage total: ${totalSplit} for stream ${streamId}`);
       return;
    }

    // Security: Prevent negative splits which could generate infinite money or drain tipper
    if (squad.some(m => Number(m.split) < 0 || Number(m.split) > 100)) {
       console.log(`[Squad] Invalid split bounds for stream ${streamId}`);
       return;
    }

    // Map frontend 'name' to 'username' for backend tracking
    const backendSquad = squad.map(m => ({ username: m.name, split: Number(m.split) }));
    streamSquads.set(streamId, backendSquad);
    console.log(`[Squad] Updated for stream ${streamId}`, backendSquad);
  });

  // --- Poll Logic ---

  socket.on('create-poll', ({ streamId, question, options, duration }) => {
    if (!streamId || socket.currentRoom !== streamId) return;

    // Only host can create polls (simple check: username matches streamId)
    // In a real app, use proper auth/permissions
    if (socket.username !== streamId) return;

    if (!question || !options || !Array.isArray(options) || options.length < 2) return;

    const poll = {
      id: Date.now(),
      question,
      options: options.map(opt => ({ text: opt, votes: 0 })),
      totalVotes: 0,
      isActive: true,
      voters: new Set(), // Track who voted
      duration: typeof duration === 'number' && duration > 0 ? duration : null
    };

    if (poll.duration) {
        poll.timeoutId = setTimeout(() => {
            if (activePolls.has(streamId) && activePolls.get(streamId).id === poll.id) {
                const currentPoll = activePolls.get(streamId);
                currentPoll.isActive = false;
                io.to(streamId).emit('poll-ended', { ...currentPoll, voters: undefined, timeoutId: undefined });
                activePolls.delete(streamId);
            }
        }, poll.duration * 1000);
    }

    activePolls.set(streamId, poll);
    // Note: We don't send 'voters' Set to client, we should probably strip it or rely on JSON.stringify behavior
    // (Sets are serialized as {} in JSON.stringify unless handled, which is fine for hiding data but we should be clean)
    const { voters, timeoutId, ...pollData } = poll;
    io.to(streamId).emit('poll-started', pollData);
  });

  socket.on('vote-poll', ({ streamId, pollId, optionIndex }) => {
    if (!streamId || socket.currentRoom !== streamId) return;

    const poll = activePolls.get(streamId);
    if (!poll || poll.id !== pollId || !poll.isActive) return;

    if (poll.voters.has(socket.id)) {
        return; // Already voted
    }

    if (optionIndex >= 0 && optionIndex < poll.options.length) {
      poll.options[optionIndex].votes++;
      poll.totalVotes++;
      poll.voters.add(socket.id);

      // Broadcast update (exclude voters set)
      const { voters, ...pollData } = poll;
      io.to(streamId).emit('poll-update', pollData);
    }
  });

  socket.on('end-poll', ({ streamId }) => {
    if (!streamId || socket.currentRoom !== streamId) return;
    if (socket.username !== streamId) return;

    if (activePolls.has(streamId)) {
      const poll = activePolls.get(streamId);

      if (poll.timeoutId) {
          clearTimeout(poll.timeoutId);
      }

      poll.isActive = false;
      // strip internal fields
      const { voters, timeoutId, ...pollData } = poll;
      io.to(streamId).emit('poll-ended', pollData);
      activePolls.delete(streamId);
    }
  });

  // ------------------

  // WebRTC Signaling
  socket.on('signal', ({ to, signal }) => {
    if (to) {
      const targetSocket = io.sockets.sockets.get(to);
      if (targetSocket && targetSocket.currentRoom === socket.currentRoom) {
        io.to(to).emit('signal', {
          from: socket.id,
          signal
        });
      }
    }
  });

  socket.on('offer', (payload) => {
    if (payload && payload.target) {
      const targetSocket = io.sockets.sockets.get(payload.target);
      if (targetSocket && targetSocket.currentRoom === socket.currentRoom) {
        io.to(payload.target).emit('offer', { ...payload, sender: socket.id });
      }
    }
  });

  socket.on('answer', (payload) => {
    if (payload && payload.target) {
      const targetSocket = io.sockets.sockets.get(payload.target);
      if (targetSocket && targetSocket.currentRoom === socket.currentRoom) {
        io.to(payload.target).emit('answer', { ...payload, sender: socket.id });
      }
    }
  });

  socket.on('ice-candidate', (payload) => {
    if (payload && payload.target) {
      const targetSocket = io.sockets.sockets.get(payload.target);
      if (targetSocket && targetSocket.currentRoom === socket.currentRoom) {
        io.to(payload.target).emit('ice-candidate', { ...payload, sender: socket.id });
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    const streamId = socket.currentRoom;

    if (streamId) {
      // activeStreams logic: If host leaves, redirect viewers
      if (socket.username === streamId && activeStreams.has(streamId)) {
          activeStreams.delete(streamId);
          streamSquads.delete(streamId);

          if (activePolls.has(streamId)) {
              const poll = activePolls.get(streamId);
              if (poll.timeoutId) {
                  clearTimeout(poll.timeoutId);
              }
              activePolls.delete(streamId);
          }

          const otherStreams = Array.from(activeStreams);
          const redirect = otherStreams.length > 0 ? otherStreams[Math.floor(Math.random() * otherStreams.length)] : null;
          socket.to(streamId).emit('stream-ended', { redirect });
      }

      // Remove from Mesh Tracker
      removeNodeFromMesh(streamId, socket.id);

      // Socket is automatically removed from rooms on disconnect
      const count = io.sockets.adapter.rooms.get(streamId)?.size || 0;
      io.to(streamId).emit('room-users-update', count);
      socket.to(streamId).emit('user-disconnected', { id: socket.id, username: socket.username });
    }
  });
});

if (process.env.SERVE_STATIC) {
  const buildPath = path.join(__dirname, 'client_build');
  app.use(express.static(buildPath));

  app.get('*', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('Backend is running with Socket.IO');
  });
}

// Endpoint for Launcher to fetch network stats
app.get('/api/node-stats', (req, res) => {
    // Total connected sockets across all namespaces
    const meshNodes = io.engine.clientsCount;
    res.json({
        status: 'Online',
        meshNodes: meshNodes
    });
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  server.listen(PORT, () => {
    console.log('Server running on port ' + PORT);
  });
}

module.exports = { server, io, streamSquads };
