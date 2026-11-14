// v0.3.2 living photographs: per-picture motion, image-normalised coordinates (x 0..1 left to right, y 0..1 top to
// bottom of the 1024 x 1280 picture). Placed by looking at each picture (shots in ../gen/living/).
// Thin structures (wires, masts, lattices, trunks) bend under large travel, so those pictures move less (checked at peak travel, 2x).
// cam: amp (pan, fraction of the short side, at full depth), zoom (dolly), d0 (depth that stays put), T (loop seconds)
// haze: y, w (band), a, c   plumes: at (source), len (fraction of height), lean (deg, + = left), w0/w1 (widths), a
// glows: at, r (fraction of height), a   shafts: at (source), ang (deg, 0 = straight down, + = toward the right), spread (rad), len, a, c
// parts: type sparks|embers|motes|debris, at [x, y, w, h] (motes: a box from x,y), ang (deg, 0 = up, + = right), cone (deg), speed (picture widths / s), g, life, size (px at 1024), n, c, a
window.LIVING_FX = {
  'oil-gas': {
    cam: { amp: .045, zoom: .07, d0: .15, T: 13 },
    haze: { y: .66, w: .07, a: .32, c: [1, .72, .38] },
    plumes: [{ at: [.70, .115], len: .2, lean: -14, w0: .03, w1: .1, a: .55 }],
    smoke: [.62, .5, .42],
    glows: [{ at: [.705, .19], r: .09, a: .3 }, { at: [.705, .24], r: .035, a: .35 }],
    glowColor: [1, .62, .22],
    parts: [{ type: 'embers', at: [.705, .2, .04, .03], speed: .07, life: 3.2, size: 3.2, n: 50, c: [1, .7, .3], a: .95 }],
  },
};

