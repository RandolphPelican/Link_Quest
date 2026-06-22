# POD: Batch 1 — Unbreakable & Debuggable

Built and verified in a clean container: TypeScript clean, production build clean,
headless playthrough confirms every change below. Six files changed. Your
src/client/config/signs.ts is NOT touched.

## What changed
1. FREEZE FIXED. The crash that froze the game when an enemy died (a health bar
   getting torn down a frame before the corpse faded) is closed. Mass-killing a
   whole room now throws zero errors. This was your Journey freeze.

2. ENEMIES TUNED. Speeds cut ~45% (bats 95->52, rats 75->46, blobs 30->20,
   boss 45->34) and contact damage raised (bat 1->3, rat 2->5, blob 3->7,
   boss 3->8). Slower, but they hurt now. All numbers live in
   src/client/config/enemies.ts — tweak freely.

3. DOORS GATED. Doors stay LOCKED until every enemy in the room is dead. Walk
   into a locked door and you get "The door won't budge — clear the room first."
   Clear the room and you get "Room cleared. The way is open." No more sprinting
   past everything to the boss. (Note: re-entering a room respawns its enemies —
   persistent clear-state is a later feature.)

4. DIAGNOSTIC LAYER (what you asked for):
   - Crash overlay: if anything throws in the game loop, a RED panel appears at
     the bottom of the screen with the error + stack trace instead of a silent
     freeze. When something breaks, screenshot that panel and send it to me — it
     names the exact line.
   - F3 toggles a debug overlay: FPS, current room, live enemy count, player
     x/y, AND hitbox outlines (so you can SEE collision boxes and why something
     clips). Press F3 again to hide.

5. PAUSE. P or ESC pauses/resumes with a "PAUSED" overlay.

6. CONTROLS CARD on the title screen + an enemy counter top-right during play.

## Apply (PowerShell, from C:\Users\Rando\Link_Quest)
Extract this zip over the repo (-Force), rebuild, run:

    Expand-Archive -Path $HOME\.ssh\Downloads\linkquest_batch1.zip -DestinationPath . -Force ; npm run build ; node server.js

(npm install not needed — no new deps.) Then refresh http://localhost:3000.

## What to test
- Kill a whole room as Journey/Niall (ranged) spamming attack — should NOT freeze.
- Try to leave a room with enemies alive — door should refuse.
- Clear it — door opens.
- Press F3 mid-fight — see the overlay + hitboxes.
- Press P — pause.
- Beat the boss — victory still works.

## Files in this zip
src/client/config/enemies.ts
src/client/entities/Enemy.ts
src/client/scenes/GameScene.ts
src/client/scenes/UIScene.ts
src/client/scenes/TitleScene.ts
src/client/main.ts
