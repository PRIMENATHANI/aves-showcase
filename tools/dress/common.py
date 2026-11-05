import os, json
import numpy as np
from PIL import Image
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
DRESS = os.path.join(ROOT, 'assets', 'dress')
MANIFEST = os.path.join(DRESS, 'manifest.json')
# stacking order (spec 1.3): base < vest < harness < tether/pouch < respirator < glasses < face shield < helmet < earmuffs < gloves
Z = dict(base=0, vest=10, fall=20, dropped=30, cryo_body=15, respiratory=40, eye=50, face=60, head=70, hearing=80, hand=90)
Z['cryo-body'] = 15
def load_manifest():
    if os.path.exists(MANIFEST): return json.load(open(MANIFEST))
    return {'frame': {'w': 896, 'h': 1536}, 'layers': [], 'kits': {}}
def write_manifest(m):
    order = {k: i for i, k in enumerate(['vest', 'fall', 'dropped', 'respiratory', 'eye', 'face', 'head', 'hearing', 'hand'])}
    bd = os.path.join(DRESS, 'backdrops'); m['backdrops'] = sorted(f[:-4] for f in os.listdir(bd) if f.endswith('.jpg')) if os.path.isdir(bd) else []
    m['layers'].sort(key=lambda l: (l['z'], l['id']))
    tmp = MANIFEST + '.tmp'; json.dump(m, open(tmp, 'w'), indent=1); os.replace(tmp, MANIFEST)
_sess = None
def rembg_cut(im):
    global _sess
    os.environ.setdefault('U2NET_HOME', '.venv/u2net')
    from rembg import remove, new_session
    if _sess is None: _sess = new_session('isnet-general-use')
    return remove(im.convert('RGB'), session=_sess, alpha_matting=True, alpha_matting_foreground_threshold=240, alpha_matting_background_threshold=10, alpha_matting_erode_size=10)
def save_layer(gen, mask, path):
    """gen RGB 896x1536, mask L -> RGBA with RGB zeroed where fully transparent (small files)"""
    a = np.asarray(gen.convert('RGB')).copy(); m = np.asarray(mask.convert('L'))
    a[m == 0] = 0
    img = Image.fromarray(a).convert('RGBA'); img.putalpha(mask.convert('L')); img.save(path, optimize=True)
