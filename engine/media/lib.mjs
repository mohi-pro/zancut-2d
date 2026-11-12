// Shared helpers for the editing engine (no npm deps).
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const ENGINE = dirname(fileURLToPath(import.meta.url));
// ENGINE = engine/media (this code). Shared files sit one level up (engine/presets, engine/fonts, engine/sfx, engine/vendor).
// ROOT = the job's own workspace (ZEN_ROOT, set by engine/zen.mjs) so outputs never mix between videos.
export const HOME = resolve(ENGINE, "..");
export const ROOT = process.env.ZEN_ROOT ? resolve(process.env.ZEN_ROOT) : HOME;
export const PRESETS = join(HOME, "presets");
// Zancut's Python (OpenCV, numpy, WhisperX): ZANCUT_PYTHON, else the one set up by scripts/setup-python.sh
export const PY = [process.env.ZANCUT_PYTHON, join(process.env.HOME || process.env.USERPROFILE || "", ".cache", "zancut", "py", ...(process.platform === "win32" ? ["Scripts", "python.exe"] : ["bin", "python"]))].find((p) => p && existsSync(p)) || (process.platform === "win32" ? "python" : "python3");
// npx is a .cmd file on Windows, which Node only starts through a shell: there, run npm's npx-cli.js with this Node instead
// (the desktop app: its own node.exe and npm, ZANCUT_NODE / ZANCUT_NPX_CLI from desktop/main.cjs).
// The desktop app (Windows and Mac) pins HyperFrames (ZANCUT_HYPERFRAMES: the version its first run downloaded, server/first-run.mjs) and never
// stops to ask "Ok to proceed?". → [command, args, options to add]
const NPX_CLI = process.env.ZANCUT_NPX_CLI || join(dirname(process.execPath), "node_modules", "npm", "bin", "npx-cli.js");
const pin = (a) => (a[0] === "hyperframes" && process.env.ZANCUT_HYPERFRAMES ? ["--yes", process.env.ZANCUT_HYPERFRAMES, ...a.slice(1)] : a);
export const npx = (a) => (process.platform === "win32" && existsSync(NPX_CLI) ? [process.env.ZANCUT_NODE || process.execPath, [NPX_CLI, ...pin(a)], {}] : ["npx", pin(a), {}]); // (the Mac app: its npx shim, the same pinned HyperFrames)

export const FORMATS = {
  "short-explainer": "captions-style.json",
  "short-tiktok": "tiktok-raw-style.json",
  "long-youtube": "liquid-glass-style.json",
};

export function readJSON(p, fallback) {
  if (!existsSync(p)) {
    if (fallback !== undefined) return fallback;
    throw new Error(`missing file: ${p}`);
  }
  return JSON.parse(readFileSync(p, "utf8"));
}
export function writeJSON(p, data) {
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, JSON.stringify(data, null, 2) + "\n");
}

// Canvas shapes. A format (short-explainer / short-tiktok / long-youtube) sets the editing style; job.json "canvas" sets
// the frame: "9:16" | "4:5" | "1:1" | "16:9" | "21:9" | any "WxH" or "a:b". Positions are fractions of the frame, so a
// shape only moves the bands (title, eyes, captions) and scales the type; it never needs its own engine.
const SHAPES = {
  tall:     { layout: "short", captions: { y: 0.665 }, graphics: { top: 0.156, height: 0.205 }, hook: { y: 0.22 }, camera: { eyesY: 0.42 },
              band: { safeX: 0.14, safeTop: 0.156, safeBottom: 0.806, hookY: 0.22, eyesY: 0.42, captionY: 0.665, titleY: 0.235, bubbleY: 0.455 } },
  portrait: { layout: "short", captions: { y: 0.77 }, graphics: { top: 0.1, height: 0.2, width: 0.78 }, hook: { y: 0.16 }, camera: { eyesY: 0.42, originY: 0.38, zooms: [1, 1.1, 1.04, 1.16], autoframeMaxZoom: 1.12 },
              band: { safeX: 0.1, safeTop: 0.09, safeBottom: 0.88, hookY: 0.16, eyesY: 0.42, captionY: 0.77, titleY: 0.15, bubbleY: 0.46 } },
  square:   { layout: "short", captions: { y: 0.82, maxWords: 3 }, graphics: { top: 0.07, height: 0.2, width: 0.82 }, hook: { y: 0.13 }, camera: { eyesY: 0.4, originY: 0.36, zooms: [1, 1.06, 1.02, 1.1], punch: 0.05, autoframeMaxZoom: 1.06 },
              band: { safeX: 0.08, safeTop: 0.06, safeBottom: 0.93, hookY: 0.13, eyesY: 0.4, captionY: 0.82, titleY: 0.11, bubbleY: 0.45 } },
  wide:     { layout: "long" },
};
export function parseCanvas(c, fps = 30) {
  if (!c) return null;
  const named = { "9:16": [1080, 1920], "4:5": [1080, 1350], "1:1": [1080, 1080], "16:9": [1920, 1080], "21:9": [2520, 1080], "4:3": [1440, 1080], "2:3": [1080, 1620] };
  let w, h, m;
  if (named[c]) [w, h] = named[c];
  else if ((m = String(c).match(/^(\d{3,4})\s*[x×]\s*(\d{3,4})$/i))) [w, h] = [+m[1], +m[2]];
  else if ((m = String(c).match(/^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)$/))) { const r = +m[1] / +m[2]; [w, h] = r >= 1 ? [Math.round(1080 * r / 2) * 2, 1080] : [1080, Math.round(1080 / r / 2) * 2]; }
  else throw new Error(`unknown canvas "${c}": use 9:16, 4:5, 1:1, 16:9, 21:9, WxH (1200x628) or a ratio (5:4)`);
  return { width: w - (w % 2), height: h - (h % 2), fps };
}
export const shapeOf = (cv) => { const r = cv.height / cv.width; return r >= 1.6 ? "tall" : r >= 1.15 ? "portrait" : r >= 0.87 ? "square" : "wide"; };

