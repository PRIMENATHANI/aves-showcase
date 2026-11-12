# anime.js 4 reference

Checked 12 November 2026 against the npm registry, the installed package (`animejs@4.5.0`: source and `.d.ts`), the official docs at animejs.com/documentation and the GitHub migration wiki. Every snippet below was run in headless Chrome 1280×800 (`snippets.html`, `snippets2.html`, `snippets3.html`, the demos) with no exceptions and no console errors from the library. Signatures not run are marked "from docs" or "from types". Lab: `~/Documents/Claude/Sloane/web-motion-lab/animejs/` (demos, `vendor/` offline builds of anime, gsap, ScrollTrigger and lenis, `shots/`).

**Not checked:**
- Real devices and Safari (headless Chrome only)
- Frame rate under load
- `createLayout`, `scrambleText`, `createAnimatable`, the Three.js adapter
- Scope `mediaQueries` re-running when the query changes live
- Per-module ESM loaded from a CDN through an import map
- WAAPI smoothness under main-thread load (from docs)
- Draggable driven by a real pointer (only `setX()` was run)

The docs header still reads "4.0.0". Where the docs and 4.5.0 disagreed, this file gives what 4.5.0 did.

The skill's rules still apply:
- Animate transform and opacity only. Line drawing is the one exception: `draw` animates `stroke-dasharray`, which is paint, not layout.
- Honour reduced motion.
- No `loop: true` or `alternate` for decoration. The docs examples use them everywhere; do not copy that.

## Install

| | |
|---|---|
| Version | 4.5.0 (`latest`; a `beta` tag points to 5.0.0-beta.3, do not use it) |
| Licence | MIT |
| UMD build `anime.umd.min.js` | 118.0 KB min, 40.6 KB gzip, global `anime` |
| ESM build `anime.esm.min.js` | 118.7 KB min, 40.9 KB gzip |

For comparison, measured the same way: GSAP 3.15.0 + ScrollTrigger = 117.5 KB min, 46.3 KB gzip. Lenis 1.3.26 = 5.4 KB gzip.

Paste lines: all URLs return 200, and the jsDelivr UMD file is byte-identical to the npm file.

```html
<!-- classic script (works from file:// too) -->
<script src="https://cdn.jsdelivr.net/npm/animejs@4.5.0/dist/bundles/anime.umd.min.js"></script>
<!-- or cdnjs, with SRI -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/animejs/4.5.0/anime.umd.min.js"
  integrity="sha512-dnhflec5WaXvpVYrt0oWfe0iUyWpjNiZbxkjrhNu9WAWWHLX7VqqyxCZHL7dWCrwj6lN+XGN9FtiWIBgX2b/PA==" crossorigin="anonymous"></script>
<script>const { animate, createTimeline, stagger, onScroll, svg, splitText, createScope, utils } = anime;</script>

<!-- ES module: run over http:// (file:// module loading is blocked by Chrome; general browser rule, not tested here) -->
<script type="module">
  import { animate, stagger } from 'https://cdn.jsdelivr.net/npm/animejs@4.5.0/dist/bundles/anime.esm.min.js';
  // cdnjs: https://cdnjs.cloudflare.com/ajax/libs/animejs/4.5.0/anime.esm.min.js
  // SRI sha512-Wr0/JdMQ70ZcJuGM00/sVJDfzeCWRFL+H7A8zTi1gIH6t5KwIFBi5yGyXAb1EV81yyJfOAC5cBMR56NZNC5a0g==
</script>
```

## Minimal page

```html
<div class="card">A</div><div class="card">B</div>
<script src="vendor/anime.umd.min.js"></script>
<script>
  const { animate, stagger } = anime;
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    animate('.card', { opacity: [0, 1], y: [24, 0], duration: 600, ease: 'out(3)', delay: stagger(60) });
  }
</script>
```

Keep content visible in CSS and let JS set the start state with `[from, to]` arrays. If the script fails, or reduced motion skips it, nothing stays hidden.

## API by task

**Entrance.** `animate(targets, params)` returns a `JSAnimation`.
- Targets: a selector, an element, a NodeList or an array.
- `x`, `y`, `scale`, `rotate` are individual transforms.
- Defaults: `duration` 1000 ms and `ease` `'out(2)'`. Set both every time.
- `[from, to]` arrays render the from-value at creation, including during a stagger delay (measured: the 4th card read opacity 0 at 0 and 100 ms).

```js
animate('.card', { opacity: [0, 1], y: [24, 0], duration: 600, ease: 'out(3)' });
```

