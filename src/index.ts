const DefaultParticleLifetime = 3;

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


