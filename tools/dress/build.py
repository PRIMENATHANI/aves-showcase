"""Step 3: build the whole dressing layer library for the 18 kits. Resumable (skips layers already in the manifest), sequential (one generate at a time).
  nohup /tmp/aves-venv/bin/python tools/dress/build.py > tools/dress/build.log 2>&1 &
  build.py --plan        print the layer plan and exit
  build.py <kitId> ...   only these kits
Dressing/stacking rules come from the spec; layers shared between kits are generated once."""
import os, sys, json, time, traceback
import numpy as np
from PIL import Image, ImageDraw, ImageFont
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import gen
from common import ROOT, DRESS, Z, load_manifest, write_manifest
WORK = gen.WORK; QC = os.path.join(ROOT, 'spikes', 'dress-v0.3-qc')
DON = ['head', 'eye', 'hearing', 'respiratory', 'face', 'vest', 'fall', 'dropped', 'hand', 'cryo-body']
BUILD_ORDER = ['vest', 'head', 'eye', 'respiratory', 'hand', 'cryo-body', 'face', 'hearing', 'fall', 'dropped']   # dependencies first
def log(*a): print(time.strftime('%H:%M:%S'), *a, flush=True)

def full_face(pid):
    p = gen.product(pid); n = (pid + ' ' + p['name'] + ' ' + (p.get('sub') or '')).lower()
    return 'full face' in n or 'full-face' in n or 'full_face' in n or 'fullface' in n

def plan():
    """-> kits {id: {order:[layerIds], skipEye:bool}}, layers {layerId: spec}"""
    kits = {}; layers = {}
    for kit in json.load(open(os.path.join(ROOT, 'data', 'kits.json'))):
        by = {s['slot']: s['primary'] for s in kit['slots']}; helmet = by.get('head'); harness = by.get('fall'); ids = []
        skip_eye = bool(by.get('respiratory')) and full_face(by['respiratory'])
        def add(slot, pid, dep=None, canvas=None):
            lid = gen.layer_id(pid, dep); ids.append(lid)
            layers.setdefault(lid, dict(id=lid, product=pid, slot=slot, dep=dep, dependsOn=None, kits=[]))['kits'].append(kit['id']); return lid
        for slot in DON:
            if slot == 'vest': pid, dep = 'scuta-vest', None
            elif slot not in by: continue
            else:
                pid = by[slot]; dep = None
                if slot == 'hearing' and gen.kind(pid, 'hearing') in ('cap', 'band'): dep = helmet
                if slot == 'face': dep = helmet
                if slot == 'dropped': dep = harness
            lid = add(slot, pid, dep)
            if slot == 'fall': layers[lid]['dep_frame'] = 'scuta-vest'; layers[lid]['dependsOn'] = 'scuta-vest'
            if slot == 'eye' and skip_eye: layers[lid]['skipEye'] = layers[lid].get('skipEye', True)
            elif slot == 'eye': layers[lid]['skipEye'] = False
        kits[kit['id']] = dict(order=ids)
    return kits, layers

def canvas_dep(spec):
    """frame id of the canvas dependency (a layer id) or None = base"""
    return spec.get('dep_frame') or spec['dep']

def ensure_frame(lid, layers, m):
    """merged frame (canvas + this layer) used as a dependent's canvas; rebuilt from the layer PNG when only the layer exists (step-0 exports)."""
    f = gen.frame_path(lid)
    if os.path.exists(f): return f
    lp = os.path.join(DRESS, 'layers', lid + '.png')
    if not os.path.exists(lp): return None
    spec = layers[lid]; cd = canvas_dep(spec)
    if cd:
        cf = ensure_frame(cd, layers, m)
        if not cf: return None
        can = Image.open(cf).convert('RGB')
    else: can = Image.open(gen.BASE).convert('RGB')
    lay = Image.open(lp).convert('RGBA'); can.paste(lay.convert('RGB'), (0, 0), lay.getchannel('A')); can.save(f); log('frame rebuilt from layer', lid); return f

def stack(kit_order, ls, over=None):
    bg = over.copy().convert('RGBA') if over else Image.new('RGBA', (896, 1536), (70, 76, 84, 255))
    bg.alpha_composite(Image.open(os.path.join(DRESS, 'base.png')).convert('RGBA'))
    for lid in sorted(kit_order, key=lambda i: ls[i]['z'] if i in ls else 0):
        p = os.path.join(DRESS, 'layers', lid + '.png')
        if lid in ls and ls[lid]['status'] == 'ok' and os.path.exists(p): bg.alpha_composite(Image.open(p).convert('RGBA'))
    return bg.convert('RGB')

def font(n):
    for p in ('/System/Library/Fonts/Helvetica.ttc', '/Library/Fonts/Arial.ttf'):
        if os.path.exists(p): return ImageFont.truetype(p, n)
    return ImageFont.load_default()

