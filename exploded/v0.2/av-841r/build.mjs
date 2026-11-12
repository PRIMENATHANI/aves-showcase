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
const YAW = (AZIMUTH - VIEW_OFF) * DEG;
const W = 640;
const H = arg("h", 1060);

const world = ([x, y, z]) => [x * Math.cos(YAW) - y * Math.sin(YAW), x * Math.sin(YAW) + y * Math.cos(YAW), z];
const plan = ([x, y]) => [x * Math.cos(YAW) - y * Math.sin(YAW), x * Math.sin(YAW) + y * Math.cos(YAW)];
const turn = world;

// How it comes apart, as the one value t rises: each assembly has its window of t.
const PIECES = {
  shell: { name: "Shell", say: "shell · HDPE · full brim · no ventilation", move: [0, 0, 325], window: [0, 0.25] },
  chin: { name: "Chin strap AV-729", say: "chin strap · nylon webbing 1.5 cm · quick-release buckle", move: [0, 0, -58], window: [0.45, 0.6] },
  brow: { name: "Ventilated sweatband AV-724PU", say: "sweatband · PU with ventilation holes and foam", move: turn([78, 0, 0]), window: [0.54, 0.7] },
  crown: { name: "Crown suspension", say: "crown straps · nylon · 2 cm wide, 4 mm thick · 6 suspension lugs", move: [0, 0, 104], window: [0.66, 0.86] },
  knob: { name: "Ratchet wheel", say: "ratchet wheel · POM · pull out to adjust, press to lock", move: turn([-44, 0, 0]), window: [0.84, 1] },
  band: { name: "Headband", say: "headband · HDPE · 52–66 cm · height adjustment 2 front, 2 rear", move: [0, 0, 0], window: [0, 1] },
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
  const [x, y] = plan([M.SHELL.brimA * Math.cos(deg * DEG), M.SHELL.brimB * Math.sin(deg * DEG)]);
  corners.push([x, y, 0], [x, y, PIECES.shell.move[2]]);
}
const P = k.fitProjection([...corners, [0, 0, M.SHELL.H + PIECES.shell.move[2]], [0, 0, -M.CHIN.drop + PIECES.chin.move[2] - 4], world([-185, 0, 0]), world([195, 0, 20])], W, H, { pad: 26, azimuth: AZIMUTH, elevation: 30 });
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
const FLOOR = -150;
const back = [`<path class="iso-halo hx-shadow" d="${pathOf(Array.from({ length: 72 }, (_, i) => at(world([M.SHELL.brimA * 0.86 * Math.cos(i * 5 * DEG), M.SHELL.brimB * 0.86 * Math.sin(i * 5 * DEG), FLOOR]))), true)}"/>`];

