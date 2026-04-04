// ============================================================
// player_controller.js — Player Movement and Input (Commandment 2)
// ============================================================

'use strict';

class PlayerController {
  constructor(player) {
    this.player = player;
  }

  handleInput(dt) {
    if (this.player.state === PlayerState.DEAD || 
        this.player.state === PlayerState.ATTACK || 
        this.player.state === PlayerState.SPELL || 
        this.player.state === PlayerState.DASH) return;

    let mvx = 0, mvy = 0;
    if (Input.down('a') || Input.down('arrowleft'))  { mvx = -1; this.player.facing = 'left';  }
    if (Input.down('d') || Input.down('arrowright')) { mvx =  1; this.player.facing = 'right'; }
    if (Input.down('w') || Input.down('arrowup'))    { mvy = -1; this.player.facing = 'up';    }
    if (Input.down('s') || Input.down('arrowdown'))  { mvy =  1; this.player.facing = 'down';  }

    if (mvx !== 0 || mvy !== 0) {
      const mag = Math.sqrt(mvx*mvx + mvy*mvy);
      this.player.vx = (mvx / mag) * this.player.speed;
      this.player.vy = (mvy / mag) * this.player.speed;
      this.player.setState(PlayerState.WALK);
      this.player.moving = true;
      this.player.animFrame += dt * 10;
    } else {
      this.player.setState(PlayerState.IDLE);
    }

    if (Input.pressed('k') && this.player.attackCooldown <= 0) {
      this.player.attack();
    }
    if (Input.pressed('p') && this.player.spellCooldown  <= 0) {
      this.player.castSpell();
    }
  }
}
