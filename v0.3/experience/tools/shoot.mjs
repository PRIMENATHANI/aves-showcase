// Headless Chrome over CDP: loads each URL, waits for data-ready, waits for the scrub to settle,
// screenshots, and collects every console message and log entry (incl. network 404s).
// usage: node shoot.mjs <baseUrl> <outDir> <name|query|w|h> ...
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const [base, outDir, ...jobs] = process.argv.slice(2);
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const prof = mkdtempSync(join(tmpdir(), 'aves-cdp-'));
const port = 9400 + Math.floor(Math.random() * 400);
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, '--no-first-run', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));

let ws, id = 0; const pending = new Map(), handlers = [];
const send = (method, params = {}, sessionId) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params, sessionId })); });
try {
  let ver;
  for (let i = 0; i < 50; i++) { try { ver = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); break; } catch { await sleep(200); } }
  ws = new WebSocket(ver.webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r));
  ws.addEventListener('message', ev => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result); } else handlers.forEach(h => h(m)); });
  let allOk = true;
  for (const job of jobs) {
    const [name, query, w, h] = job.split('|');
    const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
    const msgs = [];
    const h1 = m => {
      if (m.sessionId !== sessionId) return;
      if (m.method === 'Runtime.consoleAPICalled') msgs.push(`console.${m.params.type}: ` + m.params.args.map(a => a.value ?? a.description ?? '').join(' '));
      if (m.method === 'Runtime.exceptionThrown') msgs.push('exception: ' + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text));
      if (m.method === 'Log.entryAdded') msgs.push(`log.${m.params.entry.level}: ${m.params.entry.text} ${m.params.entry.url || ''}`);
    };
    handlers.push(h1);
    await send('Runtime.enable', {}, sessionId); await send('Log.enable', {}, sessionId); await send('Page.enable', {}, sessionId);
    await send('Emulation.setDeviceMetricsOverride', { width: +w, height: +h, deviceScaleFactor: 1, mobile: +w < 760 }, sessionId);
    await send('Page.navigate', { url: base + query }, sessionId);
    let ready = false;
    for (let i = 0; i < 100; i++) { await sleep(150); const r = await send('Runtime.evaluate', { expression: 'document.documentElement.dataset.ready === "1"', returnByValue: true }, sessionId); if (r.result.value) { ready = true; break; } }
    await sleep(name.includes('pickanim') ? 380 : 2200);
    const shot = await send('Page.captureScreenshot', { format: 'png' }, sessionId);
    writeFileSync(join(outDir, name + '.png'), Buffer.from(shot.data, 'base64'));
    const info = await send('Runtime.evaluate', { expression: 'JSON.stringify({dbg: document.documentElement.dataset.dbg || null, sw: document.documentElement.scrollWidth, vw: innerWidth, errs: window.__errs})', returnByValue: true }, sessionId);
    const bad = msgs.filter(m => /error|exception/i.test(m));
    if (bad.length || !ready) allOk = false;
    console.log(`${name.padEnd(14)} ready=${ready} ${info.result.value}\n` + msgs.map(m => '   ' + m).join('\n'));
    handlers.splice(handlers.indexOf(h1), 1);
    await send('Target.closeTarget', { targetId });
  }
  console.log(allOk ? 'ALL CLEAN' : 'ISSUES ABOVE');
} finally {
  try { ws && ws.close(); } catch {}
  chrome.kill('SIGTERM'); await sleep(300); rmSync(prof, { recursive: true, force: true });
}
