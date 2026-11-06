import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); import run
run.PROMPT = ("Exploded-view product render of the AVES safety glasses shown in the image, photorealistic, high resolution. The glasses are disassembled into exactly six separate parts, "
  "laid out in one straight horizontal row from left to right in assembly order, each part floating with a clear gap to the next and all facing the same three-quarter direction: "
  "1 the single clear wraparound polycarbonate lens on its own, with nothing attached; 2 the black frame on its own, empty, with no lens in it and no temples on it; "
  "3 the removable black foam gasket, a thin one-piece ring the same outline as the frame; 4 the small black contoured nose bridge; 5 the left temple; 6 the right temple; "
  "both temples black near the hinge with a bright green rubber tip and the white AVES logo. Only these six parts, nothing duplicated, no screws, no extra pieces. "
  "Neutral light grey studio background, soft shadows, even lighting, sharp focus, no text, no labels, no lines. Every part keeps the exact colours, shape and markings of the reference.")
seeds = [3, 5, 8, 13]
paths = [run.gen('r2-klein9b', run.KLEIN, s, 1536, 768) for s in seeds] + [run.gen('r2-qwen2511', run.QWEN, s, 1536, 768) for s in seeds]
run.sheet(paths[:6], 'sheet-v2a.png'); run.sheet(paths[6:], 'sheet-v2b.png'); run.log('DONE2')
