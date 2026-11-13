// The AVES Experience v0.4: Oil & Gas. Everything on screen comes from data/<kit>.json (built by ../tools/build_kit.py).
// Left: the worker on the site, the category band, the hazard, three catalogue benefits pinned to the product, the product block.
// Right: the stockroom shelf; while an item is held, the category's catalogue card (Why Choose AVES + the Approach artwork).
(async () => {
'use strict';
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const q = new URLSearchParams(location.search), clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const KIT = q.get('kit') || 'oil-gas';
const [D, TYPE] = await Promise.all([fetch(`data/${KIT}.json`).then(r => r.json()), fetch('assets/type/type.json').then(r => r.json())]);
const steps = D.steps, N = steps.length, F = D.frame, kit = D.kit;
const SLOT = { head: 'Head', eye: 'Eye', hearing: 'Hearing', respiratory: 'Respiratory', vest: 'Hi-vis', fall: 'Fall', dropped: 'Dropped objects', hand: 'Hand' };
const num = i => String(i + 1).padStart(2, '0');
// a heading as a picture of the words (catalogue title face), usable in any colour
const ty = (key, tag = 'span') => { const t = TYPE[key]; return t ? `<${tag} class="ty" role="img" aria-label="${esc(t.text)}" style="--m:url(assets/type/${key}.png);--ar:${(t.w / t.h).toFixed(4)}"></${tag}>` : ''; };
const layerSrc = st => 'assets/layers/' + encodeURIComponent(st.layer) + '.png';
const pic = (st, src) => `<img alt="" src="${src || st.image}">`;
const gsapOK = !!window.gsap; if (!gsapOK) throw new Error('GSAP did not load');
gsap.registerPlugin(ScrollTrigger); gsap.config({ nullTargetWarn: false });
const rm = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- static DOM
$('#bdA').src = D.backdrop; $('#rk').src = D.shelf;
$('#kick').textContent = `Kit ${num(kit.index - 1)} / ${kit.of} · ${kit.group}`;
$('#kname').innerHTML = ty('kit-' + kit.id); $('#signT').innerHTML = ty('sign-' + kit.id); $('#endT').innerHTML = ty('end-' + kit.id);
// v0.4.1 item 2: the intro reads at a glance. The sentence's first half is the lead line; its second half repeated the hazards,
// so the hazards are shown once, as a numbered list. Same facts, nothing added.
const NUMW = ['', 'One hazard', 'Two hazards', 'Three hazards', 'Four hazards', 'Five hazards', 'Six hazards', 'Seven hazards'];
$('#kintro').textContent = kit.intro.split(':')[0].trim() + '.';
$('#khzN').textContent = `${NUMW[kit.hazards.length] || kit.hazards.length + ' hazards'} on this site`;
$('#khz').innerHTML = kit.hazards.map((h, i) => `<li><b>${num(i)}</b><span>${esc(h)}</span></li>`).join('');
$('#cntN').textContent = N; $('#prog').innerHTML = steps.map(() => '<span></span>').join('');
const manEl = $('#man');
const lys = steps.map(st => { const im = new Image(); im.className = 'ly'; im.alt = ''; im.src = layerSrc(st); im.style.zIndex = st.z;
  // draft art: the glasses layer has temples sticking out sideways; keep the front
  if (st.slot === 'eye') im.style.cssText += ';-webkit-mask-image:linear-gradient(90deg,transparent 41.4%,#000 42.6%,#000 56.6%,transparent 57.8%);mask-image:linear-gradient(90deg,transparent 41.4%,#000 42.6%,#000 56.6%,transparent 57.8%)';
  manEl.appendChild(im); return im; });
$('#items').innerHTML = steps.map((st, i) => `<li class="it${st.pack ? ' has-pack' : ''}">${st.pack ? `<span class="pack${st.pack.pouch ? ' pouch' : ''}"><img alt="" src="${st.pack.src}"></span>` : ''}<span class="ph">${pic(st)}</span><span class="tag"><b>${num(i)}</b><em>${esc(st.name)}</em></span></li>`).join('');
$('#fly').innerHTML = steps.map(st => `<div class="f">${pic(st, st.fly)}</div>`).join('');
const catKeys = Object.keys(D.cats);
$('#bands').innerHTML = catKeys.map(k => { const c = D.cats[k]; return `<div class="band${c.icon ? '' : ' noicon'}${k === 'fall' ? ' long' : ''}" data-cat="${k}">${ty('cat-' + k)}${c.icon ? `<img class="ci" alt="" src="${c.icon}">` : ''}</div>`; }).join('');
$('#cap').innerHTML = steps.map((st, i) => `<div class="c"><i class="rule"></i><p class="eyebrow"><b>${num(i)}</b>${esc(SLOT[st.slot])} · SKU ${esc(st.sku)}</p><h3>${ty('name-' + st.product)}</h3>
  <p class="desc">${esc(st.descriptor)}</p>${st.standards ? `<p class="std"><b>Standards</b>${esc(st.standards)}</p>` : ''}
  <div class="btns"><button class="btn" data-det="${i}">Product details</button>${st.url ? `<a class="lnk" href="${esc(st.url)}" target="_blank" rel="noopener">Visit product page</a>` : ''}</div></div>`).join('');
$('#co').innerHTML = steps.map(st => `<div class="g"><svg class="ln" aria-hidden="true"></svg>
  <div class="hzl"><p class="hk"><i class="hz"></i><span>The hazard</span></p>
    <p class="ht">${esc(st.hazard.title).split(' ').map(w => `<span class="w"><i>${w}</i></span>`).join(' ')}</p><i class="hr"></i>
    <p class="hw"><i class="pin"></i><span>${esc(st.hazard.where)}</span></p></div>
  ${st.short.map((b, j) => `<div class="bf"><b class="k">${j + 1}</b><p>${esc(b)}</p></div>`).join('')}</div>`).join('');
$('#cards').innerHTML = steps.map(st => { const c = D.cats[st.cat]; if (!c.why) return '<article class="card none"></article>';
  const two = c.why.items.length > 4;
  return `<article class="card"><div class="card-b">${ty('why-' + st.cat, 'h4')}<ol class="wc${two ? ' two' : ''}" style="--rows:${two ? Math.ceil(c.why.items.length / 2) : c.why.items.length}">${c.why.items.map((x, j) => `<li><i>${num(j)}</i><span>${esc(x.h)}</span></li>`).join('')}</ol><p class="more">The full reasons are in Product details.</p></div>
  ${c.approach ? `<img class="apr-art" src="${c.approach.art}" alt="The AVES Approach: ${esc(c.approach.word)}">` : ''}</article>`; }).join('');
$('#endL').innerHTML = steps.map((st, i) => `<li><b>${esc(st.name)}</b><span>${esc(SLOT[st.slot])} · ${esc(st.sku)}</span><button data-det="${i}">Details</button></li>`).join('');
$('#boots').textContent = `Boots: ${D.boots.name} · SKU ${D.boots.sku} · ${D.boots.standards}. Hi-vis by Scuta, boots by Cavalier: sister brands, not part of the AVES range.`;
const its = $$('.it'), flies = $$('.fly .f'), caps = $$('.cap .c'), cos = $$('#co .g'), progs = $$('.prog span'), cards = $$('#cards .card'), bands = Object.fromEntries($$('.band').map(b => [b.dataset.cat, b]));
await Promise.all([...document.images].map(im => im.complete ? 0 : new Promise(r => { im.onload = im.onerror = r; })));
if (document.fonts && document.fonts.ready) await document.fonts.ready;

// ---------- geometry + timeline (rebuilt on a real resize)
const stage = $('#stage'), cam = $('#cam'), bd = $('#bd'), rack = $('#rack'), track = $('#track');
let tl, st0, landAt = [], lastN = -1, builtW = 0, builtH = 0;
// v0.4.1 item 4: the backdrop drawn in WebGL with depth (site-gl.js). Off under reduced motion or ?gl=0: the static photo.
const site = (rm || q.get('gl') === '0' || !window.SiteGL) ? null : await SiteGL.create({ host: bd, img: $('#bdA'), fx: D.backdrop.replace(/\.jpg$/, '.fx.json'),
  time: q.has('t') ? +q.get('t') : null, fine: matchMedia('(hover: hover) and (pointer: fine)').matches });
const GL = !!(site && site.ok); document.documentElement.dataset.dbg = GL ? 'gl' : 'static';
// v0.4.1: the card is sized to its content. Budget = the space under the stockroom's counter; if a category does not fit
// (small screens), the type steps down to 13 px and then the "full reasons" line goes. The Approach artwork is never scaled
// below its width, so it stays exactly as printed.
function fitCards() { const H = stage.clientHeight, budget = H - 152 - 24;
  cards.forEach(c => { const b = c.querySelector('.card-b'); if (!b) return; const more = b.querySelector('.more'); let fs = 15;
    gsap.set(c, { visibility: 'inherit' }); more.hidden = false; b.style.setProperty('--fs', fs + 'px'); b.style.setProperty('--th', '20px');
    while (c.offsetHeight > budget && fs > 13) { fs -= .5; b.style.setProperty('--fs', fs + 'px'); }
    if (c.offsetHeight > budget) more.hidden = true;
    if (c.offsetHeight > budget) b.style.setProperty('--th', '17px');
    gsap.set(c, { clearProps: 'visibility' }); }); }
function build() {
  const keep = tl ? tl.progress() : 0;
  if (tl) { st0 && st0.kill(); tl.kill(); gsap.set([cam, bd, rack, '#rk', '#intro', '#end', '#capshade', '#rkdim', ...its.map(e => e.querySelector('.ph')), ...flies, ...caps, ...cos, ...cards, ...Object.values(bands), ...$$('#co .hzl, #co .hzl .hk, #co .hzl .hz, #co .hzl .w i, #co .hzl .hr, #co .hzl .hw, #co .bf'), ...lys], { clearProps: 'all' }); }
  const W = builtW = stage.clientWidth, H = builtH = stage.clientHeight;
  const manH = .91 * H, k = manH / F.h, manW = F.w * k, feetY = .905 * H, top = feetY - .9577 * manH, cx = .27 * W, left = cx - manW / 2;
  const Fp = { x: .31 * W, y: .43 * H };
  gsap.set(manEl, { left, top, width: manW, height: manH });
  gsap.set('#cast', { left, top, width: manW, height: manH, skewX: -42, scaleY: .2 });       // sun low behind the camera: a short shadow falling away from it
  gsap.set('.contact', { left: cx - manW * .32, top: feetY - 15, width: manW * .64, height: 30 });
  const rw = rack.clientWidth, sc = Math.max(rw / D.rack.w, H / D.rack.h), ox = (rw - D.rack.w * sc) / 2, oy = (H - D.rack.h * sc) / 2, rackLeft = W - rw;
  const pos = steps.map((s, i) => { const [x, y, h] = s.place; const hh = h * sc, im = its[i].querySelector('.ph img'), ww = hh * ((im && im.naturalWidth / im.naturalHeight) || 1);
    gsap.set(its[i], { left: ox + x * sc, top: oy + y * sc, width: ww, height: hh });
    const pk = its[i].querySelector('.pack'); if (pk) gsap.set(pk, { height: s.pack.h * sc, left: ww / 2 + s.pack.dx * sc, xPercent: -50 });
    return { x: rackLeft + ox + x * sc, y: oy + y * sc - hh / 2, w: ww, h: hh }; });
  fitCards();
  const o = { x: -.10 * W, y: -.16 * H }, bw0 = 1.2 * W, bh0 = 1.32 * H, bim = $('#bdA'), cs = Math.max(bw0 / bim.naturalWidth, bh0 / bim.naturalHeight), iw = bim.naturalWidth * cs, ih = bim.naturalHeight * cs;
  const iox = (bw0 - iw) * .5, ioy = (bh0 - ih) * .58;
  if (GL) site.setGeom({ bw: bw0, bh: bh0, ox: iox, oy: ioy, iw, ih, o, Fp, feet: { x: (cx - o.x - iox) / iw, y: (feetY - o.y - ioy) / ih } });
  // a point of the photo (fractions) on the stage through bd transform b, including the depth displacement the shader draws
  const sitePt = (f, b) => { let lx = iox + f[0] * iw, ly = ioy + f[1] * ih;
    if (GL) { const dd = site.dispLocal(lx, ly, site.depthAt(f[0], f[1]), b); lx += dd.x; ly += dd.y; }
    return { x: o.x + lx * b.scale + b.x, y: o.y + ly * b.scale + b.y }; };
  const shot = box => {
    if (!box) return { cam: { x: 0, y: 0, scale: 1 }, bd: { x: 0, y: 0, scale: 1 }, s: 1 };
    const bw = (box[2] - box[0]) * k, bh = (box[3] - box[1]) * k, p = { x: left + (box[0] + box[2]) / 2 * k, y: top + (box[1] + box[3]) / 2 * k };
    const s = Math.max(1.2, Math.min(2.1, .44 * H / bh, .25 * W / bw)), sB = 1 + (s - 1) * .34, d = .42;
    return { s, bw: bw * s, bh: bh * s, cam: { x: Fp.x - p.x * s, y: Fp.y - p.y * s, scale: s },
      bd: { x: p.x + (Fp.x - p.x) * d - o.x - (p.x - o.x) * sB, y: p.y + (Fp.y - p.y) * d - o.y - (p.y - o.y) * sB, scale: sB } };
  };
  function layout(i, sh) {
    const g = cos[i], st = steps[i], z = { l: Fp.x - sh.bw / 2, r: Fp.x + sh.bw / 2, t: Fp.y - sh.bh / 2, b: Fp.y + sh.bh / 2 }, CW = 216, lines = [];
    const hzl = g.querySelector('.hzl'), pt = sitePt(st.hazard.at, sh.bd), hx = 32 + hzl.offsetWidth, hy = 160 + hzl.offsetHeight / 2;
    const inZone = pt.x > z.l - 20 && pt.x < z.r + 20 && pt.y > z.t - 20 && pt.y < z.b + 20;
    if (!inZone && pt.x > 24 && pt.x < rackLeft - 30 && pt.y > 160 + hzl.offsetHeight + 40 && pt.y < H - 320) lines.push([32 + 7.5, 160 + hzl.offsetHeight + 6, 32 + 7.5, 160 + hzl.offsetHeight + 24, pt.x, pt.y, 1]);
    const sideTop = { L: 160 + hzl.offsetHeight + 34, R: 156 }, lists = { L: [], R: [] };
    g.querySelectorAll('.bf').forEach((el, j) => { const a = st.anchors[j] || [.5, .5], A = { x: z.l + a[0] * sh.bw, y: z.t + a[1] * sh.bh }, side = a[0] < .5 ? 'L' : 'R';
      gsap.set(el, { width: CW }); lists[side].push({ el, A, y: A.y - 22, h: el.offsetHeight }); });
    for (const side of ['L', 'R']) { const list = lists[side].sort((a, b) => a.y - b.y); let prev = sideTop[side] - 26;
      list.forEach(c => { c.y = Math.max(c.y, prev + 26); prev = c.y + c.h; });
      const maxB = side === 'L' ? H - 34 - caps[i].offsetHeight - 30 : H - 44, over = prev - maxB; if (over > 0) list.forEach(c => { c.y -= over; });
      list.forEach(c => { const x = side === 'R' ? clamp(Math.max(c.A.x + 60, z.r + 30), 0, rackLeft + 24 - CW) : clamp(Math.min(c.A.x - 60, z.l - 30) - CW, 32, W);
        gsap.set(c.el, { left: x, top: c.y }); c.el.dataset.side = side;
        lines.push(side === 'R' ? [x, c.y + .6, x - 24, c.y + .6, c.A.x, c.A.y] : [x + CW, c.y + .6, x + CW + 24, c.y + .6, c.A.x, c.A.y]); }); }
    g.querySelector('.ln').innerHTML = lines.map(l => { const f = n => n.toFixed(1);
      return (l[6] ? '' : `<polyline pathLength="1" points="${f(l[0])},${f(l[1])} ${f(l[2])},${f(l[3])} ${f(l[4])},${f(l[5])}"/>`) + (l[6]
        ? `<circle class="s" cx="${f(l[4])}" cy="${f(l[5])}" r="9"/><circle class="sd" cx="${f(l[4])}" cy="${f(l[5])}" r="2.5"/>` : `<circle cx="${f(l[4])}" cy="${f(l[5])}" r="4.5"/>`); }).join('');
  }
  tl = gsap.timeline({ paused: true, defaults: { ease: 'power2.inOut' }, onUpdate: sync });
  tl.addLabel('intro', 0);
  tl.to('#intro', { autoAlpha: 0, x: -50, duration: .35, ease: 'power2.in' }, .15);
  // v0.4.1 item 5: the stockroom eases in with the scroll (a short drift and a fade), it no longer slams in from the edge
  tl.fromTo(rack, { xPercent: 12, autoAlpha: 0 }, { xPercent: 0, autoAlpha: 1, duration: .85, ease: 'sine.inOut' }, .2);
  tl.fromTo('#rk', { scale: 1.05 }, { scale: 1, duration: .85, ease: 'sine.out' }, .2);
  tl.from(its, { y: -22, autoAlpha: 0, stagger: .05, duration: .3, ease: 'power2.out' }, .62);
  let t = 1.25; landAt = [];
  tl.to('#capshade', { opacity: 1, duration: .4 }, t + .5);
  steps.forEach((s, i) => {
    const sh = shot(s.box), ph = its[i].querySelector('.ph'), f = flies[i], c = caps[i], g = cos[i], a = pos[i], card = cards[i], hasCard = !card.classList.contains('none');
    const band = bands[s.cat], newCat = i === 0 || steps[i - 1].cat !== s.cat, lastOfCat = i === N - 1 || steps[i + 1].cat !== s.cat;
    layout(i, sh);
    const tw = Math.max(sh.bw, 90), th = Math.max(sh.bh, 90), s0 = a.h / th;
    gsap.set(f, { width: tw, height: th, xPercent: -50, yPercent: -50, x: a.x, y: a.y, scale: s0, rotation: 0, opacity: 0 });
    tl.to(cam, { ...sh.cam, duration: .75 }, t).to(bd, { ...sh.bd, duration: .75 }, t);
    tl.to(ph, { y: -16, scale: 1.14, duration: .18, ease: 'power2.out' }, t);
    tl.set(ph, { autoAlpha: 0 }, t + .18).set(f, { opacity: 1, y: a.y - 16, scale: s0 * 1.14 }, t + .18);
    tl.to(f, { x: Fp.x, duration: .52, ease: 'power2.inOut' }, t + .18).to(f, { y: Fp.y, duration: .52, ease: 'back.in(1.1)' }, t + .18).to(f, { scale: 1, duration: .52, ease: 'power1.in' }, t + .18)
      .to(f, { rotation: i % 2 ? 5 : -5, duration: .26, ease: 'sine.out' }, t + .18).to(f, { rotation: 0, duration: .26, ease: 'sine.in' }, t + .44);
    tl.to(f, { opacity: 0, scale: .96, duration: .16, ease: 'power1.out' }, t + .66);
    tl.fromTo(lys[i], { opacity: 0 }, { opacity: 1, duration: .16, ease: 'power1.out' }, t + .64);
    landAt.push(t + .72);
    if (newCat) tl.fromTo(band, { autoAlpha: 0, xPercent: -18 }, { autoAlpha: 1, xPercent: 0, duration: .3, ease: 'power3.out' }, t + .28);
    tl.fromTo(c, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: .24, ease: 'power2.out' }, t + .74);
    tl.fromTo(c.querySelector('.rule'), { scaleX: 0 }, { scaleX: 1, duration: .24, ease: 'power2.out' }, t + .74);
    tl.fromTo(g, { autoAlpha: 0 }, { autoAlpha: 1, duration: .16, ease: 'power1.out' }, t + .8);
    // v0.4.1 item 7: the hazard lands as a moment: label, the hazard word by word, a rule that draws, then where it happens.
    { const hz = g.querySelector('.hzl');
      tl.fromTo(hz.querySelector('.hk'), { x: -12, opacity: 0 }, { x: 0, opacity: 1, duration: .16, ease: 'power2.out' }, t + .78);
      tl.fromTo(hz.querySelector('.hk .hz'), { scale: .3, rotation: -18 }, { scale: 1, rotation: 0, duration: .22, ease: 'back.out(2.2)' }, t + .78);
      tl.fromTo(hz.querySelectorAll('.ht .w i'), { yPercent: 110 }, { yPercent: 0, duration: .22, stagger: .05, ease: 'power3.out' }, t + .82);
      tl.fromTo(hz.querySelector('.hr'), { scaleX: 0 }, { scaleX: 1, duration: .24, ease: 'power2.out' }, t + .92);
      tl.fromTo(hz.querySelector('.hw'), { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: .2, ease: 'power2.out' }, t + 1.0);
      const ring = g.querySelector('.ln circle.s');   // the same amber pin, on the site: one pulse as the "where" line lands
      if (ring) tl.fromTo(ring, { scale: 2.6, transformOrigin: '50% 50%' }, { scale: 1, duration: .34, ease: 'power2.out' }, t + 1.0); }
    tl.fromTo(g.querySelectorAll('.ln polyline'), { strokeDashoffset: -1 }, { strokeDashoffset: 0, duration: .2, stagger: .06, ease: 'power1.out' }, t + .84);   // leaders draw outward from the product
    tl.fromTo(g.querySelectorAll('.ln circle'), { opacity: 0 }, { opacity: 1, duration: .1 }, t + .82);
    g.querySelectorAll('.bf').forEach((el, j) => tl.fromTo(el, { x: el.dataset.side === 'R' ? 12 : -12, opacity: 0 }, { x: 0, opacity: 1, duration: .18, ease: 'power2.out' }, t + .92 + j * .06));
    if (hasCard) { tl.to('#rkdim', { opacity: 1, duration: .28, ease: 'power1.out' }, t + 1.0); tl.fromTo(card, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: .3, ease: 'power3.out' }, t + 1.02); }
    tl.addLabel('s' + (i + 1), t + 1.36);
    tl.to([c, g], { autoAlpha: 0, duration: .16, ease: 'power1.in' }, t + 1.62);
    if (hasCard) { tl.to(card, { autoAlpha: 0, y: 18, duration: .18, ease: 'power1.in' }, t + 1.6); tl.to('#rkdim', { opacity: 0, duration: .2 }, t + 1.62); }
    if (lastOfCat) tl.to(band, { autoAlpha: 0, xPercent: -10, duration: .18, ease: 'power1.in' }, t + 1.62);
    t += 1.82;
  });
  tl.to('#capshade', { opacity: 0, duration: .3 }, t);
  const w = shot(null);
  tl.to(cam, { ...w.cam, duration: .8 }, t).to(bd, { ...w.bd, duration: .8 }, t);
  tl.to(rack, { xPercent: 12, autoAlpha: 0, duration: .6, ease: 'sine.inOut' }, t);
  tl.fromTo('#end', { autoAlpha: 0, x: 40 }, { autoAlpha: 1, x: 0, duration: .45, ease: 'power2.out' }, t + .55);
  tl.addLabel('end', t + 1.1); tl.to({}, { duration: .15 }, t + 1.1);
  track.style.height = (100 + tl.duration() * 58) + 'vh';
  lastN = -1; sync();
  const dbg = q.get('step');
  if (dbg) { const lab = /^[a-z]/.test(dbg) ? dbg : 's' + dbg; tl.seek(tl.labels[lab] + parseFloat(q.get('d') || 0), false); sync();
    if (GL && q.has('par')) { const b = { x: gsap.getProperty(bd, 'x'), y: gsap.getProperty(bd, 'y'), scale: gsap.getProperty(bd, 'scale') };   // debug: parallax in screen px per depth
      document.documentElement.dataset.dbg = 'gl ' + [['sky', [.5, .15]], ['stack', [.42, .47]], ['red', [.297, .32]], ['rack', [.1, .45]], ['road', [.5, .75]]].map(([n, f]) => { const p = sitePt(f, b);
        let lx = iox + f[0] * iw, ly = ioy + f[1] * ih; const p0 = { x: o.x + lx * b.scale + b.x, y: o.y + ly * b.scale + b.y };
        return `${n}(${site.depthAt(f[0], f[1]).toFixed(2)}):${(p.x - p0.x).toFixed(0)},${(p.y - p0.y).toFixed(0)}`; }).join(' '); }
    return; }
  st0 = ScrollTrigger.create({ animation: tl, trigger: track, start: 'top top', end: 'bottom bottom', scrub: .6,
    snap: { snapTo: 'labelsDirectional', duration: { min: .3, max: 1.2 }, delay: .15, ease: 'power1.inOut' } });
  if (keep > 0) { ScrollTrigger.refresh(); scrollTo(0, st0.start + (st0.end - st0.start) * keep); }
}
function sync() {
  const tt = tl.time(), n = landAt.filter(x => tt >= x).length;
  if (n === lastN) return; lastN = n;
  $('#cntI').textContent = n;
  progs.forEach((p, i) => p.classList.toggle('on', i < n));
  its.forEach((e, i) => { e.classList.toggle('gone', i < n); e.classList.toggle('on', i === n); });
}
build();
if (GL) site.start();

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
// phones and tablets fire resize whenever the address bar moves: rebuild only when the stage really changed
let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { if (pdOpen) return;
  if (Math.abs(stage.clientWidth - builtW) < 2 && Math.abs(stage.clientHeight - builtH) < 90) return; build(); }, 200); });

