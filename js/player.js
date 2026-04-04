// ============================================================
// player.js — Player class, pixel-art sprites, full spell kit
// Pure Canvas2D, zero dependencies
// ============================================================

'use strict';

// ── SPRITE DRAWING ───────────────────────────────────────────
function drawCharSprite(x, y, charKey, facing, animFrame, isAttacking, w, h) {
  const def = window.CHAR_DEFS[charKey] || window.CHAR_DEFS.lincoln;
  const t = animFrame || 0;
  const hw = (w || 28) / 2;
  const hh = (h || 28) / 2;

  // Enhanced animation system
  const bob = Math.sin(t * 0.4) * 2;
  const stepCycle = Math.sin(t * 0.8); // Faster cycle for walking
  
  // Lunge offset for attacks
  let lx = 0, ly = 0;
  if (isAttacking) {
    const lunge = 10;
    if (facing === 'right') lx = lunge;
    if (facing === 'left')  lx = -lunge;
    if (facing === 'up')    ly = -lunge;
    if (facing === 'down')  ly = lunge;
  }

  // Arm/leg movement for walking animation
  const armSwing = stepCycle * 4;
  const legSwing = stepCycle * 6;

  ctx.save();
  ctx.translate(x + lx, y + bob + ly);

  // ── LEGS ─────────────────────────────────────────────
  const legW = 5, legH = 6;
  const legY = hh - 2;
  
  // Enhanced leg animation with proper walking cycle
  const legOff = isAttacking ? 0 : legSwing;
  const legRaise = Math.abs(legSwing) * 2;

  ctx.fillStyle = hexToCSS(def.accent);
  if (facing === 'left' || facing === 'right') {
    // Side view legs - swing forward/backward
    drawRect(-legOff, legY - legRaise, legW, legH, def.accent);
    drawRect(legOff, legY + legRaise, legW, legH, def.accent);
  } else {
    // Front/back view legs - swing side to side
    drawRect(-hw/2 + legOff, legY - legRaise, legW, legH, def.accent);
    drawRect(hw/2 - legOff, legY + legRaise, legW, legH, def.accent);
  }

  // ── BODY ─────────────────────────────────────────────
...

    drawRect(0, 2, hw*2.2, hh*2.2, def.color);
    drawRectOutline(0, 2, hw*2.2, hh*2.2, def.accent, 1);
    drawRect(0, 4, hw*2.2, 4, def.accent);
  } else if (charKey === 'journey') {
    ctx.fillStyle = hexToCSS(def.color);
    ctx.beginPath();
    ctx.moveTo(-hw*0.7, -hh);
    ctx.lineTo(hw*0.7, -hh);
    ctx.lineTo(hw*1.1, hh);
    ctx.lineTo(-hw*1.1, hh);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = hexToCSS(def.accent);
    ctx.lineWidth = 1;
    ctx.stroke();
  } else if (charKey === 'noha') {
    drawRect(0, 1, hw*1.6, hh*2, def.color);
    drawRectOutline(0, 1, hw*1.6, hh*2, def.accent, 1);
    drawRect(0, -hh*0.5, hw*1.8, 4, def.accent);
  } else if (charKey === 'bear') {
    drawRect(0, 1, hw*1.8, hh*2, def.color);
    drawRectOutline(0, 1, hw*1.8, hh*2, def.accent, 1);
    const strapSide = facing === 'left' ? -1 : 1;
    drawLine(strapSide * hw * 0.2, -hh, strapSide * hw * 0.9, hh*0.6, def.accent, 2);
  } else {
    drawRect(0, 1, hw*1.8, hh*2, def.color);
    drawRectOutline(0, 1, hw*1.8, hh*2, def.accent, 1);
    drawRect(0, 2, 6, 6, 0xffd700);
  }

  // ── HEAD ─────────────────────────────────────────────
  const headY = -hh - 4;
  const headR = charKey === 'dad' ? 8 : charKey === 'noha' ? 5.5 : 6.5;
  drawCircle(0, headY, headR, 0xf0c8a0);
  drawCircleOutline(0, headY, headR, def.accent, 1);

  if (charKey === 'lincoln') {
    drawRect(0, headY - headR + 1, headR*2.2, 5, def.color);
    ctx.fillStyle = hexToCSS(def.color);
    ctx.beginPath();
    ctx.moveTo(-2, headY - headR - 2);
    ctx.lineTo(2, headY - headR - 2);
    ctx.lineTo(0, headY - headR - 6);
    ctx.closePath();
    ctx.fill();
  }
  if (charKey === 'journey') {
    ctx.fillStyle = hexToCSS(def.color);
    ctx.beginPath();
    ctx.moveTo(-headR, headY - 2);
    ctx.lineTo(headR, headY - 2);
    ctx.lineTo(0, headY - headR - 10);
    ctx.closePath();
    ctx.fill();
    drawCircle(0, headY - headR - 10, 2, 0xffee00);
  }
  if (charKey === 'noha') {
    ctx.fillStyle = hexToCSS(def.accent);
    ctx.beginPath();
    ctx.arc(0, headY, headR + 2, -Math.PI, 0);
    ctx.closePath();
    ctx.fill();
  }
  if (charKey === 'bear') {
    drawRect(0, headY - 2, headR*2.4, 3, def.accent);
  }

  // ── EYES ─────────────────────────────────────────────
  const eyeOff = { down:[0,2], up:[0,-3], left:[-3,0], right:[3,0] };
  const [eox, eoy] = eyeOff[facing] || [0, 2];
  if (facing !== 'up') {
    if (facing === 'left' || facing === 'right') {
      drawRect(eox, headY + eoy, 2, 2, 0x222222);
    } else {
      drawRect(-2 + eox, headY + eoy, 2, 2, 0x222222);
      drawRect(2 + eox, headY + eoy, 2, 2, 0x222222);
    }
  }

  // ── ARMS & WEAPON ─────────────────────────────────────
  const wepDir = { down:[0,1], up:[0,-1], left:[-1,0], right:[1,0] };
  const [wx, wy] = wepDir[facing] || [0, 1];
  const atkExt = isAttacking ? 6 : 0;
  
  // Arm animation - swings with walking and extends during attacks
  const armSwing = isAttacking ? armSwing * 2 : armSwing;
  const armX = (facing === 'left' ? -hw : hw) * 0.9;
  const armY = -hh * 0.3;
  
  // Draw arms (simple rectangles that swing)
  ctx.fillStyle = hexToCSS(def.color);
  if (facing === 'left' || facing === 'right') {
    // Side view - single arm visible
    const armPosX = armX - (facing === 'left' ? armSwing : -armSwing);
    const armPosY = armY + Math.abs(armSwing) * 0.5;
    drawRect(armPosX, armPosY, 3, 10, def.color);
    
    // Weapon extends from arm
    if (def.weapon === 'sword') {
      const sx = armPosX + (facing === 'left' ? -3 : 10);
      const sy = armPosY + 5;
      drawLine(sx, sy, sx + (facing === 'left' ? -14 : 14) + wx * atkExt, sy + wy * atkExt, 0xccccdd, 2);
      drawLine(sx + (facing === 'left' ? -14 : 14) - wy*3, sy + wx*3,
               sx + (facing === 'left' ? -14 : 14) + wy*3, sy - wx*3, 0x8b6914, 2);
    } else if (def.weapon === 'staff') {
      drawLine(armPosX, armPosY, armPosX, armPosY + 20, 0x8b6914, 2);
      drawCircle(armPosX, armPosY - 5, 4, 0xff6600, 0.8);
    } else if (def.weapon === 'bow') {
      ctx.strokeStyle = hexToCSS(0x8b6914);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(armPosX + 5, armPosY + 5, 8, -Math.PI*0.4, Math.PI*0.4);
      ctx.stroke();
      drawLine(armPosX + 13, armPosY, armPosX + 13, armPosY + 10, 0xaaaaaa, 1);
    } else if (def.weapon === 'club') {
      drawLine(armPosX, armPosY + 5, armPosX + (facing === 'left' ? -12 : 12) + wx * atkExt, 
               armPosY + 5 + wy * atkExt, 0x8b6914, 3);
      drawCircle(armPosX + (facing === 'left' ? -14 : 14), armPosY + 5, 4, 0x6a4020);
    } else if (def.weapon === 'daggers') {
      drawLine(armPosX, armPosY + 5, armPosX + (facing === 'left' ? -8 : 8), armPosY + 5, 0xccccdd, 1.5);
    }
  } else {
    // Front/back view - both arms visible
    const leftArmX = -hw * 0.6 - armSwing;
    const rightArmX = hw * 0.6 + armSwing;
    const armYPos = armY + Math.abs(armSwing) * 0.3;
    
    drawRect(leftArmX, armYPos, 3, 10, def.color);
    drawRect(rightArmX, armYPos, 3, 10, def.color);
    
    // Weapons for front/back view
    if (def.weapon === 'sword') {
      drawLine(0, hh * 0.6, wx * 14, sy + wy * atkExt, 0xccccdd, 2);
    } else if (def.weapon === 'staff') {
      drawLine(0, -hh - 5, 0, hh + 5, 0x8b6914, 2);
      drawCircle(0, -hh - 10, 4, 0xff6600, 0.8);
    }
  }

  ctx.restore();
}

