"""Step 0: export the v0.2 Oil & Gas chain as the v0.3 data contract (base.png, layers/*.png, manifest.json).
Layer = aligned generated frame (work/NN-aligned.png) with alpha = the merge mask (work/NN-mask.png), box = mask bbox."""
import os, json, sys
import numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import ROOT, DRESS, rembg_cut, Z, write_manifest, load_manifest, save_layer
V2 = os.path.join(ROOT, 'spikes', 'dress-v0.2'); WK = os.path.join(V2, 'work')
os.makedirs(os.path.join(DRESS, 'layers'), exist_ok=True)
base = Image.open(os.path.join(V2, 'raw', 'f00-base.png')).convert('RGB')
cut = rembg_cut(base); cut.save(os.path.join(DRESS, 'base.png'), optimize=True)
# (idx, layerId, product, slot, dependsOn, model, seconds)
L = [
 (1, 'aves-titan-av-841r-nv', 'aves-titan-av-841r-nv', 'head', None, 'klein9b', 143),
 (2, 'av-sg30', 'av-sg30', 'eye', None, 'klein9b', 94),
 (3, 'av-hm3093-cap-earmuffs__on-aves-titan-av-841r-nv', 'av-hm3093-cap-earmuffs', 'hearing', 'aves-titan-av-841r-nv', 'klein9b', 137),
 (4, 'scuta-vest', 'scuta-vest', 'vest', None, 'qwen2511-lightning', 189),
 (5, 'full-body-harness', 'full-body-harness', 'fall', None, 'qwen2511-lightning', 193),
 (6, 'av-101373__on-full-body-harness', 'av-101373', 'dropped', 'full-body-harness', 'qwen2511-lightning', 193),
 (8, 'hg-2230-rubber-neoprene-gloves', 'hg-2230-rubber-neoprene-gloves', 'hand', None, 'qwen2511-lightning', 192),
]
m = load_manifest()
for idx, lid, prod, slot, dep, model, sec in L:
    gen = Image.open(os.path.join(WK, f'{idx:02d}-aligned.png')).convert('RGB')
    mask = Image.open(os.path.join(WK, f'{idx:02d}-mask.png')).convert('L')
    a = np.asarray(mask); ys, xs = np.where(a > 8)
    box = [int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1]
    save_layer(gen, mask, os.path.join(DRESS, 'layers', lid + '.png'))
    m['layers'] = [l for l in m['layers'] if l['id'] != lid] + [dict(id=lid, product=prod, slot=slot, dependsOn=dep, box=box, z=Z[slot if not (slot == 'dropped') else 'dropped'], model=model, seconds=sec, status='ok')]
    print(lid, box)
m['kits']['oil-gas'] = {'order': ['aves-titan-av-841r-nv', 'av-sg30', 'av-hm3093-cap-earmuffs__on-aves-titan-av-841r-nv', 'scuta-vest', 'full-body-harness', 'av-101373__on-full-body-harness', 'hg-2230-rubber-neoprene-gloves']}
write_manifest(m)
