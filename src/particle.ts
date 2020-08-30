import {Vec2, Vec2d } from "./math";
import Entity from "./entity";

export type ParticleOptions = { 
  initialPos: Vec2; 
  initialVelocity: Vec2;
  lifetime: number;
};

export class Particle<T> extends Entity
{
  private lifetime:number;
  public age:number;
  public normalizedAge:number;
  public userData:T|null;

  constructor(opts:ParticleOptions) {
    super(opts.initialPos, opts.initialVelocity);
    this.lifetime = opts.lifetime;
    this.age = this.normalizedAge = 0;
    this.userData = null;
  }

  update(forces:Vec2d<number>, dampening:number, dt:number) {
    this.velocity.addScaled(forces, dt);
    this.velocity.scale(dampening);
    this.position.addScaled(this.velocity, dt);
    this.age += dt;

    this.normalizedAge = Math.min(1, this.age / this.lifetime);
    return this.age < this.lifetime;
  }
}

export default Particle;