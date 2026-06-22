// Room 3 -> dual rat wardens (fire + ice) on opposite sides + green_blob health source.
import { readFileSync, writeFileSync } from "node:fs";

const path = "src/client/public/maps/room3.tmj";
const map = JSON.parse(readFileSync(path, "utf8"));
const objs = map.layers.find((l) => l.type === "objectgroup");

objs.objects = objs.objects.filter((o) => o.type !== "enemy");
const enemies = [
  ["warden_rat_fire", "warden_rat_fire", 18, 9], // right side
  ["warden_rat_ice", "warden_rat_ice", 6, 9],    // left side — two distinct threats
  ["green_blob1", "green_blob", 16, 7],           // guaranteed health drop
];
for (const [name, kind, c, r] of enemies) {
  objs.objects.push({
    id: map.nextobjectid++, name, type: "enemy", rotation: 0, visible: true,
    x: c * 16, y: r * 16, width: 16, height: 16,
    properties: [{ name: "kind", type: "string", value: kind }],
  });
}

writeFileSync(path, JSON.stringify(map));
console.log("room3: dual wardens (fire+ice) + green_blob built");
