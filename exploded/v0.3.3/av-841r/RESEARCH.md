# TITAN AV-841R: how the helmet is really built (research for v0.2)

Sources (read only, copies in `exploded/research.nosync/av-841r/`, git-ignored):
- `ptf-841r-rev0.pdf`: Product Technical File, TITAN AV-841R FULL BRIM, PTF FT HP 1-001 1.0, 4 Feb 2026, rev B-R0 (16 pages).
- `ptf-565r-rev0.pdf`: Product Technical File, TITAN AV-565R 6-point ratchet suspension, PTF FT HP 1-008 1.0, 12 Feb 2026.
- `ptf-724pu-rev0.pdf` (brow pad), `ptf-729-rev0.pdf` (chin strap).
- Photos pulled from those files, in `img/`: `h5-004.png` (underside, suspension fitted), `h5-005.png` (front), `h5-006.png` (side, 2357 px), `h5-002.png` (suspension from above), `h5-000.png` (suspension, three-quarter), and page renders `p841-03.png`, `p841-05.png`, `p565-4.png`.

## Checked in the technical files (text)
- The AV-565R IS the suspension of the AV-841R (the 841R file lists it; the 565R file lists the 841R as a compatible hard hat). 6-point. This closes yesterday's inference. The website's "4-point" is wrong against both files.
- Shell: HDPE, full brim, no ventilation, **accessory slots: No**, rain trough: No. Inner length 240 mm, inner width 210 mm, inner height 140 mm. Peak 40 mm, brim 40 mm. Weight 295 g.
- Fit geometry: horizontal distance (headband to shell) 5–10 mm; wearing height 80–90 mm; vertical height (crown clearance) 45–50 mm. Headband 52–66 cm.
- Suspension: ratchet, "pull out to adjust, press to tighten the lock"; 2 levels of vertical height adjustment, 2 front and 2 rear; weight 107 g.
- Materials and colours: crown strap nylon, black, 2 cm wide, 4 mm thick. Top pad nylon with PVC backing, grey, 0.3 mm. Headband HDPE, ash grey. Ratchet knob POM, black. Brow pad AV-724PU: synthetic PU with ventilation holes + foam, grey, 30 × 8.2 cm, 3 mm.
- Chin strap AV-729 (2-point): nylon webbing, black, 1.5 cm wide, 40–50 cm; silicone chin guard 8 × 4 × 2.5 cm; quick-release snap-lock buckle (ABS, black); one slider; clips HDPE, ash grey. "Chin strap attachment: slot on the suspension point."
- Part names used by the files: crown suspension, crown strap, suspension lug (tab), smooth rotation wheel (ratchet), ventilated sweatband (the brow pad), top pad, headband.
- Standards: ANSI/ISEA Z89.1-2014 Type I, Class E & G; EN 397:2012+A1:2012.

## Checked on the photos (by eye)
- **Shell outside:** a raised centre ridge front to back; on its front a shallow inset panel shaped like a rounded trapezoid, narrower at the bottom. Faceted shoulders either side of the ridge. **Four** rectangular bosses on the crown wall just above the brim, at the four diagonals (front-left, front-right, rear-left, rear-right). The brim slopes down and out all round and ends in a plain edge.
- **Underside, suspension fitted:** the headband is one continuous oval ring sitting inside the crown. Grey plastic lugs sit at the four diagonal positions, exactly where the outside bosses are: the bosses are the outside of the lug pockets, not accessory slots.
- **Crown straps:** three black straps. Each runs from one lug, up over the crown, down to the opposite lug. All three cross at one point at the top, where they pass through slits in one grey rounded-square top pad. There is no hub and there are no rivets.
- **Lugs:** each strap end loops through a slot in a grey plastic lug. The lug is a flat tab that points up and outward from the headband.
- **Headband:** ash-grey plastic band. The front half carries the brow pad, which wraps over the band (grey woven face). The rear is a separate nape strap, lower than the front band, carrying the ratchet housing with the black ribbed knob pointing straight back. The nape strap joins the front band at a round pivot on each side.
- **Chin strap:** hangs below the band from the two side positions, buckle in the middle.

## Inferred (not shown in any source)
- Where lugs five and six sit. The outside shows four bosses and the suspension photo shows three straps, so two lugs must seat without an outside boss; the straps' layout puts them at the two mid-sides. An inference.
- How the height adjustment works in detail (which holes or steps). Draw the two-position tab without inventing a mechanism.
- All dimensions not listed above (ridge height, boss size, band width, knob diameter): scale them off the photos against the 240 × 210 × 140 mm shell.
- The rear of the shell (no rear photo).

## What was wrong in v0.1
- The suspension was cut into seven floating layers: strap stubs, loose brackets, two half rings. The real suspension is ONE assembly that drops out of the shell in one piece.
- A hub with rivets was invented; the real crossing is three straps through a top pad.
- Each crown strap was drawn as a half strap ending on a ledge; the real strap runs lug to lug over the crown.
- The headband was split into near and far runs; it is one ring with a nape strap.
- The bosses were named accessory slots; the file says the shell has none.
- Everything was white; the real suspension is ash grey and black inside a white shell.
- Sizes were typical values (270 × 228 × 164); the file gives 240 × 210 × 140 inner.
