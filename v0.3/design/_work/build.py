import json,subprocess,os
from PIL import Image
D='/Users/macintosh/Documents/Claude/Sloane/aves-showcase/v0.3/design/'
IMG=D+'_work/img/'; FN=D+'_work/fonts/'
R='/Users/macintosh/Documents/Claude/Sloane'
K=json.load(open(D+'../../data/kits.json')); KB={x['id']:x for x in K}
PR={x['id']:x for x in json.load(open(D+'../../data/products.json'))}
ACC='#19b45a'; INK='#f3f5f8'; MUT='#9aa3ae'; SOFT='#d9dee4'
c=[]; nid=[1]
def cmd(name,params):
    c.append({'command':name,'params':params}); 
    if name in('node.create','text.create','image.place'): nid[0]+=1; return nid[0]
for f in ['BarlowCondensed-SemiBold','BarlowCondensed-Bold','BarlowCondensed-Medium','Barlow-Regular','Barlow-Medium','Barlow-SemiBold']:
    cmd('text.loadFont',{'path':FN+f+'.ttf'})
FR={}
def frame(key,name,x,y,w,h): FR[key]=cmd('node.create',{'type':'frame','name':name,'x':x,'y':y,'width':w,'height':h,'props':{'fill':'#07090c','clip':True}})
frame('r','01-picker-resting',0,0,1440,900)
frame('h','02-picker-hover',1520,0,1440,900)
frame('s','03-stage-step3',0,1000,1440,900)
frame('p','04-phone-stage-step3',1520,1000,390,844)
P=[None]
def txt(t,x,y,size,fam='Barlow',style='Regular',fill=INK,ls=None,case=None,width=None,rot=None,lh=None,align=None,name=None,deco=None,op=None):
    pr={'fontFamily':fam,'fontStyle':style,'fontSize':size,'fill':fill,'name':name or t[:40]}
    if ls: pr['letterSpacing']=ls
    if case: pr['textCase']=case
    if lh: pr['lineHeight']=lh
    if align: pr['textAlign']=align
    if rot: pr['rotation']=rot
    if deco: pr['textDecoration']=deco
    if op is not None: pr['opacity']=op
    p={'text':t,'x':x,'y':y,'parent':P[0],'props':pr}
    if width: p['width']=width
    i=cmd('text.create',p)
    return i
def vtxt(t,xl,yb,size,name):
    i=txt(t,0,0,size,'Barlow Condensed','SemiBold',ls='8%',case='upper',name=name)
    cmd('node.set',{'ids':[i],'rotation':90}); cmd('node.set',{'ids':[i],'x':xl,'y':yb}); return i
def img(f,x,y,w,h,name=None,op=None):
    i=cmd('image.place',{'path':IMG+f,'x':x,'y':y,'width':w,'height':h,'parent':P[0]})
    pr={}
    if name: pr['name']=name
    if op is not None: pr['opacity']=op
    if pr: cmd('node.set',{'ids':[i],**pr})
    return i
def rect(x,y,w,h,fill,name='rule',op=None):
    pr={'fill':fill}
    if op is not None: pr['opacity']=op
    return cmd('node.create',{'type':'rectangle','x':x,'y':y,'width':w,'height':h,'parent':P[0],'name':name,'props':pr})
def glow(cx,cy,w,h,color,a0,name='glow'):
    st=[{'position':0,'color':color+a0},{'position':1,'color':color+'00'}]
    return cmd('node.create',{'type':'ellipse','x':cx-w/2,'y':cy-h/2,'width':w,'height':h,'parent':P[0],'name':name,'props':{'fills':[{'type':'radialGradient','stops':st}]}})
def fit(f,bw,bh):
    w,h=Image.open(IMG+f).size; s=min(bw/w,bh/h); return round(w*s,1),round(h*s,1)
