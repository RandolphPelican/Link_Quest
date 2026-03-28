// ============================================================
// player.js — Player class, pixel-art sprites, full spell kit
// Pure Canvas2D, zero dependencies
// ============================================================

'use strict';

// ── CHARACTER DEFINITIONS ────────────────────────────────────
const CHAR_DEFS = {
  lincoln: {
    maxHp: 110, maxMp: 40, attackPower: 22, speed: 180,
    color: 0x3498db, accent: 0x2980b9, weapon: 'sword',
    spell: { type:'spin', mp:10, damage:26, range:70, color:0x00ccff },
    label: 'Lincoln'
  },
  journey: {
    maxHp: 80, maxMp: 80, attackPower: 15, speed: 170,
    color: 0x9b59b6, accent: 0x8e44ad, weapon: 'staff',
    spell: { type:'projectile', mp:10, damage:30, range:250, color:0xff6600 },
    label: 'Journey'
  },
  bear: {
    maxHp: 90, maxMp: 60, attackPower: 20, speed: 200,
    color: 0x27ae60, accent: 0x1e8449, weapon: 'bow',
    spell: { type:'projectile', mp:10, damage:18, range:220, color:0x00aaff, slow:true },
    label: 'Bear'
  },
  dad: {
    maxHp: 140, maxMp: 30, attackPower: 18, speed: 140,
    color: 0xe67e22, accent: 0xd35400, weapon: 'club',
    spell: { type:'aoe', mp:15, damage:20, range:90, color:0xaaff00 },
    label: 'Dad'
  },
  noha: {
    maxHp: 85, maxMp: 50, attackPower: 24, speed: 220,
    color: 0xe74c3c, accent: 0xc0392b, weapon: 'daggers',
    spell: { type:'dash', mp:12, damage:28, range:160, color:0xe74c3c },
    label: 'Noha'
  }
};

