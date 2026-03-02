import fs from "fs";
import { WebSocketServer } from "ws"

const CONTENT_FOLDER = "content";

fs.watch(
  CONTENT_FOLDER,
  { persistent: true, recursive: true },
  async (eventType, fileName) => {
    clients.forEach((ws) => {
      // do any pre-processing you want to do here...
      ws.send("refresh");
    });
  },
);

const wss = new WebSocketServer({ port: 3201 });

const clients = new Set<any>();

wss.on("connection", function connection(ws) {
  clients.add(ws);
  ws.on("error", console.error);
  ws.on("close", () => clients.delete(ws));
});