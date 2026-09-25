// One transparent quad per lens. The unmodified media remains a normal DOM node.
export const vertexShader = `
attribute vec2 a_position;
uniform vec2 u_view;
uniform vec4 u_rect;
varying vec2 v_uv;
varying vec2 v_point;
void main() {
  v_uv = a_position;
  v_point = u_rect.xy + a_position * u_rect.zw;
  gl_Position = vec4(v_point.x / u_view.x * 2.0 - 1.0, 1.0 - v_point.y / u_view.y * 2.0, 0.0, 1.0);
}`;

export const fragmentShader = `
precision highp float;
uniform sampler2D u_source;
uniform sampler2D u_map;
uniform sampler2D u_finish;
uniform vec4 u_sourceRect;
uniform vec4 u_rect;
uniform float u_radius;
uniform float u_ellipse;
uniform float u_surfaceSign;
uniform float u_pixelRatio;
uniform vec3 u_backgroundColor;
uniform vec4 u_tint;
uniform float u_strength;
uniform float u_blur;
uniform float u_chroma;
uniform float u_dimming;
uniform float u_highlight;
uniform float u_press;
uniform float u_hover;
uniform vec2 u_pointer;
varying vec2 v_uv;
varying vec2 v_point;
vec3 sourceAt(vec2 point) {
  vec2 uv = (point - u_sourceRect.xy) / u_sourceRect.zw;
  if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) return u_backgroundColor;
  vec4 sampleColor = texture2D(u_source, uv);
  return mix(u_backgroundColor, sampleColor.rgb, sampleColor.a);
}
void main() {
  vec3 material = texture2D(u_finish, v_uv).rgb;
  vec2 halfSize = u_rect.zw * 0.5;
  vec2 local = (v_uv - 0.5) * u_rect.zw;
  vec2 q = abs(local) - (halfSize - u_radius);
  float distanceToEdge = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - u_radius;
  vec2 normal;
  if (u_ellipse > 0.5) {
    float k0 = length(local / halfSize);
    float k1 = length(local / (halfSize * halfSize));
    distanceToEdge = k1 > 0.00001 ? k0 * (k0 - 1.0) / k1 : -min(halfSize.x, halfSize.y);
    normal = normalize(local / (halfSize * halfSize) + vec2(0.000001));
  } else {
    vec2 outward = max(q, 0.0);
    if (length(outward) < 0.00001) outward = q.x > q.y ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    normal = normalize(outward) * sign(local);
  }
  // Analytic silhouettes and highlights stay smooth on long, thin controls even
  // when their portable displacement maps are intentionally low resolution.
  float aa = 0.75 / u_pixelRatio;
  float coverage = 1.0 - smoothstep(-aa, aa, distanceToEdge);
  if (coverage < 0.002) discard;
  vec2 direction = (texture2D(u_map, v_uv).rg * 255.0 - 128.0) / 127.0;
  vec2 point = v_point + direction * u_strength * (1.0 + u_press * 0.12);
  vec3 color = sourceAt(point);
  if (u_chroma > 0.0) {
    color.r = sourceAt(point + direction * u_chroma).r;
    color.b = sourceAt(point - direction * u_chroma).b;
  }
  if (u_blur > 0.01) {
    vec2 x = vec2(u_blur, 0.0), y = vec2(0.0, u_blur);
    vec3 soft = sourceAt(point) * 0.25;
    soft += (sourceAt(point+x) + sourceAt(point-x) + sourceAt(point+y) + sourceAt(point-y)) * 0.125;
    soft += (sourceAt(point+x+y) + sourceAt(point-x-y) + sourceAt(point+x-y) + sourceAt(point-x+y)) * 0.0625;
    color = mix(color, soft, material.b);
  }
  color *= 1.0 - u_dimming;
  color = mix(color, u_tint.rgb, u_tint.a);
  float glow = exp(-dot(v_uv-u_pointer, v_uv-u_pointer) * 5.0) * (u_press * 0.12 + u_hover * 0.025);
  float light = dot(normal * u_surfaceSign, vec2(-0.6, -0.8));
  float shine = exp(-max(0.0, -distanceToEdge - 0.6) / 2.0) * (0.85 * max(0.0, light) + 0.2 * max(0.0, -light));
  color += vec3(shine * u_highlight * (1.0 + u_press * 0.4) + glow);
  // Premultiplied output lets lenses share one transparent canvas without halos.
  gl_FragColor = vec4(clamp(color, 0.0, 1.0) * coverage, coverage);
}`;
