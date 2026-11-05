#!/bin/zsh
cd "$(dirname "$0")"
TAIL=" Full-length shot, the whole body from boots to above the head, exactly the same framing and camera distance as the first image. Same man, same face, same pose, same coverall, same background. The product looks exactly like the reference: same colours, shape and markings."
./run.sh 01-glasses-lightning.png av-sg30-white.png "The man from the first image now wears the safety glasses shown in the second image, on his face over his eyes with the arms open behind his ears.$TAIL" || exit
grep -q "01-glasses-lightning.png\] rc=0" bench.log || exit
./run.sh 02-helmet-lightning.png aves-titan-av-841r-nv-white.png "The man from the first image now wears the white full-brim hard hat shown in the second image, on his head.$TAIL"
./run.sh 03-gloves-lightning.png hg-2230-rubber-neoprene-gloves-white.png "The man from the first image now wears the black rubber gauntlet gloves shown in the second image, on both hands, cuffs over the sleeves.$TAIL"
