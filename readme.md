Particlesystems.js is a unopinionated, slim library for creating particle effects. It helps you by taking care of all the tedious bits of particle effects, leaving you with more time to focus on what makes your effects special, the drawing.

## Demos
- [Dust in the air](https://codepen.io/niklaspandersson/pen/GRNyxbz)
- [Snow](https://codepen.io/niklaspandersson/pen/BaQJMbY)
- [Confetti cannon](https://codepen.io/niklaspandersson/pen/yLVpwQY)
- 
## Usage
Configure you particlesystem by providing options for how your system, emitter and particles should behave. Provid a callback that does the actual drawing using your favorite drawing api. Congratulations, you're done!

**Basic example**
```javascript
function draw(ps) {
  const ctx = document.querySelector("canvas").getContext("2d");
  for(const p of ps.particles) {
    ctx.globalAlpha = 1 - p.normalizedAge;
    ctx.fillRect(p.position.x, p.position.y, 5, 5);
  });
}

const particlesystem = new ParticleSystem({ 
  emitter: {
    particlesPerSecond: 40,
    particles: {
      initialPos: { x: { min: 100, max: 200 }, y: 0 },
      initialVelocity: { x: 0, y: { min: 10, max: 100 } },
      lifetime: 4
    }
  }
}, draw);
particlesystem.start(); 
```
### Vectors
Internally, all vectors - every position, velocity and [force](#forces---adding-some-dynamics) (see below) - are stored with three dimensions. But if you're only using 2d you can usually omit the z-value when providing vector values, it will default to 0 and won't affect any calculations.

```javascript
const pos1 = { x: 0, y: 10, z: 20 }   //valid - fully defined 3d vector
const pos2 = { x: 0, y: 10 }   //valid - fully defined 2d vector
const pos3 = { y: 30, z: 20 }   //invalid - both x and y are mandatory.
```
### Creating randomness
A particlesystem where all particles start at the exact same place, fly of in the exact same direction with the same speed and live for the exact same duration won't be that interesting. That's why when you define a vector there are some alternatives to just providing constants.
1. **The `NumRange`-object**. Instead of constants for x, y, and z you can provide objects with a `min` and a `max` property. If you do this, each time a new vector is created based on your definition, a random number from within the range is assigned to the relevant property.
2. **The factory function**. For complete control, instead of providing a vector object, provide a function returning a vector object. Then this function will be invoked everytime a new vector is needed. These factory functions receive what information is available about the new particle. For instance, a factory function for a particle's initial position receives the age of the emitter, but a function for a particle's initial velocity also receives the particles position.

**Example: simple factory function**
```javascript
function createOnCircle() {
  const Radius = 10;
  const angle = Math.random()*Math.PI*2;
  return { x: Math.cos(angle)*Radius, y: Math.sin(angle)*Radius }
}

const ps = new ParticleSystem({ 
  emitter: {
    particlesPerSecond: 40,
    particles: {
      initialPos: createOnCircle,
      initialVelocity: { x: 0, y: { min: 10, max: 100 } },
      lifetime: 4
    }
  }
}, draw); //assumes a draw function is defined
pd.start();
```

**Example: factory function generator**
```javascript
function createCircleFactory(radius) {
  return function() {
    const angle = Math.random()*Math.PI*2;
    return { x: Math.cos(angle)*radius, y: Math.sin(angle)*radius }
  }
}

const ps = new ParticleSystem({ 
  emitter: {
    particlesPerSecond: 40,
    particles: {
      initialPos: createCircleFactory(10),
      initialVelocity: { x: 0, y: { min: 10, max: 100 } },
      lifetime: 4
    }
  }
}, draw); //assumes a draw function is defined
ps.start();
```
### Custom data
Sometimes you need to keep track of more parameters than the position and velocity for each particle. You can do this by providing a factory function that return a custom data structure containing all the parameters you need. This factory function gets passed the particle object, if you want your custom data to be initiated based on some standard particle property.

**Example: custom data for opacity and scale**
```javascript
function draw(ps) {
  const ctx = document.querySelector("canvas").getContext("2d");
  for(const p of ps.particles) {
    ctx.globalAlpha = p.data.opacity;
    ctx.fillRect(p.position.x, p.position.y, 5*p.data.scale, 5*p.data.scale);
  });
}

const ps = new ParticleSystem({ 
  emitter: {
    particlesPerSecond: 40,
    particles: {
      initialPos: { x: { min: 100, max: 200 }, y: 200 },
      initialVelocity: { x: { min: -20, max: 20 }, y: { min: -10, max: -100 } },
      lifetime: 6,
      customDataFactory: () => ({ 
        opacity: .5 + Math.random()*.5,
        scale: .2 + Math.random()*1.8
      })
    }
  }
}, draw);
ps.start();
```

### Forces - adding some dynamics
To add even more life to your particle systems you can declare forces to act on the particles, basically providing acceleration. This is not very sophisticated yet, and you can only provide forces as constant vectors.

**Example: wind and gravity**
```javascript
const ps = new ParticleSystem({ 
  forces: {
    gravity: {x: 0, y: 400, z: 0 },
    wind: { x: -80, y: 0, z: 0 }
  },
  emitter: {
    particlesPerSecond: 40,
    particles: {
      initialPos: { x: { min: 100, max: 200 }, y: 200 },
      initialVelocity: { x: { min: -20, max: 20 }, y: { min: -10, max: -100 } },
      lifetime: 6
    }
  }
}, draw); //assumes a draw function is defined
ps.start();
```

## API Reference

### The ParticleSystem class
#### **Methods**
| Name | Remarks |
| --- | --- |
|`constructor(options, drawCallback)`|Creates and initiates the particle system based on the provided [options](#particlesystem-options-object). The draw callback gets invoked with a reference to the particlesystem object and a time delta specifying how much time has elapsed since the last draw call (in seconds). |
|`start()`|Starts the particle system|
|`stop()`|Stops the particle system|
#### **Properties**
| Name | Remark |
| --- | --- |
|`particles`|Array of all active particles. Particles are automatically removed from this array when their age exceeds their lifetime.|

### The Particle objects

#### **Properties**
| Name | Type | Remark |
| --- | --- | --- |
|position|vector|Current position.|
|velocity|vector|Current velocity.|
|lifetime|number|The total lifetime of the particle.|
|age|number|The current age of the particle.|
|normalizedAge|number|The ratio of the current age in relation the total lifetime.|
|data| any | User provided custom data for the particle.|

### Particlesystem options object
| Property | Default | Remarks |
|---|---|---|
|initialCount|`0`|The number of particles when the system starts|
|initialAge|*optional*|Function that gets called for each initial particle to give it an initial age other than 0. This funciton should return a normalized age between 0 and 1. The actual age is automatically calculated using this value and the particles lifetime.
|position|`{ x: 0, y: 0, z: 0 }`|The position of the particle system. Can be used to move the particlesystem over time.|
|forces|*optional*|A dictionary of forces that affect the velocities of particles in the particlesystem.|
|emitter| - | An object containing options for the particle emitter. See "[particle emitter options](#particle-emitter-options-object)" below. |


### Particle emitter options object
| Property | Default | Remarks |
|---|---|---|
|lifetime|*optional*|If provided, defines for how many seconds the emitter will keep emitting particles. If omitted, particles will be emitted indefinitely.|
|particles| - | An object containing options for spawned particles. See "[particles options](#particles-options-object)" below. |
|particlesPerSecond|`40`|How many particles to spawn per second. Used by the `"random"` and the `"periodic"` spawning strategies (See below).|
|sequence|*optional*|An array of numbers, defining the timing of each particle when using the `"sequence"` spawning strategy.|
|strategy|`"random"`|Which spawning strategy to use. Possible values are: `"random"`, `"periodic"` and `"sequence"`.|

### Particles options object
| Property | Default | Remarks |
|---|---|---|
|initialPosition|`{x: { min: -10, max: 10 }, y: 0, z: 0 }`|the initial position of spawned particles. Can be either a constant position, a vector where any of the values - x, y and z - are replaced with a range-object, or a function returning a vector. When using a range object a value between min and max (including), is picked at random for each particle.|
|initialVelocity|` { x: 0, y: {max: 100, min: 10} }`|the initial velocity of spawned particles. Just like for the initial position, you can provide a constant, a vector containing ranges and/or constants, or a factory function.
|lifetime|`3`|The lifetime of a single particle. Can be a constant, a range, or a factory function. When provding a range a new lifetime value is randomized for each new particle. If a function is provided, that function is evaluated for each new particle and the return value is used as the particles lifetime.
|customDataFactory| *optional*|A function returning some unique custom data you want associated with each particle.|

## Support or Contact
Having trouble? Create an issue in the github repository at [Issues](https://github.com/niklaspandersson/particlesystemsjs/issues).
