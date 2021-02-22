
export type Vec2d<T> = {
  x:T;
  y:T;
}
export type Vec3d<T> = {
  x:T;
  y:T;
  z:T;
}
export function magnitude2d(value:Vec2d<number>) {
  return Math.sqrt(value.x*value.x + value.y*value.y);
}
export function normalize2d(value:Vec2d<number>) {
  const m = Math.sqrt(value.x*value.x + value.y*value.y);
  return { x: value.x/m, y: value.y/m }
}

export function magnitude3d(value:Vec3d<number>) {
  return Math.sqrt(value.x*value.x + value.y*value.y + value.z*value.z);
}
export function normalize3d(value:Vec3d<number>) {
  const m = Math.sqrt(value.x*value.x + value.y*value.y + value.z*value.z);
  return { x: value.x/m, y: value.y/m, z: value.z/m }
}

export class Vec2 implements Vec2d<number>
{
  public x: number;
  public y: number;
  constructor({x = 0, y = 0} = {}) {
    this.x = x;
    this.y = y;
  }

  public add(rhs:Vec2d<number>) {
    this.x += rhs.x;
    this.y += rhs.y;
    return this;
  }
  public addScaled(rhs:Vec2d<number>, scale:number) {
    this.x += rhs.x*scale;
    this.y += rhs.y*scale;
    return this;
  }

  public scale(s:number) {
    this.x *= s;
    this.y *= s;
  }
}

export class Vec3 implements Vec3d<number>
{
  public x: number;
  public y: number;
  public z: number;
  constructor({x = 0, y = 0, z = 0} = {}) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  public add(rhs:Vec3d<number>) {
    this.x += rhs.x;
    this.y += rhs.y;
    this.z += rhs.z;
    return this;
  }
  public addScaled(rhs:Vec3d<number>, scale:number) {
    this.x += rhs.x*scale;
    this.y += rhs.y*scale;
    this.z += rhs.z*scale;
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