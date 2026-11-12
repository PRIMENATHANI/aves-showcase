// AVES TITAN AV-841R with the AV-565R suspension, as numbers, in helmet coordinates
// (mm): x to the front, y to the wearer's left, z up from the brim's edge.
// From the technical file: shell inner 240 x 210 x 140, brim 40, strap 20 x 4,
// chin strap 15 wide, headband 52-66 cm. Everything else is scaled off the photos.

const DEG = Math.PI / 180;
const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (a) => {
  const n = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / n, a[1] / n, a[2] / n];
};

// ---------------------------------------------------------------- shell
export const SHELL = { a: 123, b: 108, H: 150, wall: 3, base: 16, brim: 40 };
SHELL.brimA = SHELL.a + SHELL.brim;
SHELL.brimB = (SHELL.brimA * SHELL.b) / SHELL.a;
const ER = 0.74;
const EZ = 0.9;
const PHI1 = 84 * DEG;
const U_DOME = 0.66;
const U_FILLET = 0.74;
const U_BRIM = 0.95;
const EDGE = 1.6;
const BRIM_IN = [129, 15.5];
const BRIM_OUT = [SHELL.brimA - EDGE, 2 * EDGE];
function meridian(u) {
  if (u <= U_DOME) {
    const phi = (u / U_DOME) * PHI1;
    return [SHELL.a * Math.sin(phi) ** ER, SHELL.base + (SHELL.H - SHELL.base) * Math.cos(phi) ** EZ];
  }
  const phi = PHI1;
  const p0 = [SHELL.a * Math.sin(phi) ** ER, SHELL.base + (SHELL.H - SHELL.base) * Math.cos(phi) ** EZ];
  if (u <= U_FILLET) {
    const t = (u - U_DOME) / (U_FILLET - U_DOME);
    const d0 = unit([SHELL.a * ER * Math.sin(phi) ** (ER - 1) * Math.cos(phi), -(SHELL.H - SHELL.base) * EZ * Math.cos(phi) ** (EZ - 1) * Math.sin(phi), 0]);
    const slope = unit([BRIM_OUT[0] - BRIM_IN[0], BRIM_OUT[1] - BRIM_IN[1], 0]);
    const p1 = [p0[0] + d0[0] * 9, p0[1] + d0[1] * 9];
    const p2 = [BRIM_IN[0] - slope[0] * 4, BRIM_IN[1] - slope[1] * 4];
    const s = 1 - t;
    return [s * s * s * p0[0] + 3 * s * s * t * p1[0] + 3 * s * t * t * p2[0] + t * t * t * BRIM_IN[0], s * s * s * p0[1] + 3 * s * s * t * p1[1] + 3 * s * t * t * p2[1] + t * t * t * BRIM_IN[1]];
  }
  if (u <= U_BRIM) {
    const t = (u - U_FILLET) / (U_BRIM - U_FILLET);
    return [BRIM_IN[0] + (BRIM_OUT[0] - BRIM_IN[0]) * t, BRIM_IN[1] + (BRIM_OUT[1] - BRIM_IN[1]) * t];
  }
  const t = (u - U_BRIM) / (1 - U_BRIM);
  const angle = (72 - 160 * t) * DEG;
  return [BRIM_OUT[0] + EDGE * (Math.cos(angle) - Math.cos(72 * DEG)), EDGE + EDGE * Math.sin(angle) + (2 * EDGE - EDGE - EDGE * Math.sin(72 * DEG))];
}
const base = (u, theta) => {
  const [r, z] = meridian(u);
  return [r * Math.cos(theta), ((r * SHELL.b) / SHELL.a) * Math.sin(theta), z];
};
// the centre ridge, the faceted shoulders, the trapezoid panel on the ridge's front
const RIDGE = { half: 40, edge: 6, high: 7 };
const SHOULDER = { half: 80, edge: 9, high: 4.5 };
const PANEL = { top: 27, bottom: 17, from: 0.3, to: 0.74, deep: 2.4 };
const SIDE = { y0: 48, y1: 70, from: 0.47, to: 0.74, deep: 2 }; // a flat panel on each shoulder, at the front
const panelHalf = (p) => PANEL.top + (PANEL.bottom - PANEL.top) * smooth(PANEL.from, PANEL.to, p);
// the logo-area views show the back as the ADS draws it, with the same panels as the front. Off for the exploded figure.
export const BOTH = { on: false };
function proud(u, x, y) {
  if (u >= U_DOME) return 0;
  const p = u / U_DOME;
  const ay = Math.abs(y);
  const ridge = RIDGE.high * (1 - smooth(RIDGE.half - RIDGE.edge, RIDGE.half, ay)) * (1 - smooth(0.86, 1, p));
  const shoulder = SHOULDER.high * (1 - smooth(SHOULDER.half - SHOULDER.edge, SHOULDER.half, ay)) * (1 - smooth(58, 92, Math.abs(x))) * (1 - smooth(0.7, 0.92, p));
  const half = panelHalf(p);
  const panel = x > 0 || BOTH.on ? -PANEL.deep * (1 - smooth(half - 3, half, ay)) * smooth(PANEL.from, PANEL.from + 0.035, p) * (1 - smooth(PANEL.to - 0.035, PANEL.to, p)) : 0;
  const side = x > 0 || BOTH.on ? -SIDE.deep * smooth(SIDE.y0, SIDE.y0 + 3, ay) * (1 - smooth(SIDE.y1 - 3, SIDE.y1, ay)) * smooth(SIDE.from, SIDE.from + 0.035, p) * (1 - smooth(SIDE.to - 0.035, SIDE.to, p)) : 0;
  return ridge + shoulder + panel + side;
}
export function shellPoint(u, theta) {
  const p = base(u, theta);
  const d = proud(u, p[0], p[1]);
  if (!d) return p;
  const e = 1e-3;
  const du = sub(base(Math.min(1, u + e), theta), base(Math.max(1e-4, u - e), theta));
  const dv = sub(base(Math.max(1e-4, u), theta + e), base(Math.max(1e-4, u), theta - e));
  const n = unit(cross(dv, du));
  const out = n[0] * p[0] + n[1] * p[1] + n[2] * p[2] < 0 ? mul(n, -1) : n;
  return add(p, mul(out, d));
}
const NU = 128;
const NV = 240;
export function shellRows(nu = NU, nv = NV) {
  return Array.from({ length: nu + 1 }, (_, i) => Array.from({ length: nv + 1 }, (_, j) => shellPoint(i / nu, -(j % nv) * ((2 * Math.PI) / nv))));
}
const thetaFor = (u, y) => {
  const [r] = meridian(u);
  const reach = (r * SHELL.b) / SHELL.a;
  return Math.abs(y) <= reach ? Math.asin(y / reach) : null;
};
function alongY(y, pEnd) {
  const points = [];
  const steps = 90;
  for (let i = 0; i <= steps; i++) {
    const u = U_DOME * (pEnd - pEnd * (i / steps));
    const theta = thetaFor(u, y);
    if (theta !== null) points.push(shellPoint(u, theta));
  }
  for (let i = steps; i >= 0; i--) {
    const u = U_DOME * (pEnd - pEnd * (i / steps));
    const theta = thetaFor(u, y);
    if (theta !== null) points.push(shellPoint(u, Math.PI - theta));
  }
  return points;
}
export function shellLines() {
  const lines = [];
  for (const side of [1, -1]) lines.push({ points: alongY(side * (RIDGE.half - RIDGE.edge), 0.93), tone: "lo", fade: [16, 16] });
  for (const side of [1, -1]) {
    const y = side * (SHOULDER.half - SHOULDER.edge);
    const points = [];
    for (let i = 0; i <= 60; i++) {
      const x = -76 + (152 * i) / 60;
      let lo = 0.02;
      let hi = U_DOME;
      for (let step = 0; step < 30; step++) {
        const mid = (lo + hi) / 2;
        const [r] = meridian(mid);
        if (Math.hypot(x / r, y / ((r * SHELL.b) / SHELL.a)) > 1) lo = mid;
        else hi = mid;
      }
      const [r] = meridian(hi);
      points.push(shellPoint(hi, Math.atan2(y / ((r * SHELL.b) / SHELL.a), x / r)));
    }
    lines.push({ points, tone: "lo", fade: [18, 18] });
  }
  // the panel's rim: a rounded trapezoid, narrower at the bottom
  const rim = [];
  const pc = (PANEL.from + PANEL.to) / 2;
  const ph = (PANEL.to - PANEL.from) / 2 - 0.018;
  for (let i = 0; i <= 96; i++) {
    const t = (i / 96) * 2 * Math.PI;
    const cy = Math.cos(t);
    const sp = Math.sin(t);
    const p = pc + ph * Math.sign(sp) * Math.abs(sp) ** 0.4;
    const y = (panelHalf(p) - 1.5) * Math.sign(cy) * Math.abs(cy) ** 0.4;
    const u = U_DOME * p;
    rim.push(shellPoint(u, thetaFor(u, y)));
  }
  lines.push({ points: rim, tone: "lo" });
  for (const sign of [1, -1]) {
    const loop = [];
    const yc = (SIDE.y0 + SIDE.y1) / 2;
    const yh = (SIDE.y1 - SIDE.y0) / 2 - 1.5;
    const qc = (SIDE.from + SIDE.to) / 2;
    const qh = (SIDE.to - SIDE.from) / 2 - 0.018;
    for (let i = 0; i <= 72; i++) {
      const t = (i / 72) * 2 * Math.PI;
      const cy = Math.cos(t);
      const sp = Math.sin(t);
      const u = U_DOME * (qc + qh * Math.sign(sp) * Math.abs(sp) ** 0.4);
      loop.push(shellPoint(u, thetaFor(u, sign * (yc + yh * Math.sign(cy) * Math.abs(cy) ** 0.4))));
    }
    lines.push({ points: loop, tone: "lo" });
  }
  if (BOTH.on) {
    // the same panel rims on the back
    const loops = lines.filter((line) => !line.fade);
    for (const line of loops) lines.push({ points: line.points.map(([x, y, z]) => [-x, y, z]), tone: line.tone });
  }
  return lines;
}
// a logo placement area on the crown wall: a patch round the direction theta, as its outline and its centre
export function logoArea(theta) {
  const u0 = 0.5;
  const u1 = 0.63;
  const half = 0.27;
  const edge = [];
  for (let i = 0; i <= 10; i++) edge.push(shellPoint(u0, theta - half + (2 * half * i) / 10));
  for (let i = 0; i <= 6; i++) edge.push(shellPoint(u0 + ((u1 - u0) * i) / 6, theta + half));
  for (let i = 0; i <= 10; i++) edge.push(shellPoint(u1, theta + half - (2 * half * i) / 10));
  for (let i = 0; i <= 6; i++) edge.push(shellPoint(u1 - ((u1 - u0) * i) / 6, theta - half));
  return { edge, centre: shellPoint((u0 + u1) / 2, theta) };
}
export function shellShapes(rows) {
  const contour = (z) => {
    const ring = [];
    for (let j = 0; j < NV; j += 5) {
      let hit = null;
      for (let i = 1; i <= NU; i++) {
        const a = rows[i - 1][j];
        const b = rows[i][j];
        if (a[2] >= z && b[2] < z) {
          const t = (a[2] - z) / (a[2] - b[2]);
          hit = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
          break;
        }
      }
      ring.push(hit);
    }
    return ring;
  };
  const inset = (ring, by) => ring.map(([x, y]) => {
    const r = Math.hypot(x, y);
    return [(x * (r - by)) / r, (y * (r - by)) / r];
  });
  const arcs = (outer, inner, z, h, name) => {
    const n = outer.length;
    const parts = 8;
    const m = n / parts;
    return Array.from({ length: parts }, (_, side) => {
      const index = Array.from({ length: m + 1 }, (_, i) => (side * m + i) % n);
      return { ring: [...index.map((i) => outer[i]), ...index.reverse().map((i) => inner[i])], z, h, name };
    });
  };
  const out = [];
  const levels = [16, 21, 28, 37, 49, 63, 79, 95, 111, 127, SHELL.H - 12];
  for (let i = 0; i + 1 < levels.length; i++) {
    const outer = contour((levels[i] + levels[i + 1]) / 2);
    const above = i + 2 < levels.length ? (levels[i + 1] + levels[i + 2]) / 2 : levels[i + 1] + 0.5;
    out.push(...arcs(outer, inset(contour(above), SHELL.wall), levels[i], levels[i + 1] - levels[i], "wall"));
  }
  const z = levels[levels.length - 1];
  out.push({ ring: contour(z + 0.5), z, h: SHELL.H - 1.5 - z, name: "crown" });
  const ellipse = (a) => Array.from({ length: NV / 5 }, (_, j) => {
    const theta = -j * 5 * ((2 * Math.PI) / NV);
    return [a * Math.cos(theta), ((a * SHELL.b) / SHELL.a) * Math.sin(theta)];
  });
  const wallIn = inset(contour(18.5), SHELL.wall);
  // the brim slopes down and out: three rings that step down with it
  out.push(...arcs(ellipse(141), wallIn, 9, 7, "brim"));
  out.push(...arcs(ellipse(152), ellipse(139), 5, 7, "brim"));
  out.push(...arcs(ellipse(SHELL.brimA), ellipse(150), 0, 8, "brim"));
  return out;
}
// four bosses on the crown wall at the diagonals: the outside of the key slots
export const BOSS_AT = [58, 122, -122, -58]; // on the crown's base oval
export const bossPoint = (deg) => [SHELL.a * Math.cos(deg * DEG), SHELL.b * Math.sin(deg * DEG)];
export const keyAngles = () => [...BOSS_AT.map((deg) => Math.atan2(bossPoint(deg)[1], bossPoint(deg)[0]) / DEG), 90, -90];
export function bosses() {
  return BOSS_AT.map((deg) => {
    const p = bossPoint(deg);
    const t = unit([-SHELL.a * Math.sin(deg * DEG), SHELL.b * Math.cos(deg * DEG), 0]);
    const n = [t[1], -t[0]];
    // a wedge whose back is buried in the crown wall at the crown-to-brim corner: the face leans in,
    // the top slopes back into the crown, and it narrows towards the top
    return { p, t, n, half: 23, top: 17, out: [-10, 6.5, 4.6], z: [11.5, 30, 41], slot: [[-11, 19], [11, 19], [11, 22], [-11, 22]] };
  });
}