// ── PLAYER CLASS ─────────────────────────────────────────────
class Player extends PhysicsObject {
  constructor(x, y, characterKey) {
    super(x, y, 28, 28);
    this.characterKey    = characterKey;
    this.alive           = true;
    this.facing          = 'down';
    this.attackCooldown  = 0;
    this.spellCooldown   = 0;
    this.invincible      = false;
    this.invincibleTimer = 0;
    this.projectiles     = [];
    this.damageNumbers   = [];
    this.flashTimer      = 0;
    this.flashColor      = null;
    this.dashTrail       = [];
    this.animFrame       = 0;
    this.moving          = false;
    this.spinTimer       = 0;
    this.mpRegenTimer    = 0;
    this.stepSfxTimer    = 0;

    const def = window.CHAR_DEFS[characterKey] || window.CHAR_DEFS.lincoln;
    this.maxHp       = def.maxHp;
    this.hp          = def.maxHp;
    this.maxMp       = def.maxMp;
    this.mp          = def.maxMp;
    this.attackPower = def.attackPower;
    this.speed       = def.speed;
    this.armor       = 'cloth';
    this.color       = def.color;
  }

  update(dt) {
    if (!this.alive) return;
    this.vx = 0; this.vy = 0;

    let mvx = 0, mvy = 0;
    if (Input.down('a') || Input.down('arrowleft'))  { mvx = -1; this.facing = 'left';  }
    if (Input.down('d') || Input.down('arrowright')) { mvx =  1; this.facing = 'right'; }
    if (Input.down('w') || Input.down('arrowup'))    { mvy = -1; this.facing = 'up';    }
    if (Input.down('s') || Input.down('arrowdown'))  { mvy =  1; this.facing = 'down';  }

    if (mvx !== 0 || mvy !== 0) {
      const mag = Math.sqrt(mvx*mvx + mvy*mvy);
      this.vx = (mvx / mag) * this.speed;
      this.vy = (mvy / mag) * this.speed;
      this.moving = true;
      this.animFrame += dt * 10;
    } else {
      this.moving = false;
      this.animFrame = 0;
    }

    // Update animation frame based on movement
    const wasMoving = this.moving;
    this.moving = (this.vx !== 0 || this.vy !== 0);
    
    if (this.moving) {
      this.animFrame += dt * 120; // Faster animation when moving
    } else {
      this.animFrame += dt * 30; // Slow breathing when idle
    }
    
    // Determine facing direction based on movement
    if (this.vx < -0.1) this.facing = 'left';
    else if (this.vx > 0.1) this.facing = 'right';
    else if (this.vy < -0.1) this.facing = 'up';
    else if (this.vy > 0.1) this.facing = 'down';

    super.update(dt);
    if (roomMgr) roomMgr.resolveCollisions(this);

    if (Input.pressed('k') && this.attackCooldown <= 0) this.attack();
    if (Input.pressed('p') && this.spellCooldown  <= 0) this.castSpell();

    if (this.attackCooldown > 0) this.attackCooldown -= dt * 60;
    if (this.spellCooldown  > 0) this.spellCooldown  -= dt * 60;
    if (this.flashTimer     > 0) this.flashTimer     -= dt * 60;
    if (this.spinTimer      > 0) this.spinTimer      -= dt * 60;
    if (this.invincible) {
      this.invincibleTimer -= dt * 60;
      if (this.invincibleTimer <= 0) this.invincible = false;
    }

    this.projectiles     = this.projectiles.filter(p => p.active);
    this.projectiles.forEach(p => p.update(dt));
    this.damageNumbers   = this.damageNumbers.filter(d => d.life > 0);
    this.damageNumbers.forEach(d => { d.y -= 30 * dt; d.life -= dt * 60; });
    this.dashTrail       = this.dashTrail.filter(t => t.life > 0);
    this.dashTrail.forEach(t => { t.life -= dt * 60; });

    // Passive MP regeneration (1 MP every ~2 seconds)
    this.mpRegenTimer += dt * 60;
    if (this.mpRegenTimer >= 120) {
      this.mpRegenTimer = 0;
      if (this.mp < this.maxMp) this.mp = Math.min(this.maxMp, this.mp + 1);
    }

    // Auto-pickup nearby items
    if (typeof items !== 'undefined') {
      items.forEach(item => {
        if (item.collected) return;
        const dx = item.x - this.x;
        const dy = item.y - this.y;
        if (Math.sqrt(dx*dx + dy*dy) < 32) {
          item.collect(this);
          if (typeof GameState !== 'undefined') GameState.score += 20;
        }
      });
    }

    // Floor switch activation
    if (roomMgr) roomMgr.checkSwitches(this);
  }

