# Runbook: building an exploded-view page for an AVES helmet (technical half)

Written from the AV-841R build, v0.1 to v0.3.3. Everything here was done on that one helmet. Nothing has been tried on a second product, so "what changes" below is my reading of the code, not a tested port.

Needs: Node 20.10+, Google Chrome, the Anatomy skill at `~/.claude/skills/anatomy/` (imported by absolute path, never copied or edited), the project's Python at `aves-showcase/.venv/bin/python` with Pillow, and the catalogue font at `aves-showcase/catalogue-src.nosync/Document Fonts/AvenirLTStd-Black.otf` (never shipped).

## 1. Files

| File | What it does |
|---|---|
| `model.mjs` | The helmet as numbers, in helmet coordinates (mm; x front, y wearer's left, z up from the brim's edge). Shell surface function, boss positions, headband ring, key angles, strap profiles, top pad, nape strap, chin strap, and the fit model (loop length to head size). No drawing. `build.mjs` imports it and the page inlines the same text. |
| `surf.mjs` | My helper, not part of the kit. Draws free-form surfaces (the shell, the buried bosses) and flat webbing swept along a 3D path (crown straps, chin strap, nape arm) in the kit's own picture: kit light, kit tone thresholds, paper fill, silhouette, creases, self-occlusion by a depth buffer. Returns the kit's `SolidPaths`. Product-independent. |
| `build.mjs` | Everything else at build time: camera, the explode table (`PIECES`), every part drawn and recorded for the audit, key settling, the kit figure page, `index.html` (header, pinned figure, callouts, ADS sections, head meta) and the two share-card pages. |
| `live.js` | The figure's runtime, inlined: moves each item by its assembly's share of `t`, re-sorts depth, the camera pull, the ratchet (rebuilds the nape tails, shifts housing and wheel, swaps wheel rib frames), hover naming, keys. Exposes `window.setExplode(t)`, `window.setFit(cm)`, `window.hxProject(piece, x, y, nape)`, `window.hxCm`. `window.HX_HOST = true` switches off its own tour, drag-to-explode and scroll-stealing keys. |
| `host.js` | The page's scroll: Lenis + one pinned ScrollTrigger whose progress is `t`, snap to stages, the stage list, callout layout every frame, the size readout, the background choice (`?bg=`). |
| `site.css` | The AVES page: header, hero, pinned stage, brand bar, callouts, size readout, stage list, material layer, background washes, ADS sections, buttons, footer, phone rules (under 1000 px). |
| `page.css` | The kit figure page's quiet card and the same material layer. Only the audit and line-check pages use it. |
| `typeset.py` | Sets headings in Avenir Black as transparent PNGs in `assets/`, the footer line with emphasised initials, and twelve glyph pictures (0-9, point, cm) for the live number. Writes `assets/type.json` with sizes. |
| `copy.json` | All page text, verbatim from the ADS, plus `documents` (button links) and `baseUrl` (where the page lives). |
| `check.sh` | Audit for light, dark and both fit stops; line check in six poses per theme. |
| `drive-page.mjs` | Drives `index.html` with real wheel, mouse and key events over CDP; captures every stage, the wheel drag, the text sections and the document buttons; prints state per stage. |
| `share.sh` | Screenshots `share-card.html` and `share-card-square.html` and writes the JPEGs; prints their pixel and byte sizes. |

## 2. Commands, in order

```sh
cd exploded/<version>/<product>/                 # a copy of the previous product's folder
# 1. replace copy.json; edit model.mjs and the product parts of build.mjs (section 3)
../../../.venv/bin/python typeset.py             # headings and glyphs -> assets/
node build.mjs --light --fast                    # seconds; no depth settle. For shape work only: order may be wrong
node build.mjs --light --quick                   # ~10 s; settle on 5 states. For looking
node build.mjs --light --audit                   # ~20 s; full settle + audit. Read every non-zero line
./check.sh                                       # ~2 min; both themes, both fit stops, line check x 12
node build.mjs --light --fine                    # final index.html (0.25 grid)
./share.sh                                       # share cards
node drive-page.mjs 390 844 m > shots/drive-phone.txt
node drive-page.mjs 1440 900 d > shots/drive-desktop.txt
```
Other flags: `--fit=52` and `--fit=66` build the rest pose at a stop (the audit cannot replay the ratchet); `--view=<deg>` turns the helmet; `--h=<n>` view-box height. `index.html` is only written by a `--light` build at the rest fit.

