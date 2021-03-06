import { Vector3 } from "./math";
import Entity3d from "./entity";

export class Particle<T> extends Entity3d
{
  private _lifetime:number;
  public get lifetime() { return this._lifetime; }
  public age:number;
  public normalizedAge:number;
  public data:T|undefined;

  constructor(pos:Vector3, velocity:Vector3, lifetime:number) {
    super(pos, velocity);
    this._lifetime = lifetime;
    this.age = this.normalizedAge = 0;
  }

  updateAge(dt:number) {
    this.age += dt;
    this.normalizedAge = Math.min(1, this.age / this._lifetime);
    return this.age < this._lifetime;
  }
}

export default Particle;