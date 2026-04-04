// ============================================================
// engine.js — Core game engine with Canvas2D
// Pure Vanilla JavaScript, zero dependencies
// ============================================================

'use strict';

// Game constants
const GAME_W = 800;
const GAME_H = 600;

// Canvas setup
let canvas, ctx;

function initCanvas() {
  canvas = document.createElement('canvas');
  canvas.width = GAME_W;
  canvas.height = GAME_H;
  document.getElementById('game-container').appendChild(canvas);
  ctx = canvas.getContext('2d');
}

// Input manager
const Input = {
  _keys: {},
  
  init() {
    window.addEventListener('keydown', (e) => {
      this._keys[e.key.toLowerCase()] = true;
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(e.key))
        e.preventDefault();
    });
    
    window.addEventListener('keyup', (e) => {
      this._keys[e.key.toLowerCase()] = false;
    });
  },
  
  down(key) {
    return !!this._keys[key.toLowerCase()];
  }
};

// Drawing functions
function clearScreen(color = '#0a0a0f') {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, GAME_W, GAME_H);
}

function drawRect(x, y, w, h, color = '#fff') {
  ctx.fillStyle = color;
  ctx.fillRect(x - w/2, y - h/2, w, h);
}

function drawCircle(x, y, r, color = '#fff') {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

// Game loop
let _updateFn, _renderFn, _lastTime = 0;

function engineStart(updateFn, renderFn) {
  _updateFn = updateFn;
  _renderFn = renderFn;
  _lastTime = performance.now();
  requestAnimationFrame(_loop);
}

function _loop(now) {
  requestAnimationFrame(_loop);
  const dt = Math.min((now - _lastTime) / 1000, 0.05);
  _lastTime = now;
  
  if (_updateFn) _updateFn(dt);
  if (_renderFn) _renderFn();
}

// Initialize engine
function engineInit() {
  initCanvas();
  Input.init();
}

// Export to global scope
window.engineInit = engineInit;
window.engineStart = engineStart;