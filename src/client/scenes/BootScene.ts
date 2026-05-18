import Phaser from "phaser";

// Hero/enemy data preserved for upcoming moves (spawning into rooms)
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

// Suppress unused-variable warnings — these are referenced by future moves
void HERO_FRAMES; void HERO_KITS; void HERO_ORDER; void ENEMIES; void ENEMY_ORDER;

export class BootScene extends Phaser.Scene {
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
    const map = this.make.tilemap({ key: "room1" });
    const tileset = map.addTilesetImage("kenney_tiny_dungeon", "tilesheet");

    if (tileset) {
      map.createLayer("Tile Layer 1", tileset, 0, 0);
    }

    // 2x camera zoom: 400x288 native map fills 800x576 onscreen
    this.cameras.main.setZoom(2);
    this.cameras.main.centerOn(map.widthInPixels / 2, map.heightInPixels / 2);
  }
}
