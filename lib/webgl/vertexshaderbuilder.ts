import { ParticleSystemOptions } from "../particlesystem";

const DefaultFragmentShaderSource = `#version 300 es
  precision mediump float;
  
  in vec2 vUV;
  in vec4 vColor;
  
  out vec4 outColor;
  void main() {
    outColor = vColor;
  }
`;

const VertexShaderTemplate = `#version 300 es
uniform mat4 projection;
uniform vec2 globalTranslation;
uniform float dt;

// vertex attributes
in vec2 vertexPosition;
in vec2 vertexUV;

// instance attributes
in vec2 particleTranslation;  //always attribute
in float particleRotation;    //always attribute
in float particleAge;        //optional attribute

$INPUT_DECLARATIONS$

$FUNCTION_DECLARATIONS$
vec2 rotate(in vec2 pos, in float phi) {
  float c = cos(phi);
  float s = sin(phi);
  vec2 rotated = vec2(
    pos.x * c - pos.y * s,
    pos.x * s + pos.y * c
  );
  return rotated;
}

out vec2 vUV;
out vec4 vColor;

void main() {
  vec2 scale = particleScale;
  vec2 position = globalTranslation + particleTranslation + rotate(vertexPosition * scale, particleRotation);
  vec2 uv = vertexUV;
  vec4 color = particleColor;

  $VS_CODE$
  float a = 1. - particleAge;
  color.a = color.a * ((.1 - particleAge * .1) + -a * a * (a - 1.) * 4.75);
  vUV = uv;
  vColor = color;
  gl_Position = projection * vec4(position, 0.0, 1.0);
  
  $VERTEX_ATTRIBUTE_OUTPUTS$
}`;

type VertexShaderComponent = {
  inputs?: string;
  function_declarations?: string;
  code?: string;
  varyings?: string;
  vertex_attribute_outputs?: string;
};


class Context {
  uniforms: string[] = [];
  inputs: string[] = [];
  functions: string[] = [];
  code: string[] = [];
  varying: string[] = [];
  vertexAttributeOutputs: string[] = [];

  accept(component: VertexShaderComponent) {
    if (component.inputs) {
      this.inputs.push(component.inputs);
    }
    if (component.function_declarations) {
      this.functions.push(component.function_declarations);
    }
    if (component.code) {
      this.code.push(component.code);
    }
    if (component.varyings) {
      this.varying.push(component.varyings);
    }
    if (component.vertex_attribute_outputs) {
      this.vertexAttributeOutputs.push(component.vertex_attribute_outputs);
    }
  }

  build() {
    return VertexShaderTemplate.replace("$UNIFORMS$", this.uniforms.join("\n"))
      .replace("$INPUT_DECLARATIONS$", this.inputs.join("\n"))
      .replace("$FUNCTION_DECLARATIONS$", this.functions.join("\n"))
      .replace("$OUTPUT_DECLARATIONS$", this.varying.map(v => `out ${v};`).join("\n"))
      .replace("$VS_CODE$", this.code.join("\n"))
      .replace("$VERTEX_ATTRIBUTE_OUTPUTS$", this.vertexAttributeOutputs.join("\n"));
  }
}

function isNumber(value: any): value is number {
  return typeof value === 'number' && !isNaN(value);
}

export function buildShaderSource<T>(options: ParticleSystemOptions<T>) {
  const ctx = new Context();

  // Scale
  const scale: any = options.emitter.particles.scale;
  if (isNumber(scale.x) && isNumber(scale.y)) {
    ctx.inputs.push(`const vec2 particleScale = vec2(${scale.x}, ${scale.y});`);
  }
  else {
    ctx.inputs.push(`in vec2 particleScale;`);
  }

  // Color
  const color: any = options.emitter.particles.color;
  if (isNumber(color.r) && isNumber(color.r) && isNumber(color.b) && isNumber(color.a)) {
    ctx.inputs.push(`const vec4 particleColor = vec4(${color.r}, ${color.g}, ${color.b}, ${color.a});`);
  }
  else {
    ctx.inputs.push(`in vec4 particleColor;`);
  }

  const result = {
    vs: ctx.build(),
    fs: DefaultFragmentShaderSource,
  };
  console.log(result.vs);
  console.log(result.fs);

  return result;
}