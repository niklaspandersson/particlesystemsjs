import { Vec3Optional, Vector3 } from "./math";
import Entity3d from "./entity";

export type Color<T> = { r: T, g: T, b: T, a: T };

export class Particle<T> extends Entity3d {
  private _lifetime: number;
  public get lifetime() { return this._lifetime; }
  public initialRotation: number;
  public rotationSpeed: number;
  public scale: Vec3Optional<number>;
  public color: Color<number>;
  public age: number;
  public normalizedAge: number;
  public data: T | undefined;

  constructor(pos: Vector3, velocity: Vector3, lifetime: number, initialRotation: number = 0, rotationSpeed: number = 0, scale: Vec3Optional<number> = { x: 1, y: 1, z: 1 }, color: Color<number> = { r: 0, g: 0, b: 1, a: 1 }) {
    super(pos, velocity);
    this.initialRotation = initialRotation;
    this.rotationSpeed = rotationSpeed;
    this.scale = scale;
    this.color = color;
    this._lifetime = lifetime;
    this.age = this.normalizedAge = 0;
  }

  updateAge(dt: number) {
    this.age += dt;
    this.normalizedAge = Math.min(1, this.age / this._lifetime);
    return this.age < this._lifetime;
  }
}

export default Particle;