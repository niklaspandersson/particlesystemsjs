// Particle data structure - must match compute shader
struct Particle {
  position: vec3<f32>,
  age: f32,
  velocity: vec3<f32>,
  lifetime: f32,
  color: vec4<f32>,
  size: f32,
  _padding: vec3<f32>,
}

struct RenderParams {
  viewProjection: mat4x4<f32>,
  cameraRight: vec3<f32>,
  _padding1: f32,
  cameraUp: vec3<f32>,
  _padding2: f32,
  systemPosition: vec3<f32>,
  _padding3: f32,
  screenSize: vec2<f32>,
  _padding4: vec2<f32>,
}

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) color: vec4<f32>,
  @location(1) uv: vec2<f32>,
  @location(2) normalizedAge: f32,
}

@group(0) @binding(0) var<storage, read> particles: array<Particle>;
@group(0) @binding(1) var<uniform> params: RenderParams;

// Quad vertices for billboarding (2 triangles = 6 vertices per particle)
const QUAD_VERTICES = array<vec2<f32>, 6>(
  vec2<f32>(-0.5, -0.5),
  vec2<f32>( 0.5, -0.5),
  vec2<f32>(-0.5,  0.5),
  vec2<f32>(-0.5,  0.5),
  vec2<f32>( 0.5, -0.5),
  vec2<f32>( 0.5,  0.5),
);

const QUAD_UVS = array<vec2<f32>, 6>(
  vec2<f32>(0.0, 1.0),
  vec2<f32>(1.0, 1.0),
  vec2<f32>(0.0, 0.0),
  vec2<f32>(0.0, 0.0),
  vec2<f32>(1.0, 1.0),
  vec2<f32>(1.0, 0.0),
);

@vertex
fn vs_main(
  @builtin(vertex_index) vertexIndex: u32,
  @builtin(instance_index) instanceIndex: u32,
) -> VertexOutput {
  var output: VertexOutput;

  let particle = particles[instanceIndex];

  // Skip dead particles by collapsing to zero
  if (particle.age >= particle.lifetime) {
    output.position = vec4<f32>(0.0, 0.0, 0.0, 1.0);
    output.color = vec4<f32>(0.0);
    output.uv = vec2<f32>(0.0);
    output.normalizedAge = 1.0;
    return output;
  }

  let quadVertex = QUAD_VERTICES[vertexIndex % 6u];
  let quadUV = QUAD_UVS[vertexIndex % 6u];

  // Billboard: expand quad in camera space
  let worldPos = particle.position + params.systemPosition
    + params.cameraRight * quadVertex.x * particle.size
    + params.cameraUp * quadVertex.y * particle.size;

  output.position = params.viewProjection * vec4<f32>(worldPos, 1.0);
  output.color = particle.color;
  output.uv = quadUV;
  output.normalizedAge = particle.age / particle.lifetime;

  return output;
}

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
  // Skip dead particles
  if (input.normalizedAge >= 1.0) {
    discard;
  }

  // Distance from center for circular particles
  let dist = length(input.uv - vec2<f32>(0.5));

  // Soft circular falloff
  let alpha = 1.0 - smoothstep(0.3, 0.5, dist);

  // Fade out based on age
  let ageFade = 1.0 - input.normalizedAge;

  var color = input.color;
  color.a = color.a * alpha * ageFade;

  // Discard fully transparent pixels
  if (color.a < 0.01) {
    discard;
  }

  return color;
}

// Alternative fragment shader for textured particles
@fragment
fn fs_textured(input: VertexOutput) -> @location(0) vec4<f32> {
  if (input.normalizedAge >= 1.0) {
    discard;
  }

  // Age-based fade
  let ageFade = 1.0 - input.normalizedAge;

  var color = input.color;
  color.a = color.a * ageFade;

  if (color.a < 0.01) {
    discard;
  }

  return color;
}
