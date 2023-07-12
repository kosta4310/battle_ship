import { WebSocket } from "ws";

// export type Reg = {
//   type: "reg";
//   data: RegData;
//   id: number;
// };

type RegData = {
  name: string;
  index: number;
  error: boolean;
  errorText: string;
};

export type MessageFromClient = {
  type: string;
  data: string;
  id: number;
};

export type UsersData = {
  name: string;
  password: string;
  index: number;
  idGame: number;
};

export type Player = {
  ships: Array<any>;
  shooted: Array<string>;
  parsedShips: Array<Array<string>>;
  killedShips: number;
  wins: number;
  name: string;
  password?: string;
  enemy?: number;
};

export interface MyWebSocket extends WebSocket {
  bsSinglePlay: boolean;
  bsidEnemy: number | null;
  bsid: number;
  bsidRoom: number;
  bsidGame: number;
  bsname: string;
  bspassword: string;
  bsShips: Array<any>;
}
