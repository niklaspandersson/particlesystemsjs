import { ParticleSystem, MathUtils } from "../lib/main.ts";

const canvas = document.getElementById("canvas")! as HTMLCanvasElement;
const Width = 12;
const Height = 6;

function draw(doClear: boolean, ps: ParticleSystem) {
  const ctx = canvas.getContext("2d")!;
  if (doClear)
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const p of ps.particles) {
    const userData = p.data;

    ctx.save();
    ctx.globalAlpha = 1 - p.normalizedAge;
    ctx.fillStyle = p.data.color;
    ctx.translate(ps.position.x + p.position.x, ps.position.y + p.position.y);
    ctx.rotate(userData.initialRotation + Math.PI * 2 * p.normalizedAge ** 2 * userData.rotationSpeed)
    ctx.fillRect(-Width, -Height, Width, Height);
    ctx.restore();
  }
}

function start() {
  //creates two particle systems, facing each other
  const confetti = Array(1).fill(0).map((_, i) => new ParticleSystem({
    initialCount: 0,
    // position: { x: !!i ? 0 : canvas.width, y: canvas.height / 2 },
    position: {
      x: canvas.width / 2,
      y: 0,
    },
    forces: {
      gravity: { x: 0, y: 200, z: 0 },
      // wind: { x: -200, y: 0, z: 0 }
    },
    emitter: {
      particlesPerSecond: 500,
      lifetime: 3,
      strategy: "random",
      particles: {
        initialPos: { x: { min: -canvas.width / 2, max: canvas.width / 2 }, y: -10 },
        initialVelocity: MathUtils.Factories.inDirectionOf({ x: 0, y: 100 }, Math.PI / 3, 1),
        lifetime: { min: 1, max: 1.5 },
        customDataFactory: () => ({
          initialRotation: MathUtils.random({ min: -Math.PI * 2, max: Math.PI * 2 }),
          rotationSpeed: MathUtils.random({ min: .2, max: 2 }),
          color: MathUtils.randomize(['orange', 'lightblue', 'green', 'red'])
        })
      }
    }
  }, draw.bind(window, i === 0)));
  confetti.forEach(ps => ps.start());
}

// Add click handlers to buttons
//////////////////////////////////
document.getElementById("btn-start")!.addEventListener("click", start);

// Keep the size of the canvas
// equal to the available space
/////////////////////////////////
function resizeHandler() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

window.addEventListener("load", resizeHandler);
window.addEventListener("resize", resizeHandler);