import { parseMsg } from "../../src/websocketHandlers/parseMsg";
import { WebSocketServer } from "ws";

export function createWebsocketServer() {
  const wss = new WebSocketServer(
    {
      port: 3000,
    },
    () => console.log("websocker server is running")
  );

  wss.on("connection", (ws) => {
    ws.on("error", console.error);

    ws.on("message", (msg) => {
      parseMsg(msg, ws);
    });
  });
}
