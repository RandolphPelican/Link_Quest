// Hero definitions. Frames index into the Kenney Tiny Dungeon sheet ("tiles").
export interface HeroDef {
  name: string;
  frame: number;
  hp: number;
  speed: number; // SP stat; pixels/sec = speed * 15
  attack: {
    kind: "melee" | "ranged";
    name: string;
    damage: number;
    weaponFrame?: number;    // melee swing / thrown sprite
    projectile?: "fireball" | "dagger";
    cooldownMs: number;
  };
}

export const SPEED_PER_SP = 15;

export const HEROES: Record<string, HeroDef> = {
  Niall: {
    name: "Niall", frame: 84, hp: 70, speed: 6,
    attack: { kind: "ranged", name: "Fireball", damage: 2, projectile: "fireball", cooldownMs: 450 },
  },
  Bear: {
    name: "Bear", frame: 88, hp: 90, speed: 4,
    attack: { kind: "melee", name: "Club Swing", damage: 3, weaponFrame: 117, cooldownMs: 550 },
  },
  Noah: {
    name: "Noah", frame: 100, hp: 55, speed: 7,
    attack: { kind: "melee", name: "Sword Poke", damage: 4, weaponFrame: 104, cooldownMs: 380 },
  },
  Journey: {
    name: "Journey", frame: 99, hp: 40, speed: 9,
    attack: { kind: "ranged", name: "Throwing Knife", damage: 2, projectile: "dagger", weaponFrame: 105, cooldownMs: 350 },
  },
  Lincoln: {
    name: "Lincoln", frame: 87, hp: 80, speed: 8,
    attack: { kind: "melee", name: "Axe Swing", damage: 4.5, weaponFrame: 118, cooldownMs: 420 },
  },
};

export const HERO_ORDER = ["Niall", "Bear", "Noah", "Journey", "Lincoln"];
