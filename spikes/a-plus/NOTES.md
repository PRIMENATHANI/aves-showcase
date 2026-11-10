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
