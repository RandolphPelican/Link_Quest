// ============================================================
// main.js — Link Quest core, custom engine, no dependencies
// ============================================================

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
  cutscenesSeen:  []
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
    this.showLine();
  },
  showLine() {
    const el = document.getElementById('cutscene-text');
    el.textContent = '';
    const line = this.lines[this.index];
    let i = 0;
    const iv = setInterval(() => {
      el.textContent += line[i++];
      if (i >= line.length) clearInterval(iv);
    }, 28);
  },
  next() {
    this.index++;
    if (this.index >= this.lines.length) {
      document.getElementById('cutscene-overlay').classList.add('hidden');
      if (this.onDone) this.onDone();
    } else { this.showLine(); }
  }
};

document.getElementById('cutscene-next')
  .addEventListener('click', () => Cutscene.next());

// ── LOADING SCREEN ────────────────────────────────────────────
function runLoadingScreen(onDone) {
  const bar  = document.getElementById('loading-bar');
  const tip  = document.getElementById('loading-tip');
  const tips = ['Loading assets...','Spawning goblins...',
    'Charging fireballs...',"Polishing Dad's club...",
    'Hiding GossipGPT...','Almost ready...'];
  let pct = 0, tipIdx = 0;
  const iv = setInterval(() => {
    pct += Math.random() * 18 + 5;
    if (pct > 100) pct = 100;
    bar.style.width = pct + '%';
    tip.textContent = tips[Math.min(tipIdx++, tips.length - 1)];
    if (pct >= 100) { clearInterval(iv); setTimeout(onDone, 400); }
  }, 300);
}

