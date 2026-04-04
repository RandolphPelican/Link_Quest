export interface ClassDefinition {
    name: string;
    maxHP: number;
    speed: number;
    baseDamage: number;
    abilities: string[];
    animationRig: string;
    description: string;
}

export const CLASSES: Record<string, ClassDefinition> = {
    warrior: {
        name: "Warrior",
        maxHP: 150,
        speed: 100,
        baseDamage: 25,
        abilities: ["slash", "block"],
        animationRig: "humanoid_warrior",
        description: "High HP and strong melee attacks. Built for the front lines."
    },
    rogue: {
        name: "Rogue",
        maxHP: 100,
        speed: 140,
        baseDamage: 20,
        abilities: ["quick_strike", "dash"],
        animationRig: "humanoid_rogue",
        description: "Fast and agile. Strikes quickly and avoids damage."
    },
    mage: {
        name: "Mage",
        maxHP: 80,
        speed: 110,
        baseDamage: 30,
        abilities: ["fireball", "blink"],
        animationRig: "humanoid_mage",
        description: "Glass cannon. Deals high ranged damage but has low HP."
    },
    tank: {
        name: "Tank",
        maxHP: 200,
        speed: 80,
        baseDamage: 15,
        abilities: ["taunt", "shield_wall"],
        animationRig: "humanoid_tank",
        description: "The ultimate protector. Extremely high HP but slow movement."
    },
    support: {
        name: "Support",
        maxHP: 110,
        speed: 120,
        baseDamage: 10,
        abilities: ["heal", "buff"],
        animationRig: "humanoid_support",
        description: "Aids allies with healing and buffs. Essential for any team."
    }
};
