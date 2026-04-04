// ============================================================
// server.js — Link Quest multiplayer server
// Express static + Socket.io for multiplayer
// ============================================================

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname)));

// Socket.io connection
io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`⚔️ Link Quest server running on port ${PORT}`);
});