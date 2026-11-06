# Exploded view spike: AV-GG40 (2026-11-06)
Asked via `npx skills use BetterPromptme/skills@exploded-view`. That skill is a wrapper around the paid BetterPrompt CLI (login + credits, Gemini image model); the prompt text lives on their server. Not used. Done locally with Draw Things, offline, per the Draw Things-first rule.
- run.py: round 1, free-floating prompt, klein 9B + Qwen Edit 2511 Lightning, 3 seeds each, 1280x896. None correct (lens stays in frame, gasket blobs, duplicated temples).
- run2.py: round 2, six parts in one row, 1536x768, 4 seeds each. Klein s8 is the usable one (lens, empty frame, gasket ring, bridge, two temples). Common miss: gasket drawn as a circle, not the frame outline; frame thinner than the real one. Qwen keeps the product truer but never separates the lens.
- Wall time: klein ~52 s, qwen ~83 s per image on the Studio.
Next for a final: generate each part on its own (klein, same ref) and lay them out in the Experience as a staged row (parts animate apart on scroll), labels in HTML. That fixes gasket shape and keeps every part exact.

## Piece by piece (2026-11-06, his ask after rejecting the one-shot pick)
Checked against the SSD photos (refs/): the AV-GG40 is a full-frame foam-sealed eyewear, not the half-frame my round-2 pick showed. Parts: single wraparound lens, black full frame (two apertures, nose bridge, hinge lugs), removable foam gasket, two temples. No separate nose bridge.
- run3.py: klein 9B, each part alone from the real photos (3 seeds). Lens s3, gasket s3, temples s8 usable. Frame failed every seed (renders the whole glasses).
- run4.py: Qwen Edit removal prompts. Frame works (empty) but turns front-on. run5.py: klein re-angles the Qwen empty frame to three-quarter; q-frame-s8 → seed 21 is the pick.
- cut.py: rembg + largest component. Lens keyed by luminance instead (rembg shreds clear plastic). assemble.py: one row, scale by frame width, padded soft shadows, right temple levelled (-24°), labels optional.
- Result: exploded-v1.png (labels) / exploded-v1-nolabels.png. Caveats: parts are model renders consistent with the photos, not photographs of the real parts; gasket back face inferred; frame apertures show faint fill from the matte.
