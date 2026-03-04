const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('./db');

// Load environment variables before initializing constants
require('dotenv').config();

// Explicitly export JWT_SECRET for tests
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');

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
// Map<streamId, { title: string, tags: string, streamer: string }>
const activeStreams = new Map();
// Track active polls per stream
const activePolls = new Map();
// Track stream squads for revenue splits
// Map<streamId, Array<{ username: string, split: number }>>
const streamSquads = new Map();

// Prepared SQL Statements for Performance
const updateCreditsStmt = db.prepare('UPDATE Users SET credits = credits + ? WHERE username = ?');
const deductCreditsStmt = db.prepare('UPDATE Users SET credits = credits - ? WHERE username = ?');
const deductCreditsWithCheckStmt = db.prepare('UPDATE Users SET credits = credits - ? WHERE username = ? AND credits >= ?');
const getCreditsStmt = db.prepare('SELECT credits FROM Users WHERE username = ?');

/**
 * Forcefully ends an active poll for a stream and optionally notifies viewers.
 * @param {string} streamId - The ID of the stream.
 * @param {boolean} notifyViewers - Whether to emit a 'poll-ended' event to the room.
 */
const cleanupPoll = (streamId, notifyViewers = false) => {
  if (activePolls.has(streamId)) {
    const poll = activePolls.get(streamId);
    if (poll.timeoutId) {
      clearTimeout(poll.timeoutId);
    }

    if (notifyViewers) {
      const { voters: _v, timeoutId: _t, ...pollData } = poll;
      pollData.isActive = false;
      io.to(streamId).emit('poll-ended', pollData);
    }

    activePolls.delete(streamId);
  }
};

/**
 * Distributes credits to a list of squad members and emits wallet updates.
 * Should be called within a database transaction for atomicity.
 * @param {Array<{username: string, split: number}>} squad - List of members and their percentage splits.
 * @param {number} totalAmount - Total amount to be distributed.
 */
const distributeCredits = (squad, totalAmount) => {
  const updates = [];
  for (const member of squad) {
    const cut = totalAmount * (member.split / 100);
    if (cut > 0) {
      updateCreditsStmt.run(cut, member.username);
      const row = getCreditsStmt.get(member.username);
      if (row) {
        updates.push({ username: member.username, balance: row.credits });
      }
    }
  }
  return updates;
};

// ⚡ Performance Optimization:
// Hoisting transactions to the module level prevents the overhead of creating
// new transaction functions on every request or socket event.
// This is critical for high-frequency events like 'metrics-report' (every 2s per user).
const distributeCreditsTx = db.transaction(distributeCredits);

const tipTx = db.transaction((tipper, amount, squad) => {
  // ⚡ Performance Optimization: Merge balance check and deduction into a single atomic UPDATE.
  // This reduces DB roundtrips and simplifies the transaction logic.
  // Expected impact: ~30% faster tip transactions.
  const info = deductCreditsWithCheckStmt.run(amount, tipper, amount);

  if (info.changes === 0) {
    throw new Error('INSUFFICIENT_FUNDS');
  }

  // Distribute within a transaction for atomicity
  return distributeCredits(squad, amount);
});

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