// ── SPRITE DRAWING ───────────────────────────────────────────
function drawCharSprite(x, y, charKey, facing, animFrame, isAttacking, w, h) {
  const def = CHAR_DEFS[charKey] || CHAR_DEFS.lincoln;
  const t = animFrame || 0;
  const bob = Math.sin(t * 0.15) * 1.5;
  const hw = (w || 28) / 2;
  const hh = (h || 28) / 2;

  ctx.save();
  ctx.translate(x, y + bob);

  // ── BODY ─────────────────────────────────────────────
  if (charKey === 'dad') {
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

  // ── WEAPON ───────────────────────────────────────────
  const wepDir = { down:[0,1], up:[0,-1], left:[-1,0], right:[1,0] };
  const [wx, wy] = wepDir[facing] || [0, 1];
  const atkExt = isAttacking ? 6 : 0;

  if (def.weapon === 'sword') {
    const sx = hw * wx * 1.2 + wx * atkExt;
    const sy = hh * wy * 0.8 + wy * atkExt;
    drawLine(sx, sy, sx + wx*14, sy + wy*14, 0xccccdd, 2);
    drawLine(sx + wx*14 - wy*3, sy + wy*14 + wx*3,
             sx + wx*14 + wy*3, sy + wy*14 - wx*3, 0x8b6914, 2);
  } else if (def.weapon === 'staff') {
    const sx = hw * (facing === 'left' ? -1 : 1) * 1.1;
    drawLine(sx, -hh - 8, sx, hh + 4, 0x8b6914, 2);
    drawCircle(sx, -hh - 10, 4, 0xff6600, 0.8);
    drawCircle(sx, -hh - 10, 6, 0xff6600, 0.3);
  } else if (def.weapon === 'bow') {
    const sx = hw * (facing === 'left' ? -1 : 1) * 1.1;
    ctx.strokeStyle = hexToCSS(0x8b6914);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(sx, 0, 10, -Math.PI*0.4, Math.PI*0.4);
    ctx.stroke();
    drawLine(sx + 8, -6, sx + 8, 6, 0xaaaaaa, 1);
  } else if (def.weapon === 'club') {
    const sx = hw * wx * 1.2 + wx * atkExt;
    const sy = hh * wy * 0.8 + wy * atkExt;
    drawLine(sx, sy, sx + wx*12, sy + wy*12, 0x8b6914, 3);
    drawCircle(sx + wx*14, sy + wy*14, 5, 0x6a4020);
  } else if (def.weapon === 'daggers') {
    const atkOff = isAttacking ? 4 : 0;
    const d1x = -hw * 0.8 + (facing === 'left' ? -atkOff : 0);
    const d2x = hw * 0.8 + (facing === 'right' ? atkOff : 0);
    const dy = wy * 8 + wy * atkOff;
    drawLine(d1x, dy, d1x + wx*8, dy + wy*8, 0xccccdd, 1.5);
    drawLine(d2x, dy, d2x + wx*8, dy + wy*8, 0xccccdd, 1.5);
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

    const def = CHAR_DEFS[characterKey] || CHAR_DEFS.lincoln;
    this.maxHp       = def.maxHp;
    this.hp          = def.maxHp;
    this.maxMp       = def.maxMp;
    this.mp          = def.maxMp;
    this.attackPower = def.attackPower;
    this.speed       = def.speed;
    this.armor       = 'cloth';
    this.color       = def.color;
  }

  update() {
    if (!this.alive) return;
    this.vx = 0; this.vy = 0;

    if (Input.down('a') || Input.down('arrowleft'))  { this.vx = -this.speed; this.facing = 'left';  }
    if (Input.down('d') || Input.down('arrowright')) { this.vx =  this.speed; this.facing = 'right'; }
    if (Input.down('w') || Input.down('arrowup'))    { this.vy = -this.speed; this.facing = 'up';    }
    if (Input.down('s') || Input.down('arrowdown'))  { this.vy =  this.speed; this.facing = 'down';  }

    this.moving = this.vx !== 0 || this.vy !== 0;
    if (this.moving) this.animFrame++;

    if (this.vx !== 0 && this.vy !== 0) { this.vx *= 0.707; this.vy *= 0.707; }

    super.update();
    if (roomMgr) roomMgr.resolveCollisions(this);

    if (Input.pressed(' ') && this.attackCooldown <= 0) this.attack();
    if (Input.pressed('e') && this.spellCooldown  <= 0) this.castSpell();

    if (this.attackCooldown > 0) this.attackCooldown--;
    if (this.spellCooldown  > 0) this.spellCooldown--;
    if (this.flashTimer     > 0) this.flashTimer--;
    if (this.spinTimer      > 0) this.spinTimer--;
    if (this.invincible) { this.invincibleTimer--; if (this.invincibleTimer <= 0) this.invincible = false; }

    this.projectiles     = this.projectiles.filter(p => p.active);
    this.projectiles.forEach(p => p.update());
    this.damageNumbers   = this.damageNumbers.filter(d => d.life > 0);
    this.damageNumbers.forEach(d => { d.y -= 0.5; d.life--; });
    this.dashTrail       = this.dashTrail.filter(t => t.life > 0);
    this.dashTrail.forEach(t => { t.life--; });

    // Passive MP regeneration (1 MP every ~2 seconds)
    this.mpRegenTimer++;
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
    targets.forEach(t => {
      if (!t.alive) return;
      const dx = t.x - ax, dy = t.y - ay;
      if (Math.sqrt(dx*dx+dy*dy) < 55) {
        t.takeDamage(this.attackPower);
        this._spawnDmg(t.x, t.y - 10, this.attackPower, 0xff4757);
      }
    });
  }

  castSpell() {
    const def = CHAR_DEFS[this.characterKey];
    if (!def || !def.spell) { showToast('No spell!'); return; }
    const spell = def.spell;
    if (this.mp < spell.mp) { showToast('Not enough MP!'); return; }
    this.mp -= spell.mp;
    this.spellCooldown = 60;

    if (spell.type === 'aoe') {
      const targets = [...enemies, ...(boss && boss.alive ? [boss] : [])];
      targets.forEach(t => {
        if (!t.alive) return;
        const dx = t.x - this.x, dy = t.y - this.y;
        if (Math.sqrt(dx*dx+dy*dy) < spell.range) {
          t.takeDamage(spell.damage);
          this._spawnDmg(t.x, t.y - 10, spell.damage, 0xaaff00);
        }
      });
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
        }
      });
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
    if (typeof ScreenShake !== 'undefined') ScreenShake.trigger(4, 8);
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
      drawCharSprite(t.x, t.y, this.characterKey, this.facing, this.animFrame, false, this.w, this.h);
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

    // Draw character sprite
    const isAtk = this.flashTimer > 0 && this.flashColor === 0xffff00;
    if (this.flashTimer > 0 && this.flashColor === 0xff0000) {
      ctx.globalAlpha = 0.7;
      drawCharSprite(this.x, this.y, this.characterKey, this.facing, this.animFrame, isAtk, this.w, this.h);
      ctx.globalAlpha = 0.3;
      drawRect(this.x, this.y, this.w + 4, this.h + 4, 0xff0000);
      ctx.globalAlpha = 1;
    } else {
      drawCharSprite(this.x, this.y, this.characterKey, this.facing, this.animFrame, isAtk, this.w, this.h);
    }

    // Name tag
    const def = CHAR_DEFS[this.characterKey] || CHAR_DEFS.lincoln;
    drawTextOutlined(def.label, this.x, this.y - 26, 7, 0xffffff, 0x000000, 'center');

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

  update() {
    if (!this.active) return;
    this.trail.push({x:this.x, y:this.y, life:8});
    this.trail = this.trail.filter(t => t.life-- > 0);
    this.x += this.vx/60;
    this.y += this.vy/60;
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
#..