**Stagger.** `stagger(value, { start, from, reversed, ease, grid, axis, modifier, use, total, jitter, seed })`.
- `from` takes `'first'`, `'center'`, `'last'`, `'random'` or an index.
- With `grid: [cols, rows]`, `from: 'center'` radiates outward (measured: the middle tiles lead).

```js
animate('.tile', { opacity: [0, 1], scale: [0.92, 1], delay: stagger(40, { grid: [6, 4], from: 'center' }) });
animate('.bar', { scaleY: stagger([0.2, 1]) });   // value range: measured 0.2 | 0.6 | 1
```

**Timeline.** `createTimeline({ defaults, autoplay, playbackEase, ... })` then `.add(targets, params, position)`.

Positions:
- a number in ms
- `'+=100'` or `'-=100'` (relative to the previous end)
- `'<'` (previous end) or `'<<'` (previous start), and `'<<+=100'`
- `'label'` or `'label+=100'`
- `stagger(...)` to spread children

```js
const tl = createTimeline({ defaults: { ease: 'out(3)', duration: 600 } })
  .add('.title', { opacity: [0, 1], y: [24, 0] })
  .add('.rule', { scaleX: [0, 1] }, '-=300')
  .label('parts')
  .add('.tile', { opacity: [0, 1], delay: stagger(40) }, 'parts+=100')
  .init();   // REQUIRED, see traps
```

Playback: `play()` always forward, `reverse()` always backward, `resume()` keeps the current direction; also `seek(ms)`, `.progress` (0 to 1), `.duration`, `.then(fn)`.

**Scroll-linked.** `onScroll(params)` returns a `ScrollObserver`. You link it by passing it as `autoplay` to `animate`, `createTimeline` or `createTimer`.

Thresholds are `'<container> <target>'`:
- `enter: 'top top'` means the container's top meets the target's top.
- Keywords: `top`, `bottom`, `center`, `start`, `end`, `min`, `max`.
- Offsets: `'bottom-=10%'`, `'center+=1em'`.
- Defaults: `enter: 'end start'`, `leave: 'start end'`.

`sync` options:
- `true` or `1`: scrub, progress follows scroll exactly. Measured to 3 decimals.
- `0` to `1`: smoothed catch-up. Lower values lag more (from docs, not measured).
- an ease name such as `'inOutCirc'`: eased scrub (from docs).
- method names: `'play'` (enter), `'play pause'` (enter, leave; this is the default), or `'resume pause reverse reset'` (enter forward, leave forward, enter backward, leave backward).

`repeat: false` fires once. `debug: true` draws the threshold markers. `container` takes a scrolling element; the window is the default.

```js
// scrubbed, pinned scene: pin with CSS sticky; the wrapper height is the scroll length
// .scene { height: 300vh } .stage { position: sticky; top: 0; height: 100vh }
createTimeline({
  autoplay: onScroll({ target: '.scene', enter: 'top top', leave: 'bottom bottom', sync: true }),
  defaults: { ease: 'linear', duration: 1000 },
}).add('.part', { x: ['-30vw', '30vw'], rotate: [-8, 8] }, 0)
  .add('.meter i', { scaleX: [0, 1] }, 0);

// one-shot reveal
animate('.caption', { opacity: [0, 1], y: [40, 0], duration: 700, ease: 'out(3)',
  autoplay: onScroll({ target: '.caption', enter: 'bottom-=10% top', sync: 'play', repeat: false }) });
```

Observer: `.progress`, `.velocity`, `.backward`, `.refresh()`, `.revert()`; callbacks `onEnter`/`onLeave` (+ `Forward`/`Backward`), `onUpdate`, `onSyncComplete`, `onResize` (from types).

The source shows a ResizeObserver on the scroll container, and position is measured with sticky ancestors temporarily set to `position: static`, so sticky pins measure correctly. It has no pin, no pin spacer and no scroll snap. `utils.snap` is a number-rounding helper.

**SVG line drawing.** `svg.createDrawable(sel)` returns an array of proxied elements with a `draw` property, written `'start end'` with each from 0 to 1.

```js
const [route] = svg.createDrawable('#route');
animate(route, { draw: ['0 0', '0 1'], duration: 2400, ease: 'inOut(2)' });
```

**Motion path.** `svg.createMotionPath(path, offset = 0)` returns `{ translateX, translateY, rotate }`. Spread it into the params. Draw the moving shape around 0,0 so its centre rides the line. Measured: the marker stays within 0.08 user units of the path at every sample, and it rotates to the path's tangent.