# ---------------- picker (resting + hover)
G=[('Energy',['oil-gas','rig-drilling','electrical']),('Build',['construction','heavy-machinery','demolition']),('Make',['manufacturing','assembly-line','woodworking','mechanical','power-tool','welding']),('Move',['logistics','aviation','railway']),('Extract & Handle',['mining','forestry','cryogenic'])]
HOV='construction'
for mode in 'rh':
    P[0]=FR[mode]
    img('logo_white.png',32,30,96,25,'AVES logo')
    txt('Pick your industry',32,70,72,'Barlow Condensed','Bold',ls='1%',case='upper',name='Headline')
    txt('Eighteen kits, head to toe. Arrows to move, Enter to choose.',33,156,16,fill=MUT,name='Sub')
    txt('Head to toe. One brand.',1000,34,13,'Barlow Condensed','Medium',MUT,ls='14%',case='upper',width=408,align='right',name='Tagline')
    x=1.0 if mode=='r' else 0.0; n=0
    for g,ids in G:
        gx=x
        for kid in ids:
            n+=1
            if mode=='r': w,tag=74,'r'
            else: w,tag=(221,'h') if kid==HOV else (65,'c')
            img(f'{kid}_{tag}.jpg',x,208,w,612,'Slice '+kid)
            nm=KB[kid]['name']
            if kid==HOV and mode=='h':
                tx=x+16
                txt(f'KIT {n:02d} / 18',tx,650,14,'Barlow Condensed','SemiBold',ACC,ls='14%',name='Kit counter')
                txt(nm,tx,674,31,'Barlow Condensed','Bold',ls='2%',case='upper',width=189,lh='100%',name='Kit name hover')
                for j,hz in enumerate(KB[kid]['hazards'][:3]):
                    yy=732+j*26
                    rect(tx,yy+9,8,2,ACC,'dash')
                    txt(hz,tx+16,yy,14,'Barlow','Regular',SOFT,width=175,name='Hazard '+str(j+1))
                rect(x,822,w,3,ACC,'Hover underline')
            else:
                vtxt(nm,x+(w-26)/2,796,20,'Kit '+nm)
            x+=w+(20 if kid==ids[-1] else 2)
        rect(gx,836,x-20-gx,1,'#ffffff',('Group rule '+g),op=.14)
        txt(g,gx,846,13,'Barlow Condensed','Medium',ACC if (mode=='h' and g=='Build') else MUT,ls='14%',case='upper',name='Group '+g)
# ---------------- stage (desktop + phone)
oil=KB['oil-gas']
SL=[('head','aves-titan-av-841r-nv'),('eye','av-sg30'),('hearing','av-hm3093-cap-earmuffs'),('respiratory','aves-escape-hood-bag'),('vest','scuta-vest'),('fall','full-body-harness'),('dropped','av-101373'),('hand','hg-2230-rubber-neoprene-gloves')]
LAB={'head':'HEAD','eye':'EYE','hearing':'HEARING','respiratory':'RESPIRATORY','vest':'HI-VIS VEST','fall':'FALL','dropped':'DROPPED OBJECTS','hand':'HAND'}
cutf={s:f'cut_{s}.png' for s,_ in SL}
SLOT={s['slot']:s for s in oil['slots']}
act=2  # step 3 -> index 2
a=SL[act][1]; ap=PR[a]; aslot=SLOT['hearing']
# desktop
P[0]=FR['s']
img('stage_desktop.jpg',0,0,1440,900,'Backdrop oil-gas')
img('logo_white.png',32,30,96,25,'AVES logo')
txt('Choose another kit',1208,34,14,'Barlow Condensed','Medium',MUT,ls='14%',case='upper',width=200,align='right',name='Choose another kit',deco='underline')
glow(470,470,640,720,'#5f8aa0','55','Spotlight')
cmd('node.create',{'type':'ellipse','x':470-170,'y':832-14,'width':340,'height':28,'parent':P[0],'name':'Floor shadow','props':{'fills':[{'type':'radialGradient','stops':[{'position':0,'color':'#000000cc'},{'position':1,'color':'#00000000'}]}]}})
mw,mh=Image.open(IMG+'man_step3.png').size; s=0.545
img('man_step3.png',470-mw*s/2,832-(mh-20)*s,mw*s,mh*s,'Man step 3 (head, eye, hearing)')
# shelf header
txt('Oil & Gas',960,62,30,'Barlow Condensed','Bold',ls='2%',case='upper',name='Kit title')
txt('/ 8',1358,62,30,'Barlow Condensed','Bold',MUT,width=50,align='right',name='Counter total')
txt('3',1318,62,30,'Barlow Condensed','Bold',ACC,width=40,align='right',name='Counter step')
sw=52; 
for i in range(8): rect(960+i*(sw+4.57),108,sw,3,ACC if i<=act else '#ffffff',f'Progress {i+1}',op=None if i<=act else .16)
# grid
for i,(slot,pid) in enumerate(SL):
    r,cc=divmod(i,2); cx0=960+cc*224; yt=126+r*120
    f=cutf[slot]; is_act=(i==act); done=i<act
    bw,bh=(150,74) if not is_act else (176,88)
    w,h=fit(f,bw,bh)
    cx=cx0+112; bottom=yt+78
    if is_act:
        glow(cx,bottom-h/2,230,140,ACC,'48','Active glow')
    op=.34 if done else (1 if is_act else .78)
    img(f,cx-w/2,bottom-h,w,h,'Slot '+slot,op=op)
    rect(cx0+6,yt+82,212,2 if is_act else 1,ACC if is_act else '#ffffff','Shelf '+slot,op=None if is_act else .12)
    lab=f'{i+1:02d}  {LAB[slot]}'+('  BY SCUTA' if slot=='vest' else '')
    txt(lab,cx0+6,yt+89,12,'Barlow Condensed','SemiBold' if is_act else 'Medium',ACC if is_act else MUT,ls='14%',name='Label '+slot,op=(.5 if done else None))
