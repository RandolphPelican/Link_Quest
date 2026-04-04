// ============================================================
// interaction.js — Unified Interaction System (Commandment 7)
// ============================================================

'use strict';

class InteractionController {
  constructor(player) {
    this.player = player;
    this.range = 40;
  }

  update(dt, interactables) {
    if (Input.pressed('e') || Input.pressed('enter') || Input.pressed(' ')) {
      this.interact(interactables);
    }
  }

  interact(interactables) {
    let closest = null;
    let minDist = this.range;

    interactables.forEach(obj => {
      const dx = obj.x - this.player.x;
      const dy = obj.y - this.player.y;
      const dist = Math.sqrt(dx*dx + dy*dy);

      if (dist < minDist) {
        minDist = dist;
        closest = obj;
      }
    });

    if (closest) {
      if (typeof closest.onInteract === 'function') {
        closest.onInteract(this.player);
      } else {
        Events.emit('interact', closest);
      }
    }
  }
}

window.InteractionSystem = {
  create(player) {
    return new InteractionController(player);
  }
};
