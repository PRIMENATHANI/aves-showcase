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

## 2026-11-01 (evening) — v0.2, the detail round
- Salman's call: all three good; Wall loses Eyewash & Showers and gets a better landing/view, "brainstorm and develop fully"; Exploded Kit + Turntable merge into one kit-per-sector page ("The AVES xyz Kit"), designed "carefully and meticulously". Design docs: `docs/superpowers/specs/2026-11-01-arsenal-wall-v0.2-design.md`, `…-aves-kit-design.md`.
- Share material read (never written): current catalogue `5 - FT & BRAND CATALOGUES/4 - AVES CATALOGUE/1 - CURRENT 2024-2026 AVES CATALOG/REV 7/AVES CATALOG REV_JC-Aug18.pdf` (70 pp A4); brand guide 2024-25 (Mint 5645 C, Deep Green 348 C, Dark Charcoal 426 C; Arial primary, Times secondary, Avenir/Helvetica third); harness/lanyard/dropped-objects technology maps. Finding: the catalogue prints the SAME 15 "ideal applications" on every category opener (Oil & Gas, Rig Drilling, Manufacturing, Construction, Mining, Heavy Machinery, Assembly Line, Demolition, Logistics, Woodworking, Aviation, Railway, Mechanical, Power Tool Usage, Forestry): no per-product application data exists.
- Accent moved to 348 C, working sRGB #008048 (sampled from the catalogue PDF; approximate). Barlow kept as a showcase call (guide says Arial).
- Assets: flood-fill knockout leaked into clear shields and white cup masks. New `tools/knockout_rembg.py` (rembg isnet-general-use, alpha matting; venv /tmp/aves-venv, model cache /tmp/aves-venv/u2net) replaced 305 of 308 cutouts; 3 keep the old cut (av-201-3c, av-vb65, one FS15P bundle). `tools/knockout.py` gained --keep-holes/--only.
- `data/kits.json`: 18 kits (the catalogue's 15 + Welding & Hot Work, Electrical & Arc Flash, Cryogenic Handling), 113 slots, each primary + 1–2 alternates + why + confidence (42 high / 60 medium / 11 low). `tools/check_kits.py` guards ids, required slots, order, variety. Kits are curation: product management must sign them off. Gaps: no footwear/workwear/hi-vis/gas detection/chainsaw glove/welding gauntlet/bump cap; 29 of 31 Head without standards strings.
- Figure spike (Draw Things, FLUX.2 klein 4B, ~11 s/image on the Studio): mannequin base good, head items read as stickers on any front-facing body (all shots are three-quarter), separate views don't match. Decision: nothing is worn; a ghost mannequin at 30 % with the kit on an orbit ring, drag to turn (the Turntable merged in).
- Built (two Opus builders, my review): `v0.2/arsenal-wall/` (one-frame overview: 41 px cells at 1440×900, 54 at 1920×1080; dock hover; rail focus with live strip; spotlight; hazard filter; keys 1–8) and `v0.2/aves-kit/` (landing with cycling blank + 18 kits in 5 groups + catalogue photo crops; naming; pinned scrub from exploded cloud onto the ring; turn by drag/keys/rail; swap; summary + footnote). `v0.2/index.html`; root now points at v0.2. Pushed; GitHub Pages built at HEAD and every URL 200.
- Not checked: Safari, his screen, frame rate on a phone, product management's view of the kits.
- Next: his verdict on v0.2; then copy pass, kit sign-off with Mark/product management, kit sheet PDF, IT handover like STEGO.
