export { Particle } from "./particle";
export { ParticleSystem } from "./particlesystem";
export { NumRange, Vec3, Vec3Optional } from "./math";

// WebGPU exports
export {
  GPUParticleSystem,
  GPUParticleSystemOptions,
  GPUParticleColor,
  GPUParticleCustomData,
  CameraParams,
  WebGPUParticleRenderer,
  GPUParticleData,
  SimulationParams,
  RenderParams,
} from "./webgpu";

import { normalize, magnitude } from "./math";
import { random, randomize } from "./math/random";

export const MathUtils = {
  magnitude,
  normalize,
  random,
  randomize,
}
