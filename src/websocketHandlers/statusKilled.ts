import { StatusAttack } from "./statusAttack";

export function statusKilled(
  ship: Array<string>
): Map<{ x: number; y: number }, StatusAttack> {
  const mappedKilledShip = new Map<{ x: number; y: number }, StatusAttack>();
  const setPositions = new Set<{ x: number; y: number }>();
  ship.forEach((pos) => {
    const x = +pos.substring(0, 1);
    const y = +pos.substring(1, 2);

    for (let i = -1; i < 2; i++) {
      for (let j = -1; j < 2; j++) {
        let xx = x + i;
        let yy = y + j;
        if (xx < 0) xx = 0;
        if (yy < 0) yy = 0;
        if (xx > 9) xx = 9;
        if (yy > 9) yy = 9;

        setPositions.add({ x: xx, y: yy });
      }
    }
  });
  for (const position of setPositions.keys()) {
    const stringifiedPosition = "" + position.x + position.y;

    if (ship.includes(stringifiedPosition)) {
      mappedKilledShip.set(position, StatusAttack.Killed);
    } else mappedKilledShip.set(position, StatusAttack.Miss);
  }

  return mappedKilledShip;
}
