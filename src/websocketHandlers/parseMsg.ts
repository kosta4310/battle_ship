import { RawData, WebSocket } from "ws";
import { MessageFromClient, MyWebSocket, Player } from "../types/types";
import {
  createPlayer,
  createGame,
  updateRoom,
  startGame,
  changePlayersTurn,
  responseAttack,
  finish,
  updateWinners,
  UpdateRoom,
  addWinner,
  parsingAttack,
  getPositionRandomAttack,
  singlePlay,
  singlePlayAddShips,
  singlePlayAttack,
  regError,
} from "./methods";
import { parseShipField } from "./parseShipField";
import { StatusAttack, statusAttack } from "./statusAttack";
import { wss } from "../ws_server";

/* Object game под индексом комнаты будет массив в котором будет обьект с полем 
idPlayer которому будет соответствовать массив кораблей и текущий игрок*/

/*Массив, в котором по индексу(индекс комнаты) находятся index игроков в этих комнатах*/
type Rooms = Array<Array<number>>;
// type BotRooms = Array<Array<number>>;
// type Bot = {
//   enemy: number;
//   ships: Array<any>;
//   shooted: Array<string>;
//   parsedShips: Array<Array<string>>;
//   killedShips: number;
//   wins: number;
//   name: string;
// };

export const listWaitedRooms = new Map<number, UpdateRoom>();
export const listWaitedPlayers = new Set<number>();

// export const botRooms: BotRooms = [];
export const rooms: Rooms = [];
// export const bots: { [idBot: string]: Bot } = {};
export const players: { [idPlayer: string]: Player } = {};
export const idsWs = new Map<number, MyWebSocket>();
export const winners = new Map<number, { name: string; wins: number }>();

let idPlayer = 0;
let idGame = 0;
// let idBot = idPlayer;

export function parseMsg(message: RawData, ws: MyWebSocket) {
  console.log("message from client: %s", message.toString());

  const { type, data }: MessageFromClient = JSON.parse(message.toString());
  const parsedData = data ? JSON.parse(data) : "";

  switch (type) {
    case "reg":
      const { name, password } = parsedData;

      const user = Object.values(players).find((user) => user.name === name);

      if (user && user.password !== password) {
        regError(name, idPlayer, ws);
      } else {
        ws.bsname = name;
        ws.bspassword = password;
        ws.bsid = idPlayer;
        ws.bsSinglePlay = false;
        players[idPlayer.toString()] = {
          name,
          ships: [],
          shooted: [],
          parsedShips: [],
          killedShips: 9,
          wins: 0,
          password,
        };
        idsWs.set(idPlayer, ws);
        createPlayer(idPlayer, name, password, ws);

        idPlayer++;

        if (listWaitedRooms.size) {
          const listAccessibleRooms = Array.from(listWaitedRooms.values());
          updateRoom(listAccessibleRooms);
        }

        if (winners.size) {
          updateWinners(Array.from(winners.values()), new Set([ws]));
        }
      }
      break;

    case "create_room":
      if (!listWaitedPlayers.has(ws.bsid)) {
        listWaitedPlayers.add(ws.bsid);

        listWaitedRooms.set(ws.bsid, {
          roomId: idGame,
          roomUsers: [{ name: ws.bsname, index: ws.bsid }],
        });
        rooms.push([ws.bsid]);

        const listAccessibleRooms = Array.from(listWaitedRooms.values());
        updateRoom(listAccessibleRooms);

        idGame++;
      }

      break;

    case "add_user_to_room":
      const { indexRoom } = parsedData;
      const idfirstPlayer = ws.bsid;
      if (rooms[indexRoom].length === 1) {
        rooms[indexRoom].push(idfirstPlayer);

        createGame(indexRoom, idfirstPlayer, ws);

        const idSecondPlayer = rooms[indexRoom][0];

        ws.bsidEnemy = idSecondPlayer;
        const websocketSecondPlayer = idsWs.get(idSecondPlayer);

        if (websocketSecondPlayer) {
          websocketSecondPlayer.bsidEnemy = idfirstPlayer;
        }

        createGame(
          indexRoom,
          idSecondPlayer,
          websocketSecondPlayer as MyWebSocket
        );

        [idfirstPlayer, idSecondPlayer].forEach((item) => {
          listWaitedPlayers.delete(item);
          listWaitedRooms.delete(item);
        });

        const listAccessibleRooms = Array.from(listWaitedRooms.values());
        updateRoom(listAccessibleRooms);
      }

      break;

    case "add_ships":
      if (ws.bsSinglePlay) {
        singlePlayAddShips(parsedData, ws);
      } else {
        let { gameId, ships, indexPlayer } = parsedData;
        const parsedShips = parseShipField(ships);
        players[indexPlayer].parsedShips = parsedShips;

        if (rooms[gameId].length === 3) {
          rooms[gameId].pop();
          ws.bsShips = ships;

          players[indexPlayer].ships = ships;
          const websocketFirstPlayer = ws;

          startGame(ships, indexPlayer, websocketFirstPlayer);

          const enemyId = websocketFirstPlayer.bsidEnemy as number;
          const websocketSecondPlayer = idsWs.get(enemyId) as MyWebSocket;

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
          rooms[gameId].push(-1);
          players[indexPlayer].ships = ships;
          ws.bsShips = ships;
        }
      }

      break;

    case "attack":
      if (ws.bsSinglePlay) {
        singlePlayAttack(parsedData, ws);
      } else parsingAttack(parsedData, ws);

      break;

    case "randomAttack":
      const { gameId: indexGame, indexPlayer: currentPlayer } = parsedData;
      const positionRandomAttack = getPositionRandomAttack(
        indexGame,
        currentPlayer
      );
      const data = {
        ...positionRandomAttack,
        gameId: indexGame,
        indexPlayer: currentPlayer,
      };

      parsingAttack(data, ws);
      break;

    case "single_play":
      rooms.push([idPlayer, ws.bsid]);
      ws.bsidEnemy = idPlayer;

      ws.bsSinglePlay = true;

      players[idPlayer] = {
        name: `bot${idPlayer}`,
        ships: [],
        shooted: [],
        parsedShips: [],
        killedShips: 9,
        wins: 0,
        enemy: 0,
      };
      players[idPlayer].enemy = ws.bsid;
      singlePlay(idGame, ws);

      idPlayer++;
      idGame++;
      break;

    default:
      console.log("default: ", message.toString());

      break;
  }
}
