import { Vec3 } from "../math";
import { computeShaderSource, renderShaderSource } from "./shaders";

export interface GPUParticleData {
  position: Vec3<number>;
  velocity: Vec3<number>;
  age: number;
  lifetime: number;
  color: { r: number; g: number; b: number; a: number };
  size: number;
}

export interface RenderParams {
  viewProjection: Float32Array;
  cameraRight: Vec3<number>;
  cameraUp: Vec3<number>;
  systemPosition: Vec3<number>;
  screenSize: { width: number; height: number };
}

export interface SimulationParams {
  deltaTime: number;
  dampening: number;
  forces: Vec3<number>;
  systemPosition: Vec3<number>;
}

// Particle struct size in bytes (must match WGSL struct)
// position: vec3<f32> + age: f32 = 16 bytes
// velocity: vec3<f32> + lifetime: f32 = 16 bytes
// color: vec4<f32> = 16 bytes
// size: f32 + padding: vec3<f32> = 16 bytes
// Total: 64 bytes
const PARTICLE_BYTE_SIZE = 64;

// Simulation params struct size (must match WGSL struct)
const SIMULATION_PARAMS_BYTE_SIZE = 64;

// Render params struct size (must match WGSL struct)
const RENDER_PARAMS_BYTE_SIZE = 128;

export class WebGPUParticleRenderer {
  private device: GPUDevice | null = null;
  private context: GPUCanvasContext | null = null;
  private format: GPUTextureFormat = "bgra8unorm";

  private computePipeline: GPUComputePipeline | null = null;
  private renderPipeline: GPURenderPipeline | null = null;

  private particleBuffer: GPUBuffer | null = null;
  private simulationParamsBuffer: GPUBuffer | null = null;
  private renderParamsBuffer: GPUBuffer | null = null;

  private computeBindGroup: GPUBindGroup | null = null;
  private renderBindGroup: GPUBindGroup | null = null;

  private maxParticles: number = 0;
  private particleCount: number = 0;

  private _initialized: boolean = false;
  public get initialized() { return this._initialized; }

  async initialize(canvas: HTMLCanvasElement, maxParticles: number = 10000): Promise<boolean> {
    if (!navigator.gpu) {
      console.error("WebGPU not supported in this browser");
      return false;
    }

    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      console.error("Failed to get GPU adapter");
      return false;
    }

    this.device = await adapter.requestDevice();
    this.context = canvas.getContext("webgpu") as GPUCanvasContext;

    if (!this.context) {
      console.error("Failed to get WebGPU context");
      return false;
    }

    this.format = navigator.gpu.getPreferredCanvasFormat();
    this.context.configure({
      device: this.device,
      format: this.format,
      alphaMode: "premultiplied",
    });

    this.maxParticles = maxParticles;

    this.createBuffers();
    this.createComputePipeline();
    this.createRenderPipeline();
    this.createBindGroups();

