/* The AVES Experience v0.3.1 (picker and header redesigned; stage as v0.3): picker -> walk-on -> pinned outfitting stage -> close.
   Data-driven from data/kits.json, data/products.json and assets/dress/manifest.json.
   Debug queries: ?kit=<id> (deep link), ?pick=<id> (picker, then auto-pick), ?hover=<id>,
   ?step=walk|<1..n>|close|more (jump the scroll; no Lenis, scrub locked), ?rm (force reduced motion). */
// Sister-brand items on the figure (Salman, 2026-11-06: no links; the same name / SKU / standards / why data as the AVES products).
// Facts from the PTFs (spikes/dress-v0.2-bench/refs-v2/<item>/description.txt). Never called AVES.
const SISTER = {
  vest:  { brand: 'Scuta', name: 'Reflector Safety Vest', sku: '3116RR71', standards: 'EN ISO 20471:2013+A1:2016 Class 2',
           why: 'Class 2 hi-vis waistcoat, two 5 cm reflective bands round the torso and one over each shoulder' },
  boots: { brand: 'Cavalier', name: 'Captain 8713-4 HC', sku: '73110CV214', standards: 'EN ISO 20345:2011 S3 · EN 12568:2010 non-metallic midplate',
           why: 'High-cut waterproof leather safety boot, composite toe cap, anti-static slip-resistant PU sole' },
};

