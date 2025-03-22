import { ParticleSystem, MathUtils } from "particlesystems";
import { Sprites } from "../utils/sprites";

import { IDemo } from "./demo";

const sprites = new Sprites();

export class Bubbles implements IDemo {

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
      initialCount: 0,
      forces: {
        gravity: { x: 0, y: -40, z: 0 }
      },
      emitter: {
        particlesPerSecond: 15,
        strategy: "random",
        particles: {
          initialPos: { x: { min: this.scene!.width / 2 - 40, max: this.scene!.width / 2 + 40 }, y: { min: this.scene!.height - 10, max: this.scene!.height } },
          initialVelocity: MathUtils.Factories.inDirectionOf({ x: 0, y: -100 }, Math.PI / 4, .6),
          lifetime: { min: .8, max: 3.5 }
        }
      }
    }, this.draw.bind(this));

    this.clearCanvas();
    this.animationFrameId = window.requestAnimationFrame(this.clearCanvas);

    this.ps.start();
  }

  private clearCanvas() {
    const ctx = this.scene!.getContext("2d")!;
    ctx.clearRect(0, 0, this.scene!.width, this.scene!.height);
    window.requestAnimationFrame(this.clearCanvas);
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
      ctx.save();
      ctx.globalAlpha = 1 - p.normalizedAge;
      ctx.translate(p.position.x, p.position.y);
      sprites.drawSprite(ctx, "Ring", 0, 0, p.normalizedAge * .4);
      ctx.restore();
    });
  }
}

