// Room 1 -> open combat arena: clean bordered room, a few strategic pillars,
// scattered minion swarm. Replaces the earlier maze.
import { readFileSync, writeFileSync } from "node:fs";

const WALL = 15, FLOOR = 1;
const path = "src/client/public/maps/room1.tmj";
const map = JSON.parse(readFileSync(path, "utf8"));
const W = map.width, H = map.height;
const layer = map.layers.find((l) => l.type === "tilelayer");
const objs = map.layers.find((l) => l.type === "objectgroup");

// Rebuild tile layer: wall border, open floor interior.
const data = new Array(W * H);
for (let r = 0; r < H; r++)
  for (let c = 0; c < W; c++)
    data[r * W + c] = (r === 0 || r === H - 1 || c === 0 || c === W - 1) ? WALL : FLOOR;
data[9 * W + 24] = FLOOR; // east-door opening must be passable
layer.data = data;

// Strategic single-tile pillars (chokepoints + cover, not a maze).
for (const [c, r] of [[10, 9], [15, 8], [15, 10], [19, 9], [21, 8]]) data[r * W + c] = WALL;

// Enemy roster: keep the warden, replace minions with a scattered swarm.
objs.objects = objs.objects.filter((o) => o.type !== "enemy" || o.name === "warden_blob1");
const minions = [
  ["grey_rat_r1a", "grey_rat", 8, 7],
  ["red_bat_r1a", "red_bat", 12, 11],
  ["grey_rat_r1b", "grey_rat", 16, 6],
  ["red_bat_r1b", "red_bat", 20, 12],
];
for (const [name, kind, c, r] of minions) {
  objs.objects.push({
    id: map.nextobjectid++, name, type: "enemy", rotation: 0, visible: true,
    x: c * 16, y: r * 16, width: 16, height: 16,
    properties: [{ name: "kind", type: "string", value: kind }],
  });
}

writeFileSync(path, JSON.stringify(map));
console.log("room1: open arena rebuilt — 5 pillars, warden + 4 scattered minions");
