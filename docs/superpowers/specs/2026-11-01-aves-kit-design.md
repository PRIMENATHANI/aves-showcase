# The AVES ____ Kit — design

Date 2026-11-01. Author Sloane. Status: detail round (Salman's words: "Merge it with the turntable and add more kits. There should be a kit for every sector / industrial task… intros them to the page and ask what kind of kit they would like to build. Call it the aves xyz kit. Then put it together.")
Replaces `v0.1/exploded-kit/` and `v0.1/turntable/`. Shared language in `BRIEF.md`.

## Intent
A visitor names their work; AVES assembles the full head-to-toe kit for it in front of them, item by item, each with the standard it meets and the hazard it answers. The page proves two things at once: AVES covers every line of defence, and AVES knows the work.

## The flaw to carry (stated up front)
AVES has no per-product application data. The catalogue prints the same 15 "ideal applications" on every category opener (checked: the grid is identical on all eight, with "Chemical" added on two and "Cryogenic" on the cryo page). So every kit's composition is curation from standards, bullets and catalogue section copy. Each slot carries a confidence flag, and product management / Mark must sign the kits off before IT builds this for real. 77 of 308 products have no standards string (29 of 31 Head), which limits what the readouts can show for those.

## Goals
1. Landing in one breath: the name with the blank, the ask, the list. No scrolling needed to choose.
2. One kit per sector or task that AVES itself names, plus the three the range visibly demands.
3. Every item in a kit is a real SKU with its standard and a one-line "why it is in this kit".
4. Adding a kit is a data edit (`data/kits.json`), never an HTML edit.

## Non-goals / anti-goals
- No prices, no cart, one CTA ("Add kit to quote", no-op toast). No PDF export this round (noted for later: a kit sheet).
- No continuous fake turntable spin. No painted-on worn renders (STEGO lesson: rejected twice).
- Eyewash stations are not in kits (station equipment, not worn; Salman removed them from the Wall). My call, reversible.
- No boxes, no emojis, no self-praise copy.

## Kits (the canonical list)
The catalogue's own 15 applications, in its order: Oil & Gas, Rig Drilling, Manufacturing, Construction, Mining, Heavy Machinery, Assembly Line, Demolition, Logistics, Woodworking, Aviation, Railway, Mechanical, Power Tool Usage, Forestry.
Added because whole AVES lines would otherwise never appear (my call): Welding & Hot Work (welding helmets, welding goggles, welding faceshields), Electrical & Arc Flash (Class E helmets, arc faceshield combos, insulating gloves), Cryogenic Handling (the cryo line).
18 kits. Grouped on the landing by the kind of work, text only: Energy (Oil & Gas, Rig Drilling, Electrical & Arc Flash) · Build (Construction, Demolition, Heavy Machinery) · Make (Manufacturing, Assembly Line, Mechanical, Power Tool Usage, Welding & Hot Work, Woodworking) · Move (Logistics, Railway, Aviation) · Extract & Handle (Mining, Forestry, Cryogenic Handling).

## Data contract: `data/kits.json`
```
{ "id": "oil-gas", "name": "Oil & Gas", "title": "The AVES Oil & Gas Kit",
  "group": "Energy", "hazards": ["falling objects","noise","H2S / vapours","height","hydrocarbons on hands"],
  "intro": "one sentence, factual, ≤ 22 words",
  "slots": [
    { "slot": "head", "label": "Head", "primary": "<product id>", "alternates": ["<id>","<id>"],
      "why": "≤ 16 words naming the hazard and the standard", "confidence": "high|medium|low" },
    … eye, face (optional), hearing, respiratory, hand, fall (optional), dropped (optional), cryo-body (cryo only)
  ] }
```
Slots are ordered head to toe. A slot may be omitted for a kit (no face shield for Logistics). Product ids are `products.json` ids; the page resolves name, SKU, standards, image at runtime. Confidence drives a small readout ("curated · to be confirmed") never a colour badge.

## The page
### 1. Landing
- Stage black. Centre-left, large Barlow Condensed: "The AVES" then the blank as a rule (`____`) then "Kit." The blank cycles the kit names every 1.8 s with a vertical slide (transform/opacity), pausing on hover. Under it, one line: "Name the work. We assemble the kit, head to toe, with the standard behind every piece."
- Below (still in the first viewport on ≥ 900 px tall): the five groups as columns of plain text links, each kit with its hazard line in muted type ("Oil & Gas — falling objects · noise · vapours · height"). No cards. Keyboard: type to filter, arrows, Enter.
- Right side: the catalogue's category worn photos (extracted from catalogue p4–5) as a slow crossfading column, desaturated 40 %, so the landing is not an empty black page. Optional under reduced motion (static first frame).

### 2. Naming
- Click a kit: the blank fills with the name (the rule becomes the word, 260 ms), the list and photos fall away (opacity + 24 px drift), and the title locks in the top-left as the page header: "The AVES Oil & Gas Kit". The URL becomes `#kit=oil-gas`.

### 3. Assembly (from v0.1 Exploded Kit, pinned + scrubbed)
- The figure stands centre. The kit's items hang exploded around it on their slot lines (head high, hands wide, fall gear low), each with its slot label in the margin.
- Scroll scrubs the assembly head to toe. Each item travels to its slot; as it lands, its readout appears in the left rail: slot, product name, SKU, standard string, the "why" line. The rail accumulates, so by the last item the full kit list is on screen.
- A progress readout in the right margin: "6 of 8 in place".
- Reduced motion: the assembled state with the full rail, no pin.

### 4. The figure (the critical path; spiked before the full build, see below)
- Three snap views, not a spin: Front (default), Side (helmet + earmuff + faceshield relationship), Back (harness dorsal D-ring, lanyard). A control in the margin reads "Front · Side · Back"; arrow keys and a drag past 60 px also switch. Views crossfade in 320 ms with items re-seated on that view's slot points.
- Base figure: a matte, neutral mannequin generated once with Draw Things (front, side, back, same light), not a stick SVG. Product cutouts seat on per-view anchor points with per-slot scale. Accepted limit: cutouts stay flat; the mannequin gives the volume.
- If the spike shows the mannequin + cutouts still read as stickers, the fallback is the v0.1 Exploded Kit's "exploded is the hero" stance: items hover in a ring around a dimmed figure and only the readouts assemble.

### 5. Swap (shows breadth)
- Each slot in the rail has "or:" followed by its alternates as text. Click swaps the product on the figure (FLIP from the rail to the slot) and in the readout. The kit summary reflects swaps.

### 6. Kit summary
- After the assembly: the kit as a plain list (slot · product · SKU · standard), the hazards it answers, "Add kit to quote" (toast), "Choose another kit" (returns to the landing with the blank emptied). `#kit=<id>&view=back`, `#kit=<id>&p=0..1` hash states for shots.

## Look
Per `BRIEF.md` and the Wall v0.2 note on accent (Pantone 348 C) and type (Barlow stays; guide says Arial).

## Imagery from the share (read-only)
- Catalogue category photos: `AVES CATALOG REV_JC-Aug18.pdf` pp. 4–5 (extracted JPEGs 1191×1643 at 144 ppi).
- "Why" copy sources: catalogue section intros and standards explainers; the three product maps in the brand guide folder (harness, lanyard, dropped objects technologies) for fall-gear feature language.

## Verification
- Every kit shot headless at `#kit=<id>&p=1` (assembled, front) 1440×900, plus Side and Back for two kits, the landing, and phone via the 390×844 iframe. Console clean. A data check script asserts every slot id exists in `products.json` and every kit has head, eye, hearing, hand at minimum.
- Not checked this round: Safari, Salman's screen, product management's view of the kit lists.

## Left to the builder
- Exact slot anchor points per view (from the mannequin renders).
- Rail typography and the landing columns' measure.
- Toast copy.