  attack() {
    this.attackCooldown = 28;
    this.flashTimer     = 4;
    this.flashColor     = 0xffff00;
    const offsets = { down:[0,30], up:[0,-30], left:[-30,0], right:[30,0] };
    const [ox, oy] = offsets[this.facing] || [0, 30];
    const ax = this.x + ox, ay = this.y + oy;
    const targets = [...enemies, ...(boss && boss.alive ? [boss] : [])];
    
    // Play attack sound
    if (typeof SoundSystem !== 'undefined') {
      SoundSystem.play('attack');
    }
    
    let hitSomething = false;
    targets.forEach(t => {
      if (!t.alive) return;
      const dx = t.x - ax, dy = t.y - ay;
      if (Math.sqrt(dx*dx+dy*dy) < 55) {
        t.takeDamage(this.attackPower);
        this._spawnDmg(t.x, t.y - 10, this.attackPower, 0xff4757);
        hitSomething = true;
        
        // Play hit sound
        if (typeof SoundSystem !== 'undefined') {
          SoundSystem.play('hit');
        }
        
        // Blood particles on hit
        if (typeof ParticleSystem !== 'undefined') {
          ParticleSystem.spawn(t.x, t.y, 0xff4444, 6, 'blood');
        }
      }
    });
    
    // Weapon hit effect at attack position
    if (typeof ParticleSystem !== 'undefined') {
      if (hitSomething) {
        // Hit sparks
        ParticleSystem.spawn(ax, ay, 0xffff00, 8, 'spark');
        ParticleSystem.spawn(ax, ay, 0xffaa00, 4, 'spark');
      } else {
        // Miss effect - smaller sparks
        ParticleSystem.spawn(ax, ay, 0xcccccc, 3, 'spark');
      }
    }
  }

