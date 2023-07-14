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
import { getBotShips } from "../utils/botShips";
import { parseShipField } from "./parseShipField";

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
    errorText: "",
  };
  const stringifiedData = JSON.stringify(responseData);
  const response = JSON.stringify({
    type: "reg",
    data: stringifiedData,
    id: 0,
  });
  ws.send(response);
  console.log(`response from server: ${response}`);
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
  console.log(`response from server: ${response}`);
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

    const response = JSON.stringify({
      type: "update_room",
      data: responseData,
      id: 0,
    });
    client.send(response);
    console.log(`response from server: ${response}`);
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
  console.log(`response from server: ${response}`);
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

  arrayWs.map((ws) => {
    ws.send(response);
    console.log(`response from server: ${response}`);
  });
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
  arrayWs.forEach((client) => {
    client.send(response);
    console.log(`response from server: ${response}`);
  });
}

export function finish(winPlayer: number, arrayWs: Array<MyWebSocket>) {
  const responseData = JSON.stringify({ winPlayer });
  const response = JSON.stringify({
    type: "finish",
    data: responseData,
    id: 0,
  });

  arrayWs.forEach((client) => {
    client.send(response);
    console.log(`response from server: ${response}`);
  });
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

  arrayWebSockets.forEach((client) => {
    client.send(response);
    console.log(`response from server: ${response}`);
  });
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
  const indexSecondPlayer = firstWs.bsidEnemy as number;

  const secondWs = idsWs.get(indexSecondPlayer) as MyWebSocket;

  // зайдет в IF если соблюден ход игрока и выстрел в эту точку еще не был сделан

  if (
    idCurrentPlayer === rooms[gameId][2] &&
    !players[idCurrentPlayer].shooted.includes("" + x + y)
  ) {
    players[idCurrentPlayer].shooted.push("" + x + y);
    const { ships, parsedShips } = players[indexSecondPlayer];
    console.log(ships);

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
      players[ind].killedShips = 0;
      players[ind].shooted = [];
    });

    finish(idCurrentPlayer, [secondWs, firstWs]);

    [secondWs, firstWs].forEach((socket) => (socket.bsidEnemy = null));

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
  idsWs.delete(id);
  listWaitedPlayers.delete(id);
  listWaitedRooms.delete(id);

  const idWinner = ws.bsidEnemy;

  if (idWinner) {
    finish(idWinner, [idsWs.get(idWinner) as MyWebSocket]);

    addWinner(idWinner);
    const arrayWinners = Array.from(winners.values());
    updateWinners(arrayWinners, wss.clients);
  }

  const listAccessibleRooms = Array.from(listWaitedRooms.values());
  updateRoom(listAccessibleRooms);
}

export function singlePlay(idGame: number, ws: MyWebSocket) {
  const idUser = ws.bsid;
  listWaitedPlayers.delete(idUser);
  listWaitedRooms.delete(idUser);

  const listAccessibleRooms = Array.from(listWaitedRooms.values());
  updateRoom(listAccessibleRooms);

  createGame(idGame, idUser, ws);
}

export function singlePlayAddShips(
  {
    gameId,
    indexPlayer,
    ships,
  }: { gameId: number; ships: Array<any>; indexPlayer: number },
  ws: MyWebSocket
) {
  const idBot = ws.bsidEnemy as number;
  const botShips = JSON.parse(getBotShips());
  players[idBot].ships = botShips;
  players[idBot].parsedShips = parseShipField(botShips);

  players[indexPlayer].ships = ships;
  players[indexPlayer].parsedShips = parseShipField(ships);

  startGame(ships, indexPlayer, ws);

  // разыгрываем чей первый ход
  const indexFirstTurn = Math.random() < 0.5 ? indexPlayer : idBot;
  /*третим элементов в массиве будет индекс текущего игрока*/
  rooms[gameId].push(indexFirstTurn);

  changePlayersTurn(indexFirstTurn, [ws] as Array<MyWebSocket>);

  if (indexFirstTurn === idBot) {
    const [x, y] = getPositionBotAttack(gameId);
    setTimeout(
      () => singlePlayAttack({ x, y, gameId, indexPlayer: idBot }, ws),
      2000
    );
  }
}

export function singlePlayAttack(
  { x, y, gameId, indexPlayer: idCurrentPlayer }: AttackInputData,
  ws: MyWebSocket
) {
  if (
    idCurrentPlayer === rooms[gameId][2] &&
    !players[idCurrentPlayer].shooted.includes("" + x + y)
  ) {
    players[idCurrentPlayer].shooted.push("" + x + y);

    const [idEnemy] = rooms[gameId].filter((id) => id != idCurrentPlayer);

    const { ships, parsedShips } = players[idEnemy];

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

          responseAttack(position, idCurrentPlayer, status, [ws]);
        }
      }

      players[idCurrentPlayer].killedShips++;
    } else {
      responseAttack({ x, y }, idCurrentPlayer, status as StatusAttack, [ws]);
    }

    if (status === StatusAttack.Miss) {
      changePlayersTurn(idEnemy, [ws]);
      rooms[gameId].splice(-1, 1, idEnemy);

      if (players[idEnemy].name.startsWith("bot")) {
        const [x, y] = getPositionBotAttack(gameId);
        setTimeout(
          () => singlePlayAttack({ x, y, gameId, indexPlayer: idEnemy }, ws),
          2000
        );
      }
    } else {
      changePlayersTurn(idCurrentPlayer, [ws]);

      if (players[idCurrentPlayer].name.startsWith("bot")) {
        const [x, y] = getPositionBotAttack(gameId);
        setTimeout(
          () =>
            singlePlayAttack(
              { x, y, gameId, indexPlayer: idCurrentPlayer },
              ws
            ),
          2000
        );
      }
    }
  } else if (idCurrentPlayer === rooms[gameId][2]) {
    changePlayersTurn(idCurrentPlayer, [ws]);

    if (players[idCurrentPlayer].name.startsWith("bot")) {
      const [x, y] = getPositionBotAttack(gameId);
      setTimeout(
        () =>
          singlePlayAttack({ x, y, gameId, indexPlayer: idCurrentPlayer }, ws),
        2000
      );
    }
  }
  // добавление победителя
  if (players[idCurrentPlayer].killedShips === 10) {
    [idCurrentPlayer].forEach((ind) => {
      players[ind].killedShips = 0;
      players[ind].shooted = [];
    });

    finish(idCurrentPlayer, [ws]);

    [ws].forEach((socket) => {
      socket.bsSinglePlay = false;
      socket.bsidEnemy = null;
    });

    addWinner(idCurrentPlayer);
    const arrayWinners = Array.from(winners.values());
    updateWinners(arrayWinners, wss.clients);
  }
}

function getPositionBotAttack(gameId: number): Array<number> {
  const [idBot] = rooms[gameId];
  const array = [];
  for (let x = 0; x <= 9; x++) {
    for (let y = 0; y <= 9; y++) {
      const elem = "" + x + y;
      if (!players[idBot].shooted.includes(elem)) {
        array.push(elem);
      }
    }
  }

  const idx = Math.floor(Math.random() * array.length);
  return array[idx].split("").map((el) => Number(el));
}

export function regError(name: string, idPlayer: number, ws: WebSocket) {
  const responseData = {
    name: name,
    index: idPlayer,
    error: true,
    errorText: "User already exist",
  };
  const stringifiedData = JSON.stringify(responseData);
  const response = JSON.stringify({
    type: "reg",
    data: stringifiedData,
    id: 0,
  });
  ws.send(response);
  console.log(`response from server: ${response}`);
}
