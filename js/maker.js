// ============================================================
// maker.js — Room Editor for Link Quest
// ============================================================

'use strict';

const Maker = {
  canvas: null,
  ctx: null,
  active: false,
  selectedType: 'tile',
  selectedId: 'wall',
  
  room: {
    name: "New Room",
    background: "#182030",
    obstacles: [],
    enemies: [],
    items: [],
    decorations: [],
    chests: [],
    signs: [],
    switches: [],
    doors: {
      left: { leadsTo: null, locked: false },
      right: { leadsTo: null, locked: false },
      top: { leadsTo: null, locked: false },
      bottom: { leadsTo: null, locked: false }
    }
  },

  init() {
    this.canvas = document.getElementById('maker-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this._bindUI();
    this._initPalette();
    this._draw();
  },

  campaign: {
    id: "custom",
    name: "My Campaign",
    rooms: []
  },

  _bindUI() {
    const btn = document.getElementById('maker-mode-btn');
    if (btn) btn.addEventListener('click', () => this.show());
    
    document.getElementById('maker-exit-btn').addEventListener('click', () => this.hide());
    document.getElementById('maker-play-btn').addEventListener('click', () => this.playtest());
    document.getElementById('maker-ai-btn').addEventListener('click', () => this.aiSuggest());
    document.getElementById('maker-save-btn').addEventListener('click', () => this.save());
    document.getElementById('maker-export-btn').addEventListener('click', () => this.export());
    document.getElementById('maker-import-btn').addEventListener('click', () => this.import());
    
    document.querySelectorAll('.maker-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.maker-tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.maker-tab-content').forEach(c => c.classList.add('hidden'));
        btn.classList.add('active');
        document.getElementById('maker-tab-' + btn.dataset.mtab).classList.remove('hidden');
      });
    });

    document.getElementById('add-room-btn').addEventListener('click', () => this.addRoom());