```js
animate('.marker', { ...svg.createMotionPath('#route'), duration: 2400, ease: 'inOut(2)' });
```

**Morph.** `svg.morphTo(shape, precision = .33)` for `path` (`d`), `polyline` and `polygon` (`points`). Measured: a triangle's `points` became a 96-number list matching the target shape.

```js
animate('.shape-a', { points: svg.morphTo('.shape-b'), duration: 600, ease: 'inOut(2)' });
```

**Draggable.** `createDraggable(target, { container, x, y, snap, releaseEase, onGrab, onDrag, onRelease, onSettle, ... })`. Methods: `setX`, `setY`, `disable`, `enable`, `reset`, `refresh`, `revert` (from types; `setX` run, pointer drag not tested).

```js
const d = createDraggable('.knob', { container: '.track', y: false, releaseEase: spring({ bounce: 0.2 }) });
```

**Easings.** Strings: `linear`, `in`/`out`/`inOut` plus `Quad`, `Cubic`, `Quart`, `Quint`, `Sine`, `Expo`, `Circ`, `Back`, `Elastic`, `Bounce` (for example `outQuad`), and power forms `'out(3)'`, `'inOut(2)'`. Functions: `cubicBezier(x1, y1, x2, y2)`, `steps(n)`, `linear(...)`, `irregular(...)` (from types; only the string forms were run).

**Spring.** Use `spring({ bounce, duration })` (perceived, SwiftUI-style) or `spring({ mass, stiffness, damping, velocity })`.
- Defaults measured in 4.5.0: `bounce` 0.5, perceived `duration` 628 ms. The `.d.ts` comments wrongly say 0.
- The spring replaces the animation's `duration` with its settling time. Measured: `spring({ bounce: .25, duration: 400 })` gave `anim.duration` = 900 even with `duration: 9999`.
- `createSpring()` still works but logs "deprecated, use spring()".

```js
animate('.panel', { y: [40, 0], ease: spring({ bounce: 0.15, duration: 400 }) });
```

**Text split.** `splitText(target, { lines, words, chars, accessible, includeSpaces, debug })` returns a `TextSplitter` with `.lines`, `.words` and `.chars`.
- The original text stays in a visually hidden span; the split spans are `aria-hidden` (`accessible` defaults on).
- Words and chars on their own split synchronously.
- With `lines: true`, the split waits for `document.fonts.ready`. **All three arrays are empty right after the call.** Animate inside `addEffect`, which re-runs when the element's width changes; measured: 2 lines became 4 on narrowing.
- `split.revert()` restores the original text.

```js
const split = splitText('.headline', { lines: true, words: true });
split.addEffect(({ lines }) => animate(lines, { opacity: [0, 1], y: ['1em', 0], delay: stagger(80) }));
```

**Reduced motion and cleanup with scopes.** `createScope({ root, defaults, mediaQueries })`.
- `.add(ctx => { ... })`: `ctx.matches.<name>` holds each media query's result. A returned function runs on `scope.revert()` (measured).
- `scope.revert()` reverts everything created inside the scope.
- The library itself never reads `prefers-reduced-motion`; this is your job.

```js
const scope = createScope({ mediaQueries: { reduce: '(prefers-reduced-motion: reduce)' } })
  .add(ctx => {
    if (ctx.matches.reduce) return;            // CSS final state stays; nothing animates
    animate('.card', { opacity: [0, 1], y: [24, 0], duration: 600, ease: 'out(3)' });
  });
// later (route change, teardown): scope.revert();
```

**Cleanup by hand.**
- `anim.revert()` restores the inline style that was there before. Measured: a prior `translateX(7px)` came back; with no prior style, the attribute was removed.
- A completed animation leaves its inline styles in place.
- Other helpers: `utils.remove(targets)` stops animations on those targets, and `utils.cleanInlineStyles(anim)`.
- Also available: `utils.set`, `utils.get`, `utils.clamp`, `utils.mapRange`, `utils.round(v, decimals)`.

**Hardware-accelerated option.** `waapi.animate(targets, params)` runs on the Web Animations API; the docs say it stays smooth while the main thread is busy (not measured). Run with `x`, `scale`, `spring()` and `stagger`: it resolved at `translate 40px`. It is 4.8 KB gzip on its own when tree-shaken.

## v3 to v4 traps (old examples will break)