// ── CHAR SELECT ───────────────────────────────────────────────
function initCharSelect() {
  document.getElementById('loading-screen').classList.add('hidden');
  document.getElementById('char-select-screen').classList.remove('hidden');
  const cards = document.querySelectorAll('.char-card');
  const btn   = document.getElementById('start-btn');
  cards.forEach(card => {
    card.addEventListener('click', () => {
      cards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      GameState.selectedChar = card.dataset.char;
      btn.textContent = 'Play as ' + card.dataset.char.toUpperCase();
      btn.classList.add('ready');
      btn.disabled = false;
    });
  });
  btn.addEventListener('click', () => {
    if (!GameState.selectedChar) return;
    document.getElementById('char-select-screen').classList.add('hidden');
    document.getElementById('game-container').classList.remove('hidden');
    startGame();
  });
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
  if (!levelData) { console.error('No level data'); return; }

  roomData = levelData.rooms.find(r => r.id === GameState.currentRoom);
  if (!roomData) { console.error('Room not found:', GameState.currentRoom); return; }

  // Init room manager
  roomMgr = new RoomManager(roomData);

  // Spawn player
  const spawn = getSpawnPosition(GameState.lastDoor);
  player = new Player(spawn.x, spawn.y, GameState.selectedChar);
  if (GameState.playerHP !== null) player.hp = GameState.playerHP;
  if (GameState.playerMP !== null) player.mp = GameState.playerMP;

  // Spawn enemies
  enemies = [];
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

  // Spawn boss
  boss = null;
  if (roomData.boss) {
    boss = new Boss(roomData.boss.x, roomData.boss.y, roomData.boss.type);
  }

  // Floor items
  items = [];
  (roomData.items || []).forEach(it => {
    items.push(new Item(it.x, it.y, it.key));
  });

  // Lock exits if threats present
  const hasThreats = (roomData.enemies && roomData.enemies.length > 0) || roomData.boss;
  if (hasThreats) roomMgr.lockExits();

  // Opening cutscene
  if (GameState.currentLevel === 1 && GameState.currentRoom === 1 && !isCutsceneSeen('intro')) {
    markCutsceneSeen('intro');
    setTimeout(() => {
      Cutscene.play([
        'Welcome to the Debug Dungeon.',
        'No enemies in this room.',
        'WASD to move. F to open chests and read signs.',
        'SPACE attacks. E casts your spell.',
        'Walk through the glowing door on the right.',
        'Good luck.'
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
    roomMgr.openAllDoors();
    showToast('Room cleared! Door open!');
  }
}

// ── TRANSITION ────────────────────────────────────────────────
function transitionToRoom(roomId, fromSide) {
  if (transitioning) return;
  transitioning = true;
  const opp = { right:'right', left:'left', top:'top', bottom:'bottom' };
  Fade.fadeOut(0.05, () => {
    GameState.lastDoor    = opp[fromSide] || 'right';
    GameState.currentRoom = roomId;
    enemies = []; items = []; boss = null;
    loadRoom();
  });
}

// ── GAME UPDATE ───────────────────────────────────────────────
function gameUpdate(dt) {
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
    GameState.score += 500;
    checkRoomClear();
    boss = null;
  }

  // Update items
  items.forEach(item => item.update());

  // Update items
  items.forEach(item => item.update());

  // F key interact
  if (Input.pressed('f')) {
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

  // Player death
  if (player.hp <= 0 && !GameState.paused) onPlayerDeath();
}

// ── GAME RENDER ───────────────────────────────────────────────
function gameRender() {
  if (!roomMgr || !player) return;

  // Room
  roomMgr.render();

  // Items
  items.forEach(item => item.render());

  // Enemies
  enemies.forEach(e => e.render());

  // Boss
  if (boss) boss.render();

  // Player
  player.render();

  // Projectiles
  if (player.projectiles) player.projectiles.forEach(p => p.render());

  // HUD
  renderHUD();
}

// ── HUD ───────────────────────────────────────────────────────
function renderHUD() {
  if (!player) return;

  // Top bar background
  drawRect(400, 22, 800, 44, 0x0a0a1a);
  drawRectOutline(400, 22, 800, 44, 0x1e1e3a, 1);

  // Bottom bar background
  drawRect(400, 578, 800, 44, 0x0a0a1a);
  drawRectOutline(400, 578, 800, 44, 0x1e1e3a, 1);

  // Char name
  drawTextOutlined(
    player.characterKey.toUpperCase(),
    10, 14, 8, 0xffd700, 0x000000, 'left'
  );

  // HP bar
  drawTextOutlined('HP', 10, 28, 7, 0x888888, 0x000000, 'left');
  drawRect(92, 28, 160, 10, 0x1a1a2e);
  const hpPct = Math.max(0, player.hp / player.maxHp);
  const hpColor = hpPct > 0.5 ? 0x2ecc71 : hpPct > 0.25 ? 0xf39c12 : 0xe74c3c;
  drawRect(12 + (160 * hpPct)/2, 28, 160 * hpPct, 10, hpColor);
  drawTextOutlined(
    Math.ceil(player.hp) + '/' + player.maxHp,
    178, 28, 7, 0xaaaaaa, 0x000000, 'left'
  );

  // MP bar
  drawTextOutlined('MP', 10, 40, 7, 0x888888, 0x000000, 'left');
  drawRect(92, 40, 160, 10, 0x1a1a2e);
  const mpPct = Math.max(0, player.mp / player.maxMp);
  drawRect(12 + (160 * mpPct)/2, 40, 160 * mpPct, 10, 0x9b59b6);
  drawTextOutlined(
    Math.ceil(player.mp) + '/' + player.maxMp,
    178, 40, 7, 0xaaaaaa, 0x000000, 'left'
  );

  // Room name center
  drawTextOutlined(
    roomData ? roomData.name : '',
    400, 22, 8, 0x00e5ff, 0x000000, 'center'
  );

  // Score top right
  drawTextOutlined(
    'Score: ' + GameState.score,
    790, 22, 8, 0xffd700, 0x000000, 'right'
  );

  // Keys bottom left
  drawTextOutlined(
    'Keys: ' + GameState.inventory.keys,
    10, 578, 8, 0xffd700, 0x000000, 'left'
  );

  // Armor bottom center
  drawTextOutlined(
    'Armor: ' + GameState.inventory.armor,
    400, 578, 8, 0xaaaaaa, 0x000000, 'center'
  );

  // Controls bottom right
  drawTextOutlined(
    'WASD  SPACE:Atk  E:Spell  F:Use',
    790, 578, 6, 0x334466, 0x000000, 'right'
  );

  // Boss bar
  if (boss && boss.alive) {
    drawRect(400, 545, 500, 14, 0x1a0a0a);
    const bpct = Math.max(0, boss.hp / boss.maxHp);
    drawRect(150 + (500 * bpct)/2, 545, 500 * bpct, 14, 0xff4757);
    drawTextOutlined(
      boss.label_text || 'BOSS',
      400, 530, 9, 0xff4757, 0x000000, 'center'
    );
  }

  // Minimap
  const mx = 720, my = 530, mw = 80, mh = 60;
  drawRect(mx, my, mw + 10, mh + 10, 0x050510);
  drawRectOutline(mx, my, mw + 10, mh + 10, 0x1e1e3a, 1);
  const sx = mw / 800, sy = mh / 600;
  enemies.forEach(e => {
    if (e.alive) drawRect(mx - mw/2 + e.x*sx, my - mh/2 + e.y*sy, 3, 3, 0x00ff88);
  });
  if (boss && boss.alive)
    drawRect(mx - mw/2 + boss.x*sx, my - mh/2 + boss.y*sy, 5, 5, 0xff4757);
  drawRect(mx - mw/2 + player.x*sx, my - mh/2 + player.y*sy, 4, 4, 0x00e5ff);
}

// ── PLAYER DEATH ──────────────────────────────────────────────
function onPlayerDeath() {
  GameState.paused = true;
  showToast('YOU DIED');
  setTimeout(() => {
    document.getElementById('gameover-screen').classList.remove('hidden');
    document.getElementById('gameover-score').textContent =
      'Score: ' + GameState.score;
  }, 1200);
}

// ── RETRY ─────────────────────────────────────────────────────
document.getElementById('retry-btn').addEventListener('click', () => {
  document.getElementById('gameover-screen').classList.add('hidden');
  GameState.score         = 0;
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
  Promise.all([loadLevel(1), loadLevel(2), loadLevel(3)]).then(() => {
    loadRoom();
    engineStart(gameUpdate, gameRender);
  });
}

// ── BOOT ──────────────────────────────────────────────────────
window.addEventListener('load', () => {
  runLoadingScreen(() => initCharSelect());
});
