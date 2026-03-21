// ============================================================
// room.js — RoomManager, pure Canvas2D rendering
// ============================================================

class RoomManager {
  constructor(roomData) {
    this.roomData  = roomData;
    this.obstacles = [];
    this.chests    = [];
    this.signs     = [];
    this.doors     = {};
    this.torches   = [];
    this._build();
  }

  _build() {
    // Build obstacle list
    (this.roomData.obstacles || []).forEach(o => {
      this.obstacles.push({ x: o.x, y: o.y, w: o.w || 40, h: o.h || 40, type: o.type });
    });

    // Build chest list — check persistent state
    (this.roomData.chests || []).forEach((c, i) => {
      this.chests.push({
        x: c.x, y: c.y,
        type: c.type,
        contains: c.contains,
        locked: c.locked || false,
        opened: isChestOpened(GameState.currentLevel, GameState.currentRoom, i),
        index: i
      });
    });

    // Build sign list
    (this.roomData.signs || []).forEach(s => {
      this.signs.push({ x: s.x, y: s.y, message: s.message });
    });

    // Build torch list from decorations
    (this.roomData.decorations || []).forEach(d => {
      if (d.type === 'torch') {
        this.torches.push({ x: d.x, y: d.y, flicker: Math.random() * Math.PI * 2 });
      }
    });

    // Build doors
    const doorDefs = {
      left:   { x: 50,  y: 300 },
      right:  { x: 750, y: 300 },
      top:    { x: 400, y: 50  },
      bottom: { x: 400, y: 550 }
    };

    const doorsData = this.roomData.doors || {};
    Object.entries(doorsData).forEach(([side, data]) => {
      if (!data || data.leadsTo === null || data.leadsTo === undefined) return;
      this.doors[side] = {
        x:      doorDefs[side].x,
        y:      doorDefs[side].y,
        locked: data.locked || false,
        leadsTo: data.leadsTo
      };
    });
  }

  lockExits() {
    ['right','bottom','top'].forEach(side => {
      if (this.doors[side]) this.doors[side].locked = true;
    });
  }

  openAllDoors() {
    Object.values(this.doors).forEach(d => { d.locked = false; });
  }

  // ── RENDER ───────────────────────────────────────────────────
  render() {
    // Background
    const bgColor = parseInt((this.roomData.background || '#182030').replace('#',''), 16);
    clearScreen(bgColor);

    this._renderGrid();
    this._renderWalls();
    this._renderObstacles();
    this._renderDecorations();
    this._renderDoors();
    this._renderChests();
    this._renderSigns();
  }

  _renderGrid() {
    for (let x = 0; x <= 800; x += 32)
      drawLine(x, 0, x, 600, 0x1e2a3a, 0.3);
    for (let y = 0; y <= 600; y += 32)
      drawLine(0, y, 800, y, 0x1e2a3a, 0.3);
  }

  _renderWalls() {
    const doorsData = this.roomData.doors || {};
    const hasLeft   = doorsData.left   && doorsData.left.leadsTo   != null;
    const hasRight  = doorsData.right  && doorsData.right.leadsTo  != null;
    const hasTop    = doorsData.top    && doorsData.top.leadsTo    != null;
    const hasBottom = doorsData.bottom && doorsData.bottom.leadsTo != null;

    // Top wall
    for (let x = 0; x < 800; x += 32) {
      const cx = x + 16;
      if (hasTop && cx > 368 && cx < 432) continue;
      drawRect(cx, 14, 30, 28, 0x1a2535);
      drawRectOutline(cx, 14, 30, 28, 0x2a3f55, 1);
    }
    // Bottom wall
    for (let x = 0; x < 800; x += 32) {
      const cx = x + 16;
      if (hasBottom && cx > 368 && cx < 432) continue;
      drawRect(cx, 586, 30, 28, 0x1a2535);
      drawRectOutline(cx, 586, 30, 28, 0x2a3f55, 1);
    }
    // Left wall
    for (let y = 32; y < 572; y += 32) {
      const cy = y + 16;
      if (hasLeft && cy > 268 && cy < 332) continue;
      drawRect(14, cy, 28, 30, 0x1a2535);
      drawRectOutline(14, cy, 28, 30, 0x2a3f55, 1);
    }
    // Right wall
    for (let y = 32; y < 572; y += 32) {
      const cy = y + 16;
      if (hasRight && cy > 268 && cy < 332) continue;
      drawRect(786, cy, 28, 30, 0x1a2535);
      drawRectOutline(786, cy, 28, 30, 0x2a3f55, 1);
    }
  }

