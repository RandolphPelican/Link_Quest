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
    this.dropChance   = 0.35;
    this.animPhase    = Math.random() * Math.PI * 2;
  }

  update(player) {
    if (!this.alive || !player || !player.alive) return;
    this.animPhase += 0.05;

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
      case 'chase': this._moveByPattern(dx, dy, dist, player); break;
      case 'attack':
        this.vx = 0; this.vy = 0;
        if (this.attackCooldown <= 0) this._attackPlayer(player);
        break;
      case 'idle': this._wander(); break;
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
    } else if (this.pattern === 'orbiter') {
      // Circles around player while slowly closing in
      const angle = Math.atan2(dy, dx) + Math.PI/2;
      this.vx = Math.cos(angle) * this.speed * 0.8 + (dx/dist) * this.speed * 0.3;
      this.vy = Math.sin(angle) * this.speed * 0.8 + (dy/dist) * this.speed * 0.3;
    } else if (this.pattern === 'teleporter') {
      // Moves toward player, occasionally "blinks" to a new position
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

  _updateDmgNums() {
    this.damageNumbers = this.damageNumbers.filter(d => d.life > 0);
    this.damageNumbers.forEach(d => { d.y -= 0.5; d.life--; });
  }

  render() {
    if (!this.alive) return;
    const color = this.flashTimer > 0 ? 0xffffff : this.color;
    const t = Date.now() / 1000;

    // Shape-based rendering
    if (this.shape === 'diamond') {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(Math.PI/4 + Math.sin(this.animPhase)*0.1);
      drawRect(0, 0, this.size*0.75, this.size*0.75, color);
      drawRectOutline(0, 0, this.size*0.75, this.size*0.75, 0x000000, 1);
      ctx.restore();
    } else if (this.shape === 'circle') {
      drawCircle(this.x, this.y, this.size/2, color);
      drawCircleOutline(this.x, this.y, this.size/2, 0x000000, 1);
      // Animated inner ring
      drawCircleOutline(this.x, this.y, this.size/3, color, 1);
    } else {
      drawRect(this.x, this.y, this.size, this.size, color);
      drawRectOutline(this.x, this.y, this.size, this.size, 0x000000, 1);
    }

    // Eyes — always facing player
    if (typeof player !== 'undefined' && player) {
      const edx = player.x - this.x, edy = player.y - this.y;
      const ed = Math.sqrt(edx*edx+edy*edy) || 1;
      const eyeX = (edx/ed) * 3, eyeY = (edy/ed) * 3;
      drawRect(this.x + eyeX - 3, this.y + eyeY - 2, 3, 3, 0x000000);
      drawRect(this.x + eyeX + 3, this.y + eyeY - 2, 3, 3, 0x000000);
    }

    // HP bar
    const barW = 30;
    drawRect(this.x, this.y - this.size/2 - 6, barW, 4, 0x333333);
    drawRect(
      this.x - barW/2 + (barW * this.hp/this.maxHp)/2,
      this.y - this.size/2 - 6,
      barW * this.hp/this.maxHp, 4, this.color
    );

    // Label
    drawTextOutlined(this.label, this.x, this.y - this.size/2 - 14, 6, this.color, 0x000000, 'center');

    // Damage numbers
    this.damageNumbers.forEach(d => {
      ctx.globalAlpha = d.life/45;
      drawTextOutlined('-'+d.amount, d.x, d.y, 11, d.color, 0x000000, 'center');
      ctx.globalAlpha = 1;
    });
  }
}
#..