def qc_sheet(kid, order, m):
    ls = {l['id']: l for l in m['layers']}; os.makedirs(QC, exist_ok=True)
    full = stack(order, ls).resize((448, 768), Image.LANCZOS)
    cells = []
    for lid in order:
        l = ls.get(lid); lp = os.path.join(DRESS, 'layers', lid + '.png')
        lab = f"{lid[:44]}  [{l['slot']}] {l['model']} {l['seconds']}s {l['status']}" if l else lid
        if l and l['status'] == 'ok' and l['box'] and os.path.exists(lp):
            x0, y0, x1, y1 = l['box']; pad = 30; box = (max(0, x0 - pad), max(0, y0 - pad), min(896, x1 + pad), min(1536, y1 + pad))
            bg = Image.new('RGBA', (896, 1536), (70, 76, 84, 255)); bg.alpha_composite(Image.open(lp).convert('RGBA')); cr = bg.convert('RGB').crop(box)
        else: cr = Image.new('RGB', (200, 120), (40, 40, 44))
        s = min(300 / cr.width, 300 / cr.height, 1.6); cells.append((lab, cr.resize((max(1, int(cr.width * s)), max(1, int(cr.height * s))), Image.LANCZOS)))
    cols = 3; cw, ch = 330, 340; rows = (len(cells) + cols - 1) // cols
    W = 448 + 16 + cols * cw + 16; H = max(768 + 60, rows * ch + 60)
    im = Image.new('RGB', (W, H), (14, 16, 20)); d = ImageDraw.Draw(im); f = font(14)
    d.text((8, 6), kid + '  (stacked by z over grey)', fill=(230, 233, 238), font=f); im.paste(full, (8, 30))
    for i, (lab, cr) in enumerate(cells):
        r, c = divmod(i, cols); x = 448 + 24 + c * cw; y = 30 + r * ch
        d.text((x, y), lab[:52], fill=(200, 205, 212), font=font(12)); im.paste(cr, (x, y + 18))
    im.save(os.path.join(QC, kid + '.png')); log('QC sheet', kid)

def main():
    kits, layers = plan(); only = [a for a in sys.argv[1:] if not a.startswith('--')]
    if '--plan' in sys.argv:
        print(len(layers), 'unique layers'); from collections import Counter
        print(Counter(l['slot'] for l in layers.values()))
        for k, v in kits.items(): print(k, v['order'])
        return
    m = load_manifest(); m['kits'] = {k: v for k, v in m['kits'].items()}
    for k, v in kits.items(): m['kits'][k] = dict(order=v['order'])
    # eye skip rule (layer-level only when every kit using it has a full-face respirator)
    for lid, sp in layers.items():
        if sp['slot'] == 'eye' and sp.get('skipEye'):
            if not any(l['id'] == lid for l in m['layers']):
                m['layers'].append(dict(id=lid, product=sp['product'], slot='eye', dependsOn=None, box=None, z=Z['eye'], model='klein9b', seconds=0, status='skipped'))
    write_manifest(m)
    todo_total = sum(1 for lid in layers if not any(l['id'] == lid for l in m['layers']))
    log(f'plan: {len(layers)} unique layers, {todo_total} to build'); done_n = 0; failed = []
    sent = set()
    kit_ids = only or list(kits)
    for kid in kit_ids:
        specs = sorted([layers[i] for i in kits[kid]['order']], key=lambda s: BUILD_ORDER.index(s['slot']))
        for sp in specs:
            lid = sp['id']
            if any(l['id'] == lid for l in m['layers']): continue
            cd = canvas_dep(sp)
            if cd and not ensure_frame(cd, layers, m):
                log('SKIP (dependency missing)', lid, '<-', cd); m['layers'].append(dict(id=lid, product=sp['product'], slot=sp['slot'], dependsOn=sp['dependsOn'] or (lid.split('__on-', 1)[1] if '__on-' in lid else None), box=None, z=Z[sp['slot']], model=gen.MODEL[sp['slot']], seconds=0, status='missing')); write_manifest(m); continue
            try:
                log('GEN', lid, sp['slot'], gen.MODEL[sp['slot']], '| refs', [os.path.basename(x) for x in gen.refs_for(sp['product'])[:2]])
                rec = gen.run(sp['product'], sp['slot'], dep=cd if cd else None, tag=lid, lid=lid)
                if sp['dependsOn']: rec['dependsOn'] = sp['dependsOn']
                rec['id'] = lid
            except Exception as e:
                log('FAILED', lid, repr(e)[:300]); failed.append(lid); continue
            m['layers'] = [l for l in m['layers'] if l['id'] != lid] + [rec]; write_manifest(m); done_n += 1
            log(f'done {lid} {rec["status"]} mask_px={rec.get("mask_px")} {rec["seconds"]}s ({done_n}/{todo_total})')
        ls = {l['id']: l for l in m['layers']}
        if all(i in ls for i in kits[kid]['order']): qc_sheet(kid, kits[kid]['order'], m)
        else: log('kit incomplete, no QC sheet:', kid, [i for i in kits[kid]['order'] if i not in ls])
    import clean_layers; clean_layers.main()
    log('BUILD FINISHED', 'failed:', failed)

if __name__ == '__main__': main()