// ---------- product details. The page never scrolls while it is open and returns to exactly where it was.
const pd = $('#pd'); let pdOpen = false, pdY = 0, pdFrom = null, pdTl = null;
const stdHTML = s => s.split(/\s*·\s*/).filter(Boolean).map(x => `<li>${esc(x)}</li>`).join('');
function pdHTML(st) { const c = D.cats[st.cat];
  return `<div class="pd-l"><div class="pd-pic">${pic(st)}</div>${st.pack && !st.pack.pouch ? `<figure class="pd-pack"><img alt="" src="${st.pack.src}"><figcaption class="eyebrow">How it ships</figcaption></figure>` : ''}</div>
  <div class="pd-r"><p class="eyebrow g pd-a">${esc(SLOT[st.slot])} · ${esc(kit.name)} kit</p><h3 class="pd-a">${ty('name-' + st.product)}</h3><p class="desc pd-a">${esc(st.descriptor)}</p>
  <dl class="pd-spec pd-a"><div><dt>SKU</dt><dd>${esc(st.sku)}</dd></div>${st.material ? `<div><dt>Material</dt><dd>${esc(st.material)}</dd></div>` : ''}${st.colour ? `<div><dt>Colour</dt><dd>${esc(st.colour)}</dd></div>` : ''}</dl>
  ${st.standards ? `<div class="pd-std pd-a"><span class="lbl">Standards</span><ul>${stdHTML(st.standards)}</ul></div>` : ''}
  <div class="pd-why pd-a"><div><span class="lbl">Why on this site</span><p><b>${esc(st.hazard.title)}.</b> ${esc(st.hazard.where)}.</p></div><div><span class="lbl">Why this one</span><p>${esc(st.why)}</p></div></div>
  ${st.bullets.length ? `<div class="pd-ft pd-a"><span class="lbl">Features and benefits</span><ol>${st.bullets.map((x, j) => `<li><i>${num(j)}</i><span>${esc(x)}</span></li>`).join('')}</ol><p class="pd-src">Copy: ${esc(st.copySource)}.</p></div>` : ''}
  ${c.why ? `<div class="pd-wc pd-a">${ty('why-' + st.cat, 'h4')}<div class="wg">${c.why.items.map(x => `<div><b>${esc(x.h)}</b><p>${esc(x.t)}</p></div>`).join('')}</div>${c.approach ? `<img class="apr-art" src="${c.approach.art}" alt="The AVES Approach: ${esc(c.approach.word)}">` : ''}</div>` : ''}
  <div class="pd-act">${st.url ? `<a class="btn big" href="${esc(st.url)}" target="_blank" rel="noopener">Visit product page</a>` : `<span class="eyebrow">${esc(st.sisterNote)}</span>`}<button class="lnk" data-close>Back to the kit</button></div></div>`; }
