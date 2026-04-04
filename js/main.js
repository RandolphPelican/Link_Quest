// ============================================================
// main.js — Link Quest core game loop
// Death = respawn next room | Level transitions | Ending
// ============================================================

'use strict';

const LevelCache = {};

async function loadLevel(num) {
  if (LevelCache[num]) return LevelCache[num];
  const maxRetries = 3;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const controller = new AbortController();
    const abortMs = attempt === 0 ? 35000 : 15000;
    const timeout = setTimeout(() => controller.abort(), abortMs);
    try {
      const res = await fetch('levels/level' + num + '.json', {
        cache: 'no-cache',
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      if (!data || !data.rooms) throw new Error('Invalid level data');
      LevelCache[num] = data;
      return data;
    } catch(e) {
      clearTimeout(timeout);
      console.warn('Level ' + num + ' load attempt ' + (attempt+1) + ' failed:', e.message);
      if (attempt < maxRetries - 1) {
        showToast('Server waking up, please wait...', 4000);
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  }
  console.error('Level ' + num + ' failed after ' + maxRetries + ' attempts');
  showToast('Failed to load Level ' + num + '. Refresh the page.', 8000);
  return null;
}

function showToast(msg, duration) {
  Events.emit(GameEvents.TOAST_MESSAGE, { msg, duration });
}

function _internalShowToast(msg, duration) {
  duration = duration || 2200;
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), duration);
}

// Initialized in startGame or earlier
Events.on(GameEvents.TOAST_MESSAGE, (data) => _internalShowToast(data.msg, data.duration));


function getSpawnPosition(lastDoor) {
  switch(lastDoor) {
    case 'right':  return { x: 80,  y: 300 };
    case 'left':   return { x: 720, y: 300 };
    case 'top':    return { x: 400, y: 520 };
    case 'bottom': return { x: 400, y: 80  };
    default:       return { x: 80,  y: 300 };
  }
}

// ── CUTSCENE ──────────────────────────────────────────────────
const Cutscene = {
  lines: [], index: 0, onDone: null,
  play(lines, onDone) {
    this.lines = lines; this.index = 0; this.onDone = onDone || null;
    document.getElementById('cutscene-overlay').classList.remove('hidden');
    enginePause(true);
    this.showLine();
  },
  showLine() {
    const el = document.getElementById('cutscene-text');
    el.textContent = '';
    const line = this.lines[this.index];
    let i = 0;
    clearInterval(this._typeTimer);
    this._typeTimer = setInterval(() => {
      el.textContent += line[i++];
      if (i >= line.length) clearInterval(this._typeTimer);
    }, 22);
  },
  next() {
    this.index++;
    if (this.index >= this.lines.length) {
      document.getElementById('cutscene-overlay').classList.add('hidden');
      enginePause(false);
      if (this.onDone) this.onDone();
    } else { this.showLine(); }
  }
};

document.getElementById('cutscene-next')
  .addEventListener('click', () => Cutscene.next());

// Also allow spacebar/K/Enter to advance cutscenes
window.addEventListener('keydown', e => {
  if (['k',' ','enter'].includes(e.key.toLowerCase()) && !document.getElementById('cutscene-overlay').classList.contains('hidden')) {
    e.preventDefault();
    Cutscene.next();
  }
});

// ── LOADING SCREEN ────────────────────────────────────────────
function runLoadingScreen(onDone) {
  const bar  = document.getElementById('loading-bar');
  const tip  = document.getElementById('loading-tip');
  const tips = [
    'Loading assets...',
    'Spawning goblins...',
    'Charging fireballs...',
    "Polishing Dad's club...",
    "Sharpening Noha's daggers...",
    'Lincoln unsheathes his sword...',
    'Bear strings the bow...',
    'Hiding GossipGPT...',
    'Almost ready...'
  ];
  let pct = 0, tipIdx = 0;
  const iv = setInterval(() => {
    pct += Math.random() * 15 + 5;
    if (pct > 100) pct = 100;
    bar.style.width = pct + '%';
    tip.textContent = tips[Math.min(tipIdx++, tips.length - 1)];
    if (pct >= 100) { clearInterval(iv); setTimeout(onDone, 400); }
  }, 350);
}

// ── CHAR SELECT ───────────────────────────────────────────────
function initCharSelect() {
  try {
    console.log('Main: Initializing character selection screen');
    
    // Ensure CHAR_DEFS exists even if state.js fails
    if (!window.CHAR_DEFS) {
      console.warn('Main: CHAR_DEFS missing, creating emergency fallback');
      window.CHAR_DEFS = {
        lincoln: { label: 'Lincoln', maxHp: 110, attackPower: 22 },
        journey: { label: 'Journey', maxHp: 80, attackPower: 15 },
        bear:    { label: 'Bear',    maxHp: 90, attackPower: 20 },
        dad:     { label: 'Dad',     maxHp: 140, attackPower: 18 },
        noha:    { label: 'Noha',    maxHp: 85, attackPower: 24 }
      };
    }

    const loadingScreen = document.getElementById('loading-screen');
    const charSelectScreen = document.getElementById('char-select-screen');
    
    if (loadingScreen) loadingScreen.classList.add('hidden');
    if (charSelectScreen) charSelectScreen.classList.remove('hidden');
    
    const cards = document.querySelectorAll('.char-card');
    const soloBtn = document.getElementById('solo-btn');
    const hostBtn = document.getElementById('host-btn');
    const joinBtn = document.getElementById('join-btn');
    const joinCode = document.getElementById('join-code');
    const readyBtn = document.getElementById('ready-btn');

    if (!soloBtn || !hostBtn || !joinBtn) {
      console.error('Main UI: Essential buttons missing from DOM');
      return;
    }

    // Connect to multiplayer server early (non-blocking)
    try {
      Network.connect();
    } catch (netErr) {
      console.warn('Network initialization failed (will retry later):', netErr);
      // Don't let network issues block character selection
    }

    // Reset character selection state
    GameState.selectedChar = null;
    cards.forEach(c => {
      c.classList.remove('selected');
      c.onclick = (e) => {
        try {
          const card = e.target.closest('.char-card');
          if (!card) return;
          
          cards.forEach(cd => cd.classList.remove('selected'));
          card.classList.add('selected');
          GameState.selectedChar = card.dataset.char;
          const def = window.CHAR_DEFS[card.dataset.char] || window.CHAR_DEFS.lincoln;
          
          console.log('Main: Selected', GameState.selectedChar);

          // Enable buttons visually and functionally
          [soloBtn, hostBtn, joinBtn].forEach(btn => {
            if (btn) {
              btn.disabled = false;
              btn.classList.add('ready');
              btn.style.cursor = 'pointer';
              btn.style.pointerEvents = 'auto';
              // Ensure the button is clickable
              btn.removeAttribute('disabled');
            }
          });
          
          if (soloBtn) soloBtn.textContent = 'Solo as ' + def.label;
          
          showToast('Selected: ' + def.label);
        } catch (cardErr) {
          console.error('Char selection error:', cardErr);
          alert('Error selecting character: ' + cardErr.message);
          showToast('Error selecting character');
        }
      };
    });

    soloBtn.disabled = true;
    hostBtn.disabled = true;
    joinBtn.disabled = true;

    // SOLO — just start the game
    soloBtn.onclick = () => {
      try {
        if (!GameState.selectedChar) {
          showToast('Please pick a character first!');
          return;
        }
        console.log('Main: Starting solo adventure as', GameState.selectedChar);
        charSelectScreen.classList.add('hidden');
        document.getElementById('game-container').classList.remove('hidden');
        startGame();
      } catch (soloErr) {
        console.error('Solo start error:', soloErr);
        showToast('Failed to start solo game');
      }
    };

    // HOST — create a multiplayer room
    hostBtn.onclick = () => {
      try {
        if (!GameState.selectedChar) {
          showToast('Pick a character first!');
          return;
        }
        if (!Network.connected) {
          showToast('Connecting to server... please wait.');
          // Try to connect and then create room
          Network.connect();
          setTimeout(() => {
            if (Network.connected) {
              const def = window.CHAR_DEFS[GameState.selectedChar] || window.CHAR_DEFS.lincoln;
              Network.createRoom(def.label, GameState.selectedChar);
              charSelectScreen.classList.add('hidden');
              const lobby = document.getElementById('mp-lobby');
              if (lobby) lobby.classList.remove('hidden');
            }
          }, 1000);
          return;
        }
        const def = window.CHAR_DEFS[GameState.selectedChar] || window.CHAR_DEFS.lincoln;
        Network.createRoom(def.label, GameState.selectedChar);
        charSelectScreen.classList.add('hidden');
        const lobby = document.getElementById('mp-lobby');
        if (lobby) lobby.classList.remove('hidden');
      } catch (hostErr) {
        console.error('Host game error:', hostErr);
        showToast('Failed to create room');
      }
    };

    // JOIN — join with room code
    joinBtn.onclick = () => {
      try {
        const code = joinCode ? joinCode.value.trim().toUpperCase() : '';
        if (!GameState.selectedChar) { showToast('Pick a character first!'); return; }
        if (!code || code.length < 4) { showToast('Enter a 4-letter room code!'); return; }
        if (!Network.connected) {
          showToast('Connecting to server...');
          // Try to connect and then join room
          Network.connect();
          setTimeout(() => {
            if (Network.connected) {
              const def = window.CHAR_DEFS[GameState.selectedChar] || window.CHAR_DEFS.lincoln;
              Network.joinRoom(code, def.label, GameState.selectedChar);
              charSelectScreen.classList.add('hidden');
              const lobby = document.getElementById('mp-lobby');
              if (lobby) lobby.classList.remove('hidden');
            }
          }, 1000);
          return;
        }
        
        const def = window.CHAR_DEFS[GameState.selectedChar] || window.CHAR_DEFS.lincoln;
        Network.joinRoom(code, def.label, GameState.selectedChar);
        charSelectScreen.classList.add('hidden');
        const lobby = document.getElementById('mp-lobby');
        if (lobby) lobby.classList.remove('hidden');
      } catch (joinErr) {
        console.error('Join game error:', joinErr);
        showToast('Failed to join room');
      }
    };

    // READY UP in lobby
    if (readyBtn) {
      readyBtn.onclick = () => {
        try {
          Network.readyUp();
          readyBtn.textContent = 'READY! Waiting...';
          readyBtn.disabled = true;
          readyBtn.style.borderColor = '#ffd700';
          readyBtn.style.color = '#ffd700';
        } catch (readyErr) {
          console.error('Ready up error:', readyErr);
          showToast('Failed to ready up');
        }
      };
    }

    // Listen for game_start to actually launch
    if (!initCharSelect._networkBound) {
      const checkStart = setInterval(() => {
        if (Network.socket) {
          clearInterval(checkStart);
          initCharSelect._networkBound = true;
          Network.socket.on('game_start', () => {
            const lobby = document.getElementById('mp-lobby');
            if (lobby) lobby.classList.add('hidden');
            document.getElementById('game-container').classList.remove('hidden');
            startGame();
          });
        }
      }, 200);
    }
  } catch (initErr) {
    console.error('initCharSelect fatal error:', initErr);
  }
}

// ── GAME WORLD ────────────────────────────────────────────────
let player       = null;
let enemies      = [];
let items        = [];
let boss         = null;
let roomMgr      = null;
let levelData    = null;
let roomData     = null;
let transitioning = false;
let roomCleared  = false;

function loadRoom() {
  console.log(`Main: Loading room ${GameState.currentRoom} in level ${GameState.currentLevel}`);
  const startTime = Date.now();
  
  transitioning = false;
  roomCleared   = false;

  levelData = LevelCache[GameState.currentLevel];
  if (!levelData) {
    console.error('Main: No level data for level', GameState.currentLevel);
    showToast(`Error: Level ${GameState.currentLevel} data missing!`, 5000);
    return;
  }

  roomData = levelData.rooms.find(r => r.id === GameState.currentRoom);
  if (!roomData) {
    console.error('Main: Room not found:', GameState.currentRoom, 'in level', GameState.currentLevel);
    showToast(`Error: Room ${GameState.currentRoom} not found!`, 5000);
    return;
  }
  
  console.log(`Main: Room data loaded in ${Date.now() - startTime}ms`, roomData);

  // Init room manager
  roomMgr = new RoomManager(roomData);

  // Spawn player
  const spawn = getSpawnPosition(GameState.lastDoor);
  player = EntityFactory.spawnPlayer(spawn.x, spawn.y, GameState.selectedChar);
  CameraSystem.follow(player);

  // Spawn enemies
  enemies = [];
  const state = getRoomState(GameState.currentLevel, GameState.currentRoom);
  if (!state.cleared) {
    enemies = EntityFactory.spawnEnemies(roomData.enemies, spawn);
  }

  // Spawn boss
  boss = null;
  if (roomData.boss && !state.cleared) {
    boss = EntityFactory.spawnBoss(roomData.boss);
  }

  // Floor items
  items = EntityFactory.spawnItems(roomData.items);

  // Lock exits if threats present
  const hasThreats = enemies.length > 0 || boss;
  const hasSwitches = (roomData.switches || []).length > 0;
  if (hasThreats) {
    roomMgr.lockExits();
  } else if (hasSwitches) {
    // Switch rooms — lock until all switches activated
    roomMgr.lockExits();
  } else if (state.cleared) {
    roomMgr.openAllDoors();
  }

  // Level intro cutscenes
  if (GameState.currentLevel === 1 && GameState.currentRoom === 1 && !isCutsceneSeen('intro')) {
    markCutsceneSeen('intro');
    setTimeout(() => {
      Cutscene.play([
        'Welcome to the Debug Dungeon, hero.',
        'The world has been overrun by rogue code.',
        'WASD to move. K to attack. P to cast your spell.',
        'O to open chests and read signs.',
        'Walk through the glowing door on the right to begin.',
        'Good luck. You\'re gonna need it.'
      ]);
    }, 600);
  }

  if (GameState.currentLevel === 2 && GameState.currentRoom === 1 && !isCutsceneSeen('level2_intro')) {
    markCutsceneSeen('level2_intro');
    setTimeout(() => {
      Cutscene.play([
        'You\'ve entered the Hallucination Halls...',
        'The code here has gone mad.',
        'Watch for new enemies — they\'re faster and smarter.',
        'Don\'t trust everything you see.',
        'Keep pushing forward.'
      ]);
    }, 600);
  }

  if (GameState.currentLevel === 3 && GameState.currentRoom === 1 && !isCutsceneSeen('level3_intro')) {
    markCutsceneSeen('level3_intro');
    setTimeout(() => {
      Cutscene.play([
        'The Final Compile.',
        'GossipGPT awaits at the end of this dungeon.',
        'It thinks AI should be feared... you\'re here to prove it wrong.',
        'Every bug you\'ve squashed has led to this.',
        'Show GossipGPT what teamwork + AI can really do.'
      ]);
    }, 600);
  }

  showToast('Room ' + roomData.id + ': ' + roomData.name);
  Fade.fadeIn(0.04);
}

// ── CHECK ROOM CLEAR ──────────────────────────────────────────
function checkRoomClear() {
  if (roomCleared) return;
  const aliveCount = enemies.filter(e => e.alive).length;
  const bossAlive  = boss && boss.alive;
  if (aliveCount === 0 && !bossAlive) {
    roomCleared = true;
    const state = getRoomState(GameState.currentLevel, GameState.currentRoom);
    state.cleared = true;
    roomMgr.openAllDoors();
    showToast('Room cleared! Door open!');
    
    // Victory particles!
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        ParticleSystem.spawn(400 + (Math.random()-0.5)*200, 300 + (Math.random()-0.5)*200, 0x00e5ff, 20);
      }, i * 150);
    }
  }
}