(() => {
'use strict';
gsap.registerPlugin(ScrollTrigger, SplitText);

const $ = s => document.querySelector(s);
const Q = new URLSearchParams(location.search);
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches || Q.has('rm');
const STEP = Q.get('step');
const DEBUG = STEP !== null || Q.has('hover');
const ROOT = '../../';
const DRESS = ROOT + 'assets/dress/';
const FALLBACK_BASE = ROOT + 'spikes/dress-v0.2/frames/00.jpg';
// Donning order (Salman's concept): sister-brand vest goes on in the sequence.
const ORDER = ['head', 'eye', 'hearing', 'respiratory', 'face', 'vest', 'fall', 'dropped', 'hand', 'cryo-body'];
const GROUPS = ['Energy', 'Build', 'Make', 'Move', 'Extract & Handle'];
const FRAME = { w: 896, h: 1536 };
const UNIT_VH = 70;          // scroll length per timeline unit, in viewport heights (%)

let kits = [], kitById = {}, products = {}, manifest = null;
let lenis = null, tl = null, steps = [], K = null;
const bdState = {};          // kitId -> 'ok' | 'missing'

const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const isPhone = () => matchMedia('(max-width:759px)').matches;
const dispName = p => { let n = (p.name || p.id).replace(/\s+[–-]\s+/g, '-'); if (p.sku && /^\d{5,}/.test(p.sku) && n.startsWith(p.sku + ' ')) n = n.slice(p.sku.length + 1); return n; };
const hue = id => { let h = 0; for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0; return 190 + (h % 70); }; // cool, muted range
const getJSON = async (url, optional) => {
  try { const r = await fetch(url, { cache: 'no-cache' }); if (!r.ok) throw new Error(url + ' ' + r.status); return await r.json(); }
  catch (e) { if (optional) return null; throw e; }
};
const loadImg = src => new Promise(res => { const im = new Image(); im.decoding = 'async'; im.onload = () => res(im); im.onerror = () => res(null); im.src = src; });
const timeout = (p, ms) => Promise.race([p, new Promise(r => setTimeout(r, ms))]);
const offsetRel = (el, anc) => { let x = 0, y = 0; while (el && el !== anc) { x += el.offsetLeft; y += el.offsetTop; el = el.offsetParent; } return { x, y }; };

/* ---------- backdrops ---------- */
const gradHTML = k => `<div class="grad" style="--h:${hue(k.id)}"><span class="gname">${esc(k.name)}</span></div>`;
function bdHTML(k, lazy) {
  const listed = manifest && Array.isArray(manifest.backdrops) ? manifest.backdrops.includes(k.id) : null;
  if (bdState[k.id] === 'missing' || listed === false) return gradHTML(k);
  return `<img src="${DRESS}backdrops/${k.id}.jpg" alt="" ${lazy ? 'loading="lazy"' : ''} decoding="async" data-bd="${k.id}">`;
}
// A missing backdrop file swaps itself for the gradient; remembered so it is not requested again.
document.addEventListener('error', e => {
  const im = e.target;
  if (!(im instanceof HTMLImageElement) || !im.dataset.bd) return;
  const k = kitById[im.dataset.bd]; bdState[k.id] = 'missing';
  im.insertAdjacentHTML('afterend', gradHTML(k)); im.remove();
}, true);
document.addEventListener('load', e => { const im = e.target; if (im instanceof HTMLImageElement && im.dataset.bd) bdState[im.dataset.bd] = 'ok'; }, true);
document.addEventListener('click', e => { const a = e.target.closest('a[data-todo]'); if (a) e.preventDefault(); });

/* ================= picker (v0.3.1) ================= */
// Picker images: own set (v0.3.1/experience/assets/picker/<id>-{512,1024}.webp). Kits not listed yet fall back to
// the stage backdrop with a lift grade. The stage itself always uses assets/dress/backdrops.
const PIMG = new Set(['oil-gas', 'rig-drilling', 'electrical', 'construction', 'heavy-machinery', 'demolition', 'manufacturing', 'assembly-line', 'woodworking', 'mechanical', 'power-tool', 'welding', 'logistics', 'aviation', 'railway', 'mining', 'forestry', 'cryogenic']);
// Industry icons (see NOTES.md: 9 AVES brand tiles/ADS glyphs + 9 new drawings pending brand approval).
// A missing file falls back to the kit number in the same place (onerror below).
const ICON = Object.assign(Object.fromEntries(['oil-gas', 'rig-drilling', 'electrical', 'construction', 'heavy-machinery', 'demolition', 'manufacturing', 'assembly-line', 'woodworking', 'mechanical', 'power-tool', 'welding', 'logistics', 'aviation', 'railway', 'mining', 'forestry', 'cryogenic'].map(k => [k, k])), Q.has('noicon') ? { [Q.get('noicon')]: 'missing-test' } : {});   // kit -> icon file stem; drop a kit to fall back to its number
const PICK = 'assets/picker/', ICONS = 'assets/icons/';
const compact = () => matchMedia('(max-width:1023px)').matches;   // picker switches to rows of named slices below 1024
// Rest-strip focus: where the subject sits off centre, the closed slice shows it; opening pans back to the full frame.
// Value = shift as a fraction of the picture width (+ moves the picture right, showing its left part).
const FOCUS = { manufacturing: 0.27 };
const G_OPEN = 7;            // open slice = 7 rest slices wide
const ARROW = '<svg viewBox="0 0 18 12" aria-hidden="true"><path d="M0 6h16M11 1l5 5-5 5" fill="none" stroke="currentColor" stroke-width="2"/></svg>';
function pimgHTML(k, cls, n) {
  const lazy = n > 6 && compact() ? ' loading="lazy"' : '';   // compact layout scrolls: pictures past the first six load as they near the screen
  if (PIMG.has(k.id)) return `<img class="${cls}" alt="" decoding="async"${lazy} src="${PICK}${k.id}-1024.webp" srcset="${PICK}${k.id}-512.webp 512w, ${PICK}${k.id}-1024.webp 1024w" sizes="${compact() ? (isPhone() ? '34vw' : '17vw') : '560px'}" data-pk="${k.id}">`;
  return bdHTML(k, false).replace('<img ', `<img class="${cls} old" `);
}

function pickerOrder() {
  const out = [];
  GROUPS.forEach(g => kits.filter(k => k.group === g).forEach((k, i) => out.push({ k, g, first: i === 0 })));
  kits.filter(k => !GROUPS.includes(k.group)).forEach((k, i) => out.push({ k, g: k.group || 'Other', first: i === 0 }));
  return out;
}

function buildPicker() {
  const host = $('#slices'), picker = $('#picker'), order = pickerOrder(), N = order.length;
  const groups = [];
  order.forEach((o, i) => { o.n = i + 1; if (o.first) groups.push({ g: o.g, items: [] }); groups[groups.length - 1].items.push(o); });
  host.style.setProperty('--G', G_OPEN);
  host.innerHTML = groups.map((G, gi) => `<div class="grp" style="--n:${G.items.length}"><div class="gl lbl" aria-hidden="true"><b>${String(gi + 1).padStart(2, '0')}</b><span>${esc(G.g)}</span></div><div class="row">${G.items.map(({ k, n }) => {
    const num = String(n).padStart(2, '0'), ic = ICON[k.id];
    return `<button class="slice" type="button" data-id="${k.id}" aria-label="${esc(k.name)}, kit ${n} of ${N}: ${esc(k.hazards.slice(0, 3).join(', '))}">` +
      `<span class="clip"><span class="rev"><span class="foc"${FOCUS[k.id] ? ` style="--fx:${FOCUS[k.id]}"` : ''}><span class="par">${pimgHTML(k, 'pimg', n)}</span></span><span class="dim"></span><span class="veil"></span></span></span>` +
      `<span class="rest" aria-hidden="true"><span class="num">${num}</span>${ic ? `<img class="glyph" alt="" src="${ICONS}${ic}-glyph.png">` : ''}<span class="vname">${esc(k.name)}</span><span class="hname">${esc(k.name)}</span></span>` +
      `<span class="info" aria-hidden="true">${ic ? `<img class="tile" alt="" src="${ICONS}${ic}-tile.png" data-num="${num}">` : `<span class="tile ntile">${num}</span>`}<span class="kn">Kit ${num}<i>${esc(G.g)}</i></span><span class="nm disp">${esc(k.name)}</span><ul class="hz">${k.hazards.slice(0, 3).map(h => `<li>${esc(h.charAt(0).toUpperCase() + h.slice(1))}</li>`).join('')}</ul><span class="go">Dress the kit${ARROW}</span></span>` +
    `</button>`; }).join('')}</div></div>`).join('');
  const btns = [...host.querySelectorAll('.slice')];
  let cur = null;

  // fixed image width = the open width (or 4:5 of the row height if wider): the open only moves the clip edge,
  // the picture never rescales mid-open
  const size = () => {
    if (compact()) { host.style.removeProperty('--imgW'); return; }
    const gaps = (groups.length - 1) * 24 + (N - groups.length) * 2;
    const unit = (host.clientWidth - gaps) / (N - 1 + G_OPEN);
    const openW = unit * G_OPEN, rowH = host.querySelector('.row').clientHeight;
    host.style.setProperty('--imgW', Math.ceil(Math.max(openW, rowH * 0.8) + 40) + 'px');
    host.style.setProperty('--infoW', Math.floor(openW - 48) + 'px');
  };
  size(); addEventListener('resize', size);

  const infoIn = b => {
    if (RM || compact()) return;
    const kids = b.querySelectorAll('.info > *');
    gsap.killTweensOf(kids);
    gsap.fromTo(kids, { y: 22, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6, ease: 'expo.out', stagger: 0.045, delay: 0.14, overwrite: true });
    const rev = b.querySelector('.rev');
    if (!picker.classList.contains('pre')) gsap.fromTo(rev, { scale: 1.07 }, { scale: 1, duration: 1.1, ease: 'expo.out', overwrite: 'auto' });
  };
  const setOn = (b, instant) => {
    if (b === cur) return;
    gsap.set([cur, b].filter(Boolean).map(x => x.querySelector('.rest')), { clearProps: 'opacity,visibility' });   // CSS decides again (the entrance may have set them)
    cur = b;
    btns.forEach(x => x.classList.toggle('on', x === b));
    host.querySelectorAll('.grp').forEach(g => g.classList.toggle('has-on', !!b && g.contains(b)));
    if (b && !instant) infoIn(b);
    if (b && instant) gsap.set(b.querySelectorAll('.info > *'), { y: 0, autoAlpha: 1 });
  };
  let hoverT = 0;
  btns.forEach((b, i) => {
    // a short intent delay so a fast sweep across the row does not open every slice on the way
    b.addEventListener('mouseenter', () => { clearTimeout(hoverT); hoverT = setTimeout(() => setOn(b), 70); });
    b.addEventListener('mouseleave', () => clearTimeout(hoverT));
    b.addEventListener('focus', () => setOn(b));
    b.addEventListener('click', () => pick(kitById[b.dataset.id], b));
    b.addEventListener('keydown', e => {
      const map = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
      let j = null;
      if (e.key in map) j = clamp(i + map[e.key], 0, btns.length - 1);
      if (e.key === 'Home') j = 0;
      if (e.key === 'End') j = btns.length - 1;
      if (j !== null) { e.preventDefault(); btns[j].focus(); }
    });
  });
  return { btns, setOn, picker, host };
}

// Life in the picker: slow drift inside each slice, pointer depth between picture and label, one entrance.
function animatePicker(P) {
  const { btns, picker, host } = P;
  const imgs = btns.map(b => b.querySelector('.pimg'));
  if (RM) return;
  // drift: each picture pans and breathes on its own slow clock (transform only), paused when off screen.
  // Rebuilt when the layout crosses 1024 px (the base offset differs: centred fixed-width picture vs full-width).
  let drift = [];
  const startDrift = () => {
    drift.forEach(t => t && t.kill());
    drift = imgs.map((im, i) => {
      if (!im) return null;
      const base = compact() ? 0 : -50, d = (i % 2 ? 1 : -1) * (2.2 + (i * 7 % 5) * 0.35);
      gsap.set(im, { xPercent: base - d / 2, scale: 1.05, transformOrigin: '50% 60%' });
      return gsap.to(im, { xPercent: base + d / 2, scale: 1.1, duration: 15 + (i * 11 % 9), ease: 'sine.inOut', yoyo: true, repeat: -1, delay: -(i * 3.7 % 12) });
    });
  };
  startDrift();
  matchMedia('(max-width:1023px)').addEventListener('change', startDrift);
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => { const t = drift[btns.indexOf(e.target)]; if (t) e.isIntersecting ? t.resume() : t.pause(); }));
    btns.forEach(b => io.observe(b));
  }
  // pointer depth (desktop layout, fine pointer): the pictures slide against the pointer, the labels stay put
  if (matchMedia('(pointer:fine)').matches) {
    const pars = btns.map(b => b.querySelector('.par'));
    const qx = pars.map(p => gsap.quickTo(p, 'x', { duration: 0.9, ease: 'power3.out' }));
    const qy = pars.map(p => gsap.quickTo(p, 'y', { duration: 0.9, ease: 'power3.out' }));
    picker.addEventListener('pointermove', e => {
      const on = !compact(), nx = on ? e.clientX / innerWidth * 2 - 1 : 0, ny = on ? e.clientY / innerHeight * 2 - 1 : 0;
      for (let i = 0; i < pars.length; i++) { qx[i](-nx * 16); qy[i](-ny * 10); }
    });
    picker.addEventListener('pointerleave', () => { for (let i = 0; i < pars.length; i++) { qx[i](0); qy[i](0); } });
  }
  if (DEBUG || Q.has('pick')) return;
  // entrance: title, sector rails, then the slices rise left to right, labels last
  picker.classList.add('pre');
  const first = imgs.slice(0, compact() ? 6 : 18).filter(Boolean).map(im => im.decode ? im.decode().catch(() => {}) : null);
  timeout(Promise.all(first.concat(document.fonts.ready)), 1600).then(() => {
    // compact (scrolling) layout: slices below the fold rise as they scroll in, not unseen at load
    const below = compact() ? btns.filter(b => b.getBoundingClientRect().top > innerHeight) : [];
    const revs = btns.filter(b => !below.includes(b)).map(b => b.querySelector('.rev'));
    if (below.length) {
      const bRev = below.map(b => b.querySelector('.rev')), bRest = below.map(b => b.querySelector('.rest'));
      gsap.set(bRev, { y: 0, yPercent: 101 }); gsap.set(bRest, { autoAlpha: 0 });
      ScrollTrigger.batch(below, { start: 'top 92%', once: true, onEnter: els => {
        gsap.to(els.map(b => b.querySelector('.rev')), { yPercent: 0, duration: 0.9, ease: 'expo.out', stagger: 0.06, overwrite: true });
        gsap.to(els.map(b => b.querySelector('.rest')), { autoAlpha: 1, duration: 0.5, delay: 0.35, stagger: 0.06 });
      } });
    }
    const tl = gsap.timeline({ onComplete: () => gsap.set(btns.filter(b => !below.includes(b)).map(b => b.querySelector('.rest')), { clearProps: 'opacity,visibility' }) });
    gsap.set(revs, { y: 0, yPercent: 101 }); picker.classList.remove('pre');   // y:0 drops the px offset GSAP reads from the .pre CSS transform
    gsap.set(['.p-title', '.grp .gl', '.slice:not(.on) .rest', '.slice.on .info > *'], { autoAlpha: 0 });
    const split = SplitText.create('#ptitle', { type: 'chars' });
    tl.set('.p-title', { autoAlpha: 1 })
      .from(split.chars, { yPercent: 70, autoAlpha: 0, duration: 0.7, ease: 'expo.out', stagger: 0.018, onComplete: () => split.revert() }, 0)
      .from('#phint', { y: 10, autoAlpha: 0, duration: 0.6, ease: 'power2.out' }, 0.25)
      .fromTo('.grp .gl', { autoAlpha: 0, x: -12 }, { autoAlpha: 1, x: 0, duration: 0.6, ease: 'power2.out', stagger: 0.07 }, 0.2)
      .to(revs, { yPercent: 0, duration: 1.05, ease: 'expo.out', stagger: compact() ? 0.05 : 0.035 }, 0.15)
      .to(btns.filter(b => !b.classList.contains('on') && !below.includes(b)).map(b => b.querySelector('.rest')), { autoAlpha: 1, duration: 0.5, ease: 'power1.out', stagger: 0.025 }, 0.75)
      .fromTo('.slice.on .info > *', { y: 22, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6, ease: 'expo.out', stagger: 0.05 }, 0.95);
  });
}

