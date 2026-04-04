// ============================================================
// main.js — Link Quest core game logic
// ============================================================

'use strict';

// Character definitions
const CHARACTERS = {
  lincoln: { name: 'Lincoln', color: '#3498db', speed: 180, hp: 100, weapon: 'sword', attackRange: 30 },
  journey: { name: 'Journey', color: '#9b59b6', speed: 170, hp: 80, weapon: 'staff', attackRange: 40 },
  bear:    { name: 'Bear',    color: '#27ae60', speed: 200, hp: 90, weapon: 'bow', attackRange: 50 },
  noha:    { name: 'Noha',    color: '#e74c3c', speed: 220, hp: 85, weapon: 'daggers', attackRange: 25 },
  dad:     { name: 'Dad',     color: '#e67e22', speed: 140, hp: 140, weapon: 'club', attackRange: 35 }
};

// Player class
class Player {
  constructor(x, y, charKey) {
    this.x = x;
    this.y = y;
    this.char = CHARACTERS[charKey];
    this.w = 30;
    this.h = 30;
    this.speed = this.char.speed;
    this.hp = this.char.hp;
    this.maxHp = this.char.hp;
    this.weapon = this.char.weapon;
    this.attackRange = this.char.attackRange;
    this.isAttacking = false;
    this.attackTimer = 0;
    this.attackDuration = 0.3; // 300ms attack animation
    this.facing = 'down'; // Default facing direction
    this.animationFrame = 0;
    this.animationSpeed = 0.1;
  }
  
  update(dt) {
    // Reset facing based on movement
    if (Input.down('a') || Input.down('arrowleft')) {
      this.x -= this.speed * dt;
      this.facing = 'left';
    }
    if (Input.down('d') || Input.down('arrowright')) {
      this.x += this.speed * dt;
      this.facing = 'right';
    }
    if (Input.down('w') || Input.down('arrowup')) {
      this.y -= this.speed * dt;
      this.facing = 'up';
    }
    if (Input.down('s') || Input.down('arrowdown')) {
      this.y += this.speed * dt;
      this.facing = 'down';
    }
    
    // Update attack timer
    if (this.isAttacking) {
      this.attackTimer += dt;
      if (this.attackTimer >= this.attackDuration) {
        this.isAttacking = false;
        this.attackTimer = 0;
      }
    }
    
    // Update animation frame
    this.animationFrame += this.animationSpeed;
    if (this.animationFrame >= 4) {
      this.animationFrame = 0;
    }
  }
  
  attack() {
    if (!this.isAttacking) {
      this.isAttacking = true;
      this.attackTimer = 0;
      console.log(`${this.char.name} attacks with ${this.weapon}!`);
    }
  }
  
  render() {
    // Draw body
    drawRect(this.x, this.y, this.w, this.h, this.char.color);
    
    // Draw head with facing direction
    const headOffsetX = this.facing === 'left' ? -8 : this.facing === 'right' ? 8 : 0;
    const headOffsetY = this.facing === 'up' ? -8 : this.facing === 'down' ? 8 : 0;
    drawCircle(this.x + headOffsetX, this.y - 15 + headOffsetY, 8, '#fff');
    
    // Draw weapon based on type and facing
    this._drawWeapon();
    
    // Draw attack animation if attacking
    if (this.isAttacking) {
      this._drawAttackAnimation();
    }
  }
  
