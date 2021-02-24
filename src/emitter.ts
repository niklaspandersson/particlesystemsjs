import Particle from "./particle";
import {gaussian, Vec3, NumRange, Vector3, Vec3Optional } from "./math";
import { random } from "./math/random";

type NumberFactory = (age?:number, pos?:Vec3<number>, vel?:Vec3<number>) => number;
type Vec3Factory = (age?:number, pos?:Vec3<number>, vel?:Vec3<number>) => Vec3Optional<number>;

function CreateVec3Factory(param:Vec3Optional<number|NumRange>|Vec3Factory) {
  if(typeof param === "function")
    return param;

  const xFactory = CreateNumberFactory(param.x);
  const yFactory = CreateNumberFactory(param.y);
  const zFactory = (typeof param.z !== "undefined") ? CreateNumberFactory(param.z) : undefined;

  return () => ({ x: xFactory(), y: yFactory(), z: zFactory?.() });
};

function CreateNumberFactory(param:number|NumRange|NumberFactory) {
  const obj:Object = param;
  if(typeof obj === "function")
    return obj as NumberFactory;
  else if(typeof obj === 'number') {
    return function() { return obj as number; }
  }
  else if(obj.hasOwnProperty("min") && obj.hasOwnProperty("max")) {
    return function() { return random(obj as NumRange); }
  }
  
  throw new Error("Invalid parameter");
}

export type ParticleEmitterOptions<T> = {
  particlesPerSecond: number;
  sequence?: number[];
  strategy: "random" | "periodic" | "sequence";
  lifetime?: number;
  particles: { 
    initialPos: Vec3Optional<number|NumRange>|Vec3Factory; 
    initialVelocity: Vec3Optional<number|NumRange>|Vec3Factory;
    lifetime: number|NumRange|NumberFactory;
    customDataFactory?:(p:Particle<T>, age?:number)=>T;
  }
}

export class ParticleEmitter<T> {
  private _initialPositionFactory: Vec3Factory;
  private _initialVelocityFactory: Vec3Factory;
  private _particleLifetimeFactory: NumberFactory;
  private _customDataFactory:((p:Particle<T>, age?:number)=>T)|undefined;
  private counter:(dt:number) => number;
  private _age:number;
  private _lifetime:number;
  public get isAlive() { return this._age < this._lifetime; }

  constructor(opts:ParticleEmitterOptions<T>) {
    this._age = 0;
    this._lifetime = opts.lifetime || Infinity;
    this._initialPositionFactory = CreateVec3Factory(opts.particles.initialPos);
    this._initialVelocityFactory = CreateVec3Factory(opts.particles.initialVelocity);
    this._particleLifetimeFactory = CreateNumberFactory(opts.particles.lifetime);
    this._customDataFactory = opts.particles.customDataFactory;

    this.counter = CreateCounter(opts.strategy, opts);
  }

  init(initialCount:number) {
    return Array(initialCount).fill(null).map(_ => this.createParticle(0));
  }
  onUpdate(dt:number) {
    this._age += dt;
    const cnt = this.counter(dt);
    return cnt ? Array(cnt).fill(null).map(_ => this.createParticle(this._age)) : null;
  }

  private createParticle(psAge:number) {
    const initialPosition = new Vector3(this._initialPositionFactory(psAge));
    const initialVelocity = new Vector3(this._initialVelocityFactory(psAge, initialPosition));
    const lifetime = this._particleLifetimeFactory(psAge, initialPosition, initialVelocity);
    const result = new Particle<T>(initialPosition, initialVelocity, lifetime);
    if(this._customDataFactory)
      result.data = this._customDataFactory(result, psAge);

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