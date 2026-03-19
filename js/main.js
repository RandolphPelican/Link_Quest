// ============================================================
// main.js — Core game loop, room system, scene management
// ============================================================

const GameState = {
  selectedChar:  null,
  currentLevel:  1,
  currentRoom:   1,
  lastDoor:      null,
  score:         0,
  paused:        false,
  inventory: { keys: 0, armor: 'cloth' }
};

function showToast(msg, duration = 2200) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), duration);
}

function updateHPBar(current, max) {
  const pct = Math.max(0, (current / max)) * 100;
  const bar = document.getElementById('hp-bar');
  bar.style.width = pct + '%';
  bar.style.background = pct > 50 ? 'var(--green)' : pct > 25 ? 'var(--orange)' : 'var(--red)';
  document.getElementById('hp-text').textContent = Math.ceil(current) + '/' + max;
}

function updateMPBar(current, max) {
  const pct = Math.max(0, (current / max)) * 100;
  document.getElementById('mp-bar').style.width = pct + '%';
  document.getElementById('mp-text').textContent = Math.ceil(current) + '/' + max;
}

function updateBossBar(current, max) {
  document.getElementById('boss-hp-bar').style.width = (Math.max(0, current/max)*100) + '%';
}

function showBossHUD(name) {
  document.getElementById('boss-name').textContent = name.toUpperCase();
  document.getElementById('boss-hud').classList.remove('hidden');
}

function hideBossHUD() {
  document.getElementById('boss-hud').classList.add('hidden');
}

function updateScore(val) {
  GameState.score += val;
  document.getElementById('hud-score').textContent = 'Score: ' + GameState.score;
}

function setLevelDisplay(num, name) {
  document.getElementById('hud-level').textContent = 'LEVEL ' + num;
  document.getElementById('hud-level-name').textContent = name;
}

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

document.getElementById('cutscene-next').addEventListener('click', () => Cutscene.next());

function runLoadingScreen(onDone) {
  const bar  = document.getElementById('loading-bar');
  const tip  = document.getElementById('loading-tip');
  const tips = ['Loading assets...','Spawning goblins...','Charging fireballs...',
    "Polishing Dad's club...",'Hiding GossipGPT...','Almost ready...'];
  let pct = 0, tipIdx = 0;
  const iv = setInterval(() => {
    pct += Math.random() * 18 + 5;
    if (pct > 100) pct = 100;
    bar.style.width = pct + '%';
    tip.textContent = tips[Math.min(tipIdx++, tips.length - 1)];
    if (pct >= 100) { clearInterval(iv); setTimeout(onDone, 400); }
  }, 300);
}

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
    document.getElementById('hud-char-name').textContent =
      GameState.selectedChar.charAt(0).toUpperCase() + GameState.selectedChar.slice(1);
    startGame();
  });
}

async function loadLevel(num) {
  try {
    const res = await fetch('levels/level' + num + '.json');
    return await res.json();
  } catch(e) { console.error('Level load failed:', e); return null; }
}

function getSpawnPosition(lastDoor) {
  switch(lastDoor) {
    case 'left':   return { x: 720, y: 300 };
    case 'right':  return { x: 80,  y: 300 };
    case 'top':    return { x: 400, y: 540 };
    case 'bottom': return { x: 400, y: 60  };
    default:       return { x: 80,  y: 300 };
  }
}

class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'BootScene' }); }
  preload() {}
  create() { this.scene.start('GameScene'); }
}

