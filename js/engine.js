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
  const container = document.getElementById('game-container');
  if (!container) return;
  // Prevent multiple canvases
  let existing = container.querySelector('canvas');
  if (existing) {
    canvas = existing;
  } else {
    canvas = document.createElement('canvas');
    container.appendChild(canvas);
  }
  
  canvas.width  = GAME_W;
  canvas.height = GAME_H;
  canvas.style.cssText = [
    'display:block',
    'width:100%',
    'height:100%',
    'object-fit:contain',
    'background:#000'
  ].join(';');
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
      if (['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))
        e.preventDefault();
    });
    window.addEventListener('keyup', e => {
      const k = e.key.toLowerCase();
      this._held[k]     = false;
      this._released[k] = true;
    });
    this._initTouch();
  },

  _initTouch() {
    const bindBtn = (id, key) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (!this._held[key]) this._pressed[key] = true;
        this._held[key] = true;
      }, {passive:false});
      el.addEventListener('touchend', (e) => {
        e.preventDefault();
        this._held[key] = false;
        this._released[key] = true;
      }, {passive:false});
    };
    bindBtn('btn-up', 'w'); bindBtn('btn-down', 's');
    bindBtn('btn-left', 'a'); bindBtn('btn-right', 'd');
    bindBtn('btn-atk', 'k'); bindBtn('btn-spell', 'p');
    
    window.addEventListener('touchstart', () => {
      const ctrls = document.getElementById('mobile-controls');
      if (ctrls) ctrls.classList.remove('hidden');
    }, { once: true });
  },

  down(key) { return !!this._held[key.toLowerCase()]; },
  pressed(key) { return !!this._pressed[key.toLowerCase()]; },
  released(key) { return !!this._released[key.toLowerCase()]; },

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
    this.friction = 0.85; // Default friction
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vx *= this.friction;
    this.vy *= this.friction;
    clampToBounds(this);
  }

  // AABB collision check with another PhysicsObject or obstacle {x,y,w,h}
  overlaps(other) {
    return Math.abs(this.x - other.x) < (this.w + other.w) / 2 &&
           Math.abs(this.y - other.y) < (this.h + other.h) / 2;
  }

  // Push this object out of a static obstacle
  resolveCollision(obs) {
    const dx = this.x - obs.x;
    const dy = this.y - obs.y;
    const combinedHalfW = (this.w + obs.w) / 2;
    const combinedHalfH = (this.h + obs.h) / 2;
    const overlapX = combinedHalfW - Math.abs(dx);
    const overlapY = combinedHalfH - Math.abs(dy);

    if (overlapX > 0 && overlapY > 0) {
      if (overlapX < overlapY) {
        this.x += dx > 0 ? overlapX : -overlapX;
        this.vx = 0;
      } else {
        this.y += dy > 0 ? overlapY : -overlapY;
        this.vy = 0;
      }
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

  update(dt) {
    if (this.alpha === this.target) return;
    const step = this.speed * dt * 60;
    if (this.alpha < this.target) {
      this.alpha = Math.min(this.alpha + step, this.target);
      if (this.alpha === this.target && this.onDone) {
        const fn = this.onDone;
        this.onDone = null;
        fn();
      }
    } else {
      this.alpha = Math.max(this.alpha - step, this.target);
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
  update(dt) {
    if (this.duration <= 0) { this.offsetX = 0; this.offsetY = 0; return; }
    this.duration -= dt;
    const factor = this.duration > 0 ? this.intensity * (this.duration / 0.33) : 0;
    this.offsetX = (Math.random() - 0.5) * factor * 2;
    this.offsetY = (Math.random() - 0.5) * factor * 2;
  }
};

// ── PARTICLE SYSTEM ──────────────────────────────────────────
const ParticleSystem = {
  particles: [],
  spawn(x, y, color, count) {
    for (let i = 0; i < (count || 5); i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = Math.random() * 100 + 50;
      this.particles.push({
        x, y,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        life: 1.0,
        color: color || 0xffffff
      });
    }
  },
  update(dt) {
    this.particles.forEach(p => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 200 * dt; // Gravity
      p.life -= dt * 2;
    });
    this.particles = this.particles.filter(p => p.life > 0);
  },
  render() {
    this.particles.forEach(p => {
      drawRect(p.x, p.y, 4, 4, p.color, p.life);
    });
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
  Fade.update(dt);
  ScreenShake.update(dt);
  ParticleSystem.update(dt);

  ctx.save();
  ctx.translate(ScreenShake.offsetX, ScreenShake.offsetY);
  clearScreen(0x0a0a0f);
  if (_gameRender) _gameRender();
  ParticleSystem.render();
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
