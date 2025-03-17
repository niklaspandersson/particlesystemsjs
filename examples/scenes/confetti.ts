import { MathUtils, ParticleSystem } from "../../lib/main.ts";

export default function init({ canvas }: { canvas: HTMLCanvasElement }) {
  const Width = 12;
  const Height = 6;
  const gl = canvas.getContext("webgl2", { alpha: true });
  if (!gl) throw new Error("WebGL2 not supported");

  // Enable alpha blending
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  // Vertex shader using instanced attributes: quad vertex, offset, rotation, and color.
  const vertexShaderSource = `#version 300 es
    in vec2 a_quadPosition;
    in vec2 a_offset;
    in float a_rotation;
    in vec4 a_color;
    uniform mat4 u_projection;
    out vec4 v_color;
    void main() {
      float cosA = cos(a_rotation);
      float sinA = sin(a_rotation);
      vec2 rotated = vec2(
        a_quadPosition.x * cosA - a_quadPosition.y * sinA,
        a_quadPosition.x * sinA + a_quadPosition.y * cosA
      );
      vec2 pos = a_offset + rotated;
      gl_Position = u_projection * vec4(pos, 0.0, 1.0);
      v_color = a_color;
    }
  `;

  // Fragment shader simply outputs the instance color.
  const fragmentShaderSource = `#version 300 es
    precision mediump float;
    in vec4 v_color;
    out vec4 outColor;
    void main() {
      outColor = v_color;
    }
  `;

  function createShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
    const shader = gl.createShader(type);
    gl.shaderSource(shader!, source);
    gl.compileShader(shader!);
    if (!gl.getShaderParameter(shader!, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(shader!));
      gl.deleteShader(shader!);
      throw new Error("Shader compilation failed");
    }
    return shader!;
  }

  function createProgram(gl: WebGL2RenderingContext, vs: WebGLShader, fs: WebGLShader): WebGLProgram {
    const program = gl.createProgram();
    gl.attachShader(program!, vs);
    gl.attachShader(program!, fs);
    gl.linkProgram(program!);
    if (!gl.getProgramParameter(program!, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program!));
      gl.deleteProgram(program!);
      throw new Error("Program linking failed");
    }
    return program!;
  }

  const vs = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
  const program = createProgram(gl, vs, fs);

  // Create a VAO to store attribute state.
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  const Scale = 5;
  // Create a unit quad (two triangles) centered at the origin.
  const quadVertices = new Float32Array([
    -Width / Scale, -Height / Scale,
    Width / Scale, -Height / Scale,
    Width / Scale, Height / Scale,
    -Width / Scale, -Height / Scale,
    Width / Scale, Height / Scale,
    -Width / Scale, Height / Scale,
  ]);
  const quadBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);
  const a_quadPositionLoc = gl.getAttribLocation(program, "a_quadPosition");
  gl.enableVertexAttribArray(a_quadPositionLoc);
  gl.vertexAttribPointer(a_quadPositionLoc, 2, gl.FLOAT, false, 0, 0);
  gl.vertexAttribDivisor(a_quadPositionLoc, 0);

  // Create instance buffers for offset, rotation, and color.
  const offsetBuffer = gl.createBuffer();
  const rotationBuffer = gl.createBuffer();
  const colorBuffer = gl.createBuffer();

  const a_offsetLoc = gl.getAttribLocation(program, "a_offset");
  gl.bindBuffer(gl.ARRAY_BUFFER, offsetBuffer);
  gl.enableVertexAttribArray(a_offsetLoc);
  gl.vertexAttribPointer(a_offsetLoc, 2, gl.FLOAT, false, 0, 0);
  gl.vertexAttribDivisor(a_offsetLoc, 1);

  const a_rotationLoc = gl.getAttribLocation(program, "a_rotation");
  gl.bindBuffer(gl.ARRAY_BUFFER, rotationBuffer);
  gl.enableVertexAttribArray(a_rotationLoc);
  gl.vertexAttribPointer(a_rotationLoc, 1, gl.FLOAT, false, 0, 0);
  gl.vertexAttribDivisor(a_rotationLoc, 1);

  const a_colorLoc = gl.getAttribLocation(program, "a_color");
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.enableVertexAttribArray(a_colorLoc);
  gl.vertexAttribPointer(a_colorLoc, 4, gl.FLOAT, false, 0, 0);
  gl.vertexAttribDivisor(a_colorLoc, 1);

  gl.bindVertexArray(null);

  // Setup an orthographic projection matrix to match the 2D canvas coordinate system.
  const projectionMatrix = new Float32Array([
    2 / canvas.width, 0, 0, 0,
    0, -2 / canvas.height, 0, 0,
    0, 0, 1, 0,
    -1, 1, 0, 1,
  ]);
  const u_projectionLoc = gl.getUniformLocation(program, "u_projection");

  // The draw function builds instanced attribute arrays from the particle system.
  function draw(doClear: boolean, ps: ParticleSystem<any>) {
    if (!gl) return;
    if (doClear) gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    gl.bindVertexArray(vao);
    gl.uniformMatrix4fv(u_projectionLoc, false, projectionMatrix);

    // Build instance arrays: offsets, rotations, and colors.
    // ps.positions is updated by the worker; ps.particles holds extra data.
    const count = ps.particles.length;
    const offsets = new Float32Array(count * 2);
    const rotations = new Float32Array(count);
    const colors = new Float32Array(count * 4);

    for (let i = 0; i < count; i++) {
      const p = ps.particles[i];
      offsets[i * 2] = p.position.x;
      offsets[i * 2 + 1] = p.position.y;
      rotations[i] = p && p.data ? p.data.initialRotation + p.data.rotationSpeed * p.normalizedAge * 6.28318 : 0;
      if (p && p.data && p.data.color && Array.isArray(p.data.color)) {
        const alpha = 1.0 - p.normalizedAge; // Fade out based on normalizedAge
        colors.set([...p.data.color.slice(0, 3), alpha], i * 4);
      } else {
        colors.set([1, 1, 1, 1], i * 4);
      }
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, offsetBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, offsets, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, rotationBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, rotations, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.DYNAMIC_DRAW);

    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, count);
    gl.bindVertexArray(null);
  }

  let confetti: ParticleSystem<any>[] = [];
  // Start the particle system.
  function start() {
    confetti = Array(1)
      .fill(0)
      .map((_, i) => new ParticleSystem({
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
      }, draw.bind(window, false)));
    confetti.forEach(ps => ps.start());
  }

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl?.viewport(0, 0, canvas.width, canvas.height);
    projectionMatrix.set([
      2 / canvas.width, 0, 0, 0,
      0, -2 / canvas.height, 0, 0,
      0, 0, 1, 0,
      -1, 1, 0, 1,
    ]);
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas(); // Initial resize

  start();

  return () => {
    window.removeEventListener('resize', resizeCanvas);
    confetti?.forEach(ps => ps.stop());

    gl?.clear(gl.COLOR_BUFFER_BIT);
    gl?.deleteProgram(program);
    gl?.deleteShader(vs);
    gl?.deleteShader(fs);
    gl?.deleteBuffer(quadBuffer);
    gl?.deleteBuffer(offsetBuffer);
    gl?.deleteBuffer(rotationBuffer);
    gl?.deleteBuffer(colorBuffer);
    gl?.deleteVertexArray(vao);
  }
}