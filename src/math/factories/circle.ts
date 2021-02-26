export function circle(radius:number, inside?:boolean) {
  return function() {
    const angle = Math.random()*Math.PI*2;
    radius = (inside ? Math.sqrt(Math.random()) : 1)*radius;
    return { x: Math.cos(angle)*radius, y: Math.sin(angle)*radius }
  }
}