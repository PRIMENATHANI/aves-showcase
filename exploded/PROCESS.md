# How the AVES exploded view and its two product page themes were made

**Product:** AVES TITAN AV-841R full-brim helmet (Article No. 1891AV841R).
**Dates:** 11 and 12 November 2026, one working session.
**Written by:** Sloane, from the session itself. Where a reason is given, it is the reason I held at the time. Where I was wrong, it says so.

**The three approved results (all locked; see `EXEMPLAR.md`):**

| Result | Folder | Live |
|---|---|---|
| Exploded scroll alone | `exploded/v0.3.4/av-841r/` | https://primenathani.github.io/aves-showcase/exploded/v0.3.4/av-841r/ |
| Product page, **AVES theme** | `exploded/v0.5.1/av-841r/` | https://primenathani.github.io/aves-showcase/exploded/v0.5.1/av-841r/ |
| Product page, **Modern AVES theme** | `exploded/alt-v0.1/av-841r/` | https://primenathani.github.io/aves-showcase/exploded/alt-v0.1/av-841r/ |

Companion files: `EXEMPLAR.md` (index); the skill `aves-exploded-view` (`RUNBOOK.md` = the process as rules, `RUNBOOK-BUILD.md` = the code; copies in `exploded/skill-copy/`); each version's `NOTES.md` (QC tables, which words are not ADS text); `v0.3.3/av-841r/RESEARCH.md` (what the product really is).

---

## 1. Where it started

Salman opened with a question about the kit builder (`aves-showcase/v0.4/experience/`): how to integrate it for every product on the website.

**My reasoning.** The kit builder's quality is hand work per item (a worn render, callout anchors, a pack crop, a hazard line). I counted what existed before answering: 308 products on the site, 91 first-choice in a kit, 99 worn layers, exact catalogue copy for 7 products, "Why Choose" text for 6 of 9 categories. So I said it does not scale as built and proposed three depths: a data-driven product moment for all, a link into the kit for products that are in one, renders for the rest only on his word.

**His decision.** Two lines of experience: (1) the kit builder, (2) an interactive exploded view of each item. Everything below comes from that.

## 2. The tool: the Anatomy skill

He sent a link to the Anatomy skill (github.com/wheresryan22/anatomy, MIT). Before installing I cloned it to scratch, read `SKILL.md` and scanned its scripts for network calls. One script opens a public pull request to a community gallery; I have never run it. Installed at `~/.claude/skills/anatomy/`; its smallest example built as a smoke test.

**What I told him, and still hold.** Anatomy draws each figure as code, part by part, in an isometric line-drawing look. It has no fabric or webbing primitive (I searched its references). So a helmet, earmuffs and glasses are drawable; a harness or lanyard is hardware only; a vest or dipped glove is not a fit. I gave him that table before building anything.

## 3. v0.1: the first proof, and why it was rejected

**What I did.** Briefed one background builder with the skill, two photos (the catalogue shell photo and the AV-565R suspension cut-out) and a fact list from the catalogue and site. Asked for one explode value from 0 to 1 (`window.setExplode`) so a host page's scroll could drive it later; a ratchet that changes the head size 52 to 66 cm; light theme first; nothing published.

**What came back.** A helmet that came apart into seven floating layers: strap stubs, loose brackets, two half rings, a hub with rivets. The geometry audit passed and the line check was at zero.

**His verdict.** "I don't see it as accurate. The suspension is broken up in odd spaces. Try again with some research and better understanding of the helmet."

**What I learned.**
- The audit proves geometry, not likeness. A passing audit told me nothing about whether it was the right helmet.
- I had drawn from two photos and typical sizes. I had not read the product's own documents.
- I also failed to tell him when it finished: the builder went idle at 18:57 and I did not look until he asked the next morning.

## 4. The research that fixed it

