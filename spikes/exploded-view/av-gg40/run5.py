"""Re-angle the Qwen empty frame to three-quarter with klein 9B: first image = empty frame (shape), second = product photo (angle)."""
import os, sys, subprocess, time, json; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); import run, run3
HERE = os.path.dirname(os.path.abspath(__file__)); P = os.path.join(HERE, 'parts')
PROMPT = ("The empty black safety-glasses frame from the first image, exactly the same frame, still completely empty with no lens, no foam and no temple arms, "
          "now photographed from the same three-quarter viewing angle and at the same scale as the complete glasses in the second image. The frame is a single matt black plastic full frame "
          "with its brow bar, moulded nose section and the hinge lugs at each end; you see straight through its open aperture. Plain pure white background, soft studio lighting, photorealistic, nothing else in the picture, no shadow, no text.")
def gen(src, seed):
    out = os.path.join(P, f'frame3q-{os.path.basename(src)[:-4]}-s{seed}.png')
    if os.path.exists(out): return out
    cmd = ['draw-things-cli', 'generate', '--offline', *run.KLEIN, '--prompt', PROMPT, '--image', src, '--image', run3.REF1, '--width', '1024', '--height', '1024', '--seed', str(seed), '--disable-preview', '--output', out]
    t = time.time(); r = subprocess.run(cmd, env=run.ENV, capture_output=True, text=True); dt = round(time.time()-t)
    open(os.path.join(HERE, 'gen.log'), 'a').write(json.dumps(dict(out=os.path.relpath(out, run.ROOT), seed=seed, part='frame3q', src=os.path.basename(src), wall_s=dt, rc=r.returncode, prompt=PROMPT))+'\n')
    run.log('frame3q', os.path.basename(src), seed, f'{dt}s rc={r.returncode}', '' if os.path.exists(out) else 'FAILED '+r.stderr[-300:]); return out if os.path.exists(out) else None
if __name__ == '__main__':
    paths = [gen(os.path.join(P, 'q-frame-s8.png'), s) for s in (3, 8, 21)] + [gen(os.path.join(P, 'q-frame-s3.png'), s) for s in (3, 8)]
    run.sheet(paths, 'parts-sheet-frame3q.png'); run.log('DONE5')
