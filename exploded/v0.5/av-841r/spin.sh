#!/bin/sh
# The 360 frame set: 36 frame pages (one build each, in parallel), shot on transparency, converted to lossless WebP,
# and assets/spin/spin.json written. About 2 minutes. usage: ./spin.sh
cd "$(dirname "$0")" || exit 1
mkdir -p shots/_spin assets/spin
rm -f shots/_spin/spin-*.html shots/_spin/spin-*.png
seq 0 10 350 | xargs -P 12 -I{} node build.mjs --light --fine --spin={} > shots/_spin/build.log 2>&1
set -- $(grep "wrote spin-000" shots/_spin/build.log | awk '{print $3, $4}')
W=$1; H=$2
[ "$(ls shots/_spin/spin-*.html | wc -l | tr -d ' ')" = 36 ] || { echo "not 36 frame pages"; exit 1; }
node spin-shoot.mjs "$W" "$H" || exit 1
for f in shots/_spin/spin-*.png; do cwebp -quiet -lossless -z 9 -exact "$f" -o "assets/spin/$(basename "$f" .png).webp" || exit 1; done
printf '{"count":36,"step":10,"start":0,"ext":"webp","width":%s,"height":%s,"source":"drawn"}\n' "$W" "$H" > assets/spin/spin.json
cat assets/spin/spin.json; du -ch assets/spin/*.webp | tail -1
