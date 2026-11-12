// The page: the figure is pinned and the reader's scroll takes the helmet apart.
(() => {
  const D = window.HX_PAGE;
  const hx = document.querySelector(".hx");
  const nav = [...hx.querySelectorAll(".hx-nav button")];
  const hint = hx.querySelector(".hx-hint");
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
    const index = stageAt(t);
    if (index === shown) return;
    shown = index;
    nav.forEach((el, at) => (at === index ? el.setAttribute("data-on", "") : el.removeAttribute("data-on")));
    hint.textContent = D.stages[index].hint || "";
  }
  // callouts: ADS text beside the part it describes, joined to it by a leader that grows out from a dot on the part
  const stageEl = hx.querySelector(".hx-stage");
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
    const box = hx.getBoundingClientRect();
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
      const floor = { left: 66, right: 66 };
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
    onToggle: (self) => (self.isActive ? hx.setAttribute("data-pinned", "") : hx.removeAttribute("data-pinned")),
  });
  // the parts ease into place a little after the scroll, and the wheel can move one: lay the callouts out every frame
  gsap.ticker.add(layout);
  const go = (t) => {
    const y = trigger.start + (trigger.end - trigger.start) * t * HOLD;
    if (lenis) lenis.scrollTo(y, { duration: 0.9 });
    else window.scrollTo(0, y);
  };
  nav.forEach((button, index) => button.addEventListener("click", () => go(D.stages[index].at)));
  window.setExplode(0);
  show(0);
  addEventListener("load", () => ScrollTrigger.refresh());
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(() => {
    ScrollTrigger.refresh();
    document.documentElement.dataset.ready = "1";
  });
})();
