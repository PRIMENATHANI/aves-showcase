// The AVES Experience v0.9: kit pages rebuilt to comps v0.1 (FigCraft) and motion v0.1 (EffectCraft, motion.json).
// Data and assets unchanged: data/<kit>.json + assets/ from v0.6 through <base>. Every line on screen comes from the data.
// Desktop: three columns (hazard + kit rail | worker | product), one GSAP timeline scrubbed by ScrollTrigger + Lenis, snapping to
// the end of each item (all features lit). The worker is reframed per item category by ONE transform on #cam (scale + translate);
// the worn layers sit inside it, so they stay registered at every framing. Phone: a full-screen stepper played label to label.
// Debug: ?kit=<id>&step=intro|1..n|end&d=<s>&t=<s>&det=<n>&tab=<n>&m=1|0&gl=0&rm=1
(async () => {
'use strict';
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const AB = new URL('.', document.baseURI).href, TB = new URL('../../v0.9/experience/assets/type/', document.baseURI).href;
const q = new URLSearchParams(location.search), clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const KIT = q.get('kit') || 'oil-gas';
const [D, TYPE, LINES] = await Promise.all([fetch(`data/${KIT}.json`).then(r => r.json()), fetch('assets/type/type.json').then(r => r.json()), fetch(TB + 'lines.json').then(r => r.json())]);
const steps = D.steps, N = steps.length, F = D.frame, kit = D.kit;
const SLOT = { head: 'Head', eye: 'Eye', face: 'Face', hearing: 'Hearing', respiratory: 'Respiratory', vest: 'Hi-vis', fall: 'Fall', dropped: 'Dropped objects', hand: 'Hand', 'cryo-body': 'Body' };
document.title = `The AVES Experience: ${kit.name}`; $$('.ktile').forEach(im => { im.src = kit.tile; });
const num = i => String(i + 1).padStart(2, '0');
const cap1 = s => String(s).charAt(0).toUpperCase() + String(s).slice(1);
const ty = (key, tag = 'span') => { const t = TYPE[key]; return t ? `<${tag} class="ty" role="img" aria-label="${esc(t.text)}" style="--m:url(${AB}assets/type/${key}.png);--ar:${(t.w / t.h).toFixed(4)}"></${tag}>` : ''; };
// a heading as pictures of its lines (catalogue face, v0.9/tools/typeset_lines.py); the line count is chosen to fit (fitL)
const tyL = key => LINES[key] ? `<span class="tl" data-k="${key}" role="img" aria-label="${esc(LINES[key].text)}"></span>` : ty(key);
function fitL(el, maxW, size, maxN = 3) {
  const t = LINES[el.dataset.k]; if (!t) return 0;
  const c = [1, 2, 3].filter(n => t.sets[n] && n <= maxN).map(n => { const s = t.sets[n], ar = Math.max(...s.map(l => l.w)) / t.h; return { n, s, h: Math.min(size, maxW / ar) }; });
  const p = c.find(x => x.h >= size * .999) || c.reduce((a, b) => b.h > a.h * 1.08 ? b : a);
  el.innerHTML = p.s.map((l, i) => `<span class="ty" role="img" aria-label="${esc(l.t)}" style="--m:url(${TB}${el.dataset.k}-${p.n}-${i}.png);--ar:${(l.w / t.h).toFixed(4)};--h:${p.h.toFixed(2)}px"></span>`).join('');
  el.style.setProperty('--h', p.h.toFixed(2) + 'px'); return p.h;
}
const HI = (window.devicePixelRatio || 1) >= 1.75;
const firstSentence = t => { const m = String(t).match(/^(.*?[.!?])(?=\s|$)/); return (m ? m[1] : String(t)).trim(); };
const feats = st => st.mkt ? st.mkt.features : st.short.map(b => ({ title: '', line: b }));
const layerSrc = st => HI && st.layer2x ? st.layer2x.split('/').map(encodeURIComponent).join('/') : 'assets/layers/' + encodeURIComponent(st.layer) + '.png';
// the catalogue caption for 'fall' covers two slots ("FALL PROTECTION & DROPPED OBJECTS"): a harness step shows its own half; dropped-object steps keep the whole caption
const catName = st => { const t = (TYPE['cat-' + st.cat] || { text: SLOT[st.slot] }).text; return st.slot === 'fall' && / & /.test(t) ? t.split(' & ')[0] : t; };
if (!window.gsap) throw new Error('GSAP did not load');
gsap.registerPlugin(ScrollTrigger); gsap.config({ nullTargetWarn: false });
const rm = matchMedia('(prefers-reduced-motion: reduce)').matches || q.has('rm');
const isPhone = () => innerWidth < 820 || innerWidth / innerHeight < .9;
const PH = q.get('m') === '1' || (q.get('m') !== '0' && isPhone());
document.documentElement.classList.toggle('m', PH);
const HZSVG = {}; await Promise.all((D.hz || []).map(id => fetch(`assets/hz/${id}.svg`).then(r => r.ok ? r.text() : '').then(t => { const m = t.match(/<svg[\s\S]*<\/svg>/); if (m) HZSVG[id] = m[0].replace(/<svg/, '<svg aria-hidden="true" focusable="false"'); }).catch(() => {})));
const hzi = id => HZSVG[id] ? `<i class="hzi sv">${HZSVG[id]}</i>` : '<i class="hzi tri"></i>';
const kHz = i => (kit.hazardIcons || [])[i] || '';
// framing windows per item category, art units (896 x 1536), from comps v0.1 tokens.json. face and cryo-body have no window in the
// tokens: face = bust, cryo-body = full body. Where the worn item lies outside its window (the face-worn half masks under
// "respiratory"), the smallest of bust / torso / full body that holds it is used instead (NOTES: deviations).
const BUST = [60, 640], TORSO = [60, 1100], FULL = [60, 1536];
const WIN = { head: BUST, eye: BUST, hearing: BUST, face: BUST, vest: TORSO, respiratory: [480, 1200], dropped: [480, 1200], hand: [480, 1200], fall: FULL, 'cryo-body': FULL, boots: [900, 1536] };
const winFor = st => { const w = WIN[st.slot] || FULL, b = st.box, inside = x => b[1] >= x[0] - 1 && b[3] <= x[1] + 1; return inside(w) ? w : [BUST, TORSO, FULL].find(inside) || FULL; };

// ---------- static DOM (shared)
$('#bdA').src = D.backdrop;
const manEl = $('#man'); if (HI && D.base2x) manEl.querySelector('.base').src = D.base2x;
const lys = steps.map(st => { const im = new Image(); im.className = 'ly'; im.alt = ''; im.src = layerSrc(st); im.style.zIndex = st.z; manEl.appendChild(im); return im; });
const lyMask = () => steps.forEach((st, i) => { lys[i].style.zIndex = st.z; if (st.mask) lys[i].style.cssText += `;-webkit-mask-image:${st.mask};mask-image:${st.mask}`; });
lyMask();
$('#fly').innerHTML = steps.map(st => `<div class="f"><img alt="" src="${st.fly || st.image}"></div>`).join('');
const NUMW = ['', 'One hazard', 'Two hazards', 'Three hazards', 'Four hazards', 'Five hazards', 'Six hazards', 'Seven hazards'];
const kickT = `Kit ${num(kit.index - 1)} / ${kit.of} · ${kit.group}`, leadT = kit.intro, hzNT = `${NUMW[kit.hazards.length] || kit.hazards.length + ' hazards'} on this site`;
const hazLis = kit.hazards.map((h, i) => `<li>${hzi(kHz(i))}<span>${esc(cap1(h))}</span></li>`).join('');
const hasVest = steps.some(s => s.slot === 'vest');
const sisT = hasVest ? 'Hi-vis by Scuta, boots by Cavalier: sister brands.' : 'Boots by Cavalier: a sister brand.';
const bootsT = `Boots: ${D.boots.name} · SKU ${D.boots.sku} · ${D.boots.standards}`;

// ---------- desktop DOM
$('#kick').textContent = kickT; $('#kname').innerHTML = tyL('kit-' + kit.id); $('#kintro').textContent = leadT; $('#khzN').textContent = hzNT; $('#khz').innerHTML = hazLis;
$('#kitlnk').textContent = $('#pdKit').textContent = `${kit.name} PPE kit`;
$('#boardT').innerHTML = ty('end-' + kit.id);
$('#boardG').innerHTML = steps.map((st, i) => `<li><span class="bp"><img alt="" src="${st.image}"></span><i class="bl"></i><b class="label"><em>${num(i)}</em>${esc(SLOT[st.slot])}</b><span class="bn">${esc(st.name)}</span></li>`).join('');
$('#hzs').innerHTML = steps.map(st => `<div class="hzb"><p class="hk">${hzi(st.hazard.icon)}<span class="label">The hazard</span></p><p class="ht">${esc(st.hazard.title)}</p><p class="hw">${esc(st.hazard.where)}</p>
  <i class="hl"></i><i class="hd"></i><i class="hp"></i></div>`).join('');
$('#pbs').innerHTML = steps.map((st, i) => { const c = D.cats[st.cat] || {}, hook = st.mkt && st.mkt.hook;
  return `<div class="pb"><p class="cat">${c.icon ? `<img class="ci" alt="" src="${c.icon}">` : ''}<b class="cn">${num(i)}</b><span class="cname">${esc(catName(st))}</span></p>
  <h3 class="pn">${tyL('name-' + st.product)}</h3><p class="sub">${esc(st.descriptor)}</p><i class="acc"></i>${hook ? `<p class="hook">${esc(hook)}</p>` : ''}
  <ol class="fs">${feats(st).map((f, k) => `<li><i class="dv"></i><i class="dvo"></i><b class="fn">${num(k)}</b><b class="fn on">${num(k)}</b><div class="fx">${f.title ? `<strong class="ft">${esc(f.title)}</strong>` : ''}<span class="fl">${esc(f.line)}</span></div></li>`).join('')}</ol><i class="dv dl"></i>
  <dl class="meta">${st.mkt && st.mkt.system ? `<div class="mw"><dt class="label">Works with</dt><dd>${esc(st.mkt.system)}</dd></div>` : ''}${st.standards ? `<div class="ms"><dt class="label">Standards</dt><dd>${esc(st.standards)}</dd></div>` : ''}</dl>
  <p class="acts"><button class="lnk" data-det="${i}">Product details</button>${st.url ? `<a class="lnk2" href="${esc(st.url)}" target="_blank" rel="noopener">Visit product page<svg class="ne" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 9 9 3M4 3h5v5" fill="none" stroke="currentColor" stroke-width="2"/></svg></a>` : ''}<span class="sku">SKU ${esc(st.sku)}</span></p></div>`; }).join('');
$('#cnts').innerHTML = steps.concat([0]).map((_, i) => `<i>${i} / ${N}</i>`).join('');
$('#segs').innerHTML = steps.map(() => '<i class="sb"><i class="so"></i></i>').join('');
$('#rl').innerHTML = steps.map((st, i) => `<li><b class="rn">${num(i)}</b><b class="rn on">${num(i)}</b><span class="rt"><img alt="" src="${st.image}"></span><span class="rm"><span class="rnm">${esc(st.name)}</span><span class="rnm on">${esc(st.name)}</span></span></li>`).join('');
$('#endT').innerHTML = tyL('end-' + kit.id); $('#sis').textContent = sisT; $('#boots').textContent = bootsT;
$('#endList').innerHTML = steps.map((st, i) => `<li><b class="en">${num(i)}</b><span class="et2"><img alt="" src="${st.image}"></span><span class="ex"><b>${esc(st.name)}</b><span>${esc(SLOT[st.slot])} · SKU ${esc(st.sku)}</span></span><button class="ed label" data-det="${i}">Details</button></li>`).join('');

// ---------- phone DOM
$('#mKick').textContent = kickT; $('#mName').innerHTML = tyL('kit-' + kit.id); $('#mLead').textContent = leadT; $('#mHzN').textContent = hzNT; $('#mHz').innerHTML = hazLis;
$('#mKitT').textContent = (TYPE['end-' + kit.id] || { text: kit.title }).text; $('#mCntN').textContent = N;
$('#mRail').innerHTML = steps.map((st, i) => `<li data-go="${i}"><span class="ph"><img alt="" src="${st.image}"></span></li>`).join('');
$('#mSteps').innerHTML = steps.map((st, i) => { const c = D.cats[st.cat] || {}, hook = st.mkt && st.mkt.hook;
  return `<article class="m-step"><div class="m-tabs" role="tablist"><button class="on" data-tab="0">The item</button><button data-tab="1">Benefits</button>${c.why ? '<button data-tab="2">Why AVES</button>' : ''}</div>
  <div class="m-pages">
    <div class="m-pg on"><div class="m-hz">${hzi(st.hazard.icon)}<div><p class="label hk">The hazard</p><p class="ht">${esc(st.hazard.title)}</p><p class="hw">${esc(st.hazard.where)}</p></div></div>
      <p class="cat">${c.icon ? `<img class="ci" alt="" src="${c.icon}">` : ''}<b class="cn">${num(i)}</b><span class="cname">${esc(catName(st))}</span></p>
      <h3 class="pn">${tyL('name-' + st.product)}</h3><p class="sub">${esc(st.descriptor)}</p>${hook ? `<p class="hook">${esc(hook)}</p>` : ''}
      <p class="acts"><button class="lnk" data-det="${i}">Product details</button>${st.url ? `<a class="lnk2" href="${esc(st.url)}" target="_blank" rel="noopener">Product page<svg class="ne" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 9 9 3M4 3h5v5" fill="none" stroke="currentColor" stroke-width="2"/></svg></a>` : ''}</p></div>
    <div class="m-pg"><ol class="m-bf">${feats(st).map((f, k) => `<li><b class="fn">${num(k)}</b><b class="fn on">${num(k)}</b><div class="fx">${f.title ? `<strong class="ft">${esc(f.title)}</strong>` : ''}<span class="fl">${esc(f.line)}</span></div></li>`).join('')}</ol>
      <dl class="meta">${st.mkt && st.mkt.system ? `<div><dt class="label">Works with</dt><dd>${esc(st.mkt.system)}</dd></div>` : ''}${st.standards ? `<div><dt class="label">Standards</dt><dd>${esc(st.standards)}</dd></div>` : ''}<div><dt class="label">SKU</dt><dd>${esc(st.sku)}</dd></div></dl></div>
    ${c.why ? `<div class="m-pg"><div class="m-why">${ty('why-' + st.cat, 'h4')}<ol class="m-wc">${c.why.items.slice(0, 3).map(x => `<li><b>${esc(x.h)}</b><p>${esc(firstSentence(x.t))}</p></li>`).join('')}</ol>${c.approach ? `<img class="apr-art" src="${c.approach.art}" alt="The AVES Approach: ${esc(c.approach.word)}">` : ''}</div></div>` : ''}
  </div></article>`; }).join('');
$('#mEndT').innerHTML = tyL('end-' + kit.id);
$('#mEndL').innerHTML = steps.map((st, i) => `<li><button data-det="${i}"><i>${num(i)}</i><b>${esc(st.name)}</b><span>${esc(SLOT[st.slot])}</span></button></li>`).join('');
$('#mBoots').textContent = `${bootsT}. ${sisT}`;

// everything decoded before the first frame, including the line pictures (CSS masks are not in document.images)
const keys = ['kit-' + kit.id, 'end-' + kit.id, ...steps.map(s => 'name-' + s.product)], pre = [];
keys.forEach(k => { const t = LINES[k]; if (t) Object.entries(t.sets).forEach(([n, s]) => s.forEach((_, i) => { const im = new Image(); im.src = `${TB}${k}-${n}-${i}.png`; pre.push(im); })); });
const imgs = [...document.images, ...pre];
await Promise.all(imgs.map(im => im.complete ? 0 : new Promise(r => { im.onload = im.onerror = r; })));
await Promise.all(imgs.map(im => im.decode ? im.decode().catch(() => 0) : 0));
if (document.fonts && document.fonts.ready) await document.fonts.ready;

// ---------- shared geometry
const stage = $('#stage'), cam = $('#cam'), bd = $('#bd'), bdw = $('#bdw'), track = $('#track'), flies = $$('#fly .f');
let tl, st0, landAt = [], lastN = -1, builtW = 0, builtH = 0, builtIW = 0, builtIH = 0, U = 1, pgH = [];
const site = (rm || q.get('gl') === '0' || !window.SiteGL || !D.fx) ? null : await SiteGL.create({ host: bd, img: $('#bdA'), fx: D.fx,
  res: () => U, time: q.has('t') ? +q.get('t') : null, fine: matchMedia('(hover: hover) and (pointer: fine)').matches });
const GL = !!(site && site.ok); document.documentElement.dataset.dbg = GL ? 'gl' : 'static';
gsap.set(manEl, { left: 0, top: 0, width: F.w, height: F.h });
// ambient: the backdrop drifts (motion.json ambient.kitBackdrop: 147 % -> 150 %, x 0 -> -18 of 2560, 16 s yoyo); paused when hidden
const drift = rm ? null : gsap.fromTo(bdw, { scale: 1, x: 0 }, { scale: 150 / 147, x: -18 / 2560 * 100 + 'vw', duration: 16, ease: 'sine.inOut', repeat: -1, yoyo: true });
document.addEventListener('visibilitychange', () => drift && (document.hidden ? drift.pause() : drift.resume()));
function clearAll() { gsap.set($$('#stage *').filter(e => e.getAttribute('style') && !e.classList.contains('ty') && !e.classList.contains('tl') && e !== bdw && !e.classList.contains('bd-gl') && e.id !== 'bdA'), { clearProps: 'all' }); lyMask(); gsap.set(manEl, { left: 0, top: 0, width: F.w, height: F.h }); }
const setGeomGL = (W, H, px, fr) => { if (!GL) return null;
  const o = { x: -.10 * W, y: -.16 * H }, bw0 = 1.2 * W, bh0 = 1.32 * H, bim = $('#bdA'), cs = Math.max(bw0 / bim.naturalWidth, bh0 / bim.naturalHeight), iw = bim.naturalWidth * cs, ih = bim.naturalHeight * cs;
  const iox = (bw0 - iw) * px, ioy = (bh0 - ih) * .58, fx = fr.x + F.w / 2 * fr.s, fy = fr.y + .9577 * F.h * fr.s;
  site.setGeom({ bw: bw0, bh: bh0, ox: iox, oy: ioy, iw, ih, o, Fp: { x: fx, y: .43 * H }, feet: { x: (fx - o.x - iox) / iw, y: (fy - o.y - ioy) / ih } }); return o; };
// the backdrop follows a reframe a little (a fraction of the zoom, about the worker), so the place and the man stay one picture
const bdFor = (fr, ref, o, W, H) => { const k = 1 + .1 * clamp((fr.s - ref.s0) / Math.max(.001, ref.s1 - ref.s0), 0, 1), P = { x: fr.x + F.w / 2 * fr.s, y: .45 * H };
  return { x: (P.x - o.x) * (1 - k), y: (P.y - o.y) * (1 - k), scale: k }; };
const E = { o: 'power3.out', io: 'power3.inOut', i2: 'power2.in', o2: 'power2.out', o1: 'power1.out', i1: 'power1.in', s: 'sine.inOut' };
// fromTo that never renders early: initial states are set explicitly, so every move can sit anywhere on the timeline and scrub both ways
const FT = (t, el, from, to, at) => !el || (typeof el === 'object' && 'length' in el && !el.length) ? t : from ? t.fromTo(el, from, { ...to, immediateRender: false }, at) : t.to(el, to, at);
const enter = (t, els, at, dy, dur = .7, stag = 0, opTo = 1) => { els = [].concat(els).filter(Boolean); els.forEach((el, k) => {
  FT(t, el, { y: dy }, { y: 0, duration: dur, ease: E.o }, at + k * stag); FT(t, el, { opacity: 0 }, { opacity: opTo, duration: .45, ease: E.o1 }, at + k * stag); }); };
const leave = (t, els, at, dy = -20, stag = .008, dur = .35, opDur = .26) => { els = [].concat(els).filter(Boolean); els.forEach((el, k) => {
  FT(t, el, { y: 0 }, { y: dy, duration: dur, ease: E.i2 }, at + k * stag); FT(t, el, { opacity: +gsap.getProperty(el, 'opacity') || 1 }, { opacity: 0, duration: opDur, ease: E.i1 }, at + k * stag); }); };
// study 2: the item is lifted from the kit list, travels to the worker (who reframes on the same curve) and goes on
function issue(t, i, T, a, fr, prevWin, toC, drop, settle) {
  const st = steps[i], f = flies[i], b = st.box, bw = (b[2] - b[0]) * fr.s, bh = (b[3] - b[1]) * fr.s, s0 = Math.max(.05, a.h / bh);
  const cx = fr.x + (b[0] + b[2]) / 2 * fr.s, cy = fr.y + (b[1] + b[3]) / 2 * fr.s, dur = String(prevWin) === String(winFor(st)) ? 1 : 1.1, L = T + .45 + dur;
  gsap.set(f, { width: bw, height: bh, left: 0, top: 0, xPercent: -50, yPercent: -50, x: a.x, y: a.y, scale: s0, opacity: 0 });
  FT(t, f, { opacity: 0 }, { opacity: 1, duration: .01, ease: 'none' }, T + .3);
  FT(t, f, { scale: s0 }, { scale: s0 * 1.4, duration: .22, ease: E.o2 }, T + .3);
  FT(t, f, { x: a.x }, { x: cx, duration: dur, ease: E.io }, T + .45);
  FT(t, f, { y: a.y }, { y: cy - drop, duration: dur * .75, ease: E.s }, T + .45);
  FT(t, f, { scale: s0 * 1.4 }, { scale: 1, duration: dur, ease: E.io }, T + .45);
  if (drop) FT(t, f, { y: cy - drop }, { y: cy, duration: .4, ease: E.o }, L);
  FT(t, f, { opacity: 1 }, { opacity: 0, duration: .2, ease: E.i1 }, L);
  FT(t, lys[i], { y: -settle / fr.s }, { y: 0, duration: .4, ease: E.o }, L);
  FT(t, lys[i], { opacity: 0 }, { opacity: 1, duration: .2, ease: E.o1 }, L);
  if (toC) { FT(t, cam, null, { ...toC.cam, duration: 1.1, ease: E.io }, T + .45); FT(t, bd, null, { ...toC.bd, duration: 1.1, ease: E.io }, T + .45); }
  return L;
}
const FTn = (t, el, to, at) => t.to(el, { ...to, immediateRender: false }, at);

// ---------- desktop
function buildDesk() {
  const keep = tl ? tl.progress() : 0;
  if (tl) { st0 && st0.kill(); tl.kill(); clearAll(); }
  U = clamp(Math.min(track.clientWidth / 1440, innerHeight / 900), .78, 2.4); stage.style.setProperty('--u', U); builtIW = innerWidth; builtIH = innerHeight;
  const W = builtW = stage.clientWidth, H = builtH = stage.clientHeight, M = W >= 1560 ? 75 : 64;
  stage.style.setProperty('--M', M + 'px');
  const colW = Math.min(525, .36 * W), colX = W - M - colW; stage.style.setProperty('--colX', colX + 'px'); stage.style.setProperty('--colW', colW + 'px');
  const sMax = 1.875 / 1.6 * H / 900;
  const frame = (win, cxF) => { const span = win[1] - win[0], s = Math.min(.9 * H / span, sMax); let top = .105 * H; if (top + span * s > .99 * H) top = .99 * H - span * s;
    let cx = cxF * W;
    // waist framing puts the arms at the height of the hazard text: the worker moves right, between the two columns, so no text lies on him
    let sw = s;
    if (win[0] >= 400) { sw = Math.min(s, (colX - 12 - M - 345) / 478); const half = 239 * sw, lo = M + 345 + half, hi = colX - 12 - half; cx = lo <= hi ? clamp(cx, lo, hi) : (lo + hi) / 2; }
    return { s: sw, x: cx - F.w / 2 * sw, y: top - win[0] * sw }; };
  const frI = frame(FULL, .43), frF = frame(FULL, .39), ref = { s0: frF.s, s1: sMax };
  const o = setGeomGL(W, H, .5, frI) || { x: -.10 * W, y: -.16 * H };
  $('#bdA').style.objectPosition = '50% 58%';
  const camOf = fr => ({ x: fr.x, y: fr.y, scale: fr.s }), shot = fr => ({ cam: camOf(fr), bd: bdFor(fr, ref, o, W, H) });
  gsap.set(cam, { ...camOf(frI), transformOrigin: '0 0' }); gsap.set(bd, { ...bdFor(frI, ref, o, W, H), transformOrigin: '0 0' });
  // headings in lines, sized to their columns
  fitL($('#kname .tl') || $('#kname'), Math.min(.31 * W, .43 * W - 120 - M), 94, 2);   // never into the worker
  fitL($('#endT .tl') || $('#endT'), Math.min(.3 * W, .39 * W - 120 - M), 56, 2);
  const pbs = $$('#pbs .pb'), hzbs = $$('#hzs .hzb'), rows = $$('#rl li'), segs = $$('#segs .so'), cnts = $$('#cnts i');
  // the product block fits the column: the name steps down first, then the hook and the feature text (never below the 1440 sizes x .85)
  pbs.forEach(pb => { const tlEl = pb.querySelector('.pn .tl'); let nh = 75, fs = 1; pb.style.setProperty('--fs', 1);
    const fit = () => { if (tlEl) fitL(tlEl, colW, nh, 2); };
    fit(); while (pb.offsetHeight > H - 128 - 24 && nh > 44) { nh -= 4; fit(); }
    while (pb.offsetHeight > H - 128 - 24 && fs > .84) { fs -= .04; pb.style.setProperty('--fs', fs.toFixed(2)); } });
  // the kit rail: rows share the room under the count
  const railTop = 568, pitch = Math.min(33.6, (H - 30 - railTop) / N); stage.style.setProperty('--rp', pitch + 'px');
  // board grid: 4 columns (5 for nine items)
  $('#board').style.setProperty('--cols', N > 8 ? 5 : 4);

  tl = gsap.timeline({ paused: true, onUpdate: sync });
  tl.addLabel('intro', 0);
  // initial states
  gsap.set(lys, { opacity: 0 }); gsap.set(['#rail', '#end', '#endL', '#kitlnk'], { autoAlpha: 0 });
  gsap.set(rows.map(r => r.querySelector('.rt')), { opacity: .8 }); gsap.set(rows.map(r => r.querySelector('.rnm:not(.on)')), { opacity: .72 });   // three levels as the comp: upcoming quiet (.72), issued clear (1), current bright (ink, heavy)
  gsap.set(rows.map(r => r.querySelectorAll('.on')), { opacity: 0 }); gsap.set(segs, { scaleX: 0, opacity: 0, transformOrigin: '0 50%' }); gsap.set(cnts.slice(1), { opacity: 0 });
  pbs.forEach(pb => { gsap.set(pb.querySelectorAll('.cat > *, .pn .ty, .sub, .hook, .fn, .fx > *, .meta > div, .acts > *'), { opacity: 0 });
    gsap.set(pb.querySelectorAll('.acc, .dv, .dvo'), { scaleX: 0, opacity: 0, transformOrigin: '0 50%' }); gsap.set(pb, { autoAlpha: 1 }); });
  hzbs.forEach(h => { gsap.set(h.querySelectorAll('.hk .hzi, .hk .label, .ht, .hw'), { opacity: 0 }); gsap.set(h.querySelector('.hl'), { scaleX: 0, opacity: 0, transformOrigin: '0 50%' }); gsap.set(h.querySelectorAll('.hd, .hp'), { scale: 0, opacity: 0 }); });
  // intro leaves, the rail arrives
  FT(tl, '#intro', { y: 0, autoAlpha: 1 }, { y: -20, autoAlpha: 0, duration: .35, ease: E.i2 }, .15);
  FT(tl, '#board', { y: 0, autoAlpha: 1 }, { y: -20, autoAlpha: 0, duration: .35, ease: E.i2 }, .2);
  FT(tl, '#rail', { autoAlpha: 0 }, { autoAlpha: 1, duration: .01, ease: 'none' }, .5);
  FT(tl, '#kitlnk', { autoAlpha: 0 }, { autoAlpha: 1, duration: .45, ease: E.o1 }, .5);
  enter(tl, [$('#rail .cnt'), $('#segs'), ...rows], .5, 24, .75, .05);
  let t = 1.2, prevWin = FULL; landAt = [];
  steps.forEach((st, i) => {
    const T = t, win = winFor(st), fr = frame(win, .39), row = rows[i], th = row.querySelector('.rt'), pb = pbs[i], hz = hzbs[i];
    // the fly starts at the rail thumb (stage units)
    const r = th.getBoundingClientRect(), sr = stage.getBoundingClientRect(), a = { x: (r.left - sr.left + r.width / 2) / U, y: (r.top - sr.top + r.height / 2) / U, h: r.height / U };
    const full = win === FULL, L = issue(tl, i, T, a, fr, prevWin, shot(fr), full ? 0 : 56, full ? 7.5 : 28);
    prevWin = win; landAt.push(L);
    FT(tl, th, { opacity: .8 }, { opacity: .25, duration: .25, ease: E.o2 }, T + .3);
    FT(tl, th, { opacity: .25 }, { opacity: 1, duration: .4, ease: E.o1 }, L);
    // the hazard: icon, label, title, where; then the line draws to the item and the dot lands on it
    const b = st.box, dot = { x: fr.x + (b[0] + .12 * (b[2] - b[0])) * fr.s, y: fr.y + Math.min(b[1] + .5 * (b[3] - b[1]), b[1] + 90) * fr.s };
    { const lab = hz.querySelector('.hk .label'), lr = lab.getBoundingClientRect(), x0 = (lr.right - sr.left) / U + 20, y0 = (lr.top - sr.top + lr.height / 2) / U;
      const dx = dot.x - x0, dy = dot.y - y0, len = Math.hypot(dx, dy), ang = Math.atan2(dy, dx) * 180 / Math.PI, show = dx > 40 && Math.abs(ang) < 22;   // a steep line would cross the hazard text: then the dot and its ping mark the item alone
      gsap.set(hz.querySelector('.hl'), { left: x0, top: y0 - 1, width: Math.max(0, len - 6), rotation: ang, display: show ? '' : 'none' });
      gsap.set(hz.querySelectorAll('.hd, .hp'), { left: dot.x, top: dot.y, xPercent: -50, yPercent: -50, display: dx > 40 ? '' : 'none' }); }
    enter(tl, hz.querySelector('.hk .hzi'), L - .25, 16); enter(tl, hz.querySelector('.hk .label'), L - .2, 16);
    enter(tl, hz.querySelector('.ht'), L - .13, 24); enter(tl, hz.querySelector('.hw'), L - .05, 20);
    FT(tl, hz.querySelector('.hl'), { opacity: 0 }, { opacity: 1, duration: .01, ease: 'none' }, L + .05);
    FT(tl, hz.querySelector('.hl'), { scaleX: 0 }, { scaleX: 1, duration: .6, ease: E.io }, L + .05);
    FT(tl, hz.querySelector('.hd'), { opacity: 0 }, { opacity: 1, duration: .01, ease: 'none' }, L + .59);
    FT(tl, hz.querySelector('.hd'), { scale: 0 }, { scale: 1, duration: .3, ease: E.o }, L + .59);
    // count, segment, rail row
    const cO = cnts[i], cN = cnts[i + 1];
    FT(tl, cO, { y: 0 }, { y: -22 / 1.6, duration: .35, ease: E.i2 }, L + .1); FT(tl, cO, { opacity: 1 }, { opacity: 0, duration: .3, ease: E.i2 }, L + .1);
    FT(tl, cN, { y: 22 / 1.6 }, { y: 0, duration: .5, ease: E.o }, L + .3); FT(tl, cN, { opacity: 0 }, { opacity: 1, duration: .35, ease: E.o1 }, L + .3);
    FT(tl, segs[i], { opacity: 0 }, { opacity: 1, duration: .01, ease: 'none' }, L + .2); FT(tl, segs[i], { scaleX: 0 }, { scaleX: 1, duration: .55, ease: E.io }, L + .2);
    FT(tl, row.querySelector('.rn.on'), { opacity: 0 }, { opacity: 1, duration: .4, ease: E.o1 }, L + .2);
    FT(tl, row.querySelector('.rnm:not(.on)'), { opacity: .72 }, { opacity: 0, duration: .4, ease: E.o1 }, L + .2);
    FT(tl, row.querySelector('.rnm.on'), { opacity: 0 }, { opacity: 1, duration: .4, ease: E.o1 }, L + .2);
    if (i > 0) { const pr = rows[i - 1];   // the previous item steps back to "issued"
      FT(tl, pr.querySelector('.rn.on'), { opacity: 1 }, { opacity: 0, duration: .4, ease: E.o1 }, L + .2);
      FT(tl, pr.querySelector('.rnm.on'), { opacity: 1 }, { opacity: 0, duration: .4, ease: E.o1 }, L + .2);
      FT(tl, pr.querySelector('.rnm:not(.on)'), { opacity: 0 }, { opacity: 1, duration: .4, ease: E.o1 }, L + .2); }
    // study 3: the product arrives, its features light in turn, the rest follows
    const cat = [...pb.querySelectorAll('.cat > *')];
    cat.forEach((el, k) => enter(tl, el, L + .2 + k * .04, 16));
    [...pb.querySelectorAll('.pn .ty')].forEach((el, k) => enter(tl, el, L + .32 + k * .08, 48, .9));
    { const hp = hz.querySelector('.hp'); FT(tl, hp, { opacity: 0 }, { opacity: .9, duration: .01, ease: 'none' }, L + .62); FT(tl, hp, { scale: .2 }, { scale: 1, duration: .7, ease: E.o }, L + .62);
      FT(tl, hp, { opacity: .9 }, { opacity: 0, duration: .6, ease: E.o1 }, L + .72); }
    enter(tl, pb.querySelector('.sub'), L + .58, 20);
    const acc = pb.querySelector('.acc'); FT(tl, acc, { opacity: 0 }, { opacity: 1, duration: .01, ease: 'none' }, L + .7); FT(tl, acc, { scaleX: 0 }, { scaleX: 1, duration: .5, ease: E.io }, L + .7);
    enter(tl, pb.querySelector('.hook'), L + .82, 24, .8);
    const lis = [...pb.querySelectorAll('.fs li')], dvs = [...pb.querySelectorAll('.dv')];
    dvs.forEach((dv, k) => { FT(tl, dv, { opacity: 0 }, { opacity: 1, duration: .01, ease: 'none' }, L + 1.15 + k * .08); FT(tl, dv, { scaleX: 0 }, { scaleX: 1, duration: .7, ease: E.io }, L + 1.15 + k * .08); });
    lis.forEach((li, k) => { const a0 = L + 1.25 + k * .08, ft = li.querySelector('.ft'), fl = li.querySelector('.fl'), lt = L + 1.9 + k * .75;
      enter(tl, li.querySelector('.fn:not(.on)'), a0, 16); enter(tl, ft, a0, 16, .7, 0, .35); enter(tl, fl, a0 + .04, 16, .7, 0, .35);
      const dvo = li.querySelector('.dvo'); FT(tl, dvo, { opacity: 0 }, { opacity: 1, duration: .01, ease: 'none' }, lt); FT(tl, dvo, { scaleX: 0 }, { scaleX: 1, duration: .45, ease: E.io }, lt);
      FT(tl, li.querySelector('.fn.on'), { opacity: 0 }, { opacity: 1, duration: .3, ease: E.o1 }, lt + .05);
      if (ft) { FT(tl, ft, { opacity: .35 }, { opacity: 1, duration: .35, ease: E.o1 }, lt + .05); FT(tl, ft, { x: -6 }, { x: 0, duration: .5, ease: E.o }, lt + .05); }
      FT(tl, fl, { opacity: .35 }, { opacity: 1, duration: .35, ease: E.o1 }, lt + .1); });
    enter(tl, [...pb.querySelectorAll('.meta > div, .acts > *')], L + 3.95, 12, .6, .04);
    landAt[i] = L; tl.addLabel('s' + (i + 1), L + 4.8);
    // exit: up and out, the reverse of the entry
    leave(tl, [...pb.querySelectorAll('.cat > *, .pn .ty, .sub, .acc, .hook, .dv, .dvo, .fn, .fx > *, .meta > div, .acts > *')], L + 5);
    FT(tl, hz.querySelector('.hd'), { scale: 1 }, { scale: 0, duration: .2, ease: E.i2 }, L + 5);
    FT(tl, hz.querySelector('.hl'), { scaleX: 1 }, { scaleX: 0, duration: .4, ease: E.io }, L + 5.05);
    [...hz.querySelectorAll('.hk .hzi, .hk .label, .ht, .hw')].forEach((el, k) => { FT(tl, el, { y: 0 }, { y: -16, duration: .35, ease: E.i2 }, L + 5.15 + k * .03); FT(tl, el, { opacity: 1 }, { opacity: 0, duration: .35, ease: E.i2 }, L + 5.15 + k * .03); });
    t = L + 5.3;
  });
  // the complete kit: back to the full figure, the rail leaves, the kit list arrives
  const shE = shot(frF);
  FT(tl, cam, null, { ...shE.cam, duration: 1.1, ease: E.io }, t); FT(tl, bd, null, { ...shE.bd, duration: 1.1, ease: E.io }, t);
  FT(tl, '#rail', { y: 0, autoAlpha: 1 }, { y: -16, autoAlpha: 0, duration: .35, ease: E.i2 }, t);
  FT(tl, ['#end', '#endL'], { autoAlpha: 0 }, { autoAlpha: 1, duration: .01, ease: 'none' }, t + .5);
  gsap.set([...$$('#end > *'), ...$$('#endList li'), $('#boots')], { opacity: 0 });
  enter(tl, $$('#end > *'), t + .5, 28, .8, .07); enter(tl, [...$$('#endList li'), $('#boots')], t + .6, 24, .75, .05);
  tl.addLabel('end', t + 1.8); tl.to({}, { duration: .2 }, t + 1.8);
  track.style.height = (100 + tl.duration() * 15.5) + 'vh';   // ~105 vh of scroll per item, as v0.8
  lastN = -1; sync();
  const dbg = q.get('step');
  if (dbg) { const lab = /^[a-z]/.test(dbg) ? dbg : 's' + dbg; tl.seek(tl.labels[lab] + parseFloat(q.get('d') || 0), false); sync(); return; }
  st0 = ScrollTrigger.create({ animation: tl, trigger: track, start: 'top top', end: 'bottom bottom', scrub: .6,
    snap: { snapTo: 'labelsDirectional', duration: { min: .6, max: 2.2 }, delay: .15, ease: 'power1.inOut' } });
  if (keep > 0) { ScrollTrigger.refresh(); const y = st0.start + (st0.end - st0.start) * keep; lenis ? lenis.scrollTo(y, { immediate: true, force: true }) : scrollTo(0, y); tl.progress(keep); }
}

// ---------- phone: the same story as a full-screen stepper, played from label to label
function buildPhone() {
  if (tl) { tl.kill(); clearAll(); }
  liftTw && liftTw.kill(); liftTw = null; lift.v = 0; ['#pha', '#mStrip', '#mS'].forEach(s => { $(s).style.translate = ''; });
  U = 1; const W = builtW = stage.clientWidth, H = builtH = stage.clientHeight;
  const sheet = $('#mS'), strip = $('#mStrip'), nav = $('#mNav'), stepEls = $$('#mSteps .m-step'), navH = nav.offsetHeight;
  // headings to their widths (phone sizes from tokens: kit name 54, product name 32 on one line)
  $$('#mSteps .pn .tl').forEach(el => fitL(el, W - 32, 32, 2));   // one line as the comp; a long name takes two lines rather than shrinking below ~22 px
  fitL($('#mName .tl') || $('#mName'), W - 32, 54, 2); fitL($('#mEndT .tl') || $('#mEndT'), W - 32, 26, 2);
  // the photo band: as tall as the tallest item page leaves free (between 28 % and 62 % of the screen)
  stage.classList.remove('tight');
  // the band is sized by the item tab (the page each step opens on, as the comp: text fills down to the bar); a taller Benefits / Why page lifts the screen when it opens (setTab)
  const meas = () => { pgH = stepEls.map(e => [...e.querySelectorAll('.m-pg')].map(p => p.offsetHeight)); return Math.max(...stepEls.map((e, i) => e.querySelector('.m-tabs').offsetHeight + pgH[i][0])); };
  // two bands as the comps: the steps' band (photo to the strip) and the intro / complete-kit band (shorter: those pages carry more text);
  // the photo's lower edge (.pha-fade, a fade into the page colour) slides between them on transform only
  const needIE = () => Math.max($('#mIntro').offsetHeight + strip.offsetHeight + 22, $('#mEnd').offsetHeight + 10);
  let need = meas() + 22;
  if (H - navH - Math.max(need, needIE()) < .3 * H) { stage.classList.add('tight'); need = meas() + 22; }
  const band = clamp(H - navH - need, .28 * H, .62 * H), stripY = band - strip.offsetHeight + 6, bandIE = clamp(H - navH - needIE(), .18 * H, band);
  stage.style.setProperty('--band', bandIE + 'px'); stage.style.setProperty('--bandS', band + 'px'); stage.style.setProperty('--stripY', stripY + 'px');
  const topPad = 52, bandB = stripY - 4, fade = $('#pha .pha-fade'), fadeY = b => b - 90;
  const frame = (win, bot = bandB) => { const span = win[1] - win[0], s = (bot - topPad) / span; return { s, x: .5 * W - F.w / 2 * s, y: topPad - win[0] * s }; };
  const frI = frame(BUST, bandIE - 6), frF = frame(FULL, bandIE - 10), ref = { s0: frF.s, s1: frame(BUST).s };
  gsap.set(fade, { y: fadeY(bandIE) });
  const o = setGeomGL(W, H, D.phoneX == null ? .5 : D.phoneX, frF) || { x: -.10 * W, y: -.16 * H };
  $('#bdA').style.objectPosition = `${(D.phoneX == null ? .5 : D.phoneX) * 100}% 58%`;
  const shot = fr => ({ cam: { x: fr.x, y: fr.y, scale: fr.s }, bd: bdFor(fr, ref, o, W, H) });
  gsap.set(cam, { ...shot(frI).cam, transformOrigin: '0 0' }); gsap.set(bd, { ...shot(frI).bd, transformOrigin: '0 0' });
  // the strip sits in the intro's list slot first, then rides up under the photo
  const introStrip = $('#mKitT'); const sy0 = (introStrip.getBoundingClientRect().bottom + 8) - stripY;
  tl = gsap.timeline({ paused: true, onUpdate: sync });
  tl.addLabel('intro', 0);
  gsap.set(lys, { opacity: 0 }); gsap.set([sheet, '#mEnd'], { autoAlpha: 0 }); gsap.set(stepEls, { autoAlpha: 0 }); gsap.set(strip, { y: sy0 });
  const kidsOf = el => [...el.querySelectorAll('.m-pg.on > *, .m-tabs')];
  stepEls.forEach(e => gsap.set(kidsOf(e), { opacity: 0 }));
  leave(tl, [...$$('#mIntro > *')], .1, -12, .01, .25, .25);
  FT(tl, strip, { y: sy0 }, { y: 0, duration: .6, ease: E.io }, .2);
  FT(tl, fade, { y: fadeY(bandIE) }, { y: fadeY(band), duration: .6, ease: E.io }, .2);
  FT(tl, sheet, { autoAlpha: 0 }, { autoAlpha: 1, duration: .01, ease: 'none' }, .4);
  const rails = $$('#mRail li');
  let t = .45, prevWin = BUST; landAt = [];
  steps.forEach((st, i) => {
    const T = t, win = winFor(st), fr = frame(win), ph = rails[i].querySelector('.ph');
    const r = ph.getBoundingClientRect(), a = { x: r.left + r.width / 2, y: r.top + r.height / 2 - sy0, h: r.height };
    const full = win === FULL, L = issue(tl, i, T, a, fr, prevWin, shot(fr), full ? 0 : 30, full ? 5 : 16);
    prevWin = win; landAt.push(L);
    FT(tl, ph, { opacity: .55 }, { opacity: .25, duration: .25, ease: E.o2 }, T + .3);
    FT(tl, ph, { scale: 1 }, { scale: 1.3, duration: .25, ease: E.o2 }, T);
    FT(tl, ph, { scale: 1.3 }, { scale: 1, duration: .3, ease: E.o2 }, T + .45);
    FT(tl, ph, { opacity: .25 }, { opacity: 1, duration: .4, ease: E.o1 }, L);
    const el = stepEls[i];
    FT(tl, el, { autoAlpha: 0 }, { autoAlpha: 1, duration: .01, ease: 'none' }, L - .02);
    kidsOf(el).forEach((k, n) => { FT(tl, k, { y: 16 }, { y: 0, duration: .6, ease: E.o }, L + n * .05); FT(tl, k, { opacity: 0 }, { opacity: 1, duration: .45, ease: E.o1 }, L + n * .05); });
    tl.addLabel('s' + (i + 1), L + .85);
    leave(tl, kidsOf(el), L + .85, -12, .01, .25, .25);
    FT(tl, el, { autoAlpha: 1 }, { autoAlpha: 0, duration: .01, ease: 'none' }, L + 1.12);
    t = L + .85;
  });
  const shE = shot(frF);
  FT(tl, cam, null, { ...shE.cam, duration: 1.1, ease: E.io }, t); FT(tl, bd, null, { ...shE.bd, duration: 1.1, ease: E.io }, t);
  FT(tl, strip, { y: 0, autoAlpha: 1 }, { y: -12, autoAlpha: 0, duration: .25, ease: E.i2 }, t);
  FT(tl, fade, { y: fadeY(band) }, { y: fadeY(bandIE), duration: 1.1, ease: E.io }, t);
  FT(tl, sheet, { autoAlpha: 1 }, { autoAlpha: 0, duration: .01, ease: 'none' }, t + .3);
  FT(tl, '#mEnd', { autoAlpha: 0 }, { autoAlpha: 1, duration: .01, ease: 'none' }, t + .5);
  gsap.set($$('#mEnd > *'), { opacity: 0 }); enter(tl, $$('#mEnd > *'), t + .5, 16, .6, .05);
  tl.addLabel('end', t + 1.3); tl.to({}, { duration: .15 }, t + 1.3);
  lastN = -1; lastLab = ''; sync();
  const dbg = q.get('step');
  if (dbg) { const lab = /^[a-z]/.test(dbg) ? dbg : 's' + dbg; tl.seek(tl.labels[lab] + parseFloat(q.get('d') || 0), false); sync(); if (q.get('tab')) setTab(stepEls[+dbg - 1], +q.get('tab')); }
}
const build = () => PH ? buildPhone() : buildDesk();
// phone stepping: every label is a stop (intro, s1..sN, end), played in real time so the moves keep their motion.json durations
let lastLab = '', mTween = null;
const labelList = () => Object.entries(tl.labels).sort((a, b) => a[1] - b[1]);
const curIdx = () => { const L = labelList(), tt = mTween ? mTween.vars.time : tl.time(); let k = 0; L.forEach((l, n) => { if (tt >= l[1] - .01) k = n; }); return k; };
function mGo(n) { const L = labelList(); n = clamp(n, 0, L.length - 1); const to = L[n][1], dist = Math.abs(to - tl.time()); if (dist < .01) return;
  mTween && mTween.kill(); const back = to < tl.time();
  mTween = tl.tweenTo(to, { duration: rm ? 0 : back ? Math.min(dist, 1.2) : Math.min(dist, 2.6), ease: 'none', onComplete: () => { mTween = null; } }); mTween.vars.time = to; mNavState(n); }
function mNavState(n) { const L = labelList(); $('#mBack').disabled = n === 0; $('#mNav').classList.toggle('at-end', n === L.length - 1); $('#mNav').classList.toggle('at-intro', n === 0);
  $('#mNextT').textContent = n === 0 ? 'Kit him out' : n === L.length - 2 ? 'See the kit' : n === L.length - 1 ? 'Start again' : 'Next';
  $('#mPos').textContent = n === 0 || n === L.length - 1 ? '' : `${num(n - 1)} / ${String(N).padStart(2, '0')}`; }
let litTl = null;
// a Benefits / Why page taller than the space the item page leaves lifts the photo, strip and sheet together (CSS translate, which
// stacks on the timeline's own transforms), so the page ends above the bar; the item tab and every step change bring it back to 0
const lift = { v: 0 }; let liftTw = null;
function setLift(to) { if (Math.abs(to - lift.v) < .5 && !liftTw) return; liftTw && liftTw.kill(); liftTw = null;
  const els = ['#pha', '#mStrip', '#mS'].map(s => $(s)), ap = () => els.forEach(e => { e.style.translate = Math.abs(lift.v) < .5 ? '' : `0 ${lift.v.toFixed(1)}px`; });
  if (rm) { lift.v = to; ap(); return; } liftTw = gsap.to(lift, { v: to, duration: .5, ease: E.o, onUpdate: ap, onComplete: () => { liftTw = null; } }); }
function setTab(stepEl, n) { if (!stepEl) return; const tabs = [...stepEl.querySelectorAll('.m-tabs button')], pgs = [...stepEl.querySelectorAll('.m-pg')]; n = clamp(n, 0, tabs.length - 1);
  tabs.forEach((b, k) => b.classList.toggle('on', k === n)); pgs.forEach((p, k) => { p.classList.toggle('on', k === n); if (k === n) gsap.set(p.children, { opacity: 1, y: 0 }); });
  if (PH) { const need = stepEl.querySelector('.m-tabs').offsetHeight + pgs[n].offsetHeight + 8; setLift(n === 0 ? 0 : -Math.max(0, need - $('#mS').clientHeight)); }
  litTl && litTl.kill(); litTl = null;
  if (n === 1) { const lis = [...pgs[1].querySelectorAll('.m-bf li')];   // benefits: rows enter dim together, then light in turn (study 3, phone)
    if (rm) { gsap.set(lis.map(l => l.querySelectorAll('.fx > *')), { opacity: 1 }); gsap.set(lis.map(l => l.querySelector('.fn.on')), { opacity: 1 }); }
    else { litTl = gsap.timeline(); litTl.fromTo(lis, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: .6, ease: E.o, stagger: .06 }, 0);
      lis.forEach((l, k) => { litTl.fromTo(l.querySelectorAll('.fx > *'), { opacity: .35 }, { opacity: .35, duration: .01 }, 0);
        litTl.fromTo(l.querySelector('.fn.on'), { opacity: 0 }, { opacity: 1, duration: .3, ease: E.o1 }, .5 + k * .6).to(l.querySelectorAll('.fx > *'), { opacity: 1, duration: .35, ease: E.o1 }, .5 + k * .6); }); } } }
function sync() {
  const tt = tl.time(), n = landAt.filter(x => tt >= x).length;
  if (PH) { const lab = String(curIdx()); if (lab !== lastLab) { lastLab = lab; mNavState(+lab); $$('#mSteps .m-step').forEach(e => { const on = e.querySelector('.m-tabs .on'); if (on && on.dataset.tab !== '0') setTab(e, 0); }); } }
  if (n === lastN) return; lastN = n;
  $('#mCntI').textContent = n; $$('#mRail li').forEach((e, i) => { e.classList.toggle('gone', i < n); e.classList.toggle('on', i === n - 1); });
}
build();
if (GL) site.start();
if (PH) {
  $('#mNext').addEventListener('click', () => { const L = labelList(), k = curIdx(); mGo(k === L.length - 1 ? 0 : k + 1); });
  $('#mBack').addEventListener('click', () => mGo(curIdx() - 1));
  $$('#mRail li').forEach((e, i) => e.addEventListener('click', () => mGo(i + 1)));
  $('#mSteps').addEventListener('click', e => { const b = e.target.closest('.m-tabs button'); if (b) setTab(b.closest('.m-step'), +b.dataset.tab); });
  let sx = 0, sy = 0, st = 0, inSheet = false;
  stage.addEventListener('touchstart', e => { if (pdOpen) return; const p = e.touches[0]; sx = p.clientX; sy = p.clientY; st = performance.now(); inSheet = !!e.target.closest('#mS'); }, { passive: true });
  stage.addEventListener('touchmove', e => { if (!pdOpen) e.preventDefault(); }, { passive: false });
  stage.addEventListener('touchend', e => { if (pdOpen) return; const p = e.changedTouches[0], dx = p.clientX - sx, dy = p.clientY - sy; if (performance.now() - st > 900) return;
    if (Math.abs(dy) > 44 && Math.abs(dy) > Math.abs(dx) * 1.2) mGo(curIdx() + (dy < 0 ? 1 : -1));
    else if (inSheet && Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(dy) * 1.2) { const el = $$('#mSteps .m-step')[curIdx() - 1]; if (el) setTab(el, +el.querySelector('.m-tabs .on').dataset.tab + (dx < 0 ? 1 : -1)); } }, { passive: true });
  let wheelAt = 0; addEventListener('wheel', e => { if (pdOpen) return; const now = performance.now(); if (now - wheelAt < 700 || Math.abs(e.deltaY) < 12) return; wheelAt = now; mGo(curIdx() + (e.deltaY > 0 ? 1 : -1)); }, { passive: true });
}

// ---------- scroll, keys, clicks (desktop)
let lenis = null;
if (!PH && !q.get('step') && !rm && window.Lenis) {
  lenis = new Lenis({ lerp: .1, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(time => lenis.raf(time * 1000)); gsap.ticker.lagSmoothing(0);
}
const yFor = time => st0.start + (st0.end - st0.start) * time / tl.duration();
const go = time => { const y = yFor(time); lenis ? lenis.scrollTo(y, { duration: 1.6 }) : scrollTo({ top: y, behavior: rm ? 'auto' : 'smooth' }); };
addEventListener('keydown', e => { if (PH && !pdOpen) { if (['ArrowDown', 'ArrowRight', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); mGo(curIdx() + 1); } if (['ArrowUp', 'ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); mGo(curIdx() - 1); } return; }
  if (!st0 || pdOpen) return; const L = labelList(), now = tl.time();
  if (['ArrowDown', 'ArrowRight', 'PageDown', ' '].includes(e.key)) { const n = L.find(l => l[1] > now + .05); if (n) { e.preventDefault(); go(n[1]); } }
  if (['ArrowUp', 'ArrowLeft', 'PageUp'].includes(e.key)) { const p = L.filter(l => l[1] < now - .05).pop(); if (p) { e.preventDefault(); go(p[1]); } } });
$$('#rl li').forEach((e, i) => e.addEventListener('click', () => st0 && go(tl.labels['s' + (i + 1)])));
$('#board .cue').addEventListener('click', () => st0 && go(tl.labels.s1));
let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { if (q.get('m') == null && isPhone() !== PH) { location.reload(); return; } if (pdOpen) return;
  if (PH ? (Math.abs(stage.clientWidth - builtW) < 2 && Math.abs(stage.clientHeight - builtH) < 90) : (Math.abs(innerWidth - builtIW) < 2 && Math.abs(innerHeight - builtIH) < 60)) return; build(); }, 200); });

// ---------- product details: a light page. The page never scrolls while it is open and returns to exactly where it was.
const pd = $('#pd'); let pdOpen = false, pdY = 0, pdFrom = null, pdTl = null;
function pdHTML(st) { const c = D.cats[st.cat] || {}, i = steps.indexOf(st), hook = st.mkt && st.mkt.hook;
  const list = st.bullets.length ? st.bullets : feats(st).map(f => (f.title ? f.title + ': ' : '') + f.line);
  return `<div class="pd-c1"><div class="pd-pic pd-a"><img alt="" src="${st.image}"></div>
    <p class="cat pd-a">${c.icon ? `<img class="ci" alt="" src="${c.icon}">` : ''}<b class="cn">${num(i)}</b><span class="cname">${esc(catName(st))}</span></p>
    <h3 class="pn pd-a">${tyL('name-' + st.product)}</h3><p class="sub pd-a">${esc(st.descriptor)}</p>
    <div class="pd-spec pd-a"><p class="label g">Specification</p>${st.material ? `<p class="mat">${esc(st.material)}</p>` : ''}${st.colour ? `<p class="mat">${esc(st.colour)}</p>` : ''}${st.standards ? `<p class="std">${esc(st.standards)}</p>` : ''}<p class="sku">SKU ${esc(st.sku)}</p></div>
    ${st.url ? `<a class="lnk pd-a" href="${esc(st.url)}" target="_blank" rel="noopener">Visit product page<svg class="ne" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 9 9 3M4 3h5v5" fill="none" stroke="currentColor" stroke-width="2"/></svg></a>` : st.sisterNote ? `<p class="sub pd-a">${esc(st.sisterNote.split('.')[0])}.</p>` : ''}</div>
  <div class="pd-c2"><p class="label g pd-a">Features and benefits</p>${hook ? `<p class="pd-hook pd-a">${esc(hook)}</p>` : ''}
    ${st.mkt && st.mkt.features ? `<ol class="pd-mk pd-a">${st.mkt.features.map((f, k) => `<li><i>${num(k)}</i><div><b>${esc(f.title)}</b><p>${esc(f.line)}</p></div></li>`).join('')}</ol>` : ''}
    <ol class="pd-ft pd-a${st.mkt && st.mkt.features ? ' sec' : ''}">${list.map((x, j) => `<li><i>${num(j)}</i><span>${esc(x)}</span></li>`).join('')}</ol>
    ${st.mkt && st.mkt.system ? `<div class="pd-w pd-a"><p class="label g">Works with</p><p>${esc(st.mkt.system)}</p></div>` : ''}</div>
  <div class="pd-c3">${c.why ? `<div class="pd-why pd-a"><h4 class="wt">${tyL('why-' + st.cat)}</h4>${c.why.items.map(x => `<div><b>${esc(x.h)}</b><p>${esc(x.t)}</p></div>`).join('')}</div>` : ''}
    ${c.approach ? `<img class="apr-art pd-a" src="${c.approach.art}" alt="The AVES Approach: ${esc(c.approach.word)}">` : ''}</div>`; }
function openDet(st, from, instant) {
  $('#pdB').innerHTML = pdHTML(st); pdOpen = true; document.documentElement.classList.add('pd-open'); pdY = scrollY; pdFrom = from || null; pd.setAttribute('aria-hidden', 'false'); $('#pdB').scrollTop = 0;
  const pn = $('#pdB .pn .tl'); if (pn) { const w = PH ? innerWidth - 32 : $('#pdB .pd-c1').clientWidth; fitL(pn, w, PH ? 34 : 60, 2); }
  const wt = $('#pdB .wt .tl'); if (wt) fitL(wt, PH ? innerWidth - 32 : $('#pdB .pd-c3').clientWidth, PH ? 24 : 30, 3);
  pdTl && pdTl.kill();
  pdTl = gsap.timeline({ defaults: { ease: E.o } })
    .fromTo(pd, { autoAlpha: 0 }, { autoAlpha: 1, duration: .3, ease: E.o1 }, 0)
    .fromTo('#pdB .pd-pic', { scale: .94, y: 28, opacity: 0 }, { scale: 1, y: 0, opacity: 1, duration: .7 }, .06)
    .fromTo('#pdB .pd-a:not(.pd-pic)', { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: .6, stagger: .04 }, .14);
  if (instant || rm) pdTl.progress(1);
  $('#pdX').focus({ preventScroll: true });
}
function closeDet() { if (!pdOpen) return; pdOpen = false; document.documentElement.classList.remove('pd-open'); pd.setAttribute('aria-hidden', 'true'); pdTl && pdTl.kill();
  gsap.to(pd, { autoAlpha: 0, duration: rm ? 0 : .22, ease: E.i1 });
  if (pdFrom && pdFrom.isConnected) pdFrom.focus({ preventScroll: true });
  if (Math.abs(scrollY - pdY) > 2) { lenis ? lenis.scrollTo(pdY, { immediate: true, force: true }) : scrollTo(0, pdY); } }
document.addEventListener('click', e => { const b = e.target.closest('[data-det]'); if (b) { openDet(steps[+b.dataset.det], b); return; }
  if (e.target.closest('[data-close]')) closeDet(); });
addEventListener('keydown', e => { if (e.key === 'Escape') closeDet(); });
for (const ev of ['wheel', 'touchmove']) pd.addEventListener(ev, e => { if (!e.target.closest('#pdB') || $('#pdB').scrollHeight <= $('#pdB').clientHeight) e.preventDefault(); e.stopPropagation(); }, { passive: false });
if (q.get('det') && steps[+q.get('det') - 1]) openDet(steps[+q.get('det') - 1], null, true);
// study 1, arrival half: when the page opens (from the picker) the worker rises in, then kit name, lead, hazards, the kit board, the cue
if (!rm && !q.get('step')) {
  const A = gsap.timeline({ defaults: { ease: E.o } });
  A.fromTo(manEl, { y: 140 / 1.6 / (+gsap.getProperty(cam, 'scale') || 1) }, { y: 0, duration: 1 }, .05).fromTo(manEl, { opacity: 0 }, { opacity: 1, duration: .35, ease: E.o1 }, .05);
  A.fromTo('.kits', { opacity: 0 }, { opacity: 1, duration: .5 }, 0);
  if (PH) { A.from('#mIntro > *', { y: 16, opacity: 0, duration: .6, stagger: .05 }, .2).from('#mStrip li', { y: 16, opacity: 0, duration: .6, stagger: .04 }, .5).from('#mNav', { y: 16, opacity: 0, duration: .5 }, .7); }
  else if (scrollY < 4) {
    ['.intro .kicker .ktile', '.intro .kicker .eyebrow', '#kname', '#kintro'].forEach((s, k) => A.from(s, { y: 28 / 1.6, opacity: 0, duration: .8 }, .2 + k * .07));
    A.from('#khzN', { y: 20 / 1.6, opacity: 0, duration: .7 }, .5); A.from('#khz li', { y: 20 / 1.6, opacity: 0, duration: .7, stagger: .06 }, .57);
    A.from('#boardT', { y: 20 / 1.6, opacity: 0, duration: .7 }, .45); A.from('#boardG li', { y: 24 / 1.6, opacity: 0, duration: .75, stagger: .05 }, .55);
    A.from('#board .cue', { y: 16 / 1.6, opacity: 0, duration: .6 }, 1.2).from('#board .cue .ul', { scaleX: 0, transformOrigin: '0 50%', duration: .55, ease: E.io }, 1.3).from('#board .cue-h', { opacity: 0, duration: .5, ease: E.o1 }, 1.45);
  }
}
// hand-over from the picker (index.html decides it before the first paint and draws the picker's last frame, #ho): the kit's own
// backdrop is first moved (CSS scale / translate on #bdw, which stack on the drift) so its picture lies exactly under #ho, and #ho
// moves with it; both then ease to the kit's own framing (0.6 s power3.inOut) while #ho fades (0.5 s) = the grade eases in.
// The two copies share one framing at every frame, so the fade never shows two pictures.
if (window.__ho && document.documentElement.classList.contains('ho')) {
  const hoEl = $('#ho'), hoc = $('#hoc'), hoI = $('#hoI'), bim = $('#bdA'), fadeEl = $('#pha .pha-fade');
  const done = () => { hoEl.style.display = 'none'; bdw.style.scale = ''; bdw.style.translate = ''; if (fadeEl) fadeEl.style.translate = ''; document.documentElement.classList.remove('ho', 'ho-m'); };
  const go2 = () => {
    const sr = stage.getBoundingClientRect(), Ut = sr.width / stage.offsetWidth || 1;
    const br = bim.getBoundingClientRect(), k = br.width / bim.offsetWidth || 1, nw = bim.naturalWidth, nh = bim.naturalHeight;
    const cs = Math.max(bim.offsetWidth / nw, bim.offsetHeight / nh), op = (getComputedStyle(bim).objectPosition || '50% 50%').split(' ').map(v => parseFloat(v) / 100);
    const Rk = { l: br.left + (bim.offsetWidth - nw * cs) * op[0] * k, t: br.top + (bim.offsetHeight - nh * cs) * op[1] * k, w: nw * cs * k };
    const hr = hoI.getBoundingClientRect(), Rh = { l: hr.left, t: hr.top, w: hr.width };
    const wr = bdw.getBoundingClientRect(), o = { x: wr.left + .5 * wr.width, y: wr.top + .55 * wr.height };
    const s0 = Rh.w / Rk.w, tx0 = Rh.l - (o.x + s0 * (Rk.l - o.x)), ty0 = Rh.t - (o.y + s0 * (Rk.t - o.y));
    const fade0 = PH && fadeEl ? window.__ho.fH - (fadeEl.getBoundingClientRect().top - sr.top) : 0;
    const P = { u: 1 }, ap = () => { const u = P.u, s = 1 + (s0 - 1) * u, tx = tx0 * u, ty = ty0 * u;
      bdw.style.scale = s.toFixed(5); bdw.style.translate = `${(tx / Ut).toFixed(2)}px ${(ty / Ut).toFixed(2)}px`;
      const L = o.x + tx + s * (Rk.l - o.x), T = o.y + ty + s * (Rk.t - o.y), r = s * Rk.w / Rh.w;   // where the kit picture is now
      gsap.set(hoc, { x: (L - r * (Rh.l - sr.left) - sr.left) / Ut, y: (T - r * (Rh.t - sr.top) - sr.top) / Ut, scale: r });
      if (fadeEl && fade0) fadeEl.style.translate = `0 ${(fade0 * u).toFixed(1)}px`; };
    ap();
    gsap.timeline({ onComplete: done })
      .to(P, { u: 0, duration: .6, ease: E.io, onUpdate: ap }, .05)
      .to(hoEl, { opacity: 0, duration: .5, ease: 'power1.inOut' }, .05)
      .to(PH ? '.hdr' : [], { opacity: 1, duration: .5, ease: E.o1 }, .15);
  };
  if (!bim.naturalWidth || !hoI.complete) { hoEl.style.display = 'none'; done(); } else go2();
}
Object.defineProperty(window, '__kitTl', { get: () => tl });   // test hook: frame-pacing probes read the timeline time
document.documentElement.dataset.ready = '1';
})().catch(e => { window.__errs.push('boot: ' + e.message); console.error(e); });
