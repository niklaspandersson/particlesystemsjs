import {ParticleSystem, random, randomize, createFactoryFromVector, Particle } from "../index";
import { Sprites } from "./Sprites";

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
      particlesPerSecond: 60,
      strategy: "random"
    },
    onInit: init,
    onUpdate: draw,
    particle: {
      //initialPos: {x: {min: -50, max: 50}, y: {min: -50, max: 50}},
      initialPos: {x: 0, y: 0},
      initialVelocity: createFactoryFromVector({x: 0, y: -400}, Math.PI/5, .6),
      lifetime: {min: .5, max: 4}
    }
  });
  
  test.start();
});



function init(p:Particle<ParticleUserData>) {
  p.userData = {
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
    const userData = p.userData!;

    ctx.save();
    ctx.globalAlpha = 1-p.normalizedAge;
    ctx.fillStyle = p.userData?.color!;
    ctx.translate(ps.pos.x + p.pos.x, ps.pos.y + p.pos.y);
    ctx.rotate(userData.initialRotation + Math.PI*2*p.normalizedAge**2*userData.rotationSpeed)
    ctx.fillRect(-halfWidth, -halfHeight, halfWidth, halfHeight);
    //sprites.drawSprite(ctx, "Ring", 0, 0, p.normalizedAge);
    ctx.restore();
  });
}