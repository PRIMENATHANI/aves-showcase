# AVES TITAN AV-841R, product page prototype v0.5

Built on v0.4. The exploded scroll, its stages, callouts, stage list, readout and brand bar are v0.4's: `figure-light.html`, `figure.html`, `live.js`, `model.mjs`, `surf.mjs` and both share-card pages are byte-identical to v0.4's after a rebuild. What changed is the opening screen and the passage from it into the pinned stage.

## What is new in v0.5
1. **360 view on the opening screen.** 36 frames, one every 10 degrees, in `assets/spin/spin-000.webp` to `spin-350.webp` (1000 x 921, lossless WebP on transparency, 889 KB for the set), described by `assets/spin/spin.json`. They are drawn by the same code as the figure (`build.mjs --spin=<deg>`), with the panels and bosses of the far side added (those exist only in the frames; the exploded figure is unchanged). `./spin.sh` makes the whole set in about two minutes.
2. **The viewer** (`host.js`, the block that starts "the 360 view"): one canvas. A mostly sideways drag turns the helmet (mouse or finger; `touch-action: pan-y`, so an up-and-down swipe still scrolls the page); left and right arrows turn it by one frame when it has focus; a flick runs on and settles on a frame; "Drag to rotate" with a drawn mark fades at the first drag or key; one slow turn (9 s) on first view, none under reduced motion. Frame 0 loads first, the rest nearest-first, four at a time; an angle whose frame has not arrived shows the nearest one that has. Until frame 0 has loaded, and if `spin.json` or the frames never load, the drawn still helmet stands in the same box and the page behaves as v0.4 did.
3. **Colour.** The frames are white. The page recolours the canvas by sending each grey of the white ramp to the same tone of the chosen colour: the table is written by `build.mjs` from the same `RAMP` that writes the figure's colour tokens (`HX_PAGE.spin.ramp`), so the two cannot drift. Pixels at grey 100 or darker are left alone: the chin strap stays dark. Measured at frame 0 against the drawn helmet for all seven colours (`shots/tint-phone.txt`, `shots/tint-desktop.txt`): the flat tones are identical to the digit in every colour, yellow and red included. The pixels that differ (2.5 to 3.9 %) are line work: stroke weight, and the far-side panel lines the frames have and the drawing does not. No separate colour set was needed.
4. **Hand-off: one helmet.** The canvas lives in the opening section in page coordinates. From the top of the page to the pin, scroll progress moves it in a straight line (transform only) from its slot to the exact box the pinned figure's helmet occupies, and turns it by the shorter way to frame 0 (reached at 80 % of the way). At the pin the canvas is removed and the figure's parts, hidden until then, are shown in the same frame. Scrolling back up reverses it and the helmet returns to the angle it was left at. It is a swap at registered position, not a cross-fade: measured 2 px before the pin against the figure just after, the two boxes differ by 0.4 px or less at 390 x 844, 0.6 px at 390 x 664, and 1 px sideways at 1440 x 900 (the canvas is still moving sideways there: half a pixel per pixel of scroll).
5. **Phone opening screen** (under 1000 px wide): the first screen is the helmet, the swatches, AV-841R, the name and the article number; the figure takes what the header and those lines leave (`100svh - 306px`). The intro paragraph (one element, printed once) and the standards line follow below the fold. Article number bottom edge: 826 of 844 px, 646 of 664 px.
6. `drive-page.mjs` and `repro-bar.mjs` serve the folder over http on 127.0.0.1 for the length of the run (the viewer fetches `spin.json` and reads its canvas back, and neither works from `file://`). On phone widths the driver now runs with touch emulation and drives the helmet with touch events.

7. **Shell colours are the ADS's own fills** (read from the ADS vector file): Red #ea2227, Yellow #fde900, Orange #f05a29, Blue #0075c9 (PANTONE 3005 C), Green #39b24a, White #ffffff, Grey #bbbdbf. `copy.json` `shellColors` already held exactly these values (unchanged from v0.4, whose note called them pixel-sampled): no value moved. The swatches, the drawn shell's tone ramps, the 360 tint and the logo views all take their base from that one list.
8. **LOGO PLACEMENT AREAS: the ADS's own drawings.** The four hand-traced views are gone. `logo-views.mjs` reads `assets/ads-vectors/logo-{front,back,left,right}.svg`, removes the pale blue "FT" watermarks with their "TM" glyphs and clip paths (5, 5, 6 and 6 groups; the script fails if any #0075c9 shape or clip is left), keeps the outline, panels, bosses and the numbered grey area, measures each helmet in Chrome and writes `assets/ads-vectors/views.json`; `build.mjs` inlines it. All four are set in one frame size (226.53 x 185.57 units) at the ADS's own scale, centred, lowest point on the frame's floor: at 1440 the four drawings' bottom edges are at the same pixel (545.4) and so are the four labels; at 390 they sit two by two, each pair level. Recolour: the shell's white fill is `--lv-shell` (the swatch's base colour), and each grey gradient multiplies over a shell-coloured copy of its own shape, so white is the ADS drawing as drawn. Checked in white and blue at both widths (`shots/sheet-logo-desktop.jpg`, `shots/sheet-logo-phone.jpg`, `shots/logo-*.txt`). Front and Back, and Left and Right, are near mirror drawings in the ADS itself; the end views are taller than the side views there too. The grey area and its number stay the ADS's grey and black in every colour.

