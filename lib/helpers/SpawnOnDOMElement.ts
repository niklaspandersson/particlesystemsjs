import { ParticleEmitterOptions } from "../emitter";
import { NumRange, Vec3, Vec3Optional } from "../math";
import Particle from "../particle";
import { ParticleSystem, ParticleSystemOptions } from "../particlesystem";

export type SpawnOnDOMElementOptions = {
  event: string,
  elements: string | HTMLElement | NodeList | HTMLCollection,
  stopEvent?: string,
  maxDistance?: number,
  inside?: boolean,
  inset?: number,
  canvasClassname?: string
};

type NumberFactory = (age?: number, pos?: Vec3<number>, vel?: Vec3<number>) => number;
type Vec3Factory = (age?: number, pos?: Vec3<number>, vel?: Vec3<number>) => Vec3Optional<number>

export type SpawnedPSOptions<T> = Omit<Partial<ParticleSystemOptions<T>>, "position" | "emitter"> & {
  emitter: Omit<Partial<ParticleEmitterOptions<T>>, "particles" | "particlesPerSecond"> & {
    particles: {
      initialVelocity: Vec3Optional<number | NumRange> | Vec3Factory;
      lifetime: number | NumRange | NumberFactory;
      customDataFactory?: (p: Particle<T>, age?: number) => T;
    },
    particlesPerSecond: number
  }
}

export function SpawnOnDOMElement<T>(options: SpawnOnDOMElementOptions, psOptions: SpawnedPSOptions<T>, drawHandler: (context: HTMLCanvasElement, ps: ParticleSystem<T>, dt?: number) => void) {
  if (typeof options.elements === "string")
    Array.from(document.querySelectorAll<HTMLElement>(options.elements)).forEach(el => setupElement(el, options, psOptions, drawHandler))
  else if (options.elements instanceof HTMLElement)
    setupElement(options.elements, options, psOptions, drawHandler);
  else if (options.elements instanceof NodeList || options.elements instanceof HTMLCollection)
    Array.from(options.elements).filter(el => el instanceof HTMLElement).forEach((el) => setupElement(el as HTMLElement, options, psOptions, drawHandler))
}

function setupElement<T>(element: HTMLElement, options: SpawnOnDOMElementOptions, psOptions: SpawnedPSOptions<T>, drawHandler: (context: HTMLCanvasElement, ps: ParticleSystem<T>, dt?: number) => void) {
  const inside = options.inside || false;

  function eventHandler(_: Event) {
    const targetRect = element.getBoundingClientRect();
    const bounds = (inside) ? createInsideCanvasBounds(targetRect, options.inset || 0) : createAbsoluteCanvasBounds(targetRect, options.maxDistance, options.inset);
    let canvas: HTMLCanvasElement = createCanvas(bounds, options.canvasClassname);

    const opts = createParticleSystemOptions(psOptions, targetRect, bounds);
    const ps = new ParticleSystem<T>(opts, (ps, dt) => drawHandler(canvas, ps, dt));

    const scrollOrResizeHandler = () => {
      ps?.stop();
    }
    window.addEventListener("resize", scrollOrResizeHandler, { once: true });

    //function that gets called when the optional stop-event occurs
    const stopEventHandler = () => {
      ps.emitter.stop();

      //TODO: might want to add support for fading out effect faster than 
      //by just stopping the emitter
      // const keyframes = new KeyframeEffect(canvas, [{ opacity: 0 }], { duration: options.stopFadeOutDuration })
      // const animation = new Animation(keyframes, document.timeline);
      // animation.addEventListener("finish", () => ps?.stop());
      // animation.play();
    }

    if (options.stopEvent) {
      element.addEventListener(options.stopEvent, stopEventHandler, { once: true });
    }

    // remove the canvas from the document once the ParticleSystem dies
    ps.once("stop", () => {
      canvas.remove();
      if (options.stopEvent)
        element.removeEventListener(options.stopEvent, stopEventHandler);

      window.removeEventListener("resize", scrollOrResizeHandler);
    });



    //add the canvas to the document
    if (inside) {
      if (window.getComputedStyle(element)?.position === "static")
        element.style.position = "relative";
      element.append(canvas);
    }
    else
      document.body.append(canvas);

    //start the particle system
    ps.start();
  }

  element.addEventListener(options.event, eventHandler);
  return eventHandler;
}

type Bounds = {
  top: number,
  left: number,
  width: number,
  height: number,
  inset: number,
  maxDistance: number
}

function createInsideCanvasBounds(origin: DOMRect, inset: number) {
  const top = 0;
  const height = Math.ceil(origin.height);
  const left = 0;
  const width = Math.ceil(origin.width);

  return { top, left, width, height, inset, maxDistance: 0 };
}

function createAbsoluteCanvasBounds(origin: DOMRect, maxDistance?: number, maxInset?: number) {
  const hasInset = typeof maxInset !== "undefined";
  maxDistance = maxDistance || 200;
  const bodyClientRect = document.body.getBoundingClientRect();
  const bodyMarginLeft = window.scrollX + bodyClientRect.left;
  const bodyMarginTop = window.scrollY + bodyClientRect.top;
  const top = Math.floor(origin.top - maxDistance + window.scrollY);
  const left = Math.floor(origin.left - maxDistance + window.scrollX);
  let inset = Math.min(origin.width, origin.height) / 2;
  if (hasInset)
    inset = Math.min(maxInset!, inset);

  let height = Math.ceil(origin.height + maxDistance * 2);
  let width = Math.ceil(origin.width + maxDistance * 2);

  if (left + width > (document.body.scrollWidth + bodyMarginLeft)) {
    width -= ((left + width) - document.body.scrollWidth - bodyMarginLeft * 2)
  }
  if (top + height > document.body.scrollHeight + bodyMarginTop) {
    height -= ((top + height) - document.body.scrollHeight - bodyMarginTop * 2)
  }

  return { top, left, width, height, inset, maxDistance };
}


function createCanvas(bounds: Bounds, classname?: string) {
  const canvas = document.createElement("canvas");
  canvas.style.position = "absolute";
  canvas.style.left = `${bounds.left}px`;
  canvas.style.top = `${bounds.top}px`;
  canvas.style.pointerEvents = "none";
  canvas.style.width = `${bounds.width}px`;
  canvas.style.height = `${bounds.height}px`;
  //canvas.style.background = `rgba(0,0,0,.2)`; //NOTE: keep for debugging
  canvas.width = bounds.width;
  canvas.height = bounds.height;
  if (classname)
    canvas.className = classname;
  return canvas;
}

function createParticleSystemOptions<T>(psOptions: SpawnedPSOptions<T>, targetRect: DOMRect, canvasBounds: Bounds) {
  return {
    ...psOptions,
    position: { x: canvasBounds.maxDistance + targetRect.width / 2, y: canvasBounds.maxDistance + targetRect.height / 2 },
    emitter: {
      ...psOptions.emitter,
      particles: {
        ...psOptions.emitter.particles,
        initialPos: {
          x: {
            min: -(targetRect.width / 2) + canvasBounds.inset,
            max: +(targetRect.width / 2) - canvasBounds.inset
          },
          y: {
            min: -(targetRect.height / 2) + canvasBounds.inset,
            max: (targetRect.height / 2) - canvasBounds.inset
          }
        }
      }
    }
  }
}