  castSpell() {
    const def = window.CHAR_DEFS[this.characterKey];
    if (!def || !def.spell) { showToast('No spell!'); return; }
    const spell = def.spell;
    if (this.mp < spell.mp) { showToast('Not enough MP!'); return; }
    this.mp -= spell.mp;
    this.spellCooldown = 60;

    if (spell.type === 'aoe') {
      // Play spell sound
      if (typeof SoundSystem !== 'undefined') {
        SoundSystem.play('spell');
      }
      
      const targets = [...enemies, ...(boss && boss.alive ? [boss] : [])];
      targets.forEach(t => {
        if (!t.alive) return;
        const dx = t.x - this.x, dy = t.y - this.y;
        if (Math.sqrt(dx*dx+dy*dy) < spell.range) {
          t.takeDamage(spell.damage);
          this._spawnDmg(t.x, t.y - 10, spell.damage, 0xaaff00);
          
          // Play hit sound
          if (typeof SoundSystem !== 'undefined') {
            SoundSystem.play('hit');
          }
          
          // Fart cloud particles
          if (typeof ParticleSystem !== 'undefined') {
            ParticleSystem.spawn(t.x, t.y, 0xaaff00, 4, 'smoke');
          }
        }
      });
      
      // Big fart explosion at player position
      if (typeof ParticleSystem !== 'undefined') {
        ParticleSystem.spawnExplosion(this.x, this.y, 0xaaff00);
      }
      
      showToast('💨 FART AoE!');

    } else if (spell.type === 'spin') {
      this.spinTimer = 15;
      const targets = [...enemies, ...(boss && boss.alive ? [boss] : [])];
      targets.forEach(t => {
        if (!t.alive) return;
        const dx = t.x - this.x, dy = t.y - this.y;
        if (Math.sqrt(dx*dx+dy*dy) < spell.range) {
          t.takeDamage(spell.damage);
          this._spawnDmg(t.x, t.y - 10, spell.damage, 0x00ccff);
          
          // Spin hit particles
          if (typeof ParticleSystem !== 'undefined') {
            ParticleSystem.spawn(t.x, t.y, 0x00ccff, 6, 'spark');
          }
        }
      });
      
      // Spin start particles
      if (typeof ParticleSystem !== 'undefined') {
        for (let i = 0; i < 10; i++) {
          const angle = (i / 10) * Math.PI * 2;
          const distance = 40 + Math.random() * 20;
          ParticleSystem.spawn(
            this.x + Math.cos(angle) * distance,
            this.y + Math.sin(angle) * distance,
            0x00ccff, 3, 'magic'
          );
        }
      }
      
      showToast('⚔️ SPIN ATTACK!');

    } else if (spell.type === 'dash') {
      const dirs = { up:[0,-1], down:[0,1], left:[-1,0], right:[1,0] };
      const [dx, dy] = dirs[this.facing] || [0, 1];
      const startX = this.x, startY = this.y;
      const endX = this.x + dx * spell.range;
      const endY = this.y + dy * spell.range;
      this.dashTrail = [];
      for (let i = 0; i < 5; i++) {
        this.dashTrail.push({
          x: startX + (endX - startX) * (i/5),
          y: startY + (endY - startY) * (i/5),
          life: 20 + i * 4
        });
      }
      const targets = [...enemies, ...(boss && boss.alive ? [boss] : [])];
      targets.forEach(t => {
        if (!t.alive) return;
        const ex = t.x - startX, ey = t.y - startY;
        const proj = ex * dx + ey * dy;
        if (proj < 0 || proj > spell.range) return;
        const perpX = ex - proj * dx, perpY = ey - proj * dy;
        if (Math.sqrt(perpX*perpX + perpY*perpY) < 40) {
          t.takeDamage(spell.damage);
          this._spawnDmg(t.x, t.y - 10, spell.damage, 0xe74c3c);
        }
      });
      this.x = Math.max(50, Math.min(750, endX));
      this.y = Math.max(60, Math.min(540, endY));
      this.invincible = true;
      this.invincibleTimer = 20;
      showToast('🗡️ SHADOW DASH!');

    } else {
      const dirs = { up:[0,-1], down:[0,1], left:[-1,0], right:[1,0] };
      const [vx, vy] = dirs[this.facing] || [0, 1];
      this.projectiles.push(new Projectile(
        this.x + vx*20, this.y + vy*20,
        vx*320, vy*320,
        spell.damage, spell.color, spell.range, spell.slow || false
      ));
      if (spell.slow) showToast('❄️ ICE ARROW!');
      else showToast('🔥 FIREBALL!');
    }
  }

