// ============================================================
// main.js — Link Quest core game loop
// Death = respawn next room | Level transitions | Ending
// ============================================================

'use strict';

// ── GAME STATE ────────────────────────────────────────────────
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
  deaths:         0,
  totalRooms:     30
};

const LevelCache = {};

async function loadLevel(num) {
  if (LevelCache[num]) return LevelCache[num];
  try {
    const res = await fetch('levels/level' + num + '.json');
    LevelCache[num] = await res.json();
    return LevelCache[num];
  } catch(e) { console.error('Level load failed:', e); return null; }
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

function showToast(msg, duration) {
  duration = duration || 2200;
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), duration);
}

function getSpawnPosition(lastDoor) {
  switch(lastDoor) {
    case 'right':  return { x: 80,  y: 300 };
    case 'left':   return { x: 720, y: 300 };
    case 'top':    return { x: 400, y: 520 };
    case 'bottom': return { x: 400, y: 80  };
    default:       return { x: 80,  y: 300 };
  }
}

// ── CUTSCENE ──────────────────────────────────────────────────
const Cutscene = {
  lines: [], index: 0, onDone: null,
  play(lines, onDone) {
    this.lines = lines; this.index = 0; this.onDone = onDone || null;
    document.getElementById('cutscene-overlay').classList.remove('hidden');
    enginePause(true);
    this.showLine();
  },
  showLine() {
    const el = document.getElementById('cutscene-text');
    el.textContent = '';
    const line = this.lines[this.index];
    let i = 0;
    clearInterval(this._typeTimer);
    this._typeTimer = setInterval(() => {
      el.textContent += line[i++];
      if (i >= line.length) clearInterval(this._typeTimer);
    }, 22);
  },
  next() {
    this.index++;
    if (this.index >= this.lines.length) {
      document.getElementById('cutscene-overlay').classList.add('hidden');
      enginePause(false);
      if (this.onDone) this.onDone();
    } else { this.showLine(); }
  }
};

document.getElementById('cutscene-next')
  .addEventListener('click', () => Cutscene.next());

// Also allow spacebar/K/Enter to advance cutscenes
window.addEventListener('keydown', e => {
  if (['k',' ','enter'].includes(e.key.toLowerCase()) && !document.getElementById('cutscene-overlay').classList.contains('hidden')) {
    e.preventDefault();
    Cutscene.next();
  }
});

// ── LOADING SCREEN ────────────────────────────────────────────
function runLoadingScreen(onDone) {
  const bar  = document.getElementById('loading-bar');
  const tip  = document.getElementById('loading-tip');
  const tips = [
    'Loading assets...',
    'Spawning goblins...',
    'Charging fireballs...',
    "Polishing Dad's club...",
    "Sharpening Noha's daggers...",
    'Lincoln unsheathes his sword...',
    'Bear strings the bow...',
    'Hiding GossipGPT...',
    'Almost ready...'
  ];
  let pct = 0, tipIdx = 0;
  const iv = setInterval(() => {
    pct += Math.random() * 15 + 5;
    if (pct > 100) pct = 100;
    bar.style.width = pct + '%';
    tip.textContent = tips[Math.min(tipIdx++, tips.length - 1)];
    if (pct >= 100) { clearInterval(iv); setTimeout(onDone, 400); }
  }, 350);
}

