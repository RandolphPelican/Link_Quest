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

    this.hurtbox = new Hurtbox(this, 0, 0, this.size * 0.9, this.size * 0.9);
  }

  update(player, dt) {
    if (!this.alive || !player || !player.alive) return;

    if (this.stunTimer > 0) {
      this.stunTimer -= dt * 60;
      this.vx = 0; this.vy = 0;
      super.update(dt);
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
      this.shakeTimer = 0.5;
      if (typeof ScreenShake !== 'undefined') ScreenShake.trigger(8, 0.33);
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
      this.attackCooldown = 1.6; // In seconds
      player.takeDamage(this.attackPower);
      this.flashTimer = 0.1;
    }

    // Special attack
    if (this.specialCooldown <= 0 && dist < this.aggroRange) {
      this._specialAttack(player, dist, dx, dy);
    }

    if (this.attackCooldown  > 0) this.attackCooldown  -= dt;
    if (this.specialCooldown > 0) this.specialCooldown -= dt;
    if (this.flashTimer      > 0) this.flashTimer      -= dt;
    if (this.shakeTimer      > 0) this.shakeTimer      -= dt;
    this.ringAngle += 1.2 * dt;

    this.projectiles = this.projectiles.filter(p => p.active);
    this.projectiles.forEach(p => p.updateBoss(player, dt));

    super.update(dt);
    if (roomMgr) roomMgr.resolveCollisions(this);
    this._updateDmgNums(dt);
  }

  takeDamage(amount) {
    if (!this.alive) return;
    this.hp = Math.max(0, this.hp - amount);
    this.flashTimer = 0.15;
    this.stunTimer  = 0.1;
    this._spawnDmg(this.x, this.y - 20, amount, 0xff4757);
    if (this.hp <= 0) this.onDeath();
  }

  onDeath() {
    this.alive = false;
    this.vx = 0; this.vy = 0;
    ParticleSystem.spawn(this.x, this.y, this.color, 40);
    if (typeof GameState !== 'undefined') GameState.score += 1000;
    showToast('BOSS DEFEATED!', 4000);
    Events.emit(GameEvents.ENEMY_DIED, this);
  }

  _spawnDmg(x, y, amount, color) {
    this.damageNumbers.push({ x, y, amount, color, life: 0.75 });
  }

  _updateDmgNums(dt) {
    this.damageNumbers.forEach(d => {
      d.y -= 30 * dt;
      d.life -= dt;
    });
    this.damageNumbers = this.damageNumbers.filter(d => d.life > 0);
  }

  _specialAttack(player, dist, dx, dy) {
    this.specialCooldown = 3.0;
    if (this.type === 'lazy_coder') {
      // Spawn 3 rapid projectiles
      for (let i = -1; i <= 1; i++) {
        const angle = Math.atan2(dy, dx) + i * 0.2;
        this.projectiles.push(new BossProjectile(this.x, this.y, Math.cos(angle)*220, Math.sin(angle)*220, this.attackPower, this.color));
      }
    } else if (this.type === 'data_corruptor') {
      // Nova burst
      for (let a = 0; a < Math.PI*2; a += Math.PI/4) {
        this.projectiles.push(new BossProjectile(this.x, this.y, Math.cos(a)*180, Math.sin(a)*180, this.attackPower, this.color));
      }
    } else if (this.type === 'gossip_gpt') {
      // Aimed large projectile
      this.projectiles.push(new BossProjectile(this.x, this.y, (dx/dist)*250, (dy/dist)*250, this.attackPower*1.5, this.color, 12));
    }
  }

  render() {
    if (!this.alive) return;
    const t = Date.now() / 1000;
    const bob = Math.sin(t * 4) * 5;
    const hw = this.w / 2, hh = this.h / 2;

    ctx.save();
    ctx.translate(this.x, this.y + bob);

    // Glow ring
    drawCircleOutline(0, 0, this.size * 0.8 + Math.sin(this.ringAngle)*5, this.color, 2);
    
    const fColor = this.flashTimer > 0 ? 0xffffff : this.color;
    drawRect(0, 0, this.w, this.h, fColor);
    drawRectOutline(0, 0, this.w, this.h, 0x000000, 2);
    
    // Eyes
    drawRect(-10, -5, 6, 6, 0x000000);
    drawRect(10, -5, 6, 6, 0x000000);

    ctx.restore();

    this.projectiles.forEach(p => p.render());

    // Damage numbers
    this.damageNumbers.forEach(d => {
      ctx.globalAlpha = d.life / 0.75;
      drawTextOutlined('-' + d.amount, d.x, d.y, 14, d.color, 0x000000, 'center');
      ctx.globalAlpha = 1;
    });
  }
}

class BossProjectile {
  constructor(x, y, vx, vy, damage, color, size) {
    this.x=x; this.y=y; this.vx=vx; this.vy=vy;
    this.damage=damage; this.color=color; this.size=size||8;
    this.active=true;
  }
  updateBoss(player, dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (this.x<0||this.x>800||this.y<0||this.y>600) this.active=false;
    const dx = player.x - this.x, dy = player.y - this.y;
    if (Math.sqrt(dx*dx+dy*dy) < 20 + this.size) {
      player.takeDamage(this.damage);
      this.active = false;
    }
  }
  render() {
    drawCircle(this.x, this.y, this.size, this.color);
    drawCircleOutline(this.x, this.y, this.size, 0x000000, 1);
  }
}
