// Same near-still measurement as the original reference study, including a freeze that runs to EOF.
import { execFileSync, spawnSync } from 'node:child_process';
export function freezeStats(log, seconds) {
  const intervals = []; let start = null;
  for (const match of log.matchAll(/freeze_(start|end):\s*([\d.]+)/g)) {
    if (match[1] === 'start') start = Number(match[2]);
    else if (start !== null) { intervals.push([start, Math.min(seconds, Number(match[2]))]); start = null; }
  }
  if (start !== null) intervals.push([start, seconds]);
  const stillSeconds = intervals.reduce((sum, [a, b]) => sum + Math.max(0, b - a), 0);
  return { seconds, stillSeconds, stillShare: seconds ? stillSeconds / seconds : 0, intervals };
}
export function measureMotion(file) {
  const seconds = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', file], { encoding: 'utf8' }).trim());
  const filter = 'fps=5,scale=320:-2,freezedetect=n=-55dB:d=1.5';
  const run = spawnSync('ffmpeg', ['-hide_banner', '-nostdin', '-v', 'info', '-i', file, '-an', '-vf', filter, '-f', 'null', '-'], { encoding: 'utf8', maxBuffer: 1 << 25, timeout: 120000 });
  if (run.status !== 0) throw new Error(String(run.stderr || run.error).slice(-1000));
  return { ...freezeStats(run.stderr, seconds), filter };
}
