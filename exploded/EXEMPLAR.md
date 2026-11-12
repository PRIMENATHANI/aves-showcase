# Exploded view: the approved exemplars

**`exploded/v0.3.4/av-841r/`** (AVES TITAN AV-841R full-brim helmet) was approved by Salman on 12 November 2026 as the
exemplar for the exploded experience. Live: https://primenathani.github.io/aves-showcase/exploded/v0.3.4/av-841r/
Git tag: `exploded-exemplar-av-841r-v0.3.4`.

Do not edit that folder. A change is a new version folder; a new product is a copy of it.

| What | Where |
|---|---|
| The page as shipped | `v0.3.4/av-841r/index.html` + `assets/` |
| How it is built (files, commands, traps, what the checks prove) | `v0.3.4/av-841r/RUNBOOK-BUILD.md` |
| What the product really is (PTF, ADS, sell sheet findings, conflicts) | `v0.3.3/av-841r/RESEARCH.md` |
| QC table, part by part | `v0.3.4/av-841r/NOTES.md` |
| Exact page text | `v0.3.4/av-841r/copy.json` |
| Source documents and photos (git-ignored) | `research.nosync/av-841r/` |
| The process, start to finish, and his page decisions | skill `aves-exploded-view` (`~/.claude/skills/aves-exploded-view/`) |
| History | v0.1 (rejected: inaccurate) → v0.2 (rebuilt from the PTF) → v0.3 (QC, scroll, ADS copy, AVES theme) → v0.3.1 (background, brand bar) → v0.3.2 (floating features) → v0.3.3 (readout, documents, share card) → v0.3.4 (approved) |

How it was made: drawn in code with the Anatomy skill (SVG, no image generation for the product). One background photo
generated locally with Draw Things (FLUX.2 klein 9B, offline, no cost): `v0.3.4/av-841r/assets/bg-lab.jpg`.
No Higgsfield, no OpenArt, no paid image service.

Still open: see the skill's RUNBOOK.md, section 8.

## Exemplar 2: the full product page (approved 12 November 2026, evening)

**`exploded/v0.5.1/av-841r/`** is the exemplar for the PRODUCT PAGE: it opens with a 360 drag-to-rotate view, hands off into the exploded scroll, then carries real product photographs, features, specification, documents, standards, accessories, logo placement areas, industries and more helmets. Salman on v0.5: "this is really good. let's save this as exemplar", after real product images were added (v0.5.1). Live: https://primenathani.github.io/aves-showcase/exploded/v0.5.1/av-841r/ Git tag: `exploded-exemplar-page-av-841r-v0.5.1`. Do not edit that folder.

- v0.3.4 (above) remains the exemplar for the exploded scroll alone.
- 360 frames: `assets/spin/` (36 drawn frames; a photographed set replaces them with no code change, requirements in `v0.5.1/av-841r/NOTES.md`).
- Colours and logo-view drawings come from the ADS's own vectors, read with VectorCraft.
- An alternate visual design of the same page, for comparison, not approved: `exploded/alt-v0.1/av-841r/`.
