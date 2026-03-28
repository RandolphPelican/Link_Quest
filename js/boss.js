// ============================================================
// boss.js — Boss class with 3 unique bosses
// Pure Canvas2D, zero dependencies
// ============================================================

'use strict';

class Boss extends PhysicsObject {
  constructor(x, y, type) {
    const bossStats = {
      lazy_coder:     { maxHp:300, speed:30, attackPower:12, attackRange:55, aggroRange:250, color:0xff6600, size:44, label:'LAZY CODER' },
      data_corruptor: { maxHp:450, speed:35, attackPower:15, attackRange:55, aggroRange:280, color:0x8844ff, size:48, label:'DATA CORRUPTOR' },
      gossip_gpt:     { maxHp:600, speed:28, attackPower:18, attackRange:60, aggroRange:300, color:0xcc00ff, size:52, label:'GOSSIP GPT' }
    };
    const s = bossStats[type] || bossStats.lazy_coder;
    super(x, y, s.size, s.size);

    this.type          = type;
    this.alive         = true;
    this.phase         = 1;
    this.maxHp         = s.maxHp;
    this.hp            = s.maxHp;
    this.speed         = s.speed;
    this.baseSpeed     = s.speed;
    this.attackPower   = s.attackPower;
    this.attackRange   = s.attackRange;
    this.aggroRange    = s.aggroRange;
    this.color         = s.color;
    this.baseColor     = s.color;
    this.size          = s.size;
    this.label_text    = s.label;
    this.attackCooldown  = 0;
    this.specialCooldown = 0;
    this.stunTimer     = 0;
    this.flashTimer    = 0;
    this.projectiles   = [];
    this.damageNumbers = [];
    this.ringAngle     = 0;
    this.shakeTimer    = 0;
  }

  update(player) {
    if (!this.alive || !player || !player.alive) return;

    if (this.stunTimer > 0) {
      this.stunTimer--;
      this.vx = 0; this.vy = 0;
      super.update();
      return;
    }

    const dx   = player.x - this.x;
    const dy   = player.y - this.y;
    const dist = Math.sqrt(dx*dx + dy*dy);

    // Phase transitions
    if (this.phase === 1 && this.hp < this.maxHp * 0.5) {
      this.phase      = 2;
      this.speed      = this.baseSpeed * 1.8;
      this.attackPower = Math.floor(this.attackPower * 1.4);
      this.shakeTimer = 30;
      if (typeof ScreenShake !== 'undefined') ScreenShake.trigger(8, 20);
      if (this.type === 'gossip_gpt') this.color = 0xff00ff;
      else if (this.type === 'data_corruptor') this.color = 0xaa00ff;
      else this.color = 0xff2200;
      showToast(this.label_text + ' ENTERS PHASE 2!');
    }

    // Movement
    if (dist > this.attackRange && dist < this.aggroRange) {
      this.vx = (dx/dist) * this.speed;
      this.vy = (dy/dist) * this.speed;
    } else { this.vx = 0; this.vy = 0; }

    // Melee attack
    if (dist < this.attackRange && this.attackCooldown <= 0) {
      this.attackCooldown = 100;
      player.takeDamage(this.attackPower);
      this.flashTimer = 4;
    }

    // Special attack
    if (this.specialCooldown <= 0 && dist < this.aggroRange) {
      this._specialAttack(player, dist, dx, dy);
    }

    if (this.attackCooldown  > 0) this.attackCooldown--;
    if (this.specialCooldown > 0) this.specialCooldown--;
    if (this.flashTimer      > 0) this.flashTimer--;
    if (this.shakeTimer      > 0) this.shakeTimer--;
    this.ringAngle += 0.02;

    this.projectiles = this.projectiles.filter(p => p.active);
    this.projectiles.forEach(p => p.updateBoss(player));

    super.update();
    if (roomMgr) roomMgr.resolveCollisions(this);
    this._updateDmgNums();
  }