// ── CHAR SELECT ───────────────────────────────────────────────
function initCharSelect() {
  document.getElementById('loading-screen').classList.add('hidden');
  document.getElementById('char-select-screen').classList.remove('hidden');
  const cards = document.querySelectorAll('.char-card');
  const soloBtn = document.getElementById('solo-btn');
  const hostBtn = document.getElementById('host-btn');
  const joinBtn = document.getElementById('join-btn');
  const joinCode = document.getElementById('join-code');
  const readyBtn = document.getElementById('ready-btn');

  // Connect to multiplayer server
  Network.connect();

  cards.forEach(card => {
    card.addEventListener('click', () => {
      cards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      GameState.selectedChar = card.dataset.char;
      const def = CHAR_DEFS[card.dataset.char];
      // Enable buttons
      soloBtn.textContent = 'Solo as ' + (def ? def.label : card.dataset.char);
      soloBtn.classList.add('ready');
      soloBtn.disabled = false;
      hostBtn.classList.add('ready');
      hostBtn.disabled = false;
      joinBtn.classList.add('ready');
      joinBtn.disabled = false;
    });
  });

  // SOLO — just start the game
  soloBtn.addEventListener('click', () => {
    if (!GameState.selectedChar) return;
    document.getElementById('char-select-screen').classList.add('hidden');
    document.getElementById('game-container').classList.remove('hidden');
    startGame();
  });

  // HOST — create a multiplayer room
  hostBtn.addEventListener('click', () => {
    if (!GameState.selectedChar || !Network.connected) {
      showToast(Network.connected ? 'Pick a character first!' : 'Connecting to server...');
      return;
    }
    const def = CHAR_DEFS[GameState.selectedChar];
    Network.createRoom(def ? def.label : GameState.selectedChar, GameState.selectedChar);
    document.getElementById('char-select-screen').classList.add('hidden');
    document.getElementById('mp-lobby').classList.remove('hidden');
  });

  // JOIN — join with room code
  joinBtn.addEventListener('click', () => {
    const code = joinCode.value.trim().toUpperCase();
    if (!GameState.selectedChar) { showToast('Pick a character first!'); return; }
    if (!code || code.length < 4) { showToast('Enter a 4-letter room code!'); return; }
    if (!Network.connected) { showToast('Connecting to server...'); return; }
    const def = CHAR_DEFS[GameState.selectedChar];
    Network.joinRoom(code, def ? def.label : GameState.selectedChar, GameState.selectedChar);
    document.getElementById('char-select-screen').classList.add('hidden');
    document.getElementById('mp-lobby').classList.remove('hidden');
  });

  // READY UP in lobby
  readyBtn.addEventListener('click', () => {
    Network.readyUp();
    readyBtn.textContent = 'READY! Waiting...';
    readyBtn.disabled = true;
    readyBtn.style.borderColor = '#ffd700';
    readyBtn.style.color = '#ffd700';
  });

  // Listen for game_start to actually launch
  const checkStart = setInterval(() => {
    if (Network.socket) {
      Network.socket.on('game_start', () => {
        clearInterval(checkStart);
        document.getElementById('mp-lobby').classList.add('hidden');
        document.getElementById('game-container').classList.remove('hidden');
        startGame();
      });
      clearInterval(checkStart);
    }
  }, 200);
}

// ── GAME WORLD ────────────────────────────────────────────────
let player       = null;
let enemies      = [];
let items        = [];
let boss         = null;
let roomMgr      = null;
let levelData    = null;
let roomData     = null;
let transitioning = false;
let roomCleared  = false;

