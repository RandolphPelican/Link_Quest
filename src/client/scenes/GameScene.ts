import Phaser from "phaser";
import { HEROES, HeroDef, SPEED_PER_SP } from "../config/heroes";
import { ENEMY_DEFS, EnemyKind, BOSS_NAME } from "../config/enemies";
import { SIGNS } from "../config/signs";
import { Enemy } from "../entities/Enemy";
import { Chest } from "../entities/Chest";

const COLLIDING_GIDS = [15, 56, 57, 73, 75, 90];
const SIGN_FRAME = 66;
const HEART_FRAME = 115;

export const ROOM_NAMES: Record<string, string> = {
  room1: "The Old Cellar",
  room2: "The Long Hall",
  room3: "The Gatehouse",
  boss: "The Hallucinator's Lair",
};

interface SceneData { room: string; spawn: string; heroKey: string; hp?: number; keys?: number; bombCount?: number; }
interface SignZone { zone: Phaser.GameObjects.Zone; signId: string; hint: Phaser.GameObjects.Text; }
interface Door {
  rect: Phaser.Geom.Rectangle; target: string; spawn: string;
  locked: boolean; opened: boolean; lockIcon?: Phaser.GameObjects.Sprite;
}

export class GameScene extends Phaser.Scene {
  private roomKey = "room1";
  private spawnName = "spawn_default";
  private heroKey = "Lincoln";
  private hero!: HeroDef;

  private player!: Phaser.Physics.Arcade.Sprite;
  private hp = 0;
  private maxHp = 0;
  private invulnUntil = 0;
  private lastAttackAt = 0;
  private facing = new Phaser.Math.Vector2(1, 0);
  private dead = false;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;

  private enemies!: Phaser.GameObjects.Group;
  private playerShots!: Phaser.Physics.Arcade.Group;
  private enemyShots!: Phaser.Physics.Arcade.Group;
  private hearts!: Phaser.Physics.Arcade.Group;
  private potions!: Phaser.Physics.Arcade.Group;
  private bombs!: Phaser.Physics.Arcade.Group;
  private layer!: Phaser.Tilemaps.TilemapLayer;

  private signZones: SignZone[] = [];
  private doors: Door[] = [];
  private chests: Chest[] = [];
  private keyCount = 0;
  private potionDropped = false;
  private bombCount = 0;
  private slowedUntil = 0;
  private transitioning = false;
  private dialogOpen = false;
  private signCooldownUntil = 0;
  private doorsLockedUntil = 0;
  private finalSignSpawned = false;
  private roomCleared = false;
  private lockHintAt = 0;
  private lastEnemyCount = -1;

  private paused = false;
  private debugOn = false;
  private crashed = false;

  constructor() { super("GameScene"); }

  init(data: SceneData) {
    this.roomKey = data.room ?? "room1";
    this.spawnName = data.spawn ?? "spawn_default";
    this.heroKey = data.heroKey ?? "Lincoln";
    this.hero = HEROES[this.heroKey];
    this.maxHp = this.hero.hp;
    this.hp = data.hp ?? this.hero.hp;
    this.dead = false;
    this.dialogOpen = false;
    this.paused = false;
    this.signZones = [];
    this.doors = [];
    this.chests = [];
    this.keyCount = data.keys ?? 0;
    this.potionDropped = false;        // guaranteed first-minion potion, per room entry
    this.bombCount = data.bombCount ?? 0;   // carries through doors; lost on death (no data passed)
    this.slowedUntil = 0;
    this.transitioning = false;
    this.finalSignSpawned = false;
    this.roomCleared = false;
    this.lastEnemyCount = -1;
  }

