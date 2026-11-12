// Installed local algorithms and SVG catalogs. Nothing here downloads models or starts a render-time clock.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import nlp from 'compromise';
import natural from 'natural';
import rough from 'roughjs';
import Matter from 'matter-js';
import { animate, spring } from 'animejs';
import { line, curveMonotoneX } from 'd3-shape';
import { scaleLinear } from 'd3-scale';
const require = createRequire(import.meta.url);
const packageDir = name => path.dirname(require.resolve(name + '/package.json'));
export const unicodeTokens = text => String(text).normalize('NFC').toLowerCase().match(/[\p{L}\p{M}\p{N}]+/gu) || [];
export function analyzeText(text) {
  const doc = nlp(String(text)), tokens = unicodeTokens(text);
  return { tokens, nouns: doc.nouns().out('array'), verbs: doc.verbs().out('array'), numbers: doc.numbers().out('array'),
    phonetics: Object.fromEntries(tokens.filter(x => /^[a-z]+$/.test(x)).map(x => [x, new natural.SoundEx().process(x)])) };
}
export function rankDescriptions(query, entries) {
  const tfidf = new natural.TfIdf(); entries.forEach(x => tfidf.addDocument(unicodeTokens(x.text)));
  return entries.map((x, i) => ({ ...x, score: tfidf.tfidf(unicodeTokens(query), i) })).sort((a, b) => b.score - a.score);
}
export const chartScale = (domain, range) => scaleLinear(domain, range);
export const chartPath = points => line().curve(curveMonotoneX)(points);
export function roughPath(points, seed = 1) {
  const g = rough.generator(); return g.toPaths(g.linearPath(points, { seed, roughness: 1.1, strokeWidth: 1.4 })).map(p => ({ d: p.d, fill: p.fill, stroke: p.stroke, strokeWidth: p.strokeWidth }));
}
export function tweenAt(from, to, seconds, duration = 1) {
  const target = { value: from }, tween = animate(target, { value: to, duration: duration * 1000, autoplay: false, ease: 'linear' });
  tween.seek(Math.max(0, Math.min(duration, seconds)) * 1000); tween.cancel(); return target.value;
}
export const springAt = u => spring({ stiffness: 100, damping: 14 }).ease(Math.max(0, Math.min(1, u)));
// Bake from initial state at a fixed timestep, rather than stepping from whichever frame was last previewed.
export function physicsFrames({ x = 0, y = 0, vx = 0, vy = 0, radius = 10, floor = 200, seconds = 1, fps = 30 } = {}) {
  if (![x,y,vx,vy,radius,floor,seconds,fps].every(Number.isFinite) || radius <= 0 || seconds < 0 || seconds > 60 || fps < 1 || fps > 120) throw new Error('Invalid bounded physics settings.');
  const engine = Matter.Engine.create(), ball = Matter.Bodies.circle(x, y, radius, { restitution: 0.4 });
  Matter.Composite.add(engine.world, [ball, Matter.Bodies.rectangle(0, floor + 10, 10000, 20, { isStatic: true })]);
  Matter.Body.setVelocity(ball, { x: vx, y: vy }); const frames = [];
  const steps = Math.ceil(120 / fps), delta = 1000 / fps / steps;
  for (let i = 0; i <= Math.round(seconds * fps); i++) { frames.push({ t: i / fps, x: ball.position.x, y: ball.position.y, angle: ball.angle }); for (let j=0;j<steps;j++) Matter.Engine.update(engine, delta); }
  Matter.Engine.clear(engine); return frames;
}
let catalogs;
export function assetCatalog(source = 'openmoji', { q = '', limit = 60 } = {}) {
  catalogs ||= {};
  if (!['openmoji', 'lucide'].includes(source)) throw new Error('Asset source must be openmoji or lucide.');
  if (!catalogs[source]) {
    if (source === 'openmoji') catalogs[source] = JSON.parse(fs.readFileSync(path.join(packageDir('openmoji'), 'data/openmoji.json'), 'utf8')).map(x => ({ id: x.hexcode, label: x.annotation, tags: x.tags, license: 'CC-BY-SA-4.0', credit: 'OpenMoji — HfG Schwäbisch Gmünd', url: 'https://openmoji.org/' }));
    else catalogs[source] = fs.readdirSync(path.join(packageDir('lucide-static'), 'icons')).filter(f => f.endsWith('.svg')).map(f => ({ id: f.slice(0,-4), label: f.slice(0,-4), license: 'ISC', credit: 'Lucide contributors', url: 'https://lucide.dev/' }));
  }
  const query = String(q).toLowerCase(), all = catalogs[source];
  return { source, total: all.length, items: all.filter(x => !query || `${x.label} ${x.tags || ''}`.toLowerCase().includes(query)).slice(0, Math.max(1, Math.min(200, Number(limit) || 60))) };
}
export function assetSvg(source, id) {
  const rule = source === 'openmoji' ? /^[0-9A-F]+(?:-[0-9A-F]+)*$/ : /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  if (!['openmoji', 'lucide'].includes(source) || !rule.test(String(id))) throw new Error('Invalid local asset id.');
  const dir = packageDir(source === 'openmoji' ? 'openmoji' : 'lucide-static');
  return fs.readFileSync(path.join(dir, source === 'openmoji' ? 'color/svg' : 'icons', id + '.svg'), 'utf8');
}
