// Can the viewer read every graphic? Opens the built video page (edit/hf/index.html), stops it in the middle of each
// library graphic and measures every visible text against the ground behind it (WCAG contrast). No AI, ~5 s.
// Returns [{k, lib, at, problem}] for graphics with unreadable text (< 1.8:1), main text under 4% of the short side, or none.
//   node readcheck.mjs <edit/hf folder>   (prints the list as JSON)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import http from 'node:http';

const chrome = () => {
  if (process.env.ZANCUT_CHECK_CHROME && fs.existsSync(process.env.ZANCUT_CHECK_CHROME)) return process.env.ZANCUT_CHECK_CHROME;
  if (process.env.HYPERFRAMES_BROWSER_PATH && fs.existsSync(process.env.HYPERFRAMES_BROWSER_PATH)) return process.env.HYPERFRAMES_BROWSER_PATH; // jobs: the sandbox-safe launcher
  const dir = path.join(os.homedir(), '.cache', 'hyperframes', 'chrome', 'chrome-headless-shell');
  for (const v of fs.existsSync(dir) ? fs.readdirSync(dir).sort().reverse() : []) for (const sub of fs.readdirSync(path.join(dir, v))) {
    const f = path.join(dir, v, sub, process.platform === 'win32' ? 'chrome-headless-shell.exe' : 'chrome-headless-shell');
    if (fs.existsSync(f)) return f;
  }
  return null;
};

// How much is really drawn: the share of pixels at a clear edge (grey-level jump of 22+ to a neighbour) in a small
// grey copy of the frame. An empty ground or a washed-out piece scores near 0; a readable headline well above 0.006.
// The frame goes through a temp file, not stdin (a piped PNG once left ffmpeg waiting for ever, freezing the whole server),
// and ffmpeg has 20 s; if it fails, the frame counts as drawn (1).
function detail(png) {
  const W = 180, f = path.join(os.tmpdir(), `zc-detail-${process.pid}-${Date.now()}.png`);
  fs.writeFileSync(f, png);
  const r = spawnSync('ffmpeg', ['-v', 'error', '-nostdin', '-i', f, '-vf', `scale=${W}:-2,format=gray`, '-f', 'rawvideo', 'pipe:1'], { maxBuffer: 1 << 24, timeout: 20000, stdio: ['ignore', 'pipe', 'pipe'] });
  fs.rmSync(f, { force: true });
  const g = r.stdout; if (!g?.length) return 1;
  const H = Math.floor(g.length / W); let edges = 0;
  for (let y = 0; y < H - 1; y++) for (let x = 0; x < W - 1; x++) { const v = g[y * W + x]; if (Math.abs(v - g[y * W + x + 1]) > 22 || Math.abs(v - g[(y + 1) * W + x]) > 22) edges++; }
  return edges / (W * H);
}

// show one moment like the renderer: the timeline, which clips are on, and every video at its own frame
async function showAt(page, t) {
  await page.evaluate((x) => {
    window.__timelines.main.seek(x);
    for (const c of document.querySelectorAll('.clip[data-start]')) { const a = +c.dataset.start, b = a + (+c.dataset.duration || 0); c.style.visibility = x >= a && x < b ? '' : 'hidden'; }

  }, t);
  await new Promise((r) => setTimeout(r, 40));
}

