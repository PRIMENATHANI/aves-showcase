// Free-form surfaces drawn in the kit's own picture: four side tones and a top
// tone from the kit's light (G.lightOf, the kit's band thresholds), a paper fill,
// creases at sharp edges and one silhouette outline. The kit's lathe turns round
// parts and its prisms stand on the floor; a helmet shell and a webbing strap are
// neither, so this helper meshes them and emits the same SolidPaths the kit does.
// Nothing here restyles the kit: the markup uses the kit's classes and tokens.
import * as k from "/Users/macintosh/.claude/skills/anatomy/kit/iso-kit.mjs";
import * as G from "/Users/macintosh/.claude/skills/anatomy/kit/lathe.mjs";

const BANDS = [0, 0.2, 0.42, 0.62];
const Q = 20;
const snap = (value) => Math.round(value * Q) / Q;
const keyOf = (p) => `${Math.round(p[0] * Q)},${Math.round(p[1] * Q)}`;
const key3 = (p) => `${Math.round(p[0] * 500)},${Math.round(p[1] * 500)},${Math.round(p[2] * 500)}`;
const fmt = (value) => {
  const text = value.toFixed(2);
  return text.replace(/\.?0+$/, "");
};
const pathOf = (points, closed = false) => (points.length ? points.map(([x, y], at) => `${at ? "L" : "M"}${fmt(x)} ${fmt(y)}`).join("") + (closed ? "Z" : "") : "");

const areaOf = (points) => {
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    const [ax, ay] = points[i];
    const [bx, by] = points[(i + 1) % points.length];
    sum += ax * by - bx * ay;
  }
  return sum / 2;
};

function tidy(points, closed) {
  const out = [];
  const n = points.length;
  for (let i = 0; i < n; i++) {
    if (!closed && (i === 0 || i === n - 1)) {
      out.push(points[i]);
      continue;
    }
    const a = points[(i - 1 + n) % n];
    const b = points[i];
    const c = points[(i + 1) % n];
    const cross = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
    const dot = (b[0] - a[0]) * (c[0] - b[0]) + (b[1] - a[1]) * (c[1] - b[1]);
    if (Math.abs(cross) < 0.004 && dot > 0) continue;
    out.push(b);
  }
  return out;
}

// Union of same-wound polygons that share edges: interior edges cancel, the rest
// chain into the region's boundary loops, so a tone is one polygon per region.
export function regions(polys) {
  const edges = new Map();
  for (const raw of polys) {
    const points = raw.filter((p, i) => p.id !== raw[(i + 1) % raw.length].id);
    if (points.length < 3) continue;
    for (let i = 0; i < points.length; i++) {
      const a = points[i];
      const b = points[(i + 1) % points.length];
      const back = `${b.id}>${a.id}`;
      if (edges.has(back)) edges.delete(back);
      else edges.set(`${a.id}>${b.id}`, { a, b, ka: a.id, kb: b.id });
    }
  }
  const from = new Map();
  for (const edge of edges.values()) {
    if (!from.has(edge.ka)) from.set(edge.ka, []);
    from.get(edge.ka).push(edge);
  }
  const out = [];
  for (const start of edges.values()) {
    if (start.used) continue;
    const loop = [];
    let edge = start;
    while (edge && !edge.used) {
      edge.used = true;
      loop.push([edge.a.x, edge.a.y]);
      edge = (from.get(edge.kb) || []).find((candidate) => !candidate.used);
    }
    const clean = tidy(loop, true);
    if (clean.length >= 3 && Math.abs(areaOf(clean)) > 0.002) out.push(pathOf(clean, true));
  }
  return out.join("");
}

// Chains loose screen segments into polylines.
export function chains(segments) {
  const ends = new Map();
  const list = [];
  for (const [a, b] of segments) {
    const pa = [snap(a[0]), snap(a[1])];
    const pb = [snap(b[0]), snap(b[1])];
    const ka = keyOf(pa);
    const kb = keyOf(pb);
    if (ka === kb) continue;
    const entry = { pa, pb, ka, kb, used: false };
    list.push(entry);
    for (const key of [ka, kb]) {
      if (!ends.has(key)) ends.set(key, []);
      ends.get(key).push(entry);
    }
  }
  const lines = [];
  const walk = (entry, startKey) => {
    const points = [];
    let key = startKey;
    let current = entry;
    while (current && !current.used) {
      current.used = true;
      const forward = current.ka === key;
      if (!points.length) points.push(forward ? current.pa : current.pb);
      points.push(forward ? current.pb : current.pa);
      key = forward ? current.kb : current.ka;
      current = (ends.get(key) || []).find((candidate) => !candidate.used);
    }
    return points;
  };
  for (const [key, entries] of ends) if (entries.length === 1 && !entries[0].used) lines.push(walk(entries[0], key));
  for (const entry of list) if (!entry.used) lines.push(walk(entry, entry.ka));
  return lines;
}

