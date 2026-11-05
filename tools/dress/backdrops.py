"""Step 2: 18 industry working-site backdrops, klein 9B text-to-image, fixed seed, shared style suffix.
.venv/bin/python tools/dress/backdrops.py [kitId ...]   (skips existing)"""
import os, sys, json, subprocess, time
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import ROOT, DRESS
SEED = '2026'
SUFFIX = "photoreal, eye-level camera, no people, no workers, no text, muted overcast light, wide shot"
SITE = {
 'oil-gas': "an oil and gas processing plant, steel pipework, valves, storage tanks and a flare stack in the distance",
 'rig-drilling': "an onshore drilling rig, derrick tower, drill floor and pipe racks on a gravel pad",
 'manufacturing': "a large factory production hall with machine tools, steel columns and overhead cranes",
 'construction': "a building construction site with a concrete and steel frame, scaffolding and a tower crane",
 'mining': "an open-pit mine with rock benches, a haul road and dump trucks in the distance",
 'heavy-machinery': "a heavy equipment yard with excavators and wheel loaders parked on packed earth",
 'assembly-line': "an automotive assembly line hall with robot arms, conveyors and car bodies in white",
 'demolition': "a building demolition site with broken concrete walls, exposed rebar, rubble heaps and an excavator with a breaker",
 'logistics': "a warehouse loading dock with pallet racking, stacked pallets and a parked truck at the bay",
 'woodworking': "a sawmill yard with stacked timber, a log saw and sawdust on the floor",
 'aviation': "an airport apron with a parked airliner, a baggage tug and ground support equipment",
 'railway': "a railway track maintenance site with rails, sleepers, ballast and overhead catenary masts",
 'mechanical': "a mechanical engineering workshop with lathes, milling machines and tool cabinets",
 'power-tool': "a metal fabrication workshop with steel workbenches, vices, grinders and cut steel bars",
 'forestry': "a forest logging site with felled timber stacked on a track between tall conifers",
 'welding': "a steel fabrication welding bay with welding benches, steel plate, clamps and a gantry",
 'electrical': "an electrical substation with transformers, switchgear, insulators and steel pylons",
 'cryogenic': "an industrial gas plant with vacuum-insulated cryogenic storage tanks, frosted pipework and valves",
}
env = dict(os.environ, DRAWTHINGS_MODELS_DIR=os.path.expanduser('~/Flowtronix/models/draw-things'))
out_dir = os.path.join(DRESS, 'backdrops'); os.makedirs(out_dir, exist_ok=True); raw_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'work', 'backdrops'); os.makedirs(raw_dir, exist_ok=True)
W, H = os.environ.get('BD_W', '1536'), os.environ.get('BD_H', '896')   # 864 is not a multiple of 64: generate 1536x896, centre-crop to 16:9 1536x864
kits = [k['id'] for k in json.load(open(os.path.join(ROOT, 'data', 'kits.json')))]
for kid in (sys.argv[1:] or kits):
    dst = os.path.join(out_dir, kid + '.jpg')
    if os.path.exists(dst): continue
    prompt = f"{SITE[kid][0].upper() + SITE[kid][1:]}. An industrial working site at {kid.replace('-', ' ')} work, empty, nobody present. {SUFFIX}"
    raw = os.path.join(raw_dir, kid + '.png')
    cmd = ['draw-things-cli', 'generate', '--offline', '--model', 'flux_2_klein_9b_q8p.ckpt', '--prompt', prompt, '--width', W, '--height', H, '--seed', SEED, '--disable-preview', '--output', raw]
    t = time.time(); r = subprocess.run(cmd, env=env, capture_output=True, text=True); dt = round(time.time() - t)
    open(os.path.join(raw_dir, 'backdrops.log'), 'a').write(json.dumps(dict(kit=kid, wall_s=dt, rc=r.returncode, w=W, h=H, prompt=prompt)) + '\n')
    if not os.path.exists(raw): print(kid, 'FAILED', r.stderr[-300:], flush=True); continue
    im = Image.open(raw).convert('RGB')
    if im.width * 9 != im.height * 16:
        h = round(im.width * 9 / 16); y0 = (im.height - h) // 2; im = im.crop((0, y0, im.width, y0 + h))
    if os.environ.get('BD_UP', '0') == '1' and im.width < 2048: im = im.resize((2048, 1152), Image.LANCZOS)
    im.save(dst, quality=88); print(kid, im.size, dt, 's', flush=True)
