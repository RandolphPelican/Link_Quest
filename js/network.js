// ============================================================
// network.js — Multiplayer sync / lobby logic (Socket.io)
// ============================================================
// Stub — uncomment & wire up when Socket.io CDN is enabled in index.html

class NetworkManager {
  constructor() {
    this.socket = null;
    this.roomId = null;
    this.players = {};
    this.connected = false;
  }

  connect(serverUrl = 'http://localhost:3000') {
    // this.socket = io(serverUrl);
    // this.socket.on('connect', () => {
    //   this.connected = true;
    //   console.log('Connected:', this.socket.id);
    // });
    // this.socket.on('player_join',  (data) => this.onPlayerJoin(data));
    // this.socket.on('player_move',  (data) => this.onPlayerMove(data));
    // this.socket.on('player_leave', (id)   => this.onPlayerLeave(id));
    console.log('[NetworkManager] Socket.io stub — not yet active');
  }

  joinRoom(roomId) {
    this.roomId = roomId;
    // this.socket.emit('join_room', { roomId, character: 'lincoln' });
  }

  sendPosition(x, y) {
    // this.socket.emit('player_move', { x, y });
  }

  onPlayerJoin(data)  { console.log('Player joined:', data); }
  onPlayerMove(data)  { /* update remote player sprite position */ }
  onPlayerLeave(id)   { console.log('Player left:', id); }
}

const network = new NetworkManager();
