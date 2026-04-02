// ============================================================
// state.js — Link Quest global state management
// ============================================================

'use strict';

window.CHAR_DEFS = {
  lincoln: {
    maxHp: 110, maxMp: 40, attackPower: 22, speed: 180,
    color: 0x3498db, accent: 0x2980b9, weapon: 'sword',
    spell: { type:'spin', mp:10, damage:26, range:70, color:0x00ccff },
    label: 'Lincoln'
  },
  journey: {
    maxHp: 80, maxMp: 80, attackPower: 15, speed: 170,
    color: 0x9b59b6, accent: 0x8e44ad, weapon: 'staff',
    spell: { type:'projectile', mp:10, damage:30, range:250, color:0xff6600 },
    label: 'Journey'
  },
  bear: {
    maxHp: 90, maxMp: 60, attackPower: 20, speed: 200,
    color: 0x27ae60, accent: 0x1e8449, weapon: 'bow',
    spell: { type:'projectile', mp:10, damage:18, range:220, color:0x00aaff, slow:true },
    label: 'Bear'
  },
  dad: {
    maxHp: 140, maxMp: 30, attackPower: 18, speed: 140,
    color: 0xe67e22, accent: 0xd35400, weapon: 'club',
    spell: { type:'aoe', mp:15, damage:20, range:90, color:0xaaff00 },
    label: 'Dad'
  },
  noha: {
    maxHp: 85, maxMp: 50, attackPower: 24, speed: 220,
    color: 0xe74c3c, accent: 0xc0392b, weapon: 'daggers',
    spell: { type:'dash', mp:12, damage:28, range:160, color:0xe74c3c },
    label: 'Noha'
  }
};

const GameState = {
  selectedChar:   null,
  currentLevel:   1,
  currentRoom:    1,
  lastDoor:       null,
  score:          0,
  paused:         false,
  inventory:      { keys: 0, armor: 'cloth' },
  playerHP:       null,
  playerMP:       null,
  roomState:      {},
  cutscenesSeen:  [],
  achievements:   [],
  deaths:         0,
  totalRooms:     30,

  // PERSISTENCE
  save() {
    const data = JSON.stringify({
      score: this.score,
      deaths: this.deaths,
      inventory: this.inventory,
      roomState: this.roomState,
      cutscenesSeen: this.cutscenesSeen,
      achievements: this.achievements
    });
    localStorage.setItem('link_quest_save', data);
  },

  load() {
    const data = localStorage.getItem('link_quest_save');
    if (data) {
      try {
        const parsed = JSON.parse(data);
        this.score = parsed.score || 0;
        this.deaths = parsed.deaths || 0;
        this.inventory = parsed.inventory || { keys: 0, armor: 'cloth' };
        this.roomState = parsed.roomState || {};
        this.cutscenesSeen = parsed.cutscenesSeen || [];
        this.achievements = parsed.achievements || [];
      } catch(e) {}
    }
  },

  // INDEXEDDB FOR CAMPAIGNS
  async saveCampaign(id, rooms) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("LinkQuestMaker", 1);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains("campaigns")) {
          db.createObjectStore("campaigns", { keyPath: "id" });
        }
      };
      request.onsuccess = (e) => {
        const db = e.target.result;
        const tx = db.transaction("campaigns", "readwrite");
        const store = tx.objectStore("campaigns");
        store.put({ id, rooms, updated: Date.now() });
        tx.oncomplete = () => resolve();
      };
      request.onerror = (e) => reject(e);
    });
  },

  async loadCampaigns() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("LinkQuestMaker", 1);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains("campaigns")) {
          db.createObjectStore("campaigns", { keyPath: "id" });
        }
      };
      request.onsuccess = (e) => {
        const db = e.target.result;
        const tx = db.transaction("campaigns", "readonly");
        const store = tx.objectStore("campaigns");
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result);
      };
      request.onerror = (e) => reject(e);
    });
  },

  reset() {
    this.score         = 0;
    this.deaths        = 0;
    this.currentLevel  = 1;
    this.currentRoom   = 1;
    this.lastDoor      = null;
    this.paused        = false;
    this.playerHP      = null;
    this.playerMP      = null;
    this.inventory     = { keys: 0, armor: 'cloth' };
    this.roomState     = {};
    this.cutscenesSeen = [];
    this.achievements  = [];
  }
};

function unlockAchievement(id, label) {
  if (!GameState.achievements.includes(id)) {
    GameState.achievements.push(id);
    showToast("🏆 ACHIEVEMENT: " + label, 4000);
    GameState.save();
  }
}

function getRoomState(level, room) {
  const key = level + '_' + room;
  if (!GameState.roomState[key])
    GameState.roomState[key] = { openedChests: [], cleared: false };
  return GameState.roomState[key];
}

function markChestOpened(level, room, index) {
  getRoomState(level, room).openedChests.push(index);
}

function isChestOpened(level, room, index) {
  return getRoomState(level, room).openedChests.includes(index);
}

function markCutsceneSeen(id) {
  if (!GameState.cutscenesSeen.includes(id)) GameState.cutscenesSeen.push(id);
}

function isCutsceneSeen(id) {
  return GameState.cutscenesSeen.includes(id);
}
