"""
Quick sanity-check for the pyannote diarization pipeline.
Run from the backend directory:

    python test_diarization.py

Steps tested:
  1. HF_TOKEN is present in .env
  2. Pipeline loads without error
  3. Pipeline is callable (catches the 'NoneType not callable' symptom)
  4. Pipeline runs on a short synthetic audio clip (2 seconds of silence)
"""

import os
import sys
import tempfile

from dotenv import load_dotenv
from pathlib import Path

# .env lives at repo root, one level above backend/
load_dotenv(Path(__file__).parent.parent / ".env")

def step(n, msg):
    print(f"[{n}] {msg} ... ", end="", flush=True)

def ok():
    print("OK")

def fail(msg):
    print(f"FAIL\n    {msg}")
    sys.exit(1)


# 1. Check token
step(1, "HF_TOKEN present")
token = os.getenv("HF_TOKEN", "").strip()
if not token:
    fail("HF_TOKEN is not set in .env")
ok()

# 2. Import pyannote
step(2, "Import pyannote.audio")
try:
    import torch
    from pyannote.audio import Pipeline
except ImportError as e:
    fail(f"Import error: {e}")
ok()

# 3. Load pipeline
step(3, "Load pyannote/speaker-diarization-3.1")
try:
    pipeline = Pipeline.from_pretrained(
        "pyannote/speaker-diarization-3.1",
        use_auth_token=token,
    )
except Exception as e:
    fail(f"Pipeline.from_pretrained raised: {e}")

if pipeline is None:
    fail("Pipeline is None — license not accepted or bad token")
ok()

# 4. Check callable
step(4, "Pipeline is callable")
if not callable(pipeline):
    fail("Pipeline object is not callable — model weights likely missing")
ok()

# 5. Move to CPU
step(5, "Move pipeline to CPU")
try:
    pipeline.to(torch.device("cpu"))
except Exception as e:
    fail(f"pipeline.to(cpu) raised: {e}")
ok()

# 6. Run on synthetic audio (2 s of silence)
step(6, "Run pipeline on 2-second silent WAV")
try:
    import wave, struct, math

    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
        tmp_path = f.name

    sample_rate = 16000
    duration = 2  # seconds
    n_samples = sample_rate * duration
    with wave.open(tmp_path, "w") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)  # 16-bit
        wf.setframerate(sample_rate)
        # Tiny bit of noise so pyannote doesn't bail on pure silence
        import random
        samples = [int(random.gauss(0, 50)) for _ in range(n_samples)]
        wf.writeframes(struct.pack(f"<{n_samples}h", *samples))

    result = pipeline(tmp_path)
    os.unlink(tmp_path)
except TypeError as e:
    fail(f"TypeError when calling pipeline — internal component is None: {e}")
except Exception as e:
    fail(f"Pipeline raised: {e}")
ok()

print("\nAll checks passed — diarization pipeline is working correctly.")
