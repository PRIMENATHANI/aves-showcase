# Exploded view spike: AV-GG40 (2026-11-06)
Asked via `npx skills use BetterPromptme/skills@exploded-view`. That skill is a wrapper around the paid BetterPrompt CLI (login + credits, Gemini image model); the prompt text lives on their server. Not used. Done locally with Draw Things, offline, per the Draw Things-first rule.
- run.py: round 1, free-floating prompt, klein 9B + Qwen Edit 2511 Lightning, 3 seeds each, 1280x896. None correct (lens stays in frame, gasket blobs, duplicated temples).
- run2.py: round 2, six parts in one row, 1536x768, 4 seeds each. Klein s8 is the usable one (lens, empty frame, gasket ring, bridge, two temples). Common miss: gasket drawn as a circle, not the frame outline; frame thinner than the real one. Qwen keeps the product truer but never separates the lens.
- Wall time: klein ~52 s, qwen ~83 s per image on the Studio.
Next for a final: generate each part on its own (klein, same ref) and lay them out in the Experience as a staged row (parts animate apart on scroll), labels in HTML. That fixes gasket shape and keeps every part exact.
