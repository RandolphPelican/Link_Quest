// ============================================================
// server.js — Link Quest multiplayer server
// Express static + Socket.io relay multiplayer
// Deploy on Render free tier as a Web Service
// ============================================================

const express = require('express');
const http    = require('http');
const { Server } = require('socket.io');
const path    = require('path');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: '*' },
  pingTimeout: 30000,
  pingInterval: 10000
});

const PORT = process.env.PORT || 8080;

// ── STATIC FILES ─────────────────────────────────────────────
app.use(express.static(path.join(__dirname), {
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'public, max-age=300');
  }
}));

// ── GAME ROOMS ───────────────────────────────────────────────
const rooms = new Map();

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return rooms.has(code) ? generateCode() : code;
}

function getRoomInfo(room) {
  return {
    code:    room.code,
    players: Object.values(room.players).map(p => ({
      id:    p.id,
      name:  p.name,
      char:  p.char,
      ready: p.ready
    })),
    hostId:  room.hostId,
    started: room.started
  };
}

// ── SOCKET.IO ────────────────────────────────────────────────
io.on('connection', (socket) => {
  let currentRoom = null;
  let playerId    = socket.id;

  console.log('Connected:', playerId);

  // ── CREATE ROOM ──────────────────────────────────────────
  socket.on('create_room', (data) => {
    const code = generateCode();
    const room = {
      code,
      hostId:  playerId,
      started: false,
      level:   1,
      roomNum: 1,
      players: {}
    };
    room.players[playerId] = {
      id:    playerId,
      name:  data.name || 'Player',
      char:  data.char || 'lincoln',
      ready: false,
      x: 80, y: 300,
      hp: 100, mp: 40,
      facing: 'down',
      alive: true,
      animFrame: 0,
      attacking: false
    };
    rooms.set(code, room);
    currentRoom = code;
    socket.join(code);
    socket.emit('room_created', getRoomInfo(room));
    console.log('Room created:', code, 'by', data.name);
  });

  // ── JOIN ROOM ────────────────────────────────────────────
  socket.on('join_room', (data) => {
    const code = (data.code || '').toUpperCase().trim();
    const room = rooms.get(code);

    if (!room) {
      socket.emit('join_error', { message: 'Room not found. Check the code.' });
      return;
    }
    if (room.started) {
      socket.emit('join_error', { message: 'Game already in progress.' });
      return;
    }
    if (Object.keys(room.players).length >= 5) {
      socket.emit('join_error', { message: 'Room is full (5 players max).' });
      return;
    }
    // Check if character is taken
    const takenChars = Object.values(room.players).map(p => p.char);
    if (takenChars.includes(data.char)) {
      socket.emit('join_error', { message: data.char + ' is already taken! Pick another.' });
      return;
    }

    room.players[playerId] = {
      id:    playerId,
      name:  data.name || 'Player',
      char:  data.char || 'lincoln',
      ready: false,
      x: 80, y: 300,
      hp: 100, mp: 40,
      facing: 'down',
      alive: true,
      animFrame: 0,
      attacking: false
    };
    currentRoom = code;
    socket.join(code);
    socket.emit('room_joined', getRoomInfo(room));
    socket.to(code).emit('player_joined', getRoomInfo(room));
    console.log(data.name, 'joined room', code, 'as', data.char);
  });

  // ── READY UP ─────────────────────────────────────────────
  socket.on('player_ready', () => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room || !room.players[playerId]) return;
    room.players[playerId].ready = true;
    io.to(currentRoom).emit('room_update', getRoomInfo(room));

    // Auto-start when all players ready (min 1)
    const players = Object.values(room.players);
    if (players.length >= 1 && players.every(p => p.ready)) {
      room.started = true;
      io.to(currentRoom).emit('game_start', {
        level: room.level,
        room:  room.roomNum,
        players: players.map(p => ({ id:p.id, char:p.char, name:p.name }))
      });
      console.log('Game started in room', currentRoom, 'with', players.length, 'players');
    }
  });

  // ── GAME STATE SYNC (relay model) ────────────────────────
  // Player sends their position/state, server relays to others
  socket.on('player_state', (state) => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room || !room.players[playerId]) return;

    // Update server-side record
    const p = room.players[playerId];
    p.x = state.x; p.y = state.y;
    p.facing = state.facing;
    p.hp = state.hp; p.mp = state.mp;
    p.alive = state.alive;
    p.animFrame = state.animFrame || 0;
    p.attacking = state.attacking || false;
    p.armor = state.armor || 'cloth';

    // Relay to all OTHER players in the room
    socket.to(currentRoom).emit('remote_player_state', {
      id: playerId,
      ...state
    });
  });

  // ── ATTACK / SPELL EVENTS ────────────────────────────────
  socket.on('player_attack', (data) => {
    if (!currentRoom) return;
    socket.to(currentRoom).emit('remote_attack', {
      id: playerId,
      type: data.type,  // 'melee', 'spell'
      facing: data.facing,
      x: data.x, y: data.y
    });
  });

  // ── ROOM TRANSITION (host-driven) ────────────────────────
  socket.on('room_transition', (data) => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room) return;
    // Only host can trigger room transitions
    if (playerId === room.hostId || data.force) {
      room.roomNum = data.roomId;
      room.level   = data.level || room.level;
      io.to(currentRoom).emit('sync_transition', {
        roomId: data.roomId,
        level:  room.level,
        fromSide: data.fromSide
      });
    }
  });

  // ── ITEM PICKUP (broadcast to all) ───────────────────────
  socket.on('item_pickup', (data) => {
    if (!currentRoom) return;
    // When one player picks up armor/key, all players benefit
    socket.to(currentRoom).emit('remote_item_pickup', {
      id: playerId,
      itemKey: data.itemKey,
      itemType: data.itemType
    });
  });

  // ── CHAT ─────────────────────────────────────────────────
  socket.on('chat', (msg) => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room || !room.players[playerId]) return;
    io.to(currentRoom).emit('chat_msg', {
      name: room.players[playerId].name,
      char: room.players[playerId].char,
      text: msg.text
    });
  });

  // ── DISCONNECT ───────────────────────────────────────────
  socket.on('disconnect', () => {
    console.log('Disconnected:', playerId);
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room) return;

    const wasHost = playerId === room.hostId;
    delete room.players[playerId];

    const remaining = Object.keys(room.players);
    if (remaining.length === 0) {
      rooms.delete(currentRoom);
      console.log('Room', currentRoom, 'deleted (empty)');
    } else {
      // Transfer host if needed
      if (wasHost) {
        room.hostId = remaining[0];
        console.log('Host transferred to', room.hostId, 'in room', currentRoom);
      }
      io.to(currentRoom).emit('player_left', {
        id: playerId,
        newHostId: room.hostId,
        players: getRoomInfo(room).players
      });
    }
  });
});

// ── HEALTH CHECK (Render needs this) ─────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    rooms: rooms.size,
    players: Array.from(rooms.values()).reduce((sum, r) => sum + Object.keys(r.players).length, 0)
  });
});

// ── START ─────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log('⚔️  Link Quest server running on port ' + PORT);
});
