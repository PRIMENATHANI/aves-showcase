# Arsenal Wall v0.2 (detail round of v0.1)

Real: 306 products (Eyewash & Showers filtered at load), all counts, names, SKUs, standards, material, colour, bullets and URLs come from `data/products.json` at runtime. Cutouts `assets/cut/<id>.png`; no aspect table (images use object-fit, spotlight reads naturalWidth).
Faked: "Add to quote" is a no-op toast. Hazard chips are keyword rules (arc flash 12, cut 44, dust 58, height 45, cold 17, noise 21, chemical 5, impact 89; chemical fell from 7 with the stations gone).

## Measured cell size (headless Chrome, #still), after the lead's review
- 1440x900: 41 px cells, 23 per row, page 900 px = 100 % (one frame, no scroll). Header block 120 px.
- 1920x1080: 54 px cells, page 1080 px = 100 %.
- 1100x800: 40 px floor reached, page 1060 px = 133 % (only 1024-1279 may exceed one frame).
- Rail focus (#rail=Hand, 1440x900): 130 px cells, 8 per row, 10 px gap; page 1476 px, so Hand needs one scroll.

## Deviations from the design, with reasons
1. One frame wins over the 56 px floor (the lead's call on 2026-11-01, overriding the design). On >=1024 px the cell size fits 100 % of the viewport height, down to 40 px; 1024-1279 may run to 120 % to stay at 40 px, and at 1100x800 it reaches 133 %. Readability comes from the dock magnification and rail focus. Rails are 12 px apart with the separator line, each label block is no taller than its rows, and the header block is 120 px.
2. Rail keys are digits 1 to 8 in body order, not H E F R. Head, Hearing and Hand all start with H; Face and Fall with F. The digit shows in each label; keys are ignored while the hazard input has focus.
3. Entrance stagger is capped per rail (min(18 ms, 420 ms / n)), rails 120 ms apart. At a flat 18 ms the Hand rail alone takes 1.06 s and the wall would land after 1.9 s. Measured timeline: 1.53 s. The counter ("306 products · 8 lines of defence · 1 brand") is driven by timeline time, so it is in step with the rails and correct under seeking.
4. Dark backing threshold uses mean gamma-coded luma (Rec. 709 weights on sRGB values) of opaque pixels at 32x32. Linear luminance < 0.18 would flag 117 products. The luma rule flags 24 in Chrome, including all 12 known dark ids.
5. Dark backing: radial rgba(255,255,255,.06) at the centre fading to 0 at 60 % of the cell, overview only (never in rail focus, strip or spotlight).
5b. Dock magnification: hovered 1.35, two neighbours each side 1.12, same row only, 90 ms. In the focused rail the hovered cell only lifts to 1.1 and a name + SKU caption appears under it; the right readout still shows the full SKU and standards.
6. Rail focus is packed: 128-144 px cells, 10 px gap, as many per row as fit; the hover caption floats over the next row with a dark text shadow. It uses the label column too (the focused rail spans the whole wall width). Strip of the other seven rails sits on top with an "All 8 lines" return control at its left edge; strip hover lights a product, strip click swaps focus.
7. Spotlight also fades the right column out so the readout does not show through behind the bullets.
8. Phone: rails are single-row horizontal scrollers at 72 px; tap lights a product and shows a bottom readout bar, second tap lifts it. Rail focus is desktop only; #rail on phone scrolls to that rail.

## Hash states (apply without reload; hashchange listener)
`#still`, `#rail=<Category or prefix, e.g. Hand, Fall>`, `#lift=<id>`, `#hazard=<word>`, `#hot=<id>`. Any hash on load skips the entrance. UI actions write the hash with replaceState.
`window.__wall` exposes `tl` (entrance timeline), `cell`, `focusCell`, `state`, `dark()` for review shots.

## Known flaws left
- Holed cutouts (clear shields, cup masks) still show holes where the knockout cleared enclosed areas; PC-CLEAR and GLASS-CLEAR read as grey plates.
- 77 products have no standards string, 34 have no bullets; empty rows are hidden.
- "Fall & Dropped Objects" shows as "Fall & Dropped" in rail and strip labels; the full name is in the aria-label and the rail focus heading.
- At 41 px the overview reads as texture; individual products need hover or rail focus.
- The entrance's onComplete clears cell opacity; a hazard typed during the 1.5 s entrance loses its dim when the wall lands.
- Not checked: Safari, real touch devices, Salman's screen.
