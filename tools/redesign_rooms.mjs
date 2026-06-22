// Apply the room 1/2/3 redesign edits to the .tmj files deterministically.
// Run: node tools/redesign_rooms.mjs
import { readFileSync, writeFileSync } from "node:fs";

const WALL = 15;
const FLOOR = 1;

function load(path) {
  const map = JSON.parse(readFileSync(path, "utf8"));
  const layer = map.layers.find((l) => l.type === "tilelayer");
  const objs = map.layers.find((l) => l.type === "objectgroup");
  return { map, layer, objs, W: map.width };
}
function save(path, ctx) {
  writeFileSync(path, JSON.stringify(ctx.map));
}
function set(ctx, c, r, gid) {
  ctx.layer.data[r * ctx.W + c] = gid;
}
function fill(ctx, c0, r0, c1, r1, gid) {
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) set(ctx, c, r, gid);
}
function move(ctx, name, c, r) {
  const o = ctx.objs.objects.find((o) => o.name === name);
  if (!o) throw new Error(`object not found: ${name}`);
  o.x = c * 16;
  o.y = r * 16;
}
function addEnemy(ctx, name, kind, c, r) {
  const id = ctx.map.nextobjectid++;
  ctx.objs.objects.push({
    id, name, type: "enemy", rotation: 0, visible: true,
    x: c * 16, y: r * 16, width: 16, height: 16,
    properties: [{ name: "kind", type: "string", value: kind }],
  });
}

const dir = "src/client/public/maps/";

// ---------------- ROOM 1: corridor maze + minion swarm ----------------
{
  const ctx = load(dir + "room1.tmj");
  // Wall off top and bottom halves, leaving the rows 8-10 corridor.
  fill(ctx, 5, 1, 24, 7, WALL);
  fill(ctx, 5, 11, 24, 17, WALL);
  // Switchback A (cols 13-14): block rows 9-10, leave row 8 open.
  set(ctx, 13, 9, WALL); set(ctx, 13, 10, WALL);
  set(ctx, 14, 9, WALL); set(ctx, 14, 10, WALL);
  // Switchback B (cols 16-17): block rows 8-9, leave row 10 open.
  set(ctx, 16, 8, WALL); set(ctx, 16, 9, WALL);
  set(ctx, 17, 8, WALL); set(ctx, 17, 9, WALL);
  // Warden-arena pillars.
  set(ctx, 19, 8, WALL); set(ctx, 20, 10, WALL); set(ctx, 21, 9, WALL);
  // Minions: reuse the existing red_bat (was at 6,4 -> now walled) at the chokepoint.
  move(ctx, "red_bat6", 14, 8);
  addEnemy(ctx, "grey_rat_r1a", "grey_rat", 10, 9);
  addEnemy(ctx, "grey_rat_r1b", "grey_rat", 17, 10);
  // warden_blob1 (18,9), spawn (3,9), door (24,9), sign (5,8) unchanged.
  save(dir + "room1.tmj", ctx);
}

// ---------------- ROOM 2: long open sightline ----------------
{
  const ctx = load(dir + "room2.tmj");
  // Remove the two big wall blocks.
  fill(ctx, 7, 2, 15, 3, FLOOR);
  fill(ctx, 9, 13, 17, 14, FLOOR);
  // Thin decorative pillars (single tiles).
  set(ctx, 10, 6, WALL); set(ctx, 14, 5, WALL);
  set(ctx, 10, 13, WALL); set(ctx, 15, 14, WALL);
  // Push warden to far end; bring rat to mid-room.
  move(ctx, "warden6", 22, 9);
  move(ctx, "grey_rat7", 12, 9);
  save(dir + "room2.tmj", ctx);
}

// ---------------- ROOM 3: tactical arena sharpened ----------------
{
  const ctx = load(dir + "room3.tmj");
  // Tighten center (note: these tiles are already walls in the current map).
  set(ctx, 12, 7, WALL); set(ctx, 12, 11, WALL);
  // Move blob to support the warden.
  move(ctx, "green_blob7", 16, 7);
  save(dir + "room3.tmj", ctx);
}

console.log("Room redesign applied to room1/room2/room3.tmj");
