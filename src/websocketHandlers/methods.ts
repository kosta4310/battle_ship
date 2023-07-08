import { WebSocket } from "ws";
import { StatusAttack } from "./statusAttack";
import { wss } from "../../src/ws_server";
import { MyWebSocket } from "../types/types";

export function createPlayer(
  idPlayer: number,
  name: string,
  password: string,
  ws: WebSocket
) {
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
  // const updateUserData = { ...db.get(ws), idGame } as UsersData;
  // db.set(ws, updateUserData);
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

export type UpdateRoom = {
  roomId: number;
  roomUsers: Array<{ name: string; index: number }>;
};

export function updateRoom(
  // idGame: number,
  // name: string,
  // index: number,
  // ws: WebSocket
  arr: Array<UpdateRoom>
) {
  // const responseData = JSON.stringify(arr);
  const responseData = JSON.stringify([
    {
      roomId: 2,
      roomUsers: [
        {
          name: "fdf",
          index: 3,
        },
      ],
    },
  ]);
  console.log(responseData);

  const response = JSON.stringify({
    type: "update_room",
    data: responseData,
    id: 0,
  });
  for (const client of wss.clients) {
    client.send(JSON.stringify(response));
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
  status: StatusAttack,
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

// export function emptyUpdateRoom(arrayWs: Array<MyWebSocket>) {
//   const responseData = JSON.stringify([]);
//   const response = JSON.stringify({
//     type: "update_room",
//     data: responseData,

//     id: 0,
//   });

//   arrayWs.forEach((client) => client.send(response));
// }

export function finish(winPlayer: number, arrayWs: Array<WebSocket>) {
  const responseData = JSON.stringify({ winPlayer });
  const response = JSON.stringify({
    type: "finish",
    data: responseData,
    id: 0,
  });

  arrayWs.forEach((client) => client.send(response));
}

export function updateWinners(
  winners: Array<{ name: string; wins: number }>,
  arrayWs: Array<WebSocket>
) {
  const responseData = JSON.stringify(winners);
  const response = JSON.stringify({
    type: "update_winners",
    data: responseData,
    id: 0,
  });

  arrayWs.forEach((client) => client.send(response));
}

// export function invalidInputData(params: type) {
//   const responseData = {
//     name: name,
//     index: idPlayer,
//     error: false,
//     errorText: "something",
//   };
//   const stringifiedData = JSON.stringify(responseData);
//   const response = JSON.stringify({
//     type: "reg",
//     data: stringifiedData,
//     id: 0,
//   });
//   ws.send(response);
// }
