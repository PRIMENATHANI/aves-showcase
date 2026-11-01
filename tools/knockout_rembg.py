"""Second-generation knockout: rembg (isnet-general-use) matting on the white-background product shots.
Falls back to the existing flood-fill cutout in `dst` when the model keeps too little of the product
(e.g. white filter cartridges). Run: U2NET_HOME=/tmp/aves-venv/u2net /tmp/aves-venv/bin/python -I tools/knockout_rembg.py assets/img assets/cut [--only a,b]
Writes a report to stdout: id, old opaque px, new opaque px, verdict."""
import sys, os, glob
import numpy as np
from PIL import Image
from rembg import remove, new_session
src, dst = sys.argv[1], sys.argv[2]
only = set(sys.argv[sys.argv.index('--only')+1].split(',')) if '--only' in sys.argv else set()
sess = new_session("isnet-general-use")
def opaque(im): return int((np.asarray(im.getchannel('A')) > 128).sum())
kept = replaced = 0
for f in sorted(glob.glob(os.path.join(src, '*'))):
    stem = os.path.splitext(os.path.basename(f))[0]
    if only and stem not in only: continue
    out = os.path.join(dst, stem + '.png')
    im = Image.open(f).convert('RGB')
    cut = remove(im, session=sess, alpha_matting=True, alpha_matting_foreground_threshold=240,
                 alpha_matting_background_threshold=10, alpha_matting_erode_size=10)
    bbox = cut.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox()
    new_px = opaque(cut)
    old_px = opaque(Image.open(out).convert('RGBA')) if os.path.exists(out) else 0
    # fallback: model kept < 45 % of what the flood fill kept, or almost nothing
    if bbox is None or new_px < 2000 or (old_px and new_px < 0.45 * old_px):
        print('KEEP-OLD', stem, old_px, new_px); kept += 1; continue
    cut = cut.crop(bbox); cut.save(out, optimize=True); replaced += 1
    print('ok', stem, old_px, new_px)
print('replaced', replaced, 'kept-old', kept)
