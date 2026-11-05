"""AVES dressing chain v0.2. 9 frames, seed 4242, 896x1536.
Usage: /tmp/aves-venv/bin/python run.py [step ...]   (no args = all generation steps in order)
       steps: f01-helmet f02-glasses f03-earmuffs f04-vest f05-harness f06-tether f07-escape f08-gloves
       extra: remerge [step ...] (re-merge from saved raw/, no generation), sheet, preview
Later frames build on earlier ones: rerun a step => rerun the ones after it.
SEED=23 python run.py f02-glasses  -> another seed (raw saved as <step>-s23.png and used).
Per step: generate item against its canvas (base frame, or the running head/torso frame) -> raw/<step>.png
-> (Qwen only) align to canvas -> mask = pixels that changed vs the canvas, clipped to the item region,
filled, feathered -> composite over the running frame -> frames/NN.jpg (q90) + work/NN.png (lossless chain).
"""
import subprocess, sys, os, time, json
import numpy as np
from PIL import Image, ImageFilter, ImageDraw, ImageOps
from scipy import ndimage as ndi
S=os.path.dirname(os.path.abspath(__file__)); B=os.path.join(S,'..','dress-v0.2-bench'); REFS=os.path.join(B,'refs-v2')
RAW,FR,WK=[os.path.join(S,d) for d in ('raw','frames','work')]
for d in (RAW,FR,WK): os.makedirs(d,exist_ok=True)
BASE=os.path.join(S,'..','dress-v0.1','inputs','f00-base.png')
SEED=os.environ.get('SEED','4242')
env=dict(os.environ, DRAWTHINGS_MODELS_DIR=os.path.expanduser('~/Flowtronix/models/draw-things'))
KLEIN=['--model','flux_2_klein_9b_q8p.ckpt']
QWEN=['--model','qwen_image_edit_2511_q6p.ckpt','--config-json','{"loras":[{"file":"qwen_image_edit_2511_lightning_4_step_v1.0_lora_f16.ckpt","weight":1.0,"version":"qwen_image"}]}','--steps','4','--cfg','1.0']
K_TAIL="Same man, same face, same pose, same coverall, same background, same framing. The product looks exactly like the reference: same colours, shape and markings."
Q_TAIL="Full-length shot, the whole body from boots to above the head, exactly the same framing and camera distance as the first image. Same man, same face, same pose, same coverall with sleeves down to the wrists, same background."
def ordinal(n): return {1:'the second image',2:'the second and third images'}[n]
def kp(item,n,place,desc): return f"The man from the first image now wears the {item} shown in {ordinal(n)}, {place}. {K_TAIL} The {item} is: {desc}"
Q_TAIL_VEST="Full-length shot, the whole body from boots to above the head, exactly the same framing and camera distance as the first image. Same man, same face, same pose, same navy long-sleeved coverall with its collar, front zip and sleeves down to the wrists, worn under the vest, same background."
def qp(item,n,place,desc,extra='',vest=False): return f"The man from the first image now wears the {item} shown in {ordinal(n)}, {place}. The {item} is: {desc} {extra}{Q_TAIL_VEST if vest else Q_TAIL}"
def readdesc(folder):
    p=os.path.join(REFS,folder,'description.txt'); return open(p).read() if os.path.exists(p) else None