// a missing icon file: the rest glyph goes (the number above it stays); the open tile becomes a number tile of the same footprint
document.addEventListener('error', e => {
  const im = e.target;
  if (!(im instanceof HTMLImageElement)) return;
  if (im.classList.contains('glyph')) im.remove();
  else if (im.classList.contains('tile')) { im.insertAdjacentHTML('afterend', `<span class="tile ntile">${im.dataset.num}</span>`); im.remove(); }
}, true);

let picking = false;
// kits rebuilt to the new standard open their own page (the old stage stays reachable with ?kit=<id>)
const REBUILT = { 'oil-gas': '../../v0.5/experience/' };
function pick(k, btn) {
  if (picking || !k) return; picking = true;
  if (REBUILT[k.id]) { location.href = REBUILT[k.id]; return; }
  history.pushState({ kit: k.id }, '', '?kit=' + encodeURIComponent(k.id));
  if (RM) { openKit(k, null); return; }
  const r = btn.getBoundingClientRect(), vw = innerWidth, vh = innerHeight;
  const zoom = document.createElement('div');
  zoom.className = 'zoom';
  // the picker picture grows to full screen, then the stage backdrop (with the stage grade) fades in over it,
  // so when the zoom fades out the stage beneath shows the same picture
  zoom.innerHTML = `<div class="zin">${pimgHTML(k, 'zimg').replace(/ sizes="[^"]*"/, ' sizes="100vw"')}<div class="zst">${bdHTML(k, false)}</div></div><div class="zveil"></div>`;
  document.body.appendChild(zoom);
  const zin = zoom.firstChild, zst = zin.querySelector('.zst');
  const s0 = { x: r.left, y: r.top, sx: r.width / vw, sy: r.height / vh };
  // start the overlay picture exactly where and how large the slice shows it (its box can be wider than the
  // slice and is drifting), then grow it to cover on the same progress: no jump on click
  const pim = btn.querySelector('.pimg'), zim = zin.querySelector('.zimg');
  let z0 = null;
  if (pim && zim && pim.naturalWidth) {
    const b = pim.getBoundingClientRect(), nw = pim.naturalWidth, nh = pim.naturalHeight;
    z0 = { k: Math.max(b.width / nw, b.height / nh) / Math.max(vw / nw, vh / nh),
           dx: b.left + b.width / 2 - (r.left + r.width / 2), dy: b.top + b.height / 2 - (r.top + r.height / 2) };
  }
  const apply = p => {
    const sx = lerp(s0.sx, 1, p), sy = lerp(s0.sy, 1, p);
    gsap.set(zoom, { x: lerp(s0.x, 0, p), y: lerp(s0.y, 0, p), scaleX: sx, scaleY: sy });
    gsap.set(zin, { scaleX: 1 / sx, scaleY: 1 / sy });
    if (z0) gsap.set(zim, { x: lerp(z0.dx, 0, p), y: lerp(z0.dy, 0, p), scale: lerp(z0.k, 1, p) });
  };
  apply(0);
  const all = [...document.querySelectorAll('.slice')];
  const others = all.filter(b => b !== btn), idx = others.map(b => all.indexOf(b)), mine = all.indexOf(btn);
  gsap.to(others, { yPercent: i => (idx[i] % 2 ? 100 : -100), autoAlpha: 0, duration: 0.5, ease: 'power2.in', stagger: i => Math.abs(idx[i] - mine) * 0.012 });
  gsap.to(['.p-title', '.grp .gl', btn.querySelector('.info'), btn.querySelector('.rest')], { autoAlpha: 0, duration: 0.25 });
  const pr = { p: 0 };
  gsap.to(pr, { p: 1, duration: 0.8, ease: 'power3.inOut', delay: 0.08, onUpdate: () => apply(pr.p), onComplete: () => openKit(k, zoom) });
  gsap.to(zst, { opacity: 1, duration: 0.45, ease: 'power1.inOut', delay: 0.5 });
  gsap.to(zoom.querySelector('.zveil'), { opacity: 0, duration: 0.45, ease: 'power1.out', delay: 0.1 });   // the open slice's shade lifts as it grows
}

