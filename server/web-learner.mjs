// AI-free self-learning knowledge: an unknown word becomes a known concept (category, physical properties, synonyms) and, when an
// icon can be found, a permanent 2D prop. No model anywhere: local data and word lists first, then key-free public APIs.
//   Step A (offline): our own memory → words.json / sizes.json / names / concept clusters / b-roll lexicon → OpenMoji + Lucide
//                     catalogs → the local WordNet (natural + wordnet-db: its lexicographer file says animal / food / person …)
//   Step B (online):  Wikipedia REST summaries (bn, en) and Wikidata wbsearchentities / wbgetentities: description, instance-of,
//                     colour, aliases → category and properties by keyword rules
//   Step C (icon):    local OpenMoji first; online Iconify search in permissive colour emoji sets (Fluent Emoji Flat MIT, Noto Apache-2.0,
//                     Twemoji CC-BY-4.0, OpenMoji CC-BY-SA-4.0) → sanitised SVG, normalised to a 0 0 100 100 box, licence recorded
//   Step D (memory):  data/brain/learned-knowledge.json and engine/cartoon/library/learned-props.json (atomic writes)
// Every web response is cached on disk (data/brain/web-cache): a word learned once is known offline for ever.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import natural from 'natural';
import { DATA_DIR, ENGINE_DIR } from './config.mjs';
import { assetCatalog } from './power-libraries.mjs';
import { LEXICON } from './broll.mjs';
import { concepts, stems, findNames, clusterOf, conceptWords } from './entity-resolver.mjs';
import { ZPHYS, refreshLearned } from './physics.mjs';
import { analyzeText } from './power-libraries.mjs';
import { placeForTexts } from './scene-sense.mjs'; // the scene a learned word belongs to ("dolphin" → the sea)

const require = createRequire(import.meta.url);
const NF = (s) => String(s ?? '').normalize('NFC');
const isBn = (s) => /[ঀ-৿]/.test(s);
export const CATEGORIES = ['person', 'animal', 'vehicle', 'building', 'food', 'tool', 'nature', 'finance', 'abstract_concept'];
export const UA = 'Zancut2D-local-learner/0.1 (offline 2D animation tool; rule-based, no AI)';
const LIB = path.join(ENGINE_DIR, 'cartoon', 'library');
const paths = (o = {}) => ({ knowledge: o.knowledgeFile || path.join(DATA_DIR, 'brain', 'learned-knowledge.json'), props: o.propsFile || path.join(LIB, 'learned-props.json'), cache: o.cacheDir || path.join(DATA_DIR, 'brain', 'web-cache') });
const readJSON = (f, d) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { if (e.code === 'ENOENT') return d; throw new Error(`${path.basename(f)} is not valid JSON; fix or remove it (${e.message})`); } };
const writeAtomic = (f, v) => { fs.mkdirSync(path.dirname(f), { recursive: true }); const tmp = `${f}.${process.pid}.tmp`; fs.writeFileSync(tmp, JSON.stringify(v, null, 1)); fs.renameSync(tmp, f); };

// ---------- the web, politely: cached, time-limited, size-limited, only the four public hosts ----------
const HOSTS = new Set(['en.wikipedia.org', 'bn.wikipedia.org', 'www.wikidata.org', 'api.iconify.design']);
// Wikimedia asks automated clients to go slowly: one request per 1.1 s per host, and a 429 stops the lookup (never retried in a loop)
const lastAt = new Map(), limited = new Map(), sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const webStatus = () => ({ rateLimited: [...limited.entries()].filter(([, until]) => until > Date.now()).map(([h]) => h) });
async function web(url, { online, cacheDir, fetchImpl = globalThis.fetch, as = 'json' }) {
  const u = new URL(url); if (!HOSTS.has(u.host)) throw new Error(`web-learner only talks to ${[...HOSTS].join(', ')}`);
  const key = createHash('sha256').update(url).digest('hex').slice(0, 24), file = path.join(cacheDir, `${key}.json`);
  const hit = readJSON(file, null); if (hit && hit.url === url) return hit.body;
  if (!online || (limited.get(u.host) || 0) > Date.now()) return null;
  const gap = u.host.endsWith('wikipedia.org') || u.host.endsWith('wikidata.org') ? 1100 : 250, wait = (lastAt.get(u.host) || 0) + gap - Date.now(); if (wait > 0) await sleep(wait);
  lastAt.set(u.host, Date.now());
  const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 8000);
  try {
    const res = await fetchImpl(url, { headers: { 'User-Agent': UA, Accept: as === 'json' ? 'application/json' : 'image/svg+xml' }, signal: ctl.signal });
    if (res.status === 429) { const ra = Number(res.headers?.get?.('retry-after')) || 60; limited.set(u.host, Date.now() + Math.min(3600, ra) * 1000); return null; }
    if (res.status === 404) { writeAtomic(file, { url, at: new Date().toISOString(), body: null }); return null; }
    if (!res.ok) return null;
    const text = await res.text(); if (text.length > 2_000_000) return null;
    const body = as === 'json' ? JSON.parse(text) : text;
    writeAtomic(file, { url, at: new Date().toISOString(), body }); return body;
  } catch { return null; } finally { clearTimeout(timer); }
}

