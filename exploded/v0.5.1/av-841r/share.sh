#!/bin/sh
# Screenshots the two share-card pages with headless Chrome and writes the JPEGs. Run after `node build.mjs --light`.
cd "$(dirname "$0")" || exit 1
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
shoot() { # page width height out quality
  "$CHROME" --headless=new --hide-scrollbars --force-device-scale-factor=1 --window-size="$2,$3" --screenshot="shots/$4.png" "file://$PWD/$1" >/dev/null 2>&1
  sips -s format jpeg -s formatOptions "$5" "shots/$4.png" --out "assets/$4.jpg" >/dev/null
  echo "$4.jpg $(sips -g pixelWidth -g pixelHeight "assets/$4.jpg" | awk '/pixel/{printf "%s ", $2}') px, $(stat -f %z "assets/$4.jpg") bytes"
}
shoot share-card.html 1200 630 share-card 86
shoot share-card-square.html 600 600 share-card-square 86