const W_ = [1, .86, .62], WARM = [1, .74, .42];
Object.assign(window.LIVING_FX, {
  'rig-drilling': { cam: { amp: .03, zoom: .05, d0: .12, T: 13 },
    haze: { y: .8, w: .06, a: .3, c: [.55, .62, .85] },
    glows: [{ at: [.22, .8], r: .05, a: .3 }, { at: [.48, .71], r: .04, a: .28 }, { at: [.63, .76], r: .045, a: .26 }], glowColor: [1, .8, .45],
    parts: [{ type: 'motes', at: [0, 0, 1, .42], speed: 0, size: 1.6, n: 46, c: [.85, .9, 1], a: .75 }] },
  electrical: { cam: { amp: .028, zoom: .05, d0: .15, T: 12 },
    haze: { y: .56, w: .07, a: .28, c: [.6, .55, .9] },
    glows: [{ at: [.86, .44], r: .05, a: .32 }, { at: [.6, .5], r: .03, a: .2 }], glowColor: [.55, 1, .9],
    parts: [{ type: 'motes', at: [.05, .35, .9, .4], speed: .02, size: 1.8, n: 40, c: [.6, 1, .9], a: .5 }] },
  construction: { cam: { amp: .035, zoom: .06, d0: .1, T: 14 },
    shafts: { at: [.9, .02], ang: -32, spread: .45, len: 1.1, a: .16, rays: 8, c: [1, .9, .7] },
    parts: [{ type: 'motes', at: [.1, .35, .8, .55], speed: .03, size: 2.2, n: 60, c: W_, a: .55 }] },
  'heavy-machinery': { cam: { amp: .045, zoom: .07, d0: .2, T: 12 },
    plumes: [{ at: [.27, .74], len: .22, lean: 8, w0: .06, w1: .16, a: .45 }], smoke: [.8, .5, .36],
    parts: [{ type: 'debris', at: [.24, .66, .08, .03], ang: 0, speed: 0, g: .45, life: 1.6, size: 3.5, n: 30, c: [.28, .12, .07], a: .9 },
            { type: 'motes', at: [.05, .55, .9, .35], speed: .02, size: 2.2, n: 50, c: [1, .7, .5], a: .45 }] },
  demolition: { cam: { amp: .04, zoom: .07, d0: .15, T: 13 },
    plumes: [{ at: [.55, .55], len: .42, lean: -6, w0: .1, w1: .26, a: .5 }, { at: [.3, .72], len: .2, lean: 10, w0: .06, w1: .14, a: .35 }], smoke: [.88, .74, .64],
    parts: [{ type: 'debris', at: [.58, .34, .16, .06], speed: 0, g: .55, life: 1.8, size: 2.8, n: 50, c: [.22, .2, .2], a: .95 },
            { type: 'motes', at: [.05, .2, .9, .7], speed: .02, size: 2.4, n: 70, c: [1, .85, .72], a: .5 }] },
  manufacturing: { cam: { amp: .04, zoom: .1, d0: .2, T: 12 },
    glows: [{ at: [.42, .47], r: .035, a: .4 }], glowColor: [.75, .85, 1],
    parts: [{ type: 'sparks', at: [.42, .47, .01, .01], ang: 0, cone: 300, speed: .12, g: .35, life: .7, size: 1.6, n: 50, c: [1, .9, .7], a: .95 },
            { type: 'motes', at: [.1, .15, .8, .5], speed: .02, size: 1.8, n: 40, c: [.9, .95, 1], a: .35 }] },
  'assembly-line': { cam: { amp: .035, zoom: .11, d0: .25, T: 12 },
    haze: { y: .5, w: .08, a: .22, c: [.75, .85, 1] },
    parts: [{ type: 'motes', at: [.15, .2, .7, .55], speed: .02, size: 1.8, n: 50, c: [.75, .88, 1], a: .45 }] },
  woodworking: { cam: { amp: .045, zoom: .08, d0: .2, T: 13 },
    shafts: { at: [.16, .02], ang: 38, spread: .42, len: 1.15, a: .26, rays: 10, c: [1, .78, .46] },
    parts: [{ type: 'motes', at: [.1, .15, .75, .6], speed: .03, size: 2.2, n: 90, c: [1, .85, .6], a: .7 }] },
  mechanical: { cam: { amp: .045, zoom: .07, d0: .25, T: 12 },
    glows: [{ at: [.49, .07], r: .07, a: .28 }, { at: [.79, .16], r: .05, a: .2 }], glowColor: [1, .78, .45],
    parts: [{ type: 'motes', at: [.25, .08, .65, .45], speed: .02, size: 1.8, n: 50, c: [1, .88, .66], a: .5 }] },
  'power-tool': { cam: { amp: .04, zoom: .07, d0: .25, T: 12 },
    glows: [{ at: [.565, .6], r: .07, a: .45 }, { at: [.5, .06], r: .05, a: .18 }], glowColor: [1, .62, .25],
    parts: [{ type: 'sparks', at: [.565, .6, .02, .02], ang: -55, cone: 120, speed: .55, g: .9, life: .9, size: 2, n: 170, c: [1, .7, .3], a: 1 },
            { type: 'sparks', at: [.565, .6, .02, .02], ang: 60, cone: 70, speed: .35, g: .9, life: .8, size: 1.8, n: 60, c: [1, .8, .45], a: .9 }] },
  welding: { cam: { amp: .04, zoom: .07, d0: .25, T: 12 },
    plumes: [{ at: [.6, .44], len: .32, lean: -8, w0: .06, w1: .18, a: .4 }], smoke: [.62, .72, .86],
    glows: [{ at: [.6, .485], r: .1, a: .5 }, { at: [.6, .485], r: .03, a: .6 }], glowColor: [.62, .8, 1],
    parts: [{ type: 'sparks', at: [.6, .485, .015, .01], ang: 0, cone: 320, speed: .42, g: .85, life: 1, size: 2, n: 190, c: [1, .85, .55], a: 1 }] },
  logistics: { cam: { amp: .035, zoom: .11, d0: .25, T: 12 },
    glows: [{ at: [.5, .66], r: .03, a: .25 }], glowColor: [1, .8, .5],
    parts: [{ type: 'motes', at: [.3, .2, .4, .55], speed: .02, size: 1.8, n: 50, c: [1, .92, .78], a: .5 }] },
  aviation: { cam: { amp: .045, zoom: .07, d0: .15, T: 14 },
    haze: { y: .64, w: .05, a: .24, c: [.95, .7, .8] },
    glows: [{ at: [.5, .58], r: .02, a: .2 }], glowColor: [1, .9, .75] },
  railway: { cam: { amp: .022, zoom: .065, d0: .15, T: 14 },
    haze: { y: .45, w: .09, a: .5, c: [1, .93, .82] },
    parts: [{ type: 'motes', at: [.1, .3, .8, .4], speed: .02, size: 1.8, n: 40, c: [1, .92, .8], a: .4 }] },
  mining: { cam: { amp: .045, zoom: .08, d0: .1, T: 14 },
    haze: { y: .5, w: .08, a: .25, c: [1, .85, .65] },
    plumes: [{ at: [.6, .76], len: .14, lean: 20, w0: .04, w1: .12, a: .45 }], smoke: [.85, .7, .52],
    parts: [{ type: 'motes', at: [.05, .45, .9, .5], speed: .02, size: 2, n: 50, c: [1, .85, .65], a: .4 }] },
  forestry: { cam: { amp: .032, zoom: .06, d0: .2, T: 13 },
    shafts: { at: [.72, .06], ang: -18, spread: .5, len: 1.2, a: .28, rays: 11, c: [1, .92, .66] },
    haze: { y: .8, w: .07, a: .3, c: [.85, .9, .78] },
    parts: [{ type: 'motes', at: [.25, .2, .6, .6], speed: .03, size: 2, n: 80, c: [1, .95, .75], a: .65 }] },
  cryogenic: { cam: { amp: .045, zoom: .08, d0: .2, T: 13 },
    plumes: [{ at: [.55, .14], len: .32, lean: -10, w0: .05, w1: .16, a: .55 }, { at: [.86, .3], len: .3, lean: 12, w0: .05, w1: .15, a: .5 }, { at: [.3, .5], len: .22, lean: -6, w0: .04, w1: .12, a: .35 }], smoke: [.93, .96, 1],
    parts: [{ type: 'motes', at: [0, .05, 1, .9], speed: .015, size: 1.6, n: 60, c: [.9, .96, 1], a: .55 }] },
});
// every picture lives: kits without a hand-placed entry get the camera move alone
['oil-gas', 'rig-drilling', 'electrical', 'construction', 'heavy-machinery', 'demolition', 'manufacturing', 'assembly-line', 'woodworking', 'mechanical', 'power-tool', 'welding', 'logistics', 'aviation', 'railway', 'mining', 'forestry', 'cryogenic']
  .forEach(k => { if (!window.LIVING_FX[k]) window.LIVING_FX[k] = { cam: { amp: .04, zoom: .06, d0: .2, T: 12 } }; });
