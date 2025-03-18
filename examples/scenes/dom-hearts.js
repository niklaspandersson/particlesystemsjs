import { MathUtils, SpawnOnDOMElement } from "../../lib/main.ts";
import { createHeart } from "../utils/textures";

const html = `<h1>Test page for Particlesystems</h1>
  <p>Lorem ipsum dolor sit, <button id="btnTEST" class="test">Give some love</button> amet consectetur adipisicing elit. Id dolore, culpa repellat nulla rerum accusamus dolorum non magnam sapiente minus autem cupiditate placeat vitae expedita, porro architecto <button id="btnTEST" class="test">Give some love</button> eveniet!  Ipsa, esse.</p>
  <h2>An interesting header</h2>
  <p id="inside" style="width: 500px; height: 400px; background: lightblue; color: black; font-weight: bold;">Lorem ipsum dolor sit, amet consectetur adipisicing elit. Id dolore, culpa repellat nulla rerum accusamus dolorum non magnam <button class="test">Give some love</button> sapiente minus autem cupiditate placeat vitae expedita, porro architecto eveniet! Ipsa, esse.</p>
  <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Id dolore, culpa repellat nulla rerum accusamus dolorum non magnam sapiente minus autem cupiditate placeat vitae expedita, porro architecto eveniet! Ipsa, esse.</p>
  <h2>Another title</h2>
  <p>Lorem ipsum dolor sit, <button id="btnTEST" class="test">Give some love</button> amet consectetur adipisicing elit. Id dolore, culpa repellat nulla rerum accusamus dolorum non magnam sapiente minus autem cupiditate placeat vitae expedita, porro architecto eveniet! Ipsa, esse.</p>
  <h2>An interesting header</h2>
  <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Id dolore, culpa repellat nulla rerum accusamus dolorum non magnam <button class="test">Give some love</button> sapiente minus autem cupiditate placeat vitae expedita, porro architecto eveniet! Ipsa, esse.</p>
  <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Id dolore, culpa repellat nulla rerum accusamus dolorum non magnam sapiente minus autem cupiditate placeat vitae expedita, porro architecto eveniet! Ipsa, esse.</p>
  <h2>Another title</h2>
  <p>Lorem ipsum dolor sit, <button id="btnTEST" class="test">Give some love</button> amet consectetur adipisicing elit. Id dolore, culpa repellat nulla rerum accusamus dolorum non magnam sapiente minus autem cupiditate placeat vitae expedita, porro architecto eveniet! Ipsa, esse.</p>
  <h2>An interesting header</h2>
  <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Id dolore, culpa repellat nulla rerum accusamus dolorum non magnam <button class="test">Give some love</button> sapiente minus autem cupiditate placeat vitae expedita, porro architecto eveniet! Ipsa, esse.</p>
  <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Id dolore, culpa repellat nulla rerum accusamus dolorum non magnam sapiente minus autem cupiditate placeat vitae expedita, porro architecto eveniet! Ipsa, esse.</p>
  <h2>Another title</h2>
  <p>Lorem ipsum dolor sit, <button id="btnTEST" class="test">Give some love</button> amet consectetur adipisicing elit. Id dolore, culpa repellat nulla rerum accusamus dolorum non magnam sapiente minus autem cupiditate placeat vitae expedita, porro architecto eveniet! Ipsa, esse.</p>
  <h2>An interesting header</h2>
  <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Id dolore, culpa repellat nulla rerum accusamus dolorum non magnam <button class="test">Give some love</button> sapiente minus autem cupiditate placeat vitae expedita, porro architecto eveniet! Ipsa, esse.</p>
  <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Id dolore, culpa repellat nulla rerum accusamus dolorum non magnam sapiente minus autem cupiditate placeat vitae expedita, porro architecto eveniet! Ipsa, esse.</p>`;

const heart = createHeart();

function draw(canvas, ps) {
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);

  context.save();
  context.translate(ps.position.x, ps.position.y);

  ///draw particles
  ps.particles.forEach(function (p) {
    const userData = p.data;

    let a = 1 - p.normalizedAge;
    context.globalAlpha = (.1 - p.normalizedAge * .1) + -a * a * (a - 1) * 4.75 * userData.opacity;

    const width = heart.width * userData.scale * (.3 + p.normalizedAge * .7);
    const height = heart.height * userData.scale * (.3 + p.normalizedAge * .7);

    context.drawImage(heart, p.position.x - width / 2, p.position.y - height / 2, width, height);
  });

  context.restore();
}

export default function init({ container }) {

  const hoverOpts = {
    initialCount: 2,
    emitter: {
      particlesPerSecond: 1.2,
      particles: {
        initialVelocity: MathUtils.Factories.inDirectionOf({ x: 8, y: 8 }, Math.PI * 2, .6),
        lifetime: { min: 2, max: 3 },
        customDataFactory: () => ({
          opacity: MathUtils.random({ min: .25, max: .35 }),
          scale: MathUtils.random({ min: .7, max: 1.2 })
        })
      }
    }
  }
  const clickOpts = {
    initialCount: 4,
    forces: {
      lift: { x: 0, y: -25, z: 0 }
    },
    emitter: {
      particlesPerSecond: 4,
      lifetime: 3,
      particles: {
        initialVelocity: MathUtils.Factories.inDirectionOf({ x: 0, y: -34 }, Math.PI * 6 / 4, .4),
        lifetime: { min: 1.5, max: 3 },
        customDataFactory: () => ({
          opacity: MathUtils.random({ min: .5, max: .8 }),
          scale: MathUtils.random({ min: 1, max: 2 })
        })
      }
    }
  }

  container.innerHTML = html;

  const cleanupHovers = SpawnOnDOMElement({
    event: "mouseenter",
    elements: container.querySelectorAll("button"),
    stopEvent: "mouseleave",
  }, hoverOpts, draw);

  const cleanupClicks = SpawnOnDOMElement({
    event: "click",
    inset: 1,
    elements: container.querySelectorAll(".test")
  }, clickOpts, draw);

  return () => {
    console.log("cleanup dom-hearts")
    cleanupClicks();
    cleanupHovers();
  }
}

