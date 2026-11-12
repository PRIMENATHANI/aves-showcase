const D = __DATA__;
const MODEL = (() => {
__MODEL__
  return { rearFor, tailRing, napeShift, TAIL, loopLength };
})();
const shareOf = __SHARE__;
const root = document.querySelector(".hx");
const stage = root.querySelector(".hx-stage");
const holder = stage.querySelector(".hx-parts");
const readout = root.querySelector("[data-readout]");
const live = root.querySelector("[data-live]");
const partButtons = [...root.querySelectorAll(".hx-part")];
const still = matchMedia("(prefers-reduced-motion: reduce)");
// inside a host page the page's scroll drives the explode: no tour, no drag to explode, no keys that scroll
const HOST = Boolean(window.HX_HOST);
const clamp = (value, low, high) => Math.min(high, Math.max(low, value));

const nodes = [...holder.querySelectorAll(".it")].map((el) => ({
  el,
  piece: el.dataset.piece,
  key: Number(el.dataset.k),
  m: el.dataset.m.split(",").map(Number),
  nape: el.hasAttribute("data-nape"),
  tail: Number(el.dataset.tail || 0),
  ribs: el.querySelector("[data-ribs]"),
  shown: "",
}));
for (const node of nodes) {
  node.sx = D.EX[0] * node.m[0] + D.EY[0] * node.m[1] + D.EZ[0] * node.m[2];
  node.sy = D.EX[1] * node.m[0] + D.EY[1] * node.m[1] + D.EZ[1] * node.m[2];
  node.depth = node.m[0] * D.V[0] + node.m[1] * D.V[1] + node.m[2] * D.V[2];
}
let order = nodes.map((_, index) => index);
const STOPS = [0, 0.35, 0.62, 0.72, 0.88, 1];
const STAGE = { shell: 0.35, band: 0.35, chin: 0.62, brow: 0.72, crown: 0.88, knob: 1 };
const cosY = Math.cos(D.yaw);
const sinY = Math.sin(D.yaw);
const plan = ([x, y]) => [x * cosY - y * sinY, x * sinY + y * cosY];
const REST_A = MODEL.rearFor(D.fit.rest);

// what the reader has asked for, and what the parts are showing
const state = { t: 0, tWant: 0, cm: D.fit.rest, cmWant: D.fit.rest, direct: false };
let selected = null;
let touring = !still.matches && !HOST;
let hosted = HOST;
let tourClock = 0;
let idleTimer = 0;
let visible = false;
let frame = 0;
let last = 0;
let shownA = null;
let shownRibs = -1;
let shownCam = null;
const cam = stage.querySelector(".hx-cam");

function say(text) {
  if (readout.textContent !== text) readout.textContent = text;
}
const cmText = (cm) => `${cm.toFixed(1)} cm`;
function describe() {
  const where = state.tWant >= 0.999 ? "Apart" : state.tWant <= 0.001 ? "Assembled" : Math.abs(state.tWant - 0.35) < 0.1 ? "Shell off, suspension whole" : `${Math.round(state.tWant * 100)}% apart`;
  const text = `${where}. Headband set to ${cmText(state.cmWant)}.${selected ? ` Selected: ${D.pieces[selected].say}.` : ""}`;
  if (stage.getAttribute("aria-valuetext") !== text) stage.setAttribute("aria-valuetext", text);
  stage.setAttribute("aria-valuenow", String(Math.round(state.tWant * 100)));
}
function readoutText() {
  if (selected === "knob" || Math.abs(state.cm - state.cmWant) > 0.02) return `ratchet · headband ${cmText(state.cm)}`;
  if (selected) return D.pieces[selected].say;
  const size = cmText(state.cm);
  const t = state.t;
  if (t <= 0.001) return `assembled · headband ${size}`;
  if (t >= 0.999) return `apart · ${D.order.length} assemblies · headband ${size}`;
  if (t < 0.25) return "shell lifting";
  if (t <= 0.45) return `shell off · suspension whole · ${size}`;
  if (t < 0.64) return "chin strap AV-729";
  if (t < 0.76) return "sweatband AV-724PU";
  if (t < 0.92) return "crown suspension · suspension keys";
  return "ratchet wheel";
}

