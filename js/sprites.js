// ============================================================
// sprites.js — Character & monster sprite system
// Loads rogues.png (heroes), monsters.png (enemies),
// soldier/orc strips (bosses)
// ============================================================

'use strict';

const Sprites = {
  loaded: false,
  sheets: {},

  // ── HERO DEFINITIONS (from rogues.png 7x7 grid, 32x32 each) ──
  // Row/col positions in the rogues.png spritesheet
  HEROES: {
    lincoln: { col: 0, row: 1, label: 'Knight' },      // knight
    journey: { col: 0, row: 4, label: 'Wizard' },       // female wizard
    bear:    { col: 2, row: 0, label: 'Ranger' },        // ranger
    dad:     { col: 0, row: 3, label: 'Barbarian' },     // male barbarian
    noha:    { col: 3, row: 0, label: 'Rogue' }          // rogue
  },

  // ── ENEMY DEFINITIONS (from monsters.png 12x13 grid, 32x32 each) ──
  ENEMIES: {
    // Level 1
    goblin:        { col: 4, row: 0 },   // green goblin
    goblin_chief:  { col: 6, row: 0 },   // bigger goblin
    ai_bug:        { col: 0, row: 1 },   // slime
    chatbot_clone: { col: 2, row: 2 },   // skeleton mage type
    // Level 2
    glitch_sprite: { col: 3, row: 2 },   // ghost
    memory_leak:   { col: 1, row: 2 },   // golem
    phantom_var:   { col: 1, row: 3 },   // phantom
    null_pointer:  { col: 0, row: 3 },   // dark creature
    // Level 3
    stack_overflow:{ col: 5, row: 0 },   // orc
    syntax_error:  { col: 3, row: 0 },   // imp/demon
    dark_compiler: { col: 0, row: 2 },   // skeleton
    trojan_horse:  { col: 7, row: 0 }    // armored orc
  },

  // ── BOSS ANIMATION STRIPS ──
  BOSSES: {
    lazy_coder:     { sheet: 'soldier_idle', frames: 6, frameW: 100, frameH: 100 },
    data_corruptor: { sheet: 'orc_idle',     frames: 6, frameW: 100, frameH: 100 },
    gossip_gpt:     { sheet: 'orc_idle',     frames: 6, frameW: 100, frameH: 100 }
  },

  // ── LOAD ALL SHEETS ────────────────────────────────────────
  load(onDone) {
    const sources = {
      rogues:         'assets/characters/rogues.png',
      monsters:       'assets/characters/monsters.png',
      items:          'assets/characters/items.png',
      soldier_idle:   'assets/characters/soldier_idle.png',
      soldier_walk:   'assets/characters/soldier_walk.png',
      soldier_attack: 'assets/characters/soldier_attack.png',
      orc_idle:       'assets/characters/orc_idle.png',
      orc_walk:       'assets/characters/orc_walk.png',
      orc_attack:     'assets/characters/orc_attack.png'
    };

    let remaining = Object.keys(sources).length;
    let failed = 0;

    Object.entries(sources).forEach(([key, src]) => {
      const img = new Image();
      img.onload = () => {
        this.sheets[key] = img;
        remaining--;
        if (remaining === 0) {
          this.loaded = true;
          console.log('Sprites: loaded ' + (Object.keys(this.sheets).length - failed) + ' sheets');
          if (onDone) onDone();
        }
      };
      img.onerror = () => {
        console.warn('Sprites: failed to load', src);
        failed++;
        remaining--;
        if (remaining === 0) {
          this.loaded = true;
          if (onDone) onDone();
        }
      };
      img.src = src;
    });
  },

  // ── DRAW HERO SPRITE ───────────────────────────────────────
  // charKey: 'lincoln'|'journey'|'bear'|'dad'|'noha'
  // x, y: center position on screen
  // facing: 'left'|'right'|'up'|'down'
  // animFrame: for bobbing animation
  // scale: draw scale (default 1.0 = 32x32)
  drawHero(charKey, x, y, facing, animFrame, scale, isAttacking) {
    const def = this.HEROES[charKey];
    if (!def || !this.sheets.rogues) return false;

    const s = scale || 3.0;
    const drawW = 32 * s;
    const drawH = 32 * s;

    // Walk bobbing
    const bob = animFrame ? Math.sin(animFrame * 0.2) * 3 : 0;

    // Attack lunge — push sprite toward facing direction
    let lungeX = 0, lungeY = 0;
    const atkScale = isAttacking ? 1.1 : 1.0;
    if (isAttacking) {
      const lungeAmt = 8;
      if (facing === 'right') lungeX = lungeAmt;
      else if (facing === 'left') lungeX = -lungeAmt;
      else if (facing === 'down') lungeY = lungeAmt;
      else if (facing === 'up') lungeY = -lungeAmt;
    }

    ctx.save();
    ctx.translate(x + lungeX, y + bob + lungeY);

    // Flip horizontally for left-facing
    if (facing === 'left') {
      ctx.scale(-1 * atkScale, atkScale);
    } else {
      ctx.scale(atkScale, atkScale);
    }

    // Slight breathing idle animation
    const breath = 1.0 + Math.sin((animFrame || Date.now()/100) * 0.08) * 0.02;
    ctx.scale(breath, breath);

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      this.sheets.rogues,
      def.col * 32, def.row * 32, 32, 32,
      -drawW/2, -drawH/2, drawW, drawH
    );

    ctx.restore();
    return true;
  },

  // ── DRAW ENEMY SPRITE ──────────────────────────────────────
  drawEnemy(enemyType, x, y, facing, animFrame, scale, isHit) {
    const def = this.ENEMIES[enemyType];
    if (!def || !this.sheets.monsters) return false;

    const s = scale || 2.5;
    const drawW = 32 * s;
    const drawH = 32 * s;

    const bob = animFrame ? Math.sin(animFrame * 0.05) * 2 : 0;
    const breath = 1.0 + Math.sin((animFrame || 0) * 0.06) * 0.03;

    ctx.save();
    ctx.translate(x, y + bob);
    ctx.scale(breath, breath);

    if (facing === 'left') {
      ctx.scale(-1, 1);
    }

    if (isHit) {
      ctx.globalAlpha = 0.5;
    }

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      this.sheets.monsters,
      def.col * 32, def.row * 32, 32, 32,
      -drawW/2, -drawH/2, drawW, drawH
    );

    ctx.restore();
    return true;
  },

  // ── DRAW BOSS SPRITE (animated) ────────────────────────────
  drawBoss(bossType, x, y, animFrame, scale, isHit, phase) {
    const def = this.BOSSES[bossType];
    if (!def) return false;

    let sheetKey = def.sheet;
    const sheet = this.sheets[sheetKey];
    if (!sheet) return false;

    const frameIdx = Math.floor((animFrame || 0) / 10) % def.frames;
    const s = scale || 1.5;
    const drawW = def.frameW * s;
    const drawH = def.frameH * s;

    const breath = 1.0 + Math.sin((animFrame || 0) * 0.04) * 0.03;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(breath, breath);

    if (isHit) {
      ctx.globalAlpha = 0.6;
    }

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      sheet,
      frameIdx * def.frameW, 0, def.frameW, def.frameH,
      -drawW/2, -drawH/2, drawW, drawH
    );

    ctx.restore();
    return true;
  }
};
