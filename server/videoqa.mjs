// Checks on the rendered MP4 itself (no model): real file facts + sampled frames. Records evidence, never guesses.
import { execFileSync, spawnSync } from 'node:child_process';

const SIZES = { '16:9': [1920, 1080], '9:16': [1080, 1920], '1:1': [1080, 1080], '4:5': [1080, 1350] };
export function checkVideo(file, { expectSeconds = 0, format = '16:9', fps = 30 } = {}) {
  const issues = [], j = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_type,width,height,r_frame_rate:format=duration', '-of', 'json', file], { encoding: 'utf8' }));
  const v = (j.streams || []).find((s) => s.codec_type === 'video'), a = (j.streams || []).find((s) => s.codec_type === 'audio'), dur = Number(j.format?.duration || 0);
  if (!v) return { ok: false, facts: {}, issues: [{ category: 'media', severity: 'error', evidence: 'no video stream' }] };
  const [num, den] = String(v.r_frame_rate).split('/').map(Number), rate = den ? num / den : num, [W, H] = SIZES[format] || SIZES['16:9'];
  if (Math.abs(rate - fps) > 0.5) issues.push({ category: 'fps', severity: 'error', evidence: `frame rate ${rate.toFixed(2)}, expected ${fps}` });
  if (v.width !== W || v.height !== H) issues.push({ category: 'size', severity: 'error', evidence: `${v.width}x${v.height}, expected ${W}x${H} for ${format}` });
  // the engine keeps ~1 s of the film's own quiet end: longer than the voice by up to 1.5 s is normal, shorter or much longer is a fault
  if (expectSeconds && (dur < expectSeconds - 0.3 || dur > expectSeconds + 1.5)) issues.push({ category: 'duration', severity: 'error', evidence: `video ${dur.toFixed(2)} s, voice ${expectSeconds.toFixed(2)} s (expected the voice + up to 1.5 s of quiet end)` });
  if (!a) issues.push({ category: 'audio', severity: 'error', evidence: 'no audio stream' });
  // blank / frozen stretches from ffmpeg's own detectors
  const r = spawnSync('ffmpeg', ['-v', 'info', '-i', file, '-vf', 'blackdetect=d=0.5:pix_th=0.05,freezedetect=n=-70dB:d=2.5', '-an', '-f', 'null', '-'], { encoding: 'utf8', maxBuffer: 1 << 26 }), log = r.stderr || '';
  for (const m of log.matchAll(/black_start:([\d.]+) black_end:([\d.]+)/g)) issues.push({ category: 'blank', severity: 'error', t: +m[1], evidence: `black picture from ${m[1]} s to ${m[2]} s` });
  const starts = [...log.matchAll(/freeze_start: ([\d.]+)/g)].map((m) => +m[1]), ends = [...log.matchAll(/freeze_end: ([\d.]+)/g)].map((m) => +m[1]);
  starts.forEach((s, i) => issues.push({ category: 'static', severity: 'warn', t: s, evidence: `almost nothing moves from ${s} s${ends[i] ? ` to ${ends[i]} s` : ' to the end'} (only breathing): give someone an action` }));
  return { ok: !issues.some((i) => i.severity === 'error'), facts: { seconds: Math.round(dur * 100) / 100, fps: Math.round(rate * 100) / 100, width: v.width, height: v.height, audio: !!a }, issues };
}