    this._initialized = true;
    return true;
  }

  private createBuffers(): void {
    if (!this.device) return;

    // Particle buffer - used by both compute and render
    this.particleBuffer = this.device.createBuffer({
      size: this.maxParticles * PARTICLE_BYTE_SIZE,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    // Simulation parameters uniform buffer
    this.simulationParamsBuffer = this.device.createBuffer({
      size: SIMULATION_PARAMS_BYTE_SIZE,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // Render parameters uniform buffer
    this.renderParamsBuffer = this.device.createBuffer({
      size: RENDER_PARAMS_BYTE_SIZE,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
  }

  private createComputePipeline(): void {
    if (!this.device) return;

    const computeShaderModule = this.device.createShaderModule({
      code: computeShaderSource,
    });

    this.computePipeline = this.device.createComputePipeline({
      layout: "auto",
      compute: {
        module: computeShaderModule,
        entryPoint: "main",
      },
    });
  }

  private createRenderPipeline(): void {
    if (!this.device) return;

    const renderShaderModule = this.device.createShaderModule({
      code: renderShaderSource,
    });

    this.renderPipeline = this.device.createRenderPipeline({
      layout: "auto",
      vertex: {
        module: renderShaderModule,
        entryPoint: "vs_main",
      },
      fragment: {
        module: renderShaderModule,
        entryPoint: "fs_main",
        targets: [
          {
            format: this.format,
            blend: {
              color: {
                srcFactor: "src-alpha",
                dstFactor: "one-minus-src-alpha",
                operation: "add",
              },
              alpha: {
                srcFactor: "one",
                dstFactor: "one-minus-src-alpha",
                operation: "add",
              },
            },
          },
        ],
      },
      primitive: {
        topology: "triangle-list",
      },
    });
  }

  private createBindGroups(): void {
    if (!this.device || !this.computePipeline || !this.renderPipeline ||
        !this.particleBuffer || !this.simulationParamsBuffer || !this.renderParamsBuffer) {
      return;
    }

    // Compute bind group
    this.computeBindGroup = this.device.createBindGroup({
      layout: this.computePipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.particleBuffer } },
        { binding: 1, resource: { buffer: this.simulationParamsBuffer } },
      ],
    });

    // Render bind group
    this.renderBindGroup = this.device.createBindGroup({
      layout: this.renderPipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.particleBuffer } },
        { binding: 1, resource: { buffer: this.renderParamsBuffer } },
      ],
    });
  }

  uploadParticles(particles: GPUParticleData[]): void {
    if (!this.device || !this.particleBuffer) return;

    this.particleCount = Math.min(particles.length, this.maxParticles);

    const data = new Float32Array(this.particleCount * (PARTICLE_BYTE_SIZE / 4));

    for (let i = 0; i < this.particleCount; i++) {
      const p = particles[i];
      const offset = i * 16; // 16 floats per particle

      // position (vec3) + age (f32)
      data[offset + 0] = p.position.x;
      data[offset + 1] = p.position.y;
      data[offset + 2] = p.position.z;
      data[offset + 3] = p.age;

      // velocity (vec3) + lifetime (f32)
      data[offset + 4] = p.velocity.x;
      data[offset + 5] = p.velocity.y;
      data[offset + 6] = p.velocity.z;
      data[offset + 7] = p.lifetime;

      // color (vec4)
      data[offset + 8] = p.color.r;
      data[offset + 9] = p.color.g;
      data[offset + 10] = p.color.b;
      data[offset + 11] = p.color.a;

      // size + padding
      data[offset + 12] = p.size;
      data[offset + 13] = 0;
      data[offset + 14] = 0;
      data[offset + 15] = 0;
    }

    this.device.queue.writeBuffer(this.particleBuffer, 0, data);
  }

  updateSimulation(params: SimulationParams): void {
    if (!this.device || !this.simulationParamsBuffer || !this.computePipeline ||
        !this.computeBindGroup || this.particleCount === 0) {
      return;
    }

    // Update simulation params buffer
    const paramsData = new Float32Array([
      params.deltaTime,
      params.dampening,
      this.particleCount,
      0, // padding
      params.forces.x,
      params.forces.y,
      params.forces.z,
      0, // padding
      params.systemPosition.x,
      params.systemPosition.y,
      params.systemPosition.z,
      0, // padding
    ]);

    this.device.queue.writeBuffer(this.simulationParamsBuffer, 0, paramsData);

    // Dispatch compute shader
    const commandEncoder = this.device.createCommandEncoder();
    const computePass = commandEncoder.beginComputePass();

    computePass.setPipeline(this.computePipeline);
    computePass.setBindGroup(0, this.computeBindGroup);

    // Dispatch enough workgroups (256 threads per workgroup)
    const workgroupCount = Math.ceil(this.particleCount / 256);
    computePass.dispatchWorkgroups(workgroupCount);

    computePass.end();
    this.device.queue.submit([commandEncoder.finish()]);
  }

  render(renderParams: RenderParams): void {
    if (!this.device || !this.context || !this.renderPipeline ||
        !this.renderBindGroup || !this.renderParamsBuffer || this.particleCount === 0) {
      return;
    }

    // Update render params buffer
    const paramsData = new Float32Array(32);

    // viewProjection matrix (16 floats)
    paramsData.set(renderParams.viewProjection, 0);

    // cameraRight (vec3) + padding
    paramsData[16] = renderParams.cameraRight.x;
    paramsData[17] = renderParams.cameraRight.y;
    paramsData[18] = renderParams.cameraRight.z;
    paramsData[19] = 0;

    // cameraUp (vec3) + padding
    paramsData[20] = renderParams.cameraUp.x;
    paramsData[21] = renderParams.cameraUp.y;
    paramsData[22] = renderParams.cameraUp.z;
    paramsData[23] = 0;

    // systemPosition (vec3) + padding
    paramsData[24] = renderParams.systemPosition.x;
    paramsData[25] = renderParams.systemPosition.y;
    paramsData[26] = renderParams.systemPosition.z;
    paramsData[27] = 0;

    // screenSize (vec2) + padding
    paramsData[28] = renderParams.screenSize.width;
    paramsData[29] = renderParams.screenSize.height;
    paramsData[30] = 0;
    paramsData[31] = 0;

    this.device.queue.writeBuffer(this.renderParamsBuffer, 0, paramsData);

    // Render
    const commandEncoder = this.device.createCommandEncoder();

    const textureView = this.context.getCurrentTexture().createView();

    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: textureView,
          clearValue: { r: 0, g: 0, b: 0, a: 0 },
          loadOp: "clear",
          storeOp: "store",
        },
      ],
    });

    renderPass.setPipeline(this.renderPipeline);
    renderPass.setBindGroup(0, this.renderBindGroup);

    // Draw 6 vertices (quad) per particle instance
    renderPass.draw(6, this.particleCount);

    renderPass.end();
    this.device.queue.submit([commandEncoder.finish()]);
  }

  updateAndRender(simulationParams: SimulationParams, renderParams: RenderParams): void {
    if (!this.device || this.particleCount === 0) return;

    // Combine compute and render into single command buffer for efficiency
    const commandEncoder = this.device.createCommandEncoder();

    // Update simulation params
    const simParamsData = new Float32Array([
      simulationParams.deltaTime,
      simulationParams.dampening,
      this.particleCount,
      0,
      simulationParams.forces.x,
      simulationParams.forces.y,
      simulationParams.forces.z,
      0,
      simulationParams.systemPosition.x,
      simulationParams.systemPosition.y,
      simulationParams.systemPosition.z,
      0,
    ]);
    this.device.queue.writeBuffer(this.simulationParamsBuffer!, 0, simParamsData);

    // Update render params
    const renderParamsData = new Float32Array(32);
    renderParamsData.set(renderParams.viewProjection, 0);
    renderParamsData[16] = renderParams.cameraRight.x;
    renderParamsData[17] = renderParams.cameraRight.y;
    renderParamsData[18] = renderParams.cameraRight.z;
    renderParamsData[19] = 0;
    renderParamsData[20] = renderParams.cameraUp.x;
    renderParamsData[21] = renderParams.cameraUp.y;
    renderParamsData[22] = renderParams.cameraUp.z;
    renderParamsData[23] = 0;
    renderParamsData[24] = renderParams.systemPosition.x;
    renderParamsData[25] = renderParams.systemPosition.y;
    renderParamsData[26] = renderParams.systemPosition.z;
    renderParamsData[27] = 0;
    renderParamsData[28] = renderParams.screenSize.width;
    renderParamsData[29] = renderParams.screenSize.height;
    renderParamsData[30] = 0;
    renderParamsData[31] = 0;
    this.device.queue.writeBuffer(this.renderParamsBuffer!, 0, renderParamsData);

    // Compute pass
    const computePass = commandEncoder.beginComputePass();
    computePass.setPipeline(this.computePipeline!);
    computePass.setBindGroup(0, this.computeBindGroup!);
    computePass.dispatchWorkgroups(Math.ceil(this.particleCount / 256));
    computePass.end();

    // Render pass
    const textureView = this.context!.getCurrentTexture().createView();
    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: textureView,
          clearValue: { r: 0, g: 0, b: 0, a: 0 },
          loadOp: "clear",
          storeOp: "store",
        },
      ],
    });
    renderPass.setPipeline(this.renderPipeline!);
    renderPass.setBindGroup(0, this.renderBindGroup!);
    renderPass.draw(6, this.particleCount);
    renderPass.end();

    this.device.queue.submit([commandEncoder.finish()]);
  }

  getParticleCount(): number {
    return this.particleCount;
  }

  getMaxParticles(): number {
    return this.maxParticles;
  }

  destroy(): void {
    this.particleBuffer?.destroy();
    this.simulationParamsBuffer?.destroy();
    this.renderParamsBuffer?.destroy();

    this.particleBuffer = null;
    this.simulationParamsBuffer = null;
    this.renderParamsBuffer = null;
    this.computeBindGroup = null;
    this.renderBindGroup = null;
    this.computePipeline = null;
    this.renderPipeline = null;
    this.device = null;
    this.context = null;
    this._initialized = false;
  }
}

export default WebGPUParticleRenderer;
