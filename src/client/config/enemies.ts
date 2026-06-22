// Enemy definitions. Frames index into the Kenney Tiny Dungeon sheet ("tiles").
// BATCH 1 TUNING: speeds cut ~45%, contact damage raised so fights matter.
export type EnemyKind =
  | "red_bat" | "grey_rat" | "green_blob" | "boss"
  | "warden_blob" | "warden_bat" | "warden_rat"
  | "warden_rat_fire" | "warden_rat_ice";

export interface EnemyDef {
  frame: number;
  hp: number;
  damage: number;
  speed: number;
  scale: number;
  pattern: "bat" | "rat" | "blob" | "boss";
  hpBarWidth: number;
  tint?: number;            // base color multiply (kept through hit/telegraph flashes)
  shootCooldownMs?: number; // ranged wardens: time between telegraphed bursts
}

export const ENEMY_DEFS: Record<EnemyKind, EnemyDef> = {
  red_bat:    { frame: 120, hp: 5,  damage: 3, speed: 52, scale: 1, pattern: "bat",  hpBarWidth: 14 },
  grey_rat:   { frame: 124, hp: 10, damage: 5, speed: 46, scale: 1, pattern: "rat",  hpBarWidth: 14 },
  green_blob: { frame: 108, hp: 20, damage: 7, speed: 20, scale: 1, pattern: "blob", hpBarWidth: 14 },
  boss:       { frame: 111, hp: 80, damage: 8, speed: 34, scale: 2, pattern: "boss", hpBarWidth: 34 },
  warden_blob: { frame: 110, hp: 38, damage: 8, speed: 28, scale: 1.7, pattern: "blob", hpBarWidth: 28 },
  warden_bat:  { frame: 120, hp: 28, damage: 6, speed: 65, scale: 1.5, pattern: "bat",  hpBarWidth: 24 },
  warden_rat:  { frame: 124, hp: 32, damage: 7, speed: 48, scale: 1.6, pattern: "rat",  hpBarWidth: 26 },
  // Room 3 dual wardens — fire (fast, aggressive) and ice (slower shots that chill you).
  warden_rat_fire: { frame: 124, hp: 30, damage: 7, speed: 54, scale: 1.6, pattern: "rat", hpBarWidth: 26, tint: 0xff6040, shootCooldownMs: 1000 },
  warden_rat_ice:  { frame: 124, hp: 34, damage: 6, speed: 42, scale: 1.6, pattern: "rat", hpBarWidth: 26, tint: 0x78b4ff, shootCooldownMs: 1700 },
};

export const BOSS_NAME = "The Hallucinator";