export function loadStyle(format, canvas = null) {
  const file = FORMATS[format];
  if (!file) throw new Error(`unknown format "${format}" — use one of: ${Object.keys(FORMATS).join(", ")}`);
  const brand = readJSON(join(PRESETS, "signature-style.json"));
  let fmt = readJSON(join(PRESETS, file));
  const cv = parseCanvas(canvas, fmt.canvas.fps);
  if (cv && (cv.width !== fmt.canvas.width || cv.height !== fmt.canvas.height)) {
    const shape = shapeOf(cv), S = SHAPES[shape];
    // a wide frame always edits like the long format, a tall/square one like the short formats
    if (S.layout === "long" && !format.startsWith("long")) fmt = readJSON(join(PRESETS, FORMATS["long-youtube"]));
    if (S.layout === "short" && format.startsWith("long")) fmt = readJSON(join(PRESETS, FORMATS["short-explainer"]));
    const k = Math.min(cv.width, cv.height) / Math.min(fmt.canvas.width, fmt.canvas.height); // type scale
    const sz = (o, keys) => { for (const key of keys) if (typeof o?.[key] === "number") o[key] = Math.round(o[key] * k); };
    fmt = { ...fmt, canvas: cv, shape,
      captions: { ...fmt.captions, ...(S.captions || {}) }, graphics: { ...fmt.graphics, ...(S.graphics || {}) },
      hook: { ...fmt.hook, ...(S.hook || {}) }, camera: { ...fmt.camera, ...(S.camera || {}) }, layout: S.band || null };
    sz(fmt.captions, ["fontSize", "maxWidth"]); sz(fmt.hook, ["fontSize"]);
    if (shape === "square") fmt.captions.fontSize = Math.round(fmt.captions.fontSize * 0.86);
  }
  return { brand, fmt, format };
}

export function ffmpeg(args, opts = {}) {
  const r = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", opts.loglevel || "error", "-y", ...args], {
    encoding: "utf8",
    maxBuffer: 1 << 28,
  });
  if (r.status !== 0) throw new Error(`ffmpeg failed:\n${r.stderr}`);
  return r.stderr;
}

export function probe(file) {
  const out = execFileSync(
    "ffprobe",
    ["-v", "error", "-show_entries", "stream=codec_type,width,height,r_frame_rate,color_transfer:stream_side_data=rotation:format=duration", "-of", "json", file],
    { encoding: "utf8" },
  );
  const j = JSON.parse(out);
  const v = j.streams.find((s) => s.codec_type === "video");
  const a = j.streams.find((s) => s.codec_type === "audio");
  let w = v?.width, h = v?.height;
  const rot = Math.abs(Number(v?.side_data_list?.find((d) => d.rotation !== undefined)?.rotation || 0));
  if (rot === 90 || rot === 270) [w, h] = [h, w];
  const [fn, fd] = (v?.r_frame_rate || "30/1").split("/").map(Number);
  const hdr = ["arib-std-b67", "smpte2084"].includes(v?.color_transfer);
  return { duration: Number(j.format.duration), width: w, height: h, fps: fn / (fd || 1), hasAudio: !!a, hasVideo: !!v, hdr, transfer: v?.color_transfer };
}

const seg = new Intl.Segmenter(undefined, { granularity: "grapheme" });
export const graphemes = (s) => [...seg.segment(s)].length;

const BN = "০১২৩৪৫৬৭৮৯";
export const toBnDigits = (s) => String(s).replace(/[0-9]/g, (d) => BN[d]);
export const fromBnDigits = (s) => String(s).replace(/[০-৯]/g, (d) => String(BN.indexOf(d)));

export function listMedia(dir, exts = /\.(mp4|mov|m4v|mkv|webm|mts)$/i) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => exts.test(f) && !f.startsWith(".")).sort().map((f) => join(dir, f));
}

export function args(argv = process.argv.slice(2)) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const k = a.slice(2);
      const nxt = argv[i + 1];
      if (nxt === undefined || nxt.startsWith("--")) out[k] = true;
      else { out[k] = nxt; i++; }
    } else out._.push(a);
  }
  return out;
}

export const r3 = (x) => Math.round(x * 1000) / 1000;
