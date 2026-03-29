// ============================================================
// tiles.js — Tileset loader and renderer for dungeon sprites
// 16x16 source tiles, drawn at 2x (32x32) on the 800x600 canvas
// ============================================================

'use strict';

const TileSize   = 16;  // Source tile size in spritesheet
const TileScale  = 2;   // Draw scale (32px on screen)
const TileDraw   = TileSize * TileScale;  // 32px

const Tiles = {
  loaded: false,
  sheets: {},

  // ── LOAD ALL SHEETS ────────────────────────────────────
  load(onDone) {
    const sources = {
      floors: 'assets/darkdungeon_tileset_floor_and_stairs.png',
      walls:  'assets/darkdungeon_tileset_walls.png',
      decos:  'assets/darkdungeon_tileset_decorations_alpha.png',
      water:  'assets/darkdungeon_tileset_water.png'
    };
    let remaining = Object.keys(sources).length;
    Object.entries(sources).forEach(([key, src]) => {
      const img = new Image();
      img.onload = () => {
        this.sheets[key] = img;
        remaining--;
        if (remaining === 0) {
          this.loaded = true;
          console.log('Tiles: all sheets loaded');
          if (onDone) onDone();
        }
      };
      img.onerror = () => {
        console.warn('Tiles: failed to load', src, '- using fallback rendering');
        remaining--;
        if (remaining === 0) {
          this.loaded = true;
          if (onDone) onDone();
        }
      };
      img.src = src;
    });
  },

  // ── DRAW A SINGLE TILE ─────────────────────────────────
  // sheet: 'floors'|'walls'|'decos'|'water'
  // col, row: tile position in spritesheet (0-indexed)
  // x, y: screen position (top-left corner)
  // scale: optional override (default TileScale)
  draw(sheet, col, row, x, y, scale) {
    const img = this.sheets[sheet];
    if (!img) return;
    const s = scale || TileScale;
    ctx.drawImage(
      img,
      col * TileSize, row * TileSize,  // source x, y
      TileSize, TileSize,               // source w, h
      x, y,                              // dest x, y
      TileSize * s, TileSize * s         // dest w, h
    );
  },

  // Draw a 2x2 tile block (32x32 source -> 64x64 on screen)
  draw2x2(sheet, col, row, x, y, scale) {
    const s = scale || TileScale;
    this.draw(sheet, col,   row,   x,               y,               s);
    this.draw(sheet, col+1, row,   x + TileSize*s,  y,               s);
    this.draw(sheet, col,   row+1, x,               y + TileSize*s,  s);
    this.draw(sheet, col+1, row+1, x + TileSize*s,  y + TileSize*s,  s);
  },

  // ── TILE DEFINITIONS ───────────────────────────────────
  // Named references to specific tiles in the sheets
  // Format: [col, row] in the 16x16 grid

  // Floor tiles (from floors sheet, 21 cols x 8 rows)
  FLOOR: {
    stone_light:   [2, 0],   // Light grey stone
    stone_light2:  [3, 0],
    stone_light3:  [5, 0],
    stone_med:     [6, 1],   // Medium stone
    stone_med2:    [7, 1],
    stone_var1:    [8, 0],   // Variation tiles
    stone_var2:    [9, 0],
    stone_var3:    [10, 0],
    stone_dark:    [2, 4],   // Darker stone
    stone_dark2:   [3, 4],
    stone_dark3:   [5, 5],
    stone_cracked: [4, 5],   // Cracked/damaged
    grate:         [13, 3],  // Metal grate
    grate2:        [14, 3],
    stairs_down:   [13, 0],  // Stairs
    stairs_up:     [15, 0],
    dark_stone:    [13, 4],  // Very dark
    dark_stone2:   [14, 4],
    blue_stone:    [17, 6],  // Blue tinted
    blue_stone2:   [18, 6],
  },

  // Wall tiles (from walls sheet, 21 cols x 11 rows)
  WALL: {
    top_plain:     [0, 3],   // Plain wall top
    top_plain2:    [1, 3],
    top_brick:     [4, 3],   // Brick pattern
    top_brick2:    [5, 3],
    face:          [0, 4],   // Wall face (what you see)
    face2:         [1, 4],
    face_brick:    [4, 4],
    face_window:   [10, 3],  // Wall with window
    pillar_top:    [9, 3],   // Pillar
    pillar_mid:    [9, 4],
    arch_left:     [0, 0],   // Doorway arch
    arch_mid:      [2, 0],
    arch_right:    [3, 0],
    sconce:        [7, 1],   // Torch sconce on wall
    sconce2:       [8, 1],
    dark_face:     [0, 5],   // Darker wall
    dark_face2:    [1, 5],
    bottom_edge:   [0, 7],   // Wall bottom edge
  },

  // Decoration tiles (from decos sheet with alpha, 21 cols x 12 rows)
  DECO: {
    torch1:        [0, 2],   // Torch animation frames
    torch2:        [1, 2],
    torch3:        [2, 2],
    torch4:        [3, 2],
    candle:        [7, 1],   // Candle
    candle2:       [8, 1],
    barrel:        [12, 6],  // Barrel
    crate:         [14, 6],  // Crate
    pot:           [10, 7],  // Pot
    pot2:          [11, 7],
    bookshelf_l:   [0, 6],   // Bookshelf (2 wide)
    bookshelf_r:   [1, 6],
    table:         [6, 4],   // Table
    chair:         [8, 4],   // Chair
    bed_l:         [4, 4],   // Bed (2 wide)
    bed_r:         [5, 4],
    bench:         [6, 5],   // Bench
    carpet_red:    [15, 8],  // Carpet corners
    carpet_blue:   [17, 8],
    carpet_green:  [15, 10],
    chest_closed:  [10, 1],  // Chest
    chest_open:    [11, 1],
    skull:         [12, 7],  // Skull
    bones:         [13, 7],  // Bones
    fence:         [0, 0],   // Iron fence
    gate:          [4, 0],   // Gate
    coffin_top:    [6, 0],   // Coffin
    coffin_bot:    [6, 1],
  },

  // ── ROOM RENDERING HELPERS ─────────────────────────────

  // Fill a region with a floor tile pattern
  fillFloor(x, y, w, h, variant) {
    if (!this.sheets.floors) return;
    // Pick floor tile based on variant
    const variants = [
      [this.FLOOR.stone_light, this.FLOOR.stone_light2, this.FLOOR.stone_light3],
      [this.FLOOR.stone_med, this.FLOOR.stone_med2, this.FLOOR.stone_var1],
      [this.FLOOR.stone_dark, this.FLOOR.stone_dark2, this.FLOOR.stone_dark3],
      [this.FLOOR.stone_light, this.FLOOR.stone_var2, this.FLOOR.stone_var3],
    ];
    const set = variants[variant || 0] || variants[0];

    for (let tx = x; tx < x + w; tx += TileDraw) {
      for (let ty = y; ty < y + h; ty += TileDraw) {
        // Pseudo-random tile selection based on position (deterministic)
        const hash = ((tx * 7 + ty * 13) >> 5) % set.length;
        const tile = set[hash < 0 ? 0 : hash];
        this.draw('floors', tile[0], tile[1], tx, ty);
      }
    }
  },

  // Draw a horizontal wall row
  drawWallRow(x, y, count, tileTop, tileFace) {
    if (!this.sheets.walls) return;
    const top = tileTop || this.WALL.top_plain;
    const face = tileFace || this.WALL.face;
    for (let i = 0; i < count; i++) {
      // Alternate between two tile variants for visual interest
      const t = i % 2 === 0 ? top : [top[0]+1, top[1]];
      const f = i % 2 === 0 ? face : [face[0]+1, face[1]];
      this.draw('walls', t[0], t[1], x + i * TileDraw, y);
      this.draw('walls', f[0], f[1], x + i * TileDraw, y + TileDraw);
    }
  },

  // Draw a vertical wall column
  drawWallCol(x, y, count, tileFace) {
    if (!this.sheets.walls) return;
    const face = tileFace || this.WALL.face;
    for (let i = 0; i < count; i++) {
      const f = i % 2 === 0 ? face : [face[0]+1, face[1]];
      this.draw('walls', f[0], f[1], x, y + i * TileDraw);
    }
  },

  // Draw a decoration with optional animation
  drawDeco(type, x, y) {
    if (!this.sheets.decos) return;
    const tile = this.DECO[type];
    if (!tile) return;

    // Torches get animated
    if (type.startsWith('torch')) {
      const frame = Math.floor(Date.now() / 200) % 4;
      const torchFrames = [this.DECO.torch1, this.DECO.torch2, this.DECO.torch3, this.DECO.torch4];
      const t = torchFrames[frame];
      this.draw('decos', t[0], t[1], x - TileDraw/2, y - TileDraw/2);
      return;
    }

    this.draw('decos', tile[0], tile[1], x - TileDraw/2, y - TileDraw/2);
  }
};
