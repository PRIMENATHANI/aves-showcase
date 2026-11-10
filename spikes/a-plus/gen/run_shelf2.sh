#!/bin/zsh
export DRAWTHINGS_MODELS_DIR=~/Flowtronix/models/draw-things
cd "$(dirname "$0")"
P="Front-on photograph of an empty premium retail display rack in a dark industrial PPE stockroom, matte black steel frame, exactly four wide deep shelves with pale oak boards, tall generous space between shelves, a warm LED strip light under the front edge of every shelf washing the board below with soft light, blank cream label strip along the front lip of each shelf, dark charcoal wall behind, polished concrete floor, nothing on the shelves, no people, no text, perfectly straight, level and symmetric, architectural product photograph"
for s in 5 12; do
  [ -f shelf2-s$s.png ] || draw-things-cli generate --offline --model flux_2_klein_9b_q8p.ckpt --width 1024 --height 1280 --seed $s --disable-preview --output shelf2-s$s.png --prompt "$P" >> gen.log 2>&1
done
