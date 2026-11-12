// Industry pictograms for this design: the ADS / AVES tiles are a white glyph on a green square with a white frame ring.
// Here the glyph is set in charcoal on the warm panel: the square and its ring are dropped (any shape covering most of
// the tile both ways), anything outside the 128-unit tile is dropped, the viewBox is cropped to the glyph (square, padded)
// so all twelve read at one size, white -> charcoal, green -> the panel tone. Writes assets/ind-line-<id>.svg.
// usage: node icons.mjs   (measures in headless Chrome; closes it in the same finally)
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
const HERE = dirname(fileURLToPath(import.meta.url));
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const prof = mkdtempSync(join(tmpdir(), "hx-icons-"));
const port = 9950 + Math.floor(Math.random() * 40);
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
const files = readdirSync(join(HERE, "assets")).filter((n) => /^ind-[a-z-]+\.svg$/.test(n) && !n.startsWith("ind-line-"));
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
  const ev = async (e) => (await send("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true }, S)).result.value;
  for (const file of files) {
    const text = readFileSync(join(HERE, "assets", file), "utf8").replace(/<\?xml[^>]*>/, "").replace(/<!--[\s\S]*?-->/g, "");
    const out = await ev(`(() => {
      document.body.innerHTML = ${JSON.stringify(text)};
      const svg = document.querySelector("svg");
      svg.setAttribute("width", "128"); svg.setAttribute("height", "128");
      svg.style.cssText = "position:absolute;left:0;top:0";
      const shapes = [...svg.querySelectorAll("path,rect,polygon,polyline,circle,ellipse,line")];
      let dropped = 0;
      const keep = [];
      for (const el of shapes) {
        const r = el.getBoundingClientRect();
        const inside = r.right > 0.5 && r.bottom > 0.5 && r.left < 127.5 && r.top < 127.5 && r.width > 0 && r.height > 0;
        if (!inside || (r.width > 90 && r.height > 90)) { el.remove(); dropped++; continue; }
        keep.push(r);
      }
      const x0 = Math.min(...keep.map((r) => r.left)), y0 = Math.min(...keep.map((r) => r.top));
      const x1 = Math.max(...keep.map((r) => r.right)), y1 = Math.max(...keep.map((r) => r.bottom));
      const side = Math.max(x1 - x0, y1 - y0) * 1.08;
      const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
      svg.setAttribute("viewBox", [cx - side / 2, cy - side / 2, side, side].map((v) => v.toFixed(2)).join(" "));
      svg.removeAttribute("width"); svg.removeAttribute("height"); svg.removeAttribute("style"); svg.removeAttribute("x"); svg.removeAttribute("y");
      return { dropped, kept: keep.length, box: [x0, y0, x1 - x0, y1 - y0].map((v) => Math.round(v)), svg: svg.outerHTML };
    })()`);
    // the source viewBox is 0 0 128 128 and was drawn at 128 px, so client px are user units
    const svg = out.svg.replace(/#009845/gi, "#e4e1d8").replace(/#ffffff\b/gi, "#2e2e2c").replace(/#fff\b/gi, "#2e2e2c").replace(/#231f20/gi, "#2e2e2c").replace(/\swidth="128"|\sheight="128"/g, "");
    writeFileSync(join(HERE, "assets", file.replace("ind-", "ind-line-")), `<svg xmlns="http://www.w3.org/2000/svg"${svg.slice(4).replace(/\sxmlns="[^"]*"/, "")}`);
    console.log(file.padEnd(24), "dropped", out.dropped, "kept", out.kept, "glyph box", out.box.join(" "));
  }
} finally {
  try {
    ws && ws.close();
  } catch {}
  chrome.kill("SIGKILL");
  await sleep(300);
  rmSync(prof, { recursive: true, force: true });
}
process.exit(0);
