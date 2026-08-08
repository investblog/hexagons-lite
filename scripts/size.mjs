// Cross-platform `npm run size`: minify + gzip via Node APIs, no shell pipes.
// Prints the gzipped byte count of the minified library as a bare integer.
// Exits non-zero on any error. Needs neither Git Bash nor a pre-built
// hexagons.min.js — terser runs in-process on the source.
import { readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { minify } from 'terser';

try {
	const src = await readFile(new URL('../hexagons.js', import.meta.url), 'utf8');
	const min = await minify(src, { compress: true, mangle: true });
	if (!min.code) throw new Error('terser produced no output');
	console.log(gzipSync(Buffer.from(min.code), { level: 9 }).length);
} catch (err) {
	console.error(err && err.message ? err.message : err);
	process.exit(1);
}