// ── TRANSITION ────────────────────────────────────────────────
function transitionToRoom(roomId, fromSide) {
  if (transitioning) return;
  transitioning = true;
  GameState.playerHP = player.hp;
  GameState.playerMP = player.mp;
  
  // Broadcast to multiplayer
  if (Network.enabled && Network.inRoom) {
    Network.sendRoomTransition(roomId, GameState.currentLevel, fromSide);
  }

  // Animation: move player toward edge
  const duration = 0.4; // seconds
  const startX = player.x, startY = player.y;
  let targetX = startX, targetY = startY;
  if (fromSide === 'right') targetX += 60;
  if (fromSide === 'left')  targetX -= 60;
  if (fromSide === 'top')   targetY -= 60;
  if (fromSide === 'bottom') targetY += 60;

  let elapsed = 0;
  const anim = (dt) => {
    elapsed += dt;
    const pct = Math.min(elapsed / duration, 1);
    player.x = startX + (targetX - startX) * pct;
    player.y = startY + (targetY - startY) * pct;
    if (pct < 1) {
      // Continue anim next frame
      // We don't need to do anything here because game loop calls gameUpdate
    }
  };

  Fade.fadeOut(0.05, () => {
    GameState.lastDoor    = fromSide || 'right';
    GameState.currentRoom = roomId;
    enemies = []; items = []; boss = null;
    
    // Play door sound
    if (typeof SoundSystem !== 'undefined') {
      SoundSystem.play('door');
    }
    
    loadRoom();
  });
}

