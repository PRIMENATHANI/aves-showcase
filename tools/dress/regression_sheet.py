"""Regression sheet: bench winners (top row) vs pipeline output (bottom row)."""
import os
from PIL import Image, ImageDraw, ImageFont
R = '/Users/macintosh/Documents/Claude/Sloane/aves-showcase/'
B = R + 'spikes/dress-v0.2-bench/'; N = R + 'tools/dress/work/raw/'
items = [('helmet  AV-841R (klein)', B + 'klein-fidelity/A-01-helmet.png', N + 'aves-titan-av-841r-nv.png', (230, 40, 670, 340)),
         ('glasses  SG30 (klein)', B + 'klein-fidelity/A-02-glasses.png', N + 'av-sg30.png', (230, 40, 670, 340)),
         ('earmuffs  HM3093 on helmet (klein)', B + 'klein-fidelity/A-03-earmuffs.png', N + 'av-hm3093-cap-earmuffs__on-aves-titan-av-841r-nv.png', (230, 40, 670, 340)),
         ('gloves  HG-2230 (Qwen)', B + 'qwen-r2/04-gloves.png', N + 'hg-2230-rubber-neoprene-gloves.png', (150, 600, 750, 1160))]
f = ImageFont.load_default(); cw, ch = 420, 420
im = Image.new('RGB', (len(items) * (cw + 10) + 10, 2 * (ch + 24) + 10), (14, 16, 20)); d = ImageDraw.Draw(im)
for i, (lab, a, b, box) in enumerate(items):
    for r, (tag, p) in enumerate((('bench', a), ('pipeline', b))):
        x = 10 + i * (cw + 10); y = 10 + r * (ch + 24); d.text((x, y), f'{lab} | {tag}', fill=(230, 233, 238), font=f)
        if not os.path.exists(p): d.text((x, y + 30), 'missing ' + os.path.basename(p), fill=(255, 120, 120), font=f); continue
        cr = Image.open(p).convert('RGB'); cr = cr.resize((896, 1536)) if cr.size != (896, 1536) else cr; cr = cr.crop(box)
        s = min(cw / cr.width, ch / cr.height); im.paste(cr.resize((int(cr.width * s), int(cr.height * s)), Image.LANCZOS), (x, y + 16))
im.save(R + 'spikes/dress-v0.3-qc/regression.png'); print(im.size)