/* ================= kit ================= */
function buildSteps(k) {
  const mk = manifest && manifest.kits && manifest.kits[k.id];
  const layers = mk && Array.isArray(mk.order) ? mk.order.map(id => (manifest.layers || []).find(l => l.id === id)).filter(Boolean) : [];
  const bySlot = Object.fromEntries(k.slots.map(s => [s.slot, s]));
  const out = [];
  const slotList = ORDER.concat(k.slots.map(s => s.slot).filter(s => !ORDER.includes(s)));
  slotList.forEach(slot => {
    if (slot === 'vest') { out.push({ slot, label: 'Hi-vis', vest: true, layer: layers.find(l => l.slot === 'vest') || null }); return; }
    const s = bySlot[slot]; if (!s) return;
    out.push({ slot, label: s.label, s, p: products[s.primary] || { id: s.primary, name: s.primary, sku: '', standards: '' }, layer: layers.find(l => l.product === s.primary) || null });
  });
  return out;
}


function cropHTML(layer) {
  // the worn layer, cropped to its box; SVG keeps the aspect in any cell size
  const [x0, y0, x1, y1] = layer.box;
  return `<svg class="crop-box" viewBox="${x0} ${y0} ${x1 - x0} ${y1 - y0}" preserveAspectRatio="xMidYMax meet" aria-hidden="true"><image href="${DRESS}layers/${encodeURIComponent(layer.id)}.png" x="0" y="0" width="${FRAME.w}" height="${FRAME.h}"/></svg>`;
}


