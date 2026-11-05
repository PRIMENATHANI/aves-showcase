#!/bin/zsh
cd /Users/macintosh/Documents/Claude/Sloane/aves-showcase
PY=/tmp/aves-venv/bin/python; R=spikes/dress-v0.3-qc/regression
$PY tools/dress/gen.py aves-titan-av-841r-nv --out $R
$PY tools/dress/gen.py av-hm3093-cap-earmuffs --on aves-titan-av-841r-nv --out $R
$PY tools/dress/gen.py hg-2230-rubber-neoprene-gloves --out $R
