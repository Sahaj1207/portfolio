# Reference Sites: Award-Winning WebGL / Creative-Developer Portfolios (2022–2026) for a "Dynamic Island metaball" portfolio concept

Research notes. Date of research: 2026-11-04. Method: web search plus page fetches. Note: tympanus.net/codrops returned HTTP 403 to every direct fetch, so Codrops details come from search-result summaries of those pages, not from reading the full articles. Awwwards annual-award pages (annual-awards-2023/2024) returned 404 on direct fetch; award facts for them come from search-result snippets of those pages. Facts marked "(unverified)" come from my background knowledge or from a single secondary source, and should be checked before publishing.

## Which developer portfolios won Awwwards Developer Award / SOTD / Portfolio honors in 2023–2026 using WebGL shaders, liquid/blob/metaball effects, or particle systems?

### Takeaway
The highest-profile WebGL winners in the window are Lusion v3 (2023 Site of the Year and Developer Site of the Year), Igloo Inc by Abeto (2024 Site of the Year and Developer Site of the Year, with a fluid sim and particles), Bruno Simon's folio-2025 (Site of the Month, Jan 2026), and Samsy's Gen-02 (SOTD + Developer Award, Oct 2025). I found no award-winning personal portfolio described in sources as a metaball/SDF-liquid site. That combination looks like open territory, though fluid and particle work is well established on studio sites (Lusion, Igloo).

### Curated reference list (13 sites)

For each site: URL, author, awards, techniques, what makes it technically deep, and what to learn from it.

