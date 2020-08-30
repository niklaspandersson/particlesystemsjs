import { Vec2d, NumRange } from "./math";
import Particle from "./particle";
import ParticleEmitter from "./emitter";

type Vec2Dictionary = { [key:string]: Vec2d<number> };

type ParticleOptions = { 
  initialPos: Vec2d<number|NumRange>|(() => Vec2d<number>); 
  initialVelocity: Vec2d<number|NumRange>|(() => Vec2d<number>);
  lifetime?: number|NumRange|(() => number);
}

export type ParticleSystemOptions<T> = {
  initialCount: number;
  position: Vec2d<number>;
  forces:  Vec2Dictionary;
  dampening?: number;
  particles: ParticleOptions;
  emitter?: ParticleEmitterOptions;
  onInit?: (ps:Particle<T>) => void;
  onUpdate?: (ps:ParticleSystem<T>, dt:number) => void;
}

export class ParticleSystem<T>
{
  private _emitter:ParticleEmitter<T>;
  private _particles:Particle<T>[];
  public get particles() { return this._particles; }

  private _pos:Vec2d<number>;
  public get pos() { return this._pos; }

  private onUpdate: (ps:ParticleSystem<T>, dt:number) => void;
  private onInit: (ps:Particle<T>) => void;

  private forces:Vec2Dictionary;
  private dampening:number;

  constructor(options:Partial<ParticleSystemOptions<T>>) {
    const DefaultPSOptions:ParticleSystemOptions<T> = {
      initialCount: 20,
      position: { x: 0, y: 0},
      forces: {
        //gravity: { x: 0, y: -9.8 }
      },
      dampening: 1,
      particle: {
        initialPos: { x: {min: -10, max: 10}, y: 0 },
        initialVelocity: { x: 0, y: {max: -10, min: -100} }
      }
    }

    const opts = {...DefaultPSOptions,...options};

    this.forces = opts.forces;
    this._pos = opts.position;
    this.dampening = opts.dampening || 1;
    this.onUpdate = opts.onUpdate || (() => {});
    this.onInit = opts.onInit || (() => {});

    const factories:ParticleFactories = {
      createPosition: (typeof opts.particle.initialPos === 'function') 
        ? opts.particle.initialPos 
        : createVec2dFactory(opts.particle.initialPos),

      createVelocity: (typeof opts.particle.initialVelocity === 'function') 
        ? opts.particle.initialVelocity 
        : createVec2dFactory(opts.particle.initialVelocity),

      createLifetime: (typeof opts.particle.lifetime === 'function') 
        ? opts.particle.lifetime 
        : createNumberFactory(opts.particle.lifetime || DefaultParticleLifetime)
    }
    const particleOptions = {...opts.particle, ...factories};

    this._emitter = new ParticleEmitter<T>({...DefaultEmitterOptions, ...opts.emitter});
    
    this._particles = this._emitter.onInit(opts.initialCount, particleOptions);
    for(const p of this._particles) 
      this.onInit(p);

    if(opts.particle?.compareFn)
      this._particles = this.particles.sort(opts.particle.compareFn);

    this.doStart = this.doStart.bind(this); 
    this.doUpdate = this.doUpdate.bind(this);
  }

  private lastTime: DOMHighResTimeStamp = 0;
  private animationFrameId: number|null = null;

  public start() {
    if(!this.animationFrameId)
      this.animationFrameId = window.requestAnimationFrame(this.doStart);
  }
  public stop() {
    if(this.animationFrameId) 
      window.cancelAnimationFrame(this.animationFrameId);
    this.animationFrameId = null;
  }

  private doStart(time:DOMHighResTimeStamp) {
    this.lastTime = time;
    this.animationFrameId = window.requestAnimationFrame(this.doUpdate);
  }

  private doUpdate(time:DOMHighResTimeStamp) {
    const dt = (time - this.lastTime) / 1000;
    this.lastTime = time;

    const newParticles = this._emitter.onUpdate(dt);
    if(newParticles) {
      for(const p of newParticles) 
        this.onInit(p);      
        
      this.particles.push(...newParticles);
    }
  
    this.update(dt);

    this.onUpdate(this, dt);
    this.animationFrameId = window.requestAnimationFrame(this.doUpdate);
  }

  private update(deltaTime:number) {
    let forces = new Vec2();
    for(const f in this.forces)
      forces.add(this.forces[f]);

    const ctx = { forces, dampening: this.dampening, deltaTime };

    this._particles = this._particles.filter(up, ctx);
  }
}

function up<T>(this:{forces:Vec2, dampening:number, deltaTime:number}, p:Particle<T>) {
  return p.update(this.forces, this.dampening, this.deltaTime);
}