export { Particle } from "./particle";
export { ParticleSystem } from "./particlesystem";
export { NumRange, Vec3, Vec3Optional } from "./math";

import {normalize, magnitude } from "./math";
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
