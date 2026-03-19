// ============================================================
// main.js — Core game loop, scene management, level loading
// ============================================================

// ── GLOBAL GAME STATE ────────────────────────────────────────
const GameState = {
  selectedChar: null,
  currentLevel: 1,
  score: 0,
  lives: 3,
  paused: false
};

// ── TOAST HELPER ─────────────────────────────────────────────
function showToast(msg, duration = 2000) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), duration);
}

// ── HUD HELPERS ───────────────────────────────────────────────
function updateHPBar(current, max) {
  const pct = Math.max(0, current / max) * 100;
  const bar = document.getElementById('hp-bar');
  bar.style.width = pct + '%';
  bar.style.background =
    pct > 50 ? 'var(--green)' :
    pct > 25 ? 'var(--orange)' : 'var(--red)';
  document.getElementById('hp-text').textContent = `${current}/${max}`;
}

function updateMPBar(current, max) {
  const pct = Math.max(0, current / max) * 100;
  document.getElementById('mp-bar').style.width = pct + '%';
  document.getElementById('mp-text').textContent = `${current}/${max}`;
}

function updateBossBar(current, max) {
  const pct = Math.max(0, current / max) * 100;
  document.getElementById('boss-hp-bar').style.width = pct + '%';
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
  document.getElementById('hud-score').textContent = `Score: ${GameState.score}`;
}

function setLevelDisplay(num, name) {
  document.getElementById('hud-level').textContent = `LEVEL ${num}`;
  document.getElementById('hud-level-name').textContent = name;
}

// ── CUTSCENE SYSTEM ───────────────────────────────────────────
const Cutscene = {
  lines: [],
  index: 0,
  onDone: null,

  play(lines, onDone = null) {
    this.lines = lines;
    this.index = 0;
    this.onDone = onDone;
    document.getElementById('cutscene-overlay').classList.remove('hidden');
    this.showLine();
  },

  showLine() {
    const el = document.getElementById('cutscene-text');
    el.textContent = '';
    const line = this.lines[this.index];
    // Typewriter effect
    let i = 0;
    const interval = setInterval(() => {
      el.textContent += line[i++];
      if (i >= line.length) clearInterval(interval);
    }, 30);
  },

  next() {
    this.index++;
    if (this.index >= this.lines.length) {
      document.getElementById('cutscene-overlay').classList.add('hidden');
      if (this.onDone) this.onDone();
    } else {
      this.showLine();
    }
  }
};

document.getElementById('cutscene-next')
  .addEventListener('click', () => Cutscene.next());

// ── LOADING SCREEN ────────────────────────────────────────────
function runLoadingScreen(onDone) {
  const bar = document.getElementById('loading-bar');
  const tip = document.getElementById('loading-tip');
  const tips = [
    'Loading assets...',
    'Spawning goblins...',
    'Charging fireballs...',
    'Polishing Dad\'s club...',
    'Hiding GossipGPT...',
    'Almost ready...'
  ];
  let pct = 0;
  let tipIdx = 0;

  const interval = setInterval(() => {
    pct += Math.random() * 18 + 5;
    if (pct > 100) pct = 100;
    bar.style.width = pct + '%';
    tip.textContent = tips[Math.min(tipIdx++, tips.length - 1)];

    if (pct >= 100) {
      clearInterval(interval);
      setTimeout(onDone, 400);
    }
  }, 300);
}

// ── CHARACTER SELECT ──────────────────────────────────────────
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
      btn.textContent = `Play as ${card.dataset.char.toUpperCase()}`;
      btn.classList.add('ready');
      btn.disabled = false;
    });
  });

  btn.addEventListener('click', () => {
    if (!GameState.selectedChar) return;
    document.getElementById('char-select-screen').classList.add('hidden');
    document.getElementById('hud-char-name').textContent =
      GameState.selectedChar.charAt(0).toUpperCase() +
      GameState.selectedChar.slice(1);
    startGame();
  });
}

// ── LEVEL LOADER ──────────────────────────────────────────────
async function loadLevel(num) {
  try {
    const res  = await fetch(`levels/level${num}.json`);
    const data = await res.json();
    return data;
  } catch (e) {
    console.error('Level load failed:', e);
    return null;
  }
}

// ── PHASER SCENES ─────────────────────────────────────────────

class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'BootScene' }); }

  preload() {
    // Placeholder — swap in real asset loads here when sprites are ready
    // this.load.image('lincoln', 'assets/sprites/lincoln.png');
    // this.load.image('goblin',  'assets/sprites/enemies/goblin.png');
    // this.load.audio('hit',     'assets/sounds/hit.wav');
  }

  create() {
    this.scene.start('GameScene');
  }
}

