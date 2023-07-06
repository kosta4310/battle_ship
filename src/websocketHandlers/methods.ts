import { UsersData, db, updateDataRoom } from "./parseMsg";
import { WebSocket } from "ws";

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
  console.log(db.size);

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

export function startGame(ships: Array<any>, index: number, ws: WebSocket) {
  const responseData = JSON.stringify({
    ships,
    currentPlayerIndex: index,
  });

  const response = JSON.stringify({
    type: "start_game",
    data: responseData,
    id: 0,
  });

  ws.send(response);
}

export function changePlayersTurn(
  currentPlayer: number,
  arrayWs: Array<WebSocket>
) {
  const responseData = JSON.stringify({ currentPlayer });
  const response = JSON.stringify({
    type: "turn",
    data: responseData,
    id: 0,
  });

  arrayWs.map((ws) => ws.send(response));
}

export function attack(
  position: { x: number; y: number },
  currentPlayer: number,
  status: "miss" | "killed" | "shot",
  arrayWs: Array<WebSocket>
) {
  const responseData = JSON.stringify({
    position,
    currentPlayer,
    status,
  });

  const response = JSON.stringify({
    type: "attack",
    data: responseData,
    id: 0,
  });
  arrayWs.forEach((client) => client.send(response));
}
