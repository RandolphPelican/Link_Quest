// Room 2 -> ranged gauntlet: full-height open arena, small cover islands, far-end warden.
import { readFileSync, writeFileSync } from "node:fs";

const WALL = 15, FLOOR = 1;
const path = "src/client/public/maps/room2.tmj";
const map = JSON.parse(readFileSync(path, "utf8"));
const W = map.width, H = map.height;
const layer = map.layers.find((l) => l.type === "tilelayer");
const objs = map.layers.find((l) => l.type === "objectgroup");

// Base: wall border, floor interior (rows 1-16 fully open).
const data = new Array(W * H);
for (let r = 0; r < H; r++)
  for (let c = 0; c < W; c++)
    data[r * W + c] = (r === 0 || r === H - 1 || c === 0 || c === W - 1) ? WALL : FLOOR;
const set = (c, r, gid) => { data[r * W + c] = gid; };

// Cover islands: short 1x2 vertical segments for cover-to-cover advance.
for (const [c, r] of [[6, 3], [10, 8], [14, 11], [17, 4], [17, 12]]) { set(c, r, WALL); set(c, r + 1, WALL); }

// Door openings (both doors are on row 9).
set(0, 9, FLOOR);
set(24, 9, FLOOR);
layer.data = data;

// Enemies: scattered harassment + far-end warden.
objs.objects = objs.objects.filter((o) => o.type !== "enemy");
const enemies = [
  ["warden6", "warden_bat", 21, 9],   // east-end arena, off the return-spawn (22,9)
  ["grey_rat_g1", "grey_rat", 7, 4],
  ["grey_rat_g2", "grey_rat", 12, 9],
  ["red_bat_g3", "red_bat", 15, 11],
];
for (const [name, kind, c, r] of enemies) {
  objs.objects.push({
    id: map.nextobjectid++, name, type: "enemy", rotation: 0, visible: true,
    x: c * 16, y: r * 16, width: 16, height: 16,
    properties: [{ name: "kind", type: "string", value: kind }],
  });
}

writeFileSync(path, JSON.stringify(map));
console.log("room2: ranged gauntlet built");
