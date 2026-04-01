// ============================================================
// collision.js — Spatial partitioning and collision detection
// ============================================================

'use strict';

const CollisionSystem = {
  // Check collision between an entity and a list of obstacles
  resolveStatic(entity, obstacles) {
    if (!entity || !obstacles) return;
    obstacles.forEach(obs => {
      entity.resolveCollision(obs);
    });
  },

  // Check overlap between two entities
  checkOverlap(a, b) {
    if (!a || !b || !a.alive || !b.alive) return false;
    return a.overlaps(b);
  },

  // Circle collision (for spells/explosions)
  checkCircle(x, y, radius, entities) {
    const affected = [];
    entities.forEach(e => {
      if (!e.alive) return;
      const dx = e.x - x;
      const dy = e.y - y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < radius + (e.w + e.h)/4) {
        affected.push(e);
      }
    });
    return affected;
  }
};
