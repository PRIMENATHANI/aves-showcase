# Draw Things multi-reference bench (2026-11-05)
Canvas = dress-v0.1/inputs/f00-base.png (896x1536); reference = white-flattened cutout as second --image; seed 4242 unless stated; --offline. Commands and wall times: bench.log. Sheet: contact-sheet.png. Titan stem used: aves-titan-av-841r-nv.

Both --image flags were accepted by klein 9B and Qwen Edit 2511. Output size = canvas (896x1536). In all klein outputs the grey backdrop shows a mottled concrete texture the base frame does not have.

## klein 9B (about 93-104 s per frame)
- 01-helmet: white wide-brim hat sits on the head, brim about 1.9x the head width, covers the hair and top of the forehead. Face, coverall and framing look unchanged.
- 02-glasses: dark green-grey wraparound lenses sit on the face over both eyes. The arms are drawn as two thin green loops floating horizontally outside each temple; they do not reach the ears.
- 03-earmuffs (canvas = 01 output): one black/green cup over each ear. A black headband arches over the top of the hat, with black arm pieces down the hat sides. The hat brim is narrower than in 01 and the hat reads as a cap shape. Not seen: the arms entering slots on the hat.
- 04-gloves: black gloves on both hands, fingers down, with long dark gauntlet cuffs up the forearms (no orange rim visible). Printed text on the backs is present but garbled.
- 05-glasses seed 23: same placement as 02; lenses slightly lighter with reflections; the floating arm loops sit at different heights and are asymmetric.

## Qwen Edit 2511 q6p, glasses only (1490 s)
- 06: camera is zoomed to a head-and-shoulders close-up (framing not kept, face much larger). Glasses worn on the face over the eyes, black frame with green tips reaching the temples; lenses dark with mottled marks. No floating arms. Backdrop flat grey.

## FLUX.2 dev q6p
Download done (6521 s): flux_2_dev_q6p.ckpt 25,604,034,560 B + mistral_small_3.2_24b_instruct_2506_q8p.ckpt 24,321,839,104 B = 49.9 GB; no other file in ~/Flowtronix/models touched (listing diff in pre/post-dl-listing.txt).
Generation FAILED on the first frame (22 s): Metal compile error "unknown type name 'bfloat'" in IndexSelectKernel (draw-things-cli 26.1023.0, macOS 27). See flux2dev/bench.err. No flux2dev frames exist. Stopped per instructions.
