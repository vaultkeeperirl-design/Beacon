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
  console.log(`User connected: ${socket.id}`);

  // Join a specific room (stream)
  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId);
    socket.userId = userId;
    socket.to(roomId).emit('user-connected', userId);
    console.log(`User ${userId} joined room ${roomId}`);
  });

  socket.on('disconnecting', () => {
    if (socket.userId) {
      for (const room of socket.rooms) {
        if (room !== socket.id) {
          socket.to(room).emit('user-disconnected', socket.userId);
          console.log(`User ${socket.userId} disconnected from room ${room}`);
        }
      }
    }
  });

  // Signaling messages
  socket.on('offer', (payload) => {
    if (payload && payload.target) {
      io.to(payload.target).emit('offer', payload);
    }
  });

  socket.on('answer', (payload) => {
    if (payload && payload.target) {
      io.to(payload.target).emit('answer', payload);
    }
  });

  socket.on('ice-candidate', (payload) => {
    if (payload && payload.target) {
      io.to(payload.target).emit('ice-candidate', payload);
    }
  });
});

app.get('/', (req, res) => {
  res.send('Backend is running');
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  server.listen(PORT, () => {
    console.log('Server running on port ' + PORT);
  });
}

module.exports = { server, io };
