#!/bin/zsh
# Chained after fix-queue.sh (pid $1): regenerates the cryogenic apron on the vest frame.
cd "$(dirname "$0")/../.."
while kill -0 $1 2>/dev/null; do sleep 30; done
python3 - <<'PY'
import json,os
m=json.load(open('assets/dress/manifest.json')); i='thermal-protection-apron'
m['layers']=[l for l in m['layers'] if l['id']!=i]; json.dump(m,open('assets/dress/manifest.json','w'),indent=1)
for p in (f'assets/dress/layers/{i}.png', f'tools/dress/work/layers_raw/{i}.png', f'tools/dress/work/frames/{i}.png'):
    if os.path.exists(p): os.remove(p); print('removed',p)
PY
echo "$(date +%H:%M:%S) FIX-QUEUE-2 cryogenic apron on vest frame" >> tools/dress/build.log
exec caffeinate -i .venv/bin/python tools/dress/build.py cryogenic
