// ============================================================
// enemy.js — Enemy behavior & AI coding enemies
// ============================================================

class Enemy {
  constructor(scene, x, y, type) {
    this.scene = scene;
    this.type = type;    // goblin | ai_bug | chatbot_clone
    this.maxHp = 40;
    this.hp = 40;
    this.speed = 80;
    this.attackPower = 10;
    this.attackRange = 60;
    this.attackCooldown = 0;
    this.alive = true;

    const typeColors = {
      goblin:       0x00ff88,
      ai_bug:       0xff4444,
      chatbot_clone: 0x44aaff
    };

    // Placeholder sprite
    this.sprite = scene.add.rectangle(x, y, 22, 22, typeColors[type] || 0xff0000);
    scene.physics.add.existing(this.sprite);
    this.sprite.body.setCollideWorldBounds(true);

    this.label = scene.add.text(x - 20, y - 20, type, { fontSize: '9px', fill: '#0f0' });
    this.hpText = scene.add.text(x - 10, y + 14, `${this.hp}`, { fontSize: '9px', fill: '#f00' });
  }

  update(player) {
    if (!this.alive) return;

    const dx = player.sprite.x - this.sprite.x;
    const dy = player.sprite.y - this.sprite.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Chase player if within 200px
    if (dist < 200) {
      this.sprite.body.setVelocity(
        (dx / dist) * this.speed,
        (dy / dist) * this.speed
      );
    } else {
      this.sprite.body.setVelocity(0, 0);
    }

    // Attack if in range
    if (dist < this.attackRange && this.attackCooldown <= 0) {
      this.attackPlayer(player);
    }
    if (this.attackCooldown > 0) this.attackCooldown--;

    // Sync labels
    this.label.setPosition(this.sprite.x - 20, this.sprite.y - 20);
    this.hpText.setPosition(this.sprite.x - 10, this.sprite.y + 14).setText(`${this.hp}`);
  }

  attackPlayer(player) {
    this.attackCooldown = 90;  // ~1.5s
    player.takeDamage(this.attackPower);
    console.log(`${this.type} attacks player!`);
  }

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
    if (this.hp <= 0) this.onDeath();
  }

  onDeath() {
    this.alive = false;
    this.sprite.fillColor = 0x333333;
    this.sprite.body.setVelocity(0, 0);
    this.label.setText('[dead]');
    console.log(`${this.type} defeated — dropped loot TODO`);
    // TODO: spawn item drop at sprite position
  }
}
