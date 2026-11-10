// Interaction test over CDP: pointer sweep -> signal -> click -> card -> close -> fly -> worn. usage: node test-flow.mjs <url> <outDir>
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const [url, outDir] = process.argv.slice(2);
const prof = mkdtempSync(join(tmpdir(), 'sa-cdp-')), port = 9800 + Math.floor(Math.random() * 300);
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--disable-gpu', `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, '--no-first-run', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ws, id = 0; const pend = new Map(), logs = [];
const send = (method, params = {}, sessionId) => new Promise((res, rej) => { const i = ++id; pend.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params, sessionId })); });
try {
  let ver; for (let i = 0; i < 50; i++) { try { ver = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); break; } catch { await sleep(200); } }
  ws = new WebSocket(ver.webSocketDebuggerUrl); await new Promise(r => ws.addEventListener('open', r));
  ws.addEventListener('message', ev => { const m = JSON.parse(ev.data); if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result); } else if (m.method === 'Runtime.exceptionThrown' || (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error')) logs.push(JSON.stringify(m.params).slice(0, 300)); });
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  const S = (m, p) => send(m, p, sessionId), ev = async e => (await S('Runtime.evaluate', { expression: e, returnByValue: true })).result.value;
  await S('Runtime.enable'); await S('Page.enable');
  await S('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await S('Page.navigate', { url }); for (let i = 0; i < 100; i++) { await sleep(150); if (await ev('document.documentElement.dataset.ready==="1"')) break; }
  const shot = async n => writeFileSync(join(outDir, n + '.png'), Buffer.from((await S('Page.captureScreenshot', { format: 'png' })).data, 'base64'));
  const mouse = (x, y, type = 'mouseMoved') => S('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 });
  // sweep towards the tower (marker 5)
  const pos = await ev(`JSON.stringify(document.querySelectorAll('.mk')[4].getBoundingClientRect())`); const r = JSON.parse(pos); const mx = r.x + r.width / 2, my = r.y + r.height / 2;
  for (let i = 0; i <= 20; i++) { await mouse(200 + (mx - 200) * i / 20, 700 + (my - 700) * i / 20); await sleep(30); }
  await sleep(500);
  console.log('signal tag:', await ev(`document.getElementById('lensTag').textContent`), 'on:', await ev(`document.querySelectorAll('.mk')[4].classList.contains('on')`));
  await mouse(mx, my, 'mousePressed'); await mouse(mx, my, 'mouseReleased');
  await sleep(120); await shot('f-grow'); await sleep(900);
  console.log('card open:', await ev(`document.getElementById('card').classList.contains('open')`));
  await ev(`document.getElementById('tg').click()`); await sleep(200); await shot('g-card-expanded');
  await S('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 }); await S('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await sleep(300); await shot('h-fly'); await sleep(900);
  console.log('after close: count', await ev(`document.getElementById('cnt').textContent`), 'card open', await ev(`document.getElementById('card').classList.contains('open')`), 'layer opacity', await ev(`getComputedStyle(document.querySelectorAll('.ly')[4]).opacity`));
  // click outside test: reopen marker 6 with keyboard, click outside
  await ev(`document.querySelectorAll('.mk')[5].focus()`); await S('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r' }); await S('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
  await sleep(900); console.log('kbd open:', await ev(`document.getElementById('card').classList.contains('open')`));
  await mouse(1300, 120, 'mousePressed'); await mouse(1300, 120, 'mouseReleased'); await sleep(1200);
  console.log('outside close: count', await ev(`document.getElementById('cnt').textContent`), 'open', await ev(`document.getElementById('card').classList.contains('open')`));
  console.log('errors:', JSON.stringify(logs), JSON.stringify(await ev('window.__errs')));
} finally { chrome.kill(); }
