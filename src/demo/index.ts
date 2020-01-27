import {ParticleSystem, random, randomize } from "../index";

const scene = document.getElementById("scene") as HTMLCanvasElement;
const Width = 12;
const Height = 5;

const test = new ParticleSystem({ 
  count: 50,
  position: {x: scene.width/2, y: scene.height/2},
  forces: {
    // gravity: {x: 0, y: 98},
    wind: { x: -40, y: 0}
  },
  onInit: init,
  onUpdate: draw,
  particle: {
    initialPos: {x: 0, y: 0},
    initialVelocity: { x: {min: -50,max: 50}, y: {min: -50, max: 50}},
    lifetime: {min: .3, max: 1.5}
  }
});

test.start();

function init(ps:ParticleSystem) {
  for(const p of ps.particles) 
    p.userData = {
      initialRotation: random({min:0, max: Math.PI*2}),
      rotationDirection: randomize([-1, 1]),
      rotationSpeed: random({min: .3, max: 2}),
      color: randomize(['orange', 'lightblue', 'green', 'red'])
    };
}

function draw(ps:ParticleSystem) {
  ///DRAWING
  let ctx = scene.getContext("2d")!;
  ctx.clearRect(0,0,scene.width, scene.height);
  for(const p of ps.particles) {
    ctx.save();
    ctx.fillStyle = p.userData.color;
    ctx.globalAlpha = 1-p.normalizedAge;
    ctx.translate(ps.pos.x + p.pos.x, ps.pos.y + p.pos.y);
    ctx.rotate(p.userData.initialRotation + Math.PI*2*p.normalizedAge*p.userData.rotationSpeed*p.userData.rotationDirection)
    ctx.fillRect(-Width/2, -Height/2, Width/2, Height/2);
    ctx.restore();
  }
}