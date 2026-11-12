// AVES TITAN AV-841R, exploded view v0.2. node build.mjs [--light] [--audit] [--fine] [--quick] [--fast] [--fit=52..66] [--view=deg]
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "/Users/macintosh/.claude/skills/anatomy/kit/iso-kit.mjs";
import * as G from "/Users/macintosh/.claude/skills/anatomy/kit/lathe.mjs";
import * as A from "/Users/macintosh/.claude/skills/anatomy/kit/audit.mjs";
import { kitScript } from "/Users/macintosh/.claude/skills/anatomy/scripts/inline-kit.mjs";
import { surface, surfaceSvg, strapPatches } from "./surf.mjs";
import * as M from "./model.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const arg = (name, fallback) => {
  const hit = process.argv.find((entry) => entry.startsWith(`--${name}=`));
  return hit ? Number(hit.split("=")[1]) : fallback;
};
const THEME = process.argv.includes("--light") ? "light" : "dark";
const FAST = process.argv.includes("--fast");
const DEG = Math.PI / 180;
const FIT_CM = arg("fit", M.FIT_REST);
const VIEW_OFF = arg("view", 68);
const AZIMUTH = 45;
// --spin=<deg> builds one frame of the 360 set: the same camera, the helmet turned by that angle about its own axis
// (anticlockwise seen from above). Frame 0 is the exploded view's own angle.
const SPIN = arg("spin", NaN);
const YAW0 = (AZIMUTH - VIEW_OFF) * DEG;
const YAW = YAW0 + (Number.isNaN(SPIN) ? 0 : SPIN * DEG);
const plan0 = ([x, y]) => [x * Math.cos(YAW0) - y * Math.sin(YAW0), x * Math.sin(YAW0) + y * Math.cos(YAW0)];
// the far side has a source (the ADS logo-area drawing): the 360 frames repeat the panels on the back. A normal build is unchanged.
M.BOTH.on = !Number.isNaN(SPIN);
const W = 640;
const H = arg("h", 1120);

const world = ([x, y, z]) => [x * Math.cos(YAW) - y * Math.sin(YAW), x * Math.sin(YAW) + y * Math.cos(YAW), z];
const plan = ([x, y]) => [x * Math.cos(YAW) - y * Math.sin(YAW), x * Math.sin(YAW) + y * Math.cos(YAW)];
const turn = world;

// How it comes apart, as the one value t rises: each assembly has its window of t.
const PIECES = {
  shell: { name: "Shell", say: "High-Density Polyethylene (HDPE) · 360° full brim", move: [0, 0, 325], window: [0, 0.25] },
  chin: { name: "Chin strap AV-729", say: "chin strap AV-729 · 2-point", move: [0, 0, -36], window: [0.45, 0.6] },
  brow: { name: "Sweatband AV-724PU", say: "sweatband · Polyester – Soft PU Foam", move: G.add3(turn([20, 0, 0]), [0, 0, 62]), window: [0.54, 0.7] },
  crown: { name: "Crown suspension", say: "6-point Nylon Harness · suspension keys", move: [0, 0, 104], window: [0.66, 0.86] },
  knob: { name: "Ratchet wheel", say: "Ratchet - Pull out to adjust, press to lock", move: turn([-44, 0, 0]), window: [0.84, 1] },
  band: { name: "Headband", say: "headband · Size Adjustment 52 – 66 cm", move: [0, 0, 0], window: [0, 1] },
};
const ORDER = ["shell", "chin", "brow", "crown", "knob", "band"];
const LEGEND = ["shell", "crown", "band", "brow", "knob", "chin"];
const WINDOWS = Object.fromEntries(ORDER.map((id) => [id, PIECES[id].window]));
const shareAt = (windows, id, t) => {
  const [from, to] = windows[id];
  const x = Math.min(1, Math.max(0, (t - from) / (to - from)));
  return id === "band" ? 0 : x * x * (3 - 2 * x);
};
const stateAt = (t) => ({ label: `t ${t.toFixed(2)}`, shares: Object.fromEntries(ORDER.map((id) => [id, shareAt(WINDOWS, id, t)])) });
const STATES = Array.from({ length: 101 }, (_, index) => stateAt(index / 100));

const corners = [];
for (const deg of [0, 45, 90, 135, 180, 225, 270, 315]) {
  const [x, y] = plan0([M.SHELL.brimA * Math.cos(deg * DEG), M.SHELL.brimB * Math.sin(deg * DEG)]);
  corners.push([x, y, 0], [x, y, PIECES.shell.move[2]]);
}
const P = k.fitProjection([...corners, [0, 0, M.SHELL.H + PIECES.shell.move[2]], [0, 0, -M.CHIN.drop + PIECES.chin.move[2] - 4], [...plan0([-185, 0]), 0], [...plan0([195, 0]), 20]], W, H, { pad: 26, azimuth: AZIMUTH, elevation: 30 });
const V = G.viewOf(P);
const at = (point) => k.iso(point, P);
const S = (paths, style) => k.solidSvg(paths, style);
const Ln = (d, style) => k.lineSvg(d, style);
const Dots = (points, style) => k.dotsSvg(points, style);
const pathOf = (points, closed = false) => points.map(([x, y], index) => `${index ? "L" : "M"}${x.toFixed(2)} ${y.toFixed(2)}`).join("") + (closed ? "Z" : "");

const R = A.recorder(P, { order: ORDER, spring: { stagger: 0 }, ground: (shape) => String(shape.name).startsWith("shell.") });
const { items, nameFor } = R;
const record = R.solid;
function put(piece, ref, svg, { bias = 0, shapes = [], name, mat = "ash", ...rest } = {}) {
  R.put({ piece, ride: piece, at: ref, bias, svg, move: PIECES[piece].move, shapes, name: name ?? nameFor(`${piece}.item`), mat, ...rest });
}
const extruded = (piece, ring, z, h, style, { name, owner, bias = 0, extra = "", bevel = 0, convex = true, at: ref, seams = [], mat, ...rest } = {}) => {
  const w = ring.map(plan);
  if (seams.length) style = { ...style, inner: Ln(seams.map((level) => k.ringSeam(w, level, P)).join(""), { tone: "faint" }) };
  const id = nameFor(name ?? `${piece}.part`);
  const centre = ref ?? [...w.reduce((sum, p) => [sum[0] + p[0] / w.length, sum[1] + p[1] / w.length], [0, 0]), z + h / 2];
  put(piece, centre, S(k.extrude(w, z, h, P, { convex, bevel }), style) + extra, { bias, name: id, mat, ...rest, shapes: [record(A.extruded(w, z, h, { name: id, owner: owner ?? piece }))] });
};
const frameRect = (frame, out0, out1, half) => [[out0, -half], [out1, -half], [out1, half], [out0, half]].map(([out, along]) => [frame.p[0] + frame.n[0] * out + frame.t[0] * along, frame.p[1] + frame.n[1] * out + frame.t[1] * along]);
const onFrame = (frame, out, along, z) => at(world([frame.p[0] + frame.n[0] * out + frame.t[0] * along, frame.p[1] + frame.n[1] * out + frame.t[1] * along, z]));
const facing = (n) => G.dot3(turn([n[0], n[1], 0]), V);

// ---------------------------------------------------------------- floor shadow, no stand
const FLOOR = -205;
const back = [`<path class="iso-halo hx-shadow" d="${pathOf(Array.from({ length: 72 }, (_, i) => at(world([M.SHELL.brimA * 0.86 * Math.cos(i * 5 * DEG), M.SHELL.brimB * 0.86 * Math.sin(i * 5 * DEG), FLOOR]))), true)}"/>`];

