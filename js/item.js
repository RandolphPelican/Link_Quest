// ============================================================
// item.js — Weapons, potions, armor
// ============================================================

const ITEMS = {
  // Weapons
  club:   { type: 'weapon', name: 'Club',      damage: 15, owner: 'dad'     },
  sword:  { type: 'weapon', name: 'Sword',     damage: 22, owner: 'lincoln' },
  staff:  { type: 'weapon', name: 'Staff',     damage: 18, owner: 'journey' },
  bow:    { type: 'weapon', name: 'Bow',       damage: 20, owner: 'bear'    },

  // Spells
  fart:       { type: 'spell', name: 'Fart AoE',   damage: 12, range: 80,  owner: 'dad'    },
  fireball:   { type: 'spell', name: 'Fireball',   damage: 30, range: 200, owner: 'journey'},
  heal:       { type: 'spell', name: 'Heal',       heal:   25,             owner: 'journey'},
  ice_arrow:  { type: 'spell', name: 'Ice Arrow',  damage: 18, slow: true, owner: 'bear'   },

  // Potions
  potion_sm:  { type: 'potion', name: 'Small Potion',  heal: 20  },
  potion_md:  { type: 'potion', name: 'Medium Potion', heal: 40  },
  potion_lg:  { type: 'potion', name: 'Large Potion',  heal: 80  },

  // Armor
  cloth:      { type: 'armor', name: 'Cloth',   hp: 50,  resistance: 0.0 },
  leather:    { type: 'armor', name: 'Leather', hp: 80,  resistance: 0.2 },
  chain:      { type: 'armor', name: 'Chain',   hp: 120, resistance: 0.4 }
};

class Item {
  constructor(scene, x, y, itemKey) {
    this.scene = scene;
    this.key = itemKey;
    this.data = ITEMS[itemKey];
    this.collected = false;

    // Placeholder — small glowing square
    this.sprite = scene.add.rectangle(x, y, 14, 14, 0xf1c40f);
    scene.physics.add.existing(this.sprite, true); // static body
    this.label = scene.add.text(x - 16, y + 10, this.data.name, {
      fontSize: '8px', fill: '#ff0'
    });
  }

  collect(player) {
    if (this.collected) return;
    this.collected = true;
    this.sprite.destroy();
    this.label.destroy();

    if (this.data.type === 'potion') {
      player.heal(this.data.heal);
      console.log(`Picked up ${this.data.name} — healed ${this.data.heal}`);
    } else if (this.data.type === 'armor') {
      player.armor = this.key;
      console.log(`Equipped ${this.data.name}`);
    } else {
      console.log(`Picked up ${this.data.name}`);
    }
  }
}
