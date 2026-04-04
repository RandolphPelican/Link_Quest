# ⚔️ LINK QUEST

A 100% Vanilla JS/Canvas2D top-down action-adventure RPG built on the **10 Commandments of Zelda-like Design** with a full Mario Maker–style room editor.

---

## 🏗️ Architecture

### Ten Commandments Compliance

| # | Commandment | Status | Notes |
|---|-------------|--------|-------|
| C1 | State Machine for all entities | ✅ | `PlayerState` enum (7 states), enemy state machine (idle/chase/attack/retreat/stunned), Boss phase transitions |
| C2 | Separate Movement / Collision / Combat | ✅ | `PlayerController` (input→velocity), `PhysicsObject` (velocity→position), `CollisionSystem` (hitbox/hurtbox) |
| C3 | Hitboxes and Hurtboxes | ✅ | `Hitbox`/`Hurtbox` classes in `collision.js`; attack detection fires damage events, not physics collisions |
| C4 | Animation decoupled from logic | ✅ | `SpriteAnimator` tracks frame independently; logic triggers animation, not the reverse |
| C5 | Modular, data-driven systems | ✅ | `CHAR_DEFS`, `ITEMS` config, `typeStats` per enemy (now includes score), spell config on character defs |
| C6 | Animation continuity | ✅ | Walk bobbing, attack lunge, slash arc, dash trail afterimages — all frame-timed |
| C7 | Robust Interaction System | ✅ | `InteractionController` finds closest interactable; `RoomManager.tryInteract()` dispatches chest/sign logic |
| C8 | Simple centered camera | ✅ | Smooth lerp follow-cam with dead zone in `engine.js` |
| C9 | Clean tilemap pipeline | ⚠️ | `Tiles` registry and drawers exist; collision uses obstacle objects (tilemap metadata layer is the next evolution) |
| C10 | Unified Event System | ✅ | Global `Events` bus with `GameEvents` enum; `PLAYER_DAMAGED`, `ENEMY_DAMAGED`, `SWITCH_ACTIVATED` all emitted |

### Mario Maker–Class Build/Play Architecture

| # | Requirement | Status | Notes |
|---|-------------|--------|-------|
| MM1 | Deterministic room format | ✅ | JSON schema; enemy `animPhase` is now position-hash based (no `Math.random`); sign tips are position-indexed |
| MM2 | Versioned schema | ✅ | `room.version` field with `_migrate()` pipeline |
| MM3 | Tile/Entity registry | ✅ | `Tiles`, `Sprites`, `ITEMS` registries; validator checks enemy types against known list |
| MM4 | Parameterized entities | ✅ | Enemy `pattern`, chest `type`/`contains`, door `locked`/`leadsTo` all configurable |
| MM5 | Sandboxed runtime | ✅ | Playtest launches the identical game loop (`startGame()`) into an isolated `LevelCache['maker']` |
| MM6 | Undo/Redo | ✅ | Command stack (max 50), `Ctrl+Z` / `Ctrl+Y` |
| MM7 | Stable serialization | ✅ | `JSON.stringify/parse` with schema migration on import |
| MM8 | Playtest = real runtime | ✅ | `Maker.playtest()` uses `startGame()` — no preview shortcuts |
| MM9 | Room linkage system | ✅ | `door.leadsTo` room IDs; campaign playtest now loads **all** campaign rooms, not just the current one |
| MM10 | Validation layer | ✅ | Checks: exit exists, enemy count ≤ 20, valid enemy types vs registry, entity bounds |

---

## 🎮 Game Modes

- **Solo Adventure** — Three handcrafted levels: Debug Dungeon, Hallucination Halls, The Final Compile (18 rooms, 3 bosses, 5 characters)
- **Multiplayer** — Host or Join rooms (requires Socket.io relay server)
- **Maker Mode** — Design rooms, link them into campaigns, playtest, export, and share via GitHub Gist

---

## 🛠️ Maker Mode

