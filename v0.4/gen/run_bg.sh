#!/bin/zsh
# v0.4 backdrop candidates: the site lit from the FRONT (sun behind the camera), to match the studio-lit worker.
export DRAWTHINGS_MODELS_DIR=~/Flowtronix/models/draw-things
cd "$(dirname "$0")"
P="Wide eye-level photograph of an oil and gas processing plant in clear late afternoon light, the low warm sun is behind the camera so every structure is evenly front-lit, steel pipe racks on both sides receding to the horizon, distillation columns, a red and white flare stack in the distance, thin steam drifting, a wide empty concrete and gravel apron in the foreground and centre, long soft shadows falling away from the camera, blue sky with soft warm haze near the horizon, natural colour, cinematic 35mm, sharp detail, no people, no text"
for s in 4 9 17; do
  [ -f bg-front-s$s.png ] || draw-things-cli generate --offline --model flux_2_klein_9b_q8p.ckpt --width 1792 --height 1024 --seed $s --disable-preview --output bg-front-s$s.png --prompt "$P" >> gen.log 2>&1
done