class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    this.player = null; this.enemies = []; this.items = [];
    this.boss = null; this.roomManager = null;
    this.levelData = null; this.roomData = null;
    this.transitioning = false; this.bossSpawned = false;
  }

  async create() {
    this.transitioning = false;
    this.levelData = await loadLevel(GameState.currentLevel);
    if (!this.levelData) { console.error('No level data'); return; }

    this.roomData = this.levelData.rooms.find(r => r.id === GameState.currentRoom);
    if (!this.roomData) { console.error('Room not found:', GameState.currentRoom); return; }

    setLevelDisplay(this.levelData.id, this.roomData.name);

    this.roomManager = new RoomManager(this);
    this.roomManager.load(this.roomData);

    const spawn = getSpawnPosition(GameState.lastDoor);
    this.player = new Player(this, spawn.x, spawn.y, GameState.selectedChar);
    if (!this.player.sprite.body) {
      this.physics.add.existing(this.player.sprite);
    }
    this.roomManager.addColliders(this.player.sprite);

    this.enemies = [];
    (this.roomData.enemies || []).forEach(group => {
      for (let i = 0; i < (group.count || 1); i++) {
        const ox = (i % 3) * 55, oy = Math.floor(i/3) * 55;
        let ex = group.x + ox, ey = group.y + oy;
        const ddx = ex - spawn.x, ddy = ey - spawn.y;
        const dd = Math.sqrt(ddx*ddx + ddy*ddy);
        if (dd < 160 && dd > 0) { ex += (ddx/dd)*(160-dd+20); ey += (ddy/dd)*(160-dd+20); }
        this.enemies.push(new Enemy(this, ex, ey, group.type));
      }
    });

    this.boss = null; this.bossSpawned = false;
    if (this.roomData.boss) {
      const b = this.roomData.boss;
      this.boss = new Boss(this, b.x, b.y, b.type);
      this.bossSpawned = true;
      showBossHUD(b.type.replace(/_/g, ' '));
    }

    this.items = [];
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      attack: Phaser.Input.Keyboard.KeyCodes.SPACE,
      spell: Phaser.Input.Keyboard.KeyCodes.E,
      pickup: Phaser.Input.Keyboard.KeyCodes.F
    });

    if (this.roomData.enemies && this.roomData.enemies.length > 0 || this.roomData.boss) {
      this._lockExitDoors();
    }

    if (GameState.currentLevel === 1 && GameState.currentRoom === 1) {
      this.time.delayedCall(600, () => {
        Cutscene.play([
          'Welcome to the Debug Dungeon.',
          'This is your safe room. No enemies here.',
          'Use WASD to move around and explore.',
          'Press F near chests, items, or signs.',
          'SPACE attacks. E casts your spell.',
          'Walk through the glowing door on the right to advance.',
          'Good luck.'
        ]);
      });
    }

    showToast('Room ' + this.roomData.id + ': ' + this.roomData.name);
    this.cameras.main.fadeIn(300, 0, 0, 0);
  }

  _lockExitDoors() {
    ['right','bottom','top'].forEach(side => {
      const door = this.roomManager.doorZones[side];
      if (door) door.locked = true;
    });
  }

  _checkRoomClear() {
    const alive = this.enemies.filter(e => e.alive).length;
    const bossAlive = this.boss && this.boss.alive;
    if (alive === 0 && !bossAlive) {
      ['right','bottom','top','left'].forEach(side => this.roomManager.unlockDoor(side));
    }
  }

  update() {
    if (GameState.paused || !this.player || this.transitioning) return;
    this.player.update(this.cursors, this.wasd);

    const wasAlive = this.enemies.filter(e => e.alive).length;
    this.enemies.forEach(e => e.update(this.player));
    const nowAlive = this.enemies.filter(e => e.alive).length;
    if (nowAlive < wasAlive) this._checkRoomClear();

    if (this.boss && this.boss.alive) {
      this.boss.update(this.player);
      updateBossBar(this.boss.hp, this.boss.maxHp);
    } else if (this.boss && !this.boss.alive && this.bossSpawned) {
      this.bossSpawned = false;
      hideBossHUD();
      updateScore(500);
      this._checkRoomClear();
      this.time.delayedCall(800, () => this._onBossDefeated());
    }

    if (Phaser.Input.Keyboard.JustDown(this.wasd.pickup)) {
      this.roomManager.tryInteract(this.player);
      this.items.forEach(item => {
        if (item.collected) return;
        const dx = item.sprite.x - this.player.sprite.x;
        const dy = item.sprite.y - this.player.sprite.y;
        if (Math.sqrt(dx*dx+dy*dy) < 42) { item.collect(this.player); updateScore(20); }
      });
    }

    this.roomManager.updateChestPrompts(this.player);
    this.roomManager.checkDoors([this.player], (roomId, side) => this._transitionToRoom(roomId, side));

    updateHPBar(this.player.hp, this.player.maxHp);
    updateMPBar(this.player.mp, this.player.maxMp);

    if (this.player.hp <= 0 && !GameState.paused) this._onPlayerDeath();

    this._drawMinimap();
  }

  _transitionToRoom(roomId, fromSide) {
    if (this.transitioning) return;
    this.transitioning = true;
    this.cameras.main.fadeOut(280, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      const opp = { right:'right', left:'left', top:'top', bottom:'bottom' };
      GameState.lastDoor    = opp[fromSide] || 'right';
      GameState.currentRoom = roomId;
      this.enemies = []; this.items = [];
      this.boss = null;
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
    } else { this._checkRoomClear(); }
  }

  _goToNextLevel() {
    if (GameState.currentLevel >= 3) { this._endGame(); return; }
    GameState.currentLevel++;
    GameState.currentRoom = 1;
    GameState.lastDoor = null;
    showToast('ENTERING LEVEL ' + GameState.currentLevel + '...');
    this.time.delayedCall(800, () => { this.scene.restart(); });
  }

  _onPlayerDeath() {
    GameState.paused = true;
    showToast('YOU DIED');
    this.time.delayedCall(1200, () => {
      document.getElementById('gameover-screen').classList.remove('hidden');
      document.getElementById('gameover-score').textContent = 'Score: ' + GameState.score;
    });
  }

  _endGame() {
    GameState.paused = true;
    Cutscene.play(['LINK QUEST COMPLETE.', 'Final Score: ' + GameState.score,
      'Built with love, chaos, and AI-assisted coding.', 'GG.']);
  }

  _drawMinimap() {
    const canvas = document.getElementById('minimap');
    const ctx = canvas.getContext('2d');
    const sx = canvas.width/800, sy = canvas.height/600;
    ctx.fillStyle = '#050510';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#00ff88';
    this.enemies.forEach(e => {
      if (e.alive) ctx.fillRect(e.sprite.x*sx-1, e.sprite.y*sy-1, 3, 3);
    });
    if (this.boss && this.boss.alive) {
      ctx.fillStyle = '#ff4757';
      ctx.fillRect(this.boss.sprite.x*sx-2, this.boss.sprite.y*sy-2, 5, 5);
    }
    if (this.player) {
      ctx.fillStyle = '#00e5ff';
      ctx.fillRect(this.player.sprite.x*sx-2, this.player.sprite.y*sy-2, 4, 4);
    }
  }
}

document.getElementById('retry-btn').addEventListener('click', () => {
  document.getElementById('gameover-screen').classList.add('hidden');
  GameState.score = 0; GameState.currentLevel = 1; GameState.currentRoom = 1;
  GameState.lastDoor = null; GameState.paused = false;
  GameState.inventory = { keys: 0, armor: 'cloth' };
  updateScore(0);
  window.phaserGame.scene.getScene('GameScene').scene.restart();
});

function startGame() {
  document.getElementById('game-wrapper').classList.remove('hidden');
  const config = {
    type: Phaser.AUTO, width: 800, height: 600,
    parent: 'game-container', backgroundColor: '#0a0a0f',
    physics: { default: 'arcade', arcade: { gravity: { y: 0 }, debug: false } },
    scene: [BootScene, GameScene]
  };
  window.phaserGame = new Phaser.Game(config);
}

window.addEventListener('load', () => { runLoadingScreen(() => initCharSelect()); });
