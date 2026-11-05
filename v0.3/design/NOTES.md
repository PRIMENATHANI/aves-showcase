# AVES Experience v0.3 — FigCraft comps (2026-11-05)

Files: `aves-experience-v0.3.fig` (experimental .fig export), `aves-experience-v0.3.figcraft` (native, editable), PNGs at 2x. Reproducible: `_work/build.py` (layout), `_work/prep.py` (image prep), `_work/fonts/` (Barlow files used).

## Frames
| Name | Size | PNG |
|---|---|---|
| 01-picker-resting | 1440x900 | 01-picker-resting.png |
| 02-picker-hover (Construction) | 1440x900 | 02-picker-hover.png |
| 03-stage-step3 (Oil & Gas, hearing) | 1440x900 | 03-stage-step3.png |
| 04-phone-stage-step3 | 390x844 | 04-phone-stage-step3.png |

## Tokens
bg #07090c, ink #f3f5f8, muted #9aa3ae, soft body #d9dee4, accent #19b45a (text and active rules), hairlines white at 12-14%. Barlow Condensed 500/600/700 uppercase for display, Barlow 400/500 for body. Nothing in boxes.

## Picker (desktop)
- Header: logo 96x25 at (32,30); headline 72px Barlow Condensed 700 uppercase, tracking 1%, at y=70; sub 16px Barlow muted at y=156; tagline top right 13px, tracking 14%.
- Slice band y=208..820 (612 tall). Order and grouping from `kit.group`: Energy 3, Build 3, Make 6, Move 3, Extract & Handle 3.
- Resting: every slice 74 wide, 2 px gap inside a group, 20 px gap between groups (full bleed, 1 px outer inset). Photo desaturated to 55% and darkened to 62%, bottom 60% fades to the stage colour so type always reads.
- Hover: hovered slice 221 wide (3.0x of 74; 3.4x of the 65 px compressed slices), the other 17 compress to 65. Total stays 1440 (221 + 17x65 + 13x2 + 4x20 = 1440). Photo returns to 95% saturation, 90% brightness.
- Vertical names: 20px Barlow Condensed 600, tracking 8%, uppercase, read bottom to top, baseline-anchored 24 px above the slice bottom, centred in the slice. Longest ("Electrical & Arc Flash", "Cryogenic Handling", "Welding & Hot Work") fit in 612 px.
- Hover content (inside slice, 16 px inset, bottom-anchored, last hazard ends 20 px above the slice bottom): "KIT 04 / 18" 14px accent; name 31px Barlow Condensed 700 uppercase, tracking 1%, width 189 (long names wrap to 2 lines, grow upward); 3 hazards 14px Barlow with 8x2 accent dash, 26 px pitch. Accent underline 3 px under the full hovered slice at y=822.
- Group rule: 1 px at y=836 spanning the group; label 13px Barlow Condensed 500, tracking 14%, muted (accent for the hovered kit's group) at y=846.

## Stage (desktop, step 3 of Oil & Gas)
- Backdrop `oil-gas.jpg` cover-fit, desaturated 60%, darkened to 50%, with a smooth fade to #07090c across x=42%..70% so the shelf column sits on near-black; bottom and top fades.
- Man: height about 762 px, centre x=470, feet at y=832, soft spotlight ellipse 640x720 behind, floor shadow ellipse 340x28.
- Shelf column x=960..1408 (right third). Title row y=62: kit name 30px Barlow Condensed 700; counter "3 / 8" (step in accent). Progress: 8 segments 52x3, 4.6 gap, y=108, filled to current.
- Grid 2 columns x 4 rows, 224 x 120 cells starting y=126, order = dressing order: head, eye, hearing, respiratory, vest, fall, dropped, hand. Cutout sits on a 1 px hairline "shelf" (y = cell top + 82); label under it 12px Barlow Condensed ("03  HEARING"). Cutouts fit 150x74 (active 176x88 with a green radial glow and a 2 px accent shelf line). Earlier slots at 34% opacity, upcoming at 78%, active 100%. Vest label reads "05 HI-VIS VEST BY SCUTA".
- Detail block y=630: name 32px Barlow Condensed 700 (width 448), SKU 14px Barlow 500 muted, STANDARDS label 12px accent + value 14px, "why" line 14px/140%, then "Add to quote" 16px Barlow Condensed 700 accent with a 2 px underline (no button box). "Boots by Cavalier" 13px muted underlined at y=858.

## Phone (390x844)
- Gutters 16. Header 22..41, kit title 24px + counter at y=58, progress 8x(40x3) at y=92.
- Man 420 px tall (y 104..524) centred over a 390x560 backdrop that fades to the stage colour.
- Shelf is one horizontal row below the man: cells 60 wide, 64 pitch, cutout fit 56x50 (active 60x56), hairline at y=600, numbers "01".. at y=608. Row scrolls sideways: cells 1-5 whole, 6 is cut by the screen edge as the scroll cue; scroll-snap on the active cell.
- Detail y=634..: slot label 13px accent, name 26px, SKU 13px, standards 13px, why 14px/140%, CTA 15px, Cavalier line 12px at y=814 (leaves 30 px for the home indicator).

## What is real and what is placeholder
- Real: strings (kit names, groups, hazards, product names, SKUs, standards, why lines) from kits.json / products.json; cutouts from assets/cut; man = base.png + the three v0.2 dress layers (helmet, glasses, earmuffs) composited for step 3.
- Placeholder: only 4 industry backdrops exist (oil-gas, rig-drilling, construction, manufacturing); the other 14 slices reuse crops of those four. Respiratory has no dress layer yet (not on the man). Hi-vis vest cutout is the worn Scuta layer cropped, not a product shot. The helmet shows a pale halo from the layer feathering, and the glasses layer leaves grey patches under the eyes; both are draft artefacts, not design.
- Fonts were loaded from files (Barlow is not installed on this Mac); the web build uses Google Fonts as in BRIEF.md.
