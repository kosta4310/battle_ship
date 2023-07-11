import { MyWebSocket } from "../types/types";
import { parseMsg } from "../../src/websocketHandlers/parseMsg";
import { WebSocketServer } from "ws";
import { httpServer } from "../http_server";
import { disconnectUser } from "../websocketHandlers/methods";

export let isLiveServer = true;

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

  ws.on("close", () => {
    if (isLiveServer) {
      disconnectUser(ws);
    }
    console.log("client tcp is closed");
  });
});

process.on("SIGINT", () => {
  isLiveServer = false;
  console.log("\nAll connection and sockets will closed");

  wss.clients.forEach((socket) => {
    socket.send(JSON.stringify({ text: `server_was_closed` }));
    socket.close();
  });

  wss.close(() => {});

  httpServer.close();
});

wss.on("close", () => {
  console.log("Tcp server is closed");
});
