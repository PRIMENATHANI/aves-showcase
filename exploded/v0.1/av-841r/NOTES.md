# AVES TITAN AV-841R NV, exploded figure v0.1

Built with the Anatomy skill (framework-free path). Kit imported by absolute path from `~/.claude/skills/anatomy/`; nothing in the skill folder was changed.

## Size tier

**Hero.** 41 depth-sorted items, about 95 drawn solids (the shell counts as one), 171 recorded shapes. No WebGL, no 3D mode.

## Files

| File | What it is |
|---|---|
| `build.mjs` | The build. `node build.mjs [--light] [--audit] [--fine] [--quick] [--fast] [--points=4] [--fit=52..66] [--view=deg]` |
| `model.mjs` | The helmet as numbers: shell surface, suspension layout, the fit model. The page inlines this same file. |
| `surf.mjs` | My own helper, not part of the kit: draws free-form surfaces and webbing in the kit's picture (see "Straps"). |
| `live.js`, `page.css` | Interaction and the quiet card. |
| `check.sh` | Rebuilds both themes with the audit, audits both fit stops, runs the line check in five poses per theme. |
| `av-841r-light.html`, `av-841r.html` | The built pages (light is primary). |
| `shots/` | Screenshots, audit logs, line-check logs and the drive action files. |

## The one switch

`const POINTS = 6` at the top of `build.mjs` (or `--points=4`). Keys, crown straps, hub flats, height tabs, the legend and the caption all follow it. The 4-point build was made once and passes the audit and the line check (`av-841r-4pt-light.html`, `shots/points4-apart.png`).

## Parts list (7 assemblies, top to bottom when apart)

1. **Shell**: crown with the front-to-back ridge, the inset panel on the ridge's front, the two side shoulders, two accessory-slot bosses with their slots, the brim with its lip line and rolled edge. Six key pockets inside (recorded, never seen).
2. **Crown straps and hub**: one half strap per key (6), woven, ending flush on a flat of the hub; hub with two rings and a rivet per strap.
3. **Hanger keys** (6): key plate with slot mark and two pins, and the ledge the strap end sits on.
4. **Headband and height tabs**: band cut into near and far runs with two rim seams; 4 height tabs (2 front, 2 rear) with three holes each.
5. **Brow pad**: curved pad inside the front of the band, perforated.
6. **Ratchet housing and knob**: housing with lid line and two screws, ribbed knob, two tails that run from the side pivots into the housing, two pivot links with pins.
7. **Chin strap**: two clips, the webbing in two runs, one slide.

Stand: a plain low oval drum on a plate with four feet. The brim rests on its rim; the suspension hangs inside it.

## Checked against the photos, and what is assumed

Checked by eye against `aves-titan-av-841r-nv.png`:
- crown ridge front to back, inset panel on its front slope, stepped side shoulder, rectangular boss low on the side, wide brim with a rolled edge.

Checked by eye against `aves-titan-av-565r-suspension.png`:
- headband loop, crossing crown straps on a centre hub, hanger keys with a vertical tab, ratchet housing with a ribbed knob at the nape.