// ---------------------------------------------------------------- shell
const KEYS = M.keyAngles().map((deg, index) => ({ deg, theta: deg * DEG, frame: M.bandFrame(deg * DEG), diagonal: index < 4 }));
{
  const rows = M.shellRows().map((row) => row.map(world));
  const paths = surface([{ rows, flip: true }], P, { sharp: -2 });
  const inner = [];
  for (const line of M.shellLines()) {
    for (const run of paths.visibleRuns(line.points.map(world))) inner.push(line.fade && run.length === line.points.length ? k.fadeLineSvg(run, { fade: line.fade, tone: line.tone }) : Ln(pathOf(run), { tone: line.tone }));
  }
  const shapes = M.shellShapes(M.shellRows()).map(({ ring, z, h, name }) => record(A.extruded(ring.map(plan), z, h, { name: `shell.${name}`, owner: "shell" })));
  // the four bosses are moulded into the shell: one item, the far ones painted first.
  // Each is a wedge whose back is inside the crown wall; the shell's own surface cuts it.
  const drawn = { far: "", near: "" };
  const shellTris = [];
  for (let i = 0; i + 1 < rows.length; i += 1) for (let j = 0; j + 1 < rows[i].length; j += 1) shellTris.push([rows[i][j], rows[i + 1][j], rows[i + 1][j + 1]], [rows[i][j], rows[i + 1][j + 1], rows[i][j + 1]]);
  // in a 360 frame all four bosses are drawn, far ones first; whatever the shell hides of each is cut away
  for (const boss of Number.isNaN(SPIN) ? M.bosses() : [...M.bosses()].sort((a, b) => facing(a.n) - facing(b.n))) {
    const near = facing(boss.n) > 0;
    const at3 = (along, out, z) => world([boss.p[0] + boss.t[0] * along + boss.n[0] * out, boss.p[1] + boss.t[1] * along + boss.n[1] * out, z]);
    const [back, lowOut, highOut] = boss.out;
    const [z0, z1, z2] = boss.z;
    // corners: base (wide), front-top edge (narrower), back-top edge inside the wall
    const c = { bl: (s) => at3(s * boss.half, lowOut, z0), tl: (s) => at3(s * boss.top, highOut, z1), bk: (s) => at3(s * boss.top, back, z2), bb: (s) => at3(s * boss.half, back, z0) };
    const grid = (p00, p10, p01, p11, n = 64) => Array.from({ length: n + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => G.lerp3(G.lerp3(p00, p10, i / n), G.lerp3(p01, p11, i / n), j / n)));
    const centre = at3(0, (back + lowOut) / 2, (z0 + z2) / 2);
    const faces = [grid(c.bl(-1), c.bl(1), c.tl(-1), c.tl(1)), grid(c.tl(-1), c.tl(1), c.bk(-1), c.bk(1)), grid(c.bb(1), c.bl(1), c.bk(1), c.tl(1)), grid(c.bb(-1), c.bl(-1), c.bk(-1), c.tl(-1))].map((face) => {
      const normal = G.cross3(G.sub3(face[1][0], face[0][0]), G.sub3(face[0][1], face[0][0]));
      const mid = face[32][32];
      return { rows: face, flip: G.dot3(normal, G.sub3(mid, centre)) < 0 };
    });
    if (near || !Number.isNaN(SPIN)) {
      const wedge = surface(faces, P, { tolerance: 0.5, extraOccluders: shellTris, strict: true });
      const slot = boss.slot.map(([along, z]) => at3(along, lowOut + ((highOut - lowOut) * (z - z0)) / (z1 - z0) + 0.05, z));
      const slotSeen = near && slot.every((p) => !wedge.hiddenAt(p, 0.4));
      drawn.near += surfaceSvg(wedge, { tone: "mid", crease: "mid" }) + (slotSeen ? Ln(pathOf(slot.map(at), true), { tone: "lo" }) : "");
    }
    const F = { o: world([boss.p[0], boss.p[1], 0]), a: turn([boss.t[0], boss.t[1], 0]), u: turn([boss.n[0], boss.n[1], 0]), v: [0, 0, 1] };
    // recorded only as far in as the wall is thick: inside it the boss is hollow (it is the key slot)
    const inWall = -M.SHELL.wall;
    const section = [[inWall, z0], [lowOut, z0], [highOut, z1], [inWall, z1 + ((z2 - z1) * (highOut - inWall)) / (highOut - back)]];
    shapes.push(record(A.prism(F, section, -(boss.half + boss.top) / 2, (boss.half + boss.top) / 2, { name: "shell.boss", owner: "shell" })));
  }
  // inside each boss, and at the two mid-sides, the key slot a suspension key pushes up into: recorded, never seen
  for (const key of KEYS) {
    const wall = M.polarR(M.INNER.a, M.INNER.b, key.theta);
    const reach = wall - Math.hypot(...key.frame.p) + 5;
    shapes.push(record(A.extruded(frameRect(key.frame, 0.6, reach, M.KEY.half + 1).map(plan), M.KEY.z + M.KEY.h, 3, { name: "shell.pocket", owner: "shell" })));
  }
  put("shell", world([0, 0, 70]), drawn.far + surfaceSvg(paths, { tone: "hi", inner: inner.join("") }) + drawn.near, { name: "shell.body", shapes, mat: "white" });
}

// ---------------------------------------------------------------- bands
// A band that wraps what is inside it is cut where it turns edge-on to the viewer, so
// the near run and the far run each take their own depth. The cut lies on the band's
// own silhouette and adds no line: the ring still reads, and is, one ring.
const VIEW_LOCAL = [Math.cos(AZIMUTH * DEG - YAW), Math.sin(AZIMUTH * DEG - YAW)];
function runsOf(centre) {
  const outer = M.offset(centre, 1);
  const seen = centre.map((p, i) => (outer[i][0] - p[0]) * VIEW_LOCAL[0] + (outer[i][1] - p[1]) * VIEW_LOCAL[1] > 0);
  const runs = [];
  let from = 0;
  for (let i = 1; i < centre.length; i++) {
    if (seen[i] !== seen[i - 1] && i - from > 2 && centre.length - i > 2) {
      runs.push([from, i]);
      from = i;
    }
  }
  runs.push([from, centre.length - 1]);
  return runs;
}
const bandRun = (piece, centre, outBy, inBy, z, h, style, name, { extraOf, seams = [], mat } = {}) => {
  const outerAll = M.offset(centre, outBy);
  const innerAll = M.offset(centre, inBy);
  for (const [from, to] of runsOf(centre)) {
    const outer = outerAll.slice(from, to + 1);
    const inner = innerAll.slice(from, to + 1);
    const mid = centre[Math.floor((from + to) / 2)];
    extruded(piece, [...outer, ...inner.reverse()], z, h, style, { name, convex: false, seams, mat, at: world([mid[0], mid[1], z + h / 2]), extra: extraOf ? extraOf(outer) : "" });
  }
};
bandRun("band", M.ringCentre(), M.RING.thick / 2, -M.RING.thick / 2, M.RING.z, M.RING.h, { tone: "mid" }, "band.ring", { seams: [M.RING.z + 3.5, M.RING.z + M.RING.h - 3.5], mat: "ash" });

// the sweatband wraps the front of the ring: a face on the outside and a lip over the top
const weaveDots = (outer) => {
  const dots = [];
  for (let i = 1; i < outer.length - 1; i++) {
    const a = outer[i - 1];
    const b = outer[i + 1];
    let normal = [b[1] - a[1], -(b[0] - a[0])];
    if (normal[0] * outer[i][0] + normal[1] * outer[i][1] < 0) normal = [-normal[0], -normal[1]];
    const length = Math.hypot(...normal);
    const seen = facing([normal[0] / length, normal[1] / length]);
    if (seen < 0.1) continue;
    for (let row = 0; row < 6; row++) dots.push([...at(world([outer[i][0], outer[i][1], M.BROW.z + 4.5 + row * 5 + (i % 2 ? 0 : 2.5)])), Math.min(1, (seen - 0.1) / 0.35)]);
  }
  return Dots(dots, { size: 0.42, tone: "lo" });
};
const RT = M.RING.thick / 2;
const ringTop = M.RING.z + M.RING.h;
const browTop = M.BROW.z + M.BROW.h;
bandRun("brow", M.browCentre(), RT + 0.02 + M.BROW.thick, RT + 0.02, M.BROW.z, M.BROW.h, { tone: "hi" }, "brow.face", { extraOf: weaveDots, mat: "grey" });
// over the top edge, and a flap down the inside of the band
bandRun("brow", M.browCentre(), RT + 0.02, -RT - M.BROW.clear - 2.5, ringTop + 0.02, browTop - ringTop - 0.02, { tone: "hi" }, "brow.lip", { mat: "grey" });
bandRun("brow", M.browCentre(), -RT - M.BROW.clear, -RT - M.BROW.clear - 2.5, ringTop - M.BROW.flap, M.BROW.flap + 0.02, { tone: "hi" }, "brow.flap", { mat: "grey" });