  create() {
    const map = this.make.tilemap({ key: this.roomKey });
    const tileset = map.addTilesetImage("kenney_tiny_dungeon", "tilesheet")!;
    this.layer = map.createLayer("Tile Layer 1", tileset, 0, 0)!;
    this.layer.setCollision(COLLIDING_GIDS);

    this.enemies = this.add.group({ runChildUpdate: false });
    this.playerShots = this.physics.add.group();
    this.enemyShots = this.physics.add.group();
    this.hearts = this.physics.add.group();
    this.potions = this.physics.add.group();
    this.bombs = this.physics.add.group();

    const objLayer = map.getObjectLayer("Objects");
    let spawnX = 64, spawnY = 64;

    for (const o of objLayer?.objects ?? []) {
      const props: Record<string, string> = {};
      for (const p of (o.properties as { name: string; value: string }[]) ?? []) props[p.name] = p.value;
      const cx = (o.x ?? 0) + (o.width ?? 16) / 2;
      const cy = (o.y ?? 0) + (o.height ?? 16) / 2;
      if (o.type === "spawn") {
        if (o.name === this.spawnName) { spawnX = cx; spawnY = cy; }
        if (o.name === "spawn_default" && this.spawnName === "spawn_default") { spawnX = cx; spawnY = cy; }
      } else if (o.type === "door") {
        this.doors.push({ rect: new Phaser.Geom.Rectangle(o.x ?? 0, o.y ?? 0, o.width ?? 16, o.height ?? 16),
          target: props.target, spawn: props.spawn, locked: false, opened: false });
      } else if (o.type === "sign") {
        this.addSign(cx, cy, props.signId);
      } else if (o.type === "enemy") {
        this.spawnEnemy(cx, cy, props.kind as EnemyKind);
      }
    }

    this.player = this.physics.add.sprite(spawnX, spawnY, "tiles", this.hero.frame);
    this.player.setCollideWorldBounds(true);
    this.player.setScale(1.5);
    (this.player.body as Phaser.Physics.Arcade.Body).setSize(11, 12);
    this.player.setDepth(10);
    this.physics.add.collider(this.player, this.layer);
    this.physics.add.collider(this.enemies, this.layer);
    this.physics.add.collider(this.playerShots, this.layer, (shot) => shot.destroy());
    this.physics.add.collider(this.enemyShots, this.layer, (shot) => shot.destroy());

    this.physics.add.overlap(this.playerShots, this.enemies, (a, b) => {
      // order-independent: whichever overlapping object is the Enemy takes the hit
      const enemy = (a instanceof Enemy ? a : b) as Enemy;
      const s = (a instanceof Enemy ? b : a) as Phaser.Physics.Arcade.Sprite;
      if (!(enemy instanceof Enemy) || enemy.dying) return;
      const dmg = s.getData("damage") as number;
      s.destroy();
      this.damageEnemy(enemy, dmg, s.x, s.y);
    });
    this.physics.add.overlap(this.enemyShots, this.player, (a, b) => {
      // overlap order is (enemyShot, player); destroy the shot, never the player
      const shot = (a === this.player ? b : a) as Phaser.Physics.Arcade.Sprite;
      const isIce = shot.getData("ice") === true;
      shot.destroy();
      this.damagePlayer(ENEMY_DEFS.boss.damage - 1);
      if (isIce) {                               // ice warden: chill the player
        this.slowedUntil = this.time.now + 1500;
        this.cameras.main.flash(150, 60, 130, 220);
      }
    });
    this.physics.add.overlap(this.player, this.enemies, (_p, enemyObj) => {
      const enemy = enemyObj as Enemy;
      if (!enemy.active || enemy.dying) return;
      if (this.damagePlayer(enemy.def.damage)) {
        if (enemy.def.pattern === "rat") enemy.startRetreat(this.time.now + 1100);
        // HIT-STOP: freeze physics for 80ms on hit
        if (enemy.def.pattern === "boss") {
          this.physics.world.timeScale = 0.2;
          this.time.delayedCall(80, () => { this.physics.world.timeScale = 1; });
        }
      }
    });
    this.physics.add.overlap(this.player, this.hearts, (_p, h) => {
      (h as Phaser.GameObjects.GameObject).destroy();
      this.hp = Math.min(this.maxHp, this.hp + 10);
      this.emitHp();
    });
    this.physics.add.overlap(this.player, this.potions, (_p, potion) => {
      (potion as Phaser.GameObjects.GameObject).destroy();
      this.hp = Math.min(this.maxHp, this.hp + 20);
      this.emitHp();
    });
    this.physics.add.overlap(this.player, this.bombs, (_p, bomb) => {
      if (this.bombCount >= 2) return;           // hold at most two
      (bomb as Phaser.GameObjects.GameObject).destroy();
      this.bombCount += 1;
      this.game.events.emit("ui:bomb", this.bombCount);
    });
    const bombSpot: Record<string, [number, number]> = { room1: [11, 2], room3: [12, 15] };
    const spot = bombSpot[this.roomKey];
    if (spot) this.spawnBombPickup(spot[0], spot[1]);  // mid-room reward / boss-prep refill

    this.doorsLockedUntil = this.time.now + 600;
    this.roomCleared = this.enemies.countActive() === 0;
    this.markLockedDoors();
    this.input.on("pointerdown", this.onPointerDown, this);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = this.input.keyboard!.addKeys("W,A,S,D,E,J,Q,SPACE,R,P,ESC,F3") as Record<string, Phaser.Input.Keyboard.Key>;

    this.cameras.main.setZoom(2.5);
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.fadeIn(250, 0, 0, 0);

    this.emitHp();
    this.game.events.emit("ui:keys", this.keyCount);
    this.game.events.emit("ui:bomb", this.bombCount);
    this.game.events.emit("ui:room", ROOM_NAMES[this.roomKey] ?? this.roomKey);
    this.game.events.emit("ui:enemies", this.enemies.countActive());
    if (this.roomKey === "boss") this.game.events.emit("ui:bossname", BOSS_NAME);

    this.game.events.off("ui:dialogClosed", this.onDialogClosed, this);
    this.game.events.on("ui:dialogClosed", this.onDialogClosed, this);

    // restore debug draw state across room restarts
    if (this.debugOn) this.enablePhysicsDebug(true);
  }

