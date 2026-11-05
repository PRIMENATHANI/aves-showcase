import os,re
from PIL import Image,ImageDraw,ImageFont
os.chdir(os.path.dirname(os.path.abspath(__file__)))
log=open('bench.log').read()
def secs(n):
    m=re.search(r'\['+re.escape(n)+r'\] rc=\d+ wall=(\d+)s',log); return m.group(1) if m else '?'
def flog(n):
    p='flux2dev/bench.log'
    if not os.path.exists(p): return '?'
    m=re.search(r'\['+re.escape(n)+r'\] rc=\d+ wall=(\d+)s',open(p).read()); return m.group(1) if m else '?'
R='refs/'
cols=[('helmet','refs/aves-titan-av-841r-nv-white.png','01-helmet.png'),('glasses','refs/av-sg30-white.png','02-glasses.png'),('earmuffs','refs/av-hm3093-cap-earmuffs-white.png','03-earmuffs.png'),('gloves','refs/hg-2230-rubber-neoprene-gloves-white.png','04-gloves.png'),('glasses seed 23','refs/av-sg30-white.png','05-glasses-seed23.png'),('glasses Qwen','refs/av-sg30-white.png','06-glasses-qwen.png')]
W,H=360,616;L=34
rows=[('klein 9B',lambda n:secs(n),'')]
if os.path.exists('flux2dev/04-gloves.png'): rows.append(('FLUX.2 dev q6p',lambda n:flog(n),'flux2dev/'))
f=ImageFont.load_default(size=15)
S=Image.new('RGB',(W*len(cols),(H+L)*(1+len(rows))+L),'white');d=ImageDraw.Draw(S)
for i,(it,ref,out) in enumerate(cols):
    d.text((i*W+8,8),'reference: '+it,fill='black',font=f)
    r=Image.open(ref).convert('RGB');r.thumbnail((W-16,H));S.paste(r,(i*W+8,L+(H-r.height)//2))
y=H+L
for name,sec,pre in rows:
    for i,(it,ref,out) in enumerate(cols):
        fn=pre+out
        mdl=name
        if 'Qwen' in it:
            if pre: continue
            mdl='Qwen Edit 2511 q6p'
        elif pre and 'seed 23' in it: continue
        if not os.path.exists(fn): continue
        d.text((i*W+8,y+8),f'{out[:2]} {it} | {mdl} | {sec(out)} s',fill='black',font=f)
        im=Image.open(fn).convert('RGB');im.thumbnail((W-16,H));S.paste(im,(i*W+8,y+L))
    y+=H+L
S.save('contact-sheet.png');print(S.size)
