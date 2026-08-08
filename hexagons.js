/**
 * Hexagons — animated honeycomb backgrounds built from regular hexagons.
 * Zero dependencies. Line art: the colour gradient runs along the edges.
 *
 * var hx = Hexagons.init('.bg', { mode: 'hive', brand: '#00abf3' });
 * hx.stop(); hx.start(); hx.destroy();
 *
 * Modes:
 *   field — regular hexagons at varying depth, drifting toward the viewer
 *   hive  — the 6.6.6 honeycomb tiling, with optional bonding of neighbours
 *
 * Geometry note: the regular hexagon is one of the three regular tilings and,
 * by the honeycomb conjecture (Hales 1999), the least-perimeter partition of
 * the plane into equal areas. This library draws only perimeters, so the
 * hexagon is literally the cheapest tiling in ink.
 *
 * Colour note: `brand` (a hex, or an array for multi-colour brands) derives
 * the whole palette in CIE LCh(ab)/D65 — see Hexagons.palette(). Explicitly
 * passed colour options are pinned and survive re-derivation; pass 'auto' to
 * unpin one. Out-of-gamut derivations reduce chroma only, never clip channels.
 */
(function () {
	'use strict';

	var SQRT3 = Math.sqrt(3);
	var TAU6 = Math.PI / 3;

	// pointy-top: vertex straight up, flats facing left/right
	var HEX = [];
	for (var k = 0; k < 6; k++) {
		HEX.push([Math.cos(-Math.PI / 2 + k * TAU6), Math.sin(-Math.PI / 2 + k * TAU6)]);
	}

	// spintax.net's logo triad (blue / gold / magenta) — the one colour constant
	// in the library; everything else is derived from it.
	var DEFAULT_BRAND = ['#00abf3', '#d6af3c', '#a91455'];
	var COLOR_KEYS = ['colors', 'accent', 'hot', 'background', 'halo'];

	function parseColor(str) {
		str = String(str).trim();
		if (str.charAt(0) === '#') {
			var h = str.slice(1);
			if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
			var n = parseInt(h, 16);
			return [n >> 16 & 255, n >> 8 & 255, n & 255];
		}
		var m = str.match(/rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/);
		return m ? [+m[1], +m[2], +m[3]] : [255, 255, 255];
	}
	function rgba(c, a) {
		return 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + a + ')';
	}
	function toHex(c) {
		return '#' + ((1 << 24) + ((c[0] | 0) << 16) + ((c[1] | 0) << 8) + (c[2] | 0)).toString(16).slice(1);
	}
	// pointy-top vertices around (cx, cy), circumradius r:
	// v0 top, v1 NE, v2 SE, v3 bottom, v4 SW, v5 NW
	function hexVerts(cx, cy, r) {
		var hw = SQRT3 / 2 * r;
		return [[cx, cy - r], [cx + hw, cy - r / 2], [cx + hw, cy + r / 2],
			[cx, cy + r], [cx - hw, cy + r / 2], [cx - hw, cy - r / 2]];
	}
	// stable per-edge value; must not change between frames or bonds would flicker
	function hash(i, j, d) {
		var n = Math.sin(i * 127.1 + j * 311.7 + d * 74.7) * 43758.5453;
		return n - Math.floor(n);
	}
	function makeRng(seed) {
		if (seed == null) return Math.random;
		var a = seed >>> 0;
		return function () {
			a = (a + 0x6D2B79F5) >>> 0;
			var x = Math.imul(a ^ (a >>> 15), 1 | a);
			x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
			return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
		};
	}

	// ── auto-palette: sRGB <-> CIE LCh(ab), D65 ─────────────────────────────

	function s2l(u) { u /= 255; return u <= 0.04045 ? u / 12.92 : Math.pow((u + 0.055) / 1.055, 2.4); }
	function l2s(u) { return 255 * (u <= 0.0031308 ? u * 12.92 : 1.055 * Math.pow(u, 1 / 2.4) - 0.055); }
	function fwd(t) { return t > 216 / 24389 ? Math.pow(t, 1 / 3) : (24389 / 27 * t + 16) / 116; }
	function inv(t) { var c = t * t * t; return c > 216 / 24389 ? c : (116 * t - 16) * 27 / 24389; }

	function rgb2lch(rgb) {
		var r = s2l(rgb[0]), g = s2l(rgb[1]), b = s2l(rgb[2]);
		var x = (0.41246 * r + 0.35758 * g + 0.18044 * b) / 0.95047;
		var y = 0.21267 * r + 0.71515 * g + 0.07218 * b;
		var z = (0.01933 * r + 0.11919 * g + 0.9503 * b) / 1.08883;
		var fx = fwd(x), fy = fwd(y), fz = fwd(z);
		var L = 116 * fy - 16, A = 500 * (fx - fy), B = 200 * (fy - fz);
		var C = Math.sqrt(A * A + B * B);
		var H = Math.atan2(B, A) * 180 / Math.PI;
		return [L, C, (H + 360) % 360];
	}
	// returns linear rgb triple, unclamped — caller checks gamut
	function lch2lin(L, C, H) {
		var A = C * Math.cos(H * Math.PI / 180), B = C * Math.sin(H * Math.PI / 180);
		var fy = (L + 16) / 116, fx = fy + A / 500, fz = fy - B / 200;
		var x = inv(fx) * 0.95047, y = inv(fy), z = inv(fz) * 1.08883;
		return [
			3.24045 * x - 1.53714 * y - 0.49853 * z,
			-0.96927 * x + 1.87601 * y + 0.04156 * z,
			0.05564 * x - 0.20403 * y + 1.05723 * z
		];
	}
	// Gamut policy (spec): hold L and H, reduce C until inside sRGB. Never
	// channel-clip — clipping shifts hue, and hue is the brand's identity.
	function lch2rgb(L, C, H) {
		var lin = lch2lin(L, C, H), lo = 0, hi = C, i;
		if (!inGamut(lin)) {
			for (i = 0; i < 20; i++) {
				var mid = (lo + hi) / 2;
				lin = lch2lin(L, mid, H);
				if (inGamut(lin)) lo = mid; else hi = mid;
			}
			lin = lch2lin(L, lo, H);
		}
		return [clamp255(l2s(lin[0])), clamp255(l2s(lin[1])), clamp255(l2s(lin[2]))];
	}
	function inGamut(lin) {
		for (var i = 0; i < 3; i++) if (lin[i] < -0.0005 || lin[i] > 1.0005) return false;
		return true;
	}
	function clamp255(v) { return Math.max(0, Math.min(255, Math.round(v))); }

	// WCAG-style contrast — used as an edge-visibility floor, not a text rule
	function lum(rgb) { return 0.2126 * s2l(rgb[0]) + 0.7152 * s2l(rgb[1]) + 0.0722 * s2l(rgb[2]); }
	function contrast(a, b) {
		var x = lum(a), y = lum(b);
		return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
	}
	// Repair by shifting L only (fidelity: hue and chroma are the brand's)
	function ensureContrast(rgb, bgRgb, min, dir) {
		if (contrast(rgb, bgRgb) >= min) return rgb;
		var lch = rgb2lch(rgb);
		for (var L = lch[0]; L >= 2 && L <= 98; L += dir * 2) {
			var c = lch2rgb(L, lch[1], lch[2]);
			if (contrast(c, bgRgb) >= min) return c;
		}
		return rgb;
	}

	/**
	 * Derive the full render palette from a brand colour (hex or array of hex).
	 * Mirrors the token-engine progenitor: with one chromatic seed the accent is
	 * the H+40° synthetic complement; with more, the real colours take the roles
	 * (brand[0] hue ramp, brand[1] accent, brand[2] hot tint). Achromatic seeds
	 * (C < 12) never invent a hue — they derive a neutral graphite palette.
	 * Pure and deterministic: same input, same output.
	 */
	function derive(brand, theme) {
		var arr = (typeof brand === 'string' ? [brand] : brand).map(function (x) {
			return rgb2lch(parseColor(x));
		});
		var chrom = [];
		for (var i = 0; i < arr.length; i++) if (arr[i][1] >= 12) chrom.push(arr[i]);
		var neutral = chrom.length === 0;
		var prim = neutral ? [50, 0, 0] : chrom[0];
		var acc = chrom.length > 1 ? chrom[1] : [0, prim[1], (prim[2] + 40) % 360];
		var hotH = (chrom.length > 2 ? chrom[2] : prim)[2];
		var C = prim[1], H = prim[2], light = theme === 'light';

		var bg = light
			? lch2rgb(97, neutral ? 0 : 3, H)
			: lch2rgb(6, Math.min(C * 0.2, 10), H);
		var halo = light
			? lch2rgb(92, Math.min(C * 0.2, 8), H)
			: lch2rgb(12, Math.min(C * 0.3, 15), H);
		var Ls = light ? [72, 52, 32] : [32, 58, 82];
		var dir = light ? -1 : 1;
		// unrolled on purpose: measured, the loop form gzips larger
		var stops = [
			ensureContrast(lch2rgb(Ls[0], C * 0.9, H), bg, 1.5, dir),
			ensureContrast(lch2rgb(Ls[1], C, H), bg, 2.5, dir),
			ensureContrast(lch2rgb(Ls[2], C * 0.55, H), bg, 5, dir)
		];
		var accent = ensureContrast(lch2rgb(light ? 45 : 70, acc[1], acc[2]), bg, 3, dir);
		var hot = ensureContrast(
			lch2rgb(light ? 28 : 92, neutral ? 0 : (light ? 24 : 12), hotH), bg, 7, dir);

		return { colors: stops, accent: accent, hot: hot, background: bg, halo: halo };
	}

	function paletteHex(brand, opts) {
		var p = derive(brand == null ? DEFAULT_BRAND : brand,
			opts && opts.theme === 'light' ? 'light' : 'dark');
		return {
			colors: p.colors.map(toHex),
			accent: toHex(p.accent),
			hot: toHex(p.hot),
			background: toHex(p.background),
			halo: toHex(p.halo)
		};
	}

	// ── instance ────────────────────────────────────────────────────────────

	function init(el, opts) {
		opts = opts || {};
		el = typeof el === 'string' ? document.querySelector(el) : el;
		if (!el) return null;

		var canvas = document.createElement('canvas');
		canvas.style.cssText = 'display:block;width:100%;height:100%';
		el.innerHTML = '';
		el.appendChild(canvas);
		var ctx = canvas.getContext('2d');

		var mode = opts.mode === 'hive' ? 'hive' : 'field';
		var brand = opts.brand == null ? DEFAULT_BRAND : opts.brand;
		var theme = opts.theme === 'light' ? 'light' : 'dark';

		// A colour option is pinned the moment the caller passes it; pinned
		// options survive set({brand})/set({theme}). 'auto' unpins.
		var pins = {};
		var colors, accent, hot, bg, halo;
		function applyPalette() {
			var d = derive(brand, theme);
			colors = pins.colors ? pins.colors.map(parseColor) : d.colors;
			accent = pins.accent != null ? parseColor(pins.accent) : d.accent;
			hot = pins.hot != null ? parseColor(pins.hot) : d.hot;
			bg = 'background' in pins
				? (pins.background === null ? null : parseColor(pins.background)) : d.background;
			halo = 'halo' in pins
				? (pins.halo === null ? null : parseColor(pins.halo)) : d.halo;
		}
		for (var pk = 0; pk < COLOR_KEYS.length; pk++) {
			if (COLOR_KEYS[pk] in opts) pins[COLOR_KEYS[pk]] = opts[COLOR_KEYS[pk]];
		}
		applyPalette();

		var size = opts.size || 90;                // px: width across flats (the one unit)
		var count = opts.count || 110;             // field only
		var speed = opts.speed == null ? 1 : opts.speed;
		var weight = opts.weight == null ? 1 : opts.weight;
		var glow = opts.glow !== false;
		var sweep = opts.sweep == null ? 1 : opts.sweep;         // hive only
		var bond = opts.bond == null ? 0 : opts.bond;            // hive only
		var orientation = opts.orientation === 'flat' ? 'flat' : 'pointy';
		var inset = opts.inset == null ? 0 : opts.inset;         // hive only; bond wins
		var nesting = opts.nesting !== false;      // field only
		var parallax = opts.parallax !== false;    // field only
		// vignette bakes into the alpha channel on a transparent canvas, so its
		// effective default is 0 when background is null (unless pinned)
		var vigPin = opts.vignette != null && opts.vignette !== 'auto';
		var vignette = vigPin ? opts.vignette : 0.45;
		function effVignette() { return vigPin ? vignette : (bg ? 0.45 : 0); }
		var seed = opts.seed == null ? null : opts.seed;
		var rnd = makeRng(seed);

		var dpr = Math.min(opts.maxDpr || 2, window.devicePixelRatio || 1);

		var W = 0, H = 0, raf = null, t = 0, lastT = 0, running = false;
		var edges = [], field = [];
		var pmx = 0, pmy = 0, tmx = 0, tmy = 0;

		var Z_FAR = 9.2, Z_NEAR = 0.3, FOC = 1.35;

		// ── geometry ────────────────────────────────────────

		function seedField() {
			field = [];
			rnd = makeRng(seed);   // restart the stream so re-seeding is reproducible
			var G = Math.ceil(Math.sqrt(count));
			for (var i = 0; i < count; i++) {
				var gx = i % G, gy = (i / G) | 0;
				field.push({
					x: ((gx + rnd()) / G - 0.5) * 2.9,
					y: ((gy + rnd()) / G - 0.5) * 2.9,
					z: ((i * 0.6180339887498949) % 1) * (Z_FAR - Z_NEAR) + Z_NEAR + rnd() * 0.25,
					rot: rnd() * Math.PI * 2,
					spin: (rnd() - 0.5) * 0.13,
					acc: rnd() < 0.07,
					nest: rnd() < 0.3,
					par: 0.5 + rnd() * 0.9
				});
			}
		}

		function buildHive() {
			edges = [];
			if (!(W > 0) || !(H > 0)) return;
			var flat = orientation === 'flat';
			// generate pointy-top over (possibly swapped) dimensions, emit swapped
			var GW = flat ? H : W, GH = flat ? W : H;
			var s = size * dpr / SQRT3;            // circumradius from width across flats
			if (!(s > 0.5)) return;
			var colW = SQRT3 * s, rowH = 1.5 * s;
			var nC = Math.min(400, Math.ceil(GW / colW) + 2);
			var nR = Math.min(400, Math.ceil(GH / rowH) + 2);
			var ox = (GW - (nC - 1) * colW) / 2, oy = (GH - (nR - 1) * rowH) / 2;
			// bond produces polyhex components; insetting their union outline is
			// polygon offsetting the size budget cannot pay — bond wins (spec v0.1)
			var ins = bond > 0 ? 0 : inset * dpr;
			var inr = SQRT3 / 2 * s;
			var s2 = ins > 0 ? s * Math.max(0.1, (inr - ins / 2) / inr) : s;

			for (var j = -1; j < nR; j++) for (var i = -1; i < nC; i++) {
				var cx = ox + i * colW + ((j & 1) ? colW / 2 : 0);
				var cy = oy + j * rowH;
				if (ins > 0) {
					// each cell draws its own shrunk outline: parallel double walls
					hexEdges(cx, cy, s2);
				} else {
					// pointy-top vertices around (cx, cy), circumradius s:
					//   v0 top, v1 NE, v2 SE, v3 bottom, v4 SW, v5 NW
					// each cell owns E (v1-v2), SE (v2-v3), SW (v3-v4); the other
					// three come from its neighbours, so every shared wall is
					// emitted exactly once. Dropping one fuses two cells (bond).
					var hw = colW / 2;
					if (hash(i, j, 1) >= bond) push(cx + hw, cy - s / 2, cx + hw, cy + s / 2);
					if (hash(i, j, 2) >= bond) push(cx + hw, cy + s / 2, cx, cy + s);
					if (hash(i, j, 3) >= bond) push(cx, cy + s, cx - hw, cy + s / 2);
				}
			}
			function hexEdges(cx, cy, r) {
				var v = hexVerts(cx, cy, r);
				for (var q = 0; q < 6; q++) {
					var q2 = (q + 1) % 6;
					push(v[q][0], v[q][1], v[q2][0], v[q2][1]);
				}
			}
			function push(x1, y1, x2, y2) {
				if (flat) edges.push({ x1: y1, y1: x1, x2: y2, y2: x2, mx: (y1 + y2) / 2, my: (x1 + x2) / 2 });
				else edges.push({ x1: x1, y1: y1, x2: x2, y2: y2, mx: (x1 + x2) / 2, my: (y1 + y2) / 2 });
			}
		}

		// ── painting ────────────────────────────────────────

		// Gradients depend only on size and colour; rebuilt per frame they starve
		// the page (measured in octagons). Cached, invalidated on resize/set().
		var gLine = null, gBack = null, gVig = null;
		function dropCaches() { gLine = gBack = gVig = null; }

		function gradient() {
			if (gLine) return gLine;
			var g = ctx.createLinearGradient(0, 0, W, H);
			for (var i = 0; i < colors.length; i++) {
				g.addColorStop(colors.length === 1 ? 0 : i / (colors.length - 1), rgba(colors[i], 1));
			}
			return (gLine = g);
		}
		function hexPath(cx, cy, r, rot) {
			var co = Math.cos(rot || 0), si = Math.sin(rot || 0);
			ctx.beginPath();
			for (var i = 0; i < 6; i++) {
				var vx = HEX[i][0] * r, vy = HEX[i][1] * r;
				var px = cx + vx * co - vy * si, py = cy + vx * si + vy * co;
				if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
			}
			ctx.closePath();
		}
		function paintBackground() {
			if (!bg) { ctx.clearRect(0, 0, W, H); return; }
			if (!halo) { ctx.fillStyle = rgba(bg, 1); ctx.fillRect(0, 0, W, H); return; }
			if (!gBack) {
				gBack = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.6);
				gBack.addColorStop(0, rgba(halo, 1)); gBack.addColorStop(1, rgba(bg, 1));
			}
			ctx.fillStyle = gBack; ctx.fillRect(0, 0, W, H);
		}
		function paintVignette() {
			var v = effVignette();
			if (!v) return;
			if (!gVig) {
				gVig = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3,
					W / 2, H / 2, Math.max(W, H) * 0.75);
				gVig.addColorStop(0, 'rgba(0,0,0,0)');
				gVig.addColorStop(1, 'rgba(0,0,0,' + v + ')');
			}
			ctx.fillStyle = gVig; ctx.fillRect(0, 0, W, H);
		}

		function drawHive() {
			paintBackground();
			ctx.lineCap = 'round'; ctx.lineJoin = 'round';
			ctx.beginPath();
			for (var i = 0; i < edges.length; i++) {
				ctx.moveTo(edges[i].x1, edges[i].y1); ctx.lineTo(edges[i].x2, edges[i].y2);
			}
			ctx.strokeStyle = gradient(); ctx.globalAlpha = 0.55;
			ctx.lineWidth = 0.9 * weight * dpr; ctx.stroke();
			ctx.globalAlpha = 1;

			if (sweep) {
				// bucket edges by brightness: ~5 stroke() calls, not one per edge;
				// shadowBlur is banned (measured 3x the frame for the same look)
				var NB = 5, buckets = [], b;
				for (b = 0; b < NB; b++) buckets.push(null);
				var ph = (t * 0.19 * sweep * speed) % 1.6 - 0.3;
				for (i = 0; i < edges.length; i++) {
					var e = edges[i];
					var q = ((e.mx / W + e.my / H) / 2 - ph) / 0.16;
					var sv = Math.exp(-q * q);
					if (sv < 0.06) continue;
					b = Math.min(NB - 1, (sv * NB) | 0);
					if (!buckets[b]) buckets[b] = [];
					buckets[b].push(e);
				}
				for (b = 0; b < NB; b++) {
					var list = buckets[b]; if (!list) continue;
					var lv = (b + 0.5) / NB;
					ctx.beginPath();
					for (var m = 0; m < list.length; m++) {
						ctx.moveTo(list[m].x1, list[m].y1); ctx.lineTo(list[m].x2, list[m].y2);
					}
					ctx.strokeStyle = rgba(hot, 1);
					if (glow) {
						ctx.globalAlpha = lv * 0.14;
						ctx.lineWidth = (1.2 + lv * 2.2) * 3 * weight * dpr; ctx.stroke();
					}
					ctx.globalAlpha = lv * 0.75;
					ctx.lineWidth = (0.9 + lv * 1.4) * weight * dpr; ctx.stroke();
				}
				ctx.globalAlpha = 1;
			}
			paintVignette();
		}

		function drawField(dt) {
			paintBackground();
			var base = Math.min(W, H), i, o;
			pmx += (tmx - pmx) * Math.min(1, dt * 3.2);
			pmy += (tmy - pmy) * Math.min(1, dt * 3.2);

			for (i = 0; i < field.length; i++) {
				o = field[i];
				o.z -= dt * 0.55 * speed; o.rot += o.spin * dt * speed;
				if (o.z < Z_NEAR) {
					o.z += Z_FAR - Z_NEAR;
					o.x = (rnd() - 0.5) * 2.9; o.y = (rnd() - 0.5) * 2.9;
					o.acc = rnd() < 0.07; o.nest = rnd() < 0.3;
				}
			}
			field.sort(function (a, b) { return b.z - a.z; });

			var g = gradient();
			ctx.lineJoin = 'round';
			for (i = 0; i < field.length; i++) {
				o = field[i];
				var sc = FOC / (FOC + o.z);
				var px = W / 2 + (o.x * base * 1.45 + (parallax ? pmx * o.par * sc * 90 * dpr : 0)) * sc;
				var py = H / 2 + (o.y * base * 1.45 + (parallax ? pmy * o.par * sc * 90 * dpr : 0)) * sc;
				var r = base * 0.3 * sc * (size / 90);
				if (r < 1.1) continue;
				if (px < -r * 1.6 || px > W + r * 1.6 || py < -r * 1.6 || py > H + r * 1.6) continue;

				var u = Math.max(0, Math.min(1, 1 - (o.z - Z_NEAR) / (Z_FAR - Z_NEAR)));
				var fade = Math.min(1, (Z_FAR - o.z) / 1.6) * Math.min(1, (o.z - Z_NEAR) / 1);
				if (fade <= 0.01) continue;
				var col = o.acc ? rgba(accent, 1) : g;
				var lw = (0.7 + u * 2.3) * weight * dpr;

				if (glow && u > 0.35) {
					hexPath(px, py, r, o.rot);
					ctx.strokeStyle = col; ctx.globalAlpha = (u - 0.35) * 0.22 * fade;
					ctx.lineWidth = lw * 4.5; ctx.stroke();
				}
				hexPath(px, py, r, o.rot);
				ctx.strokeStyle = col; ctx.globalAlpha = (0.1 + u * 0.72) * fade;
				ctx.lineWidth = lw; ctx.stroke();

				if (nesting && o.nest && u > 0.15) {
					hexPath(px, py, r * 0.63, o.rot);
					ctx.globalAlpha = (0.05 + u * 0.34) * fade;
					ctx.lineWidth = lw * 0.62; ctx.stroke();
				}
			}
			ctx.globalAlpha = 1;
			paintVignette();
		}

		// ── loop / lifecycle ────────────────────────────────

		function resize() {
			var w = el.offsetWidth, h = el.offsetHeight;
			if (!w || !h) return;
			W = canvas.width = Math.round(w * dpr);
			H = canvas.height = Math.round(h * dpr);
			dropCaches();
			if (mode === 'hive') buildHive();
		}

		// One frame, advanced by exactly dt — split out of tick() so a renderer
		// can drive it on its own clock (offline rendering).
		function frame(dt) {
			t += dt;
			if (mode === 'hive') drawHive(); else drawField(dt);
		}

		function tick(now) {
			frame(Math.min(0.05, (now - lastT) / 1000));
			lastT = now;
			raf = requestAnimationFrame(tick);
		}
		// `wanted` is the author's intent; visibility and the viewport gate it.
		// A page with several instances must only animate the one being looked at.
		var wanted = false, onScreen = true;
		function sync() {
			var should = wanted && onScreen && !document.hidden;
			if (should === running) return;
			running = should;
			if (should) { lastT = performance.now(); raf = requestAnimationFrame(tick); }
			else if (raf) { cancelAnimationFrame(raf); raf = null; }
		}
		function start() { wanted = true; sync(); }
		function stop() { wanted = false; sync(); }

		function onMove(e) {
			if (!parallax) return;
			var b = canvas.getBoundingClientRect();
			tmx = (e.clientX - b.left) / b.width * 2 - 1;
			tmy = (e.clientY - b.top) / b.height * 2 - 1;
		}
		function onLeave() { tmx = 0; tmy = 0; }
		function onVisibility() { sync(); }

		var ro = null, io = null, timer = null;
		function onResize() { clearTimeout(timer); timer = setTimeout(resize, 120); }
		if (window.ResizeObserver) { ro = new ResizeObserver(onResize); ro.observe(el); }
		else window.addEventListener('resize', onResize);
		if (window.IntersectionObserver) {
			// no rootMargin: with stacked full-height sections a pre-warm margin
			// keeps the neighbour animating and the saving is lost (measured)
			io = new IntersectionObserver(function (entries) {
				onScreen = entries[entries.length - 1].isIntersecting;
				sync();
			}, { rootMargin: '0px' });
			io.observe(el);
		}
		document.addEventListener('visibilitychange', onVisibility);
		canvas.addEventListener('mousemove', onMove);
		canvas.addEventListener('mouseleave', onLeave);

		seedField();
		resize();
		if (opts.autoplay !== false) start();

		return {
			canvas: canvas,
			start: start,
			stop: stop,
			// step(dt), not render(absoluteTime): field motion is integrated and
			// respawns re-randomise, so there is no closed form to seek to.
			step: function (dt) { frame(dt == null ? 1 / 60 : dt); },
			resize: resize,
			// Effective options snapshot: derived colours resolved to hex, pins
			// listed — makes set() observable and lets users read what brand made.
			get: function () {
				return {
					mode: mode, brand: brand, theme: theme,
					colors: colors.map(toHex), accent: toHex(accent), hot: toHex(hot),
					background: bg ? toHex(bg) : null, halo: halo ? toHex(halo) : null,
					size: size, count: count, seed: seed, speed: speed, weight: weight,
					glow: glow, sweep: sweep, bond: bond, orientation: orientation,
					inset: inset, nesting: nesting, parallax: parallax,
					vignette: effVignette(), pins: Object.keys(pins).concat(vigPin ? ['vignette'] : [])
				};
			},
			set: function (o) {
				var repalette = false, rebuild = false;
				for (var key in o) {
					if (!o.hasOwnProperty(key)) continue;
					var v = o[key];
					if (COLOR_KEYS.indexOf(key) >= 0) {
						// 'auto' hands the option back to the auto-palette;
						// anything else (null included) pins it
						if (v === 'auto') delete pins[key]; else pins[key] = v;
						repalette = true;
						continue;
					}
					switch (key) {
						case 'mode': mode = v === 'hive' ? 'hive' : 'field'; rebuild = true; break;
						case 'brand': brand = v; repalette = true; break;
						case 'theme': theme = v === 'light' ? 'light' : 'dark'; repalette = true; break;
						case 'size': size = v; rebuild = true; break;
						case 'count': count = v; seedField(); break;
						// seedField() restarts the stream, so re-seeding mid-flight
						// is well defined rather than a desync
						case 'seed': seed = v; seedField(); break;
						case 'speed': speed = v; break;
						case 'weight': weight = v; break;
						case 'glow': glow = v; break;
						case 'sweep': sweep = v; break;
						case 'bond': bond = v; rebuild = true; break;
						case 'orientation': orientation = v === 'flat' ? 'flat' : 'pointy'; rebuild = true; break;
						case 'inset': inset = v; rebuild = true; break;
						case 'nesting': nesting = v; break;
						case 'parallax': parallax = v; break;
						case 'vignette':
							if (v === 'auto') { vigPin = false; vignette = 0.45; }
							else { vigPin = true; vignette = v; }
							break;
					}
				}
				if (repalette) applyPalette();
				dropCaches();
				if (rebuild && mode === 'hive') buildHive();
			},
			destroy: function () {
				stop();
				if (io) io.disconnect();
				if (ro) ro.disconnect(); else window.removeEventListener('resize', onResize);
				document.removeEventListener('visibilitychange', onVisibility);
				canvas.removeEventListener('mousemove', onMove);
				canvas.removeEventListener('mouseleave', onLeave);
				clearTimeout(timer);
				if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
			}
		};
	}

	/**
	 * Static honeycomb pattern as a CSS background — no canvas, no loop.
	 * The 6.6.6 tiling repeats on a `size x sqrt(3)*size` rectangle (2 cells),
	 * where `size` is the width across flats. Returns `url("data:...")`.
	 *
	 * document.querySelector('pre').style.backgroundImage =
	 *   Hexagons.pattern({ size: 18, opacity: 0.09 });
	 */
	function pattern(opts) {
		opts = opts || {};
		var P = opts.size || 18;
		var s = P / SQRT3, TH = 3 * s;
		var theme = opts.theme === 'dark' ? 'dark' : 'light';
		var color = opts.color ||
			toHex(derive(opts.brand == null ? DEFAULT_BRAND : opts.brand, theme).colors[1]);
		var op = opts.opacity == null ? 0.12 : opts.opacity;
		var w = opts.weight == null ? 1 : opts.weight;
		var flat = opts.orientation === 'flat';
		var inset = opts.inset || 0;
		var back = opts.background || null;

		var d = [];
		function n(v) { return Math.round(v * 1000) / 1000; }
		function seg(x1, y1, x2, y2) {
			if (flat) d.push('M' + n(y1) + ' ' + n(x1) + 'L' + n(y2) + ' ' + n(x2));
			else d.push('M' + n(x1) + ' ' + n(y1) + 'L' + n(x2) + ' ' + n(y2));
		}
		function cell(cx, cy, r) {
			var v = hexVerts(cx, cy, r);
			for (var q = 0; q < 6; q++) {
				var q2 = (q + 1) % 6;
				seg(v[q][0], v[q][1], v[q2][0], v[q2][1]);
			}
		}

		if (inset > 0) {
			var inr = SQRT3 / 2 * s;
			var s2 = s * Math.max(0.1, (inr - inset / 2) / inr);
			// every cell overlapping the tile, so the seams carry the wrapped parts
			cell(P / 2, s, s2);
			cell(0, 2.5 * s, s2); cell(P, 2.5 * s, s2);
			cell(0, -0.5 * s, s2); cell(P, -0.5 * s, s2);
		} else {
			// centre cell outline; its left and right walls sit exactly on the tile
			// edge, so both are drawn — the neighbouring tile supplies the other
			// half of the stroke (same seam rule as the octagons pattern)
			cell(P / 2, s, s);
			// the one wall not on the centre cell: between the two half-cells
			seg(P / 2, 2 * s, P / 2, 3 * s);
		}

		var TW = flat ? TH : P, THh = flat ? P : TH;
		var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + n(TW) + '" height="' + n(THh) +
			'" viewBox="0 0 ' + n(TW) + ' ' + n(THh) + '">' +
			(back ? '<rect width="' + n(TW) + '" height="' + n(THh) + '" fill="' + back + '"/>' : '') +
			'<path d="' + d.join('') + '" fill="none" stroke="' + color +
			'" stroke-width="' + w + '" stroke-opacity="' + op +
			// butt caps: every edge is its own subpath; round caps blunt the
			// vertices and at small pitches turn the hexagons into circles
			'"/></svg>';

		if (opts.raw) return svg;
		return 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")';
	}

	window.Hexagons = { init: init, pattern: pattern, palette: paletteHex };
})();
