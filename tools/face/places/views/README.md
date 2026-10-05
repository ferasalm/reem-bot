# Place crops

Three crops of each place picture in `tools/face/places/` (day and night), so every picture of her shows a different
part of the same room: klein copies a whole room picture's framing (owner 2026-10-05: "90% from the same angle").
`build-places.mjs` packs these into `places.js` instead of the full pictures; `drawPicture` picks one.

Made from each `places/<key>.jpg` (480x480) with ImageMagick:

    convert <key>.jpg -crop 300x300+0+100   +repage -resize 448x448 -quality 84 views/<key>~1.jpg   # left
    convert <key>.jpg -crop 300x300+180+100 +repage -resize 448x448 -quality 84 views/<key>~2.jpg   # right
    convert <key>.jpg -crop 280x280+100+120 +repage -resize 448x448 -quality 84 views/<key>~3.jpg   # closer, centre

After replacing a place picture, cut its crops again and run `node tools/face/build-places.mjs`.
