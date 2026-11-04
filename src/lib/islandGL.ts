/**
 * WebGL2 renderer for the liquid island: one full-canvas quad, a 2D signed distance
 * field of up to four rounded boxes merged with a smooth minimum, plus cursor
 * gravity (a domain warp toward the pointer) and a click ripple.
 *
 * Shapes are given in CSS pixels relative to the canvas. Nothing here reads the DOM,
 * so drawing never forces layout; the caller renders only while springs are moving.
 */

/**
 * `k` is how strongly this shape melts into the ones before it (blend thickness, px).
 * A smooth minimum of two identical shapes still swells by k, so callers scale k down
 * to 0 as a shape converges onto the island; the first shape's k is ignored.
 */
export type Shape = { cx: number; cy: number; hw: number; hh: number; r: number; k: number };

export const MAX_SHAPES = 4;

/** Cursor gravity and touch feedback, all in canvas CSS px. */
export type Field = {
  /** Pointer position. */
  px: number;
  py: number;
  /** 0..1: how strongly the surface bulges toward the pointer. */
  pull: number;
  /** Ripple origin and progress 0..1 (1 = finished). */
  rx: number;
  ry: number;
  rp: number;
};

const VERT = /* glsl */ `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = /* glsl */ `#version 300 es
precision highp float;

uniform vec2 uRes;            // canvas size, CSS px
uniform float uDpr;
uniform vec4 uBox[${MAX_SHAPES}];   // cx, cy, half-w, half-h (CSS px, y down)
uniform float uRad[${MAX_SHAPES}];
uniform int uCount;
uniform float uK[${MAX_SHAPES}];   // per-shape blend thickness, px
uniform vec2 uPointer;
uniform float uPull;
uniform vec3 uRipple;         // x, y, progress

out vec4 outColor;

// Cursor gravity: sample the field slightly away from the pointer, so the side of the
// island facing it bulges toward it. Kept to a few px so the SDF stays well behaved.
vec2 warp(vec2 p) {
  if (uPull < 0.001) return p;
  vec2 toP = uPointer - p;
  float f = exp(-dot(toP, toP) / (2.0 * 70.0 * 70.0));
  return p - normalize(toP + 1e-4) * f * uPull * 7.0;
}

// Rounded box with superellipse ("continuous") corners. Not an exact distance near the
// corners, which is fine: it only feeds anti-aliasing and shading.
float sdIsland(vec2 p, vec2 b, float r) {
  r = min(r, min(b.x, b.y));
  vec2 q = abs(p) - b + r;
  vec2 o = max(q, 0.0);
  float corner = pow(pow(o.x, 3.0) + pow(o.y, 3.0), 1.0 / 3.0);
  return min(max(q.x, q.y), 0.0) + corner - r;
}

// Inigo Quilez's normalized quadratic smooth minimum (k = blend thickness in px);
// .y is the blend factor between the two shapes.
vec2 smin(float a, float b, float k) {
  float h = 1.0 - min(abs(a - b) / (4.0 * k), 1.0);
  float w = h * h;
  float m = w * 0.5;
  float s = w * k;
  return a < b ? vec2(a - s, m) : vec2(b - s, 1.0 - m);
}

