// AVES Site Audit spike (throwaway, 2026-11-10). One kit (Oil & Gas), desktop only.
// Mechanic: sweep the worksite with a scanner lens, find 8 hazards; each one issues the product that answers it.
(async () => {
'use strict';
const ROOT = '../../', DRESS = ROOT + 'assets/dress/';
const $ = s => document.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const q = new URLSearchParams(location.search);
const rm = matchMedia('(prefers-reduced-motion: reduce)').matches;
const KIT = 'oil-gas';
const SISTER = { brand: 'Scuta', name: 'Reflector Safety Vest', sku: '3116RR71', standards: 'EN ISO 20471:2013+A1:2016 Class 2',
  bullets: ['Class 2 hi-vis waistcoat', 'Two 5 cm reflective bands round the torso', 'One reflective band over each shoulder'] };
// hazard name + where, per slot: the NEED wording from the a-plus spike (my wording, product management signs off)
const NEED = {
  head: ['Falling objects', 'Under pipe racks, lifting operations and scaffolds, and in full sun on open plant'],
  eye: ['Flying particles and glare', 'Outdoor plant rounds, line breaks, grinding and wire brushing'],
  hearing: ['Compressor and pump noise', 'Compressor houses, pump bays and turbine areas'],
  respiratory: ['Sour gas and hydrocarbon vapours', 'H2S zones: carried on the belt, pulled on only to escape'],
  vest: ['Being seen', 'Plant roads, laydown yards and loading bays, around vehicles and cranes'],
  fall: ['Work at height', 'Ladders, pipe racks, tank tops and platforms'],
  dropped: ['Dropped tools', 'Any tool carried above people or equipment'],
  hand: ['Hydrocarbons on hands', 'Handling oily pipe, hoses and valves'] };
const LABEL = { vest: 'Hi-vis', dropped: 'Dropped objects' };
// hazard places in the scene image (art/bg-oil-gas.jpg, 1792 x 1024), left to right = Tab order = ?found numbering
const SPOTS = [
  { slot: 'dropped', at: [272, 318], note: 'platform on the left column' },
  { slot: 'hand', at: [340, 545], note: 'pipe elbows low on the left rack' },
  { slot: 'head', at: [530, 440], note: 'overhead pipe run, left rack' },
  { slot: 'eye', at: [650, 665], note: 'sun glare off the wet gravel' },
  { slot: 'fall', at: [915, 330], note: 'red-white tower, centre' },
  { slot: 'vest', at: [960, 600], note: 'plant road mouth, centre' },
  { slot: 'respiratory', at: [1062, 375], note: 'steam vent on the right column' },
  { slot: 'hearing', at: [1150, 565], note: 'white skid by the right rack' } ];
const IMG = { w: 1792, h: 1024 };

const [kits, prods, man] = await Promise.all(['data/kits.json', 'data/products.json', 'assets/dress/manifest.json'].map(f => fetch(ROOT + f).then(r => r.json())));
const DET = await fetch('art/details.json').then(r => r.json());
const products = Object.fromEntries(prods.map(p => [p.id, p]));
const layerById = Object.fromEntries(man.layers.map(l => [l.id, l]));
const kit = kits.find(k => k.id === KIT);
const dispName = p => (p.name || p.id).replace(/\s+[–-]\s+/g, '-');
const F = man.frame;
const layerSrc = l => DRESS + 'layers/' + encodeURIComponent(l.id) + '.png';
const layerOfSlot = slot => layerById[man.kits[KIT].order.find(id => layerById[id].slot === slot)];
const items = SPOTS.map((sp, i) => {
  const l = layerOfSlot(sp.slot), s = kit.slots.find(x => x.slot === sp.slot), p = products[l.product], need = NEED[sp.slot];
  const base = { i, slot: sp.slot, at: sp.at, l, need, label: LABEL[sp.slot] || s.label };
  return sp.slot === 'vest'
    ? { ...base, name: SISTER.brand + ' ' + SISTER.name, sku: SISTER.sku, std: SISTER.standards, bullets: SISTER.bullets, url: '' }
    : { ...base, name: dispName(p), sku: p.sku, std: p.standards, pid: p.id, ...(DET[p.id] || { bullets: [] }) };
});
const N = items.length;
const cutHTML = it => it.pid
  ? `<img alt="" src="art/cut/${encodeURIComponent(it.pid)}.png">`
  : `<svg viewBox="${it.l.box[0]} ${it.l.box[1]} ${it.l.box[2] - it.l.box[0]} ${it.l.box[3] - it.l.box[1]}" preserveAspectRatio="xMidYMid meet"><image href="${layerSrc(it.l)}" width="${F.w}" height="${F.h}"/></svg>`;

// ---------- static DOM
const stage = $('#stage'), manEl = $('#man'), lit = $('#lit'), cam = $('#cam');
if (rm) stage.classList.add('rm');
const lys = items.map(it => { const im = new Image(); im.className = 'ly'; im.alt = ''; im.src = layerSrc(it.l); im.style.zIndex = it.l.z;
  // draft art: the glasses layer has temples sticking out sideways; keep the front only
  if (it.slot === 'eye') im.style.cssText += ';z-index:75;-webkit-mask-image:linear-gradient(90deg,transparent 41.4%,#000 42.6%,#000 56.6%,transparent 57.8%);mask-image:linear-gradient(90deg,transparent 41.4%,#000 42.6%,#000 56.6%,transparent 57.8%)';
  manEl.insertBefore(im, lit); return im; });
$('#marks').innerHTML = items.map((it, i) => `<button class="mk" type="button" data-i="${i}" aria-label="Hazard signal ${i + 1} of ${N}"><span class="o"><i class="r"></i><i class="d"></i></span></button>`).join('');
const mks = [...document.querySelectorAll('.mk')];
$('#rows').innerHTML = items.map(() => '<li></li>').join('');
const rowEls = [...document.querySelectorAll('#rows li')];
$('#endL').innerHTML = man.kits[KIT].order.map(id => items.find(it => it.l.id === id)).map(it => `<li><span class="n">${esc(it.name)}</span><span class="m">${esc(it.label)} &middot; ${esc(it.sku)}</span></li>`).join('');
const hintRing = document.createElement('i'); hintRing.className = 'hintring'; $('#marks').appendChild(hintRing);
const dur = d => rm ? 0 : d;
// preload close-ups and wait for the main images
const closeSrc = it => 'art/close/' + it.slot + '.png';
items.forEach(it => { new Image().src = closeSrc(it); });
await Promise.all([...document.images].map(im => im.complete ? 0 : new Promise(r => { im.onload = im.onerror = r; })));
await document.fonts.ready.catch(() => 0);

// ---------- geometry
let W, H, sc, ox, oy, S = 1.2, R = 150, K, mLeft, mTop, mW, mH, feetY, cxMan;
const spot = it => [ox + it.at[0] * sc, oy + it.at[1] * sc];
function layout() {
  W = stage.clientWidth; H = stage.clientHeight;
  sc = Math.max(W / IMG.w, H / IMG.h); ox = (W - IMG.w * sc) / 2; oy = (H - IMG.h * sc) / 2;
  $('#lensIn').style.width = W + 'px'; $('#lensIn').style.height = H + 'px';
  mH = .78 * H; K = mH / F.h; mW = F.w * K; feetY = .935 * H; mTop = feetY - .9577 * mH; cxMan = .80 * W; mLeft = cxMan - mW / 2;
  gsap.set(manEl, { left: mLeft, top: mTop, width: mW, height: mH });
  gsap.set('#cast', { left: mLeft, top: mTop, width: mW, height: mH, transformOrigin: '50% 95.77%', skewX: 74, scaleY: -.2 });
  gsap.set('#contact', { left: cxMan - mW * .3, top: feetY - 16, width: mW * .6, height: 34 });
  mks.forEach((m, i) => { const [x, y] = spot(items[i]); gsap.set(m, { x, y }); });
}
layout();

// ---------- worn layers
const worn = new Set(); let held = false;
function setLit() { const m = ['url(' + DRESS + 'base.png)', ...items.filter(it => worn.has(it.slot)).map(it => 'url("' + layerSrc(it.l) + '")')].join(','); lit.style.webkitMaskImage = m; lit.style.maskImage = m; }
function wear(it, instant) {
  if (it.slot === 'hearing' && !worn.has('head')) { held = true; return false; }
  worn.add(it.slot); gsap.to(lys[it.i], { opacity: 1, duration: instant ? 0 : dur(.2), ease: 'power1.out' });
  if (it.slot === 'head' && held) { held = false; wear(items.find(x => x.slot === 'hearing'), instant); const row = rowEls.find(r => r.dataset.slot === 'hearing'); row && row.querySelector('i') && row.querySelector('i').remove(); }
  setLit(); return true;
}

setLit();
// ---------- audit sheet + state
const found = []; // item indexes in the order found
function fillRow(it, instant) {
  const n = found.length - 1, r = rowEls[n];
  const hold = it.slot === 'hearing' && !worn.has('head');
  r.dataset.slot = it.slot;
  r.innerHTML = `<span class="h">${esc(it.need[0])}</span><span class="p">${esc(it.name)}${hold ? '<i>mounts on the helmet</i>' : ''}</span>`;
  if (instant) r.style.transition = 'none';
  requestAnimationFrame(() => r.classList.add('fill'));
}
function markFound(i, instant) {
  found.push(i); const m = mks[i]; m.classList.add('found'); m.classList.remove('on'); m.tabIndex = -1; m.setAttribute('aria-label', 'Hazard found: ' + items[i].need[0]);
  gsap.set(m.querySelector('.o'), { x: 0, y: 0 });
  wear(items[i], instant); fillRow(items[i], instant);
  $('#cnt').textContent = found.length;
  $('#lead').textContent = found.length < N ? (N - found.length) + (N - found.length === 1 ? ' hazard left to find.' : ' hazards left to find.') : 'All eight found.';
}

// ---------- lens
let tx = W * .5, ty = H * .5, cx = tx, cy = ty, follow = true, live = false, sigIdx = -1;
const lens = $('#lens'), lensIn = $('#lensIn'), lensUi = $('#lensUi'), tag = $('#lensTag');
function goLive() { if (!live) { live = true; stage.classList.add('live'); } }
function frame() {
  const a = rm || !follow ? 1 : .2;
  cx += (tx - cx) * a; cy += (ty - cy) * a;
  lens.style.transform = lensUi.style.transform = `translate3d(${cx - R}px,${cy - R}px,0)`;
  lensIn.style.transform = `translate3d(${R - cx * S}px,${R - cy * S}px,0) scale(${S})`;
  let best = -1, bd = 1e9;
  mks.forEach((m, i) => {
    if (m.classList.contains('found')) return;
    const [x, y] = spot(items[i]), d = Math.hypot(x - cx, y - cy), on = m.classList.contains('on');
    if (d < bd) { bd = d; best = i; }
    if (!on && d < 66) m.classList.add('on'); else if (on && d > 88) m.classList.remove('on');
    if (m.classList.contains('on')) { const k = S - 1; m.querySelector('.o').style.transform = `translate3d(${(x - cx) * k}px,${(y - cy) * k}px,0)`; }
  });
  const sig = best >= 0 && mks[best].classList.contains('on') ? best : -1;
  if (sig !== sigIdx) { sigIdx = sig; tag.textContent = sig >= 0 ? 'Signal' : 'Scanning'; tag.classList.toggle('on', sig >= 0); }
}
gsap.ticker.add(frame);
const dbgPtr = q.has('lens') || q.has('found') || q.has('open') || q.has('done');
if (q.get('lens')) { const [fx, fy] = q.get('lens').split(',').map(Number); tx = cx = fx * W; ty = cy = fy * H; goLive(); }
if (!dbgPtr) {
  stage.addEventListener('pointermove', e => { if (e.target.closest('.sheet,.card,.end')) return; tx = e.clientX; ty = e.clientY; goLive(); });
}
mks.forEach((m, i) => m.addEventListener('focus', () => { if (dbgPtr) return; [tx, ty] = spot(items[i]); goLive(); }));

// ---------- hint
$('#hint').addEventListener('click', () => {
  let best = null, bd = 1e9;
  items.forEach((it, i) => { if (mks[i].classList.contains('found')) return; const [x, y] = spot(it), d = Math.hypot(x - cx, y - cy); if (d < bd) { bd = d; best = [x, y]; } });
  if (!best) return;
  gsap.killTweensOf(hintRing);
  gsap.set(hintRing, { x: best[0], y: best[1] });
  gsap.fromTo(hintRing, { scale: .5, opacity: .95 }, { scale: 2.4, opacity: 0, duration: rm ? .01 : .9, ease: 'power2.out' });
});

// ---------- hazard card
const card = $('#card'), cd = $('#cd'), pic = $('#pic'), txt = $('#txt'), shade = $('#shade'), flyEl = $('#fly');
let openIdx = -1, busy = false, viaKey = false;
const shortB = it => (it.bullets || []).filter(b => b.length <= 96).slice(0, 2);
function openCard(i, instant) {
  if (busy || openIdx >= 0 || mks[i].classList.contains('found')) return;
  const it = items[i]; openIdx = i; busy = true;
  const sh = shortB(it), more = (it.bullets || []).filter(b => !sh.includes(b));
  txt.innerHTML = `<p class="lbl g">Hazard ${String(i + 1).padStart(2, '0')} / ${String(N).padStart(2, '0')} found</p>
    <h2 class="disp hz" id="cdT">${esc(it.need[0])}</h2>
    <p class="where">${esc(it.need[1])}.</p><i class="rule"></i>
    <p class="lbl">AVES answer${it.slot === 'vest' ? ' &middot; sister brand' : ''}</p>
    <div class="ans"><div class="cut" id="cut">${cutHTML(it)}</div><div><h3 class="disp">${esc(it.name)}</h3><p class="sku">SKU ${esc(it.sku)}</p>${it.std ? `<p class="std">${esc(it.std)}</p>` : ''}</div></div>
    <ul class="bl">${sh.map(b => `<li>${esc(b)}</li>`).join('')}${more.map(b => `<li class="more">${esc(b)}</li>`).join('')}</ul>
    <div class="btns">${more.length ? '<button type="button" id="tg" aria-expanded="false">Product details</button>' : ''}${it.url ? `<a href="${esc(it.url)}" target="_blank" rel="noopener">Visit product page</a>` : ''}<button type="button" class="x" id="cx">Close</button></div>`;
  $('#picImg').src = closeSrc(it); $('#picImg').alt = it.need[0] + ', close-up of the hazard';
  const tg = $('#tg'); tg && tg.addEventListener('click', () => { const e = txt.classList.toggle('exp'); tg.setAttribute('aria-expanded', e); tg.textContent = e ? 'Fewer details' : 'Product details'; });
  $('#cx').addEventListener('click', closeCard);
  card.classList.add('open'); card.setAttribute('aria-hidden', 'false'); stage.classList.add('cardopen');
  const r = pic.getBoundingClientRect(), [mx, my] = spot(it), d = instant || rm ? 0 : 1;
  gsap.killTweensOf([shade, pic, txt]);
  gsap.fromTo(shade, { opacity: 0 }, { opacity: 1, duration: dur(.3) * d });
  gsap.fromTo(pic, { x: mx - (r.left + r.width / 2), y: my - (r.top + r.height / 2), scale: 44 / r.width, opacity: 1 }, { x: 0, y: 0, scale: 1, duration: dur(.5) * d, ease: 'power3.out' });
  gsap.fromTo(txt, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: dur(.3) * d, delay: .22 * d, ease: 'power2.out', onComplete: () => { busy = false; } });
  (instant || rm) && (busy = false);
  $('#cx').focus({ preventScroll: true });
}
function closeCard() {
  if (openIdx < 0 || busy) return;
  busy = true; const i = openIdx, it = items[i];
  const cut = $('#cut'), cr = cut.getBoundingClientRect();
  flyEl.innerHTML = `<div class="f">${cutHTML(it)}</div>`;
  const f = flyEl.firstChild, bw = (it.l.box[2] - it.l.box[0]) * K, bh = (it.l.box[3] - it.l.box[1]) * K;
  const tx2 = mLeft + (it.l.box[0] + it.l.box[2]) / 2 * K, ty2 = mTop + (it.l.box[1] + it.l.box[3]) / 2 * K;
  const s1 = Math.max(.22, Math.min(.9, Math.min(bw / cr.width, bh / cr.height)));
  gsap.set(f, { width: cr.width, height: cr.height, xPercent: -50, yPercent: -50, x: cr.left + cr.width / 2, y: cr.top + cr.height / 2, scale: 1, opacity: 1 });
  gsap.set(cut, { opacity: 0 });
  gsap.to([pic, txt], { opacity: 0, duration: dur(.2), ease: 'power1.out' });
  gsap.to(shade, { opacity: 0, duration: dur(.35), ease: 'power1.out' });
  const t = gsap.timeline({ onComplete: () => {
    flyEl.innerHTML = ''; card.classList.remove('open'); card.setAttribute('aria-hidden', 'true'); stage.classList.remove('cardopen');
    openIdx = -1; busy = false; markFound(i);
    if (found.length === N) finish(); else if (viaKey) { const nx = mks.find(m => !m.classList.contains('found')); nx && nx.focus(); }
    viaKey = false; } });
  t.to(f, { x: tx2, duration: dur(.5), ease: 'power2.inOut' }, 0)
   .to(f, { y: ty2, duration: dur(.5), ease: 'back.in(1.1)' }, 0)
   .to(f, { scale: s1, duration: dur(.5), ease: 'power1.in' }, 0)
   .to(f, { opacity: 0, duration: dur(.14), ease: 'power1.out' }, dur(.46));
  if (rm) t.progress(1);
}
mks.forEach((m, i) => m.addEventListener('click', e => { viaKey = e.detail === 0; openCard(i); }));
addEventListener('keydown', e => { if (e.key === 'Escape') closeCard(); });
$('#shade').addEventListener('click', closeCard);
card.addEventListener('click', e => { if (!e.target.closest('.pic,.txt')) closeCard(); });

// ---------- completion
function finish(instant) {
  stage.classList.add('fin');
  const d = instant ? 0 : 1;
  gsap.to('#scFull', { opacity: 1, duration: dur(1) * d, ease: 'power1.inOut' });
  gsap.to(cam, { x: -(.80 - .33) * W, duration: dur(1.1) * d, ease: 'power2.inOut' });
  gsap.to('#sheet', { opacity: 0, duration: dur(.4) * d, onComplete: () => { $('#sheet').style.visibility = 'hidden'; } });
  gsap.set('#end', { visibility: 'visible', yPercent: -50 }); $('#end').setAttribute('aria-hidden', 'false');
  gsap.fromTo('#end', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: dur(.5) * d, delay: .7 * d, ease: 'power2.out' });
  gsap.to(mks, { opacity: 0, duration: dur(.3) * d });
}
$('#quote').addEventListener('click', e => { e.currentTarget.textContent = 'Added (preview)'; });
$('#again').addEventListener('click', () => {
  found.length = 0; worn.clear(); held = false; setLit();
  gsap.set(lys, { opacity: 0 }); gsap.set(mks, { opacity: 1 });
  mks.forEach((m, i) => { m.classList.remove('found', 'on'); m.tabIndex = 0; m.setAttribute('aria-label', `Hazard signal ${i + 1} of ${N}`); });
  rowEls.forEach(r => { r.className = ''; r.innerHTML = ''; r.removeAttribute('style'); });
  $('#cnt').textContent = 0; $('#lead').textContent = 'Sweep the site. Find the hazards.'; $('#quote').textContent = 'Add to quote';
  stage.classList.remove('fin'); $('#sheet').style.visibility = ''; gsap.set('#sheet', { opacity: 1 });
  gsap.to('#scFull', { opacity: 0, duration: dur(.6) }); gsap.to(cam, { x: 0, duration: dur(.8), ease: 'power2.inOut' });
  gsap.to('#end', { opacity: 0, duration: dur(.3), onComplete: () => { gsap.set('#end', { visibility: 'hidden' }); } }); $('#end').setAttribute('aria-hidden', 'true');
});
let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(layout, 150); });

// ---------- debug states
if (q.get('found')) q.get('found').split(',').map(n => +n - 1).filter(i => items[i]).forEach(i => markFound(i, true));
if (q.get('done')) { items.forEach((it, i) => { if (!found.includes(i)) markFound(i, true); }); finish(true); }
if (q.get('open')) openCard(+q.get('open') - 1, true);
document.documentElement.dataset.ready = '1';
})().catch(e => { window.__errs.push('boot: ' + e.message); console.error(e); });
