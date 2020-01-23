class Vec2 {
    constructor({ x = 0, y = 0 }) {
        this.data = [0, 0];
        this.data[0] = x;
        this.data[1] = y;
    }
    get x() { return this.data[0]; }
    get y() { return this.data[1]; }
    add(rhs) {
        this.data[0] += rhs.data[0];
        this.data[1] += rhs.data[1];
        return this;
    }
}
class Entity {
}
class Particle extends Entity {
    constructor(options) {
        super();
        this.pos = new Vec2(options.createPosition());
        this.velocity = new Vec2(options.createVelocity());
    }
    update() {
        this.pos.add(this.velocity);
    }
}
const DefaultPSOptions = {
    count: 20,
    particle: {
        initialPos: { x: { min: -10, max: 10 }, y: 0 },
        initialVelocity: { x: 0, y: { max: -10, min: -100 } },
        view: {
            color: "white"
        }
    }
};
function random(min, max) { return min + Math.random() * (max - min); }
;
function createValueFactory(key, vec) {
    if (typeof vec[key] === 'number') {
        const val = vec[key];
        return function () { return val; };
    }
    else {
        const { min, max } = vec[key];
        return function () { return random(min, max); };
    }
}
function createVec2dFactory(src) {
    const xFactory = createValueFactory("x", src);
    const yFactory = createValueFactory("y", src);
    return function () {
        return { x: xFactory(), y: yFactory() };
    };
}
;
class ParticleSystem {
    constructor(options) {
        options = { ...DefaultPSOptions, ...options };
        const factories = {
            createPosition: (typeof options.particle.initialPos === 'function') ? options.particle.initialPos : createVec2dFactory(options.particle.initialPos),
            createVelocity: (typeof options.particle.initialVelocity === 'function') ? options.particle.initialVelocity : createVec2dFactory(options.particle.initialVelocity),
        };
        const particleOptions = { ...options.particle, ...factories };
        this.particles = Array(options.count).fill(null).map(_ => new Particle(particleOptions));
        console.dir(this.particles, { depth: 3, colors: true });
    }
    update() {
        for (const particle of this.particles)
            particle.update();
    }
}
const test = new ParticleSystem({});
