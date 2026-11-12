# AVES TITAN AV-841R, exploded figure v0.3

v0.2 plus: an accuracy QC with fixes, scroll in place of sliders, the ADS text, an AVES-themed page. v0.1 and v0.2 are untouched.

## Files
| File | What it is |
|---|---|
| `index.html` | The page. Built by `node build.mjs --light`. Self-contained apart from GSAP, ScrollTrigger and Lenis (cdnjs / jsDelivr, pinned) and Nunito Sans (Google Fonts). |
| `figure-light.html`, `figure.html` | The figure alone on a kit page, light and dark. The audit and the line check run on these. |
| `build.mjs`, `model.mjs`, `surf.mjs`, `live.js` | Figure build, numbers, my free-form drawing helper, interaction. |
| `site.css`, `host.js` | The AVES page and its scroll host (pin, scrub, snap, captions). |
| `page.css` | The kit page's quiet card and the material layer. |
| `typeset.py` | Sets the headings in Avenir LT Std Black as PNGs in `assets/`. The font file is not shipped. |
| `copy.json` | The ADS text, used verbatim. |
| `check.sh` | Audit both themes and both fit stops, line check in six poses per theme. |
| `drive-page.mjs` | Drives `index.html` with real wheel events in headless Chrome and captures each stage and the text sections. |

Size tier: **Hero.** 58 depth-sorted items, 172 recorded shapes.

## QC, part by part

| Part | Source | Result | Why |
|---|---|---|---|
| Bosses | ADS features panel 3, sell sheet hero, `h5-006.png` | **Fixed** | Four wedges at the diagonals on the crown wall where it meets the brim: leaning front face, top sloping back into the crown, a slot opening low on the face. Kit prisms. |
| Boss ends | ADS panel 3 | **Cannot match** | The drawing's wedge narrows towards the top; mine has square ends (a prism has one section). |
| Suspension keys | ADS assembly panel 2, sell sheet "2-Point Adjustment" icon | **Fixed** | A head with two rectangular windows over a tongue with a slot. The strap comes down the inside and a black fold lies up the outside of the head. Named suspension keys throughout. |
| Strap through the key | sell sheet icon | **Cannot match** | The strap is not drawn passing through the window: the windows are outlines on the face and the fold is a patch over them. A strap threaded through a plate cannot be depth-ordered as two items. |
| Key slots in the shell | ADS assembly panels 1, 2 | **Match (not seen)** | A key slot is recorded above each key inside the shell; the four diagonal keys sit under the four bosses. The inside of the shell is never in view. |
| Crown crossing | `h5-002.png` | **Fixed, in part** | Three straps cross over the pad between six slits; at each slit the strap drops to the pad and the leg comes out from under the pad's edge. So: over the middle, under the edge. |
| Over, under, over | `h5-002.png` | **Cannot match** | The straps are not woven through each other or through the pad twice. Two ramped straps crossing put each in front of the other somewhere, which fails the depth audit; the stacked flat runs with short drops pass it. |
| Top pad | `h5-002.png`, `h5-004.png` | **Match** | Grey rounded square, four holes, six slits. |
| Shell front: centre panel | `h5-005.png`, ADS features panel 4 | **Match** | Rounded trapezoid on the ridge's front, narrower at the bottom (as v0.2). |
| Shell front: shoulder panels | `h5-005.png`, ADS features panel 4 | **Fixed, in part** | One inset panel on each shoulder at the front, with its rim line. |
| Flat facets | `h5-005.png` | **Cannot match** | The panels are shallow insets in a smooth dome, not flat planes meeting at creases. My surface helper shades a smooth surface; a truly faceted shell needs sharp-edged patches I did not build. |
| Sweatband | `h5-004.png`, `h5-000.png`, ADS features panel 1 | **Fixed, in part** | Outside face, over the top edge, and a flap down the inside of the band. It comes off forward and up. |
| Sweatband inside face | `h5-004.png` | **Cannot match** | The real one lines the whole inside of the front band. Mine has a 5 mm flap standing 1.9 mm off the band, so that the forward-and-up path does not pass through the band. It also covers the front 100° only, not 30 cm. |
| Nape strap arm | `h5-000.png` | **Fixed** | A curved arm drops from the round side pivot and sweeps back to the lower strap. It narrows to a point at its lower end, which the photo's arm does not. |
| Chin strap AV-729 | `h5-004.png`, PTF 729 | **Fixed** | Chin guard at the middle (8 × 4 cm), a two-part buckle on one side, a slider on the other, two clips. |
| Chin guard depth | PTF 729 | **Cannot match** | The file gives 2.5 cm; drawn as a pad about 1 cm thick, because its shape is in no photo. |
| Ratchet wheel | ADS assembly panel 4, `h5-000.png` | **Match** | Ribbed wheel on the housing at the nape, pulls straight back. TIGHT / LOOSE are not lettered on it. |
| Height key | ADS assembly panel 5 | **Cannot match** | The optional height adjustment is a slot in each key's tongue; the mechanism in the drawing's inset is too small to read. |
| Headband | `h5-004.png` | **Match** | One continuous ring. |
| Shell rear | none | **Cannot match** | No rear photo; drawn symmetric with the panels at the front only. |
| Six-spoke crown | ADS drawings | **Not followed** | As instructed: the product photos (three straps through a top pad) win. |