// ---------------------------------------------------------------- crown suspension: straps, top pad, suspension keys
const strapItem = (points, acrossDir, halfW, halfT, { weave = 3.2, tone = "hi", caps = [true, true] } = {}) => {
  const w = points.map(world);
  const { patches, frames } = strapPatches(w, turn(acrossDir), halfW, halfT, { caps });
  const paths = surface(patches, P, { tolerance: 0.8 });
  const lines = [];
  if (weave) {
    let run = 0;
    let next = weave / 2;
    for (let i = 1; i < frames.length; i++) {
      run += G.len3(G.sub3(frames[i].p, frames[i - 1].p));
      if (run < next) continue;
      next += weave;
      const f = frames[i];
      const side = G.dot3(f.n, V) > 0 ? 1 : -1;
      if (Math.abs(G.dot3(f.n, V)) < 0.12) continue;
      const a = G.add3(f.p, G.add3(G.mul3(f.w, halfW), G.mul3(f.n, side * halfT)));
      const b = G.add3(f.p, G.add3(G.mul3(f.w, -halfW), G.mul3(f.n, side * halfT)));
      if (paths.hiddenAt(G.lerp3(a, b, 0.5))) continue;
      lines.push(pathOf([at(a), at(b)]));
    }
  }
  return { svg: surfaceSvg(paths, { tone, crease: "lo", inner: lines.length ? Ln(lines.join(""), { tone: "faint" }) : "" }), mid: w[Math.floor(w.length / 2)] };
};
const sectionOf = (flat, half) => {
  const normal = flat.map((p, i) => {
    const a = flat[Math.max(0, i - 1)];
    const b = flat[Math.min(flat.length - 1, i + 1)];
    const n = Math.hypot(b[0] - a[0], b[1] - a[1]);
    return [(b[1] - a[1]) / n, -(b[0] - a[0]) / n];
  });
  return [...flat.map(([a, b], i) => [a + normal[i][0] * half, b + normal[i][1] * half]), ...flat.map(([a, b], i) => [a - normal[i][0] * half, b - normal[i][1] * half]).reverse()];
};
// each strap runs key to opposite key. Over the middle of the pad it shows; at a slit
// each side it goes down through the pad and runs out under the pad's edge to its key.
const STRAPS = [[0, 2], [1, 3], [4, 5]];
const planeOf = (c, s) => {
  const u = turn([c, s, 0]);
  return { o: [0, 0, 0], a: G.cross3(u, [0, 0, 1]), u, v: [0, 0, 1] };
};
STRAPS.forEach(([one, other], index) => {
  for (const key of [KEYS[one], KEYS[other]]) {
    const c = Math.cos(key.theta);
    const s = Math.sin(key.theta);
    const endR = Math.hypot(...key.frame.p) - M.STRAP.thick / 2 - 1.1; // clear of the key's inner face, which is not square to the ray
    const profile = M.legProfile(endR, M.PAD.slit, M.PAD.z - M.STRAP.thick / 2 - 0.05);
    const made = strapItem(profile.map(([r, z]) => [r * c, r * s, z]), [-s, c, 0], M.STRAP.half, M.STRAP.thick / 2);
    const id = nameFor("crown.leg");
    put("crown", made.mid, made.svg, { name: id, mat: "black", shapes: [record(A.prism(planeOf(c, s), sectionOf(profile, M.STRAP.thick / 2), -M.STRAP.half, M.STRAP.half, { name: id, owner: "crown" }))] });
  }
  const theta = KEYS[one].theta;
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  const profile = M.runProfile(index);
  const made = strapItem(profile.map(([r, z]) => [r * c, r * s, z]), [-s, c, 0], M.STRAP.half, M.STRAP.thick / 2);
  const id = nameFor("crown.run");
  put("crown", world([0, 0, M.runHeight(index)]), made.svg, { name: id, mat: "black", shapes: [record(A.prism(planeOf(c, s), sectionOf(profile, M.STRAP.thick / 2), -M.STRAP.half, M.STRAP.half, { name: id, owner: "crown" }))] });
  // at each slit the strap turns down through the pad: the short drop from this strap's height to the pad
  const low = M.PAD.z + M.PAD.thick + 0.02;
  const drop = M.runHeight(index) - M.STRAP.thick / 2 - low;
  if (drop > 0.5) for (const sign of [1, -1]) {
    const ring = [[M.PAD.slit - M.STRAP.thick, -M.STRAP.half], [M.PAD.slit, -M.STRAP.half], [M.PAD.slit, M.STRAP.half], [M.PAD.slit - M.STRAP.thick, M.STRAP.half]].map(([r, t]) => [sign * (r * c - t * s), sign * (r * s + t * c)]);
    extruded("crown", ring, low, drop, { tone: "hi" }, { name: "crown.drop", mat: "black" });
  }
});
{
  const top = M.PAD.z + M.PAD.thick;
  const holes = [[25, 8], [25, -8], [-25, 8], [-25, -8]].map(([x, y]) => at(world([x, y, top])));
  // the six slits the straps pass through
  const slits = KEYS.map((key) => {
    const c = Math.cos(key.theta);
    const s = Math.sin(key.theta);
    return pathOf([[M.PAD.slit - 1.2, -11], [M.PAD.slit + 1.6, -11], [M.PAD.slit + 1.6, 11], [M.PAD.slit - 1.2, 11]].map(([r, t]) => at(world([r * c - t * s, r * s + t * c, top]))), true);
  });
  extruded("crown", M.padRing(), M.PAD.z, M.PAD.thick, { tone: "mid" }, { name: "crown.pad", mat: "ash", extra: Ln(slits.join(""), { tone: "lo" }) + Dots(holes, { size: 0.7, tone: "lo" }) });
}
// suspension keys: a head with two windows, a tongue with a slot. The strap comes down
// the inside, through the head, and folds back up the outside.
for (const key of KEYS) {
  const f = key.frame;
  const K = M.KEY;
  const top = K.z + K.h;
  const out = facing(f.n) > 0.05;
  const face = out ? K.thick : 0.02;
  const box = (a0, a1, z0, z1) => pathOf([[a0, z0], [a1, z0], [a1, z1], [a0, z1]].map(([along, z]) => onFrame(f, face, along, z)), true);
  const headMarks = out ? Ln(box(-11.5, -1.2, K.window[0], K.window[1]) + box(1.2, 11.5, K.window[0], K.window[1]), { tone: "lo" }) : "";
  const tongueMarks = out ? Ln(box(-2, 2, K.z + 5, K.z + 13), { tone: "lo" }) : "";
  extruded("crown", frameRect(f, 0.02, K.thick, K.tongue), K.z, K.neck - K.z, { tone: "mid" }, { name: "crown.key-tongue", mat: "ash", extra: tongueMarks });
  extruded("crown", frameRect(f, 0.02, K.thick, K.half), K.neck, top - K.neck, { tone: "mid" }, { name: "crown.key", mat: "ash", bevel: 0.3, extra: headMarks });
  extruded("crown", frameRect(f, K.thick + 0.02, K.thick + 1.1, M.STRAP.half - 1.5), K.window[0] + 1, top + 0.4 - K.window[0] - 1, { tone: "hi" }, { name: "crown.fold", mat: "black", bias: 0.2 });
}

