# AVES Showcase — WORKLOG

## 2026-11-01 — brainstorm → three spikes (v0.1)
**Ask (Salman, chat):** "showcase the product in some way and AVES's ability to provide everything in the safety arsenal… brainstorm". He picked concepts 2 (Arsenal Wall), 3 (Exploded Kit), 5 (Turntable) and said "Build the ideas and show me what they look like."

**Done**
- Crawled aves-safety.com (WooCommerce, direct curl works with a Safari UA; the wc/store API and sitemaps are 404). 39 category URLs → 308 products with name, SKU, category, standards, material, colour, bullets, image. `data/products.json`.
- Downloaded the 308 product shots to `assets/img/` (24 MB; 280 png on WHITE backgrounds, 28 jpg). `tools/knockout.py` (venv at /tmp/aves-venv: pillow, numpy, scipy) flood-fills near-white from the border + clears enclosed flat-white holes (harness interiors) while keeping shaded white bodies (white helmets) → `assets/cut/` (RGBA, trimmed, 60 MB). QC'd two contact sheets: usable for previews; a few keep a faint source drop shadow.
- `BRIEF.md` = shared stage language (dark stage, Barlow family, AVES green #00913f from the logo, no boxes, GSAP 3.15 + Lenis 1.3.26, reduced motion) + verification rules.
- Three Opus builders dispatched in parallel, one per concept, folders `v0.1/arsenal-wall`, `v0.1/exploded-kit`, `v0.1/turntable`.

**Site flaws seen while crawling (IT's, reported to Salman):** comments open with spam on the homepage, "Lorem ipsum" on product pages, 0,00 AED price on Titan, broken characters in bullets.

**Not checked:** whether the share holds proper product renders (PTF tree has PTF/LMP/TPC/COC/MSDS folders, no obvious image folder). No worn renders or 3D exist as far as I can see.

**Results (same day, ~11:45)**
- Arsenal Wall: strongest. All 308 in one 1440x900 frame (cells ~48 px, under the 56-72 brief), lift + hazard filter + rails work, console clean. Builder's data notes: 77 products without standards (29/31 Head), 34 without bullets, ~14 cutouts with holes (clear shields, some respirators), 11 near-black products sink into the stage, "arc flash" matches 12 Face only.
- Exploded Kit: opening exploded frame is the best single image of the three; assembled end frame has stickers-on-a-silhouette at the head. Kit = av-717p, av-sg50, av-hm3093, n95-av800, av-vb65-av-fs13, full-body-harness-2, single-lanyard, av-101420 (tool belt, no footwear in data), hg-1104.
- Turntable: weakest, as predicted before building: head cluster piles up, mismatched gloves, spin is a sine parallax of flat cutouts. Page chrome (rails, readout, phone sheet) is clean.
- Preview: `v0.1/index.html` + local server on 127.0.0.1:8765 (python http.server from the aves-showcase root; pages fetch products.json so file:// does not work). Launcher + 5 screenshots in `~/Desktop/Sloane Previews/aves-showcase-v0.1/`.
- Verification trap (from the turntable builder): Chrome `--virtual-time-budget` screenshots catch GSAP entrances half-done; use a CDP script that waits in real time (`scratchpad/aves/tt-tools/cdp.mjs`, session-scoped). Headless Chrome clamps width to 500 px: shoot phone views through an iframe.

**Next:** Salman's verdict on the three. If the Wall goes forward: real renders for the broken cutouts, standards for Head, a proper hazard taxonomy instead of keywords, and an IT handover like the STEGO ones.
