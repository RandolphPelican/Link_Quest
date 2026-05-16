import express from "express";
import { createServer } from "http";
import path from "path";
import { Server } from "colyseus";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { GameRoom } from "./rooms/GameRoom";

const PORT = Number(process.env.PORT) || 3000;
const CLIENT_DIR = path.resolve(__dirname, "../client");

const app = express();
const httpServer = createServer(app);

app.use(express.static(CLIENT_DIR));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "link-quest" });
});

const gameServer = new Server({
  transport: new WebSocketTransport({ server: httpServer }),
});
gameServer.define("game_room", GameRoom);

app.get("*", (_req, res) => {
  res.sendFile(path.join(CLIENT_DIR, "index.html"));
});

httpServer.listen(PORT, () => {
  console.log(`Link Quest server listening on :${PORT}`);
});
