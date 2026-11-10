# A+ spike: Oil & Gas (2026-11-10) — THROWAWAY
His ask: transitions, outfitting, kits, stock on shelves, site backdrops, all A+. One kit taken further to judge direction before a formal spec. Desktop only. Not wired into v0.3.

Open: serve the repo root, `/spikes/a-plus/`. Debug: `?step=intro|1..8|end`, `&d=-0.6` (seconds before the label, catches the flight), `?step=end&swap=1`.

What it shows
- Stockroom rack (art/shelf.jpg, klein 9B seed 3) with the kit's eight products on the boards (trimmed cutouts in art/cut); each lifts off and flies to the man.
- Camera: `.cam` (man) and `.bd` (site, moves 34 % as much) are driven to the body zone of each layer box; caption lower left says name, SKU, standards, why.
- Site: full colour golden-hour backdrop (art/bg-oil-gas.jpg, klein 9B seed 3, 1792x1024), drifting haze, warm/cool soft-light on the man masked to what he wears.
- Kit change in place: "Next site: Construction" wipes the backdrop and swaps the layers on the man.

Findings for the real build
- The "grey smear" glasses were a z-order fault: the helmet layer (z 70) paints over the glasses (z 50). Glasses above the helmet (z 75) + temples masked off = reads as glasses. No regen needed.
- Shelf cutout for the escape hood is the yellow hood, the worn layer is the black pouch: the flight changes product mid-air. Needs one image choice.
- The man is studio-lit from the front; the site is backlit. CSS grade helps a little; a relit base is the real fix.
- Close-ups magnify layer halos (vest, earmuffs) and the pouch's dark fringe.
- Not checked: scroll feel with a real wheel (only fixed frames over CDP), Safari, phone, reduced motion.

## Round 2 (2026-11-10 evening, his four additions)
- Stockroom sign: official logo (black + green V, from the SSD `3 - BRAND VECTORS/LOGO/AVES.pdf`, same art as assets/aves-logo.png) on a cream plate, "Oil & Gas PPE Kit", "Your Total Safety Solutions Partner" (his wording). Header logo on the dark photo = art/aves-logo-rev.png (letters white, V green; MY derivation, the brand guide is an .indd I could not open: reversed version not checked).
- Caption is two columns: product + buttons | "Why on this site" (need + where) + three catalogue benefits. NEED in app.js is MY WORDING (the catalogue has no per-product application data); benefits are the aves-safety.com bullets verbatim (art/details.json; source typo "So rubber nose bridge" on AV-SG30 kept).
- Shelf: new rack (klein 9B seed 12, art/shelf.jpg, gen/run_shelf3.sh), bigger items, two dimmed units of stock behind each (they stay when the front one is taken), light pool, name labels on the board lips.
- Product details drawer (photo, SKU, standards, material, colour, why, all bullets) + "Visit product page" (products.json url, new tab) on every caption and every row of the closing list. Scuta vest: details only, no link (his rule: no sister-brand URLs).
- `?step=6&det=6` opens the drawer for screenshots.

## Round 3 (2026-11-10 night, his five notes)
- Sign: lightbox panel for the official logo, hung on two cables, dark plate with aisle, kit name, tagline, "n/8 issued".
- Callouts: "Why on this site" card top left with an amber pin + leader to the place in the site photo (NEED[slot][2], fractions of bg-oil-gas.jpg; leader only when that point is on screen and clear), three benefit cards pinned to the product with leaders (ANCH per slot, fractions of the worn layer box; my placement by eye). Caption bottom left is now product + buttons only. Zoom for wide zones capped at 25 % of the width so cards fit.
- Shelf: one of each, standing in front of its real pack: front faces cut from the PTF `2 - LMP` artwork (art/pack: helmet polybag, earmuff box, glasses polybag header, glove polybag, Scuta vest insert card). Escape hood sits next to its black pouch and the pouch is what flies. Harness AV-831 and tether AV-101373: no pack artwork found on the SSD (AV-831 folder not found at depth 5; the tether folder has no LMP). Sources copied to pack-refs/ (git-ignored, big).
- Product photos: art/hero = rembg cuts of the PTF photos in spikes/dress-v0.2-bench/refs-v2 (819 px), used on the shelf, in flight and in the focus view.
- Product details: full-stage focus view (#pd) instead of the drawer: big photo, "How it ships" pack, spec strip, standards with ticks, why x2, numbered features, Visit product page.
- "Restart after closing details" (his report): NOT reproduced. tools/drive.mjs drives headless Chrome with real wheel + mouse events: scrollY 3811 before open, while open, and after close; scroll continues after. Hardened anyway: no lenis.stop/start, wheel/touch swallowed by the view, scroll position restored on close if it moved, focus returned with preventScroll, resize rebuild ignored unless the stage really changed (and never while the view is open) and it keeps its progress. Need his browser/device.
- Data conflicts seen: helmet polybag label says "Type: 6-Point Ratchet" for AV-841R, the website bullet says "4-point ratchet suspension"; glove bullet reads "Natural TM rubber fully dipped TM" on the website (kept verbatim).