  // -------- signs --------
  private addSign(x: number, y: number, signId: string) {
    this.add.image(x, y, "tiles", SIGN_FRAME).setDepth(5);
    const zone = this.add.zone(x, y, 28, 28);
    const hint = this.add.text(x, y - 14, "E", {
      fontFamily: "monospace", fontSize: "10px", color: "#ffe97f",
      backgroundColor: "#00000088", padding: { x: 3, y: 1 },
    }).setOrigin(0.5).setDepth(60).setVisible(false);
    this.signZones.push({ zone, signId, hint });
  }

  private tryReadSign() {
    for (const s of this.signZones) {
      if (s.zone.getBounds().contains(this.player.x, this.player.y)) {
        const def = SIGNS[s.signId];
        if (!def) return;
        this.dialogOpen = true;
        this.physics.world.pause();
        this.player.setVelocity(0, 0);
        this.game.events.emit("ui:dialog", { title: def.title, lines: def.lines, signId: s.signId });
        return;
      }
    }
  }

  private onDialogClosed(signId: string) {
    this.dialogOpen = false;
    this.signCooldownUntil = this.time.now + 300;
    if (!this.paused) this.physics.world.resume();
    if (signId === "sign_final") this.game.events.emit("ui:victory");
  }

  // -------- enemies --------
  private spawnEnemy(x: number, y: number, kind: EnemyKind) {
    const e = new Enemy(this, x, y, kind);
    this.enemies.add(e);
    if (kind === "boss") {
      e.onShoot = (sx, sy, dx, dy) => this.fireEnemyShot(sx, sy, dx, dy);
      e.onSummon = (sx, sy) => { if (this.enemies.countActive() < 6) this.spawnEnemy(sx, sy, "red_bat"); };
    }
    if (kind === "warden_blob" || kind === "warden_bat" || kind === "warden_rat") {
      e.onShoot = (sx, sy, dx, dy) => this.fireEnemyShot(sx, sy, dx, dy);
    } else if (kind === "warden_rat_fire") {
      e.onShoot = (sx, sy, dx, dy) => this.fireEnemyShot(sx, sy, dx, dy, 180, "shot_flame", false);
    } else if (kind === "warden_rat_ice") {
      e.onShoot = (sx, sy, dx, dy) => this.fireEnemyShot(sx, sy, dx, dy, 95, "shot_ice", true);
    }
    return e;
  }