  takeDamage(amount) {
    if (this.invincible || !this.alive) return;
    const armorMod = { cloth:1.0, leather:0.8, metal:0.6 };
    const dmg = Math.max(1, Math.floor(amount * (armorMod[this.armor] || 1.0)));
    this.hp = Math.max(0, this.hp - dmg);
    this.invincible = true; this.invincibleTimer = 45;
    this.flashTimer = 8;    this.flashColor = 0xff0000;
    this._spawnDmg(this.x, this.y - 15, dmg, 0xff4757);
    if (this.hp <= 0) this.alive = false;
  }

  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
    this._spawnDmg(this.x, this.y - 15, amount, 0x2ecc71);
  }

  _spawnDmg(x, y, amount, color) {
    this.damageNumbers.push({ x, y, amount, color, life: 45 });
  }

  render() {
    if (!this.alive) {
      drawRect(this.x, this.y, this.w, this.h, 0x555555, 0.4);
      ctx.font = '14px serif'; ctx.textAlign = 'center';
      ctx.fillText('💀', this.x, this.y + 5);
      return;
    }
    if (this.invincible && Math.floor(Date.now()/80) % 2 === 0) return;

    // Dash trail afterimages
    this.dashTrail.forEach(t => {
      ctx.globalAlpha = (t.life / 24) * 0.35;
      if (Sprites.loaded) {
        Sprites.drawHero(this.characterKey, t.x, t.y, this.facing, this.animFrame, 3.0, false);
      } else {
        drawCharSprite(t.x, t.y, this.characterKey, this.facing, this.animFrame, false, this.w, this.h);
      }
      ctx.globalAlpha = 1;
    });

    // Spin attack ring
    if (this.spinTimer > 0) {
      const spinAlpha = this.spinTimer / 15;
      const spinR = 70 * (1 - spinAlpha * 0.3);
      drawCircle(this.x, this.y, spinR, 0x00ccff, 0.15 * spinAlpha);
      drawCircleOutline(this.x, this.y, spinR, 0x00ccff, 2);
      const angle = (15 - this.spinTimer) / 15 * Math.PI * 4;
      const sx = this.x + Math.cos(angle) * 35;
      const sy = this.y + Math.sin(angle) * 35;
      drawLine(this.x, this.y, sx, sy, 0x00ccff, 2);
      drawCircle(sx, sy, 4, 0xffffff, 0.8);
    }

    // Fart cloud for Dad AoE
    if (this.characterKey === 'dad' && this.spellCooldown > 50) {
      const cloudAlpha = (this.spellCooldown - 50) / 10;
      for (let i = 0; i < 6; i++) {
        const a = (i/6) * Math.PI * 2 + Date.now()/400;
        const cr = 40 + Math.sin(a*2) * 15;
        drawCircle(this.x + Math.cos(a)*cr, this.y + Math.sin(a)*cr,
          12 + Math.random()*5, 0xaaff00, 0.12 * cloudAlpha);
      }
    }

    // Draw character — try real sprites first, fall back to canvas
    const isAtk = this.attackCooldown > 20;
    const isHurt = this.flashTimer > 0 && this.flashColor === 0xff0000;

    if (isHurt) {
      ctx.globalAlpha = 0.7;
    }

    const spriteDrawn = Sprites.loaded &&
      Sprites.drawHero(this.characterKey, this.x, this.y, this.facing, this.animFrame, 3.0, isAtk);

    if (!spriteDrawn) {
      drawCharSprite(this.x, this.y, this.characterKey, this.facing, this.animFrame, isAtk, this.w, this.h);
    }

    if (isHurt) {
      ctx.globalAlpha = 0.3;
      drawRect(this.x, this.y, 40, 40, 0xff0000);
      ctx.globalAlpha = 1;
    }

    // Attack slash arc — visible swing when K is pressed
    if (this.attackCooldown > 18) {
      const progress = (28 - this.attackCooldown) / 10;
      const slashAlpha = 1.0 - progress;
      const slashDist = 30 + progress * 15;
      const offsets = { down:[0,1], up:[0,-1], left:[-1,0], right:[1,0] };
      const [sx, sy] = offsets[this.facing] || [0,1];
      const slashX = this.x + sx * slashDist;
      const slashY = this.y + sy * slashDist;

      ctx.save();
      ctx.globalAlpha = slashAlpha * 0.7;
      ctx.translate(slashX, slashY);
      // Rotate slash based on facing
      const angles = { down: 0, right: -Math.PI/2, up: Math.PI, left: Math.PI/2 };
      ctx.rotate(angles[this.facing] || 0);
      // Draw arc slash
      ctx.strokeStyle = hexToCSS(0xffffff);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 20 + progress * 10, -Math.PI * 0.6, Math.PI * 0.6);
      ctx.stroke();
      ctx.strokeStyle = hexToCSS(0xffdd44);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, 14 + progress * 8, -Math.PI * 0.4, Math.PI * 0.4);
      ctx.stroke();
      ctx.restore();
    }

    // Name tag — positioned above the bigger sprite
    const def = window.CHAR_DEFS[this.characterKey] || window.CHAR_DEFS.lincoln;
    drawTextOutlined(def.label, this.x, this.y - 52, 8, 0xffffff, 0x000000, 'center');

    // Damage numbers
    this.damageNumbers.forEach(d => {
      ctx.globalAlpha = d.life / 45;
      drawTextOutlined(
        (d.color === 0x2ecc71 ? '+' : '-') + d.amount,
        d.x, d.y, 12, d.color, 0x000000, 'center'
      );
      ctx.globalAlpha = 1;
    });
  }
}

