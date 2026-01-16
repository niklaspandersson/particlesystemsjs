import { Vector3, Vec3, Vec3Optional } from "../math";
import { WebGPUParticleRenderer, GPUParticleData, SimulationParams, RenderParams } from "./renderer";
import { ParticleEmitter, ParticleEmitterOptions } from "../emitter";
import Particle from "../particle";
import merge from "deepmerge";

type Vec3Dictionary = { [key: string]: Vec3<number> };

export type GPUParticleSystemOptions<T> = {
  initialCount: number;
  initialAge?: () => number;
  position: Vec3Optional<number>;
  forces?: Vec3Dictionary;
  dampening?: number;
  emitter: ParticleEmitterOptions<T>;
  maxParticles?: number;
};

export type GPUParticleColor = { r: number; g: number; b: number; a: number };

export type GPUParticleCustomData = {
  color?: GPUParticleColor;
  size?: number;
};

export type CameraParams = {
  viewProjection: Float32Array;
  right: Vec3<number>;
  up: Vec3<number>;
};

const DefaultGPUPSOptions: GPUParticleSystemOptions<never> = {
  initialCount: 0,
  position: { x: 0, y: 0 },
  dampening: 1,
  maxParticles: 10000,
  emitter: {
    particlesPerSecond: 40,
    strategy: "random",
    particles: {
      initialPos: { x: { min: -10, max: 10 }, y: 0 },
      initialVelocity: { x: 0, y: { max: -10, min: -100 } },
      lifetime: 3,
    },
  },
};

const DefaultColor: GPUParticleColor = { r: 1, g: 1, b: 1, a: 1 };
const DefaultSize = 10;

export class GPUParticleSystem<T extends GPUParticleCustomData = GPUParticleCustomData> {
  private _renderer: WebGPUParticleRenderer;
  private _emitter: ParticleEmitter<T>;

  private _particles: Particle<T>[];
  public get particles() { return this._particles; }

  private _pos: Vec3<number>;
  public get position() { return this._pos; }

  private _forces: Vec3Dictionary | undefined;
  private _dampening: number;
  private _maxParticles: number;

  private _canvas: HTMLCanvasElement | null = null;
  private _camera: CameraParams | null = null;

  private _initialized: boolean = false;
  public get initialized() { return this._initialized; }

  constructor(options: Partial<GPUParticleSystemOptions<T>>) {
    const opts = merge(DefaultGPUPSOptions, options) as GPUParticleSystemOptions<T>;

    this._forces = opts.forces;
    this._pos = { z: 0, ...opts.position };
    this._dampening = opts.dampening ?? 1;
    this._maxParticles = opts.maxParticles ?? 10000;

    this._renderer = new WebGPUParticleRenderer();
    this._emitter = new ParticleEmitter<T>(opts.emitter);
    this._particles = this._emitter.init(opts.initialCount);

    if (opts.initialAge) {
      this._particles.forEach(p => p.updateAge(opts.initialAge!() * p.lifetime));
    }

    this.onAnimationFrame = this.onAnimationFrame.bind(this);
  }

  async initialize(canvas: HTMLCanvasElement): Promise<boolean> {
    this._canvas = canvas;

    const success = await this._renderer.initialize(canvas, this._maxParticles);
    if (!success) {
      console.error("Failed to initialize WebGPU renderer");
      return false;
    }

    // Set up default orthographic camera for 2D rendering
    this.setupDefault2DCamera(canvas.width, canvas.height);

    // Initial upload
    this.uploadParticlesToGPU();

    this._initialized = true;
    return true;
  }

  private setupDefault2DCamera(width: number, height: number): void {
    // Create orthographic projection matrix for 2D rendering
    // Maps (0,0) to top-left, (width, height) to bottom-right
    const left = 0;
    const right = width;
    const top = 0;
    const bottom = height;
    const near = -1;
    const far = 1;

    // Orthographic projection matrix (column-major for WebGPU)
    const viewProjection = new Float32Array([
      2 / (right - left), 0, 0, 0,
      0, 2 / (top - bottom), 0, 0,
      0, 0, 1 / (far - near), 0,
      -(right + left) / (right - left), -(top + bottom) / (top - bottom), -near / (far - near), 1,
    ]);

    this._camera = {
      viewProjection,
      right: { x: 1, y: 0, z: 0 },
      up: { x: 0, y: -1, z: 0 }, // Y-down for screen coordinates
    };
  }

  setCamera(camera: CameraParams): void {
    this._camera = camera;
  }

