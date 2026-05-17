import Phaser from "phaser";

const HERO_FRAMES: Record<string, number> = {
  Niall: 84,      // row 8 col 1 — purple wizard
  Bear: 88,       // row 8 col 5
  Noah: 100,      // row 9 col 5 — grey-haired elder
  Journey: 99,    // row 9 col 4 — long-haired female
  Lincoln: 87,    // row 8 col 4 — bearded knight
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

    const heroStartX = 140;
    const heroSpacing = 130;
    HERO_ORDER.forEach((name, i) => {
      const x = heroStartX + i * heroSpacing;
      const kit = HERO_KITS[name];

      this.add
        .sprite(x, 100, "tiles", HERO_FRAMES[name])
        .setOrigin(0.5)
        .setScale(4);

      this.add
        .text(x, 147, name, {
          fontFamily: "monospace",
          fontSize: "16px",
          color: "#e0e0e0",
        })
        .setOrigin(0.5);

      this.add
        .text(x, 163, `HP ${kit.hp}  SP ${kit.speed}`, {
          fontFamily: "monospace",
          fontSize: "10px",
          color: "#aaaaaa",
        })
        .setOrigin(0.5);

      this.add
        .text(x, 175, `${kit.primary.type} ${kit.primary.name} ${kit.primary.damage}`, {
          fontFamily: "monospace",
          fontSize: "10px",
          color: "#aaaaaa",
        })
        .setOrigin(0.5);

      this.add
        .text(x, 187, kit.mana, {
          fontFamily: "monospace",
          fontSize: "10px",
          color: "#aaaaaa",
          fontStyle: "italic",
        })
        .setOrigin(0.5);
    });

    // ENEMIES section
    this.add
      .text(width / 2, 210, "— ENEMIES (Level 1) —", {
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
        .sprite(x, 247, "tiles", enemy.frame)
        .setOrigin(0.5)
        .setScale(4);
      this.add
        .text(x, 292, name, {
          fontFamily: "monospace",
          fontSize: "14px",
          color: "#e0e0e0",
        })
        .setOrigin(0.5);
      this.add
        .text(x, 310, `HP ${enemy.hp}  DMG ${enemy.damage}`, {
          fontFamily: "monospace",
          fontSize: "10px",
          color: "#aaaaaa",
        })
        .setOrigin(0.5);
      this.add
        .text(x, 324, enemy.pattern, {
          fontFamily: "monospace",
          fontSize: "10px",
          color: "#aaaaaa",
          fontStyle: "italic",
        })
        .setOrigin(0.5);
    });

    // Library divider
    this.add
      .text(width / 2, 347, "— sprite library reference —", {
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#666666",
      })
      .setOrigin(0.5);

    // Library reference at 1.2x scale (shrunk to make room for hero kits)
    this.add
      .image(width / 2, 362, "tilesheet")
      .setOrigin(0.5, 0)
      .setScale(1.2);
  }
}