// ---------------------------------------------------------------- nape strap, ratchet
const REAR = M.rearFor(FIT_CM);
const tailSvg = (ring) => {
  const paths = k.extrude(ring.map(plan), M.TAIL.z, M.TAIL.h, P, { convex: false });
  return `<g class="iso-solid"><path class="iso-fill" d="${paths.fill}"/>${paths.shades.map((d, shade) => `<path class="iso-shade" data-shade="${shade}" d="${d}"/>`).join("")}<path class="iso-top" d="${paths.top}"/><path class="iso-line iso-crease" data-tone="faint" d="${paths.crease}"/><path class="iso-line iso-edge" data-tone="mid" d="${paths.outline}"/></g>`;
};
const KNOB_FRAMES = [];
{
  for (const side of [1, -1]) {
    const ring = M.tailRing(REAR, side);
    const id = `band.tail${side > 0 ? "L" : "R"}`;
    const mid = ring[11];
    put("band", world([mid[0], mid[1], M.TAIL.z + M.TAIL.h / 2]), tailSvg(ring), { name: id, mat: "ash", tail: side, shapes: [record(A.extruded(ring.map(plan), M.TAIL.z, M.TAIL.h, { name: id, owner: "band" }))] });
    // the arm that drops from the round pivot on the headband to the nape strap
    const f = M.bandFrame(M.pivotAngle(side));
    const back = f.t[0] > 0 ? 1 : -1; // the arm drops, then sweeps back towards the nape
    const path = M.armPath().map(([along, z]) => [along * back, z]);
    const tw = turn([f.t[0], f.t[1], 0]);
    const nw = turn([f.n[0], f.n[1], 0]);
    const o = world([f.p[0], f.p[1], 0]);
    const w = path.map(([along, z]) => G.add3(G.add3(o, G.mul3(tw, along)), G.add3(G.mul3(nw, 0.02 + M.ARM.thick / 2), [0, 0, z])));
    const { patches } = strapPatches(w, nw, M.ARM.thick / 2, M.ARM.half);
    const paths = surface(patches, P, { tolerance: 0.8 });
    const shows = facing(f.n) > 0.1;
    const PF = G.frameAlong(G.add3(w[1], G.mul3(nw, M.ARM.thick / 2)), nw);
    const pivot = shows ? Ln(G.circleOf(PF, 0.02, 5.2, P, 24) + G.circleOf(PF, 0.02, 2.2, P, 16), { tone: "lo" }) : "";
    const AF = { o, a: G.cross3(tw, [0, 0, 1]), u: tw, v: [0, 0, 1] };
    const sign = G.dot3(AF.a, nw) > 0 ? 1 : -1;
    const span = [0.02, 0.02 + M.ARM.thick].map((value) => value * sign).sort((x, y) => x - y);
    const aid = nameFor("band.arm");
    put("band", w[12], surfaceSvg(paths, { tone: "mid", crease: "lo" }) + pivot, { name: aid, mat: "ash", bias: 0.2, shapes: [record(A.prism(AF, sectionOf(path, M.ARM.half), span[0], span[1], { name: aid, owner: "band" }))] });
  }
  const box = M.housingRing(REAR).map(plan);
  const [hx] = M.tailEnd(REAR, 1);
  const backX = hx - M.HOUSING.back;
  const top = M.HOUSING.z + M.HOUSING.h;
  const lidLine = [[hx + M.HOUSING.fore - 1.6, -23], [hx + M.HOUSING.fore - 1.6, 23], [backX + 1.6, 23], [backX + 1.6, -23]].map((p) => at(world([...p, top])));
  put("band", world([hx - 3, 0, M.HOUSING.z + M.HOUSING.h / 2]), S(k.extrude(box, M.HOUSING.z, M.HOUSING.h, P, { bevel: 0.6 }), { tone: "mid" }) + Ln(pathOf(lidLine, true), { tone: "faint" }) + Dots([at(world([hx - 3, -25.5, top])), at(world([hx - 3, 25.5, top]))], { size: 0.45 }), { name: "band.housing", mat: "ash", nape: 1, shapes: [record(A.extruded(box, M.HOUSING.z, M.HOUSING.h, { name: "band.housing", owner: "band" }))] });
  // the ratchet wheel, on the back of the housing, pointing straight back
  const F = G.frameAlong(world([backX, 0, M.KNOB.z]), turn([-1, 0, 0]));
  const RIBS = 22;
  const STEPS = 36;
  for (let i = 0; i < STEPS; i++) KNOB_FRAMES.push(k.fadedSvg(G.ribsOf(F, 1.6, M.KNOB.long - 1.2, M.KNOB.r, RIBS, P, { phase: ((2 * Math.PI) / RIBS) * (i / STEPS), fade: [0.08, 0.5], seams: true }), { tone: "lo" }));
  const faceSeen = G.dot3(F.a, V) > 0.1;
  const face = faceSeen ? Ln(G.circleOf(F, M.KNOB.long, M.KNOB.r - 4, P, 40) + G.circleOf(F, M.KNOB.long, 5, P, 20), { tone: "lo" }) : "";
  put("knob", world([backX - M.KNOB.long / 2, 0, M.KNOB.z]), S(G.disc(0, M.KNOB.long, M.KNOB.r, F, P, { bevel: 0.5 }), { tone: "hi" }) + `<g data-ribs>${KNOB_FRAMES[0]}</g>` + face, { name: "knob.wheel", mat: "black", bias: 0.3, nape: 1, knob: 1, shapes: [record(A.disc(F, 0, M.KNOB.long, M.KNOB.r, { name: "knob.wheel", owner: "knob" }))] });
}

// ---------------------------------------------------------------- chin strap: two clips, webbing, slider, centre buckle
{
  const reach = [];
  for (const side of [1, -1]) {
    const f = M.bandFrame(side * 90 * DEG);
    extruded("chin", frameRect(f, 0.02, 3, 7), M.CHIN.top, 13.6, { tone: "mid" }, { name: "chin.clip", mat: "ash", bevel: 0.3 });
    reach.push(Math.abs(f.p[1]) + 3 + 0.05 + M.CHIN.thick / 2);
  }
  const y = reach[0];
  const F = { o: [0, 0, 0], a: turn([1, 0, 0]), u: turn([0, 1, 0]), v: [0, 0, 1] };
  const flat = (points) => points.map(([, yy, z]) => [yy, z]);
  // near side: the quick-release buckle; middle: the chin guard; far side: the slider
  const BU = [0.5, 0.82];
  const GU = [Math.PI / 2 - 0.41, Math.PI / 2 + 0.41];
  const SL = [Math.PI - 0.78, Math.PI - 0.62];
  for (const [from, to, n] of [[0, BU[0], 12], [BU[1], GU[0], 8], [GU[1], SL[0], 8], [SL[1], Math.PI, 12]]) {
    const path = M.chinPath(y, from, to, n);
    const made = strapItem(path, [1, 0, 0], M.CHIN.half, M.CHIN.thick / 2, { weave: 2.6 });
    const id = nameFor("chin.strap");
    put("chin", made.mid, made.svg, { name: id, mat: "black", shapes: [record(A.prism(F, sectionOf(flat(path), M.CHIN.thick / 2), -M.CHIN.half, M.CHIN.half, { name: id, owner: "chin" }))] });
  }
  const blockOn = (span, name, halfW, halfT, mat, n = 8) => {
    const path = M.chinPath(y, span[0], span[1], n);
    const made = strapItem(path, [1, 0, 0], halfW, halfT, { weave: 0 });
    put("chin", made.mid, made.svg, { name, mat, bias: 0.3, shapes: [record(A.prism(F, sectionOf(flat(path), halfT), -halfW, halfW, { name, owner: "chin" }))] });
  };
  const mid = (BU[0] + BU[1]) / 2;
  blockOn([BU[0], mid - 0.012], "chin.buckle-a", M.CHIN.half + 3.5, M.CHIN.thick / 2 + 2.6, "black");
  blockOn([mid + 0.012, BU[1]], "chin.buckle-b", M.CHIN.half + 2.2, M.CHIN.thick / 2 + 1.8, "black");
  blockOn(SL, "chin.slider", M.CHIN.half + 2.2, M.CHIN.thick / 2 + 1.3, "black");
  blockOn(GU, "chin.guard", M.CHIN.guard[1], M.CHIN.thick / 2 + M.CHIN.guard[2], "black", 16);
}

