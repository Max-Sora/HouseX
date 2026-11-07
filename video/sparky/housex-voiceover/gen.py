"""HouseX 演示视频旁白：用 Breeze TTS 2 环境的 python 一次加载、按顺序念完 lines.txt 的每一行（名字|英文），
把每段 wav 原子写到 /home/sparky/workspace/housex-voiceover/out/<名>.wav，结果摘要写进 reply.txt。
生成脚本 _breeze_gen.py 拷自 tools/speak/_speak_gen.py（任务文件夹自给自足，§3.4）。"""
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
HOME = Path("/home/joyzhang14")
TTS_REPO = HOME / "apps/breeze-tts"              # Breeze 推理代码与 venv（同 speak 工具）
TTS_PY = TTS_REPO / ".venv/bin/python"
TTS_CKPT = HOME / "models/breeze-tts-2"
VOICE = HOME / "research/voicestudio/sparky-voice"
OUT = Path("/home/sparky/workspace/housex-voiceover/out")
MOOD = "自信、放松、带一点冷幽默的英文旁白，像在跟朋友聊天，语速稍快，咬字清楚"

run_dir = Path(os.environ.get("STB_RUN_DIR") or HERE)
lines = [l.split("|", 1) for l in (HERE / "lines.txt").read_text().splitlines() if l.strip()]
for p, what in ((TTS_PY, "Breeze 环境"), (TTS_CKPT / "config.json", "Breeze 权重"), (VOICE / "voice.json", "声音配置")):
    if not p.exists():
        sys.exit(f"{what}不在：{p}")

job = run_dir / "job.json"
job.write_text(json.dumps({"ckpt": str(TTS_CKPT), "repo": str(TTS_REPO), "voice_dir": str(VOICE),
                           "items": [{"out": str(run_dir / f"{name}.wav"), "text": text, "instruct": MOOD} for name, text in lines]},
                          ensure_ascii=False))
env = {**os.environ, "HF_HOME": str(run_dir / "hf"), "HF_HUB_OFFLINE": "1", "TRANSFORMERS_OFFLINE": "1",
       "HF_HUB_DISABLE_TELEMETRY": "1"}
lib = next((TTS_REPO / ".venv").glob("lib/python3*/site-packages/nvidia/cu13/lib"), None)
if lib:
    env["LD_LIBRARY_PATH"] = str(lib)  # 声码器要 NVRTC 现编内核（同 speak 工具）
r = subprocess.run([str(TTS_PY), str(HERE / "_breeze_gen.py"), str(job)], env=env, capture_output=True, text=True)
sys.stderr.write(r.stderr[-6000:])
print(r.stdout)
if r.returncode:
    sys.exit(r.returncode)

summary = json.loads(r.stdout.strip().splitlines()[-1])
OUT.mkdir(parents=True, exist_ok=True)
rows = []
for (name, _), item in zip(lines, summary["items"]):
    tmp = OUT / f".{name}.wav.tmp"
    shutil.copyfile(item["out"], tmp)
    os.replace(tmp, OUT / f"{name}.wav")
    rows.append(f"{name}: {item['audio_s']} s（生成 {item['seconds']} s）")
reply = f"HouseX 旁白念好了（加载 {summary['load_s']} s），在 {OUT}/：\n" + "\n".join(rows)
Path(os.environ.get("STB_REPLY_FILE") or run_dir / "reply.txt").write_text(reply)
print(reply)
