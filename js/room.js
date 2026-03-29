// ============================================================
// room.js — RoomManager with floor switches, puzzles
// Pure Canvas2D, zero dependencies
// ============================================================

'use strict';

class RoomManager {
  constructor(roomData) {
    this.roomData  = roomData;
    this.obstacles = [];
    this.chests    = [];
    this.signs     = [];
    this.doors     = {};
    this.switches  = [];
    this.allSwitchesActive = false;
    this._build();
  }

  _build() {
    (this.roomData.obstacles || []).forEach(o => {
      this.obstacles.push({ x:o.x, y:o.y, w:o.w||40, h:o.h||40, type:o.type });
    });

    (this.roomData.chests || []).forEach((c, i) => {
      this.chests.push({
        x:c.x, y:c.y, type:c.type, contains:c.contains,
        locked: c.locked || false,
        opened: isChestOpened(GameState.currentLevel, GameState.currentRoom, i),
        index: i
      });
    });

    (this.roomData.signs || []).forEach(s => {
      this.signs.push({ x:s.x, y:s.y, message:s.message });
    });

    // Floor switches — step on all to unlock the exit
    (this.roomData.switches || []).forEach((s, i) => {
      this.switches.push({
        x:s.x, y:s.y, w:s.w||36, h:s.h||36,
        color: s.color || 0x00ddff,
        active: false, index: i
      });
    });

    // Doors
    const doorDefs = {
      left:   { x:50,  y:300 },
      right:  { x:750, y:300 },
      top:    { x:400, y:50  },
      bottom: { x:400, y:550 }
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

  // Lock forward exits when room has threats
  lockExits() {
    ['right','bottom','top'].forEach(side => {
      if (this.doors[side]) this.doors[side].locked = true;
    });
  }

  openAllDoors() {
    Object.values(this.doors).forEach(d => { d.locked = false; });
  }

  // ── FLOOR SWITCHES ────────────────────────────────────────
  checkSwitches(player) {
    if (this.switches.length === 0 || this.allSwitchesActive) return;
    this.switches.forEach(sw => {
      if (sw.active) return;
      const dx = Math.abs(player.x - sw.x);
      const dy = Math.abs(player.y - sw.y);
      if (dx < sw.w/2 + 8 && dy < sw.h/2 + 8) {
        sw.active = true;
        showToast('Switch ' + (sw.index+1) + '/' + this.switches.length + ' activated!');
      }
    });
    if (this.switches.every(s => s.active) && !this.allSwitchesActive) {
      this.allSwitchesActive = true;
      this.openAllDoors();
      showToast('All switches activated! Door open!');
    }
  }

  // ── RENDER ────────────────────────────────────────────────
  render() {
    const bgHex = this.roomData.background || '#182030';
    const bgColor = parseInt(bgHex.replace('#',''), 16);
    clearScreen(bgColor);

    this._renderGrid(bgColor);
    this._renderFloor();
    this._renderWalls();
    this._renderSwitches();
    this._renderObstacles();
    this._renderDecorations();
    this._renderDoors();
    this._renderChests();
    this._renderSigns();
  }

  _renderGrid(bgColor) {
    // Clean subtle grid
    for (let x = 0; x <= 800; x += 32)
      drawLine(x, 0, x, 600, 0xffffff, 0.04);
    for (let y = 0; y <= 600; y += 32)
      drawLine(0, y, 800, y, 0xffffff, 0.04);
  }

  _renderFloor() {
    // Subtle floor tile variation — stone pattern
    for (let tx = 1; tx < 24; tx++) {
      for (let ty = 1; ty < 18; ty++) {
        const hash = (tx * 7 + ty * 13) % 7;
        if (hash === 0) {
          drawRect(tx*32+16, ty*32+16, 30, 30, 0xffffff, 0.02);
        } else if (hash === 3) {
          drawRect(tx*32+16, ty*32+16, 30, 30, 0x000000, 0.03);
        }
      }
    }
  }

  _renderWalls() {
    const doorsData = this.roomData.doors || {};
    const hasLeft   = doorsData.left   && doorsData.left.leadsTo   != null;
    const hasRight  = doorsData.right  && doorsData.right.leadsTo  != null;
    const hasTop    = doorsData.top    && doorsData.top.leadsTo    != null;
    const hasBottom = doorsData.bottom && doorsData.bottom.leadsTo != null;

    // Parse background to tint walls
    const bgHex = this.roomData.background || '#182030';
    const bgR = parseInt(bgHex.substr(1,2),16);
    const bgG = parseInt(bgHex.substr(3,2),16);
    const bgB = parseInt(bgHex.substr(5,2),16);
    const wallColor  = ((Math.min(bgR+20,255))<<16) | ((Math.min(bgG+15,255))<<8) | Math.min(bgB+25,255);
    const wallBorder = ((Math.min(bgR+40,255))<<16) | ((Math.min(bgG+35,255))<<8) | Math.min(bgB+50,255);

    // Top wall
    for (let x = 0; x < 800; x += 32) {
      const cx = x + 16;
      if (hasTop && cx > 368 && cx < 432) continue;
      drawRect(cx, 14, 30, 28, wallColor);
      drawRectOutline(cx, 14, 30, 28, wallBorder, 1);
      // Brick detail
      if (x % 64 === 0) drawLine(x+4, 10, x+28, 10, wallBorder, 0.5);
      else drawLine(x+16, 18, x+30, 18, wallBorder, 0.5);
    }
    // Bottom wall
    for (let x = 0; x < 800; x += 32) {
      const cx = x + 16;
      if (hasBottom && cx > 368 && cx < 432) continue;
      drawRect(cx, 586, 30, 28, wallColor);
      drawRectOutline(cx, 586, 30, 28, wallBorder, 1);
    }
    // Left wall
    for (let y = 32; y < 572; y += 32) {
      const cy = y + 16;
      if (hasLeft && cy > 268 && cy < 332) continue;
      drawRect(14, cy, 28, 30, wallColor);
      drawRectOutline(14, cy, 28, 30, wallBorder, 1);
    }
    // Right wall
    for (let y = 32; y < 572; y += 32) {
      const cy = y + 16;
      if (hasRight && cy > 268 && cy < 332) continue;
      drawRect(786, cy, 28, 30, wallColor);
      drawRectOutline(786, cy, 28, 30, wallBorder, 1);
    }
  }

  _renderSwitches() {
    const t = Date.now() / 1000;
    this.switches.forEach((sw, i) => {
      if (sw.active) {
        // Activated — glowing
        drawRect(sw.x, sw.y, sw.w, sw.h, sw.color, 0.4);
        drawRectOutline(sw.x, sw.y, sw.w, sw.h, 0xffffff, 2);
      } else {
        // Inactive — subtle floor plate, barely visible
        const pulse = 0.08 + Math.sin(t * 2 + i * 1.5) * 0.04;
        drawRect(sw.x, sw.y, sw.w, sw.h, sw.color, pulse);
        drawRectOutline(sw.x, sw.y, sw.w, sw.h, sw.color, 0.5);
      }
    });
  }

  _renderObstacles() {
    this.obstacles.forEach(o => {
      if (o.type === 'pillar') {
        drawRect(o.x, o.y, o.w, o.h, 0x2a3f55);
        drawRectOutline(o.x, o.y, o.w, o.h, 0x4a6f90, 1);
        drawRect(o.x, o.y, o.w - 10, o.h - 10, 0x3a5570);
        drawRectOutline(o.x, o.y, o.w - 10, o.h - 10, 0x5a7f9f, 1);
      } else if (o.type === 'crate') {
        drawRect(o.x, o.y, o.w, o.h, 0x6a5030);
        drawRectOutline(o.x, o.y, o.w, o.h, 0x8a7050, 1);
        drawLine(o.x - o.w/2, o.y - o.h/2, o.x + o.w/2, o.y + o.h/2, 0x4a3520, 1);
        drawLine(o.x + o.w/2, o.y - o.h/2, o.x - o.w/2, o.y + o.h/2, 0x4a3520, 1);
      } else if (o.type === 'wall') {
        drawRect(o.x, o.y, o.w, o.h, 0x1e3040);
        drawRectOutline(o.x, o.y, o.w, o.h, 0x3a5060, 1);
      } else {
        drawRect(o.x, o.y, o.w, o.h, 0x3a4f65);
        drawRectOutline(o.x, o.y, o.w, o.h, 0x4a6f90, 1);
      }
    });
  }

  _renderDecorations() {
    const t = Date.now() / 1000;
    (this.roomData.decorations || []).forEach(d => {
      if (d.type === 'bush') {
        drawCircle(d.x, d.y, d.r || 14, 0x1a3a1a);
        drawCircle(d.x - 4, d.y - 3, 7, 0x1e471e);
      } else if (d.type === 'torch') {
        drawRect(d.x, d.y + 2, 5, 10, 0x6a5040);
        const flicker = Math.sin(t * 8 + d.x) * 0.15 + 0.85;
        drawCircle(d.x, d.y - 9, 7 * flicker, 0xff6600, 0.95);
        drawCircle(d.x, d.y - 9, 18, 0xff4400, 0.12 + Math.sin(t*6+d.y)*0.05);
        drawCircle(d.x, d.y - 9, 3, 0xffee00);
        drawCircle(d.x, d.y + 20, 40, 0xff8800, 0.04);
      } else if (d.type === 'cobweb') {
        ctx.font = '22px serif'; ctx.textAlign = 'center';
        ctx.globalAlpha = 0.5;
        ctx.fillText('🕸️', d.x, d.y + 8);
        ctx.globalAlpha = 1;
      } else if (d.type === 'bones') {
        ctx.font = '18px serif'; ctx.textAlign = 'center';
        ctx.globalAlpha = 0.6;
        ctx.fillText('🦴', d.x, d.y + 7);
        ctx.globalAlpha = 1;
      } else if (d.type === 'crystal') {
        const glow = Math.sin(t * 2 + d.x) * 0.1 + 0.3;
        const col = d.color || 0xaa44ff;
        drawCircle(d.x, d.y, 16, col, 0.08);
        ctx.fillStyle = hexToCSS(col, glow + 0.5);
        ctx.beginPath();
        ctx.moveTo(d.x, d.y - 14);
        ctx.lineTo(d.x + 7, d.y + 4);
        ctx.lineTo(d.x - 7, d.y + 4);
        ctx.closePath();
        ctx.fill();
      } else if (d.type === 'puddle') {
        const wobble = Math.sin(t * 1.5 + d.x) * 2;
        drawCircle(d.x, d.y, 18 + wobble, 0x2244aa, 0.2);
        drawCircle(d.x - 3, d.y + 2, 10, 0x3355cc, 0.15);
      } else if (d.type === 'server_rack') {
        drawRect(d.x, d.y, 30, 50, 0x222233);
        drawRectOutline(d.x, d.y, 30, 50, 0x445566, 1);
        // Blinking lights
        for (let i = 0; i < 4; i++) {
          const on = Math.sin(t * 4 + i * 1.5 + d.x) > 0;
          drawRect(d.x - 8, d.y - 18 + i*10, 4, 3, on ? 0x00ff44 : 0x113311);
        }
      } else if (d.type === 'terminal') {
        drawRect(d.x, d.y, 34, 28, 0x111122);
        drawRectOutline(d.x, d.y, 34, 28, 0x334455, 1);
        // Screen glow
        drawRect(d.x, d.y - 3, 28, 18, 0x002211, 0.9);
        const blink = Math.floor(t * 3) % 2 === 0;
        if (blink) drawRect(d.x - 6, d.y - 5, 4, 2, 0x00ff66);
        drawText('>', d.x - 10, d.y - 4, 7, 0x00ff44, 'left', 'monospace');
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

      // Door glow when open
      if (!locked) {
        drawCircle(door.x, door.y, 40, 0x00ddff, 0.06 + Math.sin(t*2)*0.03);
      }

      drawRect(door.x, door.y, w, h, color, alpha);
      drawRectOutline(door.x, door.y, w, h, locked ? 0xff6622 : 0x00ffff, 2);

      if (locked) {
        ctx.font = '14px serif'; ctx.textAlign = 'center';
        ctx.fillText('🔒', door.x, door.y + 5);
      } else {
        // Arrow indicating direction
        const arrows = { right:'▶', left:'◀', top:'▲', bottom:'▼' };
        drawTextOutlined(arrows[side] || '▶', door.x, door.y, 12, 0x00ffff, 0x000000, 'center');
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
        drawRect(chest.x, chest.y + 5, 34, 20, bodyColor);
        drawRectOutline(chest.x, chest.y + 5, 34, 20, rimColor, 2);
        ctx.save();
        ctx.translate(chest.x, chest.y - 14);
        ctx.rotate(-0.6);
        drawRect(0, 0, 34, 14, lidColor);
        drawRectOutline(0, 0, 34, 14, rimColor, 2);
        ctx.restore();
      } else {
        drawRect(chest.x, chest.y + 5, 34, 20, bodyColor);
        drawRectOutline(chest.x, chest.y + 5, 34, 20, rimColor, 2);
        drawRect(chest.x, chest.y - 7, 34, 14, lidColor);
        drawRectOutline(chest.x, chest.y - 7, 34, 14, rimColor, 2);
        drawRect(chest.x, chest.y - 1, 8, 5, rimColor);

        if (chest.locked) {
          ctx.font = '13px serif'; ctx.textAlign = 'center';
          ctx.fillText('🔒', chest.x, chest.y - 26);
        }

        if (!isGold && !isSilver && !chest.locked) {
          const t = Date.now() / 1000;
          drawCircle(chest.x, chest.y, 28, 0xffaa33, 0.08 + Math.sin(t*2)*0.06);
        }
      }

      if (typeof player !== 'undefined' && player && player.alive) {
        const dx = chest.x - player.x;
        const dy = chest.y - player.y;
        if (!chest.opened && Math.sqrt(dx*dx+dy*dy) < 48) {
          drawTextOutlined('[O]', chest.x, chest.y - 38, 9, 0xffff00, 0x000000, 'center');
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

      if (typeof player !== 'undefined' && player && player.alive) {
        const dx = sign.x - player.x;
        const dy = sign.y - player.y;
        if (Math.sqrt(dx*dx+dy*dy) < 48) {
          drawTextOutlined('[O]', sign.x, sign.y - 32, 9, 0xffff00, 0x000000, 'center');
        }
      }
    });
  }

  // ── INTERACTIONS ─────────────────────────────────────────
  tryInteract(player) {
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
        } else { showToast('You need a key!'); }
      } else {
        this._openChest(chest, player);
      }
    });

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

  // ── DOOR CHECK ───────────────────────────────────────────
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

  // ── COLLISION ────────────────────────────────────────────
  resolveCollisions(obj) {
    this.obstacles.forEach(obs => {
      obj.resolveCollision({ x:obs.x, y:obs.y, w:obs.w, h:obs.h });
    });
  }
}
