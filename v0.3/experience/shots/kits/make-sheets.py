from PIL import Image, ImageDraw, ImageFont
import os
D=os.path.dirname(os.path.abspath(__file__))+'/'
KITS="oil-gas rig-drilling manufacturing construction mining heavy-machinery assembly-line demolition logistics woodworking aviation railway mechanical power-tool forestry welding electrical cryogenic".split()
try: F=ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc',14)
except Exception: F=ImageFont.load_default()
def sheet(frame,per,w,out):
    ims=[Image.open(f'{D}{k}-{frame}.png').convert('RGB') for k in KITS]
    h=round(ims[0].height*w/ims[0].width); lab=22; gap=8
    rows=-(-len(ims)//per)
    S=Image.new('RGB',(per*(w+gap)+gap,rows*(h+lab+gap)+gap),(20,20,20)); d=ImageDraw.Draw(S)
    for i,(k,im) in enumerate(zip(KITS,ims)):
        x=gap+(i%per)*(w+gap); y=gap+(i//per)*(h+lab+gap)
        S.paste(im.resize((w,h),Image.LANCZOS),(x,y)); d.text((x+2,y+h+3),k,fill=(230,230,230),font=F)
    S.save(D+out); print(out,S.size)
sheet('d-close',6,480,'sheet-desktop-close.png')
sheet('m-close',9,160,'sheet-phone-close.png')
sheet('d-step3',6,480,'sheet-desktop-step3.png')
