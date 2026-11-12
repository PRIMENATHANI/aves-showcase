#!/bin/sh
# Rebuilds both themes with the audit, audits both fit stops, runs the line check in six poses per theme.
cd "$(dirname "$0")" || exit 1
SK=/Users/macintosh/.claude/skills/anatomy/scripts
node build.mjs --audit --fit=52 > shots/audit-fit52.txt 2>&1
node build.mjs --audit --fit=66 > shots/audit-fit66.txt 2>&1
node build.mjs --light --audit --fine > shots/audit-light.txt 2>&1
node build.mjs --audit --fine > shots/audit-dark.txt 2>&1
cat > shots/poses.json <<'JSON'
[["wait",300],["eval","window.setExplode(0)"],["wait",300],["lines","shots/lines-T-0.png"],["eval","window.setExplode(0.35)"],["wait",300],["lines","shots/lines-T-a.png"],["eval","window.setExplode(0.7)"],["wait",300],["lines","shots/lines-T-mid.png"],["eval","window.setExplode(1)"],["wait",400],["lines","shots/lines-T-1.png"],["eval","window.setFit(52)"],["wait",1500],["lines","shots/lines-T-52.png"],["eval","window.setFit(66)"],["wait",1500],["lines","shots/lines-T-66.png"],["eval","document.querySelector('[data-readout]').textContent"]]
JSON
sed 's/T-/light-/g' shots/poses.json > shots/poses-light.json
sed 's/T-/dark-/g' shots/poses.json > shots/poses-dark.json
node "$SK/drive.mjs" figure-light.html --actions shots/poses-light.json --width 900 --height 1500 > shots/lines-light.txt 2>&1
node "$SK/drive.mjs" figure.html --actions shots/poses-dark.json --width 900 --height 1500 > shots/lines-dark.txt 2>&1
for f in shots/audit-light.txt shots/audit-dark.txt shots/audit-fit52.txt shots/audit-fit66.txt; do echo "== $f"; tail -2 "$f"; echo "in passing: $(grep -c 'in passing' "$f")"; done
grep -E "line ends|eval: \"|console" shots/lines-light.txt shots/lines-dark.txt
