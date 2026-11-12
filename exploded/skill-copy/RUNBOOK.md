# AVES exploded view: the process

Written from the TITAN AV-841R build, 11 and 12 November 2026 (v0.1 to v0.3.3). Everything here was done on that one
helmet. Nothing has been tried on a second product yet: treat the first reuse as a test of this file and correct it.

Project root: `~/Documents/Claude/Sloane/aves-showcase` (git, origin PRIMENATHANI/aves-showcase, GitHub Pages).
Line folder: `exploded/<version>/<product-id>/`. Sources: `exploded/research.nosync/<product-id>/` (git-ignored, kept
out of iCloud by `.nosync`).

## 1. Collect the four documents (read only, copy into the workspace)

Never write to the SSD or the share. Copy what you need into `exploded/research.nosync/<product-id>/`.

The SSD mirrors the share at `/Volumes/FT Marketing/`. For head protection:

| Document | Where |
|---|---|
| PTF (Product Technical File) | `PDD - PRODUCT MANAGEMENT/1. DNA- PRODUCT DEVELOPMENT/A - PTF STANDARD SKUs/1 - HEAD PROTECTION/1.A - HELMETS & ACCESSORIES/ACTIVE/<n> - <product>/1 - PTF/` (take the newest, "REV.0" in 2026) |
| COC | same product folder, `4 - COC/` (the AV-841R's was empty; say so if it is) |
| Pack artwork | same product folder, `2 - LMP/` |
| ADS (Article Data Sheet) | `PDD - MARKETING/3. MARKETING/2 - MARKETING COLLATERALS/1 - ADS, SS & E-COLLATERALS/1 - FT STANDARD ADS/1 - HEAD PROTECTION/1.A - HELMETS & ACCESSORIES/ACTIVE/<n> - <product>/1 - ADS/1 - HI-RES/` (newest revision, not `OLD/`) |
| Sell sheet | same ADS product folder, `2 - SELL SHEETS/1. HI RES/` |

Other categories follow the same two trees with their own category folder.

A helmet is a system. Also collect the PTF and ADS of every part the helmet's PTF lists under compatible accessories
that you will draw: its suspension, brow pad and chin strap each have their own product folder (for the AV-841R:
AV-565R suspension, AV-724PU brow pad, AV-729 chin strap).

Find files with a targeted `find -maxdepth` inside the category folder. Do not walk the whole SSD.

**Open the ADS and sell sheet in VectorCraft before sampling or tracing anything** (Salman's standing rule: Craft
tools wherever they fit). The ADS PDF opens as real vectors: `open_file`, then `document.find` with `within` or
`intersects` and `select: true`, then `export` with `selection: true` to SVG. On the AV-841R this gave the actual
swatch fills (Red #ea2227, Yellow #fde900, Orange #f05a29, Blue PANTONE 3005 C #0075c9, Green #39b24a, Grey #bbbdbf)
and the ADS's own drawings of the helmet from four sides, which had first been sampled from pixels and traced by
eye. Work on a single-page copy (`pdfseparate`) inside the workspace; VectorCraft reads only there.

Then, for each PDF: `pdftotext -layout` for the text, `pdftoppm -r 110 -png` for page pictures,
`pdfimages -png` for the embedded photos at full size. Look at every page picture and every photo with Read. The ADS
often has line drawings (features and options, assembly instructions) that show how parts join better than any photo:
crop them at 260 dpi.

## 2. RESEARCH.md (before any geometry)

Write `exploded/<version>/<product-id>/RESEARCH.md` with four sections:

1. **Checked in the technical files (text):** dimensions, materials, colours, part names, point counts, standards,
   weights, which accessories belong to the product. Quote the document's own part names; the page uses them.
2. **Checked on the photos (by eye):** what each view shows, part by part, and how parts join.
3. **Inferred:** everything no source shows (for the helmet: the shell's rear, where lugs five and six seat, the
   height-adjust mechanism). Inferred things are drawn quietly and never captioned.
4. **Conflicts between sources:** the website against the ADS, the catalogue against the PTF, a drawing against a
   photo. The PTF and the product photos win over generic drawings; the ADS wins over the website. Report every
   conflict to Salman for product management; do not resolve one silently.

How the product really comes apart is the most important finding. Write the disassembly order as a numbered list.
Real assemblies stay whole: on the helmet the suspension drops out of the shell as one piece.

## 3. copy.json: the ADS, verbatim

All page text comes from the ADS and sell sheet, word for word: name, article number, intro paragraph, features
(head and text), technical and material specification, standards, colours. Never reword, shorten or add a claim.
Left out on purpose: packaging, HS code, supplier name, prices, warehouse details.

Each feature gets a `stage` (which explode stage it floats on). A stage with no feature of its own takes another
ADS line (an accessory line or a specification row), never invented text. `documents` holds the three button links
and `baseUrl` the page's public address.

Words on the page that are not ADS text are limited to: stage labels, the size readout's hint, and the swatch
colours. List them in NOTES.md.

## 4. Build

- Tool: the Anatomy skill (`~/.claude/skills/anatomy/`), framework-free path. Read its SKILL.md and
  `references/craft.md` first. Its "invent a machine" idea does not apply: the object is the product.
- One background builder (a subagent on the main model), given: the skill path, RESEARCH.md, copy.json, the source
  pictures by path, the previous product's folder to copy, and `RUNBOOK-BUILD.md`. Keep the same builder for the
  follow-up passes; it holds the code in its head. Each pass is a new version folder; earlier versions stay untouched.
- Tell the builder to report by message before going idle, and check the folder yourself if it goes quiet.
- Rules for the builder every time: nothing outside its version folder, no git, never `scripts/publish.mjs`, nothing
  under `/Volumes`, no package installs, kill what it starts.
- Time on the first helmet: about 55 minutes for v0.1, then 10 to 45 minutes per pass. Tokens were not measured.

What the drawing tool cannot do (found on the helmet): fabric, drape, twist, a strap threaded through a slot, straps
woven over and under, flat facets with creases on a free-form shell, a filleted join. Say these in the report; do
not fake them.

## 5. QC against the sources

Part by part, put the render beside the PTF photos, the ADS drawings and the sell sheet. Write a QC table in NOTES.md:
part, source, and one of match / fixed / cannot match, with one line of why. Salman's first rejection was accuracy
("the suspension is broken up in odd spaces"), so the QC is the gate, not the audit: the Anatomy audit and line check
prove geometry and loose ends, not likeness.

Run to zero anyway: `./check.sh` (audit in both themes and at the fit stops, line check in six poses per theme) and
the page drive at 390 × 844 and 1440 × 900.

## 6. The page (his decisions, 12 November 2026)

- **Scroll, not sliders.** The figure pins; the scroll takes it apart through named stages in the real order, with a
  snap at each stage, then lets go. GSAP ScrollTrigger and Lenis, per the `web-motion` skill.
- **Features float on the product during the scroll**, each beside its part with a thin leader ending in a dot on
  the part. No boxes. They leave when the scroll finishes. On a phone there is no room beside the part, so the text
  sits under the figure with the leader running up to it.
- **Stage list on the right**, at every width (dots with the current stage named on a phone). He asked for it back
  when it was hidden.
- **No afterthought text.** A status line in the corner was removed. The one live number (head size at the ratchet
  stage) is a designed readout in the title face under the ADS label "Size Adjustment".
- **AVES theme from the sell sheet:** AVES green rgb(3,144,71), white, mint, the dotted halftone; headings in Avenir
  LT Std Black shipped as pictures of the words (never the font file); body Nunito Sans.
- **Header:** logo, the category once only (top right with the round icon), model large, sell-sheet name, article
  number, "Your Total Safety Solutions Partner". A slim brand bar stays while the figure is pinned.
- **Footer:** the logo and "Always Value Everybody's Safety", initials emphasised. The tagline is not repeated there.
- **Background:** the research-centre photo (`assets/bg-lab.jpg`, generated locally with Draw Things) at the strong
  setting by default; `?bg=soft` and `?bg=plain` remain. He chose industrial over plain and strong over soft. A small
  light pool keeps a white shell's edge clean; keep it tight on a phone so the hall still shows.
- **Product name while pinned:** the model in the title face with the sell-sheet name beside it, as a second line
  under the logo and tagline, shown with the brand bar for the whole scroll (he asked so the viewer does not forget
  what they are looking at).
- **Documents row, not plain buttons:** a DOCUMENTS heading in the title face, then one item per document on mint
  with a green left accent: a drawn document mark, the name in bold, a quiet line saying what it is, an arrow that
  moves on hover. He called solid green pills "very basic".
- **Share card ground:** the product sits directly on the AVES green. Never a white glow behind it; he called that
  "very harsh" and "off-putting".
- **Phone white bar:** ScrollTrigger pins the stage at its load-time pixel height, so when the phone's toolbar hides
  the white page shows under it. The stage is 100lvh with max-height none (both !important) and the content sits in
  a 100svh wrapper. See trap 17a in RUNBOOK-BUILD.md.
- **Below the figure:** intro, all features, the specification table, three document buttons (Article Data Sheet,
  Sell Sheet, Certificate of Conformity), standards, colours. He likes this formatting as it is.
- **Document buttons:** linked from `documents` in copy.json. On 12 November 2026 the website's own three buttons
  pointed nowhere and no document had a public address, so an empty link opens the product page. Never put a PDF
  online yourself; that is his decision.
- **Share card:** `assets/share-card.jpg` 1200 × 630 under 300 KB and `share-card-square.jpg` 600 × 600, in the sell
  sheet's style, with Open Graph and Twitter tags in the head. `og:url` and `og:image` are absolute and come from
  `baseUrl`; change it when the page moves to the website. If the page is embedded in the product page, WhatsApp
  shows the product page's preview, not this card.
- **Phone first.** He reviews on his phone. Capture and read every stage at 390 wide before 1440.

## 7. Check, push, report

1. Look at the captures yourself (every stage at phone width, the top, the foot, the document buttons, the share
   card) before he sees anything.
2. Before committing: set `baseUrl` in copy.json to THIS version's address and rebuild (a copied folder keeps the
   previous version's address, so the share card would point at the old page). From the next product on, do not
   commit `shots/`: add `exploded/**/shots/` to `.gitignore` (the first helmet's versions carry 20 to 70 MB of
   screenshots each, which the repository cannot sustain across a range). Keep the captures on disk for review.
3. Commit the version folder only (pathspec) and push: his standing rule is to always push the showcase. If the
   Pages build sticks, `gh api -X POST repos/PRIMENATHANI/aves-showcase/pages/builds`. Confirm the page and the
   share card return 200.
4. Handover to IT, when he calls a version final: `index.html` and `assets/` only (the page is self-contained apart
   from GSAP, Lenis and Nunito Sans from CDNs). Not the build files, sources, shots or research.
5. Report in his format: what is right, what falls short, what was checked and by whom, what was not tested. Lead
   with any flaw or source conflict.

## 8. Open on the first helmet (carry forward, do not rediscover)

- Lost in v0.3.3: hovering or tapping a part still highlights it, but its name no longer shows anywhere (the name
  lived in the status line he had removed). Restore it as a small label by the part if he wants naming back.
- Not tested: touch on a real phone by me, a tap on a stage dot, Safari, Firefox, the WhatsApp preview itself.
- Not matched: strap through the suspension key, the woven crown crossing, flat shell facets, the boss fillet, the
  full 30 cm sweatband, the shell's rear (no source).
- For product management: the website says 4-point, accessory slots and three colours where the ADS says 6-point,
  no slot and seven colours; the ADS's own drawing captions "4-point and 6-point suspension combinations"; the
  AV-841R has no COC on file.
- Head protection range still to do (PTF list, 12 November 2026): TITAN AV-846R V, AV-564P V, AV-564R V, AV-585P NV,
  AV-585R NV; VICTOR AV-840R NV, AV-845R V, AV-714P V, AV-714R NV, AV-717P NV, AV-717R NV; plus their suspensions,
  brow pads and chin straps. Vented shells, cap-style (no full brim) shells and pinlock suspensions have not been
  drawn yet.
