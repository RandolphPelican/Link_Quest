import Phaser from "phaser";

// Loads everything once, generates procedural textures (projectiles),
// then hands off to the title screen.
export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload() {
    this.load.image("tilesheet", "kenney/Tilemap/tilemap_packed.png");
    this.load.spritesheet("tiles", "kenney/Tilemap/tilemap_packed.png", {
      frameWidth: 16,
      frameHeight: 16,
    });
    for (const room of ["room1", "room2", "room3", "boss"]) {
      this.load.tilemapTiledJSON(room, `maps/${room}.tmj`);
    }
  }

  create() {
    // fireball: orange core with red rim
    const fire = this.add.graphics();
    fire.fillStyle(0xd03020, 1).fillCircle(4, 4, 4);
    fire.fillStyle(0xff9030, 1).fillCircle(4, 4, 2.5);
    fire.generateTexture("shot_fire", 8, 8);
    fire.destroy();

    // boss shot: sickly green orb (hallucinations, obviously)
    const dark = this.add.graphics();
    dark.fillStyle(0x204020, 1).fillCircle(4, 4, 4);
    dark.fillStyle(0x60e060, 1).fillCircle(4, 4, 2.5);
    dark.generateTexture("shot_dark", 8, 8);
    dark.destroy();

    // fire-warden shot: hot orange core, red rim
    const flame = this.add.graphics();
    flame.fillStyle(0x802010, 1).fillCircle(4, 4, 4);
    flame.fillStyle(0xff7028, 1).fillCircle(4, 4, 2.5);
    flame.generateTexture("shot_flame", 8, 8);
    flame.destroy();

    // ice-warden shot: cold blue with a cyan core
    const ice = this.add.graphics();
    ice.fillStyle(0x2048a0, 1).fillCircle(4, 4, 4);
    ice.fillStyle(0x90d8ff, 1).fillCircle(4, 4, 2.5);
    ice.generateTexture("shot_ice", 8, 8);
    ice.destroy();

    this.makeProps();

    this.scene.start("TitleScene");
  }

  // Procedurally-baked props (no spritesheet frame guessing — guaranteed to render).
  private makeProps() {
    // closed treasure chest
    const c = this.add.graphics();
    c.fillStyle(0x4a2e12, 1).fillRect(2, 5, 12, 9);
    c.fillStyle(0x8a5a2b, 1).fillRect(3, 7, 10, 6);
    c.fillStyle(0x6a4420, 1).fillRect(2, 4, 12, 3);
    c.fillStyle(0xc9a04a, 1).fillRect(2, 7, 12, 1);
    c.fillStyle(0xf3d96a, 1).fillRect(7, 7, 2, 4);
    c.lineStyle(1, 0x241307, 1).strokeRect(2, 4, 12, 10);
    c.generateTexture("chest_closed", 16, 16);
    c.destroy();

    // open chest — lid raised, interior gleaming
    const o = this.add.graphics();
    o.fillStyle(0x6a4420, 1).fillRect(2, 1, 12, 4);
    o.fillStyle(0xc9a04a, 1).fillRect(3, 4, 10, 1);
    o.fillStyle(0x2a1a0c, 1).fillRect(3, 8, 10, 6);
    o.fillStyle(0x8a5a2b, 1).fillRect(2, 11, 12, 3);
    o.fillStyle(0xfff0a0, 1).fillRect(6, 8, 4, 3);
    o.lineStyle(1, 0x241307, 1).strokeRect(2, 8, 12, 6);
    o.generateTexture("chest_open", 16, 16);
    o.destroy();

    // golden key
    const k = this.add.graphics();
    k.fillStyle(0xf6d24a, 1);
    k.fillCircle(4, 4, 3);
    k.fillRect(5, 4, 1.6, 8);
    k.fillRect(6, 9, 3, 1.4);
    k.fillRect(6, 11, 2.2, 1.4);
    k.generateTexture("key_icon", 12, 14);
    k.destroy();

    // padlock — tinted red (locked) / green (open) at use
    const l = this.add.graphics();
    l.lineStyle(2, 0xdddddd, 1).beginPath();
    l.arc(6, 5, 3, Math.PI, 0, false);
    l.strokePath();
    l.fillStyle(0xe8e8e8, 1).fillRect(2, 6, 8, 7);
    l.fillStyle(0x333333, 1).fillRect(5, 8, 2, 3);
    l.generateTexture("lock_icon", 12, 14);
    l.destroy();

    // health potion — red flask with a cork stopper
    const p = this.add.graphics();
    p.fillStyle(0x9a9a9a, 1).fillRect(7, 1, 2, 2);          // cork
    p.fillStyle(0xbfe8ff, 0.9).fillRect(6, 3, 4, 3);        // glass neck
    p.fillStyle(0xe03048, 1).fillRect(4, 6, 8, 8);          // red liquid
    p.fillStyle(0xff7a90, 1).fillRect(5, 7, 2, 3);          // highlight
    p.lineStyle(1, 0x300810, 1).strokeRect(4, 6, 8, 8);
    p.generateTexture("potion", 16, 16);
    p.destroy();

    // attack bomb — dark sphere with a lit fuse
    const b = this.add.graphics();
    b.fillStyle(0x1e1e28, 1).fillCircle(8, 10, 6);          // body
    b.fillStyle(0x3c3c4a, 1).fillCircle(6, 8, 2);           // sheen
    b.fillStyle(0x8a5a2b, 1).fillRect(9, 2, 2, 4);          // fuse
    b.fillStyle(0xffb030, 1).fillCircle(11, 2, 1.8);        // spark
    b.generateTexture("bomb", 16, 16);
    b.destroy();
  }
}
