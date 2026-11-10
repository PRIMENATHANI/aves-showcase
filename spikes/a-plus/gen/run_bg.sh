#!/bin/zsh
# Throwaway spike art: backdrop + stockroom shelf, local Draw Things, one generate at a time.
export DRAWTHINGS_MODELS_DIR=~/Flowtronix/models/draw-things
cd "$(dirname "$0")"
gen(){ # name seed w h prompt
  [ -f "$1.png" ] && return
  draw-things-cli generate --offline --model flux_2_klein_9b_q8p.ckpt --prompt "$5" --width $3 --height $4 --seed $2 --disable-preview --output "$1.png" >> gen.log 2>&1
  echo "$1 exit $?" >> gen.log
}
BG="Wide photograph of an oil and gas processing plant at golden hour, low warm sun from the left raking across steel pipe racks, distillation columns and a flare stack in the distance, thin steam drifting, wet gravel ground in the foreground with empty open space in the centre, deep teal shadows and amber highlights, cinematic, 35mm, sharp detail, no people, no text"
SH="Front-on photograph of an empty heavy-duty steel storage rack in a dark industrial PPE stockroom, three wide empty shelves of matte black steel with pale plywood boards, perfectly straight and level, evenly lit by a soft warm strip light above each shelf, dark charcoal wall behind, nothing on the shelves, no people, no text, symmetric, architectural photograph"
gen bg-s3 3 1792 1024 "$BG"
gen bg-s11 11 1792 1024 "$BG"
gen shelf-s3 3 1024 1280 "$SH"
gen shelf-s11 11 1024 1280 "$SH"
echo done >> gen.log
