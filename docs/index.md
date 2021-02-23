## Configuration

### Particlesystem options
| Name | Default | Remarks |
|---|---|---|
|initialCount|`0`|The number of particles when the system starts|
|initialAge|*optional*|Function that gets called for each initial particle to give it an initial age other than 0. This funciton should return a normalized age between 0 and 1. The actual age is automatically calculated using this value and the particles lifetime.
|position|`{x: 0, y: 0}`|The position of the particle system. Can be used to move the particlesystem over time.|
|forces|*optional*|A dictionary of forces that affect the velocities of particles in the particlesystem.|
|emitter| N/A | See emitter options below |


### Particle emitter options
| Name | Default | Remarks |
|---|---|---|
|lifetime|*optional*|If provided, defines for how many seconds the emitter will keep emitting particles. If omitted, particles will be emitted indefinitely.|
|particles| N/A | See particles options below |
|particlesPerSecond|`40`|How many particles to spawn per second. Used by the `"random"` and the `"periodic"` spawning strategies (See below).|
|sequence|*optional*|An array of numbers, defining the timing of each particle when using the `"sequence"` spawning strategy (see below).|
|strategy|`"random"`|Which spawning strategy to use. Possible values are: `"random"`, `"periodic"` and `"sequence"`.|

### Particles options
| Name | Default | Remarks |
|---|---|---|
initialPosition
initialVelocity
lifetime
customDataFactory
### The draw callback