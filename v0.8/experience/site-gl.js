// The AVES Experience v0.4.1: the site backdrop as a place with depth (owner's comment 4, 2026-11-13).
// A WebGL canvas inside #bd draws the site photo displaced by a depth map (Depth Anything V2 Small, made locally:
// ../tools/depth_map.py). Three inputs move it:
//   1. the scroll scrub, which already tweens #bd (x, y, scale): read back every frame and turned into a camera pan and
//      dolly, so near pipework travels further than the far stacks (real parallax on top of the CSS move);
//   2. the pointer (desktop only), on its own uniform, pivoted at the depth where the worker's boots stand;
//   3. time: smoke drifting from the stacks and a slow haze along the horizon. (DESIGN.md: "nothing loops" is lifted for
//      the backdrop only, at the owner's request.)
// The same displacement maths is exported (dispLocal) so hazard pins placed by sitePt() land where the shader draws.
// Reduced motion, no WebGL, or a lost context = the static <img> exactly as before.
(function () {
'use strict';
const VS = `attribute vec2 p;varying vec2 v;void main(){v=vec2(p.x*.5+.5,.5-p.y*.5);gl_Position=vec4(p,0.,1.);}`;
const FS = `precision highp float;
varying vec2 v;
uniform sampler2D uImg,uDep,uSky;
uniform vec2 uBox,uImgO,uImgS,uL,uPan,uPtr;
uniform float uZoom,uKp,uKz,uD0,uDp,uT,uFx;
uniform vec3 uHz,uHzC,uSmC,uGlC;   // haze: band centre y, band width, strength; haze colour; lit smoke colour; glow colour
uniform vec4 uGl[2];            // light points: x, y (local px), radius px, strength
uniform vec4 uPl[4];   // tip x, tip y (local px), length px, angle (rad, + = leaning left)
uniform vec4 uPw[4];   // w0, w1 (fractions of length), strength, seed
uniform float uPd[4];  // depth of each stack top
float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x),u.y);}
float fbm(vec2 p){float s=0.,a=.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);for(int i=0;i<4;i++){s+=a*noise(p);p=m*p;a*=.5;}return s;}
float dep(vec2 l){return texture2D(uDep,clamp((l-uImgO)/uImgS,0.,1.)).r;}   // filled front depth: smooth, no steps
float eff(float d){return d<uD0?d:uD0+(1.-exp(-(d-uD0)*1.8))/1.8;}   // the near ground is compressed: it sits under the worker
vec2 disp(vec2 l,float d){return (eff(d)-uD0)*(-uKp*uPan+uKz*uZoom*(l-uL))+(d-uDp)*uPtr;}
void main(){
  vec2 l=v*uBox;
  vec2 m=vec2(smoothstep(0.,60.,l.x)*smoothstep(0.,60.,uBox.x-l.x),smoothstep(0.,60.,l.y)*smoothstep(0.,60.,uBox.y-l.y));
  float edge=m.x*m.y;              // no displacement at the box border: nothing is ever sampled from outside the photo
  // front layer (structures + ground): warped by its own smooth depth, carrying its alpha matte
  vec2 s=l;
  for(int i=0;i<5;i++){s=mix(s,l-disp(l,dep(s))*edge,.75);}
  vec3 fd=texture2D(uDep,clamp((s-uImgO)/uImgS,0.,1.)).rgb;
  float d=fd.r,a=fd.g;
  // back layer (the sky plate, continued behind the structures): moves as the farthest plane
  vec2 sb=l-disp(l,0.)*edge;
  vec2 sm=vec2(0.);float smoke=0.,lit=0.,pd=0.,pwt=0.;
  if(uFx>.5){
    for(int k=0;k<4;k++){
      vec4 P=uPl[k],Q=uPw[k];if(Q.z<=0.)continue;
      // the plume is drawn in the frame of its own stack top (depth uPd), so it stays on the stack through every move
      vec2 r=(l-disp(l,uPd[k])*edge)-P.xy;vec2 dir=vec2(-sin(P.w),-cos(P.w));vec2 pp=vec2(-dir.y,dir.x);
      float al=dot(r,dir)/P.z,ac=dot(r,pp)/P.z;
      if(al<-.06||al>1.15)continue;
      ac-=.20*al*al;                                // wind bends the plume over
      float w=mix(Q.x,Q.y,sqrt(clamp(al,0.,1.)));  // spreads fast off the stack, then slowly
      float u=ac/w;
      if(abs(u)>2.6)continue;
      // advected noise: the field rises with the plume (about one plume length every 14 s), domain-warped so it billows and curls
      vec2 q=vec2(u*.9+Q.w,al*2.6/(.4+w*2.)-uT*.16);
      vec2 wq=vec2(fbm(q*1.1+vec2(1.7,-uT*.05)),fbm(q*1.1+vec2(8.3,2.8)));
      float n=fbm(q*1.6+wq*1.8);
      float n2=fbm(q*4.2+wq*2.4+vec2(0.,-uT*.1));
      float prof=exp(-u*u*1.5);
      float life=smoothstep(-.05,.03,al)*(1.-smoothstep(.25,1.05,al+(n-.5)*.35));
      float a=smoothstep(.34,.72,prof*(.55+.6*n)+.18*n2-.12*al)*life*Q.z*(1.-.45*al);
      smoke=max(smoke,a);
      lit=max(lit,a*(.35+.9*(n2-.35)));             // front-lit: lighter where the billow faces the camera
      float bw=prof*life;pd+=uPd[k]*bw;pwt+=bw;
      sm+=(wq-.5)*vec2(8.,5.)*prof*life*smoothstep(.1,.3,al);   // the painted plume in the photo billows with it
    }
    if(pwt>0.){float wt=min(pwt,1.);sb=l-disp(l,pd/max(pwt,1e-4)*wt)*edge;}  // the painted plume rides with its stack too
  }
  vec3 cb=texture2D(uSky,clamp((sb+sm-uImgO)/uImgS,0.,1.)).rgb;
  vec3 c=mix(cb,texture2D(uImg,clamp((s-uImgO)/uImgS,0.,1.)).rgb,a);
  d*=a;
  smoke*=1.-a*.85;                                 // a structure in front hides the smoke behind it
  if(uFx>.5){
    vec2 f=(s-uImgO)/uImgS;
    float band=exp(-pow((f.y-uHz.x)/uHz.y,2.))*(1.-smoothstep(.06,.3,d));
    float hz=band*(.35+.65*fbm(vec2(f.x*3.2-uT*.012,f.y*9.+uT*.004)))*uHz.z;
    c=mix(c,uHzC,hz);
    for(int g=0;g<2;g++){vec4 Gp=uGl[g];if(Gp.w<=0.)continue;        // a light that flickers (arc, flare): additive, on its own depth
      vec2 gr=(l-disp(l,dep(Gp.xy))*edge)-Gp.xy;float gd=length(gr)/Gp.z;
      float fl=.55+.45*noise(vec2(uT*9.+float(g)*7.,3.))*noise(vec2(uT*23.,float(g)));
      c+=uGlC*Gp.w*fl*(exp(-gd*gd*3.)+.35*exp(-gd*gd*.5));}
    vec3 sc=mix(uSmC*.76,uSmC,clamp(lit/max(smoke,.05),0.,1.));  // shaded billows, lighter where lit
    c=mix(c,sc,smoke*.66);
  }
  gl_FragColor=vec4(c,1.);
}`;

function load(src) { return new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => rej(new Error('load ' + src)); im.src = src; }); }

