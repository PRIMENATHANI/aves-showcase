# The AVES Experience v0.3 — design spec (2026-11-05)

Salman's concept, all 18 industries. Local generations are DRAFTS for design; finals come from Higgsfield later and drop into the same slots. Everything below is data-driven from `data/kits.json` (18 kits, 91 unique primary products) and `data/products.json`.

## 1. Flow (one page, four scenes)
1. **Landing: the sliced picker.** The viewport is cut into 18 vertical slices, one per kit, each showing a strip of that industry's working-site backdrop (`assets/dress/backdrops/<kit>.jpg`), grouped by `kit.group`. Hover/focus widens a slice (flex-grow, transform only) and reveals the kit name in Barlow Condensed. Click = the slice grows to fill the viewport (the backdrop becomes the scene), others slide away. Keyboard: arrows move, Enter picks. AVES logo top-left, line "Pick your industry". Game-entry feel: dark stage, one accent, no boxes.
2. **Walk-on.** The chosen backdrop fills the stage, slight parallax (backdrop `yPercent` slower than the stage). The man (base frame cutout, `assets/dress/base.png`, RGBA) enters from the right on a 0.9 s transform tween and stops centre-left on his stage mark. Kit title + `kit.intro` + the 3 top hazards fade in (SplitText words, once).
3. **Outfitting stage (pinned, scrubbed).** Left two-thirds: the man. Right third: the shelf — the kit's slots in dressing order, each slot a floating product cutout (`assets/cut/<primary>.png`) with name, SKU, one standards line, and alternates as small ghost cutouts under it. Scroll drives dressing: slot k's layer (`assets/dress/layers/...png`, RGBA box over the base, see manifest) fades/settles onto the man (opacity + 8 px y), the shelf item lights up and its cutout flies to the man (transform only), earlier slots dim. Base layer (Scuta vest + Cavalier boots) is on the man from the start of this scene; a small line under the shelf: "Base layer: hi-vis by Scuta · boots by Cavalier" with links to scuta and cavalier sites (external, new tab). Never call them AVES.
   Dressing order (Salman's concept: sister brands go on in the sequence): head → eye → hearing → respiratory → face → **vest (Scuta)** → fall → dropped → hand (→ cryo-body after hand). Boots (Cavalier) are in the base frame. Skip slots the kit lacks. The vest step is where the Scuta link appears; the boots line with the Cavalier link sits under the shelf from the start.
   Stacking (z) order is separate from donning order and comes from the manifest (`z` per layer): base < vest < harness < tether/pouch < respirator < glasses < face shield < helmet < earmuffs < gloves. Whichever layer has the higher z draws on top regardless of when it was revealed.
   Layers with `status: skipped` (e.g. glasses when the kit's respirator is full-face) stay on the shelf but never go on the man.
4. **Close.** Full kit on the man, backdrop darkens, line: "AVES. Your safety solutions provider. For every industry." then a row of the 17 other kits as small slices → click returns to scene 1 with that kit. "Add to quote" lists the kit's primaries (preview toast as in v0.2).

## 2. Data contract (what the generation pipeline provides)
```
assets/dress/base.png                      896×1536 RGBA, the man in coverall + Cavalier boots, cut out (rembg); boots are placeholder until a Cavalier pass is done — say so in NOTES
assets/dress/base-<kitId>.png              optional per-kit override (Higgsfield finals may shoot him per scene); the page uses it when present
assets/dress/backdrops/<kitId>.jpg         ≥1536×864 (upscale to 2048×1152 if the model balks), the industry working site, NO people, eye-level camera, muted, same style suffix + fixed seed for all 18
assets/dress/layers/<layerId>.png          RGBA, 896×1536, transparent except the item's region (feathered)
assets/dress/manifest.json
  { "frame": {"w":896,"h":1536},
    "layers": [ {"id":"<productId>" | "<productId>__on-<depProductId>", "product":"<productId>", "slot":"head|eye|…|vest", "dependsOn":"<productId>|null", "box":[x0,y0,x1,y1], "z":n, "model":"klein9b|qwen2511-lightning", "seconds":n, "status":"ok|missing|skipped"} ],
    "kits": { "<kitId>": {"order": ["<layerId>", ...]} } }
```
A layer that depends on another (cap-mount earmuffs on a helmet, face shield on a helmet, tether on a harness) carries the dependency in its id; the kit's `order` lists the exact layer ids to stack. Missing layers (`status: missing`) are shown on the shelf but not on the man; the page must never break on a missing file.

Higgsfield finals later replace `base.png`, `backdrops/*.jpg` and `layers/*.png` by filename; the site does not change.

## 3. Look and motion
BRIEF.md stage language applies (dark stage, Barlow Condensed + Barlow, Pantone 348 C accent lifted to #19b45a for small text, nothing in boxes, no emojis, never clip text, phone 390 wide with 16 px gutters). Motion per the web-motion skill: GSAP 3.15.0 + ScrollTrigger + SplitText (cdnjs), Lenis 1.3.26 (jsDelivr) on the GSAP ticker; transform/opacity only; scenes scrubbed `scrub: 1`, pinned with `anticipatePin: 1`; `prefers-reduced-motion`: no Lenis, no parallax, dressing steps are instant on scroll, picker has no grow animation. `ScrollTrigger.refresh()` after images load. Images lazy: only the picked kit's layers load.

## 4. Deliverable
`v0.3/experience/index.html` (+ `app.js`, `app.css` allowed), `v0.3/experience/NOTES.md` (what is real, what is placeholder). Served from the repo root over http (`python3 -m http.server 8765`), paths relative (`../../assets/...`, `../../data/...`). Verified headless with Chrome at 1440×900 and 390×844 at scroll positions: picker, walk-on, three dressing steps, close. No console errors.
