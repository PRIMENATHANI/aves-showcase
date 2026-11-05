import json,sys
D='/Users/macintosh/Documents/Claude/Sloane/aves-showcase/v0.3/design/'
FN=D+'_work/fonts/'
scale=float(sys.argv[1]); out=sys.argv[2]
names={2:'01-picker-resting',3:'02-picker-hover',4:'03-stage-step3',5:'04-phone-stage-step3'}
c=[{'command':'text.loadFont','params':{'path':FN+f+'.ttf'}} for f in ['BarlowCondensed-SemiBold','BarlowCondensed-Bold','BarlowCondensed-Medium','Barlow-Regular','Barlow-Medium','Barlow-SemiBold']]
c.append({'command':'text.refit','params':{}})
for i,n in names.items(): c.append({'command':'file.export','params':{'ids':[i],'format':'png','scale':scale,'path':out+'/'+n+'.png'}})
json.dump(c,open('exp.json','w'))
