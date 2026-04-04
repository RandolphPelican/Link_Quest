import { Server } from "colyseus";
import { createServer } from "http";
import express from "express";
import path from "path";
import { GameRoom } from "./rooms/GameRoom";

const port = Number(process.env.PORT || 3000);
const app = express();

app.use(express.json());

// Serve static files from the client build directory
const clientPath = path.join(__dirname, "../../client/dist");
app.use(express.static(clientPath));

const gameServer = new Server({
  server: createServer(app),
});

// Register your room handlers
gameServer.define("game", GameRoom);

gameServer.listen(port);
console.log(`Listening on ws://localhost:${port}`);
