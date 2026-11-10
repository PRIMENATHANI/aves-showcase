"""v0.4: set headings in the catalogue's own title face (Avenir LT Std Black) as transparent PNGs.
The font is licensed to the catalogue; the site ships pictures of the words, never the font file.
usage: .venv/bin/python v0.4/tools/typeset.py     (reads TITLES below, writes v0.4/experience/assets/type/<key>.png + type.json)
"""
import os, json
from PIL import Image, ImageDraw, ImageFont
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FONT = os.path.join(ROOT, 'catalogue-src.nosync/Document Fonts/AvenirLTStd-Black.otf')
OUT = os.path.join(ROOT, 'v0.4/experience/assets/type'); os.makedirs(OUT, exist_ok=True)
WHITE, GREEN = (255, 255, 255, 255), (3, 144, 71, 255)          # catalogue swatch "r3g144b71 - aves"
CATS = {'head': 'Head Protection', 'eye': 'Eye Protection', 'hearing': 'Ear Protection', 'respiratory': 'Respiratory Protection',
        'hand': 'Hand Protection', 'fall': 'Fall Protection & Dropped Objects', 'vest': 'Hi-Vis Workwear'}
TITLES = {**{f'cat-{k}': (v.upper(), 96, .12, WHITE) for k, v in CATS.items()},
          **{f'why-{k}': (f'Why Choose AVES {v.split(" & ")[0]}?', 72, 0, WHITE) for k, v in CATS.items() if k != 'vest'},
          'kit-oil-gas': ('OIL & GAS', 220, .06, WHITE), 'sign-oil-gas': ('OIL & GAS PPE KIT', 96, .1, WHITE),
          'end-oil-gas': ('THE AVES OIL & GAS KIT', 120, .05, WHITE), 'approach': ('THE AVES APPROACH', 60, .14, WHITE)}
# product names, as the catalogue sets its product heads
_kit = os.path.join(ROOT, 'v0.4/experience/data/oil-gas.json')
if os.path.exists(_kit):
    for st in json.load(open(_kit))['steps']: TITLES['name-' + st['product']] = (st['name'], 110, .02, WHITE)
def render(text, size, tracking, colour):
    f = ImageFont.truetype(FONT, size); pad = size
    w = int(sum(f.getlength(c) for c in text) + tracking * size * len(text)) + 2 * pad
    im = Image.new('RGBA', (w, int(size * 1.6) + 2 * pad), (0, 0, 0, 0)); d = ImageDraw.Draw(im); x = pad
    small = ImageFont.truetype(FONT, int(size * .46))
    for c in text:
        if c == '®':      # registered mark: small and raised, as the catalogue sets it
            d.text((x - tracking * size * .6, pad + size * .08), c, font=small, fill=colour); x += small.getlength(c) + tracking * size * .4; continue
        d.text((x, pad), c, font=f, fill=colour); x += f.getlength(c) + tracking * size
    return im.crop(im.getbbox())
meta = {}
for key, (text, size, tr, col) in TITLES.items():
    im = render(text, size, tr, col); im.save(os.path.join(OUT, key + '.png'), optimize=True); meta[key] = {'text': text, 'w': im.width, 'h': im.height}
json.dump(meta, open(os.path.join(OUT, 'type.json'), 'w'), indent=1); print(len(meta), 'headings set')