// ---------------------------------------------------------------- settle, page
const sortStates = process.argv.includes("--quick") ? [0, 1, stateAt(0.35), stateAt(0.62), stateAt(0.78)] : [0, 1, ...STATES];
console.time("settle");
if (!FAST) A.settle(R, P, { states: Number.isNaN(SPIN) ? sortStates : [0], step: process.argv.includes("--fine") ? 0.25 : 0.5 });
console.timeEnd("settle");
items.sort((a, b) => a.key - b.key);
// the 360 frames show what is seen of the assembled helmet from outside: the shell and the chin strap
const spinPoints = [...Array.from({ length: 72 }, (_, i) => [(M.SHELL.brimA + 3) * Math.cos(i * 5 * DEG), (M.SHELL.brimA + 3) * Math.sin(i * 5 * DEG), 0]), [0, 0, M.SHELL.H + 3], [0, 0, -M.CHIN.drop - 12]].map(at);
// room round the brim circle, in view-box units [left, top, right, bottom]: measured as the union of the 36 frames' alpha bounds
// (x 40.25 to 584.28, y 499.55 to 999.83) plus 6; the dome's silhouette stands well above the crown point at this camera height
const SPIN_PAD = [1.2, 58.5, 1.2, 13.2];
const SPINBOX = (() => {
  const xs = spinPoints.map((p) => p[0]);
  const ys = spinPoints.map((p) => p[1]);
  const [l, t, r, b] = SPIN_PAD;
  return [Math.min(...xs) - l, Math.min(...ys) - t, Math.max(...xs) - Math.min(...xs) + l + r, Math.max(...ys) - Math.min(...ys) + t + b].map((value) => Math.round(value * 100) / 100);
})();
const SPIN_W = 1000;
const SPIN_H = Math.round((SPIN_W * SPINBOX[3]) / SPINBOX[2]);
if (!Number.isNaN(SPIN)) {
  const mats = readFileSync(join(HERE, "site.css"), "utf8").split("\n").filter((line) => line.startsWith(".m-")).join("\n");
  const art = items.filter((item) => item.piece === "shell" || item.piece === "chin").map((item) => `<g class="m-${item.mat}">${item.svg}</g>`).join("");
  const name = `spin-${String(((Math.round(SPIN) % 360) + 360) % 360).padStart(3, "0")}`;
  writeFileSync(join(HERE, "shots", "_spin", `${name}.html`), `<!doctype html><html><head><meta charset="utf-8"><style>${k.ISO_CSS}${mats}html,body{margin:0;background:transparent}.iso{--anatomy-weight:1.6px}svg{display:block;width:${SPIN_W}px;height:${SPIN_H}px}</style></head><body class="iso" data-theme="light" style="background:transparent"><svg xmlns="http://www.w3.org/2000/svg" class="iso-svg" viewBox="${SPINBOX.join(" ")}">${art}</svg></body></html>`);
  console.log("wrote", name, SPIN_W, SPIN_H);
  process.exit(0);
}
const groups = items.map((item, index) => `<g class="it m-${item.mat}" data-piece="${item.piece}" data-k="${item.key.toFixed(3)}" data-m="${item.move.map((value) => value.toFixed(2)).join(",")}"${item.nape ? " data-nape" : ""}${item.knob ? " data-knob" : ""}${item.tail ? ` data-tail="${item.tail}"` : ""} data-i="${index}">${item.piece === "shell" || item.piece === "chin" ? `<g id="art-${index}">${item.svg}</g>` : item.svg}</g>`);

const LABEL = "AVES TITAN AV-841R full-brim hard hat, drawn so that it comes apart the way the real one does: the white HDPE shell lifts off the whole AV-565R suspension; then the chin strap drops away, the sweatband comes off the front of the headband, the crown suspension of black crown straps through one grey top pad lifts off with its six suspension keys, and the ratchet wheel pulls back off its housing.";
const svg = `<svg xmlns="http://www.w3.org/2000/svg" class="iso-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${LABEL}"><g class="hx-cam">${back.join("")}<g class="hx-parts">${groups.join("")}</g></g></svg>`;
const unitOf = (vector) => {
  const o = at([0, 0, 0]);
  const p = at(vector);
  return [p[0] - o[0], p[1] - o[1]];
};
// the camera sits close on the assembled helmet and pulls back as the shell lifts
const CAM = (() => {
  const points = [...corners.filter((p) => p[2] === 0), [0, 0, M.SHELL.H], [0, 0, -M.CHIN.drop - 6], [0, 0, FLOOR + 40]].map(at);
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const box = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
  // the page works out the zoom from the room it really has: the figure may spill past its own box sideways
  return { bw: box[2] - box[0], bh: box[3] - box[1], x: (box[0] + box[2]) / 2, y: (box[1] + box[3]) / 2, w: W, h: H };
})();
const DATA = {
  cam: CAM,
  P,
  V,
  EX: unitOf([1, 0, 0]),
  EY: unitOf([0, 1, 0]),
  EZ: unitOf([0, 0, 1]),
  yaw: YAW,
  order: ORDER,
  legend: LEGEND,
  windows: WINDOWS,
  pieces: Object.fromEntries(Object.entries(PIECES).map(([id, piece]) => [id, { name: piece.name, say: piece.say }])),
  fit: { min: M.FIT_MIN, max: M.FIT_MAX, rest: FIT_CM },
  knob: { ribs: 22, perCm: (1.5 * 2 * Math.PI) / (M.FIT_MAX - M.FIT_MIN), frames: KNOB_FRAMES },
};
// ---- the kit page (figure alone, used by the audit and the line check)
const cornersHtml = `<div class="iso-plate-corners" aria-hidden="true"><span class="iso-plate-corner" data-corner="fig">Fig 1</span><span class="iso-plate-corner" data-corner="title">AVES TITAN AV-841R</span><span class="iso-plate-corner" data-corner="hint">Drag up to take it apart</span><span class="iso-plate-corner" data-corner="readout" data-readout>assembled</span></div>`;
const stageHtml = (extra = "") => `<div class="hx-stage" tabindex="0" role="slider" aria-label="AVES TITAN AV-841R, exploded view. ${extra}Left and right arrows turn the ratchet wheel, N steps through the parts." aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">${svg}</div>`;
const CSS = readFileSync(join(HERE, "page.css"), "utf8");
const MODEL_TEXT = readFileSync(join(HERE, "model.mjs"), "utf8").replace(/^export /gm, "");
const LIVE = readFileSync(join(HERE, "live.js"), "utf8").replace("__MODEL__", () => MODEL_TEXT).replace("__SHARE__", () => shareAt.toString()).replace("__DATA__", () => JSON.stringify(DATA));
const figureBody = `<figure class="iso-figure hx"><div class="iso-plate">${cornersHtml}${stageHtml("Up and down arrows take the helmet apart and put it back, Escape closes it. ")}<span class="hx-live" aria-live="polite" data-live></span></div></figure>`;
const page = k.pageHtml({ title: "AVES TITAN AV-841R", theme: THEME, body: `<style>${CSS}</style>${figureBody}`, script: kitScript() + LIVE, width: 720 });
const name = `figure${FIT_CM === M.FIT_REST ? "" : `-fit${FIT_CM}`}${THEME === "light" ? "-light" : ""}.html`;
writeFileSync(join(HERE, name), page);
console.log("wrote", name, `${(page.length / 1024).toFixed(0)} KB`, `${items.length} items`);

