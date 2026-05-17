import Phaser from "phaser";

const HERO_FRAMES: Record<string, number> = {
  Niall: 84,      // purple wizard with staff (TENTATIVE)
  Bear: 108,      // bear-headed character (TENTATIVE)
  Noah: 96,       // bearded warrior, grey hair (TENTATIVE)
  Journey: 100,   // long-haired female (TENTATIVE)
  Lincoln: 97,    // bearded knight (TENTATIVE)
};

const HERO_ORDER = ["Niall", "Bear", "Noah", "Journey", "Lincoln"];

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

    // Hero lineup — 5 sprites at 4x scale, names below each
    const startX = 200;
    const spacing = 100;
    HERO_ORDER.forEach((name, i) => {
      const x = startX + i * spacing;
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

    // Divider
    this.add
      .text(width / 2, 175, "— sprite library reference —", {
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#666666",
      })
      .setOrigin(0.5);

    // Full tilesheet at 2x scale below for ongoing reference
    this.add
      .image(width / 2, 195, "tilesheet")
      .setOrigin(0.5, 0)
      .setScale(2);
  }
}
