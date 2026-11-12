// Small optional classifier, initialized randomly and trained only on Zancut's own rows.
// No pretrained weights, model service, network access or extra dependency.
const rng = seed => () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
function forward(net, f, hidden, out) {
  hidden.fill(0);
  for (let k = 0; k < f.idx.length; k++) {
    const off = f.idx[k] * net.dim, v = f.val[k];
    for (let j = 0; j < net.dim; j++) hidden[j] += net.embed[off + j] * v;
  }
  for (let j = 0; j < net.dim; j++) hidden[j] = Math.tanh(hidden[j]);
  for (let c = 0; c < out.length; c++) {
    let z = net.bias[c];
    for (let j = 0; j < net.dim; j++) z += hidden[j] * net.output[j * out.length + c];
    out[c] = z;
  }
  return out;
}
export const neuralScores = (net, f) => forward(net, f, new Float64Array(net.dim), new Float64Array(net.classes.length));
export function updateNeural(net, rows, { epochs = 4, lr = 0.04, seed = 7, random = rng(seed), l2 = 1e-5 } = {}) {
  const C = net.classes.length, dim = net.dim, order = rows.map((_, i) => i);
  const hidden = new Float64Array(dim), scores = new Float64Array(C), gradient = new Float64Array(C), delta = new Float64Array(dim);
  for (let ep = 0; ep < epochs; ep++) {
    for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    const rate = lr / (1 + 0.12 * ep);
    for (const index of order) {
      const { f, y, w = 1 } = rows[index], step = Math.min(0.5, rate * w);
      forward(net, f, hidden, scores);
      let max = -Infinity; for (const s of scores) if (s > max) max = s;
      let sum = 0; for (let c = 0; c < C; c++) { gradient[c] = Math.exp(scores[c] - max); sum += gradient[c]; }
      for (let c = 0; c < C; c++) gradient[c] = gradient[c] / sum - (c === y ? 1 : 0);
      // Use output weights before their update to backpropagate into the sparse embedding.
      for (let j = 0; j < dim; j++) {
        const off = j * C; let g = 0;
        for (let c = 0; c < C; c++) { g += gradient[c] * net.output[off + c]; net.output[off + c] -= step * (gradient[c] * hidden[j] + l2 * net.output[off + c]); }
        delta[j] = Math.max(-2, Math.min(2, g * (1 - hidden[j] * hidden[j])));
      }
      for (let c = 0; c < C; c++) net.bias[c] -= step * gradient[c];
      for (let k = 0; k < f.idx.length; k++) {
        const off = f.idx[k] * dim, v = f.val[k];
        for (let j = 0; j < dim; j++) net.embed[off + j] -= step * (delta[j] * v + l2 * net.embed[off + j]);
      }
    }
  }
  return net;
}
export function fitNeural(rows, classes, { nb, dim = 32, seed = 7, ...opt } = {}) {
  if (!Number.isInteger(dim) || dim < 1 || dim > 128) throw new Error('Invalid neural hidden dimension');
  const random = rng(seed), counts = Array(classes.length).fill(0);
  for (const row of rows) counts[row.y]++;
  const net = { algorithm: 'neural', classes, dim, counts, n: rows.length, T: 1,
    embed: Float32Array.from({ length: nb * dim }, () => random() * 0.5 - 0.25),
    output: Float32Array.from({ length: dim * classes.length }, () => random() * 0.5 - 0.25), bias: new Float32Array(classes.length) };
  return updateNeural(net, rows, { seed, random, ...opt });
}
