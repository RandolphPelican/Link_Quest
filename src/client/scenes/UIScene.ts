import Phaser from "phaser";
import { HERO_ORDER, HEROES } from "../config/heroes";

interface DialogPayload { title: string; lines: string[]; signId: string; }

export class UIScene extends Phaser.Scene {
  private hpBarFill!: Phaser.GameObjects.Rectangle;
  private hpText!: Phaser.GameObjects.Text;
  private roomText!: Phaser.GameObjects.Text;
  private bossText!: Phaser.GameObjects.Text;
  private enemyText!: Phaser.GameObjects.Text;
  private keysText!: Phaser.GameObjects.Text;
  private keyIcon!: Phaser.GameObjects.Image;
  private bombIcon!: Phaser.GameObjects.Image;
  private bombText!: Phaser.GameObjects.Text;
  private boltIcon!: Phaser.GameObjects.Image;
  private boltText!: Phaser.GameObjects.Text;
  private toast!: Phaser.GameObjects.Text;
  private pauseGroup: Phaser.GameObjects.GameObject[] = [];
  private debugText!: Phaser.GameObjects.Text;

  private dialogGroup: Phaser.GameObjects.GameObject[] = [];
  private dialogLines: string[] = [];
  private dialogPage = 0;
  private dialogSignId = "";
  private dialogBody?: Phaser.GameObjects.Text;
  private dialogMore?: Phaser.GameObjects.Text;
  private typeTimer?: Phaser.Time.TimerEvent;
  private dialogActive = false;

  constructor() { super("UIScene"); }

