// Room 1 -> full-height switchback: tall vertical baffles, no sealed top/bottom bands.
// Uses the whole room height; large open chambers between walls.
import { readFileSync, writeFileSync } from "node:fs";

const WALL = 15, FLOOR = 1;
const path = "src/client/public/maps/room1.tmj";
const map = JSON.parse(readFileSync(path, "utf8"));
const W = map.width, H = map.height;
const layer = map.layers.find((l) => l.type === "tilelayer");
const objs = map.layers.find((l) => l.type === "objectgroup");

// Base: wall border, floor interior (rows 1-16 fully open).
const data = new Array(W * H);
for (let r = 0; r < H; r++)
  for (let c = 0; c < W; c++)
    data[r * W + c] = (r === 0 || r === H - 1 || c === 0 || c === W - 1) ? WALL : FLOOR;
const fill = (c0, r0, c1, r1, gid) => { for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) data[r * W + c] = gid; };

// Tall vertical baffles forcing down / up / down; shifted left so the warden arena is widest.
fill(7, 1, 7, 12, WALL);    // gap at rows 13-16 -> forces DOWN
fill(13, 5, 13, 16, WALL);  // gap at rows 1-4   -> forces UP
fill(18, 1, 18, 12, WALL);  // gap at rows 13-16 -> forces DOWN

data[9 * W + 24] = FLOOR;    // east-door opening
layer.data = data;

// Enemies: minions in the open chambers, warden near the door.
objs.objects = objs.objects.filter((o) => o.type !== "enemy");
const enemies = [
  ["warden_blob1", "warden_blob", 21, 9], // centered in the wide final arena, off the return-spawn
  ["grey_rat_c1", "grey_rat", 5, 13],     // C1 bottom turn (descent to col 7 gap)
  ["red_bat_c2", "red_bat", 10, 13],      // C2 bottom turn (entry, before climb to col 13 gap)
  ["grey_rat_c3", "grey_rat", 15, 4],     // C3 top turn (entry, before descent to col 18 gap)
  ["red_bat_c4", "red_bat", 21, 13],      // C4 bottom turn (entry to final arena)
];
for (const [name, kind, c, r] of enemies) {
  objs.objects.push({
    id: map.nextobjectid++, name, type: "enemy", rotation: 0, visible: true,
    x: c * 16, y: r * 16, width: 16, height: 16,
    properties: [{ name: "kind", type: "string", value: kind }],
  });
}

writeFileSync(path, JSON.stringify(map));
console.log("room1: full-height switchback built");
