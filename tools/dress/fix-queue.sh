#!/bin/zsh
# Waits for the library build to finish, then regenerates failed layers with a new seed.
# Usage: DRESS_SEED=7 tools/dress/fix-queue.sh "<kitId> <kitId>" <layerId>...
cd "$(dirname "$0")/../.."
KIT=$1; shift
until grep -q "BUILD FINISHED" tools/dress/build.log; do sleep 60; done
python3 - "$@" <<'PY'
import json,sys,os
m=json.load(open('assets/dress/manifest.json')); ids=set(sys.argv[1:])
m['layers']=[l for l in m['layers'] if l['id'] not in ids]
json.dump(m,open('assets/dress/manifest.json','w'),indent=1)
for i in ids:
    for p in (f'assets/dress/layers/{i}.png', f'tools/dress/work/layers_raw/{i}.png', f'tools/dress/work/frames/{i}.png'):
        if os.path.exists(p): os.remove(p); print('removed',p)
PY
echo "$(date +%H:%M:%S) FIX-QUEUE seed=$DRESS_SEED kit=$KIT layers=$*" >> tools/dress/build.log
exec caffeinate -i .venv/bin/python tools/dress/build.py ${=KIT}
