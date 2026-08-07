import Phaser from "phaser";
import { ENEMY_DEFS, EnemyKind, EnemyDef } from "../config/enemies";

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  kind: EnemyKind;
  def: EnemyDef;
  hp: number;
  dying = false;                       // <-- freeze fix: set the moment it dies
  netUntil = 0;                        // while netted: no move, no shoot, extra hurt
  private hpBar: Phaser.GameObjects.Graphics;
  private aiTimer = 0;
  private stunUntil = 0;
  private retreatUntil = 0;
  private lungeUntil = 0;
  private shootTimer = 0;
  private summonTimer = 0;
  // Level-2 beast state
  private chargeUntil = 0;      // charger: locked-direction charge window
  private tiredUntil = 0;       // charger: post-charge punish window
  private chargeDir = { x: 0, y: 0 };
  private orbitDir = Math.random() < 0.5 ? 1 : -1;   // pack: clockwise or counter
  private howlTimer = 3000;     // pack alpha: reinforcement howl
  private ambushState: "hidden" | "telegraph" | "lunge" | "roll" | "cooldown" = "hidden";
  private ambushTimer = 0;
  private chimeraPhase = 0;     // 0=bear 1=wolf 2=gator (by remaining HP)
  onShoot?: (x: number, y: number, dirX: number, dirY: number) => void;
  onSummon?: (x: number, y: number) => void;
  onHitPlayer?: () => void;
  onPhaseChange?: (phase: number) => void;

  constructor(scene: Phaser.Scene, x: number, y: number, kind: EnemyKind) {
    super(scene, x, y, ENEMY_DEFS[kind].texture ?? "tiles",
      ENEMY_DEFS[kind].texture ? undefined : ENEMY_DEFS[kind].frame);
    this.kind = kind;
    this.def = ENEMY_DEFS[kind];
    this.hp = this.def.hp;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setScale(this.def.scale);
    if (this.def.tint !== undefined) this.setTint(this.def.tint);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(12 * this.def.scale, 12 * this.def.scale);
    if (this.def.pattern === "bat") body.setBounce(1, 1);
    if (this.def.pattern === "turret") body.setImmovable(true);
    if (this.def.pattern === "ambush") this.setAlpha(0.35);   // lurking below the surface
    this.hpBar = scene.add.graphics();
    this.hpBar.setDepth(50);
    this.drawHpBar();
  }

  private drawHpBar() {
    // Guard: never touch a torn-down bar (this was the freeze).
    if (this.dying || !this.hpBar || !this.hpBar.active) return;
    const w = this.def.hpBarWidth;
    this.hpBar.clear();
    if (this.hp >= this.def.hp) return;
    this.hpBar.fillStyle(0x222222, 0.8);
    this.hpBar.fillRect(this.x - w / 2, this.y - 12 * this.def.scale, w, 3);
    this.hpBar.fillStyle(0xe04040, 1);
    this.hpBar.fillRect(this.x - w / 2, this.y - 12 * this.def.scale, w * Math.max(this.hp, 0) / this.def.hp, 3);
  }

  takeHit(damage: number, fromX: number, fromY: number): boolean {
    if (this.dying) return false;       // already dead, ignore
    this.hp -= damage;
    this.stunUntil = this.scene.time.now + 220;
    const angle = Math.atan2(this.y - fromY, this.x - fromX);
    const netted = this.scene.time.now < this.netUntil;
    const kb = this.def.pattern === "turret" || netted ? 0 : this.def.pattern === "boss" ? 40 : 150;
    this.setVelocity(Math.cos(angle) * kb, Math.sin(angle) * kb);
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(90, () => { if (this.active) this.restoreBaseTint(); });
    if (this.hp <= 0) { this.die(); return true; }
    this.drawHpBar();
    return false;
  }

  private die() {
    this.dying = true;                  // <-- gate everything off first
    if (this.hpBar && this.hpBar.active) this.hpBar.destroy();
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) body.enable = false;
    this.scene.tweens.add({
      targets: this, alpha: 0, scale: this.def.scale * 1.4, duration: 220,
      onComplete: () => this.destroy(),
    });
  }

  // Clear a flash tint without losing the enemy's base color (fire/ice wardens).
  private restoreBaseTint() {
    if (this.def.tint !== undefined) this.setTint(this.def.tint);
    else this.clearTint();
  }

  updateAI(time: number, delta: number, player: Phaser.Physics.Arcade.Sprite) {
    if (this.dying || !this.active || !this.body) return;
    this.drawHpBar();
    if (time < this.netUntil) { this.setVelocity(0, 0); return; }
    if (time < this.stunUntil) return;

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);
    const nx = dist > 0 ? dx / dist : 0;
    const ny = dist > 0 ? dy / dist : 0;

    switch (this.def.pattern) {
      case "bat": {
        this.aiTimer -= delta;
        this.shootTimer -= delta;
        if (this.aiTimer <= 0) {
          this.aiTimer = 1800 + Math.random() * 900;
          this.setVelocity(nx * this.def.speed, ny * this.def.speed);
        }
        // Bat fires spread bursts every 2s (ranged wardens only; minions have no onShoot)
        if (this.shootTimer <= 0 && dist < 250 && this.onShoot) {
          this.shootTimer = 2000 + Math.random() * 500;
          this.setTintFill(0xffff00);
          this.scene.time.delayedCall(200, () => {
            if (this.active) this.restoreBaseTint();
            if (this.active && this.onShoot) {
              const base = Math.atan2(dy, dx);
              for (const off of [-0.4, 0, 0.4]) {
                this.onShoot(this.x, this.y, Math.cos(base + off), Math.sin(base + off));
              }
            }
          });
        }
        const b = this.body as Phaser.Physics.Arcade.Body;
        if (b.velocity.length() < this.def.speed * 0.7) {
          b.velocity.normalize().scale(this.def.speed);
        }
        break;
      }
      case "rat": {
        this.shootTimer -= delta;
        const retreating = time < this.retreatUntil;
        if (retreating) this.setVelocity(-nx * this.def.speed, -ny * this.def.speed);
        else if (dist < 140) this.setVelocity(nx * this.def.speed, ny * this.def.speed);
        else this.setVelocity(0, 0);
        // Ranged wardens (have onShoot): telegraphed burst — backward while retreating,
        // forward (toward the player) while advancing. Minions have no onShoot, so they stay melee.
        if (this.onShoot && this.shootTimer <= 0 && (retreating || dist < 280)) {
          this.shootTimer = this.def.shootCooldownMs ?? 1500;
          const sx = retreating ? -dx : dx;
          const sy = retreating ? -dy : dy;
          this.setTintFill(0xffff00);
          this.scene.time.delayedCall(200, () => {
            if (!this.active) return;
            this.restoreBaseTint();
            if (this.onShoot) {
              const base = Math.atan2(sy, sx);
              for (const off of [-0.25, 0, 0.25]) {
                this.onShoot(this.x, this.y, Math.cos(base + off), Math.sin(base + off));
              }
            }
          });
        }
        break;
      }
      case "blob": {
        this.aiTimer -= delta;
        this.shootTimer -= delta;
        if (time < this.lungeUntil) { /* keep lunge velocity */ }
        else if (this.aiTimer <= 0 && dist < 170) {
          this.aiTimer = 2600 + Math.random() * 1200;
          this.lungeUntil = time + 450;
          this.setTintFill(0xffff00);
          this.scene.time.delayedCall(200, () => {
            if (this.active) this.restoreBaseTint();
            if (this.active) this.setVelocity(nx * this.def.speed * 4.5, ny * this.def.speed * 4.5);
            // After lunge lands, fire shockwave
            if (this.onShoot && this.active) {
              this.shootTimer = 2000;
              this.onShoot(this.x, this.y, nx, ny);
            }
          });
        } else if (dist < 200) this.setVelocity(nx * this.def.speed, ny * this.def.speed);
        else this.setVelocity(0, 0);
        break;
      }
      case "turret": {
        this.setVelocity(0, 0);
        this.shootTimer -= delta;
        if (this.shootTimer <= 0 && this.onShoot && dist < 340) {
          this.shootTimer = this.def.shootCooldownMs ?? 2200;
          this.setTintFill(0xffff00);
          this.scene.time.delayedCall(250, () => {
            if (!this.active) return;
            this.restoreBaseTint();
            if (this.onShoot) {
              const base = Math.atan2(player.y - this.y, player.x - this.x);
              for (const off of [-0.3, 0, 0.3]) {
                this.onShoot(this.x, this.y, Math.cos(base + off), Math.sin(base + off));
              }
            }
          });
        }
        break;
      }
      case "charger": {
        // BEAR: lumber, telegraph red, then a locked charge; tired afterwards.
        this.aiTimer -= delta;
        if (time < this.chargeUntil) {
          this.setVelocity(this.chargeDir.x * this.def.speed * 4.2, this.chargeDir.y * this.def.speed * 4.2);
          break;
        }
        if (time < this.tiredUntil) { this.setVelocity(0, 0); break; }   // punish window
        if (this.aiTimer <= 0 && dist < 220) {
          this.aiTimer = 2600 + Math.random() * 900;
          this.setTintFill(0xff7050);                      // TELL: seeing red
          this.chargeDir = { x: nx, y: ny };               // direction locks at the tell
          this.setVelocity(0, 0);
          this.scene.time.delayedCall(380, () => {
            if (!this.active || this.dying) return;
            this.restoreBaseTint();
            this.chargeUntil = this.scene.time.now + 620;
            this.tiredUntil = this.chargeUntil + 850;
          });
        } else {
          this.setVelocity(nx * this.def.speed * 0.8, ny * this.def.speed * 0.8);
        }
        break;
      }
      case "pack": {
        // WOLF: orbit at claw's length, take turns lunging; the alpha howls in pups.
        this.aiTimer -= delta;
        this.howlTimer -= delta;
        if (time < this.lungeUntil) break;                 // keep lunge velocity
        const ring = 78;
        const px = -ny * this.orbitDir, py = nx * this.orbitDir;         // perpendicular
        const inward = (dist - ring) / ring;                             // spring toward the ring
        if (dist < 320) {
          this.setVelocity(
            (px + nx * inward) * this.def.speed,
            (py + ny * inward) * this.def.speed,
          );
        } else this.setVelocity(0, 0);
        if (this.aiTimer <= 0 && dist < 200) {
          this.aiTimer = 2200 + Math.random() * 1100;
          if (Math.random() < 0.3) this.orbitDir *= -1;    // switch flanks unpredictably
          this.setTintFill(0xffffff);
          this.scene.time.delayedCall(220, () => {
            if (!this.active || this.dying) return;
            this.restoreBaseTint();
            this.lungeUntil = this.scene.time.now + 420;
            this.setVelocity(nx * this.def.speed * 2.4, ny * this.def.speed * 2.4);
          });
        }
        // Alpha's howl: only wolves with onSummon (the pack leader / chimera) call pups.
        if (this.onSummon && this.howlTimer <= 0) {
          this.howlTimer = 7000;
          this.setTintFill(0xd8e8ff);
          this.scene.time.delayedCall(300, () => {
            if (!this.active || this.dying) return;
            this.restoreBaseTint();
            if (this.onSummon) { this.onSummon(this.x - 20, this.y); this.onSummon(this.x + 20, this.y); }
          });
        }
        break;
      }
      case "ambush": {
        // GATOR: lurk near-invisible → telegraph → lunge → death roll → re-submerge.
        this.ambushTimer -= delta;
        switch (this.ambushState) {
          case "hidden":
            this.setVelocity(0, 0);
            this.setAngle(0);
            if (dist < 135) {
              this.ambushState = "telegraph";
              this.ambushTimer = 340;
              this.setAlpha(1);
              this.setTintFill(0xffe060);
              this.chargeDir = { x: nx, y: ny };
            }
            break;
          case "telegraph":
            this.setVelocity(0, 0);
            if (this.ambushTimer <= 0) {
              this.restoreBaseTint();
              this.ambushState = "lunge";
              this.ambushTimer = 480;
              this.setVelocity(this.chargeDir.x * this.def.speed * 3.4, this.chargeDir.y * this.def.speed * 3.4);
            }
            break;
          case "lunge":
            if (this.ambushTimer <= 0) { this.ambushState = "roll"; this.ambushTimer = 800; }
            break;
          case "roll": {
            // death roll — spinning menace, drifting toward the player
            this.setAngle(this.angle + delta * 0.9);
            this.setVelocity(nx * this.def.speed * 0.9, ny * this.def.speed * 0.9);
            if (this.ambushTimer <= 0) { this.ambushState = "cooldown"; this.ambushTimer = 1400; this.setAngle(0); this.setAlpha(0.35); }
            break;
          }
          case "cooldown":
            this.setVelocity(0, 0);
            if (this.ambushTimer <= 0) this.ambushState = "hidden";
            break;
        }
        break;
      }
      case "chimera": {
        // THE THREEFOLD BEAST — bear head leads, then wolf, then gator, as it bleeds.
        const frac = this.hp / this.def.hp;
        const phase = frac > 2 / 3 ? 0 : frac > 1 / 3 ? 1 : 2;
        if (phase !== this.chimeraPhase) {
          this.chimeraPhase = phase;
          this.onPhaseChange?.(phase);
          this.aiTimer = 600;               // brief stagger between forms
          this.setVelocity(0, 0);
        }
        // tri-burst fire in every phase; gator phase fires faster
        this.shootTimer -= delta;
        const cd = (this.def.shootCooldownMs ?? 2600) * (phase === 2 ? 0.6 : 1);
        if (this.shootTimer <= 0 && this.onShoot && dist < 320) {
          this.shootTimer = cd;
          const base = Math.atan2(dy, dx);
          for (const off of [-0.35, 0, 0.35]) this.onShoot(this.x, this.y, Math.cos(base + off), Math.sin(base + off));
        }
        if (phase === 0) {
          // bear form: charges
          this.aiTimer -= delta;
          if (time < this.chargeUntil) { this.setVelocity(this.chargeDir.x * this.def.speed * 3.8, this.chargeDir.y * this.def.speed * 3.8); break; }
          if (time < this.tiredUntil) { this.setVelocity(0, 0); break; }
          if (this.aiTimer <= 0 && dist < 240) {
            this.aiTimer = 2800 + Math.random() * 800;
            this.setTintFill(0xff7050);
            this.chargeDir = { x: nx, y: ny };
            this.setVelocity(0, 0);
            this.scene.time.delayedCall(400, () => {
              if (!this.active || this.dying) return;
              this.restoreBaseTint();
              this.chargeUntil = this.scene.time.now + 650;
              this.tiredUntil = this.chargeUntil + 900;
            });
          } else this.setVelocity(nx * this.def.speed * 0.7, ny * this.def.speed * 0.7);
        } else if (phase === 1) {
          // wolf form: orbits, lunges, howls in pups
          this.aiTimer -= delta;
          this.howlTimer -= delta;
          if (time < this.lungeUntil) break;
          const ringC = 95;
          const pxC = -ny * this.orbitDir, pyC = nx * this.orbitDir;
          const inw = (dist - ringC) / ringC;
          this.setVelocity((pxC + nx * inw) * this.def.speed * 1.3, (pyC + ny * inw) * this.def.speed * 1.3);
          if (this.aiTimer <= 0) {
            this.aiTimer = 2600 + Math.random() * 900;
            this.setTintFill(0xffffff);
            this.scene.time.delayedCall(220, () => {
              if (!this.active || this.dying) return;
              this.restoreBaseTint();
              this.lungeUntil = this.scene.time.now + 430;
              this.setVelocity(nx * this.def.speed * 2.6, ny * this.def.speed * 2.6);
            });
          }
          if (this.onSummon && this.howlTimer <= 0) {
            this.howlTimer = 6500;
            this.onSummon(this.x - 24, this.y);
            this.onSummon(this.x + 24, this.y);
          }
        } else {
          // gator form: relentless ambush lunges with death rolls
          this.ambushTimer -= delta;
          if (this.ambushState === "roll") {
            this.setAngle(this.angle + delta * 1.0);
            this.setVelocity(nx * this.def.speed * 1.1, ny * this.def.speed * 1.1);
            if (this.ambushTimer <= 0) { this.ambushState = "cooldown"; this.ambushTimer = 900; this.setAngle(0); }
          } else if (this.ambushState === "lunge") {
            if (this.ambushTimer <= 0) { this.ambushState = "roll"; this.ambushTimer = 700; }
          } else if (this.ambushTimer <= 0) {
            this.ambushState = "telegraph";
            this.setTintFill(0xffe060);
            this.chargeDir = { x: nx, y: ny };
            this.setVelocity(0, 0);
            this.scene.time.delayedCall(300, () => {
              if (!this.active || this.dying) return;
              this.restoreBaseTint();
              this.ambushState = "lunge";
              this.ambushTimer = 460;
              this.setVelocity(this.chargeDir.x * this.def.speed * 3.2, this.chargeDir.y * this.def.speed * 3.2);
            });
          } else this.setVelocity(nx * this.def.speed * 0.5, ny * this.def.speed * 0.5);
        }
        break;
      }
      case "boss": {
        this.aiTimer -= delta;
        if (this.aiTimer <= 0 && dist < 200) {
          // TELL: flash yellow, freeze, then lunge
          this.aiTimer = 3000;
          this.setTintFill(0xffff00);  // yellow flash
          this.scene.time.delayedCall(300, () => {
            if (this.active) this.restoreBaseTint();
            if (this.active) this.setVelocity(nx * this.def.speed * 1.2, ny * this.def.speed * 1.2);
          });
        } else {
          this.setVelocity(nx * this.def.speed * 0.4, ny * this.def.speed * 0.4);  // idle prowl
        }
        this.shootTimer -= delta;
        if (this.shootTimer <= 0 && this.onShoot) {
          this.shootTimer = 2400;
          const base = Math.atan2(dy, dx);
          for (const off of [-0.35, 0, 0.35]) {
            this.onShoot(this.x, this.y, Math.cos(base + off), Math.sin(base + off));
          }
        }
        if (this.hp <= this.def.hp / 2) {
          this.summonTimer -= delta;
          if (this.summonTimer <= 0 && this.onSummon) {
            this.summonTimer = 8000;
            this.onSummon(this.x - 24, this.y);
            this.onSummon(this.x + 24, this.y);
          }
        }
        break;
      }
    }
  }

  startRetreat(until: number) { this.retreatUntil = until; }

  destroy(fromScene?: boolean) {
    if (this.hpBar && this.hpBar.active) this.hpBar.destroy();
    super.destroy(fromScene);
  }
}
