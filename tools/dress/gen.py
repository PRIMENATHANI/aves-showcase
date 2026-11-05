"""Generate ONE dressing layer by rules.
  /tmp/aves-venv/bin/python tools/dress/gen.py <product> [--on <depLayerId>] [--slot s] [--seed n] [--tag name] [--out dir]
Canvas = base, or the dependency's merged frame (tools/dress/work/frames/<layerId>.png). Model by slot:
klein 9B for head/eye/hearing/face, Qwen Image Edit 2511 + Lightning for vest/fall/dropped/hand/cryo-body/respiratory.
Writes raw (work/raw), merged frame (work/frames), layer RGBA (assets/dress/layers) and returns the manifest record."""
import os, sys, json, time, subprocess
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import ROOT, DRESS, Z, save_layer
import mask_core as MC
T = os.path.dirname(os.path.abspath(__file__)); WORK = os.path.join(T, 'work')
REFS = os.path.join(ROOT, 'spikes', 'dress-v0.2-bench', 'refs-v2'); DESC = os.path.join(ROOT, 'spikes', 'dress-v0.2', 'descriptions')
BASE = os.path.join(WORK, 'base.png')
ENV = dict(os.environ, DRAWTHINGS_MODELS_DIR=os.path.expanduser('~/Flowtronix/models/draw-things'))
KLEIN = ['--model', 'flux_2_klein_9b_q8p.ckpt']
QWEN = ['--model', 'qwen_image_edit_2511_q6p.ckpt', '--config-json', '{"loras":[{"file":"qwen_image_edit_2511_lightning_4_step_v1.0_lora_f16.ckpt","weight":1.0,"version":"qwen_image"}]}', '--steps', '4', '--cfg', '1.0']
MODEL = {'head': 'klein9b', 'eye': 'klein9b', 'hearing': 'klein9b', 'face': 'klein9b', 'vest': 'qwen2511-lightning', 'fall': 'qwen2511-lightning',
         'dropped': 'qwen2511-lightning', 'hand': 'qwen2511-lightning', 'respiratory': 'qwen2511-lightning', 'cryo-body': 'qwen2511-lightning'}
K_TAIL = "Same man, same face, same pose, same coverall, same background, same framing. The product looks exactly like the reference: same colours, shape and markings."
Q_TAIL = "Full-length shot, the whole body from boots to above the head, exactly the same framing and camera distance as the first image. Same man, same face, same pose, same coverall with sleeves down to the wrists, same background."
Q_TAIL_VEST = "Full-length shot, the whole body from boots to above the head, exactly the same framing and camera distance as the first image. Same man, same face, same pose, same navy long-sleeved coverall with its collar, front zip and sleeves down to the wrists, worn under the vest, same background."
ORD = {1: 'the second image', 2: 'the second and third images'}
# refs-v2 angle choice per product = what produced the v0.2 chain / bench winners
REFPICK = {'aves-titan-av-841r-nv': ['three-quarter', 'front'], 'av-sg30': ['side-three-quarter'], 'av-hm3093-cap-earmuffs': ['front'],
           'hg-2230-rubber-neoprene-gloves': ['back-upright', 'three-quarter'], 'scuta-vest': ['front-three-quarter', 'front-flat'],
           'full-body-harness': ['front', 'back'], 'av-101373': ['lying-three-quarter', 'hanging-u']}
HT = dict(
 helmet="a full-brim industrial hard hat with a one-piece glossy white shell, a tall rounded dome with a raised centre rib running front to back and recessed shoulders on each side, and a low, broad flat brim about 40 mm wide all the way round, slightly drooping at the edge with a thin rolled lip. Four small rectangular notches sit on the shell wall just above the brim. No front peak, no logo, no vents.",
 glasses="half-wrap sport glasses with a single continuous wrap-around grey lens, a dark smoked upper frame rail across the top of the lens as a brow guard, no lower frame, and a moulded black nose bridge. The two temples are black near the hinge and bright green further back with a lime-green stripe and a white AVES logo, and they run back over the ears, ending in an oval cut-out loop.",
 earmuffs="cap-mounted earmuffs with no headband. Two glossy black ear cups, each with a wide green band around the outside and a green AVES logo on the outer face. Each cup hangs from its own rigid black side arm that rises vertically from the cup and curves forward at the top, where it clips into the side slot of the hard hat. The arm carries the AVES wordmark vertically in cream. The cups sit over the ears, under the brim.",
 gloves="very long matt black rubber gauntlet gloves, seamless and one-piece, reaching to mid forearm, with heavy crinkled ridged texture over the fingers and hand, a smoother gauntlet, and a rolled cuff edge with an orange band. An AVES logo and marking block is printed along the gauntlet.")
