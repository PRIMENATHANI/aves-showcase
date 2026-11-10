"""v0.4: compose everything one kit needs into v0.4/experience/ (data/<kit>.json + assets), from the sources of truth.
Sources: data/kits.json + data/products.json (website crawl: slots, alternates, SKUs, URLs), assets/dress/manifest.json (worn
layers), data/catalogue-rev7.json (exact catalogue copy + image names, read from the .indd), v0.4/data/why.json,
v0.4/data/kit-<kit>.config.json (everything that is a judgement: names, hazard notes, anchors, shelf places, packs).
usage: .venv/bin/python v0.4/tools/build_kit.py oil-gas
"""
import sys, os, json, shutil
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
J = lambda p: json.load(open(os.path.join(ROOT, p)))
kit_id = sys.argv[1] if len(sys.argv) > 1 else 'oil-gas'
EXP = os.path.join(ROOT, 'v0.4/experience'); A = os.path.join(EXP, 'assets')
for d in ('products', 'packs', 'brand', 'site'): os.makedirs(os.path.join(A, d), exist_ok=True)
cfg, why, cat = J(f'v0.4/data/kit-{kit_id}.config.json'), J('v0.4/data/why.json'), J('data/catalogue-rev7.json')['products']
kits, man = J('data/kits.json'), J('assets/dress/manifest.json'); products = {p['id']: p for p in J('data/products.json')}
kit = next(k for k in kits if k['id'] == kit_id); L = {l['id']: l for l in man['layers']}
def cp(src, dst, maxpx=None, jpg=False):
    src = os.path.join(ROOT, src); dst = os.path.join(A, dst)
    if maxpx or jpg:
        im = Image.open(src); im = im.convert('RGB') if jpg else im.convert('RGBA')
        if maxpx: im.thumbnail((maxpx, maxpx), Image.LANCZOS)
        im.save(dst, quality=88) if jpg else im.save(dst, optimize=True)
    else: shutil.copyfile(src, dst)
steps = []
for n, lid in enumerate(man['kits'][kit_id]['order']):
    l = L[lid]; pid = l['product']; slot = l['slot']; ck = cfg['category'][slot]; p = products.get(pid, {}); c = cat.get(pid, {}); s = cfg['sister'].get(pid)
    slot_def = next((x for x in kit['slots'] if x['slot'] == slot), {})
    # product picture: the catalogue's own, else the PTF photo cut (spikes/a-plus/art/hero), else none (the page crops the worn layer)
    img = None
    for cand in (f'assets/catalogue/{pid}.png', f'spikes/a-plus/art/hero/{pid}.png'):
        if os.path.exists(os.path.join(ROOT, cand)): cp(cand, f'products/{pid}.png', 1100); img = f'assets/products/{pid}.png'; break
    bullets = [b.rstrip('.') for b in (s['bullets'] if s else c.get('bullets', [])) if not any(b.startswith(d) for d in cfg['drop_bullets'])]
    pack = cfg['packs'].get(slot)
    if pack and pack[0] != '_': cp(f'spikes/a-plus/art/pack/{pack[0]}.png', f'packs/{pack[0]}.png', 700)
    if pid == 'aves-escape-hood-bag': cp('spikes/a-plus/art/cut/escape-pouch.png', 'products/escape-pouch.png', 700)
    hz = cfg['hazard'][slot]
    steps.append({
        'n': n + 1, 'layer': lid, 'product': pid, 'slot': slot, 'box': l['box'], 'z': 75 if slot == 'eye' else l['z'], 'cat': ck,
        'name': cfg['names'][pid][0], 'descriptor': cfg['names'][pid][1], 'sku': (s or {}).get('sku') or c.get('artNo') or p.get('sku', ''),
        'standards': (s or {}).get('standards') or cfg['standards'].get(pid) or p.get('standards', ''),
        'bullets': bullets, 'short': [b for b in bullets if len(b) <= 92][:3], 'material': p.get('material', ''), 'colour': p.get('color', ''),
        'why': slot_def.get('why', (s or {}).get('note', '')), 'url': '' if s else p.get('url', ''), 'sister': bool(s), 'sisterNote': (s or {}).get('note', ''),
        'hazard': {'title': hz[0], 'where': hz[1], 'at': hz[2]}, 'anchors': cfg['anchors'][slot], 'place': cfg['shelf_place'][slot],
        'pack': ({'src': f'assets/packs/{pack[0]}.png', 'h': pack[1], 'dx': pack[2]} if pack and pack[0] != '_' else
                 {'src': 'assets/products/escape-pouch.png', 'h': 70, 'dx': -96, 'pouch': True} if pid == 'aves-escape-hood-bag' else None),
        'image': img, 'fly': 'assets/products/escape-pouch.png' if pid == 'aves-escape-hood-bag' else img,
        'copySource': 'catalogue REV 7 p. %s' % c['page'] if c else ('PTF description' if s else 'website'),
    })
cats = {}
for ck in dict.fromkeys(s['cat'] for s in steps):
    a = cfg['approach'].get(ck)
    cats[ck] = {'title': f'assets/type/cat-{ck}.png', 'icon': f'assets/brand/cat-{ck}.png' if ck != 'vest' else None,
                'approach': {'word': a, 'art': f'assets/brand/approach-{ck}.png'} if a else None,
                'why': ({'title': why[ck]['title'], 'titleArt': f'assets/type/why-{ck}.png', 'items': why[ck]['items']} if ck in why else None)}
    if a: cp(f'spikes/a-plus/art/brand/approach-{ck}.png', f'brand/approach-{ck}.png')
    if ck != 'vest': cp(f'spikes/a-plus/art/brand/cat-{ck}.png', f'brand/cat-{ck}.png')
for f in ('v.png', 'tagline-rev.png', 'oil-gas.svg'): cp(f'spikes/a-plus/art/brand/{f}', f'brand/{f}')
cp('spikes/a-plus/art/aves-logo.png', 'brand/aves-logo.png'); cp('spikes/a-plus/art/aves-logo-rev.png', 'brand/aves-logo-rev.png')
cp(cfg['backdrop'], f'site/{kit_id}.jpg', jpg=True); cp(cfg['shelf'], 'site/shelf.jpg')
out = {'kit': {'id': kit_id, 'name': kit['name'], 'title': kit['title'], 'group': kit['group'], 'intro': kit['intro'], 'hazards': kit['hazards'],
               'index': [k['id'] for k in kits].index(kit_id) + 1, 'of': len(kits)},
       'frame': man['frame'], 'rack': cfg['rack'], 'backdrop': f'assets/site/{kit_id}.jpg', 'shelf': 'assets/site/shelf.jpg',
       'boots': {'name': 'Cavalier Captain 8713-4 HC', 'sku': '73110CV214', 'standards': 'EN ISO 20345:2011 S3'}, 'cats': cats, 'steps': steps}
json.dump(out, open(os.path.join(EXP, 'data', kit_id + '.json'), 'w'), ensure_ascii=False, indent=1)
print(kit_id, len(steps), 'steps;', ', '.join(f"{s['n']} {s['name']} [{s['copySource']}] {len(s['bullets'])}b" for s in steps))
