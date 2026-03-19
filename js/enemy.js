// ============================================================
// enemy.js — Enemy behavior, AI, drops, debuffs
// ============================================================

class Enemy {
  constructor(scene, x, y, type) {
    this.scene       = scene;
    this.type        = type;
    this.alive       = true;
    this.attackCooldown = 0;
    this.state       = 'idle';   // idle | chase | attack | stunned
    this.stunTimer   = 0;
    this.dropChance  = 0.35;

    // Stats per type
    const typeStats = {
      goblin: {
        maxHp: 40, speed: 80, attackPower: 10,
        attackRange: 36, aggroRange: 200, color: 0x00ff88,
        label: 'Goblin', size: 22
      },
      ai_bug: {
        maxHp: 30, speed: 110, attackPower: 8,
        attackRange: 40, aggroRange: 250, color: 0xff4444,
        label: 'AI Bug', size: 18
      },
      chatbot_clone: {
        maxHp: 80, speed: 65, attackPower: 18,
        attackRange: 50, aggroRange: 300, color: 0x44aaff,
        label: 'Chatbot Clone', size: 28
      }
    };

    const s = typeStats[type] || typeStats.goblin;
    this.maxHp      = s.maxHp;
    this.hp         = s.maxHp;
    this.speed      = s.speed;
    this.baseSpeed  = s.speed;
    this.attackPower  = s.attackPower;
    this.attackRange  = s.attackRange;
    this.aggroRange   = s.aggroRange;
    this.color        = s.color;

    // Sprite
    this.sprite = scene.add.rectangle(x, y, s.size, s.size, s.color);
    scene.physics.add.existing(this.sprite);
    this.sprite.body.setCollideWorldBounds(true);

    // HP bar above enemy
    this.hpBarBg = scene.add.rectangle(x, y - s.size / 2 - 6, 30, 4, 0x333333);
    this.hpBar   = scene.add.rectangle(x - 0, y - s.size / 2 - 6, 30, 4, s.color);
    this.hpBar.setOrigin(0.5, 0.5);

    // Label
    this.label = scene.add.text(x - 20, y - s.size / 2 - 16, s.label, {
      fontSize: '8px', fill: '#0f0',
      stroke: '#000', strokeThickness: 2
    }).setDepth(10);

    // Patrol waypoints (random wander)
    this.wanderTarget = { x: x + Phaser.Math.Between(-60, 60), y: y + Phaser.Math.Between(-60, 60) };
    this.wanderTimer  = 0;
  }

  update(player) {
    if (!this.alive) return;

    // Stun
    if (this.state === 'stunned') {
      this.stunTimer--;
      if (this.stunTimer <= 0) this.state = 'idle';
      this.sprite.body.setVelocity(0);
      this._syncUI();
      return;
    }

    const dx   = player.sprite.x - this.sprite.x;
    const dy   = player.sprite.y - this.sprite.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // ── State machine ─────────────────────────────────────────
    if (dist < this.aggroRange && player.alive) {
      this.state = dist < this.attackRange ? 'attack' : 'chase';
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
        if (this.attackCooldown <= 0) {
          this._attackPlayer(player);
        }
        break;

      case 'idle':
        this._wander();
        break;
    }

    if (this.attackCooldown > 0) this.attackCooldown--;

    // Special abilities per type
    if (this.type === 'ai_bug' && this.state === 'chase') {
      this._tryConfuse(player);
    }
    if (this.type === 'chatbot_clone' && this.attackCooldown <= 0 && dist < 120) {
      this._typoAttack(player);
    }

    this._syncUI();
  }

  _wander() {
    this.wanderTimer--;
    if (this.wanderTimer <= 0) {
      this.wanderTimer = Phaser.Math.Between(60, 180);
      this.wanderTarget = {
        x: Phaser.Math.Clamp(this.sprite.x + Phaser.Math.Between(-80, 80), 20, 780),
        y: Phaser.Math.Clamp(this.sprite.y + Phaser.Math.Between(-80, 80), 20, 580)
      };
    }
    const wx   = this.wanderTarget.x - this.sprite.x;
    const wy   = this.wanderTarget.y - this.sprite.y;
    const wdist = Math.sqrt(wx*wx + wy*wy);
    if (wdist > 5) {
      this.sprite.body.setVelocity(
        (wx / wdist) * this.speed * 0.4,
        (wy / wdist) * this.speed * 0.4
      );
    } else {
      this.sprite.body.setVelocity(0);
    }
  }

