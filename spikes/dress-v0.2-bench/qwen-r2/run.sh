#!/bin/zsh
# usage: run.sh <out.png> <seed> <canvas> <prompt> <refs...>
cd "$(dirname "$0")"
export DRAWTHINGS_MODELS_DIR=$HOME/Flowtronix/models/draw-things
out=$1; seed=$2; canvas=$3; P=$4; shift 4
for i in $(seq 1 180); do pgrep -f draw-things-cli >/dev/null || break; sleep 30; done
pgrep -f draw-things-cli >/dev/null && { echo "[$out] GPU busy after 90 min" >> bench.log; exit 2; }
CFG='{"loras":[{"file":"qwen_image_edit_2511_lightning_4_step_v1.0_lora_f16.ckpt","weight":1.0,"version":"qwen_image"}]}'
imgs=(--image $canvas); for r in "$@"; do imgs+=(--image $r); done
cmd=(draw-things-cli generate --offline --model qwen_image_edit_2511_q6p.ckpt --config-json "$CFG" --prompt "$P" $imgs --width 896 --height 1536 --steps 4 --cfg 1.0 --seed $seed --disable-preview --output $out)
echo "[$out] ${(q)cmd}" >> bench.log
t0=$SECONDS; "${cmd[@]}" >> bench.err 2>&1; rc=$?
echo "[$out] rc=$rc wall=$((SECONDS-t0))s" >> bench.log
