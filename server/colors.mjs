// The dynamic colour harmony engine: the customer's colour theme (Step 1) + light/dark → the CSS tokens every scene uses.
// No more flat pitch-black: the grounds are tinted with the customer's own hues; a third harmonious accent, a bright tint,
// and meaning colours (positive / negative) are derived from the pick.
//   computeColorHarmony('#1FB6F5', '#7B4DFF', 'dark') → { '--zk-a': …, '--zk-bg-deep': …, … }
const hexToRgb = (h) => { const m = /^#?([0-9a-f]{6})$/i.exec(String(h).trim()); if (!m) return null; const n = parseInt(m[1], 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const rgbToHex = (c) => '#' + c.map((x) => Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, '0')).join('');
export function hexToHsl(h) {
  const c = hexToRgb(h); if (!c) return null;
  const [r, g, b] = c.map((x) => x / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
  let hh = 0, s = 0;
  if (mx !== mn) {
    const d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    hh = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; hh *= 60;
  }
  return [Math.round(hh), Math.round(s * 100), Math.round(l * 100)];
}
export function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l), f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return rgbToHex([f(0) * 255, f(8) * 255, f(4) * 255]);
}
const lum = (h) => { const c = hexToRgb(h).map((x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
export const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
// blend hue h toward target hue t by k (0..1), the short way round the colour wheel
const towardHue = (h, t, k) => { let d = ((t - h + 540) % 360) - 180; return Math.round((h + d * k + 360) % 360); };
const mixHex = (a, b, k) => { const x = hexToRgb(a), y = hexToRgb(b); return rgbToHex(x.map((v, i) => v + (y[i] - v) * k)); };

export function computeColorHarmony(primary, secondary, polarity = 'dark') {
  const pa = hexToHsl(primary) || [199, 92, 54], pb = hexToHsl(secondary || primary) || pa;
  const [Ha, Sa, La] = pa, [Hb] = pb;
  const light = polarity === 'light';
  let A = hslToHex(Ha, Sa, La), B = hslToHex(pb[0], pb[1], pb[2]);
  const bgDeep = light ? hslToHex(Ha, 60, 96) : hslToHex(Ha, 42, 7);
  const bgMid = light ? hslToHex(Hb, 55, 90) : hslToHex(Hb, 48, 14);
  // on a light ground a bright accent must still read (3:1): darken it in its own hue
  if (light) { let l = La; while (contrast(hslToHex(Ha, Sa, l), bgDeep) < 3 && l > 18) l -= 3; A = hslToHex(Ha, Sa, l); let lb = pb[2]; while (contrast(hslToHex(pb[0], pb[1], lb), bgDeep) < 3 && lb > 18) lb -= 3; B = hslToHex(pb[0], pb[1], lb); }
  const tint = hslToHex(Ha, Math.max(40, Sa - 10), Math.min(90, La + 24));
  const third = hslToHex((Ha + 38) % 360, 85, light ? 45 : 60);
  const posH = hexToHsl('#10B981'), negH = hexToHsl('#F43F5E');
  const pos = hslToHex(towardHue(posH[0], Ha, 0.15), posH[1], light ? 36 : posH[2]);
  const neg = hslToHex(towardHue(negH[0], Ha, 0.15), negH[1], light ? 48 : negH[2]);
  return {
    '--zk-a': A, '--zk-b': B, '--zk-a-tint': light ? A : tint, '--zk-c': third, '--zk-pos': pos, '--zk-neg': neg,
    '--zk-bg-deep': bgDeep, '--zk-bg-mid': bgMid,
    '--zk-glass': light ? 'linear-gradient(165deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.8) 100%)' : `linear-gradient(165deg, hsla(${Ha}, 38%, 24%, 0.72) 0%, hsla(${Hb}, 42%, 11%, 0.86) 100%)`,
    '--zk-glass-solid': light ? '#FFFFFF' : hslToHex(Ha, 30, 14),
    '--zk-ink': light ? hslToHex(Ha, 45, 12) : '#F4F6FF', '--zk-mute': light ? hslToHex(Ha, 18, 38) : hslToHex(Ha, 18, 70),
    '--zk-line': light ? 'rgba(10,20,60,0.12)' : 'rgba(255,255,255,0.14)', '--zk-grid': light ? 'rgba(20,40,120,0.07)' : 'rgba(255,255,255,0.045)',
    '--zk-wash': light ? '#FFFFFF' : mixHex(A, bgDeep, 0.78),
    '--accent-glow': A, '--accent-deep': B,
  };
}
