"""Word-level transcription on Apple Silicon via mlx-whisper.

usage: engine/.venv/bin/python engine/transcribe.py <audio.wav> <out.json> [--lang bn] [--model large|turbo] [--prompt "..."]
Writes a flat word array: [{"text","start","end","p"}]  (p = word probability)
"""
import argparse
import json
import sys

MODELS = {
    "large": "mlx-community/whisper-large-v3-mlx",
    "turbo": "mlx-community/whisper-large-v3-turbo",
}

# Seeds Whisper's vocabulary/style. Bangla prompt keeps it in Bengali script
# (otherwise it sometimes romanises or translates).
DEFAULT_PROMPTS = {
    "bn": "আজকে আমরা কথা বলব। এটা খুবই গুরুত্বপূর্ণ, তাই না? চলুন শুরু করি।",
    "en": "",
}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("audio")
    ap.add_argument("out")
    ap.add_argument("--lang", default="bn")
    ap.add_argument("--model", default=None)
    ap.add_argument("--prompt", default=None)
    ap.add_argument("--chunks", default=None, help="speech.json: transcribe each group of speech islands separately (no long-silence loops)")
    a = ap.parse_args()

    import mlx_whisper

    model = a.model or ("large" if a.lang == "bn" else "turbo")
    repo = MODELS.get(model, model)
    prompt = a.prompt if a.prompt is not None else DEFAULT_PROMPTS.get(a.lang, "")
    if a.chunks:
        return chunked(a, mlx_whisper, repo, prompt)
    res = mlx_whisper.transcribe(
        a.audio,
        path_or_hf_repo=repo,
        language=a.lang,
        word_timestamps=True,
        condition_on_previous_text=False,
        initial_prompt=prompt or None,
        temperature=(0.0, 0.2, 0.4),
        no_speech_threshold=0.6,
        hallucination_silence_threshold=1.0,
        verbose=None,
    )
    words = []
    for s in res.get("segments", []):
        for w in s.get("words", []):
            t = w["word"].strip()
            if not t:
                continue
            words.append({
                "text": t,
                "start": round(float(w["start"]), 3),
                "end": round(float(w["end"]), 3),
                "p": round(float(w.get("probability", 1.0)), 3),
            })
    with open(a.out, "w", encoding="utf8") as f:
        json.dump(words, f, ensure_ascii=False, indent=1)
    print(json.dumps({"ok": True, "model": repo, "words": len(words), "language": res.get("language")}))


def chunked(a, mlx_whisper, repo, prompt):
    import numpy as np
    import subprocess
    spec = json.load(open(a.chunks))
    if "pieces" in spec:
        # exact pieces (server/transcribe.mjs pieces(): 4-9 s, cut at the quietest moment): each one as it is
        groups = [[(s0, s1)] for s0, s1 in spec["pieces"]]
    else:
        # group islands into ~4-9s chunks, padded 0.15s
        groups, cur = [], []
        for s0, s1 in spec["islands"]:
            if cur and (s1 - cur[0][0] > 9 or s0 - cur[-1][1] > 1.2):
                groups.append(cur); cur = []
            cur.append((s0, s1))
        if cur:
            groups.append(cur)
    exact = "pieces" in spec
    pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", a.audio, "-f", "s16le", "-ac", "1", "-ar", "16000", "-"], capture_output=True).stdout
    audio = np.frombuffer(pcm, np.int16).astype(np.float32) / 32768.0
    words = []
    for g in groups:
        t0 = max(0.0, g[0][0] - 0.15); t1 = g[-1][1] + 0.15
        seg = audio[int(t0 * 16000): int(t1 * 16000)]
        res = mlx_whisper.transcribe(seg, path_or_hf_repo=repo, language=a.lang, word_timestamps=True,
                                     condition_on_previous_text=False, initial_prompt=prompt or None,
                                     temperature=(0.0, 0.2, 0.4), verbose=None)
        for s in res.get("segments", []):
            for w in s.get("words", []):
                t = w["word"].strip()
                ws, we = t0 + float(w["start"]), t0 + float(w["end"])
                # exact pieces touch: a word heard in the padding belongs to the piece its middle is in (no word twice)
                if t and (not exact or g[0][0] <= (ws + we) / 2 < g[-1][1]):
                    words.append({"text": t, "start": round(ws, 3), "end": round(we, 3),
                                  "p": round(float(w.get("probability", 1.0)), 3)})
    with open(a.out, "w", encoding="utf8") as f:
        json.dump(words, f, ensure_ascii=False, indent=1)
    print(json.dumps({"ok": True, "model": repo, "words": len(words), "chunks": len(groups)}))
    return 0


if __name__ == "__main__":
    sys.exit(main())
