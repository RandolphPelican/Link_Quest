import { Room, Client } from "colyseus";
import { GameState } from "../state/GameState";
import { PlayerState } from "../state/PlayerState";
import { EnemyState } from "../state/EnemyState";
import { CLASSES, LEVELS, ENEMIES } from "shared";

export class GameRoom extends Room<GameState> {
    maxClients = 4;

    onCreate(options: any) {
        this.setState(new GameState());

        this.onMessage("move", (client, data) => {
            const player = this.state.players.get(client.sessionId);
            if (player) {
                player.x += data.x || 0;
                player.y += data.y || 0;
                player.direction = data.direction || player.direction;
                player.state = "walk";
            }
        });

        this.onMessage("stop", (client) => {
            const player = this.state.players.get(client.sessionId);
            if (player) {
                player.state = "idle";
            }
        });

        this.onMessage("select_class", (client, data) => {
            const player = this.state.players.get(client.sessionId);
            if (player && CLASSES[data.classType]) {
                const classDef = CLASSES[data.classType];
                player.classType = data.classType;
                player.hp = classDef.maxHP;
                player.maxHp = classDef.maxHP;
            }
        });

        this.onMessage("start_game", (client) => {
            if (this.state.status === "lobby") {
                this.state.status = "playing";
                this.loadLevel(1);
            }
        });

        // Main game loop
        this.setSimulationInterval((deltaTime) => this.update(deltaTime));
    }

    onJoin(client: Client, options: any) {
        console.log(client.sessionId, "joined!");
        const player = new PlayerState();
        player.id = client.sessionId;
        player.name = options.name || `Player ${client.sessionId}`;
        
        // Default to warrior
        const classDef = CLASSES["warrior"];
        player.classType = "warrior";
        player.hp = classDef.maxHP;
        player.maxHp = classDef.maxHP;

        this.state.players.set(client.sessionId, player);
    }

    onLeave(client: Client, consented: boolean) {
        console.log(client.sessionId, "left!");
        this.state.players.delete(client.sessionId);
    }

    loadLevel(levelId: number) {
        const levelDef = LEVELS.find(l => l.id === levelId);
        if (!levelDef) return;

        this.state.currentLevel = levelId;
        
        // Spawn players at spawn points
        let i = 0;
        this.state.players.forEach(player => {
            const spawn = levelDef.playerSpawns[i % levelDef.playerSpawns.length];
            player.x = spawn.x;
            player.y = spawn.y;
            i++;
        });

        // Clear and Spawn enemies
        this.state.enemies.clear();
        levelDef.enemySpawns.forEach((spawn, idx) => {
            const enemyDef = ENEMIES[spawn.type];
            if (enemyDef) {
                const enemy = new EnemyState();
                enemy.id = `enemy_${idx}`;
                enemy.type = spawn.type;
                enemy.x = spawn.x;
                enemy.y = spawn.y;
                enemy.hp = enemyDef.maxHP;
                enemy.maxHp = enemyDef.maxHP;
                this.state.enemies.set(enemy.id, enemy);
            }
        });
    }

    update(deltaTime: number) {
        if (this.state.status !== "playing") return;

        // Basic AI movement
        this.state.enemies.forEach(enemy => {
            const def = ENEMIES[enemy.type];
            if (def.aiType === "patrol") {
                // Simple patrol logic
                enemy.x += Math.sin(Date.now() / 1000) * 0.5;
                enemy.state = "walk";
            } else if (def.aiType === "chase") {
                // Chase nearest player
                let nearestPlayer: PlayerState | null = null;
                let minDist = Infinity;
                this.state.players.forEach(p => {
                    const dist = Math.sqrt((p.x - enemy.x)**2 + (p.y - enemy.y)**2);
                    if (dist < minDist) {
                        minDist = dist;
                        nearestPlayer = p;
                    }
                });

                if (nearestPlayer && minDist < 300) {
                    const dx = (nearestPlayer as PlayerState).x - enemy.x;
                    const dy = (nearestPlayer as PlayerState).y - enemy.y;
                    const angle = Math.atan2(dy, dx);
                    enemy.x += Math.cos(angle) * def.speed * (deltaTime / 1000);
                    enemy.y += Math.sin(angle) * def.speed * (deltaTime / 1000);
                    enemy.state = "walk";
                } else {
                    enemy.state = "idle";
                }
            }
        });
    }
}
