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

// ── CAMERA ────────────────────────────────────────────────────
class Camera {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.target = null;
    this.lerp = 0.1;
    this.deadzone = 20;
  }

  follow(target) {
    this.target = target;
  }

  update(dt) {
    if (!this.target) return;

    const tx = this.target.x - GAME_W / 2;
    const ty = this.target.y - GAME_H / 2;

    // Smooth follow
    this.x += (tx - this.x) * this.lerp;
    this.y += (ty - this.y) * this.lerp;

    // Room boundaries (optional, can be expanded)
    // this.x = Math.max(0, Math.min(this.x, WORLD_W - GAME_W));
  }

  apply(ctx) {
    ctx.translate(-this.x, -this.y);
  }
}

const CameraSystem = new Camera();

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
  
  spawn(x, y, color, count, type = 'normal') {
    for (let i = 0; i < (count || 5); i++) {
      if (type === 'normal') {
        const a = Math.random() * Math.PI * 2;
        const spd = Math.random() * 100 + 50;
        this.particles.push({
          x, y,
          vx: Math.cos(a) * spd,
          vy: Math.sin(a) * spd,
          life: 1.0,
          color: color || 0xffffff,
          size: 4,
          gravity: 200,
          fade: 2.0
        });
      } else if (type === 'spark') {
        const a = Math.random() * Math.PI * 2;
        const spd = Math.random() * 150 + 100;
        this.particles.push({
          x, y,
          vx: Math.cos(a) * spd,
          vy: Math.sin(a) * spd,
          life: 1.5,
          color: color || 0xffff00,
          size: 3,
          gravity: 100,
          fade: 1.5,
          trail: true
        });
      } else if (type === 'smoke') {
        const a = Math.random() * Math.PI * 2;
        const spd = Math.random() * 50 + 20;
        this.particles.push({
          x, y,
          vx: Math.cos(a) * spd,
          vy: Math.sin(a) * spd,
          life: 2.0,
          color: color || 0x888888,
          size: 8,
          gravity: 50,
          fade: 0.8,
          alpha: 0.6
        });
      } else if (type === 'blood') {
        const a = Math.random() * Math.PI * 0.6 - Math.PI * 0.3; // Mostly downward
        const spd = Math.random() * 80 + 40;
        this.particles.push({
          x, y,
          vx: Math.cos(a) * spd,
          vy: Math.sin(a) * spd,
          life: 1.2,
          color: color || 0xff4444,
          size: 5,
          gravity: 250,
          fade: 1.8
        });
      } else if (type === 'magic') {
        const a = Math.random() * Math.PI * 2;
        const spd = Math.random() * 60 + 30;
        this.particles.push({
          x, y,
          vx: Math.cos(a) * spd,
          vy: Math.sin(a) * spd,
          life: 2.5,
          color: color || 0x00ccff,
          size: 6,
          gravity: 80,
          fade: 1.0,
          glow: true
        });
      }
    }
  },
  
  spawnExplosion(x, y, color) {
    // Big explosion effect
    for (let i = 0; i < 30; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = Math.random() * 200 + 100;
      this.particles.push({
        x, y,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        life: 1.5,
        color: color || 0xffaa00,
        size: 5,
        gravity: 150,
        fade: 2.0
      });
    }
    // Add some smoke
    this.spawn(x, y, 0x666666, 15, 'smoke');
  },
  
  spawnHealEffect(x, y) {
    // Green healing particles
    for (let i = 0; i < 20; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = Math.random() * 80 + 40;
      this.particles.push({
        x, y,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd - 50, // Upward bias
        life: 1.8,
        color: 0x44ff44,
        size: 4,
        gravity: 100,
        fade: 1.5
      });
    }
  },
  
  update(dt) {
    this.particles.forEach(p => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += (p.gravity || 200) * dt; // Gravity
      p.life -= dt * (p.fade || 2.0);
    });
    this.particles = this.particles.filter(p => p.life > 0);
  },
  
  render() {
    this.particles.forEach(p => {
      if (p.glow) {
        ctx.globalAlpha = Math.min(1, p.life * 1.5);
        drawCircle(p.x, p.y, p.size * 1.5, p.color, 0.2);
        ctx.globalAlpha = 1;
      }
      ctx.globalAlpha = p.alpha || Math.min(1, p.life * 1.2);
      if (p.trail && Math.random() < 0.3) {
        drawCircle(p.x, p.y, p.size * 0.7, p.color, 0.8);
      } else {
        drawCircle(p.x, p.y, p.size * 0.5, p.color, 0.8);
      }
      ctx.globalAlpha = 1;
    });
  }
};

// ── SOUND SYSTEM ──────────────────────────────────────────────
const SoundSystem = {
  enabled: true,
  sounds: {},
  backgroundMusic: null,
  currentMusic: null,
  
  init() {
    this.enabled = false;
    console.log('SoundSystem: disabled (no audio files present)');
  },
  
  play(name) {
    if (!this.enabled || !this.sounds[name]) return;
    try {
      this.sounds[name].currentTime = 0;
      this.sounds[name].play();
    } catch (e) {
      console.warn('Sound play failed:', e);
    }
  },
  
  playMusic(name) {
    if (!this.enabled || !this.backgroundMusic[name]) return;
    
    // Stop current music
    if (this.currentMusic) {
      this.currentMusic.pause();
      this.currentMusic.currentTime = 0;
    }
    
    this.currentMusic = this.backgroundMusic[name];
    this.currentMusic.currentTime = 0;
    this.currentMusic.play();
  },
  
  stopMusic() {
    if (this.currentMusic) {
      this.currentMusic.pause();
      this.currentMusic.currentTime = 0;
      this.currentMusic = null;
    }
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
  
  // Initialize sound system
  SoundSystem.init();
  
  requestAnimationFrame(_loop);
}

function _loop(now) {
  requestAnimationFrame(_loop);
  if (!ctx) return;

  const dt = Math.min((now - _lastTime) / 1000, 0.05);
  _lastTime = now;

  if (!_paused && _gameUpdate) _gameUpdate(dt);
  CameraSystem.update(dt);
  Fade.update(dt);
  ScreenShake.update(dt);
  ParticleSystem.update(dt);

  ctx.save();
  ctx.translate(ScreenShake.offsetX, ScreenShake.offsetY);
  CameraSystem.apply(ctx);
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
