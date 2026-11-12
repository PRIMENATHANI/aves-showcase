"""Sets the page's headings in the catalogue's title face (Avenir LT Std Black) as transparent PNGs.
The font is licensed to the catalogue: the page ships pictures of the words, never the font file.
usage: ../../../.venv/bin/python typeset.py   (writes assets/type-<key>.png and assets/type.json)
"""
import os, json
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
FONT = os.path.join(ROOT, 'catalogue-src.nosync/Document Fonts/AvenirLTStd-Black.otf')
OUT = os.path.join(HERE, 'assets')
COPY = json.load(open(os.path.join(HERE, 'copy.json')))
WHITE, GREEN = (255, 255, 255, 255), (3, 144, 71, 255)
TITLES = {
    'model': ('AV-841R', 260, 0.0, WHITE),
    'name': (COPY['sellSheetName'], 96, 0.0, WHITE),
    'features': ('FEATURES', 80, 0.08, WHITE),
    'spec-a': ('TECHNICAL AND MATERIAL', 80, 0.08, WHITE),
    'spec-b': ('SPECIFICATION', 80, 0.08, WHITE),
    'standards': ('STANDARDS', 80, 0.08, WHITE),
    'colors': ('COLORS AVAILABLE', 80, 0.08, WHITE),
    'tagline': (COPY['tagline'], 64, 0.0, GREEN),
    'tagline-rev': (COPY['tagline'], 64, 0.0, WHITE),
    'documents': ('DOCUMENTS', 80, 0.08, (2, 106, 53, 255)),
    'accessories': ('COMPATIBLE ACCESSORIES', 80, 0.08, WHITE),
    'logo-areas': ('LOGO PLACEMENT AREAS', 80, 0.08, WHITE),
    'industry': ('RECOMMENDED INDUSTRY', 80, 0.08, WHITE),
    'more': ('HEAD PROTECTION', 80, 0.08, WHITE),
    'photos': ('PRODUCT PHOTOS', 80, 0.08, WHITE),
    'model-g': ('AV-841R', 160, 0.0, (2, 106, 53, 255)),
    'name-g': (COPY['sellSheetName'], 96, 0.0, (23, 32, 27, 255)),
}
def render(text, size, tracking, colour):
    f = ImageFont.truetype(FONT, size); pad = size
    small = ImageFont.truetype(FONT, int(size * .46))
    w = int(sum(f.getlength(c) for c in text) + tracking * size * len(text)) + 2 * pad
    im = Image.new('RGBA', (w, int(size * 1.6) + 2 * pad), (0, 0, 0, 0)); d = ImageDraw.Draw(im); x = pad
    for c in text:
        if c == '®':
            d.text((x - tracking * size * .6, pad + size * .08), c, font=small, fill=colour); x += small.getlength(c) + tracking * size * .4; continue
        d.text((x, pad), c, font=f, fill=colour); x += f.getlength(c) + tracking * size
    return im.crop(im.getbbox())
def initials(text, size, strong, soft):
    f = ImageFont.truetype(FONT, size); pad = size
    w = int(sum(f.getlength(c) for c in text)) + 2 * pad
    im = Image.new('RGBA', (w, int(size * 1.6) + 2 * pad), (0, 0, 0, 0)); d = ImageDraw.Draw(im); x = pad
    for i, c in enumerate(text):
        first = i == 0 or text[i - 1] == ' '
        d.text((x, pad), c, font=f, fill=strong if first else soft); x += f.getlength(c)
    return im.crop(im.getbbox())
meta = {}
im = initials("Always Value Everybody's Safety", 72, WHITE, (255, 255, 255, 150)); im.save(os.path.join(OUT, 'type-aves-line.png'), optimize=True); meta['aves-line'] = {'text': "Always Value Everybody's Safety", 'w': im.width, 'h': im.height}
for key, (text, size, tr, col) in TITLES.items():
    im = render(text, size, tr, col); im.save(os.path.join(OUT, 'type-' + key + '.png'), optimize=True); meta[key] = {'text': text, 'w': im.width, 'h': im.height}
# the live head-size number: one picture per glyph, all on one baseline and one height, composed in the page
GREEN_DARK = (2, 106, 53, 255)
gf = ImageFont.truetype(FONT, 160); asc, desc = gf.getmetrics(); meta['glyphs'] = {'h': asc + desc}
for name, text in [*[(str(n), str(n)) for n in range(10)], ('dot', '.'), ('cm', 'cm')]:
    w = int(gf.getlength(text) + 0.999)
    im = Image.new('RGBA', (w, asc + desc), (0, 0, 0, 0)); ImageDraw.Draw(im).text((0, 0), text, font=gf, fill=GREEN_DARK)
    im.save(os.path.join(OUT, 'type-g-' + name + '.png'), optimize=True); meta['glyphs'][name] = w
json.dump(meta, open(os.path.join(OUT, 'type.json'), 'w'), indent=1); print(len(meta) - 1, 'headings set, 12 glyphs')
