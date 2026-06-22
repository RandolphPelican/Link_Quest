# Link Quest

A single-player top-down dungeon crawler built with Phaser 3 and TypeScript. Fight
through three hand-built rooms and a boss to reach the end — and read the signs you
find along the way.

**Play it:** https://link-quest-6dry.onrender.com
(Free hosting — the first load may take ~30–60s to wake the server.)

## Controls
- **Move:** WASD / Arrow keys
- **Attack:** SPACE (or J)
- **Bomb:** Q (when one is held — a player-centered AoE blast)
- **Interact** (read signs, open chests, use doors): E
- **Pause:** P or ESC
- **Debug overlay:** F3

## The game
- Five playable heroes (Niall, Bear, Noah, Journey, Lincoln), each with their own
  HP, speed, and melee or ranged attack.
- Four areas — The Old Cellar → The Long Hall → The Gatehouse → The Hallucinator's
  Lair — each a different combat lesson, ending in a boss fight.
- Enemies with distinct AI: red bats (fly + bounce), grey rats (chase, then retreat
  after biting), green blobs (creep + lunge), and ranged wardens that telegraph and
  fire. Defeat a room's warden to earn the key that unlocks the door onward.
- Pickups: health potions (+20 HP) and a held bomb (press Q to detonate).
- Signs throughout the world deliver the story's messages.

## Project structure
- `src/client` — the Phaser 3 game (Vite + TypeScript).
- `src/server` — an Express + Colyseus server that serves the built client.
- `src/client/config` — data-driven `heroes.ts`, `enemies.ts`, and the sign text in `signs.ts`.
- `src/client/public/maps` — Tiled `.tmj` room maps.
- `tools/` — map generators and an ASCII map renderer (`render_map.mjs`).

## Local development
1. `npm install`
2. Client dev server: `npm run dev:client` (Vite), or run the full stack:
   `npm run build && npm start` then open the printed port.

## Build & deploy
- `npm run build` compiles the server (`tsc`) and bundles the client (`vite`) into `dist/`.
- Deployed on [Render](https://render.com) from the `main` branch via `render.yaml`
  (build: `npm install --include=dev && npm run build`, start: `node server.js`).
  The server binds `process.env.PORT`.
