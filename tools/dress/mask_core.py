"""Mask machinery copied from spikes/dress-v0.2/run.py (align, automask with colour rules) so the pipeline does not depend on the spike folder."""
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi
def fpath(name): raise RuntimeError('exclude frames not supported in pipeline')
def navy(a):  # coverall mask
    r,g,b=[a[...,i].astype(int) for i in range(3)]; return (b>r+18)&(b>g+8)&(b<150)
def align(gen,can,clip,log):
    """estimate scale+offset (about image centre) of gen->canvas on grayscale, excluding the item region; returns aligned gen"""
    W,H=can.size; f=4
    g=np.asarray(gen.convert('L').resize((W//f,H//f),Image.BILINEAR),float); c=np.asarray(can.convert('L').resize((W//f,H//f),Image.BILINEAR),float)
    w=np.ones_like(c)
    for (x0,y0,x1,y1) in clip: w[y0//f:y1//f,x0//f:x1//f]=0
    w=ndi.binary_erosion(w>0,iterations=2).astype(float)
    cy,cx=c.shape[0]/2,c.shape[1]/2
    def warp(g,s,tx,ty):  # output(y,x)=g(input at (y-cy-ty)/s+cy)
        M=np.array([[1/s,0],[0,1/s]]); off=np.array([cy,cx])-M@np.array([cy+ty,cx+tx]); return ndi.affine_transform(g,M,offset=off,order=1,mode='nearest')
    def cost(p): return (np.abs(warp(g,*p)-c)*w).sum()/w.sum()
    p=[1.0,0.0,0.0]; best=cost(p); st=[0.02,4.0,4.0]
    for it in range(40):
        imp=False
        for i in range(3):
            for d in (-1,1):
                q=list(p); q[i]+=d*st[i]; cq=cost(q)
                if cq<best-1e-6: p,best,imp=q,cq,True
        if not imp:
            st=[x/2 for x in st]
            if st[0]<0.0006: break
    s,tx,ty=p[0],p[1]*f,p[2]*f
    log.update(scale=round(s,4),dx=round(tx,1),dy=round(ty,1),cost0=round(cost([1,0,0]),2),cost1=round(best,2))
    if abs(s-1)<0.002 and abs(tx)<1 and abs(ty)<1: return gen
    # full-res warp (about centre, matching low-res convention)
    a=np.asarray(gen.convert('RGB'),float); out=np.empty_like(a); ccy,ccx=H/2,W/2
    M=np.array([[1/s,0],[0,1/s]]); off=np.array([ccy,ccx])-M@np.array([ccy+ty,ccx+tx])
    for ch in range(3): out[...,ch]=ndi.affine_transform(a[...,ch],M,offset=off,order=1,mode='nearest')
    return Image.fromarray(out.clip(0,255).astype(np.uint8))

def vestlike(a):
    r,g,b=[a[...,i].astype(int) for i in range(3)]; mx=a.max(-1).astype(int); mn=a.min(-1).astype(int)
    yellow=(r>150)&(g>170)&(g>=r-6)&(b<120)
    silver=((mx-mn)<30)&(mx>140)&(mx<235)
    dark=mx<60
    return yellow,silver,dark
def automask(gen,can,clip,thr,feather=10,excl=(),colormask=None):
    a=np.asarray(gen.filter(ImageFilter.GaussianBlur(1.5)).convert('RGB'),int); b=np.asarray(can.filter(ImageFilter.GaussianBlur(1.5)).convert('RGB'),int)
    d=np.abs(a-b).max(-1)>thr
    cm=np.zeros(d.shape,bool)
    for (x0,y0,x1,y1) in clip: cm[y0:y1,x0:x1]=True
    d&=cm
    if colormask=='vest':   # keep only vest-coloured changed pixels (yellow, silver tape, black piping next to yellow); not bare arms / tee / trousers
        ga=np.asarray(gen.convert('RGB')); y,sv,dk=vestlike(ga)
        near=ndi.binary_dilation(y,iterations=7)
        k=y|(sv&near)|(dk&ndi.binary_dilation(y,iterations=4))
        d=ndi.binary_fill_holes(ndi.binary_closing(k&ndi.binary_dilation(d,iterations=3),iterations=16))&cm
    if colormask=='glove':   # black/grey rubber + orange cuff only; navy sleeves/trousers the model re-rendered stay from the running frame
        ga=np.asarray(gen.convert('RGB')).astype(int); r,g,b=ga[...,0],ga[...,1],ga[...,2]
        k=((ga.max(-1)<135)&((b-r)<14))|((r>170)&(g>70)&(g<170)&(b<90))|((ga.min(-1)>200)&(ga.max(-1)-ga.min(-1)<40)&ndi.binary_dilation(ga.max(-1)<135,iterations=10))
        k&=cm; k=ndi.binary_opening(k,iterations=2); lab,n=ndi.label(k)
        keep=np.zeros_like(k)
        for rx in clip:
            sub=np.zeros_like(k); sub[rx[1]:rx[3],rx[0]:rx[2]]=True; l2=lab*sub
            ids=[i for i in np.unique(l2) if i>0]
            if ids: sz=[(l2==i).sum() for i in ids]; keep|=(lab==ids[int(np.argmax(sz))])
        d=ndi.binary_fill_holes(ndi.binary_closing(keep,iterations=10))&cm
        d=ndi.binary_erosion(d,iterations=2); feather=6
    if colormask=='dark':   # glossy black object over a coverall that the model re-rendered: keep only near-black pixels in the clip, solid
        ga=np.asarray(gen.convert('RGB')); k=(ga.max(-1)<75)&((ga[...,2].astype(int)-ga[...,0])<9)&d   # near-black AND changed vs the canvas (harness straps already in the canvas stay as they were)
        k=ndi.binary_opening(k,iterations=2)&cm; lab,n=ndi.label(k)
        if n: sz=ndi.sum(k,lab,range(1,n+1)); k=lab==(1+int(np.argmax(sz)))
        d=ndi.binary_fill_holes(ndi.binary_closing(k,iterations=10))&cm
    d=ndi.binary_opening(d,iterations=1)
    lab,n=ndi.label(ndi.binary_dilation(d,iterations=6))   # keep components with real area
    if n:
        sizes=ndi.sum(d,lab,range(1,n+1)); keep=np.isin(lab,[i+1 for i,sz in enumerate(sizes) if sz>=150]); d&=keep
    d=ndi.binary_closing(d,iterations=12); d=ndi.binary_fill_holes(d); d=ndi.binary_dilation(d,iterations=8)&cm
    for e in excl:  # keep what is already white hard-hat in that frame (brim stays in front of the item)
        f=np.asarray(Image.open(fpath(e)).convert('RGB'),int); white=(f.min(-1)>165)&((f.max(-1)-f.min(-1))<28)
        white=ndi.binary_dilation(ndi.binary_opening(white,iterations=2),iterations=2); d&=~white
    if colormask=='dark': d=ndi.binary_erosion(d,iterations=3); feather=4
    if colormask=='vest':
        lo={};hi={}
        for y in range(480,d.shape[0]):
            xs=np.where(d[y])[0]
            if len(xs)>40: lo[y]=xs.min(); hi[y]=xs.max()
        for y in lo:   # solid between the vest's outer edges, taking the widest edge within +-40 rows (tape ends leave notches otherwise)
            ys=[k for k in range(y-40,y+41) if k in lo]; d[y,min(lo[k] for k in ys):max(hi[k] for k in ys)+1]=True
        d=ndi.binary_erosion(d,iterations=5); feather=4
    m=Image.fromarray((d*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(feather/2))
    return m,d

