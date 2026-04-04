export interface ItemDefinition {
    id: string;
    name: string;
    type: "health" | "mana" | "buff" | "key";
    value: number;
    color: number;
}

export const ITEMS: Record<string, ItemDefinition> = {
    health_potion: {
        id: "health_potion",
        name: "Health Potion",
        type: "health",
        value: 50,
        color: 0xff0000
    },
    mana_potion: {
        id: "mana_potion",
        name: "Mana Potion",
        type: "mana",
        value: 30,
        color: 0x0000ff
    },
    speed_boost: {
        id: "speed_boost",
        name: "Speed Boost",
        type: "buff",
        value: 1.5,
        color: 0xffff00
    }
};
