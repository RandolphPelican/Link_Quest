// ============================================================
// network.js — Client-side multiplayer
// Socket.io relay model — works alongside single-player
// ============================================================

'use strict';

const Network = {
  socket:        null,
  connected:     false,
  inRoom:        false,
  roomCode:      null,
  isHost:        false,
  myId:          null,
  remotePlayers: {},  // id -> { char, name, x, y, facing, hp, mp, alive, animFrame, attacking, armor }
  sendTimer:     0,
  enabled:       false,

  // ── CONNECT ──────────────────────────────────────────────
  connect(serverUrl) {
    if (this.socket) {
      console.log('Network: Already connected');
      return;
    }
    
    console.log('Network: Loading Socket.io from CDN...');

    // Load Socket.io from CDN
    const script = document.createElement('script');
    script.src = 'https://cdn.socket.io/4.7.4/socket.io.min.js';
    script.onload = () => {
      console.log('Network: Socket.io loaded, connecting to server...');
      try {
        this.socket = io(serverUrl || window.location.origin, {
          transports: ['websocket', 'polling'],
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          timeout: 10000
        });
        this._bindEvents();
        this.enabled = true;
        console.log('Network: Socket created, connecting to', serverUrl || window.location.origin);
      } catch (e) {
        console.error('Network: Failed to create socket:', e);
        showToast('Failed to connect to multiplayer server');
      }
    };
    
    script.onerror = () => {
      console.error('Network: Failed to load Socket.io library');
      showToast('Failed to load multiplayer library');
    };
    
    document.head.appendChild(script);
  },

  _bindEvents() {
    const s = this.socket;

    s.on('connect', () => {
      this.connected = true;
      this.myId = s.id;
      console.log('Network: connected as', s.id);
      showToast('Connected to multiplayer server', 2000);
    });

    s.on('disconnect', (reason) => {
      this.connected = false;
      this.inRoom = false;
      console.log('Network: disconnected -', reason);
      showToast('Disconnected from server: ' + reason, 3000);
    });

    s.on('connect_error', (err) => {
      console.error('Network: connection error:', err);
      showToast('Connection error: ' + err.message, 3000);
    });

    s.on('error', (err) => {
      console.error('Network: socket error:', err);
      showToast('Network error: ' + err.message, 3000);
    });

    // Room events
    s.on('room_created', (info) => {
      this.inRoom   = true;
      this.roomCode = info.code;
      this.isHost   = true;
      showToast('Room created! Code: ' + info.code, 5000);
      this._updateLobby(info);
    });

    s.on('room_joined', (info) => {
      this.inRoom   = true;
      this.roomCode = info.code;
      this.isHost   = (info.hostId === this.myId);
      showToast('Joined room ' + info.code + '!');
      this._updateLobby(info);
    });

    s.on('join_error', (data) => {
      showToast(data.message, 4000);
    });

    s.on('player_joined', (info) => {
      const newPlayer = info.players[info.players.length - 1];
      showToast(newPlayer.name + ' joined as ' + newPlayer.char + '!');
      this._updateLobby(info);
    });

    s.on('player_left', (data) => {
      delete this.remotePlayers[data.id];
      showToast('A player left the game');
      this.isHost = (data.newHostId === this.myId);
    });

    s.on('room_update', (info) => {
      this._updateLobby(info);
    });

    // Game start
    s.on('game_start', (data) => {
      showToast('Game starting with ' + data.players.length + ' players!');
      // Initialize remote player records
      data.players.forEach(p => {
        if (p.id !== this.myId) {
          this.remotePlayers[p.id] = {
            char: p.char, name: p.name,
            x: 80, y: 300, facing: 'down',
            hp: 100, mp: 40, alive: true,
            animFrame: 0, attacking: false, armor: 'cloth'
          };
        }
      });
      // Hide lobby if visible
      const lobby = document.getElementById('mp-lobby');
      if (lobby) lobby.classList.add('hidden');
    });

    // Remote player state updates
    s.on('remote_player_state', (state) => {
      if (state.id === this.myId) return;
      if (!this.remotePlayers[state.id]) {
        console.log('Network: New remote player detected:', state.id, state.name);
        this.remotePlayers[state.id] = { char:'lincoln', name:'Player' };
      }
      Object.assign(this.remotePlayers[state.id], state);
      // console.log('Network: updated remote player', state.id); // Debug logging
    });

    // Remote attack events
    s.on('remote_attack', (data) => {
      if (!this.remotePlayers[data.id]) return;
      this.remotePlayers[data.id].attacking = true;
      setTimeout(() => {
        if (this.remotePlayers[data.id]) this.remotePlayers[data.id].attacking = false;
      }, 200);
    });

    // Synced room transitions (host-driven)
    s.on('sync_transition', (data) => {
      if (typeof GameState !== 'undefined' && typeof transitionToRoom === 'function') {
        if (data.level && data.level !== GameState.currentLevel) {
          if (typeof transitionToLevel === 'function') transitionToLevel(data.level);
        } else {
          transitionToRoom(data.roomId, data.fromSide);
        }
      }
    });

    // Remote item pickups (shared upgrades)
    s.on('remote_item_pickup', (data) => {
      if (data.itemType === 'armor' && typeof player !== 'undefined' && player) {
        const armorData = ITEMS[data.itemKey];
        if (armorData && player.armor !== data.itemKey) {
          player.armor = data.itemKey;
          const def = window.CHAR_DEFS[player.characterKey] || window.CHAR_DEFS.lincoln;
          player.maxHp = def.maxHp + armorData.hpBonus;
          player.hp = Math.min(player.hp + armorData.hpBonus, player.maxHp);
          GameState.inventory.armor = data.itemKey;
          showToast('🛡️ Team got ' + armorData.name + '!');
        }
      } else if (data.itemType === 'key') {
        GameState.inventory.keys++;
        showToast('🗝️ Team found a key! Keys: ' + GameState.inventory.keys);
      }
    });

    // Chat
    s.on('chat_msg', (data) => {
      showToast(data.name + ': ' + data.text, 3000);
    });
  },

  // ── ACTIONS ──────────────────────────────────────────────
  createRoom(name, char) {
    if (!this.socket || !this.connected) return;
    this.socket.emit('create_room', { name, char });
  },

  joinRoom(code, name, char) {
    if (!this.socket || !this.connected) return;
    this.socket.emit('join_room', { code, name, char });
  },

  readyUp() {
    if (!this.socket) return;
    this.socket.emit('player_ready');
  },

  // Called from game loop — throttled to ~20fps
  sendState(player, dt) {
    if (!this.socket || !this.inRoom || !player) return;
    this.sendTimer += dt;
    if (this.sendTimer < 0.05) return;  // Send every 0.05s (~20fps)
    this.sendTimer = 0;

    try {
      this.socket.emit('player_state', {
        x: Math.round(player.x),
        y: Math.round(player.y),
        facing: player.facing,
        hp: Math.round(player.hp),
        mp: Math.round(player.mp),
        alive: player.alive,
        animFrame: player.animFrame,
        attacking: player.attackCooldown > 20,
        armor: player.armor,
        char: player.characterKey
      });
      // console.log('Network: sent player state'); // Debug logging
    } catch (e) {
      console.error('Network: Failed to send player state:', e);
    }
  },

  sendAttack(type, facing, x, y) {
    if (!this.socket || !this.inRoom) return;
    this.socket.emit('player_attack', { type, facing, x, y });
  },

  sendRoomTransition(roomId, level, fromSide) {
    if (!this.socket || !this.inRoom) return;
    this.socket.emit('room_transition', { roomId, level, fromSide, force: true });
  },

  sendItemPickup(itemKey, itemType) {
    if (!this.socket || !this.inRoom) return;
    this.socket.emit('item_pickup', { itemKey, itemType });
  },

  sendChat(text) {
    if (!this.socket || !this.inRoom) return;
    this.socket.emit('chat', { text });
  },

  // ── RENDER REMOTE PLAYERS ────────────────────────────────
  renderRemotePlayers() {
    Object.values(this.remotePlayers).forEach(rp => {
      if (!rp.alive || !rp.char) return;
      // Draw with slight transparency to distinguish from local
      ctx.globalAlpha = 0.85;
      drawCharSprite(rp.x, rp.y, rp.char, rp.facing, rp.animFrame, rp.attacking, 28, 28);
      ctx.globalAlpha = 1;
      // Name tag
      const def = window.CHAR_DEFS[rp.char];
      const name = rp.name || (def ? def.label : rp.char);
      drawTextOutlined(name, rp.x, rp.y - 26, 7, 0xaaddff, 0x000000, 'center');
      // HP bar
      if (def) {
        const maxHp = def.maxHp;
        const barW = 24;
        const hpPct = Math.max(0, (rp.hp || 0) / maxHp);
        drawRect(rp.x, rp.y - 34, barW, 3, 0x333333);
        drawRect(rp.x - barW/2 + (barW*hpPct)/2, rp.y - 34, barW*hpPct, 3,
          hpPct > 0.5 ? 0x2ecc71 : hpPct > 0.25 ? 0xf39c12 : 0xe74c3c);
      }
    });
  },

  // ── LOBBY UI ─────────────────────────────────────────────
  _updateLobby(info) {
    let lobby = document.getElementById('mp-lobby');
    if (!lobby) return;
    const list = lobby.querySelector('#lobby-players');
    if (list) {
      list.innerHTML = info.players.map(p =>
        '<div class="lobby-player">' +
          '<span style="color:' + this._charColor(p.char) + '">' + p.name + '</span>' +
          ' — ' + p.char +
          (p.ready ? ' ✅' : ' ⏳') +
          (p.id === info.hostId ? ' 👑' : '') +
        '</div>'
      ).join('');
    }
    const codeEl = lobby.querySelector('#lobby-code');
    if (codeEl) codeEl.textContent = info.code;
  },

  _charColor(char) {
    const colors = { lincoln:'#3498db', journey:'#9b59b6', bear:'#27ae60', dad:'#e67e22', noha:'#e74c3c' };
    return colors[char] || '#ffffff';
  }
};
