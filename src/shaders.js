export const vertexShader = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

export const fragmentShader = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform sampler2D uBackground, uHeightMap, uMask;
uniform float uHeight, uDistance, uIor, uRoundness, uSpecular, uShadow, uDispersion;
uniform vec2 uLight;
uniform float uCompare;
uniform int uView, uWrap;

// Sampler wrapping (instead of fract(uv)) preserves derivatives for mipmapped
// minification in the strongly refracted rim, avoiding shimmering and aliasing.
vec3 background(vec2 uv) { return texture2D(uBackground, uv).rgb; }
float heightAt(vec2 uv) {
  float h = texture2D(uHeightMap, clamp(uv, vec2(0.), vec2(1.))).r;
  float cap = mix(.008, .50, uRoundness * uRoundness);
  // Smooth saturation gives a planar center at low roundness, a dome at high roundness.
  float e = exp(-2.0 * min(h / cap, 20.));
  return cap * (1.0 - e) / (1.0 + e) * uHeight;
}
vec2 trace(vec3 n, float h, float ior) {
  vec3 inside = refract(vec3(0., 0., -1.), n, 1.0 / ior);
  vec3 outside = refract(inside, vec3(0., 0., 1.), ior);
  // A single transmitted ray cannot represent internal bounces; use a bounded
  // grazing path for total internal reflection, and shade the rim with Fresnel.
  if (dot(outside, outside) < .001) outside = normalize(vec3(inside.xy, -.12));
  return vUv + inside.xy * h / max(-inside.z, .10)
    + outside.xy * uDistance / max(-outside.z, .12);
}
void main() {
  vec3 base = background(vUv);
  float mask = texture2D(uMask, vUv).r;
  if (uView == 1) { gl_FragColor = vec4(vec3(mask), 1.); return; }
  float h = heightAt(vUv);
  if (uView == 2) { gl_FragColor = vec4(vec3(h * 6.), 1.); return; }
  float d = 1.0 / 512.0;
  vec2 gradient = vec2(heightAt(vUv + vec2(d, 0.)) - heightAt(vUv - vec2(d, 0.)),
                       heightAt(vUv + vec2(0., d)) - heightAt(vUv - vec2(0., d))) / (2.0 * d);
  vec3 n = normalize(vec3(-gradient, 1.));
  if (uView == 3) { gl_FragColor = vec4(mix(vec3(.09), n * .5 + .5, mask), 1.); return; }
  if (mask < .001 || uHeight < .00001 || (uCompare >= 0. && vUv.x < uCompare)) { gl_FragColor = vec4(base, 1.); return; }

  vec2 refractedUV = trace(n, h, uIor);
  vec3 glass = background(refractedUV);
  if (uDispersion > .001) {
    float spread = uDispersion * .015 * (uIor - 1.);
    glass.r = background(trace(n, h, uIor - spread)).r;
    glass.b = background(trace(n, h, uIor + spread)).b;
  }
  vec3 light = normalize(vec3(uLight, .85));
  vec3 viewDir = vec3(0., 0., 1.);
  vec3 halfway = normalize(light + viewDir);
  float spec = pow(max(dot(n, halfway), 0.), 95.);
  float broadSpec = pow(max(dot(n, halfway), 0.), 15.);
  float f0 = pow((uIor - 1.) / (uIor + 1.), 2.);
  float fresnel = f0 + (1. - f0) * pow(1. - max(n.z, 0.), 5.);
  vec3 reflected = reflect(-viewDir, n);
  float softbox = pow(max(dot(reflected, light), 0.), 12.);
  vec3 environment = mix(vec3(.16, .20, .24), vec3(.94, .98, 1.), smoothstep(-.2, .8, reflected.y));
  environment += softbox * .4;
  glass = mix(glass, environment, fresnel * .72);

  // All shadow samples are clipped INSIDE the silhouette, as in the requested effect.
  vec2 shadowDir = normalize(uLight + vec2(.0001));
  float inner = 0.;
  for (int i = 1; i <= 4; i++) {
    vec2 sampleUV = vUv + shadowDir * (.0018 * float(i));
    inner += 1. - texture2D(uMask, clamp(sampleUV, vec2(0.), vec2(1.))).r;
  }
  inner *= .25;
  float bevelShade = pow(1. - n.z, 1.6) * (.2 + .8 * max(-dot(n.xy, light.xy), 0.));
  glass *= 1. - uShadow * clamp(inner * .65 + bevelShade * .65, 0., .85);
  glass += vec3(1., .985, .97) * uSpecular * (spec * .85 + broadSpec * .065);
  // Narrow opposite-edge caustic accent; artistic approximation, not a ray-traced caustic.
  glass += vec3(.86, .94, 1.) * uSpecular * pow(1. - n.z, 3.)
    * pow(max(-dot(normalize(n.xy + vec2(.00001)), normalize(light.xy)), 0.), 8.) * .28;
  gl_FragColor = vec4(mix(base, clamp(glass, 0., 1.), mask), 1.);
}
`;
