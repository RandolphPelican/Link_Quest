import Phaser from "phaser";

const HERO_FRAMES: Record<string, number> = {
  Niall: 84,      // row 8 col 1 — purple wizard
  Bear: 88,       // row 8 col 5
  Noah: 100,      // row 9 col 5 — grey-haired elder
  Journey: 99,    // row 9 col 4 — long-haired female
  Lincoln: 87,    // row 8 col 4 — bearded knight
};

const HERO_ORDER = ["Niall", "Bear", "Noah", "Journey", "Lincoln"];

interface EnemyDef {
  frame: number;
  hp: number;
  damage: number;
  pattern: string;
}

const ENEMIES: Record<string, EnemyDef> = {
  "Grey Rat":   { frame: 124, hp: 10, damage: 2, pattern: "attack/retreat" },   // row 11 col 5
  "Red Bat":    { frame: 120, hp: 5,  damage: 1, pattern: "straight-line" },    // row 11 col 1
  "Green Blob": { frame: 108, hp: 20, damage: 3, pattern: "slow + sporadic" },  // row 10 col 1
};

const ENEMY_ORDER = ["Grey Rat", "Red Bat", "Green Blob"];

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
  }

  create() {
    const { width } = this.scale;

    this.add
      .text(width / 2, 25, "LINK QUEST", {
        fontFamily: "monospace",
        fontSize: "28px",
        color: "#e0e0e0",
      })
      .setOrigin(0.5);

    // HEROES section
    this.add
      .text(width / 2, 55, "— HEROES —", {
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#888888",
      })
      .setOrigin(0.5);

    const heroStartX = 200;
    const heroSpacing = 100;
    HERO_ORDER.forEach((name, i) => {
      const x = heroStartX + i * heroSpacing;
      this.add
        .sprite(x, 100, "tiles", HERO_FRAMES[name])
        .setOrigin(0.5)
        .setScale(4);
      this.add
        .text(x, 145, name, {
          fontFamily: "monospace",
          fontSize: "16px",
          color: "#e0e0e0",
        })
        .setOrigin(0.5);
    });

    // ENEMIES section
    this.add
      .text(width / 2, 175, "— ENEMIES (Level 1) —", {
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#888888",
      })
      .setOrigin(0.5);

    const enemyStartX = 200;
    const enemySpacing = 200;
    ENEMY_ORDER.forEach((name, i) => {
      const x = enemyStartX + i * enemySpacing;
      const enemy = ENEMIES[name];
      this.add
        .sprite(x, 215, "tiles", enemy.frame)
        .setOrigin(0.5)
        .setScale(4);
      this.add
        .text(x, 260, name, {
          fontFamily: "monospace",
          fontSize: "14px",
          color: "#e0e0e0",
        })
        .setOrigin(0.5);
      this.add
        .text(x, 278, `HP ${enemy.hp}  DMG ${enemy.damage}`, {
          fontFamily: "monospace",
          fontSize: "10px",
          color: "#aaaaaa",
        })
        .setOrigin(0.5);
      this.add
        .text(x, 292, enemy.pattern, {
          fontFamily: "monospace",
          fontSize: "10px",
          color: "#aaaaaa",
          fontStyle: "italic",
        })
        .setOrigin(0.5);
    });

    // Library divider
    this.add
      .text(width / 2, 315, "— sprite library reference —", {
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#666666",
      })
      .setOrigin(0.5);

    // Library reference at 1.5x scale (smaller to make room for enemies)
    this.add
      .image(width / 2, 330, "tilesheet")
      .setOrigin(0.5, 0)
      .setScale(1.5);
  }
}
