# The AVES ____ Kit, v0.2 (detail round)

One file, `index.html`. It merges the v0.1 Exploded Kit and Turntable spikes. Data is fetched at runtime from `../../data/kits.json` and `../../data/products.json`, so serve the repo root over http; file:// does not work. Images come from `../../assets/cut/<id>.png`. The ghost is `img/mannequin-front.png`. The six landing photos are `img/photo-*.jpg`.

## What is real, what is curated
- Every product name, SKU and standards string is read from products.json at runtime. An empty standards string shows "standard not listed on site".
- Kit compositions, the "why" lines and the confidence flags come from kits.json, which is curation. Medium and low confidence show "curated · to be confirmed". So does any swapped-in alternate. The summary footnote says to confirm with AVES product management.
- Landing photos are cropped from catalogue pp. 4–5: glasses, faceshield, earmuffs, respirator, cryo, gloves. Each runs at saturate(.6), brightness(.86).

## Deviations from the design, with reasons
1. **Ring order is not plain slot order.** With slot order, head, eye, hearing and respiratory sit next to each other at the same height and clump on one side. Body-height slots (hand, fall, dropped, body) now take the most sideways ring positions, where x = r·sin θ bunches neighbours together. Head-height slots take front and back. Each group keeps head-to-toe order and head is always position 0. The arrow keys step to the next ring position. The rail stays head to toe.
2. **Ring heights include perspective.** Items do not sit at a fixed slot height. The camera sits at mid-body (EYE = 0.45 of crown-to-sole height). Rings above it sink at the back and rings below rise, matching the floor ellipse. Without this, a back-centre item at face height hid behind the front hard hat. The welding helmet was invisible in the first pass.
3. **Landing shows the first three hazards per kit.** Full lists run 53 to 116 characters, and the Make column has six kits, so all hazards would not fit 1440×900. The summary lists every hazard.
4. **Rail: only the active readout expands.** It adds the why line, the confidence line and the "or:" alternates. With "or:" on every entry, the 8-slot kits overflowed 900 px and clipped the last line. Turning to a slot shows its alternates. The rail also scrolls internally if it ever overflows.
5. **The blank is a fixed-width rule.** It is as wide as the longest name, "Electrical & Arc Flash". Shorter names sit on it, and on naming the rule shrinks to the word while "Kit." slides in. This avoids reflowing "Kit." every 1.8 s.
6. **Helmet and fall photos are skipped.** The helmet strip is too narrow beside its icon circle, and the fall photo has no person and is small. Eyewash is left out by design.
7. **Extra hash `&at=summary`** scrolls to the summary, for shots.

## Geometry at 1440×900 (desktop; all computed in `layout()`)
| value | number |
|---|---|
| rail | x 32, width clamp(25vw, 320, 380) = 360, top 128 |
| right margin (progress) | 170 |
| ring centre cx | 392 + (1440 − 392 − 170)/2 = 831 (57.7 %) |
| radius r | min(330, 439 − box/2) = 329 |
| front item box | min(220, 0.245·vh) = 220 px |
| ghost crown y / height | max(176, 0.195·vh) = 176 / vh − 238 = 662 |
| ghost opacity | 0.30, grayscale, brightness 0.9 |
| depth scale / opacity | 0.62 → 1 / 0.45 → 1, from cos φ |
| floor ellipse | rx = r, ry = 0.13·r = 43, at the soles |
| perspective | y += (1 − d01) · pk · (0.45 − slot), pk = 2·ry / 0.55 = 156 |
| z-order | back items 1–149, ghost 150, front items 151–251, flying items 300+ |
| slot heights (share of crown-to-sole) | head −0.045, eye 0.078, hearing 0.09, face 0.105, respiratory 0.135, fall 0.30, body 0.38, dropped 0.45, hand 0.575 |
| cloud | two columns at cx ± (r + 40), scale 0.6, ±8° tilt, slot label under each |
| pin length | vh · N · 0.45 (same scroll per item for 5- and 8-slot kits) |
| turn | drag 0.3°/px (phone 0.55), release projects 140 ms of velocity, snaps to the nearest slot in 0.25–0.6 s, power3.out |

Phone (< 760 px) uses box clamp(0.29·vw, 96, 124) and r = min(0.3·vw, 128). The ghost stands from y 170 to 62 % of height. The rail becomes a bottom sheet, 38 vh tall with a hairline top rule, which scrolls to the active readout.

## Hash states (applied live on hashchange, no reload)
- `#kit=<id>` opens the kit at the start of the pin, from the landing with the naming animation.
- `#kit=<id>&p=0..1` jumps the scrub. p = 1 is the ring complete, with the head in front.
- `&front=<slot>` turns that slot to the front, e.g. `front=hand`.
- `&at=summary` scrolls to the summary.
- `#still` gives a static landing: no name cycle, photo crossfade or entrances.
- With `p` in the hash on load, Lenis is not created, so screenshots are exact.

## Known flaws left
- **Overlaps after a turn.** With a non-head slot in front, head-height items move to the sides and can overlap. For example, with the hand in front on Oil & Gas, the helmet and glasses overlap at back-left. Depth order and fade keep it legible, but it is not collision-free at every angle.
- **Overlaps on some kits at p = 1.** Forestry's glasses overlap the face shield front-right. Demolition's mask overlaps the harness and earmuffs. Five-slot kits always have two adjacent head-height items.
- **Back-centre items show through the ghost**, for example the welding helmet and some face shields. They read as behind the figure, but faintly.
- **Not checked:** Safari, a real phone, touch inertia on a real device, and Salman's screen.