let loose = 0;
const edgeOf = (a, b) => {
  // the mesh edge both points lie on, if any
  const ea = a.on || [a.id];
  const eb = b.on || [b.id];
  if (ea.length === 1 && eb.length === 1) return ea[0] < eb[0] ? [ea[0], eb[0]] : [eb[0], ea[0]];
  if (ea.length === 2 && eb.length === 1) return ea.includes(eb[0]) ? ea : null;
  if (ea.length === 1 && eb.length === 2) return eb.includes(ea[0]) ? eb : null;
  return ea[0] === eb[0] && ea[1] === eb[1] ? ea : null;
};
const mix = (a, b, t, tag) => {
  const on = a.free || b.free ? null : edgeOf(a, b);
  const p = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, f: a.f + (b.f - a.f) * t, l: a.l + (b.l - a.l) * t, d: a.d + (b.d - a.d) * t };
  if (on) Object.assign(p, { on, id: `${on[0]}|${on[1]}|${tag}` });
  else Object.assign(p, { free: true, id: `free${loose++}` });
  return p;
};

function clip(poly, field, level, above, cut) {
  const out = [];
  const made = [];
  const n = poly.length;
  for (let i = 0; i < n; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % n];
    const va = a[field] - level;
    const vb = b[field] - level;
    const ina = above ? va >= 0 : va < 0;
    const inb = above ? vb >= 0 : vb < 0;
    if (ina) out.push(a);
    if (ina !== inb) {
      const p = mix(a, b, va / (va - vb), `${field}${level}`);
      out.push(p);
      made.push(p);
    }
  }
  if (cut && made.length === 2) cut.push(made);
  return out;
}

