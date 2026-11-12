# The Zancut pro sound kit, made by code (no licence needed): three families with 2-3 variations each.
#   whooshes (movement)  · textures (things that happen without sliding) · risers & hits (anticipation)
# Every file is 48 kHz stereo WAV, peak-normalised; sounds.json records each file's loudest moment ("peak", seconds)
# so the engine can put a whoosh's peak on the fastest frame of a movement and a riser's end on the cut.
# Run: ~/.cache/zancut/py/bin/python -I engine/tools/scripts/sfx-synth.py [out-dir]
import sys, os, json, wave
import numpy as np

SR = 48000
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), "..", "..", "reel", "engine", "sfx")
rng = np.random.default_rng(7)

def t_(d): return np.arange(int(SR * d)) / SR
def noise(d): return rng.standard_normal(int(SR * d))

def lp(x, fc):
    # one-pole low-pass with a cutoff that may change per sample (array or number), run twice for 12 dB/oct
    fc = np.broadcast_to(np.asarray(fc, dtype=float), x.shape)
    a = np.exp(-2 * np.pi * np.clip(fc, 10, SR * 0.45) / SR)
    for _ in range(2):
        y = np.empty_like(x); s = 0.0
        for i in range(len(x)):
            s = (1 - a[i]) * x[i] + a[i] * s; y[i] = s
        x = y
    return x

def hp(x, fc): return x - lp(x, fc)

def bp(x, fc, q=4.0):
    # resonant band-pass (state-variable filter), cutoff per sample
    fc = np.broadcast_to(np.asarray(fc, dtype=float), x.shape)
    f = 2 * np.sin(np.pi * np.clip(fc, 20, SR * 0.2) / SR); dmp = 1 / q
    lo = bd = 0.0; y = np.empty_like(x)
    for i in range(len(x)):
        hi = x[i] - lo - dmp * bd; bd += f[i] * hi; lo += f[i] * bd; y[i] = bd
    return y

def env(n, peak, attack_pow=2.0, release_pow=2.0):
    # rises to 1 at `peak` (0..1 of the length), then falls: the shape of a whoosh passing by
    x = np.linspace(0, 1, n); e = np.where(x < peak, (x / peak) ** attack_pow, ((1 - x) / (1 - peak)) ** release_pow)
    return np.nan_to_num(e)

def decay(d, tau): return np.exp(-t_(d) / tau)

def fade(x, a=0.004, r=0.02):
    na, nr = int(SR * a), int(SR * r); x = x.copy()
    x[:na] *= np.linspace(0, 1, na); x[-nr:] *= np.linspace(1, 0, nr); return x

def stereo(x, width=0.25, delay_ms=7):
    # a little width: the right side is a slightly delayed, filtered copy
    dly = int(SR * delay_ms / 1000); r = np.concatenate([np.zeros(dly), x[:-dly]]) if dly else x
    r = (1 - width) * x + width * lp(r, 6000)
    return np.stack([x, r], 1)

def verb(x, mix=0.25, size=0.06):
    # small feedback-delay "room" so synthetic sounds are not dry
    y = x.copy()
    for k, g in [(1.0, .5), (1.37, .4), (1.73, .32), (2.11, .25), (2.9, .18)]:
        dl = int(SR * size * k); z = np.concatenate([np.zeros(dl), x])[: len(x)]; y += g * mix * lp(z, 5000)
    return y

def norm(x, peak_db=-1.0):
    m = np.max(np.abs(x)) or 1; return x / m * (10 ** (peak_db / 20))

