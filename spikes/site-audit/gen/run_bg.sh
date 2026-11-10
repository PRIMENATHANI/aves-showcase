#!/bin/zsh
# Site Audit close-up stills, local Draw Things, strictly one generate at a time.
export DRAWTHINGS_MODELS_DIR=~/Flowtronix/models/draw-things
cd "$(dirname "$0")/.."
S="golden hour oil and gas refinery, low warm amber sun raking from the left, deep teal shadows, steel pipe racks and columns softly out of focus behind, cinematic 35mm photograph, sharp detail, no people, no text, no logos"
gen(){ # name seed prompt
  [ -f "art/close/$1.png" ] && return
  draw-things-cli generate --offline --model flux_2_klein_9b_q8p.ckpt --prompt "$3, $S" --width 768 --height 768 --seed $2 --disable-preview --output "art/close/$1.png" >> gen/gen.log 2>&1
  echo "$1 exit $?" >> gen/gen.log
}
gen head 5 "Looking up from below at a loose steel spanner lying on an overhead steel grating walkway, a bundle of pipes above, the underside of the grating in sharp focus"
gen dropped 7 "A hammer and a roll of tape resting on the very edge of a high steel platform with no handrail in view, steel deck plate, the plant far below out of focus"
gen hearing 3 "Close-up of a large industrial gas compressor skid on a concrete pad, steel casing, painted pipework and silencer, heat shimmer"
gen respiratory 9 "A striped wind sock on a pole and an amber gas warning beacon beside a vent stack with a thin plume of vapour drifting, evening sky"
gen fall 4 "Looking up a steel caged safety ladder fixed to the side of a tall distillation column, hoop cage rungs, converging perspective"
gen hand 6 "Close-up of a red handwheel gate valve manifold on oily black pipework, flanges and bolts glistening with oil, small drips"
gen vest 8 "A yellow forklift truck parked on a gravel plant road beside pipe racks, seen from low angle, long shadow across wet gravel"
gen eye 2 "Low golden sun flaring and glaring through the gaps of a steel pipe rack, strong lens flare and bright glare, dust particles floating in the beam"
echo done >> gen/gen.log
