// Enemy definitions. Frames index into the Kenney Tiny Dungeon sheet ("tiles").
// BATCH 1 TUNING: speeds cut ~45%, contact damage raised so fights matter.
// LEVEL 2: beast roster — bear / wolf / gator lines and the Threefold Beast.
export type EnemyKind =
  | "red_bat" | "grey_rat" | "green_blob" | "boss"
  | "warden_blob" | "warden_bat" | "warden_rat"
  | "warden_rat_fire" | "warden_rat_ice"
  | "dragon_fire" | "dragon_ice"
  | "bear" | "bear_cub"
  | "wolf" | "wolf_pup"
  | "gator" | "gator_hatchling"
  | "chimera";

export interface EnemyDef {
  frame: number;
  hp: number;
  damage: number;
  speed: number;
  scale: number;
  pattern: "bat" | "rat" | "blob" | "boss" | "turret" | "charger" | "pack" | "ambush" | "chimera";
  hpBarWidth: number;
  tint?: number;            // base color multiply (kept through hit/telegraph flashes)
  contactDamage?: number;   // body-touch damage when it differs from `damage` (shots/lunges)
  shootCooldownMs?: number; // ranged wardens: time between telegraphed bursts
  texture?: string;         // procedural texture key (overrides the spritesheet frame)
}

export const ENEMY_DEFS: Record<EnemyKind, EnemyDef> = {
  red_bat:    { frame: 120, hp: 5,  damage: 3, speed: 52, scale: 1, pattern: "bat",  hpBarWidth: 14 },
  grey_rat:   { frame: 124, hp: 10, damage: 5, speed: 46, scale: 1, pattern: "rat",  hpBarWidth: 14 },
  green_blob: { frame: 108, hp: 20, damage: 7, speed: 20, scale: 1, pattern: "blob", hpBarWidth: 14 },
  // Body touch is a graze (2) so sword range is a fair trade — his shots and swarm stay the real threat.
  boss:       { frame: 111, hp: 80, damage: 8, speed: 34, scale: 2, pattern: "boss", hpBarWidth: 34, contactDamage: 2 },
  warden_blob: { frame: 110, hp: 38, damage: 8, speed: 28, scale: 1.7, pattern: "blob", hpBarWidth: 28 },
  warden_bat:  { frame: 120, hp: 28, damage: 6, speed: 65, scale: 1.5, pattern: "bat",  hpBarWidth: 24 },
  warden_rat:  { frame: 124, hp: 32, damage: 7, speed: 48, scale: 1.6, pattern: "rat", hpBarWidth: 26 },
  // Room 3 dual wardens — fire (fast, aggressive) and ice (slower shots that chill you).
  warden_rat_fire: { frame: 124, hp: 30, damage: 7, speed: 54, scale: 1.6, pattern: "rat", hpBarWidth: 26, tint: 0xff6040, shootCooldownMs: 1000 },
  warden_rat_ice:  { frame: 124, hp: 34, damage: 6, speed: 42, scale: 1.6, pattern: "rat", hpBarWidth: 26, tint: 0x78b4ff, shootCooldownMs: 1700 },
  // Phase-2 boss: the Twin Maw. Two immobile heads walled into the den — fire lobs fast
  // volleys, ice lobs slow chilling ones. Reachable only by bombs and storm bolts.
  dragon_fire: { frame: 111, texture: "dragon_fire", hp: 45, damage: 7, speed: 0, scale: 2.2, pattern: "turret", hpBarWidth: 32, shootCooldownMs: 1600 },
  dragon_ice:  { frame: 111, texture: "dragon_ice",  hp: 45, damage: 6, speed: 0, scale: 2.2, pattern: "turret", hpBarWidth: 32, shootCooldownMs: 2500 },

  // ---- LEVEL 2: THE WILD BELOW ----
  // Bear line — chargers. Telegraph (red flash) then a locked-direction charge,
  // followed by a tired pause: that pause is the punish window.
  bear_cub: { frame: 124, hp: 14, damage: 6,  speed: 38, scale: 1.2, pattern: "charger", hpBarWidth: 18, tint: 0xb07038 },
  bear:     { frame: 111, texture: "beast_bear", hp: 65, damage: 10, speed: 30, scale: 2.2, pattern: "charger", hpBarWidth: 34 },
  // Wolf line — pack hunters. They orbit just out of reach and take turns lunging.
  // The alpha howls in reinforcements.
  wolf_pup: { frame: 124, hp: 10, damage: 5, speed: 72, scale: 1.1, pattern: "pack", hpBarWidth: 16, tint: 0xb8c0d0 },
  wolf:     { frame: 111, texture: "beast_wolf", hp: 75, damage: 8, speed: 62, scale: 1.9, pattern: "pack", hpBarWidth: 34 },
  // Gator line — ambushers. Near-invisible until you're close, then a lightning
  // lunge into a death roll. Re-submerges between strikes.
  gator_hatchling: { frame: 124, hp: 12, damage: 6,  speed: 55, scale: 1.2, pattern: "ambush", hpBarWidth: 18, tint: 0x68a858 },
  gator:           { frame: 111, texture: "beast_gator", hp: 90, damage: 11, speed: 68, scale: 2.2, pattern: "ambush", hpBarWidth: 34 },
  // The Threefold Beast — all three animals stitched into one thing.
  // >2/3 HP: bear phase (charges). 1/3–2/3: wolf phase (orbits, lunges, howls in pups).
  // <1/3: gator phase (rapid ambush lunges + death rolls). Fires tri-bursts throughout.
  chimera: { frame: 111, texture: "beast_chimera", hp: 150, damage: 10, speed: 46, scale: 2.6, pattern: "chimera", hpBarWidth: 44, shootCooldownMs: 2600 },
};

// Kinds whose LAST survivor in a room drops the key chest.
export const KEY_DROPPERS: ReadonlySet<string> = new Set([
  "warden_blob", "warden_bat", "warden_rat", "warden_rat_fire", "warden_rat_ice",
  "bear", "wolf", "gator",
]);

export const BOSS_NAME = "The Hallucinator";
export const DRAGON_NAME = "The Twin Maw";
export const CHIMERA_NAME = "The Threefold Beast";
export const APEX_NAMES: Record<string, string> = {
  bear: "Old Ironhide",
  wolf: "The Pale Howler",
  gator: "Marrowjaw",
  chimera: CHIMERA_NAME,
};