### Features
- **Full palette** — all 16 enemy types, 3 tile types, 9 decoration types
- **Campaigns** — link multiple rooms; playtest the full campaign in order
- **AI Suggest** — 8 balanced room layouts (The Crossfire, Trial of Switches, The Gauntlet, Spider's Nest, Memory Maze, The Ambush, Treasure Vault, and more)
- **Undo/Redo** — `Ctrl+Z` / `Ctrl+Y`, 50-step history
- **Mobile** — full touch support on the editor canvas
- **Export / Import** — single room or full campaign `.json` with automatic schema migration
- **Share** — GitHub Gist upload; friends open `?gist=<id>` to play instantly

### Validation
Before saving or playtesting, the editor checks:
1. At least one exit door exists
2. No more than 20 enemies
3. All enemy types are valid (checked against the in-game registry)
4. No entities placed outside the playable area

### Sharing Your Campaign
1. Click **SHARE** in Maker Mode
2. Provide a GitHub Personal Access Token (PAT)
3. Copy the generated URL and send it to friends
4. Friends open the link — the campaign loads and starts automatically

---

## ⚔️ Combat System

- **Hitbox/Hurtbox** — `_createAttackHitbox()` generates a directional hitbox each swing; enemies have persistent `Hurtbox` instances
- **Enemy Knockback** — melee hits and projectiles pass a knockback vector to `takeDamage(amount, kbx, kby)`; enemies are pushed away on every hit
- **Invincibility Frames** — player gets 45 frames of i-frames after taking damage
- **Armor Modifiers** — cloth 100%, leather 80%, metal 60% damage taken
- **5 Spell Types** — AoE (Dad), Spin (Lincoln), Dash (Journey), Projectile (Bear), Ice Arrow (Noha)

---

## ✨ Creative Features
- **Dad's AI Tip** — Signs reveal deterministic motivational tips based on their position
- **PWA Ready** — Add to home screen for offline play and full-screen experience
- **Particle Polish** — Enhanced visual feedback for attacks, spells, and game events
- **Dynamic Animations** — Characters have walking animations, weapon swings, and attack effects

---

## 🗂️ File Structure

```
js/
  engine.js          — Canvas2D engine, input, camera, physics, particles
  events.js          — Unified event bus (C10)
  state.js           — Global GameState, localStorage + IndexedDB persistence
  collision.js       — Hitbox / Hurtbox system (C3)
  tiles.js           — Tile registry and drawers (C9)
  sprites.js         — Sprite animator and character/enemy drawers (C4, C6)
  interaction.js     — Interaction controller (C7)
  player.js          — Player entity, spell kit, projectiles
  player_controller.js — Input → movement (C2)
  enemy.js           — Enemy FSM, 5 AI patterns, deterministic animation, 16 types
  boss.js            — Three bosses with phase transitions and special attacks
  item.js            — 36 item types, data-driven collection logic
  factory.js         — Entity spawning
  room.js            — Room manager, rendering, switch puzzles, door transitions
  main.js            — Game loop, level loading, cutscenes, HUD
  maker.js           — Level editor: palette, validation, undo/redo, campaign playtest
  network.js         — Socket.io multiplayer client
levels/
  level1.json        — Debug Dungeon (6 rooms)
  level2.json        — Hallucination Halls (6 rooms)
  level3.json        — The Final Compile (6 rooms)
```

---

## 📋 Development Roadmap

### 🔴 High Priority
1. **Tilemap Metadata Layer** — Fully migrate collisions and interactions to tile metadata (C9)
2. **Multiplayer Server** — Proper Socket.io authoritative server for multiplayer
3. **Sound Assets** — Add actual sound files for attacks, spells, and ambience
4. **Mobile Controls** — Test and improve touch controls on real devices

### 🟡 Medium Priority
1. **Data-Driven Spells** — Move spell definitions into a unified `SpellConfig` (C5)
2. **Enemy Knockback Polish** — Tune knockback values per enemy type and attack
3. **Level 4 Content** — Use the new elite/bonus enemy types
4. **Room Graph Validation** — Validate that campaign door links form a valid graph

### 🟢 Low Priority
1. **Save System** — Cloud saving for campaigns and progress
2. **Achievements** — Expand achievement system
3. **Story Mode** — Expanded narrative and cutscenes

---

## 🚀 Development

Built with Vanilla JavaScript and the Canvas API. No build step required.

```bash
npm install
node server.js      # Express + Socket.io on port 3000
```

Deploy-ready for **Render** (`render.yaml` included).

---

Built for Lincoln, Journey, Noha, and Bear.  
*"The best things are built with love, teamwork, and every tool available."*