function openDet(st, from, instant) {
  $('#pdB').innerHTML = pdHTML(st); pdOpen = true; pdY = scrollY; pdFrom = from || null; pd.setAttribute('aria-hidden', 'false'); $('#pdB').scrollTop = 0;
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
document.addEventListener('click', e => { const b = e.target.closest('[data-det]'); if (b) { openDet(steps[+b.dataset.det], b); return; }
  if (e.target.closest('[data-close]') || e.target === pd) closeDet(); });
addEventListener('keydown', e => { if (e.key === 'Escape') closeDet(); });
for (const ev of ['wheel', 'touchmove']) pd.addEventListener(ev, e => { if (!e.target.closest('#pdB') || $('#pdB').scrollHeight <= $('#pdB').clientHeight) e.preventDefault(); e.stopPropagation(); }, { passive: false });
$('#quote').addEventListener('click', e => { e.currentTarget.textContent = 'Added (preview)'; });
if (q.get('det')) openDet(steps[+q.get('det') - 1], null, true);
// v0.4.1 item 2: the intro arrives once on load (not on the scrub): lead line, then the hazards one by one.
if (!rm && !q.get('step') && scrollY < 4) gsap.timeline({ defaults: { ease: 'power3.out' } })
  .from('.intro .kicker, .intro h1', { y: 18, opacity: 0, duration: .5, stagger: .08 }, .1)
  .from('.intro .ki', { y: 14, opacity: 0, duration: .45 }, .3)
  .from('.intro .hzh', { x: -10, opacity: 0, duration: .3 }, .5)
  .from('.intro .hz li', { y: 14, opacity: 0, duration: .36, stagger: .07 }, .56)
  .from('.intro .cue', { opacity: 0, duration: .4 }, 1.05);
document.documentElement.dataset.ready = '1';
})().catch(e => { window.__errs.push('boot: ' + e.message); console.error(e); });
