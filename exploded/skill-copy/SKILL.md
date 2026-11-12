---
name: aves-exploded-view
description: Use when Salman asks for an exploded view, an interactive take-apart page, or "the helmet page" for an AVES product (first built for the TITAN AV-841R full-brim helmet), for another AVES head protection item, for a change to one of those pages, or for its WhatsApp share card. Also use when a request mentions exploded view, scroll take-apart, anatomy figure, or the second experience line beside the AVES kit builder.
---

# AVES exploded view

## Overview

One scroll-driven page per product: the real product, drawn, comes apart in the order it really comes apart, with the
ADS features floating on the parts. It is the second AVES experience line; the first is the kit builder
(`aves-showcase/v0.4/experience/`). The page will sit beside the product on the product page of the website and is
also sent on its own by the sales team, so it carries its own share card.

**Approved exemplar (Salman, 2026-11-12: "very good... I will approve it as an exemplar for the exploded experience").**
Every further exploded view matches this page's structure, look and behaviour unless he says otherwise; git tag
`exploded-exemplar-av-841r-v0.3.4`.

**Reference build:** `~/Documents/Claude/Sloane/aves-showcase/exploded/v0.3.4/av-841r/` (TITAN AV-841R, 2026-11-12),
live at `https://primenathani.github.io/aves-showcase/exploded/v0.3.4/av-841r/`. Check for a newer version folder
before starting. A new product starts as a copy of the newest product folder, never from an empty folder.

**Core rule: no drawing before the documents are read.** v0.1 was drawn from two photos and typical sizes and Salman
rejected it as inaccurate. Accuracy came only from the PTF, the ADS and the sell sheet. His words: "the PTF, ADS and
sell sheet reference is a necessity."

Two files sit beside this one: `RUNBOOK.md` (the process, start to finish) and `RUNBOOK-BUILD.md` (the code: files,
commands, what changes per helmet, traps). Read both before any work.

## When not to use

- Kit builder work: that is `aves-showcase/v0.4/` with its own HANDOVER.md and DESIGN.md.
- Products with nothing rigid to take apart (vests, dipped gloves) and products that are mostly fabric or webbing
  (harnesses): the drawing tool has no fabric, drape or twist. Say so first; do not start.
- STEGO pages: use `stego-glove-experience`.

## Quick reference

| Step | What | Where it is written |
|---|---|---|
| 1 | Find and copy the four documents (PTF, ADS, sell sheet, COC) | RUNBOOK.md §1 |
| 2 | Write RESEARCH.md: checked in text, checked on photos, inferred | RUNBOOK.md §2 |
| 3 | Write copy.json from the ADS, verbatim | RUNBOOK.md §3 |
| 4 | Build with the Anatomy skill, one background builder | RUNBOOK.md §4, RUNBOOK-BUILD.md |
| 5 | QC table against the sources; fix; record "cannot match" | RUNBOOK.md §5 |
| 6 | Page: scroll stages, floating features, AVES theme, buttons, share card | RUNBOOK.md §6 |
| 7 | Look at the captures yourself, push, report | RUNBOOK.md §7 |

## Common mistakes (all made on the first build)

- Drawing from photos alone, or from "typical" sizes.
- Cutting one real assembly into floating layers to make the explode look fuller.
- Inventing parts (a hub with rivets) or naming a part from assumption (bosses called accessory slots; the PTF says none).
- Trusting the website: it contradicted the ADS on points, slots and colours.
- Rewording ADS text, or adding numbers that are in no document.
- Leaving the builder unwatched: it went idle without reporting and Salman had to ask. Check the folder when he asks, and tell him the moment a build lands.
- Showing him a build you have not looked at. The audit proves geometry, not likeness.
