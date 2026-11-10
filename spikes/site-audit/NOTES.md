# Site Audit (throwaway spike, 2026-11-10)

Alternative to the A+ spike: no scroll story. The visitor sweeps a worksite with a scanner lens, finds 8 hazards, and each one issues the AVES product that answers it to the worker, in any order. Oil & Gas only, desktop only (1440x900 reference), vanilla JS + GSAP 3.15.0 (CDN), no build.

## Open
From `aves-showcase/`: `python3 -m http.server 8771`, then `http://localhost:8771/spikes/site-audit/` (needs `../../data`, `../../assets/dress`). Stop the server after.

## Debug queries (pointer following is off when any is set)
`?lens=x,y` viewport fractions · `?found=1,2,5` (1-based, list order below) · `?open=3` card open · `?done=1` closing screen. `gen/test-flow.mjs <url> <outDir>` drives a real pointer/keyboard flow over CDP.

## Hazards (image coords, 1792x1024; list order = left to right = Tab order)
1 Dropped tools (272,318) platform on left column · 2 Hydrocarbons on hands (340,545) pipe elbows, left rack · 3 Falling objects (530,440) overhead pipe run · 4 Flying particles and glare (650,665) sun glare off wet gravel · 5 Work at height (915,330) red-white tower · 6 Being seen (960,600) plant road mouth · 7 Sour gas and vapours (1062,375) steam vent · 8 Compressor and pump noise (1150,565) white skid.

## Rough / unverified
- Lens trailing, fly-to-worker timing and the ring pulse were checked only through CDP state reads and mid-flight stills, not watched in a live window. Reduced-motion path not exercised.
- Hazard places sit on small features of the existing background photo; "hand" and "vest" spots are the loosest fits (nothing close to a valve or road-sign there). The close-up stills are generated, not crops of the scene.
- The dropped-objects layer is a tether that clips to the harness; per the brief only the earmuffs wait for their parent, so it can appear on the worker before the harness.
- Hi-vis is the Scuta sister-brand vest (no page link). Hazard "where" lines are the A+ spike wording, not catalogue data.
- One forklift still may show a driver silhouette. Product names are raw data (e.g. "AV-831", "ESCAPE HOOD XTREME").
- Keyboard: Tab goes through markers, focus moves the lens, Enter opens, Esc closes; focus returns to the next unfound marker only after keyboard use.