// patches: [{ rows: Point3[][], flip?: boolean }] — a grid of points; u × v points
// outward (or pass flip). Returns the kit's SolidPaths plus a far layer and a
// visibility probe for lines laid on the surface.
export function surface(patches, P, { res = 3, tolerance = 1.6, sharp = 0.9, extraOccluders = [], strict = false } = {}) {
  const V = G.viewOf(P);
  const L = G.lightOf(P);
  const tris = [];
  const verts = [];
  for (const [index, patch] of patches.entries()) {
    const { rows } = patch;
    const sign = patch.flip ? -1 : 1;
    const normals = new Map();
    const grid = rows.map((row) => row.map((p) => ({ p, key: key3(p), id: key3(p) })));
    const local = [];
    for (let i = 0; i + 1 < grid.length; i++) {
      for (let j = 0; j + 1 < grid[i].length; j++) {
        const quad = [grid[i][j], grid[i + 1][j], grid[i + 1][j + 1], grid[i][j + 1]];
        for (const [a, b, c] of [[quad[0], quad[1], quad[2]], [quad[0], quad[2], quad[3]]]) {
          if (a.key === b.key || b.key === c.key || a.key === c.key) continue;
          const raw = G.mul3(G.cross3(G.sub3(b.p, a.p), G.sub3(c.p, a.p)), sign);
          if (G.len3(raw) < 1e-9) continue;
          for (const vertex of [a, b, c]) normals.set(vertex.key, G.add3(normals.get(vertex.key) || [0, 0, 0], raw));
          local.push(sign < 0 ? { a, b: c, c: b, fn: G.unit3(raw), patch: index } : { a, b, c, fn: G.unit3(raw), patch: index });
        }
      }
    }
    for (const row of grid) {
      for (const vertex of row) {
        const n = G.unit3(normals.get(vertex.key) || [0, 0, 1]);
        const [x, y] = k.iso(vertex.p, P);
        Object.assign(vertex, { x, y, f: G.dot3(n, V), l: G.dot3(n, L), d: G.dot3(vertex.p, V) });
        verts.push(vertex);
      }
    }
    tris.push(...local);
  }

  // depth buffer of everything, nearest surface per cell
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const occluders = extraOccluders.map((tri) => tri.map((p) => ({ x: k.iso(p, P)[0], y: k.iso(p, P)[1], d: G.dot3(p, V) })));
  for (const v of [...verts, ...occluders.flat()]) {
    if (v.x < minX) minX = v.x;
    if (v.y < minY) minY = v.y;
    if (v.x > maxX) maxX = v.x;
    if (v.y > maxY) maxY = v.y;
  }
  const cols = Math.ceil((maxX - minX) * res) + 3;
  const height = Math.ceil((maxY - minY) * res) + 3;
  const buffer = new Float32Array(cols * height).fill(-Infinity);
  const raster = (a, b, c) => {
    const ax = (a.x - minX) * res + 1;
    const ay = (a.y - minY) * res + 1;
    const bx = (b.x - minX) * res + 1;
    const by = (b.y - minY) * res + 1;
    const cx = (c.x - minX) * res + 1;
    const cy = (c.y - minY) * res + 1;
    const det = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
    if (Math.abs(det) < 1e-9) return;
    const x0 = Math.max(0, Math.floor(Math.min(ax, bx, cx)));
    const x1 = Math.min(cols - 1, Math.ceil(Math.max(ax, bx, cx)));
    const y0 = Math.max(0, Math.floor(Math.min(ay, by, cy)));
    const y1 = Math.min(height - 1, Math.ceil(Math.max(ay, by, cy)));
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const w1 = ((x - ax) * (cy - ay) - (y - ay) * (cx - ax)) / det;
        const w2 = ((bx - ax) * (y - ay) - (by - ay) * (x - ax)) / det;
        const w0 = 1 - w1 - w2;
        if (w0 < -0.001 || w1 < -0.001 || w2 < -0.001) continue;
        const depth = w0 * a.d + w1 * b.d + w2 * c.d;
        const at = y * cols + x;
        if (depth > buffer[at]) buffer[at] = depth;
      }
    }
  };
  for (const tri of tris) raster(tri.a, tri.b, tri.c);
  for (const [a, b, c] of occluders) raster(a, b, c);
  const hidden = (x, y, d, slack = tolerance) => {
    const gx = Math.round((x - minX) * res + 1);
    const gy = Math.round((y - minY) * res + 1);
    let least = Infinity;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const cx = gx + dx;
        const cy = gy + dy;
        if (cx < 0 || cy < 0 || cx >= cols || cy >= height) return false;
        const value = buffer[cy * cols + cx];
        if (value < least) least = value;
      }
    }
    return least > d + slack;
  };

  const layers = [Array.from({ length: 5 }, () => []), Array.from({ length: 5 }, () => [])];
  const everything = [];
  const edge = [];
  for (const tri of tris) {
    const corners = [tri.a, tri.b, tri.c];
    const centre = { x: (tri.a.x + tri.b.x + tri.c.x) / 3, y: (tri.a.y + tri.b.y + tri.c.y) / 3, d: (tri.a.d + tri.b.d + tri.c.d) / 3 };
    const lost = [...corners, centre].filter((v) => hidden(v.x, v.y, v.d)).length;
    tri.lost = lost;
    if (lost === 4 || (strict && lost > 0)) continue; // strict: what another body hides is cut away, not painted behind
    const cut = [];
    const front = clip(corners, "f", 0, true, cut);
    for (const [a, b] of cut) if (!hidden((a.x + b.x) / 2, (a.y + b.y) / 2, (a.d + b.d) / 2)) edge.push([[a.x, a.y], [b.x, b.y]]);
    if (front.length < 3) continue;
    const layer = layers[lost ? 0 : 1];
    const turn = Math.sign((tri.b.x - tri.a.x) * (tri.c.y - tri.a.y) - (tri.b.y - tri.a.y) * (tri.c.x - tri.a.x)) || 1;
    front.turn = turn;
    everything.push(front);
    for (let tone = 0; tone < 5; tone++) {
      let piece = front;
      if (tone > 0) piece = clip(piece, "l", BANDS[tone - 1], true);
      if (tone < 4 && piece.length >= 3) piece = clip(piece, "l", BANDS[tone], false);
      if (piece.length >= 3) {
        piece.turn = turn;
        layer[tone].push(piece);
      }
    }
  }

  // sharp and open mesh edges: a crease where both faces show, an edge where one does
  const shared = new Map();
  for (const tri of tris) {
    for (const [a, b] of [[tri.a, tri.b], [tri.b, tri.c], [tri.c, tri.a]]) {
      const id = a.key < b.key ? `${a.key}|${b.key}` : `${b.key}|${a.key}`;
      if (!shared.has(id)) shared.set(id, { a, b, tris: [] });
      shared.get(id).tris.push(tri);
    }
  }
  const crease = [];
  for (const { a, b, tris: sides } of shared.values()) {
    if (sides.length > 2) continue;
    const facing = sides.map((tri) => G.dot3(tri.fn, V) > 1e-6);
    let kind = "";
    if (sides.length === 1) kind = facing[0] ? "edge" : "";
    else if (G.dot3(sides[0].fn, sides[1].fn) < sharp) kind = facing[0] && facing[1] ? "crease" : facing[0] !== facing[1] ? "edge" : "";
    if (!kind) continue;
    if (hidden((a.x + b.x) / 2, (a.y + b.y) / 2, (a.d + b.d) / 2)) continue;
    (kind === "edge" ? edge : crease).push([[a.x, a.y], [b.x, b.y]]);
  }

  const lineOf = (segments) => chains(segments).map((points) => pathOf(tidy(points, false))).join("");
  const visibleRuns = (points3, { lift = 0.6, slack = tolerance } = {}) => {
    const runs = [];
    let run = [];
    for (const p of points3) {
      const [x, y] = k.iso(p, P);
      const seen = !hidden(x, y, G.dot3(p, V) + lift, slack);
      if (seen) run.push([x, y]);
      else if (run.length) {
        runs.push(run);
        run = [];
      }
    }
    if (run.length) runs.push(run);
    return runs.filter((points) => points.length > 3);
  };
  return {
    fill: regions(everything),
    shades: [0, 1, 2, 3].map((tone) => regions(layers[1][tone])),
    top: regions(layers[1][4]),
    farShades: [0, 1, 2, 3].map((tone) => regions(layers[0][tone])),
    farTop: regions(layers[0][4]),
    crease: lineOf(crease),
    outline: lineOf(edge),
    seamless: true,
    visibleRuns,
    hiddenAt: (p, lift = 0.6) => {
      const [x, y] = k.iso(p, P);
      return hidden(x, y, G.dot3(p, V) + lift);
    },
    count: tris.length,
  };
}

