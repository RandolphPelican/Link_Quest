// ============================================================
// engine.js — Link Quest custom engine
// Pure Canvas2D, zero dependencies, runs everywhere
// ============================================================

'use strict';

// ── CANVAS SETUP ─────────────────────────────────────────────
const GAME_W = 800;
const GAME_H = 600;

let canvas, ctx;

function initCanvas() {
  canvas = document.createElement('canvas');
  canvas.width  = GAME_W;
  canvas.height = GAME_H;
  canvas.style.cssText = [
    'display:block',
    'width:100%',
    'height:100%',
    'object-fit:contain',
    'background:#000'
  ].join(';');
  document.getElementById('game-container').appendChild(canvas);
  ctx = canvas.getContext('2d');
}

// ── INPUT MANAGER ─────────────────────────────────────────────
const Input = {
  _held:     {},
  _pressed:  {},
  _released: {},

  init() {
    window.addEventListener('keydown', e => {
      const k = e.key.toLowerCase();
      if (!this._held[k]) this._pressed[k] = true;
      this._held[k] = true;
      // Prevent arrow keys scrolling page
      if (['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))
        e.preventDefault();
    });
    window.addEventListener('keyup', e => {
      const k = e.key.toLowerCase();
      this._held[k]     = false;
      this._released[k] = true;
    });
  },

  // Is key currently held down
  down(key) { return !!this._held[key.toLowerCase()]; },

  // Was key just pressed this frame
  pressed(key) { return !!this._pressed[key.toLowerCase()]; },

  // Was key just released this frame
  released(key) { return !!this._released[key.toLowerCase()]; },

  // Clear per-frame state — call at end of each frame
  clearFrame() {
    this._pressed  = {};
    this._released = {};
  }
};

// ── DRAW API ──────────────────────────────────────────────────

// Convert hex color number to CSS string
function hexToCSS(hex, alpha) {
  alpha = alpha !== undefined ? alpha : 1;
  const r = (hex >> 16) & 0xff;
  const g = (hex >>  8) & 0xff;
  const b =  hex        & 0xff;
  return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
}

function clearScreen(hex) {
  hex = hex || 0x0a0a0f;
  ctx.fillStyle = hexToCSS(hex);
  ctx.fillRect(0, 0, GAME_W, GAME_H);
}

function drawRect(x, y, w, h, hex, alpha) {
  ctx.fillStyle = hexToCSS(hex || 0xffffff, alpha !== undefined ? alpha : 1);
  ctx.fillRect(x - w/2, y - h/2, w, h);
}

function drawRectOutline(x, y, w, h, hex, lineWidth) {
  ctx.strokeStyle = hexToCSS(hex || 0xffffff);
  ctx.lineWidth   = lineWidth || 1;
  ctx.strokeRect(x - w/2, y - h/2, w, h);
}

function drawCircle(x, y, r, hex, alpha) {
  ctx.fillStyle = hexToCSS(hex || 0xffffff, alpha !== undefined ? alpha : 1);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function drawCircleOutline(x, y, r, hex, lineWidth) {
  ctx.strokeStyle = hexToCSS(hex || 0xffffff);
  ctx.lineWidth   = lineWidth || 1;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
}

function drawLine(x1, y1, x2, y2, hex, lineWidth) {
  ctx.strokeStyle = hexToCSS(hex || 0xffffff);
  ctx.lineWidth   = lineWidth || 1;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function drawText(text, x, y, size, hex, align, font) {
  ctx.fillStyle    = hexToCSS(hex || 0xffffff);
  ctx.font         = (size || 14) + 'px ' + (font || '"Press Start 2P", monospace');
  ctx.textAlign    = align  || 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

function drawTextOutlined(text, x, y, size, hex, outlineHex, align, font) {
  ctx.font         = (size || 14) + 'px ' + (font || '"Press Start 2P", monospace');
  ctx.textAlign    = align  || 'left';
  ctx.textBaseline = 'middle';
  ctx.strokeStyle  = hexToCSS(outlineHex || 0x000000);
  ctx.lineWidth    = 3;
  ctx.strokeText(text, x, y);
  ctx.fillStyle    = hexToCSS(hex || 0xffffff);
  ctx.fillText(text, x, y);
}

// ── WORLD BOUNDS ──────────────────────────────────────────────
const WorldBounds = {
  x: 32, y: 44, w: 736, h: 510,
  get right()  { return this.x + this.w; },
  get bottom() { return this.y + this.h; }
};

function clampToBounds(obj) {
  const hw = obj.w / 2, hh = obj.h / 2;
  if (obj.x - hw < WorldBounds.x)      { obj.x = WorldBounds.x + hw;      obj.vx = 0; }
  if (obj.x + hw > WorldBounds.right)  { obj.x = WorldBounds.right - hw;  obj.vx = 0; }
  if (obj.y - hh < WorldBounds.y)      { obj.y = WorldBounds.y + hh;      obj.vy = 0; }
  if (obj.y + hh > WorldBounds.bottom) { obj.y = WorldBounds.bottom - hh; obj.vy = 0; }
}

// ── SIMPLE PHYSICS OBJECT ─────────────────────────────────────
class PhysicsObject {
  constructor(x, y, w, h) {
    this.x  = x; this.y  = y;
    this.w  = w; this.h  = h;
    this.vx = 0; this.vy = 0;
  }

  update() {
    this.x += this.vx / 60;
    this.y += this.vy / 60;
    clampToBounds(this);
  }

  // AABB collision check with another PhysicsObject or obstacle {x,y,w,h}
  overlaps(other) {
    return Math.abs(this.x - other.x) < (this.w + other.w) / 2 &&
           Math.abs(this.y - other.y) < (this.h + other.h) / 2;
  }

  // Push this object out of a static obstacle
  resolveCollision(obs) {
    const overlapX = (this.w + obs.w) / 2 - Math.abs(this.x - obs.x);
    const overlapY = (this.h + obs.h) / 2 - Math.abs(this.y - obs.y);
    if (overlapX <= 0 || overlapY <= 0) return;
    if (overlapX < overlapY) {
      this.x += this.x < obs.x ? -overlapX : overlapX;
      this.vx = 0;
    } else {
      this.y += this.y < obs.y ? -overlapY : overlapY;
      this.vy = 0;
    }
  }
}

// ── FADE OVERLAY ──────────────────────────────────────────────
const Fade = {
  alpha:    0,
  target:   0,
  speed:    0,
  onDone:   null,

  fadeOut(speed, onDone) {
    this.alpha  = 0;
    this.target = 1;
    this.speed  = speed || 0.05;
    this.onDone = onDone || null;
  },

  fadeIn(speed) {
    this.alpha  = 1;
    this.target = 0;
    this.speed  = speed || 0.05;
    this.onDone = null;
  },

  update() {
    if (this.alpha === this.target) return;
    if (this.alpha < this.target) {
      this.alpha = Math.min(this.alpha + this.speed, this.target);
      if (this.alpha === this.target && this.onDone) {
        const fn = this.onDone;
        this.onDone = null;
        fn();
      }
    } else {
      this.alpha = Math.max(this.alpha - this.speed, this.target);
    }
  },

  render() {
    if (this.alpha <= 0) return;
    ctx.fillStyle = 'rgba(0,0,0,' + this.alpha + ')';
    ctx.fillRect(0, 0, GAME_W, GAME_H);
  }
};

// ── SCREEN SHAKE ─────────────────────────────────────────────
const ScreenShake = {
  intensity: 0,
  duration:  0,
  offsetX:   0,
  offsetY:   0,
  trigger(intensity, duration) {
    this.intensity = intensity;
    this.duration  = duration;
  },
  update() {
    if (this.duration <= 0) { this.offsetX = 0; this.offsetY = 0; return; }
    this.duration--;
    const factor = this.duration > 0 ? this.intensity * (this.duration / 20) : 0;
    this.offsetX = (Math.random() - 0.5) * factor * 2;
    this.offsetY = (Math.random() - 0.5) * factor * 2;
  }
};

// ── GAME LOOP ─────────────────────────────────────────────────
let _gameUpdate  = null;
let _gameRender  = null;
let _lastTime    = 0;
let _paused      = false;

function engineStart(updateFn, renderFn) {
  _gameUpdate = updateFn;
  _gameRender = renderFn;
  _lastTime   = performance.now();
  requestAnimationFrame(_loop);
}

function _loop(now) {
  requestAnimationFrame(_loop);

  const dt = Math.min((now - _lastTime) / 1000, 0.05);
  _lastTime = now;

  if (!_paused && _gameUpdate) _gameUpdate(dt);
  Fade.update();
  ScreenShake.update();

  ctx.save();
  ctx.translate(ScreenShake.offsetX, ScreenShake.offsetY);
  clearScreen(0x0a0a0f);
  if (_gameRender) _gameRender();
  ctx.restore();
  Fade.render();

  Input.clearFrame();
}

function enginePause(val) { _paused = val; }

// ── INIT ──────────────────────────────────────────────────────
function engineInit() {
  initCanvas();
  Input.init();
}

// Engine ready — game boot happens in main.js
