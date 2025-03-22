import { MathUtils } from "../../lib/main";
import WebGLParticleEffect from "../../lib/WebGLParticleEffect";

export default function init({ canvas }: { canvas: HTMLCanvasElement }) {
  const config = {
    initialCount: 10,
    position: { x: canvas.width / 2, y: 0 },
    forces: { gravity: { x: 0, y: 170, z: 0 } },
    emitter: {
      particlesPerSecond: 500,
      lifetime: 3,
      strategy: "random",
      particles: {
        initialPos: { x: { min: -canvas.width / 2, max: canvas.width / 2 }, y: { min: -50, max: -10 } },
        initialVelocity: MathUtils.Factories.inDirectionOf({ x: 0, y: 50 }, Math.PI / 3, 1),
        initialRotation: { min: -Math.PI * 2, max: Math.PI * 2 },
        rotationSpeed: { min: .5, max: 2 },
        scale: { x: 8.0, y: 4.0 },
        color: { r: { min: 0, max: 1 }, g: .2, b: .2, a: 1 },
        lifetime: { min: 1, max: 2.5 },
      }
    }
  }

  const effect = new WebGLParticleEffect(canvas, config)

  function resizeCanvas() {
    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = width;
    canvas.height = height;

    effect.resize(width, height);
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas(); // Initial resize

  effect.start();

  return () => {
    window.removeEventListener('resize', resizeCanvas);
    effect.stop();
  }
}