  set3DCamera(viewMatrix: Float32Array, projectionMatrix: Float32Array): void {
    // Multiply projection * view (column-major matrices)
    const vp = new Float32Array(16);
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        vp[j * 4 + i] = 0;
        for (let k = 0; k < 4; k++) {
          vp[j * 4 + i] += projectionMatrix[k * 4 + i] * viewMatrix[j * 4 + k];
        }
      }
    }

    // Extract camera right and up from inverse view matrix
    // For a standard view matrix, the right/up vectors are in the first two rows
    this._camera = {
      viewProjection: vp,
      right: { x: viewMatrix[0], y: viewMatrix[4], z: viewMatrix[8] },
      up: { x: viewMatrix[1], y: viewMatrix[5], z: viewMatrix[9] },
    };
  }

  private uploadParticlesToGPU(): void {
    const gpuParticles: GPUParticleData[] = this._particles.map(p => {
      const data = p.data as GPUParticleCustomData | undefined;
      return {
        position: p.position,
        velocity: p.velocity,
        age: p.age,
        lifetime: p.lifetime,
        color: data?.color ?? DefaultColor,
        size: data?.size ?? DefaultSize,
      };
    });

    this._renderer.uploadParticles(gpuParticles);
  }

  private lastTime: DOMHighResTimeStamp = 0;
  private animationFrameId: number | null = null;

  public start(): void {
    if (!this._initialized) {
      console.error("GPUParticleSystem not initialized. Call initialize() first.");
      return;
    }

    if (!this.animationFrameId) {
      this.animationFrameId = window.requestAnimationFrame(t => {
        this.lastTime = t;
        this.animationFrameId = window.requestAnimationFrame(this.onAnimationFrame);
      });
    }
  }

  public stop(): void {
    if (this.animationFrameId) {
      window.cancelAnimationFrame(this.animationFrameId);
    }
    this.animationFrameId = null;
  }

  private onAnimationFrame(time: DOMHighResTimeStamp): void {
    const dt = (time - this.lastTime) / 1000;
    this.lastTime = time;

    // Emit new particles on CPU
    const newParticles = this._emitter.isAlive && this._emitter.onUpdate(dt);
    if (newParticles) {
      this._particles.push(...newParticles);
    }

    // Remove dead particles from CPU array
    this._particles = this._particles.filter(p => p.age < p.lifetime);

    // Cap to max particles
    if (this._particles.length > this._maxParticles) {
      this._particles = this._particles.slice(-this._maxParticles);
    }

    // Upload updated particle list to GPU
    this.uploadParticlesToGPU();

    // Calculate net forces
    const forces = new Vector3();
    if (this._forces) {
      for (const f in this._forces) {
        forces.add(this._forces[f]);
      }
    }

    // Run compute shader to update physics and render
    const simulationParams: SimulationParams = {
      deltaTime: dt,
      dampening: this._dampening,
      forces: forces,
      systemPosition: this._pos,
    };

    const renderParams: RenderParams = {
      viewProjection: this._camera!.viewProjection,
      cameraRight: this._camera!.right,
      cameraUp: this._camera!.up,
      systemPosition: this._pos,
      screenSize: {
        width: this._canvas!.width,
        height: this._canvas!.height,
      },
    };

    this._renderer.updateAndRender(simulationParams, renderParams);

    // Update CPU-side particle ages (for emitter logic and particle removal)
    this._particles.forEach(p => p.updateAge(dt));

    this.animationFrameId = window.requestAnimationFrame(this.onAnimationFrame);

    if (!this._emitter.isAlive && !this._particles.length) {
      this.stop();
    }
  }

  public addParticle(particle: Particle<T>): void {
    if (this._particles.length < this._maxParticles) {
      this._particles.push(particle);
    }
  }

  public addParticles(particles: Particle<T>[]): void {
    const spaceLeft = this._maxParticles - this._particles.length;
    if (spaceLeft > 0) {
      this._particles.push(...particles.slice(0, spaceLeft));
    }
  }

  public setPosition(pos: Vec3Optional<number>): void {
    this._pos = { z: 0, ...pos };
  }

  public setForces(forces: Vec3Dictionary): void {
    this._forces = forces;
  }

  public setDampening(dampening: number): void {
    this._dampening = dampening;
  }

  public destroy(): void {
    this.stop();
    this._renderer.destroy();
    this._particles = [];
    this._initialized = false;
  }
}

export default GPUParticleSystem;
