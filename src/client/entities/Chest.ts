import Phaser from "phaser";

// A simple treasure chest. Bobs idly with a glow outline until the player
// interacts (E / tap), then opens, gleams, grants a key, and vanishes.
export class Chest extends Phaser.Physics.Arcade.Sprite {
  opened = false;
  onOpened?: () => void;
  private glow?: Phaser.GameObjects.Sprite;
  private hint: Phaser.GameObjects.Text;
  private bob?: Phaser.Tweens.Tween;
  private baseY: number;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "chest_closed");
    this.baseY = y;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(6).setScale(1.3);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.moves = false;

    // glow outline: a larger, tinted copy pulsing behind the chest
    this.glow = scene.add.sprite(x, y, "chest_closed")
      .setDepth(5).setScale(1.6).setTint(0xffe070).setAlpha(0.3);
    scene.tweens.add({ targets: this.glow, alpha: { from: 0.15, to: 0.45 },
      duration: 700, yoyo: true, repeat: -1, ease: "Sine.inOut" });

    // idle bob
    this.bob = scene.tweens.add({ targets: this, y: y - 3,
      duration: 650, yoyo: true, repeat: -1, ease: "Sine.inOut" });

    this.hint = scene.add.text(x, y - 16, "E", {
      fontFamily: "monospace", fontSize: "10px", color: "#ffe97f",
      backgroundColor: "#00000088", padding: { x: 3, y: 1 },
    }).setOrigin(0.5).setDepth(60).setVisible(false);
  }

  setHint(v: boolean) { if (this.hint.active) this.hint.setVisible(v && !this.opened); }

  canInteract(px: number, py: number): boolean {
    return !this.opened && this.active &&
      Phaser.Math.Distance.Between(px, py, this.x, this.baseY) < 24;
  }

  open() {
    if (this.opened) return;
    this.opened = true;
    this.bob?.stop();
    this.glow?.destroy();
    this.hint.destroy();
    this.setTexture("chest_open");

    // a key gleams upward out of the chest
    const gleam = this.scene.add.sprite(this.x, this.baseY - 4, "key_icon").setDepth(20);
    this.scene.tweens.add({ targets: gleam, y: this.baseY - 22, alpha: { from: 1, to: 0 },
      scale: 1.5, duration: 600, onComplete: () => gleam.destroy() });
    this.scene.tweens.add({ targets: this, scaleX: 1.5, duration: 110, yoyo: true });

    this.onOpened?.();
    this.scene.time.delayedCall(450, () => this.destroy());
  }

  destroy(fromScene?: boolean) {
    this.glow?.destroy();
    if (this.hint && this.hint.active) this.hint.destroy();
    super.destroy(fromScene);
  }
}
