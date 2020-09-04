import { magnitude, normalize, Vec2d } from "../math";
import { random, randomize } from "../math/random";
import { ParticleSystem } from "../";
import { Sprites } from "./Sprites";

/**
 * @param vec A vector describing the general direction and speed of the particles
 * @param spread An angle in radians that define the spread of particles, centered at the vector `vec`
 * @param minSpeedFactor A factor that defines the lowest speed in relation to the vector `vec`
 */
export function CreateVec2FactoryFromVector(vec:Vec2d<number>, spread:number = 0, minSpeedFactor:number = 1) {
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

const scene = document.getElementById("scene") as HTMLCanvasElement;
const sprites = new Sprites("./sprites.png");

const Size = 2;
const Width = 12*Size;
const Height = 6*Size;

const halfWidth = Width/2;
const halfHeight = Height/2;

type ParticleUserData = {
  initialRotation: number,
  rotationSpeed: number,
  color: string
}
scene.addEventListener('click', ev => {
  const test = new ParticleSystem<ParticleUserData>({ 
    initialCount: 0,
    position: {x: ev.x, y: ev.y},
    forces: {
      gravity: {x: 0, y: 298},
      wind: { x: 60, y: 0}
    },
    emitter: {
      particlesPerSecond: 30,
      strategy: "random",
      particles: {
        //initialPos: {x: {min: -50, max: 50}, y: {min: -50, max: 50}},
        initialPos: {x: 0, y: 0},
        initialVelocity: CreateVec2FactoryFromVector({x: 0, y: -400}, Math.PI/5, .6),
        lifetime: {min: .5, max: 4},
        customDataFactory: init
      }
    }
  }, draw);
  
  test.start();
});

function init() {
  return {
    initialRotation: random({min:0, max: Math.PI*2}) * randomize([-1, 1]),
    rotationSpeed: random({min: .2, max: 2}),
    color: randomize(['orange', 'lightblue', 'green', 'red'])
  };
}

function draw(ps:ParticleSystem<ParticleUserData>, dt:number) {
  ///DRAWING
  let ctx = scene.getContext("2d")!;

  ctx.clearRect(0,0,scene.width, scene.height);
  let lastColor = "";
  ps.particles.forEach(function(p) {
    const userData = p.data!;

    ctx.save();
    ctx.globalAlpha = 1-p.normalizedAge;
    ctx.fillStyle = p.data?.color!;
    ctx.translate(ps.position.x + p.position.x, ps.position.y + p.position.y);
    ctx.rotate(userData.initialRotation + Math.PI*2*p.normalizedAge**2*userData.rotationSpeed)
    ctx.fillRect(-halfWidth, -halfHeight, halfWidth, halfHeight);
    //sprites.drawSprite(ctx, "Ring", 0, 0, p.normalizedAge);
    ctx.restore();
  });
}