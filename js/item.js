// ============================================================
// item.js — Weapons, potions, armor, food, keys
// ============================================================

const ITEMS = {
  club:   { type: 'weapon', name: 'Club',   damage: 15, owner: 'dad',     color: 0x8b6914 },
  sword:  { type: 'weapon', name: 'Sword',  damage: 22, owner: 'lincoln', color: 0xaaaacc },
  staff:  { type: 'weapon', name: 'Staff',  damage: 18, owner: 'journey', color: 0x9b59b6 },
  bow:    { type: 'weapon', name: 'Bow',    damage: 20, owner: 'bear',    color: 0x27ae60 },
  cloth:   { type: 'armor', name: 'Cloth Armor',   hpBonus: 0,  resist: 0.00, color: 0xaaaaaa },
  leather: { type: 'armor', name: 'Leather Armor', hpBonus: 20, resist: 0.15, color: 0xcc8844 },
  metal:   { type: 'armor', name: 'Metal Armor',   hpBonus: 40, resist: 0.30, color: 0x8899bb },
  potion_sm: { type: 'potion', name: 'Small Potion',  heal: 20, color: 0xff6688 },
  potion_md: { type: 'potion', name: 'Medium Potion', heal: 40, color: 0xff3355 },
  potion_lg: { type: 'potion', name: 'Large Potion',  heal: 80, color: 0xff0033 },
  mana_vial: { type: 'mana',   name: 'Mana Vial',     mp: 20,   color: 0x6644ff },
  chicken_nuggets:  { type: 'food', name: 'Chicken Nuggets',  heal: 15, color: 0xffa040, emoji: '🍗' },
  mac_and_cheese:   { type: 'food', name: 'Mac and Cheese',   heal: 30, color: 0xffcc00, emoji: '🧀' },
  trader_jos_pizza: { type: 'food', name: "Trader Jo's Pizza", heal: 60, color: 0xff4400, emoji: '🍕' },
  small_key: { type: 'key', name: 'Small Key', color: 0xffd700, emoji: '🗝️' },
  boss_key:  { type: 'key', name: 'Boss Key',  color: 0xff4400, emoji: '🔑' }
};

class Item {
  constructor(scene, x, y, itemKey) {
    this.scene     = scene;
    this.key       = itemKey;
    this.data      = ITEMS[itemKey];
    this.collected = false;

    if (!this.data) {
      console.warn('Unknown item key:', itemKey);
      this.data = ITEMS['chicken_nuggets'];
    }

    const color = this.data.color || 0xf1c40f;

    this.sprite = scene.add.rectangle(x, y, 18, 18, color);
    this.sprite.setStrokeStyle(1, 0xffffff, 0.4);
    scene.physics.add.existing(this.sprite, true);

    if (this.data.emoji) {
      this.emoji = scene.add.text(x - 10, y - 10, this.data.emoji, { fontSize: '16px' });
      this.emoji.setDepth(11);
    }

    this.glow = scene.add.circle(x, y, 14, color, 0.15);

    this.label = scene.add.text(x - 20, y + 13, this.data.name, {
      fontSize: '7px', fill: '#ffd700',
      stroke: '#000', strokeThickness: 2
    }).setDepth(10);

    scene.tweens.add({
      targets: [this.sprite, this.glow, this.emoji].filter(Boolean),
      y: { from: y - 3, to: y + 3 },
      duration: 800, yoyo: true, repeat: -1,
      ease: 'Sine.easeInOut'
    });

    scene.tweens.add({
      targets: this.glow,
      alpha: { from: 0.08, to: 0.3 },
      duration: 600, yoyo: true, repeat: -1
    });
  }

  collect(player) {
    if (this.collected) return;
    this.collected = true;

    this.sprite.destroy();
    this.glow.destroy();
    this.label.destroy();
    if (this.emoji) this.emoji.destroy();

    switch (this.data.type) {
      case 'food':
      case 'potion':
        player.heal(this.data.heal);
        if (typeof showToast === 'function')
          showToast((this.data.emoji || '') + ' ' + this.data.name + ' +' + this.data.heal + ' HP');
        break;
      case 'mana':
        player.mp = Math.min(player.maxMp, player.mp + this.data.mp);
        if (typeof showToast === 'function')
          showToast('💧 ' + this.data.name + ' +' + this.data.mp + ' MP');
        break;
      case 'armor':
        if (player.armor !== this.key) {
          player.armor   = this.key;
          player.maxHp  += this.data.hpBonus;
          player.hp      = Math.min(player.hp + this.data.hpBonus, player.maxHp);
          if (typeof showToast === 'function')
            showToast('🛡️ ' + this.data.name + ' equipped! +' + this.data.hpBonus + ' HP');
        }
        break;
      case 'weapon':
        if (!this.data.owner || this.data.owner === player.characterKey) {
          player.attackPower = Math.max(player.attackPower, this.data.damage);
          if (typeof showToast === 'function')
            showToast('⚔️ ' + this.data.name + ' equipped!');
        }
        break;
      case 'key':
        GameState.inventory.keys++;
        if (typeof showToast === 'function')
          showToast('🗝️ Got a ' + this.data.name + '! Keys: ' + GameState.inventory.keys);
        break;
    }
  }
}