- `anime({ targets: '.a', ... })` becomes `animate('.a', { ... })`. The UMD global `anime` is now a namespace, not a function.
- `easing: 'easeOutQuad'` becomes `ease: 'outQuad'`. The default ease is now `'out(2)'`.
- Old spring strings such as `'spring(1, 80, 10, 0)'` become a `spring({...})` object.
- `direction: 'reverse'` / `'alternate'` become `reversed: true` / `alternate: true`. `loop` counts repeats (`loop: 1` plays twice). `endDelay` becomes `loopDelay` (no delay after the last loop).
- `{ value: x }` becomes `{ to: x }`; `round: 100` becomes `modifier: utils.round(2)`.
- `anime.timeline()` becomes `createTimeline()`, with child defaults inside `defaults: {}`.
- `begin`, `update`, `complete` become `onBegin`, `onUpdate`, `onComplete`. `onBegin` now fires after the delay. `change` becomes `onRender`. `loopBegin` and `loopComplete` become `onLoop`.
- `.finished.then()` becomes `.then()`.
- `anime.path()` becomes `svg.createMotionPath()` (returns `translateX`, `translateY`, `rotate`); `anime.setDashoffset` becomes `svg.createDrawable()` plus `draw`; `anime.set/get/remove/random` move to `utils.*`.
- `play()` no longer resumes a reversed animation backwards; use `resume()`.
- **Trap hit in the lab:** timeline children do not render their from-values until each child starts. Tiles sat visible, then snapped to 0 and faded back in. Call `.init()` after the last `.add()`. Measured: without `.init()` a later child read opacity 1 at 100 ms; with it, 0. Plain `animate()` (autoplaying, staggered or scroll-linked) renders its start state on its own.

## Performance notes

- With `x`, `y`, `scale` and `rotate`, the library writes one `transform` string. Prefer those over `left`, `top`, `width`, `height`.
- Tree-shaken sizes (esbuild, gzip, cumulative): `animate` 12.7 KB; + timeline + stagger 15.5; + `onScroll` 19.9; + `svg` 21.1; + `splitText` 23.8. Those need a bundler; without one the full 40.6 KB bundle loads.
- `engine.pauseOnDocumentHidden` defaults to true. The engine's fps cap reads 240.
- A fractional `sync` (0.25) adds its own smoothing; on a Lenis page that would smooth twice, so use `sync: true` with Lenis (inference, not measured).
- Reduced motion on a pinned scene: also drop the runway (`.scene { height: auto } .stage { position: static }`), or the reader scrolls 300vh past a still frame.

## When to reach for this instead of GSAP, and when not

**Coexistence (tested in `demo-coexist.html`).** The page loads Lenis, then a GSAP ScrollTrigger pin with `pinSpacing`, then an anime.js `onScroll` scene below it. The anime scene tracked progress exactly (0.25, 0.5 and 0.75 matched) with both creation orders, under `lenis.scrollTo` both immediate and smooth.
- The two scroll engines do not fight. anime.js listens to native `scroll` events, which Lenis produces, so it needs no wiring.
- They do fight on a single element. When GSAP and anime.js both animate one element's transform, GSAP's next write dropped anime's `rotate` (`check-mixed-element.html`). Give each element to one library only.

**Reach for anime.js when:**
- A designer-facing page needs SVG line drawing, morphing or motion paths. All three are built in, short and MIT-licensed. GSAP has them as DrawSVG, MorphSVG and MotionPath plugins: free, but three more files and registrations.
- You want springs by feel (`bounce` plus a perceived `duration`) or `waapi.animate` for compositor-thread entrances.
- You want a draggable with spring release and container friction in a few lines.
- Line splitting must stay correct on resize: `addEffect` re-splits and replays.
- The project uses a bundler and needs only a few modules: 12 to 24 KB gzip against roughly 46 KB for GSAP plus ScrollTrigger.

**Stay with GSAP + ScrollTrigger when:**
- You need pinning with automatic spacing, scroll snap, `scrub: 1` lag tuned against Lenis, or `matchMedia` breakpoint rebuilding that is already proven in our pages. anime.js has no pin (use CSS sticky) and no scroll snap.
- The page is already GSAP-driven. Adding anime.js costs another 40.6 KB gzip without a bundler for features that are mostly already free in GSAP.
- You need ScrollTrigger's mature refresh and order tools (`refreshPriority`, `invalidateOnRefresh`). anime.js relies on a ResizeObserver plus `obs.refresh()`.
- You want the larger body of production examples and community answers. v4 is young, and most anime.js examples online are v3 and will break.
