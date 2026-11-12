// The page: the figure is pinned and the reader's scroll takes the helmet apart.
(() => {
  const D = window.HX_PAGE;
  const hx = document.querySelector(".hx");
  const nav = [...hx.querySelectorAll(".hx-nav button")];
  const sizeEl = hx.querySelector(".hx-size");
  const sizeVal = hx.querySelector("[data-size]");
  let sizeText = "";
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  // the lab photo sits behind the pinned figure, strong by default; ?bg=soft is the paler one, ?bg=plain removes it
  const bg = new URLSearchParams(location.search).get("bg");
  if (bg !== "plain") {
    const probe = new Image();
    probe.onload = () => {
      hx.querySelector(".hx-bg").style.backgroundImage = "url(assets/bg-lab.jpg)";
      hx.setAttribute("data-bg", bg === "soft" ? "lab" : "strong");
    };
    probe.src = "assets/bg-lab.jpg";
  }
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
    // the head size, in the title face, while the ratchet stage is on: glyph pictures composed into the number
    const sp = pinned ? ramp(0.94, 0.985, tNow) : 0;
    sizeEl.style.opacity = sp.toFixed(3);
    sizeEl.style.visibility = sp > 0.001 ? "visible" : "hidden";
    if (sp > 0.001) {
      const text = (window.hxCm || 0).toFixed(1);
      if (text !== sizeText) {
        sizeText = text;
        const glyph = (name) => `<img src="assets/type-g-${name}.png" width="${D.glyphs[name]}" height="${D.glyphs.h}" alt="">`;
        sizeVal.innerHTML = [...text].map((ch) => glyph(ch === "." ? "dot" : ch)).join("") + `<span class="u">${glyph("cm")}</span>`;
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
  // short reveals for the sections after the figure; start states are set here, so without this script nothing is hidden
  if (!reduced) {
    document.querySelectorAll(".rv").forEach((el) => {
      gsap.set(el, { autoAlpha: 0, y: 26 });
      ScrollTrigger.create({ trigger: el, start: "top 88%", once: true, onEnter: () => gsap.to(el, { autoAlpha: 1, y: 0, duration: 0.5, ease: "power2.out" }) });
    });
  }
  window.setExplode(0);
  show(0);
  addEventListener("load", () => ScrollTrigger.refresh());
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(() => {
    ScrollTrigger.refresh();
    document.documentElement.dataset.ready = "1";
  });
})();
