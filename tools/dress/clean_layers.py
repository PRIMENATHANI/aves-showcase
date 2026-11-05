"""Post-pass over assets/dress/layers/*.png (in place, idempotent): drop pixels equal to the base frame (eye/hearing/head/face: unchanged skin/background that leaked
into the diff), erode alpha 2 px, re-feather 1.5 px. Untouched originals are kept in tools/dress/work/layers_raw/. A layer whose file changed since the last
clean (new or regenerated) is re-copied to raw first.   /tmp/aves-venv/bin/python tools/dress/clean_layers.py"""
import os, sys, json, shutil
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import ROOT, DRESS
T = os.path.dirname(os.path.abspath(__file__)); RAW = os.path.join(T, 'work', 'layers_raw'); STATE = os.path.join(RAW, 'state.json')
SLOTS = ('eye', 'hearing', 'head', 'face'); TOL = 14
def main():
    os.makedirs(RAW, exist_ok=True); st = json.load(open(STATE)) if os.path.exists(STATE) else {}
    slot = {l['id']: l['slot'] for l in json.load(open(os.path.join(DRESS, 'manifest.json')))['layers']}
    base = np.asarray(Image.open(os.path.join(T, 'work', 'base.png')).convert('RGB')).astype(int); n = 0
    LD = os.path.join(DRESS, 'layers')
    for f in sorted(os.listdir(LD)):
        if not f.endswith('.png'): continue
        lid = f[:-4]; p = os.path.join(LD, f); mt = os.path.getmtime(p); rp = os.path.join(RAW, f)
        if st.get(lid) == mt: continue
        shutil.copy2(p, rp)
        im = Image.open(rp).convert('RGBA'); a = np.asarray(im).copy(); al = a[..., 3].astype(float)
        if slot.get(lid) in SLOTS:
            same = np.abs(a[..., :3].astype(int) - base).max(-1) <= TOL
            same = ndi.binary_opening(same, iterations=1) & (al > 0); al[same] = 0
        m = ndi.binary_erosion(al > 128, iterations=2)
        out = np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.5))).astype(float)
        a[..., 3] = np.minimum(out, al).astype(np.uint8); a[a[..., 3] == 0, :3] = 0
        Image.fromarray(a).save(p, optimize=True); st[lid] = os.path.getmtime(p); n += 1
    json.dump(st, open(STATE, 'w')); print('cleaned', n, 'layers')
if __name__ == '__main__': main()
