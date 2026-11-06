"""Exploded-view spike for AV-GG40: local Draw Things, one generate at a time.
   .venv/bin/python spikes/exploded-view/av-gg40/run.py  -> out/<model>-s<seed>.png + sheet-v1.png"""
import os, sys, json, time, subprocess
from PIL import Image, ImageDraw, ImageFont
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..')); HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'out'); os.makedirs(OUT, exist_ok=True)
ENV = dict(os.environ, DRAWTHINGS_MODELS_DIR=os.path.expanduser('~/Flowtronix/models/draw-things'))
KLEIN = ['--model', 'flux_2_klein_9b_q8p.ckpt']
QWEN = ['--model', 'qwen_image_edit_2511_q6p.ckpt', '--config-json', '{"loras":[{"file":"qwen_image_edit_2511_lightning_4_step_v1.0_lora_f16.ckpt","weight":1.0,"version":"qwen_image"}]}', '--steps', '4', '--cfg', '1.0']
def log(*a): print(time.strftime('%H:%M:%S'), *a, flush=True)

def ref():
    out = os.path.join(OUT, 'ref.png')
    if os.path.exists(out): return out
    im = Image.open(os.path.join(ROOT, 'assets', 'cut', 'av-gg40.png')).convert('RGBA'); bb = im.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox()
    if bb: im = im.crop(bb)
    s = 819 / max(im.size); im = im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.LANCZOS)
    c = Image.new('RGB', (1024, 1024), 'white'); c.paste(im, ((1024 - im.width) // 2, (1024 - im.height) // 2), im); c.save(out); return out

PROMPT = ("Exploded view technical illustration of the safety glasses shown in the image, rendered as a photorealistic high-resolution product shot. "
          "The glasses are taken apart into exactly these parts, floating separated but precisely aligned in assembly order along one axis so it is clear how they fit together: "
          "the single clear wraparound polycarbonate lens; the black frame; the removable soft black foam gasket that sits behind the frame; the black contoured nose bridge; "
          "the two black temples with bright green rubber tips. No other parts, no screws, no invented internal components. "
          "Neutral light grey studio background, soft shadow under each part, even studio lighting, sharp focus. No text, no labels, no callout lines, no clutter. "
          "Every part looks exactly like the reference: same colours, shape and markings, including the white AVES logo on the temple.")

def gen(name, eng, seed, w, h):
    out = os.path.join(OUT, f'{name}-s{seed}.png')
    if os.path.exists(out): log('skip', out); return out
    cmd = ['draw-things-cli', 'generate', '--offline', *eng, '--prompt', PROMPT, '--image', ref(), '--width', str(w), '--height', str(h), '--seed', str(seed), '--disable-preview', '--output', out]
    t = time.time(); r = subprocess.run(cmd, env=ENV, capture_output=True, text=True); dt = round(time.time() - t)
    open(os.path.join(HERE, 'gen.log'), 'a').write(json.dumps(dict(out=os.path.relpath(out, ROOT), seed=seed, model=name, wall_s=dt, rc=r.returncode, prompt=PROMPT)) + '\n')
    log(name, seed, f'{dt}s rc={r.returncode}', '' if os.path.exists(out) else 'FAILED ' + r.stderr[-300:]); return out if os.path.exists(out) else None

def sheet(paths, name):
    f = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', 22); cw, ch = 640, 640
    im = Image.new('RGB', (3 * cw + 32, 2 * (ch + 40) + 32), (14, 16, 20)); d = ImageDraw.Draw(im)
    for i, p in enumerate(paths):
        r, c = divmod(i, 3); x, y = 16 + c * cw, 16 + r * (ch + 40)
        d.text((x, y), f'{i + 1}  {os.path.basename(p)}', fill=(230, 233, 238), font=f)
        if p and os.path.exists(p): im.paste(Image.open(p).convert('RGB').resize((cw - 16, ch - 16), Image.LANCZOS), (x, y + 32))
    im.save(os.path.join(HERE, name)); log('sheet', name)

if __name__ == '__main__':
    seeds = [7, 11, 23]
    paths = [gen('klein9b', KLEIN, s, 1280, 896) for s in seeds] + [gen('qwen2511', QWEN, s, 1280, 896) for s in seeds]
    sheet(paths, 'sheet-v1.png'); log('DONE')
