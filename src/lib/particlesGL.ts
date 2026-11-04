/**
 * The code-token portrait: tens of thousands of glyphs from the site's own source
 * fly out of the island, assemble into the portrait, hold, and collapse back.
 *
 * Every particle's position is a pure function of scroll progress, computed in the
 * vertex shader — no simulation state — so scrubbing backwards rewinds exactly.
 * Data comes from tools/particles/build_particles.py (public/particles/*).
 */

export type Rect = { x: number; y: number; w: number; h: number };

export type Frame = {
  /** Scroll progress through the portrait chapter, 0..1. */
  progress: number;
  /** Seconds, for the gentle "breathing" while the portrait holds. */
  time: number;
  /** Where the island is (centre + half size), CSS px. */
  island: { cx: number; cy: number; hw: number; hh: number };
  /** Where the portrait should form, CSS px. */
  target: Rect;
  /** How many particles to draw (quality tier). */
  count: number;
};

type Manifest = {
  atlas: { width: number; height: number; cellHeight: number };
  portrait: { aspect: number; count: number; stride: number };
  tokens: [string, number, number, number, number][];
};

const VERT = /* glsl */ `#version 300 es
precision highp float;

layout(location = 0) in vec2 aCorner;   // quad corner, -0.5..0.5
layout(location = 1) in vec2 aTarget;   // portrait position, 0..1
layout(location = 2) in vec4 aUV;       // atlas rect, 0..1
layout(location = 3) in vec2 aMeta;     // tone, seed (0..1)
layout(location = 4) in float aAspect;  // token width / height

uniform vec2 uView;
uniform vec4 uIsland;    // cx, cy, hw, hh
uniform vec4 uTarget;    // x, y, w, h
uniform float uProgress;
uniform float uTime;
uniform float uScale;    // target height / source portrait height
uniform float uDensity;  // sqrt(max / count): fewer particles draw larger, keeping coverage

out vec2 vUV;
out vec3 vColor;
out float vAlpha;

float hash(float n) { return fract(sin(n * 12.9898 + 78.233) * 43758.5453); }

const float PI = 3.14159265;

void main() {
  float id = float(gl_InstanceID);
  float h1 = hash(id + 0.1), h2 = hash(id + 7.3), h3 = hash(id + 19.7), h4 = hash(id + 31.1);
  float tone = aMeta.x;
  float seed = aMeta.y;

  // Start inside the island's capsule.
  vec2 start = uIsland.xy + vec2((h1 * 2.0 - 1.0) * uIsland.z * 0.92, (h2 * 2.0 - 1.0) * uIsland.w * 0.7);
  vec2 target = uTarget.xy + aTarget * uTarget.zw;

  // Staggered timeline: burst out between ~6% and ~48%, hold, collapse back from ~78%.
  float delay = h3 * 0.22 + aTarget.y * 0.08;
  float form = smoothstep(0.06 + delay, 0.30 + delay, uProgress);
  float back = smoothstep(0.78 + h4 * 0.10, 0.97, uProgress);
  float a = form * (1.0 - back);
  float flight = sin(PI * a);   // 0 at both ends, 1 mid-flight

  // Turbulence, windowed so it vanishes in the island and in the portrait.
  float f = seed * 6.2831;
  vec2 swirl = vec2(sin(f + a * 5.0 + h1 * 3.0), cos(f * 1.3 + a * 4.0 + h2 * 3.0));
  vec2 pos = mix(start, target, a * a * (3.0 - 2.0 * a)) + swirl * flight * (90.0 + 120.0 * h4);

  // Breathing while the portrait holds.
  pos += vec2(sin(uTime * 1.3 + f), cos(uTime * 1.1 + f)) * 0.6 * smoothstep(0.9, 1.0, a);

  // Large, readable code in flight; small, tone-scaled glyphs in the portrait.
  float settled = (2.6 + tone * 5.6) * uScale * uDensity;
  float size = mix(mix(3.0, settled, a), 10.0 + 4.0 * h3, flight * 0.85);

  float angle = (h2 - 0.5) * 1.4 * flight;
  vec2 c = aCorner * vec2(size * aAspect, size);
  c = vec2(c.x * cos(angle) - c.y * sin(angle), c.x * sin(angle) + c.y * cos(angle));
  vec2 p = pos + c;

  gl_Position = vec4(p.x / uView.x * 2.0 - 1.0, 1.0 - p.y / uView.y * 2.0, 0.0, 1.0);
  vUV = aUV.xy + (aCorner + 0.5) * aUV.zw;

  vec3 violet = vec3(0.486, 0.361, 1.0), cyan = vec3(0.0, 0.831, 1.0);
  vec3 ramp = mix(violet, cyan, aTarget.y);
  vColor = mix(min(ramp * (0.8 + 1.0 * tone), vec3(1.0)), vec3(0.92, 0.95, 1.0), flight * 0.35);
  vAlpha = min(smoothstep(0.0, 0.06, a) * (0.7 + 0.3 * tone + 0.3 * flight), 1.0);
}
`;

const FRAG = /* glsl */ `#version 300 es
precision mediump float;
uniform sampler2D uAtlas;
in vec2 vUV;
in vec3 vColor;
in float vAlpha;
out vec4 outColor;
void main() {
  float sdf = texture(uAtlas, vUV).r;
  float w = max(fwidth(sdf), 0.04);
  float a = smoothstep(0.5 - w, 0.5 + w, sdf) * vAlpha;
  if (a < 0.01) discard;
  outColor = vec4(vColor * a, a);
}
`;