# descriptions trimmed to visible features (hand-trimmed from refs-v2/*/description.txt)
D=dict(
 helmet="a full-brim industrial hard hat with a one-piece glossy white shell, a tall rounded dome with a raised centre rib running front to back and recessed shoulders on each side, and a low, broad flat brim about 40 mm wide all the way round, slightly drooping at the edge with a thin rolled lip. Four small rectangular notches sit on the shell wall just above the brim. No front peak, no logo, no vents.",
 glasses="half-wrap sport glasses with a single continuous wrap-around grey lens, a dark smoked upper frame rail across the top of the lens as a brow guard, no lower frame, and a moulded black nose bridge. The two temples are black near the hinge and bright green further back with a lime-green stripe and a white AVES logo, and they run back over the ears, ending in an oval cut-out loop.",
 earmuffs="cap-mounted earmuffs with no headband. Two glossy black ear cups, each with a wide green band around the outside and a green AVES logo on the outer face. Each cup hangs from its own rigid black side arm that rises vertically from the cup and curves forward at the top, where it clips into the side slot of the hard hat. The arm carries the AVES wordmark vertically in cream. The cups sit over the ears, under the brim.",
 gloves="very long matt black rubber gauntlet gloves, seamless and one-piece, reaching to mid forearm, with heavy crinkled ridged texture over the fingers and hand, a smoother gauntlet, and a rolled cuff edge with an orange band. An AVES logo and marking block is printed along the gauntlet.",
)
R=lambda f,*n:[os.path.join(REFS,f,x+'.png') for x in n]
# name, idx, engine, canvas('base' or step name), refs, prompt, onto(step name or 'base'), clip rects, extra
ALL=[
 dict(name='f01-helmet',idx=1,eng=KLEIN,canvas='base',refs=R('aves-titan-av-841r-nv','three-quarter','front'),
      prompt=lambda: kp('white wide-brim hard hat',2,'on his head',"")+D['helmet'] if False else f"The man from the first image now wears the white wide-brim hard hat shown in the second and third images, on his head. {K_TAIL} The hard hat is: {D['helmet']}",
      onto='base',clip=[(250,0,650,330)],thr=24),
 dict(name='f02-glasses',idx=2,eng=KLEIN,canvas='base',refs=R('av-sg30','side-three-quarter'),
      prompt=lambda: f"The man from the first image now wears the safety glasses shown in the second image, on his face over his eyes with the arms open behind his ears. {K_TAIL} The safety glasses are: {D['glasses']}",
      onto='f01-helmet',clip=[(340,165,560,285)],thr=24,exclude=['f01-helmet']),
 dict(name='f03-earmuffs',idx=3,eng=KLEIN,canvas='f01-helmet',refs=R('av-hm3093-cap-earmuffs','front','side'),
      prompt=lambda: f"The man from the first image now wears the cap-mounted earmuffs shown in the second and third images, one cup over each ear, mounted to the hard hat. {K_TAIL} The earmuffs are: {D['earmuffs']}",
      onto='f02-glasses',clip=[(290,120,425,340),(471,120,606,340)],thr=24),
 dict(name='f04-vest',idx=4,eng=QWEN,canvas='base',folder='scuta-vest',refs=R('scuta-vest','front-three-quarter','front-flat'),place='over his navy coverall, closed at the front',colormask='vest',onto='f03-earmuffs',clip=[(150,250,750,920)],thr=28,item='hi-vis vest'),
 dict(name='f05-harness',idx=5,eng=QWEN,canvas='f04-vest',folder='full-body-harness',refs=R('full-body-harness','front','back'),place='over the hi-vis vest, strapped snugly on his body',
      onto='f04-vest',clip=[(150,250,750,1050)],thr=28,item='full-body fall-arrest harness'),
 dict(name='f06-tether',idx=6,eng=QWEN,canvas='f05-harness',folder='av-101373',refs=R('av-101373','lying-three-quarter','hanging-u'),place='clipped to the harness waist belt on his left hip, which is the right-hand side of the picture, away from the centre of the belt',
      onto='f05-harness',clip=[(200,740,700,1290)],thr=28,item='tool tether'),
 dict(name='f07-escape',idx=7,eng=QWEN,canvas='f06-tether',folder='escape-pouch',refs=R('escape-pouch','pouch-side-strap','pouch-label-face'),place='a compact pouch clipped to the front right of the harness waist belt',
      onto='f06-tether',colormask='dark',clip=[(320,745,585,870)],thr=28,item='escape pouch'),
 dict(name='f08-gloves',idx=8,eng=QWEN,canvas='base',refs=R('hg-2230-rubber-neoprene-gloves','back-upright','three-quarter'),
      prompt=lambda: qp('black rubber gauntlet gloves',2,'on both hands, fingers inside',D['gloves'],'The coverall sleeves stay down and the glove cuffs go over the sleeves. '),
      onto='f07-escape',colormask='glove',clip=[(190,630,360,1130),(540,630,710,1130)],thr=28),
]
STEP={s['name']:s for s in ALL}
def fpath(name): return BASE if name=='base' else os.path.join(WK,f"{STEP[name]['idx']:02d}.png")
def rawpath(s): return os.path.join(RAW,s['name']+('' if SEED=='4242' else '-s'+SEED)+'.png')

