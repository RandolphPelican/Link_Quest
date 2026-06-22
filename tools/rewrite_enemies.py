import json, os
M = "src/client/public/maps"
NEW = {
  "room1": [("warden", 18, 9), ("red_bat", 6, 4)],
  "room2": [("warden", 18, 9), ("grey_rat", 6, 13)],
  "room3": [("warden", 18, 9), ("green_blob", 7, 5)],
}
for room, enemies in NEW.items():
    p = os.path.join(M, room + ".tmj")
    m = json.load(open(p, encoding="utf-8"))
    for layer in m["layers"]:
        if layer.get("name") == "Objects":
            kept = [o for o in layer["objects"] if o.get("type") != "enemy"]
            nid = max([o["id"] for o in kept], default=0) + 1
            for kind, tx, ty in enemies:
                kept.append({"id": nid, "name": f"{kind}{nid}", "type": "enemy",
                    "rotation": 0, "visible": True, "x": tx*16, "y": ty*16,
                    "width": 16, "height": 16,
                    "properties": [{"name": "kind", "type": "string", "value": kind}]})
                nid += 1
            layer["objects"] = kept
            m["nextobjectid"] = nid + 1
    json.dump(m, open(p, "w", encoding="utf-8"))
    print("rewrote", room, "->", len(enemies), "enemies")
