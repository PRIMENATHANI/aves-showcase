# Qwen Image Edit 2511 + Lightning 4-step LoRA in Draw Things CLI (2026-11-05)

Route: Draw Things community zoo, not `models import`.
- `draw-things-cli models list` does not list LoRAs. The community-models repo (drawthingsai/community-models, loras/) has `qwen-image-edit-2511-lightning-4-step-v1.0`, file `qwen_image_edit_2511_lightning_4_step_v1.0_lora_f16.ckpt`, version `qwen_image`, default weight 1.0.
- Converted ckpt downloaded from https://static.libnnc.org/<file> (no token): 846,954,496 bytes (808 MiB), sha256 f8a3d906... matches the zoo metadata. Copied into ~/Flowtronix/models/draw-things/ (added only).
- Failed route: `models import` of lightx2v's HF safetensors (4steps-V1.0-bf16, 849,608,296 bytes, ungated): it treats it as a full model and fails with tensorWritesFailed. Stub file removed. The HF files are kept in dl/ (unused).
- Use: `--config-json '{"loras":[{"file":"qwen_image_edit_2511_lightning_4_step_v1.0_lora_f16.ckpt","weight":1.0,"version":"qwen_image"}]}' --steps 4 --cfg 1.0`. Exact commands in bench.log; scripts run.sh, all.sh.
- Steps/CFG: 4 / 1.0 (from lightx2v 4-step card and the zoo default; not independently verified against a card CFG value, the README does not state one).

Wall time (M2 Ultra, 896x1536, two reference images, GPU unshared during these runs): 137 s, 143 s, 137 s per frame.

Outputs (my reading of each image, seed 4242):
- 01-glasses-lightning.png: full body boots to above head, framing matches base. Glasses worn over the eyes, but they render as a solid black wraparound visor with reflective lenses and no visible green arms or AVES mark; reference is grey lens, dark top rim, green arms with AVES logo. Item present, only loosely resembles the reference.
- 02-helmet-lightning.png: full body in frame. White full-brim hard hat on his head, glossy, wide brim, matches the reference well. Face, coverall, pose unchanged.
- 03-gloves-lightning.png: full body in frame. Black rubber gauntlet gloves on both hands with orange cuff edge and AVES text on the right glove, matches the reference. Flaw: the coverall sleeves are now rolled/bunched at the cuffs instead of the gloves' cuffs sitting over the sleeves, and the hands are at hip level, so the base pose changed slightly.