**Product Technical Files (PTF).** On the SSD, `PDD - PRODUCT MANAGEMENT/…/A - PTF STANDARD SKUs/1 - HEAD PROTECTION/1.A - HELMETS & ACCESSORIES/ACTIVE/`. I copied the AV-841R and AV-565R files (February 2026 revisions) into `exploded/research.nosync/`, extracted the text (`pdftotext`), the pages (`pdftoppm`) and the embedded photos at full size (`pdfimages`), and looked at each.

What the PTFs settled:
- The AV-565R **is** this helmet's suspension, and it is 6-point (the website says 4-point).
- Shell inner 240 × 210 × 140 mm, brim 40 mm, headband 52 to 66 cm. v0.1 was about 12 % too large.
- "Accessory slots: No." The four bosses are the outside of the suspension key pockets.
- Materials and colours: white HDPE shell; ash-grey headband, keys and top pad; black nylon crown straps and POM knob.
- The underside photo shows the suspension as **one assembly**: one headband ring, three full crown straps running key to opposite key and crossing through one grey top pad, a lower nape strap with the ratchet. No hub, no rivets.

**The disassembly order** I wrote from that, which became the scroll: shell lifts and the whole suspension stays (held, so it can be read) → chin strap drops → sweatband slides off → crown straps lift as one piece → ratchet wheel pulls back.

**v0.2** was rebuilt from this. His verdict: "much better", and: "the PTF, ADS and sell sheet reference is a necessity so you can accurately build the product."

**ADS and sell sheet.** In `PDD - MARKETING/…/1 - ADS, SS & E-COLLATERALS/1 - FT STANDARD ADS/1 - HEAD PROTECTION/…`. The ADS (rev 2, February 2026) gave: the six features, specification, standards and seven colours (the page text, verbatim); assembly drawings that name the parts (suspension keys, key slots, height key, "pull out to adjust, press to lock"); a clear drawing of a boss as a wedge on the crown wall; compatible accessories; logo placement areas with drawings from four sides; twelve recommended industries. The sell sheet gave the AVES look: green ground, dotted halftone, bold white type.

**Rule that came out of it:** no drawing before the documents are read. PTF and product photos win over generic drawings; the ADS wins over the website; every conflict is reported, never resolved silently.

## 5. v0.3 to v0.3.4: from figure to approved page

Each pass was a new version folder; earlier ones were never edited. I kept one builder across passes because it held the code in its head.

| Version | His request | What was done | My reasoning |
|---|---|---|---|
| v0.3 | QC for accuracy; scroll, not sliders; ADS text at the bottom; Head Protection and "Your Total Safety Solutions Partner"; an AVES-themed page | QC table part by part against PTF, ADS and sell sheet; pinned scroll through seven stages with snap (GSAP ScrollTrigger + Lenis); `copy.json` holding the ADS text verbatim; sell-sheet theme | I wrote `copy.json` myself so no worker could reword the ADS. Packaging, HS code, supplier and prices left out. |
| v0.3.1 | Background: he asked plain white or industrial | I advised plain (two looks on one page; a white shell on a pale photo). Generated one research-centre backdrop locally with Draw Things so he could compare. **He chose industrial**, with more contrast. I changed my position because his preference was the new information. Also: bosses sunk into the crown wall, a brand bar while pinned, a larger figure. | A cheap free comparison beat arguing. |
| v0.3.2 | Better presentation of the scroll text; the stage list back; features floating during the scroll; "Head Protection" once; footer "Always Value Everybody's Safety"; strong background | Callouts beside each part with a leader and dot, gone when the scroll ends; stage dots on phone; strong background as default with a smaller light pool on phone | Stages with no ADS feature took another ADS line (the AV-729 accessory line, the "Adjustment Type" spec row), never invented text. |
| v0.3.3 | The corner text looked like an afterthought; document buttons; a WhatsApp share card; then a skill | Status sentence removed; a designed size readout at the ratchet stage; three document buttons; share card + Open Graph tags; `RUNBOOK-BUILD.md` | I checked the website first: its Data Sheet, COC and Sell Sheet buttons all point to "#", and the AV-841R has no COC on file. I did not publish any PDF; empty links open the product page. |
| v0.3.4 | Harsh white behind the helmet on the share card; basic buttons; the product name while pinned; a white bar at the bottom on phone | Helmet directly on green; a documents row; "AV-841R TITAN® Full Brim Helmet" under the logo while pinned; the white bar's real cause fixed | I asked for the cause, not a cover: ScrollTrigger froze the pinned stage at its load-time height, so when the phone's toolbar hid, the page showed underneath. Stage is now `100lvh`, content in a `100svh` wrapper. |