// ---------- local knowledge ----------
const WORDS = readJSON(path.join(LIB, 'words.json'), { aliases: {} }), SIZES = readJSON(path.join(LIB, 'sizes.json'), { items: {} });
const PIECE_OF = new Map(); for (const id of Object.keys(SIZES.items || {})) for (const w of [id, id.replace(/([a-z])([A-Z])/g, '$1 $2')]) PIECE_OF.set(w.toLowerCase(), id);
for (const [id, ws] of Object.entries(WORDS.aliases || {})) for (const w of [id, id.replace(/([a-z])([A-Z])/g, '$1 $2'), ...ws]) PIECE_OF.set(NF(w).toLowerCase(), id); // "shaheed minar" finds shaheedMinar
const LEX_OF = new Map(); for (const [ws, hex, sizeId, cls] of LEXICON) for (const w of ws) LEX_OF.set(NF(w).toLowerCase(), { hex, sizeId, cls, en: ws.find((x) => /^[a-z ]+$/.test(x)) });
const wordnet = new natural.WordNet(), WN_DICT = path.join(path.dirname(require.resolve('wordnet-db/package.json')), 'dict');
const NOUN_INDEX = new Map(fs.readFileSync(path.join(WN_DICT, 'index.noun'), 'utf8').split('\n').filter((l) => l && !l.startsWith(' ')).map((l) => { const t = l.split(' '), n = +t[2], k = +t[3]; return [t[0], t.slice(4 + k + 2, 4 + k + 2 + n)]; }));
const wnGet = (off) => new Promise((ok) => wordnet.get(+off, 'n', (r) => ok(r)));
// WordNet lexicographer files → our categories (03 Tops … 28 time); artefacts are split by their gloss
const LEXFILE = { 5: 'animal', 13: 'food', 18: 'person', 20: 'nature', 17: 'nature', 19: 'nature', 15: 'building', 21: 'finance', 27: 'nature' };
// the sense in context: senses come most common first; a library piece is a thing (never the "fierce person" sense of tiger) and the
// sense whose category agrees with what the library says about the piece wins (mango → the fruit, kite → the toy)
async function fromWordNet(en, { thing = false, want = null } = {}) {
  const offs = NOUN_INDEX.get(en.toLowerCase().replace(/ /g, '_')); if (!offs) return null;
  const senses = []; for (const off of offs.slice(0, 6)) { const r = await wnGet(off); if (r) senses.push({ r, category: LEXFILE[r.lexFilenum] || (r.lexFilenum === 6 ? artefact(r.gloss) : 'abstract_concept') }); }
  const pool = thing ? senses.filter((x) => x.r.lexFilenum !== 18) : senses, pick = (want && pool.find((x) => x.category === want)) || pool[0] || senses[0]; if (!pick) return null;
  const r = pick.r;
  return { category: pick.category, gloss: r.gloss.split(';')[0].trim(), synonyms: r.synonyms.map((s) => s.replace(/_/g, ' ')).filter((s) => s.toLowerCase() !== en.toLowerCase() && !/[A-Z]/.test(s)), lexFile: r.lexFilenum, sense: senses.indexOf(pick) + 1 };
}
const artefact = (g) => (/\b(vehicles?|conveyance|cars?|boats?|ships?|aircraft|trains?|wheeled|self-propelled)\b/i.test(g) ? 'vehicle' : /\b(buildings?|structures?|house|dwelling|edifice|place of worship|shelter)\b/i.test(g) ? 'building' : 'tool');

