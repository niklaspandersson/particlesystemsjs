import { ParticleSystem, MathUtils } from "particlesystems";
import { Sprites } from "./sprites";

import { IDemo } from "./demo";

const sprites = new Sprites();

export class Explosion implements IDemo {

  private scene:HTMLCanvasElement|undefined;
  private ps:ParticleSystem|undefined;
  private animationFrameId:number;

  constructor() {
    this.animationFrameId = 0;
    this.clearCanvas = this.clearCanvas.bind(this);
  }

  public start(scene:HTMLCanvasElement) {
    this.scene = scene;

    scene.addEventListener('click', ev => {
      //stop previous instance
      this.ps?.stop();

      this.ps = new ParticleSystem({ 
        initialCount: 0,
        position: {x: ev.offsetX, y: ev.offsetY},
        emitter: {
          particlesPerSecond: 15,
          lifetime: 1,
          strategy: "random",
          particles: {
            initialPos: age => {
              const a = easeInOutQuart(age ?? 1);
              return {x: MathUtils.random({min: -50*a, max: 50*a}), y: MathUtils.random({min: -10*a, max: 10*a})}
            },
            initialVelocity: { x: {min: -0, max: 0}, y: {min: -0, max: 0} },
            lifetime: { min: .4, max: .6 },
            customDataFactory: this.init
          }
        }
      }, this.draw.bind(this));

      this.clearCanvas();      
      this.ps.start();

    });
  }

  init() {
    return {
      initialRotation: MathUtils.random({min:0, max: Math.PI*2}) * MathUtils.randomize([-1, 1]),
      rotationSpeed: MathUtils.random({min: -.3, max: .3})
    };
  }

  private clearCanvas() {
    const ctx = this.scene!.getContext("2d")!;
    ctx.clearRect(0,0,this.scene!.width, this.scene!.height);
    this.animationFrameId = window.requestAnimationFrame(this.clearCanvas);    
  }

  public stop() {
    if(this.animationFrameId)
      window.cancelAnimationFrame(this.animationFrameId);

    this.ps?.stop();
  }
  
  private draw(ps:ParticleSystem, dt:number) {
    ///DRAWING
    let ctx = this.scene!.getContext("2d")!;

    ps.particles.forEach(function(p) {
      const userData = p.data!;

      ctx.save();
      let a = p.normalizedAge;
      ctx.globalAlpha = (-a*a*(a-1)*3);  //nice in-out ease
      ctx.translate(ps.position.x + p.position.x, ps.position.y+ p.position.y);
      ctx.rotate(userData.initialRotation + userData.rotationSpeed*a)
      sprites.drawSprite(ctx, "Explosion", 0, 0, easeOutQuint(p.normalizedAge));
      ctx.restore();
    });
  }  
}

function easeOutQuint(x: number): number {
  return 1 - Math.pow(1 - x, 5);
}

function easeInOutQuart(x: number): number {
  return x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2;
}