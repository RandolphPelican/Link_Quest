// ============================================================
// state.js — Link Quest global state management
// ============================================================

'use strict';

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
