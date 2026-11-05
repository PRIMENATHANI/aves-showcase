#!/bin/zsh
cd "$(dirname "$0")"
export DRAWTHINGS_MODELS_DIR=$HOME/Flowtronix/models/draw-things
P="The man from the first image now wears the safety glasses shown in the second image, on his face over his eyes with the arms open behind his ears. Same man, same face, same pose, same coverall, same background, same framing. The product looks exactly like the reference: same colours, shape and markings. Full-length shot, the whole body from boots to above the head, exactly the same framing and camera distance as the first image."
cmd=(draw-things-cli generate --offline --model qwen_image_edit_2511_q6p.ckpt --prompt "$P" --image ../../dress-v0.1/inputs/f00-base.png --image refs/av-sg30-white.png --width 896 --height 1536 --steps 20 --seed 4242 --disable-preview --output 07-glasses-qwen-sized.png)
echo "[07-glasses-qwen-sized.png] (default steps 30 replaced by 20) ${(q)cmd}" >> bench.log
t0=$SECONDS; "${cmd[@]}" >> bench.err 2>&1; rc=$?
echo "[07-glasses-qwen-sized.png] rc=$rc wall=$((SECONDS-t0))s" >> bench.log
