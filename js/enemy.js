// ============================================================
// enemy.js — Enemy class with diverse types per level
// Pure Canvas2D, zero dependencies
// ============================================================

'use strict';

class Enemy extends PhysicsObject {
  constructor(x, y, type, pattern) {
    const typeStats = {
      // Level 1 — Debug Dungeon
      goblin:        { maxHp:40,  speed:45, attackPower:6,  attackRange:36, aggroRange:320, color:0x00ff88, label:'Goblin',        size:22, shape:'square' },
      goblin_chief:  { maxHp:80,  speed:38, attackPower:10, attackRange:40, aggroRange:350, color:0xcc2200, label:'Goblin Chief',  size:30, shape:'square' },
      ai_bug:        { maxHp:30,  speed:55, attackPower:5,  attackRange:40, aggroRange:340, color:0xff4444, label:'AI Bug',        size:18, shape:'diamond' },
      chatbot_clone: { maxHp:80,  speed:35, attackPower:10, attackRange:50, aggroRange:360, color:0x44aaff, label:'Chatbot Clone', size:28, shape:'circle' },
      // Level 2 — Hallucination Halls
      glitch_sprite: { maxHp:50,  speed:60, attackPower:8,  attackRange:38, aggroRange:380, color:0xff00ff, label:'Glitch Sprite', size:20, shape:'diamond' },
      memory_leak:   { maxHp:90,  speed:25, attackPower:14, attackRange:50, aggroRange:300, color:0x8844ff, label:'Memory Leak',   size:34, shape:'circle' },
      phantom_var:   { maxHp:45,  speed:70, attackPower:7,  attackRange:35, aggroRange:400, color:0xffaa00, label:'Phantom Var',   size:16, shape:'diamond' },
      null_pointer:  { maxHp:100, speed:30, attackPower:16, attackRange:55, aggroRange:320, color:0xff2288, label:'Null Pointer',  size:32, shape:'square' },
      // Level 3 — The Final Compile
      stack_overflow:{ maxHp:70,  speed:50, attackPower:12, attackRange:42, aggroRange:360, color:0xff6600, label:'Stack Overflow', size:26, shape:'circle' },
      syntax_error:  { maxHp:55,  speed:65, attackPower:10, attackRange:36, aggroRange:380, color:0xff0044, label:'Syntax Error',  size:22, shape:'diamond' },
      dark_compiler: { maxHp:120, speed:28, attackPower:18, attackRange:55, aggroRange:350, color:0x6600cc, label:'Dark Compiler', size:36, shape:'square' },
      trojan_horse:  { maxHp:85,  speed:40, attackPower:15, attackRange:48, aggroRange:340, color:0xaa0000, label:'Trojan Horse',  size:30, shape:'circle' }
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
    this.shape        = s.shape || 'square';
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
    this.dropChance   = 0.15;
    this.animPhase    = Math.random() * Math.PI * 2;
    this.projectiles  = [];
    this.shootCooldown = 0;
  }

  update(player, dt) {
    if (!this.alive || !player || !player.alive) return;
    this.animPhase += 3 * dt;

    if (this.stunTimer > 0) {
      this.stunTimer -= dt * 60;
      this.vx = 0; this.vy = 0;
      super.update(dt);
      this._updateDmgNums(dt);
      return;
    }

    const dx   = player.x - this.x;
    const dy   = player.y - this.y;
    const dist = Math.sqrt(dx*dx + dy*dy);

    if (dist < this.aggroRange) {
      if (this.pattern === 'ranged') {
        this.state = dist < 120 ? 'retreat' : dist < 250 ? 'attack' : 'chase';
      } else {
        this.state = dist < this.attackRange ? 'attack' : 'chase';
      }
    } else {
      this.state = 'idle';
    }

    switch(this.state) {
      case 'chase': this._moveByPattern(dx, dy, dist, player, dt); break;
      case 'retreat':
        if (dist > 0) {
          this.vx = -(dx/dist) * this.speed * 1.1;
          this.vy = -(dy/dist) * this.speed * 1.1;
        }
        if (this.shootCooldown <= 0) this._rangedAttack(player, dx, dy, dist);
        break;
      case 'attack':
        if (this.pattern === 'ranged') {
          this.vx = 0; this.vy = 0;
          if (this.shootCooldown <= 0) this._rangedAttack(player, dx, dy, dist);
        } else {
          this.vx = 0; this.vy = 0;
          if (this.attackCooldown <= 0) this._attackPlayer(player);
        }
        break;
      case 'idle':
        this._wander(dt);
        break;
    }

    if (this.attackCooldown > 0) this.attackCooldown -= dt * 60;
    if (this.shootCooldown  > 0) this.shootCooldown  -= dt * 60;
    if (this.flashTimer      > 0) this.flashTimer      -= dt * 60;

    // Update enemy projectiles
    this.projectiles = this.projectiles.filter(p => p.active);
    this.projectiles.forEach(p => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.x<30||p.x>770||p.y<30||p.y>570) { p.active=false; return; }
      if (Date.now() - p.birth > 2500) { p.active=false; return; }
      const pdx = player.x - p.x, pdy = player.y - p.y;
      if (Math.sqrt(pdx*pdx+pdy*pdy) < 20) {
        player.takeDamage(p.damage);
        p.active = false;
      }
    });

