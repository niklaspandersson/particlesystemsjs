import {Vec2, Vec2d } from "./math";
import Entity from "./entity";

export class Particle<T> extends Entity
{
  private lifetime:number;
  public age:number;
  public normalizedAge:number;
  public data:T|undefined;

  constructor(pos:Vec2, velocity:Vec2, lifetime:number) {
    super(pos, velocity);
    this.lifetime = lifetime;
    this.age = this.normalizedAge = 0;
  }

  updateAge(dt:number) {
    this.age += dt;
    this.normalizedAge = Math.min(1, this.age / this.lifetime);
    return this.age < this.lifetime;
  }
}

export default Particle;