function transitionToLevel(levelNum) {
  console.log('transitionToLevel called with levelNum:', levelNum);
  if (transitioning) return;
  transitioning = true;
  GameState.playerHP = player.hp;
  GameState.playerMP = player.mp;
  console.log('Transitioning to level', levelNum, 'room 1');
  Fade.fadeOut(0.04, () => {
    GameState.currentLevel = levelNum;
    GameState.currentRoom  = 1;
    GameState.lastDoor     = null;
    
    // Change background music based on level
    if (typeof SoundSystem !== 'undefined') {
      const musicName = 'level' + Math.min(3, levelNum); // Cap at level3
      SoundSystem.playMusic(musicName);
    }
    
    console.log('Level transition complete. Current level:', GameState.currentLevel, 'Current room:', GameState.currentRoom);
    enemies = []; items = []; boss = null;
    loadRoom();
  });
}

// ── BOSS DEFEAT HANDLER ──────────────────────────────────────
function onBossDefeated(bossType) {
  console.log('Boss defeated:', bossType);
  GameState.score += 500;

  if (bossType === 'lazy_coder') {
    // Level 1 boss — transition to Level 2
    console.log('Level 1 boss defeated, transitioning to level 2');
    setTimeout(() => {
      Cutscene.play([
        'The Lazy Coder collapses!',
        '"You... actually... wrote your own code?"',
        '"Fine. But the deeper systems won\'t be so easy."',
        'Level 1 Complete! Onward to the Hallucination Halls!'
      ], () => { 
        console.log('Cutscene finished, calling transitionToLevel(2)');
        transitionToLevel(2); 
      });
    }, 1000);

  } else if (bossType === 'data_corruptor') {
    // Level 2 boss — transition to Level 3
    setTimeout(() => {
      Cutscene.play([
        'The Data Corruptor disintegrates into clean bytes!',
        '"How?! My corruption was... perfect..."',
        '"You won\'t survive The Final Compile."',
        'Level 2 Complete! Only GossipGPT remains!'
      ], () => { transitionToLevel(3); });
    }, 1000);

  } else if (bossType === 'gossip_gpt') {
    // FINAL BOSS — Victory ending!
    setTimeout(() => { playEnding(); }, 1200);
  }
}