function select(id) {
  if (id === "stand") id = null;
  if (selected === id) return;
  selected = id;
  for (const node of nodes) {
    if (id && node.piece === id) node.el.setAttribute("data-on", "");
    else node.el.removeAttribute("data-on");
  }
  if (id) stage.setAttribute("data-focus", "");
  else stage.removeAttribute("data-focus");
  partButtons.forEach((button) => (button.dataset.part === id ? button.setAttribute("data-on", "") : button.removeAttribute("data-on")));
  describe();
}

function drawTails(A) {
  for (const node of nodes) {
    if (!node.tail) continue;
    const paths = extrude(MODEL.tailRing(A, node.tail).map(plan), MODEL.TAIL.z, MODEL.TAIL.h, D.P, { convex: false });
    const set = (selector, d) => node.el.querySelector(selector).setAttribute("d", d || "");
    set(".iso-fill", paths.fill);
    paths.shades.forEach((d, shade) => set(`.iso-shade[data-shade="${shade}"]`, d));
    set(".iso-top", paths.top);
    set(".iso-crease", paths.crease);
    set(".iso-edge", paths.outline);
  }
}

function place() {
  const A = MODEL.rearFor(state.cm);
  if (A !== shownA) {
    shownA = A;
    drawTails(A);
  }
  const shift = MODEL.napeShift(A, REST_A);
  const [wx, wy] = plan([shift, 0]);
  const fx = D.EX[0] * wx + D.EY[0] * wy;
  const fy = D.EX[1] * wx + D.EY[1] * wy;
  const fitDepth = wx * D.V[0] + wy * D.V[1];
  const turnsBy = (state.cm - D.fit.rest) * D.knob.perCm;
  const pitch = (2 * Math.PI) / D.knob.ribs;
  const phase = (((turnsBy % pitch) + pitch) % pitch) / pitch;
  const ribs = Math.min(D.knob.frames.length - 1, Math.floor(phase * D.knob.frames.length));
  const pull = shareOf(D.windows, "shell", state.t);
  const room = root.clientWidth && stage.clientWidth ? root.clientWidth / stage.clientWidth : 1;
  const close = Math.max(1, Math.min(2, (D.cam.w * room - 70) / D.cam.bw, (D.cam.h - 40) / D.cam.bh));
  const zoom = close + (1 - close) * pull;
  const px = D.cam.x + (D.cam.w / 2 - D.cam.x) * pull;
  const py = D.cam.y + (D.cam.h / 2 - D.cam.y) * pull;
  const camText = pull >= 1 ? "" : `translate(${(D.cam.w / 2).toFixed(2)} ${(D.cam.h / 2).toFixed(2)}) scale(${zoom.toFixed(4)}) translate(${(-px).toFixed(2)} ${(-py).toFixed(2)})`;
  if (camText !== shownCam) {
    shownCam = camText;
    if (camText) cam.setAttribute("transform", camText);
    else cam.removeAttribute("transform");
  }
  const shares = {};
  D.order.forEach((id) => (shares[id] = shareOf(D.windows, id, state.t)));
  for (const node of nodes) {
    const share = shares[node.piece] || 0;
    const tx = node.sx * share + (node.nape ? fx : 0);
    const ty = node.sy * share + (node.nape ? fy : 0);
    const text = Math.abs(tx) < 0.005 && Math.abs(ty) < 0.005 ? "" : `translate(${tx.toFixed(2)} ${ty.toFixed(2)})`;
    if (text !== node.shown) {
      node.shown = text;
      if (text) node.el.setAttribute("transform", text);
      else node.el.removeAttribute("transform");
    }
    node.now = node.key + node.depth * share + (node.nape ? fitDepth : node.tail ? fitDepth / 2 : 0);
    if (node.ribs && ribs !== shownRibs) node.ribs.innerHTML = D.knob.frames[ribs];
  }
  shownRibs = ribs;
  const next = nodes.map((_, index) => index).sort((a, b) => nodes[a].now - nodes[b].now || a - b);
  if (next.some((index, at) => index !== order[at])) {
    const fragment = document.createDocumentFragment();
    for (const index of next) fragment.appendChild(nodes[index].el);
    holder.appendChild(fragment);
    order = next;
  }
  say(readoutText());
}

