const express = require('express');
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

  socket.on('join-stream', (streamId) => {
    // Leave previous room if any to prevent double counting or stale state
    if (socket.currentRoom && socket.currentRoom !== streamId) {
       socket.leave(socket.currentRoom);
       // Notify previous room
       const prevCount = io.sockets.adapter.rooms.get(socket.currentRoom)?.size || 0;
       io.to(socket.currentRoom).emit('room-users-update', prevCount);
    }

    socket.join(streamId);
    socket.currentRoom = streamId;
    console.log(`Socket ${socket.id} joined stream ${streamId}`);

    // Broadcast updated participant count to the room
    const count = io.sockets.adapter.rooms.get(streamId)?.size || 0;
    io.to(streamId).emit('room-users-update', count);
  });

  socket.on('chat-message', ({ streamId, user, text, color }) => {
    io.to(streamId).emit('chat-message', {
      id: Date.now(),
      user,
      text,
      color,
      senderId: socket.id
    });
  });

  socket.on('signal', ({ to, signal }) => {
    io.to(to).emit('signal', {
      from: socket.id,
      signal
    });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    const streamId = socket.currentRoom;

    if (streamId) {
      // Socket is automatically removed from rooms on disconnect
      const count = io.sockets.adapter.rooms.get(streamId)?.size || 0;
      io.to(streamId).emit('room-users-update', count);
    }
  });
});

app.get('/', (req, res) => {
  res.send('Backend is running with Socket.IO');
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log('Server running on port ' + PORT);
});
