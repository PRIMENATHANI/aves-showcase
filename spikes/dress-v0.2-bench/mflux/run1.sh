#!/bin/zsh
# usage: run1.sh <name> <ref> <seed> <placement> <item> [q]
V=/private/tmp/claude-501/-Users-macintosh-Documents-Claude-Sloane/620cf011-e614-4864-a570-899eba324016/scratchpad/mflux-venv
N=$1; REF=$2; SEED=$3; PL=$4; ITEM=$5; Q=${6:-8}
CANVAS=${CANVAS:-../../dress-v0.1/inputs/f00-base.png}
P="The man from the first image now wears the $ITEM shown in the second image, $PL. Same man, same face, same pose, same coverall, same background, same framing. The product looks exactly like the reference: same colours, shape and markings."
CMD=($V/bin/mflux-generate-flux2-edit --model flux2-klein-9b -q $Q --image-paths $CANVAS refs/$REF.png --prompt "$P" --seed $SEED --steps 4 --width 896 --height 1536 --output out/$N.png)
echo "CMD: ${(q)CMD[@]}" >> bench.log
S=$SECONDS; "${CMD[@]}" > out/$N.stdout 2>&1; RC=$?
echo "RESULT $N rc=$RC wall=$((SECONDS-S))s" >> bench.log
