import { Vec2d, Vec2 } from "./math";
import Particle from "./particle";
import {ParticleEmitter, ParticleEmitterOptions } from "./emitter";
import merge from "deepmerge";
type Vec2Dictionary = { [key:string]: Vec2d<number> };

export type ParticleSystemOptions<T> = {
  initialCount: number;
  initialAge?: () => number;
  position: Vec2d<number>;
  forces?:  Vec2Dictionary;
  emitter: ParticleEmitterOptions<T>;
}

const DefaultPSOptions:ParticleSystemOptions<never> = {
  initialCount: 0,
  position: { x: 0, y: 0 },
  emitter: {
    particlesPerSecond: 40,
    strategy: "random",
    particles: {
      initialPos: { x: {min: -10, max: 10}, y: 0 },
      initialVelocity: { x: 0, y: {max: -10, min: -100} },
      lifetime: 3
    }
  }
}

export class ParticleSystem<T = any>
{
  private _emitter:ParticleEmitter<T>;

  private _particles:Particle<T>[];
  public get particles() { return this._particles; }

  private _pos:Vec2d<number>;
  public get position() { return this._pos; }

  private draw: (ps:ParticleSystem<T>, dt:number) => void;
  private update: (dt:number)=>void;

  private _forces:Vec2Dictionary|undefined;
  private _dampening:number;

  constructor(options:Partial<ParticleSystemOptions<T>>, drawCallback:(ps:ParticleSystem<T>, dt:number)=>void) {

    const opts = merge(DefaultPSOptions, options);

    this._forces = opts.forces;
    this.update = (!!this._forces) ? this.updatePhysics.bind(this) : this.updateStatic.bind(this);
    this._pos = opts.position;
    this._dampening = 1;
    this.draw = drawCallback;

    this._emitter = new ParticleEmitter<T>(opts.emitter);
    this._particles = this._emitter.init(opts.initialCount);
    if(!!opts.initialAge) {
      this._particles.forEach(p => p.updateAge(opts.initialAge()*p.lifetime));
    }

    this.onAnimationFrame = this.onAnimationFrame.bind(this);
  }

  private lastTime: DOMHighResTimeStamp = 0;
  private animationFrameId: number|null = null;

  public start() {
    if(!this.animationFrameId)
      this.animationFrameId = window.requestAnimationFrame(t => {
        this.lastTime = t;
        this.animationFrameId = window.requestAnimationFrame(this.onAnimationFrame);
      });
  }

  public stop() {
    if(this.animationFrameId) 
      window.cancelAnimationFrame(this.animationFrameId);
    this.animationFrameId = null;
  }

  private onAnimationFrame(time:DOMHighResTimeStamp) {
    const dt = (time - this.lastTime) / 1000;
    this.lastTime = time;

    const newParticles = this._emitter.isAlive && this._emitter.onUpdate(dt);
    if(newParticles) 
      this.particles.push(...newParticles);
  
    this.update(dt);

    this.draw(this, dt);

    this.animationFrameId = window.requestAnimationFrame(this.onAnimationFrame);
    
    if(!this._emitter.isAlive && !this.particles.length)
      this.stop();
  }

  private updatePhysics(deltaTime:number) {
    let forces = new Vec2();
    for(const f in this._forces)
      forces.add(this._forces[f]);

    const ctx = { forces, dampening: this._dampening, deltaTime };
    this._particles = this._particles.filter(upPhysics, ctx);
  }
  private updateStatic(deltaTime:number) {
    const ctx = { deltaTime };
    this._particles = this._particles.filter(upStatic, ctx);
  }
}

function upStatic<T>(this:{deltaTime:number}, p:Particle<T>) {
  p.position.addScaled(p.velocity, this.deltaTime);
  return p.updateAge(this.deltaTime);
}

function upPhysics<T>(this:{forces:Vec2, dampening:number, deltaTime:number}, p:Particle<T>) {
  p.velocity.addScaled(this.forces, this.deltaTime);
  p.velocity.scale(this.dampening);
  p.position.addScaled(p.velocity, this.deltaTime);
  return p.updateAge(this.deltaTime);
}