    super.update(dt);
    if (roomMgr) roomMgr.resolveCollisions(this);
    this._updateDmgNums(dt);
  }

  _moveByPattern(dx, dy, dist, player, dt) {
    if (dist === 0) return;
    if (this.pattern === 'rusher') {
      this.vx = (dx/dist) * this.speed;
      this.vy = (dy/dist) * this.speed;
    } else if (this.pattern === 'runner') {
      if (dist < 180) {
        this.vx = -(dx/dist) * this.speed * 1.2;
        this.vy = -(dy/dist) * this.speed * 1.2;
      } else { this._wander(dt); }
    } else if (this.pattern === 'stick_and_move') {
      if (this.retreating) {
        this.retreatTimer -= dt * 60;
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
    } else if (this.pattern === 'orbiter') {
      const angle = Math.atan2(dy, dx) + Math.PI/2;
      this.vx = Math.cos(angle) * this.speed * 0.8 + (dx/dist) * this.speed * 0.3;
      this.vy = Math.sin(angle) * this.speed * 0.8 + (dy/dist) * this.speed * 0.3;
    } else if (this.pattern === 'teleporter') {
      this.vx = (dx/dist) * this.speed * 0.6;
      this.vy = (dy/dist) * this.speed * 0.6;
      if (Math.random() < 0.005 && dist > 100) {
        this.x = player.x + (Math.random()-0.5) * 200;
        this.y = player.y + (Math.random()-0.5) * 200;
        this.x = Math.max(50, Math.min(750, this.x));
        this.y = Math.max(60, Math.min(540, this.y));
      }
    }
  }

  _wander(dt) {
    this.wanderTimer -= dt * 60;
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

  _rangedAttack(player, dx, dy, dist) {
    this.shootCooldown = 140;
    this.flashTimer = 6;
    if (dist === 0) return;
    const speed = 180;
    this.projectiles.push({
      x: this.x, y: this.y,
      vx: (dx/dist) * speed, vy: (dy/dist) * speed,
      damage: Math.floor(this.attackPower * 0.7),
      color: this.color,
      active: true,
      birth: Date.now()
    });
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
    ParticleSystem.spawn(this.x, this.y, this.color, 15);
    const scores = {
      goblin:50, goblin_chief:150, ai_bug:40, chatbot_clone:150,
      glitch_sprite:60, memory_leak:120, phantom_var:50, null_pointer:180,
      stack_overflow:80, syntax_error:70, dark_compiler:200, trojan_horse:100
    };
    if (typeof GameState !== 'undefined') GameState.score += (scores[this.type] || 50);

    // Key drops from chief/elite enemies
    const keyDroppers = ['goblin_chief', 'null_pointer', 'dark_compiler'];
    if (keyDroppers.includes(this.type)) {
      if (Array.isArray(items)) items.push(new Item(this.x, this.y, 'small_key'));
    } else if (Math.random() < this.dropChance) {
      const drops = ['chicken_nuggets','chicken_nuggets','mac_and_cheese','potion_sm','mana_vial','fruit_snacks','chocolate_milk'];
      const key   = drops[Math.floor(Math.random()*drops.length)];
      if (Array.isArray(items)) items.push(new Item(this.x, this.y, key));
    }
  }

  _spawnDmg(x, y, amount, color) {
    this.damageNumbers.push({ x, y, amount, color, life:45 });
  }

  _updateDmgNums(dt) {
    this.damageNumbers = this.damageNumbers.filter(d => d.life > 0);
    this.damageNumbers.forEach(d => { d.y -= 30 * dt; d.life -= dt * 60; });
  }

  render() {
    if (!this.alive) return;
    
    // Try to draw with Sprites first
    const t = this.animPhase;
    const isHit = this.flashTimer > 0;
    const facing = (this.vx < 0) ? 'left' : 'right';
    
    const spriteDrawn = Sprites.loaded && 
      Sprites.drawEnemy(this.type, this.x, this.y, facing, t * 10, 2.5, isHit);

    if (!spriteDrawn) {
      // Fallback procedural drawing with phenotypic variation
      const bob = Math.sin(t) * 3;
      const hw = this.w / 2, hh = this.h / 2;
      const stretch = 1.0 + Math.sin(t) * 0.05;

      ctx.save();
      ctx.translate(this.x, this.y + bob);
      ctx.scale(stretch, 2.0 - stretch);

      const fColor = isHit ? 0xffffff : this.color;

      if (this.shape === 'square') {
        drawRect(0, 0, this.w, this.h, fColor);
        drawRectOutline(0, 0, this.w, this.h, 0x000000, 1);
      } else if (this.shape === 'diamond') {
        ctx.rotate(Math.PI/4);
        drawRect(0, 0, this.w, this.h, fColor);
        drawRectOutline(0, 0, this.w, this.h, 0x000000, 1);
        ctx.rotate(-Math.PI/4);
      } else {
        drawCircle(0, 0, this.w/2, fColor);
        drawCircleOutline(0, 0, this.w/2, 0x000000, 1);
      }

      // Eyes
      const eyeSize = this.w * 0.15;
      drawRect(-this.w*0.2, -this.h*0.1, eyeSize, eyeSize, 0x000000);
      drawRect(this.w*0.2, -this.h*0.1, eyeSize, eyeSize, 0x000000);
      ctx.restore();
    }

    // Name tag
    const hh = this.h / 2;
    drawTextOutlined(this.label, this.x, this.y - hh - 15, 6, 0xffffff, 0x000000, 'center');

    // Damage numbers
    this.damageNumbers.forEach(d => {
      ctx.globalAlpha = d.life / 45;
      drawTextOutlined('-' + d.amount, d.x, d.y, 10, d.color, 0x000000, 'center');
      ctx.globalAlpha = 1;
    });

    // Projectiles
    this.projectiles.forEach(p => {
      drawCircle(p.x, p.y, 5, p.color);
      drawCircleOutline(p.x, p.y, 5, 0x000000, 1);
    });
  }
}
