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
let chests = [];
let doors = [];
let currentLevel = 1;
let currentRoom = 1;
let keys = 0;

// Game initialization
function startGame() {
  // Use selected character or default to lincoln
  const charKey = window.selectedCharacter || 'lincoln';
  player = new Player(400, 300, charKey);
  loadLevel(currentLevel, currentRoom);
  engineStart(gameUpdate, gameRender);
  
  // Hide loading screen if it exists
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    loadingScreen.style.display = 'none';
  }
}

// Start game when page loads
window.addEventListener('load', () => {
  engineInit();
  // Game will start after loading animation when user presses a key
});

// Load level data from JSON
let levelData = {};

async function loadLevelData() {
  try {
    const response = await fetch(`levels/level${currentLevel}.json`);
    levelData = await response.json();
    console.log(`Loaded level ${currentLevel} data`, levelData);
  } catch (error) {
    console.error(`Failed to load level ${currentLevel}:`, error);
  }
}

// Load level and room
function loadLevel(level, room) {
  currentLevel = level;
  currentRoom = room;
  console.log(`Loading Level ${level}, Room ${room}`);
  
  // Clear previous entities
  enemies = [];
  items = [];
  chests = [];
  doors = [];
  
  // Load level data
  loadLevelData().then(() => {
    // Find current room data
    const roomData = levelData.rooms.find(r => r.id === room);
    if (roomData) {
      spawnEntities(roomData);
    } else {
      console.error(`Room ${room} not found in level ${level}`);
      // Fallback to default spawn
      spawnEnemies();
      spawnItems();
      spawnChests();
      spawnDoors();
    }
  });
}

// Spawn entities from room data
function spawnEntities(roomData) {
  // Spawn enemies
  if (roomData.enemies) {
    roomData.enemies.forEach(enemy => {
      enemies.push(new Enemy(enemy.x, enemy.y, enemy.type));
    });
  }
  
  // Spawn items
  if (roomData.items) {
    roomData.items.forEach(item => {
      items.push(new Item(item.x, item.y, item.type));
    });
  }
  
  // Spawn chests
  if (roomData.chests) {
    roomData.chests.forEach(chest => {
      chests.push(new Chest(chest.x, chest.y, chest.locked));
    });
  }
  
  // Spawn doors
  if (roomData.doors) {
    roomData.doors.forEach(door => {
      doors.push(new Door(door.x, door.y, door.leadsTo, door.locked));
    });
  }
}

// Enemy class
class Enemy {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.w = 25;
    this.h = 25;
    
