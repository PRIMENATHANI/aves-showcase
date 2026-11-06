"""Removal-style part isolation with Qwen Image Edit 2511 + Lightning: edit the real photo, delete everything except one part."""
import os, sys, subprocess, time, json; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); import run, run3
HERE = os.path.dirname(os.path.abspath(__file__)); P = os.path.join(HERE, 'parts')
KEEP = "Keep the viewing angle, scale, position, lighting and the plain white background exactly as in the image. Photorealistic product photo, nothing else added, no text."
EDITS = {
 'q-frame':  "Edit this photo of AVES safety glasses: remove the clear lens, remove both temple arms and remove the black foam gasket behind the frame, so only the empty matt black plastic frame remains, with its brow bar, nose section and the two hinge lugs. You can see straight through the open lens aperture. " + KEEP,
 'q-gasket': "Edit this photo of AVES safety glasses: remove the frame, the clear lens and both temple arms, so only the removable black soft foam face-seal gasket remains, a thick one-piece foam ring in the outline of the frame with the nose cut-out and small vent slots, seen at the same angle. " + KEEP,
 'q-lens':   "Edit this photo of AVES safety glasses: remove the black frame, the foam gasket and both temple arms, so only the single clear wraparound polycarbonate lens remains, one thin piece of clear curved plastic with the nose notch, edges visible against the white. " + KEEP,
 'q-temple': "Edit this photo of AVES safety glasses: remove the frame, lens and foam gasket and the left temple, so only the right temple arm remains in place: a slim black arm with the hinge at its front end, bright green rubber panel near the hinge, green rubber ear tip and the white AVES logo. " + KEEP,
}
def gen(name, seed):
    out = os.path.join(P, f'{name}-s{seed}.png')
    if os.path.exists(out): return out
    cmd = ['draw-things-cli', 'generate', '--offline', *run.QWEN, '--prompt', EDITS[name], '--image', run3.REF1, '--width', '1024', '--height', '1024', '--seed', str(seed), '--disable-preview', '--output', out]
    t = time.time(); r = subprocess.run(cmd, env=run.ENV, capture_output=True, text=True); dt = round(time.time()-t)
    open(os.path.join(HERE, 'gen.log'), 'a').write(json.dumps(dict(out=os.path.relpath(out, run.ROOT), seed=seed, part=name, wall_s=dt, rc=r.returncode, prompt=EDITS[name]))+'\n')
    run.log(name, seed, f'{dt}s rc={r.returncode}', '' if os.path.exists(out) else 'FAILED '+r.stderr[-300:]); return out if os.path.exists(out) else None
if __name__ == '__main__':
    paths = [gen(n, s) for n in EDITS for s in (3, 8)]
    run.sheet(paths[:6], 'parts-sheet-q1.png'); run.sheet(paths[6:], 'parts-sheet-q2.png'); run.log('DONE4')
