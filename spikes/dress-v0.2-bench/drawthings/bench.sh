#!/bin/zsh
cd "$(dirname "$0")"
export DRAWTHINGS_MODELS_DIR=$HOME/Flowtronix/models/draw-things
BASE=../../dress-v0.1/inputs/f00-base.png
TAIL="Same man, same face, same pose, same coverall, same background, same framing. The product looks exactly like the reference: same colours, shape and markings."
run(){ # out model canvas ref seed prompt
  local out=$1 model=$2 canvas=$3 ref=$4 seed=$5 prompt=$6
  local cmd=(draw-things-cli generate --offline --model $model --prompt "$prompt $TAIL" --image $canvas --image $ref --seed $seed --disable-preview --output $out)
  local t0=$SECONDS
  echo "[$out] ${(q)cmd}" >> bench.log
  "${cmd[@]}" >> bench.err 2>&1; local rc=$?
  echo "[$out] rc=$rc wall=$((SECONDS-t0))s" >> bench.log
}
case $1 in
 helmet) run 01-helmet.png flux_2_klein_9b_q8p.ckpt $BASE refs/aves-titan-av-841r-nv-white.png 4242 "The man from the first image now wears the white wide-brim hard hat shown in the second image, on his head.";;
 glasses) run 02-glasses.png flux_2_klein_9b_q8p.ckpt $BASE refs/av-sg30-white.png 4242 "The man from the first image now wears the safety glasses shown in the second image, on his face over his eyes with the arms open behind his ears.";;
 earmuffs) run 03-earmuffs.png flux_2_klein_9b_q8p.ckpt 01-helmet.png refs/av-hm3093-cap-earmuffs-white.png 4242 "The man from the first image now wears the cap-mounted earmuffs shown in the second image, one cup over each ear, mounted to the hard hat.";;
 gloves) run 04-gloves.png flux_2_klein_9b_q8p.ckpt $BASE refs/hg-2230-rubber-neoprene-gloves-white.png 4242 "The man from the first image now wears the gauntlet gloves shown in the second image, on both hands, fingers inside.";;
 glasses23) run 05-glasses-seed23.png flux_2_klein_9b_q8p.ckpt $BASE refs/av-sg30-white.png 23 "The man from the first image now wears the safety glasses shown in the second image, on his face over his eyes with the arms open behind his ears.";;
 qwen) run 06-glasses-qwen.png qwen_image_edit_2511_q6p.ckpt $BASE refs/av-sg30-white.png 4242 "The man from the first image now wears the safety glasses shown in the second image, on his face over his eyes with the arms open behind his ears.";;
esac
