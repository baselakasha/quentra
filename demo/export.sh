#!/usr/bin/env bash
# Usage: ./export.sh [full|medium|short]
# Exports the latest recording to docs/demo[-short].mp4 and a compressed docs/demo[-short].gif.
set -euo pipefail
cd "$(dirname "$0")"

kind=${1:-full}
if [ "$kind" = "short" ]; then
  name=demo-short
  latest=$(ls -t testreel-output/recording-short*.mp4 | head -n 1)
  # Trim the settle time at the start and speed up to ~8s
  filter="setpts=PTS/1.7"
  ffmpeg -loglevel error -y -ss 0.4 -i "$latest" -vf "$filter" -an ../docs/$name.mp4
elif [ "$kind" = "medium" ]; then
  name=demo-medium
  latest=$(ls -t testreel-output/recording-medium*.mp4 | head -n 1)
  # Trim the settle time at the start and speed up slightly to ~30s
  ffmpeg -loglevel error -y -ss 0.4 -i "$latest" -vf "setpts=PTS/1.25" -an ../docs/$name.mp4
else
  name=demo
  latest=$(ls -t testreel-output/recording-2*.mp4 | head -n 1)
  cp "$latest" ../docs/$name.mp4
fi

ffmpeg -loglevel error -y -i ../docs/$name.mp4 \
  -vf "fps=10,scale=900:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=96[p];[b][p]paletteuse=dither=bayer:bayer_scale=4" \
  ../docs/$name.gif
echo "Wrote docs/$name.mp4 and docs/$name.gif"
