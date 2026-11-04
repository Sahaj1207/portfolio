# Sahaj Alatage — Portfolio Blueprint

> One black island. Everything grows out of it, and everything returns to it.

Source research: [`docs/research/Dynamic Island portfolio research.md`](research/Dynamic%20Island%20portfolio%20research.md) (notes in `docs/research/notes/`).

---

## 1. The idea

The whole site is a single black **Dynamic Island** — a sibling of FLOAT, the Dynamic Island Sahaj built for Windows. It is drawn by a GPU shader as a liquid shape that morphs into each section: the name, project cards, a timeline, a terminal. It leans toward the cursor like mercury.

Halfway down the page, the island **dissolves into tens of thousands of glyphs taken from the site's own source code**, which fly together into Sahaj's portrait, hold, then collapse back into the pill. The portrait is literally assembled from the code that renders it.

Two non-negotiables keep it hireable:

1. **HTML first.** Name, role, flagship projects, resume, GitHub and email are readable in the first second, before any WebGL loads. The canvas only decorates real, accessible HTML.
2. **Plain view is a designed theme, not an error state.** The navy + serif look ships as the fallback for reduced motion, Save-Data, weak GPUs, failed WebGL, and anyone who toggles it.

---

## 2. Design principles (Apple-informed)

Borrowed principles, not Apple's look. No SF Pro, no Apple imagery or branding.

| Principle | Where it shows up |
|---|---|
| **Fluid, physical motion** — springs, not timed curves; every animation interruptible and velocity-preserving (WWDC 2018 *Designing Fluid Interfaces*) | Island morphs and cursor gravity use semi-implicit springs, damping ratio ζ ≈ 0.6–0.75 (ζ = 1 under reduced motion) |
| **Continuous corners** (squircles) | The SDF draws superellipse-style corners; CSS fallback uses `corner-shape: squircle` where supported |
| **One idea per screen** — huge headline, one line of support, generous whitespace | Every chapter: e.g. *"FLOAT. The Dynamic Island, now on Windows."* |
| **Scroll-scrubbed storytelling with sticky chapters** | Headline pins while the island transforms beneath it; scrolling back rewinds exactly |
| **Highlight tiles (bento) with one bold fact each** | Project stats: *1,026 tests*, *8 languages*, *≈ $0.35 per book* |
| **Clarity, deference, depth** — content leads, effects support | Near-black canvas, one accent ramp (violet `#7c5cff` → cyan `#00d4ff`) appearing only where liquid merges |
| **Tactile micro-interactions** | 0.96× press squash, hover lift, visible progress — never a blank wait |

What we deliberately avoid: refractive **Liquid Glass** everywhere (now a cliché, and invisible on black anyway). The island is opaque, glossy black.

---

## 3. Site map

```
/                 Home — the island journey (single page, chapters below)
/work/float       Case study
/work/pie         Case study
/work/verity      Case study
/work/mothertongue-books   Case study
/work/harika      Case study
/resume.pdf       Stable resume link
```

### Home chapters (island state in brackets)

1. **Hero** [single capsule → expands into name]
   *Sahaj Alatage — software engineer.* One-line positioning, Resume · GitHub · Email visible immediately.
2. **Selected work** [capsule buds into 3–5 cards]
   FLOAT, PIE lead (strongest systems signals), then VERITY, MotherTongue Books, HARIKA.
