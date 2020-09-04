import Particle from "./particle";
import {gaussian, Vec2d, NumRange, Vec2 } from "./math";
import { random } from "./math/random";

type NumberFactory = () => number;
type Vec2dFactory = () => Vec2d<number>;

function CreateVec2dFactory(param:Vec2d<number|NumRange>|Vec2dFactory) {
  if(typeof param === "function")
    return param;

  const xFactory = CreateNumberFactory(param.x);
  const yFactory = CreateNumberFactory(param.y);

  return () => ({ x: xFactory(), y: yFactory() });
};

function CreateNumberFactory(param:number|NumRange|NumberFactory) {
  const obj:Object = param;
  if(typeof obj === "function")
    return obj as NumberFactory;
  else if(typeof obj === 'number') {
    return function() { return obj as number; }
  }
  else if(obj.hasOwnProperty("min") && obj.hasOwnProperty("max")) {
    return function() { return random(param as NumRange); }
  }
  
  throw new Error("Invalid parameter");
}

export type ParticleEmitterOptions<T> = {
  particlesPerSecond: number;
  strategy: "random" | "periodical";
  lifetime?: number;
  particles: { 
    initialPos: Vec2d<number|NumRange>|(() => Vec2d<number>); 
    initialVelocity: Vec2d<number|NumRange>|(() => Vec2d<number>);
    lifetime: number|NumRange|NumberFactory;
    customDataFactory?:(p:Particle<T>)=>T;
  }
}

export class ParticleEmitter<T> {
  private _opts: ParticleEmitterOptions<T>;
  private _initialPositionFactory: Vec2dFactory;
  private _initlalVelocityFactory: Vec2dFactory;
  private _particleLifetimeFactory: NumberFactory;
  private _customDataFactory:((p:Particle<T>)=>T)|undefined;

  constructor(opts:ParticleEmitterOptions<T>) {
    this._opts = opts;

    this._initialPositionFactory = CreateVec2dFactory(opts.particles.initialPos);
    this._initlalVelocityFactory = CreateVec2dFactory(opts.particles.initialVelocity);
    this._particleLifetimeFactory = CreateNumberFactory(opts.particles.lifetime);
    this._customDataFactory = opts.particles.customDataFactory;
  }

  init(initialCount:number) {
    return Array(initialCount).fill(null).map(_ => this.createParticle());
  }
  onUpdate(dt:number) {
    const cnt = this.randomParticleCount(dt);
    return cnt ? Array(cnt).fill(null).map(_ => this.createParticle()) : null;
  }

  private createParticle() {
    const result = new Particle<T>(new Vec2(this._initialPositionFactory()), new Vec2(this._initlalVelocityFactory()), this._particleLifetimeFactory());
    if(this._customDataFactory)
      result.data = this._customDataFactory(result);

    return result;
  }

  //private _randomCarry = 0;
  private randomParticleCount(dt:number) {
    const fracMean = this._opts.particlesPerSecond*dt;
    let instant = 0;
    do {
      instant = gaussian(fracMean, .8)
    } while(Math.abs(fracMean-instant) > fracMean)

    return Math.round(instant);
  }
}