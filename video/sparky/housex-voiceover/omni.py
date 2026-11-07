"""HouseX 演示视频旁白（美式男声）：VoiceStudio 的 OmniVoice 先按描述设计一次声音，再用它克隆念 lines.txt 的每一行，
所以 5 段是同一个声音。每段 wav 原子写到 /home/sparky/workspace/housex-voiceover/out/<名>.wav，摘要写进 reply.txt。"""
import glob
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
PY = Path("/home/joyzhang14/apps/VoiceStudio/.venv/bin/python")
MODEL = sorted(glob.glob("/home/joyzhang14/models/voicestudio/hf/hub/models--k2-fsa--OmniVoice/snapshots/*"))[-1]
OUT = Path("/home/sparky/workspace/housex-voiceover/out")
INSTRUCT = "male, middle-aged, moderate pitch, american accent"   # VoiceStudio 的「美式播报」预设
REF_TEXT = "Hi, I'm the HouseX narrator. Let me walk you through how a permit pre-check works."

run_dir = Path(os.environ.get("STB_RUN_DIR") or HERE)
lines = [l.split("|", 1) for l in (HERE / "lines.txt").read_text().splitlines() if l.strip()]
work = run_dir / "omni"
work.mkdir(parents=True, exist_ok=True)
job = run_dir / "omni-job.json"
job.write_text(json.dumps({"model": MODEL, "instruct": INSTRUCT, "ref_text": REF_TEXT, "seed": 20261107, "out_dir": str(work),
                           "items": [{"id": i, "text": t} for i, t in lines]}, ensure_ascii=False))
env = {**os.environ, "HF_HUB_OFFLINE": "1", "TRANSFORMERS_OFFLINE": "1", "HF_HUB_DISABLE_TELEMETRY": "1", "HF_HOME": str(run_dir / "hf")}
r = subprocess.run([str(PY), str(HERE / "_omni_gen.py"), str(job)], env=env, capture_output=True, text=True)
sys.stderr.write(r.stderr[-6000:])
print(r.stdout)
if r.returncode:
    sys.exit(r.returncode)

summary = json.loads(r.stdout.strip().splitlines()[-1])
OUT.mkdir(parents=True, exist_ok=True)
rows = []
for item in summary["items"] + [{"id": "ref", "out": str(work / "ref.wav"), "audio_s": "", "seconds": ""}]:
    tmp = OUT / f".{item['id']}.wav.tmp"
    shutil.copyfile(item["out"], tmp)
    os.replace(tmp, OUT / f"{item['id']}.wav")
    rows.append(f"{item['id']}: {item['audio_s']} s")
reply = f"HouseX 旁白（OmniVoice 美式男声，加载 {summary['load_s']} s）在 {OUT}/：\n" + "\n".join(rows)
Path(os.environ.get("STB_REPLY_FILE") or run_dir / "reply.txt").write_text(reply)
print(reply)
