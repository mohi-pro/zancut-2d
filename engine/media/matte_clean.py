"""Keep only the main speaker in a person matte (the AI model keeps every person in frame).

usage: engine/.venv/bin/python engine/matte_clean.py <in.webm> <out.webm> [--fps 30]
Per frame: connected components of the alpha; keep the blob that best continues the previous frame's
subject (overlap, then size), feather its edge, multiply the alpha. Output VP9 + alpha WebM.
"""
import argparse
import subprocess
import sys

import cv2
import numpy as np


def probe(path):
    out = subprocess.check_output(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                                   "stream=width,height", "-of", "csv=p=0", path], text=True)
    w, h = out.strip().split(",")[:2]
    return int(w), int(h)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("inp")
    ap.add_argument("out")
    ap.add_argument("--fps", default="30")
    ap.add_argument("--quality", default="", help="write a JSON verdict on the outline here")
    a = ap.parse_args()
    W, H = probe(a.inp)
    dec = subprocess.Popen(["ffmpeg", "-v", "error", *(["-c:v", "libvpx-vp9"] if a.inp.endswith(".webm") else []), "-i", a.inp, "-f", "rawvideo", "-pix_fmt", "rgba", "-"],
                           stdout=subprocess.PIPE)
    enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", f"{W}x{H}", "-r", a.fps, "-i", "-",
                            "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-b:v", "0", "-crf", "28", "-row-mt", "1",
                            "-deadline", "realtime", "-cpu-used", "8", "-auto-alt-ref", "0", "-metadata:s:v:0", "alpha_mode=1", a.out],
                           stdin=subprocess.PIPE)
    size = W * H * 4
    prev = None
    n = 0
    empty = multi = jumps = 0  # frames with no speaker, with other people in shot, with a sudden outline change
    last_area = None
    k_dil = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (25, 25))
    k_sep = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (41, 41))
    k_grow = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (49, 49))
    while True:
        buf = dec.stdout.read(size)
        if len(buf) < size:
            break
        f = np.frombuffer(buf, np.uint8).reshape(H, W, 4).copy()
        alpha = f[:, :, 3]
        full = (alpha > 90).astype(np.uint8)
        # erode to break thin joins where other people overlap the speaker, pick, then grow back inside the mask
        m = cv2.erode(full, k_sep)
        cnt, lab, stats, cent = cv2.connectedComponentsWithStats(m, 8)
        big = [i for i in range(1, cnt) if stats[i, cv2.CC_STAT_AREA] >= 0.01 * W * H]
        if len(big) > 1:
            multi += 1
        if not big:
            empty += 1
        if cnt > 1:
            best, score = 1, -1.0
            for i in range(1, cnt):
                area = stats[i, cv2.CC_STAT_AREA]
                if area < 0.001 * W * H:
                    continue
                if prev is not None:
                    ov = np.count_nonzero(prev[lab == i]) / max(1, area)
                    sc = ov * 10 + area / (W * H)
                else:
                    cx = cent[i][0] / W
                    sc = area / (W * H) * (1.2 - abs(cx - 0.5))  # big + central wins on the first frame
                if sc > score:
                    best, score = i, sc
            keep = cv2.dilate((lab == best).astype(np.uint8), k_grow) & full
            area = int(np.count_nonzero(keep))
            if last_area and abs(area - last_area) > 0.35 * last_area:
                jumps += 1
            last_area = area
            prev = cv2.dilate(keep, k_dil)
            soft = cv2.GaussianBlur(cv2.dilate(keep, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))).astype(np.float32), (0, 0), 3)
            f[:, :, 3] = (alpha.astype(np.float32) * np.clip(soft, 0, 1)).astype(np.uint8)
        enc.stdin.write(f.tobytes())
        n += 1
    enc.stdin.close()
    enc.wait()
    dec.wait()
    # unreliable: the speaker is often missing, the outline jumps, or other people share most of the shot
    why = []
    if n and empty / n > 0.15:
        why.append(f"no speaker found in {round(100 * empty / n)}% of frames")
    if n and jumps / n > 0.06:
        why.append(f"outline jumps in {round(100 * jumps / n)}% of frames")
    if n and multi / n > 0.5:
        why.append(f"other people in {round(100 * multi / n)}% of frames")
    if a.quality:
        import json
        with open(a.quality, "w") as fh:
            json.dump({"frames": n, "empty": empty, "multi": multi, "jumps": jumps, "reliable": not why, "why": "; ".join(why)}, fh)
    print(f'{{"ok": true, "frames": {n}, "out": "{a.out}"}}')
    return 0 if n else 1


if __name__ == "__main__":
    sys.exit(main())
