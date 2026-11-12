// Quick looks while building: serves the folder on 127.0.0.1, opens index.html in headless Chrome at a size and runs steps.
// usage: node look.mjs <width> <height> '<steps JSON>'   steps: ["wait",ms] ["eval",js] ["y",px] ["shot",name] ["el",selector,name] ["print",js]
// Captures go to shots/<name>.png. Chrome and the server are closed in the same finally.
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync, readFileSync, existsSync } from "node:fs";
import { createServer } from "node:http";
import { extname, normalize, dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
const HERE = dirname(fileURLToPath(import.meta.url));
const [width, height, stepsText = "[]"] = process.argv.slice(2);
const W = Number(width);
const Hh = Number(height);
const steps = JSON.parse(stepsText);
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const prof = mkdtempSync(join(tmpdir(), "hx-look-"));
const port = 9800 + Math.floor(Math.random() * 150);
const chrome = spawn(CHROME, ["--headless=new", "--hide-scrollbars", `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, "--no-first-run", "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const TYPES = { ".html": "text/html; charset=utf-8", ".json": "application/json", ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".js": "text/javascript", ".css": "text/css" };
const server = createServer((req, res) => {
  const file = join(HERE, normalize(decodeURIComponent(req.url.split("?")[0])).replace(/^(\.\.[\/\\])+/, ""));
  if (!file.startsWith(HERE) || !existsSync(file)) return res.writeHead(404).end();
  res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream", "cache-control": "no-store" }).end(readFileSync(file));
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const ORIGIN = `http://127.0.0.1:${server.address().port}`;
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
  if (process.env.HX_REDUCED) await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] }, S);
  await send("Page.navigate", { url: `${ORIGIN}/index.html` }, S);
  const ev = async (e) => (await send("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true }, S)).result.value;
  for (let i = 0; i < 100; i++) {
    await sleep(150);
    if (await ev('document.documentElement.dataset.ready === "1"')) break;
  }
  await sleep(900);
  const shot = async (n) => writeFileSync(join(HERE, "shots", `${n}.png`), Buffer.from((await send("Page.captureScreenshot", { format: "png" }, S)).data, "base64"));
  for (const [kind, a, b] of steps) {
    if (kind === "wait") await sleep(a);
    else if (kind === "eval") await ev(a);
    else if (kind === "print") console.log(await ev(a));
    else if (kind === "y") {
      await ev(`window.scrollTo(0, ${a})`);
      await sleep(900);
    } else if (kind === "shot") await shot(a);
    else if (kind === "el") {
      await ev(`(() => { const el = document.querySelector(${JSON.stringify(a)}); window.scrollTo(0, el.getBoundingClientRect().top + scrollY - 10); })()`);
      await sleep(1200);
      await shot(b);
    }
  }
  console.log("errors:", msgs.length ? msgs.join(" | ") : "none", "| sideways:", await ev("document.documentElement.scrollWidth > innerWidth"));
} finally {
  try {
    ws && ws.close();
  } catch {}
  chrome.kill("SIGKILL");
  server.close();
  await sleep(300);
  rmSync(prof, { recursive: true, force: true });
}
process.exit(0);
