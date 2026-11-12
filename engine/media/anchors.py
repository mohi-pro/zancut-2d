"""Anchor words for a track whose word times went wrong: mlx-whisper heard in short windows.

    python anchors.py <audio.wav> <out.json> --lang bn

A long noisy take (music or room noise under the voice) makes whisper skip whole stretches when it listens to all of it at
once, and the aligner then has nothing to hold on to. Short windows (6 s, a 1 s overlap) with no memory of the window before
keep it hearing every stretch. Its spelling may be poor; only the times matter: align.py --anchors matches the real words
to these and aligns from there. Writes [{w, s, e, p}] in track seconds; prints {"ok": true, "anchors": n}.
Runs in Zancut's Python (~/.cache/zancut/py, scripts/setup-python.sh), the one with mlx-whisper.
"""
import argparse
import json
import subprocess
import sys
import tempfile
import os

WIN, STEP = 6.0, 5.0


def duration(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path], capture_output=True, text=True).stdout
    return float(out.strip() or 0)


def main():
    a = argparse.ArgumentParser()
    a.add_argument("audio")
    a.add_argument("out")
    a.add_argument("--lang", default="en")
    a.add_argument("--model", default="mlx-community/whisper-large-v3-mlx")
    a = a.parse_args()
    import mlx_whisper

    total, got = duration(a.audio), []
    with tempfile.TemporaryDirectory() as tmp:
        t0 = 0.0
        while t0 < total - 0.3:
            piece = os.path.join(tmp, "w.wav")
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(t0), "-t", str(WIN), "-i", a.audio, "-ac", "1", "-ar", "16000", piece], check=True)
            r = mlx_whisper.transcribe(piece, path_or_hf_repo=a.model, language=a.lang, word_timestamps=True, condition_on_previous_text=False,
                                       temperature=0.0, no_speech_threshold=None)
            ws = [w for s in r.get("segments", []) for w in s.get("words", [])]
            # a word said 3+ times in a row in one window is whisper looping on noise, not speech
            keep = [w for i, w in enumerate(ws) if not (i >= 2 and w["word"].strip() == ws[i - 1]["word"].strip() == ws[i - 2]["word"].strip())
                    and not (i + 2 < len(ws) and w["word"].strip() == ws[i + 1]["word"].strip() == ws[i + 2]["word"].strip())]
            for w in keep:
                s, e = t0 + float(w["start"]), t0 + float(w["end"])
                # the overlap: each window owns its middle (its first 0.5 s and last 0.5 s belong to the neighbours)
                lo, hi = (t0 + 0.5 if t0 > 0 else 0), (t0 + WIN - 0.5 if t0 + WIN < total else total + 1)
                if lo <= s < hi and float(w.get("probability", 0)) >= 0.15 and w["word"].strip():
                    got.append({"w": w["word"].strip(), "s": round(s, 3), "e": round(e, 3), "p": round(float(w.get("probability", 0)), 3)})
            t0 += STEP
    got.sort(key=lambda x: x["s"])
    json.dump(got, open(a.out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(json.dumps({"ok": True, "anchors": len(got)}))


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(json.dumps({"ok": False, "why": str(e)[:300]}))
        sys.exit(0)
