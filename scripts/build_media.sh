#!/usr/bin/env bash
# Optimize source photos/videos -> web assets with friendly slugs.
# Photos -> assets/img/<slug>.{jpg,webp} + <slug>-thumb.{jpg,webp}
# Videos -> assets/video/<slug>.mp4 (H.264, faststart) + <slug>-poster.jpg
set -u
cd "$(dirname "$0")/.." || exit 1
SRC="fathers_day_2026_photos_and_vids"
mkdir -p assets/img assets/video
LOG="scripts/build_media.log"; : > "$LOG"
echo "media build start" >> "$LOG"

PHOTOS="
IMG_4379.HEIC::arch-suits
IMG_4301.HEIC::bali-heart
IMG_4883.jpg::vintage-two-boys
Resized_Resized_20260524_104857_67238497023566_1780198682568_1780198686729.JPEG::vintage-superman-baby
IMG_0964.HEIC::vintage-captain-hat
IMG_4884.jpg::vintage-resort-grandfather
IMG_4468.HEIC::tanzania-clinic
lp_image.HEIC::community-elder-care
IMG_4479.HEIC::pool-kiss
IMG_7297.HEIC::laughing-in-bed
IMG_3649.JPG::gym-mirror
IMG_5452.JPG::pool-table
IMG_3864.JPG::ucla-hug
PHOTO-2026-05-18-11-01-41.JPG::stadium-hug
IMG_1623.HEIC::mirror-roses
IMG_3978.HEIC::seychelles-swing
IMG_7514.HEIC::morocco-atlas
IMG_1563.HEIC::santiago-rock
IMG_1679.HEIC::panama-bike
IMG_1246.JPG::plane-sleeping
IMG_2777.JPG::car-selfie
Resized_Resized_20260331_201632_1775013435027_1775013439377.JPEG::pajamas-pose
IMG_5416.HEIC::reading-harvard
IMG_3564.JPG::with-wife-restaurant
IMG_4605.HEIC::hotel-family-selfie
5a14f06d-fd59-43cd-8e55-df381fb86e33.JPG::with-mom-couch
IMG_7097.HEIC::family-floral-event
IMG_2183.JPG::family-porch
d41a0879-609b-4be5-ba14-fe85dc88696c.JPG::grandmothers-family
02ea06f5-1d43-472b-b54d-483ec7cc25fa.JPG::family-restaurant
IMG_3857.JPG::mall-brown-bag
IMG_3801.JPG::vintage-prints
"

VIDEOS="
99f3672157f244f98917fc3466ade5b2.MOV::caring-for-mom
97753177-D4AE-4616-9E5A-FDF3B944AB5A.MP4::scrubs-hug-mom
IMG_3613.MOV::mom-selfie
.recorded-1535136505.MP4::scrubs-clinic
IMG_4886.MOV::aga-khan-dinner
IMG_1902.MOV::ipn-summit-panel
IMG_0355.MOV::dancing-together
d868c3bd-833f-42c4-ad7b-0964ee3bea88.MP4::sweeping
IMG_6437.MOV::goofy-selfie
IMG_3848.MOV::couch-cuddle
IMG_8601.MOV::talking-walk
e11a5e7e-0222-4c97-812e-681e469d0b5a.MP4::party-dancing
2023-07-22_213323937.MP4::imaan-21-party
.recorded-10033502772459.MP4::night-car
"

echo "$PHOTOS" | while IFS='::' read -r orig _ slug; do
  [ -z "${orig:-}" ] && continue
  src="$SRC/$orig"
  [ -f "$src" ] || { echo "MISSING PHOTO $orig" >> "$LOG"; continue; }
  sips -s format jpeg -Z 1800 -s formatOptions 82 "$src" --out "assets/img/$slug.jpg" >/dev/null 2>&1
  sips -s format jpeg -Z 800  -s formatOptions 80 "$src" --out "assets/img/$slug-thumb.jpg" >/dev/null 2>&1
  cwebp -quiet -q 82 "assets/img/$slug.jpg"       -o "assets/img/$slug.webp" 2>/dev/null
  cwebp -quiet -q 78 "assets/img/$slug-thumb.jpg" -o "assets/img/$slug-thumb.webp" 2>/dev/null
  echo "PHOTO ok $slug" >> "$LOG"
done

echo "$VIDEOS" | while IFS='::' read -r orig _ slug; do
  [ -z "${orig:-}" ] && continue
  src="$SRC/$orig"
  [ -f "$src" ] || { echo "MISSING VIDEO $orig" >> "$LOG"; continue; }
  dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$src" 2>/dev/null)
  t=$(awk -v d="${dur:-0}" 'BEGIN{ if(d>0) printf "%.2f", d*0.2; else print "0.5"}')
  ffmpeg -nostdin -loglevel error -i "$src" \
    -vf "scale=w=1280:h=1280:force_original_aspect_ratio=decrease:force_divisible_by=2" \
    -c:v libx264 -preset veryfast -crf 27 -pix_fmt yuv420p \
    -c:a aac -b:a 96k -movflags +faststart -y "assets/video/$slug.mp4" >/dev/null 2>&1
  ffmpeg -nostdin -loglevel error -ss "$t" -i "$src" -frames:v 1 \
    -vf "scale=w=1280:h=1280:force_original_aspect_ratio=decrease" -y "assets/video/$slug-poster.jpg" >/dev/null 2>&1
  cwebp -quiet -q 80 "assets/video/$slug-poster.jpg" -o "assets/video/$slug-poster.webp" 2>/dev/null
  echo "VIDEO ok $slug" >> "$LOG"
done

echo "media build done" >> "$LOG"
echo "IMG count: $(ls assets/img | wc -l)" >> "$LOG"
echo "VIDEO count: $(ls assets/video | wc -l)" >> "$LOG"
du -sh assets/img assets/video >> "$LOG" 2>&1

# --- added later: vintage kid photos (dad with Zain & Reza) ---
for pair in "IMG_9954.JPG::vintage-nap" "IMG_9957.JPG::vintage-shower" "IMG_9959.JPG::vintage-boys-floor"; do
  orig="${pair%%::*}"; slug="${pair##*::}"; src="$SRC/$orig"
  [ -f "$src" ] || continue
  sips -s format jpeg -Z 1800 -s formatOptions 82 "$src" --out "assets/img/$slug.jpg" >/dev/null 2>&1
  sips -s format jpeg -Z 800  -s formatOptions 80 "$src" --out "assets/img/$slug-thumb.jpg" >/dev/null 2>&1
  cwebp -quiet -q 82 "assets/img/$slug.jpg"       -o "assets/img/$slug.webp" 2>/dev/null
  cwebp -quiet -q 78 "assets/img/$slug-thumb.jpg" -o "assets/img/$slug-thumb.webp" 2>/dev/null
done
