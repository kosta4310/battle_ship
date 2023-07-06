export type Reg = {
  type: "reg";
  data: RegData;
  id: number;
};

export type RegData = {
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

type Player = {
  name: string;
  password: string;
  index: number;
};
