// ============================================================
// boss.js — Boss mechanics & special attacks
// ============================================================

class Boss {
  constructor(scene, x, y, type) {
    this.scene = scene;
    this.type = type;          // lazy_coder | gossip_gpt
    this.phase = 1;
    this.maxHp = 300;
    this.hp = 300;
    this.speed = 50;
    this.alive = true;
    this.specialCooldown = 0;

    // Bigger sprite for bosses
    this.sprite = scene.add.rectangle(x, y, 44, 44, 0xff6600);
    scene.physics.add.existing(this.sprite);
    this.sprite.body.setCollideWorldBounds(true);

    // Boss HP bar (top of screen)
    scene.add.rectangle(400, 580, 780, 18, 0x333333);
    this.bossHpBar = scene.add.rectangle(11, 580, 760, 14, 0xe74c3c).setOrigin(0, 0.5);
    scene.add.text(10, 570, `BOSS: ${type.toUpperCase()}`, { fontSize: '11px', fill: '#f66' });

    this.label = scene.add.text(x - 30, y - 30, `[BOSS] ${type}`, {
      fontSize: '10px', fill: '#f90'
    });
  }

  update(player) {
    if (!this.alive) return;

    const dx = player.sprite.x - this.sprite.x;
    const dy = player.sprite.y - this.sprite.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Phase 2 at 50% HP — speed boost
    if (this.hp < this.maxHp * 0.5 && this.phase === 1) {
      this.phase = 2;
      this.speed = 90;
      this.sprite.fillColor = 0xff0000;
      console.log(`${this.type} enters PHASE 2!`);
    }

    // Move toward player
    if (dist > 50) {
      this.sprite.body.setVelocity(
        (dx / dist) * this.speed,
        (dy / dist) * this.speed
      );
    } else {
      this.sprite.body.setVelocity(0, 0);
    }

    // Special attack
    if (this.specialCooldown <= 0) {
      this.specialAttack(player, dist);
    }
    if (this.specialCooldown > 0) this.specialCooldown--;

    // Update boss HP bar
    this.bossHpBar.width = 760 * (this.hp / this.maxHp);
    this.label.setPosition(this.sprite.x - 30, this.sprite.y - 30);
  }

  specialAttack(player, dist) {
    if (this.type === 'lazy_coder') {
      // "Typo Storm" — slow DoT if close
      if (dist < 100) {
        this.specialCooldown = 180;
        player.takeDamage(25);
        console.log('Lazy Coder uses TYPO STORM!');
      }
    } else if (this.type === 'gossip_gpt') {
      // "Hallucinate" — random teleport + AoE
      if (dist < 150) {
        this.specialCooldown = 240;
        player.takeDamage(35);
        console.log('GossipGPT HALLUCINATES — AoE damage!');
        // TODO: spawn projectile ring
      }
    }
  }

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
    if (this.hp <= 0) this.onDeath();
  }

  onDeath() {
    this.alive = false;
    this.sprite.fillColor = 0x222222;
    this.sprite.body.setVelocity(0, 0);
    console.log(`${this.type} DEFEATED — trigger ending cutscene TODO`);
    // TODO: launch cutscene / GossipGPT → ChatGPT transform
  }
}
