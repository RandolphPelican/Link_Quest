import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: "game",
  backgroundColor: "#0a0a0a",
  pixelArt: true,
  scene: [BootScene],
};

new Phaser.Game(config);
