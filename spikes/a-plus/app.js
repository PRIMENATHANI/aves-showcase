// AVES Experience A+ spike (throwaway, 2026-11-10). One kit (Oil & Gas), desktop only.
// Shows: stockroom shelf, camera that follows the gear, a lit site, kit change in place.
(async () => {
'use strict';
const ROOT = '../../', DRESS = ROOT + 'assets/dress/';
const $ = s => document.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const q = new URLSearchParams(location.search);
const KIT = 'oil-gas', NEXT = 'construction';
const SISTER = { brand: 'Scuta', name: 'Reflector Safety Vest', sku: '3116RR71', standards: 'EN ISO 20471:2013+A1:2016 Class 2',
  why: 'Class 2 hi-vis waistcoat, two 5 cm reflective bands round the torso and one over each shoulder. Sister brand, not part of the AVES range.' };
// shelf places in the rack image (art/shelf.jpg, 1024 x 1280): centre x, board y, height
const RACK = { w: 896, h: 1280 };
const PLACE = { head: [272, 514, 104], hearing: [622, 514, 132], respiratory: [272, 702, 140], fall: [622, 702, 142],
  vest: [272, 918, 158], hand: [622, 918, 164], eye: [272, 1124, 60], dropped: [622, 1124, 150] };
// Why this item on this site, and where. MY WORDING from the kit hazards and why lines (no per-product application
// data exists in the catalogue): product management signs these off before anything formal.
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

const [kits, prods, man] = await Promise.all(['data/kits.json', 'data/products.json', 'assets/dress/manifest.json'].map(f => fetch(ROOT + f).then(r => r.json())));
const DET = await fetch('art/details.json').then(r => r.json());
const products = Object.fromEntries(prods.map(p => [p.id, p]));
const layerById = Object.fromEntries(man.layers.map(l => [l.id, l]));
const dispName = p => (p.name || p.id).replace(/\s+[–-]\s+/g, '-');
function stepsFor(kitId) {
  const kit = kits.find(k => k.id === kitId);
  return { kit, steps: man.kits[kitId].order.map(id => {
    const l = layerById[id], s = kit.slots.find(x => x.slot === l.slot), p = products[l.product];
    const need = kitId === KIT ? NEED[l.slot] : null;
    return l.slot === 'vest'
      ? { l, need, slot: 'vest', label: 'Hi-vis', name: SISTER.brand + ' ' + SISTER.name, sku: SISTER.sku, std: SISTER.standards, why: SISTER.why,
          bullets: ['Class 2 hi-vis waistcoat', 'Two 5 cm reflective bands round the torso', 'One reflective band over each shoulder'], material: '', color: '', url: '' }
      : { l, need, slot: l.slot, label: LABEL[l.slot] || s.label, name: dispName(p), sku: p.sku, std: p.standards, why: s.why, pid: p.id, ...(DET[p.id] || { bullets: [] }) };
  }) };
}
const { kit, steps } = stepsFor(KIT);
const N = steps.length;
const F = man.frame; // 896 x 1536
const layerSrc = l => DRESS + 'layers/' + encodeURIComponent(l.id) + '.png';
const cutHTML = st => st.pid
  ? `<img alt="" src="art/cut/${encodeURIComponent(st.pid)}.png">`
  : `<svg viewBox="${st.l.box[0]} ${st.l.box[1]} ${st.l.box[2] - st.l.box[0]} ${st.l.box[3] - st.l.box[1]}" preserveAspectRatio="xMidYMax meet"><image href="${layerSrc(st.l)}" width="${F.w}" height="${F.h}"/></svg>`;

// ---------- static DOM
$('#bdA').src = 'art/bg-' + KIT + '.jpg';
$('#kintro').textContent = kit.intro;
$('#khz').innerHTML = kit.hazards.map(h => `<li>${esc(h)}</li>`).join('');
$('#cntN').textContent = N;
$('#prog').innerHTML = steps.map(() => '<span></span>').join('');
const manEl = $('#man'), lit = $('#lit');
function addLayers(list, cls) {
  return list.map(st => { const im = new Image(); im.className = 'ly ' + cls; im.alt = ''; im.src = layerSrc(st.l); im.style.zIndex = st.l.z;
    // draft art: the glasses layer has temples sticking out sideways; keep the front only
    if (st.l.slot === 'eye') im.style.cssText += ';z-index:75;-webkit-mask-image:linear-gradient(90deg,transparent 41.4%,#000 42.6%,#000 56.6%,transparent 57.8%);mask-image:linear-gradient(90deg,transparent 41.4%,#000 42.6%,#000 56.6%,transparent 57.8%)';
    manEl.insertBefore(im, lit); return im; });
}
const lys = addLayers(steps, 'k1');
$('#items').innerHTML = steps.map((st, i) => `<li class="it" data-i="${i}"><span class="stock"><i>${cutHTML(st)}</i><i>${cutHTML(st)}</i></span><span class="ph">${cutHTML(st)}</span><span class="tag"><b>${String(i + 1).padStart(2, '0')}</b><em>${esc(st.name)}</em></span></li>`).join('');
$('#fly').innerHTML = steps.map(st => `<div class="f">${cutHTML(st)}</div>`).join('');
const short = st => (st.bullets || []).filter(b => b.length <= 96).slice(0, 3);
const btns = (st, i) => `<div class="btns"><button class="btn" data-det="${i}">Product details</button>${st.url ? `<a class="lnk" href="${esc(st.url)}" target="_blank" rel="noopener">Visit product page</a>` : ''}</div>`;
$('#cap').innerHTML = steps.map((st, i) => `<div class="c"><div class="c1"><i class="rule"></i><p class="lbl n"><b>${String(i + 1).padStart(2, '0')}</b>${esc(st.label)}</p><h3 class="disp">${esc(st.name)}</h3>
  <p class="sku">SKU ${esc(st.sku)}</p>${st.std ? `<p class="std"><span class="lbl">Standards</span>${esc(st.std)}</p>` : ''}${btns(st, i)}</div>
  <div class="c2"><span class="lbl">Why on this site</span><p class="need">${esc(st.need[0])}</p><p class="where">${esc(st.need[1])}</p>
  ${short(st).length ? `<span class="lbl b">Benefits</span><ul>${short(st).map(b => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}</div></div>`).join('');
let cur = steps;
const endList = list => list.map((st, i) => `<li><span>${esc(st.name)}</span><span class="m">${esc(st.label)} · ${esc(st.sku)}</span><button data-det="${i}">Details</button></li>`).join('');
const detHTML = st => `<div class="pic">${cutHTML(st)}</div><span class="lbl g">${esc(st.label)}</span><h3 class="disp">${esc(st.name)}</h3>
  <dl><div><dt>SKU</dt><dd>${esc(st.sku)}</dd></div>${st.std ? `<div><dt>Standards</dt><dd>${esc(st.std)}</dd></div>` : ''}${st.material ? `<div><dt>Material</dt><dd>${esc(st.material)}</dd></div>` : ''}${st.color ? `<div><dt>Colour</dt><dd>${esc(st.color)}</dd></div>` : ''}</dl>
  ${st.need ? `<span class="lbl sec">Why on this site</span><p class="t"><b>${esc(st.need[0])}.</b> ${esc(st.need[1])}.</p>` : ''}
  <span class="lbl sec">Why this one</span><p class="t">${esc(st.why)}</p>
  ${(st.bullets || []).length ? `<span class="lbl sec">Features and benefits</span><ul>${st.bullets.map(b => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}
  <div class="btns">${st.url ? `<a class="btn" href="${esc(st.url)}" target="_blank" rel="noopener">Visit product page</a>` : '<span class="lbl">Sister brand: no AVES product page</span>'}</div>`;
$('#endL').innerHTML = endList(steps);
const its = [...document.querySelectorAll('.it')], flies = [...document.querySelectorAll('.fly .f')], caps = [...document.querySelectorAll('.cap .c')], progs = [...document.querySelectorAll('.prog span')];
await Promise.all([...document.images].map(im => im.complete ? 0 : new Promise(r => { im.onload = im.onerror = r; })));

// ---------- geometry + timeline (rebuilt on resize)
gsap.registerPlugin(ScrollTrigger);
const stage = $('#stage'), cam = $('#cam'), bd = $('#bd'), rack = $('#rack'), track = $('#track');
let tl, st0, landAt = [], G;
function build() {
  if (tl) { tl.scrollTrigger && tl.scrollTrigger.kill(); tl.kill(); gsap.set([cam, bd, rack, '#intro', '#end', '#capshade', ...its.map(e => e.querySelector('.ph')), ...flies, ...caps, ...lys], { clearProps: 'all' }); }
  const W = stage.clientWidth, H = stage.clientHeight;
  const manH = .91 * H, k = manH / F.h, manW = F.w * k, feetY = .905 * H, top = feetY - .9577 * manH, cx = .27 * W, left = cx - manW / 2;
  const Fp = { x: .31 * W, y: .37 * H };
  G = { W, H };
  gsap.set(manEl, { left, top, width: manW, height: manH });
  gsap.set('#cast', { left, top, width: manW, height: manH, transformOrigin: '50% 95.77%', skewX: 74, scaleY: -.2 });
  gsap.set('.contact', { left: cx - manW * .3, top: feetY - 16, width: manW * .6, height: 34 });
  // rack image "cover" mapping
  const rw = rack.clientWidth, sc = Math.max(rw / RACK.w, H / RACK.h), ox = (rw - RACK.w * sc) / 2, oy = (H - RACK.h * sc) / 2, rackLeft = W - rw;
  const pos = steps.map((s, i) => { const [x, y, h] = PLACE[s.slot]; const hh = h * sc, im = its[i].querySelector('img'), ar = im ? im.naturalWidth / im.naturalHeight : (s.l.box[2] - s.l.box[0]) / (s.l.box[3] - s.l.box[1]), ww = hh * (ar || 1);
    gsap.set(its[i], { left: ox + x * sc, top: oy + y * sc, width: ww, height: hh });
    return { x: rackLeft + ox + x * sc, y: oy + y * sc - hh / 2, w: ww, h: hh }; });
  // camera for a zone of the man
  const o = { x: -.10 * W, y: -.16 * H };
  const shot = box => {
    if (!box) return { cam: { x: 0, y: 0, scale: 1 }, bd: { x: 0, y: 0, scale: 1 }, s: 1 };
    const bw = (box[2] - box[0]) * k, bh = (box[3] - box[1]) * k, p = { x: left + (box[0] + box[2]) / 2 * k, y: top + (box[1] + box[3]) / 2 * k };
    const s = Math.max(1.2, Math.min(2.1, .46 * H / bh, .34 * W / bw)), sB = 1 + (s - 1) * .34, d = .42;
    return { s, bw: bw * s, bh: bh * s, cam: { x: Fp.x - p.x * s, y: Fp.y - p.y * s, scale: s },
      bd: { x: p.x + (Fp.x - p.x) * d - o.x - (p.x - o.x) * sB, y: p.y + (Fp.y - p.y) * d - o.y - (p.y - o.y) * sB, scale: sB } };
  };
  tl = gsap.timeline({ paused: true, defaults: { ease: 'power2.inOut' }, onUpdate: sync });
  tl.addLabel('intro', 0);
  tl.to('#intro', { autoAlpha: 0, x: -50, duration: .35, ease: 'power2.in' }, .15);
  tl.fromTo(rack, { xPercent: 104, autoAlpha: 1 }, { xPercent: 0, autoAlpha: 1, duration: .7, ease: 'power3.out' }, .3);
  tl.from(its, { y: -22, autoAlpha: 0, stagger: .05, duration: .3, ease: 'power2.out' }, .62);
  let t = 1.25; landAt = [];
  tl.to('#capshade', { opacity: 1, duration: .4 }, t + .5);
  steps.forEach((s, i) => {
    const sh = shot(s.l.box), ph = its[i].querySelector('.ph'), f = flies[i], c = caps[i], a = pos[i];
    const tw = Math.max(sh.bw, 90), th = Math.max(sh.bh, 90), s0 = a.h / th;
    gsap.set(f, { width: tw, height: th, xPercent: -50, yPercent: -50, x: a.x, y: a.y, scale: s0, rotation: 0, opacity: 0 });
    tl.to(cam, { ...sh.cam, duration: .75 }, t).to(bd, { ...sh.bd, duration: .75 }, t);
    tl.to(ph, { y: -16, scale: 1.14, duration: .18, ease: 'power2.out' }, t);
    tl.set(ph, { autoAlpha: 0 }, t + .18).set(f, { opacity: 1, y: a.y - 16, scale: s0 * 1.14 }, t + .18);
    tl.to(f, { x: Fp.x, duration: .52, ease: 'power2.inOut' }, t + .18)
      .to(f, { y: Fp.y, duration: .52, ease: 'back.in(1.1)' }, t + .18)
      .to(f, { scale: 1, duration: .52, ease: 'power1.in' }, t + .18)
      .to(f, { rotation: i % 2 ? 5 : -5, duration: .26, ease: 'sine.out' }, t + .18).to(f, { rotation: 0, duration: .26, ease: 'sine.in' }, t + .44);
    tl.to(f, { opacity: 0, scale: .96, duration: .16, ease: 'power1.out' }, t + .66);
    tl.fromTo(lys[i], { opacity: 0 }, { opacity: 1, duration: .16, ease: 'power1.out' }, t + .64);
    landAt.push(t + .72);
    tl.fromTo(c, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: .24, ease: 'power2.out' }, t + .74);
    tl.fromTo(c.querySelector('.rule'), { scaleX: 0 }, { scaleX: 1, duration: .24, ease: 'power2.out' }, t + .74);
    tl.addLabel('s' + (i + 1), t + 1.05);
    tl.to(c, { autoAlpha: 0, y: -10, duration: .16, ease: 'power1.in' }, t + 1.3);
    t += 1.46;
  });
  tl.to('#capshade', { opacity: 0, duration: .3 }, t);
  const w = shot(null);
  tl.to(cam, { ...w.cam, duration: .8 }, t).to(bd, { ...w.bd, duration: .8 }, t);
  tl.to(rack, { xPercent: 104, duration: .6, ease: 'power2.in' }, t);
  tl.fromTo('#end', { autoAlpha: 0, x: 40 }, { autoAlpha: 1, x: 0, duration: .45, ease: 'power2.out' }, t + .55);
  tl.addLabel('end', t + 1.1); tl.to({}, { duration: .15 }, t + 1.1);
  track.style.height = (100 + tl.duration() * 62) + 'vh';
  sync();
  const dbg = q.get('step');
  if (dbg) { const lab = dbg === 'intro' || dbg === 'end' ? dbg : 's' + dbg; tl.seek(tl.labels[lab] + parseFloat(q.get('d') || 0), false); sync(); return; }
  st0 = ScrollTrigger.create({ animation: tl, trigger: track, start: 'top top', end: 'bottom bottom', scrub: .6,
    snap: { snapTo: 'labelsDirectional', duration: { min: .3, max: 1.1 }, delay: .15, ease: 'power1.inOut' } });
}
let lastN = -1;
function sync() {
  const tt = tl.time(), n = landAt.filter(x => tt >= x).length;
  if (n === lastN) return; lastN = n;
  $('#cntI').textContent = n;
  progs.forEach((p, i) => p.classList.toggle('on', i < n));
  its.forEach((e, i) => { e.classList.toggle('gone', i < n); e.classList.toggle('on', i === n); });
  setLit(steps.slice(0, n));
}
function setLit(worn) { const m = ['url(' + DRESS + 'base.png)', ...worn.map(s => 'url("' + layerSrc(s.l) + '")')].join(','); lit.style.webkitMaskImage = m; lit.style.maskImage = m; }
build();

// ---------- scroll, keys, clicks
const rm = matchMedia('(prefers-reduced-motion: reduce)').matches;
let lenis = null;
if (!q.get('step') && !rm && window.Lenis) {
  lenis = new Lenis({ lerp: .1, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(time => lenis.raf(time * 1000)); gsap.ticker.lagSmoothing(0);
}
const labels = () => Object.entries(tl.labels).sort((a, b) => a[1] - b[1]);
const yFor = time => st0.start + (st0.end - st0.start) * time / tl.duration();
const go = time => { const y = yFor(time); lenis ? lenis.scrollTo(y, { duration: 1.1 }) : scrollTo({ top: y, behavior: rm ? 'auto' : 'smooth' }); };
addEventListener('keydown', e => { if (!st0 || dwOpen) return; const L = labels(), now = tl.time();
  if (['ArrowDown', 'ArrowRight', 'PageDown', ' '].includes(e.key)) { const n = L.find(l => l[1] > now + .05); if (n) { e.preventDefault(); go(n[1]); } }
  if (['ArrowUp', 'ArrowLeft', 'PageUp'].includes(e.key)) { const p = L.filter(l => l[1] < now - .05).pop(); if (p) { e.preventDefault(); go(p[1]); } } });
its.forEach((e, i) => e.addEventListener('click', () => st0 && go(tl.labels['s' + (i + 1)])));

// ---------- product details drawer
const dw = $('#dw'); let dwOpen = false;
function openDet(st, instant) { $('#dwB').innerHTML = detHTML(st); dw.scrollTop = 0; dwOpen = true; dw.setAttribute('aria-hidden', 'false'); lenis && lenis.stop();
  gsap.fromTo(dw, { xPercent: 100, autoAlpha: 1 }, { xPercent: 0, autoAlpha: 1, duration: instant || rm ? 0 : .38, ease: 'power3.out' }); $('#dwX').focus({ preventScroll: true }); }
function closeDet() { if (!dwOpen) return; dwOpen = false; dw.setAttribute('aria-hidden', 'true'); lenis && lenis.start();
  gsap.to(dw, { xPercent: 100, duration: rm ? 0 : .28, ease: 'power2.in', onComplete: () => gsap.set(dw, { autoAlpha: 0 }) }); }
document.addEventListener('click', e => { const b = e.target.closest('[data-det]'); if (b) openDet((b.closest('.end') ? cur : steps)[+b.dataset.det]); });
$('#dwX').addEventListener('click', closeDet);
addEventListener('keydown', e => { if (e.key === 'Escape') closeDet(); });
let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { lastN = -1; build(); ScrollTrigger.refresh(); }, 180); });

// ---------- kit change in place: the site wipes across, the gear swaps on the man
let swapped = false;
function swap() {
  if (swapped) return; swapped = true;
  const nx = stepsFor(NEXT), bdB = $('#bdB'); bdB.src = 'art/bg-' + NEXT + '.jpg';
  const l2 = addLayers(nx.steps, 'k2');
  const x = gsap.timeline({ defaults: { ease: 'power2.inOut' } });
  x.to('#end', { autoAlpha: 0, duration: .25 }, 0);
  x.fromTo(bdB, { opacity: 1, clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 1.1, ease: 'power3.inOut' }, .1);
  x.to([...lys].reverse(), { opacity: 0, duration: .22, stagger: .06, ease: 'power1.in' }, .15);
  x.call(() => setLit([]), null, .7);
  x.to(l2, { opacity: 1, duration: .26, stagger: .13, ease: 'power1.out' }, .8);
  x.call(() => { setLit(nx.steps); $('#endT').textContent = nx.kit.title; $('#endL').innerHTML = endList(nx.steps); cur = nx.steps; $('#next').style.display = 'none'; });
  x.to('#end', { autoAlpha: 1, duration: .35 }, '>');
  return x;
}
$('#next').addEventListener('click', swap);
$('#quote').addEventListener('click', e => { e.currentTarget.textContent = 'Added (preview)'; });
if (q.get('swap')) { const x = swap(); x.progress(1); }
if (q.get('det')) openDet(steps[+q.get('det') - 1], true);
document.documentElement.dataset.ready = "1";
})().catch(e => { window.__errs.push('boot: ' + e.message); console.error(e); });
