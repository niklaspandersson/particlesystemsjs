import { ParticleSystem, MathUtils } from "particlesystems";
import { Sprites } from "../utils/sprites";

import { IDemo } from "./demo";

const sprites = new Sprites();

export class OnEvent implements IDemo {
  private animationFrameId = 0;
  private ps: ParticleSystem | null = null;

  private stopCallback: (() => void) | null = null;

  constructor() {
  }

  public start(scene: HTMLCanvasElement) {
    const app = document.querySelector<HTMLElement>(".app");
    if (app) {
      app.addEventListener("click", this.clickHandler)
    }

    return true;
  }

  private clickHandler = (ev: MouseEvent) => {


    const target = ev.target as HTMLButtonElement;
    if (target.id === "btn-test") {
      const MaxDistance = 200;
      const rect = target.getBoundingClientRect();
      const top = Math.floor(rect.top - MaxDistance);
      const height = Math.ceil(rect.height + MaxDistance * 2);
      const left = Math.floor(rect.left - MaxDistance);
      const width = Math.ceil(rect.width + MaxDistance * 2);
      const Offset = Math.min(rect.width, rect.height) / 2;

      const canvas = document.createElement("canvas");
      canvas.style.position = "fixed";
      canvas.style.pointerEvents = "none";
      canvas.style.left = `${left}px`;
      canvas.style.width = `${width}px`;
      canvas.style.top = `${top}px`;
      canvas.style.height = `${height}px`;
      canvas.width = width;
      canvas.height = height;
      (ev.currentTarget as HTMLElement).append(canvas);

      const clearCanvas = () => {
        if (canvas) {
          const ctx = canvas.getContext("2d")!;
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          this.animationFrameId = window.requestAnimationFrame(clearCanvas);
        }
      }

      const resizeHandler = () => {
        this.ps?.stop();
        canvas.remove();
      }
      window.addEventListener("scroll", resizeHandler, { once: true });
      window.addEventListener("resize", resizeHandler, { once: true });

      this.stopCallback = () => {
        window.removeEventListener("resize", resizeHandler);
        const app = document.querySelector<HTMLElement>(".app");
        if (app) {
          app.removeEventListener("click", this.clickHandler)
        }

        if (this.animationFrameId)
          window.cancelAnimationFrame(this.animationFrameId);

        this.ps?.stop();
      }

      const initialPos = {
        x: {
          min: -(rect.width / 2) + Offset,
          max: +(rect.width / 2) - Offset
        },
        y: {
          min: (rect.height / 2) + Offset,
          max: (rect.height / 2) - Offset
        }
      };
      console.log(initialPos)

      this.ps = new ParticleSystem({
        position: { x: width / 2, y: height / 2 },
        emitter: {
          particlesPerSecond: 50,
          lifetime: 3,
          strategy: "random",
          particles: {
            initialPos,
            initialVelocity: { x: { min: -20, max: 20 }, y: { min: -20, max: 20 } },
            lifetime: { min: 4, max: 6 }
          }
        }
      }, (ps) => {
        ///DRAWING
        let ctx = canvas.getContext("2d")!;

        ctx.save();
        ctx.translate(ps.position.x, ps.position.y);
        ps.particles.forEach(function (p) {
          const userData = p.data!;

          let a = 1 - p.normalizedAge;
          ctx.globalAlpha = -a * a * (a - 1) * 3.75;
          ctx.fillStyle = "red";
          ctx.fillRect(p.position.x - 2.5, p.position.y - 2.5, 5, 5);
          //sprites.drawSprite(ctx, "Flare", p.position.x, p.position.y, .11);
        });
        ctx.clearRect(-rect.width / 2, -rect.height / 2, rect.width, rect.height);
        ctx.restore();
      });

      clearCanvas();
      this.ps.start();
    }
  }

  public stop() {
    this.stopCallback?.();
  }
}