// ── PROJECTILE ────────────────────────────────────────────────
class Projectile {
  constructor(x, y, vx, vy, damage, color, maxRange, slow) {
    this.x=x; this.y=y; this.vx=vx; this.vy=vy;
    this.damage=damage; this.color=color;
    this.maxRange=maxRange; this.slow=slow;
    this.active=true; this.startX=x; this.startY=y;
    this.trail = [];
  }

  update(dt) {
    if (!this.active) return;
    this.trail.push({x:this.x, y:this.y, life:8});
    this.trail.forEach(t => t.life -= dt * 60);
    this.trail = this.trail.filter(t => t.life > 0);
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    const dx=this.x-this.startX, dy=this.y-this.startY;
    if (Math.sqrt(dx*dx+dy*dy) > this.maxRange) { this.active=false; return; }
    if (this.x<30||this.x>770||this.y<30||this.y>570) { this.active=false; return; }
    const targets = [...enemies, ...(boss && boss.alive ? [boss] : [])];
    targets.forEach(t => {
      if (!t.alive||!this.active) return;
      const dx=t.x-this.x, dy=t.y-this.y;
      if (Math.sqrt(dx*dx+dy*dy) < 22) {
        t.takeDamage(this.damage);
        if (this.slow && t.speed) {
          t.speed = Math.max(20, t.speed*0.5);
          setTimeout(()=>{ if(t.speed) t.speed*=2; }, 2000);
        }
        this.active=false;
      }
    });
  }

  render() {
    if (!this.active) return;
    this.trail.forEach(t => {
      ctx.globalAlpha = t.life / 8 * 0.3;
      drawCircle(t.x, t.y, 4, this.color);
      ctx.globalAlpha = 1;
    });
    drawCircle(this.x, this.y, 7, this.color, 0.9);
    drawCircle(this.x, this.y, 12, this.color, 0.2);
  }
}
