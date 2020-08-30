import { Vec2 } from "./math";

export class Entity {
  public position:Vec2;
  public velocity:Vec2;

  constructor(pos:Vec2, velocity:Vec2) {
    this.position = pos;
    this.velocity = velocity;
  }
}

export default Entity;