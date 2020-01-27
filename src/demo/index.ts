import {ParticleSystem, random } from "../index";

const scene = document.getElementById("scene") as HTMLCanvasElement;

const test = new ParticleSystem({ 
  count: 50, 
  dampening: .98, 
  forces: {
    gravity: {x: 0, y: 98},
    wind: { x: -50, y: 0}
  },
  particle: {
    initialPos: {x: 0, y: 0},
    initialVelocity: { x: {min: -100,max: 100}, y: {min: -150, max: 50}},
    lifetime: {min: 1, max: 4}
  }
});

let prev = 0;

function init(now:number) {
  prev = now;
  window.requestAnimationFrame(update);
}

function update(now:number) {
  const dt = (now - prev) / 1000;
  prev = now;

  test.update(dt);
  //console.log(`x: ${test.particles[0].pos.x}, y: ${test.particles[0].pos.y}`)

  ///DRAWING
  let ctx = scene.getContext("2d")!;
  ctx.clearRect(0,0,scene.width, scene.height);
  for(const p of test.particles) {
    ctx.fillStyle = `rgba(255, 0, 0, ${1-p.normalizedAge})`
    ctx.fillRect(100 + p.pos.x, 100 + p.pos.y, 2, 2);
  }
  window.requestAnimationFrame(update);
}

window.requestAnimationFrame(init);