"""Real product photographs for the PRODUCT PHOTOS gallery: each source copied to assets/photos/ as WebP, at most 1600 px
on the long side (never enlarged), plus a thumbnail (at most 240 px on the long side). White-background photos keep their
studio white; cut-outs keep their transparency. Writes assets/photos/photos.json (id, file, size, thumb size).
usage: ../../../.venv/bin/python photos.py
"""
import os, json, subprocess, tempfile
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
OUT = os.path.join(HERE, 'assets', 'photos')
IMG = 'exploded/research.nosync/av-841r/img/'
# id, source (relative to aves-showcase/), key into copy.json ui.photos.items
SOURCES = [
    ('three-quarter', 'assets/catalogue/aves-titan-av-841r-nv.png'),
    ('front', IMG + 'h5-005.png'),
    ('side', IMG + 'h5-006.png'),
    ('underside', IMG + 'h5-004.png'),
    ('suspension-top', IMG + 'h5-002.png'),
    ('suspension', 'assets/cut/aves-titan-av-565r-suspension.png'),
]
LONG, THUMB = 1600, 240
os.makedirs(OUT, exist_ok=True)
def webp(im, path, q):
    with tempfile.TemporaryDirectory() as tmp:
        src = os.path.join(tmp, 'in.png'); im.save(src)
        args = ['cwebp', '-quiet', '-q', str(q), '-m', '6', '-sharp_yuv']
        if im.mode == 'RGBA': args += ['-alpha_q', '100', '-exact']
        subprocess.run(args + [src, '-o', path], check=True)
def fit(im, long):
    s = min(1, long / max(im.size))
    return im if s == 1 else im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
meta = []
for pid, rel in SOURCES:
    im = Image.open(os.path.join(ROOT, rel))
    im = im.convert('RGBA' if im.mode in ('RGBA', 'LA', 'P') and 'A' in im.getbands() or im.mode == 'RGBA' else 'RGB')
    big = fit(im, LONG); th = fit(im, THUMB)
    webp(big, os.path.join(OUT, pid + '.webp'), 84)
    webp(th, os.path.join(OUT, pid + '-t.webp'), 82)
    meta.append({'id': pid, 'source': rel, 'sourceSize': list(im.size), 'w': big.width, 'h': big.height, 'tw': th.width, 'th': th.height, 'alpha': im.mode == 'RGBA',
                 'bytes': os.path.getsize(os.path.join(OUT, pid + '.webp')), 'thumbBytes': os.path.getsize(os.path.join(OUT, pid + '-t.webp'))})
json.dump(meta, open(os.path.join(OUT, 'photos.json'), 'w'), indent=1)
for m in meta: print(m['id'].ljust(15), m['sourceSize'], '->', (m['w'], m['h']), m['bytes'], 'B; thumb', (m['tw'], m['th']), m['thumbBytes'], 'B', 'alpha' if m['alpha'] else 'white ground')
