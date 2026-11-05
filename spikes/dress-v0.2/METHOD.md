# AVES dressing chain v0.2 (2026-11-05)

Nine frames, 896x1536, seed 4242, Mac Studio, Draw Things CLI 26.1023.0 `--offline`, one generate at a time. Base = `../dress-v0.1/inputs/f00-base.png`. No paste step: every item is generated against a canvas with its real product references (`../dress-v0.2-bench/refs-v2/`) and box-merged onto the running frame.

Rerun: `/tmp/aves-venv/bin/python run.py [step ...]` (generation + merge), `run.py remerge [step ...]` (merge only from `raw/`), `run.py sheet|preview|desktop`. Prompts, canvases, refs and wall times per generation are in `run.log`; mask bounding boxes and Qwen alignment values in `merge.log`. Hand-trimmed descriptions for the four body items: `descriptions/`.

## Merge (as built)
Mask = pixels where the generated frame differs from its canvas (blurred, threshold 24 klein / 28 Qwen), clipped to an expected region, opened, small blobs dropped, closed, holes filled, feathered, composited over the running frame (frames/NN.jpg q90; lossless chain in work/). Some items needed colour rules because Qwen re-renders the whole man: vest = yellow/silver/black-piping pixels only (solid between outer edges below the V); pouch = near-black changed pixels; gloves = dark grey/black + orange cuff + label white. Qwen frames are aligned to the canvas first (scale/offset fit on pixels outside the item region): measured scale 1.002-1.004, offset <= 1 px on every frame, so the ~3 % shrink noted in SETUP.md did not occur here; the correction applied is below visual threshold. Glasses mask excludes pixels that are already white hat in f01 (brim stays in front).

## Frames
| Frame | Model | Canvas | Refs | Gen time | Merged onto |
|---|---|---|---|---|---|
| f01 helmet | klein 9B | base | titan three-quarter + front | 143 s | base |
| f02 glasses | klein 9B | base | av-sg30 side-three-quarter | 94 s | f01 |
| f03 earmuffs | klein 9B | f01 | earmuffs front + side | 137 s | f02 |
| f04 vest | Qwen Lightning | base | scuta-vest front-three-quarter + front-flat | 189 s | f03 |
| f05 harness | Qwen Lightning | f04 | harness front + back | 193 s | f04 |
| f06 tether | Qwen Lightning | f05 | av-101373 lying + hanging-u | 193 s | f05 |
| f07 pouch | Qwen Lightning | f06 | escape-pouch side-strap + label-face | 191 s | f06 |
| f08 gloves | Qwen Lightning | base | gloves back-upright + three-quarter | 192 s | f07 |

Rejected generations (kept in `raw/rejected/`): f04 try 1 (the model removed the coverall: bare forearms, T-shirt, trousers only; the merged prompt of that run is the one now used, the vest is taken by colour so the arms are not), try 2 and 3 (prompt stressing the coverall made Qwen zoom to a three-quarter-length shot, vest distorted), f06 try 1 (tether on the picture's left hip, i.e. his right).
f06 prompt was changed to say his left hip is the right-hand side of the picture; the model then drew a tether hanging in a U between both hips instead of one hip.

## Defects visible (factual)
- f01: shell reads smooth with a faint crown rib; four notches not visible; brim width is wider than the head by about 80 px each side.
- f02: green temple arms with oval loops sit outside the face, floating over/under the hat brim at both sides, not reaching the ears; upper brow rail is partly hidden by the brim edge; lens is a lighter grey than the SG30 photo.
- f03: arms of the earmuffs rise over the hat dome as thin black bands and meet above the crown (headband-like), not into side slots; cups are large, green band visible, AVES logo not legible; cups cover the glasses' temple loops.
- f04: vest has two silver bands and shoulder bands, flapped pocket on one chest side, black piping; hem sits over the trouser pockets. Faint skin-coloured/yellow tint along the vest sides at chest and hip height. Collar and coverall sleeves are from the base frame; the vest shows a V neck with the coverall collar inside.
- f05: harness is drawn with a yellow criss-cross over the vest, black chest strap with gold buckle, one visible leg loop strap on each side that ends near the knee; the leg loops hang loosely rather than around the thighs; sternal strap sits at waist height; hardware is gold as in the photo. The dorsal D-ring side is not shown.
- f06: tether hangs as a U from a carabiner at each hip, the left-picture end reaching to the knee; coil orange/yellow with a green/white tape loop; carabiner and webbing sit partly in front of the hands. Not on one hip only.
- f07: pouch is a black glossy cylinder at the belt, horizontal, in front of the harness, centre-left rather than front right; its top edge is ragged where the mask cut it, a smear of dark at its left end; no strap, zipper cap visible at one end only. In the raw generation Qwen had removed the vest (navy chest with pockets), so only the pouch pixels were taken.
- f08: gloves are black with rough finger texture, orange cuff rim, AVES label on the back of the glove at the picture's right; gauntlets go over the coverall sleeves; a narrow blue-grey strip of the old sleeve shows outside the left glove and the picture's right gauntlet; glove label on the left glove not visible. Hands are in the base pose.
- Whole chain: head items come from klein, body items from Qwen, so skin/contrast of the neck/forearms differ slightly between sources; no drift in face, backdrop or the man's size across the nine frames (frames 00-03 identical outside the head box, later frames identical outside their masks).

## Files
`run.py`, `tools.py`, `run.log`, `merge.log`, `descriptions/`, `raw/`, `frames/00-08.jpg`, `contact-sheet.png` (9 frames + head/torso/hip/hand crops), `preview.html`, `work/` (lossless chain, masks, aligned frames). Copy at `~/Desktop/Sloane Previews/aves-dress-v0.2/`.