Look at a single pose without the scroll page: `scripts/drive.mjs figure-light.html` with `["eval","window.setExplode(0.35)"]` then `["shot", …]`.

## 3. What changes for a new helmet, and what does not

**Changes**
- `copy.json`: all of it, including each feature's `stage`, `documents`, `baseUrl`.
- `model.mjs`:
  - `SHELL` (half length, half width, height, brim) and the meridian constants.
  - `proud()` (ridge, shoulders, inset panels) and `shellLines()` (the lines laid on them).
  - `BOSS_AT`, `bosses()`.
  - `RING`, `keyAngles()`, `KEY`, `PAD`, `STRAP`, the nape strap (`LOOP`, `TAIL`, `HOUSING`, `KNOB`, `ARM`), `CHIN`.
  - `FIT_MIN`, `FIT_MAX`, `FIT_REST`.
  - `shellShapes()` levels if the height changes much.
- `build.mjs`:
  - `PIECES`: name, readout line, move vector and window of `t` per assembly; `ORDER`.
  - `STRAPS` (which key pairs with which) if the point count changes. v0.1's `POINTS` switch was dropped in v0.2: 4-point needs `keyAngles()` and `STRAPS` edited by hand.
  - `VIEW_OFF`, `H`, `FLOOR`.
  - `STAGES` (rest value and caption start per stage) and `CALLOUTS`.
  - The share-card layout numbers and the title string.
- `site.css`: the four `.m-*` material ramps if colours differ; `SWATCH` colours in `build.mjs`.
- `typeset.py`: the model name string.
- `live.js`: `STOPS`, `STAGE` and the readout stage boundaries repeat the windows by hand. Keep them in step with `PIECES`.
- `assets/`: category icon, `bg-lab.jpg` if another scene is wanted.

**Does not change**
`surf.mjs`; the recorder, settle and audit wiring; `stateAt` / `shareAt`; `strapItem`, `bandRun`, `extruded`, `frameRect`; the camera pull; `host.js` apart from nothing product-specific; `drive-page.mjs`; `check.sh`; `share.sh`; the page skeleton and its CSS.

A helmet with a different construction (cap style, vented, pin-lock suspension, no chin strap) needs new drawing code in `build.mjs`, not just new constants.

## 4. Explode: one value, windows per assembly

`PIECES[id] = { move: [x, y, z] in world mm, window: [from, to] in t }`. An assembly's share is a smoothstep of `t` across its window; its items translate by `move × share`. For the AV-841R:

| t | Assembly | Move |
|---|---|---|
| 0-0.25 | shell | up 325 |
| 0.25-0.45 | nothing (the suspension is shown whole) | |
| 0.45-0.60 | chin strap | down 36 |
| 0.54-0.70 | sweatband | forward 20, up 62 |
| 0.66-0.86 | crown suspension (straps, pad, keys) | up 104 |
| 0.84-1 | ratchet wheel | back 44 |

The headband never moves. The audit is given 101 values of `t` as strict states, so every frame `setExplode` can show at a 0.01 step is checked. Rule that kept the audit quiet: for two parts in contact, the one that leaves first moves away from the contact, and a part's window ends before a part it would sweep through begins.

Scroll: the pin is 4.6 viewport heights. `t = min(1, progress / 0.93)`; the last 7 % is a hold so the final stage is not on the pin's release point. `STAGES[i].at` is where a stage rests (snap stops are `at × 0.93`), `from` is where its name lights in the stage list. Lenis is off and snap is off under reduced motion; the pin stays.

