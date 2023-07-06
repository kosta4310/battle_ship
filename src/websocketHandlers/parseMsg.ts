import { RawData, WebSocket } from "ws";
import { MessageFromClient } from "../types/types";
import { createPlayer, createGame, updateRoom } from "./methods";

export type UsersData = {
  name: string;
  password: string;
  index: number;
  idGame: number;
};

type Ships = {
  [idGame: string]: Array<{
    idPlayer: Array<any>;
  }>;
};

type Rooms = Array<Array<number>>;

export const db = new Map<WebSocket, UsersData>();
const rooms: Rooms = [[]];
const ships: Ships = {};
const idsWs = new Map<number, WebSocket>();

let idPlayer = 0;
let idGame = 0;

export function parseMsg(message: RawData, ws: WebSocket) {
  console.log("message from client: %s", message.toString());

  const { type, data, id }: MessageFromClient = JSON.parse(message.toString());
  const parsedData = data ? JSON.parse(data) : "";
  let response, responseData;

  console.log(`idPlayer ${idPlayer} idGame ${idGame}`);

  switch (type) {
    case "reg":
      const { name, password } = parsedData;
      idsWs.set(idPlayer, ws);
      createPlayer(idPlayer, name, password, ws);
      // db.set(ws, {
      //   name,
      //   password,
      //   index: idPlayer,
      //   idGame: 0,
      // });

      // responseData = {
      //   name: parsedData.name,
      //   index: idPlayer++,
      //   error: false,
      //   errorText: "something",
      // };
      // const stringifiedData = JSON.stringify(responseData);
      // response = JSON.stringify({
      //   type: "reg",
      //   data: stringifiedData,
      //   id: 0,
      // });
      // ws.send(response);

      idPlayer++;
      break;

    case "create_room":
      idPlayer = db.get(ws)?.index as number;
      rooms[idGame].push(idPlayer);
      updateRoom(
        idGame,
        db.get(ws)?.name as string,
        db.get(ws)?.index as number,
        ws
      );
      // createGame(idGame, idPlayer, ws);
      idGame++;

      break;

    case "add_user_to_room":
      const { indexRoom } = parsedData;
      // responseData = JSON.stringify({
      //   idGame: indexRoom,
      //   idPlayer: db.get(ws)?.index,
      // });
      // response = JSON.stringify({
      //   type: "create_game",
      //   data: responseData,
      //   id: 0,
      // });
      if (rooms[indexRoom].length === 1) {
        rooms[indexRoom].push(db.get(ws)?.index as number);
        createGame(indexRoom, db.get(ws)?.index as number, ws);
        const idSecondPlayer = rooms[indexRoom][0];
        const websockerSecondPlayer = idsWs.get(idSecondPlayer);
        createGame(
          indexRoom,
          idSecondPlayer,
          websockerSecondPlayer as WebSocket
        );

        responseData = JSON.stringify([]);
        response = JSON.stringify({
          type: "update_room",
          data: responseData,
          // data: JSON.stringify([
          //   {
          //     roomId,
          //     roomUsers,
          //   },
          // ]),
          id: 0,
        });

        ws.send(response);
        websockerSecondPlayer?.send(response);
      }

      // const itr = db.keys();
      // for (const client of itr) {

      // client.send(response, () => {
      // const responseUpdateRoom = updateDataRoom(indexRoom, [
      // {
      //   name: db.get(ws)?.name as string,
      //   index: db.get(ws)?.index as number,
      // },
      // { name: "vasya", index: 5 },
      // ]);
      // ws.send(JSON.stringify(responseUpdateRoom));
      // });
      // }

      break;

    default:
      console.log(message.toString());

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
