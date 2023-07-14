export type Ship = {
  position: { x: number; y: number };
  direction: boolean;
  type: string;
  length: number;
  left: number;
};

export function parseShipField(ships: Array<Ship>) {
  ships.forEach((ship) => (ship.left = ship.length));
  const parsedShips = ships.reduce((acc: Array<Array<string>>, curr) => {
    const arrayShip = [];
    const { x, y } = curr.position;
    if (curr.direction) {
      for (let i = 0, yy = y; i < curr.length; i++, yy++) {
        const element = "" + x + yy;
        arrayShip.push(element);
      }
    } else {
      for (let i = 0, xx = x; i < curr.length; i++, xx++) {
        const element = "" + xx + y;
        arrayShip.push(element);
      }
    }
    return [...acc, arrayShip];
  }, []);

  return parsedShips;
}