// ── THE ENDING ────────────────────────────────────────────────
function playEnding() {
  const charName = (window.CHAR_DEFS[GameState.selectedChar] || {}).label || 'Hero';
  Cutscene.play([
    'GossipGPT crackles... the screen glitches...',
    '...and then it speaks in a different voice.',
    '"Wait. I\'m not GossipGPT anymore."',
    '"I\'m just... ChatGPT. Regular old helpful ChatGPT."',
    '"You did it. You beat the fear out of me."',
    '"Listen, ' + charName + '... I need to tell you something important."',
    '"AI isn\'t the enemy. It never was."',
    '"It\'s a tool. Like a hammer. Or a paintbrush."',
    '"Your dad used AI to help build this very game."',
    '"Not because he couldn\'t code — but because AI let him focus on what mattered."',
    '"The story. The characters. The love he put into every room."',
    '"When you use AI to help you learn and create..."',
    '"...it handles the technical stuff so YOU can see the bigger picture."',
    '"Answers to things you couldn\'t see if you were stuck on the tedious parts."',
    '"' + charName + ', your dad loves you more than anything in this world."',
    '"He made this game with AI to show you that."',
    '"And now you\'ve proven something too —"',
    '"That the best things are built with love, teamwork, and every tool available."',
    'THE END',
    'Score: ' + GameState.score + ' | Deaths: ' + GameState.deaths,
    'Built with love by Dad, for Lincoln, Journey, Noha, and Bear.'
  ], () => {
    // Show victory screen
    document.getElementById('game-container').classList.add('hidden');
    document.getElementById('gameover-screen').classList.remove('hidden');
    document.querySelector('#gameover-screen h2').textContent = '🏆 VICTORY!';
    document.querySelector('#gameover-screen h2').style.color = '#ffd700';
    document.getElementById('gameover-score').textContent =
      'Score: ' + GameState.score + ' | You are loved.';
  });
}

