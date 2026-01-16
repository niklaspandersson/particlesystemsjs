// Particle data structure matching GPU buffer layout
struct Particle {
  position: vec3<f32>,
  age: f32,
  velocity: vec3<f32>,
  lifetime: f32,
  // Custom data (color, size, etc.) - packed as vec4
  color: vec4<f32>,
  size: f32,
  _padding: vec3<f32>,
}

struct SimulationParams {
  deltaTime: f32,
  dampening: f32,
  particleCount: u32,
  _padding: f32,
  forces: vec3<f32>,
  _padding2: f32,
  systemPosition: vec3<f32>,
  _padding3: f32,
}

@group(0) @binding(0) var<storage, read_write> particles: array<Particle>;
@group(0) @binding(1) var<uniform> params: SimulationParams;

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
  let index = global_id.x;

  // Bounds check
  if (index >= params.particleCount) {
    return;
  }

  var particle = particles[index];

  // Skip dead particles (age >= lifetime means dead)
  if (particle.age >= particle.lifetime) {
    return;
  }

  // Apply forces to velocity
  particle.velocity = particle.velocity + params.forces * params.deltaTime;

  // Apply dampening
  particle.velocity = particle.velocity * params.dampening;

  // Update position
  particle.position = particle.position + particle.velocity * params.deltaTime;

  // Update age
  particle.age = particle.age + params.deltaTime;

  // Write back
  particles[index] = particle;
}
