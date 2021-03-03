## 1.0.5
- add support for dispatching events from a ParticleSystem
- add stop event to ParticleSystem instances
- export `emitter` as property of ParticleSystem instanecs
- add method `stop` to emitter in order to be able to stop emitting without killing the entire particle system.
- add utility function `SpawnOnDOMElement` to spawn particlesystems tied to DOM elements in response to a DOM event.