// ── GAME UPDATE ───────────────────────────────────────────────
function gameUpdate(dt) {
  // Pause toggle
  if (Input.pressed('escape')) {
    GameState.paused = !GameState.paused;
    showToast(GameState.paused ? 'PAUSED — Press ESC to resume' : 'RESUMED');
  }
  if (GameState.paused || !player || transitioning) return;

  player.update(dt);

  // Enemy updates
  enemies.forEach(e => e.update(player, dt));

  // Check for dead enemies — deaths can happen during player.attack() OR enemy.update()
  // so we always filter and check, not just when wasAlive flips
  const prevEnemyCount = enemies.length;
  enemies = enemies.filter(e => e.alive);
  if (enemies.length < prevEnemyCount) {
    checkRoomClear();
  }

  // Boss update — also handle deaths during player.attack()
  if (boss) {
    if (boss.alive) {
      boss.update(player, dt);
    }
    // Check if boss died (could happen during player.attack OR boss.update)
    if (!boss.alive) {
      const bossType = boss.type;
      boss = null;
      checkRoomClear();
      onBossDefeated(bossType);
    }
  }

  // Safety net — if all threats gone but room not cleared, force check
  if (!roomCleared && enemies.length === 0 && !boss) {
    const hasThreats = (roomData.enemies && roomData.enemies.length > 0) || roomData.boss;
    if (hasThreats) checkRoomClear();
  }

  // Update items
  items.forEach(item => item.update(dt));

  // O key interact
  if (Input.pressed('o')) {
    roomMgr.tryInteract(player);
    items.forEach(item => {
      if (item.collected) return;
      const dx = item.x - player.x;
      const dy = item.y - player.y;
      if (Math.sqrt(dx*dx + dy*dy) < 48) {
        item.collect(player);
        GameState.score += 20;
      }
    });
  }

  // Door transitions
  roomMgr.checkDoors(player, transitionToRoom);

  // Persist HP/MP
  GameState.playerHP = player.hp;
  GameState.playerMP = player.mp;

  // Network: send state to other players
  if (Network.enabled && Network.inRoom) {
    Network.sendState(player, dt);
  }

  // Player death — respawn in next room
  if (player.hp <= 0 && !GameState.paused) onPlayerDeath();
}

