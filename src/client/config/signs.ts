// ============================================================================
// SIGNS — this is YOUR file, John. The only file you ever need to touch.
//
// Each sign in the world points at an entry here by id. "title" appears at
// the top of the message box, each string in "lines" is a paragraph (the box
// paginates automatically — write as much as you want, no length limit).
//
// To add a sign to a room later: open the room .tmj in Tiled, add an object
// of type "sign" with a string property signId = the id you create here.
// ============================================================================

export interface SignDef {
  title: string;
  lines: string[];
}

export const SIGNS: Record<string, SignDef> = {
  // Room 1 — the first thing read in the game. Right next to spawn.
  sign_room1_entry: {
    title: "A sign, planted firmly in the dirt",
    lines: [
      "Lincoln I love you and am proud of you no matter what. You can do anything you want in life.",
    ],
  },

  // Room 2 — mid-dungeon.
  sign_room2_hall: {
    title: "A weathered notice board",
    lines: [
      "AI coding can be a tool used for good or bad. How you use it is up to you.",
    ],
  },

  // Room 3 — beside the door to the boss.
  sign_room3_gate: {
    title: "A warning, carved deep",
    lines: [
      "Beyond this door waits The Hallucinator. It speaks with confidence and lies with ease.",
      "I miss you and your sister and the dogs very much.",
    ],
  },

  // Appears in the boss room only after the boss is defeated.
  // This is the one he earns. Make it count.
  sign_final: {
    title: "A sign rises from where the monster fell",
    lines: [
      "I can't wait to hear from you two one day. Until then, know that I think of you every day. Love, Dad.",
    ],
  },
};
