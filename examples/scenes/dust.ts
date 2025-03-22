import { ParticleSystem, MathUtils } from "particlesystems";
import { Sprites } from "../utils/sprites";

import { IDemo } from "./demo";

const sprites = new Sprites();

export class Dust implements IDemo {

  private scene: HTMLCanvasElement | undefined;
  private ps: ParticleSystem | undefined;
  private animationFrameId: number;

  constructor() {
    this.animationFrameId = 0;
    this.clearCanvas = this.clearCanvas.bind(this);
  }

  public start(scene: HTMLCanvasElement) {
    this.scene = scene;

    //stop previous instance
    this.ps?.stop();

    this.ps = new ParticleSystem({
      initialCount: 40,
      initialAge: () => Math.random(),
      emitter: {
        particlesPerSecond: 10,
        strategy: "random",
        particles: {
          initialPos: () => {
            return { x: MathUtils.random({ min: 0, max: this.scene!.width }), y: MathUtils.random({ min: 0, max: this.scene!.height }) }
          },
          initialVelocity: { x: { min: -10, max: 10 }, y: { min: -10, max: 10 } },
          lifetime: { min: 4, max: 6 },
          customDataFactory: () => ({ reverse: (Math.random() > .5) })
        }
      }
    }, this.draw.bind(this));

    this.clearCanvas();
    this.ps.start();
  }

  private clearCanvas() {
    const ctx = this.scene!.getContext("2d")!;
    ctx.clearRect(0, 0, this.scene!.width, this.scene!.height);
    this.animationFrameId = window.requestAnimationFrame(this.clearCanvas);
  }

  public stop() {
    if (this.animationFrameId)
      window.cancelAnimationFrame(this.animationFrameId);

    this.ps?.stop();
  }

  private draw(ps: ParticleSystem, dt: number) {
    ///DRAWING
    let ctx = this.scene!.getContext("2d")!;

    ps.particles.forEach(function (p) {
      const userData = p.data!;

      ctx.save();
      let a = userData?.reverse ? p.normalizedAge : (1 - p.normalizedAge);
      ctx.globalAlpha = -a * a * (a - 1) * 3.75;
      ctx.translate(p.position.x, p.position.y);
      sprites.drawSprite(ctx, "Flare", 0, 0, userData.reverse ? .11 : .075);
      ctx.restore();
    });
  }
}