def save(name, x, fam, use, extra=None):
    x = norm(fade(x)); st = stereo(x) if x.ndim == 1 else x
    st = norm(st)
    pcm = (np.clip(st, -1, 1) * 32767).astype("<i2")
    with wave.open(os.path.join(OUT, name + ".wav"), "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
    mono = np.abs(st).mean(1); k = int(SR * 0.02)
    sm = np.convolve(mono, np.ones(k) / k, "same")
    item = {"id": name, "family": fam, "use": use, "dur": round(len(st) / SR, 3), "peak": round(int(np.argmax(sm)) / SR, 3), "source": "Zancut synth (own, free to use)"}
    if extra: item.update(extra)
    ITEMS.append(item); print(f"{name:20s} {item['dur']:5.2f}s peak {item['peak']:.2f}s")

ITEMS = []

# ---------------- WHOOSHES (movement): peak = fastest frame ----------------
def whoosh(d, peak, f0, f1, q, body=0.0, tone=None, air=1.0):
    n = noise(d); N = len(n); e = env(N, peak, 2.2, 1.6)
    sweep = f0 * (f1 / f0) ** np.clip(np.linspace(0, 1, N) / max(peak, .05), 0, 1) if f1 != f0 else np.full(N, f0)
    sweep = np.where(np.linspace(0, 1, N) > peak, f1 * (f0 / f1) ** np.clip((np.linspace(0, 1, N) - peak) / (1 - peak), 0, 1) ** 0.7, sweep)
    x = bp(n, sweep, q) * air + body * lp(n, sweep * 0.25)
    if tone is not None: x += tone[:N]
    return verb(x * e, 0.2)

for i, (d, pk, f0, f1, q) in enumerate([(0.75, .55, 500, 2600, 5), (0.9, .5, 380, 2200, 6), (0.65, .6, 650, 3200, 5)], 1):
    save(f"wh-hollow-{i}", whoosh(d, pk, f0, f1, q, body=0.15), "whoosh", "go-to for a standard slide or pan: text, a card or a picture sliding in")
for i, (d, pk, f0, f1) in enumerate([(0.8, .55, 700, 4200), (0.7, .5, 900, 5200), (0.95, .6, 600, 3600)], 1):
    tt = t_(d); fm = 0.25 * np.sin(2 * np.pi * (300 + 900 * tt / d) * tt + 3 * np.sin(2 * np.pi * 37 * tt)) * env(len(tt), .55)
    save(f"wh-future-{i}", whoosh(d, pk, f0, f1, 7, tone=fm * 0.6), "whoosh", "a textured sci-fi slide: UI, tech graphics, app cards moving")
for i, (d, pk, f0, f1) in enumerate([(0.85, .55, 220, 1200), (1.0, .5, 180, 1000), (0.75, .6, 260, 1500)], 1):
    tt = t_(d); sub = 0.5 * np.sin(2 * np.pi * np.cumsum(np.interp(tt, [0, d * pk, d], [70, 140, 55])) / SR) * env(len(tt), pk, 2, 1.4)
    save(f"wh-deep-{i}", whoosh(d, pk, f0, f1, 4, body=0.35, tone=sub), "whoosh", "the default when unsure: a deep textured sweep that fits most animations")
for i, (d, pk) in enumerate([(1.3, .5), (1.6, .55), (1.2, .45)], 1):
    save(f"wh-wind-{i}", whoosh(d, pk, 300, 1100, 1.6, body=0.5, air=0.7), "whoosh", "slow, gentle movement: a soft drift, a slow camera push, a calm fade-slide")
for i, (d, pk) in enumerate([(1.9, .82), (2.4, .85)], 1):
    save(f"wh-long-{i}", whoosh(d, pk, 250, 4800, 4, body=0.2), "whoosh", "half riser, half whoosh: builds slowly into a quick transition")
for i, (d, pk) in enumerate([(0.28, .5), (0.34, .45)], 1):
    save(f"wh-short-{i}", whoosh(d, pk, 1200, 5200, 5), "whoosh", "rare: a very quick, small movement")
for i, (d, pk) in enumerate([(1.0, .6), (1.2, .55), (0.9, .65)], 1):
    tt = t_(d); sh = sum(0.08 * np.sin(2 * np.pi * f * tt) for f in (1760, 2217, 2637)) * env(len(tt), pk, 1.2, 3)
    save(f"wh-trans-{i}", whoosh(d, pk, 400, 6000, 6, body=0.25, tone=sh), "whoosh", "scene-to-scene transition with a sci-fi edge (synthetic / spacey)")

# ---------------- TEXTURES (pops, clicks, reveals): on the event frame ----------------
def pop(f0, f1, d=0.12):
    tt = t_(d); ph = 2 * np.pi * np.cumsum(np.interp(tt, [0, d], [f0, f1])) / SR
    return (np.sin(ph) * decay(d, d / 3.5) + 0.3 * hp(noise(d), 2000) * decay(d, 0.004))
for i, (a, b) in enumerate([(900, 300), (1200, 420), (700, 260)], 1):
    save(f"tx-pop-{i}", verb(pop(a, b), .15, .03), "texture", "text pops up as a whole element (clean, cartoon pop)")
def click(f, d=0.05, ring=0.012):
    tt = t_(d); return hp(noise(d), 1500) * decay(d, 0.0025) + 0.4 * np.sin(2 * np.pi * f * tt) * decay(d, ring)
for i, f in enumerate([2400, 3100, 1800], 1):
    save(f"tx-ui-{i}", verb(click(f), .12, .02), "texture", "a UI element pops up, a button press")
for i, (f0, f1) in enumerate([(1800, 3600), (2600, 1200), (1400, 4200)], 1):
    d = 0.11; tt = t_(d); ph = 2 * np.pi * np.cumsum(np.interp(tt, [0, d], [f0, f1])) / SR
    x = np.sin(ph + 2.5 * np.sin(2 * np.pi * 180 * tt)) * decay(d, 0.03) + click(3000, d) * 0.5
    save(f"tx-scifi-click-{i}", verb(x, .2, .03), "texture", "a click or a change inside an animation (a UI changes colour, a toggle flips)")
def gears(d, rate, f):
    x = np.zeros(int(SR * d)); k = 0.0
    while k < d - 0.03:
        c = click(f * (0.9 + 0.2 * rng.random()), 0.03, 0.006) * (0.6 + 0.4 * rng.random())
        s = int(SR * k); x[s:s + len(c)] += c[: len(x) - s]; k += 1 / rate * (0.8 + 0.4 * rng.random())
    return verb(bp(x, f, 3) * 0.6 + x * 0.6, .2, .02)
for i, (d, r, f) in enumerate([(0.6, 22, 3200), (0.9, 16, 2600), (0.45, 30, 4000)], 1):
    save(f"tx-gears-{i}", gears(d, r, f), "texture", "letter-by-letter write-outs, typewriter pops, anything mechanical")
for i, d in enumerate([0.45, 0.7], 1):
    tt = t_(d); buzz = np.sign(np.sin(2 * np.pi * 110 * tt)) * 0.3 + bp(noise(d), np.interp(tt, [0, d], [800, 5000]), 8)
    save(f"tx-scan-{i}", verb(buzz * env(len(tt), .3, 1, 1.5), .15, .03), "texture", "a single image or object pops up and needs emphasis (video scan)")
def impact(d, f, ring):
    tt = t_(d); body = np.sin(2 * np.pi * np.cumsum(np.interp(tt, [0, .12, d], [f * 2, f, f * .8])) / SR) * decay(d, 0.18)
    metal = sum(np.sin(2 * np.pi * h * tt) * decay(d, ring) / (k + 1) for k, h in enumerate((1230, 1867, 2741, 3511)))
    return verb(body + 0.35 * metal + 0.6 * lp(noise(d), 3000) * decay(d, 0.03), .35, .07)
for i, (d, f, r) in enumerate([(0.9, 70, .25), (1.1, 55, .35), (0.8, 85, .2)], 1):
    save(f"tx-impact-{i}", impact(d, f, r), "texture", "a new UI, object or screen is REVEALED entering the scene (sci-fi impact); also a scene change")
for i, d in enumerate([0.9, 1.2], 1):
    tt = t_(d); f = np.interp(tt, [0, d], [200, 1400]); x = np.sin(2 * np.pi * np.cumsum(f) / SR + 4 * np.sin(2 * np.pi * 7 * tt)) * env(len(tt), .85, 1.4, 1)
    save(f"tx-energy-{i}", verb(x * 0.6 + bp(noise(d), f * 3, 6) * env(len(tt), .85), .3, .05), "texture", "the transition INTO a brand-new animation (activate energy)")
for i, gap in enumerate([0.045, 0.07], 1):
    d = 0.25; x = np.zeros(int(SR * d)); a = click(4200, 0.04, 0.004); b = click(2900, 0.05, 0.006)
    x[:len(a)] += a; s = int(SR * gap); x[s:s + len(b)] += b * 0.8; x += 0.15 * hp(noise(d), 3000) * decay(d, 0.05)
    save(f"tx-camera-{i}", verb(x, .15, .02), "texture", "a clip-to-clip cut or a camera flash, exactly on the cut frame")
d = 2.2; tt = t_(d); choir = sum(np.sin(2 * np.pi * f * tt * (1 + 0.004 * np.sin(2 * np.pi * (5 + k) * tt))) for k, f in enumerate((523.3, 659.3, 784.0, 1046.5))) / 4
save("tx-choir", verb(choir * env(len(tt), .35, 1.2, 1.4) + 0.1 * bp(noise(d), 3000, 2) * env(len(tt), .35), .5, .09), "texture", "a big reveal that is a big deal (heavenly choir); once per video at most")
d = 0.9; tt = t_(d)
save("tx-success", verb(sum(np.sin(2 * np.pi * f * tt) * decay(d, .35) * (tt >= o) for f, o in ((784, 0), (988, .09), (1319, .18))) * 0.5, .3, .05), "texture", "a conclusion is reached (success reward)")

# ---------------- RISERS & HITS (anticipation): the riser ENDS on the cut, a hit sits under that frame ----------------
def riser_bass(d):
    tt = t_(d); f = np.interp(tt, [0, d], [45, 220]) ** 1.0
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.5 * np.sin(4 * np.pi * np.cumsum(f) / SR)
    x = np.tanh(2.2 * x) * (tt / d) ** 2.2 + 0.4 * bp(noise(d), np.interp(tt, [0, d], [300, 6000]), 3) * (tt / d) ** 3
    return verb(x, .25, .05)
for i, d in enumerate([1.6, 2.0, 2.6], 1):
    save(f"rs-bass-{i}", riser_bass(d), "riser", "sharp bass riser: about 5 s into the video, into a new segment (a favourite)", {"end": d})
def riser_metal(d):
    tt = t_(d); x = np.zeros_like(tt)
    for k, h in enumerate((1.0, 2.76, 5.40, 8.93)):
        f = np.interp(tt, [0, d], [180, 900]) * h; x += np.sin(2 * np.pi * np.cumsum(f) / SR) / (k + 1)
    trem = 0.6 + 0.4 * np.sin(2 * np.pi * np.interp(tt, [0, d], [4, 22]) * tt)
    return verb(x * trem * (tt / d) ** 2.4 + 0.3 * hp(noise(d), 4000) * (tt / d) ** 4, .35, .06)
for i, d in enumerate([1.5, 2.0, 2.4], 1):
    save(f"rs-metal-{i}", riser_metal(d), "riser", "metallic riser: builds into a chapter or reveal (the other favourite)", {"end": d})
for i, d in enumerate([1.4, 1.9], 1):
    tt = t_(d); body = verb(bp(noise(d), 1200, 2) * decay(d, d / 3), .8, .12)[::-1]
    save(f"rs-suck-{i}", body * (tt / d) ** 1.5, "riser", "suck-back riser: a slow reversed build; very low or very loud, never middle", {"end": d})
d = 3.0; tt = t_(d)
save("rs-suspense", verb(sum(np.sin(2 * np.pi * f * tt) for f in (110, 116.5, 164.8)) * (tt / d) ** 1.8 * (0.7 + 0.3 * np.sin(2 * np.pi * 6 * tt)), .3, .06), "riser", "suspenseful build-up; use sparingly", {"end": d})
def hit(d, f, bright):
    tt = t_(d); boom = np.sin(2 * np.pi * np.cumsum(np.interp(tt, [0, .08, d], [f * 3, f, f * .7])) / SR) * decay(d, d / 3.2)
    return verb(np.tanh(1.8 * boom) + bright * lp(noise(d), 4500) * decay(d, 0.05), .4, .08)
for i, (d, f, b) in enumerate([(1.4, 48, .6), (1.8, 40, .45), (1.1, 58, .8)], 1):
    save(f"hit-{i}", hit(d, f, b), "hit", "impact hit under a riser's end, so the build lands the new segment")

# the catalog: merged into library/catalog/sounds.json by the engine tools (family, use, peak)
json.dump({"about": "Zancut pro sound kit (sfx-synth.py): whoosh = movement (peak on the fastest frame), texture = an event (on its frame), riser = anticipation (ends on the cut), hit = under a riser's end.", "items": ITEMS}, open(os.path.join(OUT, "pro-kit.json"), "w"), indent=1)
print(len(ITEMS), "sounds")
