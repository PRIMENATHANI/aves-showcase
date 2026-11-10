"""v0.4: clean the worn layers of one kit for close-ups.
- defringe: the draft layers carry a 3-4 px pale feathered edge from their masks. Alpha is pulled in by ERODE px,
  re-feathered by FEATHER px, and edge colour is replaced by colour bled outward from the opaque interior.
- the escape-hood pouch layer (a generated tube with a dark smear under it) is rebuilt from the real pouch photo.
usage: .venv/bin/python v0.4/tools/clean_layers.py <kit-id>   (writes v0.4/experience/assets/layers/)
"""
import sys, json, os
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'v0.4/experience/assets/layers'); os.makedirs(OUT, exist_ok=True)
ERODE, FEATHER = 1, 0.7
def defringe(im):
    a = np.array(im).astype(np.float32); al = a[..., 3]
    solid = al > 215
    # bleed interior colour outward so the new soft edge never shows mask-coloured pixels
    idx = ndi.distance_transform_edt(~solid, return_distances=False, return_indices=True)
    rgb = a[..., :3][idx[0], idx[1]]
    core = ndi.binary_erosion(al > 64, iterations=ERODE)   # keeps thin parts (helmet brim, straps)
    na = ndi.gaussian_filter(core.astype(np.float32) * 255, FEATHER)
    na = np.minimum(na, ndi.maximum_filter(al, 3))            # never grow past the original shape
    out = np.dstack([rgb, na]).clip(0, 255).astype(np.uint8)
    return Image.fromarray(out, 'RGBA')
def pouch(layer, frame):
    """the real pouch photo, laid on the belt in the generated layer's box"""
    x0, y0, x1, y1 = layer['box']
    ph = Image.open(os.path.join(ROOT, 'spikes/a-plus/art/cut/escape-pouch.png')).convert('RGBA')
    ph = ph.crop((0, 0, ph.width, int(ph.height * .56)))                      # the bag itself, without the hanging strap
    bb = ph.split()[3].point(lambda v: 255 if v > 24 else 0).getbbox(); ph = ph.crop(bb)
    w = int((x1 - x0) * .80); h = int(ph.height * w / ph.width); ph = ph.resize((w, h), Image.LANCZOS)
    ph = Image.fromarray(np.clip(np.array(ph).astype(np.float32) * [1.18, 1.18, 1.2, 1], 0, 255).astype(np.uint8), 'RGBA')
    cv = Image.new('RGBA', (frame['w'], frame['h']), (0, 0, 0, 0))
    px, py = x0 + (x1 - x0 - w) // 2, y0 + (y1 - y0 - h) // 2 + 4
    sh = Image.new('RGBA', cv.size, (0, 0, 0, 0)); sm = ph.split()[3].point(lambda v: int(v * .5))
    sh.paste((6, 8, 10, 255), (px + 2, py + 7), sm); sh = sh.filter(ImageFilter.GaussianBlur(5))
    cv.alpha_composite(sh); cv.alpha_composite(ph, (px, py)); return cv
def main(kit):
    m = json.load(open(os.path.join(ROOT, 'assets/dress/manifest.json'))); L = {l['id']: l for l in m['layers']}
    for lid in m['kits'][kit]['order']:
        src = Image.open(os.path.join(ROOT, 'assets/dress/layers', lid + '.png')).convert('RGBA')
        out = pouch(L[lid], m['frame']) if lid == 'aves-escape-hood-bag' else defringe(src)
        out.save(os.path.join(OUT, lid + '.png'), optimize=True); print('ok', lid)
    base = Image.open(os.path.join(ROOT, 'assets/dress/base.png')).convert('RGBA')
    defringe(base).save(os.path.join(ROOT, 'v0.4/experience/assets/base.png'), optimize=True); print('ok base')
if __name__ == '__main__': main(sys.argv[1] if len(sys.argv) > 1 else 'oil-gas')