Assumed (not checked; none of it is printed on the figure):
- **Every dimension in `model.mjs`.** Proportions read off the photos plus typical hard-hat sizes (crown 270 × 228 mm, 164 mm tall, brim to 340 × 287 mm). No drawing or datasheet was used.
- **That the AV-565R is the suspension fitted in the AV-841R** (the brief's inference, carried over).
- **The rear of the shell.** The photo shows the front only. The figure is seen from the front-side, so the rear slope is mostly out of sight, but the ridge is drawn symmetric front to back and the inset panel only at the front.
- **How the keys, straps and tabs join.** In the product a strap loops through a slot in its key. Here the strap end sits on a ledge of the key and the key's head sits under a pocket in the shell, so that every joint can part vertically. The ledge and the pocket are my simplification.
- **The boss slot.** Drawn as one closed slot on top of each boss; the photo does not show the top face clearly.
- **The brow pad's shape.** A plain curved pad; the real pad (AV-724PU photo) has shaped ears. Perforation is drawn, the hook-and-loop strips are not.
- **The chin strap's fixing.** Drawn hanging from two clips under the band at the front sides; where the 2-point strap really clips is not in the sources.
- **The stand.** Invented.

## The fit model (the only number the figure computes)

The headband loop in plan = a fixed front half-oval + two tails along a rear half-oval + the straight housing. Turning the knob changes the rear half-oval's length; the readout is the length of that drawn loop, so it reads exactly 52.0 cm and 66.0 cm at the stops. The knob turns 1.5 turns over the range (assumed; no click count is shown). The real band flexes; the drawn one keeps its width and only its rear moves, so at 52 cm the loop is rounder than a head.

## Straps: how they were drawn

The kit has prisms (floor outline extruded up), turned parts and round tubes. It has no fabric, no webbing and no free-form surface. Two routes were used:

- **Bands that stand vertically** (headband, brow pad, ratchet tails, stand wall) are native kit prisms: `k.extrude` of a thin curved outline with `convex: false`. This worked well and costs nothing extra. A band that wraps something is cut where it turns edge-on to the viewer, so the cut falls on its own silhouette.
- **Webbing that arcs through space** (crown straps, chin strap) and **the shell** come from `surf.mjs`: it meshes a surface, shades it with the kit's own light and tone thresholds, marches the tone boundaries, merges each tone into region outlines, finds the silhouette and sharp edges, and hides what the surface hides of itself. It emits the kit's `SolidPaths` and the kit's CSS classes, so themes, the lit accent and the tone tokens all apply. The weave is faint ribs across the strap, edge to edge.

How well it worked: flat webbing reads cleanly at 1× and 4×, passes the line check, and is cheap (a strap is about 3 KB). What it does not do: twist, drape, fold, slack, stitching, or a strap lying on a surface. A fabric product (a harness, a glove) would need those, and the helper has none of them yet. The audit cannot see `surf.mjs` drawings; it sees the shapes recorded beside them (see below).

## Verification

- `node build.mjs --audit --fine` and `--light --audit --fine`: see `shots/audit-dark.txt`, `shots/audit-light.txt`.
- The explode is one value `t`; each assembly's share is a fixed function of `t` (`shareOf` in `build.mjs`, the same text runs in the page). The audit was given 51 values of `t` as strict states (not the kit's spring replay), so every frame `setExplode(t)` can show at a 0.02 step is checked for depth order and pass-through.
- The ratchet is a second motion the audit cannot replay. It was audited by building the rest pose at both stops (`--fit=52`, `--fit=66`: `shots/audit-fit52.txt`, `shots/audit-fit66.txt`). The live page orders the moving nape parts by adding their depth shift to the rest keys; that ordering between the stops was checked by eye only.
- `scripts/lines.mjs` through `drive.mjs` in five poses per theme (assembled, half, apart, apart at 52, apart at 66): `shots/lines-light.txt`, `shots/lines-dark.txt`.

## Known weak points

1. **The audit proves the recorded shell, not the drawn one.** The shell is recorded as 12 hollow terraces in 8 arcs each, cut from the same surface function, plus brim, roll and bosses. Agreement is within a few millimetres, not exact.
2. **Assembled, the suspension is invisible** (true to life). The ratchet and every part name only show once the helmet is apart, so the page brings it apart when the knob is turned or a part is picked.
3. **View.** 64° off the front axis, chosen so the knob reads when apart. The catalogue photo is a more frontal three-quarter view; `--view=48` gives that look and hides the knob behind its housing.
4. **Crown silhouette ends.** Where the crown's outline runs into the brim fillet it stops on the surface (a true fold line ending, but a line end all the same; the line check skips kit outlines).
5. **Shading on the ridge step** shows fine scallops at 4× where the tone boundary follows the mesh.
6. **Keys read as plain brackets.** Their real shape is not clear in the photo.
7. **Monochrome.** The product's suspension is grey and black on a white shell; the kit draws everything in one paper colour, so material contrast is lost.
8. **Knob drag target is small** on a phone; the Fit slider is the practical control there.
9. **File size** about 480 KB per page, half of it the shell and the 36 knob frames.
