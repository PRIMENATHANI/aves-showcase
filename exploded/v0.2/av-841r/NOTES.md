# AVES TITAN AV-841R, exploded figure v0.2

Rebuilt from `RESEARCH.md` (the technical files) after v0.1 was rejected. v0.1 is untouched in `exploded/v0.1/`.

## Size tier
**Hero.** 43 depth-sorted items, 158 recorded shapes. No WebGL, no 3D mode. Kit imported by absolute path; nothing in the skill folder changed.

## Files
`build.mjs` (the build: `--light`, `--audit`, `--fine`, `--quick`, `--fast`, `--fit=52..66`, `--view=deg`), `model.mjs` (the helmet as numbers, also inlined into the page), `surf.mjs` (my helper for the shell and the webbing, unchanged from v0.1), `live.js`, `page.css` (card and the material layer), `check.sh` (both themes with the audit, both fit stops, line check in six poses per theme), `shots/`.

## How it comes apart (one value, 0 to 1)
Each assembly has its own window of `t` (`PIECES` in `build.mjs`; the page runs the same function).

| t | What moves | Direction |
|---|---|---|
| 0–0.25 | Shell | up |
| 0.25–0.45 | nothing: the whole suspension hangs below as one assembly | |
| 0.45–0.60 | Chin strap AV-729 | down |
| 0.54–0.70 | Sweatband AV-724PU | forward off the headband |
| 0.66–0.86 | Crown suspension: three straps, top pad, six lugs, as one piece | up |
| 0.84–1 | Ratchet wheel | straight back |

Six assemblies. The headband ring with its lower rear strap, pivots and ratchet housing never moves. The camera sits close on the assembled helmet and pulls back as the shell lifts.

## From the technical file (used as given)
Shell inner 240 × 210 mm, brim 40 mm; crown strap 20 × 4 mm; chin strap webbing 15 mm; headband 52–66 cm; 6 points; materials and colours of each part; part names; standards.

## Scaled off the photos (not in the file)
Ridge height and width, panel outline, shoulder step, boss size, band height (28 mm), lug size, top pad size (88 mm square), knob diameter (33 mm), nape strap height, pivot size, chin strap drop. Shell height is drawn 150 mm outside over the brim's edge (134 mm of crown over a 16 mm brim drop): on `h5-006.png` I measured crown height over crown length at about 0.55, and this gives 0.545. The file's 140 mm inner height has no stated datum, so this is a reading, not a checked figure.

## Assumed
- Lugs five and six at the mid-sides (RESEARCH's inference).
- The rear of the shell (no rear photo): ridge drawn symmetric, panel at the front only.
- Each lug hangs on the outside of the headband and lifts off it vertically; two dots on each lug stand for the two height positions. The mechanism is not drawn.
- Ratchet travel: 1.5 turns across the range. No click count is shown.
- The chin strap's clips sit on the headband under the two side lugs (the file says "slot on the suspension point").
- The shadow is a floor 150 mm under the brim; there is no stand, so the helmet floats over it.

## The fit model
The loop round the head, in plan: the headband ring from pivot to pivot round the front (fixed), the nape strap's two tails along a rear half-oval, and the straight housing. The knob changes the half-oval's length; the readout is the length of that drawn loop, exact at 52.0 and 66.0 cm. The rest pose is 62 cm so the wheel shows behind the ring.

## Materials
`page.css` redefines the kit's paper, top, four shade and line tokens per part class (`m-white`, `m-ash`, `m-grey`, `m-black`). Same fills in both themes; only outline tones change in dark. Black parts are a dark grey ramp (#1e1f22 to #4b4d51) so the four tones still show.

## Webbing and bands: how they were drawn
- Standing bands (ring, sweatband, nape tails) are kit prisms (`k.extrude`, `convex: false`). The ring and the sweatband are each cut where they turn edge-on to the viewer, so the near and far runs sort separately; the cut is on the silhouette and adds no line.
- Crown straps and chin strap come from `surf.mjs` (flat section swept along a 3D path, kit tones, weave ribs edge to edge).
- **Each crown strap is three drawn pieces: leg, run over the pad, leg.** The two joins are at the pad's slits. A single arc per strap cannot be depth-ordered against the other two where they cross.

## Verification (see `shots/`)
- Audit, both themes, default 0.25 grid, 101 values of `t` as strict states: `audit-light.txt`, `audit-dark.txt`. At the fit stops: `audit-fit52.txt`, `audit-fit66.txt` (0.5 grid).
- Line check, six poses per theme (assembled, pose a, mid, apart, apart at 52, apart at 66): `lines-light.txt`, `lines-dark.txt`.
- The audit proves the recorded shapes. The shell is recorded as 10 hollow terraces of 8 arcs plus three brim rings, cut from the drawn surface; the shell is declared the audit's ground because there is no stand.
- The ratchet's motion between the stops is ordered by depth shift in the page and was checked by eye only.

## What still does not match the photos
1. **Crown crossing.** Now reads as three straps crossing over the pad. Still different from `h5-002.png`: the real straps pass through slits in the pad; mine lie on top of it, stacked 4 mm apart, and each strap is three drawn pieces whose two joins show as a thin line where the strap crosses the pad's rim.
2. **Lugs.** Plain rectangular tabs with a black patch for the strap's loop. The real lug is a shaped clip with an open slot; the strap does not visibly pass through mine.
3. **Bosses.** Rectangular blocks with rounded corners. The real ones are wedges whose top slopes into the crown wall.
4. **Shoulders.** One soft step each side; the front photo shows flatter, more faceted planes.
5. **Sweatband.** Covers the front ±50° only, outside face and top lip. The real one is 30 cm long and wraps the inside face too; the inside is left bare so that it can slide forward.
6. **Nape strap.** Drawn as a lower ring inside the headband joined by a straight link; the photo shows a curved arm dropping from the pivot.
7. **Chin strap.** No silicone chin guard; buckle and slider are plain blocks; seen nearly edge-on from this view.
8. **Height adjustment.** Two dots per lug, no mechanism.
9. **View.** 68° off the front axis. `h5-000.png` is taken from the rear quarter (knob towards the camera); mine shows the knob side-on at the back and the sweatband's outside at the front.
10. **Shell gloss and brand marks** are not drawn.
