#!/bin/zsh
# Serial fix run (never two generates at once): harness/welding kits with seed 7, then the cryogenic apron.
cd "$(dirname "$0")/../.."
echo "$(date +%H:%M:%S) FIX-RUN start" >> tools/dress/build.log
DRESS_SEED=7 caffeinate -i .venv/bin/python tools/dress/build.py construction aviation welding
caffeinate -i .venv/bin/python tools/dress/build.py cryogenic
echo "$(date +%H:%M:%S) FIX-RUN END" >> tools/dress/build.log
