import { RawData, WebSocket } from "ws";
import { MessageFromClient } from "../types/types";
import {
  createPlayer,
  createGame,
  updateRoom,
  startGame,
  changePlayersTurn,
  attack,
} from "./methods";

export type UsersData = {
  name: string;
  password: string;
  index: number;
  idGame: number;
};

type Game = {
  [idGame: string]: Array<{
    [idPlayer: string]: Array<any>;
  }>;
}; /*Под индексом комнаты будет массив в котором будет обьект с полем 
idPlayer которому будет соответствовать массив кораблей*/

type Rooms = Array<
  Array<number>
>; /*Массив, в котором по индексу(индекс комнаты) находятся index игроков в этих комнатах*/

export const db = new Map<WebSocket, UsersData>();
const rooms: Rooms = [];
const game: Game = {};
const idsWs = new Map<number, WebSocket>();

let idPlayer = 0;
let idGame = 0;

export interface MyWebSocket extends WebSocket {
  idEnemy: number;
  id: number;
  idRoom: number;
  idGame: number;
}

export function parseMsg(message: RawData, ws: MyWebSocket) {
  console.log("message from client: %s", message.toString());

  const { type, data }: MessageFromClient = JSON.parse(message.toString());
  const parsedData = data ? JSON.parse(data) : "";
  let response, responseData;

  console.log(`idPlayer ${idPlayer} idGame ${idGame}`);

  switch (type) {
    case "reg":
      const { name, password } = parsedData;
      idsWs.set(idPlayer, ws);
      createPlayer(idPlayer, name, password, ws);

      idPlayer++;
      break;

    case "create_room":
      idPlayer = db.get(ws)?.index as number;
      rooms.push([idPlayer]);
      updateRoom(
        idGame,
        db.get(ws)?.name as string,
        db.get(ws)?.index as number,
        ws
      );

      idGame++;

      break;

    case "add_user_to_room":
      const { indexRoom } = parsedData;

      if (rooms[indexRoom].length === 1) {
        rooms[indexRoom].push(db.get(ws)?.index as number);
        console.log(`rooms: ${rooms}`);
        console.log(typeof rooms);

        createGame(indexRoom, db.get(ws)?.index as number, ws);
        const idSecondPlayer = rooms[indexRoom][0];
        const websocketSecondPlayer = idsWs.get(idSecondPlayer);
        createGame(
          indexRoom,
          idSecondPlayer,
          websocketSecondPlayer as WebSocket
        );

        responseData = JSON.stringify([]);
        response = JSON.stringify({
          type: "update_room",
          data: responseData,

          id: 0,
        });

        ws.send(response);
        websocketSecondPlayer?.send(response);
      }

      break;

    case "add_ships":
      let { gameId, ships, indexPlayer } = parsedData;
      if (game[gameId]) {
        game[gameId].push({ [indexPlayer]: ships });
        startGame(ships, indexPlayer, idsWs.get(indexPlayer) as WebSocket);
        const [indexSecondPlayer] = rooms[gameId].filter(
          (item) => item !== indexPlayer
        );
        let shipsSecondPlayer;
        game[gameId].forEach((item) => {
          if (item[indexSecondPlayer]) {
            shipsSecondPlayer = item[indexSecondPlayer];
          }
        });
        startGame(
          shipsSecondPlayer as unknown as Array<any>,
          indexSecondPlayer,
          idsWs.get(indexSecondPlayer) as WebSocket
        );
        // разыгрываем чей первый ход
        const lottery = Math.random() < 0.5 ? 0 : 1;
        const firstTurn = rooms[gameId][lottery];
        const arrayWebsockets = rooms[gameId].map((ind) => idsWs.get(ind));
        changePlayersTurn(firstTurn, arrayWebsockets as Array<WebSocket>);
      } else game[gameId] = [{ [indexPlayer]: ships }];

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
      attack({ x, y }, parsedData.indexPlayer, "shot", [secondWs, firstWs]);

      // responseData = JSON.stringify([]);
      // response = JSON.stringify({
      //   type: "update_room",
      //   data: responseData,

      //   id: 0,
      // });
      // firstWs.send(response);
      // secondWs.send(response);
      changePlayersTurn(indexSecondPlayer, [secondWs, firstWs]);
      break;

    // case "create_game":
    //   const {} = parsedData;
    //   ws.idEnemy =
    // break;

    default:
      console.log("default: ", message.toString());

      return "Error";
  }
}

export function updateDataRoom(
  roomId: number,
  roomUsers: Array<{
    name: string;
    index: number;
  }>
) {
  return {
    type: "update_room",
    data: JSON.stringify([
      {
        roomId,
        roomUsers,
      },
    ]),
    id: 0,
  };
}
