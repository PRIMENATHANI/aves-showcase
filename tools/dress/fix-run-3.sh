#!/bin/zsh
# Third pass: welding hood as one closed shell, seed 11; runs after fix-run-2.sh ends.
cd "$(dirname "$0")/../.."
until grep -q "FIX-RUN-2 END" tools/dress/build.log; do sleep 30; done
python3 - <<'PY'
import json,os
m=json.load(open('assets/dress/manifest.json')); i='aves-welding-helmet'
m['layers']=[l for l in m['layers'] if l['id']!=i]; json.dump(m,open('assets/dress/manifest.json','w'),indent=1)
for p in (f'assets/dress/layers/{i}.png', f'tools/dress/work/layers_raw/{i}.png', f'tools/dress/work/frames/{i}.png'):
    if os.path.exists(p): os.remove(p); print('removed',p)
PY
echo "$(date +%H:%M:%S) FIX-RUN-3 welding hood closed shell, seed 11" >> tools/dress/build.log
DRESS_SEED=11 caffeinate -i .venv/bin/python tools/dress/build.py welding
echo "$(date +%H:%M:%S) FIX-RUN-3 END" >> tools/dress/build.log
