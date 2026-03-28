// ============================================================
// item.js — Items, pure engine, no Phaser
// ============================================================

const ITEMS = {
  club:             { type:'weapon', name:'Club',            damage:15, owner:'dad',     color:0x8b6914 },
  sword:            { type:'weapon', name:'Sword',           damage:22, owner:'lincoln', color:0xaaaacc },
  staff:            { type:'weapon', name:'Staff',           damage:18, owner:'journey', color:0x9b59b6 },
  bow:              { type:'weapon', name:'Bow',             damage:20, owner:'bear',    color:0x27ae60 },
  daggers:          { type:'weapon', name:'Daggers',          damage:24, owner:'noha',    color:0xe74c3c },
  cloth:            { type:'armor',  name:'Cloth Armor',     hpBonus:0,  resist:0.00, color:0xaaaaaa },
  leather:          { type:'armor',  name:'Leather Armor',   hpBonus:20, resist:0.15, color:0xcc8844 },
  metal:            { type:'armor',  name:'Metal Armor',     hpBonus:40, resist:0.30, color:0x8899bb },
  potion_sm:        { type:'potion', name:'Small Potion',    heal:20,  color:0xff6688 },
  potion_md:        { type:'potion', name:'Medium Potion',   heal:40,  color:0xff3355 },
  potion_lg:        { type:'potion', name:'Large Potion',    heal:80,  color:0xff0033 },
  mana_vial:        { type:'mana',   name:'Mana Vial',       mp:20,    color:0x6644ff },
  chicken_nuggets:  { type:'food',   name:'Chicken Nuggets', heal:15,  color:0xffa040, emoji:'🍗' },
  mac_and_cheese:   { type:'food',   name:'Mac and Cheese',  heal:30,  color:0xffcc00, emoji:'🧀' },
  trader_jos_pizza: { type:'food',   name:"Trader Jo's Pizza", heal:60, color:0xff4400, emoji:'🍕' },
  fruit_snacks:     { type:'food',   name:'Fruit Snacks',    heal:12,  color:0xff6688, emoji:'🍬' },
  chocolate_milk:   { type:'food',   name:'Chocolate Milk',  heal:25,  color:0x8b5e3c, emoji:'🥛' },
  dads_pancakes:    { type:'food',   name:"Dad's Pancakes",  heal:50,  color:0xdda040, emoji:'🥞' },
  small_key:        { type:'key',    name:'Small Key',       color:0xffd700, emoji:'🗝️' },
  boss_key:         { type:'key',    name:'Boss Key',        color:0xff4400, emoji:'🔑' },
  msg_lincoln:      { type:'message', name:'Dad\'s Note',    color:0xffd700, emoji:'💌',
                      text:'Lincoln — you are brave, kind, and the best son a dad could ask for. I love you.' },
  msg_journey:      { type:'message', name:'Dad\'s Note',    color:0xffd700, emoji:'💌',
                      text:'Journey — your light and joy make every day magical. Dad loves you to the moon.' },
  msg_noha:         { type:'message', name:'Dad\'s Note',    color:0xffd700, emoji:'💌',
                      text:'Noha — you bring so much energy to this family. Your cousin loves you kid.' },
  msg_bear:         { type:'message', name:'Dad\'s Note',    color:0xffd700, emoji:'💌',
                      text:'Bear — you\'re a true friend to Lincoln and part of this family. Game on bro.' },
  msg_team:         { type:'message', name:'Secret Note',    color:0xffd700, emoji:'💌',
                      text:'This game was built with AI and love. Never stop building things together.' }
};

class Item {
  constructor(x, y, itemKey) {
    this.x         = x;
    this.y         = y;
    this.key       = itemKey;
    this.data      = ITEMS[itemKey];
    this.collected = false;
    this.floatOffset = 0;
    this.floatDir    = 1;

    if (!this.data) {
      console.warn('Unknown item key:', itemKey);
      this.data = ITEMS['chicken_nuggets'];
    }
  }

  update() {
    if (this.collected) return;
    // Float animation
    this.floatOffset += 0.05 * this.floatDir;
    if (Math.abs(this.floatOffset) > 3) this.floatDir *= -1;
  }

  render() {
    if (this.collected) return;
    const color = this.data.color || 0xf1c40f;
    const fy    = this.y + this.floatOffset;

    // Glow
    const t = Date.now() / 1000;
    const isMessage = this.data.type === 'message';
    const glowR = isMessage ? 22 : 14;
    const glowColor = isMessage ? 0xffd700 : color;
    drawCircle(this.x, fy, glowR, glowColor, isMessage ? 0.18 + Math.sin(t*2)*0.1 : 0.08 + Math.sin(t*3)*0.05);

    // Item square
    const itemSize = isMessage ? 22 : 18;
    drawRect(this.x, fy, itemSize, itemSize, color);
    drawRectOutline(this.x, fy, itemSize, itemSize, isMessage ? 0xffd700 : 0xffffff, isMessage ? 2 : 1);

    // Emoji for food and keys
    if (this.data.emoji) {
      ctx.font         = '14px serif';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.data.emoji, this.x, fy);
    }

    // Name label
    drawTextOutlined(this.data.name, this.x, fy + 18, 6, 0xffd700, 0x000000, 'center');

    // F prompt when player nearby
    if (typeof player !== 'undefined' && player) {
      const dx = this.x - player.x;
      const dy = this.y - player.y;
      if (Math.sqrt(dx*dx+dy*dy) < 48) {
        drawTextOutlined('[F]', this.x, fy - 20, 9, 0xffff00, 0x000000, 'center');
      }
    }
  }

  collect(p) {
    if (this.collected) return;
    this.collected = true;

    switch(this.data.type) {
      case 'food':
      case 'potion':
        p.heal(this.data.heal);
        showToast((this.data.emoji||'') + ' ' + this.data.name + ' +' + this.data.heal + ' HP');
        break;
      case 'mana':
        p.mp = Math.min(p.maxMp, p.mp + this.data.mp);
        showToast('💧 ' + this.data.name + ' +' + this.data.mp + ' MP');
        break;
      case 'armor':
        if (p.armor !== this.key) {
          p.armor   = this.key;
          p.maxHp  += this.data.hpBonus;
          p.hp      = Math.min(p.hp + this.data.hpBonus, p.maxHp);
          GameState.inventory.armor = this.key;
          showToast('🛡️ ' + this.data.name + ' equipped! +' + this.data.hpBonus + ' HP');
          if (typeof Network !== 'undefined' && Network.enabled) Network.sendItemPickup(this.key, 'armor');
        }
        break;
      case 'weapon':
        if (!this.data.owner || this.data.owner === p.characterKey) {
          p.attackPower = Math.max(p.attackPower, this.data.damage);
          showToast('⚔️ ' + this.data.name + ' equipped!');
        }
        break;
      case 'key':
        GameState.inventory.keys++;
        showToast('🗝️ Got a ' + this.data.name + '! Keys: ' + GameState.inventory.keys);
        if (typeof Network !== 'undefined' && Network.enabled) Network.sendItemPickup(this.key, 'key');
        break;
      case 'message':
        showToast(this.data.emoji + ' ' + this.data.text, 6000);
        break;
    }
  }
}