# detail
txt(ap['name'],960,630,32,'Barlow Condensed','Bold',ls='1%',case='upper',width=448,lh='100%',name='Active name')
txt('SKU  '+ap['sku'],960,670,14,'Barlow','Medium',MUT,name='Active SKU')
std=ap['standards'].replace(', ',' · ')
txt('STANDARDS',960,698,12,'Barlow Condensed','SemiBold',ACC,ls='14%',name='Standards label')
txt(std,1036,695,14,'Barlow','Regular',SOFT,width=372,name='Standards')
txt(aslot['why'],960,724,14,'Barlow','Regular',SOFT,width=448,lh='140%',name='Why')
txt('Add to quote',960,782,16,'Barlow Condensed','Bold',ACC,ls='10%',case='upper',name='CTA')
rect(960,805,104,2,ACC,'CTA underline')
txt('Boots by Cavalier',960,858,13,'Barlow','Regular',MUT,deco='underline',name='Cavalier line')
# phone
P[0]=FR['p']
img('stage_phone.jpg',0,0,390,560,'Backdrop oil-gas')
img('logo_white.png',16,22,72,19,'AVES logo')
txt('Choose another kit',200,24,12,'Barlow Condensed','Medium',MUT,ls='14%',case='upper',width=174,align='right',name='Choose another kit',deco='underline')
txt('Oil & Gas',16,58,24,'Barlow Condensed','Bold',ls='2%',case='upper',name='Kit title')
txt('/ 8',324,58,24,'Barlow Condensed','Bold',MUT,width=50,align='right',name='Counter total')
txt('3',290,58,24,'Barlow Condensed','Bold',ACC,width=40,align='right',name='Counter step')
sw=40; gp=(358-8*sw)/7
for i in range(8): rect(16+i*(sw+gp),92,sw,3,ACC if i<=act else '#ffffff',f'Progress {i+1}',op=None if i<=act else .16)
glow(195,330,380,470,'#5f8aa0','55','Spotlight')
cmd('node.create',{'type':'ellipse','x':195-95,'y':524-9,'width':190,'height':18,'parent':P[0],'name':'Floor shadow','props':{'fills':[{'type':'radialGradient','stops':[{'position':0,'color':'#000000cc'},{'position':1,'color':'#00000000'}]}]}})
s2=0.3
img('man_step3.png',195-mw*s2/2,524-(mh-20)*s2,mw*s2,mh*s2,'Man step 3')
for i,(slot,pid) in enumerate(SL):
    f=cutf[slot]; is_act=(i==act); done=i<act
    cx0=16+i*64; cx=cx0+30
    w,h=fit(f,56 if not is_act else 60,50 if not is_act else 56)
    if is_act: glow(cx,568,96,84,ACC,'48','Active glow')
    img(f,cx-w/2,596-h,w,h,'Slot '+slot,op=(.34 if done else (1 if is_act else .78)))
    rect(cx0,600,60,2 if is_act else 1,ACC if is_act else '#ffffff','Shelf '+slot,op=None if is_act else .14)
    txt(f'{i+1:02d}',cx0,608,12,'Barlow Condensed','SemiBold',ACC if is_act else MUT,ls='14%',name='Num '+slot,op=(.5 if done else None))
txt('03  HEARING',16,634,13,'Barlow Condensed','SemiBold',ACC,ls='14%',name='Active slot label')
txt(ap['name'],16,654,26,'Barlow Condensed','Bold',ls='1%',case='upper',width=358,lh='100%',name='Active name')
txt('SKU  '+ap['sku'],16,688,13,'Barlow','Medium',MUT,name='Active SKU')
txt(std,16,708,13,'Barlow','Regular',SOFT,width=358,name='Standards')
txt(aslot['why'],16,730,14,'Barlow','Regular',SOFT,width=358,lh='140%',name='Why')
txt('Add to quote',16,780,15,'Barlow Condensed','Bold',ACC,ls='10%',case='upper',name='CTA')
rect(16,801,98,2,ACC,'CTA underline')
txt('Boots by Cavalier',16,814,12,'Barlow','Regular',MUT,deco='underline',name='Cavalier line')
json.dump(c,open(D+'_work/script.json','w'))
print(len(c),nid[0],FR)
