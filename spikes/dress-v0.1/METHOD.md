# AVES dressing spike v0.1 — method (2026-11-04)

Throwaway spike for Salman's concept: pick an industry → a man on the outfitting stage → scroll puts the kit on him one item at a time (head to hands, harness in between). This folder holds everything needed to rerun or extend it. Verdict from Salman pending.

## The concept as agreed in chat (his words, my calls marked)
- Landing = industry picker, graphically animated, "the page sliced into separate pieces… like a video game entry". (Not built yet.)
- After picking: the man walks into that industry's site and stands on the turntable outfitting stage. Backdrop = the industry working, parallax and animation as you scroll. (Not built yet.)
- The kit's SKUs sit on a shelf, by category. Scroll puts them on one by one.
- Close line: "AVES. Your safety solutions provider. For every industry." — wording to be worked out as we go.
- Turning is optional: "if turning seems too difficult… just straight up". Spike is straight-on.
- Kits = our picks (data/kits.json, 18 kits, each slot primary + alternates). One goes on, the rest stay as options.
- Base layer from sister brands, not called out as AVES: shoes = Cavalier, hi-vis = Scuta; they go on in the sequence too and link to the brand websites. His note: "a lot of brands in my arsenal can be used but not obviously noted".
- MY CALL: the man wears the primary only; alternates swap on the shelf/quote, never on the man (7 slots × 3 choices = 2,187 combinations otherwise).
- MY CALL: order helmet → glasses → helmet-mounted earmuffs → vest (must precede harness) → harness → tool tether → escape-hood pouch at belt (an escape hood would cover the head stack, so it is carried) → gloves. Boots are in the base frame.

## Pipeline that works (FLUX.2 klein 9B, Draw Things CLI, Mac Studio M2 Ultra 64 GB)
1. Base frame: `draw-things-cli generate --offline --model flux_2_klein_9b_q8p.ckpt --prompt-file base-prompt.txt --width 896 --height 1536 --seed 4242 --output inputs/f00-base.png` (~40 s). Camera, pose, crop are then fixed for every frame.
2. Each item: paste the REAL product cutout (`assets/cut/<id>.png`, rembg) at its anchor on the previous frame → klein edit at FULL strength with `--image` (prompt names the item + "keep everything exactly the same") → keep only that item's box from the edit, feathered, composited over the clean previous frame (`merge()` in run.py). ~55 s per item.
3. `run.py` does steps for frames 2–8 from `inputs/f01-helmet.png`. `python3 run.py` runs all; `python3 run.py f03-earmuffs f04-vest …` reruns named steps (later frames must be rerun too, they build on earlier ones). `SEED=23 python3 run.py f08-gloves` tries another seed. Outputs go to `work/` (git-ignored).
4. Helmet frame f01 was made by hand: `inputs/f01-helmet-paste.png` (Titan cutout, width 262, centred x 448, top = 150 − 0.80·h) → klein edit (`f01-helmet-raw.png`) → merged over the base in box (280,0,620,215), feather 9 (`f01-helmet.png`).
5. Env: `DRAWTHINGS_MODELS_DIR=~/Flowtronix/models/draw-things` (Mark's install, 60 GB; never delete his models).

## Anchors in the 896×1536 base (x centre, top y, paste width)
Head centre x 448, hair top y ≈108; helmet brim y ≈150. Glasses 150 wide at (448,182). Earmuffs 196 wide at (448,168), mask = two ear boxes only, hard edge (feather 6) at y 286. Harness 300 wide, top 300. Tether 70 wide at (600,700). Gloves 95 wide, flipped vertically (fingers down), at x 270 and 626, top 790. NEVER mirror a cutout with print on it (text reverses).

## What failed, and why (do not retry)
- Text-only edits: the model draws a generic product (Qwen gave a vented cap helmet; klein a sun-hat brim).
- Product placed beside the man as a reference on a wider canvas: klein restages the whole frame. Unusable for in-place frames.
- Partial strength (`--strength` 0.45–0.9) with klein: leaves the paste untouched, reads as a sticker. Klein integrates only at full edit strength.
- Chaining full-frame edits: by frame 8 the face is mangled and the backdrop is coloured noise (repeated encode/decode). Fixed by the box merge.
- Qwen Image Edit 2511 (q6p, 17.6 GB, Mark's): identity good, but zooms the camera; 28 s/step → 15–25 min per frame. A parallel `models ensure` download blocks `generate` (it waits on the lock): always pass `--offline`.
- FLUX.2 dev (q6p 25.6 GB + Mistral Small 3.2 24B encoder 24.3 GB): brim far too wide, ridge kept; worse than klein. Deleted, with qwen_image_edit_2511_q8p (all three downloaded 2026-11-04, ~71 GB).
- Earmuffs: the model adds a second pair or mic booms; prompt "exactly one pair… no microphone", mask only the ear boxes with a hard lower edge.
- Generated print on gloves garbles or mirrors on every seed: rendered plain ("no printed text or logos").

## Known defects in v0.1 frames
Titan gets a ridge the real one lacks; glove print missing; faint green sliver at the jaw; vest hem fades soft into the coverall; vest and boots are generic stand-ins (no Scuta / Cavalier references yet; if they exist they are on the share, read-only).

## Next (waiting on his verdict)
1. His verdict on the direction (photo-real, straight-on).
2. Product accuracy: local klein is close, not exact. Likely route for finals = Higgsfield with clean product references (GPT Image 2 took references well on the STEGO brochures) — only after his approval (Draw Things first rule; credits).
3. Scuta vest + Cavalier boot references.
4. Then the landing slices and the working-site parallax backdrop (web-motion skill: GSAP + Lenis). Backdrop plan to test: man rendered on plain grey, cut out, composited over a parallax site.

## Files
- `run.py`, `base-prompt.txt` — the pipeline.
- `inputs/` — base frame and the helmet frame chain inputs (PNG, needed to rerun).
- `frames/00–08.jpg` — the nine frames; `contact-sheet.png`; `preview.html` (scroll preview, open in a browser; `?f=5` jumps to a frame).
- `compare-*.png` — the model tests (Qwen text-only, klein strength sweep, paste vs klein vs FLUX.2 dev).
