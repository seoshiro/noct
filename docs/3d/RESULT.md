# Interactive NOCT study

This is an evaluation preview. Production at https://seoshiro.github.io/noct/ is preserved at `a1cb0bb28c1d5cec4f95129850a157d7d41d23e3`, with remote rollback tag `noct-production-v1-a1cb0bb`. Source work is on `noct-3d-preview`; the preview is hosted by the separate repository https://github.com/seoshiro/noct-3d-preview. No promotion to production is authorized until explicit user evaluation and consent.

## Source and cost

One Higgsfield **Tripo H3.1 Image to 3D** generation, model ID `tripo_h3_1_image_to_3d`. Existing NOCT bottle reference: `public/media/ember.webp`. No alternative handmade source bottle and no duplicate generation.

Job: `e34f26e7-1efb-4c58-a8a8-ca22551ca709`; imported reference ID: `107a9cbf-9cab-47a6-b35a-4f186015626b`. The exact parameters and preflight quote are in [tripo-preflight.json](tripo-preflight.json). No textual geometry prompt was sent: this image-driven model uses the reference.

Preflight: **12 credits**. Balance before: **584.5**. Balance after, rechecked after completion: **572.5**. Debit: **12**. Previous documented total: **25.5** (6 lotus Tripo + 19.5 original NOCT Kling). New cumulative total: **37.5 / 120**, remaining authorized budget: **82.5**. This work launched one paid job, now completed; it launched no other reserved or running generation. No purchase, subscription or top-up.

The existing original Kling film remains available only after the visitor presses Watch the film; its cost is already included above. The Three.js scene pauses while its dialog is open. It is not used as a substitute for interactive 3D.

## Model work

- Untouched generation: [original GLB](../../art/tripo/noct-tripo-original.glb), 1,135,460 bytes. Its one mesh had 21,594 vertices / 36,914 faces, including a false ground reflection, a baked fill-line ridge and uneven side geometry.
- Edited source: [Blender scene](../../art/blender/noct-bottle.blend). The original mesh is also preserved in the hidden `TRIPO_SOURCE_UNTOUCHED` collection. Scripts in `scripts/blender/` reproduce the cleanup from the saved generation.
- The generated body/cap vertex envelopes are filtered, symmetrized, remeshed and smoothed. The reflection flap and fill-line relief are removed. This is substantial retopology of the generated shape. A scaled interior is subtracted from that shape; the bottom stays thick. A neck passage, closed liquid volume and cap recess are prepared locally. Collar, dip tube, pump head and nozzle are authored in Blender for animation.
- Runtime: [optimized GLB](../../public/models/noct-bottle.glb), **940,728 bytes**, **40,934 triangles**, nine named parts. Body, cap and liquid have no boundary or nonmanifold edges. The decorative text has open outlines; it is not a vessel surface. The cap roof clears the pump by 0.08 model units. Details: [asset-audit.json](asset-audit.json).
- Inspect views in `evidence/3d/`: raw and edited front/side/back, plus uncapped. Raw camera names refer to unaligned source axes; `raw-side.png` is the broad face. Edited views use conventional aligned bottle axes.

The Blender source uses physical transmission materials. The browser uses a transparent thick shell with a Fresnel opacity shader and physical specular lighting, plus a shaded closed liquid mesh. This is an intentional real-time approximation, not path-traced refraction or simulated fluid. Shape and parts remain real 3D from every angle. A fixed pool of 48 particles is reused for each brief spray.

## Interaction and verification

The same scene and loaded asset span introduction, opening, selection and samples. Scroll placement and user rotation use separate transform groups. HTML controls and the touch hit area follow the projected live mesh bounds; only the nearest section owns them, and inactive duplicates are inert. Current yaw, cap, scent and selection survive panels, language switches and scroll returns. Desktop cap and pump mesh picking were exercised directly. HTML actions duplicate the ritual, and notes/cart never require completing it.

Eight browser scenario tests pass: actual mesh ritual and focus return; drag/inertia/reset and rapid interruptions; sizes/cart/quantity/language/refresh/demo checkout; all scents and three different samples; reduced motion/static fallback; context loss and film pause; keyboard rotation/rapid scroll returns and a settled idle loop; HTML controls following the bottle between sections. Six domain tests validate malformed storage, merging, totals, removal, quantity limits and unique sample sets. `scripts/3d-mobile-audit.mjs` separately exercises native CDP touch gestures and ten EN/RU layouts from 320 to 1920 px. No horizontal overflow, replacement characters or browser page errors were found.

Recordings are real Chrome captures, with only a pointer indicator added by the recording harness. They include rotation, opening, spraying, ingredient panel and return, volume/cart quantity, scent changes, discovery set, honest demo checkout and return to the bottle. Native mobile gestures are captured in the mobile recording. Evidence is in `evidence/3d/`.

### Measured conditions

Windows laptop, AMD Ryzen 5 7535HS, Chrome **156.0.8078.76** headless, ANGLE Direct3D11 **AMD Radeon(TM) Graphics**. The discrete RTX 4050 was present but not used by the measured browser. No CPU/network throttling. GLB and shaders warmed before the drag segment. The mobile run is 390×844 touch/viewport emulation on the same laptop at device scale 2, with renderer DPR capped at 1.25; it is **not a physical-phone benchmark**.

| Run | Samples during movement | Median frame interval | p95 | Maximum | Frames over 33.34 ms | p95 CPU render submission |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Desktop 1440×1000, DPR 1 | 1021 | 7.0 ms | 14.1 ms | 41.7 ms | 1 | 1.1 ms |
| Mobile emulation 390×844 | 1069 | 7.0 ms | 7.1 ms | 34.9 ms | 1 | 0.6 ms |

These are requestAnimationFrame intervals during a continuous interaction, not a claim about physical screen presentation or GPU execution time. The submission measure is CPU time around `renderer.render`. Raw samples, draw calls (10) and submitted triangles (40,936, including the glow plane) are preserved in [performance.json](../../evidence/3d/performance.json). Idle scenes stop requesting frames; hidden pages and film playback stop the heavy loop.

Remaining limits: physical iOS/Android devices and Safari have not been tested here. Transparent real-time glass can differ across GPUs. No fluid dynamics or payment/order backend is claimed. A poster fallback keeps details, selection, sample set and cart usable after unavailable/lost WebGL. Production is deliberately unchanged pending review.

## Public delivery check

Live preview: https://seoshiro.github.io/noct-3d-preview/. Review videos: https://seoshiro.github.io/noct-3d-preview/review/. The eight scenario tests and ten touch/EN/RU layout checks were repeated against the public URL. Public GLB is HTTP 200 with exactly 940,728 bytes and a SHA256 matching the local runtime asset. No failed resources, page errors or broken fragment links were found. The film is 1920×1080 / 6.041667 s, begins only after the visitor's action, and scene frame count stays unchanged during playback. `evidence/3d/public-audit.json` preserves the observed values. Recordings and the table above are from the final public build, not a screenshot or a simulated animation.

