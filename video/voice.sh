#!/bin/sh
# Generates one narration clip per scene into remotion/public/vo/ and writes their durations.
# Usage: VOICE="Samantha" RATE=178 sh video/voice.sh   (any voice from `say -v '?'`)
set -e
cd "$(dirname "$0")"
VOICE="${VOICE:-Samantha}"
RATE="${RATE:-178}"
mkdir -p remotion/public/vo audio30
printf '{\n' > remotion/src/vo.json
first=1
while IFS='|' read -r id text; do
  say -v "$VOICE" -r "$RATE" -o "audio30/$id.aiff" "$text"
  ffmpeg -v error -y -i "audio30/$id.aiff" -af "loudnorm=I=-16:TP=-1.5:LRA=7" -ar 48000 "remotion/public/vo/$id.wav"
  dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "remotion/public/vo/$id.wav")
  [ $first -eq 1 ] || printf ',\n' >> remotion/src/vo.json
  first=0
  printf '  "%s": {"seconds": %s, "text": "%s"}' "$id" "$dur" "$text" >> remotion/src/vo.json
done < narration30.txt
printf '\n}\n' >> remotion/src/vo.json
echo "voice: $VOICE"; cat remotion/src/vo.json
