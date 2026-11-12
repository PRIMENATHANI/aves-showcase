// AVES TITAN AV-841R NV, exploded view. node build.mjs [--light] [--audit] [--fit=52..66] [--view=deg]
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
const ONLY = process.argv.find((entry) => entry.startsWith("--only="))?.split("=")[1] ?? "";
const DEG = Math.PI / 180;

// ---------------------------------------------------------------- the one switch
// Suspension points. The catalogue says 6, the brand's site says 4 for this model.
// Change this to 4 and rebuild: keys, crown straps and the hub all follow it.
const POINTS = arg("points", 6);

const FIT_CM = arg("fit", M.FIT_REST);
const VIEW_OFF = arg("view", 64);
const AZIMUTH = 45;
const YAW = (AZIMUTH + VIEW_OFF) * DEG;
const ZB = 80;

const W = 640;
const H = 1120;

// helmet coordinates: x to the front, y to the wearer's left, z up from the brim's lowest edge
const world = ([x, y, z]) => [x * Math.cos(YAW) - y * Math.sin(YAW), x * Math.sin(YAW) + y * Math.cos(YAW), z + ZB];
const plan = ([x, y]) => [x * Math.cos(YAW) - y * Math.sin(YAW), x * Math.sin(YAW) + y * Math.cos(YAW)];
const turn = ([x, y, z]) => [x * Math.cos(YAW) - y * Math.sin(YAW), x * Math.sin(YAW) + y * Math.cos(YAW), z];

const PIECES = {
  shell: { name: "Shell", say: "shell · HDPE · full brim, 360° · non-vented", lift: 500 },
  straps: { name: "Crown straps and hub", say: "crown straps · nylon · 2 cm wide, 4 mm thick", lift: 375 },
  keys: { name: "Hanger keys", say: `hanger keys · ${POINTS}-point suspension`, lift: 300 },
  band: { name: "Headband and height tabs", say: "headband · height adjustment, 2 front and 2 rear", lift: 235 },
  brow: { name: "Brow pad", say: "brow pad · PU foam, perforated · hook-and-loop, detachable", lift: 150 },
  ratchet: { name: "Ratchet housing and knob", say: "ratchet · POM knob · fits 52–66 cm", lift: 150 },
  chin: { name: "Chin strap", say: "chin strap · 2-point", lift: 100 },
  stand: { name: "Stand", say: "", lift: 0 },
};
const ORDER = ["shell", "straps", "keys", "band", "brow", "ratchet", "chin"];
for (const id of Object.keys(PIECES)) PIECES[id].move = [0, 0, PIECES[id].lift];

const TOP = ZB + M.SHELL.H + PIECES.shell.lift;
const DRUM_R = M.DRUM.r + M.DRUM.wall / 2 + 10;
const P = k.fitProjection(
  [
    ...[0, 60, 120, 180, 240, 300].map((deg) => [DRUM_R * 1.02 * Math.cos(deg * DEG), DRUM_R * 1.02 * Math.sin(deg * DEG), 0]),
    ...[0, 45, 90, 135, 180, 225, 270, 315].flatMap((deg) => {
      const [x, y] = plan([M.SHELL.brimA * Math.cos(deg * DEG), M.SHELL.brimB * Math.sin(deg * DEG)]);
      return [[x, y, ZB], [x, y, ZB + PIECES.shell.lift]];
    }),
    [0, 0, TOP],
  ],
  W,
  H,
  { pad: 30, azimuth: AZIMUTH, elevation: 30 },
);
const V = G.viewOf(P);
const KS = G.scaleOf(P);
const at = (point) => k.iso(point, P);
const S = (paths, style) => k.solidSvg(paths, style);
const Ln = (d, style) => k.lineSvg(d, style);
const Dots = (points, style) => k.dotsSvg(points, style);
const pathOf = (points, closed = false) => points.map(([x, y], index) => `${index ? "L" : "M"}${x.toFixed(2)} ${y.toFixed(2)}`).join("") + (closed ? "Z" : "");

