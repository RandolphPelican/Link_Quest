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
  undoStack: [],
  redoStack: [],
  
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

  _saveState() {
    this.undoStack.push(JSON.stringify(this.room));
    if (this.undoStack.length > 50) this.undoStack.shift();
    this.redoStack = []; // Clear redo on new action
  },

  undo() {
    if (this.undoStack.length === 0) return;
    this.redoStack.push(JSON.stringify(this.room));
    this.room = JSON.parse(this.undoStack.pop());
    this._draw();
    showToast("Undo");
  },

  redo() {
    if (this.redoStack.length === 0) return;
    this.undoStack.push(JSON.stringify(this.room));
    this.room = JSON.parse(this.redoStack.pop());
    this._draw();
    showToast("Redo");
  },

  _bindUI() {
    try {
      const btn = document.getElementById('maker-mode-btn');
      if (btn) btn.onclick = () => this.show();
      
      const exitBtn = document.getElementById('maker-exit-btn');
      if (exitBtn) exitBtn.onclick = () => this.hide();

      const playBtn = document.getElementById('maker-play-btn');
      if (playBtn) playBtn.onclick = () => {
        try {
          this.playtest();
        } catch (err) {
          console.error('Maker: Playtest failed', err);
          showToast('Failed to start playtest');
        }
      };

      const aiBtn = document.getElementById('maker-ai-btn');
      if (aiBtn) aiBtn.onclick = () => {
        try {
          this._saveState();
          this.aiSuggest();
        } catch (err) {
          console.error('Maker: AI Suggest failed', err);
          showToast('AI Suggestion error');
        }
      };

      const saveBtn = document.getElementById('maker-save-btn');
      if (saveBtn) saveBtn.onclick = () => {
        try {
          this.save();
        } catch (err) {
          console.error('Maker: Save failed', err);
          showToast('Save error');
        }
      };

      const shareBtn = document.getElementById('maker-share-btn');
      if (shareBtn) shareBtn.onclick = () => {
        try {
          this.share();
        } catch (err) {
          console.error('Maker: Share failed', err);
          showToast('Share error');
        }
      };

      const exportBtn = document.getElementById('maker-export-btn');
      if (exportBtn) exportBtn.onclick = () => {
        try {
          this.export();
        } catch (err) {
          console.error('Maker: Export failed', err);
          showToast('Export error');
        }
      };

      const importBtn = document.getElementById('maker-import-btn');
      if (importBtn) importBtn.onclick = () => {
        try {
          this.import();
        } catch (err) {
          console.error('Maker: Import failed', err);
          showToast('Import error');
        }
      };

      // Add Undo/Redo listeners (keyboard)
      window.addEventListener('keydown', (e) => {
        if (!this.active) return;
        if (e.ctrlKey && e.key === 'z') { e.preventDefault(); this.undo(); }
        if (e.ctrlKey && e.key === 'y') { e.preventDefault(); this.redo(); }
      });
      
      document.querySelectorAll('.maker-tab-btn').forEach(btn => {
        btn.onclick = () => {
          try {
            document.querySelectorAll('.maker-tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.maker-tab-content').forEach(c => c.classList.add('hidden'));
            btn.classList.add('active');
            const target = document.getElementById('maker-tab-' + btn.dataset.mtab);
            if (target) target.classList.remove('hidden');
          } catch (tabErr) {
            console.error('Maker: Tab switch error', tabErr);
          }
        };
      });

      const addRoomBtn = document.getElementById('add-room-btn');
      if (addRoomBtn) addRoomBtn.onclick = () => {
        try {
          this.addRoom();
        } catch (roomErr) {
          console.error('Maker: Add room failed', roomErr);
        }
      };

      const campaignSelect = document.getElementById('maker-campaign-select');
      if (campaignSelect) campaignSelect.onchange = (e) => this._onCampaignChange(e);

      const roomIdInput = document.getElementById('maker-room-id');
      if (roomIdInput) roomIdInput.onchange = (e) => this._onRoomIdChange(e);

      if (this.canvas) {
        this.canvas.onmousedown = (e) => { this._saveState(); this._onMouseDown(e); };
        this.canvas.onmousemove = (e) => this._onMouseMove(e);
        this.canvas.oncontextmenu = (e) => e.preventDefault();
        
        // Mobile touch support
        this.canvas.ontouchstart = (e) => {
          this._saveState();
          const t = e.touches[0];
          const rect = this.canvas.getBoundingClientRect();
          this._place(t.clientX - rect.left, t.clientY - rect.top);
          e.preventDefault();
        };
        this.canvas.ontouchmove = (e) => {
          const t = e.touches[0];
          const rect = this.canvas.getBoundingClientRect();
          this._place(t.clientX - rect.left, t.clientY - rect.top);
          e.preventDefault();
        };
      }
    } catch (bindErr) {
      console.error('Maker: UI binding fatal error', bindErr);
    }
  },
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

  async share() {
    const campaignData = {
      name: this.campaign.name || "Custom Campaign",
      rooms: this.campaign.rooms.length > 0 ? this.campaign.rooms : [this.room]
    };

    const token = prompt("Enter GitHub Personal Access Token (PAT) to share via Gist:\n(Required for anonymous Gist creation in modern GitHub API)");
    if (!token) return;

    showToast("Uploading to GitHub Gist...");
    try {
      const res = await fetch('https://api.github.com/gists', {
        method: 'POST',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          description: "Link Quest Campaign: " + campaignData.name,
          public: true,
          files: {
            "campaign.json": { content: JSON.stringify(campaignData, null, 2) }
          }
        })
      });

      if (!res.ok) throw new Error('GitHub API error: ' + res.status);
      const data = await res.json();
      const shareUrl = window.location.origin + window.location.pathname + "?gist=" + data.id;
      
      console.log('Campaign shared!', data.html_url);
      
      // Show shareable link
      const choice = confirm("Campaign shared successfully!\n\nShareable Game Link:\n" + shareUrl + "\n\nCopy to clipboard?");
      if (choice) {
        navigator.clipboard.writeText(shareUrl);
        showToast("Link copied to clipboard!");
      }
    } catch (err) {
      console.error('Share failed:', err);
      showToast("Error: " + err.message);
    }
  },

  async checkUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const gistId = params.get('gist');
    if (gistId) {
      showToast("Loading shared campaign...");
      try {
        const res = await fetch(`https://api.github.com/gists/${gistId}`);
        if (!res.ok) throw new Error('Could not fetch gist');
        const data = await res.json();
        const file = data.files["campaign.json"];
        if (file) {
          const campaign = JSON.parse(file.content);
          this.campaign = campaign;
          this.room = campaign.rooms[0];
          showToast("Campaign '" + campaign.name + "' loaded!");
          this._updateCampaignUI();
          this._draw();
        }
      } catch (err) {
        console.error('Failed to load gist:', err);
        showToast("Error loading campaign");
      }
    }
  },

  aiSuggest() {
    const designs = [
      {
        name: "The Crossfire",
        enemies: [
          {type:'goblin', x:200, y:200}, {type:'goblin', x:600, y:200},
          {type:'ai_bug', x:400, y:150}
        ],
        obstacles: [
          {type:'pillar', x:128, y:128}, {type:'pillar', x:672, y:128},
          {type:'pillar', x:128, y:472}, {type:'pillar', x:672, y:472}
        ],
        decorations: [{type:'torch', x:400, y:64}]
      },
      {
        name: "Trial of Switches",
        switches: [{x:128, y:128}, {x:672, y:472}],
        obstacles: [
          {type:'wall', x:400, y:200, w:32, h:32}, {type:'wall', x:400, y:400, w:32, h:32},
          {type:'wall', x:200, y:300, w:32, h:32}, {type:'wall', x:600, y:300, w:32, h:32}
        ],
        chests: [{x:400, y:300, type:'brown', contains:'small_key'}],
        enemies: [{type:'chatbot_clone', x:400, y:100}]
      },
      {
        name: "The Gauntlet",
        enemies: [
          {type:'goblin', x:100, y:300}, {type:'goblin', x:250, y:300},
          {type:'goblin', x:400, y:300}, {type:'goblin', x:550, y:300},
          {type:'goblin_chief', x:700, y:300}
        ],
        obstacles: Array.from({length:8}, (_,i) => ({type:'crate', x:100+i*80, y:200})),
        decorations: [{type:'torch', x:50, y:50}, {type:'torch', x:750, y:50}]
      },
      {
        name: "Spider's Nest",
        enemies: [
          {type:'glitch_sprite', x:400, y:300}, {type:'ai_bug', x:100, y:100},
          {type:'ai_bug', x:700, y:100}, {type:'ai_bug', x:100, y:500},
          {type:'ai_bug', x:700, y:500}
        ],
        obstacles: [
          {type:'pillar', x:400, y:150}, {type:'pillar', x:400, y:450},
          {type:'pillar', x:250, y:300}, {type:'pillar', x:550, y:300}
        ],
        signs: [{x:400, y:50, message: "Beware of the glitches!"}]
      }
    ];

    const s = designs[Math.floor(Math.random() * designs.length)];
    this.room = {
      ...this.room,
      name: s.name,
      enemies: s.enemies || [],
      obstacles: s.obstacles || [],
      switches: s.switches || [],
      chests: s.chests || [],
      decorations: s.decorations || [],
      signs: s.signs || [],
      items: []
    };
    
    document.getElementById('room-name-input').value = this.room.name;
    this._draw();
    showToast("AI Suggestion: " + s.name + " (Balanced)");
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

window.addEventListener('load', () => {
  Maker.init();
  Maker.checkUrlParams();
});