1. **Lusion v3** — https://lusion.co — Lusion (studio)
   - Awards: Awwwards Site of the Year 2023 and Developer Site of the Year 2023 — [Awwwards SOTY 2023 search snippet](https://awwwards.com/annual-awards-2023/site-of-the-year); [Developer SOTY 2023](https://www.awwwards.com/annual-awards-2023/developer-site-of-the-year). Lusion Labs (separate site) won SOTD on Jun 1, 2023 — [Awwwards](https://www.awwwards.com/sites/lusion-labs).
   - Jury note: the clean interface "blends seamlessly with the over-the-top animations" — [Awwwards SOTY 2023](https://awwwards.com/annual-awards-2023/site-of-the-year) (search-snippet paraphrase).
   - Techniques: pointer-driven fluid and particle interaction. A third-party reverse-engineering post says it uses an offscreen Eulerian fluid grid. The post is unofficial and I could only read its intro — [dev.to feed, DDW-X "Deconstructing Lusion.co"](https://dev.to/feed/ddw-x). Awwwards also hosts Lusion inspiration items titled "Accelerated WebGL fluid simulation" and "GPU fluid experiments" — [Awwwards](https://www.awwwards.com/inspiration/accelerated-webgl-fluid-simulation); [Awwwards](https://www.awwwards.com/inspiration/gpu-fluid-experiments). A juror's roundup describes Lusion as doing "research-grade particle and material work" — [Hon Tran](https://www.hontran.dev/blog/best-award-winning-websites-2026).
   - Learn from it: the fluid is the cursor's response, while the UI stays clean and readable. The effect adds a layer and never replaces the content.

2. **Igloo Inc** — https://www.igloo.inc — Abeto (dev) with Bureaux (agency), for the parent company of Pudgy Penguins
   - Awards: Awwwards Site of the Year 2024 and Developer Site of the Year 2024 — [Awwwards SOTY 2024](https://www.awwwards.com/annual-awards-2024/site-of-the-year); [Developer SOTY 2024](https://awwwards.com/annual-awards-2024/developer-site-of-the-year). A Webby 2026 entry also lists it under Best Visual Design – Aesthetic — [Webby Awards](https://winners.webbyawards.com/2026/websites-and-mobile-sites/features-design/best-visual-design-aesthetic/361001/igloo-inc).
   - Jury note: it combines "an immersive 3D experience with an easy to navigate, scroll interaction" — [Awwwards SOTY 2024 snippet](https://www.awwwards.com/annual-awards-2024/site-of-the-year).
   - Techniques: the Awwwards case study mentions custom tooling such as a "volume data exporter" and an "expansive fluid simulation", plus particle animation physics — [Awwwards Igloo Inc case study](https://awwwards.com/igloo-inc-case-study.html). The case study's date is Sep 25, 2024 on its own page and Oct 30, 2024 in blog listings, so the two disagree.
   - Learn from it: this is the strongest evidence that jurors reward wild GPU work when navigation is simple scroll. Building custom pipelines (exporters, sims) is what reads as "technically deep".

3. **Bruno Simon — folio 2025** — https://bruno-simon.com — Bruno Simon (creator of Three.js Journey)
   - Awards: Site of the Month, Jan 2026; Portfolio Honors, Dec 2025; Developer Award — [Awwwards portfolio winners](https://www.awwwards.com/websites/winner_category_portfolio/). The earlier 2019 car portfolio won SOTD on Nov 11, 2019 (older, out of window) — [Awwwards](https://www.awwwards.com/sites/bruno-simon-portfolio).
   - Techniques: drivable vehicle in a 3D scene with online features. Source is public on GitHub (folio-2025) — [CreativeDevJobs](https://www.creativedevjobs.com/blog/best-threejs-portfolio-examples-2025).
   - Learn from it: one strong interaction metaphor carries the whole site, and open-sourcing the code adds credibility. The car is his metaphor, as the pill is the one in this concept.

4. **Gen-02 (Samsy)** — https://samsy.ninja — Samuel Honigstein
   - Awards: Awwwards SOTD and Developer Award, Oct 2025 — [webgpu.com showcase](https://www.webgpu.com/showcase/gen-02-portfolio-an-immersive-world/)
   - Techniques: custom WebGPU rendering (WebGL is also tagged), Vue, GSAP and Three.js, built as navigable 3D rooms. The author has written about instanced rendering and data textures — [webgpu.com](https://www.webgpu.com/showcase/gen-02-portfolio-an-immersive-world/). A roundup claims 120+ FPS (unverified) — [CreativeDevJobs](https://www.creativedevjobs.com/blog/best-threejs-portfolio-examples-2025).
   - Learn from it: WebGPU is now an award-level differentiator. A WebGPU compute path (with a WebGL2 fallback) is a natural fit for the particle-portrait moment.

5. **AW Portfolio** — https://wodniack.dev — Antoine Wodniack
   - Awards: SOTD Dec 12, 2024; Portfolio Honors Nov 2024; Developer Award — [Awwwards](https://www.awwwards.com/websites/winner_category_portfolio/); overall score 7.56 — [Awwwards](https://www.awwwards.com/sites/aw-portfolio)
   - Techniques: described as a "Creative Developer specializing in animation-driven, high-impact websites". The specific WebGL techniques are not confirmed in sources (gap).
   - Learn from it: a solo developer portfolio can earn the Developer Award through polish in its motion system.

6. **Roman Jean-Elie — Portfolio '25**
   - Awards: Awwwards SOTD, score 7.21; tagged Three.js, GSAP, Next.js — [Awwwards](https://www.awwwards.com/sites/portfolio-25-1)
   - Making-of: Codrops "Letting the Creative Process Shape a WebGL Portfolio" (Nov 27, 2025) covers GSAP MorphSVG, React Three Fiber, and a system that tracks DOM element bounds and maps them to WebGL coordinates — [Codrops](https://tympanus.net/codrops/2025/11/27/letting-the-creative-process-shape-a-webgl-portfolio/) (search summary; fetch blocked).
   - Learn from it: syncing DOM bounds to WebGL is the core technique a morphing pill needs. The SDF pill must take each section's real DOM rectangle as its target shape, so the HTML stays accessible and the GPU shape follows it.

7. **Arnaud Rocca portfolio (2026)**
   - Making-of: Codrops "Arnaud Rocca's Portfolio: From a GSAP-Powered Motion System to Fluid WebGL" (Mar 31, 2026), with GSAP and OGL — [Codrops](https://tympanus.net/codrops/2026/03/31/arnaud-roccas-portfolio-from-a-gsap-powered-motion-system-to-fluid-webgl/) (search summary; fetch blocked, so awards are not confirmed).
   - Learn from it: OGL is a lightweight alternative to Three.js when the scene is one fullscreen shader (an SDF pill is). That cuts bundle size.

8. **Stefan Vitasović — Portfolio 2025**
   - Making-of: Codrops case study (Mar 5, 2025) describes a minimalist creative-dev site with typographic animation, a WebGL video grid, and seamless page transitions. Videos are rendered as WebGL textures to keep the mesh count low — [Codrops](https://tympanus.net/codrops/2025/03/05/case-study-stefan-vitasovic-portfolio-2025/). Awards are not confirmed in sources (gap).
   - Learn from it: the transitions read as one continuous object, which is the same goal as a pill that never unmounts.

9. **Gianluca Gradogna — Portfolio '25** — https://gianlucagradogna.com
   - Awards: SOTD Jan 23, 2025; Portfolio Honors Jan 2025; Developer Award — [Awwwards](https://www.awwwards.com/websites/winner_category_portfolio/)
   - Making-of: Codrops case study (Jan 30, 2025) covers an infinite-scroll homepage and a horizontal photography page — [Codrops](https://tympanus.net/codrops/2025/01/30/case-study-gianluca-gradogna-portfolio-25/). WebGL use is not confirmed.
   - Learn from it: the Developer Award can come from scroll mechanics alone, without heavy 3D.

10. **Jesper Landberg** — https://jesperlandberg.com
    - Awards: SOTD Sep 29, 2026; Portfolio Honors Aug 2026; Developer Award — [Awwwards](https://www.awwwards.com/websites/winner_category_portfolio/). Jesper is a long-time WebGL/creative developer (unverified background knowledge). The 2026 site's techniques are not documented in sources (gap; check the site directly).
    - Learn from it: this is the most recent developer-portfolio winner, useful for benchmarking the current bar.

11. **Minh Pham** — https://minhpham.design
    - Awards: Awwwards SOTD, developer score 7.77 — [Hon Tran (juror)](https://www.hontran.dev/blog/best-award-winning-websites-2026)
    - Techniques: a GSAP motion system layered over Three.js/WebGL. The juror cites it as proof "WebGL can stay tasteful" because the 3D frames the work without overwhelming it — [Hon Tran](https://www.hontran.dev/blog/best-award-winning-websites-2026).
    - Learn from it: let the pill frame the case studies, and don't let it compete with them.

12. **Weisdevice** — https://weisdevice.xyz — Xianyao Wei
    - Techniques: Three.js, GLSL, Howler.js audio, GSAP. Performance measures: raycasting throttled to 30 FPS, the render loop paused while a project page is open, assets lazy-loaded. A Codrops case study exists — [CreativeDevJobs](https://www.creativedevjobs.com/blog/best-threejs-portfolio-examples-2025). No awards are listed.
    - Learn from it: concrete performance discipline. Pause or throttle the SDF raymarch when the pill is idle or off screen, and throttle cursor-gravity updates.

13. **Jordan Breton** — https://jordan-breton.com
    - Awards: FWA Site of the Day, Oct 2, 2025 — [CreativeDevJobs](https://www.creativedevjobs.com/blog/best-threejs-portfolio-examples-2025)
    - Techniques: floating island with grass, waterfall, fire, wind, and butterflies (particle-heavy natural effects). The camera moves between fixed viewpoints rather than free roam.
    - Learn from it: fixed, authored camera stops tame complexity. Treat each pill "morph state" as an authored keyframe, not as free physics.

Adjacent (non-portfolio) references with GPU depth:
- **Oryzo** (oryzo.ai) by Lusion: Awwwards Site of the Month Apr 2026 plus Developer Award; Three.js with scroll-driven Z-axis camera and inertia easing — [Utsubo](https://www.utsubo.com/blog/best-threejs-websites-2026) (awards are as stated by that article, not independently checked).
- **IVRESS** by Utsubo: FWA Site of the Month May 2026; WebGPURenderer with WebGL fallback; TSL shaders compiled to both backends; "scene graph is budgeted" — [Utsubo](https://www.utsubo.com/blog/best-threejs-websites-2026). This is a self-reported studio case.
- **Shopify Editions Spring 2026**: particle-dispersing type with scroll sequencing — [Utsubo](https://www.utsubo.com/blog/best-threejs-websites-2026). Directly relevant to the moment where the pill dissolves into particles.
- **Cartier Watches & Wonders 2026** by Immersive Garden: Awwwards SOTD and CSSDA; Three.js, GLSL, GSAP, Lenis, and a Web Audio score — [Utsubo](https://www.utsubo.com/blog/best-threejs-websites-2026). A reference for sound design.

Other 2024–2026 portfolio winners from the Awwwards portfolio category (all with Developer Award unless noted; their techniques are not documented here): Elliott Mangham (SOTD Dec 2, 2025), Olha Lazarieva (SOTD Oct 2, 2025), Artiom Yakushev (SOTD Dec 27, 2025; no Dev Award), Pacôme Pertant by Louis Bocquet (SOTD Jun 9, 2026), NOTHIN' by Thomas Carré (SOTD Aug 10, 2026), Grégory Lallé '24 (SOTD Oct 30, 2024), RossMason by Gil Huybrecht (SOTD Feb 27, 2024) — [Awwwards portfolio winners](https://www.awwwards.com/websites/winner_category_portfolio/).

### Inferences
- The top tier (SOTY level) is studio work. Among solo developer portfolios, the ones winning the Developer Award are often polished motion systems rather than raw GPU spectacle. A pill-SDF portfolio would stand out if it pairs genuine GPU depth (raymarched SDF plus a GPGPU particle portrait) with simple scroll or click navigation, which is the Igloo Inc formula.
- A sources-backed gap: I found no award-winning developer portfolio described as metaball/SDF-liquid-centric. That makes this concept's central visual idea comparatively novel.

### Gaps
- Specific WebGL techniques for AW Portfolio, Jesper Landberg 2026, Elliott Mangham, and Olha Lazarieva are not documented in the sources I reached.
- CSSDA and FWA award lists were not checked directly. FWA claims above come from secondary roundups.
- Lusion's own fluid implementation is documented only by an unofficial third party.
- The Awwwards annual-awards pages could not be fetched (404), so the jury quotes are search-snippet paraphrases.

## Which notable Codrops demos/tutorials cover liquid morphing, metaballs, particle portraits, or scroll-driven WebGL?

### Takeaway
Codrops has tutorials that map directly onto the concept's building blocks: raymarched metaballs with a mouse trail (2025), GPGPU particles (2024), image-pixel particles (2019, older), and a run of 2025–2026 WebGL portfolio case studies. No single tutorial builds a particle portrait with GPGPU; that has to be assembled from these pieces.

### Cited Findings
- **"How to Create Interactive, Droplet-like Metaballs with Three.js and GLSL"** by Yuki Kojima (Jun 9, 2025). It renders a fullscreen plane, raymarches spheres in the fragment shader, blends them into metaballs (smooth union), adds noise for a droplet texture, and places spheres along the mouse trail for stretchy motion. This is the closest available recipe for "SDF pill + cursor gravity" — [Codrops](https://tympanus.net/codrops/2025/06/09/how-to-create-interactive-droplet-like-metaballs-with-three-js-and-glsl/); [Codrops metaballs tag](https://tympanus.net/codrops/tag/metaballs)
- **"Crafting a Dreamy Particle Effect with Three.js and GPGPU"** by Dominik Fojcik (Dec 19, 2024). It uses GPUComputationRenderer to store particle positions and velocities in textures, with a velocity shader and mouse interactivity. Particles are sampled from a mesh surface — [Codrops](https://tympanus.net/codrops/2024/12/19/crafting-a-dreamy-particle-effect-with-three-js-and-gpgpu/)
- **"Interactive Particles with Three.js"** by Bruno Imbrizi (OLDER, 2019). It builds particles from image pixels with instanced geometry and a shader that samples the image. This is the base technique for a particle portrait. Repo: designagencyuk/interactive-particles — [GitHub](https://github.com/designagencyuk/interactive-particles); [mirror summary](https://multizone.cz/devfeed/interactive-particles-with-three-js-f2e87159.html)
- Suggested combination for the portrait: sample portrait pixels (Imbrizi) as target positions inside a GPGPU sim (Fojcik). No ready-made tutorial does this — [search synthesis of the two Codrops posts](https://tympanus.net/codrops/tag/gpgpu)
- Portfolio case studies on Codrops, 2025–2026: Stefan Vitasović 2025 (WebGL video grid, seamless transitions), Gianluca Gradogna '25, Merouane Bali "The Journey of Creating a 3D Portfolio" (React Context as the bridge between the WebGL scene and the DOM), Roman Jean-Elie (DOM-bounds-to-WebGL sync, MorphSVG), Arnaud Rocca (GSAP + OGL fluid WebGL, Mar 2026), and "Sketching the Impossible: A 3D Portfolio Built Without a Single 3D Model" (Jun 2026) — [Codrops case-study tag](https://tympanus.net/codrops/tag/case-study/page/6/); [Vitasović](https://tympanus.net/codrops/2025/03/05/case-study-stefan-vitasovic-portfolio-2025/); [Bali](https://tympanus.net/codrops/2025/01/21/the-journey-of-creating-a-3d-portfolio/); [Jean-Elie](https://tympanus.net/codrops/2025/11/27/letting-the-creative-process-shape-a-webgl-portfolio/); [Rocca](https://tympanus.net/codrops/2026/03/31/arnaud-roccas-portfolio-from-a-gsap-powered-motion-system-to-fluid-webgl/); [Sketching the Impossible](https://tympanus.net/codrops/2026/06/11/sketching-the-impossible-a-3d-portfolio-built-without-a-single-3d-model/)
- Codrops 2025 year-in-review roundup (lists further 2025 portfolio case studies, e.g., Eduard Bodak and Daiki Fujita) — [Codrops](https://tympanus.net/codrops/2025/12/29/2025-a-very-special-year-in-review/)
- Non-Codrops: a GitHub project combines particle physics with metaball rendering in WebGL — [BricksAndPieces/WebGL-Fluid-Simulation](https://github.com/BricksAndPieces/WebGL-Fluid-Simulation)

### Inferences
- The concept's tech stack can be assembled almost entirely from documented techniques:
  - fullscreen-quad raymarched SDF capsule (the pill) with smooth-min blending (Kojima)
  - DOM-rect targets for each section (Jean-Elie)
  - GPGPU particle sim seeded from portrait pixels (Fojcik + Imbrizi)
  - optionally OGL for a lighter bundle (Rocca)
- What makes it feel novel is the integration: one persistent SDF object that is the navigation, the layout, and the portrait.

### Gaps
- I could not read the full Codrops articles (403), so specific shader code, performance numbers, and demo URLs inside them are unconfirmed.
- I found no Codrops tutorial specifically on SDF morphing between rounded rectangles (pill to card shapes). The rounded-box SDF is standard (Inigo Quilez's distance functions), but I did not fetch a source for it in this pass.

## What made jurors/commentators praise them?

### Takeaway
The praise centers on restraint and integration: immersive GPU work that stays easy to navigate, motion that "never blocks reading", and performance that holds up on frame-by-frame inspection and on phones.

### Cited Findings
- Igloo Inc jury: an immersive 3D experience with "easy to navigate, scroll interaction" — [Awwwards SOTY 2024](https://www.awwwards.com/annual-awards-2024/site-of-the-year)
- Lusion v3 jury: the clean interface blends with "over-the-top animations" — [Awwwards SOTY 2023](https://awwwards.com/annual-awards-2023/site-of-the-year)
- Juror Hon Tran (2026):
  - By-Kin is a "masterclass in restraint"
  - Iventions is "the clearest example" of WebGL used for atmosphere rather than spectacle
  - Mat Voyce's kinetic type "never blocks reading"
  - Minh Pham shows WebGL "can stay tasteful"
  - The Developer Award signals that motion survives frame-by-frame inspection

  — [Hon Tran](https://www.hontran.dev/blog/best-award-winning-websites-2026)
- Awwwards Developer Award: SOTD sites re-scored by a developer jury, with a threshold reportedly above 7 (secondary source, unverified) — [SandroHub013 awwwards-skill](https://github.com/SandroHub013/awwwards-skill/blob/main/SKILL.md)
- Strong WebGL work uses real-time 3D "with restraint rather than spectacle" — [Utsubo](https://www.utsubo.com/blog/best-threejs-websites-2026) (a studio blog with a commercial interest)
- Engineering signals that get noticed: custom tooling (Igloo's volume data exporter and fluid sim — [Awwwards case study](https://awwwards.com/igloo-inc-case-study.html)), budgeted scene graphs and dual WebGPU/WebGL backends (IVRESS — [Utsubo](https://www.utsubo.com/blog/best-threejs-websites-2026)), and open-source code (Bruno Simon — [CreativeDevJobs](https://www.creativedevjobs.com/blog/best-threejs-portfolio-examples-2025))

### Inferences
- A published making-of (Codrops-style case study, a GitHub repo, or a WebGPU/WebGL2 fallback write-up) is part of how developer portfolios earn technical credibility, not just the site itself.

### Gaps
- I did not obtain full jury-comment pages for individual 2025–2026 portfolio SOTDs.

## What common criticisms exist (too slow, confusing navigation, content hidden behind animation)?

### Takeaway
The documented pitfalls are scrolljacking disorientation, low frame rates on mid-range Android, heavy payloads and slow first paint, missing reduced-motion support, and content hidden behind exploration. Roundups of WebGL portfolios rarely publish site-specific criticism, which is itself a gap.

### Cited Findings
- NN/g usability testing found that scrolljacking threatens "user control and freedom, discoverability, attention, efficiency, and task success". All participants were disoriented on a fully scrolljacked page (Crypto.com). Task-oriented users had less patience than explorers. The worst case was altered scroll rate combined with required reading. Scrolljacking was best tolerated for progressive disclosure, and when few scroll interactions were needed to see change — [NN/g Scrolljacking 101](https://www.nngroup.com/articles/scrolljacking-101/)
- Accessibility: people with vestibular disorders, motor differences, or keyboard-only navigation can be blocked if motion isn't optional (secondary source) — [WebDesignerDepot](https://webdesignerdepot.com/how-scrolljacking-breaks-ux-fundamentals/)
- Juror: a 3D hero that drops to 18 fps on a mid-range Android, or a 9 MB page that takes six seconds to paint, "would not win". Accessibility is often ignored, and winners include a reduced-motion fallback — [Hon Tran](https://www.hontran.dev/blog/best-award-winning-websites-2026)
- Most award submissions fail on usability rather than creativity (vendor blog; the claimed usability score weight is not verified against Awwwards) — [Utsubo judging guide](https://www.utsubo.com/blog/award-winning-website-design-guide)
- Overuse of heavy effects kills performance and annoys users (secondary sources) — [Web Design Awards WebGL](https://www.webdesignawards.io/technology/webgl); [Lovable guide](https://lovable.dev/guides/best-interactive-websites)
- Mitigation patterns from praised sites:
  - Weisdevice: raycasting at 30 FPS, render loop paused on project pages, lazy loading — [CreativeDevJobs](https://www.creativedevjobs.com/blog/best-threejs-portfolio-examples-2025)
  - Jordan Breton: fixed camera viewpoints — [CreativeDevJobs](https://www.creativedevjobs.com/blog/best-threejs-portfolio-examples-2025)
  - Igloo Inc: plain scroll navigation — [Awwwards](https://www.awwwards.com/annual-awards-2024/site-of-the-year)

### Inferences (pitfalls specific to the pill concept)
- **Fragment cost:** a raymarched SDF across the full viewport is expensive. Render only the pill's bounding rectangle, or use a reduced-resolution buffer. Pause the loop when the pill is idle.
- **Text inside the pill:** if text lives in the pill, it must be real DOM text (selectable and readable by screen readers) positioned over the SDF. Rendering text in the shader would hide content from screen readers and search engines.
- **Cursor gravity:** this needs a touch fallback and must be disabled under `prefers-reduced-motion`.
- **Particle portrait:** it needs a skip path, and should not gate access to content. That avoids the "content hidden behind animation" complaint.
- **Section morphs:** these should be quick and interruptible, following NN/g's finding that few interactions per change is better tolerated.

### Gaps
- I found no published, site-specific performance complaints (e.g., Lighthouse audits or Reddit threads) about Lusion, Igloo, or Bruno Simon in this pass.
- Examples of portfolios praised for being both wild and usable rest mainly on jury quotes (Igloo Inc, Lusion v3) and one juror's roundup (Minh Pham, Mat Voyce, By-Kin). There is no independent usability testing of these sites.

## Are there any existing sites built around an Apple Dynamic Island / pill metaphor?

### Takeaway
Dynamic Island navigation is already a commodity UI pattern: Framer components, a Framer portfolio template, React and shadcn components, and a Dribbble personal-site concept. All are DOM/spring-animation pills used as nav bars. Separately, Apple Liquid Glass (2025) triggered WebGL/SDF recreations with shape merging. I found no award-winning portfolio where the whole site is a GPU SDF/metaball pill. The concept should differentiate on three things: the pill is the entire site (not a nav bar), it is a true SDF liquid with cursor gravity, and it carries the particle-portrait identity moment.

### Cited Findings
- Framer "Dynamic Island Nav": a floating navbar with a spring-driven pill that glides between links, with keyboard navigation and reduced-motion support — [Framer](https://www.framer.com/marketplace/components/dynamic-island-nav/)
- Framer "Dynamic Island bar": physics-driven springs, expands, collapses and reshapes — [Framer](https://www.framer.com/marketplace/components/dynamic-island-bar/); Framer "Dynamic Nav": idle, hover and expanded states, aimed at portfolios — [Framer](https://www.framer.com/marketplace/components/dynamic-nav/); Mac-style Dynamic Island navbar — [Framer](https://www.framer.com/marketplace/components/dynamic-navbar/); NavBar Scroll Pill — [Framer](https://www.framer.com/marketplace/components/navbar-scroll-pill/)
- "Folioos" Framer portfolio template with an interactive Dynamic Island whose label updates per section — [Framer](https://www.framer.com/marketplace/templates/folioos/)
- Dribbble "Portfolio 3.0": a personal-site menu "heavily inspired by Apple's Dynamic Island", used as a mega-menu and shopping cart — [Dribbble](https://www.dribbble.com/shots/20070698-Portfolio-3-0)
- Code components:
  - lucas-dash/dynamic-island (Next.js, Tailwind, shadcn, framer-motion) — [ecosyste.ms](https://awesome.ecosyste.ms/projects/github.com%2Flucas-dash%2Fdynamic-island)
  - Aceternity Dynamic Island status pill — [Aceternity](https://ui.aceternity.com/blocks/illustrations/dynamic-island)
  - 21st.dev Dynamic Island — [21st.dev](https://21st.dev/@educalvolpz/components/dynamic-island.md)
- SDF/metaball UI pieces already exist as components: a 21st.dev SDF metaballs component — [21st.dev](https://21st.dev/@dhileepkumargm/components/metaballs.md); Framer "Liquid Mask Cursor" — [Framer](https://www.framer.com/marketplace/components/liquid-mask-cursor/)
- Liquid Glass recreations:
  - Liquid Glass Studio (iyinchao) uses WebGL2/WebGPU with refraction, dispersion and "shape-merging effects via custom shaders and SDF-defined shapes" — [builtatlightspeed](https://www.builtatlightspeed.com/theme/iyinchao-liquid-glass-studio)
  - liquidGL (beta) — [GitHub](https://github.com/AnimatedCoding/Pages)
  - LiquidGlass (2026 Product Hunt) — [hunted.space](https://hunted.space/product/liquidglass)

### Inferences
- Because Dynamic Island nav pills and Liquid Glass SDF blobs are both widespread, "a pill" alone will not read as novel. Differentiators:
  - The pill is the only UI surface, and its morphs replace page layout.
  - It is black, with a matte or opaque metaball look, deliberately not glassy refraction. That avoids looking like a Liquid Glass clone.
  - Cursor gravity is physically modeled.
  - The SDF-to-particles dissolve into a portrait is the signature moment.
- The Framer component's keyboard and reduced-motion support sets a baseline. The WebGL version should at least match it.

### Gaps
- Searches did not surface any Awwwards/FWA-awarded site centered on the Dynamic Island metaphor. Absence from search results is not proof that none exists. An Awwwards site search for "dynamic island" was not performed directly.
