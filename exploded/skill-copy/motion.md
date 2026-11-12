# Motion (motion.dev): reference

Checked 12 November 2026 against the npm registry, the GitHub repo (motiondivision/motion, tag v14.13.0) and the docs at motion.dev/docs (raw `.md` pages).

Demos and probes ran in headless Chrome 157.0.8103.52 on macOS. Lab: `~/Documents/Claude/Sloane/web-motion-lab/motion/` (demos, `vendor/`, `scripts/` harness and probes, `shots/`).

**Tags.** "Verified" means run in that lab. "Docs" means taken from the docs and not run.

**Not checked:**
- Safari and Firefox. Native ScrollTimeline was seen only in Chrome; elsewhere Motion falls back to the main thread.
- Every React snippet.
- `animateView` and `animateLayout`.
- Drag and inertia.
- Hover touch filtering on a real phone.
- The Motion+ Team price.
- `matchMedia: "motion"` in `scopeMotion`.

## 1. Version, licence, what is paid

- `motion@14.13.0`, MIT. The GitHub repo is also MIT, and its newest tag is v14.13.0.
  - It depends on `framer-motion@14.13.0`, `motion-dom` and `motion-utils`. v14 had no breaking changes.
- **Stale pin:** SKILL.md pins `motion@14.1.0`, 12 minor versions behind. Timeline editing (`add`/`call`/`playTo`), `scopeMotion`, `arc()` and press `hold`/`count` may not exist in 14.1.0. Use 14.13.0.
- **Free:** everything exported by `motion` (vanilla) and `motion/react`.
  - That includes `animate`, sequences, `scroll`, `inView`, `hover`, `press`, motion values, `animateLayout` and `animateView`; the animate-view page has no Motion+ mark.
