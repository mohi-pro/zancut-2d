// A join between two graphic scenes, measured in pixels with no AI: the last frame of one against the first frame of the next.
// Each frame is shrunk to a 16×16 grid of colours (ffmpeg). "ground" = the outer cells (the background, where the stage lives),
// "whole" = every cell. Both are the average colour step (0–255) between the two frames. A cut join that carries on has both
// small; a flipped background (teal wash → dark horizon) has a big "ground"; a scene that starts empty has a big "whole".
import { execFile } from 'node:child_process';

const N = 16;
// the thresholds (average colour step out of 255); ZANCUT_JOIN_JUMP="ground,whole" to tune them
const limits = () => {
  const [g, w] = String(process.env.ZANCUT_JOIN_JUMP || '').split(',').map(Number);
  return { ground: g > 0 ? g : 16, whole: w > 0 ? w : 34 };
};

export function frameGrid(file) {
  return new Promise((ok, no) => execFile('ffmpeg', ['-v', 'error', '-i', file, '-vf', `scale=${N}:${N}:flags=area`, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'],
    { encoding: 'buffer', maxBuffer: 1 << 20, timeout: 30000 }, (e, so) => (e || !so || so.length < N * N * 3 ? no(new Error('ffmpeg could not read the frame')) : ok(so))));
}

// the outer two cells all round count as ground: a hero sits in the middle, the stage lives at the edges
const isGround = (x, y) => x < 2 || y < 2 || x >= N - 2 || y >= N - 2;

export function gridScore(a, b) {
  let g = 0, gn = 0, w = 0;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const o = (y * N + x) * 3, d = (Math.abs(a[o] - b[o]) + Math.abs(a[o + 1] - b[o + 1]) + Math.abs(a[o + 2] - b[o + 2])) / 3;
    w += d; if (isGround(x, y)) { g += d; gn++; }
  }
  const ground = Math.round(g / gn), whole = Math.round(w / (N * N)), L = limits();
  return { ground, whole, jump: ground >= L.ground || whole >= L.whole, groundJump: ground >= L.ground };
}

export async function joinScore(fileA, fileB) {
  return gridScore(await frameGrid(fileA), await frameGrid(fileB));
}

// one line for a builder or the lead; what to do about it
export function joinLine(label, s) {
  if (!s) return `${label}: could not be measured.`;
  const what = s.groundJump ? 'JUMP: the whole background changes at the join (the ground must carry on from the scene before, not restart)'
    : s.jump ? 'JUMP: the picture changes too much at the join (the next scene must start from the shape, place and colour the scene before ends on)'
      : 'carries on';
  return `${label}: ${what} (background ${s.ground}, whole frame ${s.whole}, of 255).`;
}