function shader(gl: WebGL2RenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader error");
  return s;
}

export async function loadParticleData(base = "/particles") {
  const [manifest, targets, atlas] = await Promise.all([
    fetch(`${base}/tokens.json`).then((r) => r.json() as Promise<Manifest>),
    fetch(`${base}/targets.bin`).then((r) => r.arrayBuffer()),
    fetch(`${base}/atlas.png`)
      .then((r) => r.blob())
      .then((b) => createImageBitmap(b)),
  ]);
  return { manifest, targets, atlas };
}

export type ParticleData = Awaited<ReturnType<typeof loadParticleData>>;

export class ParticleRenderer {
  private gl: WebGL2RenderingContext;
  private u: Record<string, WebGLUniformLocation | null> = {};
  private dpr = 1;
  private view = { w: 1, h: 1 };
  readonly max: number;
  readonly aspect: number;
  readonly sourceHeight = 680;

  constructor(
    private canvas: HTMLCanvasElement,
    data: ParticleData,
  ) {
    const gl = canvas.getContext("webgl2", { premultipliedAlpha: true, antialias: false, alpha: true });
    if (!gl) throw new Error("WebGL2 unavailable");
    this.gl = gl;

    const prog = gl.createProgram()!;
    gl.attachShader(prog, shader(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, shader(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? "link error");
    gl.useProgram(prog);
    for (const n of ["uView", "uIsland", "uTarget", "uProgress", "uTime", "uScale", "uDensity", "uAtlas"]) this.u[n] = gl.getUniformLocation(prog, n);

    const { manifest, targets, atlas } = data;
    this.max = manifest.portrait.count;
    this.aspect = manifest.portrait.aspect;

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    // Quad corners.
    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, 0.5]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    // Instances: interleave target, token UV rect, tone/seed and token aspect (20 bytes each).
    const STRIDE = 20;
    const src = new DataView(targets);
    const buf = new ArrayBuffer(this.max * STRIDE);
    const out = new DataView(buf);
    const { width: aw, height: ah } = manifest.atlas;
    for (let i = 0; i < this.max; i++) {
      const s = i * manifest.portrait.stride;
      const o = i * STRIDE;
      const [, tx, ty, tw, th] = manifest.tokens[src.getUint16(s + 4, true)];
      out.setUint16(o, src.getUint16(s, true), true);
      out.setUint16(o + 2, src.getUint16(s + 2, true), true);
      out.setUint16(o + 4, Math.round((tx / aw) * 65535), true);
      out.setUint16(o + 6, Math.round((ty / ah) * 65535), true);
      out.setUint16(o + 8, Math.round((tw / aw) * 65535), true);
      out.setUint16(o + 10, Math.round((th / ah) * 65535), true);
      out.setUint8(o + 12, src.getUint8(s + 6));
      out.setUint8(o + 13, src.getUint8(s + 7));
      out.setFloat32(o + 16, tw / th, true);
    }
    const inst = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, inst);
    gl.bufferData(gl.ARRAY_BUFFER, buf, gl.STATIC_DRAW);
    const attr = (loc: number, size: number, type: number, norm: boolean, offset: number) => {
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, type, norm, STRIDE, offset);
      gl.vertexAttribDivisor(loc, 1);
    };
    attr(1, 2, gl.UNSIGNED_SHORT, true, 0);
    attr(2, 4, gl.UNSIGNED_SHORT, true, 4);
    attr(3, 2, gl.UNSIGNED_BYTE, true, 12);
    attr(4, 1, gl.FLOAT, false, 16);

    // SDF atlas, single channel, mipmapped so tiny glyphs stay smooth.
    const tex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, gl.RED, gl.UNSIGNED_BYTE, atlas);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.uniform1i(this.u.uAtlas, 0);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  }

  resize(w: number, h: number) {
    this.dpr = Math.min(window.devicePixelRatio || 1, w < 768 ? 1.5 : 2);
    this.view = { w, h };
    this.canvas.width = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  /** Fits the portrait's aspect inside a box, centred. */
  fit(box: Rect): Rect {
    const w = Math.min(box.w, box.h * this.aspect);
    const h = w / this.aspect;
    return { x: box.x + (box.w - w) / 2, y: box.y + (box.h - h) / 2, w, h };
  }

  render(f: Frame) {
    const { gl, u } = this;
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    if (f.progress <= 0.0 || f.progress >= 1.0) return;
    gl.uniform2f(u.uView, this.view.w, this.view.h);
    gl.uniform4f(u.uIsland, f.island.cx, f.island.cy, f.island.hw, f.island.hh);
    gl.uniform4f(u.uTarget, f.target.x, f.target.y, f.target.w, f.target.h);
    gl.uniform1f(u.uProgress, f.progress);
    gl.uniform1f(u.uTime, f.time);
    const count = Math.min(f.count, this.max);
    gl.uniform1f(u.uScale, f.target.h / this.sourceHeight);
    gl.uniform1f(u.uDensity, Math.sqrt(this.max / Math.max(count, 1)));
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, count);
  }

  dispose() {
    this.gl.getExtension("WEBGL_lose_context")?.loseContext();
  }
}
