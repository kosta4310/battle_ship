import { httpServer } from "../../src/http_server";
import { MyWebSocket, parseMsg } from "../../src/websocketHandlers/parseMsg";
import { WebSocketServer } from "ws";

export const wss: WebSocketServer = new WebSocketServer(
  {
    port: 3000,
  },
  () => console.log("Websocket server is running on ", wss.address())
);

wss.on("connection", (ws: MyWebSocket) => {
  ws.on("error", console.error);

  ws.on("message", (msg) => {
    parseMsg(msg, ws);
  });
});

process.on("SIGINT", () => {
  console.log("\nAll connection and sockets will closed");
  wss.clients.forEach((socket) => {
    socket.send("server_was_closed");
    socket.close();
  });
  wss.close(() => {
    httpServer.close(() => process.exit(0));
  });
});

httpServer.on("close", () => console.log("Http server is closed"));
wss.on("close", () => console.log("Tcp server is closed"));
