import gaussian from "./math/gaussian";

type Vec2d<T> = {
  x:T;
  y:T;
}

function magnitude(value:Vec2d<number>) {
  return Math.sqrt(value.x*value.x + value.y*value.y)
}
function normalize(value:Vec2d<number>) {
  const m = magnitude(value);
  return { x: value.x/m, y: value.y/m }
}

class Vec2 implements Vec2d<number>
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

class Entity 
{
  public pos:Vec2;
  public velocity:Vec2;

  constructor(pos:Vec2, velocity:Vec2) {
    this.pos = pos;
    this.velocity = velocity;
  }
}

export class Particle<T> extends Entity
{
  private lifetime:number;
  public age:number;
  public normalizedAge:number;
  public userData:T|null;

  constructor(options:ParticleOptions<T>&ParticleFactories) {
    super(new Vec2(options.createPosition()), new Vec2(options.createVelocity()));
    this.lifetime = options.createLifetime();
    this.age = this.normalizedAge = 0;
    this.userData = null;
  }

  update(forces:Vec2d<number>, dampening:number, dt:number) {
    this.velocity.addScaled(forces, dt);
    this.velocity.scale(dampening);
    this.pos.addScaled(this.velocity, dt);
    this.age += dt;

    this.normalizedAge = this.age / this.lifetime;
    return this.age < this.lifetime;
  }
}

type NumRange = {
  min: number,
  max: number
};

type ParticleFactories = {
  createPosition: () => Vec2d<number>
  createVelocity: () => Vec2d<number>
  createLifetime: () => number
};


type ParticleEmitterOptions = {
  particlesPerSecond: number;
  strategy: "random" | "periodical";
  lifetime?: number;
}

type ParticleOptions<T> = { 
  initialPos: Vec2d<number|NumRange>|(() => Vec2d<number>); 
  initialVelocity: Vec2d<number|NumRange>|(() => Vec2d<number>);
  lifetime?: number|NumRange|(() => number);
  compareFn?: (p1:Particle<T>, p2:Particle<T>)=>number;
};

type Vec2Dictionary = { [key:string]: Vec2d<number> };
type ParticleSystemOptions<T> = {
  initialCount: number;
  position: Vec2d<number>;
  forces:  Vec2Dictionary;
  dampening?: number;
  particle: ParticleOptions<T>;
  emitter?: ParticleEmitterOptions;
  onInit?: (ps:Particle<T>) => void;
  onUpdate?: (ps:ParticleSystem<T>, dt:number) => void;
}

const DefaultParticleLifetime = 3;

export function random({min, max}:NumRange) { return min + Math.random()*(max-min) };
export function randomize<T>(values:T[]) { return values[Math.floor(Math.random()*values.length)] };

function createNumberFactory(param:number|NumRange) {
  if(typeof param === 'number') {
    return function() { return param as number; }
  }
  else {
    return function() { return random(param as NumRange); }
  }    
}

/**
 * 
 * @param vec A vector describing the general direction and speed of the particles
 * @param spread An angle in radians that define the spread of particles, centered at the vector `vec`
 * @param minSpeedFactor A factor that defines the lowest speed in relation to the vector `vec`
 */
export function createFactoryFromVector(vec:Vec2d<number>, spread:number = 0, minSpeedFactor:number = 1) {
  const mag = magnitude(vec);
  const dir = normalize(vec);

  let angle = dir.x !== 0 ? Math.atan(dir.y / dir.x) : Math.PI/2;
  if(dir.y < 0)
    angle += Math.PI;

  const minAngle = angle - spread/2;
  const maxAngle = angle + spread/2;

  const minMag = mag*minSpeedFactor;

  return function() {
    const m = random({min: minMag, max: mag});
    const a = random({min: minAngle, max: maxAngle});
    return { x: Math.cos(a)*m, y: Math.sin(a)*m };
  }
}

function createVec2dFactory(src:Vec2d<number|NumRange>):()=>Vec2d<number> {
  const xFactory = createNumberFactory(src.x);
  const yFactory = createNumberFactory(src.y);

  return () => ({ x: xFactory(), y: yFactory() });
};


class ParticleEmitter<T> {
  private _opts: ParticleEmitterOptions;
  private _particleOpts:ParticleOptions<T>&ParticleFactories|null;
  constructor(opts:ParticleEmitterOptions) {
    this._opts = opts;
    this._particleOpts = null;
  }

  onInit(initialCount:number, particleOpts:ParticleOptions<T>&ParticleFactories) {
    this._particleOpts = particleOpts;
    return Array(initialCount).fill(null).map(_ => new Particle(particleOpts));
  }
  onUpdate(dt:number) {
    const cnt = this.randomParticleCount(dt);
    return cnt ? Array(cnt).fill(null).map(_ => new Particle(this._particleOpts!)) : null;
  }

  private randomParticleCount(dt:number) {
    const fracMean = this._opts.particlesPerSecond*dt;
    let instant = 0;
    do {
      instant = gaussian(fracMean, .8)
    } while(Math.abs(fracMean-instant) > fracMean)

    return Math.round(instant);
  }
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

    const DefaultEmitterOptions:ParticleEmitterOptions = {
      particlesPerSecond: 20,
      strategy: "random",
      lifetime: Infinity
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