// one deterministic explode: t in 0..1 gives every assembly its share. The page
// uses the same text of this function, and the audit checks 51 values of t.
const shareOf = (index, count, t) => {
  const lag = 0.3;
  const x = Math.min(1, Math.max(0, (t * (1 + lag) - (lag * index) / Math.max(1, count - 1)) / 1));
  return x * x * (3 - 2 * x);
};
const stateAt = (t) => ({ label: `t ${t.toFixed(2)}`, shares: Object.fromEntries([...ORDER.map((id, index) => [id, shareOf(index, ORDER.length, t)]), ["stand", 0]]) });
const STATES = Array.from({ length: 51 }, (_, index) => stateAt(index / 50));

const R = A.recorder(P, { order: [...ORDER, "stand"], spring: { stagger: 0 } });
const { items, nameFor } = R;
const record = R.solid;
function put(piece, ref, svg, { bias = 0, shapes = [], name, part } = {}) {
  R.put({ piece, ride: piece, at: ref, bias, svg, move: PIECES[piece].move, shapes, name: name ?? nameFor(`${piece}.item`), part: part ?? piece });
}
const centreOf = (points) => G.mul3(points.reduce((sum, p) => G.add3(sum, p), [0, 0, 0]), 1 / points.length);

// ---------------------------------------------------------------- stand: a plain low drum
const back = [];
{
  const { r, wall, ratio } = M.DRUM;
  const ellipse = (radius, deg) => {
    // world polar angle → point on the helmet-aligned oval
    const local = deg * DEG - YAW;
    const scale = 1 / Math.hypot(Math.cos(local), Math.sin(local) / ratio);
    return [radius * scale * Math.cos(deg * DEG), radius * scale * Math.sin(deg * DEG)];
  };
  const oval = (radius, from, to, count) => Array.from({ length: count + 1 }, (_, index) => ellipse(radius, from + ((to - from) * index) / count));
  const plate = oval(r + wall / 2 + 10, 0, 360, 96).slice(0, -1);
  const FOOT_H = 6;
  const PLATE_H = 6;
  const floorZ = FOOT_H + PLATE_H;
  const top = ZB + M.SHELL.seat;
  back.push(`<path class="iso-halo" d="${pathOf(plate.map(([x, y]) => at([x, y, 0])), true)}"/>`);
  const feet = [30, 120, 210, 300].map((deg) => ellipse(r - 16, deg + AZIMUTH)).sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
  for (const [x, y] of feet) {
    back.push(S(k.cylinder(x, y, 9, 0, FOOT_H, P, 28), { tone: "lo" }));
    record(A.cylinder(x, y, 9, 0, FOOT_H, { name: "stand.foot", owner: "stand.frame", ground: true }));
  }
  back.push(S(k.extrude(plate, FOOT_H, PLATE_H, P, { bevel: 1.2 }), { tone: "mid" }));
  record(A.extruded(plate, FOOT_H, PLATE_H, { name: "stand.plate", owner: "stand.frame", ground: true }));
  const half = (from) => [...oval(r + wall / 2, from, from + 180, 60), ...oval(r - wall / 2, from, from + 180, 60).reverse()];
  const far = half(AZIMUTH + 90);
  const near = half(AZIMUTH - 90);
  const rimOf = (ring) => Ln(k.onTop(oval(r, 0, 360, 96), top, P, true), { tone: "faint" });
  put("stand", [...ellipse(r, AZIMUTH + 180), (floorZ + top) / 2], S(k.extrude(far, floorZ, top - floorZ, P, { convex: false }), { tone: "mid" }), { name: "stand.drum-far", shapes: [record(A.extruded(far, floorZ, top - floorZ, { name: "stand.drum-far", owner: "stand.frame", ground: true }))] });
  put("stand", [...ellipse(r, AZIMUTH), (floorZ + top) / 2], S(k.extrude(near, floorZ, top - floorZ, P, { convex: false }), { tone: "mid", inner: Ln(k.ringSeam(oval(r + wall / 2, AZIMUTH - 90, AZIMUTH + 90, 60), floorZ + 7, P), { tone: "faint" }) }), { name: "stand.drum-near", shapes: [record(A.extruded(near, floorZ, top - floorZ, { name: "stand.drum-near", owner: "stand.frame", ground: true }))] });
  void rimOf;
}

