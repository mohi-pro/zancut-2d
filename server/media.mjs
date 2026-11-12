import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';

const run = promisify(execFile);

export async function probe(file) {
  const { stdout } = await run('ffprobe', [
    '-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', file,
  ]);
  const j = JSON.parse(stdout);
  const v = j.streams.find((s) => s.codec_type === 'video');
  const a = j.streams.find((s) => s.codec_type === 'audio');
  let width = v?.width || 0;
  let height = v?.height || 0;
  // Phone footage stores portrait as landscape + a rotate flag.
  const rot = Number(v?.tags?.rotate || v?.side_data_list?.find((s) => 'rotation' in s)?.rotation || 0);
  if (Math.abs(rot) === 90 || Math.abs(rot) === 270) [width, height] = [height, width];
  return {
    duration: Number(j.format?.duration || 0),
    width,
    height,
    hasVideo: Boolean(v),
    hasAudio: Boolean(a),
    size: Number(j.format?.size || 0),
  };
}

// The measured sound check of a finished video: how much each placed sound adds over the voice-only track in its own 0.35 s
// (the mix is loudness-normalised, so both are levelled on the whole video first). Over +3 dB = it covers words; a voice
// stretch where it adds nothing at all is fine (a soft accent). → { ok, summary, issues: [{ at, problem, fix }] }
export async function measureMix(mixFile, voiceFile, sounds) {
  const pcm = async (f) => { const { stdout } = await run('ffmpeg', ['-v', 'error', '-i', f, '-vn', '-ac', '1', '-ar', '8000', '-f', 's16le', '-'], { encoding: 'buffer', maxBuffer: 1 << 28 }); return stdout; };
  const [m, v] = await Promise.all([pcm(mixFile), pcm(voiceFile)]);
  const lvl = (b, t, w) => { const a = Math.max(0, Math.floor(t * 8000)), z = Math.min(b.length >> 1, a + Math.floor(w * 8000)); let s = 0; for (let i = a; i < z; i++) { const x = b.readInt16LE(i * 2); s += x * x; } return 10 * Math.log10(s / Math.max(1, z - a) / 32768 ** 2 + 1e-12); };
  const all = Math.min(m.length, v.length) / 16000, gain = lvl(m, 0, all) - lvl(v, 0, all);
  const issues = [];
  for (const s of sounds || []) {
    const voice = lvl(v, s.t, 0.35), add = lvl(m, s.t, 0.35) - voice - gain;
    if (voice > -45 && add > 3) issues.push({ at: Math.round(s.t * 10) / 10, name: s.name, db: Math.ceil(add - 1.5), problem: `"${s.name}" is ${add.toFixed(1)} dB over the voice there: it covers the words`, fix: `lower it by ${Math.ceil(add - 1.5)} dB or move it off the words` });
  }
  return { ok: !issues.length, summary: issues.length ? `${issues.length} sound${issues.length > 1 ? 's' : ''} cover the voice` : `Measured: no sound covers the voice (${(sounds || []).length} sounds checked)`, issues: issues.slice(0, 8) };
}

const MAX_TILES = 120;

// One strip of small frames for the timeline, plus a poster for the project card.
export async function makeThumbs(video, outDir, base, duration) {
  const interval = Math.max(1, Math.ceil(duration / MAX_TILES));
  const count = Math.max(1, Math.ceil(duration / interval));
  const height = 90;
  const sprite = `${base}-thumbs.jpg`;
  const poster = `${base}-poster.jpg`;
  await run('ffmpeg', [
    '-v', 'error', '-y', '-i', video,
    '-vf', `fps=1/${interval},scale=-2:${height},tile=${count}x1`,
    '-frames:v', '1', '-q:v', '5', path.join(outDir, sprite),
  ]);
  await run('ffmpeg', [
    '-v', 'error', '-y', '-ss', String(Math.min(1, duration / 2)), '-i', video,
    '-frames:v', '1', '-vf', 'scale=-2:540', '-q:v', '4', path.join(outDir, poster),
  ]);
  return { sprite, poster, interval, count };
}
