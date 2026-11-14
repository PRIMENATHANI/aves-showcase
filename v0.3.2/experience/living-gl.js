// The AVES Experience v0.3.2: living photographs. One WebGL context per canvas draws one or more "panels" (a picture
// with its depth map) and moves a camera through the depth: near things travel further than far ones, so a still reads
// as a slow cinematic shot. On top: haze bands, smoke / steam / dust plumes, flickering light points, light shafts and
// particles (sparks, embers, dust motes, falling debris), all set per picture in living-fx.js (image-normalised coords).
// Depth maps: Depth Anything V2 Small, made locally (../gen/depth_batch.py, after v0.6/tools/depth_map.py).
// Pattern after v0.6/experience/site-gl.js (fixed-point inverse warp, adaptive quality). Transform-free: the canvas is
// placed by its owner; the engine only draws. If WebGL is missing or frames run slow, ok goes false and the owner falls
// back to its CSS motion.
(function () {
'use strict';
const VS = `attribute vec2 p;uniform vec4 uRect;uniform vec2 uCv;varying vec2 v;
void main(){v=vec2(p.x*.5+.5,.5-p.y*.5);vec2 q=uRect.xy+v*uRect.zw;gl_Position=vec4(q.x/uCv.x*2.-1.,1.-q.y/uCv.y*2.,0.,1.);}`;
const FS = `precision highp float;
varying vec2 v;
uniform sampler2D uImg,uDep;
uniform vec4 uRect;
uniform vec2 uImgO,uImgS,uPan;
uniform float uZoom,uD0,uEdge,uT,uFx,uFade;
uniform vec3 uHz,uHzC,uSmC,uGlC,uShC;
uniform vec4 uGl[3];
uniform vec4 uPl[3];
uniform vec4 uPw[3];
uniform float uPd[3];
uniform vec4 uSh,uSh2;
float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x),u.y);}
float fbm(vec2 p){float s=0.,a=.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);for(int i=0;i<4;i++){s+=a*noise(p);p=m*p;a*=.5;}return s;}
vec2 iu(vec2 l){return clamp((l-uImgO)/uImgS,0.,1.);}
float dep(vec2 l){return texture2D(uDep,iu(l)).r;}
vec2 disp(vec2 l,float d){return (d-uD0)*(uPan+uZoom*(l-uRect.zw*.5));}
void main(){
  vec2 B=uRect.zw,l=v*B;
  float edge=1.;
  if(uEdge>0.){vec2 m=vec2(smoothstep(0.,uEdge,l.x)*smoothstep(0.,uEdge,B.x-l.x),smoothstep(0.,uEdge,l.y)*smoothstep(0.,uEdge,B.y-l.y));edge=m.x*m.y;}
  vec2 s=l;
  for(int i=0;i<5;i++){s=mix(s,l-disp(l,dep(s))*edge,.75);}
  float d=dep(s);
  vec2 sm=vec2(0.);float smoke=0.,lit=0.;
  if(uFx>.5){
    for(int k=0;k<3;k++){
      vec4 P=uPl[k],Q=uPw[k];if(Q.z<=0.)continue;
      vec2 r=(l-disp(l,uPd[k])*edge)-P.xy;vec2 dir=vec2(-sin(P.w),-cos(P.w));vec2 pp=vec2(-dir.y,dir.x);
      float al=dot(r,dir)/P.z,ac=dot(r,pp)/P.z;
      if(al<-.06||al>1.15)continue;
      ac-=.18*al*al;
      float w=mix(Q.x,Q.y,sqrt(clamp(al,0.,1.)));
      float u=ac/w;
      if(abs(u)>2.6)continue;
      vec2 q=vec2(u*.9+Q.w,al*2.6/(.4+w*2.)-uT*.16);
      vec2 wq=vec2(fbm(q*1.1+vec2(1.7,-uT*.05)),fbm(q*1.1+vec2(8.3,2.8)));
      float n=fbm(q*1.6+wq*1.8);
      float n2=fbm(q*4.2+wq*2.4+vec2(0.,-uT*.1));
      float prof=exp(-u*u*1.5);
      float life=smoothstep(-.05,.03,al)*(1.-smoothstep(.25,1.05,al+(n-.5)*.35));
      float a=smoothstep(.34,.72,prof*(.55+.6*n)+.18*n2-.12*al)*life*Q.z*(1.-.45*al);
      smoke=max(smoke,a);
      lit=max(lit,a*(.35+.9*(n2-.35)));
      sm+=(wq-.5)*vec2(7.,4.)*prof*life*smoothstep(.1,.3,al);
    }
  }
  vec3 c=texture2D(uImg,iu(s+sm)).rgb;
  if(uFx>.5){
    vec2 f=iu(s);
    if(uHz.z>0.){
      float band=exp(-pow((f.y-uHz.x)/uHz.y,2.))*(1.-smoothstep(.35,.8,d));
      float hz=band*(.3+.7*fbm(vec2(f.x*3.2-uT*.035,f.y*7.+uT*.01)))*uHz.z;
      c=mix(c,uHzC,hz);
    }
    if(uSh.w>0.){                                  // light shafts: rays from a source, slowly breathing, behind near things
      vec2 r=s-uSh.xy;float ang=atan(r.x,r.y)-uSh.z;float dist=length(r);
      float cone=exp(-ang*ang/(uSh2.x*uSh2.x));
      float rays=fbm(vec2(ang*uSh2.z+uT*.05,uT*.03))*1.3-.25;
      rays=max(rays,0.)*(.6+.4*sin(uT*.35+ang*7.));
      float fall=smoothstep(0.,uSh2.y*.15,dist)*(1.-smoothstep(uSh2.y*.4,uSh2.y,dist));
      c+=uShC*uSh.w*cone*rays*fall*(1.-smoothstep(.55,.85,d));
    }
    for(int g=0;g<3;g++){vec4 Gp=uGl[g];if(Gp.w<=0.)continue;
      vec2 gr=(l-disp(l,dep(Gp.xy))*edge)-Gp.xy;float gd=length(gr)/Gp.z;
      float fl=.6+.4*noise(vec2(uT*7.+float(g)*7.,3.))*noise(vec2(uT*17.,float(g)+1.));
      c+=uGlC*Gp.w*fl*(exp(-gd*gd*3.)+.3*exp(-gd*gd*.45));}
    vec3 sc=mix(uSmC*.74,uSmC,clamp(lit/max(smoke,.05),0.,1.));
    c=mix(c,sc,smoke*.7);
  }
  gl_FragColor=vec4(c,uFade);
}`;
// particles: stateless, positions from time + seed; quads (streaks for sparks, soft discs otherwise)
const PVS = `attribute vec2 aC;attribute vec2 aS;
uniform vec4 uRect;uniform vec2 uCv,uImgO,uImgS,uPan;uniform float uZoom,uD0,uT,uType,uLife,uSize,uCount,uDE,uSc;
uniform vec4 uEm,uDir;
varying vec2 vq;varying float va;
float h(float n){return fract(sin(n)*43758.5453);}
vec2 toL(vec2 ip){vec2 l=uImgO+ip*uImgS;return l+(uDE-uD0)*(uPan+uZoom*(l-uRect.zw*.5));}
void main(){
  float i=aS.x;va=0.;vq=aC;
  if(i>=uCount){gl_Position=vec4(2.,2.,0.,1.);return;}
  float h1=h(i*1.7+.3),h2=h(i*3.1+1.1),h3=h(i*5.3+2.7),h4=h(i*7.9+.9);
  float L=uLife*(.6+.8*h4),tau=fract(uT/L+h1)*L,k=tau/L;
  vec2 A=vec2(0.),Bp=vec2(0.);float w=uSize,streak=0.;
  vec2 asp=vec2(1.,uImgS.x/uImgS.y);
  if(uType<.5){        // sparks: ballistic, image units (x = 1 across the picture)
    float an=uDir.x+(h2-.5)*uDir.y;vec2 dv=vec2(sin(an),-cos(an))*uDir.z*(.35+.65*h3);
    vec2 e=uEm.xy+(vec2(h3,h2)-.5)*uEm.zw;
    vec2 g=vec2(0.,uDir.w);
    Bp=e+dv*tau+.5*g*tau*tau;float t0=max(tau-.05,0.);A=e+dv*t0+.5*g*t0*t0;
    va=pow(1.-k,1.6)*(.5+.5*h4);streak=1.;w=uSize*(.6+.6*h3);
  } else if(uType<1.5){ // embers: rise and wander
    vec2 e=uEm.xy+(vec2(h2,h3)-.5)*uEm.zw;
    Bp=e+vec2(sin(tau*1.4+h2*6.)*.025+uDir.x*tau,-uDir.z*tau);va=smoothstep(0.,.15,k)*(1.-k)*(.5+.5*h3);w=uSize*(.6+.8*h4);
  } else if(uType<2.5){ // motes: drift in a box, twinkle
    vec2 e=uEm.xy+vec2(h2,h3)*uEm.zw;
    Bp=e+vec2(sin(uT*.21+h1*6.3)*.02+uDir.x*sin(uT*.05+h4*6.),cos(uT*.17+h2*6.3)*.015-uDir.z*fract(uT*.01+h4)*.06);
    va=(.45+.55*sin(uT*(.6+h3)+h1*6.3))*(.4+.6*h4);w=uSize*(.5+h3);
  } else {              // debris: falls
    vec2 e=uEm.xy+vec2((h2-.5)*uEm.z,(h3-.5)*uEm.w);
    Bp=e+vec2(uDir.x*tau+(h4-.5)*.03*tau,.5*uDir.w*tau*tau);va=smoothstep(0.,.08,k)*(1.-smoothstep(.75,1.,k));w=uSize*(.5+h3);
  }
  Bp.y*=asp.y;A.y*=asp.y;                 // y in image units (x = width) -> image fraction
  vec2 lb=toL(Bp),la=toL(A);
  vec2 q;
  float W=w*uSc;
  if(streak>.5){vec2 d=lb-la;float n=length(d);vec2 dn=n>1e-3?d/n:vec2(0.,1.);vec2 nn=vec2(-dn.y,dn.x);
    q=mix(la,lb,aC.x*.5+.5)+nn*aC.y*W*.5;}
  else q=lb+aC*W;
  vec2 cp=uRect.xy+q;
  gl_Position=vec4(cp.x/uCv.x*2.-1.,1.-cp.y/uCv.y*2.,0.,1.);
}`;
const PFS = `precision highp float;varying vec2 vq;varying float va;uniform vec3 uCol;uniform float uA,uType,uFade;
void main(){float a;
  if(uType<.5){a=(1.-vq.y*vq.y)*(.35+.65*(vq.x*.5+.5));}
  else{float r=length(vq);a=exp(-r*r*3.5);if(r>1.)discard;}
  gl_FragColor=vec4(uCol,a*va*uA*uFade);}`;

const MAXP = 220;

function create(cv, opts) {
  opts = opts || {};
  const api = { ok: false, fx: true, q: 1, stats: { frames: 0, slow: 0 }, kits: {} };
  let gl = null;
  try { gl = cv.getContext('webgl', { antialias: false, alpha: true, premultipliedAlpha: false, powerPreference: 'high-performance' }); } catch (e) {}
  if (!gl) return api;
  const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
  const prog = (a, b) => { const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, a)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, b)); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p)); return p; };
  let P1, P2;
  try { P1 = prog(VS, FS); P2 = prog(PVS, PFS); } catch (e) { window.__errs && window.__errs.push('gl: ' + e.message); return api; }
  const U = (p, names) => Object.fromEntries(names.map(n => [n, gl.getUniformLocation(p, n)]));
  const u1 = U(P1, ['uImg', 'uDep', 'uRect', 'uCv', 'uImgO', 'uImgS', 'uPan', 'uZoom', 'uD0', 'uEdge', 'uT', 'uFx', 'uFade', 'uHz', 'uHzC', 'uSmC', 'uGlC', 'uShC', 'uGl', 'uPl', 'uPw', 'uPd', 'uSh', 'uSh2']);
  const u2 = U(P2, ['uRect', 'uCv', 'uImgO', 'uImgS', 'uPan', 'uZoom', 'uD0', 'uT', 'uType', 'uLife', 'uSize', 'uCount', 'uDE', 'uSc', 'uEm', 'uDir', 'uCol', 'uA', 'uFade']);
  const quad = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, quad); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const a1 = gl.getAttribLocation(P1, 'p');
  // particle buffer: 6 vertices per particle (corner xy, seed index, spare)
  const pv = new Float32Array(MAXP * 6 * 4); const C = [[-1, -1], [1, -1], [-1, 1], [-1, 1], [1, -1], [1, 1]];
  for (let i = 0; i < MAXP; i++) for (let j = 0; j < 6; j++) pv.set([C[j][0], C[j][1], i, 0], (i * 6 + j) * 4);
  const pbuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, pbuf); gl.bufferData(gl.ARRAY_BUFFER, pv, gl.STATIC_DRAW);
  const aC = gl.getAttribLocation(P2, 'aC'), aS = gl.getAttribLocation(P2, 'aS');
  gl.useProgram(P1); gl.uniform1i(u1.uImg, 0); gl.uniform1i(u1.uDep, 1);
  gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
  if (gl.getError() !== gl.NO_ERROR) return api;

  let lost = false;
  cv.addEventListener('webglcontextlost', e => { e.preventDefault(); lost = true; api.ok = false; api.onFail && api.onFail('lost'); });

  // ---- textures: decoded off the main thread where the browser can, uploaded one per frame (never on hover)
  const pending = [];   // kit records waiting for upload
  const mkTex = (src, fmt) => { const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, fmt, fmt, gl.UNSIGNED_BYTE, src); return t; };
  const decode = async url => {
    const r = await fetch(url); if (!r.ok) throw new Error(url + ' ' + r.status);
    const b = await r.blob();
    if (window.createImageBitmap) { try { return await createImageBitmap(b); } catch (e) {} }
    const im = new Image(); im.src = URL.createObjectURL(b); await im.decode(); return im;
  };
  api.load = (id, imgUrl, depUrl) => {
    if (api.kits[id]) return api.kits[id].p;
    const K = { id, ready: false, tex: null, dep: null };
    K.p = Promise.all([decode(imgUrl), decode(depUrl)]).then(([im, dm]) => {
      // depth for JS: emitter depths
      const c = document.createElement('canvas'); c.width = 128; c.height = 160; const x = c.getContext('2d', { willReadFrequently: true });
      x.drawImage(dm, 0, 0, 128, 160); K.dd = x.getImageData(0, 0, 128, 160).data;
      K.im = im; K.dm = dm; K.w = im.width; K.h = im.height;
      return new Promise(res => { K.res = res; pending.push(K); kick(); });
    }).catch(e => { K.err = e; });
    api.kits[id] = K; return K.p;
  };
  api.ready = id => !!(api.kits[id] && api.kits[id].ready);
  api.depthAt = (id, fx, fy) => { const K = api.kits[id]; if (!K || !K.dd) return 0;
    const x = Math.round(Math.max(0, Math.min(1, fx)) * 127), y = Math.round(Math.max(0, Math.min(1, fy)) * 159); return K.dd[(y * 128 + x) * 4] / 255; };
  const uploadOne = () => { const K = pending.shift(); if (!K) return;
    K.tex = mkTex(K.im, gl.RGB); K.dep = mkTex(K.dm, gl.LUMINANCE); K.ready = true;
    if (K.im.close) K.im.close(); if (K.dm.close) K.dm.close(); K.im = K.dm = null; K.res(); };

  // ---- size: backing store = css size x min(dpr, maxScale) x q, never above maxH device px tall (the pictures are 1280 tall)
  let cssW = 1, cssH = 1;
  api.setSize = (w, h) => { cssW = Math.max(1, w); cssH = Math.max(1, h); applySize(); };
  function applySize() {
    let r = Math.min(window.devicePixelRatio || 1, opts.maxScale || 1.25) * api.q;
    if (opts.maxH) r = Math.min(r, opts.maxH / cssH);
    const W = Math.max(1, Math.round(cssW * r)), H = Math.max(1, Math.round(cssH * r));
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    gl.viewport(0, 0, W, H);
  }

  // ---- one panel: { kit, fx (config), x, y, w, h (css px in the canvas), cover: {ox, oy, iw, ih} (local px),
  //      pan: {x, y} (local px), zoom, d0, edge (px), t (s), fade (0..1), fxOn }
  const fxCache = new WeakMap();
  function prepFx(F, pnl) {
    // resolve the image-normalised config into the panel's local px (cached per config + cover size)
    const cv0 = pnl.cover, key = cv0.ox + ',' + cv0.oy + ',' + cv0.iw + ',' + cv0.ih;
    let c = fxCache.get(F); if (c && c.key === key) return c;
    const L = (x, y) => [cv0.ox + x * cv0.iw, cv0.oy + y * cv0.ih];
    const pl = new Float32Array(12), pw = new Float32Array(12), pd = new Float32Array(3), glw = new Float32Array(12);
    (F.plumes || []).slice(0, 3).forEach((p, i) => { const q = L(p.at[0], p.at[1]); pl.set([q[0], q[1], p.len * cv0.ih, (p.lean || 0) * Math.PI / 180], i * 4); pw.set([p.w0, p.w1, p.a, i * 17.3 + 3], i * 4); pd[i] = api.depthAt(pnl.kit, p.at[0], p.at[1] + .01); });
    (F.glows || []).slice(0, 3).forEach((g, i) => { const q = L(g.at[0], g.at[1]); glw.set([q[0], q[1], g.r * cv0.ih, g.a], i * 4); });
    const S = F.shafts; let sh = [0, 0, 0, 0], sh2 = [1, 1, 1, 0];
    if (S) { const q = L(S.at[0], S.at[1]); sh = [q[0], q[1], S.ang * Math.PI / 180, S.a]; sh2 = [S.spread, S.len * cv0.ih, S.rays || 9, 0]; }
    const parts = (F.parts || []).map(p => ({ p, de: api.depthAt(pnl.kit, p.at[0] + (p.at[2] || 0) / 2, p.at[1] + (p.at[3] || 0) / 2) }));
    c = { key, pl, pw, pd, glw, sh, sh2, parts }; fxCache.set(F, c); return c;
  }
  const BLACK = [0, 0, 0];
  function drawPanel(n, t) {
    const K = api.kits[n.kit]; if (!K || !K.ready) return false;
    const F = n.fx || {}, R = prepFx(F, n), fxOn = api.fx && n.fxOn !== false;
    gl.enable(gl.SCISSOR_TEST);
    const sx = cv.width / cssW, sy = cv.height / cssH;
    const x0 = Math.max(0, Math.floor(n.x * sx)), y0 = Math.max(0, Math.floor(n.y * sy)), x1 = Math.min(cv.width, Math.ceil((n.x + n.w) * sx)), y1 = Math.min(cv.height, Math.ceil((n.y + n.h) * sy));
    if (x1 <= x0 || y1 <= y0) return true;
    gl.scissor(x0, cv.height - y1, x1 - x0, y1 - y0);
    gl.useProgram(P1);
    gl.disableVertexAttribArray(aC); gl.disableVertexAttribArray(aS);   // first: the two programs share attribute slots
    gl.bindBuffer(gl.ARRAY_BUFFER, quad); gl.enableVertexAttribArray(a1); gl.vertexAttribPointer(a1, 2, gl.FLOAT, false, 0, 0);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, K.tex); gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, K.dep);
    gl.uniform4f(u1.uRect, n.x, n.y, n.w, n.h); gl.uniform2f(u1.uCv, cssW, cssH);
    gl.uniform2f(u1.uImgO, n.cover.ox, n.cover.oy); gl.uniform2f(u1.uImgS, n.cover.iw, n.cover.ih);
    gl.uniform2f(u1.uPan, n.pan.x, n.pan.y); gl.uniform1f(u1.uZoom, n.zoom); gl.uniform1f(u1.uD0, n.d0 == null ? .2 : n.d0);
    gl.uniform1f(u1.uEdge, n.edge || 0); gl.uniform1f(u1.uT, t + 30); gl.uniform1f(u1.uFx, fxOn ? 1 : 0); gl.uniform1f(u1.uFade, 1);
    const HZ = F.haze || { a: 0 };
    gl.uniform3f(u1.uHz, HZ.y || .5, HZ.w || .1, (HZ.a || 0) * (n.amp == null ? 1 : n.amp));
    gl.uniform3fv(u1.uHzC, HZ.c || [.9, .9, .9]); gl.uniform3fv(u1.uSmC, F.smoke || [.9, .9, .9]);
    gl.uniform3fv(u1.uGlC, F.glowColor || [1, .8, .5]); gl.uniform3fv(u1.uShC, (F.shafts && F.shafts.c) || BLACK);
    const am = n.amp == null ? 1 : n.amp;
    const pw = R.pw.slice(); for (let i = 0; i < 3; i++) pw[i * 4 + 2] *= am;
    const gw = R.glw.slice(); for (let i = 0; i < 3; i++) gw[i * 4 + 3] *= am;
    gl.uniform4fv(u1.uPl, R.pl); gl.uniform4fv(u1.uPw, pw); gl.uniform1fv(u1.uPd, R.pd); gl.uniform4fv(u1.uGl, gw);
    gl.uniform4f(u1.uSh, R.sh[0], R.sh[1], R.sh[2], R.sh[3] * am); gl.uniform4fv(u1.uSh2, R.sh2);
    gl.disable(gl.BLEND);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    if (fxOn && R.parts.length && am > 0.01) {
      gl.useProgram(P2); gl.enable(gl.BLEND);
      gl.bindBuffer(gl.ARRAY_BUFFER, pbuf); gl.disableVertexAttribArray(a1);
      gl.enableVertexAttribArray(aC); gl.vertexAttribPointer(aC, 2, gl.FLOAT, false, 16, 0);
      gl.enableVertexAttribArray(aS); gl.vertexAttribPointer(aS, 2, gl.FLOAT, false, 16, 8);
      gl.uniform4f(u2.uRect, n.x, n.y, n.w, n.h); gl.uniform2f(u2.uCv, cssW, cssH);
      gl.uniform2f(u2.uImgO, n.cover.ox, n.cover.oy); gl.uniform2f(u2.uImgS, n.cover.iw, n.cover.ih);
      gl.uniform2f(u2.uPan, n.pan.x, n.pan.y); gl.uniform1f(u2.uZoom, n.zoom); gl.uniform1f(u2.uD0, n.d0 == null ? .2 : n.d0);
      gl.uniform1f(u2.uT, t + 30); gl.uniform1f(u2.uSc, n.cover.iw / 1024); gl.uniform1f(u2.uFade, am);
      const TY = { sparks: 0, embers: 1, motes: 2, debris: 3 };
      for (const { p, de } of R.parts) {
        const ty = TY[p.type] || 0;
        gl.blendFunc(gl.SRC_ALPHA, ty === 3 ? gl.ONE_MINUS_SRC_ALPHA : gl.ONE);
        gl.uniform1f(u2.uType, ty); gl.uniform1f(u2.uLife, p.life || 1.2); gl.uniform1f(u2.uSize, p.size || 3);
        gl.uniform1f(u2.uCount, Math.min(MAXP, Math.round((p.n || 60) * (api.q < 1 ? .6 : 1)))); gl.uniform1f(u2.uDE, de);
        gl.uniform4f(u2.uEm, p.at[0], p.at[1] * (n.cover.ih / n.cover.iw), p.at[2] || 0, (p.at[3] || 0) * (n.cover.ih / n.cover.iw));
        gl.uniform4f(u2.uDir, (p.ang || 0) * Math.PI / 180, (p.cone || 60) * Math.PI / 180, p.speed || .3, p.g || 0);
        gl.uniform3fv(u2.uCol, p.c || [1, .8, .5]); gl.uniform1f(u2.uA, p.a == null ? 1 : p.a);
        gl.drawArrays(gl.TRIANGLES, 0, MAXP * 6);
      }
      gl.disable(gl.BLEND);
    }
    return true;
  }

  // ---- loop: the owner's frame(t, dt) returns the panels to draw, or null to keep the last frame
  let raf = 0, last = 0, slowN = 0, frameN = 0, running = false;
  api.frame = null; api.onFail = null; api.drawn = false;
  function tick(now) {
    raf = 0; if (lost || !running || document.hidden) return;
    const dt = Math.min(.1, (now - (last || now)) / 1000); last = now;
    if (pending.length) uploadOne();
    // smoothness first: slow for ~1 s -> draw smaller; then without effects; then hand back to the CSS motion
    if (dt > 0 && !opts.fixedTime) { slowN = dt > .026 ? slowN + 1 : Math.max(0, slowN - 2); frameN++;
      if (slowN > 50 && frameN > 90) { slowN = 0; frameN = 0; api.stats.slow++;
        if (api.q > .5) { api.q = Math.max(.5, api.q - .25); applySize(); }
        else if (api.fx) api.fx = false;
        else { running = false; api.ok = false; api.onFail && api.onFail('slow'); return; } } }
    const panels = api.frame ? api.frame(now / 1000, dt) : null;
    if (panels) {
      gl.disable(gl.SCISSOR_TEST); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      let all = true; for (const p of panels) all = drawPanel(p, p.t) && all;
      api.drawn = all; api.stats.frames++;
      if (api.probe) { const px = new Uint8Array(4); gl.readPixels(api.probe[0], cv.height - 1 - api.probe[1], 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); api.probeVal = Array.from(px); api.probeErr = gl.getError(); }   // debug: one pixel
      api.afterDraw && api.afterDraw(all);
    }
    raf = requestAnimationFrame(tick);
  }
  function kick() { if (running && !raf && !lost) raf = requestAnimationFrame(tick); }
  api.start = () => { if (running) return; running = true; last = 0; kick(); };   // idempotent: callers may call it on every scroll event
  api.stop = () => { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; };
  api.running = () => running;
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { last = 0; kick(); } });
  api.gl = gl; api._draw = drawPanel;
  api.ok = true;
  return api;
}
window.LivingGL = { create };
})();
