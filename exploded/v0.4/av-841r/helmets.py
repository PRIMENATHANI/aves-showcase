"""The other TITAN and VICTOR safety helmets -> assets/hp-<id>.png (cut-outs from aves-showcase/assets/cut, max 360 px)
and the "more" block of copy.json (name and address from aves-showcase/data/products.json). usage: ../../../.venv/bin/python helmets.py"""
import json, os
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
IDS = ['aves-titan-av-846r-v', 'aves-titan-av-564r-v', 'aves-titan-av-564p-v', 'aves-titan-av-585r-nv', 'aves-titan-av-585p-nv',
       'aves-victor-av-840r-nv', 'aves-victor-av-845r-v', 'aves-victor-av-714r-v', 'aves-victor-av-714p-v', 'aves-victor-av-717r-nv', 'av-717p']
products = {p['id']: p for p in json.load(open(os.path.join(ROOT, 'data', 'products.json')))}
more = []
for pid in IDS:
    im = Image.open(os.path.join(ROOT, 'assets', 'cut', pid + '.png')).convert('RGBA'); im = im.crop(im.getbbox()); im.thumbnail((360, 360), Image.LANCZOS)
    im.save(os.path.join(HERE, 'assets', f'hp-{pid}.png'), optimize=True)
    more.append({'id': pid, 'name': products[pid]['name'], 'url': products[pid]['url'], 'w': im.width, 'h': im.height})
copy = json.load(open(os.path.join(HERE, 'copy.json'))); copy['more'] = more
json.dump(copy, open(os.path.join(HERE, 'copy.json'), 'w'), indent=2, ensure_ascii=False); print(len(more), 'helmets')