  _specialAttack(player, dist, dx, dy) {
    if (this.type === 'lazy_coder') {
      // Typo Storm — 3 projectiles in a spread
      this.specialCooldown = 200;
      const bdist = Math.sqrt(dx*dx+dy*dy) || 1;
      [-25, 0, 25].forEach(deg => {
        const rad = deg * Math.PI / 180;
        const cos = Math.cos(rad), sin = Math.sin(rad);
        const vx  = ((dx/bdist)*cos - (dy/bdist)*sin) * 200;
        const vy  = ((dx/bdist)*sin + (dy/bdist)*cos) * 200;
        this.projectiles.push(new BossProjectile(this.x, this.y, vx, vy, this.attackPower*0.6, 0xffff00));
      });
      showToast('TYPO STORM!');

    } else if (this.type === 'data_corruptor') {
      this.specialCooldown = this.phase === 2 ? 140 : 190;
      if (Math.random() < 0.5) {
        // Corruption Wave — expanding ring of projectiles
        for (let i = 0; i < 6; i++) {
          const angle = (i/6) * Math.PI * 2;
          this.projectiles.push(
            new BossProjectile(this.x, this.y, Math.cos(angle)*180, Math.sin(angle)*180, this.attackPower*0.5, 0x8844ff)
          );
        }
        showToast('CORRUPTION WAVE!');
      } else {
        // Data Drain — line of projectiles toward player
        const bdist = Math.sqrt(dx*dx+dy*dy) || 1;
        for (let i = 0; i < 4; i++) {
          setTimeout(() => {
            if (!this.alive) return;
            this.projectiles.push(
              new BossProjectile(this.x, this.y, (dx/bdist)*250, (dy/bdist)*250, this.attackPower*0.7, 0xaa44ff)
            );
          }, i * 150);
        }
        showToast('DATA DRAIN!');
      }

    } else if (this.type === 'gossip_gpt') {
      this.specialCooldown = this.phase === 2 ? 130 : 200;
      if (Math.random() < 0.4 || this.phase === 2) {
        // Hallucination Burst — 8 projectiles in all directions
        for (let i = 0; i < 8; i++) {
          const angle = (i/8) * Math.PI * 2;
          this.projectiles.push(
            new BossProjectile(this.x, this.y, Math.cos(angle)*220, Math.sin(angle)*220, this.attackPower*0.7, 0xcc00ff)
          );
        }
        if (this.phase === 2) {
          // Phase 2: teleport after burst
          setTimeout(() => {
            if (!this.alive) return;
            this.x = Math.max(60, Math.min(740, 100 + Math.random()*600));
            this.y = Math.max(60, Math.min(540, 60  + Math.random()*440));
            showToast('TELEPORT!');
          }, 800);
        }
        showToast('HALLUCINATE!');
      } else {
        // Gossip Chain — aimed spread
        const bdist = Math.sqrt(dx*dx+dy*dy) || 1;
        [-40, -20, 0, 20, 40].forEach(deg => {
          const rad = deg * Math.PI / 180;
          const cos = Math.cos(rad), sin = Math.sin(rad);
          const vx  = ((dx/bdist)*cos - (dy/bdist)*sin) * 180;
          const vy  = ((dx/bdist)*sin + (dy/bdist)*cos) * 180;
          this.projectiles.push(new BossProjectile(this.x, this.y, vx, vy, this.attackPower*0.5, 0xff44ff));
        });
        showToast('GOSSIP CHAIN!');
      }
    }
  }

  takeDamage(amount) {
    if (!this.alive) return;
    this.hp = Math.max(0, this.hp - amount);
    this.flashTimer = 6;
    this.stunTimer  = 8;
    this._spawnDmg(this.x, this.y - this.size/2 - 10, amount, 0xff4757);
    if (this.hp <= 0) this.onDeath();
  }

  onDeath() {
    this.alive = false;
    this.vx = 0; this.vy = 0;
    this.projectiles = [];
    showToast(this.label_text + ' DEFEATED!');
  }

  _spawnDmg(x, y, amount, color) {
    this.damageNumbers.push({ x, y, amount, color, life:45 });
  }

  _updateDmgNums() {
    this.damageNumbers = this.damageNumbers.filter(d => d.life > 0);
    this.damageNumbers.forEach(d => { d.y -= 0.5; d.life--; });
  }

