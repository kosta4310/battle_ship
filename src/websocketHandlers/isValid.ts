import { MyWebSocket } from "../types/types";

export function isValidInputData(
  name: string,
  password: string,
  idPlayer: number,
  ws: MyWebSocket
) {
  const regexName = /^[a-z]+[a-z0-9]+$/g;
  const regexPassword = /^[a-z]+[\w\d]+$/g;

  if (regexName.test(name) && regexPassword.test(password)) {
    return true;
  } else {
    const responseData = {
      name: name,
      index: idPlayer,
      error: true,
      errorText: "Invalid input data",
    };
    const stringifiedData = JSON.stringify(responseData);
    const response = JSON.stringify({
      type: "reg",
      data: stringifiedData,
      id: 0,
    });
    ws.send(response);
    console.log(`response from server: ${response}`);
    return false;
  }
}
