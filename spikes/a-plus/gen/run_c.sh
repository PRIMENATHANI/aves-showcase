#!/bin/zsh
export DRAWTHINGS_MODELS_DIR=~/Flowtronix/models/draw-things
cd "$(dirname "$0")"
draw-things-cli generate --offline --model flux_2_klein_9b_q8p.ckpt --width 1792 --height 1024 --seed 3 --disable-preview --output bg-construction-s3.png --prompt "Wide photograph of a large building construction site at golden hour, low warm sun from the left raking across a concrete frame building with scaffolding and a tower crane, rebar and formwork, dust in the air, compacted earth and gravel ground in the foreground with empty open space in the centre, deep blue shadows and amber highlights, cinematic, 35mm, sharp detail, no people, no text" >> gen.log 2>&1
sips -s format jpeg -s formatOptions 86 bg-construction-s3.png --out ../art/bg-construction.jpg >/dev/null
