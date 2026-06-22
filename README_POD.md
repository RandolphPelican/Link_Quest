# POD: Phase 1 — Single-Player Complete

## What this is
Link Quest Level 1, playable start to finish. Built and verified in a clean
container: TypeScript clean, production build clean, and a headless-browser
playthrough of the ENTIRE game (title → hero select → 3 rooms → boss →
final sign → victory screen) with zero console errors.

## What's in the game now
- Title screen with hero select: Niall, Bear, Noah, Journey, Lincoln —
  each with their own HP/speed/attack from the locked stat kits
- 4 rooms: The Old Cellar → The Long Hall → The Gatehouse → The
  Hallucinator's Lair, connected by walkable doors (HP carries across)
- Signs: walk up, floating "E" hint, press E, paged typewriter message box.
  Game pauses while reading.
- Enemies with distinct AI: Red Bats (fly + bounce), Grey Rats (chase +
  retreat after biting), Green Blobs (creep + lunge)
- Boss: The Hallucinator — advances relentlessly, fires 3-way green spread
  shots, summons bats below half HP
- Combat: melee arc swings with weapon sprites (axe/club/sword) and ranged
  projectiles (fireball/throwing knife), knockback, hit-flash, i-frames
- Hearts drop from kills (25%), heal 10
- Death → respawn at room entrance; boss death → the final sign rises
  where it fell → reading it triggers the victory screen
- All 4 maps are valid Tiled files, regenerable via tools/generate_maps.py

## How to apply (PowerShell, from C:\Users\Rando\Link_Quest)
1. Extract this zip OVER the repo root (it contains repo-relative paths;
   say yes to overwrite). Or: Expand-Archive -Path linkquest_phase1.zip -DestinationPath . -Force
2. npm install ; npm run build
3. node server.js
4. Open http://localhost:3000 — play it through.
5. If happy: git add -A ; git commit -m "Phase 1: single-player complete" ; git push

## YOUR file
src/client/config/signs.ts — the four messages. Placeholders are marked.
Each string in `lines` is one page of the message box. No length limit.
You never need to touch anything else.

## Files changed (5) / new (12)
M  tsconfig.json                     (useDefineForClassFields fix — unblocks Colyseus later)
M  src/client/tsconfig.json          (exclude public/ from typecheck)
M  src/client/main.ts                (scene list + debug handle)
M  src/client/scenes/BootScene.ts    (pure preloader now)
M  src/client/public/maps/room1.tmj  (regenerated with object layer)
A  src/client/scenes/TitleScene.ts
A  src/client/scenes/GameScene.ts
A  src/client/scenes/UIScene.ts
A  src/client/entities/Enemy.ts
A  src/client/config/heroes.ts
A  src/client/config/enemies.ts
A  src/client/config/signs.ts        ← the one you edit
A  src/client/public/maps/room2.tmj
A  src/client/public/maps/room3.tmj
A  src/client/public/maps/boss.tmj
A  tools/generate_maps.py

## Next phases (in order)
1. You: playtest + verdict; write sign text whenever you're ready
2. Me: thin Colyseus multiplayer (4-letter room code, friends as the other
   heroes, position sync, server-side enemy AI) — the decorator fix this
   pod ships is the prerequisite
3. Render deploy → a URL you can text to anyone
