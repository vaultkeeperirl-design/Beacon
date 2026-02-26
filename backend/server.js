const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
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

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('join-stream', (data) => {
    const streamId = (typeof data === 'string' ? data : data?.streamId) || null;
    const username = typeof data === 'object' ? data?.username : null;

    if (username) {
      socket.username = username;
    }

    // Leave previous room if any to prevent double counting or stale state
    if (socket.currentRoom && socket.currentRoom !== streamId) {
       const prevRoom = socket.currentRoom;

       // activeStreams logic: If host leaves, redirect viewers
       if (socket.username === prevRoom && activeStreams.has(prevRoom)) {
          activeStreams.delete(prevRoom);
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
          const otherStreams = Array.from(activeStreams);
          const redirect = otherStreams.length > 0 ? otherStreams[Math.floor(Math.random() * otherStreams.length)] : null;
          socket.to(room).emit('stream-ended', { redirect });
       }

       socket.leave(room);
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

  // --- Poll Logic ---

  socket.on('create-poll', ({ streamId, question, options }) => {
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
      isActive: true
    };

    activePolls.set(streamId, poll);
    io.to(streamId).emit('poll-started', poll);
  });

  socket.on('vote-poll', ({ streamId, pollId, optionIndex }) => {
    if (!streamId || socket.currentRoom !== streamId) return;

    const poll = activePolls.get(streamId);
    if (!poll || poll.id !== pollId || !poll.isActive) return;

    if (optionIndex >= 0 && optionIndex < poll.options.length) {
      poll.options[optionIndex].votes++;
      poll.totalVotes++;

      // Broadcast update
      io.to(streamId).emit('poll-update', poll);
    }
  });

  socket.on('end-poll', ({ streamId }) => {
    if (!streamId || socket.currentRoom !== streamId) return;
    if (socket.username !== streamId) return;

    if (activePolls.has(streamId)) {
      const poll = activePolls.get(streamId);
      poll.isActive = false;
      io.to(streamId).emit('poll-ended', poll);
      activePolls.delete(streamId);
    }
  });

  // ------------------

  // WebRTC Signaling
  socket.on('signal', ({ to, signal }) => {
    io.to(to).emit('signal', {
      from: socket.id,
      signal
    });
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
          const otherStreams = Array.from(activeStreams);
          const redirect = otherStreams.length > 0 ? otherStreams[Math.floor(Math.random() * otherStreams.length)] : null;
          socket.to(streamId).emit('stream-ended', { redirect });
      }

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

module.exports = { server, io };
