// Teach Zancut's own brain a rule in plain Bangla or English; it adapts at once (owner feedback weighs 5×) — no model, no internet.
//   npm run learn -- "যখন স্ক্রিপ্টে শেয়ার বাজারের কথা থাকবে তখন place হবে office_room আর graphic হবে dynamic_comparison_chart"
//   npm run learn -- "when the script talks about the stock market then place is office_room and graphic is dynamic_comparison_chart"
// The rule's examples are appended to data/brain/feedback.jsonl, so a full retrain keeps them.
import { learnRule, parseRule, load, predict, trainFull } from "../server/brain.mjs";
const text = process.argv.slice(2).join(" ").trim();
if (!text) { console.error('Usage: npm run learn -- "যখন … তখন place হবে … আর graphic হবে …"'); process.exit(2); }
let rule; try { rule = parseRule(text); } catch (e) { console.error(e.message); process.exit(2); }
const bn = /[ঀ-৿]/.test(rule.topic), probe = bn ? `${rule.topic} নিয়ে রাফির বাবা আজ খুব চিন্তিত।` : `Rafi's father is very worried about the ${rule.topic} today.`;
const before = load() || trainFull(), b = predict(before, probe), r = learnRule(text), a = predict(r.model, probe);
console.log(`learned: "${rule.topic}" → ${Object.entries(rule.labels).map(([h, v]) => `${h} = ${v}`).join(", ")}  (${r.examples} examples, weight 5×, ${r.ms} ms)`);
if (rule.problems.length) console.log(`skipped: ${rule.problems.join("; ")}`);
for (const h of Object.keys(rule.labels).filter((h) => h !== "roles")) console.log(`  ${h.padEnd(10)} before: ${b[h].label} (${b[h].conf.toFixed(2)})   after: ${a[h].label} (${a[h].conf.toFixed(2)})   on "${probe}"`);
