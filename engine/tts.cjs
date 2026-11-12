#!/usr/bin/env node
// Zancut's free AI voice (runs on this computer, no account): English = Kokoro (Apache-2.0), Bangla = Piper bn_BD.
//   node tts.cjs <lang en|bn> <voiceId> <script.txt> <out.wav> [speed]
// Speaks the script sentence by sentence with short pauses; prints {"ok":true,"seconds":…}. Also writes <out>.words.json:
// every word of the script with its time (sentence times are exact, words inside a sentence are spread by length), so
// the video needs no transcription and captions are spelled exactly like the script.
// Models live in ~/.cache/zancut (or $ZANCUT_TTS_DIR): en-tts/kokoro-en-v0_19, bn-tts/model; runtime: bn-tts/node_modules/sherpa-onnx-node.
const fs = require('fs');
const path = require('path');
const os = require('os');

const BASE = process.env.ZANCUT_TTS_DIR || path.join(os.homedir(), '.cache', 'zancut');
// voice id (the setup page's list) → speaker number in each model (checked by pitch: female ≈ 200–250 Hz, male ≈ 100–130 Hz)
const SPEAKERS = {
  en: { 'female-warm': 1, 'female-clear': 3, 'male-calm': 6, 'male-energy': 5 }, // af_bella, af_sarah, am_michael, am_adam
  bn: { 'female-warm': 12, 'female-clear': 15, 'male-calm': 9, 'male-energy': 3 },
};
const models = () => {
  const en = path.join(BASE, 'en-tts', 'kokoro-en-v0_19'), bn = path.join(BASE, 'bn-tts', 'model');
  return {
    en: fs.existsSync(path.join(en, 'model.onnx')) && { kokoro: { model: path.join(en, 'model.onnx'), voices: path.join(en, 'voices.bin'), tokens: path.join(en, 'tokens.txt'), dataDir: path.join(en, 'espeak-ng-data') } },
    bn: fs.existsSync(path.join(bn, 'bn.onnx')) && { vits: { model: path.join(bn, 'bn.onnx'), tokens: path.join(bn, 'tokens.txt'), dataDir: path.join(bn, 'espeak-ng-data') } },
  };
};
const runtime = () => { try { return require(path.join(BASE, 'bn-tts', 'node_modules', 'sherpa-onnx-node')); } catch { return null; } };
// which languages have a voice on this computer
const available = () => (runtime() ? Object.entries(models()).filter(([, m]) => m).map(([k]) => k) : []);
module.exports = { available, SPEAKERS };

if (require.main === module) {
  const [lang, voiceId, scriptFile, out, speed = '1'] = process.argv.slice(2);
  if (lang === '--available') { console.log(JSON.stringify(available())); process.exit(0); }
  const sherpa = runtime(), m = models()[lang];
  if (!sherpa || !m) { console.log(JSON.stringify({ ok: false, error: `no AI voice for "${lang}" on this computer` })); process.exit(1); }
  const tts = new sherpa.OfflineTts({ model: { ...m, numThreads: Math.min(4, os.cpus().length), provider: 'cpu' }, maxNumSentences: 1 });
  const sid = SPEAKERS[lang][voiceId] ?? Object.values(SPEAKERS[lang])[0];
  const text = fs.readFileSync(scriptFile, 'utf8').replace(/\s+/g, ' ').trim();
  // sentences (Bangla ends with ।), long ones split at commas so no piece is too long for the model
  const parts = text.split(/(?<=[.!?।])\s+/).flatMap((s) => (s.length > 220 ? s.split(/(?<=[,;:])\s+/) : [s])).filter((s) => /\p{L}|\p{N}/u.test(s));
  let rate = 0, at = 0; const chunks = [], words = [];
  for (const s of parts) {
    const a = tts.generate({ text: s, sid, speed: Number(speed) || 1 });
    rate = a.sampleRate;
    // the speech inside this piece (the model leaves a little silence at both ends)
    const x = a.samples, loud = (i) => Math.abs(x[i]) > 0.02;
    let b = 0, e = x.length - 1; while (b < e && !loud(b)) b++; while (e > b && !loud(e)) e--;
    const t0 = (at + b) / rate, t1 = (at + e) / rate, ws = s.split(/\s+/).filter(Boolean);
    const weight = ws.map((w) => w.replace(/[^\p{L}\p{N}]/gu, '').length + 2), total = weight.reduce((p, q) => p + q, 0);
    let c = 0;
    ws.forEach((w, i) => { const a0 = t0 + ((t1 - t0) * c) / total; c += weight[i]; words.push({ text: w, start: Math.round(a0 * 1000) / 1000, end: Math.round((t0 + ((t1 - t0) * c) / total) * 1000) / 1000, p: 1 }); });
    const gap = new Float32Array(Math.round(rate * (/[.!?।]$/.test(s) ? 0.32 : 0.18)));
    chunks.push(x, gap); at += x.length + gap.length;
  }
  if (!chunks.length) { console.log(JSON.stringify({ ok: false, error: 'the script is empty' })); process.exit(1); }
  const all = new Float32Array(chunks.reduce((n, c) => n + c.length, 0));
  let o = 0; for (const c of chunks) { all.set(c, o); o += c.length; }
  fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
  sherpa.writeWave(out, { samples: all, sampleRate: rate });
  fs.writeFileSync(out.replace(/\.\w+$/, '') + '.words.json', JSON.stringify(words));
  console.log(JSON.stringify({ ok: true, seconds: Math.round((all.length / rate) * 10) / 10, sentences: parts.length, lang, sid }));
}
