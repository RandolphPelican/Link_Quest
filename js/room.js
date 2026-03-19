// ============================================================
// room.js — RoomManager: obstacles, chests, doors, signs, decorations
// ============================================================

class RoomManager {
  constructor(scene) {
    this.scene       = scene;
    this.obstacles   = [];   // physics-enabled static bodies
    this.chests      = [];   // interactive chest objects
    this.signs       = [];   // readable signs
    this.doorZones   = {};   // trigger zones per side
    this.roomObjects = [];   // all display objects for cleanup
    this.currentRoomData = null;
  }

  // ── LOAD ROOM ──────────────────────────────────────────────
  load(roomData) {
    this.currentRoomData = roomData;
    this.obstacles   = [];
    this.chests      = [];
    this.signs       = [];
    this.doorZones   = {};
    this.roomObjects = [];

    // Background
    const bgColor = parseInt(roomData.background.replace('#', ''), 16);
    const bg = this.scene.add.rectangle(400, 300, 800, 600, bgColor);
    this.roomObjects.push(bg);

    this._drawGrid();
    this._drawWalls(roomData.doors || {});

    (roomData.obstacles   || []).forEach(o => this._spawnObstacle(o));
    (roomData.decorations || []).forEach(d => this._spawnDecoration(d));
    (roomData.chests      || []).forEach(c => this._spawnChest(c));
    (roomData.signs       || []).forEach(s => this._spawnSign(s));
    this._spawnDoors(roomData.doors || {});
  }

  // ── GRID ───────────────────────────────────────────────────
  _drawGrid() {
    const g = this.scene.add.graphics();
    g.lineStyle(1, 0x1e2a3a, 0.25);
    for (let x = 0; x <= 800; x += 32) g.lineBetween(x, 0, x, 600);
    for (let y = 0; y <= 600; y += 32) g.lineBetween(0, y, 800, y);
    this.roomObjects.push(g);
  }

  // ── WALLS ──────────────────────────────────────────────────
  _drawWalls(doorsData) {
    const g = this.scene.add.graphics();

    // Door gap positions (center of each wall edge)
    const gaps = {
      left:   { axis: 'y', center: 300, size: 64 },
      right:  { axis: 'y', center: 300, size: 64 },
      top:    { axis: 'x', center: 400, size: 64 },
      bottom: { axis: 'x', center: 400, size: 64 }
    };

    const hasLeftDoor   = doorsData.left   && doorsData.left.leadsTo   !== null && doorsData.left.leadsTo   !== undefined;
    const hasRightDoor  = doorsData.right  && doorsData.right.leadsTo  !== null && doorsData.right.leadsTo  !== undefined;
    const hasTopDoor    = doorsData.top    && doorsData.top.leadsTo    !== null && doorsData.top.leadsTo    !== undefined;
    const hasBottomDoor = doorsData.bottom && doorsData.bottom.leadsTo !== null && doorsData.bottom.leadsTo !== undefined;

    g.fillStyle(0x1a2535, 1);

    // Top wall blocks
    for (let x = 0; x < 800; x += 32) {
      const cx = x + 16;
      if (hasTopDoor && cx > 368 && cx < 432) continue;
      g.fillRect(x, 0, 31, 28);
      g.lineStyle(1, 0x2a3f55, 1);
      g.strokeRect(x, 0, 31, 28);
    }

    // Bottom wall blocks
    for (let x = 0; x < 800; x += 32) {
      const cx = x + 16;
      if (hasBottomDoor && cx > 368 && cx < 432) continue;
      g.fillRect(x, 572, 31, 28);
      g.lineStyle(1, 0x2a3f55, 1);
      g.strokeRect(x, 572, 31, 28);
    }

    // Left wall blocks
    for (let y = 32; y < 572; y += 32) {
      const cy = y + 16;
      if (hasLeftDoor && cy > 268 && cy < 332) continue;
      g.fillRect(0, y, 28, 31);
      g.lineStyle(1, 0x2a3f55, 1);
      g.strokeRect(0, y, 28, 31);
    }

    // Right wall blocks
    for (let y = 32; y < 572; y += 32) {
      const cy = y + 16;
      if (hasRightDoor && cy > 268 && cy < 332) continue;
      g.fillRect(772, y, 28, 31);
      g.lineStyle(1, 0x2a3f55, 1);
      g.strokeRect(772, y, 28, 31);
    }

    this.roomObjects.push(g);
  }

