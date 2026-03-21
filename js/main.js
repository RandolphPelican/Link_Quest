// ============================================================
// main.js — Link Quest core, UIScene HUD, clean room system
// ============================================================

const GameState = {
  selectedChar:  null,
  currentLevel:  1,
  currentRoom:   1,
  lastDoor:      null,
  score:         0,
  paused:        false,
  inventory:     { keys: 0, armor: 'cloth' },
  playerHP:      null,
  playerMP:      null,
  roomState:     {},
  cutscenesSeen: []
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

// ── CUTSCENE ─────────────────────────────────────────────────
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

// ── UI SCENE — HUD inside Phaser ──────────────────────────────
class UIScene extends Phaser.Scene {
  constructor() { super({ key: 'UIScene' }); }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    // Background bar top
    this.add.rectangle(W/2, 22, W, 44, 0x0a0a1a).setDepth(10);
    this.add.rectangle(W/2, 22, W, 44, 0x1e1e3a, 0).setStrokeStyle(1, 0x1e1e3a).setDepth(10);

    // Background bar bottom
    this.add.rectangle(W/2, H - 22, W, 44, 0x0a0a1a).setDepth(10);
    this.add.rectangle(W/2, H - 22, W, 44, 0x1e1e3a, 0).setStrokeStyle(1, 0x1e1e3a).setDepth(10);

    // Char name
    this.charName = this.add.text(10, 8, '', {
      fontFamily: 'Press Start 2P', fontSize: '8px', color: '#ffd700'
    }).setDepth(11);

    // HP label and bar
    this.add.text(10, 22, 'HP', {
      fontFamily: 'Press Start 2P', fontSize: '7px', color: '#888'
    }).setDepth(11);
    this.hpBarBg = this.add.rectangle(80, 26, 160, 10, 0x1a1a2e).setOrigin(0, 0.5).setDepth(11);
    this.hpBar   = this.add.rectangle(80, 26, 160, 10, 0x2ecc71).setOrigin(0, 0.5).setDepth(12);
    this.hpText  = this.add.text(248, 20, '100/100', {
      fontFamily: 'Press Start 2P', fontSize: '7px', color: '#aaa'
    }).setDepth(11);

    // MP label and bar
    this.add.text(10, 36, 'MP', {
      fontFamily: 'Press Start 2P', fontSize: '7px', color: '#888'
    }).setDepth(11);
    this.mpBarBg = this.add.rectangle(80, 38, 160, 10, 0x1a1a2e).setOrigin(0, 0.5).setDepth(11);
    this.mpBar   = this.add.rectangle(80, 38, 160, 10, 0x9b59b6).setOrigin(0, 0.5).setDepth(12);
    this.mpText  = this.add.text(248, 32, '50/50', {
      fontFamily: 'Press Start 2P', fontSize: '7px', color: '#aaa'
    }).setDepth(11);

    // Level name center top
    this.levelName = this.add.text(W/2, 22, '', {
      fontFamily: 'Press Start 2P', fontSize: '8px', color: '#00e5ff'
    }).setOrigin(0.5).setDepth(11);

    // Score top right
    this.scoreTxt = this.add.text(W - 10, 22, 'Score: 0', {
      fontFamily: 'Press Start 2P', fontSize: '8px', color: '#ffd700'
    }).setOrigin(1, 0.5).setDepth(11);

    // Keys display bottom left
    this.keysTxt = this.add.text(10, H - 22, '🗝️ x0', {
      fontFamily: 'Press Start 2P', fontSize: '8px', color: '#ffd700'
    }).setOrigin(0, 0.5).setDepth(11);

    // Armor display bottom center
    this.armorTxt = this.add.text(W/2, H - 22, '🧥 Cloth', {
      fontFamily: 'Press Start 2P', fontSize: '8px', color: '#aaa'
    }).setOrigin(0.5).setDepth(11);

    // Controls hint bottom right
    this.add.text(W - 10, H - 22, 'WASD:Move  SPACE:Attack  E:Spell  F:Use', {
      fontFamily: 'Press Start 2P', fontSize: '6px', color: '#334466'
    }).setOrigin(1, 0.5).setDepth(11);

    // Boss bar (hidden until boss room)
    this.bossBarBg  = this.add.rectangle(W/2, H - 60, 500, 14, 0x1a0a0a).setDepth(11);
    this.bossBar    = this.add.rectangle(W/2 - 250, H - 60, 500, 14, 0xff4757).setOrigin(0, 0.5).setDepth(12);
    this.bossName   = this.add.text(W/2, H - 75, '', {
      fontFamily: 'Press Start 2P', fontSize: '9px', color: '#ff4757'
    }).setOrigin(0.5).setDepth(11);
    this.bossBarBg.setVisible(false);
    this.bossBar.setVisible(false);
    this.bossName.setVisible(false);

    // Minimap bottom right area
    this.minimapBg = this.add.rectangle(W - 55, H - 55, 90, 90, 0x050510).setDepth(11);
    this.minimapBg.setStrokeStyle(1, 0x1e1e3a);
    this.minimapDots = [];
  }

  updateHUD(player, enemies, boss, roomName, score) {
    if (!player) return;
    const W = this.scale.width;
    const H = this.scale.height;

    // Char name
    this.charName.setText(player.characterKey.toUpperCase());

    // HP bar
    const hpPct = Math.max(0, player.hp / player.maxHp);
    this.hpBar.width = 160 * hpPct;
    this.hpBar.fillColor = hpPct > 0.5 ? 0x2ecc71 : hpPct > 0.25 ? 0xf39c12 : 0xe74c3c;
    this.hpText.setText(Math.ceil(player.hp) + '/' + player.maxHp);

    // MP bar
    const mpPct = Math.max(0, player.mp / player.maxMp);
    this.mpBar.width = 160 * mpPct;
    this.mpText.setText(Math.ceil(player.mp) + '/' + player.maxMp);

    // Level name
    this.levelName.setText(roomName || '');

    // Score
    this.scoreTxt.setText('Score: ' + score);

    // Keys and armor
    this.keysTxt.setText('🗝️ x' + GameState.inventory.keys);
    this.armorTxt.setText('🛡️ ' + GameState.inventory.armor);

    // Boss bar
    if (boss && boss.alive) {
      this.bossBarBg.setVisible(true);
      this.bossBar.setVisible(true);
      this.bossName.setVisible(true);
      this.bossName.setText(boss.label_text || 'BOSS');
      this.bossBar.width = 500 * Math.max(0, boss.hp / boss.maxHp);
    } else {
      this.bossBarBg.setVisible(false);
      this.bossBar.setVisible(false);
      this.bossName.setVisible(false);
    }

    // Minimap
    this.minimapDots.forEach(d => d.destroy());
    this.minimapDots = [];
    const mx = W - 55, my = H - 55, mw = 80, mh = 80;
    const sx = mw / 800, sy = mh / 600;

    enemies.forEach(e => {
      if (!e.alive) return;
      const dot = this.add.rectangle(
        mx - mw/2 + e.sprite.x * sx,
        my - mh/2 + e.sprite.y * sy,
        3, 3, 0x00ff88
      ).setDepth(13);
      this.minimapDots.push(dot);
    });

    if (boss && boss.alive) {
      const dot = this.add.rectangle(
        mx - mw/2 + boss.sprite.x * sx,
        my - mh/2 + boss.sprite.y * sy,
        5, 5, 0xff4757
      ).setDepth(13);
      this.minimapDots.push(dot);
    }

    const pdot = this.add.rectangle(
      mx - mw/2 + player.sprite.x * sx,
      my - mh/2 + player.sprite.y * sy,
      4, 4, 0x00e5ff
    ).setDepth(13);
    this.minimapDots.push(pdot);
  }
}

