"""Accessory pictures for the COMPATIBLE ACCESSORIES section -> assets/acc-<key>.png (max 520 px).
The pictures are the ADS's own embedded photo (page 2 of ads-841r-rev2.pdf, extracted with its soft mask by
`pdfimages -png -f 2 -l 2`), not a crop of the page render: no cell colour, no watermark, no badge.
usage: ../../../.venv/bin/python accessories.py
"""
import os, subprocess, glob, tempfile
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
CUT = os.path.join(ROOT, 'assets', 'cut')
ADS = os.path.join(ROOT, 'exploded', 'research.nosync', 'av-841r', 'ads-841r-rev2.pdf')
OUT = os.path.join(HERE, 'assets')
# The suspension uses the site's cut-out (the same photo as the ADS, at higher resolution). The other ten use the ADS's own
# embedded photos: the site's cut-outs for AV-724PL and AV-724PU are the same picture, and its AV-728 is not the ADS's 4-point strap.
FROM_CUT = {'565r': 'aves-titan-av-565r-suspension'}
FROM_ADS = {'5055ft01': (1, 90), '728': (3, 0), '729': (5, 90), '743': (7, 90), '724cl': (9, 90), '724pu': (11, 0), '724pl': (13, 0),
            'neck-shade': (17, 0), 'fr-neck-shade': (19, 0), 'full-brim-neck-shade': (21, 0)}  # image index, rotation
def save(im, key):
    im = im.convert('RGBA'); im = im.crop(im.getbbox()); im.thumbnail((520, 520), Image.LANCZOS)
    im.save(os.path.join(OUT, f'acc-{key}.png'), optimize=True); print(key, im.size)
for key, pid in FROM_CUT.items(): save(Image.open(os.path.join(CUT, pid + '.png')), key)
with tempfile.TemporaryDirectory() as tmp:
    subprocess.run(['pdfimages', '-png', '-f', '2', '-l', '2', ADS, os.path.join(tmp, 'a')], check=True)
    files = sorted(glob.glob(os.path.join(tmp, 'a-*.png')))
    for key, (index, turn) in FROM_ADS.items():
        im = Image.open(files[index]).convert('RGB'); im.putalpha(Image.open(files[index + 1]).convert('L'))
        if turn: im = im.rotate(turn, expand=True)
        save(im, key)