// The kit's solidSvg, with the far layer painted first.
export function surfaceSvg(paths, { tone = "hi", crease = "faint", inner = "", className = "" } = {}) {
  const parts = [`<path class="iso-fill" d="${paths.fill}"/>`];
  const layer = (shades, top) => {
    shades.forEach((d, shade) => d && parts.push(`<path class="iso-shade" data-shade="${shade}" d="${d}"/>`));
    if (top) parts.push(`<path class="iso-top" d="${top}"/>`);
  };
  layer(paths.farShades || [], paths.farTop || "");
  layer(paths.shades, paths.top);
  if (crease !== "none" && paths.crease) parts.push(`<path class="iso-line iso-crease" data-tone="${crease}" d="${paths.crease}"/>`);
  if (inner) parts.push(inner);
  parts.push(`<path class="iso-line iso-edge" data-tone="${tone}" d="${paths.outline}"/>`);
  return `<g class="iso-solid${className ? ` ${className}` : ""}" data-seamless="">${parts.join("")}</g>`;
}

// A flat strap swept along a 3D path: width along `across` (a vector or a function
// of the index), thickness along tangent × across. Four faces and two end caps.
export function strapPatches(points, across, halfWidth, halfThick, { caps = [true, true], columns = 1 } = {}) {
  const n = points.length;
  const frames = points.map((p, i) => {
    const t = G.unit3(G.sub3(points[Math.min(n - 1, i + 1)], points[Math.max(0, i - 1)]));
    const raw = typeof across === "function" ? across(i) : across;
    const w = G.unit3(G.sub3(raw, G.mul3(t, G.dot3(raw, t))));
    return { p, t, w, n: G.cross3(t, w) };
  });
  const corner = (frame, a, b) => G.add3(frame.p, G.add3(G.mul3(frame.w, a * halfWidth), G.mul3(frame.n, b * halfThick)));
  const span = (from, to) => Array.from({ length: columns + 1 }, (_, j) => G.lerp3(from, to, j / columns));
  const face = (a0, b0, a1, b1) => ({ rows: frames.map((frame) => span(corner(frame, a0, b0), corner(frame, a1, b1))) });
  const patches = [face(1, 1, -1, 1), face(-1, -1, 1, -1), face(1, -1, 1, 1), face(-1, 1, -1, -1)];
  const wanted = [frames[0].n, G.mul3(frames[0].n, -1), frames[0].w, G.mul3(frames[0].w, -1)];
  patches.forEach((patch, index) => {
    const [a, b] = [patch.rows[0], patch.rows[1]];
    const normal = G.cross3(G.sub3(b[0], a[0]), G.sub3(a[1], a[0]));
    patch.flip = G.dot3(normal, wanted[index]) < 0;
  });
  [0, n - 1].forEach((at, index) => {
    if (!caps[index]) return;
    const frame = frames[at];
    const rows = [[corner(frame, -1, -1), corner(frame, 1, -1)], [corner(frame, -1, 1), corner(frame, 1, 1)]];
    const normal = G.cross3(G.sub3(rows[1][0], rows[0][0]), G.sub3(rows[0][1], rows[0][0]));
    const out = G.mul3(frame.t, index ? 1 : -1);
    patches.push({ rows, flip: G.dot3(normal, out) < 0 });
  });
  return { patches, frames };
}
