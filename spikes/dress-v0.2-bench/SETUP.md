# AVES dressing — local setup after the 2026-11-05 bench

Verdict (Sloane's QC of comparison-grid.jpg, rows = runs, columns = items):

| Item | Best run | What it got right | Still off |
|---|---|---|---|
| Titan helmet | klein 9B, 2 refs (B-01) / 1 ref + PTF description (A-01) | full brim, centre rib, size on head | notches not visible |
| SG30 glasses | klein 9B, 1 ref + description (A-02) | green temples, grey wrap lens, worn open | arms slightly floating at the ears |
| HM3093 earmuffs | klein 9B A-03 (on the A-01 helmet frame) | arms into helmet sides, green AVES cups, over ears | arm geometry approximate |
| HG-2230 gloves | Qwen Edit 2511 + Lightning 4-step (r1/r2) | one-piece black rubber gauntlet, orange cuff, AVES print | sleeves roll / pose shifts a little; frame the man slightly smaller |

Rule of thumb: **klein 9B for rigid head items, Qwen Lightning for anything that wraps a body part (gloves, vest, harness).** Qwen alone makes headband earmuffs and loses the glasses' green; klein alone makes knit gloves.

## Runtime
- `draw-things-cli` 26.1023.0 (homebrew/core; the old tap build has no multi-reference). `DRAWTHINGS_MODELS_DIR=~/Flowtronix/models/draw-things`, always `--offline`.
- Multi-reference = repeated `--image`: first = canvas, rest = product references. Three images accepted (canvas + 2 angles).
- ALWAYS pass `--width 896 --height 1536` (Qwen zooms to a head shot without it).
- klein 9B: `--model flux_2_klein_9b_q8p.ckpt`, default steps, ~95–140 s/frame.
- Qwen: `--model qwen_image_edit_2511_q6p.ckpt --config-json '{"loras":[{"file":"qwen_image_edit_2511_lightning_4_step_v1.0_lora_f16.ckpt","weight":1.0,"version":"qwen_image"}]}' --steps 4 --cfg 1.0`, ~140–190 s/frame. LoRA from the Draw Things community zoo (static.libnnc.org), 847 MB, in the models dir.
- Seed 4242 for the chain; seed only changes details, not placement.

## References and prompt
- Use `refs-v2/<product>/` (1024 px on white, 2–4 angles) + `description.txt` from the PTF, trimmed to visible features. Website cutouts alone give generic products.
- Prompt shape: "The man from the first image now wears the <item> shown in the second [and third] image[s], <placement>. The <item> is: <description>. Full-length shot … exactly the same framing and camera distance as the first image. Same man, same face, same pose, same coverall with sleeves down to the wrists, same background."
- Exact commands: `klein-fidelity/bench.log`, `qwen-r2/bench.log`.

## Chain assembly (next build)
Generate each item against the clean base frame (head-stack items against the helmet frame), then box-merge only the item's region onto the running frame (v0.1's `merge()`), so face, backdrop and the man's size never drift across 9 frames. Qwen frames shrink the man ~3 %; the box merge hides that for gloves/vest, verify for the harness.

## Parked
- FLUX.2 dev: weights on disk (49.9 GB in the models dir) but the homebrew CLI's Metal kernels fail on bf16 (issue #152, 2026-10-23). Non-commercial licence anyway.
- mflux (MLX): installed in the session scratch venv, needs Salman's HF login for the gated klein weights. Only worth it if Draw Things speed becomes the bottleneck.
- Licences: FLUX.2 klein = non-commercial; Qwen Image Edit = Apache-2.0 (model) / Lightning LoRA Apache-2.0. For the public site either take BFL's commercial licence for klein or do the head items as cloud finals.
- Data discrepancies for IT: Titan suspension 6-point (PTF) vs 4-point (site); HG-2230 Cat III (PTF) vs Cat II (site).
