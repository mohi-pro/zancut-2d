// Local sound measurements, extracted unchanged from the old Gemini adapter.
import { execFileSync } from 'node:child_process';

export function speechHoles(rms) {
  const sorted = rms.filter((v) => v > 1e4).sort((x, y) => x - y), level = sorted.length ? sorted[Math.floor(sorted.length / 2)] : 1e6;
  const voiced = rms.map((v) => v > level * 0.05), end = voiced.length / 20;
  const share = (p, q) => { let v = 0, n = 0; for (let i = Math.floor(p * 20); i < Math.min(voiced.length, Math.ceil(q * 20)); i++) { n++; if (voiced[i]) v++; } return n ? v / n : 0; };
  // every gap between words (and before the first, after the last) over 2 s that is more than a quarter speech
  return (ws, a, b) => {
    const list = [...ws].sort((x, y) => x.s - y.s), edges = [[a, list[0]?.s ?? b], ...list.slice(1).map((w, k) => [list[k].e, w.s]), [list.at(-1)?.e ?? a, Math.min(b, end)]];
    return edges.filter(([p, q]) => q - p > 2 && share(p, q) > 0.25).map(([p, q]) => [+p.toFixed(2), +q.toFixed(2)]);
  };
}
export function levelsOf(wav) {
  const pcm = execFileSync('ffmpeg', ['-v', 'error', '-i', wav, '-ac', '1', '-ar', '8000', '-f', 's16le', '-'], { maxBuffer: 1 << 28, timeout: 120000, stdio: ['ignore', 'pipe', 'pipe'] });
  const n = pcm.length >> 1, step = 400, rms = [];
  for (let i = 0; i + step <= n; i += step) { let a = 0; for (let k = i; k < i + step; k++) { const v = pcm.readInt16LE(k * 2); a += v * v; } rms.push(a / step); }
  return rms;
}
