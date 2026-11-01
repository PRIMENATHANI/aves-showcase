# AVES Arsenal Wall v0.2 — design

Date 2026-11-01. Author Sloane. Status: detail round (Salman's word: "Brainstorm and develop this fully").
Builds on v0.1 (`v0.1/arsenal-wall/`). Shared language in `BRIEF.md`.

## Intent
One frame that proves the claim "everything in the safety arsenal": every AVES product on one wall, grouped by line of defence, in body order (head to toe), with a landing that makes the first second land and a view that lets a buyer actually read a product without leaving the wall.

## What changed from v0.1 (Salman's words)
- Eyewash & Safety Showers removed from the wall (the two stations). 306 products, 8 categories remain. Kits drop them too (my call, stated in the Kit design).
- "Improve overall page landing and view of wall."

## Goals
1. Landing: within 1.5 s the visitor sees the whole range and a number that means something.
2. View: a product on the wall can be read (name, SKU, standard) at a glance without the 48 px cell problem of v0.1.
3. Breadth stays the hero: never fewer than all 306 on screen at once in the overview state.

## Non-goals / anti-goals
- Not a shop. No prices, no cart. One CTA: "Add to quote" (no-op toast).
- No boxes, no cards, no emojis, no self-scoring copy ("world class"). Factual readouts only.
- No stock photography on the wall itself; the wall is product cutouts on the dark stage.

## The page
### 1. Entrance (0–1.6 s, once per visit; skipped under prefers-reduced-motion and on `#still`)
- Stage black. Left margin: AVES mark, then the line "The safety arsenal." and under it a readout that counts up to `306 products · 8 lines of defence · 1 brand`.
- The wall assembles in body order, one category rail at a time, top to bottom: Head → Eye → Face → Hearing → Respiratory → Hand → Fall & Dropped Objects → Cryogenic. Cells scale from 0.6 and fade in, 18 ms stagger within a rail, rails 120 ms apart. Transform/opacity only. GSAP timeline, total ≤ 1.6 s.
- The counter runs in step with the rails (Head lands → 31, Eye → 65 …). The number is derived from `products.json` at runtime, never hard-coded.

### 2. Overview state (the wall)
- Rails: horizontal bands, one per category, in body order. The rail label sits in the left margin in Barlow Condensed with its count and the one-line defence it provides (copy from the catalogue section intros, trimmed to ≤ 9 words, e.g. "Head · 31 · impact, penetration, electrical").
- Cell size is computed to fit the viewport exactly as in v0.1, but the floor is raised: on ≥1280 px wide the wall may exceed one viewport height by up to 20 % and scroll with Lenis; the brief's 56 px minimum cell holds. Under 1280 px, cells shrink; under 760 px (phone) rails become horizontal scrollers at 72 px cells.
- Dark products: any cutout whose mean luminance over opaque pixels is < 0.18 gets a faint radial backing (`rgba(255,255,255,.07)` at 60 % cell size) so it never sinks into the stage. Computed once at load from the image (canvas), cached per id.
- Hover: the hovered cell lifts (scale 1.35, z above neighbours) and the two neighbours on each side scale 1.12 (dock magnification, 90 ms). A readout appears in the right margin, not over the wall: name, SKU, standard string, category. No tooltip boxes.

### 3. Rail focus (the "view" improvement; my choice over a free lens)
- Click a rail label, or press a category key (H E F R …): that rail expands to fill the stage (FLIP, 420 ms, `power3.inOut`); the other seven rails compress into a thin strip at the top that stays alive (hover still lights them, click swaps focus). Cells in the focused rail grow to 120–160 px and the readout moves under each product on hover.
- Why this over a magnifier lens: the lens shows ~7 products large; rail focus shows a whole category large while the rest of the wall remains visible as the strip. The claim "we have the whole arsenal" is never broken.
- Escape or clicking the strip edge returns to the overview with the reverse FLIP.

### 4. Spotlight (kept from v0.1)
- Click a product: it lifts to the spotlight (FLIP) with the full readout: name, SKU, standards, material, colour, up to 5 bullets, "Add to quote", "Open on aves-safety.com". Arrow keys step through the rail. Escape returns it.

### 5. Hazard filter (kept, recounted)
- Input + chips: arc flash, cut, dust, height, cold, noise, chemical, impact. Matching cells stay lit, the rest dim to 22 % opacity (never removed, so the wall never shrinks). Counts come from the data at runtime; "chemical" must be recounted without the stations.
- Chip copy stays factual: "dust · 58 products".

### 6. Hash states (for review shots and links)
`#still` (entrance skipped), `#rail=<Category>`, `#lift=<id>`, `#hazard=<word>`, `#hot=<id>`.

## Data
- `data/products.json` as is; the page filters out `category == "Eyewash & Showers"` at load. The data file stays complete so the Kit page and later work can use it.
- Known asset flaws to fix before the shoot: the ~14 holed cutouts (clear shields, N99/N100/P100 cup masks, FFP3 V CP, AV-201-3C, AV-301) get a re-knockout with enclosed-hole clearing disabled for those ids (`tools/knockout.py --keep-holes <ids>`); PC-CLEAR and GLASS-CLEAR plates stay grey and are accepted as such.

## Look
- Stage, type and motion per `BRIEF.md`. Accent moves from the logo-sampled green to the brand guide's Deep Green, Pantone 348 C (checked in `AVES BRAND GUIDELINES.pdf` 2024-25, p14: Mint 5645 C, Deep Green 348 C, Dark Charcoal 426 C). Pantone to sRGB is approximate; sample the catalogue PDF's green as the working value, keep `#19b45a` for text on dark if 348 C fails contrast.
- Type: Barlow Condensed + Barlow stay (showcase call). The brand guide names Arial primary, Times New Roman secondary, Avenir/Helvetica third. Salman can overrule.

## Verification
- Headless Chrome via `scratchpad/aves/tt-tools/cdp.mjs` (real-time waits): `#still` overview at 1440×900 and 1920×1080, `#rail=Hand`, `#lift=av-717p`, `#hazard=dust`, phone via 390×844 iframe. Console clean. Reduced-motion run shows the finished wall with no entrance.
- Not checked by this round: Safari, Salman's actual screen.

## Left to the builder
- Exact rail label copy (trim from catalogue intros).
- Dock-magnification easing and neighbour count.
- Phone rail scroller details.
