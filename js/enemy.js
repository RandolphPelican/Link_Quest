// ============================================================
// enemy.js — Enemy class, pure engine, no Phaser
// ============================================================

class Enemy extends PhysicsObject {
  constructor(x, y, type, pattern) {
    const typeStats = {
      goblin:        { maxHp:40,  speed:45, attackPower:6,  attackRange:36, aggroRange:320, color:0x00ff88, label:'Goblin',       size:22 },
      goblin_chief:  { maxHp:80,  speed:38, attackPower:10, attackRange:40, aggroRange:350, color:0xcc2200, label:'Goblin Chief', size:30 },
      ai_bug:        { maxHp:30,  speed:55, attackPower:5,  attackRange:40, aggroRange:340, color:0xff4444, label:'AI Bug',       size:18 },
      chatbot_clone: { maxHp:80,  speed:35, attackPower:10, attackRange:50, aggroRange:360, color:0x44aaff, label:'Chatbot Clone',size:28 }
    };
    const s = typeStats[type] || typeStats.goblin;
    super(x, y, s.size, s.size);

    this.type         = type;
    this.alive        = true;
    this.maxHp        = s.maxHp;
    this.hp           = s.maxHp;
    this.speed        = s.speed;
    this.baseSpeed    = s.speed;
    this.attackPower  = s.attackPower;
    this.attackRange  = s.attackRange;
    this.aggroRange   = s.aggroRange;
    this.color        = s.color;
    this.label        = s.label;
    this.size         = s.size;
    this.pattern      = pattern || 'rusher';
    this.state        = 'idle';
    this.attackCooldown = 0;
    this.stunTimer    = 0;
    this.wanderTimer  = 0;
    this.wanderX      = x;
    this.wanderY      = y;
    this.retreating   = false;
    this.retreatTimer = 0;
    this.flashTimer   = 0;
    this.damageNumbers = [];
    this.dropChance   = 0.35;
  }

  update(player) {
    if (!this.alive) return;
    if (!player || !player.alive) return;

    if (this.stunTimer > 0) {
      this.stunTimer--;
      this.vx = 0; this.vy = 0;
      super.update();
      this._updateDmgNums();
      return;
    }

    const dx   = player.x - this.x;
    const dy   = player.y - this.y;
    const dist = Math.sqrt(dx*dx + dy*dy);

    if (dist < this.aggroRange) {
      this.state = dist < this.attackRange ? 'attack' : 'chase';
    } else {
      this.state = 'idle';
    }

    switch(this.state) {
      case 'chase':
        this._moveByPattern(dx, dy, dist, player);
        break;
      case 'attack':
        this.vx = 0; this.vy = 0;
        if (this.attackCooldown <= 0) this._attackPlayer(player);
        break;
      case 'idle':
        this._wander();
        break;
    }

    if (this.attackCooldown > 0) this.attackCooldown--;
    if (this.flashTimer     > 0) this.flashTimer--;

    super.update();
    if (roomMgr) roomMgr.resolveCollisions(this);
    this._updateDmgNums();
  }

  _moveByPattern(dx, dy, dist, player) {
    if (dist === 0) return;
    if (this.pattern === 'rusher') {
      this.vx = (dx/dist) * this.speed;
      this.vy = (dy/dist) * this.speed;
    } else if (this.pattern === 'runner') {
      if (dist < 180) {
        this.vx = -(dx/dist) * this.speed * 1.2;
        this.vy = -(dy/dist) * this.speed * 1.2;
      } else { this._wander(); }
    } else if (this.pattern === 'stick_and_move') {
      if (this.retreating) {
        this.retreatTimer--;
        this.vx = -(dx/dist) * this.speed * 1.1;
        this.vy = -(dy/dist) * this.speed * 1.1;
        if (this.retreatTimer <= 0) this.retreating = false;
      } else {
        this.vx = (dx/dist) * this.speed * 1.2;
        this.vy = (dy/dist) * this.speed * 1.2;
        if (dist < this.attackRange + 10 && this.attackCooldown <= 0) {
          this.retreating   = true;
          this.retreatTimer = 60;
        }
      }
    }
  }

  _wander() {
    this.wanderTimer--;
    if (this.wanderTimer <= 0) {
      this.wanderTimer = 80 + Math.floor(Math.random()*120);
      this.wanderX = Math.max(50, Math.min(750, this.x + (Math.random()-0.5)*140));
      this.wanderY = Math.max(50, Math.min(550, this.y + (Math.random()-0.5)*140));
    }
    const wx = this.wanderX - this.x;
    const wy = this.wanderY - this.y;
    const wd = Math.sqrt(wx*wx+wy*wy);
    if (wd > 5) {
      this.vx = (wx/wd) * this.speed * 0.35;
      this.vy = (wy/wd) * this.speed * 0.35;
    } else { this.vx = 0; this.vy = 0; }
  }

  _attackPlayer(player) {
    this.attackCooldown = 100;
    player.takeDamage(this.attackPower);
    this.flashTimer = 4;
  }

  takeDamage(amount) {
    if (!this.alive) return;
    this.hp = Math.max(0, this.hp - amount);
    this.flashTimer = 6;
    this.stunTimer  = 10;
    this.state      = 'stunned';
    this._spawnDmg(this.x, this.y - 14, amount, 0xff4757);
    if (this.hp <= 0) this.onDeath();
  }

  onDeath() {
    this.alive = false;
    this.vx = 0; this.vy = 0;
    const scores = { goblin:50, goblin_chief:150, ai_bug:40, chatbot_clone:150 };
    if (typeof GameState !== 'undefined') GameState.score += (scores[this.type] || 50);

    if (this.type === 'goblin_chief') {
      if (Array.isArray(items)) items.push(new Item(this.x, this.y, 'small_key'));
    } else if (Math.random() < this.dropChance) {
      const drops = ['chicken_nuggets','chicken_nuggets','mac_and_cheese','potion_sm'];
      const key   = drops[Math.floor(Math.random()*drops.length)];
      if (Array.isArray(items)) items.push(new Item(this.x, this.y, key));
    }
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
    drawRect(this.x, this.y, this.size, this.size, color);
    drawRectOutline(this.x, this.y, this.size, this.size, 0x000000, 1);

    // HP bar
    const barW = 30;
    drawRect(this.x, this.y - this.size/2 - 6, barW, 4, 0x333333);
    drawRect(
      this.x - barW/2 + (barW * this.hp/this.maxHp)/2,
      this.y - this.size/2 - 6,
      barW * this.hp/this.maxHp, 4, this.color
    );

    // Label
    drawTextOutlined(this.label, this.x, this.y - this.size/2 - 14, 7, 0x00ff88, 0x000000, 'center');

    // Damage numbers
    this.damageNumbers.forEach(d => {
      ctx.globalAlpha = d.life/45;
      drawTextOutlined('-'+d.amount, d.x, d.y, 11, d.color, 0x000000, 'center');
      ctx.globalAlpha = 1;
    });
  }
}