  _renderObstacles() {
    this.obstacles.forEach(o => {
      const color = o.type === 'pillar' ? 0x2a3f55 :
                    o.type === 'wall'   ? 0x1e3040 : 0x3a4f65;
      drawRect(o.x, o.y, o.w, o.h, color);
      drawRectOutline(o.x, o.y, o.w, o.h, 0x4a6f90, 1);
      if (o.type === 'pillar') {
        drawRect(o.x, o.y, o.w - 10, o.h - 10, 0x3a5570);
        drawRectOutline(o.x, o.y, o.w - 10, o.h - 10, 0x5a7f9f, 1);
      }
    });
  }

  _renderDecorations() {
    const t = Date.now() / 1000;
    const decs = this.roomData.decorations || [];

    decs.forEach(d => {
      if (d.type === 'bush') {
        drawCircle(d.x, d.y, d.r || 14, 0x1a3a1a);
        drawCircle(d.x - 4, d.y - 3, 7, 0x1e471e);

      } else if (d.type === 'torch') {
        // Bracket
        drawRect(d.x, d.y + 2, 5, 10, 0x6a5040);
        // Flicker
        const flicker = Math.sin(t * 8 + d.x) * 0.15 + 0.85;
        drawCircle(d.x, d.y - 9, 7 * flicker, 0xff6600, 0.95);
        drawCircle(d.x, d.y - 9, 18, 0xff4400, 0.12 + Math.sin(t*6+d.y)*0.05);
        drawCircle(d.x, d.y - 9, 3, 0xffee00);

      } else if (d.type === 'cobweb') {
        ctx.font = '22px serif';
        ctx.globalAlpha = 0.5;
        ctx.fillText('🕸️', d.x - 11, d.y + 8);
        ctx.globalAlpha = 1;

      } else if (d.type === 'bones') {
        ctx.font = '18px serif';
        ctx.globalAlpha = 0.6;
        ctx.fillText('🦴', d.x - 9, d.y + 7);
        ctx.globalAlpha = 1;
      }
    });
  }

  _renderDoors() {
    Object.entries(this.doors).forEach(([side, door]) => {
      const t      = Date.now() / 1000;
      const locked = door.locked;
      const color  = locked ? 0x884422 : 0x00ddff;
      const alpha  = locked ? 0.5 : 0.35 + Math.sin(t * 2) * 0.15;
      const isVert = side === 'left' || side === 'right';
      const w = isVert ? 28 : 68;
      const h = isVert ? 68 : 28;

      drawRect(door.x, door.y, w, h, color, alpha);
      drawRectOutline(door.x, door.y, w, h, locked ? 0xff6622 : 0x00ffff, 2);

      if (locked) {
        ctx.font = '14px serif';
        ctx.textAlign = 'center';
        ctx.fillText('🔒', door.x, door.y + 5);
      }
    });
  }