...
  addRoom() {
    const newRoom = JSON.parse(JSON.stringify(this.room));
    newRoom.id = this.campaign.rooms.length + 1;
    newRoom.name = "Room " + newRoom.id;
    this.campaign.rooms.push(newRoom);
    this._updateCampaignUI();
  },

  _updateCampaignUI() {
    const list = document.getElementById('campaign-room-list');
    list.innerHTML = "";
    this.campaign.rooms.forEach((r, i) => {
      const el = document.createElement('div');
      el.style.cssText = "background:#1a1a30;padding:5px;border:1px solid #334;cursor:pointer;font-size:14px;";
      el.textContent = `${r.id}: ${r.name}`;
      el.onclick = () => {
        this.room = r;
        document.getElementById('room-name-input').value = r.name;
        this._draw();
      };
      list.appendChild(el);
    });
  },

  _onCampaignChange(e) {
    const val = e.target.value;
    if (val === 'custom') return;
    this._loadPreset(parseInt(val), parseInt(document.getElementById('maker-room-id').value));
  },

  _onRoomIdChange(e) {
    const campaign = document.getElementById('maker-campaign-select').value;
    if (campaign === 'custom') return;
    this._loadPreset(parseInt(campaign), parseInt(e.target.value));
  },

  async _loadPreset(levelNum, roomId) {
    const data = await loadLevel(levelNum);
    if (!data) return;
    const room = data.rooms.find(r => r.id === roomId);
    if (room) {
      this.room = JSON.parse(JSON.stringify(room));
      document.getElementById('room-name-input').value = this.room.name;
      document.getElementById('room-bg-input').value = this.room.background || "#182030";
      this._draw();
      showToast(`Loaded Level ${levelNum} Room ${roomId}`);
    } else {
      showToast(`Room ${roomId} not found in Level ${levelNum}`);
    }
  },

  _initPalette() {
    const tiles = ['wall', 'pillar', 'crate'];
    const enemies = ['goblin', 'goblin_chief', 'ai_bug', 'chatbot_clone', 'glitch_sprite', 'memory_leak'];
    const objects = ['chest', 'sign', 'switch', 'torch', 'bush', 'crystal', 'puddle'];

    const tPal = document.getElementById('tile-palette');
    tiles.forEach(id => this._addPaletteItem(tPal, 'tile', id));

    const ePal = document.getElementById('enemy-palette');
    enemies.forEach(id => this._addPaletteItem(ePal, 'enemy', id));

    const oPal = document.getElementById('object-palette');
    objects.forEach(id => this._addPaletteItem(oPal, 'object', id));
  },

  _addPaletteItem(container, type, id) {
    if (!container) return;
    const el = document.createElement('div');
    el.className = 'palette-item';
    el.title = id;
    el.dataset.type = type;
    el.dataset.id = id;
    el.innerHTML = `<div style="font-size:10px;">${id.substring(0,3)}</div>`;
    el.addEventListener('click', () => {
      document.querySelectorAll('.palette-item').forEach(i => i.classList.remove('active'));
      el.classList.add('active');
      this.selectedType = type;
      this.selectedId = id;
    });
    container.appendChild(el);
  },

  show() {
    this.active = true;
    document.getElementById('char-select-screen').classList.add('hidden');
    document.getElementById('maker-screen').classList.remove('hidden');
    // Load from local storage if exists
    const saved = localStorage.getItem('maker_current_room');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.name) {
          this.room = data;
          document.getElementById('room-name-input').value = this.room.name || "New Room";
          document.getElementById('room-bg-input').value = this.room.background || "#182030";
        }
      } catch(e) {}
    }
    this._draw();
  },

  hide() {
    this.active = false;
    document.getElementById('maker-screen').classList.add('hidden');
    document.getElementById('char-select-screen').classList.remove('hidden');
  },

  _onMouseDown(e) {
    if (!this.active) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (e.button === 2) { // Right click to remove
      this._removeAt(x, y);
    } else {
      this._place(x, y);
    }
  },

  _onMouseMove(e) {
    if (!this.active || e.buttons !== 1) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    this._place(x, y);
  },

  _place(x, y) {
    const gx = Math.floor(x / 32) * 32 + 16;
    const gy = Math.floor(y / 32) * 32 + 16;

    if (this.selectedType === 'tile') {
      this.room.obstacles = this.room.obstacles.filter(o => o.x !== gx || o.y !== gy);
      this.room.obstacles.push({ type: this.selectedId, x: gx, y: gy, w: 32, h: 32 });
    } else if (this.selectedType === 'enemy') {
      // Limit enemies at same spot
      this.room.enemies = this.room.enemies.filter(e => Math.abs(e.x - gx) > 10 || Math.abs(e.y - gy) > 10);
      this.room.enemies.push({ type: this.selectedId, x: gx, y: gy, count: 1 });
    } else if (this.selectedType === 'object') {
      if (this.selectedId === 'chest') {
        this.room.chests = this.room.chests.filter(c => c.x !== gx || c.y !== gy);
        this.room.chests.push({ x: gx, y: gy, type: 'brown', contains: 'chicken_nuggets' });
      } else if (this.selectedId === 'sign') {
        this.room.signs = this.room.signs.filter(s => s.x !== gx || s.y !== gy);
        this.room.signs.push({ x: gx, y: gy, message: 'Welcome to my room!' });
      } else if (this.selectedId === 'switch') {
        this.room.switches = this.room.switches.filter(s => s.x !== gx || s.y !== gy);
        this.room.switches.push({ x: gx, y: gy });
      } else {
        this.room.decorations = this.room.decorations.filter(d => d.x !== gx || d.y !== gy);
        this.room.decorations.push({ type: this.selectedId, x: gx, y: gy });
      }
    }
    this._draw();
  },

  _removeAt(x, y) {
    const gx = Math.floor(x / 32) * 32 + 16;
    const gy = Math.floor(y / 32) * 32 + 16;
    this.room.obstacles = this.room.obstacles.filter(o => o.x !== gx || o.y !== gy);
    this.room.enemies = this.room.enemies.filter(e => Math.abs(e.x - gx) > 16 || Math.abs(e.y - gy) > 16);
    this.room.chests = this.room.chests.filter(c => c.x !== gx || c.y !== gy);
    this.room.signs = this.room.signs.filter(s => s.x !== gx || s.y !== gy);
    this.room.switches = this.room.switches.filter(s => s.x !== gx || s.y !== gy);
    this.room.decorations = this.room.decorations.filter(d => d.x !== gx || d.y !== gy);
    this._draw();
  },

  _draw() {
    const ctx = this.ctx;
    if (!ctx) return;
    const bg = this.room.background || "#182030";
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 800, 600);

    // Grid
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= 800; x += 32) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 600); ctx.stroke();
    }
    for (let y = 0; y <= 600; y += 32) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(800, y); ctx.stroke();
    }

    // Draw obstacles
    this.room.obstacles.forEach(o => {
      ctx.fillStyle = o.type === 'wall' ? '#1e3040' : o.type === 'pillar' ? '#2a3f55' : '#6a5030';
      ctx.fillRect(o.x - 16, o.y - 16, 32, 32);
      ctx.strokeStyle = "#4a6f90";
      ctx.strokeRect(o.x - 16, o.y - 16, 32, 32);
    });

    // Draw decorations
    this.room.decorations.forEach(d => {
      ctx.fillStyle = d.type === 'bush' ? '#1a3a1a' : d.type === 'torch' ? '#ff6600' : '#aa44ff';
      ctx.beginPath(); ctx.arc(d.x, d.y, 8, 0, Math.PI*2); ctx.fill();
    });

    // Draw switches
    this.room.switches.forEach(s => {
      ctx.strokeStyle = "#00ddff";
      ctx.lineWidth = 2;
      ctx.strokeRect(s.x-12, s.y-12, 24, 24);
    });

    // Draw chests
    this.room.chests.forEach(c => {
      ctx.fillStyle = "#8b4513";
      ctx.fillRect(c.x-12, c.y-8, 24, 16);
      ctx.strokeStyle = "#ffd700";
      ctx.strokeRect(c.x-12, c.y-8, 24, 16);
    });

    // Draw signs
    this.room.signs.forEach(s => {
      ctx.fillStyle = "#8b6914";
      ctx.fillRect(s.x-10, s.y-12, 20, 15);
      ctx.fillStyle = "#fff";
      ctx.fillText("!", s.x-2, s.y-2);
    });

    // Draw enemies
    this.room.enemies.forEach(e => {
      ctx.fillStyle = "#ff4444";
      ctx.beginPath(); ctx.arc(e.x, e.y, 12, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "8px Arial";
      ctx.fillText(e.type.substring(0,3), e.x-10, e.y+3);
    });
  },

  async save() {
    localStorage.setItem('maker_current_room', JSON.stringify(this.room));
    showToast("Room saved to local storage!");
    unlockAchievement('first_custom_room', 'First Custom Room');
    
    // Also save to IndexedDB as part of a campaign
    const campaignId = document.getElementById('maker-campaign-select').value;
    if (campaignId === 'custom') {
      await GameState.saveCampaign('custom', [this.room]);
    }
  },

  export() {
    const blob = new Blob([JSON.stringify(this.room, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `room_${this.room.name.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    unlockAchievement('exported_room', 'Room Architect');
  },

  import() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.room';
    input.onchange = (e) => {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (re) => {
        try {
          const data = JSON.parse(re.target.result);
          this.room = data;
          document.getElementById('room-name-input').value = this.room.name || "Imported Room";
          document.getElementById('room-bg-input').value = this.room.background || "#182030";
          this._draw();
          showToast("Room imported!");
        } catch(err) {
          showToast("Error importing room!");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  },

  aiSuggest() {
    const suggestions = [
      { name: "The Goblin Pit", enemies: [{type:'goblin', count:3, x:400, y:300}], obstacles: [{type:'pillar', x:200, y:200}, {type:'pillar', x:600, y:400}] },
      { name: "Crystal Chamber", enemies: [{type:'glitch_sprite', count:2, x:300, y:200}], decorations: [{type:'crystal', x:400, y:300}, {type:'crystal', x:400, y:100}] },
      { name: "Puzzle Room", switches: [{x:200, y:200}, {x:600, y:400}], chests: [{x:400, y:300, type:'brown', contains:'small_key'}] }
    ];
    const s = suggestions[Math.floor(Math.random() * suggestions.length)];
    this.room.name = s.name;
    this.room.enemies = s.enemies || [];
    this.room.obstacles = s.obstacles || [];
    this.room.switches = s.switches || [];
    this.room.chests = s.chests || [];
    this.room.decorations = s.decorations || [];
    this.room.signs = s.signs || [];
    
    document.getElementById('room-name-input').value = this.room.name;
    this._draw();
    showToast("AI Suggestion applied: " + s.name);
  },

  playtest() {
    GameState.selectedChar = GameState.selectedChar || 'lincoln';
    GameState.currentLevel = 'maker';
    LevelCache['maker'] = { 
      id: 'maker',
      name: "Custom Campaign",
      rooms: [ { ...this.room, id: 1 } ] 
    };
    GameState.currentRoom = 1;
    GameState.lastDoor = null;
    
    document.getElementById('maker-screen').classList.add('hidden');
    document.getElementById('game-container').classList.remove('hidden');
    
    startGame();
  }
};

window.addEventListener('load', () => Maker.init());
