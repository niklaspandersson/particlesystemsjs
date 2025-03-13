import { Bubbles } from "./bubbles";
import { Confetti } from "./confetti";
import { Explosion } from "./explosion";
import { IDemo } from "./demo";
import { Dust } from "./dust";
import { OnEvent } from "./OnEvent";

export function createDemo(key:string):IDemo|null {
  switch(key) {
    case 'bubbles':
      return new Bubbles();
    case 'confetti':
      return new Confetti();
    case 'explosion':
      return new Explosion();
    case 'dust':
      return new Dust();
    case 'onevent':
      return new OnEvent();
  }

  return null;
}