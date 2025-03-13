import { Vector3 } from "./math";

class Entity<T>
{
  public position:T;
  public velocity:T;

  constructor(pos:T, velocity:T) {
    this.position = pos;
    this.velocity = velocity;
  }
}

export class Entity3d extends Entity<Vector3> {};

export default Entity3d;