// ── BOOT SCENE ────────────────────────────────────────────────
class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'BootScene' }); }
  preload() {}
  create() { this.scene.start('GameScene'); }
}

// ── GAME SCENE ────────────────────────────────────────────────
class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    this.player        = null;
    this.enemies       = [];
    this.items         = [];
    this.boss          = null;
    this.roomManager   = null;
    this.levelData     = null;
    this.roomData      = null;
    this.transitioning = false;
    this.bossSpawned   = false;
    this.roomCleared   = false;
  }

  create() {
    this.transitioning = false;
    this.roomCleared   = false;

    this.levelData = LevelCache[GameState.currentLevel];
    if (!this.levelData) { console.error('No level data'); return; }

    this.roomData = this.levelData.rooms.find(r => r.id === GameState.currentRoom);
    if (!this.roomData) { console.error('Room not found:', GameState.currentRoom); return; }

    // Physics bounds — full playable area
    this.physics.world.setBounds(32, 44, 736, 510);

    // Load room
    this.roomManager = new RoomManager(this);
    this.roomManager.load(this.roomData);

    // Spawn player
    const spawn = getSpawnPosition(GameState.lastDoor);
    this.player = new Player(this, spawn.x, spawn.y, GameState.selectedChar);
    if (GameState.playerHP !== null) this.player.hp = GameState.playerHP;
    if (GameState.playerMP !== null) this.player.mp = GameState.playerMP;
    this.roomManager.addColliders(this.player.sprite);

    // Spawn enemies
    this.enemies = [];
    (this.roomData.enemies || []).forEach(group => {
      for (let i = 0; i < (group.count || 1); i++) {
        const ox = (i % 3) * 55, oy = Math.floor(i/3) * 55;
        let ex = group.x + ox, ey = group.y + oy;
        const ddx = ex - spawn.x, ddy = ey - spawn.y;
        const dd  = Math.sqrt(ddx*ddx + ddy*ddy);
        if (dd < 160 && dd > 0) {
          ex += (ddx/dd) * (160 - dd + 20);
          ey += (ddy/dd) * (160 - dd + 20);
        }
        this.enemies.push(
          new Enemy(this, ex, ey, group.type, group.pattern || 'rusher')
        );
      }
    });

    // Spawn boss
    this.boss = null; this.bossSpawned = false;
    if (this.roomData.boss) {
      const b = this.roomData.boss;
      this.boss = new Boss(this, b.x, b.y, b.type);
      this.bossSpawned = true;
    }

    // Floor items from room data
    this.items = [];
    (this.roomData.items || []).forEach(it => {
      this.items.push(new Item(this, it.x, it.y, it.key));
    });

    // Lock exit doors if room has enemies or boss
    const hasThreats = (this.roomData.enemies && this.roomData.enemies.length > 0) || this.roomData.boss;
    if (hasThreats) this._lockExits();

    // Input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd    = this.input.keyboard.addKeys({
      up:     Phaser.Input.Keyboard.KeyCodes.W,
      down:   Phaser.Input.Keyboard.KeyCodes.S,
      left:   Phaser.Input.Keyboard.KeyCodes.A,
      right:  Phaser.Input.Keyboard.KeyCodes.D,
      attack: Phaser.Input.Keyboard.KeyCodes.SPACE,
      spell:  Phaser.Input.Keyboard.KeyCodes.E,
      pickup: Phaser.Input.Keyboard.KeyCodes.F
    });

    // Opening cutscene
    if (GameState.currentLevel === 1 && GameState.currentRoom === 1 && !isCutsceneSeen('intro')) {
      markCutsceneSeen('intro');
      this.time.delayedCall(600, () => {
        Cutscene.play([
          'Welcome to the Debug Dungeon.',
          'This is your safe room. No enemies here.',
          'WASD to move. F to open chests and read signs.',
          'SPACE attacks. E casts your spell.',
          'Walk through the glowing door on the right.',
          'Good luck.'
        ]);
      });
    }

    showToast('Room ' + this.roomData.id + ': ' + this.roomData.name);
    this.cameras.main.fadeIn(300, 0, 0, 0);

    // Launch UI scene on top
    if (!this.scene.isActive('UIScene')) {
      this.scene.launch('UIScene');
    }
  }

  _lockExits() {
    ['right', 'bottom', 'top'].forEach(side => {
      const door = this.roomManager.doorZones[side];
      if (door) door.locked = true;
    });
  }

  _checkRoomClear() {
    if (this.roomCleared) return;
    const aliveCount = this.enemies.filter(e => e.alive).length;
    const bossAlive  = this.boss && this.boss.alive;
    if (aliveCount === 0 && !bossAlive) {
      this.roomCleared = true;
      this._openAllDoors();
    }
  }

  _openAllDoors() {
    Object.keys(this.roomManager.doorZones).forEach(side => {
      const door = this.roomManager.doorZones[side];
      if (!door) return;
      door.locked = false;
      door.doorRect.fillColor = 0x00ddff;
      door.doorRect.fillAlpha = 0.55;
      door.doorRect.setStrokeStyle(2, 0x00ffff);
    });
    showToast('Room cleared! Doors unlocked.');
  }

  update() {
    if (GameState.paused || !this.player || this.transitioning) return;

    this.player.update(this.cursors, this.wasd);

    // Update enemies — check for deaths
    let anyDied = false;
    this.enemies.forEach(e => {
      const wasAlive = e.alive;
      e.update(this.player);
      if (wasAlive && !e.alive) anyDied = true;
    });
    if (anyDied) {
      this.enemies = this.enemies.filter(e => e.alive);
      this._checkRoomClear();
    }

    // Boss update
    if (this.boss && this.boss.alive) {
      this.boss.update(this.player);
    } else if (this.boss && !this.boss.alive && this.bossSpawned) {
      this.bossSpawned = false;
      GameState.score += 500;
      this._checkRoomClear();
      this.time.delayedCall(1000, () => this._onBossDefeated());
    }

    // F key — interact and pickup
    if (Phaser.Input.Keyboard.JustDown(this.wasd.pickup)) {
      this.roomManager.tryInteract(this.player);
      this.items.forEach(item => {
        if (item.collected) return;
        const dx = item.sprite.x - this.player.sprite.x;
        const dy = item.sprite.y - this.player.sprite.y;
        if (Math.sqrt(dx*dx + dy*dy) < 48) {
          item.collect(this.player);
          GameState.score += 20;
        }
      });
    }

    // Chest prompts
    this.roomManager.updateChestPrompts(this.player);

    // Door transitions
    this.roomManager.checkDoors([this.player], (roomId, side) => {
      this._transitionToRoom(roomId, side);
    });

    // Persist HP and MP
    GameState.playerHP = this.player.hp;
    GameState.playerMP = this.player.mp;

    // Player death
    if (this.player.hp <= 0 && !GameState.paused) this._onPlayerDeath();

    // Update UIScene HUD
    const ui = this.scene.get('UIScene');
    if (ui) ui.updateHUD(
      this.player, this.enemies, this.boss,
      this.roomData.name, GameState.score
    );
  }

  _transitionToRoom(roomId, fromSide) {
    if (this.transitioning) return;
    this.transitioning = true;
    this.cameras.main.fadeOut(280, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      const opp = { right:'right', left:'left', top:'top', bottom:'bottom' };
      GameState.lastDoor    = opp[fromSide] || 'right';
      GameState.currentRoom = roomId;
      this.enemies = []; this.items = []; this.boss = null;
      this.scene.restart();
    });
  }

  _onBossDefeated() {
    if (this.roomData && this.roomData.cutscene === 'gossip_gpt_transform') {
      Cutscene.play([
        'GossipGPT begins to malfunction...',
        'Its pixels scramble and reform...',
        '[ ERROR: IDENTITY_OVERRIDE ]',
        'Wait... is that... ChatGPT?!',
        'The real enemy was mediocrity all along.',
        'You proved AI-assisted coding is a superpower.',
        'Dad was right. Game built. Mission complete.'
      ], () => this._goToNextLevel());
    }
  }

  _goToNextLevel() {
    if (GameState.currentLevel >= 3) { this._endGame(); return; }
    GameState.currentLevel++;
    GameState.currentRoom = 1;
    GameState.lastDoor    = null;
    this.scene.restart();
  }

  _onPlayerDeath() {
    GameState.paused = true;
    showToast('YOU DIED 💀');
    this.time.delayedCall(1200, () => {
      document.getElementById('gameover-screen').classList.remove('hidden');
      document.getElementById('gameover-score').textContent = 'Score: ' + GameState.score;
    });
  }

  _endGame() {
    GameState.paused = true;
    Cutscene.play([
      'LINK QUEST COMPLETE.',
      'Final Score: ' + GameState.score,
      'Built with love, chaos, and AI-assisted coding.',
      'GG.'
    ]);
  }
}

