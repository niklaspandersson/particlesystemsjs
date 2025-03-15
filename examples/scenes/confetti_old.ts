import { ParticleSystem, MathUtils } from "particlesystems";

import { IDemo } from "./demo";

const Size = 2;
const Width = 12*Size;
const Height = 6*Size;

const halfWidth = Width/2;
const halfHeight = Height/2;

type ParticleUserData = {
  initialRotation: number,
  rotationSpeed: number,
  color: string
}

export class Confetti implements IDemo {

  private scene:HTMLCanvasElement|undefined;
  private ps:ParticleSystem[]|undefined;
  private animationFrameId:number;

  constructor() {
    this.animationFrameId = 0;
    this.clearCanvas = this.clearCanvas.bind(this);
  }

  public start(scene:HTMLCanvasElement) {
    this.scene = scene;

    scene.addEventListener('click', ev => {
      //stop previous instance
      this.ps?.forEach(ps => ps?.stop());

      this.ps = Array(2).fill(0).map((el, i) => new ParticleSystem({ 
        initialCount: 0,
        position: {x: !!i ? ev.offsetX : (this.scene!.width -ev.offsetX), y: ev.offsetY},
        forces: {
          gravity: {x: 0, y: 498, z: 0 },
          wind: { x: (!!i ? 1 : -1) *-100, y: 0, z: 0 }
        },
        emitter: {
          particlesPerSecond: 1500,
          lifetime: .06,
          strategy: "random",
          particles: {
            initialPos: {x: {min: -5, max: 5}, y: {min: -5, max: 5}},
            initialVelocity: MathUtils.Factories.inDirectionOf({x: (!!i ? 1 : -1) * 500, y: -500}, Math.PI/5, .4),
            lifetime: {min: .5, max: 2},
            customDataFactory: this.init
          }
        }
      }, this.draw.bind(this)))

      this.clearCanvas();
      this.animationFrameId = window.requestAnimationFrame(this.clearCanvas);
      
      this.ps?.forEach(ps => ps?.start());
    });
  }

  private clearCanvas() {
    const ctx = this.scene!.getContext("2d")!;
    ctx.clearRect(0,0,this.scene!.width, this.scene!.height);
    window.requestAnimationFrame(this.clearCanvas);    
  }

  public stop() {
    if(this.animationFrameId)
      window.cancelAnimationFrame(this.animationFrameId);

      this.ps?.forEach(ps => ps?.stop());
  }
  
  init() {
    return {
      initialRotation: MathUtils.random({min:0, max: Math.PI*2}) * MathUtils.randomize([-1, 1]),
      rotationSpeed: MathUtils.random({min: .2, max: 2}),
      color: MathUtils.randomize(['orange', 'lightblue', 'green', 'red'])
    };
  }
  
  private draw(ps:ParticleSystem<ParticleUserData>, dt:number) {
    ///DRAWING
    let ctx = this.scene!.getContext("2d")!;
  
    ps.particles.forEach(function(p) {
      const userData = p.data!;

      ctx.save();
      ctx.globalAlpha = 1-p.normalizedAge;
      ctx.fillStyle = p.data?.color!;
      ctx.translate(ps.position.x + p.position.x, ps.position.y + p.position.y);
      ctx.rotate(userData.initialRotation + Math.PI*2*p.normalizedAge**2*userData.rotationSpeed)
      ctx.fillRect(-halfWidth, -halfHeight, halfWidth, halfHeight);
      ctx.restore();
    });
  }  
}

