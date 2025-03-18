import { MathUtils } from "../../lib/main";
import WebGLParticleEffect from "../../lib/WebGLParticleEffect";

export default function init({ canvas }: { canvas: HTMLCanvasElement }) {
  const vertexShaderSource = `#version 300 es
    in vec2 a_quadPosition;
    in vec2 a_offset;
    in float a_rotation;
    in vec4 a_color;
    uniform mat4 u_projection;
    out vec4 vertexColor;

    const vec2 scale = vec2(4.0, 2.0);
    void main() {
      float cosA = cos(a_rotation);
      float sinA = sin(a_rotation);
      vec2 rotated = vec2(
        a_quadPosition.x * cosA - a_quadPosition.y * sinA,
        a_quadPosition.x * sinA + a_quadPosition.y * cosA
      );
      vec2 pos = a_offset + rotated*scale;
      gl_Position = u_projection * vec4(pos, 0.0, 1.0);
      vertexColor = a_color;
    }
  `;

  const config = {
    vertexShaderSource,
    initialCount: 400,
    position: { x: canvas.width / 2, y: canvas.height / 2 },
    forces: { gravity: { x: 0, y: 200, z: 0 } },
    emitter: {
      particlesPerSecond: 1750,
      lifetime: 3,
      strategy: "random",
      particles: {
        initialPos: { x: { min: -canvas.width / 2, max: canvas.width / 2 }, y: { min: -50, max: -10 } },
        initialVelocity: MathUtils.Factories.inDirectionOf({ x: 0, y: 100 }, Math.PI / 3, 1),
        lifetime: { min: 1, max: 2.5 },
        customDataFactory: () => ({
          initialRotation: MathUtils.random({ min: -Math.PI * 2, max: Math.PI * 2 }),
          rotationSpeed: MathUtils.random({ min: 0.2, max: 2 }),
          color: [MathUtils.random({ min: 0, max: 1 }),
          MathUtils.random({ min: 0, max: 1 }),
          MathUtils.random({ min: 0, max: 1 }),
            1]
        })
      }
    }
  }

  const effect = new WebGLParticleEffect(canvas, config)

  function resizeCanvas() {
    const width = window.innerWidth;
    const height = window.innerHeight;
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