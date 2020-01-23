import {ParticleSystem} from "../index";

const scene = document.getElementById("scene") as HTMLCanvasElement;

const test = new ParticleSystem({ count: 3 });

let prev = Date.now();
setInterval((ev) => {
  const now = Date.now();
  const diff = (now - prev) / 1000;

  test.update(diff);
  //console.log(`x: ${test.particles[0].pos.x}, y: ${test.particles[0].pos.y}`)
  prev = now;


  ///DRAWING
  let ctx = scene.getContext("2d")!;
  ctx.clearRect(0,0,scene.width, scene.height);
  for(const p of test.particles) {
    ctx.fillStyle = "#FF0000";
    ctx.fillRect(p.pos.x, 100 + p.pos.y, 3, 3);
  }
}, 100);