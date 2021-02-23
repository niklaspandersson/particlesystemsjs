export { Particle } from "./particle";
export { ParticleSystem } from "./particlesystem";
export { NumRange, Vec3, Vec3Optional } from "./math";

import {normalize, magnitude } from "./math";
import { random, randomize } from "./math/random";

export const MathUtils = {
  magnitude,
  normalize,
  random,
  randomize
}