## Scroll
- `host.js` pins the figure with ScrollTrigger (GSAP 3.15.0) and Lenis 1.3.26, one driver (`gsap.ticker`). The pin's progress is `setExplode(t)`: scrub 0.5 s, snap to the nearest of seven stages.
- Stages (t): assembled 0, shell 0.14, suspension 0.35, chin strap 0.62, sweatband 0.72, crown 0.88, ratchet 1. The stage list at the right jumps to a stage (hidden under 1000 px wide).
- No sliders. At the ratchet stage the wheel is dragged, or the left and right arrow keys used once the figure has focus. The fit is refused until the shell is off.
- Reduced motion: no Lenis, scrub locked to the scrollbar, no snap; the pin stays so every stage is reachable.
- `?bg=lab` puts `assets/bg-lab.jpg` behind the pinned figure at 34% under a light veil.

## Text
Captions while pinned are the ADS features for the stage (`stage` in `copy.json`); the ratchet stage repeats "Ratchet Suspension System". The chin strap stage has no ADS feature, so it shows the readout only. After the pin: intro, six features, specification, standards, colours, all verbatim from `copy.json`. Headings FEATURES, TECHNICAL AND MATERIAL SPECIFICATION, STANDARDS are the ADS's own; COLORS AVAILABLE is the sell sheet's. No packaging, HS code, price, link or supplier.

Words on the page that are not ADS text: the seven stage labels, the readout (part names and the head size), the ratchet hint, and the swatch colours (my approximations of the seven named colours).

## Verification
- `check.sh`: audit passed for light, dark, fit 52 and fit 66; line check 0 in six poses per theme. Logs in `shots/`.
- Hovering a part names it in the readout, outlines it in green and washes the others out (a filter, not transparency, so nothing shows through).
- `drive-page.mjs`: 1440 × 900 (`shots/d-*`), 390 × 844 (`shots/m-*`), reduced motion (`shots/r-*`), lab background (`shots/lab-*`). Every stage reached by wheel and settled by the page's own snap; no console errors; no sideways scroll.
- The audit proves the recorded shapes (the shell as terraces), not the drawn shell. The ratchet's travel between its stops is checked by eye only.

## Not tested
- Touch scrolling on a real phone (the 390 run uses wheel events at phone width).
- Dragging the wheel by touch. A mouse drag on the wheel was driven in the page at both sizes: the head size changed and the page did not scroll. The wheel is a small target on a phone, and with no slider it is the only way to change the fit there.
- Safari and Firefox.
- The page offline: GSAP, Lenis and the font come from CDNs.
