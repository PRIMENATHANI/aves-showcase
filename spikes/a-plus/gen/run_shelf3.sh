#!/bin/zsh
export DRAWTHINGS_MODELS_DIR=~/Flowtronix/models/draw-things
cd "$(dirname "$0")"
while pgrep -f "draw-things-cli generate" >/dev/null; do sleep 3; done
P="Tight front-on photograph of a premium retail display rack in a dark industrial PPE stockroom, the rack fills the entire frame from the top edge to the bottom edge and from side to side, matte black steel frame, exactly four wide deep shelves with pale oak boards, very tall open space between the shelves, a warm LED strip light under the front edge of every shelf washing the board below with soft light, dark warm brown back panel, nothing on the shelves, no people, no text, no labels, perfectly straight, level and symmetric, architectural product photograph"
for s in 5 12 21; do
  [ -f shelf3-s$s.png ] || draw-things-cli generate --offline --model flux_2_klein_9b_q8p.ckpt --width 896 --height 1280 --seed $s --disable-preview --output shelf3-s$s.png --prompt "$P" >> gen.log 2>&1
done
