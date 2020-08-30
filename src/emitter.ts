import Particle from "./particle";
import gaussian from "./math/gaussian";

export type ParticleEmitterOptions = {
  particlesPerSecond: number;
  strategy: "random" | "periodical";
  lifetime?: number;
}

export class ParticleEmitter<T> {
  private _opts: ParticleEmitterOptions;
  constructor(opts:ParticleEmitterOptions) {
    this._opts = opts;
  }

  onInit(initialCount:number) {
    return Array(initialCount).fill(null).map(_ => this.createParticle());
  }
  onUpdate(dt:number) {
    const cnt = this.randomParticleCount(dt);
    return cnt ? Array(cnt).fill(null).map(_ => this.createParticle()) : null;
  }

  private createParticle() {
    return new Particle<T>({
      initialPos: this.createPosition(),
      initialVelocity: this.createVelocity(),
      lifetime: this.createLifetime()
    })
  }

  private randomParticleCount(dt:number) {
    const fracMean = this._opts.particlesPerSecond*dt;
    let instant = 0;
    do {
      instant = gaussian(fracMean, .8)
    } while(Math.abs(fracMean-instant) > fracMean)

    return Math.round(instant);
  }
}