  private damageEnemy(enemy: Enemy, dmg: number, fromX: number, fromY: number) {
    if (!enemy.active || enemy.dying) return;
    const died = enemy.takeHit(dmg, fromX, fromY);
    if (died) {
      if (enemy.kind === "boss") this.onBossDefeated(enemy.x, enemy.y);
      else if (enemy.kind.startsWith("warden")) {
        // With multiple wardens in a room, the key drops only when the LAST one falls.
        const anotherWardenAlive = this.enemies.getChildren().some((c) => {
          const e = c as Enemy;
          return e !== enemy && e.active && !e.dying && e.kind.startsWith("warden");
        });
        if (!anotherWardenAlive) this.spawnChest(enemy.x, enemy.y);
      } else if (enemy.kind === "green_blob") {
        // The blob is a guaranteed health source.
        const p = this.potions.create(enemy.x, enemy.y, "potion") as Phaser.Physics.Arcade.Sprite;
        p.setDepth(4);
      } else if (this.roomKey === "room1" && !this.potionDropped) {
        // first minion killed in Room 1 always drops a health potion
        this.potionDropped = true;
        const p = this.potions.create(enemy.x, enemy.y, "potion") as Phaser.Physics.Arcade.Sprite;
        p.setDepth(4);
      } else if (Math.random() < 0.25) {
        const h = this.hearts.create(enemy.x, enemy.y, "tiles", HEART_FRAME) as Phaser.Physics.Arcade.Sprite;
        h.setDepth(4);
      }
    }
  }

  // -------- chests & keys --------
  private spawnChest(x: number, y: number) {
    const c = new Chest(this, x, y);
    c.onOpened = () => {
      this.keyCount += 1;
      this.game.events.emit("ui:keys", this.keyCount);
    };
    this.chests.push(c);
  }

  private openChest(c: Chest) {
    if (c.opened) return;
    c.open();
  }

  private onPointerDown(pointer: Phaser.Input.Pointer) {
    if (this.dead || this.paused || this.dialogOpen) return;
    const wp = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    for (const c of this.chests) {
      if (c.canInteract(this.player.x, this.player.y) &&
          Phaser.Math.Distance.Between(wp.x, wp.y, c.x, c.y) < 26) {
        this.openChest(c);
        return;
      }
    }
  }

  // Forward doors (leading deeper into the dungeon) are key-locked; backtrack doors stay free.
  private markLockedDoors() {
    const order = ["room1", "room2", "room3", "boss"];
    const here = order.indexOf(this.roomKey);
    for (const d of this.doors) {
      d.locked = here >= 0 && order.indexOf(d.target) > here;
      d.opened = false;
      if (d.locked) {
        const icon = this.add.sprite(d.rect.centerX, d.rect.centerY, "lock_icon")
          .setDepth(7).setScale(1.1).setTint(0xe04040);
        this.tweens.add({ targets: icon, scale: 1.25, duration: 600, yoyo: true, repeat: -1, ease: "Sine.inOut" });
        d.lockIcon = icon;
      }
    }
  }

  private transitionTo(d: Door) {
    if (this.transitioning) return;
    this.transitioning = true;
    this.scene.restart({ room: d.target, spawn: d.spawn, heroKey: this.heroKey, hp: this.hp, keys: this.keyCount, bombCount: this.bombCount });
  }

  private onBossDefeated(x: number, y: number) {
    if (this.finalSignSpawned) return;
    this.finalSignSpawned = true;
    this.game.events.emit("ui:bossname", "");
    this.enemies.getChildren().forEach((c) => { const e = c as Enemy; if (e.active && !e.dying) e.takeHit(999, x, y); });
    this.enemyShots.clear(true, true);
    this.cameras.main.flash(400, 255, 255, 255);
    this.time.delayedCall(500, () => {
      const tx = Phaser.Math.Clamp(Math.round(x / 16), 3, 21);
      const ty = Phaser.Math.Clamp(Math.round(y / 16), 3, 14);
      this.addSign(tx * 16 + 8, ty * 16 + 8, "sign_final");
      this.tweens.add({ targets: this.signZones[this.signZones.length - 1].hint, alpha: { from: 0, to: 1 }, duration: 300 });
    });
  }

