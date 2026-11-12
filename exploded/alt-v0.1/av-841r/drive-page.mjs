// Drives index.html with real wheel events over CDP and captures every stage and the text sections.
// usage: node drive-page.mjs <width> <height> <prefix> [query] [--reduced]
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync, readFileSync, existsSync } from "node:fs";
import { createServer } from "node:http";
import { extname, normalize } from "node:path";
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
// the page is served over http on this machine only, as GitHub Pages will serve it: the 360 view fetches spin.json and
// reads its canvas back to recolour it, and neither works from file://
const TYPES = { ".html": "text/html; charset=utf-8", ".json": "application/json", ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".js": "text/javascript", ".css": "text/css" };
const server = createServer((req, res) => {
  const file = join(HERE, normalize(decodeURIComponent(req.url.split("?")[0])).replace(/^(\.\.[\/\\])+/, ""));
  if (!file.startsWith(HERE) || !existsSync(file) || (process.env.HX_NOSPIN && req.url.includes("assets/spin/"))) return res.writeHead(404).end();
  res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream", "cache-control": "no-store" }).end(readFileSync(file));
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const ORIGIN = `http://127.0.0.1:${server.address().port}`;
const touch = W < 600;
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
  if (touch) await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 }, S);
  await send("Page.navigate", { url: `${ORIGIN}/index.html${query.startsWith("?") ? query : ""}` }, S);
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
  const state = async (tag) => console.log(tag.padEnd(18), await ev(`JSON.stringify({ y: Math.round(scrollY), max: document.documentElement.scrollHeight - innerHeight, read: document.querySelector("[data-readout]").textContent, feat: [...document.querySelectorAll(".hx-call")].filter((el) => Number(el.style.opacity) > 0.9).map((el) => [...el.querySelectorAll("b")].map((b) => b.textContent).join(" / ")).join(" + "), nav: (document.querySelector(".hx-nav [data-on]") || {}).textContent || "", sideways: document.documentElement.scrollWidth > innerWidth })`));
  const pin = JSON.parse(await ev("JSON.stringify((() => { const t = ScrollTrigger.getAll()[0]; return { start: t.start, end: t.end }; })())"));
  const stages = JSON.parse(await ev("JSON.stringify(window.HX_PAGE.stages)"));
  const hold = await ev("window.HX_PAGE.hold || 1");
  // ---------------------------------------------------------------- the 360 view and the hand-off
  {
    const spin = async () => JSON.parse(await ev("JSON.stringify(window.hxSpin ? window.hxSpin.state() : null)"));
    const say = (tag, text) => console.log(tag.padEnd(18), typeof text === "string" ? text : JSON.stringify(text));
    if (process.env.HX_LOGO) {
      // the LOGO PLACEMENT AREAS views in white and in one colour: captures, and whether the four stand on one line
      for (const colour of ["white", process.env.HX_LOGO]) {
        await ev(`document.querySelector('.sw-b[data-shell="${colour}"]').click()`);
        await ev('document.querySelector(".lg-views").scrollIntoView({ block: "center" })');
        await sleep(1800);
        await shot(`logo-${colour}`);
        say(`logo views ${colour}`, await ev(`JSON.stringify((() => { const li = [...document.querySelectorAll(".lg-views li")]; const r = (el) => el.getBoundingClientRect(); return { drawingBottoms: li.map((el) => Math.round(r(el.querySelector("svg")).bottom * 10) / 10), drawingWidths: li.map((el) => Math.round(r(el.querySelector("svg")).width * 10) / 10), labelTops: li.map((el) => Math.round(r(el.querySelector("b")).top * 10) / 10), watermarkShapes: document.querySelectorAll('.lv [fill="#0075c9"], .lv [clip-path]').length, shellFill: getComputedStyle(document.querySelector(".lv .lv-shell")).fill, sideways: document.documentElement.scrollWidth > innerWidth }; })())`));
      }
      say("logo errors", msgs.length ? msgs.join(" | ") : "none");
      throw new Error("top only");
    }
    if (process.env.HX_NOSPIN) {
      // the frame set is missing (404): the drawn still helmet must stand in and nothing may throw
      await sleep(1500);
      say("no frames", await ev(`JSON.stringify((() => { const vis = (el) => getComputedStyle(el).visibility === "visible" && !el.hidden; return { viewer: Boolean(window.hxSpin), canvasShown: vis(document.querySelector(".spin")), stillShown: vis(document.querySelector(".op-still")), figureShown: vis(document.querySelector(".hx-parts")), sideways: document.documentElement.scrollWidth > innerWidth }; })())`));
      await shot("nospin-top");
      say("no frames errors", msgs.length ? msgs.join(" | ") : "none");
      throw new Error("top only");
    }
    if (process.env.HX_SHELL) {
      // the colour is chosen before the 360 tests, so the turn and the hand-off run in it
      await ev(`document.querySelector('.sw-b[data-shell="${process.env.HX_SHELL}"]').click()`);
      say("shell", await ev("document.body.dataset.shell || 'white'"));
    }
    for (let i = 0; i < 60; i++) {
      const now = await spin();
      if (now && now.loaded === 36) break;
      await sleep(150);
    }
    say("360 loaded", await spin());
    say("360 state", await ev("document.documentElement.dataset.spin"));
    say("opening fits", await ev(`JSON.stringify((() => { const b = (q) => Math.round(document.querySelector(q).getBoundingClientRect().bottom); const r = { inner: innerHeight, helmet: b(".op-slot"), swatches: b(".sw"), takeApart: b(".cue"), wordmark: b(".wm-h"), wordmarkWidth: Math.round(document.querySelector(".wm-svg").getBoundingClientRect().width), intros: document.querySelectorAll(".intro").length }; r.fits = Math.max(r.helmet, r.swatches, r.takeApart, r.wordmark) <= innerHeight; return r; })())`));
    if (!reduced) {
      // the idle turn: caught part-way, then left to finish
      await sleep(3600);
      say("idle turn at 4 s", await spin());
      await shot("spin-idle");
      for (let i = 0; i < 80; i++) {
        if ((await ev("document.documentElement.dataset.spin")) === "rest") break;
        await sleep(150);
      }
    }
    say("after idle", { ...(await spin()), state: await ev("document.documentElement.dataset.spin") });
    const centre = async () => JSON.parse(await ev('JSON.stringify((() => { const r = document.querySelector(".spin").getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height * 0.45), w: Math.round(r.width), h: Math.round(r.height), left: r.left, top: r.top }; })())'));
    // a real gesture: a finger on a phone width, the mouse on a desktop width
    const drag = async (x0, y0, dx, dy, steps = 12, pause = 24) => {
      if (touch) {
        await send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: x0, y: y0 }] }, S);
        for (let i = 1; i <= steps; i++) {
          await send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x0 + (dx * i) / steps, y: y0 + (dy * i) / steps }] }, S);
          await sleep(pause);
        }
        await sleep(120);
        await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }, S);
      } else {
        await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: x0, y: y0 }, S);
        await send("Input.dispatchMouseEvent", { type: "mousePressed", x: x0, y: y0, button: "left", clickCount: 1 }, S);
        for (let i = 1; i <= steps; i++) {
          await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: x0 + (dx * i) / steps, y: y0 + (dy * i) / steps, button: "left", buttons: 1 }, S);
          await sleep(pause);
        }
        await sleep(120);
        await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: x0 + dx, y: y0 + dy, button: "left", clickCount: 1 }, S);
      }
      await sleep(1500);
    };
    // six angles: five sideways drags, a capture after each
    const c = await centre();
    await shot("spin-a1");
    say("cue before drag", (await spin()).cue ? "shown" : "hidden");
    for (let i = 2; i <= 6; i++) {
      const before = await spin();
      const y0 = await ev("scrollY");
      await drag(c.x - Math.round(c.w * 0.14), c.y, Math.round(c.w * 0.28), 6);
      const after = await spin();
      say(`drag ${i - 1} sideways`, { from: before.angle, to: after.angle, frame: after.frame, pageMovedBy: (await ev("scrollY")) - y0 });
      await shot(`spin-a${i}`);
    }
    say("cue after drag", (await spin()).cue ? "shown" : "hidden");
    // a flick: released while moving, it runs on and settles on a frame
    {
      const before = await spin();
      await drag(c.x + Math.round(c.w * 0.2), c.y, -Math.round(c.w * 0.4), 0, 6, 12);
      const after = await spin();
      say("flick left", { from: before.angle, to: after.angle, onAFrame: after.angle % 10 === 0, state: await ev("document.documentElement.dataset.spin") });
    }
    // up and down: the page scrolls, the helmet does not turn
    {
      const before = await spin();
      const y0 = await ev("scrollY");
      if (touch) await drag(c.x, c.y + 40, 4, -150);
      else {
        for (let i = 0; i < 3; i++) await send("Input.dispatchMouseEvent", { type: "mouseWheel", x: c.x, y: c.y, deltaX: 0, deltaY: 50 }, S);
        await sleep(1200);
      }
      const y1 = await ev("scrollY");
      const after = await spin();
      say(touch ? "swipe up on it" : "wheel over it", { pageMovedBy: Math.round(y1 - y0), restAngleFrom: before.angle, restAngleTo: after.angle });
      await ev("window.scrollTo(0, 0)");
      await sleep(1200);
    }
    // the arrow keys on the focused helmet
    {
      const before = await spin();
      await ev('document.querySelector(".spin").focus({ preventScroll: true })');
      for (const key of ["ArrowRight", "ArrowRight", "ArrowRight", "ArrowLeft"]) {
        await send("Input.dispatchKeyEvent", { type: "keyDown", key, code: key }, S);
        await send("Input.dispatchKeyEvent", { type: "keyUp", key, code: key }, S);
        await sleep(400);
      }
      const after = await spin();
      say("keys > > > <", { from: before.angle, to: after.angle, pageAt: await ev("scrollY") });
      await ev('document.querySelector(".spin").blur()');
    }
    // the hand-off: wheel down towards the pin; four frames; the place of the canvas just before against the figure just after
    {
      const rest = await spin();
      const start = await ev("ScrollTrigger.getAll()[0].start");
      const wheelTo = async (target) => {
        for (let i = 0; i < 400; i++) {
          const y = await ev("scrollY");
          if (y >= target - 6) break;
          await wheel(Math.min(80, Math.max(8, (target - y) / 3)));
          await sleep(50);
        }
        await sleep(900);
      };
      const seen = async () => JSON.parse(await ev(`JSON.stringify((() => { const vis = (el) => getComputedStyle(el).visibility === "visible" && !el.hidden; const cv = document.querySelector(".spin"); const parts = document.querySelector(".hx-parts"); const still = document.querySelector(".op-still"); const r = cv.getBoundingClientRect(); const st = document.querySelector(".hx-stage"); const on = st.querySelector(".it[data-on]"); return { y: Math.round(scrollY), dimmed: st.hasAttribute("data-focus") ? "others dimmed, pointer on " + (on ? on.dataset.piece : "?") : "no", canvas: vis(cv), figure: vis(parts), still: vis(still), helmetsShown: (vis(cv) ? 1 : 0) + (vis(parts) ? 1 : 0) + (vis(still) ? 1 : 0), frame: window.hxSpin.state().frame, box: [r.left, r.top, r.width, r.height].map((v) => Math.round(v * 10) / 10) }; })())`));
      await wheelTo(start * 0.34);
      say("hand-off 1", await seen());
      await shot("handoff-1");
      await wheelTo(start * 0.7);
      say("hand-off 2", await seen());
      await shot("handoff-2");
      // Lenis may still be easing the last wheel: wait, and repeat the jump until the page is really 2 px short of the pin
      await sleep(1200);
      for (let i = 0; i < 5; i++) {
        await ev(`window.scrollTo(0, ${start} - 2)`);
        await sleep(700);
        if (Math.abs((await ev("scrollY")) - (start - 2)) < 1.5) break;
      }
      const before = await seen();
      say("hand-off 3", before);
      await shot("handoff-3");
      await ev(`window.scrollTo(0, ${start} + 2)`);
      await sleep(700);
      say("hand-off 4 as is", await seen());
      await shot("handoff-4-pointer-on-figure");
      // the driver's pointer has been in the middle of the screen since the wheel events: move it off the figure
      await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 5, y: 5 }, S);
      await sleep(500);
      const after = await seen();
      // where the frame box of the figure's own drawing is on screen now
      const fig = JSON.parse(await ev(`JSON.stringify((() => { const m = document.querySelector(".hx-cam").getScreenCTM(); const b = window.HX_PAGE.spin.box; return [m.a * b[0] + m.e, m.d * b[1] + m.f, m.a * b[2], m.d * b[3]].map((v) => Math.round(v * 10) / 10); })())`));
      say("hand-off 4", { ...after, figureBox: fig });
      await shot("handoff-4");
      // the canvas 2 px short of the pin against the figure just pinned (the canvas barely moves on screen over those 2 px)
      say("registration", { dx: Math.round((fig[0] - before.box[0]) * 10) / 10, dy: Math.round((fig[1] - before.box[1]) * 10) / 10, dWidth: Math.round((fig[2] - before.box[2]) * 10) / 10, dHeight: Math.round((fig[3] - before.box[3]) * 10) / 10, unit: "px, figure minus canvas" });
      // and back up to the 360 view
      for (let i = 0; i < 400; i++) {
        if ((await ev("scrollY")) <= 2) break;
        await wheel(-120);
      }
      await sleep(1500);
      say("back to 360", { ...(await seen()), restAngle: (await spin()).angle, was: rest.angle });
      await shot("handoff-5-back");
    }
    // colour: every swatch, the canvas at frame 0 against the drawing in the same box
    if (process.env.HX_TINT) {
      await ev('document.querySelector(".spin").focus({ preventScroll: true })');
      for (let i = 0; i < 40 && (await spin()).angle !== 0; i++) {
        await send("Input.dispatchKeyEvent", { type: "keyDown", key: "ArrowLeft", code: "ArrowLeft" }, S);
        await send("Input.dispatchKeyEvent", { type: "keyUp", key: "ArrowLeft", code: "ArrowLeft" }, S);
        await sleep(330);
      }
      await ev('document.querySelector(".spin").blur()');
      for (const colour of ["white", "red", "yellow", "orange", "blue", "green", "grey"]) {
        await ev(`document.querySelector('.sw-b[data-shell="${colour}"]').click()`);
        await sleep(400);
        const r = JSON.parse(await ev('JSON.stringify((() => { const r = document.querySelector(".spin").getBoundingClientRect(); return { x: r.left, y: r.top + scrollY, width: r.width, height: r.height }; })())'));
        await shot(`open-${colour}`);
        const clip = async (name) => writeFileSync(join(HERE, "shots", `${prefix}-tint-${colour}-${name}.png`), Buffer.from((await send("Page.captureScreenshot", { format: "png", clip: { ...r, scale: 1 } }, S)).data, "base64"));
        await clip("frames");
        await ev('document.querySelector(".spin").style.opacity = "0"; document.querySelector(".op-still").style.visibility = "visible"');
        await sleep(200);
        await clip("drawn");
        await ev('document.querySelector(".spin").style.opacity = ""; document.querySelector(".op-still").style.visibility = ""');
        say(`tint ${colour}`, (await spin()).tint ? "captured" : "NOT TINTED");
      }
      await ev(`document.querySelector('.sw-b[data-shell="white"]').click()`);
    }
    say("360 errors", msgs.length ? msgs.join(" | ") : "none");
    if (process.env.HX_SPIN_ONLY) throw new Error("top only");
  }
  if (process.env.HX_SHELL) {
    // choose a shell colour by clicking the real swatch
    const p = JSON.parse(await ev(`JSON.stringify((() => { const b = document.querySelector('.sw-b[data-shell="${process.env.HX_SHELL}"]'); b.scrollIntoView({ block: "center" }); const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + 14 }; })())`));
    for (const type of ["mousePressed", "mouseReleased"]) await send("Input.dispatchMouseEvent", { type, x: p.x, y: p.y, button: "left", clickCount: 1 }, S);
    await sleep(300);
    console.log("shell".padEnd(18), await ev("document.body.dataset.shell || 'white'"));
    await ev("window.scrollTo(0, 0)");
    await sleep(600);
  }
  await shot("00-top");
  if (process.env.HX_ONLY_TOP) throw new Error("top only");
  await state("top");
  // wheel down to each stage in turn; the page's own snap settles it
  for (const [index, stage] of stages.entries()) {
    const target = pin.start + (pin.end - pin.start) * stage.at * hold;
    for (let i = 0; i < 600; i++) {
      const y = await ev("scrollY");
      if (y >= target - 30) break;
      await wheel(Math.min(100, Math.max(20, (target - y) / 3)));
      await sleep(60);
    }
    await sleep(reduced ? 500 : 2200);
    await state(stage.id);
    await shot(`${String(index + 1).padStart(2, "0")}-${stage.id}`);
    console.log("  under stage".padEnd(18), await ev('Math.max(0, Math.round(innerHeight - document.querySelector(".hx").getBoundingClientRect().bottom)) + " px uncovered"'));
    if (stage.id === "ratchet" || stage.id === "assembled") console.log(`figure at ${stage.id}`.padEnd(18), await ev(`JSON.stringify((() => { const p = document.querySelector(".hx-parts").getBoundingClientRect(); const s = document.querySelector(".hx").getBoundingClientRect(); return { top: Math.round(p.top), bottom: Math.round(p.bottom), height: Math.round(p.height), width: Math.round(p.width), stage: Math.round(s.height), share: Math.round((p.height / s.height) * 100) + "%" }; })())`));
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
  // each new section, scrolled to its heading
  for (const id of ["accessories", "customise", "industries"]) {
    await ev(`document.getElementById("${id}").scrollIntoView()`);
    await sleep(1600);
    await shot("sec-" + id);
  }
  await ev('document.querySelector(".mhp").scrollIntoView({ block: "center" })');
  await sleep(1600);
  await shot("sec-more");
  // the document buttons under the specification
  await ev('document.querySelector(".docs").scrollIntoView({ block: "center" })');
  await sleep(1500);
  await shot("docs");
  {
    // hover the first document, then Tab to the second: the arrow moves and the focus ring shows
    const p = JSON.parse(await ev('JSON.stringify((() => { const b = document.querySelector(".doc").getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2, h: Math.round(b.height) }; })())'));
    console.log("doc height".padEnd(18), p.h);
    await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: p.x, y: p.y }, S);
    await sleep(500);
    await shot("docs-hover");
    await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 5, y: 5 }, S);
    await ev('document.querySelector(".doc").focus({ preventScroll: true })');
    await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 }, S);
    await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 }, S);
    await sleep(500);
    await shot("docs-focus");
  }
  console.log("docs".padEnd(18), await ev('JSON.stringify([...document.querySelectorAll(".doc")].map((a) => [a.textContent, a.href, a.target]))'));
  {
    // the features accordion: a real click on the second row, then the keyboard (Tab focus, Enter) on the third
    const acc = async () => JSON.parse(await ev('JSON.stringify([...document.querySelectorAll(".ac-b")].map((b) => [b.getAttribute("aria-expanded"), Math.round(document.getElementById(b.getAttribute("aria-controls")).getBoundingClientRect().height)]))'));
    await ev('document.querySelector(".acc-list").scrollIntoView({ block: "center" })');
    await sleep(1400);
    console.log("accordion start".padEnd(18), JSON.stringify(await acc()));
    const p = JSON.parse(await ev('JSON.stringify((() => { const b = document.querySelectorAll(".ac-b")[1].getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; })())'));
    if (touch) {
      await send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: p.x, y: p.y }] }, S);
      await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }, S);
    } else for (const type of ["mousePressed", "mouseReleased"]) await send("Input.dispatchMouseEvent", { type, x: p.x, y: p.y, button: "left", clickCount: 1 }, S);
    await sleep(900);
    console.log("accordion click".padEnd(18), JSON.stringify(await acc()));
    await shot("accordion-click");
    await ev('document.querySelectorAll(".ac-b")[1].focus({ preventScroll: true })');
    await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 }, S);
    await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 }, S);
    await sleep(200);
    console.log("accordion focus".padEnd(18), await ev('document.activeElement.id'));
    await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, text: "\r" }, S);
    await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 }, S);
    await sleep(900);
    console.log("accordion key".padEnd(18), JSON.stringify(await acc()));
    await shot("accordion-key");
    // a detail tile's "See it" jumps to its stage of the exploded view
    await ev('document.querySelectorAll(".dt .go")[1].scrollIntoView({ block: "center" })');
    await sleep(1200);
    await ev('document.querySelectorAll(".dt .go")[1].click()');
    await sleep(3200);
    await state("see it: ratchet");
    await shot("see-it-ratchet");
  }
  // back up: the helmet goes back together
  for (let i = 0; i < 400; i++) {
    if ((await ev("scrollY")) <= 2) break;
    await wheel(-240);
  }
  await sleep(reduced ? 500 : 2200);
  await state("back at top");
  console.log(msgs.length ? msgs.join("\n") : "no console errors");
} catch (error) {
  if (error.message !== "top only") throw error;
} finally {
  try {
    ws && ws.close();
  } catch {}
  chrome.kill("SIGTERM");
  server.close();
  server.closeAllConnections && server.closeAllConnections();
  await sleep(300);
  rmSync(prof, { recursive: true, force: true });
}
