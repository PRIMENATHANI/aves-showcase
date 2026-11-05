"""Cavalier boots pass: Qwen Lightning on the base frame (cavalier-boots refs), diff-merged below the knees into work/base.png, rembg -> assets/dress/base.png.
Old base kept as work/base-v1.png and assets/dress/base-v1.png. Idempotent (skips when work/base-v1.png exists). Run from build.py before generating layers."""
import os, sys, json, shutil, subprocess, time
import numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import gen, mask_core as MC
from common import ROOT, DRESS, rembg_cut, load_manifest, write_manifest
CLIP = [(190, 1120, 710, 1510)]
def run():
    v1 = os.path.join(gen.WORK, 'base-v1.png')
    if os.path.exists(v1): return False
    rd = os.path.join(gen.REFS, 'cavalier-boots'); refs = [os.path.join(rd, 'front.png'), os.path.join(rd, 'three-quarter.png')]
    desc = 'high-cut black leather safety boots with a matt grain, black round laces, a padded black collar, a rounded composite toe cap and a thick black slip-resistant sole; a pair, one on each foot, seen at their true size on the man\'s feet.'
    prompt = ("The man from the first image now wears the black Cavalier Captain safety boots shown in the second and third images, on both feet, laced, the trouser hems falling over the boot shafts. "
              f"The boots are: {desc} " + gen.Q_TAIL)
    raw = os.path.join(gen.WORK, 'raw', 'boots.png'); t = time.time()
    cmd = ['draw-things-cli', 'generate', '--offline', *gen.QWEN, '--prompt', prompt, '--image', gen.BASE, *sum([['--image', r] for r in refs], []),
           '--width', '896', '--height', '1536', '--seed', '4242', '--disable-preview', '--output', raw]
    r = subprocess.run(cmd, env=gen.ENV, capture_output=True, text=True); dt = round(time.time() - t)
    open(os.path.join(gen.T, 'gen.log'), 'a').write(json.dumps(dict(layer='boots', wall_s=dt, prompt=prompt, rc=r.returncode)) + '\n')
    if not os.path.exists(raw): raise RuntimeError('boots generate failed ' + r.stderr[-300:])
    can = Image.open(gen.BASE).convert('RGB'); g = Image.open(raw).convert('RGB')
    if g.size != can.size: g = g.resize(can.size, Image.LANCZOS)
    g = MC.align(g, can, CLIP, {}); m, d = MC.automask(g, can, CLIP, 28)
    Image.composite(g, can, m).save(os.path.join(gen.WORK, 'raw', 'boots-merged.png')); m.save(os.path.join(gen.WORK, 'raw', 'boots-mask.png'))
    shutil.copy2(gen.BASE, v1); shutil.copy2(os.path.join(DRESS, 'base.png'), os.path.join(DRESS, 'base-v1.png'))
    merged = Image.open(os.path.join(gen.WORK, 'raw', 'boots-merged.png')); merged.save(gen.BASE)
    rembg_cut(merged).save(os.path.join(DRESS, 'base.png'), optimize=True)
    mf = load_manifest(); mf['boots'] = 'cavalier-captain-8713-4'; write_manifest(mf)
    print('boots done', dt, 's mask_px', int(d.sum())); return True
if __name__ == '__main__': run()
