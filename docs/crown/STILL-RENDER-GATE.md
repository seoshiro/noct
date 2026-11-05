# Static browser render before animation

One Tripo job `50803787-b7cd-423e-b96b-d4604011f754` completed. Quoted and debited 12 credits; balance 572.5 → 560.5. Cumulative 49.5 / 120, remaining 70.5. No duplicate was launched. Untouched GLB: `art/crown/tripo-original.glb`.

The generated mesh supplied the body silhouette and crown construction, but had thick depth, baked broken lettering, irregular edges and no crescent. In Blender, the body was retopologized from sampled generated cross sections, with depth corrected to the accepted image. Its lacquer faces and bevels are clean and planar. The crown's defective details were rebuilt as closed metal ribbons, six finials, turned bands, 96 knurls and an original crescent. This repair is explicitly allowed by the revised brief; no bad mesh is retained merely to claim provenance. The original generated object stays untouched in a hidden source collection.

`art/crown/noct-crown.blend` is editable. Runtime `public/models/noct-crown.glb` is 1,201,224 bytes / 50,620 triangles. Crown, body, collar and pump are separate. `Spray_Origin` is parented to the moving head at the physical nozzle opening and has its outward orientation, for the next stage.

Actual Chrome WebGL still renders were inspected at 1440×1000: `evidence/crown/browser-front.jpg`, `browser-quarter.jpg`, `browser-crown.jpg`. The front and three-quarter retain depth and long lacquer reflections. Gold uses metallic physical shading, with real open gaps, edge radii and detail. No orange volume. The initial hard shadow, dim marking and cropped crescent macro were corrected locally. The accepted version uses filtered variance shadows, a softer front reflection card, metallic foil marking and a properly framed crown macro.

At 390×844, the first caption originally touched the crescent. Its typography and object placement were adjusted. The first screen uses one object, headline and short caption; purchase controls are reserved for after the story.

This accepts the stationary material/geometry gate for implementing scroll motion. It is not a claim that the complete interactive story has already been tested or delivered. The first 3D preview remains available for rollback; remote tag `noct-before-crown-c6fa82d` points to its source snapshot.