  // ── OBSTACLES ──────────────────────────────────────────────
  _spawnObstacle(data) {
    const colorMap = {
      pillar: 0x2a3f55,
      block:  0x3a4f65,
      wall:   0x1e3040
    };
    const color = colorMap[data.type] || 0x2a3f55;
    const w = data.w || 40;
    const h = data.h || 40;

    const rect = this.scene.add.rectangle(data.x, data.y, w, h, color);
    rect.setStrokeStyle(2, 0x4a6f90);
    this.scene.physics.add.existing(rect, true);
    this.obstacles.push(rect);
    this.roomObjects.push(rect);

    // Inner detail for pillars
    if (data.type === 'pillar') {
      const inner = this.scene.add.rectangle(data.x, data.y, w - 10, h - 10, 0x3a5570);
      inner.setStrokeStyle(1, 0x5a7f9f);
      // Corner dots
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([dx, dy]) => {
        const dot = this.scene.add.circle(
          data.x + dx * (w / 2 - 6),
          data.y + dy * (h / 2 - 6),
          3, 0x5a7f9f
        );
        this.roomObjects.push(dot);
      });
      this.roomObjects.push(inner);
    }
  }

  // ── DECORATIONS ────────────────────────────────────────────
  _spawnDecoration(data) {
    if (data.type === 'bush') {
      const outer = this.scene.add.circle(data.x, data.y, data.r || 14, 0x1a3a1a);
      outer.setStrokeStyle(1, 0x2a5a2a);
      const inner = this.scene.add.circle(data.x - 4, data.y - 3, 7, 0x1e471e);
      this.roomObjects.push(outer, inner);

    } else if (data.type === 'torch') {
      const bracket = this.scene.add.rectangle(data.x, data.y + 2, 5, 10, 0x6a5040);
      const flame   = this.scene.add.circle(data.x, data.y - 9, 7, 0xff6600, 0.95);
      const glow    = this.scene.add.circle(data.x, data.y - 9, 18, 0xff4400, 0.15);
      const inner   = this.scene.add.circle(data.x, data.y - 9, 3, 0xffee00, 1);

      this.scene.tweens.add({
        targets: [flame, inner],
        scaleX: { from: 0.85, to: 1.15 },
        scaleY: { from: 1.15, to: 0.85 },
        alpha:  { from: 0.85, to: 1.0  },
        duration: 180 + Math.random() * 160,
        yoyo: true, repeat: -1
      });
      this.scene.tweens.add({
        targets: glow,
        alpha: { from: 0.08, to: 0.25 },
        duration: 300 + Math.random() * 200,
        yoyo: true, repeat: -1
      });
      this.roomObjects.push(bracket, glow, flame, inner);

    } else if (data.type === 'cobweb') {
      const web = this.scene.add.text(data.x, data.y, '🕸️', { fontSize: '22px' });
      web.setAlpha(0.5);
      this.roomObjects.push(web);

    } else if (data.type === 'bones') {
      const bones = this.scene.add.text(data.x, data.y, '🦴', { fontSize: '18px' });
      bones.setAlpha(0.6);
      this.roomObjects.push(bones);
    }
  }

  // ── CHESTS ─────────────────────────────────────────────────
  _spawnChest(data) {
    const isGold   = data.type === 'gold';
    const isSilver = data.type === 'silver';

    const bodyColor = isGold ? 0x8b6914 : isSilver ? 0x607080 : 0x5a2e18;
    const lidColor  = isGold ? 0xd4a017 : isSilver ? 0xa0b0c0 : 0x7a3e28;
    const rimColor  = isGold ? 0xffd700 : isSilver ? 0xc0c8d8 : 0x8b4513;

    // Chest body
    const body = this.scene.add.rectangle(data.x, data.y + 5, 34, 20, bodyColor);
    body.setStrokeStyle(2, rimColor);

    // Chest lid
    const lid = this.scene.add.rectangle(data.x, data.y - 7, 34, 14, lidColor);
    lid.setStrokeStyle(2, rimColor);

    // Latch
    const latch = this.scene.add.rectangle(data.x, data.y - 1, 8, 5, rimColor);

    // Lock icon
    let lockIcon = null;
    if (data.locked) {
      lockIcon = this.scene.add.text(data.x - 7, data.y - 26, '🔒', { fontSize: '13px' });
      this.roomObjects.push(lockIcon);
    }

    // Glow for free chests
    if (!isGold && !isSilver && !data.locked) {
      const glow = this.scene.add.circle(data.x, data.y, 28, 0xffaa33, 0.1);
      this.scene.tweens.add({
        targets: glow,
        alpha: { from: 0.05, to: 0.22 },
        duration: 900, yoyo: true, repeat: -1
      });
      this.roomObjects.push(glow);
    }

    // Prompt text
    const prompt = this.scene.add.text(data.x - 10, data.y - 38, '[F]', {
      fontSize: '9px', fill: '#ffff00',
      stroke: '#000', strokeThickness: 2
    }).setAlpha(0).setDepth(12);

    const chestObj = {
      type: data.type, x: data.x, y: data.y,
      contains: data.contains,
      locked: data.locked || false,
      opened: false,
      body, lid, latch, lockIcon, prompt
    };

    this.chests.push(chestObj);
    this.roomObjects.push(body, lid, latch, prompt);
  }

  // ── SIGNS ──────────────────────────────────────────────────
  _spawnSign(data) {
    const post  = this.scene.add.rectangle(data.x, data.y + 10, 5, 18, 0x5a4030);
    const board = this.scene.add.rectangle(data.x, data.y - 5, 38, 26, 0x8b6914);
    board.setStrokeStyle(2, 0x5a4010);
    const mark = this.scene.add.text(data.x - 5, data.y - 13, '!', {
      fontSize: '14px', fill: '#ffffaa',
      stroke: '#000', strokeThickness: 2
    });
    const prompt = this.scene.add.text(data.x - 10, data.y - 32, '[F]', {
      fontSize: '9px', fill: '#ffff00',
      stroke: '#000', strokeThickness: 2
    }).setAlpha(0).setDepth(12);

    this.signs.push({
      x: data.x, y: data.y,
      message: data.message,
      board, post, mark, prompt
    });
    this.roomObjects.push(post, board, mark, prompt);
  }

  // ── DOORS ──────────────────────────────────────────────────
  _spawnDoors(doorsData) {
    const doorDefs = {
      left:   { x: 50,  y: 300, w: 28, h: 68 },
      right:  { x: 750, y: 300, w: 28, h: 68 },
      top:    { x: 400, y: 50,  w: 68, h: 28 },
      bottom: { x: 400, y: 550, w: 68, h: 28 }
    };

    Object.entries(doorsData).forEach(([side, doorData]) => {
      if (!doorData || doorData.leadsTo === null || doorData.leadsTo === undefined) return;

      const pos    = doorDefs[side];
      const locked = doorData.locked || false;
      const color  = locked ? 0x884422 : 0x00ddff;

      // Door archway visual
      const doorRect = this.scene.add.rectangle(pos.x, pos.y, pos.w, pos.h, color, locked ? 0.5 : 0.35);
      doorRect.setStrokeStyle(2, locked ? 0xff6622 : 0x00ffff);

      if (!locked) {
        this.scene.tweens.add({
          targets: doorRect,
          alpha: { from: 0.25, to: 0.65 },
          duration: 900, yoyo: true, repeat: -1
        });
      }

      if (locked) {
        const lockTxt = this.scene.add.text(pos.x - 8, pos.y - 12, '🔒', { fontSize: '14px' });
        this.roomObjects.push(lockTxt);
      }

      // Trigger zone
      const zone = this.scene.add.zone(pos.x, pos.y, pos.w + 12, pos.h + 12);
      this.scene.physics.add.existing(zone, true);

      this.doorZones[side] = { zone, doorRect, locked, leadsTo: doorData.leadsTo };
      this.roomObjects.push(doorRect);
    });
  }

  // ── INTERACTIONS ───────────────────────────────────────────
  tryInteract(player) {
    this._tryOpenChest(player);
    this._tryReadSign(player);
  }

  _tryOpenChest(player) {
    this.chests.forEach(chest => {
      if (chest.opened) return;
      const dx   = chest.x - player.sprite.x;
      const dy   = chest.y - player.sprite.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Show prompt when nearby
      chest.prompt.setAlpha(dist < 48 ? 1 : 0);

      if (dist > 48) return;

      if (chest.locked) {
        if (GameState.inventory.keys > 0) {
          GameState.inventory.keys--;
          chest.locked = false;
          if (chest.lockIcon) chest.lockIcon.destroy();
          this._openChest(chest, player);
        } else {
          if (typeof showToast === 'function') showToast('🔒 You need a key!');
        }
      } else {
        this._openChest(chest, player);
      }
    });
  }

  _openChest(chest, player) {
    chest.opened = true;

    // Animate lid flipping open
    this.scene.tweens.add({
      targets: chest.lid,
      y: chest.y - 22,
      angle: -50,
      duration: 280,
      ease: 'Back.easeOut'
    });
    chest.prompt.setAlpha(0);

    // Spawn item above chest
    if (chest.contains) {
      const dropped = new Item(this.scene, chest.x, chest.y - 30, chest.contains);
      if (this.scene.items) this.scene.items.push(dropped);
    }

    if (typeof showToast === 'function') showToast('📦 Chest opened!');
  }

  _tryReadSign(player) {
    this.signs.forEach(sign => {
      const dx   = sign.x - player.sprite.x;
      const dy   = sign.y - player.sprite.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      sign.prompt.setAlpha(dist < 48 ? 1 : 0);

      if (dist < 48) {
        if (typeof showToast === 'function') showToast(sign.message, 4000);
      }
    });
  }

  checkDoors(player, onTransition) {
    if (!player || !player.sprite) return;
    Object.entries(this.doorZones).forEach(([side, door]) => {
      if (door.locked) return;
      const dx   = door.zone.x - player.sprite.x;
      const dy   = door.zone.y - player.sprite.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 80) onTransition(door.leadsTo, side);
    });
  }

  unlockDoor(side) {
    const door = this.doorZones[side];
    if (!door) return;
    door.locked = false;
    door.doorRect.fillColor = 0x00ddff;
    door.doorRect.fillAlpha = 0.35;
    door.doorRect.setStrokeStyle(2, 0x00ffff);
    this.scene.tweens.add({
      targets: door.doorRect,
      alpha: { from: 0.25, to: 0.65 },
      duration: 900, yoyo: true, repeat: -1
    });
    if (typeof showToast === 'function') showToast('🚪 Door unlocked!');
  }

  addColliders(playerSprite) {
    this.obstacles.forEach(obs => {
      this.scene.physics.add.collider(playerSprite, obs);
    });
  }

  updateChestPrompts(player) {
    // Called every frame — show/hide [F] prompts based on proximity
    this.chests.forEach(chest => {
      if (chest.opened) { chest.prompt.setAlpha(0); return; }
      const dx = chest.x - player.sprite.x;
      const dy = chest.y - player.sprite.y;
      chest.prompt.setAlpha(Math.sqrt(dx*dx + dy*dy) < 48 ? 1 : 0);
    });
    this.signs.forEach(sign => {
      const dx = sign.x - player.sprite.x;
      const dy = sign.y - player.sprite.y;
      sign.prompt.setAlpha(Math.sqrt(dx*dx + dy*dy) < 48 ? 1 : 0);
    });
  }
}
