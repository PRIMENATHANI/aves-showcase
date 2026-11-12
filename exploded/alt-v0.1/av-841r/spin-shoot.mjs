// Screenshots the 360 frame pages (shots/_spin/spin-NNN.html) on transparency -> shots/_spin/spin-NNN.png
// usage: node spin-shoot.mjs <width> <height>
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const HERE = dirname(fileURLToPath(import.meta.url));
const [W, H] = process.argv.slice(2).map(Number);
const dir = join(HERE, "shots", "_spin");
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
  await send("Page.enable", {}, S);
  await send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: 1, mobile: false }, S);
  await send("Emulation.setDefaultBackgroundColorOverride", { color: { r: 0, g: 0, b: 0, a: 0 } }, S);
  for (const file of readdirSync(dir).filter((name) => name.endsWith(".html")).sort()) {
    await send("Page.navigate", { url: `file://${join(dir, file)}` }, S);
    await sleep(700);
    const shot = await send("Page.captureScreenshot", { format: "png", clip: { x: 0, y: 0, width: W, height: H, scale: 1 } }, S);
    writeFileSync(join(dir, file.replace(".html", ".png")), Buffer.from(shot.data, "base64"));
  }
  console.log("shot", readdirSync(dir).filter((name) => name.endsWith(".png")).length, "frames");
} finally {
  try {
    ws && ws.close();
  } catch {}
  chrome.kill("SIGTERM");
  await sleep(300);
  rmSync(prof, { recursive: true, force: true });
}
