# GPU Techniques for a Liquid, Morphing "Dynamic Island" Pill on the Web

Note on sourcing: Inigo Quilez's formulas below were pulled verbatim from his pages (fetched via curl because WebFetch hit redirect/404 loops on iquilezles.org). Shader snippets in the "Inferences" subsections are engineering syntheses I wrote from standard practice; they are not quoted from a source and should be tested.

## 1. 2D fragment-shader SDF approach (rounded box, smin, morphing, AA, glossy material)

### Takeaway
The best fit for a Dynamic Island is a single full-screen (or island-sized) quad running a 2D SDF fragment shader. Each layout state is a set of rounded boxes (`sdRoundedBox`, exact, with per-corner radii), merged with IQ's normalized quadratic or cubic `smin`. Morphs come from springing the box parameters and not from lerping whole fields. Anti-aliasing is `fwidth`-based, and a "liquid glass" look comes from deriving a fake height and normal from the SDF to drive refraction, Fresnel, a rim specular and an inner shadow. It is cheap: one SDF evaluation per pixel per shape.

### Cited Findings
- **Rounded box, exact, per-corner radii.** IQ gives:
  ```glsl
  float sdRoundedBox( in vec2 p, in vec2 b, in vec4 r ) {
      r.xy = (p.x>0.0)?r.xy : r.zw;
      r.x  = (p.y>0.0)?r.x  : r.y;
      vec2 q = abs(p)-b+r.x;
      return min(max(q.x,q.y),0.0) + length(max(q,0.0)) - r.x;
  }
  ```
  Here `b` is the half-size and `r` holds four corner radii (x = top-right, y = bottom-right, z = top-left, w = bottom-left given the branch order). Also exact: `sdBox` (`d=abs(p)-b; length(max(d,0))+min(max(d.x,d.y),0)`), `sdCircle` (`length(p)-r`), `sdOrientedBox` and `sdUnevenCapsule`. All primitives are centered at the origin, so you transform `p` to place them. A Shadertoy playlist of all of them is at shadertoy.com/playlist/MXdSRf. — [IQ, 2D distance functions](https://iquilezles.org/articles/distfunctions2d/)
- **Rounding and onion operators.** `opRound`: `sdf(p) - r` rounds any shape. `opOnion`: `abs(sdf(p)) - r` makes an annular ring, which is useful for a glowing outline or border ring around the pill. — [IQ, 2D distance functions](https://iquilezles.org/articles/distfunctions2d/)
- **Smooth-minimum family, normalized so `k` equals the blend thickness in distance units.** Verbatim:
  ```glsl
  // quadratic polynomial
  float smin(float a,float b,float k){ k*=4.0; float h=max(k-abs(a-b),0.0)/k; return min(a,b)-h*h*k*(1.0/4.0); }
  // cubic polynomial
  float smin(float a,float b,float k){ k*=6.0; float h=max(k-abs(a-b),0.0)/k; return min(a,b)-h*h*h*k*(1.0/6.0); }
  // exponential
  float smin(float a,float b,float k){ k*=1.0; float r=exp2(-a/k)+exp2(-b/k); return -k*log2(r); }
  // circular
  float smin(float a,float b,float k){ k*=1.0/(1.0-sqrt(0.5)); float h=max(k-abs(a-b),0.0)/k; return min(a,b)-k*0.5*(1.0+h-sqrt(1.0-h*(h-2.0))); }
  ```
  With this normalization, `k` is also the bounding-box expansion needed to bound the blended shape. — [IQ, smooth minimum](https://iquilezles.org/articles/smin/)
- **Mix-factor variant, for blending colors or materials between blobs.** It returns `.x` = distance and `.y` = blend factor:
  ```glsl
  vec2 smin(float a,float b,float k){ float h=1.0-min(abs(a-b)/(4.0*k),1.0); float w=h*h; float m=w*0.5; float s=w*k;
      return (a<b)? vec2(a-s,m) : vec2(b-s,1.0-m); }
  ```
  — [IQ, smooth minimum](https://iquilezles.org/articles/smin/)
- **Properties table from IQ.**
  - Quadratic, cubic, quartic and circular are rigid (they don't distort shapes outside the blend band) and conservative (they never overestimate distance), but they are **not associative**: blend order matters.
  - Exponential is associative (order-independent) but not rigid: it distorts shapes everywhere.
  - Circular-geometric is local and associative but overestimates distance, which causes holes in raymarchers.
  - IQ himself defaults to quadratic: "fast, close enough to circular, never overestimates".

  — [IQ, smooth minimum](https://iquilezles.org/articles/smin/)
- **Legacy form still in circulation.** `h=clamp(0.5+0.5*(b-a)/k,0,1); return mix(b,a,h)-k*h*(1-h);` is the original, non-normalized quadratic. LYGIA's `opUnion(d1,d2,k)` uses exactly this form, plus a `vec4` overload that mixes RGB with the same `h`. — [IQ, smooth minimum](https://iquilezles.org/articles/smin/); [LYGIA sdf/opUnion.glsl](https://github.com/patriciogonzalezvivo/lygia/blob/main/sdf/opUnion.glsl)
- **Smooth max.** `min(a,b) = -max(-a,-b)` carries over to the smooth versions (smax = -smin(-a,-b,k)). Use it for smooth subtraction and intersection, e.g. carving a notch. — [IQ, smooth minimum](https://iquilezles.org/articles/smin/)
- **Liquid glass via 2D SDF (Codrops, Sept 2026).** The approach starts from a 2D rounded-rectangle SDF on a flat plane and fakes bevels and refraction in the material. Chromatic dispersion comes from refracting several times with a slightly different IOR per color channel. The article is written in Three.js TSL on WebGPU. Only the search snippet was available (direct fetch returned 403). — [Codrops, Infinite Liquid Glass Grid with Three.js, WebGPU and TSL](https://tympanus.net/codrops/2026/09/08/building-an-infinite-liquid-glass-grid-with-three-js-webgpu-and-tsl/)
- **Bezel profile functions for glass (kube.io).** Here `x` runs 0→1 from the outer edge to the start of the flat interior.
  - Convex circle: `y=sqrt(1-(1-x)^2)`.
  - Convex squircle: `y=pow(1-pow(1-x,4),1/4)`. It has smoother gradients and reads as a thinner bezel; this is the recommended profile.
  - Concave: `1-convex`.
  - Lip: `mix(convex, concave, smootherstep(x))`.

  The normal is `(-f'(x), 1)` from a numerical derivative. Refraction uses Snell's law with n1 = 1.0 and n2 = 1.5 and a single refraction event. The rim specular depends on the angle between the normal and a fixed light direction, concentrated near the edges. — [kube.io, Liquid Glass in the Browser](https://kube.io/blog/liquid-glass-css-svg/)
- **Feature set of Liquid Glass Studio**, the most complete open-source WebGL2/WebGPU recreation: refraction, dispersion, Fresnel reflection, superellipse shapes, a blob effect (shape merging via SDF + smooth merge), glare with a configurable angle, Gaussian blur masking (multipass), anti-aliasing, and spring-based shape animation. — [iyinchao/liquid-glass-studio](https://github.com/iyinchao/liquid-glass-studio)
- **ybouane/liquidglass** applies refraction, chromatic aberration and Fresnel reflection to HTML elements via WebGL. **liquidGL** snapshots a DOM target into a texture and renders glass lenses on an overlay canvas. — [search results summarizing liquidglass/liquidGL repos](https://awesome.ecosyste.ms/projects/github.com%2Fybouane%2Fliquidglass) (repo READMEs not verified in depth)
- **LYGIA** ships `lighting/fresnel` and `fresnelReflection` in GLSL/HLSL/WGSL/WESL, plus `sdf/rectSDF` and `sdf/boxSDF`.
  - LYGIA's `rectSDF(p,b,r)` assumes 0–1 UV space centered at 0.5 (`abs(p-0.5)*4.2`), so it is less convenient than IQ's pixel-space `sdRoundedBox` for DOM-mapped shapes.
  - I found no standalone `smin` in LYGIA `math/`; smooth union lives in `sdf/opUnion`.

  — [LYGIA repo tree](https://github.com/patriciogonzalezvivo/lygia)

### Inferences
- **Recommended core shader (WebGL2 GLSL ES 3.0, pixel space, so the SDF is in CSS px and AA is trivial):**
  ```glsl
  #version 300 es
  precision highp float;
  #define MAX_SHAPES 8
  uniform vec2  uRes;            // canvas size in CSS px
  uniform float uDpr;
  uniform int   uCount;
  uniform vec4  uRect[MAX_SHAPES];   // center.xy, halfSize.xy (CSS px, y-down)
  uniform vec4  uRadii[MAX_SHAPES];  // per-corner radii
  uniform float uK;                  // smin blend thickness in px (e.g. 12-24)
  uniform vec2  uMouse;  uniform vec2 uVel;  // px, px/s
  out vec4 outColor;

  float sminQ(float a,float b,float k){ k*=4.0; float h=max(k-abs(a-b),0.0)/k; return min(a,b)-h*h*k*0.25; }

  float scene(vec2 p){
      float d = 1e5;
      for(int i=0;i<MAX_SHAPES;i++){ if(i>=uCount) break;
          vec2 q = p - uRect[i].xy;
          d = sminQ(d, sdRoundedBox(q, uRect[i].zw, uRadii[i]), uK);
      }
      return d;
  }
  void main(){
      vec2 p = vec2(gl_FragCoord.x, uRes.y*uDpr - gl_FragCoord.y) / uDpr; // to CSS px, y-down
      float d = scene(p);
      float aa = fwidth(d);                         // ~1px in CSS px units/uDpr
      float alpha = 1.0 - smoothstep(-0.5*aa, 0.5*aa, d);
      // --- material ---
      vec2 e = vec2(1.0,0.0);
      vec2 g = vec2(scene(p+e.xy)-scene(p-e.xy), scene(p+e.yx)-scene(p-e.yx))*0.5; // 2D gradient
      float bezel = 10.0;                                   // px of rounded "lip"
      float t = clamp(-d/bezel, 0.0, 1.0);                  // 0 at edge -> 1 interior
      float h = pow(1.0 - pow(1.0-t, 4.0), 0.25);           // squircle profile (kube.io)
      vec3 n = normalize(vec3(-g * (1.0-h) * 2.0, 1.0));    // fake 3D normal from SDF slope
      vec3 L = normalize(vec3(-0.4,-0.6,0.7));
      float spec = pow(max(dot(reflect(-L,n), vec3(0,0,1)),0.0), 40.0);
      float fres = pow(1.0 - n.z, 3.0);
      float inner = smoothstep(0.0, 6.0, -d);               // inner shadow: darken near edge inside
      vec3 col = vec3(0.0) + 0.35*fres + 0.8*spec;          // black glossy pill
      col *= mix(0.6, 1.0, inner);
      outColor = vec4(col*alpha, alpha);                    // premultiplied alpha
  }
  ```
  - With an analytic SDF, `fwidth(d)` is about 1 px, so `smoothstep(-0.5*aa, 0.5*aa, d)` gives roughly one-pixel AA at any DPR.
  - A cheaper alternative, valid when the SDF is exact and in pixel units, is `clamp(0.5 - d*uDpr, 0.0, 1.0)`.
  - Near smin seams the field is not exact (gradient length < 1, per IQ), so `fwidth` is the more robust choice.
- **Morphing strategy.**
  - Prefer **parameter morphing** over field interpolation. Spring each shape's center, half-size and radii toward the target state, and let smin melt them.
  - Pill to wide card: animate halfSize and radii, where radius = min(halfSize.y, targetRadius) keeps it a pill.
  - Pill to split blobs: start with two or more coincident shapes. Spring them apart; the smin neck stretches and then pinches off once the gap exceeds about 2k, which is the "rigid" CD-family behavior.
  - Field lerp, `mix(sdA, sdB, t)`, also works for arbitrary shapes (e.g. a terminal window to a timeline). The intermediate is not a true SDF, so use `fwidth` AA rather than px-based AA.
  - Keep an unused-slot convention: halfSize = 0 and center = the neighbor's center, so a blob can "emerge" from another one.
- **Non-associativity.** Because quadratic smin is not associative, the loop order changes the shape slightly. Keep the shape order stable across states, or use exponential smin when order must not matter; it is softer and distorts everywhere.
- **Timeline and terminal shapes.**
  - Timeline: a thin `sdRoundedBox` bar plus small `sdCircle` nodes, smin'd with a small k so the nodes bead onto the bar.
  - Terminal window: a large rounded box, with an `opOnion` ring for a border, or a smax-subtracted title-bar groove.
  - Use the vec2 mix-factor smin to tint merged regions, e.g. an accent-colored node blending into a black bar.
- **Glass refraction (only if there is something behind the pill to refract).**
  - Offset the backdrop UV by `-n.xy * strength * (1-h)`.
  - Per-channel IOR offsets give dispersion.
  - For a pure black Dynamic Island on a plain background, refraction is mostly invisible. A black glossy material (Fresnel rim + spec + inner shadow + subtle noise) is the higher-value 90% of the look.

### Gaps
- Full text of the Codrops Sept-2026 liquid glass article was not retrievable (403), so its exact TSL code and performance numbers are unverified.
- No authoritative source gives Apple's actual Liquid Glass shader parameters; all web versions are reverse-engineered approximations.

## 2. 3D raymarching approach (cost vs benefit)

### Takeaway
Raymarching 3D SDF blobs gives true depth, lighting and droplet-style refraction. Its cost scales with pixels × steps × shapes, versus pixels × shapes for the 2D approach, and phone GPUs struggle. For a UI chrome element like a Dynamic Island, the 2D SDF with a faked normal is almost always the right call. Reserve raymarching for a hero or "about" moment, rendered small or at reduced resolution.

### Cited Findings
- **Codrops June 2025 droplet metaballs.**
  - Setup: a full-screen plane, spheres raymarched in the fragment shader and blended with smin into metaballs, plus surface noise.
  - Cursor response: spheres are arranged along the mouse trail to create stretchy, elastic motion.

  — [Codrops, Interactive Droplet-like Metaballs with Three.js and GLSL](https://tympanus.net/codrops/2025/06/09/how-to-create-interactive-droplet-like-metaballs-with-three-js-and-glsl/)
- **Codrops July 2024 liquid raymarching scene** uses R3F + TSL. TSL required the WebGPURenderer at the time. Credited sources: Kishimisu's tutorial, IQ, and Maxime Heckel's "Painting with Math" raymarching study. — [Codrops, Liquid Raymarching Scene with TSL](https://tympanus.net/codrops/2024/07/15/how-to-create-a-liquid-raymarching-scene-using-three-js-shading-language/)
- **Typical three.js raymarcher:** a full-screen quad, sphere tracing per pixel, and normals from SDF gradients. — [three.js forum, raymarching SDF shapes with soft-min color blends](https://discourse.threejs.org/t/raymarching-sdf-shapes-soft-min-color-blends/89570)
- **Speed vs smin type.**
  - CD-family smin (quadratic and others) underestimates distance in infinitely extending bands, so the raymarcher takes more steps near blend regions.
  - Circular-geometric smin is local and needs fewer iterations, but it overestimates distance. That requires back-tracking: break the loop on `abs(d)`.
  - IQ shows iteration heatmaps: blue under 15 steps, yellow under 25, red 30+.

  — [IQ, smooth minimum](https://iquilezles.org/articles/smin/)
- **Mobile raymarching.** The search found only anecdotal or marketing claims that heavy raymarching exceeds many phone GPUs. A SIGGRAPH talk (Level Ex) designed mobile SDF ray marching around cache and memory coherence on tile-based GPUs. — [rapidevelopers R3F raymarch template](https://www.rapidevelopers.com/md/v0-template/react-three-fiber-ray-marching); [SIGGRAPH archive, Level Ex](https://history.siggraph.org/?p=70009)

### Inferences
- **Cost model.** 2D SDF costs about N_shapes evaluations per pixel. Raymarching costs about N_steps (32–96) × N_shapes per pixel, plus 4–6 more scene evaluations for normals (tetrahedral gradient). For 6 shapes at 64 steps, that is roughly 60–70× the ALU work of the 2D approach.
- **Mitigations if you do raymarch.**
  - Restrict the quad to the island's bounding box, expanded by k, instead of full-screen. IQ notes the normalized k equals the required bounds expansion.
  - Render at 0.5–0.75× DPR to a render target and upscale.
  - Cap steps at 32–48 with an early exit at d < 0.001×t.
  - Use an analytic bounding-capsule early-out.
  - Clamp DPR to 1.5–2 on mobile.
  - Use `onDemand` rendering (R3F `frameloop="demand"`) when the island is idle.
- **Hybrid "2.5D".** Extrude the 2D SDF analytically to a 3D height, `z = h(d)` with the squircle bezel. This gives almost all of the lit-droplet look at 2D cost, and is likely how most web liquid-glass recreations work, the Codrops 2026 grid included.

### Gaps
- I found no rigorous benchmark numbers (fps by GPU) for SDF raymarching on integrated GPUs or phones.

## 3. Driving shape parameters from JS; mapping DOM rects to shader shapes

### Takeaway
Keep the text and content as real HTML. Each frame (or on layout change), read `getBoundingClientRect()` of invisible "slot" elements that define each state's shapes. Spring the shader's per-shape uniforms toward those rects using critically or under-damped springs, and draw the canvas behind the HTML (`pointer-events:none`). Use uniform arrays (vec4 × MAX_SHAPES) in WebGL2, or a small uniform/storage buffer in WebGPU.

### Cited Findings
- **maath `easing.damp` (npm `maath`, latest 0.10.8):**
  ```ts
  damp(current, prop, target, smoothTime?, delta?, maxSpeed?, easing?, eps?): boolean  // "based on Game Programming Gems 4 Chapter 1.10"
  ```
  - It returns whether the animation is still running.
  - Variants: `damp2/damp3/damp4` (three.js Vector2/3/4), `dampC` (Color), `dampE`, `dampQ`, `dampS`, `dampAngle`, `dampLookAt`.
  - `maxSpeed` clamps speed for far-apart targets.

  — [maath@0.10.8 easing.d.ts (unpkg)](https://unpkg.com/maath@0.10.8/dist/declarations/src/easing.d.ts)
- **The pmndrs/maath GitHub repo is now "math"** (npm `math`): allocation-free, data-oriented, renderer-agnostic, with WebGL/WebGPU interop. Its `math/time` module has `spring.update(state, target, smoothTime, dampingRatio, delta)` and `spring.damp(...)` (critically damped, dampingRatio = 1), plus `spring2/3/4` for Vec2–Vec4. A `dampingRatio < 1` gives the overshoot/wobble wanted for a jelly feel. — [pmndrs/math README and API.md](https://github.com/pmndrs/maath)
- **cult-ui DynamicIsland** (React/Framer Motion) uses a provider plus size presets with spring transitions (stiffness 400, damping 30). — [cult-ui components](https://cult-ui.com/components)
- **Oliver Pan's React + Framer Motion clone** defines states (pill, capsule, split, full) and uses a spring-driven SVG morph for the split state. — [Building an iOS Dynamic Island Clone](https://oliverpan.vercel.app/blog/building-ios-dynamic-island)
- **liquidGL** snapshots the DOM into a texture and renders glass on a canvas on top. This is how refracting real HTML behind the glass is done in WebGL, since WebGL cannot sample live DOM. — [search summary of liquidGL docs](https://docsearch.algolia.com/mcp/docs/repo/naughtyduk/liquidgl)
- **Real DOM is hard.** Pages mix DOM, text, images, video, scrolling, transforms and many rendering paths. — [Carson Ye, Where WebGL meets Liquid Glass](https://dev.to/_carson_ye_/where-webgl-meets-liquid-glass-401l)

### Inferences
- **Architecture.**
  ```
  <div class="island-root" style="position:fixed; top:12px; left:50%; translate:-50% 0">
     <canvas class="liquid" style="position:absolute; inset:-40px; pointer-events:none"/>   <!-- padded for blobs/stretch -->
     <div class="content"> ... real HTML (text, buttons) ... </div>
     <div class="slots" aria-hidden> <i data-slot=0/> <i data-slot=1/> ... </div>  <!-- invisible layout boxes -->
  </div>
  ```
  - The layout engine (CSS grid/flex) positions the invisible slot elements for the current state.
  - Either a `ResizeObserver` or a per-frame read of `slot.getBoundingClientRect()` gives target rects.
  - Convert each rect to canvas-local CSS px: `cx = r.left + r.width/2 - canvasRect.left`, `hw = r.width/2`.
  - Spring `{cx, cy, hw, hh, radius}` toward the targets.
  - Upload via `gl.uniform4fv(locRect, Float32Array(MAX*4))`.
  - Content fades or scales with its own CSS or Framer transitions, ideally timed to the same spring. You can feed the spring progress into CSS variables.
- **Spring step**, semi-implicit Euler, stable at 60–120 Hz:
  ```
  a = -k*(x - target) - c*v ;  v += a*dt ;  x += v*dt
  ```
  - Choose k = (2π/period)² and c = 2ζ√k, with ζ ≈ 0.6–0.75 for a lively Apple-like overshoot. ζ = 1 is maath's critically damped `damp`.
  - Clamp dt to ≤ 1/30 s to survive tab-switch spikes.
- **Avoid layout thrash.** Batch all `getBoundingClientRect` reads at the start of the rAF callback, before any DOM writes. Only re-read on state change, resize or scroll (via ResizeObserver/IntersectionObserver), and cache otherwise.
- **Staggering.** Give each shape's springs slightly different stiffness, or delay the trailing blob, so the split blobs "peel off" organically. Elongate along velocity (Section 4).
- **Libraries for the plumbing.**
  - Vanilla WebGL2, or OGL (tiny), is enough for a single quad.
  - R3F/three.js is warranted only if the rest of the site already uses it. In that case use `<mesh><planeGeometry/><shaderMaterial uniforms/></mesh>` with `useFrame((s,dt)=>damp(...))`.
  - react-spring and Framer Motion `useSpring` can also drive values outside React render, via `.get()` in rAF.

### Gaps
- No source found that documents a canonical "DOM slot → SDF uniform" library. The pattern above is synthesized, not sourced.

## 4. Cursor gravity, velocity stretch, jelly/wobble, click ripples

### Takeaway
Do cursor reactions in the SDF domain, either by warping `p` before evaluating the shapes or by adding a cursor "attractor" blob via smin. Drive everything with springs on the JS side, so the motion has inertia and overshoot. Ripples are a time-decaying radial sine added to the distance or the normal.

### Cited Findings
- **Elastic cursor trail.** The Codrops 2025 droplets tutorial creates stretchy, elastic motion by arranging smin'd spheres along the mouse trail (a history of recent positions). — [Codrops 2025 droplets](https://tympanus.net/codrops/2025/06/09/how-to-create-interactive-droplet-like-metaballs-with-three-js-and-glsl/)
- **Ripple helper.** LYGIA has `simulate/ripple.glsl/.wgsl`, a ping-pong ripple simulation. — [LYGIA repo tree](https://github.com/patriciogonzalezvivo/lygia)

### Inferences
- **Lean toward cursor (domain warp).**
  - Let `m` = the cursor, `c` = the shape center, and `dir = normalize(m - c)`.
  - Warp `p -= dir * strength * exp(-dot(p-c,p-c)/σ²) * falloff(|m-c|)`, which bulges the side facing the cursor.
  - Spring `strength` from 0 to its target when the cursor approaches within, e.g., 200 px.
  - Keep strength ≲ 0.3 × halfSize.y so the SDF stays well-behaved.
- **Attractor blob.**
  - Add `sdCircle(p - mSpring, r)` into the smin chain, where `mSpring` is a spring-lagged cursor clamped to within ~40 px of the island edge, `r` ≈ 4–10 px, and k is large.
  - The pill grows a "nub" reaching toward the cursor that snaps back when the cursor leaves. This is the classic gooey-cursor feel.
- **Velocity stretch (squash and stretch).**
  - In the shape's local frame, `q = p - c`, rotate into the velocity basis `u = v/|v|`, and scale the along-velocity component by `1/(1+s)` and the perpendicular component by `(1+s)^0.5`, with `s = clamp(|v|*0.0008, 0, 0.35)`.
  - This preserves approximate area. Multiply the resulting distance by `min(scale)` to keep it roughly conservative for AA.
  - Feed `v` from the spring's velocity, not the raw mouse, for smoothness.
- **Jelly/wobble.**
  - Under-damped springs (ζ ≈ 0.4–0.6) on halfSize give an overshoot "boing" on state change.
  - Optionally add surface wobble: `d += A * sin(angle*n + t*ω) * exp(-t_since_event*λ)`, where `angle = atan(q.y, q.x)`.
- **Click ripple (no simulation).** Keep a uniform array of up to 4 `{pos, t0}` entries.
  - Distance perturbation: `w = sin((r - c*(t-t0))*f) * exp(-(t-t0)*λ) * smoothstep(rw, 0, abs(r - c*(t-t0)))`.
  - Add `w*A` to the normal tilt, not the distance, so the silhouette stays crisp.
  - Or add a small amount to `d` for a visible edge pulse.
  - Alternative: a "press" squash, where the island's halfSize spring target is set to 0.96× on pointerdown and released on pointerup.
- **Reduced motion.** Respect `prefers-reduced-motion`: disable warp and ripples, and use critically damped springs.

### Gaps
- No primary source found specifically documenting cursor-attraction SDF warps for UI pills. The formulas above are standard techniques synthesized here, not quoted.

## 5. Alternatives: SVG gooey filter, CSS-only, web "liquid glass" recreations

### Takeaway
- The SVG goo filter (blur + alpha-threshold color matrix) is the easiest metaball effect and works cross-browser. It is CPU/compositor-expensive at large blur radii, softens edges, can't do lighting, and filters the content inside it too.
- CSS-only gets you a spring-morphing pill via border-radius, size and View Transitions, with no merging.
- SVG-displacement "liquid glass" via `backdrop-filter:url()` is Chromium-only and expensive to re-shape.

A WebGL2 SDF shader wins for smooth merging + lighting + cursor reactivity at 60 fps. It loses on setup complexity, accessibility layering and no-JS fallback.

### Cited Findings
- **Gooey recipe.** Apply a Gaussian blur, then an `feColorMatrix` that boosts alpha contrast. The Codrops demo uses `stdDeviation="10"` and an alpha row of `19 -9`; others use `18 -7`. It is applied via `filter:url(#goo)` on a container. — [Codrops, Creative Gooey Effects](https://tympanus.net/codrops/2015/03/10/creative-gooey-effects/); [CSS-Tricks (Lucas Bebber)](https://css-tricks.com/?p=195076)
- **Pure-CSS blob approach** (blur + contrast on a parent) has drawbacks: no transparency and no content inside the blobs. SVG filters fix this. — [CSS-Tricks (Lucas Bebber)](https://css-tricks.com/?p=195076)
- **SVG metaballs need an enlarged filter region** so the blur isn't clipped. — [DEV, SVG Metaballs](https://dev.to/antogarand/svg-metaballs-35pj)
- **kube.io SVG liquid glass.** It uses `feImage` displacement + `feDisplacementMap` (R/G channels, `scale` = max displacement in px; 8-bit channels limit displacement to about ±127 px), with a specular `feImage` blended in.
  - Browser support: "Only Chrome currently supports using SVG filters as backdrop-filter."
  - Animating shape or size is costly because the map must be regenerated; only `scale` is cheap to animate.
  - Only circles are handled; rounded rects are approximated by stretching the middle.

  — [kube.io](https://kube.io/blog/liquid-glass-css-svg/)
- **Other browsers.** Safari ignores `backdrop-filter:url()` and Firefox doesn't render it. Use a plain `blur()` fallback. Feature detection cannot reliably catch the failure. — [DEV, Liquid glass needs a ladder](https://dev.to/dimonb19a/liquid-glass-needs-a-ladder-394j); [buildmvpfast, backdrop-filter recipes 2026](https://www.buildmvpfast.com/blog/liquid-glass-css-backdrop-filter-recipes-2026)
- **archisvaze/liquid-glass** offers two renderers: SVG (`feDisplacementMap` + backdrop-filter) and WebGL (a full-screen Three.js shader with GLSL ray refraction). — [archisvaze/liquid-glass](https://docsearch.algolia.com/mcp/docs/repo/archisvaze/liquid-glass)
- **CSS `corner-shape`** (`squircle` = `superellipse(2)`) shipped in Chrome/Edge 139 (Aug 2025). As of 2026 Firefox and Safari have no native support or public timeline. It is animatable, and unsupported browsers ignore it. `clip-path` with a superellipse is a broader-support alternative. — [squircle.js.org, Squircles in CSS 2026](https://squircle.js.org/blog/squircles-in-css); [Smashing Magazine, Mar 2026](https://www.smashingmagazine.com/2026/03/beyond-border-radius-css-corner-shape-property-ui/)
- **Framer Motion springs.** cult-ui and Oliver Pan's clone achieve the classic Dynamic Island morph purely with Framer Motion springs on width, height and border-radius, plus an SVG morph for the split state. — [cult-ui](https://cult-ui.com/components); [Oliver Pan](https://oliverpan.vercel.app/blog/building-ios-dynamic-island)

### Inferences
| Approach | Merging | Lighting/gloss | Cursor liquid | Perf | Support | Complexity |
|---|---|---|---|---|---|---|
| CSS (Framer springs on size/radius) | No (fake split with 2 pills) | Gradients/box-shadow only | Limited (transform skew) | Excellent | All | Low |
| SVG goo filter | Yes (blur-threshold) | No (flat; edges soft) | Yes (move child divs) | Degrades with blur radius and area; repaints | All modern | Low-med |
| SVG displacement liquid glass | No | Yes (refraction + spec map) | Poor (re-shape = regenerate map) | Medium | Chromium only for backdrop | Med-high |
| WebGL2 2D SDF shader | Yes (exact, controllable k) | Yes (fake normals, Fresnel, spec) | Excellent | Excellent (trivial ALU) | ~Universal | Medium |
| WebGPU/TSL | Same as above | Same + compute options | Same | Same | Broad but uneven (see §6) | Medium-high |
| 3D raymarch | Yes | Real 3D | Excellent | Heavy on mobile | WebGL2 | High |

- **Recommended stack for a portfolio.**
  - A WebGL2 2D SDF canvas behind real HTML content, springs in JS, and DOM slot rects as targets.
  - A CSS-only Framer-Motion pill as the fallback for no-WebGL, reduced-motion or low-power cases.
  - Liquid-glass refraction only if there is a background worth refracting. Get it either from a static background texture or by rendering the page backdrop into the same canvas; avoid live DOM capture.
- **The goo filter's weakness for this design.** It filters its children too, so text inside goo blobs gets blurred and thresholded. You must layer the content on top of the goo layer, which is the same layering a shader requires anyway.

### Gaps
- No measured performance comparison (goo filter vs shader) was found.
- Support for CSS `shape()` and its interpolation was not checked in this pass.

## 6. Libraries, resources, and WebGL2 vs WebGPU support (2026)

### Takeaway
Target WebGL2 GLSL for the island, which is universal and enough for a 2D SDF. Optionally write it in three.js TSL to get WebGPU with an automatic WebGL2 fallback. WebGPU is now available in all major browsers, but platform coverage is uneven, especially on Linux and Firefox mobile.

### Cited Findings
- **WebGPU status.**
  - Chrome/Edge shipped first.
  - Safari 26 (Sept 2025) shipped WebGPU on macOS, iOS, iPadOS and visionOS.
  - Firefox 141 shipped on Windows (July 2025) and Firefox 145 on macOS (Nov 2025).
  - A Chrome developer statement says WebGPU is supported across Chrome, Edge, Firefox and Safari as of Dec 2025.
  - Coverage is still uneven: Chrome on Linux is limited to newer Intel/NVIDIA hardware, and Firefox Linux/Android coverage is unclear.
  - Sources partially conflict on exact Firefox platforms, so keep a WebGL2 fallback.

  — [TechSpot](https://www.techspot.com/news/110456-webgpu-now-brings-desktop-quality-graphics-all-major.html); [cinevva WebGPU vs WebGL 2026](https://app.cinevva.com/guides/webgpu-vs-webgl-games)
- **TSL requires three.js WebGPURenderer.** The Codrops 2024 article notes this; WebGPURenderer falls back to WebGL2 in later three.js versions, though that is not verified here. — [Codrops 2024](https://tympanus.net/codrops/2024/07/15/how-to-create-a-liquid-raymarching-scene-using-three-js-shading-language/)
- **LYGIA** is a granular, multi-language (GLSL, HLSL, WGSL, MSL, CUDA, plus WESL) shader library with `#include`-style modules: `sdf/`, `lighting/fresnel`, `simulate/ripple`. License: Prosperity / Patron. Check it before commercial use. — [LYGIA GitHub](https://github.com/patriciogonzalezvivo/lygia); [rectSDF.glsl header](https://raw.githubusercontent.com/patriciogonzalezvivo/lygia/main/sdf/rectSDF.glsl)
- **Inigo Quilez resources.**
  - distfunctions2d (all 2D primitives, Shadertoy playlist MXdSRf); the rounded-box demo is shadertoy.com/view/4llXD7.
  - smin article (with Shadertoy demos), including the snow/bridge material-mix demo at shadertoy.com/view/Mds3z2.

  — [IQ 2D SDFs](https://iquilezles.org/articles/distfunctions2d/); [IQ smin](https://iquilezles.org/articles/smin/)
- **Codrops tutorials:** gooey effects (2015), liquid raymarching with TSL (2024), droplet metaballs (2025), infinite liquid glass grid with WebGPU/TSL (2026). — links above.
- **Liquid Glass Studio** (WebGL2 + WebGPU, SDF + smooth merge, springs, Leva UI) is the best open-source reference implementation. Demo: liquid-glass-studio.vercel.app. — [GitHub](https://github.com/iyinchao/liquid-glass-studio)
- **pmndrs maath/math** for damping and springs. — [unpkg maath](https://unpkg.com/maath@0.10.8/dist/declarations/src/easing.d.ts); [pmndrs/math](https://github.com/pmndrs/maath)

### Inferences
- **The Book of Shaders** (thebookofshaders.com; by Patricio Gonzalez Vivo, author of LYGIA) is the standard intro to shaping functions and 2D SDF drawing. I did not fetch it this pass.
- **OGL** (a minimal WebGL library) is a good fit for a single-quad island shader, keeping the bundle to a few KB versus three.js. It was not verified in this pass.
- **Performance budget.** A 2D SDF island with ≤8 shapes on an island-sized canvas (e.g. 500×200 CSS px at DPR 2–3) costs well under 1 ms on integrated GPUs and phones. Not benchmarked; this is an estimate from the ALU count.
  - Pause rAF when idle and the springs are at rest. maath's `damp` returns `false` when settled.
  - Use `powerPreference: 'low-power'`.

### Gaps
- I didn't verify the current three.js WebGPURenderer→WebGL2 fallback behavior and version, OGL's current API, or the Book of Shaders content in this pass.
- Shadertoy pages were not fetched; the IDs listed come from IQ's articles.