## 5. Callouts

`CALLOUTS` in `build.mjs`: `{ id, t: [in0, in1, out0, out1], piece, at, blocks, nape? }`.
- `at` is a point on the part, projected at build time from helmet coordinates to view-box units: `on([x, y, z])`. Use the model's own functions for the point (`M.shellPoint(u, theta)`, a point on the ring, a key's frame) so it stays on the part when the model changes.
- `piece` is the assembly it rides with. `nape: true` adds the ratchet's shift (wheel, housing).
- At run time `host.js` calls `window.hxProject(piece, x, y, nape)`, which applies that assembly's current move, the fit shift and the camera pull, and returns stage pixels. It runs every frame on `gsap.ticker`, because the parts ease after the scroll and the wheel can move a part with no scroll at all.
- Progress `p` = ramp in × (1 − ramp out). The leader draws over the first half of `p` (stroke-dashoffset from the dot outward), the words fade in over the second half.
- Layout: 1000 px and wider, a 236 px column left or right of the figure (side chosen by which half the dot is in), level with the dot, pushed down if two would meet. Narrower, the words stack in the band under the figure and the leader runs from the dot to the left edge and down (straight down if the dot is in the right half).
- Windows must close before the pin's hold ends or sit inside `data-pinned`; nothing shows after release because `p` is forced to 0 when the pin is not active.
- Choose anchor points on the visible side. A point on the far side of the shell still projects, and the dot then sits on nothing.

## 6. Traps, and how each was passed

1. **The kit has no free-form surface and no webbing.** Its prisms stand on the floor and its lathe turns round parts. A helmet shell and a strap are neither. `surf.mjs` was written for them. Standing bands (headband, sweatband, nape tails) are plain kit prisms: `k.extrude` of a thin curved outline, `convex: false`.
2. **Tone polygons must share exact vertices.** Merging same-tone triangles by rounded screen position left triangle soup and bare paper. Fixed by giving every clipped point an identity from the mesh edge it lies on, and winding every triangle the same way.
3. **Surface normals.** A grid's `u × v` may point inward; pass `flip: true` (the shell needs it). Symptom: only the inside of the shell is drawn.
4. **A band that wraps something cannot be one item.** A ring is both behind and in front of what is inside it. `bandRun` cuts it where it turns edge-on to the viewer; the cut lies on the silhouette and adds no line.
5. **Strap crossings and the depth audit.** One arc per strap fails: each strap is in front of the others somewhere. Two ramped runs crossing also fail. What passes: each strap as a flat run over the pad (stacked 4 mm apart) plus a short drop at each slit plus a leg from under the pad's edge to its key. Start a leg 0.9 mm outside the pad's rim or it overlaps the pad by a sliver and cycles.
6. **The audit ray-casts recorded shapes in a limited number of steps.** A thin half-ring 300 mm long ran out of steps and read as missing, which showed as dozens of false cycles against the shell. Record the shell as hollow terraces cut into 8 arcs each. Each terrace's inner edge must reach inside the terrace above, or rays slip between rings.
7. **Contacts.** The audit wants parts to touch (within 0.15) but not sink (0.5). Things that needed care: a key's inner face is not square to the ray from the axis, so the strap leg stops 1.1 mm short of it; the wall leans, so a key must stand clear of it by its own height times the lean; the brim slopes, so its record is three stepped rings; a boss is recorded only as deep as the wall, because inside it is the key slot.
8. **No stand.** The audit needs a ground. The shell is declared the ground (`ground:` in the recorder).
9. **The audit takes one minute at a 0.25 grid with a big shell.** `step: 0.5` is the working default; `--fine` for the final build.
10. **Selection dimming by opacity shows parts through each other.** Use a filter (`contrast(.5) brightness(1.3)`) on unselected items.
11. **Materials.** The kit is one paper colour. Redefine its tokens (`--anatomy-paper`, `-top`, four shades, line tones) per part class in CSS. True black kills the four tones; the "black" ramp is #1e1f22 to #4b4d51.
12. **The assembled figure was small.** The close-up zoom is worked out in the page from the room the figure has (`place()` in `live.js`), not from the view box, so on a wide screen it spills past its own column.
13. **The last stage sat on the pin's release point.** Add the hold (section 4).
14. **Background.** The photo needs a light pool behind the figure to keep the white shell's edge, and washes under the words. On a phone the pool covers most of the width, so it is smaller and fainter there. The washes are a `::before` on the pinned section and need `z-index: 1`, or they sit under the photo and do nothing.
15. **A pointer-blocking overlay.** Any full-width layer above the figure (captions, callouts) needs `pointer-events: none` or hover and the wheel drag stop working under it.
16. **Module-scope order in `live.js`.** `place()` runs at load; anything it reads must be declared above its first call (`MOVES` was not).
17. **Lenis** needs `html.lenis, html.lenis body { height: auto }` and `.lenis.lenis-smooth { scroll-behavior: auto !important }` in the page CSS.
18. **Fast and quick builds lie about order.** `--fast` does not settle keys at all. Judge shape from them, never order, and never report from them.
19. **Read captures from the final build.** Twice a capture read one build early hid a fault (a bar clipped at the last stage; washes under the photo). After the last change: rebuild, re-drive, then read.
20. **`sed -i` on a file also edited by script** is easy to mis-anchor. Every scripted edit in this build asserts that its anchor text occurs exactly once.
21. **Venvs and scratch files** stay inside the product folder or the session scratchpad; nothing goes under `/tmp` or the share.