**Approved:** "This is very good, and I will approve it as an exemplar for the exploded experience."

## 6. v0.4 to v0.5.1: the product page, AVES theme

**His idea.** Turn the exploded view into the product page itself, replacing the website's page.

**My first answer, and his correction.** I said it could not simply replace the WooCommerce page because of Add to Quote, variants, SKU and related products. He told me those are placeholders that do nothing, and that the page will be linked from the WooCommerce back end. I dropped the objection: that was new information.

**v0.4 (the page).** Opening screen with the helmet and seven colour swatches that recolour the drawn shell everywhere; the approved scroll unchanged (the worker diffed every stage against the exemplar's captures); ADS compatible accessories with the ADS's own photos; logo placement areas; twelve industries, eight linking to kits in the kit builder (where the two lines meet); more head protection; a slim bar. Things I caught and fixed before he saw it: a dead "__trashed" AV-728 link from the site crawl; Front and Back logo views that read as a flat block.

**His next request.** Real images, or a 360 view the visitor can rotate, opening the page; then scroll breaks it apart.

**My reasoning.** I had five real photos and none of the back, so no real 360 existed. Three routes: a turntable shoot (exact), generated images (invent the back, drift between frames), drawn frames (as accurate as the drawing, free). I recommended the shoot, warned that a photographic helmet handing off to a drawn one is two looks, and started a frame-based viewer whose frames can be swapped later with no code change. **He chose drawn frames for now.**

**v0.5.** 36 frames at 10° steps (`assets/spin/`, described by `spin.json`); drag sideways to turn, vertical swipes still scroll; swatches recolour the frames by mapping the white ramp to each colour's ramp (measured against the drawn shell: about 2 levels in 255 mean difference); the helmet turns to frame 0, travels to the pinned figure's exact box and becomes it, so there is one helmet, never two; the opening screen fits one phone screen.

**What went wrong.** The first builder hung at 17:43 with two test frames done; I noticed at 18:36 and stopped it at 19:15. I started a second builder with the state of the folder so nothing was redone.

**Craft tools.** Salman pointed out I had not used the Craft apps. He was right, and it is his standing rule. VectorCraft opened the ADS PDF as real vectors in one call (`open_file`, `document.find` with `within` / `intersects`, `export` with `selection: true`). That gave the actual swatch fills (Red #ea2227, Yellow #fde900, Orange #f05a29, Blue #0075c9 PANTONE 3005 C, Green #39b24a, Grey #bbbdbf) and the ADS's own drawings of the helmet from four sides. Both replaced things I had sampled from pixels and traced by eye.

**v0.5.1.** His last request before approval: real product images the customer can view. A Product Photos section after the exploded scroll (six real photographs, thumbnails, swipe, full screen) and a "View photos" control on the opening screen. All photos are of the white helmet and say so; no back photo exists.

**Approved** as the **AVES theme**.

## 7. alt-v0.1: the Modern AVES theme

**His request.** An alternate design from a reference image of a camera product site, with the 360 and exploded animations in it.

**How I read the reference** (its language, not its brand, words or product): warm off-white ground; grey rounded panels; charcoal type; one accent used as a highlighter and on round arrow buttons; a thin ticker; a huge wordmark with a highlighter band; a giant ghost word behind the product; small pill labels pointing at features; a section heading pattern (small label, two-tone headline); a detail grid of one tall and two stacked tiles; an accordion; a feature strip; a question list; a dark band; a quiet footer.

**How I mapped it to the product.**
- Accent = AVES green. Wordmark = TITAN. Ghost word = TITAN. Ticker = "Your Total Safety Solutions Partner".
- Hero panel = the 360 viewer with pill labels from the ADS's own icon captions, the swatches, and a "Take it apart" pill.
- The exploded scroll on the plain warm panel (no lab photo), same stages and callouts.
- Detail grid = three stills of the drawn figure, each titled with an ADS feature head, each jumping to its stage.
- Accordion = the six ADS features. Feature strip = three specification rows. Question list = the three documents.
- **No invented text.** The reference has a testimonial and a questions list; the sources have neither. The dark band carries the ADS intro's first sentence.
- Type: Inter Tight and Inter, because this design needs large live two-tone headlines that pictures of words cannot give.
- Motion: GSAP ScrollTrigger + Lenis stay the only scroll engine; Motion for button springs and the accordion; anime.js for entrances and drawn lines.

**Approved** as the **Modern AVES theme**: "Both links are absolutely perfect."

## 8. Standing instructions he gave during this work

1. **Sources before drawing:** PTF, ADS and sell sheet are a necessity.
2. **Craft tools wherever they fit** (VectorCraft, DesignCraft, FigCraft, EffectCraft); say which is used, or that none fits.
3. **Model tiers:** Sloane is the top tier; every worker runs on Opus 5.5, set explicitly; the lowest-grade work on Sonnet or Haiku. Both early builders ran on the top tier because I never set a model (about 70 % of the session's turns). Workers ran on Opus from v0.5.1 on.
4. **Do not waste credits rerunning the same work.** A replacement worker continues from the folder's state.
5. **anime.js and Motion** are in the toolkit: installed (anime.js 4.5.0, Motion 14.13.0), demos proved, references in the web-motion skill, first used in the Modern AVES theme.
6. **prompt-motion.com** is the prompt library for motion graphics on Opus 5.5.
7. **Phone first:** he reviews on his phone.

## 9. My mistakes, plainly

- Drew v0.1 without reading the product's documents.
- Did not tell him when v0.1 finished; left a hung builder for 90 minutes on v0.5; left four finished workers unreported for up to an hour. Rule now: check workers every 20 to 30 minutes and report at once.
- Ran workers on the top-tier model until he asked which models were in use.
- Did not use the Craft tools until he reminded me.
- Committed 20 to 70 MB of screenshots per version for the first versions; from v0.3.4 on `shots/` stays on disk only.

## 10. What is still open

- **Real 360 photographs.** The viewer takes a photographed set with no code change; requirements in `v0.5.1/av-841r/NOTES.md`. No photo of the helmet's back exists.
- **Documents.** No public address for the ADS, sell sheet or a certificate; the AV-841R has no COC on file.
- **For product management:** the website says 4-point, accessory slots and three colours and shows placeholder text; the ADS says 6-point, no slot, seven colours. The ADS's own drawing captions "4-point and 6-point suspension combinations".
- **Not matched in the drawing:** the strap threaded through the key, the woven crown crossing, flat shell facets, the boss fillet, the full sweatband.
- **Not tested by me:** a real phone, Safari, Firefox, the WhatsApp preview. His phone reviews are the only real-device checks.
- **Modern AVES theme:** no photo gallery yet; its worker left no shortfall notes.
- **`baseUrl`** in each page's `copy.json` changes when a page moves to the website's own address.
- **Unproven on a second product.** Vented shells, cap-style shells and pinlock suspensions have never been drawn.
- **Not started:** the spin-and-explode clip for the sales team.
