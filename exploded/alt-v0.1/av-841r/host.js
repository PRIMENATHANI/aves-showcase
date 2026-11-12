// The page: the figure is pinned and the reader's scroll takes the helmet apart.
(() => {
  const D = window.HX_PAGE;
  const hx = document.querySelector(".hx");
  const nav = [...hx.querySelectorAll(".hx-nav button")];
  const sizeEl = hx.querySelector(".hx-size");
  const sizeVal = hx.querySelector("[data-size]");
  let sizeText = "";
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  // this design has no photograph behind the figure: the warm panel and the ghost word are in the markup
  // which stage a value of t belongs to: the last stage whose `from` it has passed
  const stageAt = (t) => D.stages.reduce((found, stage, index) => (t >= stage.from ? index : found), 0);
  let shown = -1;
  function show(t) {
    const skipEl = hx.querySelector(".hx-skip");
    if (skipEl) skipEl.hidden = t > 0.05;
    const index = stageAt(t);
    if (index === shown) return;
    shown = index;
    nav.forEach((el, at) => (at === index ? el.setAttribute("data-on", "") : el.removeAttribute("data-on")));
  }
  // callouts: ADS text beside the part it describes, joined to it by a leader that grows out from a dot on the part
  const stageEl = hx.querySelector(".hx-stage");
  const inner = hx.querySelector(".hx-in");
  const calls = D.callouts.map((call) => ({ ...call, el: hx.querySelector(`[data-call="${call.id}"]`), lead: hx.querySelector(`[data-lead="${call.id}"]`) }));
  for (const call of calls) {
    call.path = call.lead.querySelector("path");
    call.dot = call.lead.querySelector("circle");
  }
  const ramp = (a, b, x) => {
    const v = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return v * v * (3 - 2 * v);
  };
  let tNow = 0;
  function layout() {
    const box = inner.getBoundingClientRect(); // the small viewport: words never sit under a phone's toolbar
    const st = stageEl.getBoundingClientRect();
    const pinned = hx.hasAttribute("data-pinned");
    const narrow = box.width < 1000;
    const live = [];
    for (const call of calls) {
      const [in0, in1, out0, out1] = call.t;
      const p = pinned ? ramp(in0, in1, tNow) * (1 - ramp(out0, out1, tNow)) : 0;
      call.p = p;
      if (p <= 0.001) {
        if (call.shown !== 0) {
          call.shown = 0;
          call.el.style.opacity = "0";
          call.el.style.visibility = "hidden";
          call.lead.style.opacity = "0";
        }
        continue;
      }
      const at = window.hxProject ? window.hxProject(call.piece, call.at[0], call.at[1], call.nape) : null;
      if (!at) continue;
      call.x = st.left - box.left + at[0];
      call.y = st.top - box.top + at[1];
      live.push(call);
    }
    // the head size, live text in the headline face, while the ratchet stage is on
    const sp = pinned ? ramp(0.94, 0.985, tNow) : 0;
    sizeEl.style.opacity = sp.toFixed(3);
    sizeEl.style.visibility = sp > 0.001 ? "visible" : "hidden";
    if (sp > 0.001) {
      const text = (window.hxCm || 0).toFixed(1);
      if (text !== sizeText) {
        sizeText = text;
        sizeVal.innerHTML = `${text}<span class="u">cm</span>`;
      }
    }
    if (!live.length) return;
    live.sort((a, b) => a.y - b.y);
    if (narrow) {
      // phone: the words sit in the clear band under the figure, stacked from its top
      let top = box.height - 178;
      for (const call of live) {
        call.el.style.left = "18px";
        call.el.style.width = `${box.width - 36 - 26}px`;
        call.el.style.textAlign = "left";
        call.lx = 18;
        call.ly = top;
        top += call.el.offsetHeight + 8;
      }
    } else {
      // desktop: a column at the left, each callout level with its part, pushed apart where two would meet
      const floor = { left: 92, right: 66 }; // the product name sits under the logo at the left
      for (const call of live) {
        const side = call.x > box.width / 2 + 40 ? "right" : "left";
        call.side = side;
        call.lx = side === "left" ? 72 : box.width / 2 + 236;
        call.el.style.left = `${call.lx}px`;
        call.el.style.width = "236px";
        call.el.style.textAlign = side === "left" ? "right" : "left";
        call.ly = Math.min(box.height - 150, Math.max(floor[side], call.y - 12));
        floor[side] = call.ly + call.el.offsetHeight + 14;
      }
    }
    for (const call of live) {
      const { el, p } = call;
      el.style.top = `${call.ly}px`;
      const line = Math.min(1, p * 2);
      const words = Math.max(0, p * 2 - 1);
      let d;
      if (narrow) {
        const drop = call.x < box.width / 2;
        const viaX = drop ? 9 : Math.min(box.width - 44, Math.max(30, call.x));
        d = drop ? `M${call.x.toFixed(1)} ${call.y.toFixed(1)}L${viaX} ${call.y.toFixed(1)}L${viaX} ${(call.ly + 9).toFixed(1)}L15 ${(call.ly + 9).toFixed(1)}` : `M${call.x.toFixed(1)} ${call.y.toFixed(1)}L${viaX.toFixed(1)} ${(call.ly - 5).toFixed(1)}`;
      } else {
        d = `M${call.x.toFixed(1)} ${call.y.toFixed(1)}L${(call.side === "left" ? call.lx + 236 + 12 : call.lx - 12).toFixed(1)} ${(call.ly + 11).toFixed(1)}`;
      }
      call.path.setAttribute("d", d);
      const length = call.path.getTotalLength();
      call.path.style.strokeDasharray = `${length.toFixed(1)}`;
      call.path.style.strokeDashoffset = `${(length * (1 - line)).toFixed(1)}`;
      call.dot.setAttribute("cx", call.x.toFixed(1));
      call.dot.setAttribute("cy", call.y.toFixed(1));
      call.lead.style.opacity = String(Math.min(1, p * 6));
      el.style.visibility = "visible";
      el.style.opacity = words.toFixed(3);
      call.shown = 1;
    }
  }
  gsap.registerPlugin(ScrollTrigger);
  let lenis = null;
  if (!reduced && window.Lenis) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  // the last stretch of the pin is a hold: the helmet is fully apart before the page lets go
  const HOLD = D.hold || 1;
  const tOf = (progress) => Math.min(1, progress / HOLD);
  const stops = D.stages.map((stage) => stage.at * HOLD);
  const trigger = ScrollTrigger.create({
    trigger: hx,
    start: "top top",
    end: () => "+=" + Math.round(innerHeight * 4.6),
    pin: true,
    anticipatePin: 1,
    scrub: reduced ? true : 0.5,
    snap: reduced ? undefined : { snapTo: stops, directional: false, duration: { min: 0.25, max: 0.7 }, delay: 0.14, ease: "power1.inOut" },
    onUpdate: (self) => {
      tNow = tOf(self.progress);
      window.setExplode(tNow);
      show(tNow);
    },
    onRefresh: (self) => {
      window.setExplode(tOf(self.progress));
      show(tOf(self.progress));
    },
  });
  // the brand bar shows from just before the figure reaches the top until the pin lets go
  ScrollTrigger.create({
    trigger: hx,
    start: "top 90px",
    endTrigger: hx,
    end: () => "+=" + (Math.round(innerHeight * 4.6) + 90),
    onToggle: (self) => {
      if (self.isActive) {
        hx.setAttribute("data-pinned", "");
        document.documentElement.setAttribute("data-pin", "");
      } else {
        hx.removeAttribute("data-pinned");
        document.documentElement.removeAttribute("data-pin");
      }
    },
  });
  // the parts ease into place a little after the scroll, and the wheel can move one: lay the callouts out every frame
  gsap.ticker.add(layout);
  const go = (t) => {
    const y = trigger.start + (trigger.end - trigger.start) * t * HOLD;
    if (lenis) lenis.scrollTo(y, { duration: 0.9 });
    else window.scrollTo(0, y);
  };
  nav.forEach((button, index) => button.addEventListener("click", () => go(D.stages[index].at)));
  // ---- the page around the figure
  const root = document.documentElement;
  const skip = hx.querySelector(".hx-skip");
  const barH = () => (innerWidth < 1000 ? 46 : D.bar);
  const toEl = (el) => {
    if (el === hx) return go(0);
    if (lenis) lenis.scrollTo(el, { offset: -barH(), duration: 1 });
    else el.scrollIntoView();
  };
  document.querySelectorAll('a[href^="#"]').forEach((link) => link.addEventListener("click", (event) => {
    const el = document.getElementById(link.getAttribute("href").slice(1));
    if (!el) return;
    event.preventDefault();
    if (el.id === "top") (lenis ? lenis.scrollTo(0, { duration: 1 }) : window.scrollTo(0, 0));
    else toEl(el);
    el.setAttribute("tabindex", "-1");
    el.focus({ preventScroll: true });
  }));
  // an accessory that is in the figure jumps to its stage
  document.querySelectorAll("[data-go]").forEach((button) => button.addEventListener("click", () => {
    const stage = D.stages.find((entry) => entry.id === button.dataset.go);
    if (stage) go(stage.at);
  }));
  // shell colour: one attribute on <body>; every drawn shell reads its tones from it
  const swatches = [...document.querySelectorAll(".sw-b")];
  swatches.forEach((button) => button.addEventListener("click", () => {
    const id = button.dataset.shell;
    if (id === "white") document.body.removeAttribute("data-shell");
    else document.body.setAttribute("data-shell", id);
    swatches.forEach((other) => other.setAttribute("aria-pressed", String(other === button)));
    const nameEl = document.querySelector("[data-sw-name]");
    if (nameEl) nameEl.textContent = button.getAttribute("aria-label");
  }));
  // the page bar appears once the opening screen has gone; which section it is in lights its link
  const op = document.querySelector(".op");
  ScrollTrigger.create({ trigger: op, start: "bottom top+=60", end: "max", onToggle: (self) => (self.isActive ? root.setAttribute("data-bar", "") : root.removeAttribute("data-bar")) });
  const links = [...document.querySelectorAll(".pb-a")];
  links.forEach((link) => {
    const el = document.getElementById(link.getAttribute("href").slice(1));
    if (!el || el === hx) return;
    const next = links[links.indexOf(link) + 1];
    const until = next ? document.getElementById(next.getAttribute("href").slice(1)) : document.querySelector("footer");
    ScrollTrigger.create({ trigger: el, start: "top center", endTrigger: until, end: "top center", onToggle: (self) => (self.isActive ? link.setAttribute("data-on", "") : link.removeAttribute("data-on")) });
  });
  // ---- motion around the figure. GSAP ScrollTrigger + Lenis stay the only scroll engine. anime.js and Motion only read the
  // scroll position Lenis writes (anime's onScroll listens to native scroll events) and never move an element GSAP moves.
  const A = window.anime;
  const MO = window.Motion;
  // tiles and rows come in as one short stagger per group, once, when the group reaches the screen (anime.js)
  if (!reduced) {
    const groups = [...new Set([...document.querySelectorAll(".rv")].map((el) => el.parentElement))];
    for (const group of groups) {
      const kids = [...group.children].filter((el) => el.classList.contains("rv"));
      if (A) A.animate(kids, { opacity: [0, 1], y: [28, 0], duration: 620, ease: "out(3)", delay: A.stagger(60), autoplay: A.onScroll({ target: group, enter: "bottom-=8% top", sync: "play", repeat: false }) });
      else kids.forEach((el) => {
        gsap.set(el, { autoAlpha: 0, y: 26 });
        ScrollTrigger.create({ trigger: el, start: "top 92%", once: true, onEnter: () => gsap.to(el, { autoAlpha: 1, y: 0, duration: 0.5, ease: "power2.out" }) });
      });
    }
  }
  // the wordmark's highlighter is drawn in behind the word, like a marker stroke (anime.js line drawing)
  if (A && !reduced) {
    const marks = [...document.querySelectorAll(".wm-hl")];
    if (marks.length) A.animate(A.svg.createDrawable(marks), { draw: ["0 0", "0 1"], duration: 820, ease: "inOut(2)", delay: A.stagger(150, { start: 300 }) });
  }
  // the pill labels' leaders draw out from the pill to the helmet the first time the labels show (anime.js)
  {
    const lbl = document.querySelector(".lbl");
    const slotEl = document.querySelector(".op-slot");
    const lines = lbl ? [...lbl.querySelectorAll("line")] : [];
    if (A && !reduced && lines.length && slotEl) {
      const drawn = A.svg.createDrawable(lines);
      let done = false;
      const go = () => {
        if (done || !slotEl.hasAttribute("data-front") || !slotEl.hasAttribute("data-live") || document.documentElement.dataset.spin === "idle") return;
        done = true;
        A.animate(drawn, { draw: ["0 0", "0 1"], duration: 700, ease: "out(3)", delay: A.stagger(180, { start: 200 }) });
        A.animate(lbl.querySelectorAll("b"), { opacity: [0, 1], x: [-6, 0], duration: 500, ease: "out(3)", delay: A.stagger(180) });
      };
      new MutationObserver(go).observe(slotEl, { attributes: true });
      new MutationObserver(go).observe(document.documentElement, { attributes: true, attributeFilter: ["data-spin"] });
    }
  }
  // springy hover and press on the pill and round arrow buttons (Motion; nothing overshoots: bounce 0)
  if (MO && !reduced) {
    const SPR = { type: "spring", visualDuration: 0.22, bounce: 0 };
    const parts = (go) => [go.querySelector(".pill"), go.querySelector(".rnd")].filter(Boolean);
    const rest = (go, hovered) => {
      const [pill, arrow] = [go.querySelector(".pill"), go.querySelector(".rnd")];
      if (pill) MO.animate(pill, { scale: hovered ? 1.03 : 1 }, SPR);
      if (arrow) MO.animate(arrow, { x: hovered ? 4 : 0, scale: 1 }, SPR);
    };
    document.querySelectorAll(".go, .pill:not(.go .pill)").forEach((go) => {
      if (!parts(go).length && !go.classList.contains("pill")) return;
      const el = go.classList.contains("pill") && !go.classList.contains("go") ? null : go;
      if (!el) {
        MO.hover(go, () => {
          MO.animate(go, { scale: 1.03 }, SPR);
          return () => MO.animate(go, { scale: 1 }, SPR);
        });
        MO.press(go, () => {
          MO.animate(go, { scale: 0.96 }, SPR);
          return () => MO.animate(go, { scale: go.matches(":hover") ? 1.03 : 1 }, SPR);
        });
        return;
      }
      MO.hover(el, () => {
        rest(el, true);
        return () => rest(el, false);
      });
      MO.press(el, () => {
        parts(el).forEach((part) => MO.animate(part, { scale: 0.95 }, SPR));
        return () => rest(el, el.matches(":hover"));
      });
    });
  }
  // the features accordion: buttons with aria-expanded; the panel's height is measured once and eased (Motion), then let go
  document.querySelectorAll(".ac-b").forEach((button) => button.addEventListener("click", () => {
    const panel = document.getElementById(button.getAttribute("aria-controls"));
    const inner = panel.firstElementChild;
    const open = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!open));
    if (panel.anim) panel.anim.stop();
    if (!MO || reduced) {
      panel.hidden = open;
      panel.style.height = "";
      ScrollTrigger.refresh();
      return;
    }
    const from = panel.hidden ? 0 : panel.getBoundingClientRect().height;
    panel.hidden = false;
    const to = open ? 0 : inner.offsetHeight;
    const ease = [0.32, 0.72, 0, 1];
    panel.anim = MO.animate(panel, { height: [`${from}px`, `${to}px`] }, { duration: 0.36, ease });
    MO.animate(inner, { opacity: open ? 0 : [0, 1], y: open ? -6 : [8, 0] }, { duration: open ? 0.2 : 0.34, ease });
    const anim = panel.anim;
    anim.then(() => {
      if (panel.anim !== anim) return;
      if (button.getAttribute("aria-expanded") === "false") panel.hidden = true;
      panel.style.height = "";
      ScrollTrigger.refresh();
    });
  }));
  // ---- the 360 view. The opening helmet is a set of frames (assets/spin/, described by spin.json) drawn to one canvas.
  // A sideways drag or the arrow keys turn it. On scroll the same canvas travels to where the pinned figure stands and turns
  // to frame 0, which is the figure's own drawing; at the pin the figure takes over. One helmet on screen at any time.
  const SP = D.spin;
  const slot = document.querySelector(".op-slot");
  const cv = document.querySelector(".spin");
  const partsEl = hx.querySelector(".hx-parts");
  const cueEl = document.querySelector(".spin-cue");
  if (SP && slot && cv && cv.getContext) (async () => {
    let meta;
    try {
      meta = await (await fetch("assets/spin/spin.json")).json();
    } catch (error) {
      return; // no frames: the still helmet stays, the page is as it was
    }
    if (!meta || !(meta.count > 1) || !meta.width || !meta.height) return;
    const N = meta.count;
    const STEP = meta.step || 360 / N;
    const src = (i) => `assets/spin/spin-${String(((meta.start || 0) + i * STEP) % 360).padStart(3, "0")}.${meta.ext || "webp"}`;
    const imgs = new Array(N).fill(null);
    const load = (i) => new Promise((done) => {
      const im = new Image();
      im.onload = () => {
        const keep = () => {
          imgs[i] = im;
          done(true);
        };
        if (im.decode) im.decode().then(keep, keep);
        else keep();
      };
      im.onerror = () => done(false);
      im.src = src(i);
    });
    if (!(await load(0))) return;
    const ctx = cv.getContext("2d", { willReadFrequently: true });
    const st = { angle: 0, tween: null, drag: null, touched: false, geo: null, key: "", form: "", handed: null, shown: 0, luts: {}, tint: true, keyTo: null };
    const norm = (a) => ((a % 360) + 360) % 360;
    const snap = (a) => Math.round(a / STEP) * STEP;
    const nearest = (i) => {
      for (let d = 0; d <= N / 2; d += 1) {
        if (imgs[(i + d) % N]) return (i + d) % N;
        if (imgs[(i - d + N) % N]) return (i - d + N) % N;
      }
      return 0;
    };
    // grey of the white helmet -> the same tone of the chosen colour (the ramp the drawn figure uses)
    const lutFor = (id) => {
      if (id in st.luts) return st.luts[id];
      const tones = SP.ramp[id];
      if (!tones) return (st.luts[id] = null);
      const keep = SP.ramp.keep;
      const stops = [[keep, [keep, keep, keep]], ...SP.ramp.from.map((grey, index) => [grey, [1, 3, 5].map((at) => parseInt(tones[index].slice(at, at + 2), 16))])];
      const lut = [new Uint8Array(256), new Uint8Array(256), new Uint8Array(256)];
      for (let v = 0; v < 256; v += 1) {
        let hi = stops.findIndex((stop) => stop[0] >= v);
        if (hi < 0) hi = stops.length - 1;
        const lo = Math.max(0, hi - 1);
        const span = stops[hi][0] - stops[lo][0];
        const share = v <= keep || !span ? (v <= keep ? 0 : 1) : Math.min(1, (v - stops[lo][0]) / span);
        for (let c = 0; c < 3; c += 1) lut[c][v] = v <= keep ? v : Math.round(stops[lo][1][c] + (stops[hi][1][c] - stops[lo][1][c]) * share);
      }
      return (st.luts[id] = lut);
    };
    function draw(angle) {
      const want = ((Math.round(norm(angle) / STEP) % N) + N) % N;
      const index = nearest(want);
      const shell = document.body.dataset.shell || "white";
      const key = `${index}|${shell}|${cv.width}`;
      if (key === st.key) return;
      st.key = key;
      st.shown = index;
      if (index === 0) slot.setAttribute("data-front", "");
      else slot.removeAttribute("data-front");
      const w = cv.width;
      const h = cv.height;
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(imgs[index], 0, 0, w, h);
      const lut = st.tint ? lutFor(shell) : null;
      if (lut) {
        try {
          const data = ctx.getImageData(0, 0, w, h);
          const d = data.data;
          const keep = SP.ramp.keep;
          for (let q = 0; q < d.length; q += 4) {
            if (!d[q + 3]) continue;
            const v = ((d[q] + d[q + 1] + d[q + 2] + 1) / 3) | 0;
            if (v > keep) {
              d[q] = lut[0][v];
              d[q + 1] = lut[1][v];
              d[q + 2] = lut[2][v];
            }
          }
          ctx.putImageData(data, 0, 0);
        } catch (error) {
          st.tint = false; // the canvas cannot be read back (a page opened from disk): the helmet stays white
        }
      }
      cv.setAttribute("aria-valuenow", String(index * STEP));
      cv.setAttribute("aria-valuetext", `${index * STEP}°`);
    }
    // where the canvas rests (its slot) and where the pinned figure's helmet stands, both in the opening section's own
    // coordinates, so the page's scroll carries the canvas and only the offset between the two is animated
    function measure() {
      const o = op.getBoundingClientRect();
      const s = slot.getBoundingClientRect();
      const g = stageEl.getBoundingClientRect();
      const h = hx.getBoundingClientRect();
      if (!s.width || !g.width) return;
      const c = SP.cam;
      // the same close-up the figure's own runtime works out for the assembled helmet (place() in live.js)
      const close = Math.max(1, Math.min(2, (c.w * (hx.clientWidth / stageEl.clientWidth) - 70) / c.bw, (c.h - 40) / c.bh));
      const unit = stageEl.clientWidth / c.w;
      const hxTop = trigger.start - (o.top + window.scrollY);
      st.geo = {
        ax: s.left - o.left,
        ay: s.top - o.top,
        aw: s.width,
        bx: g.left - h.left - o.left + (c.w / 2 + close * (SP.box[0] - c.x)) * unit,
        by: hxTop + (g.top - h.top) + (c.h / 2 + close * (SP.box[1] - c.y)) * unit,
        bw: close * SP.box[2] * unit,
      };
      const cssH = (s.width * meta.height) / meta.width;
      cv.style.width = `${s.width.toFixed(2)}px`;
      cv.style.height = `${cssH.toFixed(2)}px`;
      const bw = Math.min(meta.width, Math.ceil(Math.max(st.geo.aw, st.geo.bw) * Math.min(window.devicePixelRatio || 1, 3)));
      if (cv.width !== bw) {
        cv.width = bw;
        cv.height = Math.round((bw * meta.height) / meta.width);
        ctx.imageSmoothingQuality = "high";
        st.key = "";
      }
      st.form = "";
    }
    const settle = () => {
      if (st.tween) st.tween.kill();
      st.tween = null;
      st.keyTo = null;
      st.angle = snap(st.angle);
      document.documentElement.dataset.spin = "rest";
    };
    function frame() {
      const g = st.geo;
      if (!g) return;
      const y = window.scrollY;
      const start = trigger.start;
      const handed = y >= start - 0.5;
      if (handed !== st.handed) {
        st.handed = handed;
        cv.hidden = handed;
        partsEl.style.visibility = handed ? "" : "hidden";
      }
      if (handed) return;
      const p = start > 0 ? Math.min(1, Math.max(0, y / start)) : 1;
      if (p > 0.04 && st.tween && !st.drag) settle();
      const scale = (g.aw + (g.bw - g.aw) * p) / g.aw;
      const form = `translate3d(${(g.ax + (g.bx - g.ax) * p).toFixed(2)}px,${(g.ay + (g.by - g.ay) * p).toFixed(2)}px,0) scale(${scale.toFixed(5)})`;
      if (form !== st.form) {
        st.form = form;
        cv.style.transform = form;
        op.style.setProperty("--away", p.toFixed(3)); // the slot's ground shadow and the cue fade as the helmet leaves
      }
      // on the way down the helmet turns, by the shorter way, to frame 0: the pinned figure's own angle
      const home = Math.round(st.angle / 360) * 360;
      draw(st.angle + (home - st.angle) * ramp(0, 0.8, p));
    }
    // a mostly sideways drag turns the helmet; anything else is left to the page (touch-action: pan-y)
    const PER_WIDTH = 210; // degrees for a drag as wide as the helmet
    const cueOff = () => {
      st.touched = true;
      if (cueEl) cueEl.removeAttribute("data-on");
    };
    cv.addEventListener("pointerdown", (event) => {
      if (event.button || st.handed) return;
      st.drag = { id: event.pointerId, x: event.clientX, y: event.clientY, on: false, from: 0, trail: [] };
    });
    cv.addEventListener("pointermove", (event) => {
      const drag = st.drag;
      if (!drag || event.pointerId !== drag.id) return;
      const dx = event.clientX - drag.x;
      const dy = event.clientY - drag.y;
      if (!drag.on) {
        if (Math.abs(dx) < 6 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
        if (st.tween) st.tween.kill();
        st.tween = null;
        st.keyTo = null;
        drag.on = true;
        drag.x = event.clientX;
        drag.from = st.angle;
        try {
          cv.setPointerCapture(event.pointerId);
        } catch (error) {}
        cv.setAttribute("data-drag", "");
        cueOff();
        return;
      }
      // dragging right carries the near side of the helmet to the right: the frame number falls
      st.angle = drag.from - ((event.clientX - drag.x) * PER_WIDTH) / cv.getBoundingClientRect().width;
      drag.trail.push([performance.now(), st.angle]);
      if (drag.trail.length > 6) drag.trail.shift();
      event.preventDefault();
    });
    const release = (event) => {
      const drag = st.drag;
      if (!drag || event.pointerId !== drag.id) return;
      st.drag = null;
      cv.removeAttribute("data-drag");
      if (!drag.on) return;
      const first = drag.trail[0];
      const last = drag.trail[drag.trail.length - 1];
      const fresh = last && performance.now() - last[0] < 90 && last[0] > first[0];
      const speed = fresh ? ((last[1] - first[1]) / (last[0] - first[0])) * 1000 : 0; // degrees a second
      const target = snap(st.angle + Math.max(-240, Math.min(240, speed * 0.3)));
      if (reduced) {
        st.angle = target;
        settle();
        return;
      }
      document.documentElement.dataset.spin = "turn";
      st.tween = gsap.to(st, { angle: target, duration: Math.min(1.2, 0.3 + Math.abs(target - st.angle) / 260), ease: "power3.out", onComplete: settle });
    };
    cv.addEventListener("pointerup", release);
    cv.addEventListener("pointercancel", release);
    cv.addEventListener("keydown", (event) => {
      const by = event.key === "ArrowLeft" ? STEP : event.key === "ArrowRight" ? -STEP : 0;
      if (!by || st.handed) return;
      event.preventDefault();
      cueOff();
      // a second press while the first is still easing adds to where that one was going; any other motion (the idle turn, a flick) stops where it is
      const target = snap((st.tween && st.keyTo !== null ? st.keyTo : st.angle) + by);
      if (st.tween) st.tween.kill();
      st.keyTo = target;
      if (reduced) {
        st.angle = target;
        settle();
        return;
      }
      document.documentElement.dataset.spin = "turn";
      st.tween = gsap.to(st, { angle: target, duration: 0.22, ease: "power2.out", onComplete: settle });
    });
    measure();
    frame();
    draw(0);
    cv.hidden = false;
    slot.setAttribute("data-live", "");
    if (cueEl) cueEl.setAttribute("data-on", "");
    document.documentElement.dataset.spin = "load";
    ScrollTrigger.addEventListener("refresh", measure);
    addEventListener("resize", measure);
    gsap.ticker.add(frame);
    window.hxSpin = { state: () => ({ angle: norm(st.angle), frame: st.shown * STEP, loaded: imgs.filter(Boolean).length, handed: Boolean(st.handed), tint: st.tint, cue: Boolean(cueEl && cueEl.hasAttribute("data-on")) }) };
    // the rest of the frames, nearest to the front first, a few at a time
    const queue = [];
    for (let d = 1; d <= N / 2; d += 1) {
      queue.push(d);
      if (N - d !== d) queue.push(N - d);
    }
    const worker = async () => {
      while (queue.length) {
        await load(queue.shift());
        st.key = "";
      }
    };
    await Promise.all([worker(), worker(), worker(), worker()]);
    // one slow turn on first view, then it rests; not if the reader has already touched it, scrolled on, or asked for less motion
    if (!reduced && !st.touched && window.scrollY < 4 && imgs.every(Boolean)) {
      document.documentElement.dataset.spin = "idle";
      st.tween = gsap.to(st, { angle: -360, duration: 9, delay: 0.5, ease: "sine.inOut", onComplete: () => {
        st.angle = 0;
        settle();
      } });
    } else if (!st.tween) document.documentElement.dataset.spin = "rest";
  })();
  window.setExplode(0);
  show(0);
  addEventListener("load", () => ScrollTrigger.refresh());
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(() => {
    ScrollTrigger.refresh();
    document.documentElement.dataset.ready = "1";
  });
})();
