#!/bin/sh
# Warms the skin of a body picture to wheatish (owner 2026-10-17: "change Reem's skintone into wheatish", then "Warm the pictures"),
# leaving the studio background, hair and black clothes as they are: the mask is the skin's redness (Lab a* above ~0.53; the beige
# background, shadows, hair and black fabric sit near 0.50), small blobs merged away, edges softened.
# Usage: sh tools/face/warm-skin.sh <in> <out> [crop, e.g. 720x1360+0+320] [width, default 576]
set -e
in=$1; out=$2; crop=${3:-}; width=${4:-576}
tmp=$(mktemp -d)
if [ -n "$crop" ]; then convert "$in" -crop "$crop" +repage -resize "${width}x" "$tmp/c.png"; else convert "$in" -resize "${width}x" "$tmp/c.png"; fi
convert "$tmp/c.png" -colorspace Lab -channel G -separate +channel -level 52%,54.5% -threshold 50% \
  -define connected-components:area-threshold=4000 -define connected-components:mean-color=true -connected-components 8 -blur 0x2 "$tmp/m.png"
convert "$tmp/c.png" -channel G -evaluate multiply 0.92 -channel B -evaluate multiply 0.81 +channel -modulate 85,88 "$tmp/t.png"
convert "$tmp/c.png" "$tmp/t.png" "$tmp/m.png" -composite -quality 92 "$out"
rm -r "$tmp"
