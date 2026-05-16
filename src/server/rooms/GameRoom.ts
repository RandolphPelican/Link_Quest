import { Room, Client } from "colyseus";

export class GameRoom extends Room {
  onCreate(_options: unknown) {
    console.log("GameRoom created:", this.roomId);
  }

  onJoin(client: Client, _options: unknown) {
    console.log(`Client ${client.sessionId} joined ${this.roomId}`);
  }

  onLeave(client: Client, _consented: boolean) {
    console.log(`Client ${client.sessionId} left ${this.roomId}`);
  }

  onDispose() {
    console.log("GameRoom disposed:", this.roomId);
  }
}
