import Phaser from "phaser";
import * as Colyseus from "colyseus.js";
import { ProceduralAnimator } from "../animation/ProceduralAnimator";
import { CLASSES, ENEMIES } from "../../shared/index";

export class GameScene extends Phaser.Scene {
    private client: Colyseus.Client;
    private room: Colyseus.Room<any> | null = null;
    private players: Map<string, ProceduralAnimator> = new Map();
    private enemies: Map<string, ProceduralAnimator> = new Map();
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys | null = null;

    constructor() {
        super("GameScene");
        const protocol = window.location.protocol === "https:" ? "wss" : "ws";
        const host = window.location.hostname === "localhost" ? "localhost:3000" : window.location.host;
        this.client = new Colyseus.Client(`${protocol}://${host}`);
    }

    async create(data: { classType: string }) {
        this.cursors = this.input.keyboard!.createCursorKeys();

        try {
            this.room = await this.client.joinOrCreate("game", { 
                classType: data.classType || "warrior" 
            });
            console.log("Joined room successfully", this.room.sessionId);

            this.room.state.players.onAdd((player: any, key: string) => {
                const color = key === this.room!.sessionId ? 0x00ff00 : 0xffffff;
                const animator = new ProceduralAnimator(this, player.x, player.y, color);
                this.players.set(key, animator);
                
                player.onChange(() => {
                    animator.setPosition(player.x, player.y);
                });
            });

            this.room.state.players.onRemove((_player: any, key: string) => {
                this.players.get(key)?.destroy();
                this.players.delete(key);
            });

            this.room.state.enemies.onAdd((enemy: any, key: string) => {
                const animator = new ProceduralAnimator(this, enemy.x, enemy.y, 0xff0000);
                this.enemies.set(key, animator);
                
                enemy.onChange(() => {
                    animator.setPosition(enemy.x, enemy.y);
                });
            });

            this.room.state.enemies.onRemove((_enemy: any, key: string) => {
                this.enemies.get(key)?.destroy();
                this.enemies.delete(key);
            });

            // Start game if lobby
            this.room.send("start_game");

        } catch (e) {
            console.error("Join error", e);
        }
    }

    update(time: number, delta: number) {
        if (!this.room || !this.cursors) return;

        let dx = 0;
        let dy = 0;
        const speed = 2; // Fixed speed for simplicity

        if (this.cursors.left.isDown) dx = -speed;
        if (this.cursors.right.isDown) dx = speed;
        if (this.cursors.up.isDown) dy = -speed;
        if (this.cursors.down.isDown) dy = speed;

        if (dx !== 0 || dy !== 0) {
            this.room.send("move", { x: dx, y: dy });
        } else {
            this.room.send("stop");
        }

        // Update animators
        this.room.state.players.forEach((player: any, key: string) => {
            this.players.get(key)?.update(delta, player.state, player.direction);
        });

        this.room.state.enemies.forEach((enemy: any, key: string) => {
            this.enemies.get(key)?.update(delta, enemy.state, enemy.direction);
        });
    }
}
