// ============================================================
// factory.js — Entity spawning and management
// ============================================================

'use strict';

const EntityFactory = {
  spawnPlayer(x, y, charKey) {
    const p = new Player(x, y, charKey);
    if (GameState.playerHP !== null) p.hp = GameState.playerHP;
    if (GameState.playerMP !== null) p.mp = GameState.playerMP;
    
    // Restore armor
    if (GameState.inventory.armor !== 'cloth') {
      p.armor = GameState.inventory.armor;
      const armorData = ITEMS[GameState.inventory.armor];
      if (armorData) p.maxHp = (CHAR_DEFS[charKey] || CHAR_DEFS.lincoln).maxHp + armorData.hpBonus;
    }
    return p;
  },

  spawnEnemies(enemyData, spawnPos) {
    const spawned = [];
    (enemyData || []).forEach(group => {
      for (let i = 0; i < (group.count || 1); i++) {
        const ox = (i % 3) * 55, oy = Math.floor(i/3) * 55;
        let ex = group.x + ox, ey = group.y + oy;
        
        // Ensure enemies don't spawn right on top of player
        if (spawnPos) {
          const ddx = ex - spawnPos.x, ddy = ey - spawnPos.y;
          const dd  = Math.sqrt(ddx*ddx + ddy*ddy);
          if (dd < 160 && dd > 0) {
            ex += (ddx/dd) * (160 - dd + 20);
            ey += (ddy/dd) * (160 - dd + 20);
          }
        }
        spawned.push(new Enemy(ex, ey, group.type, group.pattern || 'rusher'));
      }
    });
    return spawned;
  },

  spawnBoss(bossData) {
    if (!bossData) return null;
    return new Boss(bossData.x, bossData.y, bossData.type);
  },

  spawnItems(itemData) {
    const spawned = [];
    (itemData || []).forEach(it => {
      spawned.push(new Item(it.x, it.y, it.key));
    });
    return spawned;
  }
};
