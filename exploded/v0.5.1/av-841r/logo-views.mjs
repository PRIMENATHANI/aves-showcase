// The four LOGO PLACEMENT views from the ADS's own vector drawings (assets/ads-vectors/logo-*.svg, exported from the ADS
// with VectorCraft) -> assets/ads-vectors/views.json, which build.mjs inlines. Cleans each drawing (the pale blue "FT"
// watermarks with their "TM" glyphs and clip paths go; the helmet, its panels, bosses and the numbered grey area stay),
// marks what recolours with the swatch, and measures the helmet's true box in Chrome so all four are set at one scale
// on one baseline. usage: node logo-views.mjs
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const HERE = dirname(fileURLToPath(import.meta.url));
const DIR = join(HERE, "assets", "ads-vectors");
const NAMES = ["front", "back", "left", "right"];
const once = (text, pattern, what) => {
  if (!pattern.test(text)) throw new Error(`expected ${what}`);
};
const clean = (name) => {
  let svg = readFileSync(join(DIR, `logo-${name}.svg`), "utf8");
  // each watermark is one <g opacity="0.12"> holding a clipped group with two blue paths
  const mark = /\s*<g opacity="0\.12">\s*<g clip-path="url\(#clip-path-\d+\)">\s*<path [^>]*fill="#0075c9"[^>]*\/>\s*<g>\s*<path [^>]*fill="#0075c9"[^>]*\/>\s*<\/g>\s*<\/g>\s*<\/g>/g;
  const marks = (svg.match(mark) || []).length;
  svg = svg.replace(mark, "");
  if (!marks || /#0075c9|clip-path=/.test(svg)) throw new Error(`${name}: watermark shapes left behind`);
  const defs = [...svg.matchAll(/<linearGradient[\s\S]*?<\/linearGradient>/g)].map((hit) => hit[0]).join("");
  once(svg, /<g id="Selection">([\s\S]*)<\/g>\s*<\/svg>/, `${name}: the Selection group`);
  let body = svg.match(/<g id="Selection">([\s\S]*)<\/g>\s*<\/svg>/)[1];
  // ids are made unique per view: the four drawings share one page
  const tag = `lv-${name}-`;
  const ids = (text) => text.replace(/id="linear-gradient-(\d+)"/g, `id="${tag}$1"`).replace(/url\(#linear-gradient-(\d+)\)/g, `url(#${tag}$1)`);
  // the shell's white takes the swatch colour; each grey gradient gets a shell-coloured copy of its own shape under it and
  // multiplies over that, so in white the drawing is the ADS's own and in a colour the gradients read as shading
  body = body.replace(/<path d="([^"]+)" fill="url\(#linear-gradient-(\d+)\)"( opacity="[\d.]+")?\/>/g, (_, d, n, opacity = "") => `<path class="lv-shell" d="${d}"/><path class="lv-shade" d="${d}" fill="url(#linear-gradient-${n})"${opacity}/>`);
  body = body.replace(/ fill="#ffffff"/g, ' class="lv-shell"').replace(/ fill="#e1e1e1"/g, ' class="lv-area" fill="#e1e1e1"');
  const size = svg.match(/viewBox="([^"]+)"/)[1];
  return { name, marks, size, defs: ids(defs), body: ids(body).replace(/\n\s+/g, "") };
};
const views = NAMES.map(clean);
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const prof = mkdtempSync(join(tmpdir(), "hx-drive-"));
const port = 9400 + Math.floor(Math.random() * 400);
const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, "--no-first-run", "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws;
let id = 0;
const pending = new Map();
const send = (method, params = {}, sessionId) => new Promise((res, rej) => {
  const i = ++id;
  pending.set(i, { res, rej });
  ws.send(JSON.stringify({ id: i, method, params, sessionId }));
});
try {
  let ver;
  for (let i = 0; i < 50; i++) {
    try {
      ver = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();
      break;
    } catch {
      await sleep(200);
    }
  }
  ws = new WebSocket(ver.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener("open", r));
  ws.addEventListener("message", (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) {
      const p = pending.get(m.id);
      pending.delete(m.id);
      m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result);
    }
  });
  const { targetId } = await send("Target.createTarget", { url: "about:blank" });
  const { sessionId: S } = await send("Target.attachToTarget", { targetId, flatten: true });
  await send("Runtime.enable", {}, S);
  const page = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="400">${views.map((view) => `<g id="v-${view.name}">${view.body}</g>`).join("")}</svg>`;
  const expression = `document.body.innerHTML = ${JSON.stringify(page)}; JSON.stringify(${JSON.stringify(NAMES)}.map((n) => { const b = document.getElementById("v-" + n).getBBox(); const a = document.querySelector("#v-" + n + " .lv-area").getBBox(); return [b.x, b.y, b.width, b.height, a.x + a.width / 2]; }))`;
  const boxes = JSON.parse((await send("Runtime.evaluate", { expression, returnByValue: true }, S)).result.value);
  // one frame for all four: the widest and tallest helmet plus the stroke, each helmet centred sideways with its lowest point on the frame's floor
  const PAD = 1.5;
  const W = Math.max(...boxes.map((b) => b[2])) + PAD * 2;
  const H = Math.max(...boxes.map((b) => b[3])) + PAD * 2;
  const out = { width: Math.round(W * 100) / 100, height: Math.round(H * 100) / 100, views: {} };
  views.forEach((view, index) => {
    const [x, y, w, h] = boxes[index];
    out.views[view.name] = { viewBox: [x + w / 2 - W / 2, y + h + PAD - H, W, H].map((value) => Math.round(value * 100) / 100), helmet: [x, y, w, h].map((value) => Math.round(value * 100) / 100), defs: view.defs, body: view.body };
    console.log(view.name.padEnd(6), `${view.marks} watermarks removed`, "· export box", view.size, "· helmet box", out.views[view.name].helmet.join(" "));
  });
  writeFileSync(join(DIR, "views.json"), JSON.stringify(out));
  console.log("wrote views.json", `${out.width} x ${out.height}`);
} finally {
  try {
    ws && ws.close();
  } catch {}
  chrome.kill("SIGTERM");
  await sleep(300);
  rmSync(prof, { recursive: true, force: true });
}
