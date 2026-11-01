"""Remove the white studio background from AVES product shots.
Flood-fills near-white from the image border so white product parts (white helmets) survive,
then feathers the alpha inside the filled region by distance from pure white. Output: RGBA PNG, trimmed, padded."""
import sys,os,numpy as np
from PIL import Image, ImageFilter
from collections import deque
src,dst=sys.argv[1],sys.argv[2]
os.makedirs(dst,exist_ok=True)
def process(path,out):
    im=Image.open(path).convert('RGB')
    a=np.asarray(im).astype(np.int16)
    h,w,_=a.shape
    mn=a.min(axis=2)                       # darkest channel
    near=mn>=232                            # near-white candidate
    # flood fill from border over near-white pixels
    mask=np.zeros((h,w),bool)
    q=deque()
    for x in range(w):
        for y in (0,h-1):
            if near[y,x] and not mask[y,x]: mask[y,x]=True; q.append((y,x))
    for y in range(h):
        for x in (0,w-1):
            if near[y,x] and not mask[y,x]: mask[y,x]=True; q.append((y,x))
    while q:
        y,x=q.popleft()
        for ny,nx in ((y-1,x),(y+1,x),(y,x-1),(y,x+1)):
            if 0<=ny<h and 0<=nx<w and near[ny,nx] and not mask[ny,nx]:
                mask[ny,nx]=True; q.append((ny,nx))
    # enclosed holes: connected near-white regions NOT touching the border whose pixels are almost all pure white
    # (a harness interior is flat 255; a white helmet is shaded, so it stays)
    from scipy import ndimage
    inner=near&~mask
    lab,n=ndimage.label(inner)
    if n:
        sizes=ndimage.sum(np.ones_like(mn),lab,range(1,n+1))
        pure=ndimage.sum((mn>=250),lab,range(1,n+1))
        for i,(sz,pu) in enumerate(zip(sizes,pure),1):
            if sz>=150 and pu/sz>0.92: mask[lab==i]=True
    # alpha: inside background region 0; near the boundary feather by whiteness
    alpha=np.full((h,w),255,np.uint8)
    alpha[mask]=0
    # soften: dilate mask edge by 1px and blend using whiteness
    bg=Image.fromarray((mask*255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3))
    edge=(np.asarray(bg)>0)&(~mask)
    white=np.clip((mn-200)/55.0,0,1)        # 0 at <=200, 1 at 255
    alpha[edge]=(255*(1-white[edge]*0.85)).astype(np.uint8)
    rgba=np.dstack([a.astype(np.uint8),alpha])
    out_im=Image.fromarray(rgba,'RGBA')
    bbox=Image.fromarray(alpha).point(lambda v:255 if v>8 else 0).getbbox()
    if bbox: out_im=out_im.crop(bbox)
    out_im.save(out,optimize=True)
    return mask.mean()
import glob
files=sorted(glob.glob(os.path.join(src,'*')))
for f in files:
    name=os.path.splitext(os.path.basename(f))[0]+'.png'
    try:
        cov=process(f,os.path.join(dst,name))
        if cov<0.2: print('LOW-BG',name,round(cov,2))
    except Exception as e: print('ERR',name,e)
print('done',len(files))
