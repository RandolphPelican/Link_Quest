import Phaser from "phaser";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload() {
    this.load.spritesheet("tiles", "kenney/Tilemap/tilemap_packed.png", {
      frameWidth: 16,
      frameHeight: 16,
    });
  }

  create() {
    const { width, height } = this.scale;

    this.add
      .text(width / 2, 60, "LINK QUEST", {
        fontFamily: "monospace",
        fontSize: "48px",
        color: "#e0e0e0",
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 110, "skeleton loaded", {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#888888",
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 160, "Kenney Tiny Dungeon — 132 sprites loaded", {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#4caf50",
      })
      .setOrigin(0.5);

    this.add
      .image(width / 2, height / 2 + 80, "tiles")
      .setOrigin(0.5)
      .setScale(3);
  }
}
