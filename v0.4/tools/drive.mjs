// Drives the spike with real wheel + mouse events over CDP and prints scroll state after each action.
// usage: node drive.mjs <url> [outDir]
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const [url, outDir] = process.argv.slice(2);
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const prof = mkdtempSync(join(tmpdir(), 'aves-drive-'));
const port = 9400 + Math.floor(Math.random() * 400);
const chrome = spawn(CHROME, ['--headless=new', '--hide-scrollbars', `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, '--no-first-run', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ws, id = 0; const pending = new Map(); const msgs = [];
const send = (method, params = {}, sessionId) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params, sessionId })); });
try {
  let ver; for (let i = 0; i < 50; i++) { try { ver = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); break; } catch { await sleep(200); } }
  ws = new WebSocket(ver.webSocketDebuggerUrl); await new Promise(r => ws.addEventListener('open', r));
  ws.addEventListener('message', ev => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result); }
    else if (m.method === 'Runtime.exceptionThrown') msgs.push('exception: ' + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text));
    else if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') msgs.push('console.error: ' + m.params.args.map(a => a.value ?? a.description ?? '').join(' ')); });
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId: S } = await send('Target.attachToTarget', { targetId, flatten: true });
  await send('Runtime.enable', {}, S); await send('Page.enable', {}, S);
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false }, S);
  await send('Page.navigate', { url }, S);
  const ev = async e => (await send('Runtime.evaluate', { expression: e, returnByValue: true }, S)).result.value;
  for (let i = 0; i < 100; i++) { await sleep(150); if (await ev('document.documentElement.dataset.ready === "1"')) break; }
  await sleep(800);
  const state = async tag => console.log(tag.padEnd(26), await ev(`JSON.stringify({y: Math.round(scrollY), max: document.documentElement.scrollHeight - innerHeight, worn: document.querySelector('#cntI').textContent, cap: [...document.querySelectorAll('.cap .c')].findIndex(c => getComputedStyle(c).visibility === 'visible') + 1, dw: getComputedStyle(document.querySelector('#pd')).visibility})`));
  const shot = async n => { if (outDir) writeFileSync(join(outDir, n + '.png'), Buffer.from((await send('Page.captureScreenshot', { format: 'png' }, S)).data, 'base64')); };
  const wheel = async (dy, n = 1) => { for (let i = 0; i < n; i++) { await send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: 400, y: 450, deltaX: 0, deltaY: dy }, S); await sleep(40); } };
  const click = async sel => { const r = JSON.parse(await ev(`(() => { const e = [...document.querySelectorAll(${JSON.stringify(sel)})].find(e => { const c = getComputedStyle(e); const b = e.getBoundingClientRect(); return c.visibility === 'visible' && b.width > 0 && b.right > 0 && b.left < innerWidth; }); if (!e) return 'null'; const b = e.getBoundingClientRect(); return JSON.stringify({ x: b.left + b.width / 2, y: b.top + b.height / 2 }); })()`));
    if (!r) { console.log('   (no visible ' + sel + ')'); return; }
    for (const type of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x: r.x, y: r.y, button: 'left', clickCount: 1 }, S); };
  await state('loaded');
  await wheel(120, 14); await sleep(2500); await state('after wheel x14'); await shot('drive-1');
  await wheel(120, 8); await sleep(2500); await state('after wheel x8 more');
  await click('.cap .c .btn'); await sleep(900); await state('details opened'); await shot('drive-2-details');
  await wheel(120, 4); await sleep(600); await state('wheel while open');
  await click('#pdX'); await sleep(2000); await state('details closed'); await shot('drive-3-closed');
  await wheel(120, 8); await sleep(2500); await state('wheel after close');
  await wheel(-120, 6); await sleep(2500); await state('wheel back');
  console.log(msgs.length ? msgs.join('\n') : 'no console errors');
} finally { try { ws && ws.close(); } catch {} chrome.kill('SIGTERM'); await sleep(300); rmSync(prof, { recursive: true, force: true }); }
