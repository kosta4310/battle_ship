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
} from "./methods";

export type UsersData = {
  name: string;
  password: string;
  index: number;
  idGame: number;
};

type Game = {
  [idGame: string]: Array<
    | {
        [idPlayer: string]: Array<any>;
      }
    | number
  >;
};

type Player = {
  ships: Array<any>;
  shootedByMe: Array<string>;
  parsedShips: Array<Array<string>>;
};

/* Object game под индексом комнаты будет массив в котором будет обьект с полем 
idPlayer которому будет соответствовать массив кораблей и текущий игрок*/

/*Массив, в котором по индексу(индекс комнаты) находятся index игроков в этих комнатах*/
type Rooms = Array<Array<number>>;

export const db = new Map<WebSocket, UsersData>();
const rooms: Rooms = [];
const game: Game = {};
const players: { [idPlayer: string]: Player } = {};
const idsWs = new Map<number, MyWebSocket>();

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
      console.log("ships", ships);

      if (game[gameId]) {
        ws.bsShips = ships;
        game[gameId].push({ [indexPlayer]: ships });
        gfg;
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
        const indexRandomFirstTurn =
          Math.random() < 0.5 ? indexPlayer : idSecondPlayer;
        game[gameId].push(indexRandomFirstTurn);
        fgf; /*третим элементов в массиве будет индекс текущего игрока*/
        changePlayersTurn(indexRandomFirstTurn, [
          websocketFirstPlayer,
          websocketSecondPlayer,
        ] as Array<MyWebSocket>);
      } else {
        game[gameId] = [{ [indexPlayer]: ships }];
        gfg;
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

      if (parsedData.indexPlayer === game[parsedData.gameId][2]) {
        const firstWs = idsWs.get(parsedData.indexPlayer) as WebSocket;
        const [indexSecondPlayer] = rooms[parsedData.gameId].filter(
          (item) => item !== parsedData.indexPlayer
        );
        const secondWs = idsWs.get(indexSecondPlayer) as WebSocket;
        attack({ x, y }, parsedData.indexPlayer, "shot", [secondWs, firstWs]);

        changePlayersTurn(indexSecondPlayer, [secondWs, firstWs]);
        game[parsedData.gameId].pop();
        game[parsedData.gameId].push(indexSecondPlayer);
      }

      break;

    default:
      console.log("default: ", message.toString());

      return "Error";
  }
}
