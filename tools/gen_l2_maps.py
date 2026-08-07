#!/usr/bin/env python3
"""Generate the four Level 2 maps (l2room1..l2boss) in the same .tmj shape as level 1."""
import json, os

W, H = 25, 18
WALL, FLOOR, FLOOR2, PILLAR, WATER = 15, 49, 50, 56, 51
OUT = os.path.join(os.path.dirname(__file__), "..", "src", "client", "public", "maps")

def base_grid(seed):
    import random
    rng = random.Random(seed)
    g = [[FLOOR for _ in range(W)] for _ in range(H)]
    for y in range(H):
        for x in range(W):
            if x == 0 or y == 0 or x == W - 1 or y == H - 1:
                g[y][x] = WALL
            elif rng.random() < 0.14:
                g[y][x] = FLOOR2   # mossy floor variation
    return g

def obj(oid, otype, name, tx, ty, props=None, w=16, h=16):
    o = {"id": oid, "name": name, "type": otype, "x": tx * 16, "y": ty * 16,
         "width": w, "height": h, "rotation": 0, "visible": True, "point": False}
    if props:
        o["properties"] = [{"name": k, "type": "string", "value": v} for k, v in props.items()]
    return o

def write_map(fname, grid, objects):
    m = {
        "compressionlevel": -1, "height": H, "width": W, "infinite": False,
        "orientation": "orthogonal", "renderorder": "right-down",
        "tiledversion": "1.12.1", "type": "map", "version": "1.10",
        "tilewidth": 16, "tileheight": 16, "nextlayerid": 3,
        "nextobjectid": len(objects) + 1,
        "tilesets": [{"columns": 12, "firstgid": 1,
                      "image": "../kenney/Tilemap/tilemap_packed.png",
                      "imageheight": 176, "imagewidth": 192, "margin": 0, "spacing": 0,
                      "name": "kenney_tiny_dungeon", "tilecount": 132,
                      "tileheight": 16, "tilewidth": 16}],
        "layers": [
            {"id": 1, "name": "Tile Layer 1", "type": "tilelayer", "visible": True,
             "opacity": 1, "x": 0, "y": 0, "width": W, "height": H,
             "data": [c for row in grid for c in row]},
            {"id": 2, "name": "Objects", "type": "objectgroup", "visible": True,
             "opacity": 1, "x": 0, "y": 0, "draworder": "topdown", "objects": objects},
        ],
    }
    with open(os.path.join(OUT, fname), "w") as f:
        json.dump(m, f)
    print("wrote", fname)

def pillars(g, cells):
    for (x, y) in cells: g[y][x] = PILLAR

# ---------------- l2room1 — The Bear Den ----------------
g = base_grid(21)
# four boulder clusters as cover from charges
pillars(g, [(6,5),(7,5),(6,6),(17,5),(18,5),(18,6),(6,12),(7,12),(7,13),(17,12),(18,12),(17,13)])
g[9][W-1] = FLOOR                      # east door gap
objs = [
    obj(1, "spawn", "spawn_default", 3, 9),
    obj(2, "spawn", "spawn_from_l1", 3, 9),
    obj(3, "spawn", "spawn_from_l2room2", 22, 9),
    obj(4, "door", "door_east", 24, 9, {"target": "l2room2", "spawn": "spawn_from_l2room1"}),
    obj(5, "enemy", "bear", 19, 9, {"kind": "bear"}),
    obj(6, "enemy", "cub1", 12, 5, {"kind": "bear_cub"}),
    obj(7, "enemy", "cub2", 12, 13, {"kind": "bear_cub"}),
    obj(8, "enemy", "rat1", 9, 9, {"kind": "grey_rat"}),
]
write_map("l2room1.tmj", g, objs)

# ---------------- l2room2 — The Howling Maze ----------------
g = base_grid(22)
# maze walls: staggered corridors
for x in range(4, 21): g[4][x] = PILLAR
g[4][8] = FLOOR; g[4][16] = FLOOR
for x in range(4, 21): g[8][x] = PILLAR
g[8][5] = FLOOR; g[8][12] = FLOOR; g[8][19] = FLOOR
for x in range(4, 21): g[12][x] = PILLAR
g[12][7] = FLOOR; g[12][17] = FLOOR
for y in range(1, 4): g[y][12] = PILLAR
for y in range(13, 17): g[y][10] = PILLAR
g[9][0] = FLOOR                        # west door gap
g[9][W-1] = FLOOR                      # east door gap
objs = [
    obj(1, "spawn", "spawn_from_l2room1", 2, 9),
    obj(2, "spawn", "spawn_from_l2room3", 22, 9),
    obj(3, "door", "door_west", 0, 9, {"target": "l2room1", "spawn": "spawn_from_l2room2"}),
    obj(4, "door", "door_east", 24, 9, {"target": "l2room3", "spawn": "spawn_from_l2room2"}),
    obj(5, "enemy", "wolf", 15, 2, {"kind": "wolf"}),
    obj(6, "enemy", "pup1", 6, 6, {"kind": "wolf_pup"}),
    obj(7, "enemy", "pup2", 18, 6, {"kind": "wolf_pup"}),
    obj(8, "enemy", "bat1", 8, 14, {"kind": "red_bat"}),
    obj(9, "enemy", "bat2", 16, 14, {"kind": "red_bat"}),
]
write_map("l2room2.tmj", g, objs)

# ---------------- l2room3 — The Sunken Pit ----------------
g = base_grid(23)
# water pools (FLOOR2 tinted blue at runtime) + islands of pillars
for y in range(3, 8):
    for x in range(4, 11): g[y][x] = WATER
for y in range(10, 15):
    for x in range(14, 21): g[y][x] = WATER
pillars(g, [(12,3),(12,4),(12,13),(12,14),(7,10),(8,10),(16,6),(17,6)])
g[9][0] = FLOOR                        # west door gap
g[0][12] = FLOOR                       # north door gap
objs = [
    obj(1, "spawn", "spawn_from_l2room2", 2, 9),
    obj(2, "spawn", "spawn_from_l2boss", 12, 2),
    obj(3, "door", "door_west", 0, 9, {"target": "l2room2", "spawn": "spawn_from_l2room3"}),
    obj(4, "door", "door_north", 12, 0, {"target": "l2boss", "spawn": "spawn_from_l2room3"}),
    obj(5, "enemy", "gator", 17, 12, {"kind": "gator"}),
    obj(6, "enemy", "hatch1", 6, 5, {"kind": "gator_hatchling"}),
    obj(7, "enemy", "hatch2", 18, 4, {"kind": "gator_hatchling"}),
    obj(8, "enemy", "blob1", 8, 14, {"kind": "green_blob"}),
]
write_map("l2room3.tmj", g, objs)

# ---------------- l2boss — The Threefold Den ----------------
g = base_grid(24)
# open arena with four corner pillars for cover
pillars(g, [(5,4),(6,4),(18,4),(19,4),(5,13),(6,13),(18,13),(19,13)])
g[H-1][12] = FLOOR                     # south door gap (back to l2room3)
objs = [
    obj(1, "spawn", "spawn_from_l2room3", 12, 15),
    obj(2, "door", "door_south", 12, 17, {"target": "l2room3", "spawn": "spawn_from_l2boss"}),
    obj(3, "enemy", "chimera", 12, 5, {"kind": "chimera"}),
]
write_map("l2boss.tmj", g, objs)
