
const canvas = document.getElementById('overlay')! as HTMLCanvasElement;
const container = document.getElementById('scene-container')! as HTMLElement;

document.querySelector('nav')?.addEventListener('click', e => {
  const sceneId = (e.target as HTMLElement).dataset?.['scene'];
  if (sceneId) {
    loadScene(sceneId);
  }
});

let uninit: Function | undefined;
async function loadScene(sceneId: string) {
  uninit?.()
  container.innerHTML = ""

  let url = sceneId;
  const module = await import(`./scenes/${url}`)
  const init = module.default

  uninit = init({ canvas, container })
}

function resizeHandler() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

window.addEventListener("load", resizeHandler);
window.addEventListener("resize", resizeHandler);




// const heart = createHeartSprite();
// function draw(canvas: HTMLCanvasElement, ps: ParticleSystem) {
//   const context = canvas.getContext("2d")!;
//   context.clearRect(0, 0, canvas.width, canvas.height);

//   context.save();
//   context.translate(ps.position.x, ps.position.y);

//   ///draw particles
//   ps.particles.forEach(function (p) {
//     const userData = p.data!;

//     let a = 1 - p.normalizedAge;
//     context.globalAlpha = (.1 - p.normalizedAge * .1) + -a * a * (a - 1) * 4.75 * userData.opacity;

//     const width = heart.width * userData.scale * (.3 + p.normalizedAge * .7);
//     const height = heart.height * userData.scale * (.3 + p.normalizedAge * .7);

//     context.drawImage(heart, p.position.x - width / 2, p.position.y - height / 2, width, height);
//   });

//   context.restore();
// }

// const hoverOpts = {
//   initialCount: 2,
//   emitter: {
//     particlesPerSecond: 1.2,
//     particles: {
//       initialVelocity: MathUtils.Factories.inDirectionOf({ x: 8, y: 8 }, Math.PI * 2, .6),
//       lifetime: { min: 2, max: 3 },
//       customDataFactory: () => ({
//         opacity: MathUtils.random({ min: .25, max: .35 }),
//         scale: MathUtils.random({ min: .7, max: 1.2 })
//       })
//     }
//   }
// }
// const clickOpts = {
//   initialCount: 4,
//   forces: {
//     lift: { x: 0, y: -25, z: 0 }
//   },
//   emitter: {
//     particlesPerSecond: 4,
//     lifetime: 3,
//     particles: {
//       initialVelocity: MathUtils.Factories.inDirectionOf({ x: 0, y: -34 }, Math.PI * 6 / 4, .4),
//       lifetime: { min: 1.5, max: 3 },
//       customDataFactory: () => ({
//         opacity: MathUtils.random({ min: .65, max: .9 }),
//         scale: MathUtils.random({ min: 1, max: 2 })
//       })
//     }
//   }
// }


// SpawnOnDOMElement({
//   event: "mouseenter",
//   elements: "button",
//   stopEvent: "mouseleave",
// }, hoverOpts, draw);

// SpawnOnDOMElement({
//   event: "click",
//   inset: 1,
//   elements: ".test"
// }, clickOpts, draw);

// function createHeartSprite() {
//   const img = new Image();
//   img.src = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABb2lDQ1BpY2MAACiRdZE7SwNBFIU/EyWiEQstRCxSqFgoRAWxlAimUYskglGb3TUPIdksuwkSbAUbi4CFaOOr8B9oK9gqCIIiiNj4B3w1EtY7JpAgySyz9+PMnMvMGfDMZ4ys0xqErJm3I+FQYDm+EvC94cWDn3F6NcOxFqJzMZqO7wdaVL0fU72a72s4OtcTjgEt7cJThmXnhWeE5zfzluJd4V4jra0LHwuP2nJA4Rul6xV+VZyq8KdiOxaZBY/qGUjVsV7HRtrOCo8ID2YzBaN6HnUTf8JcikrtlzmAQ4QwIQLoFNggQ54xqaZk1tgX/PMtkhOPIX+LIrY4UqTFOypqQbompCZFT8iXoahy/5+nk5ycqHT3h6DtxXU/hsC3B+WS6/6cuG75FLzPcGXW/DnJafpL9FJNGzyC7m24uK5p+j5c7kDfk6XZ2p/klelJJuH9HLri0HMHHauVrKrrnD1CbEue6BYODmFY9nev/QLg5Wf8eVdnGAAAAAlwSFlzAAALEgAACxIB0t1+/AAAAzRJREFUWEftlktIVFEYx79zx0dQlm5aCS2CsJlFmyjNFI02YRAIgqty1a5dT4tWQS4j27WIWolUUKQEFY4FKkqLwBEqgoJWLaKX2DjOPf2+8c5wne48rs7kpjNchnse///vfN855x6R/2WTI2CK+T9tbTENTs12V6SWjkuHp+YXy+F9dSjWlLZ2wBHzYsXa+SMzC0gEl0CAibZYS40xJ63Ybmul2YrU0fGnMfJOxDxadt2RozML3/2Sz1ujDXWO009dr7U2yn8TzxJjPhoxzwC52z2deJ+PsQYg3hbl3ZyNGDNYa0wjsxBFB0C0Y0Rb+emseM4gGFdBgDsAHubZB7SkGeAyFnMhCkK9pKz9it41ScuNrtmESmZKHkDser3jXExZF4HCwa51jLb/QLBXewH8gKodqSKDaCePRpKuHeqaTlz6CyDeFuuDdFRnXcQ7R4UpM7XfPIBMtEqV1ShmItgHxP1cBDDfysssAFEaS+nk2nVWWopFK19Mo0A6Fqg/AMSi43XoDGueNQ5jrmMw1zWhi7RD37MA7bpQ/lXxvNr9AHvdsjJfGUTPq8UP8DtvQ1TGqaBKJtpJP0Aim4sqO2fkPa+EHyC+bN2Cx2WloTyvST/AHKt5qi67ryrt6NNTD/Wiai4HwH5M8XKFIzRZTQbVVg+8LnueuW0oVExyCJ3n7LbV2JCqqdp4nMPrZTYoa9YeH5ebdLiq+7SSEKqlmqqNx7A/w4E+HM1D5OrCcthjrsDa0byjteYjFBiB3Hgrgwy4xZdxw8tRNVRL8x4kVjDSRKGGAbcRGEiuc4eqOWPvoHOavK+EAtDOXDS2EIN73HT6wkKsztwd5XA5Rd45aYNLybUGxDYgRoDoKRfCMx/DvB/zX8XyWBLAi0QjEA+B6C4F4ZlPYN6LeebCsmEAD2JnROQx17GDXKsCNetZ7VzLZtIiJzD/Uspc28uKQFZoojXWHHHkiV4+87eobjX2+RtOuuOYfy7HPDSAF4nd3I7HudvtyV5CPfO3mPdg/qFc83UBeBAxAMZIyS59J+SfuJSqeeYTG6aESoFfmN2xn1SMax2hP4b56zDGFekLRKc+FRHbLJE/0kpdebzc6NUAAAAASUVORK5CYII=`;
//   return img;
// }