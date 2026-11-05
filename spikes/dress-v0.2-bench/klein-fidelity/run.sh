#!/bin/zsh
cd "$(dirname "$0")"
export DRAWTHINGS_MODELS_DIR=$HOME/Flowtronix/models/draw-things
R=../refs-v2
BASE=../../dress-v0.1/inputs/f00-base.png
TAIL="Same man, same face, same pose, same coverall, same background, same framing. The product looks exactly like the reference: same colours, shape and markings."
M=flux_2_klein_9b_q8p.ckpt
typeset -A D
D[helmet]="The hard hat is: a full-brim industrial hard hat with a one-piece glossy white shell, a tall rounded dome with a raised centre rib running front to back and recessed shoulders on each side, and a low, broad flat brim about 40 mm wide all the way round, slightly drooping at the edge with a thin rolled lip. Four small rectangular notches sit on the shell wall just above the brim. No front peak, no logo, no vents."
D[glasses]="The safety glasses are: half-wrap sport glasses with a single continuous wrap-around grey lens, a dark smoked upper frame rail across the top of the lens as a brow guard, no lower frame, and a moulded black nose bridge. The two temples are black near the hinge and bright green further back with a lime-green stripe and a white AVES logo, and they run back over the ears, ending in an oval cut-out loop."
D[earmuffs]="The earmuffs are: cap-mounted earmuffs with no headband. Two glossy black ear cups, each with a wide green band around the outside and a green AVES logo on the outer face. Each cup hangs from its own rigid black side arm that rises vertically from the cup and curves forward at the top, where it clips into the side slot of the hard hat. The arm carries the AVES wordmark vertically in cream. The cups sit over the ears, under the brim."
D[gloves]="The gloves are: very long matt black rubber gauntlet gloves, seamless and one-piece, reaching to mid forearm, with heavy crinkled ridged texture over the fingers and hand, a smoother gauntlet, and a rolled cuff edge with an orange band. An AVES logo and marking block is printed along the gauntlet."
P_helmet="The man from the first image now wears the white wide-brim hard hat shown in the second image, on his head."
P_glasses="The man from the first image now wears the safety glasses shown in the second image, on his face over his eyes with the arms open behind his ears."
P_earmuffs="The man from the first image now wears the cap-mounted earmuffs shown in the second image, one cup over each ear, mounted to the hard hat."
P_gloves="The man from the first image now wears the gauntlet gloves shown in the second image, on both hands, fingers inside."
# run out canvas seed prompt refs...
run(){
  local out=$1 canvas=$2 seed=$3 prompt=$4; shift 4
  local cmd=(draw-things-cli generate --offline --model $M --prompt "$prompt" --image $canvas)
  for r in "$@"; do cmd+=(--image $r); done
  cmd+=(--width 896 --height 1536 --seed $seed --disable-preview --output $out)
  local w=0
  while pgrep -f draw-things-cli >/dev/null; do sleep 30; w=$((w+30)); [ $w -ge 3600 ] && { echo "[$out] GPU wait timeout" >> bench.log; return; }; done
  echo "[$out] (waited ${w}s for GPU) ${(q)cmd}" >> bench.log
  local t0=$SECONDS
  "${cmd[@]}" >> bench.err 2>&1; local rc=$?
  echo "[$out] rc=$rc wall=$((SECONDS-t0))s" >> bench.log
}
A(){ # out canvas seed key ref
  local k=$4; local p="$(eval echo \$P_$k)"
  run $1 $2 $3 "$p $TAIL ${D[$k]}" $5
}
B(){ local k=$4; local p="$(eval echo \$P_$k)"; p="${p//shown in the second image/shown in the second and third images}"
  run $1 $2 $3 "$p $TAIL ${D[$k]}" $5 $6
}
which=$1
case $which in
 A) A A-01-helmet.png $BASE 4242 helmet $R/aves-titan-av-841r-nv/three-quarter.png
    A A-02-glasses.png $BASE 4242 glasses $R/av-sg30/side-three-quarter.png
    A A-03-earmuffs.png A-01-helmet.png 4242 earmuffs $R/av-hm3093-cap-earmuffs/front.png
    A A-04-gloves.png $BASE 4242 gloves $R/hg-2230-rubber-neoprene-gloves/three-quarter.png
    A A-05-glasses-seed23.png $BASE 23 glasses $R/av-sg30/side-three-quarter.png;;
 B) B B-01-helmet.png $BASE 4242 helmet $R/aves-titan-av-841r-nv/three-quarter.png $R/aves-titan-av-841r-nv/front.png
    echo "[B-02-glasses] skipped: only one reference angle exists for av-sg30" >> bench.log
    B B-03-earmuffs.png B-01-helmet.png 4242 earmuffs $R/av-hm3093-cap-earmuffs/front.png $R/av-hm3093-cap-earmuffs/side.png
    B B-04-gloves.png $BASE 4242 gloves $R/hg-2230-rubber-neoprene-gloves/three-quarter.png $R/hg-2230-rubber-neoprene-gloves/back-upright.png;;
esac