// the idle tour: come apart, run the ratchet in and out, close up
const TOUR = [
  [1.4, { t: 0 }],
  [5.2, { t: 0.35 }],
  [5.4, { t: 1 }],
  [2.6, { cm: D.fit.min }],
  [3.2, { cm: D.fit.max }],
  [2.2, { cm: D.fit.rest }],
  [5.5, { t: 0 }],
];
const TOUR_LENGTH = TOUR.reduce((sum, [seconds]) => sum + seconds, 0);
function tourAt(clock) {
  let at = clock % TOUR_LENGTH;
  const want = { t: 0, cm: D.fit.rest };
  for (const [seconds, target] of TOUR) {
    Object.assign(want, target);
    if (at < seconds) break;
    at -= seconds;
  }
  return want;
}

function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  const calm = still.matches;
  if (touring) {
    tourClock += dt;
    const want = tourAt(tourClock);
    state.tWant = want.t;
    state.cmWant = want.cm;
  }
  const ease = (value, want, seconds, snap) => {
    if (calm || state.direct) return want;
    const next = value + (want - value) * (1 - Math.exp(-dt / seconds));
    return Math.abs(want - next) < snap ? want : next;
  };
  // t runs at a steady rate so each assembly leaves in its own time; the windows ease each one
  const pace = dt * (touring ? 0.24 : 0.75);
  state.t = calm || state.direct ? state.tWant : state.t + Math.min(pace, Math.max(-pace, state.tWant - state.t));
  state.cm = ease(state.cm, state.cmWant, touring ? 0.5 : 0.16, 0.004);
  state.direct = false;
  place();
  const settled = !touring && state.t === state.tWant && state.cm === state.cmWant;
  frame = visible && !settled ? requestAnimationFrame(tick) : 0;
}
function run() {
  if (!frame && visible) {
    last = 0;
    frame = requestAnimationFrame(tick);
  }
}
function hold() {
  touring = false;
  clearTimeout(idleTimer);
  if (!hosted && !still.matches) {
    idleTimer = setTimeout(() => {
      if (selected || stage.matches(":hover")) return hold();
      touring = true;
      tourClock = 0;
      state.tWant = 0;
      run();
    }, 3600);
  }
}
function setApart(t, direct = false) {
  state.tWant = clamp(t, 0, 1);
  state.direct = direct;
  if (direct) state.t = state.tWant;
  describe();
  run();
}
function setFit(cm) {
  state.cmWant = clamp(cm, D.fit.min, D.fit.max);
  // the suspension is inside the shell: lift the shell off before the ratchet turns
  if (HOST && state.t < 0.3) return;
  if (!HOST && state.tWant < 0.35) state.tWant = 0.35;
  describe();
  run();
}
// for a host page: its scroll (or anything else) drives the explode, 0 assembled to 1 apart
window.setExplode = (t) => {
  if (selected === "knob" && Number(t) < 0.8) select(null);
  hosted = true;
  hold();
  setApart(Number(t) || 0, true);
  if (!visible) place();
};
window.setFit = (cm) => {
  hosted = true;
  hold();
  setFit(Number(cm) || D.fit.rest);
};

new IntersectionObserver(
  (entries) => {
    visible = entries[entries.length - 1].isIntersecting;
    if (visible) run();
  },
  { rootMargin: "120px 0px" },
).observe(stage);

