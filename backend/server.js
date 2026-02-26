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

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('join-stream', (data) => {
    const streamId = typeof data === 'string' ? data : data?.streamId;
    const username = typeof data === 'object' ? data?.username : null;

    if (username) {
      socket.username = username;
    }

    // Leave previous room if any to prevent double counting or stale state
    if (socket.currentRoom && socket.currentRoom !== streamId) {
       const prevRoom = socket.currentRoom;
       socket.leave(prevRoom);
       // Notify previous room
       const prevCount = io.sockets.adapter.rooms.get(prevRoom)?.size || 0;
       io.to(prevRoom).emit('room-users-update', prevCount);
       socket.to(prevRoom).emit('user-disconnected', { id: socket.id, username: socket.username });
       socket.currentRoom = null;
    }

    if (streamId && socket.currentRoom !== streamId) {
        socket.join(streamId);
        socket.currentRoom = streamId;
        console.log(`Socket ${socket.id} (${socket.username || 'unknown'}) joined stream ${streamId}`);

        // Broadcast updated participant count to the room
        const count = io.sockets.adapter.rooms.get(streamId)?.size || 0;
        io.to(streamId).emit('room-users-update', count);

        // Notify others for potential P2P connection
        socket.to(streamId).emit('user-connected', { id: socket.id, username: socket.username });
    }
  });

  socket.on('leave-stream', () => {
    if (socket.currentRoom) {
       const room = socket.currentRoom;
       socket.leave(room);
       const count = io.sockets.adapter.rooms.get(room)?.size || 0;
       io.to(room).emit('room-users-update', count);
       socket.to(room).emit('user-disconnected', { id: socket.id, username: socket.username });
       socket.currentRoom = null;
       console.log(`Socket ${socket.id} left stream ${room}`);
    }
  });

  socket.on('chat-message', ({ streamId, user, text, color }) => {
    if (streamId) {
        io.to(streamId).emit('chat-message', {
          id: Date.now(),
          user,
          text,
          color,
          senderId: socket.id
        });
    }
  });

  // WebRTC Signaling
  socket.on('signal', ({ to, signal }) => {
    io.to(to).emit('signal', {
      from: socket.id,
      signal
    });
  });

  socket.on('offer', (payload) => {
    if (payload && payload.target) {
      io.to(payload.target).emit('offer', { ...payload, sender: socket.id });
    }
  });

  socket.on('answer', (payload) => {
    if (payload && payload.target) {
      io.to(payload.target).emit('answer', { ...payload, sender: socket.id });
    }
  });

  socket.on('ice-candidate', (payload) => {
    if (payload && payload.target) {
      io.to(payload.target).emit('ice-candidate', { ...payload, sender: socket.id });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    const streamId = socket.currentRoom;

    if (streamId) {
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

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  server.listen(PORT, () => {
    console.log('Server running on port ' + PORT);
  });
}

module.exports = { server, io };
