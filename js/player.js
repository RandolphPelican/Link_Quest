// ============================================================
// player.js — Player mechanics: movement, combat, spells, armor
// ============================================================

class Player {
  constructor(scene, x, y, characterKey) {
    this.scene        = scene;
    this.characterKey = characterKey;
    this.speed        = 180;
    this.maxHp        = 100;
    this.hp           = 100;
    this.maxMp        = 50;
    this.mp           = 50;
    this.attackPower  = 20;
    this.attackRange  = 60;
    this.armor        = 'leather';
    this.alive        = true;
    this.attackCooldown = 0;
    this.spellCooldown  = 0;
    this.invincible     = false;
    this.invincibleTimer = 0;
    this.facing       = 'down'; // up | down | left | right

    // Character stat overrides
    const stats = {
      lincoln: { maxHp: 110, attackPower: 22, speed: 180 },
      dad:     { maxHp: 140, attackPower: 18, speed: 140 },
      journey: { maxHp:  80, attackPower: 15, speed: 170 },
      bear:    { maxHp:  90, attackPower: 20, speed: 200 }
    };
    if (stats[characterKey]) Object.assign(this, stats[characterKey]);
    this.hp = this.maxHp;

    // Colors per character
    const colors = {
      lincoln: 0x3498db,
      dad:     0xe67e22,
      journey: 0x9b59b6,
      bear:    0x27ae60
    };

    // Main sprite (rectangle placeholder)
    this.sprite = scene.add.rectangle(x, y, 28, 28, colors[characterKey] || 0xffffff);
    scene.physics.add.existing(this.sprite);
    this.sprite.body.setCollideWorldBounds(true);
    this.sprite.body.setSize(24, 24);

    // Direction indicator (small triangle facing direction)
    this.dirDot = scene.add.rectangle(x, y + 16, 8, 4, 0xffffff, 0.7);

    // Name label
    this.label = scene.add.text(x - 20, y - 26, characterKey, {
      fontSize: '9px', fill: '#fff',
      stroke: '#000', strokeThickness: 2
    }).setDepth(10);

    // Attack hitbox (invisible until swung)
    this.attackBox = scene.add.rectangle(x, y, 44, 44, 0xf1c40f, 0);
    scene.physics.add.existing(this.attackBox, true);

    // Spell projectiles list
    this.projectiles = [];
  }

  update(cursors, wasd) {
    if (!this.alive) return;

    const body = this.sprite.body;
    body.setVelocity(0);

    // ── Movement ──────────────────────────────────────────────
    let moving = false;
    if (cursors.left.isDown  || wasd.left.isDown)  { body.setVelocityX(-this.speed); this.facing = 'left';  moving = true; }
    if (cursors.right.isDown || wasd.right.isDown) { body.setVelocityX( this.speed); this.facing = 'right'; moving = true; }
    if (cursors.up.isDown    || wasd.up.isDown)    { body.setVelocityY(-this.speed); this.facing = 'up';    moving = true; }
    if (cursors.down.isDown  || wasd.down.isDown)  { body.setVelocityY( this.speed); this.facing = 'down';  moving = true; }

    // Normalize diagonal speed
    if (body.velocity.x !== 0 && body.velocity.y !== 0) {
      body.velocity.x *= 0.707;
      body.velocity.y *= 0.707;
    }

    // Pulse color when moving
    if (moving) {
      this.sprite.fillAlpha = 0.85 + Math.sin(Date.now() * 0.01) * 0.15;
    } else {
      this.sprite.fillAlpha = 1;
    }

    // Sync all child objects to sprite position
    this._syncPositions();

    // ── Attack ────────────────────────────────────────────────
    if (Phaser.Input.Keyboard.JustDown(wasd.attack) && this.attackCooldown <= 0) {
      this.attack();
    }

    // ── Spell ─────────────────────────────────────────────────
    if (Phaser.Input.Keyboard.JustDown(wasd.spell) && this.spellCooldown <= 0) {
      this.castSpell();
    }

    // ── Cooldown ticks ────────────────────────────────────────
    if (this.attackCooldown > 0) this.attackCooldown--;
    if (this.spellCooldown  > 0) this.spellCooldown--;

    // ── Invincibility frames ──────────────────────────────────
    if (this.invincible) {
      this.invincibleTimer--;
      this.sprite.fillAlpha = this.invincibleTimer % 6 < 3 ? 0.3 : 1;
      if (this.invincibleTimer <= 0) {
        this.invincible = false;
        this.sprite.fillAlpha = 1;
      }
    }

    // ── Update projectiles ────────────────────────────────────
    this.projectiles = this.projectiles.filter(p => p.active);
    this.projectiles.forEach(p => p.update());
  }

