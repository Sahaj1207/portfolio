# Stack, Scroll Orchestration and Performance Strategy for a WebGL-Heavy Portfolio (late 2026)

Research date: 2026-11-04. Package versions were read from the live npm registry (`npm view <pkg> version` and `time.modified`) on that date, so the version numbers are first-hand. Everything else carries its inline source.

## Framework choice (Vite + React vs Next.js App Router vs Astro) for a WebGL portfolio on Vercel

### Takeaway
Next.js App Router (16.x) with one persistent R3F `<Canvas>` in the root layout is the best-trodden path for a React/R3F portfolio that needs SSR'd, indexable case-study pages on Vercel. Darkroom's "Satus" starter and the pmndrs `react-three-next` starter both use this pattern. Astro (7.x) with a `transition:persist` canvas island is a strong option when you want less JS. Plain Vite + React is simplest but gives up SSR/SEO unless you add prerendering. Page transitions inside the App Router are the weak spot.

### Cited Findings
- Current versions (npm, 2026-11-04): `next` 16.4.5 (canary 16.5.0); `astro` 7.4.5; `vite` 8.3.5; `react` 19.3.1 — npm registry (`npm view`), see [npmjs.com/package/next](https://www.npmjs.com/package/next), [astro](https://www.npmjs.com/package/astro), [vite](https://www.npmjs.com/package/vite), [react](https://www.npmjs.com/package/react)
- The pmndrs `react-three-next` starter is built on the App directory. It keeps a single canvas across navigation by using tunnel-rat to portal components into a shared renderer, and drei `<View>` renders 3D into any DOM element via `gl.scissor` — [react-three-next (GitHub)](https://github.com/ospira/react-three-next)
- Forum consensus: mount the canvas once and swap its contents on route change. A canvas per route reloads assets, restarts the renderer and produces "Context Lost" messages — [three.js forum](https://discourse.threejs.org/t/context-lost-when-i-route-to-another-page-in-react-three-fiber/61736); trade-off discussion in [R3F discussion #3221](https://fr.github.com/pmndrs/react-three-fiber/discussions/3221)
- Darkroom Engineering (makers of Lenis) maintain "Satus", a Next.js App Router starter. Its stack is described as R3F + Lenis + Theatre.js + GSAP, and the newer README says Next.js 15 + React 19 + Tailwind v4 with a `<GSAPRuntime />` in `app/layout.tsx` for ScrollTrigger + Lenis — [satus (GitHub)](https://github.com/studio-freight/satus); [ecosyste.ms summary](https://awesome.ecosyste.ms/projects/github.com%2Fdarkroomengineering%2Fsatus) (exact current version unverified; the mirrors I saw were unofficial)
- Codrops says parallel page transitions are hard in the Next.js App Router ("a bit tricky"). Its demo uses React Router to hold the outgoing page while a persistent R3F scene keeps running — [Codrops: Parallel Page Transitions with GSAP and React Router](https://tympanus.net/codrops/?p=123421)
- Astro `<ClientRouter />` turns an MPA into SPA-style navigation. `transition:persist` keeps an element or island (and its state) alive across navigations, and you can name it to match across different components. CSS animations restart and iframes reload even when persisted. Scripts must be re-initialised after navigation. Fallback modes for unsupported browsers are `animate` (default), `swap` and `none` — [Astro docs: View transitions](https://docs.astro.build/en/guides/view-transitions/)
- Next.js `viewTransition` config flag enables React's View Transitions integration in the App Router. The Next 16.2.x docs describe setting it in `next.config.js` and importing `<ViewTransition>` from React. The Next 15 docs called it experimental and not recommended for production. A GitHub discussion and some blogs conflict on whether it is now flagless or exported as `unstable_ViewTransition` — [Next.js docs viewTransition](https://nextjs.org/docs/app/api-reference/config/next-config-js/viewTransition); [Next 15 docs](https://nextjs.org/docs/15/app/api-reference/config/next-config-js/viewTransition); [discussion #97925](https://github.com/vercel/next.js/discussions/97925)

### Inferences
- Recommended: Next.js 16 App Router, statically generated (SSG via `generateStaticParams`) for `/` and `/work/[slug]`. Put a client-only `<WebGLRoot>` (dynamic import, `ssr:false`) in `app/layout.tsx` so it persists across routes. Drive transitions by animating the canvas scene, which lives outside the route tree, with GSAP on route change. Don't rely on DOM crossfades of the outgoing page. This avoids the App Router's lack of an "outgoing page" hold.
- Astro fits better if the case studies are mostly long-form content (MDX) and you want near-zero JS on text. One React island (`client:only="react"`, `transition:persist`) can host the R3F canvas.
- Plain Vite + React SPA gives the best DX and the smallest framework overhead, but case-study SEO needs prerendering. That's extra work, so it's not recommended here.
- Suggested structure (Next): `app/layout.tsx` (fonts, `<Lenis>`, `<GSAPRuntime>`, `<WebGLRoot>`), `app/page.tsx`, `app/work/[slug]/page.tsx`, `app/opengraph-image.tsx`; `webgl/` (Scene, LiquidSDF shader material, Particles (GPGPU), PostFX, `store.ts` (zustand scroll/route state)); `components/` (DOM sections with `data-gl-anchor` refs); `content/` (MDX case studies); `public/` (KTX2/glb, poster fallback images).

### Gaps
- I found no authoritative 2025–2026 survey of what "top creative devs" use. The evidence is starters and Codrops tutorials, which point to Next + R3F + GSAP + Lenis as the dominant React path, with some studios on vanilla three.js or OGL. I could not quantify this.
- I did not verify that `<ViewTransition>` is stable in Next 16.4.

## R3F + drei vs vanilla three.js vs OGL, and the supporting libraries

### Takeaway
R3F v9 (9.8.2) is stable on React 19 and peers `react >=19 <19.4`. drei 10.7.9 and @react-three/postprocessing 3.2.2 target it. R3F v10 is still alpha/canary. Vanilla three.js r187 is the right call if you want full control of a single custom render loop, and it avoids React-renderer memory overhead. OGL is lighter but has been quiet since Jan 2025. Theatre.js's R3F bindings are stale (peer `@react-three/fiber ^8`), which is a real compatibility risk.

### Cited Findings
- Versions (npm, 2026-11-04): `three` 0.187.0 (published 2026-10-30); `@react-three/fiber` 9.8.2 (latest), 10.0.0-alpha.6 (2026-10-17) and a 10.0.0 canary; `@react-three/drei` 10.7.9 (alpha 11.0.0-alpha.7); `@react-three/postprocessing` 3.2.2; `postprocessing` 6.39.6; `maath` 0.10.8; `leva` 0.10.1; `r3f-perf` 7.2.3 (last published 2024-11-08); `@theatre/core` / `@theatre/r3f` 0.7.2 (last published 2024-05-19); `ogl` 1.0.11 (2025-01-27); `tunnel-rat` 0.1.2 (2023); `detect-gpu` 5.0.70 (2025-02-26) — npm registry (`npm view`) e.g. [npmjs.com/package/@react-three/fiber](https://www.npmjs.com/package/@react-three/fiber)
- Peer dependencies (npm): fiber 9.8.2 peers `react >=19 <19.4`, `three >=0.156`; drei 10.7.9 peers `@react-three/fiber ^9`, `react ^19`; @react-three/postprocessing 3.2.2 peers `@react-three/fiber >=9.7.0`, `postprocessing ^6.36`; `@theatre/r3f` 0.7.2 peers `@react-three/fiber ^8.13.6` (not v9); `r3f-perf` peers `fiber >=8`; `leva` peers React 18 or 19 — npm registry
- The R3F v9 migration guide calls v9 the React 19 compatibility release, with breaking changes under Strict Mode, and says types like `MeshProps` were removed in favour of `ThreeElements['mesh']` — [R3F v9 Migration Guide](https://r3f.docs.pmnd.rs/tutorials/v9-migration-guide)
- R3F v9.5.0 release notes: compatible with React 19.0–19.2, achieved by bundling the reconciler — [GitHub release v9.5.0](https://github.com/pmndrs/react-three-fiber/releases/tag/v9.5.0)
- three.js WebGPURenderer is imported from `three/webgpu` and TSL from `three/tsl`. The docs recommend always using the latest release — [three.js manual: WebGPURenderer](https://threejs.org/manual/en/webgpurenderer); [TSL docs](https://threejs.org/docs/pages/TSL.html)
- A forum report says R3F crashed with context loss on iPad where vanilla three.js didn't, attributing it to R3F defaults being heavier on memory (anecdotal) — [three.js forum](https://discourse.threejs.org/t/texture-is-causing-loss-of-context-in-ipados-ios-17-5-1-when-using-react-three-fiber/68643)
- GSAP + R3F + Lenis combinations can be very laggy on mobile and desktop when misconfigured (forum thread) — [GSAP forum](https://gsap.com/community/forums/topic/43299-performance-issues-on-desktop-and-mobile-devices-using-gsap-with-react-three-fiber/)

### Inferences
- For a liquid SDF (full-screen raymarch quad) plus GPU particles (GPGPU ping-pong FBOs or `three/webgpu` compute), most of the code is custom GLSL/TSL either way. R3F's value is co-locating scene state with React routes and DOM, plus drei helpers (`View`, `useFBO`, `PerformanceMonitor`, `AdaptiveDpr`, `shaderMaterial`). Recommended: R3F 9.8.x + drei 10.7.x, pinning React to 19.3.x (inside the fiber peer range `<19.4`).
- Write the shaders as raw GLSL `ShaderMaterial`s (WebGLRenderer) for now. Use WebGPURenderer/TSL only if you accept WebGL2 fallback complexity. I did not verify R3F 9's WebGPURenderer ergonomics, so treat that as an open question.
- Theatre.js: `@theatre/r3f` officially peers fiber v8 and hasn't shipped since May 2024. Either use `@theatre/core` alone, driving values into uniforms manually (it is renderer-agnostic), or author timelines in GSAP instead. Flag this as a risk.
- `maath` (easing/damping helpers, e.g. `easing.damp3`) is current and useful for frame-rate-independent smoothing of scroll-driven uniforms. Use `leva` and `r3f-perf` in dev only (dynamic import behind a `?debug` flag). r3f-perf's peer range admits v9, but it hasn't been published since 2024, so check that it works.
- `@react-three/postprocessing` (EffectComposer) adds passes. For one liquid shape, consider folding grain/vignette/chromatic aberration into the final shader, which saves a full-screen pass on mobile.

### Gaps
- I didn't confirm what R3F v10 changes, or when it will be stable (only that alpha.6 exists as of 2026-10-17).
- I didn't verify whether `@theatre/r3f` works with fiber 9 in practice (only the declared peer range).
- I didn't confirm `detect-gpu`'s benchmark data freshness. The package was last published Feb 2025, so new GPUs may be missing from its tiers.

## Scroll orchestration (Lenis + GSAP ScrollTrigger + R3F single RAF, DOM sync, CSS scroll-driven animations, View Transitions, GSAP licensing)

### Takeaway
Use DOM-driven scroll: real HTML document, Lenis 1.3.27 smoothing native scroll, GSAP 3.15.1 ScrollTrigger reading it, and all three driven from one GSAP ticker. Have that ticker call R3F's `advance()` (Canvas `frameloop="never"`), or let R3F own the loop and call `lenis.raf` there. Prefer this over drei `ScrollControls`, which builds a virtual scroll container and hurts SEO/a11y. GSAP, including every former Club plugin, is free for commercial use under Webflow's "Standard No Charge" license. CSS scroll-driven animations reached Baseline Newly Available in Oct 2026, per one source, when Firefox 159 shipped them. Cross-document View Transitions still lack Firefox support.

### Cited Findings
- Lenis 1.3.27. Recommended GSAP integration: `lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add(t => lenis.raf(t*1000)); gsap.ticker.lagSmoothing(0);` `autoRaf` defaults to false, so either set it true or call `lenis.raf` yourself (not both). React bindings are in `lenis/react` (the old `@studio-freight/react-lenis` is deprecated) — [Lenis GitHub README](https://github.com/darkroomengineering/lenis); [npm deprecated package](https://npmjs.com/package/@studio-freight/react-lenis)
- Lenis wraps native scroll, so `position: sticky`, anchor links and a11y features keep working. `respectReducedMotion` defaults to true: smoothing is disabled and programmatic scrolls jump when the user prefers reduced motion, and Lenis keeps running so WebGL/DOM sync stays intact (`lenis.prefersReducedMotion`) — [Lenis README](https://github.com/darkroomengineering/lenis)
- Lenis limitations: no CSS scroll-snap (use `lenis/snap`); capped at 60fps on Safari and 30fps in Low Power Mode; doesn't work over iframes; fixed positioning may lag on pre-M1 macOS Safari; `syncTouch` unreliable on iOS <16 — [Lenis README](https://github.com/darkroomengineering/lenis)
- R3F: `frameloop="demand"` renders only on change, and `invalidate()` requests a frame — [R3F Scaling performance](https://r3f.docs.pmnd.rs/advanced/scaling-performance). (The `frameloop="never"` + `advance(timestamp)` pattern for an external loop comes from R3F's Canvas API. I didn't fetch that page this session, so verify.)
- drei `<View>`: several scenes in one canvas via `gl.scissor`. Each View follows a DOM tracking element (scrolls and resizes with it). Pass `eventSource` as a parent containing both canvas and HTML. `index` sets render order. `frames={1}` avoids repeated `getBoundingClientRect` for static views. Output via `<View.Port />`. The `track` prop is deprecated — [drei docs: View](https://drei.docs.pmnd.rs/portals/view)
- GSAP licensing: after Webflow's acquisition, GSAP and all former Club plugins (SplitText, MorphSVG, etc.) are free, including commercial use. The npm `gsap` package includes them and `gsap-trial` is deprecated. The one restriction is no use in visual no-code animation builders that compete with Webflow without written consent. The FAQ says AI-generated code is not a prohibited use. Webflow keeps the IP and can revoke for non-compliance — [GSAP Standard License](https://gsap.com/standard-license); [Webflow blog: GSAP becomes free](https://webflow.com/blog/gsap-becomes-free); [CodePen blog](https://blog.codepen.io/2025/05/05/chris-corner-gsap-more-like-freesap/). npm `gsap` 3.15.1 license field: "Standard 'no charge' license" (npm, 2026-11-04). `@gsap/react` 2.1.2 (`useGSAP`).
- CSS scroll-driven animations: the scroll-driven-animations.style tracker (by the spec's Chrome DevRel author) says Firefox 159 completed cross-engine support in October 2026, making them "Baseline Newly Available" — [scroll-driven-animations.style](https://scroll-driven-animations.style/demos/baseline-newly-available/css/). That conflicts with a September 2026 guide saying Firefox stable still had it behind a pref as of Firefox 152 (June 2026) — [whoooop.co.uk](https://whoooop.co.uk/blog/css-scroll-driven-animations). The two are consistent if Firefox 159 shipped in October.
- Same-document View Transitions: Baseline Newly Available since 2025-10-14 (Firefox 144) — [web-features explorer: view-transitions](https://web-platform-dx.github.io/web-features-explorer/features/view-transitions). Cross-document (MPA) View Transitions are not Baseline because Firefox doesn't support them — [web-features explorer: cross-document](https://web-platform-dx.github.io/web-features-explorer/features/cross-document-view-transitions); GitLab MR (Aug 2026) notes Firefox doesn't yet support them — [GitLab MR 248470](https://gitlab.com/gitlab-org/gitlab/-/merge_requests/248470)

### Inferences
- Recommended single-loop wiring: `<Canvas frameloop="never">`. In one `gsap.ticker.add((t) => { lenis.raf(t*1000); advance(t*1000) })`, ScrollTrigger updates via the Lenis scroll event, then R3F renders once. Alternative: keep R3F `frameloop="always"`, drive Lenis from `useFrame`, set `gsap.ticker.remove(gsap.updateRoot)` and call `gsap.updateRoot(t)` from useFrame. Either way, use exactly one RAF.
- Choreography: ScrollTriggers with `scrub` write to a plain mutable store (not React state) of normalized progress per section, e.g. `store.hero = 0..1`. Shaders read it in `useFrame` and damp with `maath/easing`. Never `setState` per scroll frame (it hurts INP).
- Syncing the liquid shape to DOM: for a single full-screen SDF, project DOM anchor rects into uniforms. Cache `getBoundingClientRect` on resize/ScrollTrigger refresh and add `lenis.scroll` per frame rather than re-measuring every frame. Use drei `<View>` only for case-study thumbnails that need separate scenes.
- Don't use drei `ScrollControls` for this site. It scrolls a virtual container inside the canvas wrapper, which conflicts with real document scroll, anchor links, find-in-page and Lenis.
- Use CSS scroll-driven animations (`animation-timeline: view()`) for cheap DOM-only reveals, gated with `@supports` and reduced-motion. That keeps GSAP for canvas-coupled timelines. Use same-document View Transitions (via Next/React `<ViewTransition>` or Astro ClientRouter) for DOM route transitions, but don't depend on cross-document VT.

### Gaps
- I couldn't confirm the Firefox 159 / Oct 2026 Baseline claim against MDN/caniuse directly.
- I found no official GSAP doc this session on calling `gsap.updateRoot` from an external loop. That's from my own knowledge, so verify.

## Accessibility and fallbacks

### Takeaway
Keep every word in semantic HTML layered over an `aria-hidden` decorative canvas. Respect `prefers-reduced-motion` (Lenis does by default; also freeze or slow shaders). Ship a static poster image that is the LCP element. Degrade by GPU tier and live FPS, and handle `webglcontextlost` with a static fallback.

### Cited Findings
- Lenis respects reduced motion by default and keeps native scroll semantics (sticky, anchors, a11y) — [Lenis README](https://github.com/darkroomengineering/lenis)
- R3F adaptive quality: `PerformanceMonitor` (`onIncline`/`onDecline`/`onChange` factor/`flipflops` + `onFallback`, `usePerformanceMonitor`), `dpr` clamp on `<Canvas>` (e.g. `[1, 2]`, lowered on decline), `performance.regress()` with `min`/`max`/`debounce` — [R3F Scaling performance](https://r3f.docs.pmnd.rs/advanced/scaling-performance)
- Context loss: call `preventDefault()` on `webglcontextlost` so the browser can restore, then rebuild GPU resources on `webglcontextrestored` (beginner tutorial, partly inaccurate elsewhere, so use with caution) — [svilenkovic.com](https://www.svilenkovic.com/3d/webgl-context-lost-fix). `<Canvas fallback>` prop renders when WebGL is unavailable. One Vercel thread reports context loss still blocking rendering with no posted fix — [Vercel community](https://community.vercel.com/t/three-webglrenderer-context-lost-when-loading-a-3d-object-on-vercel/3431)
- On mobile, ship a static image instead of the 3D scene, and make sure first paint includes a poster/fallback — [Utsubo: WebGL & Three.js SEO](https://www.utsubo.com/blog/webgl-three-js-site-seo-rankable-guide) (vendor blog)

### Inferences
- Canvas: `aria-hidden="true"`, `tabIndex={-1}`, `pointer-events: none` unless interactive. All headings, links and case-study text are real DOM in document order, with visible focus styles and a skip link. Lenis keeps keyboard scrolling (Space/PageDown/arrows) native.
- Reduced motion: disable Lenis smoothing (default), set ScrollTrigger `scrub` to snap or skip, freeze particle advection, and render a single still frame (`frameloop="demand"`). Consider a visible "reduce motion / pause animation" toggle to meet WCAG 2.2 SC 2.2.2 Pause, Stop, Hide for auto-playing motion longer than 5s.
- Tiering: at boot, `detect-gpu` `getGPUTier()` (tier 0 means static poster, tier 1 means dpr 1, half-res SDF, fewer particles, no post; tier 2–3 means full). Then `PerformanceMonitor` adjusts at runtime. Also check `navigator.connection.saveData` and `deviceMemory` where available.
- Render the raymarch at reduced internal resolution (e.g. 0.5–0.75 scale FBO upsampled) on mobile, because raymarched SDFs are fill-rate bound.

### Gaps
- I found no authoritative R3F doc on context-loss recovery.
- I didn't fetch WCAG text this session. The SC 2.2.2 and 2.3.3 references are from my own knowledge.

## Performance budgets

### Takeaway
Aim for the Core Web Vitals "good" thresholds at p75: LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1. Achieve them by making HTML text or a poster the LCP element and deferring three.js and the scene until after first paint/idle. three.js core is about 600KB minified by itself (one vendor source), so the initial route JS should exclude it entirely.

### Cited Findings
- CWV good thresholds: LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1, at the 75th percentile, mobile and desktop segmented — [web.dev: Web Vitals](https://web.dev/articles/vitals)
- Don't lazy-load the LCP element; lazy-load offscreen content — [GTmetrix](https://gtmetrix.com/dont-lazy-load-lcp-image.html)
- On a Three.js hero the LCP element is usually the canvas. Defer the 3D bundle past initial paint. three.js core is about 600 KB minified before scene code and assets (vendor blog, unverified figure) — [Utsubo](https://www.utsubo.com/blog/webgl-three-js-site-seo-rankable-guide)
- Asset pipeline: KTX2/Basis keeps textures GPU-compressed, using about 4–8x less VRAM than RGBA. A 2048² image is about 22MB VRAM whether it ships as PNG or WebP. Requires `KTX2Loader.detectSupport(renderer)` or it silently falls back to RGBA. Meshopt is `gltf-transform optimize`'s default geometry codec (smaller decoder); Draco gives smaller files with slower/larger decode. Typical command `gltf-transform optimize in.glb out.glb --compress meshopt --texture-compress ktx2`. Verify with `renderer.info.memory` — [threejs asset pipeline guide](https://www.ui-skills.com/skills/cloudai-x/threejs-asset-pipeline); [cinevva GLB guide](https://app.cinevva.com/guides/optimize-glb-for-web) (third-party, not official docs)
- Keep draw calls to a few hundred at most; use instancing; share geometries and materials — [R3F Scaling performance](https://r3f.docs.pmnd.rs/advanced/scaling-performance)

### Inferences (proposed budgets — my synthesis, not sourced benchmarks)
- Initial JS, first route (gzip): ≤ 120–170 KB (React 19 + Next runtime + Lenis about 4KB + GSAP core/ScrollTrigger about 45KB). No three.js.
- Deferred WebGL chunk (gzip): ≤ 250–300 KB (three + fiber + needed drei imports + shaders). Load on `requestIdleCallback` / after `load`, then fade the canvas in over the poster. Import drei per-module, never `postprocessing` unless used.
- Assets: hero scene ≤ 1–1.5 MB total transfer. Textures in KTX2. A procedural SDF and particles may need almost no assets at all, which is a big win.
- GPU: 60fps target, meaning ≤ 16.7 ms per frame and ideally ≤ 8–10 ms GPU time on mid-tier laptops. Mobile dpr clamp `[1, 1.5]`, desktop `[1, 2]`. Particles: about 65k (256²) mobile, 262k (512²) desktop via GPGPU. Measure with `r3f-perf` (dev), Chrome DevTools Performance (GPU track), Spector.js, and `EXT_disjoint_timer_query_webgl2` where exposed.
- Lighthouse 90+ mobile performance is plausible with this deferral. Lighthouse lab runs may not capture the deferred WebGL at all, so watch field data (Speed Insights RUM) for INP regressions from main-thread scene setup. Split shader compilation (`gl.compileAsync` / warm-up) away from interactions.
- Fonts: self-host 1–2 variable WOFF2 via `next/font` (auto `font-display`/preload, size-adjusted fallback for CLS). Subset. If you need MSDF text in WebGL, load it in the deferred chunk.

### Gaps
- I found no rigorous public dataset of Lighthouse/CWV scores for award-level WebGL portfolios.
- The three.js minified size figure (about 600KB) is from a vendor blog. I didn't measure it in this session.

## Deployment (Vercel config, domain, analytics, OG images)

### Takeaway
Deploy Next.js on Vercel with SSG routes. Use `@vercel/analytics` 2.0.1 and `@vercel/speed-insights` 2.0.0 for RUM CWV, generate OG images per case study with `app/opengraph-image.tsx` (`next/og` ImageResponse), and set long-lived immutable caching for hashed `/public` 3D assets.

### Cited Findings
- `@vercel/analytics` 2.0.1 (2026-10-02), `@vercel/speed-insights` 2.0.0 (2026-07-03) — npm registry; [npmjs.com/package/@vercel/speed-insights](https://www.npmjs.com/package/@vercel/speed-insights)
- Satus deploys to Vercel/Netlify or any Next.js host — [satus (GitHub)](https://github.com/studio-freight/satus)

### Inferences
- `vercel.json`/`next.config` headers: `Cache-Control: public, max-age=31536000, immutable` for versioned `/assets/*.ktx2|*.glb|*.bin`, and set `Content-Type: image/ktx2` for KTX2. Host Basis/Draco/meshopt decoders locally, not from a CDN.
- Custom domain: add it in Project → Domains, apex A record or `CNAME cname.vercel-dns.com`. I didn't verify the current DNS target values this session.
- SEO: per-route `generateMetadata`, JSON-LD (`Person`, `CreativeWork`), `sitemap.ts`, `robots.ts`. Case-study content is SSG HTML, so crawlers never need WebGL.

### Gaps
- I didn't fetch Vercel docs for current analytics pricing/limits, OG image (`next/og`) limits, or DNS records.