function thumbHTML(st) {
  if (st.p) return `<img class="cut" alt="" src="${ROOT}assets/cut/${encodeURIComponent(st.p.id)}.png" data-ph="${esc(st.label)}">`;
  if (st.layer && st.onMan) return cropHTML(st.layer);
  return `<span class="ph">${esc(st.label)}</span>`;
}

document.addEventListener('error', e => {
  const im = e.target;
  if (!(im instanceof HTMLImageElement) || !im.dataset.ph) return;
  const i = im.closest('[data-i]'); const st = i ? steps[+i.dataset.i] : null;
  if (im.classList.contains('cut') && st && st.layer && st.onMan) { im.insertAdjacentHTML('afterend', cropHTML(st.layer)); im.remove(); return; }
  const cb = im.closest('.crop-box'); if (cb) { cb.insertAdjacentHTML('afterend', `<span class="ph">${esc(im.dataset.ph)}</span>`); cb.remove(); return; }
  if (im.classList.contains('alt-cut')) { im.remove(); return; }
  im.insertAdjacentHTML('afterend', `<span class="ph">${esc(im.dataset.ph)}</span>`); im.remove();
}, true);

const SISTER_NOTE = 'sister brand, not part of the AVES range';

const altLabel = a => esc(dispName(a)) + (a.sku && a.sku !== dispName(a) ? ' · ' + esc(a.sku) : '');
// "one worn, the rest options": the slot's alternates as ghost cutouts (desktop) or a one-line list (phone)
function altsHTML(s) {
  const alts = (s.alternates || []).map(id => products[id]).filter(Boolean);
  if (!alts.length) return '';
  return `<div class="alts"><span class="lbl">Options</span><ul>${alts.map(a =>
    `<li><img class="alt-cut" alt="" src="${ROOT}assets/cut/${encodeURIComponent(a.id)}.png" data-ph="x" loading="lazy"><span>${altLabel(a)}</span></li>`).join('')}</ul>` +
    `<p class="alt-line"><span class="lbl">Options</span>${alts.map(altLabel).join(', ')}</p></div>`;
}
function detailHTML(st, i) {
  const num = String(i + 1).padStart(2, '0');
  const off = st.onMan ? '' : `<p class="skip">${st.layer && st.layer.status === 'skipped' ? 'Stays on the shelf: not drawn on the figure with this kit.' : 'On the shelf only: not drawn on the figure yet.'}</p>`;
  if (st.vest) { const v = SISTER.vest; return `<div class="dt" data-i="${i}">
    <div class="sl2 lbl"><b>${num}</b>Hi-vis</div>
    <h3 class="nm disp">${esc(v.brand + ' ' + v.name)}</h3>
    <p class="sku"><b>SKU</b>${esc(v.sku)}</p>
    <p class="std"><span class="lbl">Standards</span>${esc(v.standards)}</p>
    <p class="why">${esc(v.why)}. By ${esc(v.brand)}: ${SISTER_NOTE}.</p>${off}</div>`; }
  const p = st.p, s = st.s;
  return `<div class="dt" data-i="${i}">
    <div class="sl2 lbl"><b>${num}</b>${esc(st.label)}</div>
    <h3 class="nm disp">${esc(dispName(p))}</h3>
    ${p.sku ? `<p class="sku"><b>SKU</b>${esc(p.sku)}</p>` : ''}
    <p class="std"><span class="lbl">Standards</span>${p.standards ? esc(p.standards) : 'None listed in the catalogue data'}</p>
    <p class="why">${esc(s.why)}</p>${off}
    ${altsHTML(s)}
  </div>`;
}


