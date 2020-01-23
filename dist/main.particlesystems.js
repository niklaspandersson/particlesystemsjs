(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["particleSystems"] = factory();
	else
		root["particleSystems"] = factory();
})(window, function() {
return (window["webpackJsonpparticleSystems"] = window["webpackJsonpparticleSystems"] || []).push([["main"],{

/***/ "./src/index.js":
/*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("class Vec2 {\n    constructor({ x = 0, y = 0 }) {\n        this.data = [0, 0];\n        this.data[0] = x;\n        this.data[1] = y;\n    }\n    get x() { return this.data[0]; }\n    get y() { return this.data[1]; }\n    add(rhs) {\n        this.data[0] += rhs.data[0];\n        this.data[1] += rhs.data[1];\n        return this;\n    }\n}\nclass Entity {\n}\nclass Particle extends Entity {\n    constructor(options) {\n        super();\n        this.pos = new Vec2(options.createPosition());\n        this.velocity = new Vec2(options.createVelocity());\n    }\n    update() {\n        this.pos.add(this.velocity);\n    }\n}\nconst DefaultPSOptions = {\n    count: 20,\n    particle: {\n        initialPos: { x: { min: -10, max: 10 }, y: 0 },\n        initialVelocity: { x: 0, y: { max: -10, min: -100 } },\n        view: {\n            color: \"white\"\n        }\n    }\n};\nfunction random(min, max) { return min + Math.random() * (max - min); }\n;\nfunction createValueFactory(key, vec) {\n    if (typeof vec[key] === 'number') {\n        const val = vec[key];\n        return function () { return val; };\n    }\n    else {\n        const { min, max } = vec[key];\n        return function () { return random(min, max); };\n    }\n}\nfunction createVec2dFactory(src) {\n    const xFactory = createValueFactory(\"x\", src);\n    const yFactory = createValueFactory(\"y\", src);\n    return function () {\n        return { x: xFactory(), y: yFactory() };\n    };\n}\n;\nclass ParticleSystem {\n    constructor(options) {\n        options = { ...DefaultPSOptions, ...options };\n        const factories = {\n            createPosition: (typeof options.particle.initialPos === 'function') ? options.particle.initialPos : createVec2dFactory(options.particle.initialPos),\n            createVelocity: (typeof options.particle.initialVelocity === 'function') ? options.particle.initialVelocity : createVec2dFactory(options.particle.initialVelocity),\n        };\n        const particleOptions = { ...options.particle, ...factories };\n        this.particles = Array(options.count).fill(null).map(_ => new Particle(particleOptions));\n        console.dir(this.particles, { depth: 3, colors: true });\n    }\n    update() {\n        for (const particle of this.particles)\n            particle.update();\n    }\n}\nconst test = new ParticleSystem({});\n\n\n//# sourceURL=webpack://particleSystems/./src/index.js?");

/***/ })

},[["./src/index.js","runtime~main"]]]);
});