HT_ITEM = {'aves-titan-av-841r-nv': ('white wide-brim hard hat', HT['helmet']), 'av-sg30': ('safety glasses', HT['glasses']),
           'av-hm3093-cap-earmuffs': ('cap-mounted earmuffs', HT['earmuffs']), 'hg-2230-rubber-neoprene-gloves': ('black rubber gauntlet gloves', HT['gloves'])}
# slot rules: clip rectangles (frame px), threshold, colour mask
CLIP = dict(head=([(250, 0, 650, 330)], 24, None), eye=([(340, 165, 560, 285)], 24, None),
            hearing_cap=([(290, 120, 425, 340), (471, 120, 606, 340)], 24, None),
            hearing_band=([(260, 40, 640, 360)], 24, None),
            hearing_plug=([(290, 170, 610, 480)], 24, None),
            face=([(250, 90, 650, 460)], 24, None),
            resp_mask=([(330, 170, 570, 400)], 28, None), resp_half=([(310, 170, 590, 430)], 28, None), resp_pouch=([(420, 740, 680, 1030)], 28, None),
            vest=([(150, 250, 750, 920)], 28, 'vest'), fall=([(150, 250, 750, 1050)], 28, None), dropped=([(400, 740, 700, 1130)], 28, None),
            hand=([(190, 630, 360, 1130), (540, 630, 710, 1130)], 28, 'glove'), hand_nonnavy=([(190, 630, 360, 1130), (540, 630, 710, 1130)], 28, 'nonnavy'),
            cryo=([(200, 280, 700, 1050)], 28, None))
MIN_PX = 400   # below this many mask pixels the item is not visible -> status missing

_P = None
def product(pid):
    global _P
    if _P is None: _P = {p['id']: p for p in json.load(open(os.path.join(ROOT, 'data', 'products.json')))}
    return _P[pid]

def kind(pid, slot):
    n = (pid + ' ' + product(pid)['name']).lower()
    if slot == 'hearing':
        if 'plug' in n: return 'plug'
        if '-hb' in pid or 'headband' in n or 'ear-muffs' in pid: return 'band'
        return 'cap'
    if slot == 'respiratory':
        if 'escape' in n: return 'pouch'
        if 'double-filter' in n or 'tp2000' in n or 'tp4000' in n: return 'half'
        return 'mask'
    if slot == 'eye': return 'goggles' if '-gg' in pid else 'glasses'
    if slot == 'face': return 'welding' if 'weld' in n else 'shield'
    if slot == 'hand': return 'dark' if pid == 'hg-2230-rubber-neoprene-gloves' else 'other'
    return slot

def clip_key(pid, slot):
    k = kind(pid, slot)
    m = {'hearing': {'cap': 'hearing_cap', 'band': 'hearing_band', 'plug': 'hearing_plug'}, 'respiratory': {'mask': 'resp_mask', 'half': 'resp_half', 'pouch': 'resp_pouch'},
         'hand': {'dark': 'hand', 'other': 'hand_nonnavy'}, 'cryo-body': {'cryo-body': 'cryo'}}
    return m.get(slot, {}).get(k, slot)

def item_and_place(pid, slot):
    k = kind(pid, slot)
    if slot == 'head': return (HT_ITEM[pid][0] if pid in HT_ITEM else 'industrial hard hat'), 'on his head'
    if slot == 'eye':
        return ('safety glasses', 'on his face over his eyes with the arms open behind his ears') if k == 'glasses' else ('safety goggles', 'over his eyes with the strap going around the back of his head')
    if slot == 'hearing':
        if k == 'cap': return 'cap-mounted earmuffs', 'one cup over each ear, mounted to the hard hat'
        if k == 'band': return 'headband earmuffs', 'one cup over each ear, the headband arching over the top of the hard hat'
        return 'earplugs', 'in both ears, the cord or band hanging visibly below his chin'
    if slot == 'face':
        return ('welding helmet', 'flipped down over his face, clipped to the hard hat') if k == 'welding' else ('face shield', 'a clear visor hanging from the brim of the hard hat down in front of his whole face')
    if slot == 'respiratory':
        if k == 'pouch':
            col = (product(pid).get('color') or '').lower().replace('hi-viz', 'hi-vis') or 'grey'
            return f'compact {col} escape-hood pouch', "about the size of a lunch box, clipped at his belt on the left hip (the right-hand side of the picture), below the vest hem; the man's face stays uncovered"
        if k == 'half': return 'half-mask respirator', 'over his nose and mouth, with a filter cartridge on each cheek and straps around the head'
        return 'disposable respirator mask', 'over his nose and mouth with the straps going behind his head'
    if slot == 'hand': return ('black rubber gauntlet gloves' if pid in HT_ITEM else 'work gloves'), 'on both hands, fingers inside'
    if slot == 'vest': return 'hi-vis vest', 'over his navy coverall, closed at the front'
    if slot == 'fall': return 'full-body fall-arrest harness', 'over the hi-vis vest, strapped snugly on his body'
    if slot == 'dropped': return 'short coiled tool tether', 'about 30 cm long, clipped to the harness waist belt on his left hip (the right-hand side of the picture), hanging straight down against the thigh, one carabiner at its free end'
    if slot == 'cryo-body': return 'thermal protection apron', 'over the front of his body from chest to knees, tied at the waist'