function itemHTML(st, i) {
  const num = String(i + 1).padStart(2, '0');
  const txt = st.vest ? `Hi-vis vest<span class="by">by Scuta</span>` : esc(st.label);
  return `<li class="si" data-i="${i}"><span class="ca">${thumbHTML(st)}<span class="bar"></span></span><span class="sl"><b>${num}</b><span class="t">${txt}</span></span></li>`;
}

async function resolveBase(k) {
  const mk = manifest && manifest.kits && manifest.kits[k.id];
  const cands = [];
  if (mk && mk.base) cands.push(DRESS + mk.base);            // optional per-kit override, declared in the manifest
  cands.push(DRESS + 'base.png');
  for (const c of cands) { const im = await loadImg(c); if (im) return { src: c, jpg: false }; }
  return { src: FALLBACK_BASE, jpg: true };
}

async function openKit(k, zoom) {
  K = k;
  document.title = k.name + ' · The AVES Experience';
  steps = buildSteps(k);
  const n = steps.length;

  // texts
  $('#kt').textContent = k.title;
  $('#ki').textContent = k.intro;
  $('#hzl').innerHTML = k.hazards.slice(0, 3).map(h => `<li>${esc(h)}</li>`).join('');
  $('#kn').textContent = k.name;
  $('#bd').innerHTML = bdHTML(k, false);
  $('#aftT').textContent = k.title;
  const prim = steps.filter(s => s.p);
  $('#aftS').textContent = `${prim.length} AVES products, one per slot. Hi-vis by Scuta, boots by Cavalier: sister brands, not part of the AVES range.`;
  const sisterRows = [['Hi-vis', SISTER.vest], ['Boots', SISTER.boots]].map(([l, v]) => `<li class="sister"><span class="s">${l}</span><span class="n">${esc(v.brand + ' ' + v.name)}</span><span class="k">${esc(v.sku)}</span></li>`);
  $('#plist').innerHTML = prim.map(s => `<li><span class="s">${esc(s.label)}</span><span class="n">${esc(dispName(s.p))}</span><span class="k">${esc(s.p.sku)}</span></li>`).concat(sisterRows).join('');
  $('#orow').innerHTML = pickerOrder().filter(o => o.k.id !== k.id).map(({ k: o }) =>
    `<a class="oslice" href="?pick=${encodeURIComponent(o.id)}" aria-label="${esc(o.name)}">${bdHTML(o, true)}<span class="veil"></span><span class="vname">${esc(o.name)}</span></a>`).join('');

  // the man: base + this kit's layers only (nothing else preloads)
  const man = $('#man');
  const base = await resolveBase(k);
  man.classList.toggle('fallback-jpg', base.jpg);
  man.innerHTML = `<img class="base" alt="Worker in coverall and boots" src="${base.src}">`;
  const okLayers = steps.filter(s => s.layer && s.layer.status === 'ok');
  const loaded = await timeout(Promise.all(okLayers.map(s => loadImg(DRESS + 'layers/' + encodeURIComponent(s.layer.id) + '.png').then(im => { s.img = im; }))), 15000);
  const onIds = new Set();
  steps.forEach(s => { s.onMan = !!(s.layer && s.layer.status === 'ok' && s.img); if (s.onMan) onIds.add(s.layer.product); });
  // a dependent layer (earmuffs on the helmet, tether on the harness) needs its host on the figure
  steps.forEach(s => { if (s.onMan && s.layer.dependsOn && !onIds.has(s.layer.dependsOn)) s.onMan = false; });
  steps.forEach((s, i) => {
    if (!s.onMan) return;
    const im = document.createElement('img');
    im.className = 'ly'; im.alt = ''; im.src = s.img.src; im.dataset.i = i;
    im.style.zIndex = String(s.layer.z || (i + 1));
    man.appendChild(im); s.ly = im;
  });

  // shelf
  const b = SISTER.boots;
  $('#shbase').innerHTML = `<span class="lbl">Boots</span><b>${esc(b.brand + ' ' + b.name)}</b> · SKU ${esc(b.sku)}<span class="std"> · EN ISO 20345 S3</span>`;   // one line; standards hidden on phone; full standards + sister-brand note in the close list
  $('#grid').innerHTML = steps.map(itemHTML).join('');
  const rows = Math.ceil(steps.length / 2);
  if (!isPhone()) $('#grid').style.setProperty('--cellH', (rows <= 4 ? 106 : rows === 5 ? 86 : 74) + 'px');
  $('#prog').innerHTML = steps.map(() => '<span></span>').join('');
  $('#shdetail').innerHTML = steps.map(detailHTML).join('');
  const theatre = $('#theatre');
  theatre.querySelectorAll('.fly').forEach(f => f.remove());
  steps.forEach((s, i) => {
    if (!s.onMan || RM) return;
    const f = document.createElement('div');
    f.className = 'fly'; f.setAttribute('aria-hidden', 'true');
    f.innerHTML = s.p ? `<img class="cut" alt="" src="${ROOT}assets/cut/${encodeURIComponent(s.p.id)}.png" data-ph="${esc(s.label)}">` : cropHTML(s.layer);
    f.dataset.i = i; theatre.appendChild(f); s.fly = f;
  });

  document.body.classList.remove('mode-pick');
  document.body.classList.add('mode-kit');
  window.scrollTo(0, 0);
  if (lenis) lenis.scrollTo(0, { immediate: true });
  if (zoom) gsap.to(zoom, { autoAlpha: 0, duration: 0.35, delay: 0.1, onComplete: () => zoom.remove() });

  await timeout(document.fonts.ready, 3000);
  buildTimeline();
  walkOn();
  ScrollTrigger.refresh();
  // late images (shelf cutouts, backdrop) can change nothing in layout, but refresh once more when everything is in
  window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
  if (STEP !== null) jump(STEP);
  document.documentElement.dataset.ready = '1';
}


