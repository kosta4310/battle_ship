import { Ship } from "./parseShipField";
import { statusKilled } from "./statusKilled";

export enum StatusAttack {
  Miss = "miss",
  Killed = "killed",
  Shot = "shot",
}

export function statusAttack({
  x,
  y,
  ships,
  parsedShips,
}: {
  x: number;
  y: number;
  ships: Array<Ship>;
  parsedShips: Array<Array<string>>;
}): Array<
  StatusAttack | Map<{ x: number; y: number }, StatusAttack> | undefined
> {
  let responseStatus = StatusAttack.Miss;
  let killedShipWhithEmptyCell;
  parsedShips.some((ship, i) => {
    if (ship.includes("" + x + y)) {
      if (ships[i].left === 1) {
        ships[i].left = 0;
        responseStatus = StatusAttack.Killed;
        killedShipWhithEmptyCell = statusKilled(parsedShips[i]);
      } else {
        ships[i].left--;
        responseStatus = StatusAttack.Shot;
      }
      return true;
    }
    return false;
  });
  return [responseStatus, killedShipWhithEmptyCell];
}