def description(pid, slot):
    if slot == 'respiratory' and kind(pid, slot) == 'pouch': return 'a small rectangular soft pouch with a flap closure and a belt clip.'
    if slot == 'dropped': return 'a coiled stretch tether: a ribbed coiled cord about 30 cm long with a black webbing sleeve and a carabiner at the free end.'
    if pid in HT_ITEM: return HT_ITEM[pid][1]
    f = os.path.join(DESC, pid + '.txt')
    if os.path.exists(f): return open(f).read().strip()
    d = os.path.join(REFS, pid, 'description.txt')
    if os.path.exists(d): return open(d).read().strip()[:700]
    p = product(pid); bits = []
    if p.get('sub'): bits.append(p['sub'])
    if p.get('color'): bits.append('colour ' + p['color'])
    if p.get('material'): bits.append('material ' + p['material'])
    txt = p['name'] + '. ' + ', '.join(bits) + '. '
    for b in (p.get('bullets') or [])[:3]:
        b = b.replace('\n', ' ').strip()
        if len(txt) + len(b) < 520: txt += b.rstrip('.') + '. '
    return txt.strip()

def refs_for(pid):
    d = os.path.join(REFS, pid)
    if pid in REFPICK and os.path.isdir(d): return [os.path.join(d, a + '.png') for a in REFPICK[pid] if os.path.exists(os.path.join(d, a + '.png'))]
    out = os.path.join(WORK, 'refs', pid + '.png')
    if not os.path.exists(out):
        im = Image.open(os.path.join(ROOT, 'assets', 'cut', pid + '.png')).convert('RGBA'); bb = im.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox()
        if bb: im = im.crop(bb)
        s = 819 / max(im.size); im = im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.LANCZOS)
        c = Image.new('RGB', (1024, 1024), 'white'); c.paste(im, ((1024 - im.width) // 2, (1024 - im.height) // 2), im); c.save(out)
    return [out]

def layer_id(pid, dep=None): return pid if not dep else f'{pid}__on-{dep.split("__on-")[0]}'

def build_prompt(pid, slot, nrefs):
    item, place = item_and_place(pid, slot); desc = description(pid, slot); o = ORD[nrefs]; be = 'are' if (item.endswith('s') and MODEL[slot] == 'klein9b') else 'is'
    if MODEL[slot] == 'klein9b':
        return f"The man from the first image now wears the {item} shown in {o}, {place}. {K_TAIL} The {item} {be}: {desc}"
    tail = Q_TAIL_VEST if slot == 'vest' else Q_TAIL
    extra = 'The coverall sleeves stay down and the glove cuffs go over the sleeves. ' if slot == 'hand' else ''
    return f"The man from the first image now wears the {item} shown in {o}, {place}. The {item} {be}: {desc} {extra}{tail}"

def frame_path(lid): return os.path.join(WORK, 'frames', lid + '.png')

def run(pid, slot, dep=None, seed='4242', tag=None, out_dir=None, lid=None):
    """dep = dependency LAYER id (or product id) whose merged frame is the canvas; None = base"""
    lid = lid or layer_id(pid, dep); tag = tag or lid
    can_path = os.path.join(out_dir or os.path.join(WORK, 'frames'), dep + '.png') if dep else BASE
    if not os.path.exists(can_path): raise FileNotFoundError('canvas missing: ' + can_path)
    refs = refs_for(pid)[:2]; prompt = build_prompt(pid, slot, len(refs))
    raw = os.path.join(WORK, 'raw', tag + ('' if seed == '4242' else '-s' + seed) + '.png')
    eng = KLEIN if MODEL[slot] == 'klein9b' else QWEN
    cmd = ['draw-things-cli', 'generate', '--offline', *eng, '--prompt', prompt, '--image', can_path, *sum([['--image', r] for r in refs], []),
           '--width', '896', '--height', '1536', '--seed', seed, '--disable-preview', '--output', raw]
    t = time.time(); r = subprocess.run(cmd, env=ENV, capture_output=True, text=True); dt = round(time.time() - t)
    open(os.path.join(T, 'gen.log'), 'a').write(json.dumps(dict(layer=lid, tag=tag, seed=seed, wall_s=dt, canvas=os.path.relpath(can_path, ROOT), refs=[os.path.relpath(x, ROOT) for x in refs], prompt=prompt, model=MODEL[slot], rc=r.returncode)) + '\n')
    if not os.path.exists(raw): raise RuntimeError(f'generate failed for {lid}: ' + r.stderr[-400:])
    return merge(pid, slot, lid, raw, can_path, dt, tag, out_dir)

def nonnavy_mask(gen, can, clip, thr):
    m, d = MC.automask(gen, can, clip, thr, colormask=None)
    nv = MC.navy(np.asarray(gen)); dd = np.asarray(d) & ~ndi.binary_dilation(nv, iterations=1)
    dd = ndi.binary_opening(dd, iterations=2); lab, n = ndi.label(dd); keep = np.zeros_like(dd); cmask = np.zeros_like(dd)
    for rx in clip:
        sub = np.zeros_like(dd); sub[rx[1]:rx[3], rx[0]:rx[2]] = True; cmask |= sub; l2 = lab * sub; ids = [i for i in np.unique(l2) if i > 0]
        if ids: keep |= (lab == ids[int(np.argmax([(l2 == i).sum() for i in ids]))])
    d = ndi.binary_erosion(ndi.binary_dilation(ndi.binary_fill_holes(ndi.binary_closing(keep, iterations=10)), iterations=4) & cmask, iterations=2)
    return Image.fromarray((d * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(3)), d

def merge(pid, slot, lid, raw, can_path, dt, tag, out_dir=None):
    key = clip_key(pid, slot); clip, thr, cm = CLIP[key]
    gen = Image.open(raw).convert('RGB'); can = Image.open(can_path).convert('RGB')
    if gen.size != can.size: gen = gen.resize(can.size, Image.LANCZOS)
    if MODEL[slot] != 'klein9b': gen = MC.align(gen, can, clip, {})
    m, d = nonnavy_mask(gen, can, clip, thr) if cm == 'nonnavy' else MC.automask(gen, can, clip, thr, colormask=cm)
    px = int(d.sum()); ys, xs = np.where(np.asarray(m) > 8)
    box = [int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1] if len(xs) else None
    rec = dict(id=lid, product=pid, slot=slot, dependsOn=(lid.split('__on-', 1)[1] if '__on-' in lid else None), box=box, z=Z[slot], model=MODEL[slot], seconds=dt,
               status='ok' if px >= MIN_PX and box else 'missing', mask_px=px)
    Image.composite(gen, can, m).save(os.path.join(os.path.dirname(frame_path('x')) if not out_dir else out_dir, tag + '.png'))
    m.save(os.path.join(WORK, 'raw', tag + '-mask.png')); gen.save(os.path.join(WORK, 'raw', tag + '-aligned.png'))
    if rec['status'] == 'ok':
        ld = os.path.join(out_dir, 'layers') if out_dir else os.path.join(DRESS, 'layers'); os.makedirs(ld, exist_ok=True); save_layer(gen, m, os.path.join(ld, tag + '.png'))
    return rec

if __name__ == '__main__':
    a = sys.argv[1:]; pid = a[0]; g = lambda k, d=None: a[a.index(k) + 1] if k in a else d
    slot = g('--slot')
    if not slot:
        for kit in json.load(open(os.path.join(ROOT, 'data', 'kits.json'))):
            for s in kit['slots']:
                if s['primary'] == pid: slot = s['slot']
    outd = g('--out')
    if outd: os.makedirs(outd, exist_ok=True)
    print(json.dumps(run(pid, slot, dep=g('--on'), seed=g('--seed', '4242'), tag=g('--tag'), out_dir=outd)))