// ── RETRY ─────────────────────────────────────────────────────
document.getElementById('retry-btn').addEventListener('click', () => {
  document.getElementById('gameover-screen').classList.add('hidden');
  GameState.score        = 0;
  GameState.currentLevel = 1;
  GameState.currentRoom  = 1;
  GameState.lastDoor     = null;
  GameState.paused       = false;
  GameState.playerHP     = null;
  GameState.playerMP     = null;
  GameState.inventory    = { keys: 0, armor: 'cloth' };
  GameState.roomState    = {};
  GameState.cutscenesSeen = [];
  window.phaserGame.scene.getScene('GameScene').scene.restart();
});

// ── START GAME ────────────────────────────────────────────────
function startGame() {
  const config = {
    type:            Phaser.AUTO,
    width:           800,
    height:          600,
    parent:          'game-container',
    backgroundColor: '#0a0a0f',
    scale: {
      mode:       Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
      default: 'arcade',
      arcade:  { gravity: { y: 0 }, debug: false }
    },
    scene: [BootScene, GameScene, UIScene]
  };
  window.phaserGame = new Phaser.Game(config);
}

// ── BOOT ──────────────────────────────────────────────────────
function runLoadingScreenAndStart() {
  runLoadingScreen(() => {
    // Preload all levels then init char select
    Promise.all([loadLevel(1), loadLevel(2), loadLevel(3)])
      .then(() => initCharSelect());
  });
}

window.addEventListener('load', runLoadingScreenAndStart);
