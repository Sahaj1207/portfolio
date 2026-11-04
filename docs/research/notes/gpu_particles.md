# GPU Particle Systems: Pill -> Code-Token Particles -> Portrait -> Pill (Three.js / R3F, WebGL2 + WebGPU)

Research date: 2026-11-04. Budget-limited pass (~15 tool calls). Codrops pages returned HTTP 403 to the fetcher, so Codrops content comes from search snippets only. Items marked [INFERENCE] are engineering judgment, not sourced facts.

## GPGPU simulation paths: WebGL2 FBO ping-pong vs WebGPU compute + TSL (maturity, browser support, fallback)

### Takeaway
As of late 2026 the realistic modern path is `three/webgpu` + TSL compute (`instancedArray` + `Fn().compute()`), because WebGPURenderer falls back to a WebGL2 backend that emulates `renderer.compute()` with transform feedback. That gives one codebase for both paths, provided you avoid WebGPU-only features (workgroup shared memory, storage textures, indirect dispatch/draw). The classic WebGLRenderer + GPUComputationRenderer/FBO route is still maintained and proven, but its GLSL `ShaderMaterial`s do not run on WebGPURenderer. You end up choosing one stack or the other, and can't mix them.

### Cited Findings
**Versions and maturity**
- r171 (Nov 29, 2024): the `three/webgpu` entry point works without extra build config. r181 deprecated the `*Async` methods (`renderAsync`, `computeAsync`). r183 renamed `PostProcessing` to `RenderPipeline` and deprecated `Clock`. r185 changed premultiplied alpha. r186 (Sept 8, 2026) is current per the article and removed `PCFSoftShadowMap` for WebGPURenderer. — [Utsubo WebGPU migration guide, updated Sep 24 2026](https://www.utsubo.com/blog/webgpu-threejs-migration-guide)
- The three.js manual still labels WebGPURenderer experimental. WebGLRenderer is still maintained and is the recommended choice for pure WebGL2 apps. — [Utsubo](https://www.utsubo.com/blog/webgpu-threejs-migration-guide); [three.js manual (via search snippet)](https://threejs.org/manual/en/webgpurenderer)
- A third-party guide says r182 (Dec 2025) promoted WebGPURenderer to the recommended renderer. This is secondary and not checked against release notes. — [youngju.dev 2026 deep dive (search snippet)](https://www.youngju.dev/blog/culture/2026-05-16-webgpu-webgl-2026-three-js-r3f-babylon-playcanvas-tres-needle-native-webgpu-wgsl-deep-dive.en)
- A forum report found WebGPU r182 slower than WebGL r170 in some scenes. A maintainer replied that the regressions were fixed on dev and that r183 should be "noticeably" faster. — [three.js forum](https://discourse.threejs.org/t/webgpu-significant-performance-drop-and-shadow-quality-regression-in-r182-vs-webgl-r170/89322)
- A third-party community skill says "r171+: stable TSL API". — [dgreenheck webgpu-claude-skill README](https://cdn.jsdelivr.net/gh/dgreenheck/webgpu-claude-skill@main/README.md) (community, low authority)

**Fallback behavior (key point for this project)**
- WebGPURenderer uses WebGPU by default and falls back to a WebGL2 backend. `forceWebGL: true` forces the fallback for testing. — [three.js manual (search snippet)](https://threejs.org/manual/en/webgpurenderer)
- The WebGL2 backend emulates `renderer.compute()` using transform feedback, so storage-buffer updates still work. The dispatch size must be a single number. The following are not available on WebGL2: workgroup shared memory, storage textures (`textureStore()`), indirect dispatch, and indirect draws (`geometry.setIndirect()`). — [Utsubo](https://www.utsubo.com/blog/webgpu-threejs-migration-guide)
- The WebGLBackend source (three@0.181.2) has a `transformFeedbackCache` and toggles `RASTERIZER_DISCARD` "when using compute shaders". That is consistent with transform-feedback compute emulation. — [unpkg WebGLBackend.js 0.181.2](https://app.unpkg.com/three@0.181.2/files/src/renderers/webgl-fallback/WebGLBackend.js)
- **CONFLICT / OUTDATED NOTE:** In Sept 2025 Don McCurdy wrote on the forum that WebGPURenderer "does not require WebGPU support" but that apps needing the fallback should "avoid WebGPU-only features such as compute". The 2026 Utsubo guide and the backend source show that basic compute *is* emulated. Read McCurdy's comment as covering advanced compute features rather than all compute, and test on `forceWebGL: true`. — [three.js forum thread 87188](https://discourse.threejs.org/t/r3f-webgpu-webgl2-fallback-tree-shaking/87188)
- `renderer.isWebGPURenderer` is true on both backends. Check `renderer.backend.isWebGPUBackend` after `await renderer.init()`. WebGPU requires a secure context (HTTPS/localhost), so plain-HTTP staging always falls back. — [Utsubo](https://www.utsubo.com/blog/webgpu-threejs-migration-guide)
- `ShaderMaterial`, `RawShaderMaterial` and `onBeforeCompile` do not run on WebGPURenderer on either backend, so each one needs a TSL port. `EffectComposer`, pmndrs/postprocessing and @react-three/postprocessing do not work with WebGPURenderer. — [Utsubo](https://www.utsubo.com/blog/webgpu-threejs-migration-guide)

**Official TSL compute particle pattern (webgpu_compute_particles)**
- `const particleCount = 200000;` (the page subtitle says "500k", but the code says 200k). State lives in `instancedArray(particleCount, 'vec3')` for positions, velocities and colors. Kernels are written with `Fn(...)().compute(particleCount)`. `renderer.compute(computeInit)` runs once and `renderer.compute(computeParticles)` runs each frame. Rendering uses `SpriteNodeMaterial` with `material.positionNode = positions.toAttribute()`, `colorNode = uv().mul(colors.element(instanceIndex))` and `opacityNode = shapeCircle()`, plus `particles.count = particleCount` and `frustumCulled = false`. — [three.js examples/webgpu_compute_particles.html](https://github.com/mrdoob/three.js/blob/dev/examples/webgpu_compute_particles.html)
- Utsubo cites the Hokusai installation at Expo 2025 Osaka at about 1M particles in real time. — [Utsubo](https://www.utsubo.com/blog/webgpu-threejs-migration-guide)

**Classic WebGL FBO path**
- Maxime Heckel's R3F FBO pattern stores positions in a `Float32Array(w*h*4)` wrapped in a `DataTexture(FloatType)`. A simulation `ShaderMaterial` sits on a plane in an offscreen scene, rendered via `createPortal` with an ortho camera into drei `useFBO` (Nearest filter, RGBA, FloatType, no stencil). In `useFrame` you set the render target, render, reset it, and pass `renderTarget.texture` as `uPositions` to the points material. Each particle has a reference attribute of normalized UV to look up its texel. The demo is 128x128 = 16,384 particles; the author says it exceeds 1M particles on an M1 MacBook Pro (2020) at higher resolution. It covers curl noise on a sphere and a box-to-sphere morph via `mix` between two data textures. **It does NOT ping-pong.** Positions are a pure function of time plus the initial textures, which suits a scroll-reversible effect well. — [Maxime Heckel blog](https://blog.maximeheckel.com/posts/the-magical-world-of-particles-with-react-three-fiber-and-shaders/)
- The Codrops "Dreamy Particle Effect" tutorial (Dec 2024, Dominik Fojcik) uses `GPUComputationRenderer` to store positions and velocities in textures, with targets sampled from a mesh. — [Codrops (search snippet)](https://tympanus.net/codrops/2024/12/19/crafting-a-dreamy-particle-effect-with-three-js-and-gpgpu/)
- The Three.js Journey lesson "GPGPU Flow Field Particles" ("Very hard", members-only) stores particle positions in an FBO updated by GPGPU and combines this with a flow field. A third-party write-up says Bruno's lesson uses GPUComputationRenderer. — [threejs-journey](https://threejs-journey.com/lessons/gpgpu-flow-field-particles-shaders); [eleonoradrykina blog](https://eleonoradrykina.github.io/shaders-research-blog/blog/01-15-gpgpu)

**Browser support (WebGPU)**
- web.dev, Nov 25 2025: Chrome/Edge 113+ on Windows (D3D12), macOS and ChromeOS. Android: Chrome 121+, Android 12+, Qualcomm/ARM GPUs. Firefox: 141 on Windows; 145 on macOS Tahoe 26 ARM64; Linux, Android and Intel Macs in progress. Safari 26 on macOS Tahoe 26, iOS 26, iPadOS 26 and visionOS 26. — [web.dev](https://web.dev/blog/webgpu-supported-major-browsers)
- Sept 2026 update: Chrome Linux 144+ on Intel Gen12+, and 147+ on NVIDIA under Wayland. Firefox 147 on all macOS versions with Apple Silicon. Firefox on Intel Macs, Linux and Android still not in stable. caniuse global support is about 87% (84% full + 3% partial, Aug 2026 data). — [Utsubo](https://www.utsubo.com/blog/webgpu-threejs-migration-guide)

**R3F status**
- R3F 9.8.0 (Sept 22, 2026) is the stable line and supports WebGPU through an async `gl` factory: `gl={async (props) => { const r = new THREE.WebGPURenderer(props); await r.init(); return r; }}` plus `extend(THREE)` from `three/webgpu`. Returning an uninitialized renderer throws in r186. — [Utsubo](https://www.utsubo.com/blog/webgpu-threejs-migration-guide)
- In R3F v10 (alpha.6), WebGPU is the default and WebGL moves to a `/legacy` import. The `/webgpu` entry is deprecated. The TSL hooks (`useUniforms`, `useNodes`, `useBuffers`, `useGPUStorage`, `useRenderPipeline`) move to `@react-three/tsl`. — [newreleases.io R3F 10.0.0-alpha.6](https://newreleases.io/project/npm/@react-three/fiber/release/10.0.0-alpha.6)

### Inferences
- [INFERENCE] Recommended architecture: `three/webgpu` + TSL compute on R3F 9.x with the async `gl` factory, one `instancedArray` per state field (pos, vel, glyphId, color, startPos, targetPos, seed), and a fallback to the WebGL2 backend that comes for free. Keep kernels to simple per-particle work with 1D dispatch and no shared memory or storage textures, so the fallback path stays valid.
- [INFERENCE] The alternative is the legacy stack: WebGLRenderer + Heckel-style stateless FBO (or GPUComputationRenderer ping-pong if you need velocity integration). It is lower risk if you depend on troika/drei Text or pmndrs postprocessing, which do not work under WebGPURenderer.
- [INFERENCE] For scroll reversibility, prefer a **stateless/analytic** simulation: `pos = f(start, target, progress, seed, time)`. A stateful velocity integrator can't be scrubbed backwards cleanly. A hybrid works well. Compute the analytic path `mix(start, target, ease(localT))`, add curl-noise displacement scaled by `sin(pi*localT)` so it is zero at both ends, and optionally add a small stateful spring for "life" that is scrubbed back to zero.

### Gaps
- No official three.js release notes for r183-r186 were fetched directly (the manual URL 404'd). Version facts rely on the Utsubo guide.
- I found no published benchmark comparing WebGPU compute against the WebGL2 transform-feedback fallback for particle counts.

## Sampling target positions from a portrait image + alpha matte; start positions on the pill

### Takeaway
Do this on the CPU once, at build time or load time. Draw the photo and matte to a canvas, rejection-sample or importance-sample pixels weighted by alpha × (darkness or luminance), optionally run Poisson-disk/blue-noise relaxation, and store per-particle `targetPos` + `color` (+ size from luminance). Then upload them as a storage buffer or DataTexture. Start positions come from sampling the pill's capsule surface (or its 2D rounded-rect area if the pill is a flat DOM-matched shape).

### Cited Findings
- The Codrops "Interactive Particles" tutorial (Bruno Imbrizi) creates particles from image pixels, converts them to greyscale, discards pixels that are too dark, and uses instanced geometry + texture. Repo: designagencyuk/interactive-particles. — [Codrops search snippet / GitHub](https://github.com/designagencyuk/interactive-particles)
- Heckel's morph pattern packs multiple target shapes into separate DataTextures and blends them in the sim shader with `mix`, the same structure as pill→portrait→pill. — [Maxime Heckel](https://blog.maximeheckel.com/posts/the-magical-world-of-particles-with-react-three-fiber-and-shaders/)
- A third-party TSL morph walkthrough builds several target buffers (sphere, tetrahedron, trefoil, text) and uploads an interpolated destination per frame. — [three-fluid-fx TSL tutorials](https://three-fluid-fx.vercel.app/tutorials/tsl/full/mega/)

### Inferences
- [INFERENCE] Weighting: `w = alpha * pow(1 - luminance, gamma)` if dark glyphs on a light background draw the face, or `w = alpha * luminance` with light glyphs on the black site background (more likely here, given a black pill). Sample with a CDF over the weight map (O(log n) per sample), or by rejection sampling. Add sub-pixel jitter so the result has no grid artifacts.
- [INFERENCE] Blue noise: run Bridson Poisson-disk with a variable radius (smaller radius where the weight is high), or a few Lloyd relaxation iterations. Either can be done offline in Node and shipped as a binary `Float32Array` (e.g. 40k × (x,y,z,r,g,b,size) ≈ 1.1 MB raw, much less gzipped/quantized to Uint16).
- [INFERENCE] Color: either per-particle RGB from the photo (photographic look) or monochrome glyphs where size/opacity encode luminance (code-art look). Size-by-luminance is what makes text glyphs read as an image. Brighter areas get larger or bolder glyphs; dark areas get smaller ones or "." / "," tokens.
- [INFERENCE] Correspondence: to make the burst look intentional, sort start points and target points along the same axis (e.g. by x, or by angle around the centroid) before pairing, or assign them randomly for a chaotic burst. Pairing by sorted order reduces crossing paths. Optimal transport is overkill.
- [INFERENCE] Pill start positions: sample uniformly on a capsule's area. For a 2D stadium shape, rejection-sample in its bounding box. The pill must line up pixel-exactly with the DOM pill (the "Dynamic Island" element). Project its `getBoundingClientRect()` into world space with an orthographic camera, or a perspective camera at a known distance.
- [INFERENCE] Pack a depth offset per particle (from a depth map or a small z jitter) so the assembled portrait has parallax on mouse move.

### Gaps
- No found source gives a canonical image→blue-noise particle sampler for three.js; the above is standard technique, not sourced.

## Rendering particles as code-token glyphs (MSDF/SDF atlas, instancing, readability)

### Takeaway
Don't use troika/drei `<Text>` for the particles. It is one mesh per text block, and it does not work under WebGPURenderer. Build your own instanced quad system instead: a single MSDF atlas (generated with msdf-bmfont/msdf-atlas-gen) of the characters or short tokens present in the site's source code, per-instance attributes for the atlas UV rect, size, color and rotation, and a median(r,g,b) MSDF fragment shader. In TSL this is a `SpriteNodeMaterial`/`MeshBasicNodeMaterial` with the `colorNode`/`opacityNode` computed from the atlas.

### Cited Findings
- No evidence was found that troika-three-text supports WebGPURenderer/TSL. A forum thread reports a white square under WebGPU. — [three.js forum](https://discourse.threejs.org/t/troika-three-text-and-webgpu/55737)
- In Utsubo's test, drei `Text` (troika) crashed the WebGPU render pass and drew nothing on the WebGL2 backend. — [Utsubo](https://www.utsubo.com/blog/webgpu-threejs-migration-guide)
- three-text-geometry v4.0 claims WebGPU support with TSL node materials that work under both WebGLRenderer and WebGPURenderer, using a BMFont-based approach. — [pkgstats three-text-geometry](https://www.pkgstats.com/pkg:three-text-geometry)
- Codrops (Jan 28, 2026), "WebGPU Gommage Effect": MSDF text dissolving into dust/petal particles with three/webgpu + TSL, InstancedMesh particles, and selective bloom via MRT nodes. It is the closest published precedent for MSDF + particles in TSL. — [Codrops](https://tympanus.net/codrops/2026/01/28/webgpu-gommage-effect-dissolving-msdf-text-into-dust-and-petals-with-three-js-tsl/) (page 403 to the fetcher; details from search snippet)
- coconut-xr/glyph is an instanced MSDF text renderer for three.js. — [GitHub](https://github.com/coconut-xr/glyph)
- three-msdf-text stores per-glyph atlas UVs in a `charUv` attribute. — [GitHub SolalDR/three-msdf-text](https://github.com/SolalDR/three-msdf-text)
- Per-instance atlas UVs: use a per-instance attribute encoding the UV rect and remap the quad UV into it. Don't overload the instance color attribute. — [three.js forum](https://discourse.threejs.org/t/how-to-apply-offsets-for-texture-atlas-in-instancedmesh/33191.md)
- MSDF shader: one instanced quad per glyph, median of the RGB distances, and distance converted to coverage with a screen pixel range so edges stay about 1px wide at any zoom. — [facett-core msdf.wgsl](https://docs.rs/crate/facett-core/latest/source/src/render/gpu/msdf.wgsl)

### Inferences
- [INFERENCE] Token atlas from the site's own source: tokenize the source at build time (e.g. a Vite plugin reading `src/**` and splitting on identifiers/punctuation, or using the TypeScript scanner). Keep the most frequent N tokens (e.g. 256-1024, such as `const`, `=>`, `{}`, `useFrame`, `</>`). Rasterize each token into an MSDF atlas (msdf-atlas-gen supports strings when glyphs are pre-composed; otherwise render whole tokens to a plain SDF canvas atlas). Ship the atlas as a 2048² PNG/KTX2 plus a JSON of UV rects.
- [INFERENCE] Mixed lengths: tokens vary in width, so carry `uvRect` (vec4) and `aspect` per instance and scale the quad's x by the aspect. In the portrait state, short tokens or single characters pack more cleanly. Consider swapping tokens for single characters as `progress→portrait` (two atlas UV sets with a crossfade), or keep tokens but shrink them.
- [INFERENCE] Readability while scattered vs image when assembled: in flight, use bigger quads, a camera-facing orientation, slight rotation from velocity, and full opacity. On assembly, scale glyph size by target luminance (0.3–1.0), tint by photo color, align rotation to 0 (or to the image gradient direction for an engraving look), and apply a light bloom. Use `fwidth`-based antialiasing so tiny glyphs don't shimmer. Below about 6px on screen the glyphs blur into dots anyway, which is fine for the image read.
- [INFERENCE] Fill-rate is the real cost for 30k+ alpha-blended quads. Use premultiplied alpha, `depthWrite: false`, small quads, and DPR ≤ 1.5. Consider alphaTest/discard instead of blending for the dense portrait state.

### Gaps
- I couldn't verify the Gommage tutorial's exact MSDF pipeline (tool, TSL median code) because Codrops returned 403.
- I found no published demo that specifically uses source-code tokens as particle glyphs.

## Motion design: curl noise, attraction to target, stagger, scroll-driven reversible progress

### Takeaway
Drive everything from one `uProgress` uniform (0→1 burst+assemble, hold, 1→2 collapse) set by a scroll timeline (GSAP ScrollTrigger scrub, or Lenis + custom). Each particle computes a staggered local time from its seed and position, eases it, interpolates start→target, and adds curl-noise displacement windowed so it vanishes at the endpoints. Because the motion is a pure function of progress, scrubbing backwards is exact.

### Cited Findings
- Heckel applies curl noise to positions in the simulation pass and morphs between shapes with `mix` on time. — [Maxime Heckel](https://blog.maximeheckel.com/posts/the-magical-world-of-particles-with-react-three-fiber-and-shaders/)
- The Three.js Journey flow-field lesson uses spatialized streams (flow field) to advect GPGPU particles. — [threejs-journey](https://threejs-journey.com/lessons/gpgpu-flow-field-particles-shaders)
- The official compute example uses a pointer-driven "Hit" compute kernel to push particles, which works as an interaction model for the hold phase. — [three.js webgpu_compute_particles](https://github.com/mrdoob/three.js/blob/dev/examples/webgpu_compute_particles.html)

### Inferences
- [INFERENCE] Per-particle schedule: `delay = seed*0.35 + distFromPillCenter*0.15`, then `localT = clamp((p - delay)/(1 - 0.5), 0, 1)` and `e = easeInOutCubic(localT)`. Position is `mix(start, target, e) + curl(pos*freq + seed, time*0.2) * amp * sin(PI*e)`. Add an outward "burst" impulse early on: `+ normalize(start - pillCenter) * burst * sin(PI*min(localT*2,1))`.
- [INFERENCE] Collapse back: reuse the same function with `target` as the new start and `pill` as the new target, or simply run progress back down. A different curl seed for collapse avoids a literal rewind if you want variety on forward scroll.
- [INFERENCE] Curl noise: the TSL `mx_noise_vec3` / MaterialX noise nodes, or a GLSL simplex-curl port, are standard. Precomputing a 3D curl texture (e.g. 64³) is cheaper on mobile than evaluating it analytically per particle.
- [INFERENCE] If you want "life" during the hold (breathing, mouse repulsion), add a stateful offset buffer integrated with a damped spring toward zero. The analytic base path stays reversible and the offset decays.
- [INFERENCE] Sync the DOM pill: crossfade the CSS pill's opacity to 0 at progress≈0.02 while the particles at their start positions overlap it exactly, then reverse at the end.

### Gaps
- I found no specific source on GSAP/ScrollTrigger + R3F uniform scrubbing for particle morphs (standard practice, unsourced here).

## Performance, adaptive quality, and fallback (laptops, phones, reduced motion)

### Takeaway
Reference points: 16k particles is a "runs everywhere" FBO baseline, the official WebGPU compute example runs 200k, and an M1 manages 1M+ simple points. For glyph quads (4–6 vertices each, alpha-blended), a sane budget is about 20–40k on desktop/integrated and about 8–15k on phones [INFERENCE]. Use detect-gpu tiers to choose the initial count and DPR, drei PerformanceMonitor to step DPR or count down at runtime, and fall back to a pre-rendered video or static image for tier 0, `prefers-reduced-motion`, or failed init.

### Cited Findings
- Heckel's demo is 128×128 = 16,384 particles, with "little to no frame drop". More than 1M is possible on an M1 MacBook Pro (2020). — [Maxime Heckel](https://blog.maximeheckel.com/posts/the-magical-world-of-particles-with-react-three-fiber-and-shaders/)
- The official webgpu_compute_particles example uses 200,000 particles. — [three.js example](https://github.com/mrdoob/three.js/blob/dev/examples/webgpu_compute_particles.html)
- Expo 2025 Osaka Hokusai installation: about 1M particles in real time on WebGPU (installation hardware, not consumer). — [Utsubo](https://www.utsubo.com/blog/webgpu-threejs-migration-guide)
- The Utsubo guide gives no FPS or WebGPU-vs-WebGL compute benchmarks. Forum reports show WebGPU slower than WebGL in some r182 scenes (fixed toward r183). — [Utsubo](https://www.utsubo.com/blog/webgpu-threejs-migration-guide); [three.js forum](https://discourse.threejs.org/t/webgpu-significant-performance-drop-and-shadow-quality-regression-in-r182-vs-webgl-r170/89322)
- detect-gpu `getGPUTier()` returns tier 0 for no WebGL, a blocklisted GPU or <15 fps, tier 1 for ≥15 fps, tier 2 for ≥30 and tier 3 for ≥60, based on benchmark data. Tier 0 needs a non-WebGL fallback. — [pmndrs/detect-gpu](https://github.com/pmndrs/detect-gpu)
- drei `PerformanceMonitor` averages FPS and fires `onIncline`/`onDecline` (common pattern: DPR between 1 and 2, starting at 1.5). `onChange` gives a gradual `factor`, `onFallback` fires after repeated flip-flops, and `usePerformanceMonitor` lets children react individually. — [drei docs](https://drei.docs.pmnd.rs/performances/performance-monitor)
- WebGPU needs HTTPS, and Electron availability follows its bundled Chromium. — [Utsubo](https://www.utsubo.com/blog/webgpu-threejs-migration-guide)

### Inferences
- [INFERENCE] Tier map: tier 3 → 40k glyphs at DPR 1.5–2; tier 2 → 20–25k at DPR 1.25; tier 1 or mobile → 8–12k at DPR 1, no bloom; tier 0, `prefers-reduced-motion: reduce`, `navigator.connection.saveData`, or renderer init failure → static portrait image (or a short muted WebM/MP4 of the sequence, poster frame first). Allocate buffers for the max count and set `mesh.count` to change the visible count without reallocating.
- [INFERENCE] Hooking `PerformanceMonitor.onDecline` to drop the visible count by 25% steps is smoother than DPR changes for a fill-bound glyph effect. `onFallback` should swap to the static image.
- [INFERENCE] Pause rendering (`frameloop="demand"` or invalidate only on scroll) when the section is offscreen, using an IntersectionObserver. The effect only needs to animate while its scroll range is active.
- [INFERENCE] Lazy-load three/webgpu + the atlas + the sample buffers only when the section nears the viewport. `three.webgpu.js` is a sizable bundle; the size wasn't measured here.
- [INFERENCE] Since the Utsubo guide notes premultiplied-alpha behavior changed in r185, check blending visually on both backends.

### Gaps
- No measured fps numbers were found for ~30k MSDF glyph quads on Intel Iris Xe/Apple A-series phones. These need in-project profiling.
- No data was found on the transform-feedback fallback's per-particle cost compared with native compute.
- The three.webgpu bundle size wasn't verified.

**Key tutorials and demos to cite:** [Maxime Heckel FBO particles](https://blog.maximeheckel.com/posts/the-magical-world-of-particles-with-react-three-fiber-and-shaders/); [Three.js Journey GPGPU Flow Field Particles](https://threejs-journey.com/lessons/gpgpu-flow-field-particles-shaders); [Codrops Dreamy GPGPU particles (2024)](https://tympanus.net/codrops/2024/12/19/crafting-a-dreamy-particle-effect-with-three-js-and-gpgpu/); [Codrops Interactive (image) Particles repo](https://github.com/designagencyuk/interactive-particles); [Codrops WebGPU Gommage MSDF dissolve (Jan 2026)](https://tympanus.net/codrops/2026/01/28/webgpu-gommage-effect-dissolving-msdf-text-into-dust-and-petals-with-three-js-tsl/); [three.js webgpu_compute_particles](https://github.com/mrdoob/three.js/blob/dev/examples/webgpu_compute_particles.html); [Utsubo WebGPU migration guide 2026](https://www.utsubo.com/blog/webgpu-threejs-migration-guide).
