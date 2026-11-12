// The helmet as numbers, in helmet coordinates (mm): x to the front, y to the
// wearer's left, z up from the brim's lowest edge. No drawing here: build.mjs
// draws it, and the page reads the fit model from this same file.
//
// Checked against the catalogue and the photos: what the parts are and how they
// sit. NOT checked: every dimension below. They are proportions read off the
// photos and typical hard-hat sizes, and the figure prints none of them.

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
export const SHELL = {
  a: 135, // crown half length at its base
  b: 114, // crown half width
  H: 164, // apex above the brim's lowest edge
  wall: 3,
  brimA: 170,
  brimB: (170 * 114) / 135,
  seat: 8, // underside of the brim where it rests on the stand
};
const ER = 0.72;
const EZ = 0.92;
const PHI1 = 80 * DEG;
const Z0 = 7;
const U_DOME = 0.62;
const U_FILLET = 0.73;
const U_BRIM = 0.87;
const ROLL = 4.75;
const BRIM_IN = [145, 13.5];
const BRIM_OUT = [SHELL.brimA - ROLL, 2 * ROLL];

// the meridian in front units: radius from the axis and height
function meridian(u) {
  if (u <= U_DOME) {
    const phi = (u / U_DOME) * PHI1;
    return [SHELL.a * Math.sin(phi) ** ER, Z0 + (SHELL.H - Z0) * Math.cos(phi) ** EZ];
  }
  const phi = PHI1;
  const p0 = [SHELL.a * Math.sin(phi) ** ER, Z0 + (SHELL.H - Z0) * Math.cos(phi) ** EZ];
  if (u <= U_FILLET) {
    const t = (u - U_DOME) / (U_FILLET - U_DOME);
    const d0 = unit([SHELL.a * ER * Math.sin(phi) ** (ER - 1) * Math.cos(phi), -(SHELL.H - Z0) * EZ * Math.cos(phi) ** (EZ - 1) * Math.sin(phi), 0]);
    const slope = unit([BRIM_OUT[0] - BRIM_IN[0], BRIM_OUT[1] - BRIM_IN[1], 0]);
    const p1 = [p0[0] + d0[0] * 10, p0[1] + d0[1] * 10];
    const p2 = [BRIM_IN[0] - slope[0] * 6, BRIM_IN[1] - slope[1] * 6];
    const s = 1 - t;
    return [s * s * s * p0[0] + 3 * s * s * t * p1[0] + 3 * s * t * t * p2[0] + t * t * t * BRIM_IN[0], s * s * s * p0[1] + 3 * s * s * t * p1[1] + 3 * s * t * t * p2[1] + t * t * t * BRIM_IN[1]];
  }
  if (u <= U_BRIM) {
    const t = (u - U_FILLET) / (U_BRIM - U_FILLET);
    return [BRIM_IN[0] + (BRIM_OUT[0] - BRIM_IN[0]) * t, BRIM_IN[1] + (BRIM_OUT[1] - BRIM_IN[1]) * t];
  }
  const t = (u - U_BRIM) / (1 - U_BRIM);
  const angle = (90 - 172 * t) * DEG;
  return [BRIM_OUT[0] + ROLL * Math.cos(angle), ROLL + ROLL * Math.sin(angle)];
}
const base = (u, theta) => {
  const [r, z] = meridian(u);
  return [r * Math.cos(theta), ((r * SHELL.b) / SHELL.a) * Math.sin(theta), z];
};

