// ============================================================
// events.js — Unified Event System (Commandment 10)
// ============================================================

'use strict';

class EventEmitter {
  constructor() {
    this.listeners = new Map();
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (!this.listeners.has(event)) return;
    const callbacks = this.listeners.get(event);
    const index = callbacks.indexOf(callback);
    if (index !== -1) {
      callbacks.splice(index, 1);
    }
  }

  emit(event, data) {
    if (!this.listeners.has(event)) return;
    this.listeners.get(event).forEach(callback => callback(data));
  }
}

// Global Event Bus
window.Events = new EventEmitter();

// Common Event Names
window.GameEvents = {
  PLAYER_DAMAGED: 'player_damaged',
  PLAYER_HEALED: 'player_healed',
  PLAYER_DIED: 'player_died',
  ENEMY_DAMAGED: 'enemy_damaged',
  ENEMY_DIED: 'enemy_died',
  ITEM_COLLECTED: 'item_collected',
  ROOM_CHANGED: 'room_changed',
  SWITCH_ACTIVATED: 'switch_activated',
  TOAST_MESSAGE: 'toast_message',
  SCREEN_SHAKE: 'screen_shake'
};
