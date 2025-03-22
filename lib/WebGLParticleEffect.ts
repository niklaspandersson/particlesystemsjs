import { ParticleSystem } from "./particlesystem";
import type { ParticleSystemOptions } from "./particlesystem";
import { buildShaderSource } from "./webgl/vertexshaderbuilder";

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

type AttribSizes = Record<string, {
  name: string;
  size: number;
  loc: number;
  offset: number;
}>

export default class WebGLParticleEffect<T = any> {
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram;
  private vao: WebGLVertexArrayObject;
  #particleDataBuffer: WebGLBuffer;
  private projectionMatrix: Float32Array;
  private particleSystem: ParticleSystem<T>;
  private attribs: AttribSizes;

  constructor(canvas: HTMLCanvasElement, options: ParticleSystemOptions<T>) {
    const gl = canvas.getContext("webgl2", { alpha: true });
    if (!gl) throw new Error("WebGL2 not supported");

    this.gl = gl;

    this.particleSystem = new ParticleSystem<T>(options, this.draw);

    // create the shader program
    const { vs, fs } = buildShaderSource(this.particleSystem.options);
    this.program = createGLSLProgram(gl, vs, fs);

    //setup projection matrix
    this.projectionMatrix = new Float32Array(16);
    this.updateProjectionMatrix();

    // Initialize the data
    this.vao = gl.createVertexArray()!;
    gl.bindVertexArray(this.vao);
    this.#setupVertexDataBuffer();

    this.#particleDataBuffer = gl.createBuffer()!;
    this.attribs = this.#setupParticleDataBuffer();
    console.log(this.attribs);

    gl.bindVertexArray(null);
  }

  #setupParticleDataBuffer() {
    const gl = this.gl;

    let attribs = ([
      ["particleTranslation", 2],
      ["particleRotation", 1],
      ["particleAge", 1],
      ["particleScale", 2],
      ["particleColor", 4],
    ] as [string, number][])
      .map(([name, size]) => {
        // Get the location of the attribute in the shader program
        const loc = gl.getAttribLocation(this.program, name);
        return { name, size, loc, offset: 0 };
      })
      .filter(({ loc }) => {
        // filter out attributes that are not used in the shader program
        return loc !== -1;
      })

    gl.bindBuffer(gl.ARRAY_BUFFER, this.#particleDataBuffer);
    let dataStride = attribs.reduce((acc, { size }) => acc + size, 0) * Float32Array.BYTES_PER_ELEMENT

    let offset = 0;
    attribs.forEach((attr) => {
      attr.offset = offset;
      gl.enableVertexAttribArray(attr.loc);
      gl.vertexAttribPointer(attr.loc, attr.size, gl.FLOAT, false, dataStride, offset * Float32Array.BYTES_PER_ELEMENT);
      gl.vertexAttribDivisor(attr.loc, 1);
      offset += attr.size;
    });

    return attribs.reduce((acc, obj) => {
      acc[obj.name] = obj;
      return acc;
    }, {} as AttribSizes);
  }

  #setupVertexDataBuffer() {
    const gl = this.gl;
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

    const texCoordLoc = gl.getAttribLocation(this.program, "vertexUV");
    if (texCoordLoc !== -1) {
      gl.enableVertexAttribArray(texCoordLoc);
      gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 4 * Float32Array.BYTES_PER_ELEMENT, 2 * Float32Array.BYTES_PER_ELEMENT);
    }
  }

  public start() {
    this.particleSystem.start();
  }

  public draw = (ps: ParticleSystem) => {
    const gl = this.gl;
    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);
    gl.uniformMatrix4fv(gl.getUniformLocation(this.program, "projection"), false, this.projectionMatrix);
    gl.uniform2fv(gl.getUniformLocation(this.program, "globalTranslation"), [ps.position.x, ps.position.y]);

    const attrs = Array.from(Object.values(this.attribs).values())
    const dataStride = attrs.reduce((acc, { size }) => acc + size, 0);

    const count = ps.particles.length;
    const particleData = new Float32Array(count * dataStride);

    for (let i = 0; i < count; i++) {
      const p = ps.particles[i];
      particleData[i * dataStride + 0] = p.position.x;
      particleData[i * dataStride + 1] = p.position.y;
      particleData[i * dataStride + 2] = p.initialRotation + p.rotationSpeed * p.normalizedAge * 6.28318;

      if (this.attribs.particleScale) {
        const offset = this.attribs.particleScale.offset;
        particleData[i * dataStride + offset] = p.scale.x;
        particleData[i * dataStride + offset + 1] = p.scale.y;
      }
      if (this.attribs.particleAge) {
        const offset = this.attribs.particleAge.offset;
        particleData[i * dataStride + offset] = p.normalizedAge;
      }
      if (this.attribs.particleColor) {
        const offset = this.attribs.particleColor.offset;
        particleData[i * dataStride + offset] = p.color.r;
        particleData[i * dataStride + offset + 1] = p.color.g;
        particleData[i * dataStride + offset + 2] = p.color.b;
        particleData[i * dataStride + offset + 3] = p.color.a;
      }
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, this.#particleDataBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, particleData, gl.DYNAMIC_DRAW);
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
    this.gl.canvas.width = width;
    this.gl.canvas.height = height;
    this.gl.viewport(0, 0, width, height);
    this.updateProjectionMatrix();
  }

  public stop() {
    this.particleSystem.stop();
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  }
}