// what stands proud of the plain dome: the crown ridge, the side shoulders, the inset panel
const RIDGE = { half: 46, edge: 7, high: 8 };
const SHOULDER = { half: 88, edge: 13, high: 4.5 };
const PANEL = { half: 30, from: 0.15, to: 0.68, deep: 2.6 };
function proud(u, x, y) {
  if (u >= U_DOME) return 0;
  const p = u / U_DOME;
  const ay = Math.abs(y);
  const ridge = RIDGE.high * (1 - smooth(RIDGE.half - RIDGE.edge, RIDGE.half, ay)) * (1 - smooth(0.84, 1, p));
  const shoulder = SHOULDER.high * (1 - smooth(SHOULDER.half - SHOULDER.edge, SHOULDER.half, ay)) * (1 - smooth(62, 104, Math.abs(x))) * (1 - smooth(0.66, 0.9, p));
  const panel = x > 0 ? -PANEL.deep * (1 - smooth(PANEL.half - 3.5, PANEL.half, ay)) * smooth(PANEL.from, PANEL.from + 0.035, p) * (1 - smooth(PANEL.to - 0.035, PANEL.to, p)) : 0;
  return ridge + shoulder + panel;
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
export function shellRows() {
  // v runs clockwise seen from above so that u × v points outward
  return Array.from({ length: NU + 1 }, (_, i) => Array.from({ length: NV + 1 }, (_, j) => shellPoint(i / NU, -(j % NV) * ((2 * Math.PI) / NV))));
}

// lines laid on the shell: the ridge's two edges, the shoulders' edges, the panel's rim, the brim's lip
const thetaFor = (u, y) => {
  const [r] = meridian(u);
  const reach = (r * SHELL.b) / SHELL.a;
  return Math.abs(y) <= reach ? Math.asin(y / reach) : null;
};
function alongY(y, pEnd, frontOnly = false, pStart = 0) {
  const points = [];
  const steps = 90;
  for (let i = 0; i <= steps; i++) {
    const u = U_DOME * (pEnd - (pEnd - pStart) * (i / steps));
    const theta = thetaFor(u, y);
    if (theta !== null) points.push(shellPoint(u, theta));
  }
  if (frontOnly) return points;
  for (let i = steps; i >= 0; i--) {
    const u = U_DOME * (pEnd - (pEnd - pStart) * (i / steps));
    const theta = thetaFor(u, y);
    if (theta !== null) points.push(shellPoint(u, Math.PI - theta));
  }
  return points;
}
export function shellLines() {
  const lines = [];
  for (const side of [1, -1]) {
    lines.push({ points: alongY(side * (RIDGE.half - RIDGE.edge), 0.93), tone: "lo", fade: [16, 16] });
    lines.push({ points: alongY(side * RIDGE.half, 0.9), tone: "faint", fade: [14, 14] });
  }
  for (const side of [1, -1]) {
    const y = side * (SHOULDER.half - SHOULDER.edge);
    const points = [];
    for (let i = 0; i <= 60; i++) {
      const x = -84 + (168 * i) / 60;
      // on the dome at this (x, y): find u by bisection on the base surface
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
  const rim = [];
  const pc = (PANEL.from + PANEL.to) / 2;
  const ph = (PANEL.to - PANEL.from) / 2 - 0.018;
  for (let i = 0; i <= 96; i++) {
    const t = (i / 96) * 2 * Math.PI;
    const cy = Math.cos(t);
    const sp = Math.sin(t);
    const y = (PANEL.half - 1.8) * Math.sign(cy) * Math.abs(cy) ** 0.42;
    const p = pc + ph * Math.sign(sp) * Math.abs(sp) ** 0.42;
    const u = U_DOME * p;
    rim.push(shellPoint(u, thetaFor(u, y)));
  }
  lines.push({ points: rim, tone: "lo" });
  const lip = [];
  const uLip = U_FILLET + (U_BRIM - U_FILLET) * 0.8;
  for (let i = 0; i <= 240; i++) lip.push(shellPoint(uLip, (i / 240) * 2 * Math.PI));
  lines.push({ points: lip, tone: "faint" });
  return lines;
}

// the shell as the audit sees it: hollow terraces cut from the same surface
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
  // eight short arcs per ring: a ray is traced through each piece in a limited number of steps, and a long thin half-ring runs out of them
  const halves = (outer, inner, z, h, name) => {
    const n = outer.length;
    const parts = 8;
    const m = n / parts;
    return Array.from({ length: parts }, (_, side) => {
      const index = Array.from({ length: m + 1 }, (_, i) => (side * m + i) % n);
      return { ring: [...index.map((i) => outer[i]), ...index.reverse().map((i) => inner[i])], z, h, name };
    });
  };
  const out = [];
  const from = 13;
  const levels = [13, 18, 24, 32, 44, 58, 74, 90, 106, 122, 138, SHELL.H - 12];
  for (let i = 0; i + 1 < levels.length; i++) {
    // each terrace reaches in to the wall's inside face at its own top, so the stack is a closed, hollow shell
    const outer = contour((levels[i] + levels[i + 1]) / 2);
    const above = i + 2 < levels.length ? (levels[i + 1] + levels[i + 2]) / 2 : levels[i + 1] + 0.5;
    const inner = inset(contour(above), SHELL.wall); // inside the ring above, so no ray slips between two rings
    out.push(...halves(outer, inner, levels[i], levels[i + 1] - levels[i], "wall"));
  }
  const z = levels[levels.length - 1];
  const STEP = 10;
  out.push({ ring: contour(z + 0.5), z, h: SHELL.H - 1.5 - z, name: "crown" });
  const brimOuter = Array.from({ length: NV / 5 }, (_, j) => {
    const theta = -j * 5 * ((2 * Math.PI) / NV);
    return [SHELL.brimA * Math.cos(theta), SHELL.brimB * Math.sin(theta)];
  });
  const brimInner = inset(contour(from + STEP / 2), SHELL.wall);
  out.push(...halves(brimOuter, brimInner, SHELL.seat, from - SHELL.seat, "brim"));
  out.push(...halves(brimOuter, inset(brimOuter, 5), 0, SHELL.seat, "roll"));
  return out;
}

// accessory-slot bosses, low on both sides
export function bosses() {
  const out = [];
  for (const side of [1, -1]) {
    const z = 15;
    const h = 31;
    const half = 29;
    const wallAt = (x, zz) => {
      // half width of the crown at height zz, at this x
      let lo = 0.3 * U_DOME;
      let hi = U_FILLET;
      for (let step = 0; step < 30; step++) {
        const mid = (lo + hi) / 2;
        if (meridian(mid)[1] > zz) lo = mid;
        else hi = mid;
      }
      const r = meridian(hi)[0];
      return ((r * SHELL.b) / SHELL.a) * Math.sqrt(Math.max(0, 1 - (x / r) ** 2));
    };
    const inner = Array.from({ length: 13 }, (_, i) => {
      const x = -half + (2 * half * i) / 12;
      return [x, side * (wallAt(x, z + h) - 0.3)];
    });
    const proudBy = 17;
    const corner = 4;
    const yFar = wallAt(0, z + h) + proudBy;
    const outer = [];
    for (const [cx, start] of [[half - corner, 0], [-half + corner, 90]]) {
      for (let i = 0; i <= 6; i++) {
        const angle = (start + (90 * i) / 6) * DEG;
        outer.push([cx + corner * Math.cos(angle), side * (yFar - corner + corner * Math.sin(angle))]);
      }
    }
    const ring = [...inner, ...outer];
    const mid = side * (wallAt(0, z + h) + proudBy / 2 + 0.6);
    const slot = [];
    for (let i = 0; i < 24; i++) {
      const t = (i / 24) * 2 * Math.PI;
      const c = Math.cos(t);
      const s = Math.sin(t);
      slot.push([20 * Math.sign(c) * Math.abs(c) ** 0.35, mid + 2.6 * Math.sign(s) * Math.abs(s) ** 0.35, z + h]);
    }
    out.push({ ring, z, h, centre: [0, mid, z + h / 2], slot, side });
  }
  return out;
}

// ---------------------------------------------------------------- stand
export const DRUM = { r: 158, wall: 5, ratio: SHELL.b / SHELL.a };

// ---------------------------------------------------------------- suspension
export const polarR = (A, B, theta) => 1 / Math.hypot(Math.cos(theta) / A, Math.sin(theta) / B);
export const INNER = { a: SHELL.a - SHELL.wall - 1.5, b: SHELL.b - SHELL.wall - 1 }; // inside of the shell wall where the keys sit
export const keyAngles = (points) => (points === 4 ? [42, 138, -138, -42] : [33, 90, 147, -147, -90, -33]);
export const tabAngles = (points) => (points === 4 ? [42, 138, -138, -42] : [33, 147, -147, -33]); // 2 front, 2 rear

// The headband loop, seen from above: a front half-oval that is fixed, two tails
// that run back from the side pivots along a rear half-oval of half length A, and
// the straight ratchet housing between the tail ends. Turning the knob changes A.
// The head size the readout shows is the length of this drawn loop.
export const LOOP = { cx: 36, front: 70, half: 88, housing: 30 };
export const FIT_MIN = 52;
export const FIT_MAX = 66;
export const FIT_REST = 59;
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
const FRONT_LENGTH = 2 * arcLength(LOOP.front, LOOP.half, 0, Math.PI / 2);
export const loopLength = (A) => FRONT_LENGTH + 2 * arcLength(A, LOOP.half, 0, T_END) + 2 * LOOP.housing; // mm
export function rearFor(cm) {
  let lo = 20;
  let hi = 260;
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    if (loopLength(mid) < cm * 10) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}
export const REAR_MAX = rearFor(FIT_MAX);
export const tailEnd = (A, side) => [LOOP.cx - A * Math.sin(T_END), side * LOOP.half * Math.cos(T_END)];
export const napeShift = (A, A0) => -(A - A0) * Math.sin(T_END); // how far the housing sits behind its place at A0

export function offset(points, by) {
  // +by is outward (away from the middle of the loop)
  return points.map((p, i) => {
    const a = points[Math.max(0, i - 1)];
    const b = points[Math.min(points.length - 1, i + 1)];
    const t = [b[0] - a[0], b[1] - a[1]];
    const n = Math.hypot(t[0], t[1]) || 1;
    let nx = t[1] / n;
    let ny = -t[0] / n;
    if (nx * (p[0] - (LOOP.cx - 30)) + ny * p[1] < 0) {
      nx = -nx;
      ny = -ny;
    }
    return [p[0] + nx * by, p[1] + ny * by];
  });
}
const rearPoint = (A, t, side) => [LOOP.cx - A * Math.sin(t), side * LOOP.half * Math.cos(t)];
const frontPoint = (e) => [LOOP.cx + LOOP.front * Math.cos(e), LOOP.half * Math.sin(e)];
export const BAND = { z: -12, h: 30, thick: 2.4, tip: -98 };
const T_TIP = Math.asin((LOOP.cx - BAND.tip) / REAR_MAX);
export function bandCentre() {
  const points = [];
  for (let i = 0; i <= 26; i++) points.push(rearPoint(REAR_MAX, T_TIP * (1 - i / 26), -1));
  for (let i = 1; i < 60; i++) points.push(frontPoint(-Math.PI / 2 + (Math.PI * i) / 60));
  for (let i = 0; i <= 26; i++) points.push(rearPoint(REAR_MAX, (T_TIP * i) / 26, 1));
  return points;
}
export const BROW = { z: -17, h: 38, thick: 5, reach: 64 * DEG };
export function browCentre() {
  const c = [];
  for (let i = 0; i <= 44; i++) c.push(frontPoint(-BROW.reach + (2 * BROW.reach * i) / 44));
  return c;
}
export const TAIL = { z: -34, h: 22, thick: 2.2 };
export function tailRing(A, side) {
  const c = [];
  for (let i = 0; i <= 22; i++) c.push(rearPoint(A, (T_END * i) / 22, side));
  return [...offset(c, TAIL.thick / 2), ...offset(c, -TAIL.thick / 2).reverse()];
}
export const HOUSING = { z: -39, h: 32, back: 9, fore: 3 };
export function housingRing(A) {
  const [x] = tailEnd(A, 1);
  const y = LOOP.housing;
  return [[x + HOUSING.fore, -y], [x + HOUSING.fore, y], [x - HOUSING.back, y], [x - HOUSING.back, -y]];
}
export const KNOB = { r: 18, long: 15, z: HOUSING.z + HOUSING.h / 2 };
export const LINK = { z: -32, h: 30 };
export function linkRing(side) {
  const y0 = LOOP.half + BAND.thick / 2;
  return [[LOOP.cx - 8, side * y0], [LOOP.cx + 8, side * y0], [LOOP.cx + 8, side * (y0 + 2.4)], [LOOP.cx - 8, side * (y0 + 2.4)]];
}

// where a ray from the shell's axis at this angle meets the fixed band
export function bandRadius(theta) {
  const inside = (r) => {
    const x = r * Math.cos(theta);
    const y = r * Math.sin(theta);
    return x >= LOOP.cx ? ((x - LOOP.cx) / LOOP.front) ** 2 + (y / LOOP.half) ** 2 < 1 : ((x - LOOP.cx) / REAR_MAX) ** 2 + (y / LOOP.half) ** 2 < 1;
  };
  let lo = 0;
  let hi = 200;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (inside(mid)) lo = mid;
    else hi = mid;
  }
  return lo;
}
// the band where that ray meets it: the point on its outer face, its outward normal and its tangent
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
  return { p: [p[0] + (n[0] * BAND.thick) / 2, p[1] + (n[1] * BAND.thick) / 2], n, t };
}
// a rectangle standing across a ray: r0..r1 out along it, ±half across it
export const across = (theta, r0, r1, half) => {
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  return [[r0, -half], [r1, -half], [r1, half], [r0, half]].map(([r, t]) => [r * c - t * s, r * s + t * c]);
};
export const KEY = { z: 18, h: 25, thick: 4.5, half: 11, gap: 6 };
export const LEDGE = { z: 18, h: 6 };
export const TAB = { z: -6, h: 24, thick: 3, half: 7 };
export const HUB = { r: 22, z: 118, h: 6 };
export const STRAP = { half: 10, thick: 4 }; // 2 cm wide, 4 mm thick
export function keyAt(deg) {
  const theta = deg * DEG;
  const wall = polarR(INNER.a, INNER.b, theta);
  const band = bandRadius(theta) + BAND.thick / 2;
  const r1 = wall - KEY.gap;
  const r0 = r1 - KEY.thick;
  return { theta, wall, band, r0, r1, strap: r0 - 0.6 - STRAP.thick / 2 };
}
// half a crown strap: up from the key's ledge and over to the hub, as (r, z) along the ray
export function strapProfile(key) {
  const z0 = LEDGE.z + LEDGE.h;
  const z1 = HUB.z + HUB.h / 2;
  const points = [];
  const n = 44;
  for (let i = 0; i <= n; i++) {
    const tau = (Math.PI / 2) * (i / n);
    points.push([HUB.r + (key.strap - HUB.r) * Math.cos(tau) ** 0.82, z0 + (z1 - z0) * Math.sin(tau) ** 0.82]);
  }
  points[0] = [key.strap, z0];
  points[n] = [HUB.r, z1];
  return points;
}
export function hubRing(angles) {
  let poly = [[-60, -60], [60, -60], [60, 60], [-60, 60]];
  for (const deg of angles) {
    const c = Math.cos(deg * DEG);
    const s = Math.sin(deg * DEG);
    const next = [];
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i];
      const b = poly[(i + 1) % poly.length];
      const da = a[0] * c + a[1] * s - HUB.r;
      const db = b[0] * c + b[1] * s - HUB.r;
      if (da <= 0) next.push(a);
      if (da <= 0 !== db <= 0) next.push([a[0] + ((b[0] - a[0]) * da) / (da - db), a[1] + ((b[1] - a[1]) * da) / (da - db)]);
    }
    poly = next;
  }
  return poly;
}
export const CHIN = { x: 62, drop: 42, half: 9, thick: 3, clipZ: -24 };
export const chinY = () => LOOP.half * Math.sqrt(1 - ((CHIN.x - LOOP.cx) / LOOP.front) ** 2);
export function chinPath(from = 0, to = Math.PI, n = 56) {
  const y = chinY();
  return Array.from({ length: n + 1 }, (_, i) => {
    const s = from + ((to - from) * i) / n;
    return [CHIN.x, y * Math.cos(s), CHIN.clipZ - CHIN.drop * Math.sin(s)];
  });
}