  _syncPositions() {
    const x = this.sprite.x;
    const y = this.sprite.y;

    // Direction dot follows facing
    const offsets = {
      down:  [0,  16], up:   [0, -16],
      left:  [-16, 0], right: [16,  0]
    };
    const [ox, oy] = offsets[this.facing] || [0, 16];
    this.dirDot.setPosition(x + ox, y + oy);

    this.label.setPosition(x - 20, y - 28);
    this.attackBox.setPosition(x + ox * 1.2, y + oy * 1.2);
  }

  attack() {
    this.attackCooldown = 28;

    // Flash attack box
    this.attackBox.fillAlpha = 0.5;
    this.scene.time.delayedCall(120, () => { this.attackBox.fillAlpha = 0; });

    // Screen shake micro
    this.scene.cameras.main.shake(60, 0.003);

    // Check all enemies for hit
    const targets = [
      ...(this.scene.enemies || []),
      ...(this.scene.boss && this.scene.boss.alive ? [this.scene.boss] : [])
    ];

    targets.forEach(target => {
      if (!target.alive) return;
      const dx = target.sprite.x - this.attackBox.x;
      const dy = target.sprite.y - this.attackBox.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < this.attackRange + 10) {
        target.takeDamage(this.attackPower);
        this._spawnDamageNumber(target.sprite.x, target.sprite.y, this.attackPower);
      }
    });
  }

  castSpell() {
    const spellMap = {
      lincoln: null,
      dad:     { type: 'aoe',        mp: 15, damage: 20, range: 90,  color: 0xaaff00 },
      journey: { type: 'projectile', mp: 10, damage: 30, range: 250, color: 0xff6600 },
      bear:    { type: 'projectile', mp: 10, damage: 18, range: 220, color: 0x00aaff, slow: true }
    };

    const spell = spellMap[this.characterKey];
    if (!spell) { showToast('Lincoln has no spell!'); return; }
    if (this.mp < spell.mp) { showToast('Not enough MP!'); return; }

    this.mp -= spell.mp;
    this.spellCooldown = 60;

    if (spell.type === 'aoe') {
      // Dad's Fart AoE — hits all nearby enemies
      this._castAoE(spell);
    } else if (spell.type === 'projectile') {
      // Journey fireball / Bear ice arrow
      this._castProjectile(spell);
    }
  }

  _castAoE(spell) {
    // Visual ring
    const ring = this.scene.add.circle(this.sprite.x, this.sprite.y, spell.range, spell.color, 0.25);
    this.scene.time.delayedCall(400, () => ring.destroy());

    const targets = [
      ...(this.scene.enemies || []),
      ...(this.scene.boss && this.scene.boss.alive ? [this.scene.boss] : [])
    ];

    targets.forEach(target => {
      if (!target.alive) return;
      const dx = target.sprite.x - this.sprite.x;
      const dy = target.sprite.y - this.sprite.y;
      if (Math.sqrt(dx*dx + dy*dy) < spell.range) {
        target.takeDamage(spell.damage);
        this._spawnDamageNumber(target.sprite.x, target.sprite.y, spell.damage, '#aaff00');
      }
    });

    showToast('💨 FART AoE!');
  }

  _castProjectile(spell) {
    const dirVectors = {
      up:    [0, -1], down:  [0,  1],
      left:  [-1, 0], right: [1,  0]
    };
    const [vx, vy] = dirVectors[this.facing] || [0, 1];

    const proj = new Projectile(
      this.scene,
      this.sprite.x + vx * 20,
      this.sprite.y + vy * 20,
      vx * 320, vy * 320,
      spell.damage, spell.color, spell.range,
      spell.slow || false
    );
    this.projectiles.push(proj);
  }

  _spawnDamageNumber(x, y, amount, color = '#ff4757') {
    const txt = this.scene.add.text(x, y - 10, `-${amount}`, {
      fontSize: '13px', fill: color,
      stroke: '#000', strokeThickness: 2
    }).setDepth(20);
    this.scene.tweens.add({
      targets: txt,
      y: y - 40,
      alpha: 0,
      duration: 700,
      onComplete: () => txt.destroy()
    });
  }

  takeDamage(amount) {
    if (this.invincible || !this.alive) return;

    const armorMod = { cloth: 1.0, leather: 0.8, chain: 0.6 };
    const dmg = Math.max(1, Math.floor(amount * (armorMod[this.armor] || 1.0)));
    this.hp = Math.max(0, this.hp - dmg);

    // Flash red
    this.sprite.fillColor = 0xff0000;
    this.scene.time.delayedCall(150, () => {
      const colors = { lincoln:0x3498db, dad:0xe67e22, journey:0x9b59b6, bear:0x27ae60 };
      this.sprite.fillColor = colors[this.characterKey] || 0xffffff;
    });

    // Invincibility frames after hit
    this.invincible = true;
    this.invincibleTimer = 45;

    this._spawnDamageNumber(this.sprite.x, this.sprite.y, dmg);

    if (this.hp <= 0) this.onDeath();
  }

  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
    // Green float text
    const txt = this.scene.add.text(this.sprite.x, this.sprite.y - 10, `+${amount}`, {
      fontSize: '13px', fill: '#2ecc71',
      stroke: '#000', strokeThickness: 2
    }).setDepth(20);
    this.scene.tweens.add({
      targets: txt, y: this.sprite.y - 40, alpha: 0,
      duration: 700, onComplete: () => txt.destroy()
    });
  }

  onDeath() {
    this.alive = false;
    this.sprite.fillColor = 0x555555;
    this.sprite.body.setVelocity(0);
    this.label.setText('💀');
  }
}

