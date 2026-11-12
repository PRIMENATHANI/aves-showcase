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
const apartInput = root.querySelector("[data-apart]");
const fitInput = root.querySelector("[data-fit]");
const partButtons = [...root.querySelectorAll(".hx-part")];
const still = matchMedia("(prefers-reduced-motion: reduce)");
const clamp = (value, low, high) => Math.min(high, Math.max(low, value));

const nodes = [...holder.querySelectorAll(".it")].map((el) => ({
  el,
  piece: el.dataset.piece,
  key: Number(el.dataset.k),
  lift: Number(el.dataset.lift),
  nape: el.hasAttribute("data-nape"),
  tail: Number(el.dataset.tail || 0),
  ribs: el.querySelector("[data-ribs]"),
  shown: "",
}));
let order = nodes.map((_, index) => index);
const cosY = Math.cos(D.yaw);
const sinY = Math.sin(D.yaw);
const plan = ([x, y]) => [x * cosY - y * sinY, x * sinY + y * cosY];
const REST_A = MODEL.rearFor(D.fit.rest);

// what the reader has asked for, and what the parts are showing
const state = { t: 0, tWant: 0, cm: D.fit.rest, cmWant: D.fit.rest, direct: false };
let selected = null;
let touring = !still.matches;
let hosted = false;
let tourClock = 0;
let idleTimer = 0;
let visible = false;
let frame = 0;
let last = 0;
let shownA = null;
let shownRibs = -1;