## Replacing the drawn frames with photographs
The viewer reads only `assets/spin/spin.json` and the files it names. A photographed set drops in with no code change if it meets all of this:
- **Count and names:** `count` files, `spin-000.<ext>`, `spin-010.<ext>` ... named by angle in degrees, three digits; `step` degrees apart; `start` 0. 36 at 10 degrees is what the drag feel is tuned for; 24 or 72 work.
- **Direction:** with a rising number the near side of the helmet moves to the viewer's LEFT (turntable turning clockwise seen from above). If the set turns the other way, reverse the numbering.
- **Frame 0:** the same three-quarter view as the drawn `spin-000`: brim front towards the lower right, as on the exploded stage. The hand-off ends on frame 0 and swaps to the drawing, so this is the frame that must match it.
- **Camera:** one fixed height and distance for the whole set, looking down 30 degrees on the brim plane, a long lens (the drawing has no perspective). Lighting fixed with the camera, from the upper left; the helmet turns, the light does not.
- **Framing:** every frame the same size and crop. The turntable axis on the vertical centre line (50 % of the width); the centre of the brim plane 54.4 % of the way down; the brim, at its widest (frames 160 and 340), 97.6 % of the frame's width, at its narrowest (70 and 250) 85.9 %; crown top 1.2 % from the top edge, chin strap bottom 1.2 % from the bottom edge. Aspect 1000 : 921. These numbers are what keep the helmet from jumping at the hand-off; `width` and `height` in `spin.json` must be the true pixel size.
- **Background:** transparent (alpha), cut out cleanly, no cast shadow in the picture (the page draws its own).
- **Size:** about 1000 px wide; WebP (or PNG; set `ext`). The drawn set is 889 KB; a photographed one will be heavier, aim under 3 MB for 36.
- **Colour:** a WHITE helmet with a dark chin strap, neutral greys. The page recolours by grey level, on the white drawing's ramp (white 255 down to shade 208, lines 140 to 177; anything at 100 or darker is left as it is). A photograph has a wider and smoother range than the drawing, so the six colours will be believable but will not match the drawn figure's flat tones at the hand-off; if that shows, shoot or grade a set per colour (the viewer would need a per-colour folder: a code change).
- Set `"source":"photo"`. The hand-off box is not in `spin.json`: it is `HX_PAGE.spin.box`, written by the build from the drawing.

## v0.5 verification (final build)
`shots/drive-phone.txt` (390 x 844, touch), `shots/drive-phone-664.txt` (390 x 664, touch), `shots/drive-desktop.txt` (1440 x 900, mouse), `shots/drive-phone-red.txt` (red shell through every stage), `shots/drive-phone-reduced.txt` (reduced motion, opening and hand-off only), `shots/repro-bar.txt`, `shots/tint-*.txt`. In each full run: sideways drag turns the helmet and the page moves 0 px; a swipe up (phone) or the wheel (desktop) over the helmet scrolls and leaves the angle alone; exactly one helmet visible at each of four hand-off points and back at the top; every stage reached; no sideways scroll; no console errors.

