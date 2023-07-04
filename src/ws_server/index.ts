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
      const parsedMessage: { type: string; data: string; id: number } =
        JSON.parse(msg.toString());
      const { data } = parsedMessage;
      const parsedData: { name: string; password: string } = JSON.parse(data);
      const resposeData = {
        name: parsedData.name,
        index: 1,
        error: false,
        errorText: "something",
      };
      console.log("resopnse data: %s", resposeData);
      const stringifiedData = JSON.stringify(resposeData);
      ws.send(
        JSON.stringify({
          type: "reg",
          data: stringifiedData,
          id: 0,
        })
      );
    });
  });
}
