import Phaser from "phaser";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  create() {
    const { width, height } = this.scale;

    this.add
      .text(width / 2, height / 2 - 20, "LINK QUEST", {
        fontFamily: "monospace",
        fontSize: "48px",
        color: "#e0e0e0",
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 + 30, "skeleton loaded", {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#888888",
      })
      .setOrigin(0.5);
  }
}
