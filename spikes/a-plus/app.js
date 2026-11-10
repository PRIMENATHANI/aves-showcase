// AVES Experience A+ spike (throwaway). One kit (Oil & Gas), desktop only. Round 3, 2026-11-10.
// Stockroom shelf with real pack artwork, camera that follows the gear, callouts pinned to the product
// and to the worksite, a lit site, product focus view, kit change in place.
(async () => {
'use strict';
const ROOT = '../../', DRESS = ROOT + 'assets/dress/';
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const q = new URLSearchParams(location.search);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
// Three versions of the same scene, for him to choose between (?v=1|2|3, keys 1 2 3, switch in the header):
// 1 = title band on top, Approach artwork in the caption, "Why choose AVES" opens a category sheet
// 2 = a catalogue opener before each category (title, Why choose AVES in full, Approach), then the product
// 3 = large plain title, and a column on the right of the scene with the Why-choose headings and the Approach artwork
const V = ['1', '2', '3'].includes(q.get('v')) ? q.get('v') : '1';
document.body.classList.add('v' + V);
gsap.config({ nullTargetWarn: false });
const CATS = { head: 'Head Protection', eye: 'Eye Protection', hearing: 'Ear Protection', respiratory: 'Respiratory Protection', fall: 'Fall Protection', dropped: 'Dropped Objects', hand: 'Hand Protection', vest: 'Hi-Vis Workwear' };
const CATICON = { head: 'head', eye: 'eye', hearing: 'hearing', respiratory: 'respiratory', fall: 'fall', dropped: 'fall', hand: 'hand' };
const KIT = 'oil-gas', NEXT = 'construction';
const SISTER = { brand: 'Scuta', name: 'Reflector Safety Vest', sku: '3116RR71', standards: 'EN ISO 20471:2013+A1:2016 Class 2',
  why: 'Class 2 hi-vis waistcoat, two 5 cm reflective bands round the torso and one over each shoulder. Sister brand, not part of the AVES range.' };
// shelf places in the rack image (art/shelf.jpg, 896 x 1280): centre x, board y, product height
const RACK = { w: 896, h: 1280 };
const PLACE = { head: [300, 514, 96], hearing: [650, 514, 120], respiratory: [300, 702, 124], fall: [622, 702, 142],
  vest: [306, 918, 150], hand: [664, 918, 160], eye: [318, 1124, 54], dropped: [622, 1124, 150] };
// real pack artwork from each product's PTF (2 - LMP), front face only; [file, height in rack px, x offset from the product]
const PACK = { head: ['helmet', 132, -96], hearing: ['earmuffs', 132, -92], eye: ['glasses', 150, -104], hand: ['gloves', 172, -84], vest: ['vest', 160, -100] };
const LABEL = { vest: 'Hi-vis', dropped: 'Dropped objects' };
// Why on this site + where: MY WORDING from the kit hazards (the catalogue has no per-product application data).
// at = the place in the site photo the hazard belongs to (fractions of art/bg-oil-gas.jpg).
const NEED = {
  head: ['Falling objects', 'Under pipe racks, lifting operations and scaffolds, and in full sun on open plant', [.10, .34]],
  eye: ['Flying particles and glare', 'Outdoor plant rounds, line breaks, grinding and wire brushing', [.03, .33]],
  hearing: ['Compressor and pump noise', 'Compressor houses, pump bays and turbine areas', [.20, .47]],
  respiratory: ['Sour gas and hydrocarbon vapours', 'H2S zones: carried on the belt, pulled on only to escape', [.595, .36]],
  vest: ['Being seen', 'Plant roads, laydown yards and loading bays, around vehicles and cranes', [.17, .60]],
  fall: ['Work at height', 'Ladders, pipe racks, tank tops and platforms', [.135, .30]],
  dropped: ['Dropped tools', 'Any tool carried above people or equipment', [.16, .31]],
  hand: ['Hydrocarbons on hands', 'Handling oily pipe, hoses and valves', [.20, .50]] };
// where each of the first three benefits points on the product (fractions of the worn layer's box)
const ANCH = { head: [[.5, .2], [.86, .5], [.1, .76]], eye: [[.5, .1], [.3, .55], [.9, .38]], hearing: [[.12, .6], [.88, .6], [.5, .08]],
  respiratory: [[.3, .4], [.72, .5], [.5, .8]], vest: [[.3, .3], [.52, .62], [.74, .1]], fall: [[.5, .2], [.74, .52], [.24, .1]],
  dropped: [[.5, .18], [.5, .55], [.5, .9]], hand: [[.12, .3], [.88, .55], [.14, .85]] };

// The AVES Approach, per category, from the catalogue (REV 7). Three plain misspellings corrected
// (Versitile, Neccessary, Hygenic); "Product Hands" is printed that way and kept until the source is fixed.
const APPROACH = {
  head: ['CROWN', ['Custom comfort', 'Reinforced resistance', 'Optimised ventilation', 'Wide compatibility', 'Non slip suspension']],
  eye: ['VISION', ['Versatile protection', 'Impact resistant', 'Secure & solid fit', 'Immediate clarity', 'Optimised options', 'Necessary protection']],
  hearing: ['SOUND', ['Secure seal', 'Optimal output', 'Uniform usage', 'Noise reduction', 'Durable production']],
  respiratory: ['BREATH', ['Barrier filtration', 'Reliable seal', 'Easy breathing', 'Adaptive fit', 'Tested efficiency', 'Hygienic design']],
  hand: ['GRASP', ['Grip securely', 'Resist damage', 'Adaptable fit', 'Sensitive touch', 'Product hands']],
  fall: ['ANCHOR', ['Anatomical calibration', 'Neutral balance', 'Contoured structuring', 'Harness integrity', 'Operational clarity', 'Redundancy ready']] };
// Catalogue copy where I have read the page myself (REV 7 p. 9): it wins over the website crawl.
const CAT = { 'aves-titan-av-841r-nv': { std: 'ANSI/ISEA Z89.1-2014 Type I Class E & G, EN 397:2012+A1:2012',
  bullets: ['Modern low-profile design ensures balance, fit and stability', 'Strong HDPE outer shell for impact protection and long-term durability', 'Full brim provides 360° protection from sunlight, wind and impact', '6-point ratchet suspension system', 'Non-vented design'] } };
const [kits, prods, man, DET] = await Promise.all(['data/kits.json', 'data/products.json', 'assets/dress/manifest.json'].map(f => fetch(ROOT + f).then(r => r.json())).concat(fetch('art/details.json').then(r => r.json())));
const WHY = await fetch('art/why.json').then(r => r.json()); // 'Why Choose AVES ...?' per category, catalogue REV 7, verbatim
const products = Object.fromEntries(prods.map(p => [p.id, p]));
const layerById = Object.fromEntries(man.layers.map(l => [l.id, l]));
const dispName = p => (p.name || p.id).replace(/\s+[–-]\s+/g, '-');
function stepsFor(kitId) {
  const kit = kits.find(k => k.id === kitId);
  return { kit, steps: man.kits[kitId].order.map(id => {
    const l = layerById[id], s = kit.slots.find(x => x.slot === l.slot), p = products[l.product], need = kitId === KIT ? NEED[l.slot] : null;
    return l.slot === 'vest'
      ? { l, need, slot: 'vest', label: 'Hi-vis', name: SISTER.brand + ' ' + SISTER.name, sku: SISTER.sku, std: SISTER.standards, why: SISTER.why,
          bullets: ['Class 2 hi-vis waistcoat', 'Two 5 cm reflective bands round the torso', 'One reflective band over each shoulder'], material: '', color: '', url: '' }
      : { l, need, slot: l.slot, label: LABEL[l.slot] || s.label, name: dispName(p), sku: p.sku, std: p.standards, why: s.why, pid: p.id, ...(DET[p.id] || { bullets: [] }), ...(CAT[p.id] || {}) };
  }) };
}
const { kit, steps } = stepsFor(KIT);
const N = steps.length, F = man.frame;
const layerSrc = l => DRESS + 'layers/' + encodeURIComponent(l.id) + '.png';
// real product photos from the PTFs where we have them (art/hero), else the website cutout, else a crop of the worn layer
const HERO = new Set(['aves-titan-av-841r-nv', 'av-hm3093-cap-earmuffs', 'hg-2230-rubber-neoprene-gloves', 'full-body-harness', 'av-101373', 'scuta-vest', 'av-sg30', 'aves-escape-hood-bag']);
const cutHTML = st => HERO.has(st.l.product) ? `<img alt="" src="art/hero/${encodeURIComponent(st.l.product)}.png">` : st.pid
  ? `<img alt="" src="art/cut/${encodeURIComponent(st.pid)}.png">`
  : `<svg viewBox="${st.l.box[0]} ${st.l.box[1]} ${st.l.box[2] - st.l.box[0]} ${st.l.box[3] - st.l.box[1]}" preserveAspectRatio="xMidYMax meet"><image href="${layerSrc(st.l)}" width="${F.w}" height="${F.h}"/></svg>`;
// what leaves the shelf: the escape hood travels in its pouch, and the pouch is what he wears
const flyHTML = st => st.slot === 'respiratory' && st.pid === 'aves-escape-hood-bag' ? '<img alt="" src="art/cut/escape-pouch.png">' : cutHTML(st);
const packOf = st => st.slot === 'respiratory' && st.pid === 'aves-escape-hood-bag' ? { src: 'art/cut/escape-pouch.png', h: 70, dx: -92, pouch: 1 } : PACK[st.slot] && st.need ? { src: 'art/pack/' + PACK[st.slot][0] + '.png', h: PACK[st.slot][1], dx: PACK[st.slot][2] } : null;
const short = st => (st.bullets || []).filter(b => b.length <= 96).slice(0, 3);
const num = i => String(i + 1).padStart(2, '0');
// The AVES Approach exactly as printed: the catalogue artwork itself (art/brand/approach-<slot>.png), never retyped
const hasCat = st => !!(st.need && APPROACH[st.slot]);
const aprHTML = st => hasCat(st) ? `<img class="apr-art" src="art/brand/approach-${st.slot}.png" alt="The AVES Approach: ${APPROACH[st.slot][0]}. ${esc(APPROACH[st.slot][1].join(', '))}">` : '';
const icon = st => CATICON[st.slot] ? `<img class="ci" alt="" src="art/brand/cat-${CATICON[st.slot]}.png">` : '';
const whyBtn = (st, i) => hasCat(st) && WHY[st.slot] ? `<button class="lnk plain" data-why="${i}">Why choose AVES?</button>` : '';
const whyItems = st => WHY[st.slot].items.map(x => `<div class="wi pd-a"><b>${esc(x.h)}</b><p>${esc(x.t)}</p></div>`).join('');

// ---------- static DOM
$('#bdA').src = 'art/bg-' + KIT + '.jpg';
$('#kintro').textContent = kit.intro;
$('#khz').innerHTML = kit.hazards.map(h => `<li>${esc(h)}</li>`).join('');
$('#cntN').textContent = N;
$('#prog').innerHTML = steps.map(() => '<span></span>').join('');
const manEl = $('#man'), lit = $('#lit');
function addLayers(list, cls) {
  return list.map(st => { const im = new Image(); im.className = 'ly ' + cls; im.alt = ''; im.src = layerSrc(st.l); im.style.zIndex = st.l.z;
    // draft art: the helmet layer paints over the glasses and the temples stick out sideways
    if (st.l.slot === 'eye') im.style.cssText += ';z-index:75;-webkit-mask-image:linear-gradient(90deg,transparent 41.4%,#000 42.6%,#000 56.6%,transparent 57.8%);mask-image:linear-gradient(90deg,transparent 41.4%,#000 42.6%,#000 56.6%,transparent 57.8%)';
    manEl.insertBefore(im, lit); return im; });
}
const lys = addLayers(steps, 'k1');
$('#items').innerHTML = steps.map((st, i) => { const p = packOf(st);
  return `<li class="it${p ? ' has-pack' : ''}" data-i="${i}">${p ? `<span class="pack${p.pouch ? ' pouch' : ''}"><img alt="" src="${p.src}"></span>` : ''}<span class="ph">${cutHTML(st)}</span><span class="tag"><b>${num(i)}</b><em>${esc(st.name)}</em></span></li>`; }).join('');
$('#fly').innerHTML = steps.map(st => `<div class="f">${flyHTML(st)}</div>`).join('');
const linkBtn = (st, cls) => st.url ? `<a class="${cls}" href="${esc(st.url)}" target="_blank" rel="noopener">Visit product page</a>` : '';
$('#cap').innerHTML = steps.map((st, i) => `<div class="c"><i class="rule"></i><p class="lbl n"><b>${num(i)}</b>${esc(st.label)}</p><h3 class="disp">${esc(st.name)}</h3>
  <p class="sku">SKU ${esc(st.sku)}</p>${st.std ? `<p class="std"><span class="lbl">Standards</span>${esc(st.std)}</p>` : ''}${V === '1' ? aprHTML(st) : ''}
  <div class="btns"><button class="btn" data-det="${i}">Product details</button>${V === '2' ? '' : whyBtn(st, i)}${linkBtn(st, 'lnk')}</div></div>`).join('');
$('#ct').innerHTML = steps.map(st => `<div class="ct">${icon(st)}<b class="wide">${esc(CATS[st.slot])}</b></div>`).join('');
$('#op').innerHTML = steps.map((st, i) => V === '2' && hasCat(st) && WHY[st.slot] ? `<section class="op"><header class="op-h"><b class="wide">${esc(CATS[st.slot])}</b>${icon(st)}</header>
  <div class="op-b"><h4>${esc(WHY[st.slot].title)}</h4><div class="op-c">${WHY[st.slot].items.map(x => `<p><b>${esc(x.h)}:</b> ${esc(x.t)}</p>`).join('')}</div></div>${aprHTML(st)}</section>` : '<section class="op none"></section>').join('');
$('#wc').innerHTML = steps.map((st, i) => V === '3' && hasCat(st) ? `<div class="wc"><button class="wc-w" data-why="${i}"><span class="lbl">${esc(WHY[st.slot].title)}</span><ol>${WHY[st.slot].items.map(x => `<li>${esc(x.h)}</li>`).join('')}</ol></button>${aprHTML(st)}</div>` : '<div class="wc none"></div>').join('');
// callouts: one group per step = the hazard pinned to the site + benefits pinned to the product
$('#co').innerHTML = steps.map((st, i) => `<div class="g" data-i="${i}"><svg class="ln" aria-hidden="true"></svg>
  <div class="site"><i class="hz"></i><div><span class="lbl">Why on this site</span><p class="need">${esc(st.need[0])}</p><p class="where">${esc(st.need[1])}</p></div></div>
  ${short(st).map((b, j) => `<div class="bf" data-j="${j}"><b class="k">${j + 1}</b><p>${esc(b)}</p></div>`).join('')}</div>`).join('');
let cur = steps;
const endList = list => list.map((st, i) => `<li><span>${esc(st.name)}</span><span class="m">${esc(st.label)} · ${esc(st.sku)}</span><button data-det="${i}">Details</button></li>`).join('');
$('#endL').innerHTML = endList(steps);
const its = $$('.it'), flies = $$('.fly .f'), caps = $$('.cap .c'), cos = $$('#co .g'), progs = $$('.prog span'), cts = $$('#ct .ct'), ops = $$('#op .op'), wcs = $$('#wc .wc');
await Promise.all([...document.images].map(im => im.complete ? 0 : new Promise(r => { im.onload = im.onerror = r; })));

// ---------- geometry + timeline (rebuilt on a real resize)
gsap.registerPlugin(ScrollTrigger);
const rm = matchMedia('(prefers-reduced-motion: reduce)').matches;
const stage = $('#stage'), cam = $('#cam'), bd = $('#bd'), rack = $('#rack'), track = $('#track');
let tl, st0, landAt = [], lastN = -1, builtW = 0, builtH = 0;
function build() {
  const keep = tl ? tl.progress() : 0;
  if (tl) { st0 && st0.kill(); tl.kill(); gsap.set([cam, bd, rack, '#intro', '#end', '#capshade', '#vmark', ...its.map(e => e.querySelector('.ph')), ...flies, ...caps, ...cos, ...cts, ...ops, ...wcs, ...$$('#co .site, #co .bf'), ...lys], { clearProps: 'all' }); }
  const W = builtW = stage.clientWidth, H = builtH = stage.clientHeight;
  const manH = .91 * H, k = manH / F.h, manW = F.w * k, feetY = .905 * H, top = feetY - .9577 * manH, cx = .27 * W, left = cx - manW / 2;
  const Fp = { x: .31 * W, y: .40 * H };
  gsap.set(manEl, { left, top, width: manW, height: manH });
  gsap.set('#cast', { left, top, width: manW, height: manH, transformOrigin: '50% 95.77%', skewX: 74, scaleY: -.2 });
  gsap.set('.contact', { left: cx - manW * .3, top: feetY - 16, width: manW * .6, height: 34 });
  // rack image "cover" mapping
  const rw = rack.clientWidth, sc = Math.max(rw / RACK.w, H / RACK.h), ox = (rw - RACK.w * sc) / 2, oy = (H - RACK.h * sc) / 2, rackLeft = W - rw;
  const pos = steps.map((s, i) => { const [x, y, h] = PLACE[s.slot]; const hh = h * sc, im = its[i].querySelector('.ph img'), ar = im ? im.naturalWidth / im.naturalHeight : (s.l.box[2] - s.l.box[0]) / (s.l.box[3] - s.l.box[1]), ww = hh * (ar || 1);
    gsap.set(its[i], { left: ox + x * sc, top: oy + y * sc, width: ww, height: hh });
    const p = packOf(s), pk = its[i].querySelector('.pack'); if (pk) gsap.set(pk, { height: p.h * sc, left: ww / 2 + p.dx * sc, xPercent: -50 });
    return { x: rackLeft + ox + x * sc, y: oy + y * sc - hh / 2, w: ww, h: hh }; });
  // camera for a zone of the man; the site moves 34 % as much
  const o = { x: -.10 * W, y: -.16 * H }, bw0 = 1.2 * W, bh0 = 1.32 * H, bim = $('#bdA'), cs = Math.max(bw0 / bim.naturalWidth, bh0 / bim.naturalHeight), iw = bim.naturalWidth * cs, ih = bim.naturalHeight * cs;
  const sitePt = (f, b) => ({ x: o.x + ((bw0 - iw) * .5 + f[0] * iw) * b.scale + b.x, y: o.y + ((bh0 - ih) * .62 + f[1] * ih) * b.scale + b.y });
  const shot = box => {
    if (!box) return { cam: { x: 0, y: 0, scale: 1 }, bd: { x: 0, y: 0, scale: 1 }, s: 1 };
    const bw = (box[2] - box[0]) * k, bh = (box[3] - box[1]) * k, p = { x: left + (box[0] + box[2]) / 2 * k, y: top + (box[1] + box[3]) / 2 * k };
    const s = Math.max(1.2, Math.min(2.1, .46 * H / bh, .25 * W / bw)), sB = 1 + (s - 1) * .34, d = .42;
    return { s, bw: bw * s, bh: bh * s, cam: { x: Fp.x - p.x * s, y: Fp.y - p.y * s, scale: s },
      bd: { x: p.x + (Fp.x - p.x) * d - o.x - (p.x - o.x) * sB, y: p.y + (Fp.y - p.y) * d - o.y - (p.y - o.y) * sB, scale: sB } };
  };
  // place one step's callouts; returns nothing, writes left/top and the leader lines
  function layout(i, sh) {
    const g = cos[i], st = steps[i], z = { l: Fp.x - sh.bw / 2, r: Fp.x + sh.bw / 2, t: Fp.y - sh.bh / 2, b: Fp.y + sh.bh / 2 }, CW = 218, lines = [];
    const site = g.querySelector('.site'), pt = sitePt(st.need[2], sh.bd), SW = 286;
    const sx = 32, sy = V === '3' ? 176 : 152; gsap.set(site, { left: sx, top: sy, width: SW });
    const sh2 = site.offsetHeight, inZone = pt.x > z.l - 16 && pt.x < z.r + 16 && pt.y > z.t - 16 && pt.y < z.b + 16;
    const free = !inZone && pt.x > 20 && pt.x < rackLeft - 30 && pt.y > 96 && pt.y < H - 300 && !(pt.x < sx + SW + 24 && pt.y < sy + sh2 + 24);
    if (free) lines.push(pt.x > sx + SW ? [sx + SW, sy + .6, sx + SW + 26, sy + .6, pt.x, pt.y, 1] : [sx + 13, sy + sh2 + 8, sx + 13, sy + sh2 + 30, pt.x, pt.y, 1]);
    const sideTop = { L: sy + site.offsetHeight + 40, R: 100 }, cards = { L: [], R: [] };
    g.querySelectorAll('.bf').forEach((el, j) => { const a = (ANCH[st.slot] || [])[j] || [.5, .5], A = { x: z.l + a[0] * sh.bw, y: z.t + a[1] * sh.bh }, side = a[0] < .5 ? 'L' : 'R';
      gsap.set(el, { width: CW }); cards[side].push({ el, A, y: A.y - 20, h: el.offsetHeight }); });
    for (const side of ['L', 'R']) { const list = cards[side].sort((a, b) => a.y - b.y); let prev = sideTop[side] - 26;
      list.forEach(c => { c.y = Math.max(c.y, prev + 26); prev = c.y + c.h; });
      const maxB = side === 'L' ? H - 36 - caps[i].offsetHeight - 22 : H - 40 - (wcs[i].offsetHeight ? wcs[i].offsetHeight + 24 : 0), over = prev - maxB; if (over > 0) list.forEach(c => { c.y -= over; });
      list.forEach(c => { const x = side === 'R' ? clamp(Math.max(c.A.x + 60, z.r + 30), 0, rackLeft + 34 - CW) : clamp(Math.min(c.A.x - 60, z.l - 30) - CW, 26, W);
        gsap.set(c.el, { left: x, top: c.y }); c.el.dataset.side = side;
        lines.push(side === 'R' ? [x, c.y + .6, x - 24, c.y + .6, c.A.x, c.A.y] : [x + CW, c.y + .6, x + CW + 24, c.y + .6, c.A.x, c.A.y]); }); }
    g.querySelector('.ln').innerHTML = lines.map(l => { const f = n => n.toFixed(1), sC = l[6] ? ' class="s"' : '';
      return `<polyline pathLength="1"${sC} points="${f(l[0])},${f(l[1])} ${f(l[2])},${f(l[3])} ${f(l[4])},${f(l[5])}"/>` + (l[6]
        ? `<circle class="s" cx="${f(l[4])}" cy="${f(l[5])}" r="9"/><circle class="sd" cx="${f(l[4])}" cy="${f(l[5])}" r="2.5"/>`
        : `<circle class="o" cx="${f(l[4])}" cy="${f(l[5])}" r="9"/><circle cx="${f(l[4])}" cy="${f(l[5])}" r="4"/>`); }).join('');
  }
  tl = gsap.timeline({ paused: true, defaults: { ease: 'power2.inOut' }, onUpdate: sync });
  tl.addLabel('intro', 0);
  tl.to('#intro', { autoAlpha: 0, x: -50, duration: .35, ease: 'power2.in' }, .15);
  tl.to('#vmark', { autoAlpha: 0, duration: .35, ease: 'power1.in' }, .15);
  tl.fromTo(rack, { xPercent: 104, autoAlpha: 1 }, { xPercent: 0, autoAlpha: 1, duration: .7, ease: 'power3.out' }, .3);
  tl.from(its, { y: -22, autoAlpha: 0, stagger: .05, duration: .3, ease: 'power2.out' }, .62);
  let t = 1.25; landAt = [];
  tl.to('#capshade', { opacity: 1, duration: .4 }, t + .5);
  steps.forEach((s, i) => {
    const sh = shot(s.l.box), ph = its[i].querySelector('.ph'), f = flies[i], c = caps[i], g = cos[i], a = pos[i];
    layout(i, sh);
    if (!ops[i].classList.contains('none')) { // version 2: the category's catalogue opener comes first
      tl.to(cam, { ...sh.cam, duration: .6 }, t).to(bd, { ...sh.bd, duration: .6 }, t);
      tl.fromTo(ops[i], { autoAlpha: 0, y: 26 }, { autoAlpha: 1, y: 0, duration: .3, ease: 'power2.out' }, t + .1);
      tl.addLabel('c' + (i + 1), t + .62);
      tl.to(ops[i], { autoAlpha: 0, y: -18, duration: .2, ease: 'power1.in' }, t + .92);
      t += 1.1;
    }
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
    tl.fromTo(g, { autoAlpha: 0 }, { autoAlpha: 1, duration: .2, ease: 'power1.out' }, t + .8);
    tl.fromTo(g.querySelector('.site'), { y: -12, opacity: 0 }, { y: 0, opacity: 1, duration: .22, ease: 'power2.out' }, t + .8);
    tl.fromTo(g.querySelectorAll('.ln polyline'), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: .22, stagger: .04, ease: 'power1.out' }, t + .82);
    tl.fromTo(g.querySelectorAll('.ln circle'), { opacity: 0 }, { opacity: 1, duration: .12 }, t + .98);
    g.querySelectorAll('.bf').forEach((el, j) => tl.fromTo(el, { x: el.dataset.side === 'R' ? 16 : -16, opacity: 0 }, { x: 0, opacity: 1, duration: .2, ease: 'power2.out' }, t + .84 + j * .045));
    tl.fromTo(cts[i], { autoAlpha: 0, y: -14 }, { autoAlpha: 1, y: 0, duration: .26, ease: 'power2.out' }, t + .3);
    tl.fromTo(wcs[i], { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: .24, ease: 'power2.out' }, t + .86);
    tl.addLabel('s' + (i + 1), t + 1.08);
    tl.to([c, g, cts[i], wcs[i]], { autoAlpha: 0, duration: .16, ease: 'power1.in' }, t + 1.32);
    t += 1.5;
  });
  tl.to('#capshade', { opacity: 0, duration: .3 }, t);
  const w = shot(null);
  tl.to(cam, { ...w.cam, duration: .8 }, t).to(bd, { ...w.bd, duration: .8 }, t);
  tl.to(rack, { xPercent: 104, duration: .6, ease: 'power2.in' }, t);
  tl.fromTo('#end', { autoAlpha: 0, x: 40 }, { autoAlpha: 1, x: 0, duration: .45, ease: 'power2.out' }, t + .55);
  tl.to('#vmark', { autoAlpha: .13, duration: .45, ease: 'power1.out' }, t + .55);
  tl.addLabel('end', t + 1.1); tl.to({}, { duration: .15 }, t + 1.1);
  track.style.height = (100 + tl.duration() * 62) + 'vh';
  lastN = -1; sync();
  const dbg = q.get('step');
  if (dbg) { const lab = /^[a-z]/.test(dbg) ? dbg : 's' + dbg; tl.seek(tl.labels[lab] + parseFloat(q.get('d') || 0), false); sync(); return; }
  st0 = ScrollTrigger.create({ animation: tl, trigger: track, start: 'top top', end: 'bottom bottom', scrub: .6,
    snap: { snapTo: 'labelsDirectional', duration: { min: .3, max: 1.1 }, delay: .15, ease: 'power1.inOut' } });
  if (keep > 0) { ScrollTrigger.refresh(); scrollTo(0, st0.start + (st0.end - st0.start) * keep); }
}
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
let lenis = null;
if (!q.get('step') && !rm && window.Lenis) {
  lenis = new Lenis({ lerp: .1, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(time => lenis.raf(time * 1000)); gsap.ticker.lagSmoothing(0);
}
const labels = () => Object.entries(tl.labels).sort((a, b) => a[1] - b[1]);
const yFor = time => st0.start + (st0.end - st0.start) * time / tl.duration();
const go = time => { const y = yFor(time); lenis ? lenis.scrollTo(y, { duration: 1.1 }) : scrollTo({ top: y, behavior: rm ? 'auto' : 'smooth' }); };
addEventListener('keydown', e => { if (!st0 || pdOpen) return; const L = labels(), now = tl.time();
  if (['ArrowDown', 'ArrowRight', 'PageDown', ' '].includes(e.key)) { const n = L.find(l => l[1] > now + .05); if (n) { e.preventDefault(); go(n[1]); } }
  if (['ArrowUp', 'ArrowLeft', 'PageUp'].includes(e.key)) { const p = L.filter(l => l[1] < now - .05).pop(); if (p) { e.preventDefault(); go(p[1]); } } });
its.forEach((e, i) => e.addEventListener('click', () => st0 && go(tl.labels['s' + (i + 1)])));
// A phone or tablet fires resize whenever its address bar moves: only rebuild when the stage really changed.
let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { if (pdOpen) return;
  if (Math.abs(stage.clientWidth - builtW) < 2 && Math.abs(stage.clientHeight - builtH) < 90) return; build(); }, 200); });

