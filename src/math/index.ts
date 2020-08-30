
export type Vec2d<T> = {
  x:T;
  y:T;
}

export function magnitude(value:Vec2d<number>) {
  return Math.sqrt(value.x*value.x + value.y*value.y)
}
export function normalize(value:Vec2d<number>) {
  const m = magnitude(value);
  return { x: value.x/m, y: value.y/m }
}

export class Vec2 implements Vec2d<number>
{
  private data:number[] = [0, 0];
  constructor({x = 0, y = 0} = {}) {
    this.data[0] = x;
    this.data[1] = y;
  }

  public get x() {return this.data[0]; }
  public get y() {return this.data[1]; }

  public add(rhs:Vec2d<number>) {
    this.data[0] += rhs.x;
    this.data[1] += rhs.y;
    return this;
  }
  public addScaled(rhs:Vec2d<number>, scale:number) {
    this.data[0] += rhs.x*scale;
    this.data[1] += rhs.y*scale;
    return this;
  }

  public scale(s:number) {
    this.data[0] *= s;
    this.data[1] *= s;
  }
}

export type NumRange = {
  min: number,
  max: number
};