## v0.5: falls short, and not tested
- At the hand-off the far-side panel outline at the upper left of frame 0 is not in the exploded figure's drawing, so that line goes out at the swap (seen in `shots/m-handoff-3/4.png`, `r-handoff-3/4.png`, `d-handoff-3/4.png`). The cure is to give the exploded figure the far-side panels too (`M.BOTH.on` for every build, then `./check.sh`): a change to the approved figure, so not done.
- Line weight at the swap: the frames carry a 1.6 px stroke at 1000 px, which is the figure's 0.6 px screen stroke at a phone's size; at 1440 wide the frame's lines are about twice the figure's weight and the helmet reads slightly lighter after the swap. Position, size, angle and flat tones are registered at all three sizes.
- While the helmet travels on a phone it passes over the green identity block's words.
- `repro-bar.mjs` 844 -> 664: in about one run in three a stage reads as uncovered (v0.4's page did the same in 1 run of 6 here, same stage, same 123 px: inherited, not new). The final recorded run (`shots/repro-bar.txt`) is 0 px at all 14 points. The script's new "why" line shows ScrollTrigger had refreshed to the shorter layout (a height change over 25 % of the viewport makes it refresh even on touch) and the scroll offset, set for the taller layout, is then past the pin's end: what is under is the next section, not a white bar. 664 -> 844 was 0 px in every run. My reading of the cause, not proven beyond that diagnostic line.
- The frames are settled for depth order at the assembled pose only and are not audited; all 36 were read on contact sheets.
- `shots/stages-vs-v0.4.txt`: the seven stage captures at 1440 x 900 and six of seven at 390 x 844 are pixel-identical to v0.4's. The phone's "assembled" capture differs because the driver stopped 14 px short of the pin, where the 360 canvas still has the helmet.
- Missing frames (`HX_NOSPIN=1`, the folder answering 404): the still helmet stands in, no exception (`shots/drive-phone-noframes.txt`). Not tested: frames that arrive slowly or only in part.
- Not tested: a real phone, Safari, Firefox; touch is Chrome's emulation. Canvas read-back cost on a slow phone when a colour is on. Mid-drag loss of the pointer. Tablet widths between 600 and 1000 px. The published address.

# AVES TITAN AV-841R, product page prototype v0.4

Built on the locked exemplar v0.3.4. The exploded scroll is unchanged: every white stage at 390 x 844 and 1440 x 900 was diffed against v0.3.4's captures; only sub-pixel text anti-aliasing differs (the pin starts at a different page offset), plus the new skip link.

## What is new
1. Opening screen: the pinned figure's own shell and chin strap shown again by `<use>` (one drawing, one colour), the identity on the sell sheet's green, seven swatches. A swatch sets `data-shell` on `<body>`; `build.mjs` writes one token set per colour (`SHELL_CSS`), sampled by pixel from the sell sheet's swatches (`shellColors` in copy.json).
2. Page bar (`.pb`), hidden while the figure is pinned; "Skip to specification" at the first stage.
3. COMPATIBLE ACCESSORIES: pictures by `accessories.py`. AV-565R is the site's cut-out; the other ten are the ADS's own embedded photos taken out of the PDF with their masks. Nothing is cropped from a page render.
4. LOGO PLACEMENT AREAS: all four views are redrawn by hand from the ADS line drawing (page 3) as plain SVG (`endView`, `sideView` in build.mjs), in the drawing's own pixel coordinates. Front and Back are one drawing, as are Left and Right, as in the ADS. The shell takes the swatch colour through the figure's tone variables (base, one lighter, one darker). The first attempt drew them with the figure's own shell; Front and Back did not hold up and were replaced.
5. RECOMMENDED INDUSTRY: tiles by `industries.py`. Six are the supplied AVES tiles; Mining, Offshore, Petrochemicals, Railroads, Rig Drilling and Iron & Steel are the ADS's own vector glyphs set in the same tile. The supplied `mechanic` tile is not used (no ADS industry of that name). "Petrochemicals" corrects the ADS's "Pertrochemicals".
6. More head protection: eleven TITAN and VICTOR helmets by `helmets.py`.

## Words on the page that are not ADS or sell-sheet text
All in `copy.json` under `ui`, plus:
- Scroll to take it apart · Skip to specification · Shell colour (screen-reader label) · See it in the exploded view · Product page · See the kit
- Page bar links: Take it apart, Specification, Accessories, Customise, Industries
- From v0.3.x and unchanged: the seven stage labels, "Drag the wheel to adjust", DOCUMENTS and its three second lines, "Always Value Everybody's Safety"
- The eleven helmet names in the last section come from products.json (the brand site), not the ADS. Its heading reuses HEAD PROTECTION.
- "Petrochemicals" (corrected spelling).

## Not verified
- No outbound link was opened: aves-safety.com answers 406 to scripted requests. AV-728 is not linked (its address in products.json is a trashed page; team-lead's decision).
- The kit-builder links were not opened.
- `<use>` for the opening helmet and its colour was checked in Chrome only.

# AVES TITAN AV-841R, exploded figure v0.3.4

## v0.3.4 (page work only)
1. Share cards: no white pool; a lift within the green family behind the suspension and a dark-green ground shadow. Wide card: category icon and HEAD PROTECTION in the left strip, everything else inside the centre square. Square card: icon beside HEAD PROTECTION.
2. Documents row: mint items with a left green accent, a drawn document mark, name, one quiet line, an arrow that moves on hover and focus; heading DOCUMENTS in the title face.
3. Product name (AV-841R, TITAN Full Brim Helmet) under the logo while pinned, with the brand bar.
4. White bar on the phone: cause and fix in RUNBOOK-BUILD.md, trap 17a.

## v0.3.2 and v0.3.3 notes

## v0.3.2 (page work only; the figure's geometry is v0.3.1's)
1. **Callouts** replace the bottom caption: ADS text beside the part, joined by a thin green leader that grows out from a dot on the part, then the words fade in. Driven by the scrub (`CALLOUTS` in `build.mjs`, `layout()` in `host.js`); the dot follows its part through the explode, the camera pull and the ratchet. None show once the pin releases. At 1000 px and wider they sit in a column left or right of the figure, level with the part. Narrower, the words sit in the clear band under the figure and the leader runs from the part down to them.
2. **Stage list on a phone**: seven dots on the right edge, the current one named, each tappable.
3. **Header**: the green HEAD PROTECTION band is gone; the hero follows the logo row directly.
4. **Footer**: logo, then "Always Value Everybody's Safety" with the four initials at full white and the rest at 60 %.
5. **Background**: the strong photo is now the default; `?bg=soft` is the paler one, `?bg=plain` none, `?bg=strong` still works. On a phone the light pool behind the figure is smaller and fainter so the hall shows around it.
Chin strap callout text ("AV-729", "2-point Attachment with Chin Guard") is as given in the brief from ADS page 2; it is not in `copy.json`.

## v0.3.1 (four items on top of v0.3)
1. **Bosses** are wedges whose back is buried in the crown wall: a six-sided body from under the brim surface up into the wall, 46 mm wide at the base and 34 mm at the top, drawn by `surf.mjs` with the shell's own surface as an occluder, so only the leaning face, the short sloping top and the two side faces outside the shell are painted. Where the wedge meets the wall there is no line: the cut follows the shell surface. Not done: a rounded fillet at that junction. The audit records the boss only to the wall's thickness (inside that it is hollow: the key slot). Far-side bosses are hidden by the crown and are not drawn.
2. **Brand bar** over the pinned figure: logo, tagline, HEAD PROTECTION and the round icon, no panel behind them. It fades in just before the figure pins and out when the pin lets go. Under 1000 px wide the words HEAD PROTECTION are dropped and the icon stays.
3. **Figure size**: the camera's close-up is now worked out in the page from the room the figure really has, so on a wide screen the assembled helmet spills past the figure's own column. Measured at 1440 x 900: assembled 81 % of the viewport height (was about 45 %), fully apart 84 % (v0.3 was about 86 %: the apart pose was already height-limited, and it gave up a little to the bar and to the longer chin strap). At 390 x 844: assembled 41 %, apart 65 %, both limited by the width.
4. **Chin guard**: black like the strap, 8 x 4 cm, 2 mm proud (was 4). The strap is now about 40 cm long (the file says 40-50 cm; it was about 30), so the guard is in proportion to it. It still reads as a broad cup: at 8 x 4 cm it is five times the strap's width. Making it smaller would contradict the file.
5. The last 7 % of the pin is a hold, so the helmet is fully apart, and the wheel can be dragged, before the page lets go.

6. **Lab background** is the default behind the pinned figure. `?bg=plain` removes it, `?bg=strong` shows more of it. Default: photo at 74 % with contrast 1.32; strong: 94 % with contrast 1.5. Over it: a soft oval of light behind the figure, light washes under the caption, under the brand bar and behind the stage list, and a light halo on the words. No panel and no hard edge. The floor shadow is a little darker over the photo.

Known flaws in the bosses at 4x (`shots/qc-boss-4x.png`): a stepped edge where the wedge's top meets the wall (the cut follows a 0.7 mm mesh), no rounded fillet there, edge strokes that differ between the two visible bosses, the recorded width is the average of base and top, and the two far bosses are not drawn (the crown hides them).

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
| Bosses | ADS features panel 3, sell sheet hero, `h5-006.png` | **Fixed (v0.3.1)** | Wedges buried in the crown wall, narrowing towards the top, slot low on the face. |
| Boss junction | ADS panel 3 | **Cannot match** | No rounded fillet where the wedge meets the wall; the cut is the plain intersection with the shell. |
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
