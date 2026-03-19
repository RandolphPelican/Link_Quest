// ============================================================
// boss.js — Boss mechanics, phase transitions, special attacks
// ============================================================

class Boss {
  constructor(scene, x, y, type) {
    this.scene         = scene;
    this.type          = type;    // lazy_coder | gossip_gpt
    this.alive         = true;
    this.phase         = 1;
    this.specialCooldown = 0;
    this.attackCooldown  = 0;
    this.state         = 'idle';  // idle | chase | attack | special
    this.stunTimer     = 0;

    // Stats per boss type
    const bossStats = {
      lazy_coder: {
        maxHp: 300, speed: 50, attackPower: 20,
        attackRange: 55, aggroRange: 350,
        color: 0xff6600, size: 44,
        label: 'LAZY CODER'
      },
      gossip_gpt: {
        maxHp: 500, speed: 45, attackPower: 28,
        attackRange: 60, aggroRange: 400,
        color: 0xcc00ff, size: 50,
        label: 'GOSSIP GPT'
      }
    };

    const s = bossStats[type] || bossStats.lazy_coder;
    this.maxHp       = s.maxHp;
    this.hp          = s.maxHp;
    this.speed       = s.speed;
    this.baseSpeed   = s.speed;
    this.attackPower = s.attackPower;
    this.attackRange = s.attackRange;
    this.aggroRange  = s.aggroRange;
    this.color       = s.color;
    this.label_text  = s.label;

    // Main sprite — bigger than enemies
    this.sprite = scene.add.rectangle(x, y, s.size, s.size, s.color);
    scene.physics.add.existing(this.sprite);
    this.sprite.body.setCollideWorldBounds(true);

    // Pulsing outer ring
    this.ring = scene.add.circle(x, y, s.size * 0.85, s.color, 0.12);

    // Name label
    this.label = scene.add.text(x - 40, y - s.size / 2 - 20, `👹 ${s.label}`, {
      fontSize: '10px', fill: '#ff4757',
      stroke: '#000', strokeThickness: 3
    }).setDepth(15);

    // HP bar above boss
    this.hpBarBg = scene.add.rectangle(x, y - s.size / 2 - 10, 60, 6, 0x333333);
    this.hpBar   = scene.add.rectangle(x, y - s.size / 2 - 10, 60, 6, s.color);

    // Phase 2 warning text (hidden initially)
    this.phaseWarning = scene.add.text(400, 280, '', {
      fontSize: '20px', fill: '#ff0000',
      stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5).setDepth(30).setAlpha(0);

    // Projectile list
    this.projectiles = [];
  }

  update(player) {
    if (!this.alive) return;

    // Stun check
    if (this.stunTimer > 0) {
      this.stunTimer--;
      this.sprite.body.setVelocity(0);
      this._syncUI();
      return;
    }

    const dx   = player.sprite.x - this.sprite.x;
    const dy   = player.sprite.y - this.sprite.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // ── Phase 2 trigger ───────────────────────────────────────
    if (this.phase === 1 && this.hp < this.maxHp * 0.5) {
      this._enterPhase2();
    }

    // ── State machine ─────────────────────────────────────────
    if (dist < this.attackRange && player.alive) {
      this.state = 'attack';
    } else if (dist < this.aggroRange && player.alive) {
      this.state = 'chase';
    } else {
      this.state = 'idle';
    }

    switch (this.state) {
      case 'chase':
        this.sprite.body.setVelocity(
          (dx / dist) * this.speed,
          (dy / dist) * this.speed
        );
        break;
      case 'attack':
        this.sprite.body.setVelocity(0);
        if (this.attackCooldown <= 0) this._meleeAttack(player);
        break;
      case 'idle':
        this.sprite.body.setVelocity(0);
        break;
    }

    // Special attack on cooldown
    if (this.specialCooldown <= 0 && dist < this.aggroRange && player.alive) {
      this._specialAttack(player, dist);
    }

    // Cooldowns
    if (this.attackCooldown  > 0) this.attackCooldown--;
    if (this.specialCooldown > 0) this.specialCooldown--;

    // Pulse ring
    this.ring.setScale(1 + Math.sin(Date.now() * 0.004) * 0.08);

    // Update projectiles
    this.projectiles = this.projectiles.filter(p => p.active);
    this.projectiles.forEach(p => p.update());

    this._syncUI();
  }

  _meleeAttack(player) {
    this.attackCooldown = 100;
    player.takeDamage(this.attackPower);
    this.sprite.fillColor = 0xffffff;
    this.scene.cameras.main.shake(80, 0.005);
    this.scene.time.delayedCall(120, () => {
      if (this.alive) this.sprite.fillColor = this.color;
    });
  }

  _specialAttack(player, dist) {
    if (this.type === 'lazy_coder') {
      this._typoStorm(player, dist);
    } else if (this.type === 'gossip_gpt') {
      // Phase 1: projectile ring. Phase 2: also teleport
      this._hallucinate(player);
      if (this.phase === 2) {
        this.scene.time.delayedCall(800, () => this._teleport(player));
      }
    }
  }

  _typoStorm(player, dist) {
    // Fires 3 typo projectiles in a spread
    this.specialCooldown = 200;
    if (typeof showToast === 'function') showToast('💢 TYPO STORM!');

    const angles = [-25, 0, 25];
    const baseDx = player.sprite.x - this.sprite.x;
    const baseDy = player.sprite.y - this.sprite.y;
    const baseDist = Math.sqrt(baseDx*baseDx + baseDy*baseDy);

    angles.forEach(angleDeg => {
      const rad = (angleDeg * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const vx  = ((baseDx / baseDist) * cos - (baseDy / baseDist) * sin) * 200;
      const vy  = ((baseDx / baseDist) * sin + (baseDy / baseDist) * cos) * 200;

      const proj = new BossProjectile(
        this.scene, this.sprite.x, this.sprite.y,
        vx, vy, this.attackPower * 0.6, 0xffff00, player
      );
      this.projectiles.push(proj);
    });
  }

  _hallucinate(player) {
    // Fires projectile ring outward in 8 directions
    this.specialCooldown = this.phase === 2 ? 160 : 220;
    if (typeof showToast === 'function') showToast('🌀 HALLUCINATE!');
    this.scene.cameras.main.shake(100, 0.007);

    const directions = 8;
    for (let i = 0; i < directions; i++) {
      const angle = (i / directions) * Math.PI * 2;
      const vx = Math.cos(angle) * 220;
      const vy = Math.sin(angle) * 220;
      const proj = new BossProjectile(
        this.scene, this.sprite.x, this.sprite.y,
        vx, vy, this.attackPower * 0.7, 0xcc00ff, player
      );
      this.projectiles.push(proj);
    }
  }

  _teleport(player) {
    // Random teleport away from player
    const newX = Phaser.Math.Between(60, 740);
    const newY = Phaser.Math.Between(60, 540);
    this.sprite.setPosition(newX, newY);

    // Flash effect
    const flash = this.scene.add.rectangle(newX, newY, 60, 60, 0xffffff, 0.8);
    this.scene.time.delayedCall(200, () => flash.destroy());
    if (typeof showToast === 'function') showToast('⚡ TELEPORT!');
  }

  _enterPhase2() {
    this.phase = 2;
    this.speed = this.baseSpeed * 1.8;
    this.attackPower = Math.floor(this.attackPower * 1.4);
    this.sprite.fillColor = this.type === 'gossip_gpt' ? 0xff00ff : 0xff2200;
    this.color = this.sprite.fillColor;

    // Warning flash
    this.phaseWarning.setText('⚠ PHASE 2 ⚠');
    this.scene.tweens.add({
      targets: this.phaseWarning,
      alpha: 1, duration: 300, yoyo: true, repeat: 3,
      onComplete: () => this.phaseWarning.setAlpha(0)
    });

    this.scene.cameras.main.shake(200, 0.01);
    if (typeof showToast === 'function') showToast(`${this.label_text} ENTERS PHASE 2!`);
  }

  takeDamage(amount) {
    if (!this.alive) return;
    this.hp = Math.max(0, this.hp - amount);

    // Flash
    this.sprite.fillColor = 0xffffff;
    this.scene.time.delayedCall(120, () => {
      if (this.alive) this.sprite.fillColor = this.color;
    });

    // Brief stun
    this.stunTimer = 8;

    if (this.hp <= 0) this.onDeath();
  }

  onDeath() {
    this.alive = false;
    this.sprite.body.setVelocity(0);
    this.ring.destroy();

    // Big death explosion effect
    for (let i = 0; i < 8; i++) {
      this.scene.time.delayedCall(i * 80, () => {
        const ex = this.sprite.x + Phaser.Math.Between(-40, 40);
        const ey = this.sprite.y + Phaser.Math.Between(-40, 40);
        const burst = this.scene.add.circle(ex, ey, Phaser.Math.Between(8, 20), 0xff4400, 0.9);
        this.scene.time.delayedCall(300, () => burst.destroy());
      });
    }

    this.scene.cameras.main.shake(300, 0.015);

    this.scene.tweens.add({
      targets: [this.sprite, this.label, this.hpBar, this.hpBarBg],
      alpha: 0, duration: 1000, delay: 400
    });

    if (typeof showToast === 'function') showToast(`💥 ${this.label_text} DEFEATED!`);
  }

  _syncUI() {
    const x    = this.sprite.x;
    const y    = this.sprite.y;
    const size = this.sprite.height;

    this.ring.setPosition(x, y);
    this.hpBarBg.setPosition(x, y - size / 2 - 10);
    this.hpBar.setPosition(x, y - size / 2 - 10);
    this.hpBar.width = (this.hp / this.maxHp) * 60;
    this.label.setPosition(x - 40, y - size / 2 - 22);
  }
}

// ============================================================
// BossProjectile — homing-ish projectile fired by bosses
// ============================================================
class BossProjectile {
  constructor(scene, x, y, vx, vy, damage, color, player) {
    this.scene  = scene;
    this.damage = damage;
    this.player = player;
    this.active = true;

    this.sprite = scene.add.circle(x, y, 8, color, 0.9);
    scene.physics.add.existing(this.sprite);
    this.sprite.body.setVelocity(vx, vy);
    this.sprite.body.setCollideWorldBounds(true);
    this.sprite.body.onWorldBounds = true;

    scene.physics.world.on('worldbounds', (body) => {
      if (body === this.sprite.body) this.destroy();
    });

    // Auto-destroy after 3s
    scene.time.delayedCall(3000, () => this.destroy());
  }

  update() {
    if (!this.active || !this.player.alive) return;

    const dx = this.player.sprite.x - this.sprite.x;
    const dy = this.player.sprite.y - this.sprite.y;
    const dist = Math.sqrt(dx*dx + dy*dy);

    if (dist < 20) {
      this.player.takeDamage(this.damage);
      this.destroy();
    }
  }

  destroy() {
    if (!this.active) return;
    this.active = false;
    const burst = this.scene.add.circle(this.sprite.x, this.sprite.y, 12, 0xffffff, 0.4);
    this.scene.time.delayedCall(150, () => burst.destroy());
    this.sprite.destroy();
  }
}
