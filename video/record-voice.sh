#!/bin/sh
# Record the HouseX narration with a real voice, one line at a time, from the Mac microphone.
#   sh video/record-voice.sh               record all lines (Enter = start, Enter = stop, then keep / play / redo)
#   sh video/record-voice.sh demo          re-record just one line
#   sh video/record-voice.sh --use-files   use recordings already in video/voice-human/ (e.g. from a phone:
#                                          audience.m4a, problem.m4a, ... any format ffmpeg reads)
#   MIC=1 sh video/record-voice.sh         pick another microphone (the list prints at the start)
# Afterwards: cd video/remotion && npm run render
set -e
cd "$(dirname "$0")"
mkdir -p voice-human remotion/public/vo
ONLY="$1"

if [ "$ONLY" != "--use-files" ]; then
  echo "Microphones:"
  ffmpeg -hide_banner -f avfoundation -list_devices true -i "" 2>&1 | sed -n '/audio devices/,$p' | sed 's/^.*\] //' | tail -n +2
  MIC="${MIC:-0}"
  echo "Using microphone $MIC. Speak naturally, about arm's length from the mic, in a quiet room."
  printf "Press Enter to begin..."; read _
  while IFS='|' read -r id text <&3; do
    [ -n "$ONLY" ] && [ "$ONLY" != "$id" ] && continue
    while :; do
      clear
      echo "Line: $id"; echo; echo "    $text"; echo
      printf "Enter = START recording "; read _
      ffmpeg -hide_banner -loglevel error -y -f avfoundation -i ":$MIC" -ac 1 -ar 48000 "voice-human/$id.wav" &
      pid=$!
      printf "Recording... Enter = STOP "; read _
      kill -INT "$pid" 2>/dev/null || true
      wait "$pid" 2>/dev/null || true
      printf "Enter = keep, p = play, r = redo: "; read a
      if [ "$a" = "p" ]; then afplay "voice-human/$id.wav"; printf "Enter = keep, r = redo: "; read a; fi
      [ "$a" = "r" ] || break
    done
  done 3< narration30.txt
fi

# Trim silence at both ends, even out loudness, and time the video to the clips.
for id in audience problem purpose demo payoff; do
  src=$(ls voice-human/"$id".* 2>/dev/null | head -1)
  [ -n "$src" ] || { echo "Missing recording for $id in video/voice-human/"; exit 1; }
  ffmpeg -v error -y -i "$src" \
    -af "highpass=f=70,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.15,areverse,loudnorm=I=-16:TP=-1.5:LRA=7" \
    -ac 1 -ar 48000 "remotion/public/vo/$id.wav"
done
python3 - <<'EOF'
import json, subprocess
lines = [l.rstrip("\n").split("|", 1) for l in open("narration30.txt") if l.strip()]
out = {}
for id, text in lines:
    d = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f"remotion/public/vo/{id}.wav"]))
    out[id] = {"seconds": round(d, 3), "text": text}
json.dump(out, open("remotion/src/vo.json", "w"), indent=2)
total = sum(v["seconds"] for v in out.values())
print({k: v["seconds"] for k, v in out.items()}, f"speech {total:.1f} s, video about {total + 3.2:.1f} s")
EOF
echo "Done. Now: cd video/remotion && npm run render"