  // -------- combat --------
  private fireEnemyShot(x: number, y: number, dx: number, dy: number, speed = 130, texKey = "shot_dark", ice = false) {
    const s = this.enemyShots.create(x, y, texKey) as Phaser.Physics.Arcade.Sprite;
    s.setDepth(8);
    if (ice) s.setData("ice", true);
    s.setVelocity(dx * speed, dy * speed);
    this.time.delayedCall(2500, () => { if (s.active) s.destroy(); });
  }

  private attack() {
    const now = this.time.now;
    if (now - this.lastAttackAt < this.hero.attack.cooldownMs) return;
    this.lastAttackAt = now;
    const a = this.hero.attack;
    const fx = this.facing.x, fy = this.facing.y;

    if (a.kind === "melee") {
      const weapon = this.add.image(this.player.x + fx * 12, this.player.y + fy * 12, "tiles", a.weaponFrame!).setDepth(11);
      weapon.setScale(1.8);  // scale weapon up to match bigger player
      weapon.setRotation(Math.atan2(fy, fx) + Math.PI / 4);
      this.tweens.add({ targets: weapon, angle: weapon.angle + 90, alpha: { from: 1, to: 0.2 }, duration: 140,
        onComplete: () => weapon.destroy() });
      const range = 26;
      this.enemies.getChildren().forEach((c) => {
        const e = c as Enemy;
        if (!e.active || e.dying) return;
        const dx = e.x - this.player.x, dy = e.y - this.player.y;
        const dist = Math.hypot(dx, dy);
        if (dist > range + (e.def.scale - 1) * 8) return;
        const dot = (dx * fx + dy * fy) / (dist || 1);
        if (dot > 0.25) this.damageEnemy(e, a.damage, this.player.x, this.player.y);
      });
    } else {
      const texKey = a.projectile === "fireball" ? "shot_fire" : undefined;
      const s = (texKey
        ? this.playerShots.create(this.player.x, this.player.y, texKey)
        : this.playerShots.create(this.player.x, this.player.y, "tiles", a.weaponFrame)
      ) as Phaser.Physics.Arcade.Sprite;
      s.setDepth(8);
      s.setData("damage", a.damage);
      s.setRotation(Math.atan2(fy, fx) + (a.projectile === "dagger" ? Math.PI / 4 : 0));
      s.setVelocity(fx * 230, fy * 230);
      this.time.delayedCall(900, () => { if (s.active) s.destroy(); });
    }
  }