// ---------------------------------------------------------------- suspension
export const polarR = (A, B, theta) => 1 / Math.hypot(Math.cos(theta) / A, Math.sin(theta) / B);
export const INNER = { a: SHELL.a - SHELL.wall, b: SHELL.b - SHELL.wall };
// The loop that goes round the head, seen from above: the front of the headband
// (fixed) to the two side pivots, the nape strap's two tails along a rear half-oval
// of half length A, and the straight ratchet housing. The knob changes A.
// the headband ring follows the inside of the shell, 10.5 mm in from the wall all round
export const RING = { a: SHELL.a - SHELL.wall - 10.5, b: SHELL.b - SHELL.wall - 10.5, z: 12, h: 28, thick: 2.4 };
const PIVOT_X = 30;
export const LOOP = { cx: PIVOT_X, half: RING.b * Math.sqrt(1 - (PIVOT_X / RING.a) ** 2), housing: 28 };
export const FIT_MIN = 52;
export const FIT_MAX = 66;
export const FIT_REST = 62;
const T_END = Math.acos(LOOP.housing / LOOP.half);
const arcLength = (A, B, from, to) => {
  let sum = 0;
  const n = 96;
  let last = [A * Math.sin(from), B * Math.cos(from)];
  for (let i = 1; i <= n; i++) {
    const t = from + ((to - from) * i) / n;
    const p = [A * Math.sin(t), B * Math.cos(t)];
    sum += Math.hypot(p[0] - last[0], p[1] - last[1]);
    last = p;
  }
  return sum;
};
const FRONT_LENGTH = (() => {
  // the ring from one pivot round the front to the other
  const e0 = Math.acos(PIVOT_X / RING.a);
  let sum = 0;
  let last = [RING.a * Math.cos(-e0), RING.b * Math.sin(-e0)];
  for (let i = 1; i <= 200; i++) {
    const e = -e0 + (2 * e0 * i) / 200;
    const p = [RING.a * Math.cos(e), RING.b * Math.sin(e)];
    sum += Math.hypot(p[0] - last[0], p[1] - last[1]);
    last = p;
  }
  return sum;
})();
export const loopLength = (A) => FRONT_LENGTH + 2 * arcLength(A, LOOP.half, 0, T_END) + 2 * LOOP.housing;
export function rearFor(cm) {
  let lo = 5;
  let hi = 260;
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    if (loopLength(mid) < cm * 10) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}
export const tailEnd = (A, side) => [LOOP.cx - A * Math.sin(T_END), side * LOOP.half * Math.cos(T_END)];
export const napeShift = (A, A0) => -(A - A0) * Math.sin(T_END);
export function offset(points, by) {
  return points.map((p, i) => {
    const a = points[Math.max(0, i - 1)];
    const b = points[Math.min(points.length - 1, i + 1)];
    const t = [b[0] - a[0], b[1] - a[1]];
    const n = Math.hypot(t[0], t[1]) || 1;
    let nx = t[1] / n;
    let ny = -t[0] / n;
    if (nx * p[0] + ny * p[1] < 0) {
      nx = -nx;
      ny = -ny;
    }
    return [p[0] + nx * by, p[1] + ny * by];
  });
}
const rearPoint = (A, t, side) => [LOOP.cx - A * Math.sin(t), side * LOOP.half * Math.cos(t)];
const frontPoint = (e) => [RING.a * Math.cos(e), RING.b * Math.sin(e)];
export function ringCentre() {
  return Array.from({ length: 121 }, (_, i) => frontPoint(-Math.PI + (2 * Math.PI * i) / 120));
}
export const BROW = { reach: 50 * DEG, thick: 3, z: 9, h: 34, flap: 5, clear: 1.9 };
export function browCentre() {
  const c = [];
  for (let i = 0; i <= 40; i++) c.push(frontPoint(-BROW.reach + (2 * BROW.reach * i) / 40));
  return c;
}
export const TAIL = { z: -22, h: 22, thick: 2.4 };
export function tailRing(A, side) {
  const c = [];
  for (let i = 0; i <= 22; i++) c.push(rearPoint(A, (T_END * i) / 22, side));
  return [...offset(c, TAIL.thick / 2), ...offset(c, -TAIL.thick / 2).reverse()];
}
export const HOUSING = { z: -28, h: 32, back: 10, fore: 3 };
export function housingRing(A) {
  const [x] = tailEnd(A, 1);
  const y = LOOP.housing;
  return [[x + HOUSING.fore, -y], [x + HOUSING.fore, y], [x - HOUSING.back, y], [x - HOUSING.back, -y]];
}
export const KNOB = { r: 16.5, long: 15, z: HOUSING.z + HOUSING.h / 2 };
export const ARM = { half: 8, thick: 2.4, pivotZ: 26 };
// the arm that drops from the side pivot and curves back to the nape strap, as (along the ring's tangent, z) in the plane that touches the ring at the pivot
export function armPath() {
  const p0 = [5, ARM.pivotZ];
  const p1 = [6, TAIL.z + TAIL.h / 2 + 8];
  const p2 = [-9, TAIL.z + TAIL.h / 2 - 1];
  return Array.from({ length: 25 }, (_, i) => {
    const t = i / 24;
    const s = 1 - t;
    return [s * s * p0[0] + 2 * s * t * p1[0] + t * t * p2[0], s * s * p0[1] + 2 * s * t * p1[1] + t * t * p2[1]];
  });
}
export const pivotAngle = (side) => Math.atan2(side * LOOP.half, LOOP.cx);
export const bandRadius = (theta) => polarR(RING.a, RING.b, theta);
// the ring's outer face where a ray from the shell's axis meets it
export function bandFrame(theta) {
  const at = (angle) => {
    const r = bandRadius(angle);
    return [r * Math.cos(angle), r * Math.sin(angle)];
  };
  const p = at(theta);
  const a = at(theta - 0.02);
  const b = at(theta + 0.02);
  const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const t = [(b[0] - a[0]) / length, (b[1] - a[1]) / length];
  let n = [t[1], -t[0]];
  if (n[0] * p[0] + n[1] * p[1] < 0) n = [-n[0], -n[1]];
  return { p: [p[0] + (n[0] * RING.thick) / 2, p[1] + (n[1] * RING.thick) / 2], n, t };
}
export const KEY = { z: 16, h: 32, thick: 2.6, half: 13, neck: 34, tongue: 8, window: [38, 44] };
export const STRAP = { half: 10, thick: 4 };
export const PAD = { half: 44, z: 86, thick: 1.2, slit: 38 };
// how far the pad reaches along a ray: the straps' three pieces join on its rim
export const padReach = (theta) => 0.9 + PAD.half / (Math.abs(Math.cos(theta)) ** (2 / 0.45) + Math.abs(Math.sin(theta)) ** (2 / 0.45)) ** (0.45 / 2);
export const runHeight = (index) => PAD.z + PAD.thick + STRAP.thick / 2 + index * STRAP.thick;
// one leg of a crown strap: from the pad's rim, at the height its run crosses the pad, out and down to its suspension key
export function legProfile(endR, startR, z0) {
  const z1 = KEY.z + KEY.h - 3;
  const points = [];
  const n = 40;
  for (let i = 0; i <= n; i++) {
    const tau = (Math.PI / 2) * (i / n);
    points.push([startR + (endR - startR) * Math.sin(tau) ** 0.8, z1 + (z0 - z1) * Math.cos(tau) ** 0.8]);
  }
  points[0] = [startR, z0];
  points[n] = [endR, z1];
  return points;
}
// a strap's run over the pad: flat, from slit to slit, as (s, z) along the strap
export function runProfile(index) {
  return Array.from({ length: 9 }, (_, i) => [-PAD.slit + (2 * PAD.slit * i) / 8, runHeight(index)]);
}
export function padRing() {
  return Array.from({ length: 48 }, (_, i) => {
    const t = (i / 48) * 2 * Math.PI;
    const c = Math.cos(t);
    const s = Math.sin(t);
    return [PAD.half * Math.sign(c) * Math.abs(c) ** 0.45, PAD.half * Math.sign(s) * Math.abs(s) ** 0.45];
  });
}
export const CHIN = { drop: 140, half: 7.5, thick: 3, top: 2, guard: [40, 20, 2] }; // chin guard 8 x 4 cm, drawn as a shallow cup on a strap about 40 cm long
export function chinPath(y, from = 0, to = Math.PI, n = 56) {
  return Array.from({ length: n + 1 }, (_, i) => {
    const s = from + ((to - from) * i) / n;
    return [0, y * Math.cos(s), CHIN.top - CHIN.drop * Math.sin(s)];
  });
}