async function create(o) {
  // o: { host, img, fx (url of the site fx json), time (fixed seconds or null), fine (pointer allowed) }
  const api = { ok: false, ptr: { x: 0, y: 0 }, depthAt: () => 0, dispLocal: () => ({ x: 0, y: 0 }), ptrLocal: () => ({ x: 0, y: 0 }), setGeom() {}, onFrame: null, stats: { frames: 0, ms: 0 } };
  let FX;
  try { FX = await (await fetch(o.fx)).json(); } catch (e) { return api; }
  const [dim, skim] = await Promise.all([load(FX.depth), load(FX.sky)]).catch(() => [null, null]); if (!dim || !skim) return api;
  // depth for JS (pins): read the map once into an array
  const dc = document.createElement('canvas'); dc.width = dim.naturalWidth; dc.height = dim.naturalHeight;
  const dx = dc.getContext('2d', { willReadFrequently: true }); dx.drawImage(dim, 0, 0);
  const dd = dx.getImageData(0, 0, dc.width, dc.height).data, DW = dc.width, DH = dc.height;
  const depthAt = (fx, fy) => { const x = Math.round(Math.max(0, Math.min(1, fx)) * (DW - 1)), y = Math.round(Math.max(0, Math.min(1, fy)) * (DH - 1)); return dd[(y * DW + x) * 4] / 255; };
  api.depthAt = depthAt;
  const K = FX.k, D0 = K.d0;
  const eff = d => d < D0 ? d : D0 + (1 - Math.exp(-(d - D0) * 1.8)) / 1.8;
  let G = null;    // geometry from app.js: box, image cover, o (box offset on the stage), Fp (camera focus on the stage)
  const camOf = b => { const L = { x: (G.Fp.x - G.o.x - b.x) / b.scale, y: (G.Fp.y - G.o.y - b.y) / b.scale }, L0 = { x: G.Fp.x - G.o.x, y: G.Fp.y - G.o.y };
    return { L, pan: { x: L.x - L0.x, y: L.y - L0.y }, zoom: b.scale - 1 }; };
  // displacement of a point of the photo (local px of the box) seen through bd transform b: the forward form of the shader
  api.dispLocal = (lx, ly, d, b) => { if (!api.ok || !G) return { x: 0, y: 0 }; const c = camOf(b), e = eff(d) - D0;
    return { x: e * (-K.pan * c.pan.x + K.zoom * c.zoom * (lx - c.L.x)), y: e * (-K.pan * c.pan.y + K.zoom * c.zoom * (ly - c.L.y)) }; };
  let uPtr = { x: 0, y: 0 }, Dp = K.dp;
  api.ptrLocal = d => ({ x: (d - Dp) * uPtr.x, y: (d - Dp) * uPtr.y });
  api.setGeom = g => { G = g; resize(); };

  const cv = document.createElement('canvas'); cv.className = 'bd-gl'; cv.setAttribute('aria-hidden', 'true');
  const gl = cv.getContext('webgl', { antialias: false, alpha: false, premultipliedAlpha: false, powerPreference: 'high-performance' });
  if (!gl) return api;
  const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
  let pr;
  try { pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr)); } catch (e) { window.__errs && window.__errs.push('gl: ' + e.message); return api; }
  gl.useProgram(pr);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const ap = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(ap); gl.vertexAttribPointer(ap, 2, gl.FLOAT, false, 0, 0);
  const tex = (im, unit) => { const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, im); return t; };
  tex(o.img, 0); tex(dim, 1); tex(skim, 2);
  const U = n => gl.getUniformLocation(pr, n);
  const u = Object.fromEntries(['uImg', 'uDep', 'uSky', 'uBox', 'uImgO', 'uImgS', 'uL', 'uPan', 'uPtr', 'uZoom', 'uKp', 'uKz', 'uD0', 'uDp', 'uT', 'uFx', 'uPl', 'uPw', 'uPd[0]', 'uHz', 'uHzC', 'uSmC', 'uGlC', 'uGl'].map(n => [n, U(n)]));
  gl.uniform1i(u.uImg, 0); gl.uniform1i(u.uDep, 1); gl.uniform1i(u.uSky, 2); gl.uniform1f(u.uKp, K.pan); gl.uniform1f(u.uKz, K.zoom); gl.uniform1f(u.uD0, D0); gl.uniform1f(u.uFx, 1);
  if (gl.getError() !== gl.NO_ERROR) return api;
  o.host.appendChild(cv);

  const HZ = FX.haze || {}, GLW = (FX.glows || []).slice(0, 2); let q = 1;   // q: adaptive render scale
  gl.uniform3f(u.uHz, HZ.y == null ? .565 : HZ.y, HZ.w || .075, HZ.a == null ? .16 : HZ.a);
  gl.uniform3fv(u.uHzC, new Float32Array(HZ.color || [.95, .87, .77])); gl.uniform3fv(u.uSmC, new Float32Array(FX.smoke || [.97, .94, .90])); gl.uniform3fv(u.uGlC, new Float32Array(FX.glowColor || [1, .86, .62]));
  function resize() { if (!G) return; const r = Math.min((window.devicePixelRatio || 1) * (o.res ? o.res() : 1), o.res && o.res() > 1 ? 1.6 : 1.25) * q;   // a scaled-up stage draws more pixels, within a cap
    cv.width = Math.round(G.bw * r); cv.height = Math.round(G.bh * r); gl.viewport(0, 0, cv.width, cv.height);
    gl.uniform2f(u.uBox, G.bw, G.bh); gl.uniform2f(u.uImgO, G.ox, G.oy); gl.uniform2f(u.uImgS, G.iw, G.ih);
    Dp = depthAt(G.feet.x, G.feet.y); gl.uniform1f(u.uDp, Dp);
    const pl = new Float32Array(16), pw = new Float32Array(16);
    FX.plumes.slice(0, 4).forEach((p, i) => { pl.set([G.ox + p.at[0] * G.iw, G.oy + p.at[1] * G.ih, p.len * G.ih, p.lean * Math.PI / 180], i * 4); pw.set([p.w0, p.w1, p.a, i * 17.3], i * 4); });
    gl.uniform4fv(u.uPl, pl); gl.uniform4fv(u.uPw, pw);
    const gw = new Float32Array(8); GLW.forEach((g, i) => gw.set([G.ox + g.at[0] * G.iw, G.oy + g.at[1] * G.ih, (g.r || .05) * G.ih, g.a == null ? .5 : g.a], i * 4)); gl.uniform4fv(u.uGl, gw);
    gl.uniform1fv(u['uPd[0]'], new Float32Array([0, 1, 2, 3].map(i => { const p = FX.plumes[i]; return p ? depthAt(p.at[0], p.at[1] + .01) : 0; }))); }

  // pointer: desktop only, eased; amplitude in local px at one unit of depth difference
  const tgt = { x: 0, y: 0 };
  if (o.fine) addEventListener('pointermove', e => { if (e.pointerType !== 'mouse') return; tgt.x = e.clientX / innerWidth * 2 - 1; tgt.y = e.clientY / innerHeight * 2 - 1; }, { passive: true });
  if (o.fine) document.documentElement.addEventListener('mouseleave', () => { tgt.x = 0; tgt.y = 0; });

  let raf = 0, last = 0, t0 = performance.now(), lost = false, first = true, slowN = 0, frameN = 0, fxOn = true;
  cv.addEventListener('webglcontextlost', e => { e.preventDefault(); lost = true; api.ok = false; cancelAnimationFrame(raf); cv.style.display = 'none'; o.img.style.visibility = ''; });
  const P = { x: 0, y: 0 };
  function frame(now) {
    raf = 0; if (lost || document.hidden) return;
    const dt = Math.min(.1, (now - (last || now)) / 1000); last = now;
    const a = 1 - Math.exp(-dt * 3.2); P.x += (tgt.x - P.x) * a; P.y += (tgt.y - P.y) * a;
    const T0 = o.time != null ? o.time : (now - t0) / 1000, sw = K.sway == null ? .4 : K.sway;   // the place breathes: a slow sway, pointer or not
    const amp = K.ptr * Math.min(G.bw, G.bh); uPtr = { x: -(P.x + sw * Math.sin(T0 * .23)) * amp, y: -(P.y * .6 + sw * .5 * Math.sin(T0 * .17 + 1.3)) * amp };
    // smoothness first: if frames run slow for a second, draw smaller; if that is not enough, drop the effects; then hand back to the photo
    if (o.time == null && dt > 0) { slowN = dt > .026 ? slowN + 1 : Math.max(0, slowN - 2); frameN++;
      if (slowN > 45 && frameN > 90) { slowN = 0; frameN = 0;
        if (q > .5) { q = Math.max(.5, q - .25); resize(); } else if (fxOn) { fxOn = false; gl.uniform1f(u.uFx, 0); }
        else { lost = true; api.ok = false; cv.style.display = 'none'; o.img.style.visibility = ''; return; } } }
    api.stats.q = q; api.stats.fx = fxOn;
    const b = { x: +gsap.getProperty(o.host, 'x') || 0, y: +gsap.getProperty(o.host, 'y') || 0, scale: +gsap.getProperty(o.host, 'scale') || 1 }, c = camOf(b);
    const T = o.time != null ? o.time : (now - t0) / 1000;
    gl.uniform2f(u.uL, c.L.x, c.L.y); gl.uniform2f(u.uPan, c.pan.x, c.pan.y); gl.uniform1f(u.uZoom, c.zoom); gl.uniform2f(u.uPtr, uPtr.x, uPtr.y); gl.uniform1f(u.uT, T + 40);
    const s = performance.now(); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    api.stats.frames++; api.stats.ms += performance.now() - s;
    if (first) { first = false; cv.style.opacity = 1; o.img.style.visibility = 'hidden'; }
    api.onFrame && api.onFrame(b);
    raf = requestAnimationFrame(frame);
  }
  const start = () => { if (!raf && !lost && G) { last = 0; raf = requestAnimationFrame(frame); } };
  document.addEventListener('visibilitychange', () => { if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else start(); });
  api.start = start;
  api.ok = true;
  return api;
}
window.SiteGL = { create };
})();
