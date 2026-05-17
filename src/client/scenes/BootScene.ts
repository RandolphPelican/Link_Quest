import Phaser from "phaser";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload() {
    // Load as single image for the whole-sheet preview
    this.load.image("tilesheet", "kenney/Tilemap/tilemap_packed.png");
    // Load as spritesheet for future frame-by-frame access (Move 5+)
    this.load.spritesheet("tiles", "kenney/Tilemap/tilemap_packed.png", {
      frameWidth: 16,
      frameHeight: 16,
    });
  }

  create() {
    const { width, height } = this.scale;

    this.add
      .text(width / 2, 30, "LINK QUEST", {
        fontFamily: "monospace",
        fontSize: "36px",
        color: "#e0e0e0",
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 70, "skeleton loaded", {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#888888",
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 100, "Kenney Tiny Dungeon — 132 sprites loaded", {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#4caf50",
      })
      .setOrigin(0.5);

    // Render the full tilesheet at 2.5x scale, top-center anchored just below the text.
    // Native 192x176 -> 480x440 onscreen.
    this.add
      .image(width / 2, 120, "tilesheet")
      .setOrigin(0.5, 0)
      .setScale(2.5);
  }
}
