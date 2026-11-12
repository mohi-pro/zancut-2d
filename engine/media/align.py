"""Tighten word timings with WhisperX forced alignment (wav2vec2): exact word starts/ends for clean auto cuts.

    python align.py <audio.wav> <words.json> <out.json> --lang bn

words.json = [{text, start, end, ...}] from the transcriber (Parakeet, mlx-whisper, or Gemini's words on whisper's
times). The words are grouped into short segments, WhisperX aligns each segment's text to the audio, and every word
whose alignment came back gets the new start/end; the rest keep their old times. Text and order never change.
Runs in its own Python (~/.cache/zancut/wx, scripts/setup-whisperx.sh) so it can never break the transcriber.
Every aligned word also gets "conf" (the aligner's 0-1 score for it). Prints
{"ok": true, "moved": n, "words": n, "conf": average, "aligned": n, "low": share of words under 0.5} or {"ok": false, "why": "..."}.
A low average means the words do not match the sound (wrong spelling, wrong script): the caller then asks Gemini for the words.

--anchors anchors.json (from anchors.py): the old times are not trusted at all (a noisy take where they drifted by seconds).
The words are matched in order to the anchors whisper heard in short windows (by how alike they are written), the words
between two anchors are spread over the time between them by their length, and the aligner works from those times.
"""
import argparse
import difflib
import json
import re
import sys

# WhisperX has no default Bangla model: this one is Apache-2.0 (commercial use is fine).
EXTRA_MODELS = {"bn": "arijitx/wav2vec2-xls-r-300m-bengali"}


def segments(words, gap=0.6, most=14):
    out, cur = [], []
    for i, w in enumerate(words):
        if cur and (w["start"] - words[cur[-1]]["end"] > gap or len(cur) >= most):
            out.append(cur)
            cur = []
        cur.append(i)
    if cur:
        out.append(cur)
    return out


# Bangla written loosely: vowel signs, hasant, nukta and punctuation dropped, so "বাচ্চার" and "বাচ্যার" look alike
SKIP = re.compile(r"[\u0981-\u0983\u09bc\u09be-\u09cd\u09d7\u200c\u200d.,!?;:'\"\u0964\u0965()\-]")


def norm(t):
    return SKIP.sub("", t.lower().strip())


