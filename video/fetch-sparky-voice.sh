#!/bin/sh
# Pulls the narration recorded by the Sparky task housex-voiceover into the Remotion project.
# Usage: sh video/fetch-sparky-voice.sh   (needs `ssh Sparky` access; then `npm run render` in video/remotion)
set -e
cd "$(dirname "$0")"
SRC=/home/sparky/workspace/housex-voiceover/out
mkdir -p audio-sparky remotion/public/vo
for id in audience problem purpose demo payoff; do
  ssh -o BatchMode=yes Sparky "cat $SRC/$id.wav" > "audio-sparky/$id.wav"
  # Same loudness for every clip; trim leading/trailing silence so scenes start on the voice.
  ffmpeg -v error -y -i "audio-sparky/$id.wav" \
    -af "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.15,areverse,loudnorm=I=-16:TP=-1.5:LRA=7" \
    -ar 48000 "remotion/public/vo/$id.wav"
done
python3 - <<'EOF'
import json, subprocess
lines = [l.rstrip("\n").split("|", 1) for l in open("narration30.txt")]
out = {}
for id, text in lines:
    d = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f"remotion/public/vo/{id}.wav"]))
    out[id] = {"seconds": round(d, 3), "text": text}
json.dump(out, open("remotion/src/vo.json", "w"), indent=2)
print({k: v["seconds"] for k, v in out.items()}, "total", round(sum(v["seconds"] for v in out.values()), 1))
EOF
