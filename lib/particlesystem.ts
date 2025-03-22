import { Vector3, Vec3, Vec3Optional } from "./math";
import Particle from "./particle";
import { ParticleEmitter, ParticleEmitterOptions } from "./emitter";
import merge from "deepmerge";
type Vec3Dictionary = { [key: string]: Vec3<number> };

export type ParticleSystemOptions<T> = {
  initialCount: number;
  initialAge?: () => number;
  position: Vec3Optional<number>;
  forces?: Vec3Dictionary;
  emitter: ParticleEmitterOptions<T>;
}

const DefaultPSOptions: ParticleSystemOptions<never> = {
  initialCount: 0,
  position: { x: 0, y: 0 },
  emitter: {
    particlesPerSecond: 40,
    strategy: "random",
    particles: {
      initialPos: { x: { min: -10, max: 10 }, y: 0 },
      initialVelocity: { x: 0, y: { max: -10, min: -100 } },
      lifetime: 3,
      scale: { x: 1, y: 1 },
      color: { r: 1, g: 1, b: 0, a: 1 },
    }
  }
}

export class ParticleSystem<T = any> {
  #options: ParticleSystemOptions<T>;
  public get options() { return this.#options; }

  private _eventTarget = new EventTarget();

  private _emitter: ParticleEmitter<T>;
  public get emitter() { return this._emitter; }

  private _particles: Particle<T>[];
  public get particles() { return this._particles; }

  private _pos: Vec3<number>;
  public get position() { return this._pos; }

  private draw: (ps: ParticleSystem<T>, dt: number) => void;
  private update: (dt: number) => void;

  private _forces: Vec3<number>[] | undefined;
  private _dampening: number;

  constructor(options: Partial<ParticleSystemOptions<T>>, drawCallback: (ps: ParticleSystem<T>, dt: number) => void) {

    const opts = merge(DefaultPSOptions, options);
    this.#options = opts;

    this._forces = opts.forces ? Object.values(opts.forces) : undefined;
    this.update = (!!this._forces) ? this.updatePhysics.bind(this) : this.updateStatic.bind(this);
    this._pos = { z: 0, ...opts.position };
    this._dampening = 1;
    this.draw = drawCallback;

    this._emitter = new ParticleEmitter<T>(opts.emitter);
    this._particles = this._emitter.init(opts.initialCount);
    if (!!opts.initialAge) {
      this._particles.forEach(p => p.updateAge(opts.initialAge() * p.lifetime));
    }

    this.onAnimationFrame = this.onAnimationFrame.bind(this);
  }

  private lastTime: DOMHighResTimeStamp = 0;
  private animationFrameId: number | null = null;

  public start() {
    if (!this.animationFrameId)
      this.animationFrameId = window.requestAnimationFrame(t => {
        this.lastTime = t;
        this.animationFrameId = window.requestAnimationFrame(this.onAnimationFrame);
      });
  }

  public stop() {
    if (this.animationFrameId)
      window.cancelAnimationFrame(this.animationFrameId);
    this.animationFrameId = null;
    this._eventTarget.dispatchEvent(new Event("stop"));
  }

  private onAnimationFrame(time: DOMHighResTimeStamp) {
    const dt = (time - this.lastTime) / 1000;
    this.lastTime = time;

    const newParticles = this._emitter.isAlive && this._emitter.onUpdate(dt);
    if (newParticles)
      this.particles.push(...newParticles);

    this.update(dt);

    this.draw(this, dt);

    this.animationFrameId = window.requestAnimationFrame(this.onAnimationFrame);

    if (!this._emitter.isAlive && !this.particles.length)
      this.stop();
  }

  private updatePhysics(deltaTime: number) {
    let forces = this._forces?.reduce<Vector3>((sum, f) => sum.add(f), new Vector3());

    const ctx = { forces, dampening: this._dampening, deltaTime };
    this._particles = this._particles.filter(updatePhysics, ctx);
  }
  private updateStatic(deltaTime: number) {
    const ctx = { deltaTime };
    this._particles = this._particles.filter(updateStatic, ctx);
  }

  //event target helpers
  addEventListener(type: string, listener: EventListener | EventListenerObject | null, options?: AddEventListenerOptions | boolean) {
    this._eventTarget.addEventListener(type, listener, options);
  }
  on(type: string, listener: EventListener | EventListenerObject | null) {
    this._eventTarget.addEventListener(type, listener);
  }
  once(type: string, listener: EventListener | EventListenerObject | null) {
    this._eventTarget.addEventListener(type, listener, { once: true });
  }

  removeEventListener(type: string, listener: EventListener | EventListenerObject | null, options?: AddEventListenerOptions | boolean) {
    this._eventTarget.removeEventListener(type, listener, options);
  }
  off(type: string, listener: EventListener | EventListenerObject | null) {
    this._eventTarget.removeEventListener(type, listener);
  }
}

function updateStatic<T>(this: { deltaTime: number }, p: Particle<T>) {
  p.position.addScaled(p.velocity, this.deltaTime);
  return p.updateAge(this.deltaTime);
}

function updatePhysics<T>(this: { forces: Vector3, dampening: number, deltaTime: number }, p: Particle<T>) {
  p.velocity.addScaled(this.forces, this.deltaTime);
  p.velocity.scale(this.dampening);
  p.position.addScaled(p.velocity, this.deltaTime);
  return p.updateAge(this.deltaTime);
}
