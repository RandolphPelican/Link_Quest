import { Schema, type } from "@colyseus/schema";

export class EnemyState extends Schema {
    @type("string") id: string = "";
    @type("string") type: string = "slime";
    @type("number") x: number = 0;
    @type("number") y: number = 0;
    @type("number") hp: number = 50;
    @type("number") maxHp: number = 50;
    @type("string") state: string = "idle";
    @type("string") direction: string = "down";
}
