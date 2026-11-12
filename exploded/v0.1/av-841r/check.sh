#!/bin/sh
# Rebuilds both themes with the audit, audits the two fit stops, and runs the line check in five poses per theme.
cd "$(dirname "$0")" || exit 1
SK=/Users/macintosh/.claude/skills/anatomy/scripts
node build.mjs --light --audit --fine > shots/audit-light.txt 2>&1
node build.mjs --audit --fine > shots/audit-dark.txt 2>&1
node build.mjs --light --audit --fit=52 > shots/audit-fit52.txt 2>&1
node build.mjs --light --audit --fit=66 > shots/audit-fit66.txt 2>&1
node "$SK/drive.mjs" av-841r-light.html --actions shots/poses.json --width 900 --height 1700 > shots/lines-light.txt 2>&1
sed 's#shots/lines-#shots/lines-dark-#g; s#shots/z-band#shots/z-band-dark#' shots/poses.json > shots/poses-dark.json
node "$SK/drive.mjs" av-841r.html --actions shots/poses-dark.json --width 900 --height 1700 > shots/lines-dark.txt 2>&1
for f in shots/audit-light.txt shots/audit-dark.txt shots/audit-fit52.txt shots/audit-fit66.txt; do echo "== $f"; tail -2 "$f"; grep -c "in passing" "$f"; done
grep "line ends" shots/lines-light.txt shots/lines-dark.txt