// keyword rules over a description (Wikipedia / Wikidata / WordNet gloss), English and Bengali
const RULES = [
  ['person', /\b(human|person|people|actor|actress|politician|writer|poet|singer|player|cricketer|scientist|leader|king|queen|teacher|doctor|farmer)\b|মানুষ|ব্যক্তি|কবি|লেখক|খেলোয়াড়|রাজনীতিবিদ/iu],
  ['vehicle', /\b(vehicle|automobile|car|bus|truck|train|locomotive|boat|ship|vessel|aircraft|airplane|motorcycle|bicycle|rickshaw|tricycle)\b|যান|গাড়ি|নৌকা|জাহাজ/iu],
  ['building', /\b(building|structure|house|temple|mosque|church|bridge|tower|monument|palace|fort|stadium|museum|school building|market hall)\b|ভবন|মসজিদ|মন্দির|সেতু|স্থাপনা/iu],
  ['food', /\b(food|dish|cuisine|fruit|vegetable|drink|beverage|sweet|dessert|snack|bread|spice|curry|rice dish|confection)\b|খাবার|খাদ্য|ফল|সবজি|মিষ্টি|পানীয়/iu],
  ['animal', /\b(species of (fish|bird|mammal|insect|reptile|amphibian)|animal|mammal|bird|fish|insect|reptile|amphibian|breed|cattle|livestock|taxon)\b|প্রাণী|পাখি|মাছ|পোকা|সরীসৃপ/iu],
  ['nature', /\b(plant|tree|flower|river|mountain|lake|forest|weather|natural phenomenon|species of plant|grass|island|sea)\b|গাছ|উদ্ভিদ|ফুল|নদী|পাহাড়|বন/iu],
  ['finance', /\b(currency|money|bank|tax|price|payment|economy|loan|coin|banknote|finance)\b|মুদ্রা|টাকা|ব্যাংক|অর্থনীতি/iu],
  ['tool', /\b(tool|device|instrument|implement|utensil|equipment|machine|appliance|weapon|container|furniture|garment|clothing|toy|kite|ball|doll)\b|যন্ত্র|সরঞ্জাম|পাত্র|পোশাক/iu],
];
export function categorize(texts) {
  const score = Object.fromEntries(CATEGORIES.map((c) => [c, 0]));
  texts.forEach(([text, w]) => { for (const [c, rx] of RULES) if (rx.test(text || '')) score[c] += w; });
  const best = Object.entries(score).sort((a, b) => b[1] - a[1])[0];
  return best[1] > 0 ? best[0] : 'abstract_concept';
}
// physical properties a 2D world needs, from the category and the words (sky things fly; pets are small; …)
export function physicalOf(category, text = '') {
  const t = String(text).toLowerCase(), flies = /\b(birds?|aircraft|airplanes?|kites?|flying|flies|balloons?|clouds?)\b|পাখি|বিমান|ঘুড়ি|উড়ন্ত|উড়ে বেড়ায়/u.test(t) && !/\b(fish|fishes|species of fish)\b|মাছ/u.test(t);
  const big = /\b(elephant|cattle|cow|buffalo|horse|camel|tiger|lion|large|whale|giraffe)\b|হাতি|গরু|মহিষ|ঘোড়া|বাঘ/u.test(t);
  const ZMAP = { tool: 'HELD_IN_HAND', food: 'TABLE_TOP', finance: 'HELD_IN_HAND', abstract_concept: null }, zone = flies ? 'SKY_FLOATING' : category in ZMAP ? ZMAP[category] : 'GROUNDED';
  const band = { person: 'person', vehicle: 'vehicle', building: 'building_tree', food: 'hand_prop', tool: 'hand_prop', finance: 'hand_prop' }[category] || (category === 'animal' ? (big && !flies ? 'vehicle' : 'pet') : category === 'nature' ? (/\b(tree|forest|mountain)\b|গাছ|পাহাড়/u.test(t) ? 'building_tree' : 'hand_prop') : null);
  const range = band ? ZPHYS.BANDS[band] : null;
  return { zone, indoor: ['vehicle', 'building'].includes(category) || (category === 'animal' && big) || (category === 'nature' && band === 'building_tree') ? 'OUTDOOR' : category === 'abstract_concept' ? null : 'EITHER',
    grounded: zone === 'GROUNDED', flying: zone === 'SKY_FLOATING', metres: range ? { min: range[0], usual: +((range[0] + range[1]) / 2).toFixed(2), max: range[1], from: `class ${band}` } : null, color: null };
}