def from_anchors(words, anchors):
    """Times for the words from the anchors: an in-order match (most alike pairs), then the rest spread by length."""
    W, A = [norm(w["text"]) for w in words], [norm(x["w"]) for x in anchors]
    n, m = len(W), len(A)
    sim = lambda i, j: difflib.SequenceMatcher(None, W[i], A[j]).ratio() if W[i] and A[j] else 0.0
    best = [[0.0] * (m + 1) for _ in range(n + 1)]
    for i in range(n - 1, -1, -1):
        for j in range(m - 1, -1, -1):
            v = sim(i, j)
            best[i][j] = max(best[i + 1][j], best[i][j + 1], best[i + 1][j + 1] + (v if v >= 0.5 else -1))
    pairs, i, j = {}, 0, 0
    while i < n and j < m:
        v = sim(i, j)
        if v >= 0.5 and abs(best[i][j] - (best[i + 1][j + 1] + v)) < 1e-9:
            pairs[i] = anchors[j]; i += 1; j += 1
        elif best[i][j] == best[i + 1][j]:
            i += 1
        else:
            j += 1
    if len(pairs) < max(3, n // 6):
        return 0
    keys = sorted(pairs)
    for k in keys:
        words[k]["start"], words[k]["end"] = pairs[k]["s"], max(pairs[k]["e"], pairs[k]["s"] + 0.05)
    # the words before the first anchor, between two, after the last: spread by length over the time there
    edges = [(-1, None)] + [(k, pairs[k]) for k in keys] + [(n, None)]
    for (a, pa), (b, pb) in zip(edges, edges[1:]):
        gap = list(range(a + 1, b))
        if not gap:
            continue
        t0 = pa["e"] if pa else max(0.0, (pb["s"] if pb else 0.0) - 0.35 * len(gap))
        t1 = pb["s"] if pb else t0 + 0.35 * len(gap)
        lens = [max(1, len(words[k]["text"])) for k in gap]
        tot, at = sum(lens), t0
        for k, L in zip(gap, lens):
            d = (t1 - t0) * L / tot
            words[k]["start"], words[k]["end"] = round(at, 3), round(at + max(0.04, d * 0.9), 3)
            at += d
    return len(pairs)


def sentences(words, most=14):
    """Groups that end on a sentence mark or a long pause (the aligner gets whole phrases with room around them)."""
    out, cur = [], []
    for i, w in enumerate(words):
        if cur and (len(cur) >= most or w["start"] - words[cur[-1]]["end"] > 1.0):
            out.append(cur); cur = []
        cur.append(i)
        if re.search(r"[.!?\u0964,]$", w["text"].strip()) and len(cur) >= 3:
            out.append(cur); cur = []
    if cur:
        out.append(cur)
    return out


def main():
    a = argparse.ArgumentParser()
    a.add_argument("audio")
    a.add_argument("words")
    a.add_argument("out")
    a.add_argument("--lang", default="en")
    a.add_argument("--pad", type=float, default=0.15)  # audio around each group (wider when the times are only rough)
    a.add_argument("--jump", type=float, default=1.5)  # how far a word may move
    a.add_argument("--anchors", default=None)  # anchors.py's words: the old times are replaced first (see above)
    a = a.parse_args()
    words = json.load(open(a.words, encoding="utf-8"))
    matched = None
    if a.anchors:
        matched = from_anchors(words, json.load(open(a.anchors, encoding="utf-8")))
        if not matched:
            print(json.dumps({"ok": False, "why": "the anchors did not match the words"}))
            return
        a.pad, a.jump = max(a.pad, 0.6), max(a.jump, 2.0)
    if not words:
        print(json.dumps({"ok": False, "why": "no words"}))
        return
    try:
        import torch
        import whisperx
    except Exception as e:  # not installed: keep the transcriber's times
        print(json.dumps({"ok": False, "why": f"whisperx missing: {e}"}))
        return
    device = "cpu"  # wav2vec2 on CPU is a few seconds per minute; MPS lacks some CTC ops
    torch.set_num_threads(4)
    try:
        model, meta = whisperx.load_align_model(language_code=a.lang, device=device, model_name=EXTRA_MODELS.get(a.lang))
    except Exception as e:
        print(json.dumps({"ok": False, "why": f"no alignment model for {a.lang}: {str(e)[:160]}"}))
        return
    audio = whisperx.load_audio(a.audio)
    groups = sentences(words) if a.anchors else segments(words)
    segs = [{"text": " ".join(words[i]["text"] for i in g), "start": max(0.0, words[g[0]]["start"] - a.pad), "end": words[g[-1]]["end"] + a.pad} for g in groups]
    moved = 0
    scores = []
    # WhisperX re-splits each segment into sentences: align one group at a time and match its words back in order
    for g, seg in zip(groups, segs):
        res = whisperx.align([seg], model, meta, audio, device, return_char_alignments=False)
        ws = [x for s in res.get("segments", []) for x in s.get("words", [])]
        if len(ws) != len(g) or any(x.get("word", "").strip() != words[i]["text"].strip() for i, x in zip(g, ws)):
            continue  # tokens did not split the same way: keep this group's old times
        for i, x in zip(g, ws):
            s, e = x.get("start"), x.get("end")
            if s is None or e is None or e <= s:
                continue
            w = words[i]
            sc = x.get("score")
            if sc is not None:
                w["conf"] = round(float(sc), 3)
                scores.append(float(sc))
            if abs(s - w["start"]) > a.jump:  # a far jump is a misalignment, not a correction
                continue
            if abs(s - w["start"]) > 0.02 or abs(e - w["end"]) > 0.02:
                moved += 1
            w["start"], w["end"] = round(float(s), 3), round(float(e), 3)
    # keep the order strict: no word may start before the one before it ends
    for k in range(1, len(words)):
        if words[k]["start"] < words[k - 1]["end"]:
            words[k]["start"] = words[k - 1]["end"]
            words[k]["end"] = max(words[k]["end"], words[k]["start"] + 0.02)
    json.dump(words, open(a.out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    conf = round(sum(scores) / len(scores), 3) if scores else None
    low = round(sum(1 for v in scores if v < 0.5) / len(scores), 3) if scores else None
    # words in a group that could not be aligned count against the average: it is the share of the speech we can trust
    if conf is not None and len(scores) < len(words):
        conf = round(conf * len(scores) / len(words), 3)
    print(json.dumps({"ok": True, "moved": moved, "words": len(words), "conf": conf, "aligned": len(scores), "low": low, **({"anchored": matched} if matched else {})}))


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(json.dumps({"ok": False, "why": str(e)[:300]}))
        sys.exit(0)
