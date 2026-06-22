// Room 1 -> intentional switchback corridor gauntlet.
// Confined band (rows 7-11); alternating baffles force up/down/up; no shortcuts.
import { readFileSync, writeFileSync } from "node:fs";

const WALL = 15, FLOOR = 1;
const path = "src/client/public/maps/room1.tmj";
const map = JSON.parse(readFileSync(path, "utf8"));
const W = map.width, H = map.height;
const layer = map.layers.find((l) => l.type === "tilelayer");
const objs = map.layers.find((l) => l.type === "objectgroup");

// Base: wall border, floor interior.
const data = new Array(W * H);
for (let r = 0; r < H; r++)
  for (let c = 0; c < W; c++)
    data[r * W + c] = (r === 0 || r === H - 1 || c === 0 || c === W - 1) ? WALL : FLOOR;
const set = (c, r, gid) => { data[r * W + c] = gid; };
const fill = (c0, r0, c1, r1, gid) => { for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) set(c, r, gid); };

// Seal top and bottom so the only route is the rows 7-11 band (no bypass).
fill(1, 1, 23, 6, WALL);
fill(1, 12, 23, 16, WALL);

// Switchback baffles: 1-tile wide to maximize combat space; spans alternate to force each turn.
fill(11, 8, 11, 11, WALL);  // A: forces UP (row 7 open)
fill(13, 7, 13, 9, WALL);   // B: forces DOWN (rows 10-11 open)
fill(16, 9, 16, 11, WALL);  // C: forces UP (rows 7-8 open)

set(24, 9, FLOOR);          // east-door opening
layer.data = data;

// Enemies along the route (replace any existing enemies).
objs.objects = objs.objects.filter((o) => o.type !== "enemy");
const enemies = [
  ["warden_blob1", "warden_blob", 18, 9], // final encounter, near door
  ["grey_rat_t1", "grey_rat", 9, 7],      // guards first turn
  ["red_bat_t2", "red_bat", 12, 7],       // guards second turn
  ["grey_rat_t3", "grey_rat", 15, 11],    // guards third turn
  ["red_bat_arena", "red_bat", 20, 8],    // harasses in final arena
];
for (const [name, kind, c, r] of enemies) {
  objs.objects.push({
    id: map.nextobjectid++, name, type: "enemy", rotation: 0, visible: true,
    x: c * 16, y: r * 16, width: 16, height: 16,
    properties: [{ name: "kind", type: "string", value: kind }],
  });
}

writeFileSync(path, JSON.stringify(map));
console.log("room1: switchback corridor built");
