"""Assemble the exploded view from cut/*.png: parts in assembly order along one axis, consistent scale, soft shadows, studio grey. assemble.py <out.png> [--labels]"""
import os, sys, numpy as np
from PIL import Image, ImageFilter, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__)); C = os.path.join(HERE, 'cut')
ORDER = [('lens', 'Polycarbonate lens'), ('frame', 'Frame'), ('gasket', 'Removable foam gasket'), ('temple-left', 'Temple, left'), ('temple-right', 'Temple, right')]
# target widths relative to the frame width (scale truth from the product photo: lens ≈ frame, gasket ≈ 0.95 frame, temple ≈ 0.9 frame)
REL = {'lens': 0.96, 'frame': 1.0, 'gasket': 0.95, 'temple-left': 0.9, 'temple-right': 0.9}
ROT = {'temple-right': -24}   # degrees, level the right temple to the left one's tilt
def load(n):
    p = os.path.join(C, n + '.png')
    if not os.path.exists(p): return None
    im = Image.open(p).convert('RGBA')
    if n in ROT: im = im.rotate(ROT[n], expand=True, resample=Image.BICUBIC); im = im.crop(im.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox())
    return im
def main(out, labels):
    parts = [(n, lab, load(n)) for n, lab in ORDER]; parts = [(n, l, im) for n, l, im in parts if im]
    FW = 520; gap = 70; pad = 120
    scaled = []
    for n, l, im in parts:
        w = int(FW * REL[n]); s = w / im.width; scaled.append((n, l, im.resize((w, max(1, int(im.height * s))), Image.LANCZOS)))
    W = pad * 2 + sum(im.width for _, _, im in scaled) + gap * (len(scaled) - 1); H = 760
    bg = Image.new('RGBA', (W, H), (0, 0, 0, 0)); grad = np.linspace(222, 204, H).astype(np.uint8); g = np.repeat(grad[:, None], W, 1)
    bg = Image.fromarray(np.stack([g, g + 2, g + 5, np.full_like(g, 255)], 2), 'RGBA')
    x = pad; cy = 330; f = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', 22); d = ImageDraw.Draw(bg)
    for i, (n, lab, im) in enumerate(scaled):
        y = cy - im.height // 2
        P = 60; sh = Image.new('RGBA', (im.width + 2 * P, im.height // 3 + 2 * P), (0, 0, 0, 0))
        sh.paste(Image.new('RGBA', (im.width, max(1, im.height // 3)), (0, 0, 0, 0)), (P, P)); a = im.getchannel('A').resize((im.width, max(1, im.height // 3)), Image.LANCZOS).point(lambda v: int(v * 0.32))
        am = Image.new('L', sh.size, 0); am.paste(a, (P, P)); sh.putalpha(am); sh = sh.filter(ImageFilter.GaussianBlur(16))
        bg.alpha_composite(sh, (x - P, cy + im.height // 2 + 70 - P)); bg.alpha_composite(im, (x, y))
        if labels:
            t = f'{i + 1}'; d.text((x + im.width // 2 - 6, cy + im.height // 2 + 130), t, fill=(60, 64, 70, 255), font=f)
            d.text((x + im.width // 2 - d.textlength(lab, font=f) / 2, cy + im.height // 2 + 158), lab, fill=(60, 64, 70, 255), font=f)
        x += im.width + gap
    bg.convert('RGB').save(out); print('wrote', out, bg.size, [n for n, _, _ in scaled])
if __name__ == '__main__': main(sys.argv[1], '--labels' in sys.argv)
