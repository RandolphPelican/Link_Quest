export interface EnemyDefinition {
    name: string;
    maxHP: number;
    speed: number;
    damage: number;
    aiType: "idle" | "patrol" | "chase";
    animationRig: string;
}

export const ENEMIES: Record<string, EnemyDefinition> = {
    slime: {
        name: "Slime",
        maxHP: 50,
        speed: 40,
        damage: 10,
        aiType: "patrol",
        animationRig: "blob_slime"
    },
    skeleton: {
        name: "Skeleton",
        maxHP: 80,
        speed: 70,
        damage: 15,
        aiType: "chase",
        animationRig: "humanoid_skeleton"
    },
    boss: {
        name: "Ancient Guardian",
        maxHP: 1000,
        speed: 50,
        damage: 40,
        aiType: "chase",
        animationRig: "boss_guardian"
    }
};
