import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { TitleScene } from "./scenes/TitleScene";
import { GameScene } from "./scenes/GameScene";
import { UIScene } from "./scenes/UIScene";

// ---- Diagnostic crash overlay -------------------------------------------
// If anything throws inside the game loop, show it ON SCREEN instead of a
// silent freeze. This is the "diagnostic tool" — a frozen game now reports why.
function showCrash(msg: string, stack?: string) {
  let box = document.getElementById("crash-overlay");
  if (!box) {
    box = document.createElement("div");
    box.id = "crash-overlay";
    box.style.cssText =
      "position:fixed;left:0;right:0;bottom:0;max-height:45%;overflow:auto;z-index:9999;" +
      "background:#2a0000ee;color:#ffd0d0;font:12px monospace;padding:10px 14px;" +
      "border-top:2px solid #ff5555;white-space:pre-wrap;";
    document.body.appendChild(box);
  }
  box.textContent = "GAME ERROR (screenshot this):\n" + msg + (stack ? "\n\n" + stack : "");
}
window.addEventListener("error", (e) => showCrash(e.message, e.error?.stack));
window.addEventListener("unhandledrejection", (e) => showCrash(String(e.reason), e.reason?.stack));

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: "game",
  backgroundColor: "#0a0a0a",
  pixelArt: true,
  roundPixels: true,   // camera shake must land on whole pixels — kills tile-seam lines
  scene: [BootScene, TitleScene, GameScene, UIScene],
  physics: { default: "arcade", arcade: { gravity: { x: 0, y: 0 }, debug: false } },
};

const game = new Phaser.Game(config);
(window as unknown as { __game: Phaser.Game }).__game = game;