def prompt_for(s):
    if 'prompt' in s: return s['prompt']()
    txt=open(os.path.join(S,'descriptions',s['folder']+'.txt')).read().strip()  # hand-trimmed
    return qp(s['item'],len(s['refs']),s['place'],txt,s.get('extra',''))

def generate(s):
    pr=prompt_for(s); out=rawpath(s)
    canvas=fpath(s['canvas'])
    cmd=['draw-things-cli','generate','--offline',*s['eng'],'--prompt',pr,'--image',canvas,*sum([['--image',r] for r in s['refs']],[]),
         '--width','896','--height','1536','--seed',SEED,'--disable-preview','--output',out]
    t=time.time(); r=subprocess.run(cmd,env=env,capture_output=True,text=True); dt=time.time()-t
    log=dict(step=s['name'],seed=SEED,wall_s=round(dt),canvas=canvas,refs=[os.path.relpath(x,S) for x in s['refs']],prompt=pr,engine=('qwen-lightning' if s['eng'] is QWEN else 'klein-9b'),rc=r.returncode)
    open(os.path.join(S,'run.log'),'a').write(json.dumps(log)+'\n')
    if not os.path.exists(out): print(s['name'],'FAILED',r.stderr[-500:]); sys.exit(1)
    print(s['name'],'generated',round(dt),'s',flush=True)

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

def merge(s):
    log={}
    gen=Image.open(rawpath(s)).convert('RGB'); can=Image.open(fpath(s['canvas'])).convert('RGB')
    if gen.size!=can.size: gen=gen.resize(can.size,Image.LANCZOS)
    if s['eng'] is QWEN: gen=align(gen,can,s['clip'],log)
    gen.save(os.path.join(WK,f"{s['idx']:02d}-aligned.png"))
    m,d=automask(gen,can,s['clip'],s['thr'],excl=s.get('exclude',()),colormask=s.get('colormask'))
    ys,xs=np.where(d); log['mask_bbox']=[int(xs.min()),int(ys.min()),int(xs.max()),int(ys.max())] if len(xs) else None; log['mask_px']=int(d.sum())
    prev=Image.open(fpath(s['onto'])).convert('RGB'); out=Image.composite(gen,prev,m)
    out.save(fpath(s['name'])); out.save(os.path.join(FR,f"{s['idx']:02d}.jpg"),quality=90)
    m.save(os.path.join(WK,f"{s['idx']:02d}-mask.png"))
    print(s['name'],'merged',log,flush=True)
    open(os.path.join(S,'merge.log'),'a').write(json.dumps(dict(step=s['name'],**log))+'\n')

def init():
    b=Image.open(BASE).convert('RGB'); b.save(os.path.join(WK,'00.png')); b.save(os.path.join(FR,'00.jpg'),quality=90)
    b.save(os.path.join(RAW,'f00-base.png'))

if __name__=='__main__':
    args=sys.argv[1:]; re=False
    if args and args[0]=='remerge': re=True; args=args[1:]
    if args and args[0] in('sheet','preview','desktop'): import tools; getattr(tools,args[0])(); sys.exit()
    init()
    names=args or [s['name'] for s in ALL]
    for s in ALL:
        if s['name'] in names:
            if not re: generate(s)
            merge(s)
