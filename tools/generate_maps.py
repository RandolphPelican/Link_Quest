#!/usr/bin/env python3
"""
Link Quest map generator.
Authors Level 1 rooms as valid Tiled 1.12 JSON (.tmj) with a tile layer and
an object layer (spawns, doors, signs, enemies). Files remain fully editable
in Tiled afterwards. Run from repo root:  python tools/generate_maps.py
"""
import json, os, random

OUT = os.path.join(os.path.dirname(__file__), "..", "src", "client", "public", "maps")
W, H, TILE = 25, 18, 16
random.seed(1989)  # deterministic output; joke intended

# ---- GIDs (tileset frame index + 1) --------------------------------------
FLOOR = 1        # plain brown floor
SPECK = 13       # brown rubble specks
GREYSPECK = 25   # grey rubble specks
STONEPATCH = 43  # stone tiles patch
WALL = 15        # grey brick wall  (collides)
DOOR = 46        # door in grey frame (walkable; object on top triggers move)
SAND = 49        # sand floor (boss room)
SAND2 = 50
CHEST = 90       # closed chest     (collides)
POT = 57         # clay pot         (collides)
BOX = 56         # metal box        (collides)
TABLE = 73       # wooden table     (collides)
ANVIL = 75       # anvil            (collides)

CHAR = {
    "#": WALL, ".": FLOOR, "D": DOOR, "C": CHEST, "P": POT,
    "B": BOX, "T": TABLE, "A": ANVIL, ",": SAND,
}

def grid_from_ascii(rows, floor_gid=FLOOR, speck_gids=(SPECK,), speck_rate=0.07):
    assert len(rows) == H and all(len(r) == W for r in rows), "grid must be 25x18"
    data = []
    for r in rows:
        for ch in r:
            gid = CHAR[ch]
            if ch == "." and random.random() < speck_rate:
                gid = random.choice(speck_gids)
            if ch == "," and random.random() < 0.18:
                gid = SAND2
            data.append(gid if ch not in (".",) or gid != FLOOR else floor_gid
                        if gid == FLOOR else gid)
    return data

def obj(oid, name, otype, tx, ty, tw=1, th=1, props=None):
    o = {
        "id": oid, "name": name, "type": otype, "rotation": 0, "visible": True,
        "x": tx * TILE, "y": ty * TILE, "width": tw * TILE, "height": th * TILE,
    }
    if props:
        o["properties"] = [
            {"name": k, "type": "string", "value": v} for k, v in props.items()
        ]
    return o

def write_map(name, data, objects):
    m = {
        "compressionlevel": -1, "height": H, "width": W, "infinite": False,
        "orientation": "orthogonal", "renderorder": "right-down",
        "tiledversion": "1.12.1", "type": "map", "version": "1.10",
        "tilewidth": TILE, "tileheight": TILE,
        "nextlayerid": 3, "nextobjectid": max([o["id"] for o in objects] + [0]) + 1,
        "tilesets": [{
            "columns": 12, "firstgid": 1,
            "image": "../kenney/Tilemap/tilemap_packed.png",
            "imageheight": 176, "imagewidth": 192, "margin": 0, "spacing": 0,
            "name": "kenney_tiny_dungeon", "tilecount": 132,
            "tileheight": TILE, "tilewidth": TILE,
        }],
        "layers": [
            {"id": 1, "name": "Tile Layer 1", "type": "tilelayer",
             "visible": True, "opacity": 1, "x": 0, "y": 0,
             "width": W, "height": H, "data": data},
            {"id": 2, "name": "Objects", "type": "objectgroup",
             "visible": True, "opacity": 1, "x": 0, "y": 0,
             "draworder": "topdown", "objects": objects},
        ],
    }
    path = os.path.join(OUT, f"{name}.tmj")
    with open(path, "w") as f:
        json.dump(m, f)
    print("wrote", path)

# ===========================================================================
# ROOM 1 — tutorial. Open left half (spawn + first sign), bats on the right.
# Door EAST -> room2.
# ===========================================================================
R1 = [
    "#########################",
    "#.......................#",
    "#.......................#",
    "#...........####........#",
    "#...........#...........#",
    "#...........#...........#",
    "#...P.......#......C....#",
    "#...........#...........#",
    "#........................",  # gap candidates fixed below via door col
    "#.......................D",
    "#........................",
    "#...........#...........#",
    "#...........#...........#",
    "#...........####........#",
    "#..T....................#",
    "#.......................#",
    "#.......................#",
    "#########################",
]
# fix rows 8 and 10 right edge back to wall (door only at row 9)
R1[8] = R1[8][:24] + "#"
R1[10] = R1[10][:24] + "#"
r1_objects = [
    obj(1, "spawn_default", "spawn", 3, 9),
    obj(2, "spawn_from_room2", "spawn", 22, 9),
    obj(3, "door_east", "door", 24, 9, 1, 1, {"target": "room2", "spawn": "spawn_from_room1"}),
    obj(4, "sign_room1", "sign", 5, 8, 1, 1, {"signId": "sign_room1_entry"}),
    obj(5, "bat1", "enemy", 17, 4, 1, 1, {"kind": "red_bat"}),
    obj(6, "bat2", "enemy", 18, 13, 1, 1, {"kind": "red_bat"}),
]