// ---------- product focus view (replaces the drawer). The page never scrolls while it is open and
// comes back to exactly where it was: no lenis.stop(), no programmatic focus scroll, no rebuild.
const pd = $('#pd'); let pdOpen = false, pdY = 0, pdFrom = null, pdTl = null;
const stdHTML = s => s.split(/\s*[,·]\s*/).filter(Boolean).map(x => `<li>${esc(x)}</li>`).join('');
function pdHTML(st) { const p = packOf(st), b = st.bullets || [];
  return `<div class="pd-l"><div class="pd-pic">${cutHTML(st)}</div>${p && !p.pouch ? `<figure class="pd-pack"><img alt="" src="${p.src}"><figcaption class="lbl">How it ships</figcaption></figure>` : ''}</div>
  <div class="pd-r"><p class="lbl g pd-a">${esc(st.label)}${st.need ? ' · ' + esc(kit.name) + ' kit' : ''}</p><h3 class="disp pd-a">${esc(st.name)}</h3>
  <dl class="pd-spec pd-a"><div><dt>SKU</dt><dd>${esc(st.sku)}</dd></div>${st.material ? `<div><dt>Material</dt><dd>${esc(st.material)}</dd></div>` : ''}${st.color ? `<div><dt>Colour</dt><dd>${esc(st.color)}</dd></div>` : ''}</dl>
  ${st.std ? `<div class="pd-std pd-a"><span class="lbl">Standards</span><ul>${stdHTML(st.std)}</ul></div>` : ''}
  <div class="pd-why pd-a">${st.need ? `<div><span class="lbl">Why on this site</span><p><b>${esc(st.need[0])}.</b> ${esc(st.need[1])}.</p></div>` : ''}<div><span class="lbl">Why this one</span><p>${esc(st.why)}</p></div></div>
  ${aprHTML(st) ? `<div class="pd-a">${aprHTML(st)}</div>` : ''}
  ${b.length ? `<div class="pd-ft pd-a"><span class="lbl">Features and benefits</span><ol>${b.map((x, j) => `<li><i>${num(j)}</i><span>${esc(x)}</span></li>`).join('')}</ol></div>` : ''}
  <div class="pd-act pd-a">${st.url ? `<a class="btn" href="${esc(st.url)}" target="_blank" rel="noopener">Visit product page</a>` : '<span class="lbl">Sister brand: no AVES product page</span>'}<button class="lnk plain" data-close>Back to the kit</button></div></div>`; }