// ---------- SVG: only drawing elements and attributes survive; every id is made unique; the box becomes 0 0 100 100 ----------
const ALLOWED_EL = new Set(['svg', 'g', 'path', 'circle', 'ellipse', 'rect', 'polygon', 'polyline', 'line', 'defs', 'lineargradient', 'radialgradient', 'stop', 'clippath', 'mask']);
const ALLOWED_AT = new Set(['d', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit', 'opacity', 'fill-opacity', 'stroke-opacity', 'transform', 'cx', 'cy', 'r', 'rx', 'ry', 'x', 'y', 'width', 'height', 'points', 'x1', 'y1', 'x2', 'y2', 'offset', 'stop-color', 'stop-opacity', 'gradientunits', 'gradienttransform', 'fx', 'fy', 'id', 'clip-path', 'mask', 'fill-rule', 'clip-rule', 'viewbox', 'maskunits']);
export function sanitizeSvg(svg, prefix) {
  const src = String(svg); if (src.length > 200_000) throw new Error('icon SVG is too large');
  const vb = /viewBox\s*=\s*"([-\d.\s,]+)"/i.exec(src)?.[1].trim().split(/[\s,]+/).map(Number);
  if (!vb || vb.length !== 4 || !vb.every(Number.isFinite) || vb[2] <= 0 || vb[3] <= 0) throw new Error('icon SVG has no usable viewBox');
  const body = src.replace(/<\?xml[\s\S]*?\?>|<!--[\s\S]*?-->|<!DOCTYPE[\s\S]*?>/gi, '').replace(/<(script|style|foreignObject|image|a|use|text)\b[\s\S]*?<\/\1>|<(script|style|foreignObject|image|a|use|text)\b[^>]*\/>/gi, '');
  const out = []; let depth = 0, skip = 0;
  for (const m of body.matchAll(/<(\/?)([a-zA-Z][\w:-]*)([^>]*?)(\/?)>/g)) {
    const [, close, name0, attrs, self] = m, name = name0.toLowerCase();
    if (!ALLOWED_EL.has(name)) { if (!self && !close) skip++; else if (close && skip) skip--; continue; }
    if (skip) continue;
    if (name === 'svg') { if (!close) depth++; else depth--; continue; }
    if (close) { out.push(`</${name0}>`); continue; }
    const kept = [];
    for (const a of attrs.matchAll(/([a-zA-Z][\w:-]*)\s*=\s*("([^"]*)"|'([^']*)')/g)) {
      const k = a[1].toLowerCase(); let v = a[3] ?? a[4] ?? '';
      if (!ALLOWED_AT.has(k) || /javascript:|expression\(|@import/i.test(v)) continue;
      if (/url\(/i.test(v)) { if (!/^url\(#[\w-]+\)$/.test(v.trim())) continue; v = v.replace(/url\(#([\w-]+)\)/, `url(#${prefix}-$1)`); }
      if (k === 'id') v = `${prefix}-${v}`;
      kept.push(`${a[1]}="${v.replace(/"/g, '&quot;')}"`);
    }
    out.push(`<${name0}${kept.length ? ' ' + kept.join(' ') : ''}${self ? '/' : ''}>`);
  }
  const s = 100 / Math.max(vb[2], vb[3]), tx = -vb[0] * s + (100 - vb[2] * s) / 2, ty = -vb[1] * s + (100 - vb[3] * s) / 2;
  return { viewBox: '0 0 100 100', body: `<g transform="translate(${+tx.toFixed(3)} ${+ty.toFixed(3)}) scale(${+s.toFixed(5)})">${out.join('')}</g>`, source: vb };
}
const camel = (s) => 'learned' + String(s).replace(/[^a-zA-Z0-9]+(.)?/g, (_, c) => (c ? c.toUpperCase() : '')).replace(/^./, (c) => c.toUpperCase()).slice(0, 40);

// ---------- the learner ----------
const ICON_SETS = [['fluent-emoji-flat', 'MIT'], ['noto', 'Apache-2.0'], ['twemoji', 'CC-BY-4.0'], ['openmoji', 'CC-BY-SA-4.0']];
async function iconFor(en, { online, cacheDir, fetchImpl, prefix }) {
  const q = en.toLowerCase().trim(), slugQ = q.replace(/\s+/g, '-');
  // local OpenMoji first (installed package, no network)
  const local = assetCatalog('openmoji', { q, limit: 200 }).items.filter((x) => !/flag|face|person|man |woman |people|hand|keycap/.test(x.label));
  const exact = local.find((x) => x.label.toLowerCase() === q) || local.find((x) => new RegExp(`(^|\\s)${q}(\\s|$)`).test(x.label.toLowerCase()));
  if (exact) { const file = path.join(path.dirname(require.resolve('openmoji/package.json')), 'color', 'svg', `${exact.id}.svg`); if (fs.existsSync(file)) return { ...sanitizeSvg(fs.readFileSync(file, 'utf8'), prefix), provider: `openmoji:${exact.id}`, license: 'CC-BY-SA-4.0', credit: 'OpenMoji — HfG Schwäbisch Gmünd', label: exact.label, offline: true }; }
  const found = await web(`https://api.iconify.design/search?query=${encodeURIComponent(q)}&prefixes=${ICON_SETS.map((x) => x[0]).join(',')}&limit=32`, { online, cacheDir, fetchImpl });
  const icons = found?.icons || []; if (!icons.length) return null;
  const rank = (id) => { const [p, n] = id.split(':'); return (n === slugQ ? 0 : n.startsWith(slugQ) ? 1 : 2) * 10 + ICON_SETS.findIndex((x) => x[0] === p); };
  const pick = [...icons].sort((a, b) => rank(a) - rank(b))[0], [setId, name] = pick.split(':'), lic = found.collections?.[setId]?.license?.spdx || ICON_SETS.find((x) => x[0] === setId)?.[1];
  if (!ICON_SETS.some((x) => x[0] === setId)) return null;
  const svg = await web(`https://api.iconify.design/${setId}/${name}.svg`, { online, cacheDir, fetchImpl, as: 'text' }); if (!svg) return null;
  return { ...sanitizeSvg(svg, prefix), provider: `iconify:${pick}`, license: lic, credit: found.collections?.[setId]?.author?.name || setId, url: `https://icon-sets.iconify.design/${setId}/${name}/`, label: name.replace(/-/g, ' '), offline: false };
}
async function wikiOnline(term, { online, cacheDir, fetchImpl }) {
  const bn = isBn(term), out = { texts: [], aliases: [], en: null, qid: null, sources: [] };
  const sum = async (lang, title) => { const j = await web(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, '_'))}`, { online, cacheDir, fetchImpl }); if (j && j.type !== 'disambiguation' && j.extract) { out.texts.push([j.description || '', 3], [j.extract.slice(0, 600), 1]); out.qid ||= j.wikibase_item || null; out.sources.push({ kind: 'wikipedia', lang, title: j.title, url: j.content_urls?.desktop?.page || null, license: 'CC BY-SA 4.0 (facts only kept)' }); if (lang === 'en') out.en ||= j.title; } return j; };
  await sum(bn ? 'bn' : 'en', term);
  if (!out.qid) { const s = await web(`https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(term)}&language=${bn ? 'bn' : 'en'}&uselang=en&format=json&limit=3&type=item`, { online, cacheDir, fetchImpl }); const ranked = (s?.search || []).filter((x) => !/disambiguation|family name|given name|surname|wikimedia/i.test(x.description || '')).map((x) => ({ x, score: (/bangladesh|bengal|বাংলাদেশ|বাংলা/i.test(x.description || '') ? 2 : 0) + (bn ? 0.5 : 0) * (/(india|asia)/i.test(x.description || '') ? 1 : 0) })).sort((a, b) => b.score - a.score);
    out.qid = ranked[0]?.x.id || null; if (ranked[0]?.x.description) out.texts.push([ranked[0].x.description, 3]); }
  if (out.qid && /^Q\d+$/.test(out.qid)) {
    const e = (await web(`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${out.qid}&props=labels|descriptions|aliases|claims|sitelinks&languages=en|bn&sitefilter=enwiki&format=json`, { online, cacheDir, fetchImpl }))?.entities?.[out.qid];
    if (e) {
      out.texts.push([e.descriptions?.en?.value || '', 3], [e.descriptions?.bn?.value || '', 3]);
      out.aliases.push(...['en', 'bn'].flatMap((l) => (e.aliases?.[l] || []).map((a) => a.value)), e.labels?.bn?.value, e.labels?.en?.value);
      out.en ||= e.sitelinks?.enwiki?.title || e.labels?.en?.value || null;
      const ids = (p) => (e.claims?.[p] || []).map((c) => c.mainsnak?.datavalue?.value?.id).filter((x) => /^Q\d+$/.test(x || ''));
      const linked = [...ids('P31'), ...ids('P279'), ...ids('P462')].slice(0, 12);
      if (ids('P31').includes('Q5')) out.texts.push(['human', 6]);
      if (linked.length) { const L = (await web(`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${linked.join('|')}&props=labels&languages=en&format=json`, { online, cacheDir, fetchImpl }))?.entities || {};
        for (const q of [...ids('P31'), ...ids('P279')]) out.texts.push([L[q]?.labels?.en?.value || '', 3]);
        out.color = ids('P462').map((q) => L[q]?.labels?.en?.value).find(Boolean) || null; }
      out.sources.push({ kind: 'wikidata', id: out.qid, url: `https://www.wikidata.org/wiki/${out.qid}`, license: 'CC0' });
      if (bn && out.en && !out.texts.some(([, w], i) => w === 1)) await sum('en', out.en);
    }
  }
  return out;
}
// term → concept. options: online (default true; ZANCUT_OFFLINE=1 forces off), fetch (injectable), knowledgeFile, propsFile, cacheDir, save
export async function learn(term0, options = {}) {
  const term = NF(term0).trim(); if (!term || term.length > 60) throw new Error('Give one word or short phrase (1–60 characters).');
  const P = paths(options), online = options.online !== false && process.env.ZANCUT_OFFLINE !== '1', fetchImpl = options.fetch || globalThis.fetch, save = options.save !== false;
  const key = stems(term).at(-1).toLowerCase(), mem = readJSON(P.knowledge, { version: 1, concepts: {} });
  const remembered = mem.concepts[term.toLowerCase()] || mem.concepts[key];
  if (remembered && (!remembered.prop || readJSON(P.props, { props: {} }).props?.[remembered.prop])) return { ...remembered, from: 'memory' }; // a remembered prop whose file is gone is learned again
  const forms = [term, ...stems(term)].map((s) => s.toLowerCase());
  // Step A: what we already know locally
  const name = findNames(term).find((m) => m.via === 'names');
  const piece = forms.map((f) => PIECE_OF.get(f)).find(Boolean), lex = forms.map((f) => LEX_OF.get(f)).find(Boolean), concept = concepts(term)[0];
  const pieceWords = piece ? [piece.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase(), ...(WORDS.aliases[piece] || []).filter((w) => /^[a-z ]+$/i.test(w))] : [];
  let en = !isBn(term) ? term.toLowerCase() : lex?.en || pieceWords.find((w) => NOUN_INDEX.has(w.toLowerCase().replace(/ /g, '_'))) || pieceWords[0] || null;
  const texts = [], sources = [], synonyms = new Set(), local = [];
  if (name) { texts.push(['human person', 9]); local.push('names.json'); }
  if (piece) { local.push(`library piece ${piece}`); texts.push([SIZES.items?.[piece]?.what || piece, 3]); for (const w of WORDS.aliases[piece] || []) synonyms.add(w); }
  if (lex) { local.push('b-roll lexicon'); }
  if (concept && !piece && !lex && !name) { local.push(`concept ${concept.id}`); const c = clusterOf(concept.id); texts.push([c?.category || '', 2]); }
  const pieceCat0 = piece ? categorize([[SIZES.items?.[piece]?.what || '', 3]]) : 'abstract_concept';
  const wn = en ? await fromWordNet(en, { thing: !!(piece || lex), want: pieceCat0 !== 'abstract_concept' ? pieceCat0 : null }) : null; if (wn) { texts.push([wn.gloss, 2]); wn.synonyms.forEach((s) => synonyms.add(s)); local.push('WordNet'); }
  // WordNet's own category wins; an artefact is refined by the library's description of the piece
  // the library's own description of a piece wins when it names a category ("a pile of fruit" → food, though WordNet's first
  // "mango" is the tree and its first "kite" is a cheque); else WordNet's category; an artefact is refined by that description
  let category = name ? 'person' : wn ? (wn.lexFile === 6 && piece ? artefact(`${wn.gloss} ${SIZES.items?.[piece]?.what || ''}`) : wn.category) : pieceCat0 !== 'abstract_concept' ? pieceCat0 : null;
  if (!category && concept?.category && !piece && !lex) category = concept.category;
  // Step B: the open web (only if we still do not know what it is)
  let webInfo = null;
  if ((!category || category === 'abstract_concept') && !piece && !name && online || (options.alwaysWeb && online)) {
    webInfo = await wikiOnline(term, { online, cacheDir: P.cache, fetchImpl });
    texts.push(...webInfo.texts); webInfo.aliases.filter(Boolean).forEach((a) => synonyms.add(a)); sources.push(...webInfo.sources); en ||= webInfo.en;
    if (en && !wn) { const w2 = await fromWordNet(en.split(' ').slice(-1)[0]); if (w2) { texts.push([w2.gloss, 1]); w2.synonyms.forEach((s) => synonyms.add(s)); } }
  } else if (!online && !category && !piece && !name) { webInfo = await wikiOnline(term, { online: false, cacheDir: P.cache, fetchImpl }); if (webInfo.texts.length) { texts.push(...webInfo.texts); webInfo.aliases.filter(Boolean).forEach((a) => synonyms.add(a)); sources.push(...webInfo.sources.map((s) => ({ ...s, cached: true }))); en ||= webInfo.en; } }
  if (piece && !category) category = categorize(texts);
  if (!category || (category === 'abstract_concept' && texts.length)) category = categorize(texts);
  const known = !!(name || piece || lex || wn || concept || sources.length);
  const props = known ? physicalOf(category, [term, en || '', ...texts.filter((t) => t[1] >= 2).map((t) => t[0])].join(' ')) : { zone: null, indoor: null, grounded: null, flying: null, metres: null, color: null }; if (webInfo?.color) props.color = webInfo.color;
  if (piece && known) { props.zone = ZPHYS.zoneOf(piece); props.grounded = props.zone === 'GROUNDED'; props.flying = props.flying || props.zone === 'SKY_FLOATING'; } // the library's real anchor (a kite piece is held on its reel, and still flies)
  if (piece && SIZES.items?.[piece]?.height) { const h = SIZES.items[piece].height; props.metres = { min: h[0], usual: h[1] ?? h[0], max: h.at(-1), from: 'sizes.json' }; }
  // Step C: a 2D prop (not for people, places already in the library or abstract ideas)
  let prop = null;
  if (options.icon !== false && en && !name && !piece && category !== 'abstract_concept' && category !== 'person') {
    const id = camel(en), hints = texts.map((t) => /\bspecies of ([a-z]+)|\b(?:a|an|the) (?:kind|type) of ([a-z]+)/i.exec(t[0] || '')).filter(Boolean).map((m) => m[1] || m[2]);
    // no exact icon: a generic one for its kind, named in the descriptions (fruit, flower, fish …), marked as generic
    const KINDS = ['fruit', 'vegetable', 'flower', 'tree', 'fish', 'bird', 'insect', 'snake', 'boat', 'ship', 'car', 'bus', 'train', 'bridge', 'house', 'temple', 'mosque', 'drum', 'sweet', 'cake', 'bread', 'cup', 'knife', 'book', 'coin'];
    const kinds = KINDS.filter((k) => texts.some((t) => t[1] >= 1 && new RegExp(`\\b${k}s?\\b`, 'i').test(t[0] || '')));
    let icon = null, generic = false; for (const q of [...new Set([lex?.en || en, ...hints])]) { icon = await iconFor(q, { online, cacheDir: P.cache, fetchImpl, prefix: id }); if (icon) break; }
    if (!icon) for (const q of kinds) { icon = await iconFor(q, { online, cacheDir: P.cache, fetchImpl, prefix: id }); if (icon) { generic = q; break; } }
    if (icon) prop = { id, label: icon.label, term, category, zone: props.zone, metres: props.metres, viewBox: icon.viewBox, body: icon.body, source: { provider: icon.provider, license: icon.license, credit: icon.credit, url: icon.url || null }, ...(generic ? { generic: `a generic ${generic} icon (no exact icon for ${en})` } : {}), learnedAt: new Date().toISOString() };
  }
  const notes = webStatus().rateLimited.length ? [`rate-limited by ${webStatus().rateLimited.join(', ')}: try again later`] : [];
  const result = { term, key, known, notes, category, english: en, properties: props, synonyms: [...synonyms].filter((s) => s && NF(s).toLowerCase() !== term.toLowerCase()).slice(0, 20), concept: concept?.id || null, piece: piece || null, prop: prop ? prop.id : null, place: known && !['animal', 'person'].includes(category) ? placeForTexts([term, en || '', ...synonyms, ...texts.filter((t) => t[1] >= 2).map((t) => t[0]), ...(piece ? [String(WORDS.aliases?.[piece] || ''), ...(SIZES.items?.[piece]?.what ? [SIZES.items[piece].what] : [])] : [])]) : null, local, sources, learnedAt: new Date().toISOString(), from: sources.some((s) => !s.cached) ? 'web' : sources.length ? 'cache' : known ? 'local' : 'unknown' };
  // Step D: remember (only what we actually know)
  let refreshAfter = false;
  if (save && known) {
    const m2 = readJSON(P.knowledge, { version: 1, concepts: {} }); m2.concepts[term.toLowerCase()] = result; if (key !== term.toLowerCase()) m2.concepts[key] = result; writeAtomic(P.knowledge, m2);
    if (prop) { refreshAfter = true; const lib = readJSON(P.props, { about: 'Props learned by server/web-learner.mjs: sanitised SVG in a 0 0 100 100 box, real-size class, support zone, licence. Drawn by ZS like any library prop.', props: {} }); lib.props[prop.id] = prop; writeAtomic(P.props, lib); }
  }
  if (refreshAfter) refreshLearned(P.props); // the physics size table knows the new prop at once
  return result;
}
// a story's words that nobody knows yet: English nouns WordNet lacks, Bengali words no local list has (not names, verbs or stopwords)
const BN_VERB_END = ['ল', 'লো', 'লেন', 'ছে', 'ছিল', 'বে', 'বেন', 'তে', 'চ্ছে', 'লাম', 'ছি', 'ব', 'ত', 'ন', 'ুন', 'ো', 'য়ে', 'িয়ে', 'য়ে'].map(NF);
// conjunctive participles end in ে like a place word (বেড়ে vs বাজারে): the common ones are verbs, never unknown nouns
const BN_PARTICIPLES = new Set(['বেড়ে', 'খেয়ে', 'দেখে', 'শুনে', 'হেসে', 'বসে', 'উঠে', 'ফিরে', 'নিয়ে', 'দিয়ে', 'গিয়ে', 'এসে', 'পেয়ে', 'চেয়ে', 'করে', 'বলে', 'ধরে', 'মেরে', 'কেটে', 'রেখে', 'ভেবে', 'জেনে', 'বুঝে', 'পড়ে', 'লিখে', 'হেঁটে', 'দৌড়ে', 'ঘুমিয়ে', 'কেঁদে', 'হয়ে', 'থেকে', 'পেরে', 'ছেড়ে', 'ভেঙে', 'বেঁধে', 'তুলে', 'খুলে', 'ঢুকে', 'বেরিয়ে', 'নেমে', 'চড়ে', 'ঘুরে', 'মিশে', 'জমে', 'কমে', 'বেঁচে', 'সেজে', 'নেচে', 'গেয়ে', 'ডেকে', 'ছুটে', 'লাফিয়ে', 'তাকিয়ে', 'দাঁড়িয়ে', 'শুয়ে', 'জেগে', 'হারিয়ে', 'পালিয়ে', 'সাজিয়ে', 'চালিয়ে'].map(NF));
const BN_STOP = new Set(['সে', 'তার', 'তাকে', 'তিনি', 'তাঁর', 'তারা', 'তাদের', 'আমি', 'আমার', 'আমরা', 'আমাদের', 'তুমি', 'তোমার', 'আপনি', 'আপনার', 'ও', 'ওর', 'ওরা', 'উনি', 'এটা', 'ওটা', 'এবং', 'আর', 'কিন্তু', 'তাই', 'যে', 'এই', 'সেই', 'ওই', 'একটা', 'একটি', 'অনেক', 'খুব', 'সব', 'কোনো', 'কিছু', 'থেকে', 'জন্য', 'দিয়ে', 'নিয়ে', 'সাথে', 'মধ্যে', 'উপর', 'নিচে', 'পরে', 'আগে', 'আজ', 'কাল', 'এখন', 'তখন', 'হঠাৎ', 'না', 'হ্যাঁ', 'কি', 'কী', 'কেন', 'কোথায়', 'কখন'].map(NF));
export function unknownWords(sentences, { max = 4 } = {}) {
  const out = new Map();
  for (const s of sentences) {
    for (const n of analyzeText(s).nouns.flatMap((x) => x.toLowerCase().replace(/^(the|a|an|his|her|their|my|our|its)\s+/, '').split(/\s+/)).filter((w) => /^[a-z]{3,}$/.test(w))) if (!NOUN_INDEX.has(n) && !PIECE_OF.has(n) && !LEX_OF.has(n)) out.set(n, s);
    for (const tok of NF(s).split(/[\s,.!?।;:"'()\-]+/u).filter((t) => /[\u0980-\u09FF]{2,}/.test(t))) {
      const st = stems(tok), base = [...st].sort((a, b) => a.length - b.length)[0];
      if (st.some((x) => PIECE_OF.has(x.toLowerCase()) || LEX_OF.has(x.toLowerCase()) || BN_STOP.has(x) || conceptWords.has(x)) || BN_PARTICIPLES.has(NF(tok)) || findNames(tok).length || concepts(tok).length || BN_VERB_END.some((e) => NF(tok).endsWith(e)) || base.length < 2) continue;
      out.set(base, s);
    }
  }
  return [...out.keys()].slice(0, max);
}
export async function learnUnknown(sentences, options = {}) {
  const P = paths(options), mem = readJSON(P.knowledge, { concepts: {} }).concepts, done = [];
  for (const w of unknownWords(sentences, options)) { if (mem[w.toLowerCase()]) continue; try { const r = await learn(w, options); if (r.known) done.push(r); } catch { /* a word that cannot be learned stays unknown */ } }
  return done;
}
export const learnedProps = (o = {}) => readJSON(paths(o).props, { props: {} }).props;
export const knowledge = (o = {}) => readJSON(paths(o).knowledge, { concepts: {} }).concepts;
// the browser side: learned props become ZS pieces (drawn from their sanitised SVG) with a real size for the world
export function learnedPropsJS(o = {}) {
  const props = Object.values(learnedProps(o)); if (!props.length) return '';
  const items = Object.fromEntries(props.map((p) => [p.id, { what: `${p.label} (learned)`, anchor: { SKY_FLOATING: 'sky', HELD_IN_HAND: 'held', TABLE_TOP: 'ground', WALL_MOUNTED: 'wall' }[p.zone] || 'ground', height: p.metres ? [p.metres.min, p.metres.usual, p.metres.max] : [0.15, 0.2, 0.3] }]));
  return `\n// learned props (server/web-learner.mjs)\n(function(){ const L = ${JSON.stringify(props.map((p) => ({ id: p.id, about: `${p.label}: learned ${p.source.provider} (${p.source.license})`, body: p.body })))};
  const D = (window.ZWORLD_DATA ||= { sizes: { items: {} }, drawn: {} }); D.sizes.items = Object.assign(D.sizes.items || {}, ${JSON.stringify(items)});
  for (const p of L) if (window.ZS && !ZS[p.id]) ZS.define(p.id, { about: p.about, kind: 'prop', tags: ['learned'] }, (layer, o) => { const h = o.h || 60, g = ZC.el('g', { transform: o.flip ? 'scale(-1 1)' : '' }, layer), s = ZC.el('svg', { viewBox: '0 0 100 100', x: -h / 2, y: -h, width: h, height: h, overflow: 'visible' }, g); s.innerHTML = p.body;
    // icons are padded inside their box: fit the view to the drawing itself, so its visible bottom stands exactly on the base point
    try { const b = s.firstElementChild.getBBox(), m = s.firstElementChild.getCTM && s.firstElementChild.transform.baseVal.consolidate()?.matrix; const x0 = m ? m.a * b.x + m.e : b.x, y0 = m ? m.d * b.y + m.f : b.y, w = m ? m.a * b.width : b.width, hh = m ? m.d * b.height : b.height;
      if (w > 0 && hh > 0) { const W = h * w / hh; s.setAttribute('viewBox', [x0, y0, w, hh].join(' ')); s.setAttribute('x', -W / 2); s.setAttribute('width', W); } } catch { /* no layout: the padded box is used */ }
    return g; }); })();\n`;
}