# ===========================================================================
# ROOM 2 — two wall blocks make an S-path. Rats + blob. Doors WEST and EAST.
# ===========================================================================
R2 = [
    "#########################",
    "#.......................#",
    "#......#########........#",
    "#......#########........#",
    "#...............P.......#",
    "#........C..............#",
    "#.......................#",
    "#.......................#",
    "#........................",
    "D........................",
    "#........................",
    "#.......................#",
    "#.......................#",
    "#........#########......#",
    "#........#########......#",
    "#..B....................#",
    "#.......................#",
    "#########################",
]
R2[8] = "#" + R2[8][1:24] + "#"
R2[10] = "#" + R2[10][1:24] + "#"
R2[9] = R2[9][:24] + "D"
r2_objects = [
    obj(1, "spawn_from_room1", "spawn", 2, 9),
    obj(2, "spawn_from_room3", "spawn", 22, 9),
    obj(3, "door_west", "door", 0, 9, 1, 1, {"target": "room1", "spawn": "spawn_from_room2"}),
    obj(4, "door_east", "door", 24, 9, 1, 1, {"target": "room3", "spawn": "spawn_from_room2"}),
    obj(5, "sign_room2", "sign", 12, 6, 1, 1, {"signId": "sign_room2_hall"}),
    obj(6, "rat1", "enemy", 12, 4, 1, 1, {"kind": "grey_rat"}),
    obj(7, "rat2", "enemy", 14, 12, 1, 1, {"kind": "grey_rat"}),
    obj(8, "blob1", "enemy", 19, 8, 1, 1, {"kind": "green_blob"}),
    obj(9, "bat1", "enemy", 6, 13, 1, 1, {"kind": "red_bat"}),
]

# ===========================================================================
# ROOM 3 — arena with central pillar cluster. Doors WEST and NORTH (to boss).
# ===========================================================================
R3 = [
    "############D############",
    "#.......................#",
    "#.......................#",
    "#.......................#",
    "#.....B...........B.....#",
    "#.......................#",
    "#..........###..........#",
    "#..........###..........#",
    "#........................",
    "D...........A...........#",
    "#........................",
    "#..........###..........#",
    "#..........###..........#",
    "#.......................#",
    "#.....P...........P.....#",
    "#.......................#",
    "#.......................#",
    "#########################",
]
R3[8] = R3[8][:24] + "#"
R3[10] = "#" + R3[10][1:24] + "#"
r3_objects = [
    obj(1, "spawn_from_room2", "spawn", 2, 9),
    obj(2, "spawn_from_boss", "spawn", 12, 2),
    obj(3, "door_west", "door", 0, 9, 1, 1, {"target": "room2", "spawn": "spawn_from_room3"}),
    obj(4, "door_north", "door", 12, 0, 1, 1, {"target": "boss", "spawn": "spawn_from_room3"}),
    obj(5, "sign_room3", "sign", 14, 2, 1, 1, {"signId": "sign_room3_gate"}),
    obj(6, "blob1", "enemy", 7, 5, 1, 1, {"kind": "green_blob"}),
    obj(7, "blob2", "enemy", 18, 13, 1, 1, {"kind": "green_blob"}),
    obj(8, "rat1", "enemy", 18, 5, 1, 1, {"kind": "grey_rat"}),
    obj(9, "rat2", "enemy", 6, 13, 1, 1, {"kind": "grey_rat"}),
    obj(10, "bat1", "enemy", 20, 9, 1, 1, {"kind": "red_bat"}),
    obj(11, "bat2", "enemy", 4, 9, 1, 1, {"kind": "red_bat"}),
]

# ===========================================================================
# BOSS — sand arena, pillars in corners, entry SOUTH. Final sign spawns on
# victory (code-side), not in map.
# ===========================================================================
RB = [
    "#########################",
    "#,,,,,,,,,,,,,,,,,,,,,,,#",
    "#,,,,,,,,,,,,,,,,,,,,,,,#",
    "#,,,,,,,,,,,,,,,,,,,,,,,#",
    "#,,,B,,,,,,,,,,,,,,B,,,,#",
    "#,,,,,,,,,,,,,,,,,,,,,,,#",
    "#,,,,,,,,,,,,,,,,,,,,,,,#",
    "#,,,,,,,,,,,,,,,,,,,,,,,#",
    "#,,,,,,,,,,,,,,,,,,,,,,,#",
    "#,,,,,,,,,,,,,,,,,,,,,,,#",
    "#,,,,,,,,,,,,,,,,,,,,,,,#",
    "#,,,,,,,,,,,,,,,,,,,,,,,#",
    "#,,,,,,,,,,,,,,,,,,,,,,,#",
    "#,,,B,,,,,,,,,,,,,,B,,,,#",
    "#,,,,,,,,,,,,,,,,,,,,,,,#",
    "#,,,,,,,,,,,,,,,,,,,,,,,#",
    "#,,,,,,,,,,,,,,,,,,,,,,,#",
    "############D############",
]
rb_objects = [
    obj(1, "spawn_from_room3", "spawn", 12, 15),
    obj(2, "door_south", "door", 12, 17, 1, 1, {"target": "room3", "spawn": "spawn_from_boss"}),
    obj(3, "boss", "enemy", 12, 5, 1, 1, {"kind": "boss"}),
]

if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    write_map("room1", grid_from_ascii(R1), r1_objects)
    write_map("room2", grid_from_ascii(R2, speck_gids=(SPECK, GREYSPECK)), r2_objects)
    write_map("room3", grid_from_ascii(R3, speck_gids=(GREYSPECK, STONEPATCH), speck_rate=0.06), r3_objects)
    write_map("boss",  grid_from_ascii(RB), rb_objects)