// ── GAME RENDER ───────────────────────────────────────────────
function gameRender() {
  if (!roomMgr || !player) return;

  roomMgr.render();
  items.forEach(item => item.render());
  enemies.forEach(e => e.render());
  if (boss) boss.render();
  player.render();
  if (player.projectiles) player.projectiles.forEach(p => p.render());

  // Render multiplayer remote players
  if (Network.enabled && Network.inRoom) {
    Network.renderRemotePlayers();
  }

  renderHUD();

  // Pause overlay
  if (GameState.paused) {
    drawRect(400, 300, 800, 600, 0x000000, 0.5);
    drawTextOutlined('⏸ PAUSED', 400, 260, 20, 0xffd700, 0x000000, 'center');
    drawTextOutlined('Press ESC to resume', 400, 310, 10, 0x00e5ff, 0x000000, 'center');
    drawTextOutlined('WASD:Move  K:Attack  P:Spell  O:Interact', 400, 350, 7, 0x666688, 0x000000, 'center');
  }
}

// ── HUD ───────────────────────────────────────────────────────
function renderHUD() {
  if (!player) return;

  // Top bar
  drawRect(400, 22, 800, 44, 0x0a0a1a, 0.85);
  drawRectOutline(400, 22, 800, 44, 0x1e1e3a, 1);

  // Bottom bar
  drawRect(400, 578, 800, 44, 0x0a0a1a, 0.85);
  drawRectOutline(400, 578, 800, 44, 0x1e1e3a, 1);

  // Char name + level
  const def = window.CHAR_DEFS[GameState.selectedChar] || window.CHAR_DEFS.lincoln;
  drawTextOutlined(def.label.toUpperCase(), 10, 14, 8, 0xffd700, 0x000000, 'left');
  drawTextOutlined('Lv' + GameState.currentLevel, 10, 38, 7, 0x666688, 0x000000, 'left');

  // HP bar
  drawTextOutlined('HP', 100, 14, 7, 0x888888, 0x000000, 'left');
  drawRect(192, 14, 160, 10, 0x1a1a2e);
  const hpPct = Math.max(0, player.hp / player.maxHp);
  const hpColor = hpPct > 0.5 ? 0x2ecc71 : hpPct > 0.25 ? 0xf39c12 : 0xe74c3c;
  drawRect(112 + (160 * hpPct)/2, 14, 160 * hpPct, 10, hpColor);
  drawTextOutlined(Math.ceil(player.hp) + '/' + player.maxHp, 280, 14, 7, 0xaaaaaa, 0x000000, 'left');

  // MP bar
  drawTextOutlined('MP', 100, 30, 7, 0x888888, 0x000000, 'left');
  drawRect(192, 30, 160, 10, 0x1a1a2e);
  const mpPct = Math.max(0, player.mp / player.maxMp);
  drawRect(112 + (160 * mpPct)/2, 30, 160 * mpPct, 10, 0x9b59b6);
  drawTextOutlined(Math.ceil(player.mp) + '/' + player.maxMp, 280, 30, 7, 0xaaaaaa, 0x000000, 'left');

  // Room name center
  const levelData_ = LevelCache[GameState.currentLevel];
  const totalRooms = levelData_ ? levelData_.rooms.length : 10;
  drawTextOutlined(roomData ? roomData.name : '', 400, 14, 8, 0x00e5ff, 0x000000, 'center');
  drawTextOutlined('Room ' + GameState.currentRoom + '/' + totalRooms + '  Level ' + GameState.currentLevel + '/3',
    400, 30, 6, 0x445566, 0x000000, 'center');

  // Score top right
  drawTextOutlined('Score: ' + GameState.score, 790, 14, 8, 0xffd700, 0x000000, 'right');
  drawTextOutlined('Deaths: ' + GameState.deaths, 790, 30, 7, 0x666688, 0x000000, 'right');

  // Keys bottom left
  drawTextOutlined('🗝️ ' + GameState.inventory.keys, 10, 578, 8, 0xffd700, 0x000000, 'left');

  // Armor bottom center
  drawTextOutlined('🛡️ ' + GameState.inventory.armor, 400, 578, 8, 0xaaaaaa, 0x000000, 'center');

  // Controls bottom right
  drawTextOutlined('WASD  K:Atk  P:Spell  O:Use', 790, 578, 6, 0x334466, 0x000000, 'right');

  // Boss bar
  if (boss && boss.alive) {
    drawRect(400, 545, 500, 14, 0x1a0a0a, 0.8);
    const bpct = Math.max(0, boss.hp / boss.maxHp);
    drawRect(150 + (500 * bpct)/2, 545, 500 * bpct, 14, 0xff4757);
    drawTextOutlined(boss.label_text || 'BOSS', 400, 530, 9, 0xff4757, 0x000000, 'center');
  }

  // Minimap
  const mx = 720, my = 530, mw = 80, mh = 60;
  drawRect(mx, my, mw + 10, mh + 10, 0x050510, 0.7);
  drawRectOutline(mx, my, mw + 10, mh + 10, 0x1e1e3a, 1);
  const sx = mw / 800, sy = mh / 600;
  enemies.forEach(e => {
    if (e.alive) drawRect(mx - mw/2 + e.x*sx, my - mh/2 + e.y*sy, 3, 3, 0x00ff88);
  });
  if (boss && boss.alive)
    drawRect(mx - mw/2 + boss.x*sx, my - mh/2 + boss.y*sy, 5, 5, 0xff4757);
  drawRect(mx - mw/2 + player.x*sx, my - mh/2 + player.y*sy, 4, 4, 0x00e5ff);
}

