#!/bin/zsh
# usage: run.sh <out.png> <ref.png> <prompt>
cd "$(dirname "$0")"
ROOT=../../..
export DRAWTHINGS_MODELS_DIR=$HOME/Flowtronix/models/draw-things
out=$1; ref=$2; P=$3
# wait for GPU (exact process name, never kill)
for i in $(seq 1 80); do pgrep -x draw-things-cli >/dev/null || break; sleep 30; done
pgrep -x draw-things-cli >/dev/null && { echo "[$out] GPU busy after 40 min" >> bench.log; exit 2; }
CFG='{"loras":[{"file":"qwen_image_edit_2511_lightning_4_step_v1.0_lora_f16.ckpt","weight":1.0,"version":"qwen_image"}]}'
cmd=(draw-things-cli generate --offline --model qwen_image_edit_2511_q6p.ckpt --config-json "$CFG" --prompt "$P" --image $ROOT/spikes/dress-v0.1/inputs/f00-base.png --image $ROOT/spikes/dress-v0.2-bench/drawthings/refs/$ref --width 896 --height 1536 --steps 4 --cfg 1.0 --seed 4242 --disable-preview --output $out)
echo "[$out] ${(q)cmd}" >> bench.log
t0=$SECONDS; "${cmd[@]}" >> bench.err 2>&1; rc=$?
echo "[$out] rc=$rc wall=$((SECONDS-t0))s" >> bench.log
