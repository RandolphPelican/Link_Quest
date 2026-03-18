// ============================================================
// player.js — Player mechanics: movement, HP, abilities
// ============================================================

class Player {
  constructor(scene, x, y, characterKey) {
    this.scene = scene;
    this.characterKey = characterKey;
    this.speed = 180;
    this.maxHp = 100;
    this.hp = 100;
    this.attackPower = 20;
    this.armor = 'leather';          // cloth | leather | chain
    this.isAttacking = false;
    this.attackCooldown = 0;

    // Characters: lincoln | dad | journey | bear
    const colors = {
      lincoln: 0x3498db,
      dad:     0xe67e22,
      journey: 0x9b59b6,
      bear:    0x27ae60
    };

    // Placeholder sprite (colored rectangle until real PNGs are in)
    this.sprite = scene.add.rectangle(x, y, 28, 28, colors[characterKey] || 0xffffff);
    scene.physics.add.existing(this.sprite);
    this.sprite.body.setCollideWorldBounds(true);

    // Name label above sprite
    this.label = scene.add.text(x - 20, y - 24, characterKey, {
      fontSize: '10px', fill: '#fff'
    });

    // Attack indicator
    this.attackIndicator = scene.add.rectangle(x, y, 40, 40, 0xf1c40f, 0);
  }

  update(cursors, wasd) {
    const body = this.sprite.body;
    body.setVelocity(0);

    // Movement
    if (cursors.left.isDown  || wasd.left.isDown)  body.setVelocityX(-this.speed);
    if (cursors.right.isDown || wasd.right.isDown) body.setVelocityX(this.speed);
    if (cursors.up.isDown    || wasd.up.isDown)    body.setVelocityY(-this.speed);
    if (cursors.down.isDown  || wasd.down.isDown)  body.setVelocityY(this.speed);

    // Sync label and attack indicator to sprite position
    this.label.setPosition(this.sprite.x - 20, this.sprite.y - 24);
    this.attackIndicator.setPosition(this.sprite.x, this.sprite.y);

    // Attack
    if (wasd.attack.isDown && this.attackCooldown <= 0) {
      this.attack();
    }
    if (this.attackCooldown > 0) this.attackCooldown--;
  }

  attack() {
    this.attackCooldown = 30;  // ~0.5s at 60fps
    // Flash attack indicator
    this.attackIndicator.fillAlpha = 0.6;
    this.scene.time.delayedCall(150, () => { this.attackIndicator.fillAlpha = 0; });
    // TODO: check overlap with enemies and deal damage
    console.log(`${this.characterKey} attacks for ${this.attackPower}`);
  }

  takeDamage(amount) {
    const armorMod = { cloth: 1.0, leather: 0.8, chain: 0.6 };
    const dmg = Math.floor(amount * (armorMod[this.armor] || 1.0));
    this.hp = Math.max(0, this.hp - dmg);
    console.log(`${this.characterKey} takes ${dmg} dmg — HP: ${this.hp}/${this.maxHp}`);
    if (this.hp <= 0) this.onDeath();
  }

  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  onDeath() {
    console.log(`${this.characterKey} has been defeated!`);
    this.sprite.fillColor = 0x555555;
  }
}
