import {ParticleSystem, random, randomize, createFactoryFromVector } from "../index";

const scene = document.getElementById("scene") as HTMLCanvasElement;
const Width = 12;
const Height = 5;

scene.addEventListener('click', ev => {
  const test = new ParticleSystem({ 
    count: 180,
    dampening: .99,
    position: {x: scene.width/2, y: scene.height/2},
    forces: {
      gravity: {x: 0, y: 98},
      wind: { x: 20, y: 0}
    },
    onInit: init,
    onUpdate: draw,
    particle: {
      initialPos: {x: 0, y: 0},
      initialVelocity: createFactoryFromVector({x: -230, y: -120}, Math.PI/4, 0.3), //{ x: {min: -50,max: 50}, y: {min: -50, max: 50}},
      lifetime: {min: .5, max: 4}
    }
  });
  
  test.start();
});



function init(ps:ParticleSystem) {
  for(const p of ps.particles) 
    p.userData = {
      initialRotation: random({min:0, max: Math.PI*2}),
      rotationDirection: randomize([-1, 1]),
      rotationSpeed: random({min: .3, max: 2}),
      color: randomize(['orange', 'lightblue', 'green', 'red'])
    };
}

let ctx = scene.getContext("2d")!;
const halfWidth = Width/2;
const halfHeight = Height/2;

function draw(ps:ParticleSystem) {
  ///DRAWING
  ctx.clearRect(0,0,scene.width, scene.height);
  let lastColor = "";
  ps.particles.forEach(function(p) {
    if(p.userData.color !== lastColor) {
      ctx.fillStyle = p.userData.color;
      lastColor = p.userData.color;
    }

    ctx.save();
    ctx.globalAlpha = 1-p.normalizedAge;
    ctx.translate(ps.pos.x + p.pos.x, ps.pos.y + p.pos.y);
    ctx.rotate(p.userData.initialRotation + Math.PI*2*p.normalizedAge**2*p.userData.rotationSpeed*p.userData.rotationDirection)
    ctx.fillRect(-halfWidth, -halfHeight, halfWidth, halfHeight);
    ctx.restore();
  });
}