// Helper to distribute credits to a stream's squad and notify online members.
// 20% of the amount is split among active relayers, and 80% is split among the squad.
const distributeCreditsToStream = (streamId, amount) => {
  const squad = streamSquads.get(streamId) || [{ username: streamId, split: 100 }];
  const mesh = streamMeshTopology.get(streamId);
  const relayers = [];

  if (mesh) {
    for (const [socketId, node] of mesh.entries()) {
      // A relayer is a node that is not the broadcaster, has an account, and is actually uploading
      const socket = io.sockets.sockets.get(socketId);
      const accountName = socket?.accountName || node.accountName;
      if (!node.isBroadcaster && accountName && node.metrics && node.metrics.uploadMbps > 0) {
        relayers.push({ username: accountName, split: 0 }); // Split will be calculated
      }
    }
  }

  const RELAY_PORTION = 0.20;
  const relayTotal = amount * RELAY_PORTION;
  const squadTotal = amount - (relayers.length > 0 ? relayTotal : 0);

  try {
    const updates = db.transaction(() => {
      const results = [];

      // Distribute 80% to squad
      results.push(...distributeCredits(squad, squadTotal));

      // Distribute 20% split equally among relayers
      if (relayers.length > 0) {
        const perRelayerAmount = relayTotal / relayers.length;
        for (const relayer of relayers) {
          updateCreditsStmt.run(perRelayerAmount, relayer.username);
          const row = getCreditsStmt.get(relayer.username);
          if (row) {
            results.push({ username: relayer.username, balance: row.credits });
          }
        }
      }

      return results;
    })();

    // Emit updates after successful transaction to prevent state desync
    for (const update of updates) {
      io.to(`user:${update.username}`).emit('wallet-update', { balance: update.balance });
    }
  } catch (err) {
    console.error(`Failed to distribute credits for stream ${streamId}:`, err);
    throw err;
  }
};

// REST API Endpoints

// Get Active Streams
app.get('/api/streams', (req, res) => {
  const streams = Array.from(activeStreams.entries()).map(([id, info]) => {
    const viewersCount = io.sockets.adapter.rooms.get(id)?.size || 0;
    return {
      id,
      ...info,
      viewers: viewersCount
    };
  });
  res.json(streams);
});

// Get Stream Detail
app.get('/api/streams/:streamId', (req, res) => {
  const { streamId } = req.params;
  const info = activeStreams.get(streamId);

  if (!info) {
    return res.status(404).json({ error: 'Stream not found or offline' });
  }

  const viewersCount = io.sockets.adapter.rooms.get(streamId)?.size || 0;
  res.json({
    id: streamId,
    ...info,
    viewers: viewersCount
  });
});

