// An open manila file folder held in the hands with documents inside; grip point (0, 0) is the left-hand hold, grip2 is the right-hand hold.
ZS.define("fileFolderOpen", {
  about: "an open manila file folder held in the hands with paper sheets inside, about 32 cm",
  kind: "prop",
  grip: "two",
  grip2: [44, 0],
  base: [22, 10],
  tags: ["office", "paper", "work", "school"],
  aliases: ["open folder", "file folder", "manila folder", "খোলা ফাইল", "ফাইল ফোল্ডার"]
}, (layer, o, k) => {
  const { h = 95, seed = 1, color = "#e2b45a", color2 = "#d8452f" } = o;
  const g = k.group(layer, 0, 0), r = k.rngOf(seed);
  const fh = h * 0.76, w = fh * 1.34, cx = w * 0.2;

  // Back folder cover & top index tab (centered around the two-hand hold so (0, 0) sits right on the left hand's grip edge)
  k.P(g, `M${cx - w * 0.52} ${fh * 0.08} L${cx - w * 0.48} ${-fh * 0.86} L${cx - w * 0.12} ${-fh * 0.86} L${cx - w * 0.06} ${-fh * 0.76} L${cx + w * 0.48} ${-fh * 0.76} L${cx + w * 0.52} ${fh * 0.08}Z`, k.dark(color, 0.16));

  // Crisp white paper sheets inside the open folder
  const pw = w * 0.42, ph = fh * 0.78;
  k.P(g, `M${cx - pw * 1.05} ${fh * 0.03} L${cx - pw * 0.98} ${-ph} L${cx - w * 0.02} ${-ph * 0.92} L${cx - w * 0.02} ${fh * 0.05}Z`, "#f6f1e6");
  k.P(g, `M${cx + w * 0.02} ${fh * 0.05} L${cx + w * 0.02} ${-ph * 0.92} L${cx + pw * 0.98} ${-ph} L${cx + pw * 1.05} ${fh * 0.03}Z`, "#fffaf0");

  // Header band, text lines and small stamp/seal on the right sheet
  k.R(g, cx + w * 0.07, -ph * 0.82, pw * 0.76, fh * 0.065, color2, fh * 0.012);
  for (let i = 0; i < 4; i++) {
    k.R(g, cx + w * 0.07, -ph * (0.64 - i * 0.14), pw * (0.48 + r() * 0.26), fh * 0.032, "#8b95a0", fh * 0.008);
    k.R(g, cx - pw * 0.88, -ph * (0.72 - i * 0.15), pw * (0.46 + r() * 0.24), fh * 0.032, "#9aa3ad", fh * 0.008);
  }
  k.C(g, cx + pw * 0.68, -ph * 0.14, fh * 0.065, color2, 0.85);

  // Lower front folder pockets & center spine crease where the hands grip
  k.P(g, `M${cx - w * 0.54} ${fh * 0.1} L${cx - w * 0.5} ${-fh * 0.52} L${cx} ${-fh * 0.42} L${cx} ${fh * 0.12}Z`, k.light(color, 0.12));
  k.P(g, `M${cx} ${fh * 0.12} L${cx} ${-fh * 0.42} L${cx + w * 0.5} ${-fh * 0.52} L${cx + w * 0.54} ${fh * 0.1}Z`, color);
  k.R(g, cx - fh * 0.012, -fh * 0.78, fh * 0.024, fh * 0.9, k.dark(color, 0.24), fh * 0.008);

  return g;
});
