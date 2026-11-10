# AVES Experience v0.4: how it was made, and how to build the rest (fresh chat, Higgsfield if wanted)

Read this, then `v0.4/DESIGN.md`, then `spikes/a-plus/NOTES.md` (the five rounds of his feedback). Project root:
`~/Documents/Claude/Sloane/aves-showcase` (git, origin PRIMENATHANI/aves-showcase, GitHub Pages). Python: `.venv/bin/python`.

## Run it
    cd ~/Documents/Claude/Sloane/aves-showcase && python3 -m http.server 8765      # then /v0.4/experience/
    node v0.4/tools/shoot.mjs http://127.0.0.1:8765/v0.4/experience/ v0.4/experience/shots 's1|?step=1|1440|900' ...
    node v0.4/tools/drive.mjs http://127.0.0.1:8765/v0.4/experience/               # real wheel + click test of scroll and details
Debug queries: `?step=intro|1..8|end`, `&d=-1.0` (seconds before the hold, catches the flight), `&det=6` (details open).
Live: https://primenathani.github.io/aves-showcase/v0.4/experience/  (site root still serves v0.3; his rule: local until "final").

## The pipeline (one kit)
    1  catalogue assets      v0.4/tools/catalogue_extract.py  (+ DesignCraft, see below)   -> spikes/a-plus/art/brand/approach-*.png
    2  catalogue copy        data/catalogue-rev7.json   (exact bullets, article numbers, linked image names per product)
                             assets/catalogue/<product>.png  (the catalogue's own product photos, from its Links folder)
    3  judgement file        v0.4/data/kit-<kit>.config.json  (names, hazard notes + site pins, callout anchors, shelf places, packs, backdrop)
                             v0.4/data/why.json  ("Why Choose AVES <category>?" per category)
    4  worn layers           v0.4/tools/clean_layers.py <kit>   (defringe the v0.3 layers; pouch rebuilt from the real photo)
    5  compose               v0.4/tools/build_kit.py <kit>      -> v0.4/experience/data/<kit>.json + assets/
    6  headings              v0.4/tools/typeset.py              -> assets/type/*.png (Avenir LT Std Black; needs catalogue-src.nosync/Document Fonts)
    7  page                  v0.4/experience/{index.html,app.css,app.js}  reads only data/<kit>.json  (`?kit=<id>`)
Order when something changes: 3 → 5 → 6 (typeset reads the names build_kit wrote) → screenshots.

## 1. Finding the exact catalogue assets (done 2026-11-11)
- Source: share / SSD `PDD - MARKETING/3. MARKETING/2 - MARKETING COLLATERALS/5 - FT & BRAND CATALOGUES/4 - AVES CATALOGUE/1 - CURRENT 2024-2026 AVES CATALOG/`
  `REV 7/AVES CATALOG REV_JC.indd` (588 MB, saved 2026-11-07: newer than the Aug 18 PDF) and `REV 8 - Restart/Assets/{Links (659 files), Document fonts}`. Read only; work on copies.
- DesignCraft (ArtCraft's InDesign-class app; MCP `mcp__designcraft__*`, CLI `designcraft-cli`) opens .indd directly: `file.open {path}`. It only reads inside the workspace, so the copy lives in `catalogue-src.nosync/` (git-ignored, `.nosync` keeps it out of iCloud). Fonts load from a `Document Fonts` folder beside the file (21 faces loaded).
- `file.exportIdml {path, embedImages:false}` → unzip → `Spreads/*.xml` (items, transforms, links) + `Stories/*.xml` (text). 70 spreads, 2,485 stories. Everything else is plain XML work:
  - Approach panels: `catalogue_extract.py strip` keeps only the six panels, DesignCraft exports that as PDF (vector), `pdftocairo -png -transp -r 300`, `catalogue_extract.py finish`. Two DesignCraft quirks handled there: it dropped the last letter of "Approach" (frames widened 22 %), and its green is lighter than Adobe's (shifted to 2,142,74 measured on Adobe's PDF).
  - Product copy: each product head story is followed by its bullet story ("Art. No. …" then one bullet per line).
  - Product photos: `LinkResourceURI` of the spread → file in `Links/` (transparent PNGs, 2,100–3,500 px).
  - Swatches (Resources/Graphic.xml): AVES green `r3g144b71` (C87 M19 Y97 K5), panel green PANTONE 347 C, mint `r179g221b199`, rule `c20m2y19k0`.
  - Fonts in use: Avenir LT Std Black/Roman (titles, body), Blippo Black (the AVES wordmark style), Blacksword ("The"), Arial family, Myriad Pro.
- Brand vectors (logo PDFs, industry icons, category icons): `…/10 - PRODUCT IMAGES & VIDEO LIBRARY/1 - BRAND MEDIA/2 - AVES/3 - BRAND VECTORS/`.
- Pack artwork: each product's PTF folder `…/A - PTF STANDARD SKUs/<category>/…/<product>/2 - LMP/…` (front faces cropped by hand: spikes/a-plus/NOTES.md round 3).

## 2. Catalogue facts and conflicts found (tell product management)
- Head opener was rewritten after the Aug 18 PDF: four Why-Choose points, not seven. v0.4 uses the four (read from the DesignCraft render of page 7).
- AV-841R NV: catalogue and polybag say 6-point ratchet; the website says 4-point. Catalogue bullet says "EN 379:2012"; the standards block says EN 397. v0.4 shows EN 397.
- AV-846R V carries the AV-841R article number (1891AV841R).
- AV-HM3093: catalogue article number 2536AV594; the website crawl has "2536AV60-1-1-1".
- Approach panels as printed: "Versitile", "Neccessary", "Hygenic", "Product Hands". Shown exactly as printed (his instruction).
- AV-831 has copy on page 116 but its photo is not in the Links folder under that number; v0.4 uses the PTF photo.
- HG-2230: the catalogue shows a pair, 18 inch, "Rolled cuff with orange lining"; catalogue has no article number beside it.
- Why Choose text for eye, ear, respiratory, hand, fall comes from the Aug 18 PDF text layer; only head was re-read from the newer .indd. Check the other five against the .indd before anything is called final.

## 3. Local image generation (Draw Things, free, offline; one generate at a time)
    DRAWTHINGS_MODELS_DIR=~/Flowtronix/models/draw-things draw-things-cli generate --offline --model flux_2_klein_9b_q8p.ckpt \
      --width 1792 --height 1024 --seed 4 --disable-preview --output out.png --prompt "…"
- Backdrop (v0.4/gen/run_bg.sh, seeds 4/9/17, picked 4): the site is lit from the FRONT ("the low warm sun is behind the camera so every structure is evenly front-lit … long soft shadows falling away from the camera … no people, no text"). Reason: the worker is studio-lit from the front; a backlit golden-hour site made him look pasted on.
- Stockroom rack (spikes/a-plus/gen/run_shelf3.sh, seed 12): "Tight front-on photograph of a premium retail display rack … exactly four wide deep shelves … warm LED strip under the front edge of every shelf … nothing on the shelves".
- Worn layers and the worker: v0.3 pipeline `tools/dress/` (FLUX.2 klein 9B for head/eye/hearing, Qwen Image Edit 2511 + Lightning for vest/harness/gloves), see `v0.3/experience/NOTES.md` and WORKLOG. klein follows additive prompts and ignores removal; Qwen removes but turns things front-on.
- Product cut-outs: rembg `isnet-general-use`; glass and clear plastic need a luminance key instead.

## 4. If the art is redone in Higgsfield (needs his go and a credit figure first)
Rules of his that apply: Draw Things first, Higgsfield only on his approval; `higgsfield … create` then `generate wait <id>` (never `--wait`, never auto-retry: both bill); prove the recipe on ONE item before fanning out and write the projected total before the run; the realism route that worked on STEGO was `nano_banana_pro` at 2k (2 credits) with real product photos as references and a passed sister render as the realism example (skill `stego-glove-experience`, RUNBOOK.md).
What to replace, in order of visible gain, all dropping into the SAME filenames so no code changes:
  1. `assets/dress/base.png` (896 x 1536, RGBA): the worker, front-on, arms slightly away from the body, navy coverall, Cavalier Captain boots, lit softly from the front. Everything else registers to this frame: keep pose and framing or every `box` in assets/dress/manifest.json moves.
  2. The eight worn layers of the kit (`assets/dress/layers/<id>.png`, full-frame RGBA, same registration). References: `assets/catalogue/<product>.png` + the PTF angles in `spikes/dress-v0.2-bench/refs-v2/<product>/`. Worst today: harness leg loops, tether, glasses temples, earmuff arms.
  3. `v0.4/gen/bg-front-s4.png` → a 2k+ site still per kit, front-lit, empty apron in the centre-left for the worker.
  4. The rack (`spikes/a-plus/art/shelf.jpg`, 896 x 1280): keep four boards at y 514 / 702 / 918 / 1124 px or update `shelf_place` in the config.
  5. Walk cycle (image-to-video from base.png, alpha webm): still a slide-in.
After any replacement: `clean_layers.py <kit>` → `build_kit.py <kit>` → shoot all steps → look at every frame.

## 5. Next kits
Copy `v0.4/data/kit-oil-gas.config.json` to `kit-<id>.config.json`; fill names (catalogue product heads), hazard notes (his sign-off needed: my wording), anchors, shelf places, packs (PTF LMP), backdrop. Add the products to data/catalogue-rev7.json (story ids via the IDML; method in section 1). Category bands and cards are shared; add a `sign-<id>`, `kit-<id>`, `end-<id>` title in typeset.py. 18 kits exist in data/kits.json with layers for all (assets/dress/manifest.json).

## 6. Not done / not checked
Safari, phone layout (desktop only), reduced motion in a real browser, real-wheel feel (only CDP wheel events), the "restart after closing details" he saw in the spike (never reproduced; hardened; needs his browser + device), Add to quote (no-op), kit change in place, exploded view (parked: parts not true to the product).