  // -------- pickups: bomb --------
  private spawnBombPickup(tileX: number, tileY: number) {
    const b = this.bombs.create(tileX * 16 + 8, tileY * 16 + 8, "bomb") as Phaser.Physics.Arcade.Sprite;
    b.setDepth(6);
    (b.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    this.tweens.add({ targets: b, y: b.y - 3, duration: 650, yoyo: true, repeat: -1, ease: "Sine.inOut" });
  }

  private detonateBomb() {
    this.bombCount -= 1;
    this.game.events.emit("ui:bomb", this.bombCount);
    const px = this.player.x, py = this.player.y, radius = 80;
    // expanding shockwave ring + white flash
    const ring = this.add.circle(px, py, radius, 0xffd24a, 0).setStrokeStyle(3, 0xffd24a, 0.9).setDepth(12).setScale(0.12);
    this.tweens.add({ targets: ring, scale: 1, alpha: 0, duration: 340, ease: "Cubic.out", onComplete: () => ring.destroy() });
    const flash = this.add.circle(px, py, radius, 0xffffff, 0.5).setDepth(11);
    this.tweens.add({ targets: flash, alpha: 0, scale: 1.1, duration: 220, onComplete: () => flash.destroy() });
    this.cameras.main.shake(180, 0.01);
    // AoE — route through the normal death path so chest/heart/potion logic still fires
    this.enemies.getChildren().forEach((c) => {
      const e = c as Enemy;
      if (!e.active || e.dying) return;
      if (Phaser.Math.Distance.Between(px, py, e.x, e.y) <= radius) this.damageEnemy(e, 25, px, py);
    });
  }

  private damagePlayer(amount: number): boolean {
    const now = this.time.now;
    if (this.dead || now < this.invulnUntil) return false;
    this.invulnUntil = now + 800;
    this.hp -= amount;
    this.emitHp();
    this.player.setTintFill(0xff5050);
    this.time.delayedCall(120, () => { if (this.player.active) this.player.clearTint(); });
    this.cameras.main.shake(90, 0.004);
    if (this.hp <= 0) this.onPlayerDeath();
    return true;
  }

  private onPlayerDeath() {
    this.dead = true;
    this.player.setVelocity(0, 0);
    (this.player.body as Phaser.Physics.Arcade.Body).enable = false;
    this.tweens.add({ targets: this.player, angle: 90, alpha: 0.3, duration: 500 });
    this.game.events.emit("ui:room", "You fell...");
    this.time.delayedCall(1200, () => this.scene.restart({ room: this.roomKey, spawn: this.spawnName, heroKey: this.heroKey }));
  }

  private emitHp() {
    this.game.events.emit("ui:hp", { hp: Math.max(this.hp, 0), maxHp: this.maxHp, name: this.hero.name });
  }

  // -------- pause / debug --------
  private togglePause() {
    this.paused = !this.paused;
    if (this.paused) { this.physics.world.pause(); this.player.setVelocity(0, 0); }
    else if (!this.dialogOpen) { this.physics.world.resume(); }
    this.game.events.emit("ui:paused", this.paused);
  }

  private enablePhysicsDebug(on: boolean) {
    this.physics.world.drawDebug = on;
    if (on) {
      if (!this.physics.world.debugGraphic) this.physics.world.createDebugGraphic();
      this.physics.world.debugGraphic.setVisible(true).setDepth(900);
    } else if (this.physics.world.debugGraphic) {
      this.physics.world.debugGraphic.clear();
      this.physics.world.debugGraphic.setVisible(false);
    }
  }

  private toggleDebug() {
    this.debugOn = !this.debugOn;
    this.enablePhysicsDebug(this.debugOn);
    this.game.events.emit("ui:debugToggle", this.debugOn);
  }

  // -------- update --------
  update(time: number, delta: number) {
    if (this.crashed) return;
    try {
      this.tick(time, delta);
    } catch (err) {
      this.crashed = true;
      const e = err as Error;
      // surface it instead of freezing silently
      // eslint-disable-next-line no-console
      console.error("GameScene crash:", e);
      window.dispatchEvent(new ErrorEvent("error", { message: e?.message ?? String(err), error: e }));
    }
  }

  private tick(time: number, delta: number) {
    if (this.dead) return;

    if (Phaser.Input.Keyboard.JustDown(this.keys.P) || Phaser.Input.Keyboard.JustDown(this.keys.ESC)) this.togglePause();
    if (Phaser.Input.Keyboard.JustDown(this.keys.F3)) this.toggleDebug();
    if (this.paused) return;

    if (this.dialogOpen) return;

    const speed = this.hero.speed * SPEED_PER_SP * (time < this.slowedUntil ? 0.5 : 1);
    const left = this.cursors.left.isDown || this.keys.A.isDown;
    const right = this.cursors.right.isDown || this.keys.D.isDown;
    const up = this.cursors.up.isDown || this.keys.W.isDown;
    const down = this.cursors.down.isDown || this.keys.S.isDown;
    let vx = 0, vy = 0;
    if (left) vx = -speed; else if (right) vx = speed;
    if (up) vy = -speed; else if (down) vy = speed;
    if (vx !== 0 && vy !== 0) { vx *= Math.SQRT1_2; vy *= Math.SQRT1_2; }
    this.player.setVelocity(vx, vy);
    if (vx !== 0 || vy !== 0) this.facing.set(vx, vy).normalize();
    this.player.setFlipX(this.facing.x < 0);
    this.player.setAlpha(time < this.invulnUntil ? (Math.floor(time / 80) % 2 ? 0.4 : 1) : 1);

    if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE) || Phaser.Input.Keyboard.JustDown(this.keys.J)) this.attack();
    if (Phaser.Input.Keyboard.JustDown(this.keys.Q) && this.bombCount > 0) this.detonateBomb();