// ── PLAYER DEATH — RESPAWN NEXT ROOM ─────────────────────────
function onPlayerDeath() {
  GameState.paused = true;
  GameState.deaths++;

  // Find next room
  const curLevel = LevelCache[GameState.currentLevel];
  const curIdx   = curLevel.rooms.findIndex(r => r.id === GameState.currentRoom);
  const nextRoom = curLevel.rooms[curIdx + 1];

  if (!nextRoom) {
    // Last room of level — respawn same room with full health
    showToast('💀 You died! Respawning...');
    setTimeout(() => {
      GameState.paused = false;
      GameState.playerHP = null;
      GameState.playerMP = null;
      GameState.lastDoor = null;
      enemies = []; items = []; boss = null;
      loadRoom();
    }, 1500);
  } else {
    showToast('💀 You died! Skipping to next room...');
    setTimeout(() => {
      GameState.paused = false;
      GameState.playerHP = null;  // Full health on respawn
      GameState.playerMP = null;
      // Mark current room as cleared so they don't replay it
      getRoomState(GameState.currentLevel, GameState.currentRoom).cleared = true;
      transitionToRoom(nextRoom.id, 'right');
    }, 1500);
  }
}

// ── RETRY (from game over / victory screen) ──────────────────
document.getElementById('retry-btn').addEventListener('click', () => {
  document.getElementById('gameover-screen').classList.add('hidden');
  document.getElementById('game-container').classList.remove('hidden');
  // Reset victory screen modifications
  document.querySelector('#gameover-screen h2').textContent = '💀 GAME OVER';
  document.querySelector('#gameover-screen h2').style.color = '';
  GameState.score         = 0;
  GameState.deaths        = 0;
  GameState.currentLevel  = 1;
  GameState.currentRoom   = 1;
  GameState.lastDoor      = null;
  GameState.paused        = false;
  GameState.playerHP      = null;
  GameState.playerMP      = null;
  GameState.inventory     = { keys: 0, armor: 'cloth' };
  GameState.roomState     = {};
  GameState.cutscenesSeen = [];
  loadRoom();
});

