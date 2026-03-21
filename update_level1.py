import json
import os

level1_data = {
    "level": 1,
    "name": "The Debug Dungeon",
    "rooms": [
        {"id": 1, "name": "Entrance Hall", "type": "safe", "enemies": [{"type": "goblin", "x": 400, "y": 200, "count": 1, "pattern": "runner"}], "doors": {"right": {"leadsTo": 2, "locked": False}}},
        {"id": 2, "name": "Stone Corridor", "enemies": [{"type": "goblin", "x": 200, "y": 150, "count": 2, "pattern": "rusher"}], "doors": {"left": {"leadsTo": 1}, "right": {"leadsTo": 3, "locked": True}}},
        {"id": 3, "name": "Forgotten Chamber", "enemies": [{"type": "goblin", "x": 300, "y": 300, "count": 4, "pattern": "rusher"}], "doors": {"left": {"leadsTo": 2}, "right": {"leadsTo": 4, "locked": True}}},
        {"id": 4, "name": "First Blood", "enemies": [{"type": "goblin_chief", "x": 400, "y": 300, "count": 1, "pattern": "stick_and_move"}], "doors": {"left": {"leadsTo": 3}, "right": {"leadsTo": 5, "locked": True}}},
        {"id": 5, "name": "The Switch Chamber", "enemies": [], "switches": [{"id": "s1", "x": 200, "y": 200}, {"id": "s2", "x": 600, "y": 200}], "chests": [{"type": "gold", "content": "leather_armor", "x": 400, "y": 100}], "doors": {"left": {"leadsTo": 4}, "right": {"leadsTo": 6, "locked": True}}},
        {"id": 6, "name": "The Patrol Room", "enemies": [{"type": "goblin", "x": 100, "y": 100, "count": 2, "pattern": "rusher"}], "doors": {"left": {"leadsTo": 5}, "right": {"leadsTo": 7, "locked": True}}},
        {"id": 7, "name": "The Ambush Hall", "enemies": [{"type": "goblin", "x": 400, "y": 300, "count": 3, "pattern": "rusher"}], "chests": [{"type": "gold", "content": "trader_jos_pizza", "x": 700, "y": 100}], "doors": {"left": {"leadsTo": 6}, "right": {"leadsTo": 8, "locked": True}}},
        {"id": 8, "name": "The Key Vault", "enemies": [], "switches": [{"id": "k1", "x": 200, "y": 400}, {"id": "k2", "x": 400, "y": 400}, {"id": "k3", "x": 600, "y": 400}], "chests": [{"type": "silver", "content": "boss_key", "x": 400, "y": 100}], "doors": {"left": {"leadsTo": 7}, "right": {"leadsTo": 9, "locked": True}}},
        {"id": 9, "name": "The Gauntlet", "enemies": [{"type": "goblin", "x": 200, "y": 200, "count": 3}, {"type": "chatbot_clone", "x": 600, "y": 300, "count": 2}], "doors": {"left": {"leadsTo": 8}, "right": {"leadsTo": 10, "locked": True}}},
        {"id": 10, "name": "Lazy Coder Lair", "type": "boss", "enemies": [{"type": "lazy_coder", "x": 400, "y": 300, "hp": 300}], "doors": {"left": {"leadsTo": 9}}}
    ]
}

with open('levels/level1.json', 'w') as f:
    json.dump(level1_data, f, indent=4)
print("Successfully updated levels/level1.json to 10 rooms.")