// in the page: the texts of one graphic at one moment, with their contrast
function measure(sel) {
  const sec = document.querySelector(sel), out = [], sizes = [];
  const parse = (c) => { const m = String(c).match(/rgba?\(([^)]+)\)/); if (!m) return null; const v = m[1].split(/[\s,/]+/).filter(Boolean).map(Number); return { r: v[0], g: v[1], b: v[2], a: v.length > 3 ? v[3] : 1 }; };
  const lum = ({ r, g, b }) => [r, g, b].map((x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }).reduce((s, x, i) => s + x * [0.2126, 0.7152, 0.0722][i], 0);
  const mix = (t, b) => ({ r: t.r * t.a + b.r * (1 - t.a), g: t.g * t.a + b.g * (1 - t.a), b: t.b * t.a + b.b * (1 - t.a), a: 1 });
  const ratio = (x, y) => { const l1 = lum(x), l2 = lum(y); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };
  const page = parse(getComputedStyle(document.body).backgroundColor) || { r: 0, g: 0, b: 0, a: 1 };
  let visibleText = 0;
  if (!document.getElementById('rc-pe')) { const st = document.createElement('style'); st.id = 'rc-pe'; st.textContent = '*{pointer-events:auto!important}'; document.head.appendChild(st); } // so every layer is found under a point
  for (const el of [sec, ...sec.querySelectorAll('*')]) {
    const text = [...el.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim()).map((n) => n.textContent.trim()).join(' ');
    if (!text || !/[\p{L}\p{N}]/u.test(text)) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 3 || r.height < 3) continue;
    let op = 1, hidden = false;
    for (let e = el; e && e !== document.body; e = e.parentElement) { const cs = getComputedStyle(e); op *= Number(cs.opacity); if (cs.visibility === 'hidden' || cs.display === 'none') hidden = true; }
    if (hidden || op < 0.55) continue;
    visibleText++;
    const cs = getComputedStyle(el);
    if (!(el instanceof SVGElement) && el.offsetHeight) sizes.push(parseFloat(cs.fontSize) * (r.height / el.offsetHeight)); // drawn size, scale included
    if (/text/.test(cs.backgroundClip || cs.webkitBackgroundClip || '')) continue;
    const fill = parse(cs.webkitTextFillColor);
    const fg = el instanceof SVGElement ? parse(cs.fill) : fill && fill.a > 0 ? fill : parse(cs.color);
    if (!fg || fg.a === 0) continue;
    // what is painted under the middle of the text: the first solid ground below it (a picture or video first = unknown)
    let bg = null;
    const stack = document.elementsFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    for (const e of stack.slice(Math.max(0, stack.indexOf(el)))) {
      if (e.classList && (e.classList.contains('zk-grain') || e.classList.contains('zk-vig'))) continue; // style texture: see through it
      if (/^(VIDEO|IMG|CANVAS)$/.test(e.tagName) || (e instanceof SVGElement && e.tagName === 'image')) { bg = 'unknown'; break; }
      const s = getComputedStyle(e), c = parse(s.backgroundColor);
      if (c && c.a >= 0.6) { bg = mix(c, page); break; }
      if (s.backgroundImage && /url\(/.test(s.backgroundImage)) { bg = 'unknown'; break; }
    }
    if (!bg || bg === 'unknown') continue;
    out.push([text.slice(0, 30), Math.round(ratio(mix({ ...fg, a: fg.a * Math.min(1, op) }, bg), bg) * 100) / 100]);
  }
  // what must never be on screen: code names and empty slots (a missing fill shows as an icon name, "logo:…", "undefined")
  const I = window.ZK_ICONS || { line: {}, alias: {} }, leaks = [], emptyPics = [];
  for (const el of [sec, ...sec.querySelectorAll('*')]) {
    const t = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join(' ').trim();
    if (!t) continue;
    let op = 1, hid = false; for (let e = el; e && e !== document.body; e = e.parentElement) { const cs = getComputedStyle(e); op *= Number(cs.opacity); if (cs.visibility === 'hidden' || cs.display === 'none') hid = true; }
    if (hid || op < 0.3) continue;
    const k = t.toLowerCase();
    if (/\blogo:|\bundefined\b|\bnull\b|\[object |__params__|\bNaN\b/i.test(t) || (/^[a-z0-9]+(-[a-z0-9]+)+$/.test(k) && (I.line[k] || I.alias[k]))) leaks.push(t.slice(0, 30));
  }
  for (const c of sec.querySelectorAll('.ins-shot, .ins-stage .card')) {
    const cs = getComputedStyle(c), r = c.getBoundingClientRect();
    if (r.width < 40 || Number(cs.opacity) < 0.3) continue;
    if (!/url\(/.test(cs.backgroundImage) && !c.querySelector('video, img, .mock, svg, .im[style*="url"]')) emptyPics.push(Math.round(r.width));
  }
  return { texts: out, visibleText, leaks, emptyPics, sizes };
}

// The built page in a headless browser, served over http like the renderer. Returns { page, size, close } or null.
async function openPage(hfDir) {
  const exe = chrome(), file = path.join(hfDir, 'index.html');
  if (!exe || !fs.existsSync(file)) return null;
  let puppeteer;
  try { puppeteer = (await import('puppeteer-core')).default; } catch { return null; }
  const browser = await puppeteer.launch({ executablePath: exe, headless: true, args: ['--no-sandbox', '--allow-file-access-from-files', '--autoplay-policy=no-user-gesture-required'] });
  let server = null;
  const close = async () => { await browser.close().catch(() => {}); server?.close(); };
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1920 });
    await page.evaluateOnNewDocument(() => { window.__timelines = window.__timelines || {}; }); // HyperFrames makes this when it renders
    // served over http like the real renderer (a file:// page cannot load its web fonts, so its text would stay invisible)
    const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.mp4': 'video/mp4', '.webm': 'video/webm', '.ttf': 'font/ttf', '.otf': 'font/otf', '.woff': 'font/woff', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg', '.wav': 'audio/wav' };
    server = http.createServer((req, res) => {
      const f = path.join(hfDir, decodeURIComponent(new URL(req.url, 'http://x').pathname));
      if (!f.startsWith(hfDir) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
      const type = types[path.extname(f).toLowerCase()] || 'application/octet-stream', size = fs.statSync(f).size;
      const m = /bytes=(\d*)-(\d*)/.exec(req.headers.range || ''); // videos seek with range requests
      if (m) { const a = m[1] ? +m[1] : 0, b = m[2] ? Math.min(+m[2], size - 1) : size - 1; res.writeHead(206, { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Content-Range': `bytes ${a}-${b}/${size}`, 'Content-Length': b - a + 1 }); return fs.createReadStream(f, { start: a, end: b }).pipe(res); }
      res.writeHead(200, { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Content-Length': size }); fs.createReadStream(f).pipe(res);
    });
    await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
    await page.goto(`http://127.0.0.1:${server.address().port}/index.html`, { waitUntil: 'load', timeout: 60000 });
    await page.waitForFunction(() => !!(window.__timelines && window.__timelines.main), { timeout: 30000, polling: 200 });
    await page.evaluate(() => document.fonts.ready);
    const size = await page.evaluate(() => { const c = document.querySelector('[data-composition-id]') || document.body.firstElementChild; return { w: +(c?.dataset?.width) || 1080, h: +(c?.dataset?.height) || 1920 }; });
    await page.setViewport({ width: size.w, height: size.h });
    return { page, size, close };
  } catch (e) { await close(); throw e; }
}

// Pictures of the video at given moments (the storyboard's scene stills): [{ t, file }] → JPEGs, one browser session.
// list: [{ t, file }] or [{ ts: [moments], uid, file }]: with several moments the clearest one is kept, the one where the
// scene's own words, pictures and icons are fully drawn (not half-way in, not fading out, not mid-move)
export async function stills(hfDir, list) {
  const o = await openPage(hfDir);
  if (!o) return 0;
  let n = 0;
  const syncVideos = (t) => o.page.evaluate((t) => Promise.all([...document.querySelectorAll('video[data-start]')].map((v) => {
    const a = +v.dataset.start, d = +v.dataset.duration || 1e9; if (t < a || t >= a + d) return null;
    const to = (+v.dataset.mediaStart || 0) + (t - a);
    return new Promise((ok) => { if (Math.abs(v.currentTime - to) < 0.02 && v.readyState >= 2) return ok(); const done = () => ok(); v.addEventListener('seeked', done, { once: true }); setTimeout(done, 2000); v.currentTime = to; });
  })), t);
  const score = (uid) => o.page.evaluate((uid) => {
    let plan; try { plan = JSON.parse(document.getElementById('hf-plan').textContent); } catch { return 0; }
    const b = (plan.scenes || plan.beats || []).find((x) => x.uid === uid), sec = b && document.getElementById('b' + b.k);
    if (!sec) return 0;
    const W = innerWidth, H = innerHeight;
    const seen = (el) => { let op = 1; for (let x = el; x && x !== document.body; x = x.parentElement) { const cs = getComputedStyle(x); if (cs.display === 'none' || cs.visibility === 'hidden') return 0; op *= +cs.opacity; if (/blur\((?!0)/.test(cs.filter)) op *= 0.5; } return op; };
    const self = getComputedStyle(sec), still = +self.opacity >= 0.98 && !/blur\((?!0)/.test(self.filter);
    let sc = 0;
    for (const el of sec.querySelectorAll('*')) {
      const r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2 || r.right < 0 || r.bottom < 0 || r.left > W || r.top > H) continue;
      const text = [...el.childNodes].filter((x) => x.nodeType === 3).map((x) => x.textContent.trim()).join('');
      const media = /^(IMG|VIDEO|CANVAS|svg)$/i.test(el.tagName) && r.width * r.height > W * H * 0.004;
      if (!text && !media) continue;
      const op = seen(el), full = op >= 0.9 ? 1 : op >= 0.4 ? 0.3 : 0;
      const inside = r.left >= -2 && r.top >= -2 && r.right <= W + 2 && r.bottom <= H + 2 ? 1 : 0.4; // not still sliding in from outside
      sc += full * inside * (text ? Math.min(60, text.length) : 25);
    }
    return still ? sc : sc * 0.5;
  }, uid);
  try {
    for (const x of list) {
      let t = x.t;
      if (x.ts?.length && x.uid) {
        let best = -1; const seen = [];
        for (const c of x.ts) { await showAt(o.page, c); const v = await score(x.uid); seen.push([c, v]); if (v > best + 0.5) { best = v; t = c; } }
        x.ready = seen.find(([, v]) => v >= best * 0.8)?.[0] ?? t; // the first moment it is (nearly) fully drawn
      }
      t ??= x.ts?.[Math.floor((x.ts.length - 1) * 0.6)];
      await showAt(o.page, t);
      await syncVideos(t); // the speaker and their cut-out at the same frame (two heads otherwise)
      await new Promise((r) => setTimeout(r, 120));
      await syncVideos(t);
      fs.writeFileSync(x.file, await o.page.screenshot({ type: 'jpeg', quality: 80 })); n++;
      x.at = t;
    }
  } finally { await o.close(); }
  return n;
}

// range = [from, to] seconds: check only the graphics and blank moments of that part (a one-scene fix)
export async function readCheck(hfDir, { range = null, own = false } = {}) {
  const MIN = own ? 0.0004 : 0.006; // a style with its own graphics (Glossy): one calm glass card on a dark ground has few hard edges
  const o = await openPage(hfDir);
  if (!o) return [];
  const { page, size } = o, found = [];
  try {
    const inRange = (a, b) => !range || (b > range[0] - 0.05 && a < range[1] + 0.05);
    const secs = await page.evaluate(() => [...document.querySelectorAll('section.zc[data-lib]')].filter((s) => !/^(CAP|LF)-/.test(s.dataset.lib))
      .map((s) => ({ id: s.id, k: +s.dataset.k, lib: s.dataset.lib, s: +s.dataset.start, d: +s.dataset.duration }))).then((l) => l.filter((g) => inRange(g.s, g.s + g.d)));
    for (const g of secs) {
      let best = null;
      for (const x of [0.5, 0.75]) { // a graphic counts at its clearest moment
        const at = g.s + g.d * x;
        await showAt(page, at);
        const m = await page.evaluate(measure, `#${g.id}`);
        const worst = m.texts.length ? Math.min(...m.texts.map((t) => t[1])) : null;
        if (!best || (m.visibleText && (best.worst ?? -1) < (worst ?? 99))) best = { ...m, worst, at };
      }
      if (process.env.READCHECK_DEBUG) console.error(g.lib, best.worst, JSON.stringify(best.texts.slice(0, 5)));
      // what the viewer really sees at that moment (catches pieces whose text sits on gradients the DOM check can't measure)
      await showAt(page, best.at);
      const seen = detail(await page.screenshot({ type: 'png' }));
      if (process.env.READCHECK_DEBUG) console.error('  detail', g.lib, seen.toFixed(4));
      const r1 = (x) => Math.round(x * 10) / 10;
      // empty: no visible text and almost nothing drawn (a piece meant to carry words that shows only its ground)
      if (best.leaks?.length) found.push({ k: g.k, lib: g.lib, at: r1(best.at), problem: `shows a code name instead of content: "${best.leaks[0]}"`, empty: true });
      else if (best.emptyPics?.length) found.push({ k: g.k, lib: g.lib, at: r1(best.at), problem: 'has an empty picture card (no picture or video in it)', empty: true });
      else if (seen < MIN) found.push({ k: g.k, lib: g.lib, at: r1(best.at), problem: 'looks empty or washed out (almost nothing visible)', empty: true });
      else if (!best.visibleText) found.push({ k: g.k, lib: g.lib, at: r1(best.at), problem: 'shows no readable text', empty: true });
      else if (best.sizes?.length && Math.max(...best.sizes) < Math.min(size.w, size.h) * 0.04) found.push({ k: g.k, lib: g.lib, at: r1(best.at), problem: `main text is too small (${(Math.max(...best.sizes) / Math.min(size.w, size.h) * 100).toFixed(1)}% of the frame's short side; the standard is at least 4%)` });
      else if (best.worst != null && best.worst < 2.4) found.push({ k: g.k, lib: g.lib, at: r1(best.at), problem: `text "${best.texts.find((t) => t[1] === best.worst)[0]}" is ${best.worst < 1.8 ? 'unreadable' : 'too faint'} (contrast ${best.worst}:1)` });
    }
    // blank moments anywhere: a frame every 0.5 s; 1 s or more of almost nothing on screen is reported
    const D = await page.evaluate(() => window.__timelines.main.duration());
    let run = null;
    const cuts = secs.map((g) => g.s).filter((x) => x > 0.1);
    for (let t = range ? Math.max(0.25, range[0] - 0.5) : 0.25; t < (range ? Math.min(D - 0.2, range[1] + 0.5) : D - 0.2); t += 0.5) {
      await showAt(page, t);
      // real footage on screen (speaker, screen recording, stock clip) is never blank; the faceless plate is not footage
      const footage = await page.evaluate((x) => [...document.querySelectorAll('video[data-start]')].some((v) => {
        const a = +v.dataset.start, b = a + (+v.dataset.duration || 1e9); if (x < a || x >= b || v.dataset.plate) return false;
        let op = 1; for (let e = v; e; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none') return false; op *= +cs.opacity; }
        const r = v.getBoundingClientRect(); return op > 0.5 && r.width * r.height > innerWidth * innerHeight * 0.25;
      }), t);
      const blank = !footage && detail(await page.screenshot({ type: 'png' })) < MIN;
      if (blank) run = run || { from: t, to: t }, run.to = t;
      // a short dip right at a scene change is the cross-dissolve between two scenes, not an empty screen
      const atCut = (r) => cuts.some((c) => c >= r.from - 0.45 && c <= r.to + 0.45) && r.to - r.from < 1.2;
      if ((!blank || t + 0.5 >= D - 0.2) && run) { if (run.to - run.from >= 0.45 && !atCut(run)) found.push({ k: -1, lib: 'blank', at: Math.round(run.from * 10) / 10, problem: `nothing on screen from ${run.from.toFixed(1)} s to ${(run.to + 0.25).toFixed(1)} s: lengthen the piece before or choose one that shows its words sooner` }); run = null; }
    }
  } finally { await o.close(); }
  return found;
}

// A part of a scene seen while its scene is not playing (it covered other scenes: "visibility: visible" inside a hidden scene,
// or anything else that escapes its section). One frame every `step` s; returns [{ k, start, from, to, what }] per scene.
// only = [scene starts] to check those scenes only (a designer's save). No AI, a few seconds.
export async function leakCheck(hfDir, { step = 1, only = null } = {}) {
  const o = await openPage(hfDir);
  if (!o) return [];
  const runs = new Map();
  try {
    const D = await o.page.evaluate(() => window.__timelines.main.duration());
    for (let t = 0.25; t < D; t += step) {
      await showAt(o.page, t);
      const seen = await o.page.evaluate((t, only) => {
        const W = innerWidth, H = innerHeight, out = [];
        for (const sec of document.querySelectorAll('section.zc[data-start]')) {
          const a = +sec.dataset.start, b = a + (+sec.dataset.duration || 0);
          if (t >= a - 0.05 && t < b + 0.05) continue;
          if (only && !only.some((x) => Math.abs(x - a) < 0.05)) continue;
          for (const el of sec.querySelectorAll('*')) {
            const cs = getComputedStyle(el); if (cs.visibility !== 'visible' || cs.display === 'none') continue;
            const r = el.getBoundingClientRect(); if (r.width * r.height < W * H * 0.005 || r.right < 0 || r.bottom < 0 || r.left > W || r.top > H) continue;
            let op = 1; for (let e = el; e && e !== document.body; e = e.parentElement) op *= +getComputedStyle(e).opacity;
            if (op < 0.05) continue;
            out.push({ k: +sec.dataset.k, start: a, what: `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : ''} ${Math.round(r.width)}×${Math.round(r.height)} px` });
            break;
          }
        }
        return out;
      }, t, only);
      for (const x of seen) { const r = runs.get(x.k) || { k: x.k, start: x.start, from: t, to: t, what: x.what }; r.to = t; runs.set(x.k, r); }
    }
  } finally { await o.close(); }
  return [...runs.values()].map((r) => ({ ...r, from: Math.round(r.from * 10) / 10, to: Math.round(r.to * 10) / 10 }));
}

export { openPage, showAt, measure, chrome as chromePath };

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) { console.log(JSON.stringify(await readCheck(path.resolve(process.argv[2] || '.'), { own: process.argv.includes('--own') }))); process.exit(0); }
