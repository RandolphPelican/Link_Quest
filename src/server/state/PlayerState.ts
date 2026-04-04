import { Schema, type } from "@colyseus/schema";

export class PlayerState extends Schema {
    @type("string") id: string = "";
    @type("string") name: string = "";
    @type("string") classType: string = "warrior";
    @type("number") x: number = 0;
    @type("number") y: number = 0;
    @type("number") hp: number = 100;
    @type("number") maxHp: number = 100;
    @type("string") state: string = "idle";
    @type("string") direction: string = "down";
}