// ---------------------------------------------------------------- shell
const LUGS = M.lugAngles().map((deg, index) => ({ deg, theta: deg * DEG, frame: M.bandFrame(deg * DEG), diagonal: index < 4 }));
{
  const rows = M.shellRows().map((row) => row.map(world));
  const paths = surface([{ rows, flip: true }], P, { sharp: -2 });
  const inner = [];
  for (const line of M.shellLines()) {
    for (const run of paths.visibleRuns(line.points.map(world))) inner.push(line.fade && run.length === line.points.length ? k.fadeLineSvg(run, { fade: line.fade, tone: line.tone }) : Ln(pathOf(run), { tone: line.tone }));
  }
  const shapes = M.shellShapes(M.shellRows()).map(({ ring, z, h, name }) => record(A.extruded(ring.map(plan), z, h, { name: `shell.${name}`, owner: "shell" })));
  // the four bosses are moulded into the shell: one item, the far ones painted first
  const drawn = { far: "", near: "" };
  for (const boss of M.bosses()) {
    const ring = boss.ring.map(plan);
    drawn[facing(boss.normal) > 0 ? "near" : "far"] += S(k.extrude(ring, boss.z, boss.h, P, { bevel: 1.8 }), { tone: "hi" });
    shapes.push(record(A.extruded(ring, boss.z, boss.h, { name: "shell.boss", owner: "shell" })));
  }
  // inside each boss, and at the two mid-sides, the pocket a lug's head sits under: recorded, never seen
  for (const lug of LUGS) {
    const wall = M.polarR(M.INNER.a, M.INNER.b, lug.theta);
    const reach = wall - Math.hypot(...lug.frame.p) + 5;
    shapes.push(record(A.extruded(frameRect(lug.frame, 0.6, reach, M.LUG.half + 1).map(plan), M.LUG.z + M.LUG.h, 3, { name: "shell.pocket", owner: "shell" })));
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
bandRun("brow", M.browCentre(), M.RING.thick / 2 + 0.02 + M.BROW.thick, M.RING.thick / 2 + 0.02, M.BROW.z, M.BROW.h, { tone: "hi" }, "brow.face", { extraOf: weaveDots, mat: "grey" });
bandRun("brow", M.browCentre(), M.RING.thick / 2 + 0.02, -M.RING.thick / 2 - 3, M.RING.z + M.RING.h + 0.02, M.BROW.z + M.BROW.h - M.RING.z - M.RING.h - 0.02, { tone: "hi" }, "brow.lip", { mat: "grey" });

// ---------------------------------------------------------------- crown suspension: straps, top pad, lugs
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
// each strap runs lug to opposite lug. Drawn as leg, run over the pad, leg; the two
// joins lie on the pad's rim at the run's own height, so the strap reads as one.
const STRAPS = [[0, 2], [1, 3], [4, 5]];
STRAPS.forEach(([one, other], index) => {
  for (const lug of [LUGS[one], LUGS[other]]) {
    const c = Math.cos(lug.theta);
    const s = Math.sin(lug.theta);
    const endR = Math.hypot(...lug.frame.p) - M.STRAP.thick / 2 - 1.1; // clear of the lug's inner face, which is not square to the ray
    const profile = M.legProfile(endR, M.padReach(lug.theta), M.runHeight(index));
    const made = strapItem(profile.map(([r, z]) => [r * c, r * s, z]), [-s, c, 0], M.STRAP.half, M.STRAP.thick / 2, { caps: [false, true] });
    const u = turn([c, s, 0]);
    const F = { o: [0, 0, 0], a: G.cross3(u, [0, 0, 1]), u, v: [0, 0, 1] };
    const id = nameFor("crown.leg");
    put("crown", made.mid, made.svg, { name: id, mat: "black", shapes: [record(A.prism(F, sectionOf(profile, M.STRAP.thick / 2), -M.STRAP.half, M.STRAP.half, { name: id, owner: "crown" }))] });
    lug.strap = index;
  }
  const theta = LUGS[one].theta;
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  const z = M.runHeight(index);
  const reach = M.padReach(theta);
  const run = Array.from({ length: 9 }, (_, i) => [(-reach + (2 * reach * i) / 8) * c, (-reach + (2 * reach * i) / 8) * s, z]);
  const made = strapItem(run, [-s, c, 0], M.STRAP.half, M.STRAP.thick / 2, { caps: [false, false] });
  const id = nameFor("crown.run");
  put("crown", world([0, 0, z]), made.svg, { name: id, mat: "black", shapes: [record(A.orientedBox([0, 0, z], [turn([c, s, 0]), turn([-s, c, 0]), [0, 0, 1]], [reach, M.STRAP.half, M.STRAP.thick / 2], { name: id, owner: "crown" }))] });
});
{
  const top = M.PAD.z + M.PAD.thick;
  const holes = [[28, 8], [28, -8], [-28, 8], [-28, -8]].map(([x, y]) => at(world([x, y, top])));
  extruded("crown", M.padRing(), M.PAD.z, M.PAD.thick, { tone: "mid" }, { name: "crown.pad", mat: "ash", extra: Dots(holes, { size: 0.7, tone: "lo" }) });
}
for (const lug of LUGS) {
  const f = lug.frame;
  const top = M.LUG.z + M.LUG.h;
  const out = facing(f.n) > 0.05;
  // the slot the strap loops through, and the two height holes, on whichever face shows
  const face = out ? M.LUG.thick : 0.02;
  const slot = [[-8, top - 9], [8, top - 9], [8, top - 6.4], [-8, top - 6.4]].map(([along, z]) => onFrame(f, face, along, z));
  const holes = [M.LUG.z + 5, M.LUG.z + 11].map((z) => onFrame(f, face, 0, z));
  const marks = out ? Ln(pathOf(slot, true), { tone: "lo" }) + Dots(holes, { size: 0.6, tone: "lo" }) : "";
  extruded("crown", frameRect(f, 0.02, M.LUG.thick, M.LUG.half), M.LUG.z, M.LUG.h, { tone: "mid" }, { name: "crown.lug", mat: "ash", bevel: 0.3, extra: marks });
  // the strap's end, back up the outside of the lug from the slot
  extruded("crown", frameRect(f, M.LUG.thick + 0.02, M.LUG.thick + 1.3, M.STRAP.half - 2), top - 8, 8.5, { tone: "hi" }, { name: "crown.loop", mat: "black", bias: 0.2 });
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
    // the link that carries the tail, and the round pivot that joins it to the headband
    const f = M.bandFrame(M.pivotAngle(side));
    const ringOf = frameRect(f, 0.02, 2.4, M.LINK.half).map(plan);
    const shows = facing(f.n) > 0.1;
    const centre = world([f.p[0] + f.n[0] * 2.42, f.p[1] + f.n[1] * 2.42, M.LINK.pivotZ]);
    const PF = G.frameAlong(centre, turn([f.n[0], f.n[1], 0]));
    const pivot = shows ? S(G.disc(0, 1.8, 6.2, PF, P, { bevel: 0.3 }), { tone: "mid" }) + Ln(G.circleOf(PF, 1.8, 2.6, P, 16), { tone: "lo" }) : "";
    const lid = nameFor("band.link");
    put("band", world([f.p[0], f.p[1], M.LINK.z + M.LINK.h / 2]), S(k.extrude(ringOf, M.LINK.z, M.LINK.h, P, { bevel: 0.3 }), { tone: "mid" }) + pivot, { name: lid, mat: "ash", bias: 0.2, shapes: [record(A.extruded(ringOf, M.LINK.z, M.LINK.h, { name: lid, owner: "band" })), ...(shows ? [record(A.disc(PF, 0, 1.8, 6.2, { name: `${lid}.pivot`, owner: "band" }))] : [])] });
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
    extruded("chin", frameRect(f, 0.02, 3, 7), M.CHIN.top, 17, { tone: "mid" }, { name: "chin.clip", mat: "ash", bevel: 0.3 });
    reach.push(Math.abs(f.p[1]) + 3 + 0.05 + M.CHIN.thick / 2);
  }
  const y = reach[0];
  const F = { o: [0, 0, 0], a: turn([1, 0, 0]), u: turn([0, 1, 0]), v: [0, 0, 1] };
  const flat = (points) => points.map(([, yy, z]) => [yy, z]);
  const B = [Math.PI / 2 - 0.17, Math.PI / 2 + 0.17];
  const SL = [0.62, 0.8];
  for (const [from, to, n] of [[0, SL[0], 14], [SL[1], B[0], 14], [B[1], Math.PI, 30]]) {
    const path = M.chinPath(y, from, to, n);
    const made = strapItem(path, [1, 0, 0], M.CHIN.half, M.CHIN.thick / 2, { weave: 2.6 });
    const id = nameFor("chin.strap");
    put("chin", made.mid, made.svg, { name: id, mat: "black", shapes: [record(A.prism(F, sectionOf(flat(path), M.CHIN.thick / 2), -M.CHIN.half, M.CHIN.half, { name: id, owner: "chin" }))] });
  }
  for (const [span, name, grow] of [[SL, "chin.slider", 1.4], [B, "chin.buckle", 2.6]]) {
    const path = M.chinPath(y, span[0], span[1], 8);
    const made = strapItem(path, [1, 0, 0], M.CHIN.half + 2.2, M.CHIN.thick / 2 + grow, { weave: 0 });
    put("chin", made.mid, made.svg, { name, mat: "black", bias: 0.3, shapes: [record(A.prism(F, sectionOf(flat(path), M.CHIN.thick / 2 + grow), -M.CHIN.half - 2.2, M.CHIN.half + 2.2, { name, owner: "chin" }))] });
  }
}

// ---------------------------------------------------------------- settle, page
const sortStates = process.argv.includes("--quick") ? [0, 1, stateAt(0.35), stateAt(0.62), stateAt(0.78)] : [0, 1, ...STATES];
console.time("settle");
if (!FAST) A.settle(R, P, { states: sortStates, step: process.argv.includes("--fine") ? 0.25 : 0.5 });
console.timeEnd("settle");
items.sort((a, b) => a.key - b.key);
const groups = items.map((item, index) => `<g class="it m-${item.mat}" data-piece="${item.piece}" data-k="${item.key.toFixed(3)}" data-m="${item.move.map((value) => value.toFixed(2)).join(",")}"${item.nape ? " data-nape" : ""}${item.knob ? " data-knob" : ""}${item.tail ? ` data-tail="${item.tail}"` : ""} data-i="${index}">${item.svg}</g>`);

const LABEL = "AVES TITAN AV-841R full-brim hard hat, drawn so that it comes apart the way the real one does: the white HDPE shell lifts off the whole AV-565R suspension; then the chin strap drops away, the sweatband slides off the front of the headband, the crown suspension of black crown straps through one grey top pad lifts off with its six suspension lugs, and the ratchet wheel pulls back off its housing.";
const svg = `<svg xmlns="http://www.w3.org/2000/svg" class="iso-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${LABEL}"><g class="hx-cam">${back.join("")}<g class="hx-parts">${groups.join("")}</g></g></svg>`;
const unitOf = (vector) => {
  const o = at([0, 0, 0]);
  const p = at(vector);
  return [p[0] - o[0], p[1] - o[1]];
};
// the camera sits close on the assembled helmet and pulls back as the shell lifts
const CAM = (() => {
  const points = [...corners.filter((p) => p[2] === 0), [0, 0, M.SHELL.H], [0, 0, FLOOR - 30]].map(at);
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const box = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
  return { s: Math.min(1.5, (W - 36) / (box[2] - box[0]), (H - 60) / (box[3] - box[1])), x: (box[0] + box[2]) / 2, y: (box[1] + box[3]) / 2, w: W, h: H };
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
const PARTS = LEGEND.map((id, index) => `<button type="button" class="hx-part" data-part="${id}"><span class="hx-num">${String(index + 1).padStart(2, "0")}</span>${PIECES[id].name}</button>`).join("");
const cornersHtml = `<div class="iso-plate-corners" aria-hidden="true"><span class="iso-plate-corner" data-corner="fig">Fig 1</span><span class="iso-plate-corner" data-corner="title">AVES TITAN AV-841R</span><span class="iso-plate-corner" data-corner="hint">Drag up to take it apart</span><span class="iso-plate-corner" data-corner="readout" data-readout>assembled</span></div>`;
const controls = `<div class="hx-controls"><label>Apart<input type="range" min="0" max="1000" value="0" data-apart aria-label="Take the helmet apart"></label><label>Fit<input type="range" min="${M.FIT_MIN}" max="${M.FIT_MAX}" step="0.1" value="${FIT_CM}" data-fit aria-label="Headband size in centimetres"></label><span class="hx-live" aria-live="polite" data-live></span></div>`;
const stage = `<div class="hx-stage" tabindex="0" role="slider" aria-label="AVES TITAN AV-841R, exploded view. Up and down arrows take the helmet apart and put it back, left and right arrows turn the ratchet wheel, N steps through the parts, Escape closes it." aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">${svg}</div>`;
const caption = "The AVES TITAN AV-841R is a full-brim HDPE hard hat with no ventilation. Its AV-565R suspension is one assembly that drops out of the shell: an ash-grey HDPE headband for heads of 52–66 cm with a ratchet wheel in POM (pull out to adjust, press to lock) and height adjustment at two front and two rear points; a crown suspension of black nylon crown straps, 2 cm wide and 4 mm thick, with a grey top pad and six suspension lugs; the ventilated sweatband AV-724PU; and the 2-point chin strap AV-729 with a quick-release buckle. ANSI/ISEA Z89.1-2014 Type I, Class E & G; EN 397:2012+A1:2012.";
const body = `<figure class="iso-figure hx"><div class="iso-plate">${cornersHtml}${stage}${controls}</div><figcaption class="iso-legend"><span class="hx-parts-list">${PARTS}</span><span class="iso-caption">${caption}</span></figcaption></figure>`;
const CSS = readFileSync(join(HERE, "page.css"), "utf8");
const MODEL_TEXT = readFileSync(join(HERE, "model.mjs"), "utf8").replace(/^export /gm, "");
const LIVE = readFileSync(join(HERE, "live.js"), "utf8").replace("__MODEL__", () => MODEL_TEXT).replace("__SHARE__", () => shareAt.toString()).replace("__DATA__", () => JSON.stringify(DATA));
const page = k.pageHtml({ title: "AVES TITAN AV-841R", theme: THEME, body: `<style>${CSS}</style>${body}`, script: kitScript() + LIVE, width: 720 });
const name = `av-841r${FIT_CM === M.FIT_REST ? "" : `-fit${FIT_CM}`}${THEME === "light" ? "-light" : ""}.html`;
writeFileSync(join(HERE, name), page);
console.log("wrote", name, `${(page.length / 1024).toFixed(0)} KB`, `${items.length} items`);
A.auditOrExit(R, P, { frames: STATES });
