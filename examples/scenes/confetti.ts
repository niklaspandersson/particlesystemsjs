import { MathUtils } from "../../lib/main";
import WebGLParticleEffect from "../../lib/WebGLParticleEffect";

export default function init({ canvas }: { canvas: HTMLCanvasElement }) {
  const vertexShaderSource = `#version 300 es
    in vec2 vertexPosition;
    in vec2 a_offset;
    in float a_rotation;
    in vec4 a_color;
    uniform mat4 u_projection;
    out vec4 vertexColor;

    const vec2 scale = vec2(8.0, 4.0);
    void main() {
      float cosA = cos(a_rotation);
      float sinA = sin(a_rotation);
      vec2 rotated = vec2(
        vertexPosition.x * cosA - vertexPosition.y * sinA,
        vertexPosition.x * sinA + vertexPosition.y * cosA
      );
      vec2 pos = a_offset + rotated*scale;
      gl_Position = u_projection * vec4(pos, 0.0, 1.0);
      vertexColor = a_color;
    }
  `;

  const config = {
    vertexShaderSource,
    initialCount: 40,
    position: { x: canvas.width / 2, y: canvas.height / 2 },
    forces: { gravity: { x: 0, y: 200, z: 0 } },
    emitter: {
      particlesPerSecond: 50,
      lifetime: 3,
      strategy: "random",
      particles: {
        initialPos: { x: { min: -canvas.width / 2, max: canvas.width / 2 }, y: { min: -50, max: -10 } },
        initialVelocity: MathUtils.Factories.inDirectionOf({ x: 0, y: 10 }, Math.PI / 3, 1),
        lifetime: { min: 1, max: 2.5 },
        customDataFactory: () => ({
          initialRotation: MathUtils.random({ min: -Math.PI * 2, max: Math.PI * 2 }),
          rotationSpeed: MathUtils.random({ min: 1, max: 5 }),
          color: [MathUtils.random({ min: 0, max: .5 }),
          MathUtils.random({ min: 0, max: .5 }),
          MathUtils.random({ min: 0, max: .5 }),
            1]
        })
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