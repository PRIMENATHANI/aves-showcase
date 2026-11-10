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
const RACK = { w: 1024, h: 1280 };
const PLACE = { head: [330, 414, 112], hearing: [700, 414, 128], respiratory: [330, 607, 122], fall: [700, 607, 128],
  eye: [330, 741, 56], dropped: [700, 741, 90], vest: [330, 880, 104], hand: [700, 880, 104] };
const LABEL = { vest: 'Hi-vis', dropped: 'Dropped objects' };

const [kits, prods, man] = await Promise.all(['data/kits.json', 'data/products.json', 'assets/dress/manifest.json'].map(f => fetch(ROOT + f).then(r => r.json())));
const products = Object.fromEntries(prods.map(p => [p.id, p]));
const layerById = Object.fromEntries(man.layers.map(l => [l.id, l]));
const dispName = p => (p.name || p.id).replace(/\s+[–-]\s+/g, '-');
function stepsFor(kitId) {
  const kit = kits.find(k => k.id === kitId);
  return { kit, steps: man.kits[kitId].order.map(id => {
    const l = layerById[id], s = kit.slots.find(x => x.slot === l.slot), p = products[l.product];
    return l.slot === 'vest'
      ? { l, slot: 'vest', label: 'Hi-vis', name: SISTER.brand + ' ' + SISTER.name, sku: SISTER.sku, std: SISTER.standards, why: SISTER.why }
      : { l, slot: l.slot, label: LABEL[l.slot] || s.label, name: dispName(p), sku: p.sku, std: p.standards, why: s.why, pid: p.id };
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
$('#items').innerHTML = steps.map((st, i) => `<li class="it" data-i="${i}"><span class="ph">${cutHTML(st)}</span><span class="tag"><b>${String(i + 1).padStart(2, '0')}</b>${esc(st.label)}</span></li>`).join('');
$('#fly').innerHTML = steps.map(st => `<div class="f">${cutHTML(st)}</div>`).join('');
$('#cap').innerHTML = steps.map((st, i) => `<div class="c"><i class="rule"></i><p class="lbl n"><b>${String(i + 1).padStart(2, '0')}</b>${esc(st.label)}</p><h3 class="disp">${esc(st.name)}</h3>
  <p class="sku">SKU ${esc(st.sku)}</p>${st.std ? `<p class="std"><span class="lbl">Standards</span>${esc(st.std)}</p>` : ''}<p class="why">${esc(st.why)}</p></div>`).join('');
const endList = list => list.map(st => `<li><span>${esc(st.name)}</span><span>${esc(st.label)} · ${esc(st.sku)}</span></li>`).join('');
$('#endL').innerHTML = endList(steps);
const its = [...document.querySelectorAll('.it')], flies = [...document.querySelectorAll('.fly .f')], caps = [...document.querySelectorAll('.cap .c')], progs = [...document.querySelectorAll('.prog span')];
await Promise.all([...document.images].map(im => im.complete ? 0 : new Promise(r => { im.onload = im.onerror = r; })));

// ---------- geometry + timeline (rebuilt on resize)
gsap.registerPlugin(ScrollTrigger);
const stage = $('#stage'), cam = $('#cam'), bd = $('#bd'), rack = $('#rack'), track = $('#track');
let tl, st0, landAt = [], G;
function build() {
  if (tl) { tl.scrollTrigger && tl.scrollTrigger.kill(); tl.kill(); gsap.set([cam, bd, rack, '#intro', '#end', ...its.map(e => e.firstElementChild), ...flies, ...caps, ...lys], { clearProps: 'all' }); }
  const W = stage.clientWidth, H = stage.clientHeight;
  const manH = .91 * H, k = manH / F.h, manW = F.w * k, feetY = .905 * H, top = feetY - .9577 * manH, cx = .27 * W, left = cx - manW / 2;
  const Fp = { x: .31 * W, y: .43 * H };
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
    const s = Math.max(1.2, Math.min(2.1, .52 * H / bh, .34 * W / bw)), sB = 1 + (s - 1) * .34, d = .42;
    return { s, bw: bw * s, bh: bh * s, cam: { x: Fp.x - p.x * s, y: Fp.y - p.y * s, scale: s },
      bd: { x: p.x + (Fp.x - p.x) * d - o.x - (p.x - o.x) * sB, y: p.y + (Fp.y - p.y) * d - o.y - (p.y - o.y) * sB, scale: sB } };
  };
  tl = gsap.timeline({ paused: true, defaults: { ease: 'power2.inOut' }, onUpdate: sync });
  tl.addLabel('intro', 0);
  tl.to('#intro', { autoAlpha: 0, x: -50, duration: .35, ease: 'power2.in' }, .15);
  tl.fromTo(rack, { xPercent: 104, autoAlpha: 1 }, { xPercent: 0, autoAlpha: 1, duration: .7, ease: 'power3.out' }, .3);
  tl.from(its, { y: -22, autoAlpha: 0, stagger: .05, duration: .3, ease: 'power2.out' }, .62);
  let t = 1.25; landAt = [];
  steps.forEach((s, i) => {
    const sh = shot(s.l.box), ph = its[i].firstElementChild, f = flies[i], c = caps[i], a = pos[i];
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
addEventListener('keydown', e => { if (!st0) return; const L = labels(), now = tl.time();
  if (['ArrowDown', 'ArrowRight', 'PageDown', ' '].includes(e.key)) { const n = L.find(l => l[1] > now + .05); if (n) { e.preventDefault(); go(n[1]); } }
  if (['ArrowUp', 'ArrowLeft', 'PageUp'].includes(e.key)) { const p = L.filter(l => l[1] < now - .05).pop(); if (p) { e.preventDefault(); go(p[1]); } } });
its.forEach((e, i) => e.addEventListener('click', () => st0 && go(tl.labels['s' + (i + 1)])));
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
  x.call(() => { setLit(nx.steps); $('#endT').textContent = nx.kit.title; $('#endL').innerHTML = endList(nx.steps); $('#next').style.display = 'none'; });
  x.to('#end', { autoAlpha: 1, duration: .35 }, '>');
  return x;
}
$('#next').addEventListener('click', swap);
$('#quote').addEventListener('click', e => { e.currentTarget.textContent = 'Added (preview)'; });
if (q.get('swap')) { const x = swap(); x.progress(1); }
document.documentElement.dataset.ready = "1";
})().catch(e => { window.__errs.push('boot: ' + e.message); console.error(e); });
