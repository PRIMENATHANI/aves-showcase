# AVES Showcase spikes v0.1 (throwaway previews, 2026-11-01)

Three single-file HTML prototypes that show AVES Safety's full range ("everything in the safety arsenal").
Salman picked these three from a brainstorm. They are previews to react to, not product code.

## Shared facts
- Data: `data/products.json` (308 products). Fields: id, name, sku, category (Head, Eye, Face, Hearing, Respiratory, Hand, Cryogenic, Fall & Dropped Objects, Eyewash & Showers), sub, standards, material, color, bullets[], url, file.
- Cutout images: `assets/cut/<id>.png` (RGBA, white background removed, trimmed). Some keep a faint light drop shadow under the product; ignore for the spike. Originals in `assets/img/`.
- Logo: `assets/aves-logo.png` (646x167, dark logotype on transparent; invert or use white text if it does not read on dark).
- Category counts: Hand 59, Respiratory 58, Fall 45, Face 41, Eye 34, Head 31, Hearing 21, Cryogenic 17, Eyewash 2.
- Site line: "always value everybody's safety". Tagline for these pages: "Head to toe. One brand."
- Each prototype lives in its own folder under `v0.1/` and references assets relatively: `../../assets/cut/<id>.png`, `../../data/products.json`. Fetch the JSON at runtime (served over http; do not inline 308 products by hand). Paths must work when the folder is served by `python3 -m http.server` from the `aves-showcase` root.

## Look (shared stage language, same family as the STEGO try-on pages)
- Dark stage: `--bg:#07090c; --ink:#f3f5f8; --muted:#9aa3ae; --line:rgba(255,255,255,.12)`. Accent (v0.2 onward): the brand guide's Deep Green, Pantone 348 C; working sRGB `#008048` sampled from the catalogue PDF (approximate). On the dark stage lift it to `#19b45a` for small text so it passes contrast. (v0.1 used the logo-sampled `#00913f`.) Use the accent sparingly: counters, active states, one rule line.
- Type: Google Fonts "Barlow Condensed" (display, 600/700, uppercase, tight tracking) + "Barlow" (body). No other fonts.
- Nothing in boxes. No cards with borders and drop shadows. Products float on the stage with their own light; separation comes from spacing, scale and a soft radial glow, not containers.
- No emojis, no icon fonts. Any icon is an inline SVG you draw.
- Never clip text. Test at 1440x900 and 390x844 (phone). 16px side gutter on phone, no horizontal scroll.
- Factual readouts only: real counts from the JSON, real standards strings, real SKUs. No invented numbers, no self-praise copy ("world class", "unparalleled").
- One CTA per product state: "Add to quote" (a no-op button in the spike, styled, with a small toast "Added to quote (preview)").

## Motion (from Sloane's web-motion skill; mandatory)
- GSAP 3.15.0 + ScrollTrigger from cdnjs (`https://cdnjs.cloudflare.com/ajax/libs/gsap/3.15.0/gsap.min.js`, `.../ScrollTrigger.min.js`). Lenis 1.3.26 from jsDelivr (`https://cdn.jsdelivr.net/npm/lenis@1.3.26/dist/lenis.min.js`) for smooth scroll, wired to GSAP ticker (`lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add(t => lenis.raf(t*1000)); gsap.ticker.lagSmoothing(0)`).
- Animate transform and opacity only. Never animate width/height/top/left/box-shadow/filter on scroll.
- Feedback motion 150-400 ms; scroll scenes are scrubbed by the user's own scrolling (`scrub: 1`), pinned with `anticipatePin: 1`.
- `prefers-reduced-motion: reduce`: no Lenis, scenes static, entrances instant.
- Set initial states with `gsap.set` after JS loads so nothing flashes; call `ScrollTrigger.refresh()` after images load.
- Nothing loops or bounces for decoration. Every movement says where a thing came from or that the page heard you.

## Deliverable per concept
- `v0.1/<concept>/index.html` (one file, inline CSS + JS; CDN scripts only as listed).
- `v0.1/<concept>/NOTES.md`: 5 lines max. What is real, what is faked, what would need real assets.
- Verify yourself before reporting: serve from `aves-showcase` root with `python3 -m http.server 8765` (or another port if taken), load the page headless (Playwright is NOT installed; use `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --hide-scrollbars --window-size=1440,900 --virtual-time-budget=6000 --screenshot=/path.png http://localhost:PORT/v0.1/<concept>/`; for scroll scenes also screenshot with a `#t=` query your page reads to jump the scroll position, or take several with `--window-size` tall enough), check the console for errors and that images render. Report the screenshot paths. Do not open windows on Salman's screen.
