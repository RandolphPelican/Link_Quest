// ============================================================
// boss.js — Boss class, pure engine, no Phaser
// ============================================================

class Boss extends PhysicsObject {
  constructor(x, y, type) {
    const bossStats = {
      lazy_coder: { maxHp:300, speed:30, attackPower:12, attackRange:55, aggroRange:250, color:0xff6600, size:44, label:'LAZY CODER' },
      gossip_gpt: { maxHp:500, speed:28, attackPower:18, attackRange:60, aggroRange:300, color:0xcc00ff, size:50, label:'GOSSIP GPT' }
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

    // Phase 2
    if (this.phase === 1 && this.hp < this.maxHp * 0.5) {
      this.phase      = 2;
      this.speed      = this.baseSpeed * 1.8;
      this.attackPower = Math.floor(this.attackPower * 1.4);
      this.color      = this.type === 'gossip_gpt' ? 0xff00ff : 0xff2200;
      showToast(this.label_text + ' ENTERS PHASE 2!');
    }

    // Movement
    if (dist > this.attackRange && dist < this.aggroRange) {
      this.vx = (dx/dist) * this.speed;
      this.vy = (dy/dist) * this.speed;
    } else {
      this.vx = 0; this.vy = 0;
    }

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

    this.ringAngle += 0.02;

    // Projectiles
    this.projectiles = this.projectiles.filter(p => p.active);
    this.projectiles.forEach(p => p.updateBoss(player));

    super.update();
    if (roomMgr) roomMgr.resolveCollisions(this);

    this._updateDmgNums();
  }

  _specialAttack(player, dist, dx, dy) {
    if (this.type === 'lazy_coder') {
      this.specialCooldown = 200;
      const angles = [-25, 0, 25];
      const bdist  = Math.sqrt(dx*dx+dy*dy);
      if (bdist === 0) return;
      angles.forEach(deg => {
        const rad = deg * Math.PI / 180;
        const cos = Math.cos(rad), sin = Math.sin(rad);
        const vx  = ((dx/bdist)*cos - (dy/bdist)*sin) * 200;
        const vy  = ((dx/bdist)*sin + (dy/bdist)*cos) * 200;
        this.projectiles.push(new BossProjectile(this.x, this.y, vx, vy, this.attackPower*0.6, 0xffff00));
      });
      showToast('TYPO STORM!');
    } else if (this.type === 'gossip_gpt') {
      this.specialCooldown = this.phase === 2 ? 160 : 220;
      for (let i = 0; i < 8; i++) {
        const angle = (i/8) * Math.PI * 2;
        this.projectiles.push(
          new BossProjectile(this.x, this.y, Math.cos(angle)*220, Math.sin(angle)*220, this.attackPower*0.7, 0xcc00ff)
        );
      }
      if (this.phase === 2) {
        setTimeout(() => {
          this.x = Math.max(60, Math.min(740, 100 + Math.random()*600));
          this.y = Math.max(60, Math.min(540, 60  + Math.random()*440));
          showToast('TELEPORT!');
        }, 800);
      }
      showToast('HALLUCINATE!');
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

    // Pulsing ring
    const pulse = 0.12 + Math.sin(this.ringAngle) * 0.05;
    drawCircle(this.x, this.y, this.size * 0.9, this.color, pulse);

    drawRect(this.x, this.y, this.size, this.size, color);
    drawRectOutline(this.x, this.y, this.size, this.size, 0xffffff, 2);

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
    setTimeout(() => { this.active=false; }, 3000);
  }

  updateBoss(player) {
    if (!this.active) return;
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
    drawCircle(this.x, this.y, 8, this.color, 0.9);
    drawCircle(this.x, this.y, 14, this.color, 0.2);
  }
}