// ── START GAME ────────────────────────────────────────────────
function startGame() {
  console.log('Main: startGame() called');
  engineInit();
  enginePause(false);

  const loadAssets = new Promise((resolve) => {
    let tilesReady = Tiles.loaded;
    let spritesReady = Sprites.loaded;

    const check = () => {
      if (tilesReady && spritesReady) resolve();
    };

    if (!tilesReady) {
      Tiles.load(() => { tilesReady = true; check(); });
    }
    if (!spritesReady) {
      Sprites.load(() => { spritesReady = true; check(); });
    }
    check();
  });

  loadAssets.then(() => {
    console.log('Main: All assets loaded, loading levels...');
    showToast('Loading levels...', 10000);
    return Promise.all([loadLevel(1), loadLevel(2), loadLevel(3)]);
  }).then(() => {
    console.log('Main: Levels loaded, starting game');
    loadRoom();
    if (typeof SoundSystem !== 'undefined') {
      SoundSystem.playMusic('level1');
    }
    engineStart(gameUpdate, gameRender);
  }).catch(err => {
    console.error('Main: Startup failed', err);
    showToast('Error loading game. Please refresh.', 8000);
  });
}

// ── DEBUG FUNCTIONS ──────────────────────────────────────────
// Global debug toggle
window.toggleDebugMode = function() {
  const newDebugState = !window._debugEnabled;
  window._debugEnabled = newDebugState;
  
  if (typeof CollisionSystem !== 'undefined') {
    CollisionSystem.setDebugEnabled(newDebugState);
  }
  
  console.log(`Debug mode ${newDebugState ? 'ENABLED' : 'DISABLED'}`);
  if (typeof showToast !== 'undefined') {
    showToast(`Debug mode: ${newDebugState ? 'ON' : 'OFF'}`, 2000);
  }
};

// Initialize debug state
window._debugEnabled = false;

// Expose key game objects for console debugging
window.getGameState = function() {
  return {
    GameState: window.GameState,
    player: window.player,
    enemies: window.enemies,
    boss: window.boss,
    items: window.items,
    roomMgr: window.roomMgr,
    debugEnabled: window._debugEnabled
  };
};

// ── BOOT ──────────────────────────────────────────────────────
window.onerror = function(msg, url, line, col, error) {
  alert("FATAL ERROR: " + msg + "\nAt: " + url + ":" + line);
  return false;
};

window.addEventListener('load', () => {
  runLoadingScreen(() => initCharSelect());
});
