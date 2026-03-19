// ============================================================
// item.js — Weapons, potions, armor, pickup logic
// ============================================================

const ITEMS = {
  // Weapons
  club:   { type: 'weapon', name: 'Club',      damage: 15, owner: 'dad'     },
  sword:  { type: 'weapon', name: 'Sword',     damage: 22, owner: 'lincoln' },
  staff:  { type: 'weapon', name: 'Staff',     damage: 18, owner: 'journey' },
  bow:    { type: 'weapon', name: 'Bow',       damage: 20, owner: 'bear'    },

  // Spells
  fart:      { type: 'spell', name: 'Fart AoE',  damage: 12, range: 80,  owner: 'dad'     },
  fireball:  { type: 'spell', name: 'Fireball',  damage: 30, range: 200, owner: 'journey' },
  heal:      { type: 'spell', name: 'Heal',      heal: 25,               owner: 'journey' },
  ice_arrow: { type: 'spell', name: 'Ice Arrow', damage: 18, slow: true, owner: 'bear'    },

  // Potions
  potion_sm: { type: 'potion', name: 'Small Potion',  heal: 20, color: 0xff6688, emoji: '🧪' },
  potion_md: { type: 'potion', name: 'Medium Potion', heal: 40, color: 0xff3355, emoji: '🍶' },
  potion_lg: { type: 'potion', name: 'Large Potion',  heal: 80, color: 0xff0033, emoji: '🏺' },

  // Armor
  cloth:   { type: 'armor', name: 'Cloth Armor',  hp: 50,  resistance: 0.0, color: 0xaaaaaa, emoji: '👕' },
  leather: { type: 'armor', name: 'Leather Armor',hp: 80,  resistance: 0.2, color: 0xcc8844, emoji: '🥋' },
  chain:   { type: 'armor', name: 'Chain Armor',  hp: 120, resistance: 0.4, color: 0x8899bb, emoji: '⛓️'  },

  // MP restore
  mana_vial: { type: 'mana', name: 'Mana Vial', mp: 20, color: 0x6644ff, emoji: '💧' }
};

class Item {
  constructor(scene, x, y, itemKey) {
    this.scene     = scene;
    this.key       = itemKey;
    this.data      = ITEMS[itemKey];
    this.collected = false;

    if (!this.data) {
      console.warn(`Unknown item key: ${itemKey}`);
      this.data = ITEMS['potion_sm'];
    }

    const color = this.data.color || 0xf1c40f;

    // Sprite — glowing square
    this.sprite = scene.add.rectangle(x, y, 16, 16, color);
    scene.physics.add.existing(this.sprite, true);

    // Pulsing glow ring
    this.glow = scene.add.circle(x, y, 12, color, 0.15);

    // Label
    this.label = scene.add.text(x - 14, y + 11, this.data.name, {
      fontSize: '8px', fill: '#ffd700',
      stroke: '#000', strokeThickness: 2
    }).setDepth(10);

    // Hover float animation
    scene.tweens.add({
      targets: [this.sprite, this.glow],
      y: { from: y - 3, to: y + 3 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Pulse glow
    scene.tweens.add({
      targets: this.glow,
      alpha: { from: 0.08, to: 0.3 },
      duration: 600,
      yoyo: true,
      repeat: -1
    });
  }

  collect(player) {
    if (this.collected) return;
    this.collected = true;

    // Destroy visuals
    this.sprite.destroy();
    this.glow.destroy();
    this.label.destroy();

    switch (this.data.type) {
      case 'potion':
        player.heal(this.data.heal);
        break;

      case 'mana':
        player.mp = Math.min(player.maxMp, player.mp + this.data.mp);
        break;

      case 'armor':
        player.armor   = this.key;
        player.maxHp   = Math.max(player.maxHp, player.maxHp + this.data.hp * 0.1);
        break;

      case 'weapon':
        // Only boost attack if matching character or generic
        if (!this.data.owner || this.data.owner === player.characterKey) {
          player.attackPower = Math.max(player.attackPower, this.data.damage);
        }
        break;

      default:
        break;
    }
  }
}