// ---------------------------------------------------------------- shell
const shellRows = M.shellRows();
{
  const rows = shellRows.map((row) => row.map(world));
  const paths = surface([{ rows, flip: true }], P, { sharp: -2 });
  const inner = [];
  const laid = (points, style, fade) => {
    for (const run of paths.visibleRuns(points.map(world))) {
      const whole = run.length === points.length;
      inner.push(fade && whole ? k.fadeLineSvg(run, { fade, tone: style.tone }) : Ln(pathOf(run), style));
    }
  };
  for (const line of M.shellLines()) laid(line.points, { tone: line.tone }, line.fade);
  const shapes = M.shellShapes(shellRows).map(({ ring, z, h, name }) => record(A.extruded(ring.map(plan), z + ZB, h, { name: `shell.${name}`, owner: "shell" })));
  // the two accessory-slot bosses are moulded into the shell: one item, the far one painted first
  const drawn = { far: "", near: "" };
  for (const boss of M.bosses()) {
    const ring = boss.ring.map(plan);
    const slot = boss.slot.map((p) => at(world(p)));
    const near = G.dot3(turn([0, boss.side, 0]), V) > 0;
    drawn[near ? "near" : "far"] += S(k.extrude(ring, boss.z + ZB, boss.h, P, { bevel: 0.7 }), { tone: "hi" }) + Ln(pathOf(slot, true), { tone: "lo" });
    shapes.push(record(A.extruded(ring, boss.z + ZB, boss.h, { name: "shell.boss", owner: "shell" })));
  }
  put("shell", world([0, 0, 70]), drawn.far + surfaceSvg(paths, { tone: "hi", inner: inner.join("") }) + drawn.near, { name: "shell.body", shapes });
}