class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    this.player       = null;
    this.enemies      = [];
    this.boss         = null;
    this.items        = [];
    this.levelData    = null;
    this.bossSpawned  = false;
    this.puzzleSolved = false;
  }

  async create() {
    // Load level JSON
    this.levelData = await loadLevel(GameState.currentLevel);
    if (!this.levelData) return;

    setLevelDisplay(this.levelData.id, this.levelData.name);

    // ── Background ──────────────────────────────────────────
    const bgColor = parseInt(this.levelData.background.replace('#',''), 16);
    this.add.rectangle(400, 300, 800, 600, bgColor);

    // Draw tile grid
    this.drawGrid();

    // ── Spawn player ────────────────────────────────────────
    this.player = new Player(this, 400, 300, GameState.selectedChar);

    // ── Spawn enemies from JSON ──────────────────────────────
    this.levelData.enemies.forEach(group => {
      for (let i = 0; i < group.count; i++) {
        const offsetX = (i % 3) * 40;
        const offsetY = Math.floor(i / 3) * 40;
        this.enemies.push(
          new Enemy(this, group.x + offsetX, group.y + offsetY, group.type)
        );
      }
    });

    // ── Spawn items from JSON ────────────────────────────────
    this.levelData.items.forEach(it => {
      this.items.push(new Item(this, it.x, it.y, it.key));
    });

    // ── Spawn boss if level has one ──────────────────────────
    if (this.levelData.boss) {
      const b = this.levelData.boss;
      this.boss = new Boss(this, b.x, b.y, b.type);
      this.bossSpawned = true;
      showBossHUD(b.type.replace('_', ' '));
    }

    // ── Draw exit door ───────────────────────────────────────
    if (this.levelData.exit) {
      this.exitDoor = this.add.rectangle(
        this.levelData.exit.x,
        this.levelData.exit.y,
        28, 28, 0x00e5ff, 0.3
      );
      this.exitDoor.setStrokeStyle(2, 0x00e5ff);
      this.exitLabel = this.add.text(
        this.levelData.exit.x - 12,
        this.levelData.exit.y + 16,
        'EXIT', { fontSize: '8px', fill: '#00e5ff' }
      );
      this.physics.add.existing(this.exitDoor, true);
    }

    // ── Input ────────────────────────────────────────────────
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

    // Opening cutscene for level 1
    if (GameState.currentLevel === 1) {
      this.time.delayedCall(500, () => {
        Cutscene.play([
          `Welcome to ${this.levelData.name}...`,
          'The Terminal Goblins have overrun the Debug Dungeon.',
          'Defeat the Lazy Coder to advance.',
          'WASD to move. SPACE to attack. E for spells. F to pickup.',
          'Good luck.'
        ]);
      });
    }

    showToast(`LEVEL ${this.levelData.id} — ${this.levelData.name}`);
  }

  drawGrid() {
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x1e1e3a, 0.35);
    for (let x = 0; x <= 800; x += 32) {
      graphics.lineBetween(x, 0, x, 600);
    }
    for (let y = 0; y <= 600; y += 32) {
      graphics.lineBetween(0, y, 800, y);
    }
  }

  update() {
    if (GameState.paused || !this.player) return;

    // Update player
    this.player.update(this.cursors, this.wasd);

    // Update enemies — remove dead ones
    this.enemies = this.enemies.filter(e => e.alive);
    this.enemies.forEach(e => e.update(this.player));

    // Update boss
    if (this.boss && this.boss.alive) {
      this.boss.update(this.player);
      updateBossBar(this.boss.hp, this.boss.maxHp);
    } else if (this.boss && !this.boss.alive && this.bossSpawned) {
      this.bossSpawned = false;
      hideBossHUD();
      updateScore(500);
      showToast('BOSS DEFEATED! +500');
      this.time.delayedCall(1000, () => this.onBossDefeated());
    }

    // Check item pickups (F key)
    if (Phaser.Input.Keyboard.JustDown(this.wasd.pickup)) {
      this.items.forEach(item => {
        if (!item.collected) {
          const dx = item.sprite.x - this.player.sprite.x;
          const dy = item.sprite.y - this.player.sprite.y;
          if (Math.sqrt(dx*dx + dy*dy) < 40) {
            item.collect(this.player);
            updateScore(25);
            showToast(`Picked up ${item.data.name}! +25`);
          }
        }
      });
    }

    // Check exit overlap
    if (this.exitDoor && !this.levelData.exit.locked) {
      const dx = this.exitDoor.x - this.player.sprite.x;
      const dy = this.exitDoor.y - this.player.sprite.y;
      if (Math.sqrt(dx*dx + dy*dy) < 30) {
        this.goToNextLevel();
      }
    }

    // Sync HUD bars
    updateHPBar(this.player.hp, this.player.maxHp);
    updateMPBar(this.player.mp, this.player.maxMp);

    // Check player death
    if (this.player.hp <= 0) {
      this.onPlayerDeath();
    }

    // Draw minimap
    this.drawMinimap();
  }

  drawMinimap() {
    const canvas  = document.getElementById('minimap');
    const ctx     = canvas.getContext('2d');
    const scaleX  = canvas.width  / 800;
    const scaleY  = canvas.height / 600;

    ctx.fillStyle = '#050510';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Enemies
    ctx.fillStyle = '#00ff88';
    this.enemies.forEach(e => {
      if (e.alive) ctx.fillRect(e.sprite.x * scaleX - 1, e.sprite.y * scaleY - 1, 3, 3);
    });

    // Boss
    if (this.boss && this.boss.alive) {
      ctx.fillStyle = '#ff4757';
      ctx.fillRect(this.boss.sprite.x * scaleX - 2, this.boss.sprite.y * scaleY - 2, 5, 5);
    }

    // Player
    ctx.fillStyle = '#00e5ff';
    if (this.player) {
      ctx.fillRect(
        this.player.sprite.x * scaleX - 2,
        this.player.sprite.y * scaleY - 2, 4, 4
      );
    }

    // Exit
    if (this.exitDoor) {
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(
        this.levelData.exit.x * scaleX - 2,
        this.levelData.exit.y * scaleY - 2, 4, 4
      );
    }
  }

  onBossDefeated() {
    // Unlock exit
    if (this.levelData.exit) {
      this.levelData.exit.locked = false;
      this.exitDoor.fillAlpha = 0.8;
      showToast('EXIT UNLOCKED — reach the door!');
    }

    // Final boss cutscene
    if (this.levelData.cutscene === 'gossip_gpt_transform') {
      Cutscene.play([
        'GossipGPT begins to malfunction...',
        'Its pixels scramble and reform...',
        '[ ERROR: IDENTITY_OVERRIDE ]',
        'Wait... is that... ChatGPT?!',
        'The real enemy was mediocrity all along.',
        'You proved AI-assisted coding is a superpower.',
        'Dad was right. Game built. Mission complete.'
      ], () => this.goToNextLevel());
    }
  }

  goToNextLevel() {
    if (GameState.currentLevel >= 3) {
      this.endGame();
      return;
    }
    GameState.currentLevel++;
    showToast(`ENTERING LEVEL ${GameState.currentLevel}...`);
    this.time.delayedCall(800, () => {
      this.enemies = [];
      this.items   = [];
      this.boss    = null;
      this.bossSpawned  = false;
      this.scene.restart();
    });
  }

  onPlayerDeath() {
    GameState.paused = true;
    showToast('YOU DIED');
    this.time.delayedCall(1200, () => {
      document.getElementById('gameover-screen').classList.remove('hidden');
      document.getElementById('gameover-score').textContent =
        `Score: ${GameState.score}`;
    });
  }

  endGame() {
    GameState.paused = true;
    Cutscene.play([
      'LINK QUEST COMPLETE.',
      `Final Score: ${GameState.score}`,
      'Built with love, chaos, and AI-assisted coding.',
      'GG.'
    ]);
  }
}

// ── RETRY BUTTON ──────────────────────────────────────────────
document.getElementById('retry-btn').addEventListener('click', () => {
  document.getElementById('gameover-screen').classList.add('hidden');
  GameState.score        = 0;
  GameState.currentLevel = 1;
  GameState.paused       = false;
  updateScore(0);
  window.phaserGame.scene.getScene('GameScene').scene.restart();
});

// ── PHASER CONFIG ─────────────────────────────────────────────
function startGame() {
  document.getElementById('game-wrapper').classList.remove('hidden');

  const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#0a0a0f',
    physics: {
      default: 'arcade',
      arcade: { gravity: { y: 0 }, debug: false }
    },
    scene: [BootScene, GameScene]
  };

  window.phaserGame = new Phaser.Game(config);
}

// ── BOOT SEQUENCE ─────────────────────────────────────────────
window.addEventListener('load', () => {
  runLoadingScreen(() => initCharSelect());
});
