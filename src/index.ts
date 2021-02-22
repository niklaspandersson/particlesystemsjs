export { Particle } from "./particle";
export { ParticleSystem } from "./particlesystem";
export { NumRange, Vec2d } from "./math";

import {normalize2d, magnitude2d } from "./math";
import { random, randomize } from "./math/random";

export const MathUtils = {
  magnitude2d,
  normalize2d,
  random,
  randomize
}
