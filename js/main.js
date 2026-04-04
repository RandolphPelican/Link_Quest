// ============================================================
// main.js — Link Quest core game logic
// ============================================================

'use strict';

// Character definitions
const CHARACTERS = {
  lincoln: { name: 'Lincoln', color: '#3498db', speed: 180, hp: 100 },
  journey: { name: 'Journey', color: '#9b59b6', speed: 170, hp: 80 },
  bear:    { name: 'Bear',    color: '#27ae60', speed: 200, hp: 90 },
  noha:    { name: 'Noha',    color: '#e74c3c', speed: 220, hp: 85 },
  dad:     { name: 'Dad',     color: '#e67e22', speed: 140, hp: 140 }
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
  }
  
  update(dt) {
    if (Input.down('a') || Input.down('arrowleft')) this.x -= this.speed * dt;
    if (Input.down('d') || Input.down('arrowright')) this.x += this.speed * dt;
    if (Input.down('w') || Input.down('arrowup')) this.y -= this.speed * dt;
    if (Input.down('s') || Input.down('arrowdown')) this.y += this.speed * dt;
  }
  
  render() {
    drawRect(this.x, this.y, this.w, this.h, this.char.color);
    drawCircle(this.x, this.y - 15, 8, '#fff'); // Head
  }
}

// Game state
let player;

// Game initialization
function startGame() {
  player = new Player(400, 300, 'lincoln');
  engineStart(gameUpdate, gameRender);
}

// Game update loop
function gameUpdate(dt) {
  player.update(dt);
}

// Game render loop
function gameRender() {
  clearScreen();
  player.render();
}

// Start the game when the page loads
window.addEventListener('load', () => {
  engineInit();
  startGame();
});