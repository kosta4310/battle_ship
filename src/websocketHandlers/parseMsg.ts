import { RawData, WebSocket } from "ws";
import { MessageFromClient } from "../types/types";
import {
  createPlayer,
  createGame,
  updateRoom,
  startGame,
  changePlayersTurn,
  attack,
  emptyUpdateRoom,
  finish,
  updateWinners,
} from "./methods";
import { parseShipField } from "./parseShipField";
import { StatusAttack, statusAttack } from "./statusAttack";

export type UsersData = {
  name: string;
  password: string;
  index: number;
  idGame: number;
};

type Player = {
  ships: Array<any>;
  shooted: Array<string>;
  parsedShips: Array<Array<string>>;
  killedShips: number;
  wins: number;
  name: string;
};

/* Object game под индексом комнаты будет массив в котором будет обьект с полем 
idPlayer которому будет соответствовать массив кораблей и текущий игрок*/

/*Массив, в котором по индексу(индекс комнаты) находятся index игроков в этих комнатах*/
type Rooms = Array<Array<number>>;

export const db = new Map<WebSocket, UsersData>();
const rooms: Rooms = [];
const players: { [idPlayer: string]: Player } = {};
const idsWs = new Map<number, MyWebSocket>();
const winners = new Map<number, { name: string; wins: number }>();

let idPlayer = 0;
let idGame = 0;

export interface MyWebSocket extends WebSocket {
  bsidEnemy: number;
  bsid: number;
  bsidRoom: number;
  bsidGame: number;
  bsname: string;
  bspassword: string;
  bsShips: Array<any>;
}

export function parseMsg(message: RawData, ws: MyWebSocket) {
  console.log("message from client: %s", message.toString());

  const { type, data }: MessageFromClient = JSON.parse(message.toString());
  const parsedData = data ? JSON.parse(data) : "";

  switch (type) {
    case "reg":
      const { name, password } = parsedData;
      ws.bsname = name;
      ws.bspassword = password;
      ws.bsid = idPlayer;
      players[idPlayer.toString()] = {
        name: name,
        ships: [],
        shooted: [],
        parsedShips: [],
        killedShips: 9,
        wins: 0,
      };
      idsWs.set(idPlayer, ws);
      createPlayer(idPlayer, name, password, ws);

      idPlayer++;
      break;

    case "create_room":
      rooms.push([ws.bsid]);
      updateRoom(idGame, ws.bsname, ws.bsid, ws);

      idGame++;

      break;

    case "add_user_to_room":
      const { indexRoom } = parsedData;

      if (rooms[indexRoom].length === 1) {
        rooms[indexRoom].push(ws.bsid);

        createGame(indexRoom, ws.bsid, ws);

        const idSecondPlayer = rooms[indexRoom][0];
        ws.bsidEnemy = idSecondPlayer;
        const websocketSecondPlayer = idsWs.get(idSecondPlayer);

        if (websocketSecondPlayer) {
          websocketSecondPlayer.bsidEnemy = ws.bsid;
        }

        createGame(
          indexRoom,
          idSecondPlayer,
          websocketSecondPlayer as MyWebSocket
        );
        emptyUpdateRoom([ws, websocketSecondPlayer as MyWebSocket]);
      }

      break;

    case "add_ships":
      let { gameId, ships, indexPlayer } = parsedData;
      const parsedShips = parseShipField(ships);
      players[indexPlayer].parsedShips = parsedShips;
      if (rooms[gameId].length === 3) {
        rooms[gameId].pop();
        ws.bsShips = ships;

        players[indexPlayer].ships = ships;
        const websocketFirstPlayer = ws;

        startGame(ships, indexPlayer, websocketFirstPlayer);

        const websocketSecondPlayer = idsWs.get(
          websocketFirstPlayer.bsidEnemy
        ) as MyWebSocket;

        const shipsSecondPlayer = websocketSecondPlayer.bsShips;

        const idSecondPlayer = websocketSecondPlayer.bsid;

        startGame(
          shipsSecondPlayer as unknown as Array<any>,
          idSecondPlayer,
          websocketSecondPlayer
        );
        // разыгрываем чей первый ход
        const indexFirstTurn =
          Math.random() < 0.5 ? indexPlayer : idSecondPlayer;
        rooms[gameId].push(indexFirstTurn);

        /*третим элементов в массиве будет индекс текущего игрока*/
        changePlayersTurn(indexFirstTurn, [
          websocketFirstPlayer,
          websocketSecondPlayer,
        ] as Array<MyWebSocket>);
      } else {
        rooms[gameId].push(0);
        players[gameId].ships = ships;
        ws.bsShips = ships;
      }

      break;

    case "attack":
      const { x, y } = parsedData as {
        x: number;
        y: number;
        gameId: number;
        indexPlayer: number;
      };

      const firstWs = idsWs.get(parsedData.indexPlayer) as WebSocket;
      const [indexSecondPlayer] = rooms[parsedData.gameId].filter(
        (item) => item !== parsedData.indexPlayer
      );
      const secondWs = idsWs.get(indexSecondPlayer) as WebSocket;

      // зайдет в IF если соблюден ход игрока и выстрел в эту точку еще не был сделан
      if (
        parsedData.indexPlayer === rooms[parsedData.gameId][2] &&
        !players[parsedData.indexPlayer].shooted.includes("" + x + y)
      ) {
        players[parsedData.indexPlayer].shooted.push("" + x + y);
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
              console.log(position, status);

              attack(position, parsedData.indexPlayer, status, [
                secondWs,
                firstWs,
              ]);
            }
          }

          players[parsedData.indexPlayer].killedShips++;
        } else {
          attack({ x, y }, parsedData.indexPlayer, status as StatusAttack, [
            secondWs,
            firstWs,
          ]);
        }

        if (status === StatusAttack.Miss) {
          changePlayersTurn(indexSecondPlayer, [secondWs, firstWs]);
          rooms[parsedData.gameId].splice(-1, 1, indexSecondPlayer);
        } else {
          changePlayersTurn(parsedData.indexPlayer, [secondWs, firstWs]);
        }
      } else if (parsedData.indexPlayer === rooms[parsedData.gameId][2]) {
        changePlayersTurn(parsedData.indexPlayer, [secondWs, firstWs]);
      }

      // добавление победителя

      if (players[parsedData.indexPlayer].killedShips === 10) {
        players[parsedData.indexPlayer].killedShips = 0;

        finish(parsedData.indexPlayer, [secondWs, firstWs]);

        if (winners.get(parsedData.indexPlayer)) {
          const winner = winners.get(parsedData.indexPlayer) as {
            name: string;
            wins: number;
          };
          const countWins = winner?.wins as number;
          winner.wins = countWins + 1;
        } else {
          winners.set(parsedData.indexPlayer, {
            name: players[parsedData.indexPlayer].name,
            wins: 1,
          });
        }
        const wins = Array.from(winners.values());
        console.log("winners: ", winners);

        console.log("wins", wins);

        updateWinners(wins, [firstWs, secondWs]);
      }

      break;

    default:
      console.log("default: ", message.toString());

      return "Error";
  }
}
