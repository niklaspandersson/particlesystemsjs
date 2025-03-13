import { Vec3, Vec3Optional } from "..";
import { random } from "../random"

/**
* Helper function to create vectors going in a certain general direction
* @param vec A vector describing the general direction and speed of the particles
* @param spread An angle in radians that define the spread of particles, centered at the vector `vec`
* @param minSpeedFactor A factor that defines the lowest speed in relation to the vector `vec`
* @returns A function generating vectors fulfilling the arguments vec, spread and minSpeedFactor
*/
export function inDirectionOf(vec:Vec3Optional<number>, spread = 0, magFactorLimit = 1):() => Vec3<number> {
  const v = { z: 0, ...vec };
  const mag = Math.sqrt(v.x*v.x + v.y*v.y + v.z*v.z);
  const dir = { x: v.x/mag, y: v.y/mag, z: v.z/mag };
 
  let angle = Math.atan2(dir.y, dir.x)
 
  const minAngle = angle - spread/2;
  const maxAngle = angle + spread/2;
 
  const altMag = mag*magFactorLimit;
  const minMag = Math.min(mag, altMag);
  const maxMag = Math.max(mag, altMag);
 
  return function() {
    const m = random({min: minMag, max: maxMag});
    const a = random({min: minAngle, max: maxAngle});
    return { x: Math.cos(a)*m, y: Math.sin(a)*m, z: v.z };
  }
 }