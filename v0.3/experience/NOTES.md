# The AVES Experience v0.3: notes (2026-11-05)

Files: `index.html`, `app.css`, `app.js`, `tools/shoot.mjs` (CDP screenshot and console checker), `shots/`.
Serve from the repo root (`python3 -m http.server <port>`), open `/v0.3/experience/`.
Debug queries: `?kit=<id>` (deep link to the walk-on), `?pick=<id>` (picker, then it picks that kit; the other-kits row uses this), `?hover=<id>`, `?step=walk|1..n|close|more`, `?rm` (forces reduced motion). With `?step` or `?hover`, Lenis is off and the scrub is locked so screenshots show the exact state.

## What is real
- All 18 kits, the groups, hazards, intros, slots, primaries, alternates, "why" lines, SKUs and standards come from `data/kits.json` and `data/products.json` at runtime. Nothing is hard-coded per kit.
- The man and his layers come from `assets/dress/` (base.png plus the 7 Oil & Gas layers). Donning order comes from the page (head, eye, hearing, respiratory, face, vest, fall, dropped, hand, cryo-body). Stacking comes from the manifest `z`. A layer goes on the man only when it has `status: ok`, its file loads, and its `dependsOn` host is on the man too.
- Fallbacks I tested: a kit with no manifest entry (cryogenic) keeps the bare man and the shelf still works. Missing backdrops use a dark tinted gradient with the kit name. A missing cutout falls back to a crop of the layer, then to a text label. If base.png is missing, `spikes/dress-v0.2/frames/00.jpg` is used. Only the picked kit's layers load.

## Placeholder
- Backdrops: none have arrived yet, so every slice and stage uses the gradient fallback.
- Boots on the base are generic. The Cavalier pass has not been done.
- The Scuta and Cavalier links are `href="#"` with `data-todo`. No URL for either site exists anywhere in the repo, so I did not invent one. Fill `BRAND_LINKS` at the top of `app.js`; a filled entry becomes a real link that opens in a new tab.
- Add to quote is a no-op that shows a toast ("Kit added to quote (preview)").

## Known flaws
- Console: there are zero JS errors and zero exceptions on all 16 verification URLs (checked over CDP). Every missing `backdrops/<id>.jpg` still logs a network 404, which Chrome reports as a console error. The fix is an optional `"backdrops": ["<kitId>", ...]` list in manifest.json. The page already reads it and stops probing for files that are not listed, and I asked dress-pipeline to add it. An optional `kits.<id>.base` is also read; the page does not probe for `base-<kitId>.png` without it, so that a 404 is not logged on every kit.
- Vest vs base, resolved by the lead 2026-11-05: the vest is a dressing step ("Hi-vis by Scuta · sister brand, not part of the AVES range"); the boots are the base, and the line under the shelf reads "Boots by Cavalier".
- Oil & Gas respiratory (escape hood) has no layer in the manifest, so it stays on the shelf ("On the shelf only"). This needs fixing in the pipeline, not on the page.
- The generated layers carry a light halo at their edges (helmet, earmuffs, gloves are the most visible). This comes from the pipeline's masks and shows on a dark stage.
- Phone deviations: the picker is 18 horizontal bands, not vertical slices (20 px slices cannot hold a name). Hover does not widen bands on phone. The shelf is a row of thumbnails with one detail block for the active item below the man.
- The walk-on is a translate tween. There is no walking animation.
- The fly-to-man cutout and the layer fade are scrubbed. With a real scroll wheel and Lenis this was not checked by hand, only in headless at fixed positions.
- Several catalogue primaries have no standards in the data (e.g. Titan AV-841R, escape hood). The shelf says "None listed in the catalogue data".
- The headless `--screenshot` flag renders pinned scroll states black, so the shots were taken over CDP (`tools/shoot.mjs`).