    // Set stats based on enemy type
    switch (type) {
      case 'goblin':
        this.hp = 20;
        this.maxHp = 20;
        this.speed = 40;
        this.damage = 3;
        this.color = '#00ff00';
        break;
      case 'skeleton':
        this.hp = 25;
        this.maxHp = 25;
        this.speed = 35;
        this.damage = 4;
        this.color = '#ffffff';
        break;
      case 'glitch':
        this.hp = 15;
        this.maxHp = 15;
        this.speed = 50;
        this.damage = 2;
        this.color = '#ff00ff';
        break;
      case 'memory_leak':
        this.hp = 30;
        this.maxHp = 30;
        this.speed = 30;
        this.damage = 5;
        this.color = '#00ffff';
        break;
      case 'null_pointer':
        this.hp = 35;
        this.maxHp = 35;
        this.speed = 45;
        this.damage = 6;
        this.color = '#ffff00';
        break;
      case 'demon':
        this.hp = 40;
        this.maxHp = 40;
        this.speed = 50;
        this.damage = 7;
        this.color = '#ff0000';
        break;
      case 'boss':
        this.hp = 100;
        this.maxHp = 100;
        this.speed = 30;
        this.damage = 10;
        this.color = '#ff8800';
        this.w = 40;
        this.h = 40;
        break;
      default:
        this.hp = 20;
        this.maxHp = 20;
        this.speed = 40;
        this.damage = 3;
        this.color = '#ff0000';
    }
  }
  
  update(dt) {
    // Simple AI: move toward player
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > 0) {
      this.x += (dx / dist) * this.speed * dt;
      this.y += (dy / dist) * this.speed * dt;
    }
    
    // Different attack patterns based on enemy type
    if (this.type === 'glitch') {
      // Glitch enemies teleport occasionally
      if (Math.random() < 0.01) {
        this.x = player.x + (Math.random() - 0.5) * 200;
        this.y = player.y + (Math.random() - 0.5) * 200;
      }
    } else if (this.type === 'memory_leak') {
      // Memory leaks move slower but hit harder
      this.speed = 30;
    } else if (this.type === 'boss') {
      // Boss has special movement
      if (dist < 100) {
        // Move away if too close
        this.x -= (dx / dist) * this.speed * dt;
        this.y -= (dy / dist) * this.speed * dt;
      }
    }
  }
  
  render() {
    // Different shapes based on enemy type
    switch (this.type) {
      case 'goblin':
        drawRect(this.x, this.y, this.w, this.h, this.color);
        // Draw goblin eyes
        drawCircle(this.x - 5, this.y - 5, 3, '#fff');
        drawCircle(this.x + 5, this.y - 5, 3, '#fff');
        break;
      case 'skeleton':
        drawRect(this.x, this.y, this.w, this.h, this.color);
        // Draw skeleton ribs
        drawRect(this.x, this.y - 5, this.w, 3, '#fff');
        drawRect(this.x, this.y, this.w, 3, '#fff');
        drawRect(this.x, this.y + 5, this.w, 3, '#fff');
        break;
      case 'glitch':
        // Glitch effect - random rectangles
        for (let i = 0; i < 3; i++) {
          const offsetX = (Math.random() - 0.5) * 10;
          const offsetY = (Math.random() - 0.5) * 10;
          drawRect(this.x + offsetX, this.y + offsetY, 15, 15, this.color);
        }
        break;
      case 'memory_leak':
        drawCircle(this.x, this.y, this.w/2, this.color);
        // Draw memory leak particles
        for (let i = 0; i < 5; i++) {
          const angle = (i / 5) * Math.PI * 2;
          const radius = 15;
          drawCircle(
            this.x + Math.cos(angle) * radius,
            this.y + Math.sin(angle) * radius,
            3, '#00ffff'
          );
        }
        break;
      case 'null_pointer':
        drawRect(this.x, this.y, this.w, this.h, this.color);
        // Draw null pointer symbol
        drawText(this.x - 10, this.y, 'NULL', '#000');
        break;
      case 'demon':
        drawCircle(this.x, this.y, this.w/2, this.color);
        // Draw demon horns
        drawRect(this.x - 10, this.y - 15, 5, 10, '#ff0000');
        drawRect(this.x + 10, this.y - 15, 5, 10, '#ff0000');
        break;
      case 'boss':
        drawCircle(this.x, this.y, this.w/2, this.color);
        // Draw boss crown
        drawRect(this.x - 15, this.y - 20, 30, 10, '#ffff00');
        break;
      default:
        drawRect(this.x, this.y, this.w, this.h, this.color);
    }
    
    // HP bar
    const hpWidth = (this.hp / this.maxHp) * this.w;
    drawRect(this.x - this.w/2, this.y - this.h/2 - 5, hpWidth, 3, '#00ff00');
    // Enemy type label
    drawText(this.x - 10, this.y - 20, this.type, '#fff');
  }
}

// Item class
class Item {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.w = 20;
    this.h = 20;
    this.color = '#ffff00';
  }
  
  render() {
    drawRect(this.x, this.y, this.w, this.h, this.color);
  }
}

// Chest class
class Chest {
  constructor(x, y, locked = false) {
    this.x = x;
    this.y = y;
    this.w = 30;
    this.h = 20;
    this.locked = locked;
    this.opened = false;
    this.color = locked ? '#8b4513' : '#d2b48c';
  }
  
  render() {
    drawRect(this.x, this.y, this.w, this.h, this.color);
    if (this.locked) {
      drawCircle(this.x, this.y, 5, '#ff0000'); // Lock indicator
    }
  }
}

// Door class
class Door {
  constructor(x, y, leadsToRoom, locked = false) {
    this.x = x;
    this.y = y;
    this.w = 40;
    this.h = 10;
    this.leadsToRoom = leadsToRoom;
    this.locked = locked;
    this.color = locked ? '#8b0000' : '#008b00';
  }
  
  render() {
    drawRect(this.x, this.y, this.w, this.h, this.color);
  }
}

// Spawn enemies
function spawnEnemies() {
  enemies = [];
  // Spawn enemies based on level and room
  if (currentLevel === 1) {
    // Level 1 enemies - goblins
    enemies.push(new Enemy(200, 200, 'goblin'));
    enemies.push(new Enemy(600, 400, 'goblin'));
  } else if (currentLevel === 2) {
    // Level 2 enemies - skeletons and glitches
    enemies.push(new Enemy(150, 300, 'skeleton'));
    enemies.push(new Enemy(400, 200, 'glitch'));
    enemies.push(new Enemy(650, 300, 'skeleton'));
  } else if (currentLevel === 3) {
    // Level 3 enemies - demons and memory leaks
    enemies.push(new Enemy(200, 200, 'demon'));
    enemies.push(new Enemy(400, 300, 'memory_leak'));
    enemies.push(new Enemy(600, 200, 'demon'));
    enemies.push(new Enemy(400, 400, 'null_pointer'));
  }
}