  _drawWeapon() {
    const weaponColor = '#ddd';
    const weaponLength = 15;
    
    switch (this.weapon) {
      case 'sword':
        if (this.facing === 'right') {
          drawRect(this.x + 20, this.y, weaponLength, 4, weaponColor);
        } else if (this.facing === 'left') {
          drawRect(this.x - 20, this.y, weaponLength, 4, weaponColor);
        } else if (this.facing === 'up') {
          drawRect(this.x, this.y - 20, 4, weaponLength, weaponColor);
        } else {
          drawRect(this.x, this.y + 20, 4, weaponLength, weaponColor);
        }
        break;
      case 'staff':
        if (this.facing === 'right') {
          drawRect(this.x + 20, this.y, weaponLength, 3, weaponColor);
          drawCircle(this.x + 30, this.y, 5, '#ff0'); // Staff glow
        } else if (this.facing === 'left') {
          drawRect(this.x - 20, this.y, weaponLength, 3, weaponColor);
          drawCircle(this.x - 30, this.y, 5, '#ff0');
        } else if (this.facing === 'up') {
          drawRect(this.x, this.y - 20, 3, weaponLength, weaponColor);
          drawCircle(this.x, this.y - 30, 5, '#ff0');
        } else {
          drawRect(this.x, this.y + 20, 3, weaponLength, weaponColor);
          drawCircle(this.x, this.y + 30, 5, '#ff0');
        }
        break;
      case 'bow':
        if (this.facing === 'right') {
          drawCircle(this.x + 15, this.y, 8, weaponColor);
        } else if (this.facing === 'left') {
          drawCircle(this.x - 15, this.y, 8, weaponColor);
        } else if (this.facing === 'up') {
          drawCircle(this.x, this.y - 15, 8, weaponColor);
        } else {
          drawCircle(this.x, this.y + 15, 8, weaponColor);
        }
        break;
      case 'daggers':
        if (this.facing === 'right') {
          drawRect(this.x + 15, this.y - 3, 8, 3, weaponColor);
          drawRect(this.x + 15, this.y + 3, 8, 3, weaponColor);
        } else if (this.facing === 'left') {
          drawRect(this.x - 15, this.y - 3, 8, 3, weaponColor);
          drawRect(this.x - 15, this.y + 3, 8, 3, weaponColor);
        } else if (this.facing === 'up') {
          drawRect(this.x - 3, this.y - 15, 3, 8, weaponColor);
          drawRect(this.x + 3, this.y - 15, 3, 8, weaponColor);
        } else {
          drawRect(this.x - 3, this.y + 15, 3, 8, weaponColor);
          drawRect(this.x + 3, this.y + 15, 3, 8, weaponColor);
        }
        break;
      case 'club':
        if (this.facing === 'right') {
          drawCircle(this.x + 20, this.y, 10, weaponColor);
        } else if (this.facing === 'left') {
          drawCircle(this.x - 20, this.y, 10, weaponColor);
        } else if (this.facing === 'up') {
          drawCircle(this.x, this.y - 20, 10, weaponColor);
        } else {
          drawCircle(this.x, this.y + 20, 10, weaponColor);
        }
        break;
    }
  }
  
