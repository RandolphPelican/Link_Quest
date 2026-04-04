// ============================================================
// collision.js — Spatial partitioning and collision detection
// ============================================================

'use strict';

const CollisionSystem = {
  debugEnabled: false,
  collisionCount: 0,
  
  // Check collision between an entity and a list of obstacles
  resolveStatic(entity, obstacles) {
    if (!entity || !obstacles) return;
    
    if (this.debugEnabled) {
      console.log(`Collision: Resolving ${obstacles.length} obstacles for ${entity.constructor.name}`);
    }
    
    let resolvedCount = 0;
    obstacles.forEach(obs => {
      entity.resolveCollision(obs);
      resolvedCount++;
    });
    
    if (this.debugEnabled && resolvedCount > 0) {
      this.collisionCount++;
      if (this.collisionCount <= 10) { // Limit debug spam
        console.log(`Collision: Resolved ${resolvedCount} collisions for ${entity.constructor.name}`);
      }
    }
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
        if (this.debugEnabled) {
          console.log(`CircleCollision: Entity ${e.constructor.name} at (${e.x},${e.y}) affected by explosion at (${x},${y})`);
        }
      }
    });
    
    if (this.debugEnabled && affected.length > 0) {
      console.log(`CircleCollision: ${affected.length} entities affected by explosion at (${x},${y}) radius ${radius}`);
    }
    
    return affected;
  },
  
  // Enable/disable debug logging
  setDebugEnabled(enabled) {
    this.debugEnabled = enabled;
    this.collisionCount = 0;
    console.log(`CollisionSystem: Debug ${enabled ? 'enabled' : 'disabled'}`);
  }
};

// Expose collision debug globally for console debugging
window.toggleCollisionDebug = function() {
  CollisionSystem.setDebugEnabled(!CollisionSystem.debugEnabled);
};