    const ePressed = Phaser.Input.Keyboard.JustDown(this.keys.E);
    let eHandled = false;

    // chests
    for (const c of this.chests) {
      if (c.opened || !c.active) continue;
      const near = c.canInteract(this.player.x, this.player.y);
      c.setHint(near);
      if (near && ePressed && !eHandled) { this.openChest(c); eHandled = true; }
    }

    // signs
    let nearSign = false;
    for (const s of this.signZones) {
      const inRange = s.zone.getBounds().contains(this.player.x, this.player.y);
      s.hint.setVisible(inRange);
      if (inRange) nearSign = true;
    }
    if (nearSign && !eHandled && time > this.signCooldownUntil && ePressed) { this.tryReadSign(); eHandled = true; }

    // enemy AI + clear tracking
    this.enemies.getChildren().forEach((c) => (c as Enemy).updateAI(time, delta, this.player));
    // emit whenever the live count changes — deaths destroy via a deferred tween, so
    // comparing against a stored value (not an intra-frame snapshot) is what catches them
    const remaining = this.enemies.countActive();
    if (remaining !== this.lastEnemyCount) {
      this.lastEnemyCount = remaining;
      this.game.events.emit("ui:enemies", remaining);
    }
    if (!this.roomCleared && remaining === 0) {
      this.roomCleared = true;
      this.game.events.emit("ui:cleared");
    }

    // doors — forward (locked) doors open with the warden's key alone; backtrack doors
    // require the room to be cleared before you can leave.
    if (time >= this.doorsLockedUntil && !this.transitioning) {
      for (const d of this.doors) {
        // Proximity check, not rect-contains: the 1.5x player body (18px tall) can't fit its
        // center into a 16px single-tile door opening flanked by walls, so test nearness instead.
        if (Phaser.Math.Distance.Between(this.player.x, this.player.y, d.rect.centerX, d.rect.centerY) > 24) continue;
        if (!d.locked || d.opened) {
          // backtrack / already-open door: must clear the room first
          if (this.enemies.countActive() !== 0) {
            if (time > this.lockHintAt) { this.lockHintAt = time + 1500; this.game.events.emit("ui:locked"); }
            break;
          }
          this.transitionTo(d);
          break;
        }
        // forward locked door: the key opens it regardless of remaining minions
        if (ePressed && !eHandled) {
          eHandled = true;
          if (this.keyCount > 0) {
            this.keyCount -= 1;
            this.game.events.emit("ui:keys", this.keyCount);
            d.opened = true;
            this.transitioning = true;            // block the loop while the unlock plays
            this.game.events.emit("ui:unlocked");
            const icon = d.lockIcon;
            if (icon) {
              icon.setTint(0x44e060);
              this.tweens.add({ targets: icon, alpha: 0, scale: 1.7, duration: 280, onComplete: () => icon.destroy() });
            }
            this.time.delayedCall(320, () => { this.transitioning = false; this.transitionTo(d); });
          } else {
            this.game.events.emit("ui:nokey");
            this.cameras.main.shake(120, 0.005);
          }
        } else if (!ePressed && time > this.lockHintAt) {
          this.lockHintAt = time + 1500;
          this.game.events.emit(this.keyCount > 0 ? "ui:doorprompt" : "ui:nokey");
        }
        break;
      }
    }

    // debug readout
    if (this.debugOn) {
      this.game.events.emit("ui:debug", {
        fps: Math.round(this.game.loop.actualFps),
        entities: this.enemies.countActive(),
        x: Math.round(this.player.x), y: Math.round(this.player.y),
        room: this.roomKey,
      });
    }
  }
}
