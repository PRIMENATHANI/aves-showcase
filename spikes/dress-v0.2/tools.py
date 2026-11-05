import os, shutil
from PIL import Image, ImageDraw, ImageFont
S=os.path.dirname(os.path.abspath(__file__)); FR=os.path.join(S,'frames')
L=['00 base','01 helmet (klein)','02 glasses (klein)','03 earmuffs (klein)','04 vest (Qwen)','05 harness (Qwen)','06 tether (Qwen)','07 pouch (Qwen)','08 gloves (Qwen)']
def font(n):
    for p in ('/System/Library/Fonts/Helvetica.ttc','/Library/Fonts/Arial.ttf'):
        if os.path.exists(p): return ImageFont.truetype(p,n)
    return ImageFont.load_default()
def sheet():
    F=[Image.open(os.path.join(FR,f'{i:02d}.jpg')) for i in range(9)]
    w,h=260,446; pad=8; head=26
    crops=[(1,(240,60,660,330),'01 head'),(2,(240,60,660,330),'02 head'),(3,(240,60,660,330),'03 head'),
           (4,(180,250,720,920),'04 vest'),(5,(180,250,720,1050),'05 harness'),(6,(180,640,720,1300),'06 tether'),(7,(180,640,720,1300),'07 pouch'),(8,(150,600,750,1160),'08 hands')]
    cw=int((9*w+8*pad)/4)-pad  # 4 crops per row
    ch=300
    W=9*w+10*pad; H=pad+head+h+pad+2*(head+ch+pad)+pad
    im=Image.new('RGB',(W,H),(14,16,20)); d=ImageDraw.Draw(im); f=font(16)
    for i,fr in enumerate(F):
        x=pad+i*(w+pad); d.text((x,pad+4),L[i],fill=(230,233,238),font=f); im.paste(fr.resize((w,h),Image.LANCZOS),(x,pad+head))
    y0=pad+head+h+pad
    for k,(i,box,lab) in enumerate(crops):
        r,c=divmod(k,4); x=pad+c*(cw+pad); y=y0+r*(head+ch+pad)
        d.text((x,y+4),lab,fill=(230,233,238),font=f)
        cr=Image.open(os.path.join(FR,f'{i:02d}.jpg')).crop(box); s=min(cw/cr.width,ch/cr.height); cr=cr.resize((int(cr.width*s),int(cr.height*s)),Image.LANCZOS)
        im.paste(cr,(x,y+head))
    im.save(os.path.join(S,'contact-sheet.png')); print('sheet',im.size)
def preview():
    t=open(os.path.join(S,'..','dress-v0.1','preview.html')).read()
    L2=["Base: coverall and boots","Head: AVES Titan AV-841R","Eye: AV-SG30","Hearing: AV-HM3093 cap earmuffs","Hi-vis vest (Scuta 3116RR71)","Fall: AV-831 full-body harness","Dropped objects: AV-101373 tether","Respiratory: escape hood pouch","Hand: HG-2230 rubber gloves"]
    import re,json
    t=re.sub(r"const L=\[.*?\];","const L="+json.dumps(L2)+";",t,count=1,flags=re.S)
    t=t.replace('AVES Dress Spike','AVES Dress Spike v0.2')
    t=re.sub(r"Throwaway spike:.*?Scuta\.","Throwaway spike v0.2: head items FLUX.2 klein 9B, body items Qwen Image Edit 2511 Lightning, Draw Things on the Studio; each item box-merged onto the running frame.",t,flags=re.S)
    open(os.path.join(S,'preview.html'),'w').write(t); print('preview')
def desktop():
    D=os.path.expanduser('~/Desktop/Sloane Previews/aves-dress-v0.2'); os.makedirs(D,exist_ok=True)
    shutil.copy(os.path.join(S,'preview.html'),D); shutil.copy(os.path.join(S,'contact-sheet.png'),D)
    shutil.copytree(FR,os.path.join(D,'frames'),dirs_exist_ok=True); print(D)
