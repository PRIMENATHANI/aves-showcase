// The page: the figure is pinned and the reader's scroll takes the helmet apart.
(() => {
  const D = window.HX_PAGE;
  const hx = document.querySelector(".hx");
  const feats = [...hx.querySelectorAll(".hx-feat")];
  const nav = [...hx.querySelectorAll(".hx-nav button")];
  const hint = hx.querySelector(".hx-hint");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (new URLSearchParams(location.search).get("bg") === "lab") {
    const probe = new Image();
    probe.onload = () => {
      hx.querySelector(".hx-bg").style.backgroundImage = "url(assets/bg-lab.jpg)";
      hx.setAttribute("data-bg", "lab");
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
    feats.forEach((el) => (el.dataset.stage === D.stages[index].id ? el.setAttribute("data-on", "") : el.removeAttribute("data-on")));
    nav.forEach((el, at) => (at === index ? el.setAttribute("data-on", "") : el.removeAttribute("data-on")));
    hint.textContent = D.stages[index].hint || "";
  }
  gsap.registerPlugin(ScrollTrigger);
  let lenis = null;
  if (!reduced && window.Lenis) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  const stops = D.stages.map((stage) => stage.at);
  const trigger = ScrollTrigger.create({
    trigger: hx,
    start: "top top",
    end: () => "+=" + Math.round(innerHeight * 4.6),
    pin: true,
    anticipatePin: 1,
    scrub: reduced ? true : 0.5,
    snap: reduced ? undefined : { snapTo: stops, directional: false, duration: { min: 0.25, max: 0.7 }, delay: 0.14, ease: "power1.inOut" },
    onUpdate: (self) => {
      window.setExplode(self.progress);
      show(self.progress);
    },
    onRefresh: (self) => {
      window.setExplode(self.progress);
      show(self.progress);
    },
  });
  const go = (t) => {
    const y = trigger.start + (trigger.end - trigger.start) * t;
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
