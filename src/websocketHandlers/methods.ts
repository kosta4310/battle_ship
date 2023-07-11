import { WebSocket } from "ws";
import { StatusAttack, statusAttack } from "./statusAttack";
import { wss } from "../../src/ws_server";
import { MyWebSocket } from "../types/types";
import {
  idsWs,
  listWaitedPlayers,
  listWaitedRooms,
  players,
  rooms,
  winners,
} from "./parseMsg";

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

export function updateRoom(arr: Array<UpdateRoom>) {
  for (const client of Array.from(idsWs.values())) {
    const filteredArray = arr.filter((item) => {
      return item.roomUsers[0].index !== client.bsid;
    });
    const responseData = JSON.stringify(filteredArray);

    const response = {
      type: "update_room",
      data: responseData,
      id: 0,
    };
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

export function responseAttack(
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
  arrayWebSockets: Set<WebSocket>
) {
  const responseData = JSON.stringify(winners);
  const response = JSON.stringify({
    type: "update_winners",
    data: responseData,
    id: 0,
  });

  arrayWebSockets.forEach((client) => client.send(response));
}

export function addWinner(idCurrentPlayer: number) {
  if (winners.get(idCurrentPlayer)) {
    const winner = winners.get(idCurrentPlayer) as {
      name: string;
      wins: number;
    };
    const countWins = winner?.wins as number;
    winner.wins = countWins + 1;
  } else {
    winners.set(idCurrentPlayer, {
      name: players[idCurrentPlayer].name,
      wins: 1,
    });
  }
}

type AttackInputData = {
  x: number;
  y: number;
  gameId: number;
  indexPlayer: number;
};

export function parsingAttack(
  { x, y, gameId, indexPlayer: idCurrentPlayer }: AttackInputData,
  ws: MyWebSocket
) {
  const firstWs = ws as MyWebSocket;
  const indexSecondPlayer = firstWs.bsidEnemy;

  const secondWs = idsWs.get(indexSecondPlayer) as WebSocket;

  // зайдет в IF если соблюден ход игрока и выстрел в эту точку еще не был сделан
  if (
    idCurrentPlayer === rooms[gameId][2] &&
    !players[idCurrentPlayer].shooted.includes("" + x + y)
  ) {
    players[idCurrentPlayer].shooted.push("" + x + y);
    const { ships, parsedShips } = players[indexSecondPlayer];

    const [status, killedShipWhithEmptyCell] = statusAttack({
      x,
      y,
      ships,
      parsedShips,
    });

    if (status === StatusAttack.Killed) {
      if (killedShipWhithEmptyCell) {
        for (const item of killedShipWhithEmptyCell as Map<
          { x: number; y: number },
          StatusAttack
        >) {
          const [position, status] = item;

          responseAttack(position, idCurrentPlayer, status, [
            secondWs,
            firstWs,
          ]);
        }
      }

      players[idCurrentPlayer].killedShips++;
    } else {
      responseAttack({ x, y }, idCurrentPlayer, status as StatusAttack, [
        secondWs,
        firstWs,
      ]);
    }

    if (status === StatusAttack.Miss) {
      changePlayersTurn(indexSecondPlayer, [secondWs, firstWs]);
      rooms[gameId].splice(-1, 1, indexSecondPlayer);
    } else {
      changePlayersTurn(idCurrentPlayer, [secondWs, firstWs]);
    }
  } else if (idCurrentPlayer === rooms[gameId][2]) {
    changePlayersTurn(idCurrentPlayer, [secondWs, firstWs]);
  }

  // добавление победителя

  if (players[idCurrentPlayer].killedShips === 10) {
    [idCurrentPlayer, indexSecondPlayer].forEach((ind) => {
      players[ind].killedShips = 9;
      players[ind].shooted = [];
    });

    // -------------- killedShips понемять на 0

    finish(idCurrentPlayer, [secondWs, firstWs]);

    addWinner(idCurrentPlayer);
    const arrayWinners = Array.from(winners.values());
    updateWinners(arrayWinners, wss.clients);
  }
}

export function getPositionRandomAttack(
  indexGame: number,
  currentPlayer: number
): { x: number; y: number } {
  const arrayAllAccessCells: Array<string> = [];

  for (let x = 0; x <= 9; x++) {
    for (let y = 0; y <= 9; y++) {
      const elem = "" + x + y;
      if (!players[currentPlayer].shooted.includes(elem)) {
        arrayAllAccessCells.push(elem);
      }
    }
  }

  const randomIndex = Math.floor(Math.random() * arrayAllAccessCells.length);
  const arrayPositionAsString = arrayAllAccessCells[randomIndex].split("");
  const [x, y] = arrayPositionAsString.map((item) => Number(item));
  return { x, y };
}

export function disconnectUser(ws: MyWebSocket) {
  const id = ws.bsid;
  delete players[id];
  idsWs.delete(id);
  listWaitedPlayers.delete(id);
  listWaitedRooms.delete(id);
  const idWinner = ws.bsidEnemy;

  finish(idWinner, [idsWs.get(idWinner) as MyWebSocket]);

  addWinner(idWinner);
  const arrayWinners = Array.from(winners.values());
  updateWinners(arrayWinners, wss.clients);
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
