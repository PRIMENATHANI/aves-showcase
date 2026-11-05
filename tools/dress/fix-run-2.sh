#!/bin/zsh
# Second pass for construction's harness after fix-run.sh ends: stronger fall placement text, seed 11.
cd "$(dirname "$0")/../.."
until grep -q "FIX-RUN END" tools/dress/build.log; do sleep 30; done
python3 - <<'PY'
import json,os
m=json.load(open('assets/dress/manifest.json')); ids={'full-body-harness-ansi-4','av-101365__on-full-body-harness-ansi-4'}
m['layers']=[l for l in m['layers'] if l['id'] not in ids]; json.dump(m,open('assets/dress/manifest.json','w'),indent=1)
for i in ids:
    for p in (f'assets/dress/layers/{i}.png', f'tools/dress/work/layers_raw/{i}.png', f'tools/dress/work/frames/{i}.png'):
        if os.path.exists(p): os.remove(p); print('removed',p)
PY
echo "$(date +%H:%M:%S) FIX-RUN-2 construction harness, seed 11, vest-visible text" >> tools/dress/build.log
DRESS_SEED=11 caffeinate -i .venv/bin/python tools/dress/build.py construction
echo "$(date +%H:%M:%S) FIX-RUN-2 END" >> tools/dress/build.log
