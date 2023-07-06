import { UsersData, db, updateDataRoom } from "./parseMsg";
import { RawData, WebSocket } from "ws";

export function createPlayer(
  idPlayer: number,
  name: string,
  password: string,
  ws: WebSocket
) {
  db.set(ws, {
    name,
    password,
    index: idPlayer,
    idGame: 0,
  });

  const responseData = {
    name: name,
    index: idPlayer,
    error: false,
    errorText: "something",
  };
  const stringifiedData = JSON.stringify(responseData);
  const response = JSON.stringify({
    type: "reg",
    data: stringifiedData,
    id: 0,
  });
  ws.send(response);
}

export function createGame(idGame: number, idPlayer: number, ws: WebSocket) {
  const updateUserData = { ...db.get(ws), idGame } as UsersData;
  db.set(ws, updateUserData);
  const responseData = JSON.stringify({
    idGame,
    idPlayer,
  });
  const response = JSON.stringify({
    type: "create_game",
    data: responseData,
    id: 0,
  });

  ws.send(response);
}

export function updateRoom(
  idGame: number,
  name: string,
  index: number,
  ws: WebSocket
) {
  let iterator = db.keys();
  for (const client of iterator) {
    if (client !== ws) {
      const responseUpdateRoom = updateDataRoom(idGame, [
        {
          name,
          index,
        },
      ]);
      client.send(JSON.stringify(responseUpdateRoom));
    }
  }
}