  _attackPlayer(player) {
    this.attackCooldown = 90;
    player.takeDamage(this.attackPower);
    // Lunge flash
    this.sprite.fillColor = 0xffffff;
    this.scene.time.delayedCall(100, () => {
      if (this.alive) this.sprite.fillColor = this.color;
    });
  }

  _tryConfuse(player) {
    // AI Bug: randomly reverses player controls briefly
    if (Phaser.Math.Between(0, 400) === 0 && player.alive) {
      player.speed = -Math.abs(player.speed);
      showToast('🐛 AI BUG — Controls confused!');
      this.scene.time.delayedCall(2000, () => {
        player.speed = Math.abs(player.speed);
      });
    }
  }

  _typoAttack(player) {
    // Chatbot Clone: "Typo" projectile — slow-moving, deals moderate damage
    this.attackCooldown = 150;
    const dx = player.sprite.x - this.sprite.x;
    const dy = player.sprite.y - this.sprite.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    const proj = this.scene.add.circle(this.sprite.x, this.sprite.y, 6, 0xffffff);
    this.scene.physics.add.existing(proj);
    proj.body.setVelocity((dx / dist) * 140, (dy / dist) * 140);

    // Check if projectile hits player
    const checkInterval = this.scene.time.addEvent({
      delay: 50,
      repeat: 40,
      callback: () => {
        if (!proj.active) return;
        const pdx = player.sprite.x - proj.x;
        const pdy = player.sprite.y - proj.y;
        if (Math.sqrt(pdx*pdx + pdy*pdy) < 20) {
          player.takeDamage(this.attackPower);
          proj.destroy();
          checkInterval.remove();
        }
      }
    });

    this.scene.time.delayedCall(2000, () => { if (proj.active) proj.destroy(); });
    showToast('📝 TYPO ATTACK!');
  }

  takeDamage(amount) {
    if (!this.alive) return;
    this.hp = Math.max(0, this.hp - amount);

    // Flash white
    this.sprite.fillColor = 0xffffff;
    this.scene.time.delayedCall(100, () => {
      if (this.alive) this.sprite.fillColor = this.color;
    });

    // Brief stun
    this.state     = 'stunned';
    this.stunTimer = 10;

    if (this.hp <= 0) this.onDeath();
  }

  onDeath() {
    this.alive = false;
    this.sprite.fillColor = 0x333333;
    this.sprite.body.setVelocity(0);
    this.label.setText('💀').setStyle({ fill: '#555' });
    this.hpBar.width = 0;

    // Score
    const scores = { goblin: 50, ai_bug: 40, chatbot_clone: 150 };
    if (typeof updateScore === 'function') updateScore(scores[this.type] || 50);

    // Random drop
    if (Math.random() < this.dropChance) {
      const drops = ['potion_sm', 'potion_sm', 'potion_md', 'leather'];
      const key   = drops[Math.floor(Math.random() * drops.length)];
      if (this.scene.items) {
        this.scene.items.push(new Item(this.scene, this.sprite.x, this.sprite.y, key));
        if (typeof showToast === 'function') showToast(`💀 ${this.type} dropped ${key}!`);
      }
    }

    // Fade out
    this.scene.tweens.add({
      targets: [this.sprite, this.label, this.hpBar, this.hpBarBg],
      alpha: 0,
      duration: 1200,
      delay: 600
    });
  }

  _syncUI() {
    const x = this.sprite.x;
    const y = this.sprite.y;
    const size = this.sprite.height;

    this.hpBarBg.setPosition(x, y - size / 2 - 6);
    this.hpBar.setPosition(x - (30 - (this.hp / this.maxHp) * 30) / 2, y - size / 2 - 6);
    this.hpBar.width = (this.hp / this.maxHp) * 30;
    this.label.setPosition(x - 20, y - size / 2 - 16);
  }
}