function say(text) {
  if (readout.textContent !== text) readout.textContent = text;
}
const cmText = (cm) => `${cm.toFixed(1)} cm`;
function describe() {
  const where = state.tWant >= 0.999 ? "Apart" : state.tWant <= 0.001 ? "Assembled" : `${Math.round(state.tWant * 100)}% apart`;
  const text = `${where}. Headband set to ${cmText(state.cmWant)}.${selected ? ` Selected: ${D.pieces[selected].say}.` : ""}`;
  if (stage.getAttribute("aria-valuetext") !== text) stage.setAttribute("aria-valuetext", text);
  stage.setAttribute("aria-valuenow", String(Math.round(state.tWant * 100)));
}
function readoutText() {
  if (selected === "ratchet" || Math.abs(state.cm - state.cmWant) > 0.02) return `ratchet · POM knob · headband ${cmText(state.cm)}`;
  if (selected) return D.pieces[selected].say;
  if (Math.abs(state.t - state.tWant) > 0.004) return state.tWant > state.t ? "coming apart" : "closing up";
  if (state.t >= 0.999) return `apart · ${D.order.length} assemblies · headband ${cmText(state.cm)}`;
  if (state.t <= 0.001) return `assembled · headband ${cmText(state.cm)}`;
  return `${Math.round(state.t * 100)}% apart`;
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
    const paths = extrude(MODEL.tailRing(A, node.tail).map(plan), MODEL.TAIL.z + D.zb, MODEL.TAIL.h, D.P, { convex: false });
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
  const shares = {};
  D.order.forEach((id, index) => (shares[id] = shareOf(index, D.order.length, state.t)));
  for (const node of nodes) {
    const share = shares[node.piece] || 0;
    const tx = D.EZ[0] * node.lift * share + (node.nape ? fx : 0);
    const ty = D.EZ[1] * node.lift * share + (node.nape ? fy : 0);
    const text = Math.abs(tx) < 0.005 && Math.abs(ty) < 0.005 ? "" : `translate(${tx.toFixed(2)} ${ty.toFixed(2)})`;
    if (text !== node.shown) {
      node.shown = text;
      if (text) node.el.setAttribute("transform", text);
      else node.el.removeAttribute("transform");
    }
    node.now = node.key + node.lift * D.V[2] * share + (node.nape ? fitDepth : node.tail ? fitDepth / 2 : 0);
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
  if (document.activeElement !== apartInput) apartInput.value = String(Math.round(state.tWant * 1000));
  if (document.activeElement !== fitInput) fitInput.value = String(state.cmWant);
}

// the idle tour: come apart, run the ratchet in and out, close up
const TOUR = [
  [1.2, { t: 0 }],
  [3.4, { t: 1 }],
  [2.6, { cm: D.fit.min }],
  [3.2, { cm: D.fit.max }],
  [2.2, { cm: D.fit.rest }],
  [3.0, { t: 0 }],
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
  state.t = ease(state.t, state.tWant, touring ? 0.42 : 0.2, 0.0008);
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
  // the suspension is inside the shell: bring the helmet apart before the ratchet turns
  if (state.tWant < 0.999) state.tWant = 1;
  describe();
  run();
}
// for a host page: its scroll (or anything else) drives the explode, 0 assembled to 1 apart
window.setExplode = (t) => {
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
    if (event.pointerType === "touch" && !drag.knob && Math.abs(dx) < Math.abs(dy) * 0.6 && false) return;
    drag.moved = true;
    try {
      stage.setPointerCapture(event.pointerId);
    } catch {}
  }
  const box = stage.getBoundingClientRect();
  if (drag.knob) {
    select("ratchet");
    setFit(drag.cm - (dx / box.width) * 2.2 * (D.fit.max - D.fit.min));
  } else setApart(drag.t - (dy / box.height) * 1.6);
});
const release = (event) => {
  if (drag && !drag.moved && event.type === "pointerup") {
    // a tap or click names the part; on empty paper it toggles apart
    if (drag.piece && drag.piece !== "stand") {
      select(selected === drag.piece && event.pointerType === "touch" ? null : drag.piece);
      if (drag.piece !== "shell" && state.tWant < 0.5) setApart(1);
    } else {
      select(null);
      setApart(state.tWant > 0.5 ? 0 : 1);
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
apartInput.addEventListener("input", () => {
  hold();
  setApart(Number(apartInput.value) / 1000);
});
fitInput.addEventListener("input", () => {
  hold();
  select("ratchet");
  setFit(Number(fitInput.value));
});
fitInput.addEventListener("change", () => fitInput.blur());
apartInput.addEventListener("change", () => apartInput.blur());
partButtons.forEach((button) => {
  const show = () => {
    hold();
    select(button.dataset.part);
    if (state.tWant < 0.999) setApart(1);
    run();
  };
  button.addEventListener("pointerenter", show);
  button.addEventListener("focus", show);
  button.addEventListener("click", show);
  button.addEventListener("pointerleave", () => select(null));
  button.addEventListener("blur", () => select(null));
});
stage.addEventListener("keydown", (event) => {
  const index = selected ? D.order.indexOf(selected) : -1;
  const big = event.shiftKey ? 3 : 1;
  let handled = true;
  if (event.key === "ArrowUp") setApart(state.tWant + 0.1 * big);
  else if (event.key === "ArrowDown") setApart(state.tWant - 0.1 * big);
  else if (event.key === "Home") setApart(0);
  else if (event.key === "End") setApart(1);
  else if (event.key === " " || event.key === "Enter") setApart(state.tWant > 0.5 ? 0 : 1);
  else if (event.key === "ArrowRight") {
    select("ratchet");
    setFit(Math.round(state.cmWant) - big);
  } else if (event.key === "ArrowLeft") {
    select("ratchet");
    setFit(Math.round(state.cmWant) + big);
  } else if (event.key === "Tab" || event.key === "Shift") handled = false;
  else if (event.key === "n" || event.key === "N") {
    select(D.order[(index + 1) % D.order.length]);
    if (state.tWant < 0.999) setApart(1);
  } else if (event.key === "Escape") {
    select(null);
    setApart(0);
  } else handled = false;
  if (!handled) return;
  event.preventDefault();
  hold();
  if (live) live.textContent = stage.getAttribute("aria-valuetext");
  run();
});
if (still.matches) touring = false;
describe();
place();