const whyHTML = st => `<div class="pd-l"><div class="why-l pd-a">${icon(st)}${aprHTML(st)}</div></div>
  <div class="pd-r"><p class="lbl g pd-a">AVES · ${esc(kit.name)} kit</p><h3 class="wide pd-a">${esc(CATS[st.slot])}</h3><h4 class="why-t pd-a">${esc(WHY[st.slot].title)}</h4>
  <div class="why-g">${whyItems(st)}</div><div class="pd-act pd-a"><button class="btn" data-det="${steps.indexOf(st)}">${esc(st.name)}: product details</button><button class="lnk plain" data-close>Back to the kit</button></div></div>`;
function openDet(st, from, instant, why) {
  $('#pdB').innerHTML = why ? whyHTML(st) : pdHTML(st); pd.classList.toggle('is-why', !!why); pdOpen = true; pdY = scrollY; pdFrom = from || null; pd.setAttribute('aria-hidden', 'false'); $('#pdB').scrollTop = 0;
  pdTl && pdTl.kill();
  pdTl = gsap.timeline({ defaults: { ease: 'power3.out' } })
    .fromTo(pd, { autoAlpha: 0 }, { autoAlpha: 1, duration: .28, ease: 'power1.out' }, 0)
    .fromTo('.pd-pic', { scale: .86, y: 34, opacity: 0 }, { scale: 1, y: 0, opacity: 1, duration: .55 }, .06)
    .fromTo('.pd-pack', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: .4 }, .3)
    .fromTo('.pd-a', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: .4, stagger: .045 }, .14);
  if (instant || rm) pdTl.progress(1);
  $('#pdX').focus({ preventScroll: true });
}
function closeDet() { if (!pdOpen) return; pdOpen = false; pd.setAttribute('aria-hidden', 'true'); pdTl && pdTl.kill();
  gsap.to(pd, { autoAlpha: 0, duration: rm ? 0 : .22, ease: 'power1.in' });
  if (pdFrom && pdFrom.isConnected) pdFrom.focus({ preventScroll: true });
  if (Math.abs(scrollY - pdY) > 2) { lenis ? lenis.scrollTo(pdY, { immediate: true, force: true }) : scrollTo(0, pdY); } }