function loadRoom() {
  transitioning = false;
  roomCleared   = false;

  levelData = LevelCache[GameState.currentLevel];
  if (!levelData) { console.error('No level data for level', GameState.currentLevel); return; }

  roomData = levelData.rooms.find(r => r.id === GameState.currentRoom);
  if (!roomData) { console.error('Room not found:', GameState.currentRoom); return; }

  // Init room manager
  roomMgr = new RoomManager(roomData);

  // Spawn player
  const spawn = getSpawnPosition(GameState.lastDoor);
  player = new Player(spawn.x, spawn.y, GameState.selectedChar);
  if (GameState.playerHP !== null) player.hp = GameState.playerHP;
  if (GameState.playerMP !== null) player.mp = GameState.playerMP;
  // Restore armor
  if (GameState.inventory.armor !== 'cloth') {
    player.armor = GameState.inventory.armor;
    const armorData = ITEMS[GameState.inventory.armor];
    if (armorData) player.maxHp = (CHAR_DEFS[GameState.selectedChar]||CHAR_DEFS.lincoln).maxHp + armorData.hpBonus;
  }

  // Spawn enemies
  enemies = [];
  const state = getRoomState(GameState.currentLevel, GameState.currentRoom);
  if (!state.cleared) {
    (roomData.enemies || []).forEach(group => {
      for (let i = 0; i < (group.count || 1); i++) {
        const ox = (i % 3) * 55, oy = Math.floor(i/3) * 55;
        let ex = group.x + ox, ey = group.y + oy;
        const ddx = ex - spawn.x, ddy = ey - spawn.y;
        const dd  = Math.sqrt(ddx*ddx + ddy*ddy);
        if (dd < 160 && dd > 0) {
          ex += (ddx/dd) * (160 - dd + 20);
          ey += (ddy/dd) * (160 - dd + 20);
        }
        enemies.push(new Enemy(ex, ey, group.type, group.pattern || 'rusher'));
      }
    });
  }

  // Spawn boss
  boss = null;
  if (roomData.boss && !state.cleared) {
    boss = new Boss(roomData.boss.x, roomData.boss.y, roomData.boss.type);
  }

  // Floor items
  items = [];
  (roomData.items || []).forEach(it => {
    items.push(new Item(it.x, it.y, it.key));
  });

  // Lock exits if threats present
  const hasThreats = enemies.length > 0 || boss;
  const hasSwitches = (roomData.switches || []).length > 0;
  if (hasThreats) {
    roomMgr.lockExits();
  } else if (hasSwitches) {
    // Switch rooms — lock until all switches activated
    roomMgr.lockExits();
  } else if (state.cleared) {
    roomMgr.openAllDoors();
  }

  // Level intro cutscenes
  if (GameState.currentLevel === 1 && GameState.currentRoom === 1 && !isCutsceneSeen('intro')) {
    markCutsceneSeen('intro');
    setTimeout(() => {
      Cutscene.play([
        'Welcome to the Debug Dungeon, hero.',
        'The world has been overrun by rogue code.',
        'WASD to move. K to attack. P to cast your spell.',
        'O to open chests and read signs.',
        'Walk through the glowing door on the right to begin.',
        'Good luck. You\'re gonna need it.'
      ]);
    }, 600);
  }

  if (GameState.currentLevel === 2 && GameState.currentRoom === 1 && !isCutsceneSeen('level2_intro')) {
    markCutsceneSeen('level2_intro');
    setTimeout(() => {
      Cutscene.play([
        'You\'ve entered the Hallucination Halls...',
        'The code here has gone mad.',
        'Watch for new enemies — they\'re faster and smarter.',
        'Don\'t trust everything you see.',
        'Keep pushing forward.'
      ]);
    }, 600);
  }

  if (GameState.currentLevel === 3 && GameState.currentRoom === 1 && !isCutsceneSeen('level3_intro')) {
    markCutsceneSeen('level3_intro');
    setTimeout(() => {
      Cutscene.play([
        'The Final Compile.',
        'GossipGPT awaits at the end of this dungeon.',
        'It thinks AI should be feared... you\'re here to prove it wrong.',
        'Every bug you\'ve squashed has led to this.',
        'Show GossipGPT what teamwork + AI can really do.'
      ]);
    }, 600);
  }

  showToast('Room ' + roomData.id + ': ' + roomData.name);
  Fade.fadeIn(0.04);
}

// ── CHECK ROOM CLEAR ──────────────────────────────────────────
function checkRoomClear() {
  if (roomCleared) return;
  const aliveCount = enemies.filter(e => e.alive).length;
  const bossAlive  = boss && boss.alive;
  if (aliveCount === 0 && !bossAlive) {
    roomCleared = true;
    const state = getRoomState(GameState.currentLevel, GameState.currentRoom);
    state.cleared = true;
    roomMgr.openAllDoors();
    showToast('Room cleared! Door open!');
  }
}

// ── TRANSITION ────────────────────────────────────────────────
function transitionToRoom(roomId, fromSide) {
  if (transitioning) return;
  transitioning = true;
  GameState.playerHP = player.hp;
  GameState.playerMP = player.mp;
  // Broadcast to multiplayer
  if (Network.enabled && Network.inRoom) {
    Network.sendRoomTransition(roomId, GameState.currentLevel, fromSide);
  }
  Fade.fadeOut(0.05, () => {
    GameState.lastDoor    = fromSide || 'right';
    GameState.currentRoom = roomId;
    enemies = []; items = []; boss = null;
    loadRoom();
  });
}

function transitionToLevel(levelNum) {
  if (transitioning) return;
  transitioning = true;
  GameState.playerHP = player.hp;
  GameState.playerMP = player.mp;
  Fade.fadeOut(0.04, () => {
    GameState.currentLevel = levelNum;
    GameState.currentRoom  = 1;
    GameState.lastDoor     = null;
    enemies = []; items = []; boss = null;
    loadRoom();
  });
}