// ---- index.html: the AVES page. Copy is used verbatim from copy.json.
if (THEME === "light" && FIT_CM === M.FIT_REST) {
  const COPY = JSON.parse(readFileSync(join(HERE, "copy.json"), "utf8"));
  const TYPE = JSON.parse(readFileSync(join(HERE, "assets/type.json"), "utf8"));
  const esc = (text) => String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const word = (key, alt = TYPE[key].text, cls = "") => `<img${cls ? ` class="${cls}"` : ""} src="assets/type-${key}.png" width="${TYPE[key].w}" height="${TYPE[key].h}" alt="${esc(alt)}">`;
  // the stages the scroll passes through: where each rests (at), where its caption starts (from), which ADS features it shows
  const STAGES = [
    { id: "assembled", label: "Assembled", at: 0, from: 0 },
    { id: "shell", label: "Shell", at: 0.14, from: 0.04 },
    { id: "suspension", label: "Suspension", at: 0.35, from: 0.25 },
    { id: "chin", label: "Chin strap", at: 0.62, from: 0.5 },
    { id: "browpad", label: "Sweatband", at: 0.72, from: 0.66 },
    { id: "crown", label: "Crown", at: 0.88, from: 0.78 },
    { id: "ratchet", label: "Ratchet", at: 1, from: 0.94, hint: "Drag the wheel, or use the left and right arrow keys" },
  ];
  // callouts: ADS text beside the part it describes. Each has a window of t (in from, in to, out from, out to),
  // the part it rides with, and a point on that part in view-box units.
  const feature = (head) => {
    const hit = COPY.features.find((entry) => entry.head === head);
    return { head: `${hit.head}:`, text: hit.text };
  };
  const specLine = (key) => ({ head: `${key}:`, text: COPY.spec.find(([name]) => name === key)[1] });
  const on = (point) => at(world(point)).map((value) => Math.round(value * 10) / 10);
  const ringAt = (angle, z) => [M.RING.a * Math.cos(angle), M.RING.b * Math.sin(angle), z];
  const keyRear = KEYS.find((key) => key.deg > 100);
  const knobX = M.tailEnd(REAR, 1)[0] - M.HOUSING.back - M.KNOB.long / 2;
  const CALLOUTS = [
    { id: "low", t: [-1, -1, 0.02, 0.06], piece: "shell", at: on(M.shellPoint(0.36, 2.55)), blocks: [feature("Low-Profile Non-Vented Design")] },
    { id: "hdpe", t: [0.07, 0.12, 0.19, 0.24], piece: "shell", at: on(M.shellPoint(0.3, 2.55)), blocks: [feature("HDPE Protective Shell")] },
    { id: "brim", t: [0.08, 0.13, 0.19, 0.24], piece: "shell", at: on(M.shellPoint(0.86, 2.2)), blocks: [feature("360° Full Brim Coverage")] },
    { id: "ratchet-system", t: [0.27, 0.32, 0.43, 0.48], piece: "band", at: on(ringAt(2.45, 26)), blocks: [feature("Ratchet Suspension System")] },
    { id: "chin", t: [0.55, 0.6, 0.64, 0.67], piece: "chin", at: on([0, 14, M.CHIN.top - M.CHIN.drop]), blocks: [{ head: "AV-729", text: "2-point Attachment with Chin Guard" }] },
    { id: "sweat", t: [0.68, 0.71, 0.74, 0.78], piece: "brow", at: on(ringAt(0.62, 28).map((value, index) => (index === 2 ? value : value * 1.04))), blocks: [feature("Replaceable Components"), specLine("Sweatband")] },
    { id: "height", t: [0.82, 0.86, 0.9, 0.93], piece: "crown", at: on([keyRear.frame.p[0], keyRear.frame.p[1], M.KEY.z + 8]), blocks: [feature("Adjustable Vertical Settings")] },
    { id: "wheel", t: [0.95, 0.99, 2, 2], piece: "knob", nape: true, at: on([knobX, 4, M.KNOB.z + M.KNOB.r - 2]), blocks: [specLine("Adjustment Type")] },
  ];
  const callHtml = CALLOUTS.map((call) => `<div class="hx-call" data-call="${call.id}">${call.blocks.map((block) => `<p><b>${esc(block.head)}</b> <span>${esc(block.text)}</span></p>`).join("")}</div>`).join("");
  const leadHtml = `<svg class="hx-leads" aria-hidden="true">${CALLOUTS.map((call) => `<g data-lead="${call.id}"><path/><circle r="3.6"/></g>`).join("")}</svg>`;
  const navHtml = STAGES.map((stage) => `<button type="button">${esc(stage.label)}</button>`).join("");
  const DOCS = [["Article Data Sheet", "Features, specification, standards", COPY.documents.ads], ["Sell Sheet", "One-page product overview", COPY.documents.sellSheet], ["Certificate of Conformity", "Compliance certificate", COPY.documents.coc]];
  // where the page lives: og:url and og:image must be absolute. Change baseUrl in copy.json when the page moves.
  const BASE = COPY.baseUrl.replace(/\/?$/, "/");
  const SHARE_TITLE = "AVES TITAN® AV-841R Full Brim Helmet: exploded view";
  const SHARE_TEXT = COPY.intro.slice(0, COPY.intro.indexOf(". ") + 1);
  const SHARE_ALT = "AVES TITAN AV-841R full brim helmet, shell lifted off its 6-point ratchet suspension";
  const UI = COPY.ui;
  const NAV = [["apart", UI.nav.apart], ["spec", UI.nav.spec], ["accessories", UI.nav.accessories], ["customise", UI.nav.customise], ["industries", UI.nav.industries]];
  // ---- the four logo-placement views
  // the four views are the ADS's own vector drawings (page 3), cleaned and measured by logo-views.mjs: one frame size for
  // all four, each helmet centred with its lowest point on the frame's floor. The shell's fill takes the swatch colour
  // (--lv-shell, white by default) and the ADS's grey gradients multiply over it.
  const ADS_VIEWS = JSON.parse(readFileSync(join(HERE, "assets/ads-vectors/views.json"), "utf8"));
  const VIEWS = ["front", "back", "left", "right"].map((name, index) => {
    const view = ADS_VIEWS.views[name];
    return `<svg xmlns="http://www.w3.org/2000/svg" class="lv" viewBox="${view.viewBox.join(" ")}" role="img" aria-label="${COPY.logo.views[index]}: logo placement area ${index + 1}"><defs>${view.defs}</defs>${view.body}</svg>`;
  });
  const ACC = Object.fromEntries(COPY.accessories.groups.flatMap((group) => group.items).map((item) => {
    const data = readFileSync(join(HERE, `assets/acc-${item.key}.png`));
    return [item.key, [data.readUInt32BE(16), data.readUInt32BE(20)]];
  }));
  // the opening helmet is the pinned figure's own shell and chin strap, shown again by reference: one drawing, one colour
  const artIds = items.map((item, index) => (item.piece === "shell" || item.piece === "chin" ? index : -1)).filter((index) => index >= 0);
  // it is framed exactly as the 360 frames are, and stands in for frame 0 until the frames have loaded (or if they never do)
  const openStill = `<svg xmlns="http://www.w3.org/2000/svg" class="iso-svg op-still" viewBox="${SPINBOX.join(" ")}" role="img" aria-label="${esc(COPY.name)}">${artIds.map((index) => `<g class="m-${items[index].mat}"><use href="#art-${index}"/></g>`).join("")}</svg>`;
  // shell colours: each is a set of the kit's tone tokens, so the four tones keep their order in every colour
  const mixHex = (hex, to, share) => "#" + [1, 3, 5].map((at, index) => Math.round(parseInt(hex.slice(at, at + 2), 16) * (1 - share) + to[index] * share).toString(16).padStart(2, "0")).join("");
  const dark = (hex, share) => mixHex(hex, [0, 0, 0], share);
  const light = (hex, share) => mixHex(hex, [255, 255, 255], share);
  const RAMP = { red: [0.2, 0.08, 0.16, 0.25], yellow: [0.42, 0.07, 0.15, 0.24], orange: [0.24, 0.08, 0.16, 0.25], blue: [0.2, 0.1, 0.19, 0.28], green: [0.24, 0.08, 0.16, 0.25], grey: [0.34, 0.06, 0.12, 0.19] };
  const TOKENS = ["paper", "top", "shade-3", "shade-2", "shade-1", "shade-0", "hi", "mid", "lo", "faint"];
  const tonesOf = (id) => {
    const [top, s2, s1, s0] = RAMP[id];
    const base = COPY.shellColors[id[0].toUpperCase() + id.slice(1)];
    return [dark(base, 0.03), light(base, top), base, dark(base, s2), dark(base, s1), dark(base, s0), dark(base, 0.72), dark(base, 0.5), dark(base, 0.36), dark(base, 0.22)];
  };
  const SHELL_CSS = Object.keys(RAMP).map((id) => `body[data-shell="${id}"] .m-white{${tonesOf(id).map((tone, index) => `--anatomy-${TOKENS[index]}:${tone}`).join(";")}}\nbody[data-shell="${id}"] .lv{--lv-shell:${COPY.shellColors[id[0].toUpperCase() + id.slice(1)]}}`).join("\n");
  // the 360 frames are the white helmet: the page recolours them by sending each grey of the white ramp to the same
  // token's tone in the chosen colour. Greys are (r+g+b+1)/3 of the white tones in site.css; pixels at or under `keep` stay
  // as they are (the chin strap, the dark outlines).
  const WHITE_TONES = Object.fromEntries([...readFileSync(join(HERE, "site.css"), "utf8").split("\n").find((line) => line.startsWith(".m-white{")).matchAll(/--anatomy-([a-z0-9-]+):(#[0-9a-f]{6})/g)].map((hit) => [hit[1], hit[2]]));
  const SPIN_TOKENS = ["mid", "lo", "shade-0", "shade-1", "shade-2", "shade-3", "paper", "top"];
  const SPIN_RAMP = { keep: 100, from: SPIN_TOKENS.map((token) => Math.floor(([1, 3, 5].reduce((sum, at) => sum + parseInt(WHITE_TONES[token].slice(at, at + 2), 16), 0) + 1) / 3)) };
  for (const id of Object.keys(RAMP)) SPIN_RAMP[id] = SPIN_TOKENS.map((token) => tonesOf(id)[TOKENS.indexOf(token)]);
  const SITE_CSS = readFileSync(join(HERE, "site.css"), "utf8") + "\n" + SHELL_CSS;
  const HOST = readFileSync(join(HERE, "host.js"), "utf8");
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(SHARE_TITLE)}</title>
<meta name="description" content="${esc(SHARE_TEXT)}">
<link rel="canonical" href="${BASE}">
<meta name="theme-color" content="#039047">
<meta property="og:type" content="website">
<meta property="og:site_name" content="AVES">
<meta property="og:title" content="${esc(SHARE_TITLE)}">
<meta property="og:description" content="${esc(SHARE_TEXT)}">
<meta property="og:url" content="${BASE}">
<meta property="og:image" content="${BASE}assets/share-card.jpg">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(SHARE_ALT)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(SHARE_TITLE)}">
<meta name="twitter:description" content="${esc(SHARE_TEXT)}">
<meta name="twitter:image" content="${BASE}assets/share-card.jpg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Nunito+Sans:opsz,wght@6..12,400;6..12,600;6..12,700;6..12,800&display=swap" rel="stylesheet">
<style>${k.ISO_CSS}${SITE_CSS}</style>
</head>
<body class="iso" data-theme="light">
<header class="top">
  <img class="logo" src="assets/aves-logo.png" width="646" height="167" alt="AVES">
  <div class="cat"><span>${esc(COPY.category)}</span><img src="assets/cat-head.png" width="102" height="102" alt=""></div>
</header>
<section class="op" id="top" aria-label="${esc(COPY.name)}">
  <div class="op-fig"><div class="op-bg" aria-hidden="true"></div><div class="op-slot" style="aspect-ratio:${SPIN_W}/${SPIN_H}">${openStill}</div><p class="spin-cue" aria-hidden="true"><svg viewBox="0 0 28 16"><path d="M3 5.5C3 9.6 7.9 12.5 14 12.5S25 9.6 25 5.5"/><path d="M1 8.7 3 5.2l3.2 2.3M27 8.7 25 5.2l-3.2 2.3"/></svg>${esc(UI.spinCue)}</p></div>
  <div class="op-id">
    <h1>${word("model", "AV-841R", "model")}${word("name", COPY.sellSheetName, "name")}</h1>
    <p class="art">${esc(COPY.article)}</p>
    <p class="intro">${esc(COPY.intro)}</p>
    <p class="stds">${COPY.standards.map(esc).join(" · ")}</p>
    <div class="sw" role="group" aria-label="${esc(UI.colour)}">${COPY.colors.map((colour) => `<button type="button" class="sw-b" data-shell="${colour.toLowerCase()}" aria-pressed="${colour === "White"}" style="--c:${COPY.shellColors[colour]}"><i></i><span>${esc(colour)}</span></button>`).join("")}</div>
    <a class="cue" href="#apart"><svg viewBox="0 0 16 22" aria-hidden="true"><path d="M8 2v16M2.5 12.5 8 18l5.5-5.5"/></svg>${esc(UI.scrollCue)}</a>
  </div>
  <div class="spin-lane"><canvas class="spin" tabindex="0" role="slider" aria-label="${esc(UI.spinLabel)}" aria-valuemin="0" aria-valuemax="350" aria-valuenow="0" aria-valuetext="0°" hidden></canvas></div>
</section>
<nav class="pb" aria-label="Page"><a class="pb-l" href="#top"><img src="assets/aves-logo.png" width="646" height="167" alt="AVES"></a><span class="pb-n">${word("model-g", "AV-841R", "md")}${word("name-g", COPY.sellSheetName, "nm")}</span><span class="pb-s"></span>${NAV.map(([id, label]) => `<a class="pb-a" href="#${id}">${esc(label)}</a>`).join("")}</nav>
<main>
<section class="hx" id="apart" aria-label="Exploded view of the ${esc(COPY.name)}">
  <div class="hx-bg" aria-hidden="true"></div>
  <div class="hx-in">
  <div class="hx-name">${word("model-g", "AV-841R", "md")}${word("name-g", COPY.sellSheetName, "nm")}</div>
  <div class="hx-bar"><img class="lg" src="assets/aves-logo.png" width="646" height="167" alt="AVES">${word("tagline", COPY.tagline, "tg")}<span class="sp"></span><img class="hp" src="assets/type-head-protection.png" width="1080" height="72" alt="HEAD PROTECTION"><img class="ic" src="assets/cat-head.png" width="102" height="102" alt=""></div>
  ${stageHtml("Scroll to take the helmet apart. ")}
  <nav class="hx-nav" aria-label="Stages">${navHtml}</nav>
  ${leadHtml}
  <div class="hx-calls">${callHtml}</div>
  <div class="hx-size" aria-hidden="true"><span class="lb">${esc(COPY.spec.find(([key]) => key === "Size Adjustment")[0])}</span><span class="val" data-size></span><span class="rg">${esc(COPY.spec.find(([key]) => key === "Size Adjustment")[1])}</span><span class="hn">Drag the wheel to adjust</span></div>
  <span class="hx-live" data-readout>assembled</span>
  <span class="hx-live" aria-live="polite" data-live></span>
  <a class="hx-skip" href="#spec">${esc(UI.skip)}<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5"/></svg></a>
  </div>
</section>
<h2 class="sec-head">${word("features")}</h2>
<section class="sec mint"><ul class="feats">${COPY.features.map((feature) => `<li><b>${esc(feature.head)}</b>${esc(feature.text)}</li>`).join("")}</ul></section>
<h2 class="sec-head" id="spec">${word("spec-a", "TECHNICAL AND MATERIAL")}${word("spec-b", "SPECIFICATION")}</h2>
<section class="sec"><dl class="spec">${COPY.spec.map(([key, value]) => `<dt>${esc(key)}</dt><dd>${esc(value)}</dd>`).join("")}</dl><h3 class="docs-h">${word("documents")}</h3><ul class="docs">${DOCS.map(([label, what, url]) => `<li><a class="doc" href="${esc(url || COPY.documents.productPage)}" target="_blank" rel="noopener"><svg class="mk" viewBox="0 0 30 36" aria-hidden="true"><path d="M4 1.5h14.5L26.5 9.5v23a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-29a2 2 0 0 1 2-2z"/><path class="fd" d="M18.5 1.5v6a2 2 0 0 0 2 2h6z"/><path class="ln" d="M7.5 16h13M7.5 21h13M7.5 26h8"/></svg><span><b>${esc(label)}</b><small>${esc(what)}</small></span><svg class="ar" viewBox="0 0 22 22" aria-hidden="true"><path d="M4 11h13M12 6l5 5-5 5"/></svg></a></li>`).join("")}</ul></section>
<h2 class="sec-head">${word("standards")}</h2>
<section class="sec mint"><ul class="std">${COPY.standards.map((line) => `<li>${esc(line)}</li>`).join("")}</ul></section>
<h2 class="sec-head" id="accessories">${word("accessories")}</h2>
<section class="sec acc">${COPY.accessories.groups.map((group) => `<div class="acc-g rv"><h3>${esc(group.label)}</h3><ul>${group.items.map((item) => {
  const pic = `<img src="assets/acc-${item.key}.png" width="${ACC[item.key][0]}" height="${ACC[item.key][1]}" alt="" loading="lazy">`;
  const words = `<b>${esc(item.model)}</b><span>${esc(item.line)}</span>`;
  const main = item.url ? `<a class="acc-a" href="${esc(item.url)}" target="_blank" rel="noopener"><span class="ph">${pic}</span>${words}<em>${esc(UI.productPage)}<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5"/></svg></em></a>` : `<div class="acc-a"><span class="ph">${pic}</span>${words}</div>`;
  const tie = item.stage ? `<button type="button" class="acc-v" data-go="${item.stage}"><svg viewBox="0 0 18 18" aria-hidden="true"><path d="M3 7.2 9 4l6 3.2M3 11.2 9 14.4l6-3.2M9 1.6v2.2M9 14.6v1.8"/></svg>${esc(UI.inView)}</button>` : "";
  return `<li>${main}${tie}</li>`;
}).join("")}</ul></div>`).join("")}</section>
<h2 class="sec-head" id="customise">${word("logo-areas")}</h2>
<section class="sec mint lgs">
  <p class="lg-lines rv">${COPY.logo.lines.map((line) => `<span>${esc(line)}</span>`).join("")}</p>
  <ul class="lg-views">${VIEWS.map((view, index) => `<li class="rv">${view}<b>${esc(COPY.logo.views[index])}</b></li>`).join("")}</ul>
  <div class="lg-req rv"><h3>${esc(COPY.logo.requirementsHead)}</h3><ul>${COPY.logo.requirements.map((line) => `<li>${esc(line)}</li>`).join("")}</ul></div>
</section>
<h2 class="sec-head" id="industries">${word("industry")}</h2>
<section class="sec"><ul class="ind">${COPY.industries.items.map(([name, id, url]) => {
  const inner = `<img src="assets/ind-${id}.svg" width="128" height="128" alt="" loading="lazy"><b>${esc(name)}</b>`;
  return `<li class="rv">${url ? `<a href="${esc(url)}" target="_blank" rel="noopener">${inner}<em>${esc(UI.kit)}<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5"/></svg></em></a>` : `<div>${inner}</div>`}</li>`;
}).join("")}</ul></section>
<h2 class="sec-head">${word("more")}</h2>
<section class="sec mint"><ul class="mhp">${COPY.more.map((item) => `<li class="rv"><a href="${esc(item.url)}" target="_blank" rel="noopener"><span class="ph"><img src="assets/hp-${item.id}.png" width="${item.w}" height="${item.h}" alt="" loading="lazy"></span><b>${esc(item.name)}</b></a></li>`).join("")}</ul></section>
</main>
<footer class="foot"><img class="logo" src="assets/aves-logo-rev.png" width="646" height="167" alt="AVES">${word("aves-line", TYPE["aves-line"].text, "line")}</footer>
<script>window.HX_HOST = true; window.HX_PAGE = ${JSON.stringify({ bar: 54, glyphs: TYPE.glyphs, stages: STAGES, hold: 0.93, spin: { box: SPINBOX, cam: CAM, ramp: SPIN_RAMP }, callouts: CALLOUTS.map(({ id, t, piece, at: point, nape }) => ({ id, t, piece, at: point, nape: Boolean(nape) })) })};</script>
<script type="module">${(kitScript() + LIVE).replace(/<\/(script)/gi, "<\\/$1")}</script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.15.0/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.15.0/ScrollTrigger.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/lenis@1.3.26/dist/lenis.min.js"></script>
<script>addEventListener("DOMContentLoaded", () => { const boot = () => (window.setExplode ? (${JSON.stringify("")}, new Function(${JSON.stringify(HOST)})()) : setTimeout(boot, 30)); boot(); });</script>
</body>
</html>
`;
  writeFileSync(join(HERE, "index.html"), html);
  // ---- share cards: the figure with the shell off and the suspension whole, as a still, on the sell sheet's green
  const T_CARD = 0.35;
  const posed = [...items].map((item) => {
    const share = shareAt(WINDOWS, item.piece, T_CARD);
    const [sx, sy] = [unitOf([1, 0, 0]), unitOf([0, 1, 0]), unitOf([0, 0, 1])].reduce((sum, axis, index) => [sum[0] + axis[0] * item.move[index] * share, sum[1] + axis[1] * item.move[index] * share], [0, 0]);
    return { key: item.key + G.dot3(item.move, V) * share, svg: `<g class="it m-${item.mat}" transform="translate(${sx.toFixed(2)} ${sy.toFixed(2)})">${item.svg}</g>` };
  }).sort((a, b) => a.key - b.key);
  const still = (box) => `<svg xmlns="http://www.w3.org/2000/svg" class="iso-svg" viewBox="${box}">${back.join("")}${posed.map((entry) => entry.svg).join("")}</svg>`;
  const MATS = SITE_CSS.split("\n").filter((line) => line.startsWith(".m-")).join("\n");
  const cardCss = `${k.ISO_CSS}${MATS}
*{box-sizing:border-box}html,body{margin:0}
body{background:linear-gradient(115deg,#026a35 0%,rgb(3,144,71) 58%,#2f9f61 100%);overflow:hidden;position:relative}
body::before{content:"";position:absolute;inset:0;background-image:radial-gradient(circle,rgba(255,255,255,.2) 31%,transparent 33%);background-size:22px 22px;-webkit-mask-image:linear-gradient(90deg,#000 0,transparent 30%,transparent 62%,#000 100%);mask-image:linear-gradient(90deg,#000 0,transparent 30%,transparent 62%,#000 100%)}
img,svg{display:block;position:absolute}
/* no white behind the helmet: a lift within the green family behind the dark straps, and a darker green under the figure */
.lift{position:absolute;border-radius:50%;background:radial-gradient(closest-side,rgba(112,196,146,.5) 0%,rgba(112,196,146,.26) 55%,rgba(112,196,146,0) 100%)}
.ic{background:#fff;border-radius:50%}
.hx-shadow{--anatomy-halo:#01361b;--anatomy-halo-opacity:.34;opacity:.45}`;
  const img = (file, style, alt = "") => `<img src="assets/${file}" alt="${alt}" style="${style}">`;
  const BOX = "50 20 540 1090";
  const wide = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Share card 1200 x 630</title><style>${cardCss}body{width:1200px;height:630px}</style></head><body class="iso" data-theme="light">
<div class="lift" style="left:590px;top:250px;width:370px;height:400px"></div>
${still(BOX).replace("<svg ", '<svg style="left:622px;top:14px;width:300px;height:606px" ')}
${img("cat-head.png", "left:76px;top:206px;width:132px").replace("<img ", '<img class="ic" ')}
${img("type-head-protection.png", "left:48px;top:372px;width:188px")}
${img("aves-logo-rev.png", "left:300px;top:60px;width:196px")}
${img("type-model.png", "left:300px;top:208px;width:322px")}
${img("type-name.png", "left:300px;top:288px;width:310px")}
${img("type-tagline-rev.png", "left:300px;top:526px;width:300px")}
</body></html>`;
  const square = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Share card 600 x 600</title><style>${cardCss}body{width:600px;height:600px}</style></head><body class="iso" data-theme="light">
<div class="lift" style="left:300px;top:290px;width:330px;height:330px"></div>
${still(BOX).replace("<svg ", '<svg style="left:352px;top:108px;width:240px;height:484px" ')}
${img("aves-logo-rev.png", "left:36px;top:36px;width:190px")}
${img("type-model.png", "left:36px;top:150px;width:278px")}
${img("type-name.png", "left:36px;top:222px;width:262px")}
${img("cat-head.png", "left:36px;top:288px;width:36px").replace("<img ", '<img class="ic" ')}
${img("type-head-protection.png", "left:84px;top:300px;height:12px")}
${img("type-tagline-rev.png", "left:36px;top:540px;width:250px")}
</body></html>`;
  writeFileSync(join(HERE, "share-card.html"), wide);
  writeFileSync(join(HERE, "share-card-square.html"), square);
  console.log("wrote index.html", `${(html.length / 1024).toFixed(0)} KB`);
}
A.auditOrExit(R, P, { frames: STATES });
