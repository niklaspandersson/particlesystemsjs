import { ParticleSystem } from "./particlesystem";
import type { ParticleSystemOptions } from "./particlesystem";

const DefaultFragmentShaderSource = `#version 300 es
    precision mediump float;
    in vec4 vertexColor;
    out vec4 outColor;
    void main() {
      outColor = vertexColor;
    }
  `;

export type WebGLParticleEffectOptions<T> = ParticleSystemOptions<T> & {
  vertexShaderSource: string;
  fragmentShaderSource?: string;
};

function createShader(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    throw new Error("Shader compilation failed");
  }
  return shader;
}

function createProgram(gl: WebGL2RenderingContext, vs: WebGLShader, fs: WebGLShader) {
  const program = gl.createProgram()!;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    throw new Error("Program linking failed");
  }
  return program;
}
function createGLSLProgram(gl: WebGL2RenderingContext, vs: string, fs: string) {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vs);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fs);
  const program = createProgram(gl, vertexShader, fragmentShader);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);
  return program;
}

export default class WebGLParticleEffect<T = any> {
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram;
  private vao: WebGLVertexArrayObject;
  private offsetBuffer: WebGLBuffer;
  private rotationBuffer: WebGLBuffer;
  private colorBuffer: WebGLBuffer;
  private u_projectionLoc: WebGLUniformLocation;
  private projectionMatrix: Float32Array;
  private particleSystem: ParticleSystem<T>;

  constructor(canvas: HTMLCanvasElement, options: WebGLParticleEffectOptions<T>) {
    const gl = canvas.getContext("webgl2", { alpha: true });
    if (!gl) throw new Error("WebGL2 not supported");

    this.gl = gl;

    const { vertexShaderSource, fragmentShaderSource, ...psOpts } = options;

    this.program = createGLSLProgram(gl, vertexShaderSource, fragmentShaderSource ?? DefaultFragmentShaderSource);

    this.vao = gl.createVertexArray()!;
    gl.bindVertexArray(this.vao);

    this.projectionMatrix = new Float32Array(16);

    const vertexData = new Float32Array([
      -1, -1, 0, 0,
      1, -1, 1, 0,
      1, 1, 1, 1,
      -1, -1, 0, 0,
      1, 1, 1, 1,
      -1, 1, 0, 1
    ]);
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);

    const positionLoc = gl.getAttribLocation(this.program, "vertexPosition");
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 4 * Float32Array.BYTES_PER_ELEMENT, 0);

    const texCoordLoc = gl.getAttribLocation(this.program, "textureCoord");
    if (texCoordLoc !== -1) {
      gl.enableVertexAttribArray(texCoordLoc);
      gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 4 * Float32Array.BYTES_PER_ELEMENT, 2 * Float32Array.BYTES_PER_ELEMENT);
    }

    this.offsetBuffer = gl.createBuffer()!;
    this.rotationBuffer = gl.createBuffer()!;
    this.colorBuffer = gl.createBuffer()!;

    const a_offsetLoc = gl.getAttribLocation(this.program, "a_offset");
    gl.bindBuffer(gl.ARRAY_BUFFER, this.offsetBuffer);
    gl.enableVertexAttribArray(a_offsetLoc);
    gl.vertexAttribPointer(a_offsetLoc, 2, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(a_offsetLoc, 1);

    const a_rotationLoc = gl.getAttribLocation(this.program, "a_rotation");
    gl.bindBuffer(gl.ARRAY_BUFFER, this.rotationBuffer);
    gl.enableVertexAttribArray(a_rotationLoc);
    gl.vertexAttribPointer(a_rotationLoc, 1, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(a_rotationLoc, 1);

    const a_colorLoc = gl.getAttribLocation(this.program, "a_color");
    gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
    gl.enableVertexAttribArray(a_colorLoc);
    gl.vertexAttribPointer(a_colorLoc, 4, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(a_colorLoc, 1);

    gl.bindVertexArray(null);

    this.updateProjectionMatrix();
    this.u_projectionLoc = gl.getUniformLocation(this.program, "u_projection")!;

    this.particleSystem = new ParticleSystem<T>(psOpts, this.draw);
  }

  public start() {
    this.particleSystem.start();
  }

  public draw = (ps: ParticleSystem) => {
    const gl = this.gl;
    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);
    gl.uniformMatrix4fv(this.u_projectionLoc, false, this.projectionMatrix);

    const count = ps.particles.length;
    const offsets = new Float32Array(count * 2);
    const rotations = new Float32Array(count);
    const colors = new Float32Array(count * 4);

    for (let i = 0; i < count; i++) {
      const p = ps.particles[i];
      offsets[i * 2] = p.position.x;
      offsets[i * 2 + 1] = p.position.y;
      rotations[i] = p.data.initialRotation + p.data.rotationSpeed * p.normalizedAge * 6.28318;
      if (p?.data?.color && Array.isArray(p.data.color)) {
        const alpha = 1.0 - p.normalizedAge;
        colors.set([...p.data.color.slice(0, 3), alpha], i * 4);
      } else {
        colors.set([1, 1, 1, 1], i * 4);
      }
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, this.rotationBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, rotations, gl.DYNAMIC_DRAW); // Ensure rotation buffer is updated
    gl.bindBuffer(gl.ARRAY_BUFFER, this.offsetBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, offsets, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.DYNAMIC_DRAW);

    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, count);
    gl.bindVertexArray(null);
  }

  private updateProjectionMatrix() {
    this.projectionMatrix.set([
      2 / this.gl.canvas.width, 0, 0, 0,
      0, -2 / this.gl.canvas.height, 0, 0,
      0, 0, 1, 0,
      -1, 1, 0, 1,
    ]);
  }

  public resize(width: number, height: number) {
    this.gl.viewport(0, 0, width, height);
    this.updateProjectionMatrix();
  }

  public stop() {
    this.particleSystem.stop();
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  }
}
