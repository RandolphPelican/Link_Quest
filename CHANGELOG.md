# Link_Quest Changelog

## 2026-05-15 — Pivot to Phaser/Tiled/Kenney stack

The 108-commit JS/TS lineage hit a wall. Most recent state was a procedural-rectangle scaffold with no playable game content. Pivot direction:

**Stack:**
- Client: Phaser 3 (already in repo) — web-native, no build/export step
- Level editor: Tiled — paint rooms with sprite tileset, export JSON
- Sprites: Kenney Tiny Dungeon (CC0, 16×16 top-down), local path `C:\Users\Rando\Downloads\kenney_tiny-dungeon`
- Server: Colyseus (already in repo) — multiplayer state authority
- Transport: WebSocket
- Hosting: same Render service (srv-d794hqvfte5s739fgj7g), single Node process serves Express + Vite-built client + Colyseus

**Scope:**
- Level 1 only — 5 rooms + 1 boss room
- 5 selectable heroes, unique attack per hero
- Multiplayer via room code, up to 5 players per session
- Signs in rooms (content authored separately)

**Repo strategy:** in-place refactor, no force-push. Git history preserved. Following commits replace src/ contents and reconfigure build.
