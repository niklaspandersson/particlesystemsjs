import { Vec2 } from "./math";
import { Vec3 } from "./math";

class Entity<T>
{
  public position:T;
  public velocity:T;

  constructor(pos:T, velocity:T) {
    this.position = pos;
    this.velocity = velocity;
  }
}

export class Entity2d extends Entity<Vec2> {};
export class Entity3d extends Entity<Vec3> {};

export default Entity2d;