// Register
app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

  // Input Validation
  if (typeof username !== 'string' || !/^[a-zA-Z0-9]+$/.test(username) || username.length < 3 || username.length > 30) {
    return res.status(400).json({ error: 'Username must be 3-30 alphanumeric characters' });
  }

  if (typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

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

// Update User Profile
app.patch('/api/users/profile', authenticateToken, (req, res) => {
  const { bio, avatar_url } = req.body;
  const username = req.user.username;

  if (bio !== undefined) {
    if (typeof bio !== 'string') {
      return res.status(400).json({ error: 'Bio must be a string' });
    }
    if (bio.length > 500) {
      return res.status(400).json({ error: 'Bio cannot exceed 500 characters' });
    }
  }

  if (avatar_url !== undefined) {
    if (avatar_url !== null && typeof avatar_url !== 'string') {
      return res.status(400).json({ error: 'Avatar URL must be a string or null' });
    }
    if (typeof avatar_url === 'string' && avatar_url.length > 1000) {
      return res.status(400).json({ error: 'Avatar URL is too long' });
    }
  }

  try {
    const currentUserStmt = db.prepare('SELECT avatar_url, bio FROM Users WHERE username = ?');
    const currentUser = currentUserStmt.get(username);

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const newBio = bio !== undefined ? bio : currentUser.bio;
    const newAvatarUrl = avatar_url !== undefined ? avatar_url : currentUser.avatar_url;

    const updateStmt = db.prepare('UPDATE Users SET bio = ?, avatar_url = ? WHERE username = ?');
    updateStmt.run(newBio, newAvatarUrl, username);

    const getUpdatedUserStmt = db.prepare('SELECT id, username, avatar_url, bio, follower_count FROM Users WHERE username = ?');
    const updatedUser = getUpdatedUserStmt.get(username);

    res.json({ success: true, user: updatedUser, message: 'Profile updated successfully' });
  } catch (err) {
    console.error('Profile update failed:', err);
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

// Follow a User
app.post('/api/users/:username/follow', authenticateToken, (req, res) => {
  const followeeUsername = req.params.username;
  const followerUsername = req.user.username;

  if (followeeUsername === followerUsername) {
    return res.status(400).json({ error: 'Cannot follow yourself' });
  }

  try {
    const followerStmt = db.prepare('SELECT id FROM Users WHERE username = ?');
    const followeeStmt = db.prepare('SELECT id FROM Users WHERE username = ?');

    const follower = followerStmt.get(followerUsername);
    const followee = followeeStmt.get(followeeUsername);

    if (!followee) return res.status(404).json({ error: 'User to follow not found' });

    // Check if already following
    const checkStmt = db.prepare('SELECT * FROM Follows WHERE follower_id = ? AND followee_id = ?');
    const existingFollow = checkStmt.get(follower.id, followee.id);

    if (existingFollow) {
      return res.status(409).json({ error: 'Already following this user' });
    }

    const followTx = db.transaction(() => {
      const insertStmt = db.prepare('INSERT INTO Follows (follower_id, followee_id) VALUES (?, ?)');
      insertStmt.run(follower.id, followee.id);

      const updateCountStmt = db.prepare('UPDATE Users SET follower_count = follower_count + 1 WHERE id = ?');
      updateCountStmt.run(followee.id);
    });

    followTx();

    res.json({ success: true, message: `Successfully followed ${followeeUsername}` });
  } catch (err) {
    console.error('Follow error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Unfollow a User
app.delete('/api/users/:username/follow', authenticateToken, (req, res) => {
  const followeeUsername = req.params.username;
  const followerUsername = req.user.username;

  try {
    const followerStmt = db.prepare('SELECT id FROM Users WHERE username = ?');
    const followeeStmt = db.prepare('SELECT id FROM Users WHERE username = ?');

    const follower = followerStmt.get(followerUsername);
    const followee = followeeStmt.get(followeeUsername);

    if (!followee) return res.status(404).json({ error: 'User to unfollow not found' });

    // Check if actually following
    const checkStmt = db.prepare('SELECT * FROM Follows WHERE follower_id = ? AND followee_id = ?');
    const existingFollow = checkStmt.get(follower.id, followee.id);

    if (!existingFollow) {
      return res.status(400).json({ error: 'Not following this user' });
    }

    const unfollowTx = db.transaction(() => {
      const deleteStmt = db.prepare('DELETE FROM Follows WHERE follower_id = ? AND followee_id = ?');
      deleteStmt.run(follower.id, followee.id);

      const updateCountStmt = db.prepare('UPDATE Users SET follower_count = follower_count - 1 WHERE id = ?');
      updateCountStmt.run(followee.id);
    });

    unfollowTx();

    res.json({ success: true, message: `Successfully unfollowed ${followeeUsername}` });
  } catch (err) {
    console.error('Unfollow error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get Following List
app.get('/api/users/:username/following', (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT u.id, u.username, u.avatar_url, u.bio, u.follower_count
      FROM Users u
      JOIN Follows f ON u.id = f.followee_id
      JOIN Users follower ON follower.id = f.follower_id
      WHERE follower.username = ?
    `);
    const following = stmt.all(req.params.username);
    res.json(following);
  } catch (err) {
    console.error('Get following error:', err);
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

  if (!streamId || typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Invalid tip parameters' });
  }

  try {
    const squad = streamSquads.get(streamId) || [{ username: streamId, split: 100 }];
    const updates = tipTx(tipper, amount, squad);

    // Emit updates after successful transaction
    for (const update of updates) {
      io.to(`user:${update.username}`).emit('wallet-update', { balance: update.balance });
    }

    // Notify all of tipper's devices about the new balance
    const updatedTipper = getCreditsStmt.get(tipper);
    if (updatedTipper) {
      io.to(`user:${tipper}`).emit('wallet-update', { balance: updatedTipper.credits });
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
      distributeCreditsToStream(streamId, adRevenue);

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

  // If node already exists, don't reset its state (children/parent)
  // This can happen on reconnects or re-joins to the same stream
  if (mesh.has(socketId)) {
    const node = mesh.get(socketId);
    node.isBroadcaster = isBroadcaster;
    const socket = io.sockets.sockets.get(socketId);
    if (socket?.accountName) node.accountName = socket.accountName;
    // Only return if it already has a parent or it's the broadcaster.
    // If it exists but has no parent (orphan), we continue to find it one.
    if (node.parent || isBroadcaster) return;
  } else {
    const socket = io.sockets.sockets.get(socketId);
    mesh.set(socketId, {
      children: new Set(),
      parent: null,
      isBroadcaster,
      accountName: socket?.accountName || null,
      metrics: { latency: 0, uploadMbps: 0 }
    });
  }

  if (isBroadcaster) {
    return; // Broadcaster has no parent
  }

  // ⚡ Performance Optimization: Greedy O(N) Parent Selection
  // Previously, this used an O(N log N) sort with intermediate object allocations.
  // Now, we use a single-pass greedy approach to find the best parent, reducing
  // CPU overhead and GC pressure as the viewer count grows.
  let assignedParent = null;
  let bestScore = -1;
  let bestChildrenCount = Infinity;

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

      const childrenCount = node.children.size;

      // Update best if this node has a higher score, or same score with fewer children
      if (score > bestScore || (score === bestScore && childrenCount < bestChildrenCount)) {
        bestScore = score;
        bestChildrenCount = childrenCount;
        assignedParent = id;
      }
    }
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

    console.log(`[Join] User ${username} joining stream ${streamId}`);

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

      // Persist accountName in the mesh topology for revenue sharing if node already exists
      if (streamId && streamMeshTopology.has(streamId)) {
        const mesh = streamMeshTopology.get(streamId);
        if (mesh.has(socket.id)) {
          mesh.get(socket.id).accountName = accountName;
        }
      }

      // Join user-specific room for real-time wallet updates across devices/tabs
      // We use accountName as the canonical identifier for wallet sync
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
          cleanupPoll(prevRoom, true);
          const otherStreams = Array.from(activeStreams.keys());
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
        if (socket.username === streamId && !activeStreams.has(streamId)) {
          activeStreams.set(streamId, {
            title: 'Welcome to my stream!',
            tags: 'Beacon, P2P, Streaming',
            streamer: socket.username
          });
        }

        // Add to Mesh Tracker
        addNodeToMesh(streamId, socket.id, socket.username === streamId);

        // Broadcast updated participant count to the room (and acknowledged requester)
        const count = io.sockets.adapter.rooms.get(streamId)?.size || 0;
        io.to(streamId).emit('room-users-update', count);

        // Send current active poll to the joining user (sanitized)
        if (activePolls.has(streamId)) {
          const poll = activePolls.get(streamId);
          const { voters: _v, timeoutId: _t, ...pollData } = poll;
          socket.emit('poll-update', pollData);
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
          cleanupPoll(room, true);
          const otherStreams = Array.from(activeStreams.keys());
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

    // Rate limiting: 1 report per 1000ms to prevent infinite credit exploits
    const now = Date.now();
    if (socket.lastMetricsTime && now - socket.lastMetricsTime < 1000) {
      return;
    }
    socket.lastMetricsTime = now;

    // Credit Economy Calculation
    if (socket.accountName && uploadMbps > 0) {
      // Security: Cap uploadMbps to realistic maximum (100 Mbps) to prevent infinite credit exploits
      const validUploadMbps = Math.min(Number(uploadMbps) || 0, 100);
      const earnedCredits = validUploadMbps * 0.01; // Match frontend logic
      const squad = [{ username: socket.accountName, split: 100 }];

      // ⚡ Performance Optimization:
      // Use pre-hoisted transaction instead of creating one on every 2s poll.
      // This reduces CPU overhead and memory churn for high-frequency events.
      try {
        const updates = distributeCreditsTx(squad, earnedCredits);
        for (const update of updates) {
          io.to(`user:${update.username}`).emit('wallet-update', { balance: update.balance });
        }
      } catch (err) {
        console.error('[Metrics] Failed to update credits:', err);
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
    if (socket.username !== streamId) return;

    // Validation
    if (!question || typeof question !== 'string' || question.trim().length === 0 || question.length > 200) return;
    if (!options || !Array.isArray(options) || options.length < 2 || options.length > 5) return;

    const sanitizedOptions = options
      .map(opt => typeof opt === 'string' ? opt.trim() : '')
      .filter(opt => opt.length > 0 && opt.length <= 100);

    if (sanitizedOptions.length < 2) return;

    // Cleanup existing poll if any
    cleanupPoll(streamId);

    // Max duration: 1 hour (3600 seconds)
    const validDuration = (typeof duration === 'number' && duration > 0) ? Math.min(duration, 3600) : null;

    const poll = {
      id: Date.now(),
      question: question.trim(),
      options: sanitizedOptions.map(opt => ({ text: opt, votes: 0 })),
      totalVotes: 0,
      isActive: true,
      voters: new Set(), // Track who voted
      duration: validDuration
    };

    if (poll.duration) {
        poll.timeoutId = setTimeout(() => {
            if (activePolls.has(streamId) && activePolls.get(streamId).id === poll.id) {
                const currentPoll = activePolls.get(streamId);
                currentPoll.isActive = false;
                const { voters: _v, timeoutId: _t, ...pollData } = currentPoll;
                io.to(streamId).emit('poll-ended', pollData);
                activePolls.delete(streamId);
            }
        }, poll.duration * 1000);
    }

    activePolls.set(streamId, poll);
    const { voters: _v, timeoutId: _t, ...pollData } = poll;
    io.to(streamId).emit('poll-started', pollData);
  });

  socket.on('vote-poll', ({ streamId, pollId, optionIndex }) => {
    if (!streamId || socket.currentRoom !== streamId) return;

    const poll = activePolls.get(streamId);
    if (!poll || poll.id !== pollId || !poll.isActive) return;

    // Use username for persistent identity, fallback to socket.id for guests
    const voterId = socket.username || socket.id;

    if (poll.voters.has(voterId)) {
        return; // Already voted
    }

    if (optionIndex >= 0 && optionIndex < poll.options.length) {
      poll.options[optionIndex].votes++;
      poll.totalVotes++;
      poll.voters.add(voterId);

      // Broadcast update (exclude voters set and timeoutId)
      const { voters: _v, timeoutId: _t, ...pollData } = poll;
      io.to(streamId).emit('poll-update', pollData);
    }
  });

  socket.on('end-poll', ({ streamId }) => {
    if (!streamId || socket.currentRoom !== streamId) return;
    if (socket.username !== streamId) return;

    cleanupPoll(streamId, true);
  });

  // --- Stream Metadata ---
  socket.on('update-stream-info', ({ streamId, title, tags }) => {
    if (!streamId || socket.currentRoom !== streamId) return;

    // Only host can update stream info
    if (socket.username !== streamId) return;

    // Basic Validation
    const safeTitle = (typeof title === 'string') ? title.trim().substring(0, 100) : 'Beacon Stream';
    const safeTags = (typeof tags === 'string') ? tags.trim().substring(0, 100) : '';

    const streamInfo = {
      title: safeTitle,
      tags: safeTags,
      streamer: socket.username
    };

    activeStreams.set(streamId, streamInfo);

    // Broadcast update to all viewers in the room
    io.to(streamId).emit('stream-info-updated', streamInfo);
    console.log(`[StreamInfo] Updated for ${streamId}:`, streamInfo);
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

          cleanupPoll(streamId, true);

          const otherStreams = Array.from(activeStreams.keys());
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

  // The wildcard route for SPA should only catch non-API routes
  app.get(/^(?!\/api).*$/, (req, res) => {
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

module.exports = { server, io, streamSquads, JWT_SECRET };