  _drawAttackAnimation() {
    const progress = this.attackTimer / this.attackDuration;
    const swingRange = 20;
    
    switch (this.weapon) {
      case 'sword':
        if (this.facing === 'right') {
          const swingX = this.x + 20 + Math.sin(progress * Math.PI * 2) * swingRange;
          const swingY = this.y + Math.cos(progress * Math.PI * 2) * swingRange * 0.5;
          drawRect(swingX, swingY, 20, 5, '#fff');
        } else if (this.facing === 'left') {
          const swingX = this.x - 20 - Math.sin(progress * Math.PI * 2) * swingRange;
          const swingY = this.y + Math.cos(progress * Math.PI * 2) * swingRange * 0.5;
          drawRect(swingX, swingY, 20, 5, '#fff');
        } else if (this.facing === 'up') {
          const swingX = this.x + Math.cos(progress * Math.PI * 2) * swingRange * 0.5;
          const swingY = this.y - 20 - Math.sin(progress * Math.PI * 2) * swingRange;
          drawRect(swingX, swingY, 5, 20, '#fff');
        } else {
          const swingX = this.x + Math.cos(progress * Math.PI * 2) * swingRange * 0.5;
          const swingY = this.y + 20 + Math.sin(progress * Math.PI * 2) * swingRange;
          drawRect(swingX, swingY, 5, 20, '#fff');
        }
        break;
      case 'club':
        if (this.facing === 'right') {
          const swingX = this.x + 20 + Math.sin(progress * Math.PI) * swingRange;
          const swingY = this.y;
          drawCircle(swingX, swingY, 12, '#fff');
        } else if (this.facing === 'left') {
          const swingX = this.x - 20 - Math.sin(progress * Math.PI) * swingRange;
          const swingY = this.y;
          drawCircle(swingX, swingY, 12, '#fff');
        } else if (this.facing === 'up') {
          const swingX = this.x;
          const swingY = this.y - 20 - Math.sin(progress * Math.PI) * swingRange;
          drawCircle(swingX, swingY, 12, '#fff');
        } else {
          const swingX = this.x;
          const swingY = this.y + 20 + Math.sin(progress * Math.PI) * swingRange;
          drawCircle(swingX, swingY, 12, '#fff');
        }
        break;
      case 'staff':
        // Staff spell animation - glowing orb
        if (this.facing === 'right') {
          const orbX = this.x + 30 + Math.sin(progress * Math.PI * 2) * 10;
          const orbY = this.y;
          drawCircle(orbX, orbY, 8, '#ff0');
        } else if (this.facing === 'left') {
          const orbX = this.x - 30 - Math.sin(progress * Math.PI * 2) * 10;
          const orbY = this.y;
          drawCircle(orbX, orbY, 8, '#ff0');
        } else if (this.facing === 'up') {
          const orbX = this.x;
          const orbY = this.y - 30 - Math.sin(progress * Math.PI * 2) * 10;
          drawCircle(orbX, orbY, 8, '#ff0');
        } else {
          const orbX = this.x;
          const orbY = this.y + 30 + Math.sin(progress * Math.PI * 2) * 10;
          drawCircle(orbX, orbY, 8, '#ff0');
        }
        break;
      case 'bow':
        // Arrow projectile
        if (this.facing === 'right') {
          const arrowX = this.x + 20 + progress * 100;
          const arrowY = this.y;
          drawRect(arrowX, arrowY, 15, 2, '#fff');
        } else if (this.facing === 'left') {
          const arrowX = this.x - 20 - progress * 100;
          const arrowY = this.y;
          drawRect(arrowX, arrowY, 15, 2, '#fff');
        } else if (this.facing === 'up') {
          const arrowX = this.x;
          const arrowY = this.y - 20 - progress * 100;
          drawRect(arrowX, arrowY, 2, 15, '#fff');
        } else {
          const arrowX = this.x;
          const arrowY = this.y + 20 + progress * 100;
          drawRect(arrowX, arrowY, 2, 15, '#fff');
        }
        break;
      case 'daggers':
        // Dual dagger slash
        if (this.facing === 'right') {
          const dagger1X = this.x + 15 + Math.sin(progress * Math.PI * 2) * 10;
          const dagger1Y = this.y - 5 + Math.cos(progress * Math.PI * 2) * 5;
          const dagger2X = this.x + 15 + Math.sin(progress * Math.PI * 2 + Math.PI) * 10;
          const dagger2Y = this.y + 5 + Math.cos(progress * Math.PI * 2 + Math.PI) * 5;
          drawRect(dagger1X, dagger1Y, 10, 2, '#fff');
          drawRect(dagger2X, dagger2Y, 10, 2, '#fff');
        } else if (this.facing === 'left') {
          const dagger1X = this.x - 15 - Math.sin(progress * Math.PI * 2) * 10;
          const dagger1Y = this.y - 5 + Math.cos(progress * Math.PI * 2) * 5;
          const dagger2X = this.x - 15 - Math.sin(progress * Math.PI * 2 + Math.PI) * 10;
          const dagger2Y = this.y + 5 + Math.cos(progress * Math.PI * 2 + Math.PI) * 5;
          drawRect(dagger1X, dagger1Y, 10, 2, '#fff');
          drawRect(dagger2X, dagger2Y, 10, 2, '#fff');
        } else if (this.facing === 'up') {
          const dagger1X = this.x - 5 + Math.cos(progress * Math.PI * 2) * 5;
          const dagger1Y = this.y - 15 - Math.sin(progress * Math.PI * 2) * 10;
          const dagger2X = this.x + 5 + Math.cos(progress * Math.PI * 2 + Math.PI) * 5;
          const dagger2Y = this.y - 15 - Math.sin(progress * Math.PI * 2 + Math.PI) * 10;
          drawRect(dagger1X, dagger1Y, 2, 10, '#fff');
          drawRect(dagger2X, dagger2Y, 2, 10, '#fff');
        } else {
          const dagger1X = this.x - 5 + Math.cos(progress * Math.PI * 2) * 5;
          const dagger1Y = this.y + 15 + Math.sin(progress * Math.PI * 2) * 10;
          const dagger2X = this.x + 5 + Math.cos(progress * Math.PI * 2 + Math.PI) * 5;
          const dagger2Y = this.y + 15 + Math.sin(progress * Math.PI * 2 + Math.PI) * 10;
          drawRect(dagger1X, dagger1Y, 2, 10, '#fff');
          drawRect(dagger2X, dagger2Y, 2, 10, '#fff');
        }
        break;
    }
  }
}

// Game state
let player;

// Game state
let player;
let enemies = [];
let items = [];
let currentLevel = 1;
let currentRoom = 1;

// Game initialization
function startGame() {
  player = new Player(400, 300, 'lincoln');
  loadLevel(currentLevel, currentRoom);
  engineStart(gameUpdate, gameRender);
}

// Load level and room
function loadLevel(level, room) {
  currentLevel = level;
  currentRoom = room;
  console.log(`Loading Level ${level}, Room ${room}`);
  // TODO: Load actual level data
  spawnEnemies();
  spawnItems();
}

// Spawn enemies
function spawnEnemies() {
  enemies = [];
  // TODO: Spawn enemies based on level and room
}

// Spawn items
function spawnItems() {
  items = [];
  // TODO: Spawn items based on level and room
}

// Game update loop
function gameUpdate(dt) {
  player.update(dt);
  
  // Attack input
  if (Input.down(' ') && !player.isAttacking) {
    player.attack();
  }
  
  // Update enemies
  enemies.forEach(enemy => {
    enemy.update(dt);
  });
}

// Game render loop
function gameRender() {
  clearScreen();
  
  // Render items
  items.forEach(item => {
    item.render();
  });
  
  // Render enemies
  enemies.forEach(enemy => {
    enemy.render();
  });
  
  // Render player
  player.render();
}

// Start the game when the page loads
window.addEventListener('load', () => {
  engineInit();
  startGame();
});