  create() {
    const W = this.scale.width;
    this.add.rectangle(16, 16, 180, 16, 0x1a1a1a, 0.85).setOrigin(0, 0).setStrokeStyle(2, 0x000000);
    this.hpBarFill = this.add.rectangle(18, 18, 176, 12, 0x2ecc71).setOrigin(0, 0);
    this.hpText = this.add.text(20, 17, "", { fontFamily: "monospace", fontSize: "12px", color: "#ffffff" });
    this.roomText = this.add.text(W - 16, 16, "", { fontFamily: "monospace", fontSize: "14px", color: "#d8c98a" }).setOrigin(1, 0);
    this.enemyText = this.add.text(W - 16, 38, "", { fontFamily: "monospace", fontSize: "12px", color: "#e08a8a" }).setOrigin(1, 0);
    this.bossText = this.add.text(W / 2, 44, "", { fontFamily: "monospace", fontSize: "18px", color: "#e06060", fontStyle: "bold" }).setOrigin(0.5, 0);
    this.toast = this.add.text(W / 2, this.scale.height - 70, "", {
      fontFamily: "monospace", fontSize: "15px", color: "#ffd24a", backgroundColor: "#000000aa", padding: { x: 8, y: 4 },
    }).setOrigin(0.5).setVisible(false);
    this.keyIcon = this.add.image(24, 44, "key_icon").setDepth(5).setVisible(false);
    this.keysText = this.add.text(34, 38, "Keys: 0", { fontFamily: "monospace", fontSize: "12px", color: "#ffe07a" });
    this.bombIcon = this.add.image(24, 60, "bomb").setDepth(5).setVisible(false);
    this.bombText = this.add.text(34, 54, "BOMB [Q]", { fontFamily: "monospace", fontSize: "12px", color: "#ffd24a" }).setVisible(false);
    this.boltIcon = this.add.image(24, 76, "potion_storm").setDepth(5).setVisible(false);
    this.boltText = this.add.text(34, 70, "BOLTS [Q]", { fontFamily: "monospace", fontSize: "12px", color: "#9fd0ff" }).setVisible(false);
    this.add.text(W / 2, this.scale.height - 14,
      "WASD/Arrows move  ·  SPACE attack  ·  Q bomb  ·  E interact  ·  P pause  ·  F3 debug",
      { fontFamily: "monospace", fontSize: "11px", color: "#888888" }).setOrigin(0.5, 1);
    this.debugText = this.add.text(16, 88, "", {
      fontFamily: "monospace", fontSize: "11px", color: "#7fff7f", backgroundColor: "#000000aa", padding: { x: 4, y: 2 },
    }).setVisible(false);

    const g = this.game.events;
    g.on("ui:hp", this.onHp, this);
    g.on("ui:room", this.onRoom, this);
    g.on("ui:bossname", this.onBoss, this);
    g.on("ui:enemies", this.onEnemies, this);
    g.on("ui:keys", this.onKeys, this);
    g.on("ui:bomb", this.onBomb, this);
    g.on("ui:bolt", this.onBolt, this);
    g.on("ui:toast", this.onToast, this);
    g.on("ui:locked", this.onLocked, this);
    g.on("ui:nokey", this.onNoKey, this);
    g.on("ui:doorprompt", this.onDoorPrompt, this);
    g.on("ui:unlocked", this.onUnlocked, this);
    g.on("ui:cleared", this.onCleared, this);
    g.on("ui:paused", this.onPaused, this);
    g.on("ui:debugToggle", this.onDebugToggle, this);
    g.on("ui:debug", this.onDebug, this);
    g.on("ui:dialog", this.openDialog, this);
    g.on("ui:victory", this.showVictory, this);
    g.on("ui:victory2", this.showVictory2, this);

    this.input.keyboard!.on("keydown-E", () => this.advanceDialog());
    this.input.keyboard!.on("keydown-SPACE", () => this.advanceDialog());
    this.input.keyboard!.on("keydown-ENTER", () => this.advanceDialog());

    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      g.off("ui:hp", this.onHp, this); g.off("ui:room", this.onRoom, this);
      g.off("ui:bossname", this.onBoss, this); g.off("ui:enemies", this.onEnemies, this);
      g.off("ui:keys", this.onKeys, this); g.off("ui:bomb", this.onBomb, this);
      g.off("ui:bolt", this.onBolt, this);
      g.off("ui:toast", this.onToast, this);
      g.off("ui:locked", this.onLocked, this); g.off("ui:nokey", this.onNoKey, this);
      g.off("ui:doorprompt", this.onDoorPrompt, this); g.off("ui:unlocked", this.onUnlocked, this);
      g.off("ui:cleared", this.onCleared, this);
      g.off("ui:paused", this.onPaused, this); g.off("ui:debugToggle", this.onDebugToggle, this);
      g.off("ui:debug", this.onDebug, this); g.off("ui:dialog", this.openDialog, this);
      g.off("ui:victory", this.showVictory, this);
    });
  }

  private onHp(d: { hp: number; maxHp: number; name: string }) {
    const frac = Phaser.Math.Clamp(d.hp / d.maxHp, 0, 1);
    this.hpBarFill.width = 176 * frac;
    this.hpBarFill.fillColor = frac > 0.5 ? 0x2ecc71 : frac > 0.25 ? 0xe0b040 : 0xe04040;
    this.hpText.setText(`${d.name}  ${Math.ceil(d.hp)}/${d.maxHp}`);
  }
  private onRoom(name: string) { this.roomText.setText(name); }
  private onBoss(name: string) { this.bossText.setText(name); }
  private onEnemies(n: number) { this.enemyText.setText(n > 0 ? `Enemies left: ${n}` : ""); }
  private onKeys(n: number) { this.keysText.setText(`Keys: ${n}`); this.keyIcon.setVisible(n > 0); }
  private onBomb(n: number) {
    const has = n > 0;
    this.bombText.setText(`BOMBS [Q]: ${n}`);
    this.bombIcon.setVisible(has);
    this.bombText.setVisible(has);
  }

  private onBolt(n: number) {
    const has = n > 0 || n === -1;               // -1 = storm mastery (unlimited)
    this.boltText.setText(n === -1 ? "BOLTS [Q]: \u221E" : `BOLTS [Q]: ${n}`);
    this.boltIcon.setVisible(has);
    this.boltText.setVisible(has);
  }

  private onToast(msg: string) { this.flashToast(msg, "#9fd0ff"); }

  private flashToast(msg: string, color = "#ffd24a") {
    this.toast.setText(msg).setColor(color).setVisible(true).setAlpha(1);
    this.tweens.killTweensOf(this.toast);
    this.tweens.add({ targets: this.toast, alpha: 0, delay: 900, duration: 500,
      onComplete: () => this.toast.setVisible(false) });
  }
  private onLocked() { this.flashToast("The door won't budge — clear the room first.", "#e0b040"); }
  private onNoKey() { this.flashToast("It's locked tight. You need a key.", "#e0b040"); }
  private onDoorPrompt() { this.flashToast("A locked door. Press E to use a key.", "#ffd24a"); }
  private onUnlocked() { this.flashToast("The lock clicks open.", "#7fe07f"); }
  private onCleared() { this.flashToast("Room cleared. The way is open.", "#7fe07f"); }

  private onPaused(paused: boolean) {
    if (paused) {
      const W = this.scale.width, H = this.scale.height;
      const bg = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.6);
      const t = this.add.text(W / 2, H / 2, "PAUSED", { fontFamily: "monospace", fontSize: "40px", color: "#ffffff", fontStyle: "bold" }).setOrigin(0.5);
      const s = this.add.text(W / 2, H / 2 + 40, "Press P or ESC to resume", { fontFamily: "monospace", fontSize: "14px", color: "#bbbbbb" }).setOrigin(0.5);
      this.pauseGroup = [bg, t, s];
    } else {
      this.pauseGroup.forEach((o) => o.destroy());
      this.pauseGroup = [];
    }
  }

  private onDebugToggle(on: boolean) { this.debugText.setVisible(on); if (!on) this.debugText.setText(""); }
  private onDebug(d: { fps: number; entities: number; x: number; y: number; room: string }) {
    this.debugText.setText(`FPS ${d.fps}\nroom ${d.room}\nenemies ${d.entities}\nx ${d.x} y ${d.y}`);
  }

  // -------- dialog --------
  private openDialog(payload: DialogPayload) {
    if (this.dialogActive) return;
    this.dialogActive = true;
    this.dialogLines = payload.lines;
    this.dialogPage = 0;
    this.dialogSignId = payload.signId;
    const W = this.scale.width, H = this.scale.height, panelH = 170;
    const panel = this.add.rectangle(W / 2, H - panelH / 2 - 12, W - 40, panelH, 0x10100c, 0.95).setStrokeStyle(2, 0xd8c98a);
    const title = this.add.text(40, H - panelH - 2, payload.title, { fontFamily: "monospace", fontSize: "14px", color: "#d8c98a", fontStyle: "italic" });
    this.dialogBody = this.add.text(40, H - panelH + 24, "", { fontFamily: "monospace", fontSize: "15px", color: "#f0ead8", wordWrap: { width: W - 84 }, lineSpacing: 5 });
    this.dialogMore = this.add.text(W - 44, H - 30, "E ▸", { fontFamily: "monospace", fontSize: "12px", color: "#d8c98a" }).setOrigin(1, 1).setVisible(false);
    this.dialogGroup = [panel, title, this.dialogBody, this.dialogMore];
    this.typePage();
  }
  private typePage() {
    const full = this.dialogLines[this.dialogPage] ?? "";
    let i = 0;
    this.dialogBody!.setText("");
    this.dialogMore!.setVisible(false);
    this.typeTimer?.remove();
    this.typeTimer = this.time.addEvent({ delay: 14, repeat: full.length - 1,
      callback: () => { i++; this.dialogBody!.setText(full.slice(0, i)); if (i >= full.length) this.finishPage(); } });
    if (full.length === 0) this.finishPage();
  }
  private finishPage() {
    this.typeTimer?.remove();
    this.dialogBody!.setText(this.dialogLines[this.dialogPage] ?? "");
    const last = this.dialogPage >= this.dialogLines.length - 1;
    this.dialogMore!.setText(last ? "E ✕" : "E ▸").setVisible(true);
  }
  private advanceDialog() {
    if (!this.dialogActive) return;
    const full = this.dialogLines[this.dialogPage] ?? "";
    if (this.dialogBody && this.dialogBody.text.length < full.length) { this.finishPage(); return; }
    if (this.dialogPage < this.dialogLines.length - 1) { this.dialogPage++; this.typePage(); }
    else this.closeDialog();
  }
  private closeDialog() {
    this.dialogGroup.forEach((o) => o.destroy());
    this.dialogGroup = [];
    this.dialogActive = false;
    this.game.events.emit("ui:dialogClosed", this.dialogSignId);
  }

  // -------- victory: quest complete (end of Level 2) --------
  private showVictory2() {
    const W = this.scale.width, H = this.scale.height;
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.78);
    this.add.text(W / 2, H / 2 - 100, "THE THREEFOLD BEAST IS DEFEATED", { fontFamily: "monospace", fontSize: "24px", color: "#ffe97f", fontStyle: "bold" }).setOrigin(0.5);
    this.add.text(W / 2, H / 2 - 52, "LEVEL 2 COMPLETE — QUEST FINISHED", { fontFamily: "monospace", fontSize: "18px", color: "#ffffff" }).setOrigin(0.5);
    const names = HERO_ORDER.map((k) => HEROES[k].name).join("  ·  ");
    this.add.text(W / 2, H / 2 + 4, `Heroes of the Quest:\n${names}`, { fontFamily: "monospace", fontSize: "14px", color: "#a8d8a8", align: "center", lineSpacing: 8 }).setOrigin(0.5);
    const again = this.add.text(W / 2, H / 2 + 84, "Press R to return to the title", { fontFamily: "monospace", fontSize: "13px", color: "#888888" }).setOrigin(0.5);
    this.tweens.add({ targets: again, alpha: 0.3, yoyo: true, repeat: -1, duration: 700 });
    this.input.keyboard!.once("keydown-R", () => { this.scene.stop("GameScene"); this.scene.start("TitleScene"); this.scene.stop(); });
  }

  // -------- victory (legacy Level 1 overlay, now unused mid-run) --------
  private showVictory() {
    const W = this.scale.width, H = this.scale.height;
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.75);
    this.add.text(W / 2, H / 2 - 90, "THE HALLUCINATOR IS DEFEATED", { fontFamily: "monospace", fontSize: "26px", color: "#ffe97f", fontStyle: "bold" }).setOrigin(0.5);
    this.add.text(W / 2, H / 2 - 40, "LEVEL 1 COMPLETE", { fontFamily: "monospace", fontSize: "18px", color: "#ffffff" }).setOrigin(0.5);
    const names = HERO_ORDER.map((k) => HEROES[k].name).join("  ·  ");
    this.add.text(W / 2, H / 2 + 14, `Heroes of the Quest:\n${names}`, { fontFamily: "monospace", fontSize: "14px", color: "#a8d8a8", align: "center", lineSpacing: 8 }).setOrigin(0.5);
    const again = this.add.text(W / 2, H / 2 + 90, "Press R to return to the title", { fontFamily: "monospace", fontSize: "13px", color: "#888888" }).setOrigin(0.5);
    this.tweens.add({ targets: again, alpha: 0.3, yoyo: true, repeat: -1, duration: 700 });
    this.input.keyboard!.once("keydown-R", () => { this.scene.stop("GameScene"); this.scene.start("TitleScene"); this.scene.stop(); });
  }
}
