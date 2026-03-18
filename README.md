# Link Quest

A browser-based top-down multiplayer RPG built to prove AI-assisted coding
is not a cop-out — it's a superpower.

## Characters
| Character | Weapon | Spell        |
|-----------|--------|--------------|
| Lincoln   | Sword  | —            |
| Journey   | Staff  | Fireball / Heal |
| Bear      | Bow    | Ice Arrow    |
| Dad       | Club   | Fart AoE     |

## Enemies
- Terminal Goblins — chase and melee
- AI Bugs — confuse / slow debuffs
- Chatbot Clone (mini-boss) — typo attack

## Bosses
- Level 1: Lazy Coder
- Level 3: GossipGPT (transforms into ChatGPT in ending cutscene)

## Run Locally
Open `index.html` in any modern browser — no server needed for single player.
For multiplayer, start a Socket.io server and uncomment network.js.

## Stack
- Phaser 3 (via CDN)
- Socket.io (via CDN, optional)
- Vanilla JS — no build step