## 7. What the checks prove

**Audit (`--audit`), proves, for the recorded shapes only:**
- no two recorded solids of different assemblies pass through each other at any of 101 values of `t`;
- every overlapping pair of items is painted in true depth order at those values;
- every solid is connected through contacts to the ground; nothing recorded is sunk more than 0.5;
- recorded shapes cover what each item draws.

**It does not prove:**
- that the drawn shell is right: the shell is recorded as terraces, the bosses at an averaged width;
- anything about line work (that is the line check);
- the ratchet between its stops: only the rest pose at 52, 62 and 66 cm is audited. In between, the page orders the moving nape parts by adding their depth shift to the rest keys. Checked by eye;
- likeness to the product.

**Line check (`scripts/lines.mjs`, via `drive.mjs`'s `["lines"]`):** every texture line (seams, weave ribs, slots, panel rims) ends on a stroke, a dot or an outline, in six poses per theme. It skips kit outlines and creases, so a silhouette that ends on the surface is not caught.

**Page drive:** every stage is reachable by wheel and settles by the page's own snap; the right callouts show; the wheel drag changes the head size without scrolling the page; no sideways scroll; no console errors. It uses wheel and mouse events. It is not a touch test.

## 8. Unsolved on the AV-841R

- **Strap through the key.** The key's windows are outlines; the strap's fold is a patch over them. A strap threaded through a plate cannot be ordered as two items.
- **Woven crossing.** The straps are stacked over the pad, not over-under-over.
- **Flat shell facets.** The panels are shallow insets in a smooth dome. `surf.mjs` has no sharp-edged shell patches.
- **Boss fillet.** The wedge meets the wall along a plain, slightly stepped cut. Far-side bosses are not drawn.
- **Sweatband.** A 5 mm flap inside the band, not a full lining; front 100° only.
- **Chin guard depth, height key mechanism, shell rear:** drawn thin, as a slot, and symmetric; none is in a source.
- **Fabric.** Flat webbing works. Twist, drape, folds, stitching, a strap lying on a surface: `surf.mjs` has none of them.
- **Not tested anywhere:** touch on a real phone, Safari, Firefox, the page offline (GSAP, Lenis and Nunito Sans come from CDNs), the link preview in WhatsApp itself.