- **Motion+ (paid):** one-time Solo licence (the page's structured data says USD 399), or a Team plan billed yearly per seat (price not shown).
  - Paid features come from `motion-plus`: `splitText`, `typewriter`, Ticker, Carousel, Cursor, AnimateNumber, ScrambleText, Gallery, Curtains, the 520+ example sources and the AI Kit editors.
  - The Three.js and vgpu integrations are "Motion+ early access" (docs), even though the `motion/three` entry point is in the free package.
  - Text splitting is paid here, but free in GSAP (SplitText).

## 2. Sizes (measured; gzip -9)

| Build | min | gzip |
|---|---|---|
| `motion/dist/motion.js` (UMD, global `Motion`, everything) | 191.6 KB | 64.6 KB |
| jsDelivr `motion@14.13.0/+esm` (4 requests, total transfer) | n/a | 65.4 KB |
| `framer-motion/dist/dom-mini.js` (UMD, global `Motion`: only `animate`, `animateSequence`) | 13.0 KB | 5.1 KB |
| GSAP 3.15.0 core + ScrollTrigger (for comparison) | 117.5 KB | 46.3 KB |
| Lenis 1.3.26 | 18.7 KB | 5.4 KB |

The docs quote mini 3.2 kb, hybrid `animate` 22 kb and `scroll` 3.8 kb. Those are tree-shaken bundler figures.

On a no-bundler CDN page, Motion is **heavier** than GSAP + ScrollTrigger.

## 3. CDN lines (pinned; each verified loading and animating)

```html
<!-- Full build, classic script, global `Motion`. Works from file://. Preferred for plain pages. -->
<script src="https://cdn.jsdelivr.net/npm/motion@14.13.0/dist/motion.js"></script>
<script>const { animate, scroll, inView, stagger, hover, press } = Motion;</script>

<!-- ES module. An inline module import also worked from a file:// page. -->
<script type="module">
  import { animate, scroll } from "https://cdn.jsdelivr.net/npm/motion@14.13.0/+esm";
</script>

<!-- Small build: animate() only, transform STRINGS only (no x/y/scale), no spring, no scroll. -->
<script src="https://cdn.jsdelivr.net/npm/framer-motion@14.13.0/dist/dom-mini.js"></script>
```

- Not on cdnjs (its API returns 404 for `motion`). `unpkg.com/motion@14.13.0/dist/motion.js` also works.
- The docs' own CDN lines use `@latest`, and their example pin, 11.11.13, is old. Always pin.
- Both UMD builds use the global name `Motion`, so never load both on one page.
- Offline copies: `vendor/motion-14.13.0.umd.js` and `vendor/motion-mini-14.13.0.umd.js`.

## 4. Minimal working page (pattern of `demo-spring.html`)

```html
<style> html.motion-on .card { opacity: 0; } </style>
<script>
  const REDUCE = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!REDUCE) document.documentElement.classList.add("motion-on"); // hide only if we will animate
</script>
...
<script src="vendor/motion-14.13.0.umd.js"></script>
<script>
  const { animate, stagger } = Motion;
  if (!REDUCE) animate(".card", { opacity: [0, 1], y: [24, 0] },
    { type: "spring", visualDuration: 0.45, bounce: 0, delay: stagger(0.04) });
</script>
```

## 5. Vanilla API by task

**Entrance (verified).** Call it as `animate(target, keyframes, options)`.
- `target` is a selector, an element or a list of elements. A value can be a single target or a `[from, to]` array.
- Independent transforms work: `x`, `y`, `z`, `scale`, `scaleX`, `rotate`, `rotateX`, `skewX`, `transformPerspective`. Numbers are px or deg.
- Time-based animations of these shorthands ran as WAAPI `transform` animations (verified via `getAnimations()`).
- Options (docs):
  - `duration` (s), `delay` (negative starts partway through), `ease`, `times`, `repeat`, `repeatType` (`"loop"`/`"reverse"`/`"mirror"`), `repeatDelay` (not in mini).
  - `ease` takes a name (`linear`, `easeIn/Out/InOut`, `circ*`, `back*`, `anticipate`), a 4-number bezier or a function.
  - Per-value overrides: `{ duration: 1, opacity: { duration: 0.3 } }`.
- **Trap (verified):** with no options, transforms get a default **spring that overshoots**. `animate(el, { x: 100 })` peaked at x 110.9. Opacity defaults to a tween. Always pass `type`/`duration`/`ease`, or `bounce: 0`.

```js
animate("h1", { opacity: [0, 1], y: [12, 0] }, { duration: 0.4, ease: [0.22, 1, 0.36, 1] });
```

**Stagger (verified with `grid`, `from: "first"`).** `stagger(seconds, { startDelay, from, ease, grid })`.
- `from` is `"first"`, `"center"`, `"last"`, `"edges"`, `"random"` or an index (docs).
- `grid: [cols, rows]` staggers by 2-D distance.

```js
animate(".card", { opacity: [0, 1] }, { delay: stagger(0.04, { grid: [4, 3], from: "center" }) });
```

**Spring (verified with `visualDuration` + `bounce: 0`).** Three ways to set one:
- `{ type: "spring", visualDuration, bounce }` keeps the velocity of an interrupted animation, which is the one to use for gestures.
- `{ type: "spring", duration, bounce }` lasts exactly its duration.
- `{ type: "spring", stiffness, damping, mass }` is pure physics and overrides the other two.

Source defaults (`motion-dom` spring.mjs):
- stiffness 100, damping 10, mass 1.
- bounce 0.3 for duration springs. With `visualDuration`, an omitted bounce counts as 0.
- The docs claim stiffness 1 and bounce 0.25; both are wrong.

House rule (nothing bounces): always write `bounce: 0`.

**Sequence / timeline.** Pass `animate([...segments], options)`. Each segment is `[target, keyframes, options]`. A bare string is a label.
- Verified: labels, `at: "label"`, `at: "-0.25"`, sequence `onComplete`, `autoplay: false`, `call()` (received direction 1), `getLabelTime()`.
  - The methods `add`, `addPause`, `playTo`, `seek`, `move` and `remove` exist (checked) but were not exercised.
- Other `at` forms (docs): absolute `1`, `"+0.5"`, `"<"` (with the previous segment), `"<+0.5"`, `"label+0.5"`.
- Sequence options (docs): `defaultTransition`, `duration` (stretches all), `repeat`, `onUpdate(time)`, `onRepeat`, `onReverseComplete`.

```js
const tl = animate([
  ["h1", { opacity: [0, 1] }, { duration: 0.4 }],
  "rule",
  [".rule", { scaleX: [0, 1] }, { at: "rule", duration: 0.5 }],
  ["p.sub", { opacity: [0, 1] }, { at: "-0.25" }]
], { onComplete: () => {} });
tl.call((dir) => el.classList.toggle("on", dir === 1), "rule"); // 1 forwards, -1 backwards
```

Controls on every `animate()`: `play()`, `pause()`, `complete()`, `time`, `speed` (-1 plays in reverse), `duration` (read-only), `then` / `await` (docs).
- Verified: `stop()` freezes and commits the current value to inline `style`, and the animation cannot restart.
- Verified: `cancel()` reverts and removes the inline value.
- Verified: `onComplete` also fires on a single `animate()`.

**Scroll-linked (verified).** Call `scroll(animationOrCallback, { container, target, axis, offset, trackContentSize })`. It returns a cancel function.
- `offset` defaults to `["start start", "end end"]`. Each side is `start`/`center`/`end`, 0–1, `px`, `%`, `vh` or `vw`.
- The callback form receives `(progress, info)`. `info.y` has `current`, `offset`, `progress`, `scrollLength` and `velocity`.

```js
scroll(animate(".bar", { transform: ["scaleX(0)", "scaleX(1)"] }, { ease: "linear" }));      // page progress
scroll(animate(".shell", { transform: ["translateY(0px) rotate(0deg)", "translateY(-180px) rotate(-12deg)"] },
  { ease: "linear" }), { target: track, offset: ["start start", "end end"] });               // scene in a tall track
scroll((p) => { readout.textContent = Math.round(p * 100) + "%"; }, { target: track });
```

- **Verified in Chrome 157:**
  - `transform:` string keyframes ran on a native `ScrollTimeline` (window) or `ViewTimeline` (with `target`).
  - The same motion written with `x`/`y` shorthands gave correct values but got **no** native timeline (main thread). For acceleration, write `transform`/`opacity` strings.
- **Cleanup trap (verified):** calling the cancel function from `scroll(animate(...))` snapped the bar to its **end state** (scaleX 1) and left it there. To return to the start, also keep the animation and call `.cancel()` on it.
- `target` is measured by layout position, so transforms on it or its ancestors are ignored (docs).

**Pinning and snapping.**
- No `pin` exists. Use a tall wrapper (for example `height: 300vh`) holding a `position: sticky; top: 0; height: 100vh` stage, and pass `scroll(..., { target: wrapper })`.
  - Verified in `demo-scroll.html`: the scene ran 0 to 100% across the track.
- No `snap` exists, and Lenis does not support CSS scroll-snap (Motion's Lenis page).
- No built-in scrub smoothing like GSAP's `scrub: 0.5`. The route is a spring on progress: `springValue(...)`, or `useSpring(scrollYProgress)` in React. That runs on the main thread; not run.

**In view (verified).** Call `inView(target, (element, entry) => { ...; return (leaveEntry) => {} }, { root, margin, amount })`. It returns a stop function.
- It runs once per element unless the callback returns a leave function.
- `amount` is `"some"`, `"all"` or 0–1. It is built on IntersectionObserver.

```js
inView(".reveal", (el) => { animate(el, { opacity: [0, 1], y: [32, 0] }, { duration: 0.5 }); }, { amount: 0.3 });
```

**Gestures (verified with real mouse input and Enter).**
- `hover(target, (el, ev) => onEnd)` filters touch-emulated hovers (docs).
- `press(target, (el, ev) => (endEv, info) => {...}, opts)` makes the element keyboard-operable: Enter counted as a press (verified).
  - `info.success` is false when released outside the element (docs).
  - Options (docs): `passive`, `once`, `count`, `countTimeout`, `hold`, `repeat`.
  - The start callback can return `{ onActive, onHold(progress), onRepeat(n), onComplete }` for long-press and hold-to-repeat (docs).
- Trap (verified): on release, go back to the **hover** scale if the pointer is still over the element, or hover is lost.

```js
const SPR = { type: "spring", visualDuration: 0.2, bounce: 0 };
hover("#cta", (el) => { animate(el, { scale: 1.04 }, SPR); return () => animate(el, { scale: 1 }, SPR); });
press("#cta", (el) => { animate(el, { scale: 0.96 }, SPR);
  return () => animate(el, { scale: el.matches(":hover") ? 1.04 : 1 }, SPR); });
```

**Motion values** render without React, once per frame.
- `motionValue(v)` has `.get()`, `.set(v)`, `.on("change", fn)` (returns unsubscribe), `.getVelocity()` and `.destroy()`.
- Bind to elements with `styleEffect(sel, { x, opacity })`, `svgEffect(sel, { pathLength, attrWidth })`, `attrEffect` or `propEffect`. Each returns a cancel function.
- Derive values:
  - `mapValue(mv, [in], [out], { clamp })` maps ranges.
  - `transformValue(() => expr)` tracks each `.get()` it calls.
  - `springValue(numberOrMv, springOpts)` follows its source with a spring.
- `transform([in], [out])` is a plain mapping function.
- Verified: `styleEffect` + `mapValue` gave x 50 and opacity 0.5; `springValue` moved smoothly.

**SVG draw (verified).**
- `animate("path", { pathLength: [0, 1] })` sets `pathLength="1"` and animates `stroke-dasharray`.
- Works on circle, ellipse, line, path, polygon, polyline and rect. `pathOffset` and `pathSpacing` take 0–1. Full build only.

**Layout and view transitions (docs, not run; free).**
- `animateLayout(update, opts)` animates elements marked `data-layout` / `data-layout-id`. Needs ≥ 14.1.0.
- `animateView(update, opts).add(".card").layout({...})` wraps the View Transition API; unsupported browsers just apply the DOM update.

**Cleanup.** Every function returns a stop or cancel handle; keep and call them on teardown.
- `scopeMotion(rootOrFn, fn?, { matchMedia, transition })` collects everything created inside it.
- `scope.cancel()` stops it all and restores inline styles (verified). `scope.refresh()` re-runs setup (docs).
- `matchMedia` accepts shorthands such as `"motion"`, `"reducedMotion"` and `">=800 !touch"` (docs).

## 6. React in brief (imports from docs; not run)

```jsx
import { motion, AnimatePresence, useScroll, useTransform, useSpring, MotionConfig, useReducedMotion } from "motion/react";
// Server components: import * as motion from "motion/react-client"
<MotionConfig reducedMotion="user">  {/* drops transform + layout animation for reduce users, keeps opacity */}
  <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }}
    transition={{ type: "spring", visualDuration: 0.45, bounce: 0 }} />
  <AnimatePresence>{open && <motion.div key="m" exit={{ opacity: 0 }} />}</AnimatePresence>
  <motion.li layout /> <motion.span layoutId="underline" />
</MotionConfig>
const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
const y = useTransform(scrollYProgress, [0, 1], [0, -200]);
const smooth = useSpring(scrollYProgress, { stiffness: 300 });   // <motion.div style={{ y, scaleX: smooth }} />
```

- Requires React 18.2+.
- Wrap your own components with `motion.create(Component)`. The older forms were `motion.custom()` (removed in v4) and then `motion(Component)`; the last step is my inference, not from the docs.

## 7. Renames and old-example traps

- `framer-motion` became `motion` (React: `"motion/react"`). Motion One's API became the vanilla `motion` API. Some docs pages still import from `"framer-motion"`; replace that with `motion/react`.
- **Gesture callbacks before v12:** `inView`, `hover` and `press` passed the event first. Since v12 the element is first: `(element, entry)`.
  - The docs' own GSAP-migration page still shows the old `({ target }) =>` form, which is wrong now.
- **Motion One renames** (v11):
  - `easing` → `ease`, `direction` → `repeatType`
  - `currentTime` → `time`, `playbackRate` → `speed`, `finish()` → `complete()`
  - `inView` amount `"any"` → `"some"`, stagger `start` → `startDelay`
  - `glide` → `type: "inertia"`
  - `scroll((info) => …)` → `scroll((progress, info) => …)`
- One example uses `animation.finished`; the upgrade guide says to await the controls. Write `await animation`.
- **Mini build** (`motion/mini`, UMD `dom-mini.js`):
  - Lacks `x`/`y`/`scale` shorthands, `pathLength`, objects, motion values, `repeatDelay` and built-in spring.
  - Verified working: a `transform` string plus `opacity`.

## 8. Reduced motion

- **Vanilla does nothing on its own.** Verified: under emulated `reduce`, `animate(el, { x: [0, 100] }, { duration: 1 })` was at x 49.9 after 500 ms, the same as without `reduce`.
- Guard yourself: read `matchMedia("(prefers-reduced-motion: reduce)")` before first paint, and add a "motion-on" class that hides elements only when motion will run (§4).
  - Under reduce: no entrances, no scroll-linked transforms, no gesture scaling.
  - Under reduce, keep: informational progress bars and press handling.
  - All three demos were verified this way.
- Docs alternative: `scopeMotion(setup, { matchMedia: "motion" })` runs setup only without a reduce preference.
- React: `<MotionConfig reducedMotion="user">` or `useReducedMotion()`.

## 9. Performance notes

- Eligible values run through WAAPI on the compositor: `transform`, `opacity`, `filter` and `clipPath` (docs). Verified for opacity and transform shorthands in time-based animations.
- Mixed calls split (docs): in `{ width, x }`, `x` is accelerated and `width` runs on the main thread. House rule still applies: transform and opacity only.
- Scroll: transform strings got native timelines; callbacks and shorthand transforms run in Motion's frame loop (§5).
- **With Lenis, the accelerated-scroll advantage is gone.** Lenis moves wheel scrolling onto the main thread, so a long task stalls the scroll and every linked animation, accelerated ones included (Motion's Lenis page).
- `inView` uses IntersectionObserver: no per-frame measuring.

## 10. When to reach for this instead of GSAP, and when not

**Reach for Motion when:**
1. **Interruptible gestures and springs** (hover, press, toggles, drawers). `visualDuration` springs keep the velocity they interrupt. `press` gives Enter, long-press and hold-to-repeat for free. GSAP has no springs.
2. **Small scroll-linked effects on pages without Lenis** (progress bars, a part sliding as a track scrolls). In Chrome, transform strings run on native Scroll/ViewTimelines, so they stay in step with the compositor's scroll.
3. **React work.** Use `motion/react` (`whileInView`, `AnimatePresence`, `layout` / `layoutId`) rather than `useGSAP` plumbing.

**Stay on GSAP + ScrollTrigger when:**
1. **The scene needs `pin`, `snap`, scrub smoothing, or `start`/`end` markers for debugging.** Motion has none of these built in; sticky CSS covers simple pins only.
2. **It is a no-bundler CDN page and weight matters.** Full Motion is 64.6 KB gz (65.4 KB via `+esm`) against 46.3 KB for GSAP + ScrollTrigger. Mini has no shorthands, spring or scroll.
3. **Text splitting or richer timeline navigation is needed.** `splitText` is paid. Motion's timeline lacks percentage offsets, next/previous label and per-tween callbacks (docs).

**Coexistence (verified in `demo-coexist.html`).** GSAP 3.15 + ScrollTrigger + Lenis 1.3.26 + Motion ran on one page with no console errors.
- Setup: Lenis driven only by `gsap.ticker` as in SKILL.md, a GSAP scrub tween, and a Motion `scroll()` lane on the same track.
- Result: during Lenis-smoothed wheel scrolling the two lanes read identical x at every sample (49.5/49.5, 300/300, 600/600). Motion's lanes were on native timelines.
- Motion's `scroll()` only reads the native scroll position Lenis writes, so there are not two scroll engines.
- Keep **one** Lenis driver: on a GSAP page that is `gsap.ticker`. Do not also add `frame.setup(lenis.raf)` (Motion's recipe for Motion-only pages).
- Never let GSAP and Motion both write `transform` on the same element.
