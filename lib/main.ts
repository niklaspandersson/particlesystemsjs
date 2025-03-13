export { Particle } from "./particle";
export type { ParticleEmitterOptions } from "./emitter";
export { ParticleSystem, type ParticleSystemOptions } from "./particlesystem";
export type { NumRange, Vec3, Vec3Optional } from "./math";
export { SpawnOnDOMElement, type SpawnOnDOMElementOptions, type SpawnedPSOptions } from "./helpers/SpawnOnDOMElement";
import { normalize, magnitude } from "./math";
import { random, randomize } from "./math/random";
import { circle } from "./math/factories/circle";
import { inDirectionOf } from "./math/factories/direction";

export const MathUtils = {
  magnitude,
  normalize,
  random,
  randomize,
  Factories: {
    circle,
    inDirectionOf
  }
}
