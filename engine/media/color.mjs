// Colour: measure a clip, correct it (exposure, white balance, highlights, flat colour), then apply a named look.
// Pure ffmpeg, no AI. Used by the rough cut; `node engine/color.mjs <video> [--look natural] [--still out.jpg]` prints the
// report and can write a before/after still for a check.
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir, homedir } from "node:os";
import { ENGINE, PRESETS, PY as PY0, readJSON } from "./lib.mjs";

const PY = PY0;

// Average picture numbers of up to `n` frames (Y = brightness 0–255; U/V = colour cast, 128 = neutral; SAT = colour amount)
// `pre` = the reframe filter, so only what ends up in the video is measured (no bars, no cropped-away walls).
export function measure(src, n = 24, duration = null, pre = "") {
  const fps = duration ? Math.max(0.05, Math.min(2, n / duration)) : 1;
  const r = spawnSync("ffmpeg", ["-v", "info", "-i", src, "-vf", `fps=${fps.toFixed(3)},${pre ? pre + "," : ""}scale=320:-2,signalstats,metadata=print`, "-an", "-f", "null", "-"], { encoding: "utf8", maxBuffer: 1 << 26 });
  const text = `${r.stdout || ""}${r.stderr || ""}`;
  const avg = (k) => { const v = [...text.matchAll(new RegExp(`lavfi\\.signalstats\\.${k}=([\\d.]+)`, "g"))].map((m) => Number(m[1])); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
  const m = { y: avg("YAVG"), low: avg("YLOW"), high: avg("YHIGH"), u: avg("UAVG"), v: avg("VAVG"), sat: avg("SATAVG") };
  // White balance is judged only from near-neutral areas (walls, shirts, paper), never from skin (color_probe.py)
  const dir = mkdtempSync(join(tmpdir(), "zc-color-"));
  try {
    const f2 = duration ? Math.max(0.05, Math.min(1, 8 / duration)) : 0.5;
    spawnSync("ffmpeg", ["-v", "error", "-i", src, "-vf", `fps=${f2.toFixed(3)},${pre ? pre + "," : ""}scale=320:-2`, "-frames:v", "8", join(dir, "%02d.png")]);
    const p = spawnSync(PY, [join(ENGINE, "color_probe.py"), dir], { encoding: "utf8" });
    m.wb = JSON.parse((p.stdout || "").trim().split("\n").pop() || "{}");
  } catch { m.wb = null; } finally { rmSync(dir, { recursive: true, force: true }); }
  return m;
}

// Correction filters for measured numbers.
export function correction(m, { target = 116, face = true } = {}) {
  const f = [], notes = [];
  if (m.y == null) return { filters: "", notes: ["could not measure"] };
  // exposure
  const b = Math.max(-0.1, Math.min(0.1, ((target - m.y) / 255) * 0.85));
  if (Math.abs(b) > 0.008) { f.push(`eq=brightness=${b.toFixed(3)}`); notes.push(`${b > 0 ? "lifted" : "lowered"} exposure (${m.y.toFixed(0)}/255)`); }
  // white balance from the neutral areas: 70% of the cast removed, clamped; no neutral area = left alone (no guessing on skin)
  const wb = m.wb;
  if (wb?.gains && wb.neutral >= 0.04) {
    const g = wb.gains.map((x) => Math.max(0.88, Math.min(1.12, 1 + (x - 1) * 0.7)));
    if (g.some((x) => Math.abs(x - 1) > 0.025)) {
      f.push(`colorchannelmixer=rr=${g[0].toFixed(3)}:gg=${g[1].toFixed(3)}:bb=${g[2].toFixed(3)}`);
      const [r, , bl] = wb.rgb;
      notes.push(`white balance: removed a ${r > bl * 1.06 ? "warm/yellow" : bl > r * 1.06 ? "blue" : "green/magenta"} cast (gains ${g.map((x) => x.toFixed(2)).join("/")})`);
    }
  } else if (wb) notes.push("white balance left as shot (no neutral area to judge from)");
  // hot highlights roll off (shiny skin, lamps, windows); crushed shadows lifted a little
  if (m.high != null && m.high > 200) { f.push("curves=master='0/0 0.5/0.5 0.75/0.72 0.9/0.84 1/0.93'"); notes.push("softened hot highlights"); }
  else if (m.low != null && m.low < 8) { f.push("curves=master='0/0.03 0.2/0.21 1/1'"); notes.push("lifted crushed shadows"); }
  // flat colour — but never on warm footage (skin would turn orange)
  const warm = m.v != null && m.v - 128 > 8;
  if (m.sat != null && m.sat < 24 && !warm) { f.push("eq=saturation=1.1"); notes.push("added colour (footage was flat)"); }
  return { filters: f.join(","), notes: notes.length ? notes : ["no correction needed"] };
}

// A look name → filters ("house" = signature grade; "none" = nothing; anything else is a raw filter string)
export function look(name, brand) {
  if (!name || name === "none") return "";
  const looks = readJSON(join(PRESETS, "looks.json"), {});
  const L = looks[name];
  if (!L) return /[=]/.test(name) ? name : (brand?.grade?.filters || "");
  return L.filters === "@signature" ? (brand?.grade?.filters || "") : L.filters;
}
export const lookNames = () => Object.keys(readJSON(join(PRESETS, "looks.json"), {})).filter((k) => !k.startsWith("_"));

// CLI: report + optional before/after still
if (import.meta.url === `file://${process.argv[1]}`) {
  const [src] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  const opt = (k) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : undefined; };
  if (!src || !existsSync(src)) { console.error("usage: node engine/color.mjs <video> [--look natural] [--still out.jpg] [--at 2]"); process.exit(1); }
  const m = measure(src);
  const c = correction(m);
  const lk = look(opt("look") || "house", readJSON(join(PRESETS, "signature-style.json"), {}));
  const chain = [c.filters, lk].filter(Boolean).join(",");
  console.log(JSON.stringify({ measured: Object.fromEntries(Object.entries(m).map(([k, v]) => [k, v == null ? null : +v.toFixed(1)])), correction: c.notes, look: opt("look") || "house", filters: chain }));
  if (opt("still")) {
    const at = opt("at") || "1";
    const r = spawnSync("ffmpeg", ["-v", "error", "-y", "-ss", at, "-i", src, "-frames:v", "1", "-filter_complex",
      `[0:v]scale=540:-2,split[a][b];[b]${chain || "null"}[g];[a][g]hstack`, opt("still")], { encoding: "utf8" });
    if (r.status) { console.error(r.stderr); process.exit(1); }
    console.log(`before | after: ${opt("still")}`);
  }
}