// Spawn items
function spawnItems() {
  items = [];
  // Spawn items based on level and room
  if (currentLevel === 1 && currentRoom === 1) {
    items.push(new Item(300, 300, 'health'));
    items.push(new Item(500, 400, 'key'));
  } else if (currentLevel === 1 && currentRoom === 2) {
    items.push(new Item(200, 400, 'health'));
  }
}

// Game update loop
function gameUpdate(dt) {
  player.update(dt);
  
  // Attack input
  if (Input.down(' ') && !player.isAttacking) {
    player.attack();
  }
  
  // Door interaction
  if (Input.down('e')) {
    checkDoorInteraction();
  }
  
  // Chest interaction
  if (Input.down('e')) {
    checkChestInteraction();
  }
  
  // Update enemies
  enemies.forEach(enemy => {
    enemy.update(dt);
  });
  
  // Check enemy collisions with player
  checkEnemyCollisions();
}

// Check door interaction
function checkDoorInteraction() {
  doors.forEach(door => {
    const dist = Math.sqrt(
      Math.pow(player.x - door.x, 2) + Math.pow(player.y - door.y, 2)
    );
    if (dist < 50) {
      if (!door.locked) {
        console.log(`Entering room ${door.leadsTo}`);
        loadLevel(currentLevel, door.leadsTo);
      } else {
        console.log('Door is locked! Need a key.');
      }
    }
  });
}

// Check chest interaction
function checkChestInteraction() {
  chests.forEach(chest => {
    const dist = Math.sqrt(
      Math.pow(player.x - chest.x, 2) + Math.pow(player.y - chest.y, 2)
    );
    if (dist < 40) {
      if (!chest.locked) {
        if (!chest.opened) {
          chest.opened = true;
          console.log('Chest opened!');
          // TODO: Add chest loot
        }
      } else {
        console.log('Chest is locked! Need a key.');
      }
    }
  });
}

// Check enemy collisions
function checkEnemyCollisions() {
  enemies.forEach(enemy => {
    const dist = Math.sqrt(
      Math.pow(player.x - enemy.x, 2) + Math.pow(player.y - enemy.y, 2)
    );
    if (dist < 30) {
      // Player takes damage
      player.hp -= enemy.damage;
      if (player.hp <= 0) {
        player.hp = 0;
        console.log('Game Over!');
      }
      console.log(`Player hit! HP: ${player.hp}/${player.maxHp}`);
    }
  });
}

// Spawn chests
function spawnChests() {
  chests = [];
  // Spawn chests based on level and room
  if (currentLevel === 1 && currentRoom === 1) {
    chests.push(new Chest(100, 100, false));
    chests.push(new Chest(700, 500, true));
  } else if (currentLevel === 1 && currentRoom === 2) {
    chests.push(new Chest(400, 300, false));
  }
}

// Spawn doors
function spawnDoors() {
  doors = [];
  // Spawn doors based on level and room
  if (currentLevel === 1 && currentRoom === 1) {
    doors.push(new Door(400, 50, 2, false)); // Door to room 2
  } else if (currentLevel === 1 && currentRoom === 2) {
    doors.push(new Door(400, 50, 1, false)); // Door back to room 1
    doors.push(new Door(400, 550, 3, true)); // Locked door to room 3
  }
}

// Game render loop
function gameRender() {
  clearScreen();
  
  // Render items
  items.forEach(item => {
    item.render();
  });
  
  // Render chests
  chests.forEach(chest => {
    chest.render();
  });
  
  // Render doors
  doors.forEach(door => {
    door.render();
  });
  
  // Render enemies
  enemies.forEach(enemy => {
    enemy.render();
  });
  
  // Render player
  player.render();
  
  // Render UI
  renderUI();
}

// Render UI
function renderUI() {
  // Draw HP bar
  const hpWidth = (player.hp / player.maxHp) * 100;
  drawRect(50, 30, 100, 10, '#333');
  drawRect(50 - 50, 30, hpWidth, 10, '#f00');
  
  // Draw key count
  drawRect(750, 30, 20, 20, '#ff0');
  drawText(780, 30, `x${keys}`, '#fff');
  
  // Draw level and room info
  drawText(400, 30, `Level ${currentLevel} - Room ${currentRoom}`, '#fff');
  
  // Draw enemy count
  drawText(400, 50, `Enemies: ${enemies.length}`, '#ff0');
  
  // Set different background colors based on level
  switch (currentLevel) {
    case 1:
      clearScreen('#1a1a2e'); // Dark blue for level 1
      break;
    case 2:
      clearScreen('#2e1a2e'); // Purple for level 2
      break;
    case 3:
      clearScreen('#2e2e1a'); // Dark green for level 3
      break;
    default:
      clearScreen('#0a0a0f');
  }
}

// Draw text function
function drawText(x, y, text, color = '#fff') {
  ctx.fillStyle = color;
  ctx.font = '12px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(text, x, y);
}

// Start the game when the page loads
window.addEventListener('load', () => {
  engineInit();
  startGame();
});