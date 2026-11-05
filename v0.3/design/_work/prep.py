import json,os
from PIL import Image, ImageEnhance, ImageDraw
import numpy as np
R='/Users/macintosh/Documents/Claude/Sloane/aves-showcase/'; O=R+'v0.3/design/_work/img/'
k=json.load(open(R+'data/kits.json'))
BD={n:Image.open(R+f'assets/dress/backdrops/{n}.jpg').convert('RGB') for n in ['oil-gas','rig-drilling','construction','manufacturing']}
# kit -> (backdrop, centre x fraction, centre y fraction)
M={'oil-gas':('oil-gas',.66,.5),'rig-drilling':('rig-drilling',.52,.5),'electrical':('oil-gas',.30,.45),
'construction':('construction',.40,.5),'heavy-machinery':('construction',.88,.5),'demolition':('construction',.12,.5),
'manufacturing':('manufacturing',.50,.5),'assembly-line':('manufacturing',.20,.5),'woodworking':('manufacturing',.80,.5),
'mechanical':('manufacturing',.66,.5),'power-tool':('manufacturing',.36,.5),'welding':('manufacturing',.93,.5),
'logistics':('manufacturing',.07,.5),'aviation':('rig-drilling',.12,.5),'railway':('oil-gas',.10,.5),
'mining':('rig-drilling',.86,.5),'forestry':('oil-gas',.92,.5),'cryogenic':('rig-drilling',.30,.5)}
H=612
def tone(im,sat,br):
    im=ImageEnhance.Color(im).enhance(sat); return ImageEnhance.Brightness(im).enhance(br)
def grad_bottom(im,strength=.88,start=.38):
    a=np.asarray(im).astype(float); h=a.shape[0]
    t=np.clip((np.arange(h)/h-start)/(1-start),0,1)**1.4*strength
    a=a*(1-t)[:,None,None]+np.array([7,9,12])*t[:,None,None]
    return Image.fromarray(a.astype('uint8'))
def strip(kit,w,sat,br,s=2,strong=False):
    n,cx,cy=M[kit]; im=BD[n]; sc=H*s/im.height
    big=im.resize((round(im.width*sc),H*s),Image.LANCZOS); W=w*s
    x0=int(min(max(cx*big.width-W/2,0),big.width-W))
    c=big.crop((x0,0,x0+W,H*s)); return grad_bottom(tone(c,sat,br),.95 if strong else .88,.30 if strong else .38)
for x in k:
    for w,sat,br,tag in [(74,.55,.62,'r'),(65,.55,.62,'c'),(221,.95,.9,'h')]:
        if tag=='h' and x['id']!='construction': continue
        strip(x['id'],w,sat,br,2,tag=='h').save(O+f"{x['id']}_{tag}.jpg",quality=92)
# stage backdrop 1440x900 @2x
def stage(name,W,Hh,cx,s=2):
    im=BD[name]; sc=max(W*s/im.width,Hh*s/im.height); big=im.resize((round(im.width*sc),round(im.height*sc)),Image.LANCZOS)
    x0=int(min(max(cx*big.width-W*s/2,0),big.width-W*s)); y0=0
    c=big.crop((x0,y0,x0+W*s,y0+Hh*s)); c=tone(c,.6,.5)
    a=np.asarray(c).astype(float); h,w=a.shape[:2]
    yy,xx=np.mgrid[0:h,0:w]
    bg=np.array([7,9,12.])
    t=np.clip((yy/h-.45)/.55,0,1)**1.3*.9           # bottom fade
    u=np.clip((xx/w-.42)/.28,0,1); t=np.maximum(t,(u*u*(3-2*u))*.93)  # right fade (shelf side)
    t=np.maximum(t,np.clip((.18-yy/h)/.18,0,1)*.5)   # top fade
    a=a*(1-t)[...,None]+bg*t[...,None]
    return Image.fromarray(a.astype('uint8'))
stage('oil-gas',1440,900,.5).save(O+'stage_desktop.jpg',quality=92)
def phone(name,W,Hh,cx,s=2):
    im=BD[name]; sc=Hh*s/im.height; big=im.resize((round(im.width*sc),Hh*s),Image.LANCZOS)
    x0=int(min(max(cx*big.width-W*s/2,0),big.width-W*s)); c=tone(big.crop((x0,0,x0+W*s,Hh*s)),.6,.5)
    a=np.asarray(c).astype(float); h=a.shape[0]; bg=np.array([7,9,12.])
    t=np.clip((np.arange(h)/h-.5)/.5,0,1)**1.2; t=np.maximum(t,np.clip((.15-np.arange(h)/h)/.15,0,1)*.5)
    a=a*(1-t)[:,None,None]+bg*t[:,None,None]
    return Image.fromarray(a.astype('uint8'))
phone('oil-gas',390,560,.6).save(O+'stage_phone.jpg',quality=92)
# man composite step 3 (head, eye, hearing)
base=Image.open(R+'assets/dress/base.png').convert('RGBA')
for lid in ['av-sg30','aves-titan-av-841r-nv','av-hm3093-cap-earmuffs__on-aves-titan-av-841r-nv']:
    base=Image.alpha_composite(base,Image.open(R+f'assets/dress/layers/{lid}.png').convert('RGBA'))
import numpy as _n
from PIL import ImageFilter as _F
_a=_n.asarray(base).astype(float); _m=(_a[...,3]>235).astype(float)[...,None]
_rgb=Image.fromarray((_a[...,:3]*_m).astype('uint8')); _mm=Image.fromarray((_m[...,0]*255).astype('uint8'))
_b1=_n.asarray(_rgb.filter(_F.GaussianBlur(7))).astype(float); _b2=_n.asarray(_mm.filter(_F.GaussianBlur(7))).astype(float)[...,None]/255
_fill=_b1/_n.maximum(_b2,1e-3); _edge=(_a[...,3]<=235)[...,None]
_a[...,:3]=_n.where(_edge,_n.clip(_fill,0,255),_a[...,:3]); base=Image.fromarray(_a.astype('uint8'))
_al=base.getchannel('A').filter(_F.MinFilter(3)).filter(_F.GaussianBlur(.8)); base.putalpha(_al)
bb=base.getbbox(); base=base.crop((bb[0]-20,bb[1]-20,bb[2]+20,bb[3]+20)); base.save(O+'man_step3.png'); print('man',base.size,bb)
# logo white
lg=Image.open(R+'assets/aves-logo.png').convert('RGBA'); a=lg.split()[3]; w=Image.new('RGBA',lg.size,(243,245,248,255)); w.putalpha(a); w.save(O+'logo_white.png'); print('logo',lg.size)
# cutouts
ids={'head':'aves-titan-av-841r-nv','eye':'av-sg30','hearing':'av-hm3093-cap-earmuffs','respiratory':'aves-escape-hood-bag','fall':'full-body-harness','dropped':'av-101373','hand':'hg-2230-rubber-neoprene-gloves'}
for s,i in ids.items():
    im=Image.open(R+f'assets/cut/{i}.png').convert('RGBA'); bb=im.getchannel('A').point(lambda v:255 if v>24 else 0).getbbox(); im=im.crop(bb); print(s,im.size)
    im.thumbnail((400,400),Image.LANCZOS); im.save(O+f'cut_{s}.png')
v=Image.open(R+'assets/dress/layers/scuta-vest.png').convert('RGBA'); bx=[272,301,612,859]; v=v.crop(bx); v=v.crop(v.getchannel('A').point(lambda x:255 if x>24 else 0).getbbox()); print('vest',v.size); v.save(O+'cut_vest.png')
