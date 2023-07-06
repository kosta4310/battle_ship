import { MyWebSocket, parseMsg } from "../../src/websocketHandlers/parseMsg";
import { WebSocket, WebSocketServer } from "ws";

export function createWebsocketServer() {
  // After starting the program displays websocket parameters - which one?
  // вывести адресс и порт на консоль
  const wss = new WebSocketServer(
    {
      port: 3000,
    },
    () => console.log("websocker server is running")
  );

  wss.on("connection", (ws: MyWebSocket) => {
    ws.on("error", console.error);

    ws.on("message", (msg) => {
      parseMsg(msg, ws);
    });
  });
}
