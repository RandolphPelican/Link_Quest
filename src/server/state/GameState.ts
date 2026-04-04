import { Schema, type, MapSchema } from "@colyseus/schema";
import { PlayerState } from "./PlayerState";
import { EnemyState } from "./EnemyState";

export class GameState extends Schema {
    @type({ map: PlayerState }) players = new MapSchema<PlayerState>();
    @type({ map: EnemyState }) enemies = new MapSchema<EnemyState>();
    @type("number") currentLevel: number = 1;
    @type("string") status: string = "lobby"; // lobby, playing, finished
}