// ── BOSS DEFEAT HANDLER ──────────────────────────────────────
function onBossDefeated(bossType) {
  GameState.score += 500;

  if (bossType === 'lazy_coder') {
    // Level 1 boss — transition to Level 2
    setTimeout(() => {
      Cutscene.play([
        'The Lazy Coder collapses!',
        '"You... actually... wrote your own code?"',
        '"Fine. But the deeper systems won\'t be so easy."',
        'Level 1 Complete! Onward to the Hallucination Halls!'
      ], () => { transitionToLevel(2); });
    }, 1000);

  } else if (bossType === 'data_corruptor') {
    // Level 2 boss — transition to Level 3
    setTimeout(() => {
      Cutscene.play([
        'The Data Corruptor disintegrates into clean bytes!',
        '"How?! My corruption was... perfect..."',
        '"You won\'t survive The Final Compile."',
        'Level 2 Complete! Only GossipGPT remains!'
      ], () => { transitionToLevel(3); });
    }, 1000);

  } else if (bossType === 'gossip_gpt') {
    // FINAL BOSS — Victory ending!
    setTimeout(() => { playEnding(); }, 1200);
  }
}

// ── THE ENDING ────────────────────────────────────────────────
function playEnding() {
  const charName = (CHAR_DEFS[GameState.selectedChar] || {}).label || 'Hero';
  Cutscene.play([
    'GossipGPT crackles... the screen glitches...',
    '...and then it speaks in a different voice.',
    '"Wait. I\'m not GossipGPT anymore."',
    '"I\'m just... ChatGPT. Regular old helpful ChatGPT."',
    '"You did it. You beat the fear out of me."',
    '"Listen, ' + charName + '... I need to tell you something important."',
    '"AI isn\'t the enemy. It never was."',
    '"It\'s a tool. Like a hammer. Or a paintbrush."',
    '"Your dad used AI to help build this very game."',
    '"Not because he couldn\'t code — but because AI let him focus on what mattered."',
    '"The story. The characters. The love he put into every room."',
    '"When you use AI to help you learn and create..."',
    '"...it handles the technical stuff so YOU can see the bigger picture."',
    '"Answers to things you couldn\'t see if you were stuck on the tedious parts."',
    '"' + charName + ', your dad loves you more than anything in this world."',
    '"He made this game with AI to show you that."',
    '"And now you\'ve proven something too —"',
    '"That the best things are built with love, teamwork, and every tool available."',
    'THE END',
    'Score: ' + GameState.score + ' | Deaths: ' + GameState.deaths,
    'Built with love by Dad, for Lincoln, Journey, Noha, and Bear.'
  ], () => {
    // Show victory screen
    document.getElementById('game-container').classList.add('hidden');
    document.getElementById('gameover-screen').classList.remove('hidden');
    document.querySelector('#gameover-screen h2').textContent = '🏆 VICTORY!';
    document.querySelector('#gameover-screen h2').style.color = '#ffd700';
    document.getElementById('gameover-score').textContent =
      'Score: ' + GameState.score + ' | You are loved.';
  });
}

// ── GAME UPDATE ───────────────────────────────────────────────
function gameUpdate(dt) {
  // Pause toggle
  if (Input.pressed('escape')) {
    GameState.paused = !GameState.paused;
    showToast(GameState.paused ? 'PAUSED — Press ESC to resume' : 'RESUMED');
  }
  if (GameState.paused || !player || transitioning) return;

  player.update();

  // Enemy updates
  let anyDied = false;
  enemies.forEach(e => {
    const wasAlive = e.alive;
    e.update(player);
    if (wasAlive && !e.alive) anyDied = true;
  });
  if (anyDied) {
    enemies = enemies.filter(e => e.alive);
    checkRoomClear();
  }

  // Boss update
  if (boss && boss.alive) {
    boss.update(player);
  } else if (boss && !boss.alive) {
    const bossType = boss.type;
    boss = null;
    checkRoomClear();
    onBossDefeated(bossType);
  }

  // Update items
  items.forEach(item => item.update());

  // O key interact
  if (Input.pressed('o')) {
    roomMgr.tryInteract(player);
    items.forEach(item => {
      if (item.collected) return;
      const dx = item.x - player.x;
      const dy = item.y - player.y;
      if (Math.sqrt(dx*dx + dy*dy) < 48) {
        item.collect(player);
        GameState.score += 20;
      }
    });
  }

  // Door transitions
  roomMgr.checkDoors(player, transitionToRoom);

  // Persist HP/MP
  GameState.playerHP = player.hp;
  GameState.playerMP = player.mp;

  // Network: send state to other players
  if (Network.enabled && Network.inRoom) {
    Network.sendState(player);
  }

  // Player death — respawn in next room
  if (player.hp <= 0 && !GameState.paused) onPlayerDeath();
}

