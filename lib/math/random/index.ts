import { NumRange } from "../index";

export function random({min, max}:NumRange) { return min + Math.random()*(max-min) };
export function randomize<T>(values:T[]) { return values[Math.floor(Math.random()*values.length)] };

export {default as gaussian} from "./gaussian";