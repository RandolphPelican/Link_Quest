// Render a Tiled .tmj room as an ASCII grid with coordinates + object overlay.
// Usage: node tools/render_map.mjs src/client/public/maps/room1.tmj
import { readFileSync } from "node:fs";

const COLLIDING = new Set([15, 56, 57, 73, 75, 90]); // walls/obstacles (from GameScene)
const file = process.argv[2] ?? "src/client/public/maps/room1.tmj";
const map = JSON.parse(readFileSync(file, "utf8"));
const { width: W, height: H, tilewidth: TW, tileheight: TH } = map;

const tiles = map.layers.find((l) => l.type === "tilelayer").data;
const grid = [];
for (let y = 0; y < H; y++) {
  const row = [];
  for (let x = 0; x < W; x++) {
    const gid = tiles[y * W + x];
    row.push(COLLIDING.has(gid) ? "#" : ".");
  }
  grid.push(row);
}

// Overlay objects (pixel coords -> tile coords)
const marks = { spawn: "S", door: "D", sign: "?", enemy: "E" };
const legend = [];
const objLayer = map.layers.find((l) => l.type === "objectgroup");
for (const o of objLayer?.objects ?? []) {
  const cx = Math.floor((o.x + o.width / 2) / TW);
  const cy = Math.floor((o.y + o.height / 2) / TH);
  const ch = marks[o.type] ?? "*";
  if (grid[cy] && grid[cy][cx] !== undefined) grid[cy][cx] = ch;
  const kind = o.properties?.find((p) => p.name === "kind")?.value;
  legend.push(`  ${ch}  (${String(cx).padStart(2)},${String(cy).padStart(2)})  ${o.name}${kind ? ` [${kind}]` : ""}`);
}

// Print with axis labels
const colHeader =
  "    " + Array.from({ length: W }, (_, x) => (x % 10)).join("");
console.log(`\n${file}  (${W}x${H} tiles, ${TW}px each)\n`);
console.log(colHeader);
console.log("   +" + "-".repeat(W));
grid.forEach((row, y) => {
  console.log(`${String(y).padStart(2)} |${row.join("")}`);
});
console.log("\nLegend:  # wall/obstacle   . floor");
console.log(legend.join("\n"));
console.log("");
