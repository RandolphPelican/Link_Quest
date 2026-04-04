export interface SpawnPoint {
    x: number;
    y: number;
    type: string;
}

export interface LevelDefinition {
    id: number;
    name: string;
    tilemap: string;
    tileset: string;
    playerSpawns: SpawnPoint[];
    enemySpawns: SpawnPoint[];
    pickupSpawns: SpawnPoint[];
    exitCondition: "reach_exit" | "defeat_boss" | "collect_all";
}

export const LEVELS: LevelDefinition[] = [
    {
        id: 1,
        name: "Forgotten Ruins",
        tilemap: "level1.json",
        tileset: "ruins_tileset.png",
        playerSpawns: [{ x: 100, y: 100, type: "player" }],
        enemySpawns: [
            { x: 400, y: 300, type: "slime" },
            { x: 600, y: 500, type: "slime" }
        ],
        pickupSpawns: [{ x: 200, y: 200, type: "health_potion" }],
        exitCondition: "reach_exit"
    },
    {
        id: 2,
        name: "Shadow Crypt",
        tilemap: "level2.json",
        tileset: "crypt_tileset.png",
        playerSpawns: [{ x: 100, y: 100, type: "player" }],
        enemySpawns: [
            { x: 300, y: 300, type: "skeleton" },
            { x: 500, y: 200, type: "skeleton" },
            { x: 700, y: 600, type: "slime" }
        ],
        pickupSpawns: [{ x: 400, y: 400, type: "mana_potion" }],
        exitCondition: "reach_exit"
    },
    {
        id: 3,
        name: "Heart of the Mountain",
        tilemap: "level3.json",
        tileset: "mountain_tileset.png",
        playerSpawns: [{ x: 400, y: 700, type: "player" }],
        enemySpawns: [
            { x: 400, y: 400, type: "boss" }
        ],
        pickupSpawns: [
            { x: 100, y: 100, type: "health_potion" },
            { x: 700, y: 100, type: "mana_potion" }
        ],
        exitCondition: "defeat_boss"
    }
];
