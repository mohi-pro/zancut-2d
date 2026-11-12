// Keep the renderer self-contained; only the small seeded Rough.js renderer is included in each film, not whole asset packs.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url), dir=path.dirname(require.resolve('roughjs/package.json'));
const out=new URL('../engine/cartoon/vendor/',import.meta.url);fs.mkdirSync(out,{recursive:true});
const pkg=JSON.parse(fs.readFileSync(path.join(dir,'package.json'),'utf8'));
const source=fs.readFileSync(path.join(dir,'bundled/rough.js'),'utf8');
// Harden the browser copy: default/unseeded calls fail explicitly. Installed npm sources remain untouched.
const calls=source.match(/Math\.random\(\)/g)||[];if(!calls.length)throw new Error('Review the new Rough.js random-source implementation before vendoring.');
const guard='function zancutRoughUnseeded(){throw new Error("Rough.js requires an explicit positive seed in a seekable film.");}\n';
fs.writeFileSync(new URL('rough.js',out),`// Rough.js ${pkg.version}; MIT; seeded-only browser adaptation by scripts/build-cartoon-vendor.mjs.\n`+guard+source.replaceAll('Math.random()','zancutRoughUnseeded()'));
fs.copyFileSync(path.join(dir,'LICENSE'),new URL('rough.LICENSE',out));
console.log(`Vendored Rough.js ${pkg.version} for local SVG rendering.`);
