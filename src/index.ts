type Vec2d<T> = {
  x:T;
  y:T;
}

type Color = string | { r: number, g: number, b: number } | number;

class Vec2
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

class Particle extends Entity
{
  private lifetime:number;
  public age:number;
  public normalizedAge:number;
  public userData:any;

  constructor(options:ParticleOptions&ParticleFactories) {
    super(new Vec2(options.createPosition()), new Vec2(options.createVelocity()));
    this.lifetime = options.createLifetime();
    this.age = this.normalizedAge = 0;
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

type ParticleOptions = { 
  initialPos: Vec2d<number|NumRange>|(() => Vec2d<number>); 
  initialVelocity: Vec2d<number|NumRange>|(() => Vec2d<number>);
  lifetime?: number|NumRange|(() => number);
};

type Vec2Dictionary = { [key:string]: Vec2d<number> };
type ParticleSystemOptions = {
  count: number;
  position: Vec2d<number>;
  particle: ParticleOptions;
  forces:  Vec2Dictionary,
  dampening?: number,
  onInit?: (ps:ParticleSystem) => void,
  onUpdate?: (ps:ParticleSystem, dt:number) => void
}

const DefaultParticleLifetime = 3;
const DefaultPSOptions:ParticleSystemOptions = {
  count: 20,
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

export function random({min, max}:NumRange) { return min + Math.random()*(max-min) };
export function randomize(values:any[]) { return values[Math.floor(Math.random()*values.length)] };

function createNumberFactory(param:number|NumRange) {
  if(typeof param === 'number') {
    return function() { return param as number; }
  }
  else {
    return function() { return random(param as NumRange); }
  }    
}

function createValueFactory(key:"x"|"y", vec:Vec2d<number|NumRange>) {
  return createNumberFactory(vec[key]);  
}

function createVec2dFactory(src:Vec2d<number|NumRange>):()=>Vec2d<number> {
  const xFactory = createValueFactory("x", src);
  const yFactory = createValueFactory("y", src);

  return function() {
    return { x: xFactory(), y: yFactory() };
  }
};

export class ParticleSystem
{
  private _particles:Particle[];
  public get particles() { return this._particles; }

  private _pos:Vec2d<number>;
  public get pos() { return this._pos; }

  private onUpdate: (ps:ParticleSystem, dt:number) => void;
  private onInit: (ps:ParticleSystem) => void;

  private forces:Vec2Dictionary;
  private dampening:number;

  constructor(options:Partial<ParticleSystemOptions>) {
    const opts = {...DefaultPSOptions, ...options};
    this.forces = opts.forces;
    this._pos = opts.position;
    this.dampening = opts.dampening || 1;
    this.onUpdate = opts.onUpdate || (() => {});
    this.onInit = opts.onInit || (() => {});

    const factories:ParticleFactories = {
      createPosition: (typeof opts.particle.initialPos === 'function') ? opts.particle.initialPos : createVec2dFactory(opts.particle.initialPos),
      createVelocity: (typeof opts.particle.initialVelocity === 'function') ? opts.particle.initialVelocity : createVec2dFactory(opts.particle.initialVelocity),
      createLifetime: (typeof opts.particle.lifetime === 'function') ? opts.particle.lifetime : createNumberFactory(opts.particle.lifetime || DefaultParticleLifetime)
    }
    const particleOptions = {...opts.particle, ...factories};
    
    this._particles = Array(opts.count).fill(null).map(_ => new Particle(particleOptions));

  }

  private lastTime: DOMHighResTimeStamp = 0;
  private onStart = (time:DOMHighResTimeStamp) => {
    this.lastTime = time;
    this.onInit(this);
    window.requestAnimationFrame(this.doUpdate);
  }

  public start() {
    window.requestAnimationFrame(this.onStart);
  }

  private doUpdate = (time:DOMHighResTimeStamp) => {
    const dt = (time - this.lastTime) / 1000;
    this.lastTime = time;
  
    this.update(dt);
    this.onUpdate(this, dt);
    window.requestAnimationFrame(this.doUpdate);
  }

  public update(dt:number) {
    let forces = new Vec2();
    for(const f in this.forces)
      forces.add(this.forces[f]);

    const up = (p:Particle) => {
      return p.update(forces, this.dampening, dt)
    }

    this._particles = this._particles.filter(up);
  }
}