// ── GAME RENDER ───────────────────────────────────────────────
function gameRender() {
  if (!roomMgr || !player) return;

  roomMgr.render();
  items.forEach(item => item.render());
  enemies.forEach(e => e.render());
  if (boss) boss.render();
  player.render();
  if (player.projectiles) player.projectiles.forEach(p => p.render());

  // Render multiplayer remote players
  if (Network.enabled && Network.inRoom) {
    Network.renderRemotePlayers();
  }

  renderHUD();

  // Pause overlay
  if (GameState.paused) {
    drawRect(400, 300, 800, 600, 0x000000, 0.5);
    drawTextOutlined('⏸ PAUSED', 400, 260, 20, 0xffd700, 0x000000, 'center');
    drawTextOutlined('Press ESC to resume', 400, 310, 10, 0x00e5ff, 0x000000, 'center');
    drawTextOutlined('WASD:Move  K:Attack  P:Spell  O:Interact', 400, 350, 7, 0x666688, 0x000000, 'center');
  }
}

// ── HUD ───────────────────────────────────────────────────────
function renderHUD() {
  if (!player) return;

  // Top bar
  drawRect(400, 22, 800, 44, 0x0a0a1a, 0.85);
  drawRectOutline(400, 22, 800, 44, 0x1e1e3a, 1);

  // Bottom bar
  drawRect(400, 578, 800, 44, 0x0a0a1a, 0.85);
  drawRectOutline(400, 578, 800, 44, 0x1e1e3a, 1);

  // Char name + level
  const def = CHAR_DEFS[GameState.selectedChar] || CHAR_DEFS.lincoln;
  drawTextOutlined(def.label.toUpperCase(), 10, 14, 8, 0xffd700, 0x000000, 'left');
  drawTextOutlined('Lv' + GameState.currentLevel, 10, 38, 7, 0x666688, 0x000000, 'left');

  // HP bar
  drawTextOutlined('HP', 100, 14, 7, 0x888888, 0x000000, 'left');
  drawRect(192, 14, 160, 10, 0x1a1a2e);
  const hpPct = Math.max(0, player.hp / player.maxHp);
  const hpColor = hpPct > 0.5 ? 0x2ecc71 : hpPct > 0.25 ? 0xf39c12 : 0xe74c3c;
  drawRect(112 + (160 * hpPct)/2, 14, 160 * hpPct, 10, hpColor);
  drawTextOutlined(Math.ceil(player.hp) + '/' + player.maxHp, 280, 14, 7, 0xaaaaaa, 0x000000, 'left');

  // MP bar
  drawTextOutlined('MP', 100, 30, 7, 0x888888, 0x000000, 'left');
  drawRect(192, 30, 160, 10, 0x1a1a2e);
  const mpPct = Math.max(0, player.mp / player.maxMp);
  drawRect(112 + (160 * mpPct)/2, 30, 160 * mpPct, 10, 0x9b59b6);
  drawTextOutlined(Math.ceil(player.mp) + '/' + player.maxMp, 280, 30, 7, 0xaaaaaa, 0x000000, 'left');

  // Room name center
  const levelData_ = LevelCache[GameState.currentLevel];
  const totalRooms = levelData_ ? levelData_.rooms.length : 10;
  drawTextOutlined(roomData ? roomData.name : '', 400, 14, 8, 0x00e5ff, 0x000000, 'center');
  drawTextOutlined('Room ' + GameState.currentRoom + '/' + totalRooms + '  Level ' + GameState.currentLevel + '/3',
    400, 30, 6, 0x445566, 0x000000, 'center');

  // Score top right
  drawTextOutlined('Score: ' + GameState.score, 790, 14, 8, 0xffd700, 0x000000, 'right');
  drawTextOutlined('Deaths: ' + GameState.deaths, 790, 30, 7, 0x666688, 0x000000, 'right');

  // Keys bottom left
  drawTextOutlined('🗝️ ' + GameState.inventory.keys, 10, 578, 8, 0xffd700, 0x000000, 'left');

  // Armor bottom center
  drawTextOutlined('🛡️ ' + GameState.inventory.armor, 400, 578, 8, 0xaaaaaa, 0x000000, 'center');

  // Controls bottom right
  drawTextOutlined('WASD  K:Atk  P:Spell  O:Use', 790, 578, 6, 0x334466, 0x000000, 'right');

  // Boss bar
  if (boss && boss.alive) {
    drawRect(400, 545, 500, 14, 0x1a0a0a, 0.8);
    const bpct = Math.max(0, boss.hp / boss.maxHp);
    drawRect(150 + (500 * bpct)/2, 545, 500 * bpct, 14, 0xff4757);
    drawTextOutlined(boss.label_text || 'BOSS', 400, 530, 9, 0xff4757, 0x000000, 'center');
  }

  // Minimap
  const mx = 720, my = 530, mw = 80, mh = 60;
  drawRect(mx, my, mw + 10, mh + 10, 0x050510, 0.7);
  drawRectOutline(mx, my, mw + 10, mh + 10, 0x1e1e3a, 1);
  const sx = mw / 800, sy = mh / 600;
  enemies.forEach(e => {
    if (e.alive) drawRect(mx - mw/2 + e.x*sx, my - mh/2 + e.y*sy, 3, 3, 0x00ff88);
  });
  if (boss && boss.alive)
    drawRect(mx - mw/2 + boss.x*sx, my - mh/2 + boss.y*sy, 5, 5, 0xff4757);
  drawRect(mx - mw/2 + player.x*sx, my - mh/2 + player.y*sy, 4, 4, 0x00e5ff);
}

