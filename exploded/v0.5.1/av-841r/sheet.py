"""Tiles captures into a contact sheet at half size (phone captures are 2x). usage: python sheet.py out.png a.png b.png ..."""
import sys
from PIL import Image
out, files = sys.argv[1], sys.argv[2:]
ims = [Image.open(f) for f in files]
ims = [i.resize((i.width // 2, i.height // 2), Image.LANCZOS) if i.width <= 800 else i for i in ims]
if ims[0].width > 800:
    sheet = Image.new('RGB', (ims[0].width, sum(i.height + 8 for i in ims)), (255, 0, 255)); y = 0
    for i in ims: sheet.paste(i, (0, y)); y += i.height + 8
else:
    sheet = Image.new('RGB', (sum(i.width + 8 for i in ims), max(i.height for i in ims)), (255, 0, 255)); x = 0
    for i in ims: sheet.paste(i, (x, 0)); x += i.width + 8
sheet.save(out)
