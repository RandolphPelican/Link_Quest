import Phaser from "phaser";

// Hero/enemy data preserved for upcoming moves
const HERO_FRAMES: Record<string, number> = {
  Niall: 84,
  Bear: 88,
  Noah: 100,
  Journey: 99,
  Lincoln: 87,
};

interface HeroKit {
  hp: number;
  speed: number;
  primary: { type: "M" | "R"; name: string; damage: number };
  mana: string;
}

const HERO_KITS: Record<string, HeroKit> = {
  Niall:   { hp: 70, speed: 6, primary: { type: "R", name: "fireball",    damage: 2   }, mana: "blue fireball stun 3s" },
  Bear:    { hp: 90, speed: 4, primary: { type: "M", name: "club swing",  damage: 3   }, mana: "ground bash AOE 4" },
  Noah:    { hp: 55, speed: 7, primary: { type: "M", name: "sword poke",  damage: 4   }, mana: "heal +20 to others" },
  Journey: { hp: 40, speed: 9, primary: { type: "R", name: "arrow/knife", damage: 2   }, mana: "fire arrow 5 dmg" },
  Lincoln: { hp: 80, speed: 8, primary: { type: "M", name: "axe swing",   damage: 4.5 }, mana: "gas 2 dmg/s area 5s" },
};

const HERO_ORDER = ["Niall", "Bear", "Noah", "Journey", "Lincoln"];

interface EnemyDef {
  frame: number;
  hp: number;
  damage: number;
  pattern: string;
}

const ENEMIES: Record<string, EnemyDef> = {
  "Grey Rat":   { frame: 124, hp: 10, damage: 2, pattern: "attack/retreat" },
  "Red Bat":    { frame: 120, hp: 5,  damage: 1, pattern: "straight-line" },
  "Green Blob": { frame: 108, hp: 20, damage: 3, pattern: "slow + sporadic" },
};

const ENEMY_ORDER = ["Grey Rat", "Red Bat", "Green Blob"];

// Suppress unused-variable warnings — referenced by future moves
void HERO_ORDER; void ENEMIES; void ENEMY_ORDER;

// Speed scaling: pixels-per-second = SP × 15
const SPEED_PER_SP = 15;

export class BootScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wKey?: Phaser.Input.Keyboard.Key;
  private aKey?: Phaser.Input.Keyboard.Key;
  private sKey?: Phaser.Input.Keyboard.Key;
  private dKey?: Phaser.Input.Keyboard.Key;
  private playerSpeed = HERO_KITS.Lincoln.speed * SPEED_PER_SP;

  constructor() {
    super("BootScene");
  }

  preload() {
    this.load.image("tilesheet", "kenney/Tilemap/tilemap_packed.png");
    this.load.spritesheet("tiles", "kenney/Tilemap/tilemap_packed.png", {
      frameWidth: 16,
      frameHeight: 16,
    });
    this.load.tilemapTiledJSON("room1", "maps/room1.tmj");
  }

  create() {
    // Load Tiled map and its tile layer
    const map = this.make.tilemap({ key: "room1" });
    const tileset = map.addTilesetImage("kenney_tiny_dungeon", "tilesheet");

    let layer: Phaser.Tilemaps.TilemapLayer | null = null;
    if (tileset) {
      layer = map.createLayer("Tile Layer 1", tileset, 0, 0);
      if (layer) {
        // Tile 15 = stone wall perimeter. Blocks movement.
        layer.setCollision(15);
      }
    }

    // Spawn Lincoln at tile (3, 9) — clear floor on the left side
    const startX = 3 * 16 + 8;
    const startY = 9 * 16 + 8;
    this.player = this.physics.add.sprite(startX, startY, "tiles", HERO_FRAMES.Lincoln);
    this.player.setCollideWorldBounds(true);

    // Wall collision
    if (layer) {
      this.physics.add.collider(this.player, layer);
    }

    // Keyboard input — arrow keys + WASD
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.wKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
      this.aKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
      this.sKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
      this.dKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    }

    // Camera: 2x zoom, static at map center (room fits entirely in view)
    this.cameras.main.setZoom(2);
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.centerOn(map.widthInPixels / 2, map.heightInPixels / 2);
  }

  update() {
    if (!this.player) return;

    const left  = this.cursors?.left.isDown  || this.aKey?.isDown;
    const right = this.cursors?.right.isDown || this.dKey?.isDown;
    const up    = this.cursors?.up.isDown    || this.wKey?.isDown;
    const down  = this.cursors?.down.isDown  || this.sKey?.isDown;

    let vx = 0;
    let vy = 0;
    if (left) vx = -this.playerSpeed;
    else if (right) vx = this.playerSpeed;
    if (up) vy = -this.playerSpeed;
    else if (down) vy = this.playerSpeed;

    // Normalize diagonal so it's not faster than orthogonal
    if (vx !== 0 && vy !== 0) {
      vx *= Math.SQRT1_2;
      vy *= Math.SQRT1_2;
    }

    this.player.setVelocity(vx, vy);
  }
}