const pieceAt = (event) => {
  const hit = document.elementFromPoint(event.clientX, event.clientY);
  const item = hit && hit.closest ? hit.closest(".it") : null;
  return item ? item : null;
};
let drag = null;
stage.addEventListener("pointerdown", (event) => {
  hold();
  const item = pieceAt(event);
  const piece = item ? item.dataset.piece : null;
  drag = { x: event.clientX, y: event.clientY, t: state.tWant, cm: state.cmWant, knob: Boolean(item && item.hasAttribute("data-knob")), moved: false, piece };
});
stage.addEventListener("pointermove", (event) => {
  if (!drag) {
    if (event.pointerType === "touch") return;
    hold();
    const item = pieceAt(event);
    select(item ? item.dataset.piece : null);
    run();
    return;
  }
  const dx = event.clientX - drag.x;
  const dy = event.clientY - drag.y;
  if (!drag.moved && Math.hypot(dx, dy) < 6) return;
  if (!drag.moved) {
    if (HOST && !drag.knob) {
      drag = null;
      return;
    }
    drag.moved = true;
    try {
      stage.setPointerCapture(event.pointerId);
    } catch {}
  }
  const box = stage.getBoundingClientRect();
  if (drag.knob) {
    select("knob");
    setFit(drag.cm - (dx / box.width) * 2.2 * (D.fit.max - D.fit.min));
  } else if (!HOST) setApart(drag.t - (dy / box.height) * 1.6);
});
const release = (event) => {
  if (drag && !drag.moved && event.type === "pointerup") {
    // a tap or click names the part; on empty paper it toggles apart
    if (drag.piece && drag.piece !== "stand") {
      select(selected === drag.piece && event.pointerType === "touch" ? null : drag.piece);
      if (!HOST && state.tWant < STAGE[drag.piece]) setApart(STAGE[drag.piece]);
    } else {
      select(null);
      if (!HOST) setApart(state.tWant > 0.5 ? 0 : 1);
    }
    run();
  }
  drag = null;
};
stage.addEventListener("pointerup", release);
stage.addEventListener("pointercancel", release);
stage.addEventListener("pointerleave", () => {
  if (!drag) select(null);
  hold();
  run();
});
partButtons.forEach((button) => {
  const show = () => {
    hold();
    select(button.dataset.part);
    if (!HOST && state.tWant < STAGE[button.dataset.part]) setApart(STAGE[button.dataset.part]);
    run();
  };
  button.addEventListener("pointerenter", show);
  button.addEventListener("focus", show);
  button.addEventListener("click", show);
  button.addEventListener("pointerleave", () => select(null));
  button.addEventListener("blur", () => select(null));
});
stage.addEventListener("keydown", (event) => {
  if (HOST && !["ArrowLeft", "ArrowRight", "n", "N", "Escape"].includes(event.key)) return;
  const index = selected ? D.order.indexOf(selected) : -1;
  const big = event.shiftKey ? 3 : 1;
  let handled = true;
  if (["ArrowUp", "ArrowDown", "Home", "End", " ", "Enter"].includes(event.key)) select(null);
  if (event.key === "ArrowUp") setApart(STOPS.find((stop) => stop > state.tWant + 0.01) ?? 1);
  else if (event.key === "ArrowDown") setApart([...STOPS].reverse().find((stop) => stop < state.tWant - 0.01) ?? 0);
  else if (event.key === "Home") setApart(0);
  else if (event.key === "End") setApart(1);
  else if (event.key === " " || event.key === "Enter") setApart(state.tWant > 0.5 ? 0 : 1);
  else if (event.key === "ArrowRight") {
    select("knob");
    setFit(Math.round(state.cmWant) - big);
  } else if (event.key === "ArrowLeft") {
    select("knob");
    setFit(Math.round(state.cmWant) + big);
  } else if (event.key === "Tab" || event.key === "Shift") handled = false;
  else if (event.key === "n" || event.key === "N") {
    const next = D.legend[(D.legend.indexOf(selected) + 1) % D.legend.length];
    select(next);
    if (!HOST && state.tWant < STAGE[next]) setApart(STAGE[next]);
  } else if (event.key === "Escape") {
    select(null);
    if (!HOST) setApart(0);
  } else handled = false;
  if (!handled) return;
  event.preventDefault();
  hold();
  if (live) live.textContent = stage.getAttribute("aria-valuetext");
  run();
});
addEventListener("resize", () => place());
if (still.matches) touring = false;
describe();
place();