function buildTimeline() {
  const theatre = $('#theatre'), n = steps.length;
  const items = [...document.querySelectorAll('.si')];
  const D = v => (RM ? 0.01 : v);
  const total = 1 + n + 1.4;
  gsap.set('#shelf', { autoAlpha: 0, x: RM ? 0 : 24 });
  gsap.set('#closeline', { autoAlpha: 0, y: RM ? 0 : 16 });
  steps.forEach(s => { if (s.ly) gsap.set(s.ly, { autoAlpha: 0, y: RM ? 0 : 8 }); if (s.fly) gsap.set(s.fly, { autoAlpha: 0 }); });

  tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: theatre, start: 'top top',
      end: () => '+=' + Math.round(total * UNIT_VH / 100 * innerHeight),
      scrub: DEBUG || RM ? true : 1, pin: true, anticipatePin: 1, invalidateOnRefresh: true,
      onUpdate: self => count(self.progress * total),
    },
  });
  tl.to('#cue', { autoAlpha: 0, duration: D(0.25) }, 0)
    .to('#intro', { autoAlpha: 0, y: RM ? 0 : -16, duration: D(0.45) }, 0.15)
    .to('#shelf', { autoAlpha: 1, x: 0, duration: D(0.45) }, 0.45);
  if (!RM) tl.fromTo('#bd', { yPercent: 0 }, { yPercent: -6, duration: total }, 0);

  // shelf cutout -> its layer box on the man (desktop; the phone row scrolls, so no fly there)
  const startXY = i => { const ca = items[i].querySelector('.ca'), f = steps[i].fly, o = offsetRel(ca, theatre); return { x: o.x + (ca.offsetWidth - f.offsetWidth) / 2, y: o.y + ca.offsetHeight - 4 - f.offsetHeight }; };
  const target = s => {
    const walk = $('#walk'), sc = walk.offsetWidth / FRAME.w;
    const [x0, y0, x1, y1] = s.layer.box, fw = s.fly.offsetWidth, fh = s.fly.offsetHeight;
    return { x: walk.offsetLeft + (x0 + x1) / 2 * sc - fw / 2, y: walk.offsetTop + (y0 + y1) / 2 * sc - fh / 2, s: clamp((x1 - x0) * sc / fw, 0.6, 2.6) };
  };
  steps.forEach((s, i) => {
    const t = 1 + i;
    if (s.fly) {
      tl.fromTo(s.fly, { x: () => startXY(i).x, y: () => startXY(i).y, scale: 1 },
        { x: () => target(s).x, y: () => target(s).y, scale: () => target(s).s, duration: 0.55, ease: 'power1.inOut', immediateRender: false }, t + 0.05)
        .to(s.fly, { autoAlpha: 1, duration: 0.08 }, t + 0.05)
        .to(s.fly, { autoAlpha: 0, duration: 0.16 }, t + 0.5);
    }
    if (s.ly) tl.to(s.ly, { autoAlpha: 1, y: 0, duration: D(0.35), ease: 'power1.out' }, t + (RM ? 0 : 0.45));
  });
  const tc = 1 + n;
  tl.to('#shelf', { autoAlpha: 0, x: RM ? 0 : 16, duration: D(0.4) }, tc + 0.1)
    .to('#dark', { opacity: 0.55, duration: D(0.6) }, tc + 0.1)
    .to('#closeline', { autoAlpha: 1, y: 0, duration: D(0.5) }, tc + 0.45)
    .to({}, { duration: 0.01 }, total - 0.01);
  count(0);
}