  render() {
    if (!this.alive) return;
    const color = this.flashTimer > 0 ? 0xffffff : this.color;
    const t = Date.now() / 1000;

    // Screen shake on phase transition
    let shakeX = 0, shakeY = 0;
    if (this.shakeTimer > 0) {
      shakeX = (Math.random()-0.5) * 6;
      shakeY = (Math.random()-0.5) * 6;
    }

    // Pulsing aura
    const pulse = 0.12 + Math.sin(this.ringAngle) * 0.05;
    drawCircle(this.x + shakeX, this.y + shakeY, this.size * 0.9, this.color, pulse);

    // Phase 2 outer ring
    if (this.phase === 2) {
      drawCircleOutline(this.x + shakeX, this.y + shakeY,
        this.size * 1.2 + Math.sin(t*3)*4, this.color, 1);
    }

    // Body
    drawRect(this.x + shakeX, this.y + shakeY, this.size, this.size, color);
    drawRectOutline(this.x + shakeX, this.y + shakeY, this.size, this.size, 0xffffff, 2);

    // Face — menacing eyes
    const eyeColor = this.phase === 2 ? 0xff0000 : 0xffee00;
    drawRect(this.x - 8 + shakeX, this.y - 6 + shakeY, 8, 6, eyeColor);
    drawRect(this.x + 8 + shakeX, this.y - 6 + shakeY, 8, 6, eyeColor);
    drawRect(this.x - 8 + shakeX, this.y - 4 + shakeY, 4, 2, 0x000000);
    drawRect(this.x + 8 + shakeX, this.y - 4 + shakeY, 4, 2, 0x000000);

    // Type-specific decorations
    if (this.type === 'lazy_coder') {
      // Coffee cup
      drawRect(this.x + this.size/2 + 8 + shakeX, this.y + shakeY, 10, 14, 0x885533);
      drawRect(this.x + this.size/2 + 8 + shakeX, this.y - 10 + shakeY, 8, 3, 0xcccccc, 0.5);
    } else if (this.type === 'data_corruptor') {
      // Glitch effect
      if (Math.random() < 0.1) {
        const gy = this.y + (Math.random()-0.5)*this.size;
        drawRect(this.x + shakeX, gy + shakeY, this.size + 10, 3, this.color, 0.5);
      }
    } else if (this.type === 'gossip_gpt') {
      // Chat bubbles orbiting
      for (let i = 0; i < 3; i++) {
        const a = t * 1.5 + (i/3) * Math.PI * 2;
        const bx = this.x + Math.cos(a) * (this.size * 0.8);
        const by = this.y + Math.sin(a) * (this.size * 0.6);
        drawCircle(bx + shakeX, by + shakeY, 6, 0xcc00ff, 0.4);
        drawTextOutlined('...', bx + shakeX, by + shakeY, 6, 0xffffff, 0x000000, 'center');
      }
    }

    // HP bar
    const barW = 60;
    drawRect(this.x, this.y - this.size/2 - 10, barW, 6, 0x333333);
    drawRect(
      this.x - barW/2 + (barW * this.hp/this.maxHp)/2,
      this.y - this.size/2 - 10,
      barW * this.hp/this.maxHp, 6, this.color
    );

    drawTextOutlined('👹 '+this.label_text, this.x, this.y - this.size/2 - 22, 9, 0xff4757, 0x000000, 'center');

    // Projectiles
    this.projectiles.forEach(p => p.renderBoss());

    // Damage numbers
    this.damageNumbers.forEach(d => {
      ctx.globalAlpha = d.life/45;
      drawTextOutlined('-'+d.amount, d.x, d.y, 11, d.color, 0x000000, 'center');
      ctx.globalAlpha = 1;
    });
  }
}

// ── BOSS PROJECTILE ───────────────────────────────────────────
class BossProjectile {
  constructor(x, y, vx, vy, damage, color) {
    this.x=x; this.y=y; this.vx=vx; this.vy=vy;
    this.damage=damage; this.color=color;
    this.active=true;
    this.birth = Date.now();
    this.trail = [];
  }

  updateBoss(player) {
    if (!this.active) return;
    if (Date.now() - this.birth > 3000) { this.active = false; return; }
    this.trail.push({x:this.x, y:this.y, life:6});
    this.trail = this.trail.filter(t => t.life-- > 0);
    this.x += this.vx/60;
    this.y += this.vy/60;
    if (this.x<30||this.x>770||this.y<30||this.y>570) { this.active=false; return; }
    if (!player||!player.alive) return;
    const dx=player.x-this.x, dy=player.y-this.y;
    if (Math.sqrt(dx*dx+dy*dy) < 20) {
      player.takeDamage(this.damage);
      this.active=false;
    }
  }

  renderBoss() {
    if (!this.active) return;
    this.trail.forEach(t => {
      ctx.globalAlpha = t.life / 6 * 0.2;
      drawCircle(t.x, t.y, 4, this.color);
      ctx.globalAlpha = 1;
    });
    drawCircle(this.x, this.y, 8, this.color, 0.9);
    drawCircle(this.x, this.y, 14, this.color, 0.2);
  }
}
