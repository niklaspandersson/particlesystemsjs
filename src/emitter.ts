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
  sequence?: number[];
  strategy: "random" | "periodic" | "sequence";
  lifetime?: number;
  particles: { 
    initialPos: Vec2d<number|NumRange>|(() => Vec2d<number>); 
    initialVelocity: Vec2d<number|NumRange>|(() => Vec2d<number>);
    lifetime: number|NumRange|NumberFactory;
    customDataFactory?:(p:Particle<T>)=>T;
  }
}

export class ParticleEmitter<T> {
  private _initialPositionFactory: Vec2dFactory;
  private _initlalVelocityFactory: Vec2dFactory;
  private _particleLifetimeFactory: NumberFactory;
  private _customDataFactory:((p:Particle<T>)=>T)|undefined;
  private counter:(dt:number) => number;
  private _age:number;
  private _lifetime:number;
  public get isAlive() { return this._age < this._lifetime; }

  constructor(opts:ParticleEmitterOptions<T>) {
    this._age = 0;
    this._lifetime = opts.lifetime || Infinity;
    this._initialPositionFactory = CreateVec2dFactory(opts.particles.initialPos);
    this._initlalVelocityFactory = CreateVec2dFactory(opts.particles.initialVelocity);
    this._particleLifetimeFactory = CreateNumberFactory(opts.particles.lifetime);
    this._customDataFactory = opts.particles.customDataFactory;

    this.counter = CreateCounter(opts.strategy, opts);
  }

  init(initialCount:number) {
    return Array(initialCount).fill(null).map(_ => this.createParticle());
  }
  onUpdate(dt:number) {
    this._age += dt;
    const cnt = this.counter(dt);
    return cnt ? Array(cnt).fill(null).map(_ => this.createParticle()) : null;
  }

  private createParticle() {
    const result = new Particle<T>(new Vec2(this._initialPositionFactory()), new Vec2(this._initlalVelocityFactory()), this._particleLifetimeFactory());
    if(this._customDataFactory)
      result.data = this._customDataFactory(result);

    return result;
  }
}

function CreateCounter<T>(strategy:string, opts:ParticleEmitterOptions<T>) {
  switch(strategy.toLowerCase()) {
    case "random":
      return createRandomCounter(opts.particlesPerSecond);
    case "sequence":
      return createSequenceCounter(opts.sequence);
    case "periodic":
      return createPeriodicCounter(opts.particlesPerSecond);
    default:
      throw new Error(`unsupported emitter strategy: '${strategy}'`)
  }
}

function createSequenceCounter(sequence?:number[]) {
  if(!sequence?.length)
    throw new Error(`No sequence provided to emitter with sequence strategy`);

  let time = 0;
  let i = 0;
  return function(dt:number) {
    let result = 0;
    time += dt;
    while(time > sequence[i]) {
      if(++i >= sequence.length) {
        i = 0;
        time -= sequence[sequence.length-1];
      }
      else
        ++result;
    }

    return result;
  }
}

function createPeriodicCounter(particlesPerSecond:number) {
  let carry = 0;

  return function(dt:number) {
    const frac = particlesPerSecond*dt;
    const particles = frac + carry;
    const result = Math.floor(particles);
    carry = particles - result;
    return result;    
  }
}

function createRandomCounter(particlesPerSecond:number) {
  let carry = 0;
  return function(dt:number) {
    const fracMean = particlesPerSecond*dt;
    let instant = 0;
    do {
      instant = gaussian(fracMean, .8)
    } while(Math.abs(fracMean-instant) > fracMean)

    const particles = instant + carry;
    const result = Math.floor(particles);
    carry = particles - result;
    return result;
  }
}