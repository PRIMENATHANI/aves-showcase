import json,sys
mode=sys.argv[1]; P=int(sys.argv[2])
G=[('Energy',['oil-gas','rig-drilling','electrical']),('Build',['construction','heavy-machinery','demolition']),('Make',['manufacturing','assembly-line','woodworking','mechanical','power-tool','welding']),('Move',['logistics','aviation','railway']),('Extract & Handle',['mining','forestry','cryogenic'])]
K={x['id']:x for x in json.load(open('../../../data/kits.json'))}
IMG='/Users/macintosh/Documents/Claude/Sloane/aves-showcase/v0.3/design/_work/img/'
c=[]
def txt(t,x,y,size,fam='Barlow',style='Regular',fill='#f3f5f8',ls=None,case=None,width=None,rot=None,lh=None,align=None,name=None):
    pr={'fontFamily':fam,'fontStyle':style,'fontSize':size,'fill':fill}
    if ls: pr['letterSpacing']=ls
    if case: pr['textCase']=case
    if lh: pr['lineHeight']=lh
    if align: pr['textAlign']=align
    if rot: pr['rotation']=rot
    if name: pr['name']=name
    p={'text':t,'x':x,'y':y,'parent':P,'props':pr}
    if width: p['width']=width
    c.append({'command':'text.create','params':p})
def img(f,x,y,w,h,name=None):
    c.append({'command':'image.place','params':{'path':IMG+f,'x':x,'y':y,'width':w,'height':h,'parent':P}})
def rect(x,y,w,h,fill,name=None):
    c.append({'command':'node.create','params':{'type':'rectangle','x':x,'y':y,'width':w,'height':h,'parent':P,'name':name or 'rule','props':{'fill':fill}}})
img('logo_white.png',32,30,96,25)
txt('Pick your industry',32,70,72,'Barlow Condensed','Bold',ls='1%',case='upper',name='Headline')
txt('Eighteen kits, head to toe. Arrows to move, Enter to choose.',33,156,16,fill='#9aa3ae',name='Sub')
txt('Head to toe. One brand.',1000,34,13,'Barlow Condensed','Medium','#9aa3ae',ls='14%',case='upper',width=408,align='right',name='Tagline')
x=1.0 if mode=='r' else 0.0; n=0; HOV='construction'
for g,ids in G:
    gx=x
    for kid in ids:
        n+=1
        if mode=='r': w,tag=74,'r'
        else: w,tag=(221,'h') if kid==HOV else (65,'c')
        img(f'{kid}_{tag}.jpg',x,208,w,612)
        nm=K[kid]['name']
        if kid==HOV and mode=='h':
            tx=x+16
            txt(f'KIT {n:02d} / 18',tx,574,13,'Barlow Condensed','SemiBold','#19b45a',ls='14%',name='Kit counter')
            txt(nm,tx,598,34,'Barlow Condensed','Bold',ls='2%',case='upper',width=189,lh='100%',name='Kit name (hover)')
            for j,hz in enumerate(K[kid]['hazards'][:3]):
                yy=668+j*26
                rect(tx,yy+9,8,2,'#19b45a','dash')
                txt(hz,tx+16,yy,14,'Barlow','Regular','#d9dee4',width=175,name='Hazard '+str(j+1))
            rect(x,822,w,3,'#19b45a','Hover underline')
        else:
            sx=x+(w-24)/2
            txt(nm,sx,796,20,'Barlow Condensed','SemiBold',ls='8%',case='upper',rot=90,name='Kit '+nm)
        x+=w+(20 if kid==ids[-1] else 2)
    ex=x-20 if x-20>gx else x
    ex=x-20
    rect(gx,836,ex-gx,1,'#ffffff24','Group rule '+g)
    txt(g,gx,846,13,'Barlow Condensed','Medium','#19b45a' if (mode=='h' and g=='Build') else '#9aa3ae',ls='14%',case='upper',name='Group '+g)
print(json.dumps(c),file=open(f'b1_{mode}.json','w'))
print(len(c))
