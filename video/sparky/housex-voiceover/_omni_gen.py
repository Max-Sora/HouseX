"""HouseX 旁白（男声）的生成脚本：用 VoiceStudio 自带环境的 python 跑 OmniVoice（k2-fsa，本地权重、离线）。
  _omni_gen.py <job.json>
job：{"model": 权重目录, "instruct": 声音描述, "ref_text": 参考句, "seed": 随机种子, "out_dir": 输出目录, "items": [{"id", "text"}]}
先按 instruct 设计一次声音、念参考句存成 ref.wav，再用 ref.wav 克隆念每一段：全部是同一个声音。
stdout 最后一行打 JSON 摘要。"""
import json
import sys
import time
from pathlib import Path

import torch
import torchaudio

sys.path.insert(0, "/home/joyzhang14/apps/VoiceStudio")
from omnivoice.models.omnivoice import OmniVoice  # noqa: E402

job = json.loads(Path(sys.argv[1]).read_text())
out = Path(job["out_dir"])
t0 = time.monotonic()
torch.manual_seed(job["seed"])
model = OmniVoice.from_pretrained(job["model"], device_map="cuda", dtype=torch.float16)
res = {"load_s": round(time.monotonic() - t0, 1), "sr": model.sampling_rate, "items": []}

ref = out / "ref.wav"
torch.manual_seed(job["seed"])
audio = model.generate(text=job["ref_text"], language="English", instruct=job["instruct"])[0]
torchaudio.save(str(ref), audio, model.sampling_rate)

for it in job["items"]:
    t = time.monotonic()
    torch.manual_seed(job["seed"])
    audio = model.generate(text=it["text"], language="English", ref_audio=str(ref), ref_text=job["ref_text"])[0]
    path = out / f"{it['id']}.wav"
    torchaudio.save(str(path), audio, model.sampling_rate)
    res["items"].append({"id": it["id"], "out": str(path), "seconds": round(time.monotonic() - t, 1),
                         "audio_s": round(audio.shape[-1] / model.sampling_rate, 2)})
print(json.dumps(res, ensure_ascii=False))
