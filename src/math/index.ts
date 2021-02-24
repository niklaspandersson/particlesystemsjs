
export type Vec3<T> = {
  x:T;
  y:T;
  z:T;
}

export type Vec3Optional<T> = {
  x: T,
  y: T,
  z?: T
}

export function magnitude(value:Vec3<number>) {
  return Math.sqrt(value.x*value.x + value.y*value.y + value.z*value.z);
}
export function normalize(value:Vec3<number>) {
  const m = Math.sqrt(value.x*value.x + value.y*value.y + value.z*value.z);
  return { x: value.x/m, y: value.y/m, z: value.z/m }
}

export class Vector3 implements Vec3<number>
{
  public x: number;
  public y: number;
  public z: number;
  constructor(value:Vec3Optional<number> = {x: 0, y: 0, z: 0}) {
    this.x = value.x;
    this.y = value.y;
    this.z = value?.z || 0;
  }

  public add(rhs:Vec3Optional<number>) {
    this.x += rhs.x;
    this.y += rhs.y;
    this.z += (rhs?.z || 0);
    return this;
  }
  public addScaled(rhs:Vec3Optional<number>, scale:number) {
    this.x += rhs.x*scale;
    this.y += rhs.y*scale;
    this.z += (rhs?.z || 0)*scale;
    return this;
  }

  public scale(s:number) {
    this.x *= s;
    this.y *= s;
    this.z *= s;
  }
}

export type NumRange = {
  min: number,
  max: number
};

export { gaussian } from "./random";