// ============================================================
// Projectile — used by Journey & Bear spells
// ============================================================
class Projectile {
  constructor(scene, x, y, vx, vy, damage, color, maxRange, slow) {
    this.scene    = scene;
    this.damage   = damage;
    this.maxRange = maxRange;
    this.slow     = slow;
    this.active   = true;
    this.startX   = x;
    this.startY   = y;

    this.sprite = scene.add.circle(x, y, 7, color);
    scene.physics.add.existing(this.sprite);
    this.sprite.body.setVelocity(vx, vy);
    this.sprite.body.setCollideWorldBounds(true);
    this.sprite.body.onWorldBounds = true;
    scene.physics.world.on('worldbounds', (body) => {
      if (body === this.sprite.body) this.destroy();
    });
  }

  update() {
    if (!this.active) return;

    // Check range
    const dx = this.sprite.x - this.startX;
    const dy = this.sprite.y - this.startY;
    if (Math.sqrt(dx*dx + dy*dy) > this.maxRange) {
      this.destroy();
      return;
    }

    // Check hits
    const targets = [
      ...(this.scene.enemies || []),
      ...(this.scene.boss && this.scene.boss.alive ? [this.scene.boss] : [])
    ];

    targets.forEach(target => {
      if (!target.alive || !this.active) return;
      const tdx = target.sprite.x - this.sprite.x;
      const tdy = target.sprite.y - this.sprite.y;
      if (Math.sqrt(tdx*tdx + tdy*tdy) < 22) {
        target.takeDamage(this.damage);
        if (this.slow && target.speed) {
          target.speed = Math.max(20, target.speed * 0.5);
          this.scene.time.delayedCall(2000, () => { target.speed *= 2; });
        }
        this.destroy();
      }
    });
  }

  destroy() {
    this.active = false;
    // Small burst effect
    const burst = this.scene.add.circle(this.sprite.x, this.sprite.y, 14, this.sprite.fillColor, 0.5);
    this.scene.time.delayedCall(150, () => burst.destroy());
    this.sprite.destroy();
  }
}