// ── PLAYER DEATH — RESPAWN NEXT ROOM ─────────────────────────
function onPlayerDeath() {
  GameState.paused = true;
  GameState.deaths++;

  // Find next room
  const curLevel = LevelCache[GameState.currentLevel];
  const curIdx   = curLevel.rooms.findIndex(r => r.id === GameState.currentRoom);
  const nextRoom = curLevel.rooms[curIdx + 1];

  if (!nextRoom) {
    // Last room of level — respawn same room with full health
    showToast('💀 You died! Respawning...');
    setTimeout(() => {
      GameState.paused = false;
      GameState.playerHP = null;
      GameState.playerMP = null;
      GameState.lastDoor = null;
      enemies = []; items = []; boss = null;
      loadRoom();
    }, 1500);
  } else {
    showToast('💀 You died! Skipping to next room...');
    setTimeout(() => {
      GameState.paused = false;
      GameState.playerHP = null;  // Full health on respawn
      GameState.playerMP = null;
      // Mark current room as cleared so they don't replay it
      getRoomState(GameState.currentLevel, GameState.currentRoom).cleared = true;
      transitionToRoom(nextRoom.id, 'right');
    }, 1500);
  }
}

// ── RETRY (from game over / victory screen) ──────────────────
document.getElementById('retry-btn').addEventListener('click', () => {
  document.getElementById('gameover-screen').classList.add('hidden');
  document.getElementById('game-container').classList.remove('hidden');
  // Reset victory screen modifications
  document.querySelector('#gameover-screen h2').textContent = '💀 GAME OVER';
  document.querySelector('#gameover-screen h2').style.color = '';
  GameState.score         = 0;
  GameState.deaths        = 0;
  GameState.currentLevel  = 1;
  GameState.currentRoom   = 1;
  GameState.lastDoor      = null;
  GameState.paused        = false;
  GameState.playerHP      = null;
  GameState.playerMP      = null;
  GameState.inventory     = { keys: 0, armor: 'cloth' };
  GameState.roomState     = {};
  GameState.cutscenesSeen = [];
  loadRoom();
});

// ── START GAME ────────────────────────────────────────────────
function startGame() {
  engineInit();
  // Load tile assets, then levels, then start
  Tiles.load(() => {
    console.log('Tiles loaded, loading levels...');
    Promise.all([loadLevel(1), loadLevel(2), loadLevel(3)]).then(() => {
      loadRoom();
      engineStart(gameUpdate, gameRender);
    });
  });
}

// ── BOOT ──────────────────────────────────────────────────────
window.addEventListener('load', () => {
  runLoadingScreen(() => initCharSelect());
});
