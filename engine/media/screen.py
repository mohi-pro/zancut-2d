"""Screen tracking for screen recordings, local and free (frame differencing, no AI).

usage: python screen.py <screen.mp4> <out.json> [--fps 4] [--idle 2.2]

Samples the screen recording at 4 frames a second (grey, 320 px wide), compares each frame with the one before, and writes
what happens: when something changes, where (focusRectPct = [x, y, w, h] in % of the screen, tight around the part that
changed again and again), what kind of change it is, and every stretch where nothing moves for longer than --idle seconds
(idleScreen). The device is told from the picture's shape: pc-16:9 or mobile-9:16.

Events: {fromSec, toSec, action: click | type | scroll | open | idle, targetLabel: "", focusRectPct, idleScreen, calloutSuggestion}.
The labels of buttons and fields are not read here: the director gets them from the spoken words and the customer's notes.
Prints {"ok": true, "events": n, "deviceAspect": "..."} or {"ok": false, "why": "..."}.
"""
import argparse
import json
import subprocess
import sys

import cv2
import numpy as np

ACTIVE = 0.0015  # share of pixels that changed for a frame to count as "something moves"


def frames(path, fps, width):
    probe = subprocess.check_output(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height",
                                     "-of", "csv=p=0", path], text=True).strip().split(",")
    W, H = int(probe[0]), int(probe[1])
    sw = width
    sh = max(2, int(round(H * sw / W / 2)) * 2)
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-i", path, "-an", "-vf", f"fps={fps},scale={sw}:{sh}", "-f", "rawvideo",
                          "-pix_fmt", "gray", "-"], stdout=subprocess.PIPE)
    size = sw * sh
    out = []
    while True:
        buf = p.stdout.read(size)
        if len(buf) < size:
            break
        out.append(np.frombuffer(buf, np.uint8).reshape(sh, sw))
    p.wait()
    return W, H, sw, sh, out


def runs(flags, gap):
    """[(first, last)] of consecutive True, joining runs closer than `gap` frames."""
    out = []
    i, n = 0, len(flags)
    while i < n:
        if not flags[i]:
            i += 1
            continue
        j = i
        while j + 1 < n and flags[j + 1]:
            j += 1
        if out and i - out[-1][1] - 1 <= gap:
            out[-1] = (out[-1][0], j)
        else:
            out.append((i, j))
        i = j + 1
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("out")
    ap.add_argument("--fps", type=float, default=4)
    ap.add_argument("--idle", type=float, default=2.2)
    a = ap.parse_args()
    W, H, sw, sh, fr = frames(a.video, a.fps, 320)
    if len(fr) < 3:
        print(json.dumps({"ok": False, "why": "the recording is too short"}))
        return
    masks, act = [None], [0.0]
    for i in range(1, len(fr)):
        d = cv2.absdiff(cv2.GaussianBlur(fr[i], (5, 5), 0), cv2.GaussianBlur(fr[i - 1], (5, 5), 0))
        m = (d > 14).astype(np.uint8)
        m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((2, 2), np.uint8))
        masks.append(m)
        act.append(float(m.mean()))
    active = [x > ACTIVE for x in act]
    idle_min = max(1, int(round(a.idle * a.fps)))
    events = []
    # something moves: frames that change in the same place (or all over, a page turning) are one event; a change somewhere
    # else starts the next one. Where it changes again and again is what the viewer should look at.
    def box(k):
        ys, xs = np.where(masks[k] > 0)
        if len(xs) == 0:
            return None
        return (float(np.percentile(xs, 2)), float(np.percentile(ys, 2)), float(np.percentile(xs, 98)), float(np.percentile(ys, 98)))

    def near(b1, b2, m=0.12):  # do two boxes touch, with a margin of 12% of the screen?
        mx, my = m * sw, m * sh
        return not (b1[2] + mx < b2[0] or b2[2] + mx < b1[0] or b1[3] + my < b2[1] or b2[3] + my < b1[1])

    groups, cur, gap = [], None, int(round(0.5 * a.fps))
    for k in range(1, len(fr)):
        if not active[k]:
            continue
        b = box(k)
        if b is None:
            continue
        wide = (b[2] - b[0]) * (b[3] - b[1]) >= 0.4 * sw * sh
        if cur and k - cur["last"] - 1 <= gap and (wide or cur["wide"] or near(cur["box"], b)):
            cur["last"], cur["wide"] = k, cur["wide"] or wide
            cur["box"] = (min(cur["box"][0], b[0]), min(cur["box"][1], b[1]), max(cur["box"][2], b[2]), max(cur["box"][3], b[3]))
        else:
            cur = {"first": k, "last": k, "box": b, "wide": wide}
            groups.append(cur)
    for g in groups:
        s0, e0 = g["first"], g["last"]
        heat = np.zeros((sh, sw), np.float32)
        for k in range(s0, e0 + 1):
            heat += masks[k]
        top = float(heat.max())
        ys, xs = np.where(heat >= max(1.0, 0.2 * top))
        if len(xs) == 0:
            continue
        x0, x1 = np.percentile(xs, [2, 98])
        y0, y1 = np.percentile(ys, [2, 98])
        bw, bh = (x1 - x0 + 1) / sw, (y1 - y0 + 1) / sh
        secs = (e0 - s0 + 1) / a.fps
        big = bw * bh >= 0.55 or float(np.mean(act[s0:e0 + 1])) >= 0.35
        if big:
            action, rect = ("open" if secs <= 1.25 else "scroll"), None
        else:
            action = "type" if (bh < 0.09 and bw > 2.5 * bh and secs > 0.9) or secs > 1.5 else "click"
            pad = 0.012
            x = max(0.0, x0 / sw - pad)
            y = max(0.0, y0 / sh - pad)
            w = min(1.0 - x, max(0.06, bw + 2 * pad))
            h = min(1.0 - y, max(0.06, bh + 2 * pad))
            rect = [round(x * 100, 1), round(y * 100, 1), round(w * 100, 1), round(h * 100, 1)]
        ev = {"fromSec": round(s0 / a.fps, 2), "toSec": round((e0 + 1) / a.fps, 2), "action": action, "targetLabel": "",
              "focusRectPct": rect, "idleScreen": False}
        if rect:
            ev["calloutSuggestion"] = {"click": "Zoom 1.8x into it, dim the rest, step pill", "type": "Zoom 1.6x into the field while it is typed"}.get(action, "")
        events.append(ev)
    # nothing moves for longer than --idle seconds: the screen is a still picture (the speaker explains)
    for s, e in runs([not x for x in active[1:]], 0):
        s += 1
        e += 1
        if e - s + 1 >= idle_min:
            events.append({"fromSec": round(s / a.fps, 2), "toSec": round((e + 1) / a.fps, 2), "action": "idle", "targetLabel": "",
                           "focusRectPct": None, "idleScreen": True})
    events.sort(key=lambda x: x["fromSec"])
    device = "mobile-9:16" if W / H < 0.8 else "pc-16:9"
    json.dump({"deviceAspect": device, "aspect": round(W / H, 4), "fps": a.fps, "via": "local", "events": events},
              open(a.out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(json.dumps({"ok": True, "events": len(events), "deviceAspect": device}))


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(json.dumps({"ok": False, "why": str(e)[:300]}))
        sys.exit(0)