  _renderChests() {
    this.chests.forEach(chest => {
      const isGold   = chest.type === 'gold';
      const isSilver = chest.type === 'silver';
      const bodyColor = isGold ? 0x8b6914 : isSilver ? 0x607080 : 0x5a2e18;
      const lidColor  = isGold ? 0xd4a017 : isSilver ? 0xa0b0c0 : 0x7a3e28;
      const rimColor  = isGold ? 0xffd700 : isSilver ? 0xc0c8d8 : 0x8b4513;

      if (chest.opened) {
        // Opened chest — lid tilted
        drawRect(chest.x, chest.y + 5, 34, 20, bodyColor);
        drawRectOutline(chest.x, chest.y + 5, 34, 20, rimColor, 2);
        // Tilted lid
        ctx.save();
        ctx.translate(chest.x, chest.y - 14);
        ctx.rotate(-0.6);
        drawRect(0, 0, 34, 14, lidColor);
        drawRectOutline(0, 0, 34, 14, rimColor, 2);
        ctx.restore();
      } else {
        // Closed chest
        drawRect(chest.x, chest.y + 5, 34, 20, bodyColor);
        drawRectOutline(chest.x, chest.y + 5, 34, 20, rimColor, 2);
        drawRect(chest.x, chest.y - 7, 34, 14, lidColor);
        drawRectOutline(chest.x, chest.y - 7, 34, 14, rimColor, 2);
        drawRect(chest.x, chest.y - 1, 8, 5, rimColor);

        if (chest.locked) {
          ctx.font = '13px serif';
          ctx.textAlign = 'center';
          ctx.fillText('🔒', chest.x, chest.y - 26);
        }

        // Glow for free chests
        if (!isGold && !isSilver && !chest.locked) {
          const t = Date.now() / 1000;
          drawCircle(chest.x, chest.y, 28, 0xffaa33, 0.08 + Math.sin(t*2)*0.06);
        }
      }

      // F prompt when player nearby
      if (typeof player !== 'undefined' && player) {
        const dx = chest.x - player.x;
        const dy = chest.y - player.y;
        if (!chest.opened && Math.sqrt(dx*dx+dy*dy) < 48) {
          drawTextOutlined('[F]', chest.x, chest.y - 38, 9, 0xffff00, 0x000000, 'center');
        }
      }
    });
  }

  _renderSigns() {
    this.signs.forEach(sign => {
      drawRect(sign.x, sign.y + 10, 5, 18, 0x5a4030);
      drawRect(sign.x, sign.y - 5, 38, 26, 0x8b6914);
      drawRectOutline(sign.x, sign.y - 5, 38, 26, 0x5a4010, 2);
      drawTextOutlined('!', sign.x, sign.y - 5, 14, 0xffffaa, 0x000000, 'center');

      if (typeof player !== 'undefined' && player) {
        const dx = sign.x - player.x;
        const dy = sign.y - player.y;
        if (Math.sqrt(dx*dx+dy*dy) < 48) {
          drawTextOutlined('[F]', sign.x, sign.y - 32, 9, 0xffff00, 0x000000, 'center');
        }
      }
    });
  }

  // ── INTERACTIONS ─────────────────────────────────────────────
  tryInteract(player) {
    // Chests
    this.chests.forEach((chest, i) => {
      if (chest.opened) return;
      const dx = chest.x - player.x;
      const dy = chest.y - player.y;
      if (Math.sqrt(dx*dx+dy*dy) > 48) return;

      if (chest.locked) {
        if (GameState.inventory.keys > 0) {
          GameState.inventory.keys--;
          chest.locked = false;
          this._openChest(chest, player);
        } else {
          showToast('You need a key!');
        }
      } else {
        this._openChest(chest, player);
      }
    });

    // Signs
    this.signs.forEach(sign => {
      const dx = sign.x - player.x;
      const dy = sign.y - player.y;
      if (Math.sqrt(dx*dx+dy*dy) < 48) {
        showToast(sign.message, 4000);
      }
    });
  }

  _openChest(chest, player) {
    chest.opened = true;
    markChestOpened(GameState.currentLevel, GameState.currentRoom, chest.index);
    if (chest.contains) {
      items.push(new Item(chest.x, chest.y - 30, chest.contains));
    }
    showToast('Chest opened!');
  }

  // ── DOOR CHECK ───────────────────────────────────────────────
  checkDoors(player, onTransition) {
    if (!player) return;
    Object.entries(this.doors).forEach(([side, door]) => {
      if (door.locked) return;
      let triggered = false;
      if (side === 'right'  && player.x > 740 && player.y > 268 && player.y < 332) triggered = true;
      if (side === 'left'   && player.x < 60  && player.y > 268 && player.y < 332) triggered = true;
      if (side === 'top'    && player.y < 60  && player.x > 368 && player.x < 432) triggered = true;
      if (side === 'bottom' && player.y > 540 && player.x > 368 && player.x < 432) triggered = true;
      if (triggered) onTransition(door.leadsTo, side);
    });
  }

  // ── COLLISION ────────────────────────────────────────────────
  resolveCollisions(obj) {
    this.obstacles.forEach(obs => {
      const o = { x: obs.x, y: obs.y, w: obs.w, h: obs.h };
      obj.resolveCollision(o);
    });
  }
}
