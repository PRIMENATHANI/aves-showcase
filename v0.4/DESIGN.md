# The AVES Experience v0.4: design record (Oil & Gas)

Built 2026-11-11 from the A+ spike (spikes/a-plus, five rounds with Salman on 2026-11-10) after an independent critique
(a second model, read-only, shown the three spike versions and the catalogue). This file records what was decided and why.

## His asks, in his words
- "The transitions. The outfitting. The kits. The stock on shelves. The background of a working site matching the kit. Everything needs to be top notch and A+."
- Stockroom sign: "Oil and Gas PPE Kit · AVES · Your Total Safety Solutions Partner", the right logo.
- Why the item is needed and where, and its benefits, "floating" on the product and the worksite. No boxes.
- Shelf: no multiples; packaging from the PTF.
- Product details + Visit product page on every product; details as well designed as the rest; closing it must not restart the page.
- "The AVES Approach: I need it to be exactly as it is in the catalogue."
- Category titles "more pronounced, probably at the top".
- "Why Choose AVES" of every category on the page.
- Rejected: Site Audit (find-the-hazard lens) concept. Do not re-propose.

## The critique's five problems and what was done
1. Approach panel was a redraw → now the catalogue's own artwork, extracted from the InDesign source (tools/catalogue_extract.py).
2. Two green banners fighting, six weights stacked on the left → one green element on the left (the category band); the kit sign is a dark plate; the left column is band, one hazard line, three callouts, product block.
3. Callouts looked generated (blobs, leaders across the body, data junk) → no blobs (text shadow only), leaders draw outward from the product, copy is the catalogue's.
4. No type system → headings are Avenir LT Std Black (the catalogue's title face) shipped as pictures of the words; everything else is Nunito Sans. Nothing under 12 px except shelf tags (11.5).
5. "Why Choose" only as a takeover → while an item is held, the shelf dims and a mint catalogue card rises in its place with the category's Why Choose text and the Approach artwork. The worker never leaves the screen.

## Composition (1440 x 900 reference)
- Left 56 %: worker on the site. Category band top left (bleeds off the edge, round category icon overlapping its end). Hazard line under it (amber triangle, bold hazard, where). Up to three benefits pinned to the product. Product block bottom left: step, slot, SKU; name in the title face; descriptor; standards on one line; Product details (button) + Visit product page (link).
- Right 44%: stockroom. Dark sign (logo lightbox, kit name, tagline, industry tile), "n / 8 issued from stock" + progress. Rack with one of each item in front of its real pack.
- Timing per item: camera pushes to the body zone → item lifts and flies → layer lands → band (first item of a category) → product block → hazard line, leaders, benefits → shelf dims, card rises → hold (snap label) → all out. Band stays while the category continues (fall + dropped objects share one band and one card).
- On demand: product details (full-stage view: photo, how it ships, specs, standards, why x2, all catalogue bullets, the full Why Choose text, the Approach artwork). Page scroll is untouched while it is open.
- Motion rules: transform and opacity only; scroll-scrubbed with snap to labels; nothing loops; `prefers-reduced-motion` turns smooth scroll off and makes the details view instant.

## Decisions that are mine (he has not seen v0.4 yet)
- One composition instead of the three spike versions.
- Why Choose text lives on the card, not on the photo. Where a category's text is longer than the card at 13 px (eye: seven points), the card shows what fits and says "+ n more in Product details"; the full text is always in Product details.
- Dropped objects sits under "Fall Protection & Dropped Objects" (the catalogue's own category title) and shares the fall card.
- The Scuta vest has a band ("Hi-Vis Workwear", my title: not a catalogue category) and no card.
- Site lit from the front (sun behind the camera) so the studio-lit worker belongs in it. The warm/cool overlay of the spike is gone.
- Kit change in place ("Next site") left out until a second kit is built to this standard.

## Known weak points (local drafts; the Higgsfield list is in HANDOVER.md)
- Worker and worn layers are still the v0.3 local drafts, edge-cleaned. Harness leg loops and the tether read as generated up close.
- The glasses layer is masked to its front; no temples.
- Shelf: harness and tether have no pack artwork on the SSD.
- Hazard pins: only shown when the place is on screen and clear of the product; positions are by eye.
- Not checked: Safari, phone, reduced motion in a real browser, a real hand on a real wheel.
