# Sahaj Alatage — portfolio

One black island. Everything grows out of it, and everything returns to it.

The site is built around a GPU-rendered **Dynamic Island** — a sibling of [FLOAT](https://github.com/Sahaj1207/FLOAT), the Dynamic Island I built for Windows. It morphs into every chapter of the page, leans toward your cursor like liquid, and halfway down dissolves into tens of thousands of glyphs taken **from this repository's own source code**, which assemble into my portrait and collapse back.

## How it works

| Piece | Approach |
|---|---|
| Content | Next.js 16 App Router, statically generated. Every word is real HTML that works with JavaScript off. |
| Island motion | Semi-implicit Euler springs (`src/lib/spring.ts`), interruptible and velocity-preserving; one rAF loop that sleeps at rest. |
| Liquid island | WebGL2 fragment shader (`src/lib/islandGL.ts`): superellipse rounded boxes merged with Inigo Quilez's normalized quadratic smooth minimum, a lagging "ghost" shape for liquid transitions, a squircle bezel for the glossy material. |
| Cursor physics | A gooey nub, a domain warp toward the pointer, squash-and-stretch and click ripples — all from spring values, never DOM reads. |
| Code-token portrait | `tools/particles/build_particles.py` tokenizes `src/**`, rasterizes the tokens into an SDF atlas and importance-samples the portrait into 40,000 targets. `src/lib/particlesGL.ts` draws them as instanced quads whose path is a pure function of scroll, so scrolling back rewinds exactly. |
| Fallbacks | **Plain view** (navy + serif, CSS island, real photo) is automatic for reduced motion, Save-Data, no WebGL2 or a lost context, and available to anyone from the footer. A **Pause motion** control stops everything that animates on its own. |

Design research, the build plan and reference notes are in [`docs/`](docs/).

## Develop

```bash
npm install
npm run dev
```

After changing source code, regenerate the portrait so it stays made of the current code (needs Python with Pillow, NumPy and OpenCV, and the Cascadia Mono font):

```bash
npm run particles
```

## License

Code is MIT. The portrait photo and personal content are © Sahaj Alatage and not licensed for reuse.
