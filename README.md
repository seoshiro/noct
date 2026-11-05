# NOCT — Crown / scroll preview

**Current evaluation preview:** https://seoshiro.github.io/noct-crown-preview/

**Current recordings, closeups and three note states:** https://seoshiro.github.io/noct-crown-preview/review/

This branch, `noct-crown-scroll-preview`, replaces hand-operated actions with one reversible native-scroll story: a restrained turn, crown clearance, atomizer press, one deterministic cloud, geranium, tonka bean and sandalwood, then selection. It uses one Three.js scene. EN/RU, sizes, persistent cart, quantities and the three-distinct-sample set are preserved. Reduced motion and WebGL fallback retain sequential notes and shopping. The previous Kling film opens only on request as an archive.

The required source model came from one Higgsfield Tripo H3.1 job, then was repaired and optimized in Blender. [Original GLB](art/crown/tripo-original.glb), [editable Blender file](art/crown/noct-crown.blend), [runtime GLB](public/models/noct-crown.glb), [full report and costs](docs/crown/RESULT.md). Total authorized spend **49.5 / 120**, remaining **70.5 credits**. No purchases.

Local URL: `http://127.0.0.1:5190/noct-crown-preview/`. `npm run build`, `npm run test:cart`, `npm test`, `npm run audit:touch`, `npm run record:3d`. Set `NOCT_CROWN_URL` for a deployment. Inspection routes: `?studio=1&view=front`, `view=quarter`, `view=crown`; fallback: `?static=1`.

Production and the following earlier preview are preserved. The new preview has its own [deployment repository](https://github.com/seoshiro/noct-crown-preview). Production replacement requires user evaluation.

## Archived first 3D preview

**Evaluation preview:** https://seoshiro.github.io/noct-3d-preview/

**Full recordings:** https://seoshiro.github.io/noct-3d-preview/review/ — desktop 29 s, mobile touch emulation 28 s. Both public MP4 files were checked for playback and resource errors.

This branch adds one persistent Three.js bottle made from a single Higgsfield Tripo generation, cleaned in Blender. Rotate it, lift its stone cap, press the actual atomizer or use the HTML controls, open ingredients, choose a fragrance/size, and build a demo bag or discovery set. EN/RU, native touch scrolling, keyboard access, reduced motion and a usable WebGL fallback are included.

Production below is preserved at tag `noct-production-v1-a1cb0bb`. This branch does not deploy over production. The preview build is hosted in a separate repository. Explicit user review and consent are required before any production replacement.

See [3D source, costs and measured verification](docs/3d/RESULT.md). Original generation: `art/tripo/noct-tripo-original.glb`; editable scene: `art/blender/noct-bottle.blend`; runtime: `public/models/noct-bottle.glb`. Eight scenario tests: `npm test`; native touch/layout audit: `npm run audit:touch`. Set `NOCT_3D_URL` to test another deployed preview.

## Preserved production concept

An independent fictional niche fragrance concept by **Beybars Ileskhan**. Original art direction, bottle concept and motion-led shopping experience.

**Live:** https://seoshiro.github.io/noct/

React + TypeScript + Vite. GSAP drives restrained reveals, glass parallax and interruptible panel transitions. Native scrolling and native modal dialogs keep navigation predictable. EN/RU, persistent cart, three fragrance states, sizes, quantity controls and a three-distinct-sample discovery ritual. Checkout is explicitly a demo and collects no personal or payment data.

## Run

```
npm ci --ignore-scripts
npm run dev
npm run build
node --test tests/cart.test.ts
npm test
```

See [art direction](docs/ART-DIRECTION.md), [generation and cost ledger](docs/GENERATIONS.md), [verification](docs/VERIFICATION.md) and [screenshots/recording](evidence/README.md).

Built-in image generation produced the original bottle master and sensory still life. One Higgsfield **Kling 4.0** film is actually used in the hero. All three fragrance presentations retain the same master vessel, with distinct lighting treatments and notes; these are conceptual fragrances, with no certifications or real sales claims.

The main portfolio repository and navigation were not changed.