// Distance plus "seam" amount: how much this point sits inside a liquid merge.
vec2 scene(vec2 p) {
  p = warp(p);
  float d = sdIsland(p - uBox[0].xy, uBox[0].zw, uRad[0]);
  float seam = 0.0;
  for (int i = 1; i < ${MAX_SHAPES}; i++) {
    if (i >= uCount) break;
    float di = sdIsland(p - uBox[i].xy, uBox[i].zw, uRad[i]);
    if (uK[i] < 0.01) { d = min(d, di); continue; }
    vec2 s = smin(d, di, uK[i]);
    seam = max(seam, 4.0 * s.y * (1.0 - s.y));
    d = s.x;
  }
  return vec2(d, seam);
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, uRes.y * uDpr - gl_FragCoord.y) / uDpr;
  vec2 sc = scene(p);
  float d = sc.x;

  // Soft drop shadow below the island.
  float ds = scene(p - vec2(0.0, 7.0)).x;
  float shadow = 0.55 * exp(-max(ds, 0.0) / 14.0) * step(0.0, d);

  float aa = max(fwidth(d), 0.5 / uDpr);
  float body = 1.0 - smoothstep(-aa, aa, d);

  if (body <= 0.0 && shadow <= 0.004) { outColor = vec4(0.0); return; }

  // 2.5D bezel: height rises over the outer 9px with a squircle profile.
  float e = 0.75;
  vec2 g = vec2(scene(p + vec2(e, 0.0)).x - scene(p - vec2(e, 0.0)).x,
                scene(p + vec2(0.0, e)).x - scene(p - vec2(0.0, e)).x);
  g = length(g) > 1e-4 ? normalize(g) : vec2(0.0, -1.0);
  float x = clamp(-d / 9.0, 0.0, 1.0);
  float height = pow(1.0 - pow(1.0 - x, 4.0), 0.25);
  float slope = 1.0 - height;
  vec3 n = normalize(vec3(g * slope * 1.6, 1.0));

  vec3 L = normalize(vec3(-0.35, -0.85, 0.55));
  vec3 V = vec3(0.0, 0.0, 1.0);
  float spec = pow(max(dot(reflect(-L, n), V), 0.0), 36.0);
  float fres = pow(1.0 - n.z, 2.0);

  // Brand ramp across the island, shown only on the rim and in merge seams.
  float t = clamp(p.x / uRes.x, 0.0, 1.0);
  vec3 ramp = mix(vec3(0.486, 0.361, 1.0), vec3(0.0, 0.831, 1.0), t);

  vec3 col = vec3(0.012, 0.012, 0.016);
  col += ramp * fres * 0.55;
  col += vec3(1.0) * spec * 0.22;
  // Seam tint hugs the surface where shapes merge; deep inside, overlapping shapes stay black.
  col += ramp * sc.y * 0.45 * (1.0 - smoothstep(1.5, 9.0, -d));

  // Click/tap ripple: a soft ring of light spreading across the surface.
  if (uRipple.z < 1.0) {
    float rr = uRipple.z * 140.0;
    float band = exp(-pow((length(p - uRipple.xy) - rr) / 7.0, 2.0));
    col += ramp * band * (1.0 - uRipple.z) * 0.5;
  }

  float a = body;
  vec3 premul = col * a;
  float sa = shadow * (1.0 - a);
  outColor = vec4(premul, a + sa);
}
`;

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(s);
    gl.deleteShader(s);
    throw new Error(`Island shader failed to compile: ${log}`);
  }
  return s;
}

export class IslandRenderer {
  private gl: WebGL2RenderingContext;
  private loc: Record<"res" | "dpr" | "box" | "rad" | "count" | "k" | "pointer" | "pull" | "ripple", WebGLUniformLocation | null>;
  private box = new Float32Array(MAX_SHAPES * 4);
  private rad = new Float32Array(MAX_SHAPES);
  private ks = new Float32Array(MAX_SHAPES);
  private width = 0;
  private height = 0;
  private dpr = 1;

  constructor(private canvas: HTMLCanvasElement) {
    const gl = canvas.getContext("webgl2", { premultipliedAlpha: true, antialias: false, alpha: true });
    if (!gl) throw new Error("WebGL2 unavailable");
    this.gl = gl;

    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? "link failed");
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    this.loc = {
      res: gl.getUniformLocation(prog, "uRes"),
      dpr: gl.getUniformLocation(prog, "uDpr"),
      box: gl.getUniformLocation(prog, "uBox"),
      rad: gl.getUniformLocation(prog, "uRad"),
      count: gl.getUniformLocation(prog, "uCount"),
      k: gl.getUniformLocation(prog, "uK"),
      pointer: gl.getUniformLocation(prog, "uPointer"),
      pull: gl.getUniformLocation(prog, "uPull"),
      ripple: gl.getUniformLocation(prog, "uRipple"),
    };
  }

  /** Sizes the drawing buffer; DPR is clamped to 2 to bound fill cost. */
  resize(cssWidth: number, cssHeight: number) {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = cssWidth;
    this.height = cssHeight;
    this.canvas.width = Math.round(cssWidth * this.dpr);
    this.canvas.height = Math.round(cssHeight * this.dpr);
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  render(shapes: Shape[], field: Field = { px: 0, py: 0, pull: 0, rx: 0, ry: 0, rp: 1 }) {
    const { gl, loc } = this;
    const n = Math.min(shapes.length, MAX_SHAPES);
    for (let i = 0; i < n; i++) {
      const s = shapes[i];
      this.box.set([s.cx, s.cy, Math.max(s.hw, 0), Math.max(s.hh, 0)], i * 4);
      this.rad[i] = Math.max(s.r, 0);
      this.ks[i] = Math.max(s.k, 0);
    }
    gl.uniform2f(loc.res, this.width, this.height);
    gl.uniform1f(loc.dpr, this.dpr);
    gl.uniform4fv(loc.box, this.box);
    gl.uniform1fv(loc.rad, this.rad);
    gl.uniform1i(loc.count, n);
    gl.uniform1fv(loc.k, this.ks);
    gl.uniform2f(loc.pointer, field.px, field.py);
    gl.uniform1f(loc.pull, Math.max(field.pull, 0));
    gl.uniform3f(loc.ripple, field.rx, field.ry, Math.min(Math.max(field.rp, 0), 1));
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  dispose() {
    this.gl.getExtension("WEBGL_lose_context")?.loseContext();
  }
}