let lastK = -1;

function count(t) {
  const n = steps.length;
  // active step index: -1 before the first step, n after the last (close)
  const a = t < 1 ? -1 : Math.min(n, Math.floor(t - 1));
  if (a === lastK) return; lastK = a;
  const shown = clamp(a + 1, 0, n);
  $('#cnt').innerHTML = `<i>${shown}</i>/ ${n}`;
  document.querySelectorAll('.si').forEach((el, i) => { el.classList.toggle('on', i === a); el.classList.toggle('past', i < a); });
  document.querySelectorAll('.dt').forEach((el, i) => el.classList.toggle('on', i === clamp(a, 0, n - 1)));
  document.querySelectorAll('#prog span').forEach((el, i) => el.classList.toggle('on', i <= a && a < n || a >= n));
  if (isPhone() && a >= 0 && a < n) {
    const g = $('#grid'), cell = g.children[a];
    g.scrollTo({ left: Math.max(0, cell.offsetLeft - 16 - 2 * 64), behavior: RM || DEBUG ? 'auto' : 'smooth' });
  }
}

function walkOn() {
  if (RM || STEP !== null) return;
  const walk = $('#walk');
  gsap.fromTo(walk, { x: () => innerWidth - walk.offsetLeft + 40 }, { x: 0, duration: 0.9, ease: 'power2.out' });
  const split = SplitText.create('#kt', { type: 'words' });
  gsap.from(split.words, { y: 22, autoAlpha: 0, duration: 0.5, stagger: 0.05, delay: 0.55, ease: 'power2.out', onComplete: () => split.revert() });
  gsap.from(['#ki', '.intro .hzh', '#hzl li'], { y: 12, autoAlpha: 0, duration: 0.45, stagger: 0.06, delay: 0.85, ease: 'power2.out' });
  gsap.from('#cue', { autoAlpha: 0, duration: 0.4, delay: 1.3 });
}

function jump(step) {
  const st = tl.scrollTrigger, n = steps.length, total = 1 + n + 1.4;
  if (step === 'more') { window.scrollTo(0, $('#after').getBoundingClientRect().top + scrollY); ScrollTrigger.update(); return; }
  let t = 0;
  if (step === 'close') t = total;
  else if (step !== 'walk') t = clamp(parseInt(step, 10) || 1, 1, n) + 0.92;
  window.scrollTo(0, Math.round(st.start + (st.end - st.start) * (t / total)));
  ScrollTrigger.update();
  tl.progress(t / total);
  document.documentElement.dataset.dbg = JSON.stringify({ y: Math.round(scrollY), start: Math.round(st.start), end: Math.round(st.end), p: +(t / total).toFixed(3), h: document.documentElement.scrollHeight });
}

/* ================= boot ================= */
async function boot() {
  if (RM) document.body.classList.add('rm');
  const [k, p, m] = await Promise.all([getJSON(ROOT + 'data/kits.json'), getJSON(ROOT + 'data/products.json'), getJSON(DRESS + 'manifest.json', true)]);
  kits = k; manifest = m;
  kits.forEach(x => { kitById[x.id] = x; });
  p.forEach(x => { products[x.id] = x; });
  if (manifest && Array.isArray(manifest.backdrops)) kits.forEach(x => { if (!manifest.backdrops.includes(x.id)) bdState[x.id] = 'missing'; });

  if (!RM && !DEBUG) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  const toast = () => { const t = $('#toast'); t.classList.add('on'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('on'), 2200); };
  $('#addq').addEventListener('click', toast);
  $('#addq2').addEventListener('click', toast);
  window.addEventListener('popstate', () => location.reload());

  const deep = Q.get('kit');
  if (deep && kitById[deep]) { openKit(kitById[deep], null); return; }
  const P = buildPicker();
  const hv = Q.get('hover');
  P.setOn((hv && kitById[hv] && P.btns.find(b => b.dataset.id === hv)) || P.btns[0], true);
  animatePicker(P);
  document.documentElement.dataset.ready = '1';
  const pk = Q.get('pick');
  if (pk && kitById[pk]) {
    const b = P.btns.find(x => x.dataset.id === pk);
    P.setOn(b); b.focus({ preventScroll: true });
    setTimeout(() => pick(kitById[pk], b), RM ? 0 : 450);
  }
}
boot().catch(e => console.error(e && e.stack || e));
})();
