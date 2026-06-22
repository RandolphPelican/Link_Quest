import Phaser from "phaser";
import { HEROES, HERO_ORDER } from "../config/heroes";

export class TitleScene extends Phaser.Scene {
  private selected = HERO_ORDER.indexOf("Lincoln");
  private ring!: Phaser.GameObjects.Rectangle;
  private heroSprites: Phaser.GameObjects.Image[] = [];
  private statText!: Phaser.GameObjects.Text;

  constructor() { super("TitleScene"); }

  create() {
    const W = this.scale.width, H = this.scale.height;
    this.heroSprites = [];
    this.add.text(W / 2, 70, "LINK QUEST", { fontFamily: "monospace", fontSize: "56px", color: "#ffe97f", fontStyle: "bold" }).setOrigin(0.5);
    this.add.text(W / 2, 120, "Five heroes. One dungeon. Choose your fighter.", { fontFamily: "monospace", fontSize: "15px", color: "#aaaaaa" }).setOrigin(0.5);

    const spacing = 110, startX = W / 2 - spacing * (HERO_ORDER.length - 1) / 2, y = H / 2 - 10;
    this.ring = this.add.rectangle(0, y, 84, 84, 0x000000, 0).setStrokeStyle(3, 0xffe97f);
    HERO_ORDER.forEach((key, i) => {
      const hero = HEROES[key];
      const x = startX + i * spacing;
      this.heroSprites.push(this.add.image(x, y, "tiles", hero.frame).setScale(4));
      this.add.text(x, y + 58, hero.name, { fontFamily: "monospace", fontSize: "14px", color: "#ffffff" }).setOrigin(0.5);
    });
    this.statText = this.add.text(W / 2, y + 100, "", { fontFamily: "monospace", fontSize: "13px", color: "#a8d8a8", align: "center" }).setOrigin(0.5);

    // controls card
    const cardY = H - 150;
    this.add.rectangle(W / 2, cardY, 460, 96, 0x10100c, 0.9).setStrokeStyle(2, 0x4a4a3a);
    this.add.text(W / 2, cardY - 32, "CONTROLS", { fontFamily: "monospace", fontSize: "13px", color: "#d8c98a", fontStyle: "bold" }).setOrigin(0.5);
    this.add.text(W / 2, cardY + 2,
      "Move:  WASD  or  Arrow Keys\nAttack:  SPACE        Read signs:  E\nPause:  P / ESC        Debug overlay:  F3",
      { fontFamily: "monospace", fontSize: "13px", color: "#cfcfcf", align: "center", lineSpacing: 6 }).setOrigin(0.5);

    const start = this.add.text(W / 2, H - 50, "Press ENTER or SPACE to begin", { fontFamily: "monospace", fontSize: "15px", color: "#d8c98a" }).setOrigin(0.5);
    this.tweens.add({ targets: start, alpha: 0.3, yoyo: true, repeat: -1, duration: 700 });

    this.updateSelection();
    this.input.keyboard!.on("keydown-LEFT", () => this.move(-1));
    this.input.keyboard!.on("keydown-RIGHT", () => this.move(1));
    this.input.keyboard!.on("keydown-A", () => this.move(-1));
    this.input.keyboard!.on("keydown-D", () => this.move(1));
    const begin = () => {
      const heroKey = HERO_ORDER[this.selected];
      this.scene.launch("UIScene");
      this.scene.start("GameScene", { room: "room1", spawn: "spawn_default", heroKey });
    };
    this.input.keyboard!.once("keydown-ENTER", begin);
    this.input.keyboard!.once("keydown-SPACE", begin);
  }

  private move(dir: number) { this.selected = Phaser.Math.Wrap(this.selected + dir, 0, HERO_ORDER.length); this.updateSelection(); }
  private updateSelection() {
    const img = this.heroSprites[this.selected];
    this.ring.setPosition(img.x, img.y);
    const hero = HEROES[HERO_ORDER[this.selected]];
    this.statText.setText(`HP ${hero.hp}   Speed ${hero.speed}   ${hero.attack.name} (${hero.attack.damage} dmg)`);
    this.heroSprites.forEach((s, i) => s.setAlpha(i === this.selected ? 1 : 0.5));
  }
}
