// The art director's code check: the page's real geometry at the 3 frames of each scene (first moment, key-word peak, last
// frame) in headless Chrome. No AI. Finds what numbers can see: text outside the frame or cut by a parent, Bangla lines too tight,
// text on text, text on the speaker's face, text too small or too faint, code names showing, and (screen recordings) cards covering
// the highlighted UI. Claude then looks at the contact sheet and confirms or dismisses these.
//   import { checkDom } from './check-dom.mjs';  checkDom(hfDir, [{ row, uid, ts: [t0, t1, t2], cues }]) → { [row]: ["at 0.2 s: …"] }
// cues (the scene's sound cues, [name, scene seconds]): each must land on something that starts to move in the scene then (the
// page's real timeline is read), else the sound plays over nothing.
import { openPage, showAt, measure } from './readcheck.mjs';

function geometry(uid) {
  let plan; try { plan = JSON.parse(document.getElementById('hf-plan').textContent); } catch { return { none: true }; }
  const b = (plan.scenes || plan.beats || []).find((x) => x.uid === uid), sec = b && document.getElementById('b' + b.k);
  if (!sec) return { none: true };
  const W = innerWidth, H = innerHeight, out = [], items = [];
  const seen = (el) => { let op = 1; for (let e = el; e && e !== document.body; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') return 0; op *= Number(cs.opacity); } return op; };
  const hl = document.getElementById('scr-hl'), hr = hl && seen(hl) > 0.3 ? hl.getBoundingClientRect() : null;
  let face = null; try { face = window.ZK && window.ZK.face ? window.ZK.face(sec) : null; } catch {}
  let maxSize = 0;
  for (const el of [sec, ...sec.querySelectorAll('*')]) {
    const text = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join(' ').trim();
    if (!text || !/[\p{L}\p{N}]/u.test(text) || seen(el) < 0.55) continue;
    const r = el.getBoundingClientRect(); if (r.width < 3 || r.height < 3) continue;
    const cs = getComputedStyle(el), label = text.slice(0, 24);
    if (r.left < -2) out.push(`"${label}" runs off the frame left by ${Math.round(-r.left)}px`);
    if (r.right > W + 2) out.push(`"${label}" runs off the frame right by ${Math.round(r.right - W)}px (viewport width ${W}px)`);
    if (r.top < -2) out.push(`"${label}" runs off the frame top by ${Math.round(-r.top)}px`);
    if (r.bottom > H + 2) out.push(`"${label}" runs off the frame bottom by ${Math.round(r.bottom - H)}px (viewport height ${H}px)`);
    for (let p = el.parentElement; p && p !== sec.parentElement; p = p.parentElement) { // cut by a parent that hides overflow
      const pc = getComputedStyle(p); if (!/hidden|clip/.test(pc.overflow + pc.overflowX + pc.overflowY)) continue;
      const pr = p.getBoundingClientRect();
      const cutL = pr.left - r.left, cutR = r.right - pr.right, cutT = pr.top - r.top, cutB = r.bottom - pr.bottom;
      if (cutL > 2 || cutR > 2 || cutT > 2 || cutB > 2) {
        const pDesc = p.className ? `.${String(p.className).trim().split(/\s+/)[0]}` : p.tagName.toLowerCase();
        const side = cutR > 2 ? `right by ${Math.round(cutR)}px` : cutL > 2 ? `left by ${Math.round(cutL)}px` : cutB > 2 ? `bottom by ${Math.round(cutB)}px` : `top by ${Math.round(cutT)}px`;
        out.push(`"${label}" is clipped by its container ${pDesc} on the ${side}`);
        break;
      }
    }
    if (el.scrollWidth > el.clientWidth + 2 && /hidden|clip/.test(cs.overflowX || '')) {
      out.push(`"${label}" overflows container width by ${Math.round(el.scrollWidth - el.clientWidth)}px`);
    }
    if (/[ঀ-৿]/.test(text)) {
      const fs = parseFloat(cs.fontSize), lh = parseFloat(cs.lineHeight);
      if (lh && fs && lh / fs < 1.3) out.push(`Bangla "${label}" has line-height ${(lh / fs).toFixed(2)} (needs 1.35 or more: conjuncts get clipped)`);
      if (el.scrollHeight > el.clientHeight + 3 && /hidden|clip/.test(cs.overflowY)) out.push(`Bangla "${label}" is clipped at the top or bottom by ${Math.round(el.scrollHeight - el.clientHeight)}px`);
    }
    if (face) { const x0 = Math.max(r.left, face.x), y0 = Math.max(r.top, face.y), x1 = Math.min(r.right, face.x + face.w), y1 = Math.min(r.bottom, face.y + face.h); if (x1 > x0 && y1 > y0 && (x1 - x0) * (y1 - y0) > 0.25 * r.width * r.height) out.push(`"${label}" covers the speaker's face`); }
    if (hr) { const x0 = Math.max(r.left, hr.left), y0 = Math.max(r.top, hr.top), x1 = Math.min(r.right, hr.right), y1 = Math.min(r.bottom, hr.bottom); if (x1 > x0 && y1 > y0 && (x1 - x0) * (y1 - y0) > 0.15 * hr.width * hr.height) out.push(`"${label}" covers the highlighted part of the screen`); }
    if (el.offsetHeight) maxSize = Math.max(maxSize, parseFloat(cs.fontSize) * (r.height / el.offsetHeight));
    items.push({ el, r, label });
  }
  for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) { // text on text (not one inside the other)
    const a = items[i], b2 = items[j]; if (a.el.contains(b2.el) || b2.el.contains(a.el)) continue;
    const x0 = Math.max(a.r.left, b2.r.left), y0 = Math.max(a.r.top, b2.r.top), x1 = Math.min(a.r.right, b2.r.right), y1 = Math.min(a.r.bottom, b2.r.bottom);
    if (x1 > x0 && y1 > y0 && (x1 - x0) * (y1 - y0) > 0.3 * Math.min(a.r.width * a.r.height, b2.r.width * b2.r.height)) {
      out.push(`"${a.label}" collides with "${b2.label}" (overlap ${Math.round(x1 - x0)}x${Math.round(y1 - y0)}px)`);
      i = items.length;
      break;
    }
  }
  if (items.length && maxSize < Math.min(W, H) * 0.035) out.push(`the biggest text is only ${(maxSize / Math.min(W, H) * 100).toFixed(1)}% of the frame's short side (too small for a phone)`);
  return { found: [...new Set(out)].slice(0, 8), sec: '#' + sec.id };
}

// when things in the scene start to move (scene seconds), from the page's own timeline
function motionStarts(uid) {
  let plan; try { plan = JSON.parse(document.getElementById('hf-plan').textContent); } catch { return null; }
  const b = (plan.scenes || []).find((x) => x.uid === uid), sec = b && document.getElementById('b' + b.k), tl = window.__timelines && window.__timelines.main;
  if (!sec || !tl) return null;
  const out = [];
  for (const tw of tl.getChildren(true, true, false)) {
    const tg = (tw.targets ? tw.targets() : []).filter((x) => x && x.nodeType === 1 && x !== sec && sec.contains(x));
    if (tg.length && (tw.duration() > 0.05 || tw.startTime() > b.s + 0.02)) out.push(Math.round((tw.startTime() - b.s) * 100) / 100);
  }
  return [...new Set(out)].sort((x, y) => x - y);
}
export async function checkDom(hfDir, scenes) {
  const res = {}, o = await openPage(hfDir);
  if (!o) return res;
  try {
    for (const sc of scenes) {
      const found = [];
      for (const t of sc.ts) {
        await showAt(o.page, t);
        const g = await o.page.evaluate(geometry, sc.uid);
        if (g.none) continue;
        for (const x of g.found) found.push(`at ${t.toFixed(1)} s: ${x}`);
        const m = await o.page.evaluate(measure, g.sec);
        if (m.leaks?.length) found.push(`at ${t.toFixed(1)} s: shows a code name instead of content ("${m.leaks[0]}")`);
        if (m.emptyPics?.length) found.push(`at ${t.toFixed(1)} s: an empty picture card`);
        if (m.worst != null || m.texts?.length) { const w = Math.min(...m.texts.map((x) => x[1])); if (w < 2.4) found.push(`at ${t.toFixed(1)} s: text is too faint (contrast ${w}:1)`); }
      }
      if (Array.isArray(sc.cues) && sc.cues.length) {
        const starts = await o.page.evaluate(motionStarts, sc.uid);
        if (starts?.length) for (const [name, at] of sc.cues) {
          const near = starts.reduce((b, x) => (Math.abs(x - at) < Math.abs(b - at) ? x : b), Infinity), room = /^wh-/.test(name) ? 0.35 : 0.2;
          if (Math.abs(near - at) > room) found.push(`the sound "${name}" at ${at.toFixed(2)} s plays over nothing (the nearest thing starts to move at ${near.toFixed(2)} s): move the cue or the motion so they meet`);
        }
      }
      res[sc.row] = [...new Set(found)].slice(0, 10);
    }
  } finally { await o.close(); }
  return res;
}
