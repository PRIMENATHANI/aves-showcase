"""Piece-by-piece: each part of the AV-GG40 rendered alone with klein 9B from the real photos, 3 seeds each, one generate at a time."""
import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); import run
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); R = os.path.join(HERE, 'refs'); P = os.path.join(HERE, 'parts'); os.makedirs(P, exist_ok=True)
def sq(src, out):
    if os.path.exists(out): return out
    im = Image.open(src).convert('RGB'); c = Image.new('RGB', (1024, 1024), 'white'); s = 900 / max(im.size); im = im.resize((round(im.width*s), round(im.height*s)), Image.LANCZOS)
    c.paste(im, ((1024-im.width)//2, (1024-im.height)//2)); c.save(out); return out
REF1 = sq(os.path.join(R, '40w.png'), os.path.join(P, 'ref-3q.png')); REF2 = sq(os.path.join(R, 'gg40c-old.jpg'), os.path.join(P, 'ref-front.png'))
SAME = ("Product photo of one single component removed from the AVES safety glasses shown in the first image (second image shows the same glasses from the front, in an older orange colourway, for shape only). "
        "The component is shown alone, floating, at exactly the same three-quarter viewing angle and the same scale as the glasses in the first image, on a plain pure white background, soft studio lighting, sharp, photorealistic. "
        "Nothing else in the picture: no other parts, no text, no shadow of other parts. ")
PARTS = {
 'lens':   "The component is the single clear wraparound polycarbonate lens only: one piece of thin clear curved plastic in the exact outline of the lens opening, with the notch for the nose, completely free of the frame, no black parts at all.",
 'frame':  "The component is the black frame only: the one-piece matt black plastic full frame that surrounds the lens, with its brow bar, the moulded nose section, and the hinge lugs at each end. The frame is empty, with no lens inside it, no foam, no temples attached, so you see through the open lens aperture.",
 'gasket': "The component is the removable foam gasket only: a one-piece black soft foam face seal in the exact outline of the frame's back, thick, with the cut-out for the nose and small vent slots, the part that sits between the frame and the face. No frame, no lens, no temples.",
 'temple-left':  "The component is the left temple arm only: a slim black plastic arm with a hinge at the front end, a bright green rubber grip panel near the hinge and a green rubber tip at the ear end, with the small white AVES logo on the outer face. Only one arm.",
 'temple-right': "The component is the right temple arm only: a slim black plastic arm with a hinge at the front end, a bright green rubber grip panel near the hinge and a green rubber tip at the ear end, with the small white AVES logo on the outer face, seen from its outer side. Only one arm.",
}
def gen(part, seed):
    out = os.path.join(P, f'{part}-s{seed}.png')
    if os.path.exists(out): return out
    import subprocess, time, json
    cmd = ['draw-things-cli', 'generate', '--offline', *run.KLEIN, '--prompt', SAME + PARTS[part], '--image', REF1, '--image', REF2, '--width', '1024', '--height', '1024', '--seed', str(seed), '--disable-preview', '--output', out]
    t = time.time(); r = subprocess.run(cmd, env=run.ENV, capture_output=True, text=True); dt = round(time.time()-t)
    open(os.path.join(HERE, 'gen.log'), 'a').write(json.dumps(dict(out=os.path.relpath(out, run.ROOT), seed=seed, part=part, wall_s=dt, rc=r.returncode, prompt=SAME+PARTS[part]))+'\n')
    run.log(part, seed, f'{dt}s rc={r.returncode}', '' if os.path.exists(out) else 'FAILED '+r.stderr[-300:]); return out if os.path.exists(out) else None
if __name__ == '__main__':
    seeds = [3, 8, 21]; paths = []
    for part in PARTS:
        for s in seeds: paths.append(gen(part, s))
    run.sheet(paths[:6], 'parts-sheet-a.png'); run.sheet(paths[6:12], 'parts-sheet-b.png'); run.sheet(paths[12:], 'parts-sheet-c.png'); run.log('DONE3')
