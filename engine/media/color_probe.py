"""White balance probe: estimate a colour cast from the near-neutral parts of a few frames (walls, shirts, paper),
never from the speaker's face. Faces are found with the YuNet face detector (as in track.py) and masked out (a grey wall under a yellow
cast has the same colour as skin, so colour alone cannot tell them apart); strongly coloured skin elsewhere (hands) is
dropped by colour. Prints JSON: {"neutral": share of pixels used, "faces": frames with a face, "rgb": mean R,G,B,
"gains": [r,g,b] that would make them neutral}.
Usage: python color_probe.py <frames_dir>
"""
import json, os, sys, pathlib
import cv2
import numpy as np

MODEL = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "face_detection_yunet_2023mar.onnx")  # same as track.py
frames = sorted(pathlib.Path(sys.argv[1]).glob("*.png"))
picked, total, faced = [], 0, 0
for f in frames:
    img = cv2.imread(str(f))
    if img is None:
        continue
    H, W = img.shape[:2]
    keep = np.ones((H, W), bool)
    det = cv2.FaceDetectorYN.create(MODEL, "", (W, H), 0.6, 0.3, 20)
    _, res = det.detect(img)
    faces = [] if res is None else [r[:4] for r in res]
    if len(faces):
        faced += 1
    for (x, y, w, h) in faces:  # face + hair + neck
        keep[max(0, int(y - 0.45 * h)):min(H, int(y + 1.7 * h)), max(0, int(x - 0.35 * w)):min(W, int(x + 1.35 * w))] = False
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    h, s, v = hsv[..., 0].astype(int), hsv[..., 1].astype(int), hsv[..., 2].astype(int)
    skin = ((h <= 22) | (h >= 165)) & (s >= 110) & (v > 50)
    # near-neutral and bright enough to judge (light walls, white shirts, paper); dark areas say little about the light
    neutral = keep & ~skin & (s < 100) & (v > 80) & (v < 245)
    total += neutral.size
    if neutral.any():
        picked.append(img[neutral].reshape(-1, 3).astype(np.float64))
px = np.vstack(picked) if picked else np.zeros((0, 3))
out = {"neutral": round(len(px) / max(1, total), 4), "faces": faced}
if len(px) > 500:
    b, g, r = px.mean(axis=0)
    m = (r + g + b) / 3
    out["rgb"] = [round(r, 1), round(g, 1), round(b, 1)]
    out["gains"] = [round(m / r, 4), round(m / g, 4), round(m / b, 4)]
print(json.dumps(out))