3. **FLOAT chapter** [island re-enacts FLOAT's real states: compact pill → media → notification banner → orb]
   A live demo of FLOAT, performed by the site itself.
4. **The portrait** [island dissolves → code-token particles → portrait → collapse]
   Mid-page reward, never an intro gate. Skippable; preference remembered.
5. **Timeline** [thin bar with beaded nodes]
   Hackathons, launches, milestones.
6. **Terminal / about** [large rounded box with a title-bar groove]
   The `whoami` terminal from the GitHub profile, in long form.
7. **Contact** [collapses back to the capsule]

"Also built" strip for web projects (Meridian Hospital, Aurelis Estates, ReconIQ, ResumePilot AI).

### Case-study template

Problem → constraints → architecture (diagram) → 2–3 hard decisions with trade-offs → metrics → my role → demo video → links (repo, release, live).

---

## 4. Architecture

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 16 App Router, static generation** | SEO for case studies; one persistent canvas in `app/layout.tsx` survives route changes |
| Island renderer | **Raw WebGL2, one full-viewport quad, ≤ 8 rounded boxes** merged with IQ's normalized quadratic `smin` | ~1/60th the cost of raymarching; a few KB; sleeps when springs settle |
| DOM ↔ shader sync | Invisible **slot elements** laid out by CSS; shader springs toward their cached rects | Text stays real HTML; layout drives the liquid |
| Particles | **`three/webgpu` + TSL**, lazy-loaded near the section; WebGL2 fallback via transform feedback | One codebase for both backends; analytic path = exact scroll reversal |
| Glyph source | **Build plugin** tokenizes `src/**` → MSDF atlas + JSON UVs; portrait sampled at build time (alpha × luminance, blue-noise) | The portrait really is made of the repo's code |
| Scroll | **Lenis** (native scroll, smoothed) + **GSAP ScrollTrigger**, one shared ticker; progress in a mutable store, never React state | Anchors, find-in-page, keyboard scroll keep working; protects INP |
| Fallback | **CSS spring pill** with identical states and URLs | Plain view; context-loss recovery |
| Hosting | **Vercel** + Speed Insights | Field Core Web Vitals |

### Budgets

| | Target |
|---|---|
| LCP / INP / CLS (p75) | ≤ 2.5 s / ≤ 200 ms / ≤ 0.1 |
| Initial JS (gzip) | ≈ 120–170 KB, no three.js |
| Particle chunk + data | ≈ 250–300 KB JS + atlas + buffer, lazy |
| Particles | ~40k high · 20–25k mid · 8–12k phone · static/video at tier 0 |
| Frame | ≤ 16.7 ms; island ≤ 1 ms GPU on an integrated laptop |

---

## 5. Build phases

Every phase ends deployable.

| # | Phase | Exit criterion |
|---|---|---|
| 1 | **Content + plain view** — SSG site in navy/serif, hero, case studies, resume, OG images, analytics | Lighthouse mobile ≥ 90; fully readable with JS off |
| 2 | **CSS island** — spring DOM pill morphing via slot elements | Keyboard + reduced-motion parity |
| 3 | **SDF island** — WebGL2 shader, glossy black material, violet-cyan seams, shared ticker | ≤ 1 ms GPU on integrated laptop; no layout thrash |
| 4 | **Cursor physics** — attractor nub, domain warp, velocity stretch, ripples, touch equivalents | Feels right on trackpad, mouse and phone |
| 5 | **Token pipeline** — tokenizer, MSDF atlas, portrait sampler | Deterministic artifacts < ~1.5 MB |
| 6 | **Particle moment** — TSL scene, pixel-exact pill hand-off, tiered counts | Passes `forceWebGL: true`, mid Android, Safari |
| 7 | **Hardening + launch** — context loss, pause toggle, making-of post, public repo, custom domain | Field p75 LCP ≤ 2.5 s, INP ≤ 200 ms |

Phases 1–3 alone already make a distinctive, hireable site.

---

## 6. Content needed from Sahaj

- [ ] Resume PDF
- [ ] Contact email to show publicly
- [ ] FLOAT: RAM/CPU footprint, binary size, startup time, any download/user counts; 30–90 s screen recording
- [ ] PIE: screen recording on a phone; any performance numbers beyond the 1,026 tests
- [ ] VERITY: how accuracy was evaluated (the 96-case benchmark results), real vs synthetic data
- [ ] MotherTongue Books: team size, your role/which agents you built, placement (if any), Devpost link
- [ ] HARIKA: what exists today — agent shell vs full OS — and a short demo
- [ ] Custom domain (optional), e.g. `sahaj.dev`

---

## 7. Assets already here

| Path | What |
|---|---|
| `assets/source/portrait-original.webp` | Original photo |
| `assets/source/crop.png`, `matte.png` | Head-and-shoulders crop + precise GrabCut matte (neck fixed) |
| `tools/portrait/mask.py`, `carve.py` | Hand-traced outline + GrabCut refinement that produced the matte |
