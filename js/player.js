// ============================================================
// player.js — Player class, pure engine, no Phaser
// ============================================================

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

    const stats = {
      lincoln: { maxHp: 110, maxMp: 40,  attackPower: 22, speed: 180 },
      dad:     { maxHp: 140, maxMp: 30,  attackPower: 18, speed: 140 },
      journey: { maxHp:  80, maxMp: 80,  attackPower: 15, speed: 170 },
      bear:    { maxHp:  90, maxMp: 60,  attackPower: 20, speed: 200 }
    };
    const s = stats[characterKey] || stats.lincoln;
    this.maxHp       = s.maxHp;
    this.hp          = s.maxHp;
    this.maxMp       = s.maxMp;
    this.mp          = s.maxMp;
    this.attackPower = s.attackPower;
    this.speed       = s.speed;
    this.armor       = 'cloth';

    const colors = {
      lincoln: 0x3498db, dad: 0xe67e22,
      journey: 0x9b59b6, bear: 0x27ae60
    };
    this.color = colors[characterKey] || 0xffffff;
  }

  update() {
    if (!this.alive) return;
    this.vx = 0; this.vy = 0;

    if (Input.down('a') || Input.down('arrowleft'))  { this.vx = -this.speed; this.facing = 'left';  }
    if (Input.down('d') || Input.down('arrowright')) { this.vx =  this.speed; this.facing = 'right'; }
    if (Input.down('w') || Input.down('arrowup'))    { this.vy = -this.speed; this.facing = 'up';    }
    if (Input.down('s') || Input.down('arrowdown'))  { this.vy =  this.speed; this.facing = 'down';  }

    if (this.vx !== 0 && this.vy !== 0) { this.vx *= 0.707; this.vy *= 0.707; }

    super.update();
    if (roomMgr) roomMgr.resolveCollisions(this);

    if (Input.pressed(' ') && this.attackCooldown <= 0) this.attack();
    if (Input.pressed('e') && this.spellCooldown  <= 0) this.castSpell();

    if (this.attackCooldown > 0) this.attackCooldown--;
    if (this.spellCooldown  > 0) this.spellCooldown--;
    if (this.flashTimer     > 0) this.flashTimer--;
    if (this.invincible) { this.invincibleTimer--; if (this.invincibleTimer <= 0) this.invincible = false; }

    this.projectiles     = this.projectiles.filter(p => p.active);
    this.projectiles.forEach(p => p.update());
    this.damageNumbers   = this.damageNumbers.filter(d => d.life > 0);
    this.damageNumbers.forEach(d => { d.y -= 0.5; d.life--; });
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
    const spells = {
      dad:     { type:'aoe',        mp:15, damage:20, range:90,  color:0xaaff00 },
      journey: { type:'projectile', mp:10, damage:30, range:250, color:0xff6600 },
      bear:    { type:'projectile', mp:10, damage:18, range:220, color:0x00aaff, slow:true }
    };
    const spell = spells[this.characterKey];
    if (!spell) { showToast('No spell!'); return; }
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
      showToast('FART AoE!');
    } else {
      const dirs = { up:[0,-1], down:[0,1], left:[-1,0], right:[1,0] };
      const [vx, vy] = dirs[this.facing] || [0, 1];
      this.projectiles.push(new Projectile(
        this.x + vx*20, this.y + vy*20,
        vx*320, vy*320,
        spell.damage, spell.color, spell.range, spell.slow || false
      ));
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
    if (!this.alive) { drawRect(this.x, this.y, this.w, this.h, 0x555555); return; }
    if (this.invincible && Math.floor(Date.now()/80) % 2 === 0) return;

    const color = this.flashTimer > 0 ? this.flashColor : this.color;
    drawRect(this.x, this.y, this.w, this.h, color);
    drawRectOutline(this.x, this.y, this.w, this.h, 0xffffff, 1);

    const offsets = { down:[0,16], up:[0,-16], left:[-16,0], right:[16,0] };
    const [ox, oy] = offsets[this.facing] || [0, 16];
    drawRect(this.x+ox, this.y+oy, 6, 6, 0xffffff, 0.7);

    drawTextOutlined(this.characterKey, this.x, this.y-22, 7, 0xffffff, 0x000000, 'center');

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
  }

  update() {
    if (!this.active) return;
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
    drawCircle(this.x, this.y, 7, this.color, 0.9);
    drawCircle(this.x, this.y, 12, this.color, 0.2);
  }
}
