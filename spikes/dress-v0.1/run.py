import subprocess, sys, os
from PIL import Image, ImageOps
S=os.path.dirname(os.path.abspath(__file__)); R=os.path.join(S,'..','..','assets','cut')  # real AVES cutouts
OUT=os.path.join(S,'work'); os.makedirs(OUT,exist_ok=True)
env=dict(os.environ, DRAWTHINGS_MODELS_DIR=os.path.expanduser('~/Flowtronix/models/draw-things'))
KEEP=" Keep everything already on him exactly as it is. Keep his face, pose, hands position, clothes, lighting, grey background and camera framing exactly the same. Photorealistic."
def paste(im, ref, w, cx, top, flip=False, mirror=False):
    r=Image.open(os.path.join(R,ref)).convert('RGBA')
    if flip: r=ImageOps.flip(r)
    if mirror: r=ImageOps.mirror(r)
    r=r.resize((w,int(r.height*w/r.width)),Image.LANCZOS); im.alpha_composite(r,(int(cx-w/2),int(top))); return im
STEPS=[
 ('f02-glasses', [('av-sg30.png',150,448,182)], "The man is wearing these dark grey-lens wraparound safety glasses with thin black and green frame arms, sitting properly on his nose over his eyes under the hard hat brim."),
 ('f03-earmuffs', [('av-hm3093-cap-earmuffs.png',196,448,168)], "Exactly one pair of black and green earmuff cups, one cup on each side, mounted on the sides of his white hard hat and pressed over both his ears, his safety glasses staying on, attached to the helmet's side slots by short black arms going up into the slots. No microphone, no boom, nothing below the cups or near his mouth."),
 ('f04-vest', [], "The man now wears a fluorescent hi-vis yellow safety vest with two horizontal silver retroreflective stripes around the torso, over his navy coverall, open at the collar."),
 ('f05-harness', [('full-body-harness.png',300,448,300)], "The man is wearing this yellow and black full-body fall-arrest harness over his hi-vis vest: shoulder straps, chest strap with buckle, waist belt with side D-rings, and leg loops around both thighs, strapped snugly."),
 ('f06-tether', [('av-101373.png',70,600,700)], "A yellow and black coiled tool tether lanyard with a silver carabiner hangs from his harness waist belt on his left hip."),
 ('f07-escape', [], "A compact hi-vis yellow escape hood pouch is clipped to the front right of his harness waist belt."),
 ('f08-gloves', [('hg-2230-rubber-neoprene-gloves.png',95,270,790,True,False),('hg-2230-rubber-neoprene-gloves.png',95,626,790,True,False)], "The man is wearing long black rubber gauntlet gloves with orange cuff rims on both hands, cuffs reaching up his forearms, hands relaxed at his sides. Plain gloves with no printed text or logos."),
]
BOX={'f02-glasses':(360,150,540,240),'f03-earmuffs':[(318,140,418,286),(478,140,578,286)],'f04-vest':(200,270,700,800),'f05-harness':(200,270,700,980),'f06-tether':(540,660,700,1060),'f07-escape':(380,620,640,900),'f08-gloves':(170,740,730,1140)}
from PIL import ImageFilter
def merge(prev,edit,box,feather=18):
    m=Image.new('L',prev.size,0)
    from PIL import ImageDraw
    for (x0,y0,x1,y1) in (box if isinstance(box,list) else [box]): ImageDraw.Draw(m).rectangle((x0+feather,y0+feather,x1-feather,y1-feather),fill=255)
    m=m.filter(ImageFilter.GaussianBlur(feather/2)); return Image.composite(edit,prev,m)
only=sys.argv[1:]
prev=os.path.join(S,'inputs','f01-helmet.png')
for name, pastes, prompt in STEPS:
    out=os.path.join(OUT,name+'.png')
    if (not only or name in only):
        im=Image.open(prev).convert('RGBA')
        for p in pastes: im=paste(im,*p)
        inp=os.path.join(OUT,name+'-in.png'); im.convert('RGB').save(inp)
        cmd=['draw-things-cli','generate','--offline','--model','flux_2_klein_9b_q8p.ckpt','--prompt',prompt+KEEP,'--image',inp,'--width','896','--height','1536','--seed',os.environ.get('SEED','4242'),'--disable-preview','--output',out]
        raw=out.replace('.png','-raw.png'); cmd[cmd.index(out)]=raw
        r=subprocess.run(cmd,env=env,capture_output=True,text=True)
        if not os.path.exists(raw): print(name,r.stderr[-400:]); sys.exit(1)
        merge(Image.open(prev).convert('RGB'),Image.open(raw).convert('RGB'),BOX[name],6 if name=='f03-earmuffs' else 18).save(out); print(name,'ok',flush=True)
    prev=out
