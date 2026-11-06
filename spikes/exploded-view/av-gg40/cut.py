"""Cut each picked part out of its white render: rembg isnet + keep the largest connected component. cut.py <name>=<file> ..."""
import os, sys, numpy as np
from PIL import Image
from rembg import remove, new_session
from scipy import ndimage as ndi
sess = new_session('isnet-general-use'); HERE = os.path.dirname(os.path.abspath(__file__))
for arg in sys.argv[1:]:
    name, src = arg.split('='); im = Image.open(os.path.join(HERE, src)).convert('RGB')
    cut = remove(im, session=sess, alpha_matting=True, alpha_matting_foreground_threshold=240, alpha_matting_background_threshold=10, alpha_matting_erode_size=10).convert('RGBA')
    a = np.asarray(cut.getchannel('A')); lab, n = ndi.label(a > 40)
    if n > 1:
        sizes = ndi.sum(np.ones_like(a), lab, range(1, n + 1)); keep = lab == (1 + int(np.argmax(sizes)))
        keep = ndi.binary_dilation(keep, iterations=6); a = np.where(keep, a, 0).astype(np.uint8); cut.putalpha(Image.fromarray(a))
    bb = cut.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox(); cut = cut.crop(bb)
    cut.save(os.path.join(HERE, 'cut', name + '.png')); print(name, cut.size, 'components', n, 'opaque', int((np.asarray(cut.getchannel("A")) > 128).sum()))