document.addEventListener('click', e => { const y = e.target.closest('[data-why]'); if (y) { openDet(steps[+y.dataset.why], pdOpen ? pdFrom : y, false, true); return; }
  const b = e.target.closest('[data-det]'); if (b) { openDet((b.closest('.end') ? cur : steps)[+b.dataset.det], b); return; }
  if (e.target.closest('[data-close]') || e.target === pd) closeDet(); });
addEventListener('keydown', e => { if (e.key === 'Escape') closeDet(); });
// while it is open, wheel and touch moves belong to the view, never to the page behind it
for (const ev of ['wheel', 'touchmove']) pd.addEventListener(ev, e => { if (!e.target.closest('#pdB') || $('#pdB').scrollHeight <= $('#pdB').clientHeight) e.preventDefault(); e.stopPropagation(); }, { passive: false });

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
if (q.get('det')) openDet(steps[+q.get('det') - 1], null, true);
if (q.get('why')) openDet(steps[+q.get('why') - 1], null, true, true);
// version switch: same place in the story, other version
const nearLabel = () => { const now = tl.time(); return labels().filter(l => l[0][0] !== 'c').reduce((a, b) => Math.abs(b[1] - now) < Math.abs(a[1] - now) ? b : a)[0]; };
const toV = v => { if (v === V) return; try { sessionStorage.setItem('avesAt', nearLabel()); } catch (e) {} const u = new URLSearchParams(location.search); u.set('v', v); location.search = u.toString(); };
$$('#vs button').forEach(b => { b.classList.toggle('on', b.dataset.v === V); b.addEventListener('click', () => toV(b.dataset.v)); });
addEventListener('keydown', e => { if (!pdOpen && ['1', '2', '3'].includes(e.key) && !e.metaKey && !e.ctrlKey) toV(e.key); });
try { const at = sessionStorage.getItem('avesAt'); if (at && st0 && tl.labels[at] != null) { sessionStorage.removeItem('avesAt'); const y = yFor(tl.labels[at]); lenis ? lenis.scrollTo(y, { immediate: true, force: true }) : scrollTo(0, y); } } catch (e) {}
document.documentElement.dataset.ready = '1';
})().catch(e => { window.__errs.push('boot: ' + e.message); console.error(e); });
