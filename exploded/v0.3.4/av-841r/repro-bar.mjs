// Reproduces the phone's toolbar collapsing mid-pin: load at one height, scroll to each stage, change the height
// without a reload (as a touch device, where ScrollTrigger skips the refresh), and measure what is under the stage.
// usage: node repro-bar.mjs <index.html> <fromHeight> <toHeight> <prefix> [width]
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const HERE = dirname(fileURLToPath(import.meta.url));
const [page, h0, h1, prefix, width = "390"] = process.argv.slice(2);
const W = Number(width);
const touch = W < 600;
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const prof = mkdtempSync(join(tmpdir(), "hx-drive-"));
const port = 9400 + Math.floor(Math.random() * 400);
const chrome = spawn(CHROME, ["--headless=new", "--hide-scrollbars", `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, "--no-first-run", "about:blank"], { stdio: "ignore" });
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
  await send("Page.enable", {}, S);
  const size = (h) => send("Emulation.setDeviceMetricsOverride", { width: W, height: Number(h), deviceScaleFactor: touch ? 2 : 1, mobile: touch }, S);
  await size(h0);
  if (touch) await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 }, S);
  await send("Page.navigate", { url: `file://${resolve(page)}` }, S);
  const ev = async (e) => (await send("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true }, S)).result.value;
  for (let i = 0; i < 100; i++) {
    await sleep(150);
    if (await ev('document.documentElement.dataset.ready === "1"')) break;
  }
  await sleep(800);
  console.log("touch device:", await ev("ScrollTrigger.isTouch"), "· load height", h0, "→", h1);
  const stages = JSON.parse(await ev("JSON.stringify(window.HX_PAGE.stages)"));
  const hold = await ev("window.HX_PAGE.hold || 1");
  for (const [index, stage] of stages.entries()) {
    await size(h0);
    await sleep(500);
    await ev(`(() => { const t = ScrollTrigger.getAll()[0]; window.scrollTo(0, t.start + (t.end - t.start) * ${stage.at * hold}); })()`);
    await sleep(900);
    await size(h1);
    await sleep(700);
    const m = JSON.parse(await ev(`JSON.stringify((() => { const r = document.querySelector(".hx").getBoundingClientRect(); const under = document.elementFromPoint(innerWidth / 2, innerHeight - 4); return { inner: innerHeight, stageBottom: Math.round(r.bottom), uncovered: Math.max(0, Math.round(innerHeight - r.bottom)), under: under ? (under.closest(".hx") ? "the pinned stage" : under.tagName.toLowerCase() + "." + under.className) : "nothing" }; })())`));
    console.log(stage.id.padEnd(11), JSON.stringify(m));
    if (process.env.HX_DEBUG && index === 2) console.log(await ev(`JSON.stringify((() => { const e = document.querySelector(".hx"); const p = document.createElement("div"); p.style.cssText = "position:fixed;top:0;height:100lvh;width:1px"; document.body.appendChild(p); const lvh = p.offsetHeight; p.style.height = "100svh"; const svh = p.offsetHeight; p.style.height = "100vh"; const vh = p.offsetHeight; p.remove(); return { inline: e.getAttribute("style"), computed: getComputedStyle(e).height, lvh, svh, vh, inner: innerHeight, spacer: e.parentElement.getAttribute("style") }; })())`));
    const H1 = Number(h1);
    const shot = await send("Page.captureScreenshot", { format: "png", clip: { x: 0, y: (await ev("scrollY")) + H1 - 120, width: W, height: 120, scale: 1 } }, S);
    writeFileSync(join(HERE, "shots", `${prefix}-${String(index + 1).padStart(2, "0")}-${stage.id}.png`), Buffer.from(shot.data, "base64"));
  }
} finally {
  try {
    ws && ws.close();
  } catch {}
  chrome.kill("SIGTERM");
  await sleep(300);
  rmSync(prof, { recursive: true, force: true });
}