const KNOB_FRAMES = [];
if (ONLY !== "shell") {
// ---------------------------------------------------------------- suspension
const extruded = (piece, ring, z, h, style, { name, owner, bias = 0, extra = "", bevel = 0, convex = true, at: ref, part, seams = [] } = {}) => {
  const w = ring.map(plan);
  if (seams.length) style = { ...style, inner: Ln(seams.map((level) => k.ringSeam(w, level + ZB, P)).join(""), { tone: "faint" }) };
  const id = nameFor(name ?? `${piece}.part`);
  const centre = ref ?? [...w.reduce((sum, p) => [sum[0] + p[0] / w.length, sum[1] + p[1] / w.length], [0, 0]), z + ZB + h / 2];
  put(piece, centre, S(k.extrude(w, z + ZB, h, P, { convex, bevel }), style) + extra, { bias, name: id, part, shapes: [record(A.extruded(w, z + ZB, h, { name: id, owner: owner ?? piece }))] });
};
const KEYS = M.keyAngles(POINTS).map((deg) => ({ deg, ...M.keyAt(deg) }));
const TABS = new Set(M.tabAngles(POINTS));
const shellItem = items.find((item) => item.name === "shell.body");
for (const key of KEYS) {
  // the pocket moulded inside the shell that the key's head sits under: recorded, never seen
  const pocket = M.across(key.theta, key.r0, key.wall + 4, M.KEY.half + 1).map(plan);
  const shape = record(A.extruded(pocket, M.KEY.z + M.KEY.h + ZB, 3, { name: "shell.pocket", owner: "shell" }));
  Object.assign(shape, { move: shellItem.move, ride: "shell", piece: "shell" });
  shellItem.shapes.push(shape);
  const body = M.across(key.theta, key.r0, key.r1, M.KEY.half);
  const top = M.KEY.z + M.KEY.h;
  const mid = (key.r0 + key.r1) / 2;
  const onTop = (r, t) => at(world([r * Math.cos(key.theta) - t * Math.sin(key.theta), r * Math.sin(key.theta) + t * Math.cos(key.theta), top]));
  extruded("keys", body, M.KEY.z, M.KEY.h, { tone: "mid" }, { name: "keys.key", bevel: 0.4, extra: Ln(pathOf([onTop(mid, -6), onTop(mid, 6)]), { tone: "lo", free: true }) + Dots([onTop(mid, -8.6), onTop(mid, 8.6)], { size: 0.4 }) });
  extruded("keys", M.across(key.theta, key.band + 0.05, key.r0, M.KEY.half), M.LEDGE.z, M.LEDGE.h, { tone: "mid" }, { name: "keys.ledge" });
  if (TABS.has(key.deg)) {
    const frame = M.bandFrame(key.theta);
    const corner = (out, along) => [frame.p[0] + frame.n[0] * out + frame.t[0] * along, frame.p[1] + frame.n[1] * out + frame.t[1] * along];
    const tab = [corner(0.02, -M.TAB.half), corner(M.TAB.thick, -M.TAB.half), corner(M.TAB.thick, M.TAB.half), corner(0.02, M.TAB.half)];
    const face = (t, z) => at(world([...corner(M.TAB.thick, t), z]));
    const holes = G.dot3(turn([frame.n[0], frame.n[1], 0]), V) > 0.1 ? Dots([2, 8, 14].map((z) => face(0, z)), { size: 0.55, tone: "lo" }) : "";
    extruded("band", tab, M.TAB.z, M.TAB.h, { tone: "mid" }, { name: "band.tab", owner: "band", bias: 0.4, extra: holes });
  }
}

// crown straps: one half per key, ending flush on a flat of the hub
const strapItem = (piece, points, acrossDir, halfW, halfT, tone, name, { weave = 3.2, owner } = {}) => {
  const w = points.map(world);
  const dir = turn(acrossDir);
  const { patches, frames } = strapPatches(w, dir, halfW, halfT);
  const paths = surface(patches, P, { tolerance: 0.8 });
  const inner = [];
  if (weave) {
    // the weave: faint ribs across the strap, edge to edge, on whichever broad face shows
    let run = 0;
    let next = weave / 2;
    const lines = [];
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
    inner.push(Ln(lines.join(""), { tone: "faint" }));
  }
  return { svg: surfaceSvg(paths, { tone, crease: "lo", inner: inner.join("") }), mid: w[Math.floor(w.length / 2)], frames };
};
for (const key of KEYS) {
  const profile = M.strapProfile(key);
  const c = Math.cos(key.theta);
  const s = Math.sin(key.theta);
  const points = profile.map(([r, z]) => [r * c, r * s, z]);
  const { svg, mid } = strapItem("straps", points, [-s, c, 0], M.STRAP.half, M.STRAP.thick / 2, "hi", "straps.strap");
  // the same strap for the audit: its (r, z) section turned into a prism across the ray
  const u = turn([c, s, 0]);
  const F = { o: [0, 0, ZB], a: G.cross3(u, [0, 0, 1]), u, v: [0, 0, 1] };
  const normal = profile.map((p, i) => {
    const a = profile[Math.max(0, i - 1)];
    const b = profile[Math.min(profile.length - 1, i + 1)];
    const n = Math.hypot(b[0] - a[0], b[1] - a[1]);
    return [(b[1] - a[1]) / n, -(b[0] - a[0]) / n];
  });
  const half = M.STRAP.thick / 2;
  const polygon = [...profile.map(([r, z], i) => [r + normal[i][0] * half, z + normal[i][1] * half]), ...profile.map(([r, z], i) => [r - normal[i][0] * half, z - normal[i][1] * half]).reverse()];
  const id = nameFor("straps.strap");
  put("straps", mid, svg, { name: id, shapes: [record(A.prism(F, polygon, -M.STRAP.half, M.STRAP.half, { name: id, owner: "straps" }))] });
}
{
  const ring = M.hubRing(KEYS.map((key) => key.deg));
  const top = M.HUB.z + M.HUB.h + ZB;
  const rivets = KEYS.map((key) => at(world([16 * Math.cos(key.theta), 16 * Math.sin(key.theta), M.HUB.z + M.HUB.h])));
  extruded("straps", ring, M.HUB.z, M.HUB.h, { tone: "hi" }, { name: "straps.hub", bevel: 0.6, bias: 0.5, extra: Ln(k.ring(0, 0, 7, top, P, 28) + k.ring(0, 0, 11.5, top, P, 36), { tone: "lo" }) + Dots(rivets, { size: 0.5 }) });
}

// headband and brow pad. A band that wraps what is inside it is cut where it turns
// edge-on to the viewer, so the near run and the far run each take their own depth;
// the cut lies on the band's own silhouette, so it adds no line.
const VIEW_LOCAL = [Math.cos(AZIMUTH * DEG - YAW), Math.sin(AZIMUTH * DEG - YAW)];
function runsOf(centre) {
  const outer = M.offset(centre, 1);
  const facing = centre.map((p, i) => (outer[i][0] - p[0]) * VIEW_LOCAL[0] + (outer[i][1] - p[1]) * VIEW_LOCAL[1] > 0);
  const runs = [];
  let from = 0;
  for (let i = 1; i < centre.length; i++) {
    if (facing[i] !== facing[i - 1] && i - from > 2 && centre.length - i > 2) {
      runs.push([from, i]);
      from = i;
    }
  }
  runs.push([from, centre.length - 1]);
  return runs;
}
const bandRun = (piece, centre, outBy, inBy, z, h, style, name, extraOf, seams = []) => {
  const outerAll = M.offset(centre, outBy);
  const innerAll = M.offset(centre, inBy);
  for (const [from, to] of runsOf(centre)) {
    const outer = outerAll.slice(from, to + 1);
    const inner = innerAll.slice(from, to + 1);
    const mid = centre[Math.floor((from + to) / 2)];
    extruded(piece, [...outer, ...inner.reverse()], z, h, style, { name, convex: false, seams, at: world([mid[0], mid[1], z + h / 2]), extra: extraOf ? extraOf(outer) : "" });
  }
};
bandRun("band", M.bandCentre(), M.BAND.thick / 2, -M.BAND.thick / 2, M.BAND.z, M.BAND.h, { tone: "mid" }, "band.band", null, [M.BAND.z + 3.5, M.BAND.z + M.BAND.h - 3.5]);
bandRun("brow", M.browCentre(), -M.BAND.thick / 2 - 0.02, -M.BAND.thick / 2 - M.BROW.thick, M.BROW.z, M.BROW.h, { tone: "hi" }, "brow.pad", (outer) => {
  // perforations, on the face that shows
  const dots = [];
  for (let i = 1; i < outer.length - 1; i += 2) {
    const a = outer[i - 1];
    const b = outer[i + 1];
    let normal = G.unit3(turn([b[1] - a[1], -(b[0] - a[0]), 0]));
    if (G.dot3(normal, turn([outer[i][0] - M.LOOP.cx, outer[i][1], 0])) < 0) normal = G.mul3(normal, -1);
    const facing = G.dot3(normal, V);
    if (facing < 0.1) continue;
    for (let row = 0; row < 6; row++) {
      const z = M.BROW.z + 5 + row * 5.6 + (i % 4 === 1 ? 0 : 2.8);
      dots.push([...at(world([outer[i][0], outer[i][1], z])), Math.min(1, (facing - 0.1) / 0.35)]);
    }
  }
  return Dots(dots, { size: 0.42, tone: "lo" });
});
const REAR = M.rearFor(FIT_CM);
const tailSvg = (ring) => {
  const paths = k.extrude(ring.map(plan), M.TAIL.z + ZB, M.TAIL.h, P, { convex: false });
  return `<g class="iso-solid"><path class="iso-fill" d="${paths.fill}"/>${paths.shades.map((d, shade) => `<path class="iso-shade" data-shade="${shade}" d="${d}"/>`).join("")}<path class="iso-top" d="${paths.top}"/><path class="iso-line iso-crease" data-tone="faint" d="${paths.crease}"/><path class="iso-line iso-edge" data-tone="mid" d="${paths.outline}"/></g>`;
};
{
  for (const side of [1, -1]) {
    const ring = M.tailRing(REAR, side);
    const w = ring.map(plan);
    const id = `ratchet.tail${side > 0 ? "L" : "R"}`;
    const mid = ring[11];
    R.put({ piece: "ratchet", ride: "ratchet", at: world([mid[0], mid[1], M.TAIL.z + M.TAIL.h / 2]), svg: tailSvg(ring), move: PIECES.ratchet.move, name: id, part: "ratchet", tail: side, shapes: [record(A.extruded(w, M.TAIL.z + ZB, M.TAIL.h, { name: id, owner: "ratchet" }))] });
    const y0 = side * (M.LOOP.half + M.BAND.thick / 2 + 2.4);
    const shows = G.dot3(turn([0, side, 0]), V) > 0.1;
    const pin = at(world([M.LOOP.cx, y0, M.BAND.z + 9]));
    const low = at(world([M.LOOP.cx, y0, M.TAIL.z + M.TAIL.h / 2]));
    extruded("ratchet", M.linkRing(side), M.LINK.z, M.LINK.h, { tone: "mid" }, { name: "ratchet.link", owner: "ratchet", bevel: 0.3, extra: shows ? Dots([pin, low], { size: 0.7, tone: "lo" }) + Dots([pin, low], { size: 0.3 }) : "" });
  }
  const box = M.housingRing(REAR);
  const [hx] = M.tailEnd(REAR, 1);
  const backX = hx - M.HOUSING.back;
  const top = M.HOUSING.z + M.HOUSING.h;
  const lid = [[hx + M.HOUSING.fore - 1.6, -24], [hx + M.HOUSING.fore - 1.6, 24], [backX + 1.6, 24], [backX + 1.6, -24]].map((p) => at(world([...p, top])));
  const hid = nameFor("ratchet.housing");
  const hw = box.map(plan);
  R.put({ piece: "ratchet", ride: "ratchet", at: world([hx - 3, 0, M.HOUSING.z + M.HOUSING.h / 2]), svg: S(k.extrude(hw, M.HOUSING.z + ZB, M.HOUSING.h, P, { bevel: 0.6 }), { tone: "mid" }) + Ln(pathOf(lid, true), { tone: "faint" }) + Dots([at(world([hx - 3, -26.5, top])), at(world([hx - 3, 26.5, top]))], { size: 0.45 }), move: PIECES.ratchet.move, name: hid, part: "ratchet", nape: 1, shapes: [record(A.extruded(hw, M.HOUSING.z + ZB, M.HOUSING.h, { name: hid, owner: "ratchet" }))] });
  // the knob: a POM wheel on the back of the housing, ribbed all round
  const F = G.frameAlong(world([backX, 0, M.KNOB.z]), turn([-1, 0, 0]));
  const RIBS = 22;
  const STEPS = 36;
  const ribs = (phase) => k.fadedSvg(G.ribsOf(F, 1.6, M.KNOB.long - 1.2, M.KNOB.r, RIBS, P, { phase, fade: [0.08, 0.5], seams: true }), { tone: "lo" });
  for (let i = 0; i < STEPS; i++) KNOB_FRAMES.push(ribs(((2 * Math.PI) / RIBS) * (i / STEPS)));
  const kid = nameFor("ratchet.knob");
  R.put({ piece: "ratchet", ride: "ratchet", at: world([backX - M.KNOB.long / 2, 0, M.KNOB.z]), bias: 0.3, svg: S(G.disc(0, M.KNOB.long, M.KNOB.r, F, P, { bevel: 0.5 }), { tone: "hi" }) + `<g data-ribs>${KNOB_FRAMES[0]}</g>`, move: PIECES.ratchet.move, name: kid, part: "ratchet", nape: 1, knob: 1, shapes: [record(A.disc(F, 0, M.KNOB.long, M.KNOB.r, { name: kid, owner: "ratchet" }))] });
}

// chin strap: two clips under the band, the webbing between them, one slide
{
  const y = M.chinY();
  for (const side of [1, -1]) {
    const ring = [[M.CHIN.x - 7, side * (y - 3)], [M.CHIN.x + 7, side * (y - 3)], [M.CHIN.x + 7, side * (y + 3)], [M.CHIN.x - 7, side * (y + 3)]];
    extruded("chin", ring, M.CHIN.clipZ, M.BAND.z - M.CHIN.clipZ, { tone: "mid" }, { name: "chin.clip", owner: "chin", bevel: 0.4 });
  }
  const F = { o: world([M.CHIN.x, 0, 0]), a: turn([1, 0, 0]), u: turn([0, 1, 0]), v: [0, 0, 1] };
  const section = (points, half) => {
    const flat = points.map(([, yy, z]) => [yy, z]);
    const normal = flat.map((p, i) => {
      const a = flat[Math.max(0, i - 1)];
      const b = flat[Math.min(flat.length - 1, i + 1)];
      const n = Math.hypot(b[0] - a[0], b[1] - a[1]);
      return [(b[1] - a[1]) / n, -(b[0] - a[0]) / n];
    });
    return [...flat.map(([a, b], i) => [a + normal[i][0] * half, b + normal[i][1] * half]), ...flat.map(([a, b], i) => [a - normal[i][0] * half, b - normal[i][1] * half]).reverse()];
  };
  // the webbing stops on each face of the slide, as a pipe stops on a collar
  for (const [from, to, n] of [[0, 0.5, 12], [0.74, Math.PI, 44]]) {
    const path = M.chinPath(from, to, n);
    const { svg, mid } = strapItem("chin", path, [1, 0, 0], M.CHIN.half, M.CHIN.thick / 2, "hi", "chin.strap");
    const id = nameFor("chin.strap");
    put("chin", mid, svg, { name: id, shapes: [record(A.prism(F, section(path, M.CHIN.thick / 2), -M.CHIN.half, M.CHIN.half, { name: id, owner: "chin" }))] });
  }
  const slide = M.chinPath(0.5, 0.74, 8);
  const made = strapItem("chin", slide, [1, 0, 0], M.CHIN.half + 2.4, M.CHIN.thick / 2 + 1.6, "mid", "chin.slide", { weave: 0 });
  put("chin", made.mid, made.svg, { name: "chin.slide", bias: 0.3, shapes: [record(A.prism(F, section(slide, M.CHIN.thick / 2 + 1.6), -M.CHIN.half - 2.4, M.CHIN.half + 2.4, { name: "chin.slide", owner: "chin" }))] });
}

}

