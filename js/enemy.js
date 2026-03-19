// ============================================================
// enemy.js — Enemy behavior, AI, drops, debuffs
// ============================================================

class Enemy {
  constructor(scene, x, y, type) {
    this.scene          = scene;
    this.type           = type;
    this.alive          = true;
    this.attackCooldown = 0;
    this.state          = 'idle';
    this.stunTimer      = 0;
    this.dropChance     = 0.35;
    this.wanderTimer    = 0;
    this.wanderTarget   = { x, y };

    const typeStats = {
      goblin: {
        maxHp: 40, speed: 45, attackPower: 6,
        attackRange: 36, aggroRange: 140,
        color: 0x00ff88, label: 'Goblin', size: 22
      },
      goblin_chief: {
        maxHp: 80, speed: 38, attackPower: 10,
        attackRange: 40, aggroRange: 160,
        color: 0xcc2200, label: 'Goblin Chief', size: 30
      },
      ai_bug: {
        maxHp: 30, speed: 55, attackPower: 5,
        attackRange: 40, aggroRange: 160,
        color: 0xff4444, label: 'AI Bug', size: 18
      },
      chatbot_clone: {
        maxHp: 80, speed: 35, attackPower: 10,
        attackRange: 50, aggroRange: 180,
        color: 0x44aaff, label: 'Chatbot Clone', size: 28
      }
    };

    const s         = typeStats[type] || typeStats.goblin;
    this.maxHp      = s.maxHp;
    this.hp         = s.maxHp;
    this.speed      = s.speed;
    this.baseSpeed  = s.speed;
    this.attackPower  = s.attackPower;
    this.attackRange  = s.attackRange;
    this.aggroRange   = s.aggroRange;
    this.color        = s.color;
    this.size         = s.size;

    this.sprite = scene.add.rectangle(x, y, s.size, s.size, s.color);
    scene.physics.add.existing(this.sprite);
    this.sprite.body.setCollideWorldBounds(true);

    this.hpBarBg = scene.add.rectangle(x, y - s.size/2 - 6, 30, 4, 0x333333);
    this.hpBar   = scene.add.rectangle(x, y - s.size/2 - 6, 30, 4, s.color);
    this.label   = scene.add.text(x - 20, y - s.size/2 - 16, s.label, {
      fontSize: '8px', fill: '#0f0',
      stroke: '#000', strokeThickness: 2
    }).setDepth(10);
  }

  update(player) {
    if (!this.alive) return;
    if (!this.sprite || !this.sprite.body) return;
    if (!player || !player.sprite) return;

    if (this.state === 'stunned') {
      this.stunTimer--;
      if (this.stunTimer <= 0) this.state = 'idle';
      this.sprite.body.setVelocity(0, 0);
      this._syncUI();
      return;
    }

    const dx   = player.sprite.x - this.sprite.x;
    const dy   = player.sprite.y - this.sprite.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (player.alive && dist < this.aggroRange) {
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
        this.sprite.body.setVelocity(0, 0);
        if (this.attackCooldown <= 0) this._attackPlayer(player);
        break;
      case 'idle':
        this._wander();
        break;
    }

    if (this.attackCooldown > 0) this.attackCooldown--;
    this._syncUI();
  }
  _wander() {
    if (!this.sprite || !this.sprite.body) return;
    this.wanderTimer--;
    if (this.wanderTimer <= 0) {
      this.wanderTimer = Phaser.Math.Between(80, 200);
      this.wanderTarget = {
        x: Phaser.Math.Clamp(this.sprite.x + Phaser.Math.Between(-70, 70), 50, 750),
        y: Phaser.Math.Clamp(this.sprite.y + Phaser.Math.Between(-70, 70), 50, 550)
      };
    }
    const wx    = this.wanderTarget.x - this.sprite.x;
    const wy    = this.wanderTarget.y - this.sprite.y;
    const wdist = Math.sqrt(wx * wx + wy * wy);
    if (wdist > 5) {
      this.sprite.body.setVelocity(
        (wx / wdist) * this.speed * 0.35,
        (wy / wdist) * this.speed * 0.35
      );
    } else {
      this.sprite.body.setVelocity(0, 0);
    }
  }

  _attackPlayer(player) {
    this.attackCooldown = 100;
    player.takeDamage(this.attackPower);
    this.sprite.fillColor = 0xffffff;
    this.scene.time.delayedCall(100, () => {
      if (this.alive) this.sprite.fillColor = this.color;
    });
  }

  takeDamage(amount) {
    if (!this.alive) return;
    this.hp = Math.max(0, this.hp - amount);
    this.sprite.fillColor = 0xffffff;
    this.scene.time.delayedCall(100, () => {
      if (this.alive) this.sprite.fillColor = this.color;
    });
    this.state     = 'stunned';
    this.stunTimer = 10;
    if (this.hp <= 0) this.onDeath();
  }

  onDeath() {
    this.alive = false;
    if (this.sprite && this.sprite.body) this.sprite.body.setVelocity(0, 0);
    this.sprite.fillColor = 0x333333;
    this.label.setText('dead').setStyle({ fill: '#555' });
    if (this.hpBar) this.hpBar.width = 0;
    const scores = { goblin: 50, ai_bug: 40, chatbot_clone: 150 };
    if (typeof updateScore === 'function') updateScore(scores[this.type] || 50);
    if (this.type === 'goblin_chief') {
      if (this.scene.items) {
        this.scene.items.push(new Item(this.scene, this.sprite.x, this.sprite.y, 'small_key'));
      }
    } else if (Math.random() < this.dropChance && this.scene.items) {
      const drops = ['chicken_nuggets', 'chicken_nuggets', 'mac_and_cheese', 'potion_sm'];
      const key   = drops[Math.floor(Math.random() * drops.length)];
      this.scene.items.push(new Item(this.scene, this.sprite.x, this.sprite.y, key));
    }
    this.scene.tweens.add({
      targets: [this.sprite, this.label, this.hpBar, this.hpBarBg],
      alpha: 0, duration: 1000, delay: 500
    });
  }

  _syncUI() {
    if (!this.sprite) return;
    const x    = this.sprite.x;
    const y    = this.sprite.y;
    const half = this.size / 2;
    if (this.hpBarBg) this.hpBarBg.setPosition(x, y - half - 6);
    if (this.hpBar)   {
      this.hpBar.setPosition(x, y - half - 6);
      this.hpBar.width = (this.hp / this.maxHp) * 30;
    }
    if (this.label) this.label.setPosition(x - 20, y - half - 16);
  }
}
