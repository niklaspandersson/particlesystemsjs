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
  constructor(options:ParticleOptions&ParticleFactories) {
    super(new Vec2(options.createPosition()), new Vec2(options.createVelocity()));
  }

  update(forces:Vec2d<number>, dampening:number, dt:number) {
    this.velocity.addScaled(forces, dt);
    this.velocity.scale(dampening);
    this.pos.addScaled(this.velocity, dt);
  }
}

type NumRange = {
  min: number,
  max: number
};

type ParticleFactories = {
  createPosition: () => Vec2d<number>
  createVelocity: () => Vec2d<number>
};

type ParticleOptions = { 
  initialPos: Vec2d<number|NumRange>|(() => Vec2d<number>); 
  initialVelocity: Vec2d<number|NumRange>|(() => Vec2d<number>); 
  view: { 
    color?: Color; 
  }
};

type Vec2Dictionary = { [key:string]: Vec2d<number> };
type ParticleSystemOptions = {
  count: number;
  particle: ParticleOptions;
  forces:  Vec2Dictionary,
  dampening?: number
}

const DefaultPSOptions:ParticleSystemOptions = {
  count: 20,
  forces: {
    //gravity: { x: 0, y: -9.8 }
  },
  dampening: .9,
  particle: {
    initialPos: { x: {min: -10, max: 10}, y: 0 },
    initialVelocity: { x: 0, y: {max: -10, min: -100} },
    view: {
      color: "white"
    }
  }
}

function random({min, max}:NumRange) { return min + Math.random()*(max-min) };

function createValueFactory(key:"x"|"y", vec:Vec2d<number|NumRange>) {
  if(typeof vec[key] === 'number') {
    return function() { return vec[key] as number; }
  }
  else {
    return function() { return random(vec[key] as NumRange); }
  }    
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

  private forces:Vec2Dictionary;
  private dampening:number;

  constructor(options:Partial<ParticleSystemOptions>) {
    const opts = {...DefaultPSOptions, ...options};
    this.forces = opts.forces;
    this.dampening = opts.dampening || 1;

    const factories:ParticleFactories = {
      createPosition: (typeof opts.particle.initialPos === 'function') ? opts.particle.initialPos : createVec2dFactory(opts.particle.initialPos),
      createVelocity: (typeof opts.particle.initialVelocity === 'function') ? opts.particle.initialVelocity : createVec2dFactory(opts.particle.initialVelocity),
    }
    const particleOptions = {...opts.particle, ...factories};
    
    this._particles = Array(opts.count).fill(null).map(_ => new Particle(particleOptions));
  }

  public update(dt:number) {
    let forces = new Vec2();
    for(const f in this.forces)
      forces.add(this.forces[f]);

    for(const particle of this._particles)
      particle.update(forces, this.dampening, dt);
  }
}