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