// ---------------------------------------------------------------- settle, page
const FAST = process.argv.includes("--fast");
const sortStates = process.argv.includes("--quick") ? [0, 1, stateAt(0.5)] : [0, 1, ...STATES];
console.time("settle");
if (!FAST) A.settle(R, P, { states: sortStates, step: process.argv.includes("--fine") ? 0.25 : 0.5 });
console.timeEnd("settle");
if (process.argv.includes("--bossfront")) for (const item of items) if (item.name.startsWith("shell.boss")) item.key = items.find((other) => other.name === "shell.body").key + 1;
items.sort((a, b) => a.key - b.key);
const groups = items.map((item, index) => `<g class="it" data-piece="${item.piece}" data-k="${item.key.toFixed(3)}" data-lift="${item.move[2]}"${item.nape ? " data-nape" : ""}${item.knob ? " data-knob" : ""}${item.tail ? ` data-tail="${item.tail}"` : ""} data-i="${index}">${item.svg}</g>`);

const LABEL = `AVES TITAN AV-841R NV full-brim hard hat on a low stand, drawn so that it comes apart upward into its assemblies: the HDPE shell with its crown ridge and wide brim, the ${POINTS} hanger keys, the nylon crown straps on their hub, the headband with its height tabs, the brow pad, the ratchet housing with its knob, and the chin strap.`;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" class="iso-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${LABEL}">${back.join("")}<g class="hx-parts">${groups.join("")}</g></svg>`;
const unitOf = (vector) => {
  const o = at([0, 0, 0]);
  const p = at(vector);
  return [p[0] - o[0], p[1] - o[1]];
};
const DATA = {
  P,
  V,
  EX: unitOf([1, 0, 0]),
  EY: unitOf([0, 1, 0]),
  EZ: unitOf([0, 0, 1]),
  yaw: YAW,
  zb: ZB,
  order: ORDER,
  pieces: Object.fromEntries(Object.entries(PIECES).map(([id, piece]) => [id, { name: piece.name, say: piece.say }])),
  fit: { min: M.FIT_MIN, max: M.FIT_MAX, rest: FIT_CM },
  knob: { ribs: 22, perCm: (1.5 * 2 * Math.PI) / (M.FIT_MAX - M.FIT_MIN), frames: KNOB_FRAMES },
};
const PARTS = ORDER.map((id, index) => `<button type="button" class="hx-part" data-part="${id}"><span class="hx-num">${String(index + 1).padStart(2, "0")}</span>${PIECES[id].name}</button>`).join("");
const corners = `<div class="iso-plate-corners" aria-hidden="true"><span class="iso-plate-corner" data-corner="fig">Fig 1</span><span class="iso-plate-corner" data-corner="title">AVES TITAN AV-841R NV</span><span class="iso-plate-corner" data-corner="hint">Drag up to take it apart</span><span class="iso-plate-corner" data-corner="readout" data-readout>assembled</span></div>`;
const controls = `<div class="hx-controls"><label>Apart<input type="range" min="0" max="1000" value="0" data-apart aria-label="Take the helmet apart"></label><label>Fit<input type="range" min="${M.FIT_MIN}" max="${M.FIT_MAX}" step="0.1" value="${FIT_CM}" data-fit aria-label="Headband size in centimetres"></label><span class="hx-live" aria-live="polite" data-live></span></div>`;
const stage = `<div class="hx-stage" tabindex="0" role="slider" aria-label="AVES TITAN AV-841R NV, exploded view. Up and down arrows take the helmet apart and put it back, left and right arrows turn the ratchet knob, N steps through the parts, Escape closes it." aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">${svg}</div>`;
const caption = `The AVES TITAN AV-841R NV is a low-profile, non-vented full-brim hard hat with an HDPE outer shell and 360° protection. Inside it a ${POINTS}-point ratchet suspension hangs from hanger keys: nylon crown straps 2 cm wide and 4 mm thick, a headband with vertical height adjustment at two front and two rear points, a detachable perforated PU-foam brow pad held by hook-and-loop, and a POM ratchet knob that fits the headband to heads of 52–66 cm. ANSI/ISEA Z89.1-2014 Type I, Class E & G; EN 397.`;
const body = `<figure class="iso-figure hx"><div class="iso-plate">${corners}${stage}${controls}</div><figcaption class="iso-legend"><span class="hx-parts-list">${PARTS}</span><span class="iso-caption">${caption}</span></figcaption></figure>`;
const CSS = readFileSync(join(HERE, "page.css"), "utf8");
const MODEL_TEXT = readFileSync(join(HERE, "model.mjs"), "utf8").replace(/^export /gm, "");
const LIVE = readFileSync(join(HERE, "live.js"), "utf8").replace("__MODEL__", () => MODEL_TEXT).replace("__SHARE__", () => shareOf.toString()).replace("__DATA__", () => JSON.stringify(DATA));
const page = k.pageHtml({ title: "AVES TITAN AV-841R NV", theme: THEME, body: `<style>${CSS}</style>${body}`, script: kitScript() + LIVE, width: 720 });
const name = `av-841r${POINTS === 6 ? "" : `-${POINTS}pt`}${FIT_CM === M.FIT_REST ? "" : `-fit${FIT_CM}`}${THEME === "light" ? "-light" : ""}.html`;
writeFileSync(join(HERE, name), page);
console.log("wrote", name, `${(page.length / 1024).toFixed(0)} KB`, `${items.length} items`);
if (process.argv.includes("--pairs")) for (const pair of R.settled.overlaps.pairs.filter((pair) => pair.state === 0)) console.log(R.settled.items[pair.a]?.name, R.settled.items[pair.b]?.name, pair.front.map((f) => f.area.toFixed(1)).join(" / "));
A.auditOrExit(R, P, { frames: STATES });
if (process.argv.includes("--probe")) {
  const shell = items.find((item) => item.name === "shell.body");
  for (const local of [[150, 0, 10.5], [0, 135, 10.5], [-150, 0, 10.5], [0, -135, 10.5], [100, 90, 10.5], [133, 0, 30], [0, 112, 30], [60, 60, 120], [0, 0, 160]]) {
    const p = world(local);
    const best = shell.shapes.map((shape) => [A.sdf(shape, p), shape.name]).sort((a, b) => a[0] - b[0])[0];
    console.log(local.join(","), best[0].toFixed(2), best[1]);
  }
}
