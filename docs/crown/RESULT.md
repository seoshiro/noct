# NOCT — Crown / scroll preview

Preview: https://seoshiro.github.io/noct-crown-preview/

Visual evidence and uncut recordings: https://seoshiro.github.io/noct-crown-preview/review/

Source: https://github.com/seoshiro/noct/tree/noct-crown-scroll-preview . Separate host: https://github.com/seoshiro/noct-crown-preview . Production source remains `a1cb0bb28c1d5cec4f95129850a157d7d41d23e3`; previous preview host remains `7364ec89a0049e15a4fcebaa3b3a71050095b223`. Rollback tag `noct-before-crown-c6fa82d` points to the previous 3D source. The portfolio and its navigation are unchanged. Production replacement awaits user evaluation.

## Object and provenance

The complete revised 185-line brief was read before work. The exact official [Scandal Pour Homme Le Parfum Eau de Parfum Intense](https://www.jeanpaulgaultier.com/ww/en/p/range-scandal-pour-homme/scandal-pour-homme-le-parfum-eau-de-parfum-intense-000000000065182477) photographs were studied, not Absolu or Le Male. Official images are reference only and absent from the experience. NOCT has its own foil wordmark, a six-upright open crown with a crescent, a broad beveled black vessel and grey studio lighting.

One built-in image generation made `public/media/noct-crown-reference.png`, used for exactly one required **Tripo H3.1 image-to-3D** generation through Higgsfield. Job `50803787-b7cd-423e-b96b-d4604011f754`, quoted and debited **12 credits**, status rechecked **completed**, no duplicate. Parameters and source URLs: `tripo-preflight.json`, `tripo-submission.json`, `tripo-result.json`.

The untouched 2,738,392-byte GLB is `art/crown/tripo-original.glb`. Four-side inspection found excessive depth, broken lettering, softened crown detail and a missing crescent. The editable `art/crown/noct-crown.blend` retains the original in a hidden source collection. The body was retopologized from measured Tripo cross sections, with corrected depth, planar lacquer faces, bevels and normals. Defective crown detail was rebuilt in Blender as solid curved ribbons, finials, turned bands, 96 knurls and the original crescent. This is documented local reconstruction after the required generation. Collar, head, hole, cap and spray origin remain separate. The nozzle axis and position determine the spray.

Runtime `public/models/noct-crown.glb`: **1,217,420 bytes / 47,251 mesh triangles**. Twenty-one static gold pieces were merged for runtime; the Blender file keeps them separate. Normal rendering uses 11 calls; pose changes additionally refresh shadow passes. Small foil subtext was flattened to avoid unnecessary geometry. SHA-256 and byte manifests are in `assets.json`; geometry details in `model-edit.json` and `optimized-model.json`.

Front, three-quarter and crown macro browser renders were inspected before story animation. Hard shadows, dim foil, cropped macro and mobile caption overlap were corrected locally. Product cutouts are rendered from the final live model, preserving the exact geometry for loading/fallback and collection. A second built-in generation produced one transparent ingredient master; all three ingredients were cropped and optimized together. Both built-in image calls cost **0 Higgsfield credits**. Prompts are saved. The image tool returned no stable generation identifier; none is invented.

## One reversible story

`timeline.ts` supplies one progress for pose, camera, crown clearance/travel, head press, cloud and notes. The turn is approximately 20 degrees. The crown clears vertically before travelling sideways and reverses that order when closing. The head presses only after clearance. One directional spray starts at the actual opening and spreads to the free side. A fixed seeded buffer holds 1,100 particles on desktop / 650 on mobile plus three stable ellipsoidal anchor drops. Emitters and objects do not accumulate.

Geranium, tonka and sandalwood are emphasized one at a time. Each SVG path starts at the projected actual drop; the line precedes the ingredient and HTML caption. Text is stable through the reading interval. Reversal reproduces the same trajectories. There is no independent time-based simulation. At the purchase transition the object returns and the cloud disappears. Native scrolling is retained, with no competing free rotation or wheel hijacking.

GSAP drives initial appearance, interruptible current-value drawer transitions and ScrollTrigger progress. The lazy Three.js chunk is about **158 KB gzip**, initial JS about **127 KB gzip**, CSS **5.2 KB gzip**. Poster and navigation appear before the model. Load failure/context loss activates the static journey. Reduced motion uses sequential notes. Offscreen, hidden and modal scenes stop rendering; stopped scroll settles and sleeps. Shadows update only on pose changes. DPR is capped at 1.6 desktop / 1.25 mobile. No video is scroll-scrubbed or run concurrently with 3D.

The archive Kling film retains 1920×1080 resolution and opens only by explicit action while the scene is paused. Its earlier amber-glass design is clearly labelled archive. It does not replace the new scene.

## Shopping and access

EMBER's story and collection agree on geranium / tonka / sandalwood. RAIN and VEIL retain their own descriptions and notes, use views rendered from the same model and distinct green/mauve accents. Size, fragrance and bag survive panel openings; language/cart persist after reload. Shared tested cart functions handle arithmetic, quantities, last-unit removal and normalized saved data. A discovery set requires three distinct valid scents. Checkout explicitly says no order was placed, collects no payment details and sends no order.

HTML controls support keyboard focus, arrow-key tabs, a skip link, native modal focus trapping, Escape and focus return. Readable composition is available without targeting tiny drops. Vertical touch gestures scroll; horizontal gestures do not change progress. EN/RU captions and long headings were inspected at narrow and short sizes. There is no artificial loading gate.

## Verification and conditions

`npm run build` passed. The separate Three.js chunk triggers Vite's default 500 KB uncompressed advisory; it is lazy loaded and compressed size is above. **10 domain tests passed** for cart arithmetic, saved data, discovery and timeline clearance/determinism/single-note contracts. **6 browser scenarios passed on the public preview**, covering forward/reverse and actual anchor alignment, purchase/refresh/language, all scents and samples, interruptions/focus, reduced motion/context loss/fallback, and manual archive playback with paused scene.

Public layout checks covered EN/RU at **320×667, 390×844, 768×1024, 1440×900 and 1920×1080**. No crown clipping, callout collision or horizontal overflow. Native touch scrolling moved the document; horizontal swiping preserved position. The 320×667 static poster was resized and repositioned after identifying caption overlap. Reviewing the actual mobile recording also exposed an earlier release-caption overlap during bottle travel; its timing and responsive width were corrected, and **42 intermediate EN/RU states** at 320, 390 and 768 px were checked separately. The mobile recording was then replaced to reflect that specific fix. Reports are in `evidence/crown/browser-tests.json`, `layout-audit.json`, `transition-audit.json`, `story-review.json`, `still-render-audit.json`.

Performance: **Chrome 156.0.8078.76 headless on Windows, Ryzen 5 7535HS, integrated AMD Radeon via ANGLE D3D11**. The computer also has an RTX 4050, but WebGL reported the integrated GPU. Warm shaders, no CPU/network throttling, no simultaneous test or recording. Desktop 1440×1000, DPR 1. Mobile 390×844, emulated DPR 2, rendered 487×1055 with the DPR cap. Mobile is touch/viewport emulation on this computer, not a physical phone.

| Scenario | RAF samples | Median | p95 | Maximum | >33.4 ms |
| --- | ---: | ---: | ---: | ---: | ---: |
| Desktop wheel forward/reverse | 2,788 | 7.6 ms | 8.3 ms | 38.8 ms | 1 |
| Mobile touch forward/reverse | 3,600 (buffer cap) | 7.6 ms | 8.2 ms | 22.7 ms | 0 |

CPU render-submission p95 was 0.6 ms in both; this is not a GPU completion timer. Both ended with closed crown, empty cloud, one model load and unchanged frame count during idle. An initial Chrome synthetic touch-scroll command did not move this Windows browser; that invalid zero-sample mobile result was replaced only after ordinary touch events were confirmed to scroll. Raw intervals and conditions: `evidence/crown/performance.json`.

Recordings show the **public build**, uninterrupted forward/backward scroll followed by fragrance switches, 100 ml choice, quantity and demo checkout. Desktop uses native wheel synthesis; mobile repeated actual touch swipes including reverse. Capture is 25 fps, measured separately from performance above. Original WebMs remain locally under `evidence/crown/recordings/`; H.264 MP4s are on the review page. No speed change or montage inside the scenarios. Desktop is **39.36 s**, mobile **53.16 s**.

The final public delivery audit returned HTTP 200 for the app, review and all eight displayed evidence images; both local fonts loaded, both MP4s advanced during actual browser playback. Rapid opposing scroll commands returned to a closed crown, empty cloud, one canvas/model load and no open overlay. No page or resource errors. See `evidence/crown/delivery-audit.json` and `docs/crown/delivery.json` for published URLs, encoding and hashes.

## Cumulative credit ledger

| Operation | Credits |
| --- | ---: |
| Previously approved lotus Tripo | 6 |
| Original NOCT Kling | 19.5 |
| Previous NOCT Tripo | 12 |
| New crown Tripo H3.1, one job | 12 |
| Built-in reference and ingredient images | 0 Higgsfield credits |
| **Used / 120** | **49.5** |
| **Remaining** | **70.5** |

New-job balance moved 572.5 → 560.5 and was rechecked unchanged after completion. There were no further submissions by this work or uncertain paid operations. No purchases, top-ups or subscriptions. This is a cumulative budget, not an extra allocation.

## Limits

Physical iOS/Android, Safari and low-end GPUs are not verified. The mobile recording and timing are explicitly emulation. Mist is an art-directed deterministic particle field rather than a fluid solver. Real browser frames and recordings are provided for evaluation. User acceptance of this direction remains pending; production has not been replaced.
