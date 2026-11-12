// Drives index.html with real wheel events over CDP and captures every stage and the text sections.
// usage: node drive-page.mjs <width> <height> <prefix> [query] [--reduced]
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const HERE = dirname(fileURLToPath(import.meta.url));
const [width, height, prefix, query = ""] = process.argv.slice(2);
const reduced = process.argv.includes("--reduced");
const W = Number(width);
const Hh = Number(height);
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const prof = mkdtempSync(join(tmpdir(), "hx-drive-"));
const port = 9400 + Math.floor(Math.random() * 400);
const chrome = spawn(CHROME, ["--headless=new", "--hide-scrollbars", `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, "--no-first-run", "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws;
let id = 0;
const pending = new Map();
const msgs = [];
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
    } else if (m.method === "Runtime.exceptionThrown") msgs.push("exception: " + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text));
    else if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") msgs.push("console.error: " + m.params.args.map((a) => a.value ?? a.description ?? "").join(" "));
  });
  const { targetId } = await send("Target.createTarget", { url: "about:blank" });
  const { sessionId: S } = await send("Target.attachToTarget", { targetId, flatten: true });
  await send("Runtime.enable", {}, S);
  await send("Page.enable", {}, S);
  await send("Emulation.setDeviceMetricsOverride", { width: W, height: Hh, deviceScaleFactor: W < 600 ? 2 : 1, mobile: false }, S);
  if (reduced) await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] }, S);
  await send("Page.navigate", { url: `file://${join(HERE, "index.html")}${query}` }, S);
  const ev = async (e) => (await send("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true }, S)).result.value;
  for (let i = 0; i < 100; i++) {
    await sleep(150);
    if (await ev('document.documentElement.dataset.ready === "1"')) break;
  }
  await sleep(900);
  const shot = async (n) => writeFileSync(join(HERE, "shots", `${prefix}-${n}.png`), Buffer.from((await send("Page.captureScreenshot", { format: "png" }, S)).data, "base64"));
  const wheel = async (dy) => {
    await send("Input.dispatchMouseEvent", { type: "mouseWheel", x: Math.round(W / 2), y: Math.round(Hh / 2), deltaX: 0, deltaY: dy }, S);
    await sleep(35);
  };
  const state = async (tag) => console.log(tag.padEnd(18), await ev(`JSON.stringify({ y: Math.round(scrollY), max: document.documentElement.scrollHeight - innerHeight, read: document.querySelector("[data-readout]").textContent, feat: [...document.querySelectorAll(".hx-feat[data-on] b")].map((b) => b.textContent).join(" + "), nav: (document.querySelector(".hx-nav [data-on]") || {}).textContent || "", sideways: document.documentElement.scrollWidth > innerWidth })`));
  const pin = JSON.parse(await ev("JSON.stringify((() => { const t = ScrollTrigger.getAll()[0]; return { start: t.start, end: t.end }; })())"));
  const stages = JSON.parse(await ev("JSON.stringify(window.HX_PAGE.stages)"));
  await shot("00-top");
  await state("top");
  // wheel down to each stage in turn; the page's own snap settles it
  for (const [index, stage] of stages.entries()) {
    const target = pin.start + (pin.end - pin.start) * stage.at;
    for (let i = 0; i < 600; i++) {
      const y = await ev("scrollY");
      if (y >= target - 30) break;
      await wheel(Math.min(100, Math.max(20, (target - y) / 3)));
      await sleep(60);
    }
    await sleep(reduced ? 500 : 2200);
    await state(stage.id);
    await shot(`${String(index + 1).padStart(2, "0")}-${stage.id}`);
    if (stage.id === "suspension") {
      // hover a part: it is named in the readout and the rest dims
      await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: Math.round(W / 2), y: Math.round(Hh * 0.6) }, S);
      await sleep(500);
      await state("hover at pose a");
      await shot("03b-hover");
      await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 5, y: 5 }, S);
      await sleep(300);
    }
  }
  // drag the wheel itself with a real pointer: the head size must change and the page must not scroll
  {
    const box = JSON.parse(await ev(`JSON.stringify((() => { const b = document.querySelector(".it[data-knob]").getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; })())`));
    const y0 = await ev("scrollY");
    await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: box.x, y: box.y }, S);
    await sleep(300);
    await state("hover wheel");
    await shot("07b-hover-wheel");
    await send("Input.dispatchMouseEvent", { type: "mousePressed", x: box.x, y: box.y, button: "left", clickCount: 1 }, S);
    for (let i = 1; i <= 12; i++) {
      await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: box.x + i * 8, y: box.y, button: "left", buttons: 1 }, S);
      await sleep(30);
    }
    await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: box.x + 96, y: box.y, button: "left", clickCount: 1 }, S);
    await sleep(900);
    await state("drag wheel");
    console.log("scroll moved by".padEnd(18), (await ev("scrollY")) - y0);
    await shot("07c-drag-wheel");
    await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 5, y: 5 }, S);
  }
  // then the arrow keys on the focused figure
  await ev('document.querySelector(".hx-stage").focus({ preventScroll: true })');
  for (const key of ["ArrowRight", "ArrowRight", "ArrowRight"]) {
    await send("Input.dispatchKeyEvent", { type: "keyDown", key, code: key }, S);
    await send("Input.dispatchKeyEvent", { type: "keyUp", key, code: key }, S);
  }
  await sleep(900);
  await state("ratchet keys");
  await shot("08-ratchet-fit");
  // on through the text sections
  let part = 0;
  for (let guard = 0; guard < 40; guard++) {
    const before = await ev("scrollY");
    for (let i = 0; i < Math.ceil((Hh * 0.82) / 120); i++) await wheel(120);
    await sleep(reduced ? 400 : 1500);
    const after = await ev("scrollY");
    if (after <= pin.end + 4) continue;
    await shot(`${String(9 + part).padStart(2, "0")}-text-${part + 1}`);
    part++;
    if (after - before < 4) break;
  }
  await state("end");
  // back up: the helmet goes back together
  for (let i = 0; i < 400; i++) {
    if ((await ev("scrollY")) <= 2) break;
    await wheel(-240);
  }
  await sleep(reduced ? 500 : 2200);
  await state("back at top");
  console.log(msgs.length ? msgs.join("\n") : "no console errors");
} finally {
  try {
    ws && ws.close();
  } catch {}
  chrome.kill("SIGTERM");
  await sleep(300);
  rmSync(prof, { recursive: true, force: true });
}
