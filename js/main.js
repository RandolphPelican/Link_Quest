// ============================================================
// main.js — Core game loop & scene management
// ============================================================

class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'BootScene' }); }

  preload() {
    // Load all assets here before game starts
    // this.load.image('player', 'assets/sprites/lincoln.png');
    // this.load.image('bear',   'assets/sprites/bear.png');
    // Placeholder colored rectangles used until real sprites are in
  }

  create() {
    this.scene.start('GameScene');
  }
}

class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'GameScene' }); }

  create() {
    // Background
    this.add.rectangle(400, 300, 800, 600, 0x1a1a2e);

    // Ground tiles (placeholder grid)
    for (let x = 0; x < 800; x += 32) {
      for (let y = 0; y < 600; y += 32) {
        const tile = this.add.rectangle(x + 16, y + 16, 30, 30, 0x16213e);
        tile.setStrokeStyle(1, 0x0f3460, 0.4);
      }
    }

    // Spawn player
    this.player = new Player(this, 400, 300, 'lincoln');

    // Spawn a test enemy
    this.enemy = new Enemy(this, 200, 200, 'goblin');

    // Spawn a test boss
    this.boss = new Boss(this, 600, 150, 'lazy_coder');

    // UI layer
    this.createUI();

    // Input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      attack: Phaser.Input.Keyboard.KeyCodes.SPACE
    });
  }

  createUI() {
    // HP bar background
    this.add.rectangle(110, 20, 200, 16, 0x333333).setOrigin(0, 0.5);
    this.hpBar = this.add.rectangle(110, 20, 200, 16, 0xe74c3c).setOrigin(0, 0.5);
    this.add.text(10, 12, 'HP', { fontSize: '14px', fill: '#fff' });

    // Player name tag
    this.nameTag = this.add.text(10, 30, 'Lincoln', { fontSize: '11px', fill: '#aaa' });
  }

  update() {
    this.player.update(this.cursors, this.wasd);
    this.enemy.update(this.player);
    this.boss.update(this.player);

    // Update HP bar width proportionally
    const hpRatio = this.player.hp / this.player.maxHp;
    this.hpBar.width = 200 * hpRatio;
    this.hpBar.fillColor = hpRatio > 0.5 ? 0x2ecc71 : hpRatio > 0.25 ? 0xf39c12 : 0xe74c3c;
  }
}

// ── Phaser Config ────────────────────────────────────────────
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game-container',
  backgroundColor: '#0a0a0a',
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 }, debug: false }
  },
  scene: [BootScene, GameScene]
};

const game = new Phaser.Game(config);
