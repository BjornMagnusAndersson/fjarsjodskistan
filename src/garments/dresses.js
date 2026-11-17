/* =====================================================================
   Dresses, capes/wings, swimwear and pyjamas.
   Princess dresses (cat 'dress'), everyday dresses (cat 'frock'),
   capes and wings (cat 'cape'), swimsuits (cat 'swim'), pyjamas (cat 'pyjamas').
   Everything draws in doll space (viewBox 0 0 400 800) with the G helpers.
   Drawing order inside a piece: fill → details → soft shading + outline.
   ===================================================================== */
(function () {
  'use strict';
  const { shade, ink, mix } = H;
  const SW = G.stroke;
  const OCC = ['dress', 'top', 'bottom'];
  const SUIT = ['suit', 'top', 'bottom'];

  /* -------------------------------------------------------------
     Shared toolkit
     ------------------------------------------------------------- */

  /** Round a number to one decimal for compact SVG. */
  const F = v => (Math.round(v * 10) / 10).toString();
  /** Point [x,y] → "x,y". */
  const P = p => F(p[0]) + ',' + F(p[1]);

  /** Final pass for a shape: soft shading overlay plus the tinted outline (same as examples.js). */
  const outline = (d, base, soft = 'v', sw = SW) =>
    `<path d="${d}" fill="url(#soft-${soft})" stroke="${ink(base)}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"/>`;

  /** Register a linear gradient with [offset, colour, opacity?] stops. dir 'v' (top→bottom) or 'h' (left→right). */
  const lg = (id, stops, dir = 'v') => H.def(id, `<linearGradient id="${id}" x1="0" y1="0" x2="${dir === 'h' ? 1 : 0}" y2="${dir === 'h' ? 0 : 1}">` +
    stops.map(([o, c, op]) => `<stop offset="${o}" stop-color="${c}"${op != null ? ` stop-opacity="${op}"` : ''}/>`).join('') + '</linearGradient>');

  /** A sparkle: four-pointed twinkle star. */
  const twinkle = (x, y, r, c = '#ffffff') =>
    `<path d="M${F(x)},${F(y - r)}Q${F(x)},${F(y)} ${F(x + r)},${F(y)}Q${F(x)},${F(y)} ${F(x)},${F(y + r)}Q${F(x)},${F(y)} ${F(x - r)},${F(y)}Q${F(x)},${F(y)} ${F(x)},${F(y - r)}Z" fill="${c}"/>`;
  /** Many twinkles from a [[x,y,r],...] list. */
  const twinkles = (list, c) => list.map(([x, y, r]) => twinkle(x, y, r, c)).join('');

  /**
   * Smooth skirt side edge (LEFT side of the picture) through [y, x] control points.
   * Returns a function x(y). The right side is always 400 - x(y), so skirts stay mirrored.
   * Keep x ≥ ~117 between y 440 and 486 so the skirt never covers the hands.
   */
  function edge(pts) {
    const dense = [];
    const cr = (a, b, c, d, t) => .5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t);
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      for (let s = 0; s < 8; s++) dense.push([cr(p0[0], p1[0], p2[0], p3[0], s / 8), cr(p0[1], p1[1], p2[1], p3[1], s / 8)]);
    }
    dense.push(pts[pts.length - 1]);
    return y => {
      if (y <= dense[0][0]) return dense[0][1];
      for (let i = 1; i < dense.length; i++) if (y <= dense[i][0]) {
        const [y0, x0] = dense[i - 1], [y1, x1] = dense[i];
        return x0 + (x1 - x0) * (y - y0) / ((y1 - y0) || 1);
      }
      return dense[dense.length - 1][1];
    };
  }

  /**
   * Hem from (x0, y) across to (400 - x0, y) as relative path commands.
   * type: scallop | icicle | petal (pointed) | round (round petal) | wave | zig | cloud | flat.
   * The number of segments is always odd so the hem is mirror-symmetric.
   */
  function hem(x0, type, step, amp) {
    const span = 400 - 2 * x0;
    let n = Math.max(3, Math.round(span / step)); if (n % 2 === 0) n++;
    const w = span / n, h = w / 2;
    let d = '';
    for (let i = 0; i < n; i++) {
      if (type === 'scallop') d += `q${F(h)},${F(amp)} ${F(w)},0`;
      else if (type === 'icicle') { const a = i % 2 ? amp * .6 : amp; d += `l${F(h)},${F(a)}l${F(h)},${F(-a)}`; }
      else if (type === 'petal') d += `c0,${F(amp * .5)} ${F(w * .3)},${F(amp * .85)} ${F(h)},${F(amp)}c${F(w * .2)},${F(-amp * .15)} ${F(h)},${F(-amp * .5)} ${F(h)},${F(-amp)}`;
      else if (type === 'round') d += `c0,${F(amp * .8)} ${F(w * .22)},${F(amp)} ${F(h)},${F(amp)}c${F(w * .28)},0 ${F(h)},${F(-amp * .2)} ${F(h)},${F(-amp)}`;
      else if (type === 'wave') d += `q${F(w / 4)},${F(amp)} ${F(h)},0q${F(w / 4)},${F(-amp * .55)} ${F(h)},0`;
      else if (type === 'zig') d += `l${F(h)},${F(amp)}l${F(h)},${F(-amp)}`;
      else if (type === 'cloud') d += `a${F(h)},${F(amp)} 0 0 0 ${F(w)},0`;
      else d += `h${F(w)}`;
    }
    return { d, n, w };
  }

  /**
   * One skirt tier from the waist (top) down to yEnd, using edge function xl.
   * pad pushes the tier slightly outward toward its hem (puffy top layers).
   * Returns { d (closed path), hemD (open hem line), x0, n, w, y, amp }.
   */
  function tier(xl, top, yEnd, type, step, amp, pad = 0) {
    const X = y => xl(y) - pad * Math.max(0, Math.min(1, (y - top) / Math.max(1, yEnd - top)));
    const ys = [];
    for (let y = top + 18; y < yEnd - 6; y += 18) ys.push(y);
    const x0 = X(yEnd), h = hem(x0, type, step, amp);
    const d = `M${F(X(top))},${top}` + ys.map(y => `L${F(X(y))},${y}`).join('') + `L${F(x0)},${yEnd}` + h.d +
      ys.slice().reverse().map(y => `L${F(400 - X(y))},${y}`).join('') + `L${F(400 - X(top))},${top}Z`;
    return { d, hemD: `M${F(x0)},${yEnd}` + h.d, x0, n: h.n, w: h.w, y: yEnd, amp };
  }
  /** Centre points of a tier's hem segments (petal tips / scallop bottoms). */
  const tips = (t, k = 1) => Array.from({ length: t.n }, (_, i) => [t.x0 + t.w * (i + .5), t.y + t.amp * k]);
  /** Points where two hem segments meet. */
  const joins = t => Array.from({ length: t.n - 1 }, (_, i) => [t.x0 + t.w * (i + 1), t.y]);

  /** Frosty/lacy line along a hem: wide light stroke plus a dotted stroke on top. */
  const hemTrim = (d, c1, c2, w = 6) =>
    `<path d="${d}" fill="none" stroke="${c1}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" opacity=".92"/>` +
    `<path d="${d}" fill="none" stroke="${c2}" stroke-width="2" stroke-dasharray="2 6" stroke-linecap="round"/>`;

  /**
   * Point on an arm, offset sideways from the arm centreline.
   * off > 0 = toward the outside (away from the body). Mirrored correctly for 'R'.
   */
  function armN(side, t, off = 0) {
    const [x, y] = G.armPoint('L', t), [x2, y2] = G.armPoint('L', t + .01);
    const l = Math.hypot(x2 - x, y2 - y), nx = -(y2 - y) / l, ny = (x2 - x) / l;
    const px = x + nx * off, py = y + ny * off;
    return side === 'L' ? [px, py] : [400 - px, py];
  }
  /** Direction of the arm in degrees at t (for rotating motifs along the arm), mirrored for 'R'. */
  function armAng(side, t) {
    const [x, y] = G.armPoint('L', t), [x2, y2] = G.armPoint('L', t + .01);
    const a = Math.atan2(y2 - y, x2 - x) * 180 / Math.PI;
    return side === 'L' ? a : 180 - a;
  }
  /** Arm half-width (no padding) at t, same numbers as core's arm. */
  const armHW = t => t <= .5 ? 17 - 6 * t : 14 - 5 * (t - .5);

  /** Row of small balls across a sleeve end at arm t (fluffy or pearl trim), from inner to outer edge. */
  const cuffBalls = (side, t, half, r, fill, stroke, n = 5) => Array.from({ length: n }, (_, i) => {
    const p = armN(side, t, -half + 2 * half * i / (n - 1));
    return `<circle cx="${F(p[0])}" cy="${F(p[1])}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="1.2"/>`;
  }).join('');

  /** Gathering lines on a puff sleeve (from shoulder toward the cuff), both sides. */
  const gathers = (t0, t1, half, base) => ['L', 'R'].map(s => [-.5, 0, .5].map(k => {
    const a = armN(s, t0, k * half * .5), b = armN(s, t1, k * half * .85);
    return `M${P(a)}L${P(b)}`;
  }).join('')).join('');

  /** Points along a G.shirtPath neckline curve (round/high/scoop/boat), left to right. */
  function neckPts(neck, depth, pad, n) {
    const nw = { round: 17, high: 15, scoop: 25, boat: 34 }[neck];
    const ny = 252 - (neck === 'high' ? 8 : 0) - pad * .3, cy = ny + depth * 2;
    return Array.from({ length: n }, (_, i) => {
      const t = i / (n - 1), u = 1 - t;
      return [u * u * (200 - nw) + 2 * u * t * 200 + t * t * (200 + nw), u * u * ny + 2 * u * t * cy + t * t * ny];
    });
  }

  /** Waist belt band across the dress at y (height h), from waist edge to waist edge. */
  const belt = (y, h, fill, base, x = G.torsoX(y + h / 2) - 3) =>
    `<rect x="${F(x)}" y="${y}" width="${F(400 - 2 * x)}" height="${h}" rx="${F(h / 3)}" fill="${fill}" stroke="${ink(base)}" stroke-width="2"/>`;

  /** Ribbon bow centred at (x,y), size s. */
  const bow = (x, y, s, c) =>
    `<path d="M${x},${y} C${F(x - s * .6)},${F(y - s * .9)} ${F(x - s * 1.25)},${F(y - s * .5)} ${F(x - s * 1.1)},${F(y + s * .1)} C${F(x - s * 1)},${F(y + s * .6)} ${F(x - s * .5)},${F(y + s * .45)} ${x},${y}Z` +
    `M${x},${y} C${F(x + s * .6)},${F(y - s * .9)} ${F(x + s * 1.25)},${F(y - s * .5)} ${F(x + s * 1.1)},${F(y + s * .1)} C${F(x + s * 1)},${F(y + s * .6)} ${F(x + s * .5)},${F(y + s * .45)} ${x},${y}Z" fill="${H.grad(c)}" stroke="${ink(c)}" stroke-width="1.6" stroke-linejoin="round"/>` +
    `<path d="M${F(x - s * .15)},${F(y + s * .1)} L${F(x - s * .5)},${F(y + s * 1.1)} L${F(x - s * .2)},${F(y + s)} M${F(x + s * .15)},${F(y + s * .1)} L${F(x + s * .5)},${F(y + s * 1.1)} L${F(x + s * .2)},${F(y + s)}" fill="none" stroke="${shade(c, -.1)}" stroke-width="${F(s * .28)}" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<ellipse cx="${x}" cy="${y}" rx="${F(s * .28)}" ry="${F(s * .32)}" fill="${shade(c, .1)}" stroke="${ink(c)}" stroke-width="1.4"/>`;

  /* ---- small motifs ---- */

  /** Rose bloom: round flower with a spiral of darker petal lines. */
  const rose = (x, y, r, c) =>
    `<circle cx="${F(x)}" cy="${F(y)}" r="${F(r)}" fill="${H.grad(c, 'r')}" stroke="${ink(c)}" stroke-width="1.3"/>` +
    `<path d="M${F(x - r * .62)},${F(y + r * .1)} Q${F(x - r * .5)},${F(y + r * .72)} ${F(x + r * .1)},${F(y + r * .62)} M${F(x + r * .66)},${F(y - r * .05)} Q${F(x + r * .5)},${F(y - r * .7)} ${F(x - r * .2)},${F(y - r * .6)} ` +
    `M${F(x - r * .3)},${F(y + r * .05)} Q${F(x - r * .2)},${F(y + r * .38)} ${F(x + r * .18)},${F(y + r * .28)} Q${F(x + r * .4)},${F(y)} ${F(x + r * .12)},${F(y - r * .25)} Q${F(x - r * .1)},${F(y - r * .3)} ${F(x - r * .1)},${F(y - r * .05)}" ` +
    `fill="none" stroke="${shade(c, -.32)}" stroke-width="${F(Math.max(1, r * .13))}" stroke-linecap="round"/>` +
    `<circle cx="${F(x - r * .35)}" cy="${F(y - r * .38)}" r="${F(r * .2)}" fill="#fff" opacity=".45"/>`;

  /** Pointed leaf with a centre vein, base at (x,y), pointing at angle a (degrees), length l. */
  const leaf = (x, y, l, a, c) => {
    const w = l * .36;
    return `<g transform="translate(${F(x)},${F(y)}) rotate(${F(a)})"><path d="M0,0 Q${F(l * .45)},${F(-w)} ${F(l)},0 Q${F(l * .45)},${F(w)} 0,0Z" fill="${H.grad(c)}" stroke="${ink(c)}" stroke-width="1.3" stroke-linejoin="round"/>` +
      `<path d="M${F(l * .12)},0 L${F(l * .78)},0" stroke="${shade(c, .35)}" stroke-width="1.1" stroke-linecap="round"/></g>`;
  };

  /** Butterfly seen from the front, centre (x,y), wing size r; c1 upper wings, c2 lower wings + spots. */
  const butterfly = (x, y, r, c1, c2) => {
    const wing = `<path d="M0,0 C${F(-r * .3)},${F(-r * 1.2)} ${F(-r * 1.35)},${F(-r * 1.2)} ${F(-r * 1.15)},${F(-r * .25)} C${F(-r * 1.05)},${F(r * .15)} ${F(-r * .4)},${F(r * .1)} 0,0Z" fill="${H.grad(c1, 'r')}" stroke="${ink(c1)}" stroke-width="1.2"/>` +
      `<path d="M0,0 C${F(-r * .9)},${F(r * .1)} ${F(-r * 1)},${F(r * .9)} ${F(-r * .45)},${F(r * .85)} C${F(-r * .15)},${F(r * .8)} ${F(-r * .05)},${F(r * .4)} 0,0Z" fill="${H.grad(c2, 'r')}" stroke="${ink(c1)}" stroke-width="1.2"/>` +
      `<circle cx="${F(-r * .7)}" cy="${F(-r * .5)}" r="${F(r * .2)}" fill="#fff" opacity=".8"/><circle cx="${F(-r * .45)}" cy="${F(r * .5)}" r="${F(r * .12)}" fill="#fff" opacity=".7"/>`;
    return `<g transform="translate(${F(x)},${F(y)})">${wing}<g transform="scale(-1,1)">${wing}</g>` +
      `<ellipse cx="0" cy="${F(r * .1)}" rx="${F(r * .14)}" ry="${F(r * .6)}" fill="#5b4157"/>` +
      `<path d="M0,${F(-r * .4)} q${F(-r * .2)},${F(-r * .5)} ${F(-r * .45)},${F(-r * .65)} M0,${F(-r * .4)} q${F(r * .2)},${F(-r * .5)} ${F(r * .45)},${F(-r * .65)}" stroke="#5b4157" stroke-width="1.2" fill="none" stroke-linecap="round"/></g>`;
  };

  /** Icelandic lupine spike: a tapering cone of small petal pairs standing up from (x,y), height h.
      All petals are one path with a gradient (colour at the bottom, paler at the tip) to keep markup small. */
  const lupine = (x, y, h, c) => {
    const gid = 'dr-lup-' + c.replace('#', '');
    const g = H.def(gid, `<linearGradient id="${gid}" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${shade(c, -.08)}"/><stop offset="1" stop-color="${mix(c, '#ffffff', .6)}"/></linearGradient>`);
    const n = Math.max(4, Math.round(h / 8));
    let d = '';
    for (let i = 0; i < n; i++) {
      const k = i / n, yy = y - h * .14 - i * (h * .84 / n), w = (1 - k) * h * .15 + 2.6, rx = w * .62, ry = w * .45;
      for (const cx of [x - w * .5, x + w * .5]) d += `M${F(cx - rx)},${F(yy)}a${F(rx)},${F(ry)} 0 1 0 ${F(2 * rx)},0a${F(rx)},${F(ry)} 0 1 0 ${F(-2 * rx)},0`;
    }
    return `<path d="M${F(x)},${F(y)} Q${F(x - 1.5)},${F(y - h * .5)} ${F(x)},${F(y - h)}" stroke="#4f8a45" stroke-width="2" fill="none"/>` +
      `<path d="${d}" fill="${g}" stroke="${ink(c)}" stroke-width=".8"/><circle cx="${F(x)}" cy="${F(y - h)}" r="2" fill="${mix(c, '#ffffff', .6)}"/>`;
  };
  /** Lupine's hand-shaped leaf: 7 narrow leaflets fanning out from (x,y). */
  const lupineLeaf = (x, y, r, c) => Array.from({ length: 7 }, (_, i) => {
    const a = 200 + i * 23.3, rad = a * Math.PI / 180, ex = x + Math.cos(rad) * r * .55, ey = y + Math.sin(rad) * r * .55;
    return `<ellipse cx="${F(ex)}" cy="${F(ey)}" rx="${F(r * .5)}" ry="${F(r * .14)}" transform="rotate(${F(a)} ${F(ex)} ${F(ey)})" fill="${c}" stroke="${ink(c)}" stroke-width=".8"/>`;
  }).join('');

  /** Scallop sea shell (fan with ribs), hinge at (x,y), opening upward. */
  const shell = (x, y, r, c) => {
    let ribs = '';
    for (let i = 1; i < 6; i++) { const a = (200 + i * 23.3) * Math.PI / 180; ribs += `M${F(x)},${F(y)}L${F(x + Math.cos(a) * r * .95)},${F(y + Math.sin(a) * r * .95)}`; }
    return `<path d="M${F(x)},${F(y)} L${F(x - r)},${F(y - r * .5)} Q${F(x - r * .9)},${F(y - r * 1.2)} ${F(x)},${F(y - r * 1.15)} Q${F(x + r * .9)},${F(y - r * 1.2)} ${F(x + r)},${F(y - r * .5)} Z" fill="${H.grad(c, 'r')}" stroke="${ink(c)}" stroke-width="1.3" stroke-linejoin="round"/>` +
      `<path d="${ribs}" stroke="${ink(c)}" stroke-width="1" opacity=".55"/>` +
      `<path d="M${F(x - r * .35)},${F(y + r * .1)} h${F(r * .7)} l${F(-r * .15)},${F(-r * .3)} h${F(-r * .4)}Z" fill="${shade(c, -.1)}" stroke="${ink(c)}" stroke-width="1"/>`;
  };
  /** Pearl: small white bead with a pearly radial gradient. */
  const pearlFill = () => H.def('dr-pearl', '<radialGradient id="dr-pearl" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#f3eef6"/><stop offset="1" stop-color="#cfc3d8"/></radialGradient>');
  const pearl = (x, y, r) => `<circle cx="${F(x)}" cy="${F(y)}" r="${F(r)}" fill="${pearlFill()}" stroke="#a99bb4" stroke-width=".9"/>`;
  /** Pearls along a quadratic curve a → (control c) → b, drawn as ONE dotted stroke (round dashes of length 0),
      a grey rim underneath and a small white highlight dot on each pearl. n = number of pearls. */
  const pearlString = (a, c, b, n, r) => {
    const len = (() => { let L = 0, p = a; for (let i = 1; i <= 20; i++) { const t = i / 20, u = 1 - t, q = [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]; L += Math.hypot(q[0] - p[0], q[1] - p[1]); p = q; } return L; })();
    const gap = F(len / Math.max(1, n - 1)), d = `M${P(a)}Q${P(c)} ${P(b)}`;
    return `<path d="${d}" fill="none" stroke="#a99bb4" stroke-width="${F(2 * r + 1.6)}" stroke-dasharray="0 ${gap}" stroke-linecap="round"/>` +
      `<path d="${d}" fill="none" stroke="#f6f1f8" stroke-width="${F(2 * r)}" stroke-dasharray="0 ${gap}" stroke-linecap="round"/>` +
      `<path d="${d}" fill="none" stroke="#ffffff" stroke-width="${F(r * .8)}" stroke-dasharray="0 ${gap}" stroke-linecap="round" transform="translate(${F(-r * .3)},${F(-r * .35)})"/>`;
  };
  /** Starfish: five-armed star with dots. */
  const starfish = (x, y, r, c) => H.star(x, y, r, c).replace('/>', ` stroke="${ink(c)}" stroke-width="1.2" stroke-linejoin="round"/>`) +
    [0, 1, 2, 3, 4].map(i => { const a = (-90 + i * 72) * Math.PI / 180; return `<circle cx="${F(x + Math.cos(a) * r * .45)}" cy="${F(y + Math.sin(a) * r * .45)}" r="${F(r * .09)}" fill="#fff" opacity=".8"/>`; }).join('');

  /** Little standing puffin, feet at (x,y), scale s (1 ≈ 34 px tall), dir 1 = faces right, -1 = faces left. */
  const puffin = (x, y, s, dir = 1) =>
    `<g transform="translate(${F(x)},${F(y)}) scale(${F(s * dir)},${F(s)})">` +
    `<path d="M-3,-2 l-3,3 h5 M3,-2 l-1,3 h5" stroke="#ef7d2d" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>` +
    `<path d="M-9,-6 C-13,-14 -11,-26 -3,-30 C5,-33 11,-27 10,-18 C10,-10 7,-4 0,-2 C-4,-1 -7,-3 -9,-6Z" fill="#2c2b3c" stroke="#1b1a26" stroke-width="1.2"/>` +
    `<path d="M1,-18 C8,-17 9,-7 2,-3 C-3,-5 -3,-15 1,-18Z" fill="#ffffff"/>` +
    `<ellipse cx="3.5" cy="-27" rx="5" ry="4.4" fill="#f1eee8"/>` +
    `<path d="M7,-31 C12,-31 15,-28 16,-25 C13,-23 10,-23 7,-24Z" fill="#ef7d2d" stroke="#b9531a" stroke-width="1"/><path d="M10,-30.5 v6" stroke="#f7c23a" stroke-width="1.4"/>` +
    `<circle cx="4.5" cy="-28" r="1.4" fill="#1b1a26"/><circle cx="2" cy="-24" r="1.6" fill="#f6a7a2" opacity=".8"/>` +
    `<path d="M-8,-20 Q-12,-12 -6,-6" stroke="#4a4960" stroke-width="1.6" fill="none" stroke-linecap="round"/></g>`;

  /** Sun: round disc with alternating long and short rays. */
  const sun = (x, y, r, c, c2) => {
    let rays = '';
    for (let i = 0; i < 12; i++) {
      const a = i * 30 * Math.PI / 180, l = i % 2 ? r * 1.45 : r * 1.75, a1 = a - .17, a2 = a + .17;
      rays += `M${F(x + Math.cos(a1) * r * .9)},${F(y + Math.sin(a1) * r * .9)}L${F(x + Math.cos(a) * l)},${F(y + Math.sin(a) * l)}L${F(x + Math.cos(a2) * r * .9)},${F(y + Math.sin(a2) * r * .9)}Z`;
    }
    return `<path d="${rays}" fill="${c2}" stroke="${ink(c2)}" stroke-width="1" stroke-linejoin="round"/>` +
      `<circle cx="${F(x)}" cy="${F(y)}" r="${F(r)}" fill="${H.grad(c, 'r')}" stroke="${ink(c2)}" stroke-width="1.3"/>` +
      `<circle cx="${F(x - r * .3)}" cy="${F(y - r * .3)}" r="${F(r * .28)}" fill="#fff" opacity=".6"/>`;
  };

  /** Unicorn horn: slim golden cone with spiral stripes, base at (x,y), height h. */
  const horn = (x, y, h, c) => {
    const w = h * .2;
    let stripes = '';
    for (let i = 1; i < 4; i++) { const k = i / 4, yy = y - h * k, ww = w * (1 - k); stripes += `M${F(x - ww)},${F(yy + h * .06)}L${F(x + ww)},${F(yy - h * .04)}`; }
    return `<path d="M${F(x - w)},${F(y)} L${F(x)},${F(y - h)} L${F(x + w)},${F(y)} Q${F(x)},${F(y + h * .1)} ${F(x - w)},${F(y)}Z" fill="${H.grad(c)}" stroke="${ink(c)}" stroke-width="1.2" stroke-linejoin="round"/>` +
      `<path d="${stripes}" stroke="${ink(c)}" stroke-width="1.1" stroke-linecap="round" opacity=".7"/>`;
  };

  /** Fluffy little cloud centred at (x,y), width ~2.6r. */
  const cloud = (x, y, r, c = '#ffffff', st = '#c9d6e8') =>
    `<path d="M${F(x - r * 1.3)},${F(y + r * .4)} a${F(r * .5)},${F(r * .5)} 0 0 1 ${F(r * .3)},${F(-r * .9)} a${F(r * .6)},${F(r * .6)} 0 0 1 ${F(r * 1)},${F(-r * .35)} a${F(r * .55)},${F(r * .55)} 0 0 1 ${F(r * .95)},${F(r * .45)} a${F(r * .45)},${F(r * .45)} 0 0 1 ${F(r * .05)},${F(r * .8)} Z" fill="${c}" stroke="${st}" stroke-width="1.3" stroke-linejoin="round"/>`;

  /** Holly leaf pair with three red berries. */
  const holly = (x, y, s, g = '#3f8a4f', b = '#d8263a') => {
    const lf = `<path d="M0,0 q4,-5 8,-3 q2,-4 7,-3 q1,-4 6,-3 q-2,5 2,9 q-6,1 -7,5 q-4,-3 -8,0 q-2,-4 -8,-5Z" fill="${H.grad(g)}" stroke="${ink(g)}" stroke-width="1.1" stroke-linejoin="round"/>`;
    return `<g transform="translate(${F(x)},${F(y)}) scale(${F(s)})"><g transform="rotate(-20)">${lf}</g><g transform="scale(-1,1) rotate(-20)">${lf}</g>` +
      [[-3, 2], [3, 2], [0, -3]].map(([bx, by]) => `<circle cx="${bx}" cy="${by}" r="3.6" fill="${H.grad(b, 'r')}" stroke="${ink(b)}" stroke-width="1"/>`).join('') + `</g>`;
  };

  /** Fur trim: two staggered rows of fluffy balls along y from x0 to x1. */
  const fur = (x0, x1, y, r, c = '#ffffff', st = '#cfc6cf') => {
    let s = '';
    const n = Math.max(2, Math.round((x1 - x0) / (r * 1.25)));
    for (let row = 0; row < 2; row++) for (let i = 0; i <= n - row; i++) {
      const x = x0 + (x1 - x0) * (i + row * .5) / n;
      s += `<circle cx="${F(x)}" cy="${F(y + (row ? r * .55 : -r * .3))}" r="${F(r)}" fill="${H.grad(c, 'r')}" stroke="${st}" stroke-width="1.1"/>`;
    }
    return s;
  };

  /** Soft cotton-candy swirl (spiral stroke). */
  const swirl = (x, y, r, c, op = .7) =>
    `<path d="M${F(x)},${F(y)} a${F(r * .3)},${F(r * .3)} 0 1 1 ${F(r * .5)},${F(r * .15)} a${F(r * .6)},${F(r * .6)} 0 1 1 ${F(-r * 1.05)},${F(-r * .25)} a${F(r * .95)},${F(r * .9)} 0 0 1 ${F(r * 1.6)},${F(-r * .2)}" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" opacity="${op}"/>`;

  /** Tulle: tiny white dots on a see-through tile (overlay on top of a colour). */
  const tulle = () => H.def('dr-tulle', '<pattern id="dr-tulle" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="1.8" cy="1.8" r=".9" fill="#fff" opacity=".75"/><circle cx="5.3" cy="5.3" r=".9" fill="#fff" opacity=".75"/></pattern>');

  /* =============================================================
     PRINCESS DRESSES (cat 'dress', slot 'dress')
     ============================================================= */

  /* -------------------------------------------------------------
     1. Rose garden gown: four rounded petal tiers (dark rose at the
     waist → pale pink at the hem), roses on the tier edges, petal
     cap sleeves, scalloped neckline and a big rose on the leafy sash.
     colors: [pink, deep rose, leaf green, cream]
     ------------------------------------------------------------- */
  DOLL.shape('dress-rose', {
    slot: 'dress', occupies: OCC,
    draw(it) {
      const [pink, deep, green, cream = '#fff4f6'] = it.colors;
      const top = 404, xl = edge([[top, 141.5], [446, 131], [488, 118], [560, 88], [630, 67], [704, 56]]);
      const spec = [[690, 36, 16, 0], [624, 34, 16, 2], [560, 32, 15, 3], [500, 30, 14, 3]];
      const cols = [mix(pink, '#ffffff', .6), mix(pink, '#ffffff', .3), pink, deep];
      let skirt = '';
      spec.forEach(([y, step, amp, pad], i) => {
        const t = tier(xl, top, y, 'round', step, amp, pad);
        const fill = lg(`dr-${it.id}-t${i}`, [[0, shade(cols[i], -.05)], [.75, cols[i]], [1, shade(cols[i], .25)]]);
        // a light curve inside each petal edge and a little vein up from the tip
        const petals = tips(t).map(([x, y2]) => `M${F(x - t.w * .3)},${F(y2 - amp * .7)} Q${F(x)},${F(y2 - 2)} ${F(x + t.w * .3)},${F(y2 - amp * .7)}`).join('');
        const veins = tips(t).map(([x, y2]) => `M${F(x)},${F(y2 - 4)} q-2,-9 0,-18`).join('');
        skirt += `<path d="${t.d}" fill="${fill}"/><path d="${t.d}" fill="url(#soft-h)" opacity=".3"/>` +
          `<path d="${petals}" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".6"/>` +
          H.line(veins, cols[i], 1.4, .35) + outline(t.d, deep);
        // small roses on the joins of the two middle tiers
        if (i === 1 || i === 2) skirt += joins(t).filter((_, k) => k % 2 === (i === 1 ? 0 : 1)).map(([x, y2]) => leaf(x - 4, y2 + 4, 14, 150, green) + leaf(x + 4, y2 + 4, 14, 30, green) + rose(x, y2 + 2, 9, i === 1 ? deep : cream)).join('');
        if (i === 0) skirt += tips(t).filter((_, k) => k % 2 === 0).map(([x, y2]) => rose(x, y2 - 14, 6, pink)).join('');
      });
      const tw = twinkles([[118, 660, 4], [282, 650, 4], [170, 600, 3.5], [236, 594, 3.5], [150, 534, 3], [252, 530, 3], [200, 470, 3]]);
      // bodice with scalloped cream neckline and ruched lines
      const bodice = G.shirtPath({ sleeve: 0, pad: 2, bottom: 412, neck: 'scoop', neckDepth: 15 });
      const np = neckPts('scoop', 15, 2, 11);
      const scallops = 'M' + P(np[0]) + np.slice(1).map((p, i) => { const q = np[i]; return `Q${F((q[0] + p[0]) / 2)},${F((q[1] + p[1]) / 2 + 5)} ${P(p)}`; }).join('');
      const ruche = 'M160,300 Q180,320 176,350 M240,300 Q220,320 224,350 M168,352 Q186,370 182,398 M232,352 Q214,370 218,398 M200,292 V396';
      // puff sleeves finished with a row of rose petals pointing down the arm
      const sleeves = G.shirtPath({ sleeve: .22, pad: 3, sleevePad: 8, sleeveFlare: 3, bottom: 380, neck: 'scoop' });
      const sw = armHW(.22) + 11;
      const petalTrim = side => [-.8, -.4, 0, .4, .8].map((k, i) => {
        const [x, y] = armN(side, .225, k * sw), a = armAng(side, .225) - 90;
        return `<ellipse cx="${F(x)}" cy="${F(y)}" rx="6.5" ry="9" transform="rotate(${F(a)} ${F(x)} ${F(y)})" fill="${H.grad(i % 2 ? cream : pink)}" stroke="${ink(deep)}" stroke-width="1.4"/>`;
      }).join('');
      // leafy sash with a big rose on the left hip
      const sash = belt(402, 12, H.grad(green), green) +
        leaf(162, 410, 22, 150, shade(green, .1)) + leaf(166, 412, 20, 205, green) + leaf(180, 414, 16, 60, shade(green, .15)) +
        rose(168, 410, 13, deep) + rose(187, 416, 7, pink);
      return skirt + tw +
        `<path d="M134,520 Q114,600 106,672 Q124,604 144,526 Z" fill="url(#shine)" opacity=".45"/>` +
        `<path d="${sleeves}" fill="${H.grad(shade(pink, -.05))}"/>` + H.line(gathers(.04, .19, 20, pink), deep, 1.3, .4) + outline(sleeves, deep) + petalTrim('L') + petalTrim('R') +
        `<path d="${bodice}" fill="${H.grad(deep)}"/>` + H.line(ruche, deep, 1.6, .4) + outline(bodice, deep) +
        `<path d="${scallops}" fill="none" stroke="${cream}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>` +
        rose(200, 294, 9, cream) + leaf(190, 296, 12, 160, green) + leaf(210, 296, 12, 20, green) + rose(174, 380, 5, pink) + rose(226, 380, 5, pink) + sash;
    },
  });

  /* -------------------------------------------------------------
     2. Golden sun gown: A-line overskirt with sunburst pleats and
     sun-ray points, orange scalloped underskirt, flutter sleeves with
     a gold band, sun brooch, sun buckle, gold sparkles.
     colors: [gold, orange, light cream]
     ------------------------------------------------------------- */
  DOLL.shape('dress-sun', {
    slot: 'dress', occupies: OCC,
    draw(it) {
      const [gold, orange, light = '#fff6d6'] = it.colors;
      const top = 404, xl = edge([[top, 141.5], [470, 124], [560, 99], [640, 77], [704, 63]]);
      const under = tier(xl, top, 698, 'scallop', 20, 9, -1);
      const over = tier(xl, top, 680, 'zig', 24, 18, 3);
      const clip = H.clip('c-' + it.id + '-over', over.d);
      // sunburst pleats: alternating light and dark wedges fanning out from above the waist
      let wedges = '';
      for (let i = 0; i < 18; i++) {
        const a0 = (38 + i * 6) * Math.PI / 180, a1 = (38 + (i + 1) * 6) * Math.PI / 180;
        wedges += `<path d="M200,300 L${F(200 + Math.cos(a0) * 480)},${F(300 + Math.sin(a0) * 480)} L${F(200 + Math.cos(a1) * 480)},${F(300 + Math.sin(a1) * 480)}Z" fill="${i % 2 ? '#ffffff' : ink(gold)}" opacity="${i % 2 ? .22 : .12}"/>`;
      }
      const overFill = lg(`dr-${it.id}-o`, [[0, shade(gold, .2)], [1, shade(gold, -.06)]]);
      const underFill = lg(`dr-${it.id}-u`, [[0, orange], [1, shade(orange, -.1)]]);
      const pep = tier(xl, top, 476, 'zig', 22, 16, 5);
      const pepClip = H.clip('c-' + it.id + '-pep', pep.d);
      const suns = tips(over).filter((_, i) => i % 2 === 0).map(([x, y]) => sun(x, y - 22, 5, light, orange)).join('');
      const sparkle = [[130, 560, 4], [270, 556, 4], [160, 630, 3.5], [242, 626, 3.5], [200, 600, 5], [120, 492, 3], [280, 490, 3], [184, 520, 3], [218, 512, 3], [200, 650, 3]]
        .map(([x, y, r], i) => i % 2 ? H.diamond(x, y, r * 1.4, '#fff8d0') : twinkle(x, y, r + 1)).join('');
      // flutter sleeves: wide short sleeves; band width follows the sleeve flare
      const fl = t => armHW(t) + 6 + 14 * Math.max(0, (t - .12) / .18);
      const sleeves = G.shirtPath({ sleeve: .3, pad: 3, sleevePad: 6, sleeveFlare: 14, bottom: 380, neck: 'round' });
      const band = side => `<path d="${G.armPath(side, .262, .3, fl(.262) - armHW(.262) + .5, fl(.3) - fl(.262))}" fill="${H.grad(orange)}"/>`;
      const folds = ['L', 'R'].map(s => [-.5, 0, .5].map(k => `M${P(armN(s, .1, k * 12))}L${P(armN(s, .28, k * 26))}`).join('')).join('');
      const bodice = G.shirtPath({ sleeve: 0, pad: 2, bottom: 412, neck: 'round', neckDepth: 12 });
      const rays = Array.from({ length: 9 }, (_, i) => { const a = (205 + i * 16.25) * Math.PI / 180; return `M${F(200 + Math.cos(a) * 18)},${F(306 + Math.sin(a) * -18)}L${F(200 + Math.cos(a) * 46)},${F(306 + Math.sin(a) * -46)}`; }).join('');
      return `<path d="${under.d}" fill="${underFill}"/>` + outline(under.d, orange) + hemTrim(under.hemD, light, orange, 4) +
        `<path d="${over.d}" fill="${overFill}"/><g clip-path="${clip}">${wedges}</g>` + `<path d="${over.d}" fill="url(#soft-h)" opacity=".3"/>` + outline(over.d, shade(gold, -.1)) +
        `<path d="${over.hemD}" fill="none" stroke="${light}" stroke-width="3" stroke-linejoin="round" opacity=".9" transform="translate(0,-5)"/>` +
        suns + sparkle + sun(132, 640, 9, light, orange) + sun(268, 636, 9, light, orange) + sun(200, 600, 10, light, orange) +
        `<path d="${pep.d}" fill="${H.grad(shade(gold, -.04))}"/><g clip-path="${pepClip}">${wedges}</g>` + outline(pep.d, shade(gold, -.12)) + `<path d="${pep.hemD}" fill="none" stroke="${orange}" stroke-width="2.4" stroke-linejoin="round" transform="translate(0,-4)"/>` + tips(pep).map(([x, y]) => H.diamond(x, y + 4, 4, '#fff8d0')).join('') +
        `<path d="${sleeves}" fill="${H.grad(shade(gold, .15))}"/>` + band('L') + band('R') + H.line(folds, gold, 1.5, .4) + outline(sleeves, shade(gold, -.1)) +
        `<path d="${bodice}" fill="${H.grad(gold)}"/>` + H.line(rays, gold, 1.6, .35) + outline(bodice, shade(gold, -.1)) +
        `<path d="M184,262 Q200,282 216,262" fill="none" stroke="${light}" stroke-width="3" stroke-dasharray="1 5" stroke-linecap="round"/>` +
        sun(200, 306, 11, light, orange) +
        belt(401, 12, H.grad(orange), orange) + sun(200, 407, 6, light, gold);
    },
  });

  /* -------------------------------------------------------------
     3. Lupine meadow gown: empire waist, long flowing skirt fading
     from lavender to sky, a green meadow band at the hem with
     Icelandic lupine spikes and hand-shaped leaves, long bell sleeves
     with purple cuffs, smocked bodice and a ribbon bow.
     colors: [lavender, purple, green, sky blue]
     ------------------------------------------------------------- */
  DOLL.shape('dress-lupine', {
    slot: 'dress', occupies: OCC,
    draw(it) {
      const [lav, purple, green, sky = '#cfe3fb'] = it.colors;
      const top = 338, xl = edge([[top, 144], [400, 139], [470, 124], [560, 104], [640, 87], [704, 75]]);
      const sk = tier(xl, top, 700, 'wave', 30, 8);
      const veil = tier(xl, top, 556, 'scallop', 22, 10, 4);
      const clip = H.clip('c-' + it.id + '-sk', sk.d);
      const fill = lg(`dr-${it.id}-s`, [[0, lav], [.6, mix(lav, sky, .5)], [1, sky]]);
      // meadow band: two layers of grass blades
      const blades = (y, amp, step, off) => { let d = `M0,720L0,${y}`; for (let x = off; x < 400; x += step) d += `L${x + step / 2},${y - amp}L${x + step},${y}`; return d + 'L400,720Z'; };
      const meadow = `<path d="${blades(664, 12, 9, 0)}" fill="${shade(green, .2)}"/><path d="${blades(676, 9, 7, 3)}" fill="${H.grad(green)}"/>`;
      const spikes = [[96, 664, 46, purple], [118, 672, 62, '#e58ac0'], [140, 666, 72, purple], [164, 676, 56, '#8b7fe0'], [188, 668, 78, purple],
        [212, 672, 66, '#e58ac0'], [236, 666, 74, purple], [260, 674, 58, '#8b7fe0'], [282, 668, 66, purple], [304, 674, 46, '#e58ac0']]
        .map(([x, y, h, c]) => lupine(x, y, h, c)).join('');
      const leaves = [[108, 684, 11], [152, 688, 12], [200, 686, 12], [248, 688, 12], [292, 684, 11]].map(([x, y, r]) => lupineLeaf(x, y, r, shade(green, -.1))).join('');
      const folds = 'M170,350 Q162,450 150,560 M230,350 Q238,450 250,560 M190,360 Q186,470 182,600 M210,360 Q214,470 218,600';
      const fluff = [[130, 560], [270, 548], [176, 520], [226, 500], [150, 470], [250, 452], [200, 580]].map(([x, y]) => twinkle(x, y, 3.5)).join('');
      // long bell sleeves with a purple cuff band and white lace dots
      const sleeves = G.shirtPath({ sleeve: 1, pad: 2, sleevePad: 3, sleeveFlare: 12, bottom: 360, neck: 'scoop' });
      const cw = t => armHW(t) + 3 + 12 * Math.max(0, (t - .12) / .88);
      const cuff = side => `<path d="${G.armPath(side, .9, 1, cw(.9) - armHW(.9) + .5, cw(1) - cw(.9))}" fill="${H.grad(purple)}"/>` +
        Array.from({ length: 6 }, (_, i) => { const p = armN(side, .87, -cw(.87) + 2 * cw(.87) * (i + .5) / 6); return `<circle cx="${F(p[0])}" cy="${F(p[1])}" r="1.8" fill="#fff"/>`; }).join('');
      const bodice = G.shirtPath({ sleeve: 0, pad: 2, bottom: 344, neck: 'scoop', neckDepth: 14 });
      const smock = [290, 304, 318].map(y => `M166,${y}` + Array.from({ length: 17 }, (_, i) => `l4,${i % 2 ? -3 : 3}`).join('')).join('');
      return `<path d="${sk.d}" fill="${fill}"/>` +
        `<g clip-path="${clip}">${H.line(folds, lav, 2, .3)}${meadow}${leaves}${spikes}</g>` +
        `<path d="${sk.d}" fill="url(#soft-h)" opacity=".3"/>` + outline(sk.d, purple) +
        // sheer tulle overskirt to the knee with a lace scallop edge and tiny lupine sprigs
        `<path d="${veil.d}" fill="${mix(lav, purple, .25)}" opacity=".35"/><path d="${veil.d}" fill="${tulle()}"/>` + outline(veil.d, purple, 'h', 1.8) + hemTrim(veil.hemD, '#ffffff', purple, 4) +
        tips(veil).filter((_, i) => i % 2 === 0).map(([x, y]) => H.flower(x, y - 4, 5, '#ffffff')).join('') + fluff +
        `<path d="${sleeves}" fill="${H.pat('sparkle', shade(lav, .15), '#ffffff', 16)}"/>` + cuff('L') + cuff('R') + outline(sleeves, purple) +
        `<path d="${bodice}" fill="${H.grad(purple)}"/>` + `<path d="${smock}" fill="none" stroke="#fff" stroke-width="1.5" stroke-linejoin="round" opacity=".75"/>` + outline(bodice, purple) +
        `<path d="M178,262 Q200,288 222,262" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="1 5" stroke-linecap="round"/>` +
        lupine(200, 300, 30, mix(purple, '#ffffff', .35)).replace(/stroke="#4f8a45"/, 'stroke="#7ab86a"') +
        belt(336, 10, H.grad(shade(purple, -.1)), purple, G.torsoX(340) - 3) + bow(200, 341, 13, shade(purple, .15));
    },
  });

  /* -------------------------------------------------------------
     4. Ocean pearl gown: trumpet silhouette with three wave tiers
     (deep teal → aqua → sea foam), white foam and bubbles, pearl swags
     with shells, starfish, shell-ribbed bodice, pearl neckline, wavy
     sleeves with a foam trim.
     colors: [aqua, deep teal, sea foam, coral]
     ------------------------------------------------------------- */
  DOLL.shape('dress-ocean', {
    slot: 'dress', occupies: OCC,
    draw(it) {
      const [aqua, teal, foam, coral = '#f59a8b'] = it.colors;
      const top = 404, xl = edge([[top, 141.5], [470, 128], [540, 115], [610, 92], [660, 72], [704, 58]]);
      const ts = [tier(xl, top, 700, 'wave', 36, 12), tier(xl, top, 640, 'wave', 34, 12, 2), tier(xl, top, 578, 'wave', 32, 11, 3)];
      const cols = [foam, aqua, teal];
      let skirt = '';
      ts.forEach((t, i) => {
        skirt += `<path d="${t.d}" fill="${lg(`dr-${it.id}-t${i}`, [[0, shade(cols[i], -.05)], [1, shade(cols[i], .18)]])}"/><path d="${t.d}" fill="url(#soft-h)" opacity=".3"/>` + outline(t.d, teal) +
          hemTrim(t.hemD, '#ffffff', foam, 4) +
          tips(t, .2).filter((_, k) => k % 2).map(([x, y]) => `<circle cx="${F(x)}" cy="${F(y + 9)}" r="2.2" fill="none" stroke="#fff" stroke-width="1.2" opacity=".8"/><circle cx="${F(x + 7)}" cy="${F(y + 15)}" r="1.4" fill="#fff" opacity=".7"/>`).join('');
      });
      // pearl swags across the top tier, with a shell at each inner anchor
      const ax = [-1, -.5, 0, .5, 1].map(k => 200 + k * (200 - xl(520) - 4));
      let swags = '';
      for (let i = 0; i < 4; i++) swags += pearlString([ax[i], 520], [(ax[i] + ax[i + 1]) / 2, 548], [ax[i + 1], 520], 8, 2.6);
      swags += ax.slice(1, 4).map(x => shell(x, 526, 8, '#ffe6dc')).join('');
      const extras = shell(126, 690, 10, coral) + shell(274, 692, 10, '#ffd2c4') + starfish(160, 616, 9, coral) + starfish(246, 606, 8, '#f7c35f') +
        shell(200, 676, 8, '#fff0e8') + twinkles([[140, 580, 4], [262, 570, 4], [190, 640, 3.5], [110, 650, 3], [292, 646, 3], [176, 476, 3], [226, 470, 3]]);
      // wavy sleeves with foam trim + a pearl drop
      const sleeves = G.shirtPath({ sleeve: .22, pad: 3, sleevePad: 7, sleeveFlare: 6, bottom: 380, neck: 'scoop' });
      const sw = armHW(.22) + 7 + 6;
      const foamTrim = side => cuffBalls(side, .225, sw - 2, 4.6, '#ffffff', '#b7e3e6', 5);
      const bodice = G.shirtPath({ sleeve: 0, pad: 2, bottom: 412, neck: 'scoop', neckDepth: 16 });
      const ribs = Array.from({ length: 9 }, (_, i) => { const a = (210 + i * 15) * Math.PI / 180; return `M200,420L${F(200 + Math.cos(a) * 170)},${F(420 + Math.sin(a) * 170)}`; }).join('');
      const bclip = H.clip('c-' + it.id + '-b', bodice);
      const np = neckPts('scoop', 16, 2, 13);
      return skirt + swags + extras +
        `<path d="${sleeves}" fill="${H.grad(foam)}"/>` + outline(sleeves, teal) + foamTrim('L') + foamTrim('R') +
        `<path d="${bodice}" fill="${H.grad(teal)}"/>` + `<g clip-path="${bclip}">${H.line(ribs, aqua, 2, .5).replace(/stroke="[^"]+"/, `stroke="${shade(aqua, .35)}"`)}</g>` + outline(bodice, teal) +
        np.map(p => pearl(p[0], p[1] + 3, 3)).join('') + pearl(200, 296, 5.5) + shell(200, 318, 11, '#ffe6dc') +
        belt(403, 9, H.grad(aqua), teal) + pearlString([G.torsoX(404) - 2, 404], [200, 406], [402 - G.torsoX(404), 404], 23, 2.4) + pearlString([G.torsoX(412) - 2, 412], [200, 414], [402 - G.torsoX(412), 412], 23, 2.4);
    },
  });

  /* -------------------------------------------------------------
     5. Rainbow tulle gown: six puffy tulle tiers in pastel rainbow
     colours with ruffled hems and a dotted tulle overlay, white bodice
     with a rainbow-and-clouds picture, see-through puff sleeves with
     rainbow bands, rainbow sash with a bow.
     colors: [white, sparkle accent]
     ------------------------------------------------------------- */
  DOLL.shape('dress-rainbow', {
    slot: 'dress', occupies: OCC,
    draw(it) {
      const [white, accent = '#f27aa0'] = it.colors;
      const RB = ['#f68e9a', '#f8b77a', '#f6dc78', '#9fdc9a', '#8ec5f0', '#b9a0ec'];
      const top = 404, xl = edge([[top, 141.5], [444, 131], [488, 118], [560, 85], [630, 64], [704, 54]]);
      const ends = [704, 662, 618, 572, 526, 478];
      let skirt = '';
      for (let i = 0; i < 6; i++) {          // bottom tier (violet) first, top tier (pink) last
        const c = RB[5 - i], t = tier(xl, top, ends[i], 'scallop', 15, 7, i * .8 + 1);
        skirt += `<path d="${t.d}" fill="${lg(`dr-${it.id}-${i}`, [[0, shade(c, -.06)], [.8, c], [1, shade(c, .3)]])}"/><path d="${t.d}" fill="${tulle()}"/>` +
          `<path d="${t.d}" fill="url(#soft-h)" opacity=".3"/>` + outline(t.d, c) + hemTrim(t.hemD, '#ffffff', c, 3.5);
      }
      const stars = [[120, 680, 5], [280, 676, 5], [160, 640, 4], [242, 636, 4], [200, 596, 5], [134, 594, 3.5], [268, 588, 3.5], [176, 548, 4], [226, 546, 4], [200, 500, 3.5], [150, 504, 3], [250, 500, 3]]
        .map(([x, y, r], i) => i % 3 === 0 ? H.star(x, y, r + 1, '#fff') : twinkle(x, y, r + .5)).join('');
      // see-through tulle puff sleeves with a rainbow band
      const sleeves = G.shirtPath({ sleeve: .24, pad: 3, sleevePad: 9, sleeveFlare: 3, bottom: 380, neck: 'scoop' });
      const sw = t => armHW(t) + 9 + 3 * Math.max(0, (t - .12) / .12);
      const band = side => `<path d="${G.armPath(side, .205, .24, sw(.205) - armHW(.205) + .5, sw(.24) - sw(.205))}" fill="${H.pat('rainbow', '#fff', '#fff', 12)}"/>`;
      const bodice = G.shirtPath({ sleeve: 0, pad: 2, bottom: 412, neck: 'scoop', neckDepth: 14 });
      const arcs = RB.map((c, i) => `<path d="M${172 + i * 3.4},${346} a${28 - i * 3.4},${28 - i * 3.4} 0 0 1 ${56 - i * 6.8},0" fill="none" stroke="${c}" stroke-width="3.6"/>`).join('');
      return skirt + stars +
        `<path d="${sleeves}" fill="#ffffff" opacity=".55"/><path d="${sleeves}" fill="${tulle()}"/>` + band('L') + band('R') + H.line(gathers(.04, .2, 22, white), '#c9b7d9', 1.3, .5) + outline(sleeves, '#c6b4dd') +
        `<path d="${bodice}" fill="${H.pat('sparkle', white, '#f0e6ff', 16)}"/>` + outline(bodice, '#c6b4dd') +
        arcs + cloud(174, 344, 9) + cloud(226, 344, 9) +
        `<path d="M178,262 Q200,288 222,262" fill="none" stroke="${accent}" stroke-width="3" stroke-dasharray="1 5" stroke-linecap="round"/>` +
        `<rect x="${F(G.torsoX(408) - 3)}" y="402" width="${F(400 - 2 * (G.torsoX(408) - 3))}" height="12" rx="4" fill="${H.pat('rainbow', '#fff', '#fff', 12)}" stroke="#a691c4" stroke-width="2"/>` +
        bow(160, 408, 12, accent);
    },
  });

  /* -------------------------------------------------------------
     6. Northern lights night gown: dark navy column that flares at the
     hem, glowing green/pink aurora ribbons with light curtains, starry
     sky, Icelandic mountains at the hem, long sheer starry sleeves
     with green cuffs and star trim, crescent moon brooch.
     colors: [navy, aurora green, aurora pink, star yellow]
     ------------------------------------------------------------- */
  DOLL.shape('dress-aurora', {
    slot: 'dress', occupies: OCC,
    draw(it) {
      const [navy, green, pinkA, star] = it.colors;
      const top = 404, xl = edge([[top, 141.5], [470, 126], [560, 106], [640, 88], [700, 72]]);
      const sk = tier(xl, top, 700, 'scallop', 16, 5);
      const clip = H.clip('c-' + it.id + '-sk', sk.d);
      const sky = lg(`dr-${it.id}-sky`, [[0, shade(navy, -.15)], [.55, navy], [1, mix(navy, '#6a4fa0', .45)]]);
      const ribbonG = lg(`dr-${it.id}-rib`, [[0, green, .0], [.25, green, .85], [.6, mix(green, '#6fd8e0', .5), .8], [.85, pinkA, .8], [1, pinkA, 0]], 'h');
      const pinkG = lg(`dr-${it.id}-pk`, [[0, pinkA, 0], [.3, pinkA, .8], [.7, mix(pinkA, '#b48cf0', .5), .8], [1, '#b48cf0', 0]], 'h');
      const veil = tier(xl, top, 590, 'scallop', 26, 12, 4);
      const curtainG = lg(`dr-${it.id}-cur`, [[0, green, .55], [1, green, 0]]);
      const ribbon = (y0, amp, th) => {
        const top1 = `M40,${y0} C120,${y0 - amp} 200,${y0 + amp} 280,${y0 - amp * .2} S360,${y0 - amp} 380,${y0 - amp * .6}`;
        const bot = `L380,${y0 - amp * .6 + th} C360,${y0 - amp + th} 320,${y0 - amp * .2 + th * 1.2} 280,${y0 - amp * .2 + th} C200,${y0 + amp + th} 120,${y0 - amp + th} 40,${y0 + th}Z`;
        return `<path d="${top1}${bot}" fill="${ribbonG}"/>`;
      };
      const curtains = Array.from({ length: 14 }, (_, i) => `<rect x="${92 + i * 16}" y="${470 + (i % 3) * 14 + Math.sin(i) * 10}" width="5" height="${70 + (i % 4) * 14}" rx="2.5" fill="${curtainG}" transform="rotate(${-6 + i % 3 * 3} ${92 + i * 16} 500)"/>`).join('');
      const mountains = `<path d="M40,720 L40,668 L84,640 L112,656 L150,616 L184,650 L212,628 L246,656 L282,622 L318,650 L360,636 L380,660 L380,720Z" fill="${shade(navy, -.3)}"/>` +
        `<path d="M140,626 L150,616 L160,627 L154,624 L148,630Z M273,631 L282,622 L292,632 L286,629 L279,634Z M205,633 L212,628 L220,634Z" fill="#eef4ff"/>`;
      const starsD = [[118, 470], [270, 480], [150, 560], [232, 566], [100, 600], [300, 590], [180, 610], [210, 520], [130, 640], [262, 630], [190, 458], [244, 440], [160, 440]]
        .map(([x, y], i) => i % 2 ? H.star(x, y, 3.6, star) : twinkle(x, y, 4, '#fff')).join('');
      // long sheer starry sleeves, aurora cuff, row of little stars
      const sleeves = G.shirtPath({ sleeve: 1, pad: 2, sleevePad: 2, sleeveFlare: 4, bottom: 360, neck: 'scoop' });
      const cw = t => armHW(t) + 2 + 4 * Math.max(0, (t - .12) / .88);
      const cuff = side => `<path d="${G.armPath(side, .92, 1, cw(.92) - armHW(.92) + .5, cw(1) - cw(.92))}" fill="${H.grad(green)}"/>` +
        [-.6, 0, .6].map(k => { const p = armN(side, .84, k * cw(.84)); return H.star(p[0], p[1], 3.2, star); }).join('');
      const bodice = G.shirtPath({ sleeve: 0, pad: 2, bottom: 412, neck: 'round', neckDepth: 12 });
      const moon = `<path d="M206,288 a16,16 0 1 0 0,30 a12,12 0 1 1 0,-30Z" fill="${H.grad(star)}" stroke="${ink(star)}" stroke-width="1.4"/>` + H.star(212, 300, 5, '#fff');
      return `<path d="${sk.d}" fill="${sky}"/>` +
        `<g clip-path="${clip}">${curtains}${ribbon(470, 30, 26)}${ribbon(540, -24, 20)}<path d="M40,612 C120,590 200,640 280,606 S360,600 380,604 L380,620 C340,616 300,626 280,622 C200,656 120,606 40,628Z" fill="${pinkG}"/>${mountains}</g>` +
        starsD + `<path d="${sk.d}" fill="url(#soft-h)" opacity=".35"/>` + outline(sk.d, navy) +
        // sheer starry overskirt to the knee, scallops edged with a dotted silver line and stars on the tips
        `<path d="${veil.d}" fill="${mix(navy, '#8fa6ff', .3)}" opacity=".35"/>` +
        outline(veil.d, navy, 'h', 1.8) + hemTrim(veil.hemD, '#cfdcff', star, 3.5) + tips(veil, .9).map(([x, y]) => H.star(x, y + 2, 4.5, star)).join('') +
        `<path d="${sk.hemD}" fill="none" stroke="#d6e4ff" stroke-width="2" stroke-dasharray="1 5" stroke-linecap="round" transform="translate(0,3)"/>` +
        `<path d="${sleeves}" fill="${H.pat('stars', navy, '#fff3c4', 16)}" opacity=".62"/>` + cuff('L') + cuff('R') + outline(sleeves, navy) +
        `<path d="${bodice}" fill="${H.pat('sparkle', navy, '#bcd2ff', 14)}"/>` + outline(bodice, navy) +
        `<path d="M184,262 Q200,280 216,262" fill="none" stroke="${green}" stroke-width="3" stroke-dasharray="1 5" stroke-linecap="round"/>` + moon +
        belt(403, 8, H.grad('#cfd8e8'), '#9aa6bd') + H.star(200, 407, 7, star);
    },
  });

  /* -------------------------------------------------------------
     7. Strawberry party gown: pink gingham petticoat with a lace hem,
     red scalloped overskirt with seed dots and white rick-rack,
     strawberries hanging from the scallops, a strawberry-leaf waistband,
     pink bodice with a white round collar and gingham puff sleeves.
     colors: [red, pink, cream, leaf green]
     ------------------------------------------------------------- */
  DOLL.shape('dress-berry', {
    slot: 'dress', occupies: OCC,
    draw(it) {
      const [red, pink, cream, green] = it.colors;
      const top = 404, xl = edge([[top, 141.5], [450, 129], [488, 118], [570, 87], [640, 68], [704, 58]]);
      const petti = tier(xl, top, 696, 'scallop', 16, 8);
      const over = tier(xl, top, 606, 'scallop', 50, 24, 4);
      const rick = j => { let d = `M${F(j.x0)},${j.y}`; return d; };
      // white rick-rack follows the overskirt scallops a little inside
      const rickrack = `<path d="${over.hemD}" fill="none" stroke="#ffffff" stroke-width="3" stroke-dasharray="4 3" stroke-linecap="round" transform="translate(0,-6)"/>`;
      const berries = joins(over).map(([x, y]) => `<path d="M${F(x)},${F(y - 2)} v8" stroke="${shade(green, -.2)}" stroke-width="2"/>` + H.berry(x, y + 18, 11) +
        `<circle cx="${F(x - 3)}" cy="${F(y + 16)}" r="1.2" fill="#ffe9a8"/><circle cx="${F(x + 3)}" cy="${F(y + 20)}" r="1.2" fill="#ffe9a8"/><circle cx="${F(x)}" cy="${F(y + 24)}" r="1.2" fill="#ffe9a8"/>`).join('');
      const blossoms = [[120, 668], [168, 656], [232, 660], [280, 664], [200, 680], [144, 640], [256, 644]].map(([x, y], i) => i % 2 ? H.berry(x, y, 8) : H.flower(x, y, 7, '#ffffff')).join('');
      const calyx = (() => { let d = `M${F(G.torsoX(404) - 4)},400`; const x0 = G.torsoX(404) - 4, n = 9, w = (400 - 2 * x0) / n; for (let i = 0; i < n; i++) d += `l${F(w / 2)},${i % 2 ? 16 : 22}l${F(w / 2)},${i % 2 ? -16 : -22}`; return d + `L${F(400 - x0)},396Q200,392 ${F(x0)},396Z`; })();
      const sleeves = G.shirtPath({ sleeve: .24, pad: 3, sleevePad: 8, sleeveFlare: 3, bottom: 380, neck: 'round' });
      const sw = armHW(.24) + 11;
      const lace = side => { const a = armN(side, .245, -sw), b = armN(side, .245, sw); let d = `M${P(a)}`; const n = 6; for (let i = 1; i <= n; i++) { const p = [a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n]; const m = [a[0] + (b[0] - a[0]) * (i - .5) / n, a[1] + (b[1] - a[1]) * (i - .5) / n + 5]; d += `Q${P(m)} ${P(p)}`; } return `<path d="${d}" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round"/>`; };
      const bodice = G.shirtPath({ sleeve: 0, pad: 2, bottom: 412, neck: 'round' });
      const collar = s => { const X = x => s === 'L' ? x : 400 - x; return `<path d="M${X(200)},262 C${X(190)},262 ${X(186)},256 ${X(183)},251 C${X(170)},252 ${X(158)},262 ${X(162)},276 C${X(168)},290 ${X(192)},286 ${X(200)},264Z" fill="${H.grad(cream)}" stroke="${ink(pink)}" stroke-width="2" stroke-linejoin="round"/>`; };
      return `<path d="${petti.d}" fill="${H.pat('check', '#ffffff', pink, 14)}"/><path d="${petti.d}" fill="url(#soft-h)" opacity=".35"/>` + outline(petti.d, pink) +
        hemTrim(petti.hemD, '#ffffff', pink, 6) + blossoms +
        `<path d="${over.d}" fill="${H.pat('dots', red, '#ffd9a0', 12)}"/><path d="${over.d}" fill="url(#soft-h)" opacity=".4"/>` + outline(over.d, red) + rickrack +
        `<path d="M134,470 Q120,520 112,574 Q128,524 144,476 Z" fill="url(#shine)" opacity=".5"/>` + berries +
        twinkles([[150, 520, 4], [250, 516, 4], [200, 560, 4], [120, 690, 3], [282, 688, 3]]) +
        `<path d="${sleeves}" fill="${H.pat('check', '#ffffff', red, 10)}"/>` + H.line(gathers(.04, .2, 20, red), red, 1.3, .45) + outline(sleeves, red) + lace('L') + lace('R') +
        `<path d="${bodice}" fill="${H.grad(pink)}"/>` + outline(bodice, shade(pink, -.1)) +
        `<path d="${calyx}" fill="${H.grad(green)}"/>` + outline(calyx, green) +
        `<path d="M196,394 q-4,-10 4,-14" stroke="${shade(green, -.2)}" stroke-width="3" fill="none" stroke-linecap="round"/>` +
        collar('L') + collar('R') + bow(200, 266, 10, red) +
        [300, 324, 348, 372].map(y => H.berry(200, y, 5.5)).join('');
    },
  });

  /* -------------------------------------------------------------
     8. Unicorn pastel gown: three handkerchief tiers with pointed tips
     (mint, lilac, pink), gold stars on the tips, little golden horn
     motifs, a pastel rainbow sash, starry lilac bodice with a horn and
     flower brooch, striped puff sleeves with gold star trim.
     colors: [pink, lilac, mint, lemon, gold]
     ------------------------------------------------------------- */
  DOLL.shape('dress-unicorn', {
    slot: 'dress', occupies: OCC,
    draw(it) {
      const [pink, lilac, mint, lemon, gold] = it.colors;
      const top = 404, xl = edge([[top, 141.5], [460, 127], [490, 118], [580, 87], [650, 69], [704, 61]]);
      const ts = [tier(xl, top, 674, 'zig', 58, 30), tier(xl, top, 600, 'zig', 54, 28, 3), tier(xl, top, 520, 'zig', 50, 26, 4)];
      const cols = [mint, lilac, pink];
      const under = tier(xl, top, 702, 'scallop', 16, 7, -2);
      let skirt = `<path d="${under.d}" fill="${H.grad(lemon)}"/><path d="${under.d}" fill="${tulle()}"/>` + outline(under.d, shade(lemon, -.3)) + hemTrim(under.hemD, '#ffffff', gold, 4);
      ts.forEach((t, i) => {
        const c = cols[i];
        skirt += `<path d="${t.d}" fill="${lg(`dr-${it.id}-${i}`, [[0, shade(c, -.06)], [.7, c], [1, mix(c, lemon, .45)]])}"/><path d="${t.d}" fill="url(#soft-h)" opacity=".3"/>` + outline(t.d, c) +
          `<path d="${t.hemD}" fill="none" stroke="${gold}" stroke-width="2" stroke-dasharray="1 5" stroke-linecap="round" stroke-linejoin="round" transform="translate(0,-5)"/>` +
          tips(t).map(([x, y]) => H.star(x, y - 9, 5.5, gold).replace('/>', ` stroke="${ink(gold)}" stroke-width=".8"/>`)).join('');
      });
      // little unicorn horns with a flower at the base and a twinkle at the tip
      const horns = [[140, 640], [262, 636], [200, 656], [164, 566], [238, 562], [200, 490]].map(([x, y], i) => horn(x, y, 22, gold) +
        H.flower(x - 6, y + 1, 5, i % 2 ? pink : '#a9d4f5') + H.flower(x + 6, y + 1, 5, i % 2 ? mint : pink) + twinkle(x + 7, y - 22, 3.5)).join('');
      const tw = twinkles([[118, 690, 4], [284, 688, 4], [180, 620, 3.5], [222, 616, 3.5], [126, 590, 3], [276, 586, 3], [172, 520, 3], [228, 516, 3], [150, 470, 3], [250, 468, 3]]);
      const sleeves = G.shirtPath({ sleeve: .24, pad: 3, sleevePad: 8, sleeveFlare: 4, bottom: 380, neck: 'scoop' });
      const sw = armHW(.24) + 12;
      const starTrim = side => [-.7, -.23, .23, .7].map(k => { const p = armN(side, .235, k * sw); return H.star(p[0], p[1], 4, gold); }).join('');
      const bodice = G.shirtPath({ sleeve: 0, pad: 2, bottom: 412, neck: 'scoop', neckDepth: 14 });
      const np = neckPts('scoop', 14, 2, 10);
      const ruffle = np.slice(0, -1).map((p, i) => { const q = np[i + 1]; return `M${P(p)}Q${F((p[0] + q[0]) / 2)},${F((p[1] + q[1]) / 2 + 7)} ${P(q)}`; }).join('');
      const sash = lg(`dr-${it.id}-sash`, [[0, pink], [.25, lemon], [.5, mint], [.75, '#a9d4f5'], [1, lilac]], 'h');
      return skirt + horns + tw +
        `<path d="${sleeves}" fill="${H.pat('stripes', pink, '#ffffff', 10)}"/>` + H.line(gathers(.04, .2, 20, pink), pink, 1.3, .4) + outline(sleeves, shade(pink, -.1)) + starTrim('L') + starTrim('R') +
        `<path d="${bodice}" fill="${H.pat('stars', lilac, lemon, 18)}"/>` + outline(bodice, lilac) +
        `<path d="${ruffle}" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round"/>` +
        horn(200, 322, 34, gold) + H.flower(186, 322, 7, pink) + H.flower(214, 322, 7, '#a9d4f5') + H.flower(200, 328, 6, mint) +
        `<rect x="${F(G.torsoX(408) - 3)}" y="402" width="${F(400 - 2 * (G.torsoX(408) - 3))}" height="12" rx="4" fill="${sash}" stroke="${ink(lilac)}" stroke-width="2"/>` +
        H.star(200, 408, 7, gold).replace('/>', ` stroke="${ink(gold)}" stroke-width="1"/>`);
    },
  });

  /* -------------------------------------------------------------
     9. Flower fairy gown: a flower turned upside down – long pointed
     green leaves under big pink petals, a pale mint gauze underskirt,
     butterflies, small flowers and dew drops, leaf bodice with a petal
     collar, leaf sleeves, and a flower-chain belt.
     colors: [petal pink, leaf green, pale mint, yellow]
     ------------------------------------------------------------- */
  DOLL.shape('dress-fairy', {
    slot: 'dress', occupies: OCC,
    draw(it) {
      const [petal, green, minty, yellow] = it.colors;
      const top = 404, xl = edge([[top, 141.5], [460, 127], [490, 118], [580, 90], [650, 74], [704, 64]]);
      const gauze = tier(xl, top, 698, 'scallop', 16, 6, -2);
      const leaves = tier(xl, top, 668, 'petal', 30, 36, 2);
      const petals = tier(xl, top, 584, 'petal', 46, 46, 4);
      const petalFill = lg(`dr-${it.id}-p`, [[0, shade(petal, -.12)], [.6, petal], [1, mix(petal, '#ffffff', .55)]]);
      const leafFill = lg(`dr-${it.id}-l`, [[0, shade(green, -.15)], [1, shade(green, .15)]]);
      const veinsL = tips(leaves).map(([x, y]) => `M${F(x)},${F(y - 4)} Q${F(x - 1)},${F(y - 24)} ${F(x)},${F(y - 44)}`).join('');
      const veinsP = tips(petals).map(([x, y]) => `M${F(x)},${F(y - 6)} Q${F(x - 2)},${F(y - 30)} ${F(x)},${F(y - 54)}`).join('');
      const shineP = tips(petals).map(([x, y]) => `M${F(x - 12)},${F(y - 30)} Q${F(x - 9)},${F(y - 14)} ${F(x - 3)},${F(y - 8)}`).join('');
      const dew = [[128, 650], [276, 640], [196, 690], [166, 620], [238, 616]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="#ffffff" opacity=".8"/><circle cx="${x - 1}" cy="${y - 1}" r="1" fill="#fff"/>`).join('');
      const flowers = [[110, 690, 6], [292, 688, 6], [152, 682, 5], [250, 684, 5], [200, 640, 6]].map(([x, y, r]) => H.flower(x, y, r, '#ffffff')).join('');
      const flies = butterfly(130, 566, 13, '#8fd0f2', yellow) + butterfly(268, 548, 12, yellow, '#f7a6c2') + butterfly(214, 640, 10, '#c7a6f2', '#8fd0f2');
      // leaf sleeves: two leaves on each shoulder pointing out along the arm
      const leafSleeve = side => {
        const [x, y] = armN(side, .02, 4), a = armAng(side, .1), o = side === 'L' ? 1 : -1;
        return leaf(x, y, 46, a + o * 22, shade(green, .08)) + leaf(x, y + 2, 40, a - o * 4, green);
      };
      const bodice = G.shirtPath({ sleeve: 0, pad: 2, bottom: 412, neck: 'scoop', neckDepth: 14 });
      // petal collar: 6 round petals hanging from the neckline (left half computed, right half mirrored)
      const np = neckPts('scoop', 14, 2, 7);
      const collar = np.slice(0, -1).map((p, i) => { const q = np[i + 1], mxp = (p[0] + q[0]) / 2, myp = (p[1] + q[1]) / 2 + 2;
        return `<path d="M${F(p[0] - 2)},${F(p[1])}C${F(mxp - 14)},${F(myp + 12)} ${F(mxp - 5)},${F(myp + 22)} ${F(mxp)},${F(myp + 22)}C${F(mxp + 5)},${F(myp + 22)} ${F(mxp + 14)},${F(myp + 12)} ${F(q[0] + 2)},${F(q[1])}Z" fill="${H.grad(i % 2 ? '#ffffff' : petal)}" stroke="${ink(petal)}" stroke-width="1.4" stroke-linejoin="round"/>` +
          `<path d="M${F(mxp)},${F(myp + 4)}v12" stroke="${ink(petal)}" stroke-width="1" opacity=".4"/>`; }).join('') + H.flower(200, 300, 6, yellow);
      const bveins = 'M200,300 V404 M200,330 Q180,320 166,300 M200,330 Q220,320 234,300 M200,370 Q176,358 158,338 M200,370 Q224,358 242,338';
      const chain = Array.from({ length: 7 }, (_, i) => { const x = G.torsoX(408) + 4 + i * (400 - 2 * G.torsoX(408) - 8) / 6; return H.flower(x, 408, 8, i % 2 ? '#ffffff' : petal); }).join('');
      return `<path d="${gauze.d}" fill="${H.grad(minty)}"/><path d="${gauze.d}" fill="${tulle()}"/>` + outline(gauze.d, minty) +
        `<path d="${leaves.d}" fill="${leafFill}"/>` + H.line(veinsL, green, 1.6, .55) + outline(leaves.d, green) +
        `<path d="${petals.d}" fill="${petalFill}"/><path d="${petals.d}" fill="url(#soft-h)" opacity=".3"/>` + H.line(veinsP, petal, 1.5, .4) +
        `<path d="${shineP}" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".6"/>` + outline(petals.d, shade(petal, -.1)) +
        flowers + dew + flies + twinkles([[150, 500, 3.5], [252, 494, 3.5], [196, 540, 4], [110, 610, 3], [294, 604, 3]]) +
        leafSleeve('L') + leafSleeve('R') +
        `<path d="${bodice}" fill="${H.grad(green)}"/>` + H.line(bveins, green, 1.6, .45) + outline(bodice, green) + collar +
        `<path d="M${F(G.torsoX(408) - 3)},403h${F(400 - 2 * (G.torsoX(408) - 3))}v10h${F(-(400 - 2 * (G.torsoX(408) - 3)))}Z" fill="${H.grad(shade(green, -.1))}"/>` +
        leaf(150, 410, 16, 160, green) + leaf(250, 410, 16, 20, green) + chain;
    },
  });

  /* -------------------------------------------------------------
     10. Winter berry velvet gown: deep red velvet bell skirt split at
     the front over a cream-and-gold brocade panel with gold braid,
     holly and berries, a wide white fur hem, fur collar, gold lacing
     on the bodice, long velvet sleeves with fur cuffs and gold bands.
     colors: [berry red, cream, gold, holly green]
     ------------------------------------------------------------- */
  DOLL.shape('dress-velvet', {
    slot: 'dress', occupies: OCC,
    draw(it) {
      const [velvet, cream, gold, holly_] = it.colors;
      const top = 404, xl = edge([[top, 141.5], [460, 127], [492, 117], [580, 90], [650, 72], [700, 64]]);
      const sk = tier(xl, top, 694, 'flat', 40, 0);
      const clip = H.clip('c-' + it.id + '-sk', sk.d);
      const vel = lg(`dr-${it.id}-v`, [[0, shade(velvet, -.18)], [.3, shade(velvet, .12)], [.55, velvet], [.8, shade(velvet, .08)], [1, shade(velvet, -.22)]], 'h');
      const panel = 'M194,410 Q176,560 140,700 L260,700 Q224,560 206,410 Z';
      const braid = 'M194,410 Q176,560 140,700 M206,410 Q224,560 260,700';
      const streaks = '<path d="M120,520 Q108,600 100,680 L112,680 Q118,600 128,522Z M262,500 Q274,600 284,680 L292,680 Q282,600 268,500Z" fill="#fff" opacity=".14"/>';
      const hollies = [[200, 422, .9], [180, 520, .65], [220, 520, .65], [164, 610, .7], [236, 610, .7]].map(([x, y, s]) => holly(x, y, s, holly_)).join('');
      const sleeves = G.shirtPath({ sleeve: 1, pad: 2, sleevePad: 3, sleeveFlare: 3, bottom: 360, neck: 'round' });
      const cw = t => armHW(t) + 3 + 3 * Math.max(0, (t - .12) / .88);
      const sband = side => `<path d="${G.armPath(side, .3, .34, cw(.3) - armHW(.3) + .4, cw(.34) - cw(.3))}" fill="${H.grad(gold)}"/>`;
      const furCuff = side => cuffBalls(side, .93, cw(.93) + 1, 5.6, H.grad('#ffffff', 'r'), '#cfc6cf', 5) + cuffBalls(side, .965, cw(.965) - 1, 5, H.grad('#ffffff', 'r'), '#cfc6cf', 4);
      const bodice = G.shirtPath({ sleeve: 0, pad: 2, bottom: 412, neck: 'round', neckDepth: 12 });
      let lacing = '';
      for (let i = 0; i < 5; i++) { const y = 296 + i * 22; lacing += `M190,${y}L210,${y + 22}M210,${y}L190,${y + 22}`; }
      const eyelets = Array.from({ length: 6 }, (_, i) => `<circle cx="190" cy="${296 + i * 22}" r="2.2" fill="${gold}"/><circle cx="210" cy="${296 + i * 22}" r="2.2" fill="${gold}"/>`).join('');
      const collarFur = neckPts('round', 12, 2, 9).map(p => `<circle cx="${F(p[0])}" cy="${F(p[1] + 3)}" r="5.4" fill="${H.grad('#ffffff', 'r')}" stroke="#cfc6cf" stroke-width="1.1"/>`).join('');
      return `<path d="${sk.d}" fill="${vel}"/>` +
        `<g clip-path="${clip}"><path d="${panel}" fill="${H.pat('sparkle', cream, gold, 14)}"/>${streaks}</g>` +
        `<path d="${braid}" fill="none" stroke="${shade(gold, -.25)}" stroke-width="7" stroke-linecap="round"/><path d="${braid}" fill="none" stroke="${gold}" stroke-width="4" stroke-dasharray="4 3" stroke-linecap="round"/>` +
        `<path d="${sk.d}" fill="url(#soft-v)" opacity=".5"/>` + outline(sk.d, velvet, 'v') + hollies +
        fur(xl(694) - 2, 402 - xl(694), 694, 8) +
        twinkles([[150, 470, 3.5], [250, 466, 3.5], [126, 600, 4], [276, 596, 4], [200, 664, 3.5], [112, 660, 3], [290, 656, 3]], '#fff6dc') +
        `<path d="${sleeves}" fill="${vel}"/>` + sband('L') + sband('R') + outline(sleeves, velvet) + furCuff('L') + furCuff('R') +
        `<path d="${bodice}" fill="${vel}"/>` + outline(bodice, velvet) +
        `<path d="${lacing}" stroke="${gold}" stroke-width="2.2" stroke-linecap="round"/>` + eyelets + collarFur +
        belt(401, 9, H.grad(gold), gold) + `<path d="M200,397 l6,8 l-6,8 l-6,-8Z" fill="${H.grad('#d8263a', 'r')}" stroke="${ink(gold)}" stroke-width="1.4"/>`;
    },
  });

  /* -------------------------------------------------------------
     11. Cotton-candy cloud ballgown: the widest skirt – three tiers
     with puffy cloud hems swirled pink and blue, candy swirls, small
     clouds, hearts and stars, cloud-puff sleeves, pearl neckline,
     cloud belt and a cloud brooch with a heart.
     colors: [pink, baby blue, lilac, white]
     ------------------------------------------------------------- */
  DOLL.shape('dress-cloud', {
    slot: 'dress', occupies: OCC,
    thumb: [36, 236, 328, 500],
    draw(it) {
      const [pink, blue, lilac, white = '#ffffff'] = it.colors;
      const top = 404, xl = edge([[top, 141.5], [444, 133], [488, 118], [540, 90], [600, 62], [700, 46]]);
      const ts = [tier(xl, top, 690, 'cloud', 40, 14), tier(xl, top, 616, 'cloud', 38, 14, 3), tier(xl, top, 534, 'cloud', 34, 13, 4)];
      const fills = [[blue, pink, blue], [pink, lilac, pink], [blue, pink, blue]];
      let skirt = '';
      ts.forEach((t, i) => {
        const [a, b, c] = fills[i];
        const g = lg(`dr-${it.id}-${i}`, [[0, shade(a, -.04)], [.35, mix(a, '#ffffff', .25)], [.55, b], [.8, mix(c, '#ffffff', .3)], [1, shade(c, -.04)]], 'h');
        skirt += `<path d="${t.d}" fill="${g}"/><path d="${t.d}" fill="url(#soft-v)" opacity=".5"/>` + outline(t.d, lilac) +
          tips(t, .2).map(([x, y]) => `<ellipse cx="${F(x - 4)}" cy="${F(y - 2)}" rx="${F(t.w * .26)}" ry="4" fill="#fff" opacity=".45"/>`).join('');
      });
      const swirls = [[126, 646, 12], [276, 640, 12], [200, 664, 10], [164, 580, 10], [240, 576, 10], [200, 500, 9], [150, 500, 7], [250, 496, 7]].map(([x, y, r], i) => swirl(x, y, r, i % 2 ? '#ffffff' : shade(pink, -.15), .75)).join('');
      const extras = cloud(110, 680, 9) + cloud(292, 676, 9) + cloud(196, 600, 8) + cloud(212, 530, 6) +
        [[150, 626], [252, 618], [176, 470], [226, 466]].map(([x, y]) => H.heart(x, y, 6, '#ff8fb8')).join('') +
        twinkles([[106, 620, 4], [298, 614, 4], [140, 546, 3.5], [262, 542, 3.5], [200, 640, 3.5], [96, 696, 3], [306, 694, 3]]);
      // puffy sleeves in soft blue with a cloud-puff edge at the cuff
      const sleeves = G.shirtPath({ sleeve: .24, pad: 3, sleevePad: 10, sleeveFlare: 3, bottom: 380, neck: 'scoop' });
      const sw = armHW(.24) + 12;
      const puffs = side => `<path d="${sleeves}" fill="none"/>` + cuffBalls(side, .235, sw - 3, 6.2, H.grad('#ffffff', 'r'), '#c9cde6', 5);
      const bodice = G.shirtPath({ sleeve: 0, pad: 2, bottom: 412, neck: 'scoop', neckDepth: 15 });
      const np = neckPts('scoop', 15, 2, 13);
      const beltPuffs = Array.from({ length: 10 }, (_, i) => { const x0 = G.torsoX(406) - 2, x = x0 + i * (400 - 2 * x0) / 9; return `<circle cx="${F(x)}" cy="408" r="7.5" fill="${H.grad('#ffffff', 'r')}" stroke="#c9cde6" stroke-width="1.3"/>`; }).join('');
      return skirt + swirls + extras +
        `<path d="${sleeves}" fill="${H.grad(mix(blue, '#ffffff', .35))}"/>` + H.line(gathers(.04, .2, 22, blue), blue, 1.3, .45) + outline(sleeves, lilac) + puffs('L') + puffs('R') +
        `<path d="${bodice}" fill="${H.pat('hearts', pink, mix(pink, '#ffffff', .5), 18)}"/>` + outline(bodice, shade(pink, -.15)) +
        np.map(p => pearl(p[0], p[1] + 3, 3)).join('') +
        cloud(200, 312, 13) + H.heart(200, 310, 5, '#ff7aa8') + beltPuffs;
    },
  });

  /* -------------------------------------------------------------
     12. Puffin seaside gown: navy drop-waist bodice with a white sailor
     collar and an orange neckerchief bow, white pleated skirt with
     navy stripes, three puffins standing on a wave line, a navy ruffle
     hem with orange rick-rack, striped puff sleeves, orange sash.
     colors: [navy, white, orange, sea blue]
     ------------------------------------------------------------- */
  DOLL.shape('dress-puffin', {
    slot: 'dress', occupies: OCC,
    draw(it) {
      const [navy, white, orange, sea] = it.colors;
      const top = 444, xl = edge([[top, 138.5], [490, 124], [560, 104], [640, 82], [704, 68]]);
      const ruff = tier(xl, top, 694, 'scallop', 18, 9);
      const main = tier(xl, top, 640, 'wave', 30, 9, 2);
      const clip = H.clip('c-' + it.id + '-m', main.d);
      const pleats = Array.from({ length: 11 }, (_, i) => { const k = (i - 5) / 5; return `M${F(200 + k * 50)},446L${F(200 + k * 136)},660`; }).join('');
      const stripes = `<rect x="0" y="566" width="400" height="7" fill="${navy}"/><rect x="0" y="580" width="400" height="3.5" fill="${navy}"/>`;
      const sea_ = `<path d="M0,700 L0,618 Q20,610 40,618 T80,618 T120,618 T160,618 T200,618 T240,618 T280,618 T320,618 T360,618 T400,618 L400,700Z" fill="${H.grad(sea)}"/>`;
      const puffins = puffin(136, 616, 1.05, 1) + puffin(200, 618, 1.15, 1) + puffin(264, 616, 1.05, -1);
      const bodice = G.shirtPath({ sleeve: 0, pad: 2, bottom: 450, neck: 'round', neckDepth: 10 });
      const sleeves = G.shirtPath({ sleeve: .24, pad: 3, sleevePad: 8, sleeveFlare: 3, bottom: 380, neck: 'round' });
      const sw = t => armHW(t) + 8 + 3 * Math.max(0, (t - .12) / .12);
      const cuff = side => `<path d="${G.armPath(side, .2, .215, sw(.2) - armHW(.2) + .5, sw(.215) - sw(.2))}" fill="${navy}"/><path d="${G.armPath(side, .225, .24, sw(.225) - armHW(.225) + .5, sw(.24) - sw(.225))}" fill="${navy}"/>`;
      // sailor collar: big square-ended collar over the shoulders with a V at the front
      const collarL = 'M183,251 L200,298 L200,322 L172,306 Q152,294 146,272 Q156,258 168,254 Z';
      const collar = side => { const d = side === 'L' ? collarL : collarL.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, (m, x, y) => `${400 - +x},${y}`); return d; };
      const cl = collar('L'), cr = collar('R');
      const stripeL = 'M178,258 Q160,262 154,274 Q160,292 176,301 L196,312';
      const stripeR = stripeL.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, (m, x, y) => `${400 - +x},${y}`);
      const dickey = `<path d="M186,256 L200,296 L214,256 Q200,266 186,256Z" fill="${white}"/><path d="M190,266 h20 M193,276 h14 M196,286 h8" stroke="${navy}" stroke-width="2.2"/>`;
      const knot = `<path d="M200,318 l-14,-10 l2,16Z M200,318 l14,-10 l-2,16Z" fill="${H.grad(orange)}" stroke="${ink(orange)}" stroke-width="1.6" stroke-linejoin="round"/>` +
        `<path d="M196,320 l-8,26 l6,-3 l3,6Z M204,320 l8,26 l-6,-3 l-3,6Z" fill="${H.grad(orange)}" stroke="${ink(orange)}" stroke-width="1.4" stroke-linejoin="round"/><circle cx="200" cy="318" r="4.5" fill="${shade(orange, .1)}" stroke="${ink(orange)}" stroke-width="1.4"/>`;
      const buttons = [360, 384, 408].map(y => `<circle cx="186" cy="${y}" r="3.4" fill="${orange}" stroke="${ink(orange)}" stroke-width="1.2"/><circle cx="214" cy="${y}" r="3.4" fill="${orange}" stroke="${ink(orange)}" stroke-width="1.2"/>`).join('');
      return `<path d="${ruff.d}" fill="${H.grad(navy)}"/>` + outline(ruff.d, navy) +
        `<path d="${ruff.hemD}" fill="none" stroke="${orange}" stroke-width="2.6" stroke-dasharray="5 3" transform="translate(0,-8)"/>` +
        `<path d="${main.d}" fill="${H.grad(white)}"/><g clip-path="${clip}">${H.line(pleats, '#9fb3c8', 1.6, .55)}${stripes}${sea_}</g>` +
        `<path d="${main.d}" fill="url(#soft-h)" opacity=".35"/>` + outline(main.d, navy) +
        `<path d="${main.hemD}" fill="none" stroke="#ffffff" stroke-width="3" opacity=".8" transform="translate(0,-4)"/>` +
        puffins + twinkles([[150, 500, 3.5], [250, 498, 3.5], [200, 530, 3.5], [112, 670, 3], [290, 668, 3]], '#ffffff') +
        H.star(166, 520, 4, orange) + H.star(234, 520, 4, orange) +
        `<path d="${sleeves}" fill="${H.grad(white)}"/>` + cuff('L') + cuff('R') + H.line(gathers(.04, .2, 20, white), '#9fb3c8', 1.3, .6) + outline(sleeves, navy) +
        `<path d="${bodice}" fill="${H.grad(navy)}"/>` + outline(bodice, navy) + dickey +
        `<path d="${cl}" fill="${H.grad(white)}" stroke="${ink(navy)}" stroke-width="2" stroke-linejoin="round"/><path d="${cr}" fill="${H.grad(white)}" stroke="${ink(navy)}" stroke-width="2" stroke-linejoin="round"/>` +
        `<path d="${stripeL}${stripeR.replace('M', 'M')}" fill="none" stroke="${navy}" stroke-width="2.6" stroke-linecap="round"/>` +
        knot + buttons + belt(440, 10, H.grad(orange), orange, G.torsoX(445) - 2) + bow(160, 445, 10, orange);
    },
  });

  /* -------------------------------------------------------------
     Catalog: princess dresses
     ------------------------------------------------------------- */
  DOLL.add([
    { id: 'gown-rose', shape: 'dress-rose', cat: 'dress', name: { is: 'Rósagarðskjóll', en: 'Rose garden gown' }, colors: ['#f7a3b8', '#d9466d', '#5fae6a', '#fff2f5'] },
    { id: 'gown-sun', shape: 'dress-sun', cat: 'dress', name: { is: 'Sólarkjóll', en: 'Golden sun gown' }, colors: ['#f7c843', '#f08a3c', '#fff4cf'] },
    { id: 'gown-lupine', shape: 'dress-lupine', cat: 'dress', name: { is: 'Lúpínukjóll', en: 'Lupine meadow gown' }, colors: ['#d9cbf5', '#7d5cc8', '#6dae5a', '#cfe6fb'] },
    { id: 'gown-ocean', shape: 'dress-ocean', cat: 'dress', name: { is: 'Perluhafskjóll', en: 'Ocean pearl gown' }, colors: ['#62c6d6', '#2a7f9e', '#c9f1ee', '#f59a8b'] },
    { id: 'gown-rainbow', shape: 'dress-rainbow', cat: 'dress', name: { is: 'Regnbogakjóll', en: 'Rainbow tulle gown' }, colors: ['#ffffff', '#f27aa0'] },
    { id: 'gown-aurora', shape: 'dress-aurora', cat: 'dress', name: { is: 'Norðurljósakjóll', en: 'Northern lights gown' }, colors: ['#232b63', '#5fe0a0', '#f28ad0', '#fbe38a'] },
    { id: 'gown-strawberry', shape: 'dress-berry', cat: 'dress', name: { is: 'Jarðarberjakjóll', en: 'Strawberry party gown' }, colors: ['#e5404f', '#f7a8bd', '#fffaf2', '#4fae5b'] },
    { id: 'gown-unicorn', shape: 'dress-unicorn', cat: 'dress', name: { is: 'Einhyrningakjóll', en: 'Unicorn pastel gown' }, colors: ['#f9b8d2', '#cdb6f4', '#b6ecd6', '#fff1a8', '#f2c34d'] },
    { id: 'gown-fairy', shape: 'dress-fairy', cat: 'dress', name: { is: 'Blómálfakjóll', en: 'Flower fairy gown' }, colors: ['#f6a6c8', '#5eb36a', '#dff5e3', '#ffd84d'] },
    { id: 'gown-velvet', shape: 'dress-velvet', cat: 'dress', name: { is: 'Vetrarberjakjóll', en: 'Winter berry velvet gown' }, colors: ['#b3213f', '#fff3dc', '#e8b84a', '#3f8a4f'] },
    { id: 'gown-cloud', shape: 'dress-cloud', cat: 'dress', name: { is: 'Kandíflosskjóll', en: 'Cotton-candy cloud gown' }, colors: ['#ffb6d5', '#b5dcff', '#d9c4f5', '#ffffff'] },
    { id: 'gown-puffin', shape: 'dress-puffin', cat: 'dress', name: { is: 'Lundakjóll', en: 'Puffin seaside gown' }, colors: ['#26386e', '#ffffff', '#f07c2a', '#8fcbea'] },
  ]);

  /* =============================================================
     EVERYDAY DRESSES (cat 'frock', slot 'dress')
     ============================================================= */

  /** Half-width of a G.shirtPath sleeve at arm position t (same formula as core), for bands and trims. */
  const sleeveW = (t, sleeve, sp, flare = 0) => {
    const t0 = Math.min(.12, sleeve * .6);
    return armHW(t) + sp + flare * Math.max(0, (t - t0) / Math.max(.01, sleeve - t0));
  };
  /** Band around a G.shirtPath sleeve between t0 and t1 (cuffs, sleeve stripes). Exactly as wide as the sleeve there. */
  const sleeveBand = (side, t0, t1, sleeve, sp, flare, fill) => {
    const w0 = sleeveW(t0, sleeve, sp, flare), w1 = sleeveW(t1, sleeve, sp, flare);
    return `<path d="${G.armPath(side, t0, t1, w0 - armHW(t0) + .4, (w1 - armHW(t1)) - (w0 - armHW(t0)))}" fill="${fill}"/>`;
  };
  /** Round "Peter Pan" collar, left half drawn and mirrored for the right. */
  const peterCollar = (c, line, y = 262) => ['L', 'R'].map(sd => {
    const X = x => sd === 'L' ? x : 400 - x;
    return `<path d="M${X(200)},${y} C${X(190)},${y} ${X(186)},${y - 6} ${X(183)},${y - 11} C${X(168)},${y - 10} ${X(156)},${y + 2} ${X(161)},${y + 15} C${X(168)},${y + 29} ${X(193)},${y + 25} ${X(200)},${y + 2}Z" fill="${H.grad(c)}" stroke="${ink(line)}" stroke-width="2" stroke-linejoin="round"/>` +
      `<path d="M${X(197)},${y + 6} C${X(190)},${y + 20} ${X(172)},${y + 22} ${X(165)},${y + 13}" fill="none" stroke="${ink(line)}" stroke-width="1.3" stroke-dasharray="2 3" opacity=".6"/>`;
  }).join('');
  /** Patch pocket at (x,y) with a little motif ('heart' | 'flower' | 'star' | 'none'). */
  const pocket = (x, y, c, motif, mc) => `<path d="M${x - 15},${y} h30 v18 q0,9 -9,9 h-12 q-9,0 -9,-9Z" fill="${H.grad(shade(c, .06))}" stroke="${ink(c)}" stroke-width="1.8" stroke-linejoin="round"/>` +
    `<path d="M${x - 15},${y + 5} h30" stroke="${ink(c)}" stroke-width="1.2" stroke-dasharray="2 2.5" opacity=".6"/>` +
    (motif === 'heart' ? H.heart(x, y + 15, 6, mc) : motif === 'flower' ? H.flower(x, y + 15, 6, mc) : motif === 'star' ? H.star(x, y + 15, 6, mc) : '');

  /* -------------------------------------------------------------
     Frock: one strongly parameterised everyday dress.
     Params on the item:
       sleeve  0 | .15 | .3 | .55 | 1    sleeve length (0 + straps:true = sundress straps)
       sleevePad, sleeveFlare             puff / flutter / bell
       neck, neckDepth                    as G.shirtPath
       waist   'none' (one piece, A-line from the shoulders) | 'high' | 'natural' | 'drop'
       skirt   'aline' | 'full' | 'tulle' | 'ruffle' | 'tiered'
       hem     hem height (knee ≈ 574)
       collar 'peter', pockets 'heart'|'flower'|'star', buttons n, sash true, smock true, knit true
     colors: [main, accent/trim, second (bodice or underlayer), motif colour]
     ------------------------------------------------------------- */
  DOLL.shape('frock', {
    slot: 'dress', occupies: OCC,
    thumb: [56, 236, 288, 380],
    draw(it) {
      const [main, accent, second = main, motif = accent] = it.colors;
      const sleeve = it.sleeve ?? .3, sp = it.sleevePad ?? 5, sfl = it.sleeveFlare ?? 0;
      const neck = it.neck || 'round', hemY = it.hem || 590, waist = it.waist || 'natural', skirt = it.skirt || 'aline';
      const fillMain = H.fill(it);
      const line = shade(main, -.1);
      const flare = it.flare ?? 1;
      let out = '';
      let body = '', sleevesD = '';
      // ---- one-piece dresses (t-shirt dress, knit dress): body and skirt are one shirtPath ----
      if (waist === 'none') {
        const d = G.shirtPath({ sleeve, pad: 4, sleevePad: sp, sleeveFlare: sfl, bottom: hemY, flare: 26 * flare, neck: it.straps ? 'square' : neck, neckDepth: it.neckDepth });
        const clip = H.clip('c-' + it.id, d);
        let inner = '';
        // contrast hem band (or ribbing) and sleeve bands
        inner += `<rect x="0" y="${hemY - 22}" width="400" height="24" fill="${it.knit ? H.pat('stripes', second, shade(second, -.12), 6) : it.hemRainbow ? H.pat('rainbow', '#fff', '#fff', 24) : second}"/>`;
        if (it.hemRainbow) inner += [[150, 520], [250, 500], [176, 450], [232, 560], [140, 400], [262, 380]].map(([x, y], i) => i % 2 ? H.star(x, y, 6, accent) : H.heart(x, y, 6, '#ef6f6c')).join('');
        if (!it.knit) inner += `<rect x="0" y="${hemY - 28}" width="400" height="3" fill="${accent}"/>`;
        if (sleeve > 0) for (const sd of ['L', 'R']) inner += sleeveBand(sd, sleeve - (sleeve > .5 ? .1 : .05), sleeve, sleeve, sp, sfl, it.knit ? H.pat('stripes', second, shade(second, -.12), 6) : second);
        // knit dress: two cable braids down the front
        if (it.knit) inner += [176, 224].map(x => `<path d="M${x},280` + Array.from({ length: 16 }, (_, i) => `q${i % 2 ? -8 : 8},9 0,18`).join('') + `" fill="none" stroke="${shade(main, -.18)}" stroke-width="5" opacity=".5"/>`).join('');
        out += `<path d="${d}" fill="${fillMain}"/><g clip-path="${clip}">${inner}</g>` +
          H.line(`M160,330 q8,14 4,30 M240,330 q-8,14 -4,30 M168,${hemY - 60} q4,20 0,36 M232,${hemY - 60} q-4,20 0,36`, main, 1.8, .4) + outline(d, line);
        sleevesD = d;
      } else {
        // ---- dresses with a seam: bodice + skirt ----
        const wy = waist === 'high' ? 340 : waist === 'drop' ? 444 : 404;
        const top = wy;
        const xw = G.torsoX(wy + 4) - 2.5;
        const spread = (skirt === 'full' || skirt === 'tulle' ? 48 : skirt === 'tiered' || skirt === 'ruffle' ? 40 : 30) * flare;
        // skirt edge: from the waist, out past the hands (≥117 at y 476), to the hem
        const xl = edge([[top, xw], [Math.max(top + 30, 450), Math.min(xw, 132) - (wy < 400 ? 4 : 0)], [Math.max(top + 60, 486), 121 - spread * .08], [hemY, 132 - spread]]);
        // underlayer (petticoat / ruffle) peeking below the hem
        if (skirt === 'ruffle' || skirt === 'tiered') {
          const r = tier(xl, top, hemY + 18, skirt === 'ruffle' ? 'scallop' : 'flat', 16, 7, -3);
          out += `<path d="${r.d}" fill="${skirt === 'ruffle' ? H.grad(second) : fillMain}"/>` + outline(r.d, line) + (skirt === 'ruffle' ? hemTrim(r.hemD, '#ffffff', accent, 3.5) : '');
        }
        if (skirt === 'tulle') {
          for (let i = 0; i < 2; i++) {
            const r = tier(xl, top, hemY + 14 - i * 10, 'scallop', 13, 6, 6 - i * 4);
            out += `<path d="${r.d}" fill="${H.grad(i ? main : second)}"/><path d="${r.d}" fill="${tulle()}"/>` + outline(r.d, line, 'h', 2) + hemTrim(r.hemD, '#ffffff', accent, 3);
          }
          out += twinkles([[140, 520, 4], [260, 516, 4], [170, 560, 3.5], [232, 556, 3.5], [200, 530, 3.5], [120, 580, 3], [282, 578, 3]]);
        } else {
          const hemType = skirt === 'tiered' ? 'flat' : (it.hemType || 'flat');
          const sk = tier(xl, top, skirt === 'tiered' ? hemY - 8 : hemY, hemType, 18, 8, skirt === 'full' ? 3 : 0);
          const clip = H.clip('c-' + it.id + '-sk', sk.d);
          let inner = '';
          if (it.hemBand) inner += `<rect x="0" y="${hemY - 18}" width="400" height="12" fill="${it.hemBand}"/><rect x="0" y="${hemY - 24}" width="400" height="3" fill="${it.hemBand}"/>`;
          const gath = Array.from({ length: 9 }, (_, i) => { const k = (i - 4) / 4; return `M${F(200 + k * (200 - xw) * .8)},${top + 4} q${F(k * 6)},30 ${F(k * (200 - xl(hemY)) * .9 - k * (200 - xw) * .8)},${hemY - top - 14}`; }).join('');
          out += `<path d="${sk.d}" fill="${fillMain}"/><g clip-path="${clip}">${inner}${skirt === 'full' || skirt === 'tiered' ? H.line(gath, main, 1.4, .3) : ''}</g>` +
            `<path d="${sk.d}" fill="url(#soft-h)" opacity=".3"/>` + outline(sk.d, line);
          if (it.rickrack) out += `<path d="${sk.hemD}" fill="none" stroke="${it.rickrack}" stroke-width="3" stroke-dasharray="4 3" stroke-linecap="round" transform="translate(0,-9)"/>`;
          if (skirt === 'tiered') {
            const t1 = tier(xl, top, top + (hemY - top) * .5, 'flat', 18, 0, 2);
            out += `<path d="${t1.d}" fill="${fillMain}"/>` + H.line(gath, main, 1.4, .3) + outline(t1.d, line) +
              `<path d="${t1.hemD}" fill="none" stroke="${accent}" stroke-width="3" stroke-dasharray="1 5" stroke-linecap="round" transform="translate(0,-5)"/>`;
          }
          if (it.pockets) out += pocket(162, Math.min(hemY - 70, 500), main, it.pockets, motif) + pocket(238, Math.min(hemY - 70, 500), main, it.pockets, motif);
        }
        // sleeves under the bodice, then the bodice
        if (sleeve > 0) {
          sleevesD = G.shirtPath({ sleeve, pad: 3, sleevePad: sp, sleeveFlare: sfl, bottom: Math.min(wy, 380), neck });
          const sfill = it.sleeveFill || H.grad(it.straps ? main : second === main ? main : second);
          let bands = '';
          if (it.cuff) for (const sd of ['L', 'R']) bands += sleeveBand(sd, sleeve - .05, sleeve, sleeve, sp, sfl, H.grad(it.cuff));
          out += `<path d="${sleevesD}" fill="${it.sleeveFill || (it.bodiceFill ? H.grad(second) : fillMain)}"/>` + bands +
            (sp >= 8 ? H.line(gathers(.04, sleeve - .06, 20, main), main, 1.3, .4) : '') + outline(sleevesD, line);
        }
        let bodice;
        if (it.straps) {
          // sundress: sleeveless bodice with a square neck; the shoulder straps get a frill and a contrast edge
          bodice = G.shirtPath({ sleeve: 0, pad: 3, bottom: wy + 8, neck: 'square', neckDepth: 30 });
          out += ['L', 'R'].map(sd => { const X = x => sd === 'L' ? x : 400 - x;
            let d = `M${X(160)},256`; for (let i = 0; i < 5; i++) d += `q${sd === 'L' ? -6 : 6},${2 + i} ${sd === 'L' ? -3 : 3},${9}`;
            return `<path d="M${X(160)},256 Q${X(140)},262 ${X(136)},300 L${X(150)},300 Q${X(150)},270 ${X(166)},262Z" fill="${H.grad(second)}" stroke="${ink(main)}" stroke-width="1.8" stroke-linejoin="round"/>`; }).join('');
        } else bodice = G.shirtPath({ sleeve: 0, pad: 2, bottom: wy + 8, neck, neckDepth: it.neckDepth });
        const bclip = H.clip('c-' + it.id + '-b', bodice);
        let binner = '';
        if (it.smock) binner += [300, 312, 324, 336].map((y, i) => `<path d="M140,${y}` + Array.from({ length: 30 }, (_, k) => `l4,${k % 2 ? -3 : 3}`).join('') + `" fill="none" stroke="${i % 2 ? accent : '#ffffff'}" stroke-width="1.6"/>`).join('');
        out += `<path d="${bodice}" fill="${it.bodiceFill ? H.grad(second) : fillMain}"/><g clip-path="${bclip}">${binner}</g>` + outline(bodice, line);
        if (it.straps) out += `<path d="M178,252 V${252 - .6 + 30} H222 V252" fill="none" stroke="${accent}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>` + bow(200, 284, 9, accent);
        // waist seam: sash with a bow, or a simple piped seam
        if (it.sash) out += belt(wy - 3, 10, H.grad(it.sash), it.sash, xw) + bow(it.bowX || 200, wy + 2, 11, it.sash);
        else out += `<path d="M${F(xw)},${wy + 6} Q200,${wy + 10} ${F(400 - xw)},${wy + 6}" fill="none" stroke="${accent}" stroke-width="3"/>`;
      }
      // finishing touches shared by every frock
      if (it.collar === 'peter') out += peterCollar(it.collarColor || '#ffffff', main);
      else if (!it.straps) {
        const np = neckPts(neck === 'v' || neck === 'square' ? 'round' : neck, it.neckDepth ?? { round: 10, high: 2, scoop: 30, boat: 4 }[neck] ?? 10, waist === 'none' ? 4 : 2, 2);
        if (neck !== 'v' && neck !== 'square') out += `<path d="M${P(np[0])}Q200,${F(np[0][1] + 2 * (it.neckDepth ?? { round: 10, high: 2, scoop: 30, boat: 4 }[neck] ?? 10))} ${P(np[1])}" fill="none" stroke="${it.knit ? second : accent}" stroke-width="${it.knit ? 8 : 4}" stroke-linecap="round"/>`;
      }
      if (it.buttons) out += Array.from({ length: it.buttons }, (_, i) => `<circle cx="200" cy="${300 + i * 22}" r="3.6" fill="${H.grad(accent, 'r')}" stroke="${ink(accent)}" stroke-width="1.3"/>`).join('');
      if (it.badge === 'heart') out += H.heart(200, 330, 13, motif) + `<path d="M193,324 q3,-4 7,-2" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".7"/>`;
      if (it.badge === 'rainbow') out += ['#ef6f6c', '#f6a65a', '#f7d660', '#7fcf8a', '#6fb3e6'].map((c, i) => `<path d="M${180 + i * 3},340 a${20 - i * 3},${20 - i * 3} 0 0 1 ${40 - i * 6},0" fill="none" stroke="${c}" stroke-width="3"/>`).join('') + cloud(182, 340, 7) + cloud(218, 340, 7);
      if (it.badge === 'puffin') out += puffin(200, 350, 1.1, 1);
      if (it.badge === 'star') out += H.star(200, 330, 13, motif).replace('/>', ` stroke="${ink(motif)}" stroke-width="1.4"/>`);
      return out;
    },
  });

  /* -------------------------------------------------------------
     Pinafore over a blouse: a blouse with puff sleeves and a round
     collar underneath, a pinafore (bib, straps with buttons, A-line
     skirt with a front pocket) on top.
     colors: [pinafore, blouse, buttons/trim, pocket motif]
     pattern applies to the blouse (e.g. stripes, dots)
     ------------------------------------------------------------- */
  DOLL.shape('frock-pinafore', {
    slot: 'dress', occupies: OCC,
    thumb: [56, 236, 288, 380],
    draw(it) {
      const [pin, blouse, trim, motif] = it.colors;
      const hemY = it.hem || 586;
      const blouseFill = it.pattern ? H.pat(it.pattern, blouse, it.patternColor || trim, it.patternSize || 14) : H.grad(blouse);
      const bl = G.shirtPath({ sleeve: it.sleeve ?? .3, pad: 3, sleevePad: 8, sleeveFlare: 3, bottom: 420, neck: 'round' });
      const cuff = sd => sleeveBand(sd, (it.sleeve ?? .3) - .04, it.sleeve ?? .3, it.sleeve ?? .3, 8, 3, H.grad(shade(blouse, -.05)));
      const xw = G.torsoX(404) - 2;
      const xl = edge([[398, xw], [450, 131], [486, 122], [hemY, 100]]);
      const sk = tier(xl, 398, hemY, 'flat', 20, 0, 0);
      const clip = H.clip('c-' + it.id, sk.d);
      // bib with rounded corners, straps from its corners up over the shoulders
      const bib = 'M164,404 L166,316 Q166,306 176,306 L224,306 Q234,306 234,316 L236,404 Z';
      const straps = ['L', 'R'].map(sd => { const X = x => sd === 'L' ? x : 400 - x; return `M${X(168)},${312} Q${X(160)},286 ${X(166)},257`; }).join('');
      const stitch = 'M170,404 L171,318 Q171,311 178,311 L222,311 Q229,311 229,318 L230,404';
      const fill = it.pinPattern ? H.pat(it.pinPattern, pin, shade(pin, -.12), 8) : H.grad(pin);
      return `<path d="${bl}" fill="${blouseFill}"/>` + cuff('L') + cuff('R') + H.line(gathers(.04, .24, 20, blouse), blouse, 1.3, .45) + outline(bl, shade(blouse, -.2)) +
        `<path d="${sk.d}" fill="${fill}"/><g clip-path="${clip}"><rect x="0" y="${hemY - 16}" width="400" height="3" fill="${trim}"/></g>` +
        H.line(`M172,430 q-6,60 -14,${hemY - 450} M228,430 q6,60 14,${hemY - 450}`, pin, 1.6, .35) + `<path d="${sk.d}" fill="url(#soft-h)" opacity=".35"/>` + outline(sk.d, pin) +
        `<path d="${straps}" fill="none" stroke="${ink(pin)}" stroke-width="13" stroke-linecap="round"/><path d="${straps}" fill="none" stroke="${shade(pin, .05)}" stroke-width="10" stroke-linecap="round"/>` +
        `<path d="${bib}" fill="${fill}"/>` + `<path d="${stitch}" fill="none" stroke="${trim}" stroke-width="1.4" stroke-dasharray="3 2.5"/>` + outline(bib, pin) +
        `<circle cx="172" cy="316" r="4.4" fill="${H.grad(trim, 'r')}" stroke="${ink(trim)}" stroke-width="1.4"/><circle cx="228" cy="316" r="4.4" fill="${H.grad(trim, 'r')}" stroke="${ink(trim)}" stroke-width="1.4"/>` +
        `<path d="M184,340 h32 v22 q0,10 -10,10 h-12 q-10,0 -10,-10Z" fill="${H.grad(shade(pin, .08))}" stroke="${ink(pin)}" stroke-width="1.8"/>` +
        (it.motif === 'flower' ? H.flower(200, 356, 7, motif) : it.motif === 'star' ? H.star(200, 356, 8, motif) : it.motif === 'puffin' ? puffin(198, 370, .72, 1) : H.heart(200, 356, 8, motif)) +
        (it.motif === 'puffin' ? puffin(150, 556, 1.05, 1) + puffin(250, 556, 1.05, -1) + `<path d="M120,560 Q200,552 280,560" stroke="#ffffff" stroke-width="3" fill="none" opacity=".7"/>` : '') +
        `<path d="M${F(xw)},404 Q200,408 ${F(400 - xw)},404" fill="none" stroke="${ink(pin)}" stroke-width="2"/>` +
        peterCollar(it.collarColor || '#ffffff', blouse);
    },
  });

  /* -------------------------------------------------------------
     Catalog: everyday dresses
     ------------------------------------------------------------- */
  DOLL.add([
    { id: 'frock-sundress', shape: 'frock', cat: 'frock', name: { is: 'Sumarkjóll', en: 'Sundress' }, colors: ['#ffe27a', '#f59a3c', '#fff3c2', '#ffffff'], pattern: 'flowers', patternSize: 26,
      sleeve: 0, straps: true, skirt: 'ruffle', hem: 576, sash: '#7fc8ef', bowX: 200 },
    { id: 'frock-pinafore', shape: 'frock-pinafore', cat: 'frock', name: { is: 'Smekkkjóll', en: 'Pinafore dress' }, colors: ['#5b7fc4', '#ffffff', '#f6c343', '#ef5b8d'], pattern: 'hstripes', patternColor: '#f7b6c8', patternSize: 10, motif: 'heart' },
    { id: 'frock-tee', shape: 'frock', cat: 'frock', name: { is: 'Bolakjóll', en: 'T-shirt dress' }, colors: ['#ffffff', '#ef5b6b', '#2f4a8a', '#ef5b6b'], pattern: 'hstripes', patternSize: 14,
      sleeve: .3, sleevePad: 5, waist: 'none', hem: 566, badge: 'heart' },
    { id: 'frock-party', shape: 'frock', cat: 'frock', name: { is: 'Veislukjóll', en: 'Party dress' }, colors: ['#f7a8c8', '#ffffff', '#fbd3e3', '#f2c34d'], pattern: 'sparkle', patternSize: 14,
      sleeve: .15, sleevePad: 8, skirt: 'tulle', hem: 572, neck: 'scoop', neckDepth: 12, sash: '#ef5b8d', bowX: 200, sleeveFill: H.pat('sparkle', '#fbd3e3', '#ffffff', 10) },
    { id: 'frock-smock', shape: 'frock', cat: 'frock', name: { is: 'Smokkkjóll', en: 'Smock dress' }, colors: ['#9ed3f2', '#ef7f9a', '#9ed3f2', '#ffffff'], pattern: 'dots', patternSize: 16,
      sleeve: 1, sleevePad: 6, sleeveFlare: 6, waist: 'high', skirt: 'full', hem: 580, collar: 'peter', smock: true, cuff: '#ef7f9a', flare: 1 },
    { id: 'frock-knit', shape: 'frock', cat: 'frock', name: { is: 'Prjónakjóll', en: 'Knit dress' }, colors: ['#ef8f6f', '#ffffff', '#d96a4c', '#ffffff'], pattern: 'knit', patternSize: 10,
      sleeve: 1, sleevePad: 4, waist: 'none', neck: 'high', hem: 572, knit: true, flare: .8, badge: 'star' },
    { id: 'frock-dots', shape: 'frock', cat: 'frock', name: { is: 'Doppóttur kjóll', en: 'Polka dot dress' }, colors: ['#e5404f', '#ffffff', '#e5404f', '#ffffff'], pattern: 'dots', patternSize: 18,
      sleeve: .3, sleevePad: 8, sleeveFlare: 3, skirt: 'full', hem: 582, collar: 'peter', sash: '#ffffff', bowX: 200, cuff: '#ffffff', buttons: 3 },
    { id: 'frock-floral', shape: 'frock', cat: 'frock', name: { is: 'Blómakjóll', en: 'Flower dress' }, colors: ['#c9b3ee', '#ffffff', '#f1e9ff', '#f7a6c2'], pattern: 'flowers', patternSize: 24,
      sleeve: .3, sleevePad: 6, sleeveFlare: 12, skirt: 'tiered', hem: 580, neck: 'round', sash: '#8e6fd1', bowX: 200 },
    { id: 'frock-gingham', shape: 'frock', cat: 'frock', name: { is: 'Köflóttur kjóll', en: 'Gingham dress' }, colors: ['#ffffff', '#5fb56b', '#ffffff', '#ef5b6b'], pattern: 'check', patternSize: 14,
      sleeve: .24, sleevePad: 9, sleeveFlare: 3, skirt: 'full', hem: 580, collar: 'peter', rickrack: '#ffffff', hemBand: '#5fb56b', pockets: 'flower', cuff: '#5fb56b', sash: '#5fb56b' },
    { id: 'frock-rainbow', shape: 'frock', cat: 'frock', name: { is: 'Regnbogabolakjóll', en: 'Rainbow tee dress' }, colors: ['#fff6e6', '#f6c343', '#7fc8ef', '#f6a65a'], hemRainbow: true,
      sleeve: .55, sleevePad: 4, waist: 'none', hem: 570, badge: 'rainbow', neck: 'round' },
    { id: 'frock-puffin', shape: 'frock-pinafore', cat: 'frock', name: { is: 'Lundasmekkkjóll', en: 'Puffin pinafore' }, colors: ['#f07c2a', '#ffffff', '#26386e', '#26386e'], pattern: 'dots', patternColor: '#26386e', patternSize: 12, pinPattern: 'stripes', sleeve: .55, motif: 'puffin' },
  ]);

  /* =============================================================
     CAPES (slot 'cape') AND WINGS (slot 'wings')
     ============================================================= */

  /** Mirror markup to the right side: wrap it in a group flipped around x = 200. */
  const mirror = m => `<g transform="translate(400,0) scale(-1,1)">${m}</g>`;
  /** Same markup on both sides: left as drawn, right mirrored. */
  const both = m => m + mirror(m);

  /* -------------------------------------------------------------
     Cape: hangs from the shoulders behind the body (back) and drapes
     over the shoulders in front (front = shoulder drape, collar, clasp).
     Params: hem 'flat'|'scallop'|'zig'|'cloud'|'round', collar 'none'|'stand'|'fur'|'ruff',
             hood true, motif 'stars'|'hearts'|'flowers'|'none', fur true (fur hem),
             rainbow true (rainbow bands), clasp 'round'|'star'|'heart'|'moon'|'bow'
     colors: [outer, lining/trim, clasp metal, motif]
     ------------------------------------------------------------- */
  DOLL.shape('cape', {
    slot: 'cape',
    draw(it) {
      const [outer, lining, metal, motifC] = it.colors;
      const hemT = it.hem || 'flat', hemY = it.hemY || 690;
      const xl = edge([[258, 172], [266, 142], [290, 112], [360, 92], [480, 76], [hemY, 58]]);
      const c = tier(xl, 258, hemY, hemT, it.step || 26, it.amp ?? 12);
      const clip = H.clip('c-' + it.id + '-cape', c.d);
      let fill = H.grad(outer, 'h');
      if (it.rainbow) {
        const RB = ['#ef6f6c', '#f6a65a', '#f7d660', '#7fcf8a', '#6fb3e6', '#a58be0'];
        fill = lg(`dr-${it.id}-rb`, RB.flatMap((col, i) => [[i / 6, col], [(i + 1) / 6 - .001, col]]));
      } else if (it.velvet) fill = lg(`dr-${it.id}-vel`, [[0, shade(outer, -.2)], [.25, shade(outer, .12)], [.5, outer], [.75, shade(outer, .12)], [1, shade(outer, -.2)]], 'h');
      // vertical folds fanning out from the shoulders
      const folds = [70, 96, 122, 278, 304, 330].map(x => `M${F(200 + (x - 200) * .45)},300 Q${F(x + (x < 200 ? 6 : -6))},480 ${x},${hemY - 8}`).join('');
      // motifs only where the cape shows (outside the arms, below the hands, between the legs)
      const spots = [[76, 380, 7], [70, 460, 8], [84, 540, 8], [118, 610, 9], [76, 630, 8], [100, 676, 7], [200, 640, 8], [200, 700, 6]];
      const mot = spots.map(([x, y, r], i) => {
        const pts = x === 200 ? [[x, y]] : [[x, y], [400 - x, y]];
        return pts.map(([px, py]) => it.motif === 'stars' ? (i % 2 ? H.star(px, py, r, motifC) : twinkle(px, py, r * .8, '#ffffff')) :
          it.motif === 'hearts' ? H.heart(px, py, r, motifC) : it.motif === 'flowers' ? H.flower(px, py, r, motifC) : '').join('');
      }).join('');
      let hemDeco = '';
      if (it.fur) hemDeco = fur(c.x0 - 2, 402 - c.x0, hemY + 2, 9);
      else if (hemT === 'scallop' || hemT === 'cloud') hemDeco = hemTrim(c.hemD, lining, metal, 4);
      else hemDeco = `<path d="${c.hemD}" fill="none" stroke="${lining}" stroke-width="5" stroke-linejoin="round" transform="translate(0,-5)"/>`;
      if (hemT === 'zig') hemDeco += tips(c).map(([x, y]) => H.star(x, y - 12, 5, metal)).join('');
      // hood lying down behind the neck
      const hood = it.hood ? `<path d="M134,276 C128,232 164,214 200,214 C236,214 272,232 266,276 Z" fill="${H.grad(lining)}" stroke="${ink(outer)}" stroke-width="${SW}"/>` +
        `<path d="M134,276 C130,244 160,226 200,226 C240,226 270,244 266,276" fill="none" stroke="${outer}" stroke-width="10"/>` : '';
      const back = hood + `<path d="${c.d}" fill="${fill}"/><g clip-path="${clip}">${H.line(folds, outer, 2, .35)}${mot}</g>` +
        `<path d="${c.d}" fill="url(#soft-h)" opacity=".35"/>` + outline(c.d, it.rainbow ? '#a58be0' : outer) + hemDeco;
      // front: drape over each shoulder (left drawn, right mirrored) + collar + clasp
      const drape = 'M190,256 Q160,252 138,262 Q116,274 108,304 L126,310 Q138,288 166,276 Q182,270 194,268 Z';
      const drapeFill = it.rainbow ? H.grad('#ef6f6c') : it.velvet ? H.grad(shade(outer, .05)) : H.grad(outer);
      let front = both(`<path d="${drape}" fill="${drapeFill}"/>` + outline(drape, it.rainbow ? '#ef6f6c' : outer) +
        `<path d="M110,302 Q118,280 140,268" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".45"/>`);
      if (it.collar === 'fur') front += fur(150, 250, 262, 7.5);
      else if (it.collar === 'stand') front += both(`<path d="M190,258 Q164,254 152,244 Q150,226 160,214 Q172,236 194,246 Z" fill="${H.grad(lining)}" stroke="${ink(outer)}" stroke-width="2" stroke-linejoin="round"/>`);
      else if (it.collar === 'ruff') front += both(`<path d="M196,262 Q186,252 176,264 Q166,252 156,266 Q146,258 140,272" fill="none" stroke="${lining}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`);
      // clasp: two discs with a chain, plus a centre piece
      const centre = it.clasp === 'star' ? H.star(200, 268, 10, metal).replace('/>', ` stroke="${ink(metal)}" stroke-width="1.4"/>`) :
        it.clasp === 'heart' ? H.heart(200, 268, 10, metal).replace('/>', ` stroke="${ink(metal)}" stroke-width="1.4"/>`) :
        it.clasp === 'moon' ? `<path d="M204,256 a12,12 0 1 0 0,24 a9,9 0 1 1 0,-24Z" fill="${H.grad(metal)}" stroke="${ink(metal)}" stroke-width="1.4"/>` :
        it.clasp === 'bow' ? bow(200, 266, 12, metal) :
        `<circle cx="200" cy="268" r="8" fill="${H.grad(metal, 'r')}" stroke="${ink(metal)}" stroke-width="1.5"/><circle cx="200" cy="268" r="3.5" fill="${H.grad(motifC, 'r')}"/>`;
      front += `<path d="M184,266 Q200,274 216,266" fill="none" stroke="${ink(metal)}" stroke-width="2" stroke-dasharray="2 2"/>` +
        `<circle cx="184" cy="265" r="4.4" fill="${H.grad(metal, 'r')}" stroke="${ink(metal)}" stroke-width="1.3"/><circle cx="216" cy="265" r="4.4" fill="${H.grad(metal, 'r')}" stroke="${ink(metal)}" stroke-width="1.3"/>` + centre;
      return { back, front };
    },
  });

  /* -------------------------------------------------------------
     Butterfly wings: big rounded upper lobes and smaller lower lobes,
     colour-fading fill, dark border with white dots, veins and spots.
     colors: [inner, outer, border, spots]
     ------------------------------------------------------------- */
  DOLL.shape('wings-butterfly', {
    slot: 'wings', thumb: [10, 150, 380, 340],
    draw(it) {
      const [inner, outerC, border, spot] = it.colors;
      const up = 'M196,300 C178,236 120,160 58,166 C18,170 14,226 38,268 C62,306 140,318 196,312 Z';
      const lo = 'M196,314 C150,316 70,330 50,380 C36,420 64,452 98,440 C140,424 182,370 196,322 Z';
      const g = H.def(`dr-${it.id}-bw`, `<radialGradient id="dr-${it.id}-bw" cx="1" cy=".9" r="1.1"><stop offset="0" stop-color="${inner}"/><stop offset=".55" stop-color="${mix(inner, outerC, .5)}"/><stop offset="1" stop-color="${outerC}"/></radialGradient>`);
      const veins = 'M196,304 Q120,240 64,190 M196,306 Q110,280 40,250 M196,308 Q140,300 100,312 M196,318 Q120,340 66,380 M196,320 Q150,370 100,430';
      const wing = `<path d="${up}" fill="${g}"/><path d="${lo}" fill="${g}"/>` +
        `<path d="${up}${lo}" fill="none" stroke="${border}" stroke-width="10" stroke-linejoin="round"/>` +
        [[52, 190], [36, 226], [44, 262], [80, 176], [112, 174], [60, 384], [62, 420], [94, 438]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6" fill="#fff"/>`).join('') +
        H.line(veins, border, 2, .45) +
        `<circle cx="100" cy="226" r="16" fill="${H.grad(spot, 'r')}" stroke="${border}" stroke-width="2"/><circle cx="100" cy="226" r="6" fill="#fff" opacity=".85"/>` +
        `<circle cx="96" cy="398" r="10" fill="${H.grad(spot, 'r')}" stroke="${border}" stroke-width="2"/>` +
        H.heart(140, 270, 7, '#ffffff') + `<path d="M70,206 Q86,186 110,184" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".5"/>` +
        `<path d="${up}${lo}" fill="url(#soft-r)" opacity=".6"/>` + `<path d="${up}${lo}" fill="none" stroke="${ink(border)}" stroke-width="${SW}" stroke-linejoin="round"/>`;
      return { back: both(wing) };
    },
  });

  /* -------------------------------------------------------------
     Fairy wings: long see-through pointed wings with a soft rainbow
     shimmer, white glitter edge, swirl veins and twinkles.
     colors: [tint 1, tint 2, edge sparkle]
     ------------------------------------------------------------- */
  DOLL.shape('wings-fairy', {
    slot: 'wings', thumb: [0, 120, 400, 360],
    draw(it) {
      const [t1, t2, edgeC = '#ffffff'] = it.colors;
      const up = 'M196,298 C170,236 100,150 40,140 C10,136 4,170 24,206 C56,258 140,290 196,308 Z';
      const lo = 'M196,314 C156,330 86,370 64,424 C56,448 78,462 100,446 C140,416 180,366 196,320 Z';
      const g = lg(`dr-${it.id}-fw`, [[0, t1, .85], [.5, mix(t1, t2, .5), .75], [1, t2, .85]]);
      const veins = 'M192,300 Q120,220 40,150 M192,302 Q110,250 24,200 M192,318 Q130,380 76,440 M140,250 q-20,-20 -12,-40 q6,-10 14,0';
      const wing = `<path d="${up}${lo}" fill="${g}"/>` + `<path d="${up}${lo}" fill="${tulle()}" opacity=".7"/>` +
        `<path d="${veins}" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" opacity=".7"/>` +
        `<path d="${up}${lo}" fill="none" stroke="${mix(t1, '#6a5a9a', .5)}" stroke-width="2.2" stroke-linejoin="round" opacity=".8"/>` +
        `<path d="${up}${lo}" fill="none" stroke="${edgeC}" stroke-width="2" stroke-dasharray="1 6" stroke-linecap="round"/>` +
        twinkles([[50, 160, 6], [40, 210, 4], [100, 200, 5], [90, 410, 5], [150, 260, 3.5], [126, 366, 3.5]]) +
        H.star(30, 156, 4, '#fff6b0') + `<path d="M40,160 Q80,170 110,200" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".55"/>`;
      return { back: both(wing) };
    },
  });

  /* -------------------------------------------------------------
     Feather wings (bird and puffin): rows of feathers – long primaries
     fanning down, then shorter coverts, then a rounded shoulder.
     params: size (1 = big bird wings), long (primary feather length)
     colors: [feather, tip, shoulder/shade]
     ------------------------------------------------------------- */
  DOLL.shape('wings-feather', {
    slot: 'wings', thumb: [-30, 110, 460, 440],
    draw(it) {
      const [fc, tip, sh] = it.colors;
      const k = it.size || 1, L = (it.long || 150) * k, fw = it.fw || 13;
      /** One feather: rounded blade from (x,y) pointing at angle a (degrees), length l, width w. */
      const feather = (x, y, a, l, w, col) => `<g transform="translate(${F(x)},${F(y)}) rotate(${F(a)})">` +
        `<path d="M0,0 C${F(w)},${F(l * .2)} ${F(w * 1.05)},${F(l * .8)} 0,${F(l)} C${F(-w * 1.05)},${F(l * .8)} ${F(-w)},${F(l * .2)} 0,0Z" fill="${H.grad(col)}" stroke="${ink(col)}" stroke-width="1.5"/>` +
        `<path d="M0,${F(l * .1)} L0,${F(l * .85)}" stroke="${ink(col)}" stroke-width="1" opacity=".4"/>` +
        `<path d="M${F(-w * .6)},${F(l * .82)} Q0,${F(l * 1.02)} ${F(w * .6)},${F(l * .82)}" fill="none" stroke="${tip}" stroke-width="${F(w * .5)}" stroke-linecap="round" opacity=".9"/></g>`;
      let wing = '';
      // primaries: base points along the top of the wing, angles fanning outward
      const n = 7;
      for (let i = n - 1; i >= 0; i--) {
        const t = i / (n - 1), x = 186 - 120 * k * t, y = 296 - 40 * k * t;
        wing += feather(x, y, 8 + 34 * t, L * (.55 + .45 * t), fw * k, i % 2 ? fc : shade(fc, -.04));
      }
      // coverts: a shorter row on top
      for (let i = 5; i >= 0; i--) {
        const t = i / 5, x = 188 - 104 * k * t, y = 292 - 36 * k * t;
        wing += feather(x, y, 10 + 30 * t, L * .42, fw * .92 * k, shade(fc, .06));
      }
      // shoulder: rounded top that covers the feather bases
      const shD = `M196,312 C${F(196 - 30 * k)},${F(300 - 10 * k)} ${F(196 - 80 * k)},${F(276 - 30 * k)} ${F(196 - 132 * k)},${F(258 - 34 * k)} C${F(196 - 150 * k)},${F(254 - 30 * k)} ${F(196 - 150 * k)},${F(272 - 26 * k)} ${F(196 - 130 * k)},${F(286 - 20 * k)} C${F(196 - 90 * k)},${F(310 - 10 * k)} ${F(196 - 40 * k)},${F(320)} 196,326Z`;
      wing += `<path d="${shD}" fill="${H.grad(sh)}"/>` + `<path d="M${F(196 - 120 * k)},${F(262 - 30 * k)} Q${F(196 - 70 * k)},${F(286 - 22 * k)} 190,306" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".55"/>` + outline(shD, sh, 'v', 2);
      return { back: both(wing) };
    },
  });

  /* -------------------------------------------------------------
     Dragonfly wings: four long narrow see-through wings with a fine
     vein net and an iridescent shimmer.
     colors: [tint 1, tint 2, vein]
     ------------------------------------------------------------- */
  DOLL.shape('wings-dragonfly', {
    slot: 'wings', thumb: [0, 150, 400, 330],
    draw(it) {
      const [t1, t2, vein] = it.colors;
      const g = lg(`dr-${it.id}-dw`, [[0, t1, .85], [.5, t2, .75], [1, t1, .85]], 'h');
      const net = H.def(`dr-${it.id}-net`, `<pattern id="dr-${it.id}-net" width="12" height="10" patternUnits="userSpaceOnUse"><path d="M0,5 L4,0 H8 L12,5 L8,10 H4Z" fill="none" stroke="${vein}" stroke-width=".8" opacity=".55"/></pattern>`);
      /** One long wing from the back (196,y0) out to the tip at angle a (degrees), length l. */
      const one = (y0, a, l, w) => {
        const d = `M0,-4 C${F(l * .3)},${F(-w)} ${F(l * .85)},${F(-w * 1.1)} ${F(l)},${F(-w * .2)} C${F(l * 1.02)},${F(w * .5)} ${F(l * .6)},${F(w * .9)} 0,4Z`;
        return `<g transform="translate(196,${y0}) rotate(${a}) scale(-1,1)"><path d="${d}" fill="${g}"/><path d="${d}" fill="${net}"/>` +
          `<path d="M4,0 C${F(l * .4)},${F(-w * .4)} ${F(l * .8)},${F(-w * .5)} ${F(l * .96)},${F(-w * .2)}" fill="none" stroke="${vein}" stroke-width="1.6" opacity=".7"/>` +
          `<path d="${d}" fill="none" stroke="${ink(vein)}" stroke-width="2" stroke-linejoin="round" opacity=".8"/>` +
          `<ellipse cx="${F(l * .86)}" cy="${F(-w * .45)}" rx="7" ry="3" fill="${vein}" opacity=".7"/>` +
          `<path d="M${F(l * .2)},${F(-w * .55)} Q${F(l * .5)},${F(-w * .85)} ${F(l * .72)},${F(-w * .7)}" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
      };
      const wing = one(312, 6, 196, 34) + one(298, -16, 186, 34) + twinkles([[60, 240, 5], [44, 330, 4], [110, 262, 3.5]]);
      return { back: both(wing) };
    },
  });

  /* -------------------------------------------------------------
     Friendly bat wings: purple with scalloped lower edge, finger ribs,
     a pink inner glow and little hearts.
     colors: [wing, rib, inner glow]
     ------------------------------------------------------------- */
  DOLL.shape('wings-bat', {
    slot: 'wings', thumb: [10, 170, 380, 300],
    draw(it) {
      const [wc, rib, glow] = it.colors;
      const d = 'M196,300 C160,262 100,226 34,214 C28,240 30,270 40,300 Q60,296 72,318 Q92,306 110,332 Q130,322 148,350 Q170,340 196,362 Z';
      const g = H.def(`dr-${it.id}-bat`, `<radialGradient id="dr-${it.id}-bat" cx="1" cy=".7" r=".9"><stop offset="0" stop-color="${glow}"/><stop offset="1" stop-color="${wc}"/></radialGradient>`);
      const ribs = 'M196,300 L36,216 M196,306 L72,318 M196,316 L110,332 M196,330 L148,350';
      const wing = `<path d="${d}" fill="${g}"/>` + `<path d="${ribs}" fill="none" stroke="${rib}" stroke-width="3" stroke-linecap="round" opacity=".85"/>` +
        H.heart(100, 286, 8, '#ff9cc4') + H.heart(140, 310, 5, '#ff9cc4') + twinkles([[70, 262, 4], [150, 284, 3]]) +
        `<circle cx="36" cy="216" r="4" fill="${rib}"/>` + `<path d="M60,236 Q110,246 160,280" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".4"/>` +
        outline(d, wc, 'r');
      return { back: both(wing) };
    },
  });

  /* -------------------------------------------------------------
     Catalog: capes and wings
     ------------------------------------------------------------- */
  DOLL.add([
    { id: 'cape-red-hood', shape: 'cape', cat: 'cape', name: { is: 'Rauð hettuskikkja', en: 'Red hooded cape' }, colors: ['#d8364a', '#f6e3cf', '#e8b84a', '#ffffff'], hood: true, hem: 'flat', motif: 'none', clasp: 'bow' },
    { id: 'cape-stars', shape: 'cape', cat: 'cape', name: { is: 'Stjörnuskikkja', en: 'Star cape' }, colors: ['#2b3a86', '#fbe38a', '#f2c34d', '#fbe38a'], hem: 'scallop', step: 30, amp: 14, motif: 'stars', collar: 'stand', clasp: 'moon' },
    { id: 'cape-hero', shape: 'cape', cat: 'cape', name: { is: 'Ofurhetjuskikkja', en: 'Hero cape' }, colors: ['#1fa6a0', '#f6c343', '#f6c343', '#ffffff'], hem: 'zig', step: 46, amp: 26, hemY: 650, motif: 'none', collar: 'stand', clasp: 'star' },
    { id: 'cape-velvet', shape: 'cape', cat: 'cape', name: { is: 'Prinsessuskikkja', en: 'Velvet princess cape' }, colors: ['#7b3fa8', '#ffffff', '#e8b84a', '#f27aa0'], velvet: true, fur: true, collar: 'fur', hemY: 696, motif: 'none', clasp: 'round' },
    { id: 'cape-rainbow', shape: 'cape', cat: 'cape', name: { is: 'Regnbogaskikkja', en: 'Rainbow cape' }, colors: ['#ffffff', '#ffffff', '#f2c34d', '#ffffff'], rainbow: true, hem: 'cloud', step: 34, amp: 12, motif: 'none', collar: 'ruff', clasp: 'heart' },
    { id: 'cape-hearts', shape: 'cape', cat: 'cape', name: { is: 'Hjartaskikkja', en: 'Heart cape' }, colors: ['#f48cb6', '#ffffff', '#ef5b8d', '#ffffff'], hem: 'scallop', step: 24, amp: 12, motif: 'hearts', collar: 'ruff', clasp: 'heart', hemY: 660 },
    { id: 'wings-butterfly', shape: 'wings-butterfly', cat: 'cape', name: { is: 'Fiðrildavængir', en: 'Butterfly wings' }, colors: ['#ffd84d', '#f48c4a', '#4a3a5c', '#7fc8ef'] },
    { id: 'wings-butterfly-blue', shape: 'wings-butterfly', cat: 'cape', name: { is: 'Bláir fiðrildavængir', en: 'Blue butterfly wings' }, colors: ['#bfe8ff', '#5b8fe0', '#2e3a78', '#f7a6c2'] },
    { id: 'wings-fairy', shape: 'wings-fairy', cat: 'cape', name: { is: 'Álfavængir', en: 'Fairy wings' }, colors: ['#bfeaff', '#f5c2ec', '#ffffff'] },
    { id: 'wings-bird', shape: 'wings-feather', cat: 'cape', name: { is: 'Fuglavængir', en: 'Bird wings' }, colors: ['#ffffff', '#dfe9f5', '#f7f9fc'], size: 1, long: 160 },
    { id: 'wings-dragonfly', shape: 'wings-dragonfly', cat: 'cape', name: { is: 'Drekaflugnavængir', en: 'Dragonfly wings' }, colors: ['#b8f0e4', '#d8c4ff', '#4f8fa8'] },
    { id: 'wings-puffin', shape: 'wings-feather', cat: 'cape', name: { is: 'Lundavængir', en: 'Puffin wings' }, colors: ['#3a3950', '#6a6888', '#2c2b3c'], size: .8, long: 110, fw: 21 },
    { id: 'wings-bat', shape: 'wings-bat', cat: 'cape', name: { is: 'Leðurblökuvængir', en: 'Friendly bat wings' }, colors: ['#7a5bb8', '#4d3480', '#f3a6d8'] },
  ]);

  /* =============================================================
     SWIMWEAR (cat 'swim') AND PYJAMAS (cat 'pyjamas'), slot 'suit'
     ============================================================= */

  /**
   * One-piece swimsuit body: a sleeveless G.shirtPath whose hem is replaced by
   * rounded leg openings meeting at the crotch. neck as in shirtPath.
   */
  function leotardPath(neck = 'scoop', neckDepth, pad = 2) {
    // short "boy-leg" cut so the doll's underwear never peeks out: legs end at y 508
    const bottom = 452, y = 508;
    const d = G.shirtPath({ sleeve: 0, pad, bottom, neck, neckDepth });
    const xo = G.legOutX(y) - pad - 1, xi = G.legInX(y) + 1;
    const legs = `L${F(G.torsoX(476) - pad)},476L${F(xo)},${y}Q${F((xo + xi) / 2)},${y + 4} ${F(xi)},${y}L200,${G.crotchY + 6}L${F(400 - xi)},${y}Q${F(200 + (200 - (xo + xi) / 2))},${y + 4} ${F(400 - xo)},${y}L${F(400 - G.torsoX(476) + pad)},476L`;
    return d.replace(`Q200,${bottom + 6} `, legs);
  }
  /** Leg-opening piping for leotardPath (both legs). */
  const leotardPiping = (pad = 2) => { const y = 508, xo = G.legOutX(y) - pad - 1, xi = G.legInX(y) + 1;
    return `M${F(xo)},${y}Q${F((xo + xi) / 2)},${y + 4} ${F(xi)},${y}M${F(400 - xo)},${y}Q${F(400 - (xo + xi) / 2)},${y + 4} ${F(400 - xi)},${y}`; };
  /** Swim / sleep shorts as one path (wide legs, short). */
  const shortsPath = (bottom, pad = 5, flare = 6) => G.pantsPath({ top: 428, bottom, pad, flare });

  /* -------------------------------------------------------------
     Swimsuit: one-piece (or tankini) with options.
     Params: neck, ruffle 'shoulder'|'chest'|'none', skirt true (little skirt
             around the hips), twoPiece true (tankini top + frilled bottoms),
             band (contrast side stripe colour), motif 'star'|'heart'|'flower'|'none'
     colors: [main, trim, second, motif]   pattern on main
     ------------------------------------------------------------- */
  DOLL.shape('swimsuit', {
    slot: 'suit', occupies: SUIT,
    thumb: [96, 236, 208, 290],
    draw(it) {
      const [main, trim, second = trim, motifC = trim] = it.colors;
      const fillMain = H.fill(it), line = shade(main, -.12);
      let out = '';
      if (it.twoPiece) {
        // frilled bottoms, then a tankini top that stops above the waist with a frill hem
        const bot = G.pantsPath({ top: 396, bottom: 510, pad: 3, flare: 4 });
        const bClip = H.clip('c-' + it.id + '-bot', bot);
        out += `<path d="${bot}" fill="${fillMain}"/>` + outline(bot, line);
        // frilled leg hems (left leg drawn, right mirrored)
        const lxo = G.legOutX(510) - 7, lxi = G.legInX(510) + 2, lw = (lxi - lxo) / 4;
        let fr = `M${F(lxo)},507`; for (let i = 0; i < 4; i++) fr += `q${F(lw / 2)},10 ${F(lw)},0`;
        out += both(`<path d="${fr}" fill="none" stroke="${ink(second)}" stroke-width="8" stroke-linecap="round"/><path d="${fr}" fill="none" stroke="${second}" stroke-width="5.5" stroke-linecap="round"/>`);
        const top = G.shirtPath({ sleeve: 0, pad: 2, bottom: 404, neck: it.neck || 'scoop', neckDepth: it.neckDepth ?? 14 });
        out += `<path d="${top}" fill="${fillMain}"/>` + outline(top, line);
        const x0 = G.torsoX(406) - 3, n = 9, w = (400 - 2 * x0) / n;
        let pep = `M${F(x0)},402`; for (let i = 0; i < n; i++) pep += `q${F(w / 2)},16 ${F(w)},0`;
        pep += `L${F(400 - x0)},398Q200,402 ${F(x0)},398Z`;
        out += `<path d="${pep}" fill="${H.grad(second)}"/>` + outline(pep, second, 'v', 2) + bow(200, 300, 9, trim);
      } else {
        const d = leotardPath(it.neck || 'scoop', it.neckDepth, 2);
        const clip = H.clip('c-' + it.id, d);
        let inner = '';
        if (it.band) inner += `<path d="M118,300 Q160,380 150,500 L134,500 Q144,380 104,300Z M282,300 Q240,380 250,500 L266,500 Q256,380 296,300Z" fill="${it.band}"/>`;
        if (it.waveBand) inner += `<path d="M0,410 Q25,398 50,410 T100,410 T150,410 T200,410 T250,410 T300,410 T350,410 T400,410 V500 H0Z" fill="${H.grad(second)}"/>` +
          `<path d="M0,424 Q25,412 50,424 T100,424 T150,424 T200,424 T250,424 T300,424 T350,424 T400,424" fill="none" stroke="#fff" stroke-width="3" opacity=".8"/>`;
        out += `<path d="${d}" fill="${fillMain}"/><g clip-path="${clip}">${inner}</g>` + outline(d, line);
        // leg opening piping
        out += `<path d="${leotardPiping()}" fill="none" stroke="${trim}" stroke-width="5" stroke-linecap="round" transform="translate(0,-3)"/>`;
      }
      if (it.skirt) {
        // little swim skirt: gathered with a scalloped hem
        const xl = edge([[412, G.torsoX(412) - 3], [440, 133], [470, 124], [500, 118]]);
        const sk = tier(xl, 412, 500, 'scallop', 16, 7, 0);
        out += `<path d="${sk.d}" fill="${H.grad(second)}"/><path d="${sk.d}" fill="${tulle()}" opacity=".6"/>` + outline(sk.d, second) + hemTrim(sk.hemD, '#ffffff', trim, 3.5) +
          belt(406, 8, H.grad(trim), trim);
      }
      if (it.ruffle === 'shoulder') {
        // frilly shoulder ruffles following the armhole (left drawn, right mirrored)
        const r = 'M168,256 Q150,250 140,264 Q128,268 128,284 Q118,292 124,306 Q118,316 128,324';
        out += both(`<path d="${r}" fill="none" stroke="${ink(second)}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/><path d="${r}" fill="none" stroke="${second}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>` +
          `<path d="M150,254 q-6,10 -12,12 M132,272 q-2,8 -8,12 M124,298 q2,8 -2,14" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".7"/>`);
      }
      if (it.ruffle === 'chest') {
        const np = neckPts(it.neck || 'scoop', it.neckDepth ?? 30, 2, 9);
        out += `<path d="M${np.map(P).join('L')}" fill="none" stroke="${ink(second)}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" transform="translate(0,6)"/>` +
          `<path d="M${np.map(P).join('L')}" fill="none" stroke="${second}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" transform="translate(0,6)"/>` +
          `<path d="M${np.map(P).join('L')}" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="2 5" stroke-linecap="round" transform="translate(0,6)"/>`;
      }
      if (!it.twoPiece) {
        const np = neckPts(it.neck === 'round' ? 'round' : 'scoop', it.neckDepth ?? (it.neck === 'round' ? 10 : 30), 2, 2);
        if (it.ruffle !== 'chest') out += `<path d="M${P(np[0])}Q200,${F(np[0][1] + 2 * (it.neckDepth ?? (it.neck === 'round' ? 10 : 30)))} ${P(np[1])}" fill="none" stroke="${trim}" stroke-width="3.4" stroke-linecap="round"/>`;
      }
      if (it.motif === 'star') out += H.star(200, 352, 14, motifC).replace('/>', ` stroke="${ink(motifC)}" stroke-width="1.4"/>`) + twinkle(222, 334, 4);
      if (it.motif === 'heart') out += H.heart(200, 352, 14, motifC);
      if (it.motif === 'flower') out += H.flower(172, 330, 10, motifC) + H.flower(226, 360, 7, '#ffffff');
      if (it.motif === 'shell') out += shell(200, 362, 14, motifC) + pearl(200, 344, 3);
      if (it.motif === 'puffin') out += puffin(200, 378, 1.5, 1);
      return out;
    },
  });

  /* -------------------------------------------------------------
     Rash-guard set: long-sleeve swim top with a high zip collar,
     contrast side panels and cuffs, plus swim shorts with a drawstring.
     colors: [top, contrast, shorts, motif]
     ------------------------------------------------------------- */
  DOLL.shape('swim-rashguard', {
    slot: 'suit', occupies: SUIT,
    thumb: [60, 236, 280, 330],
    draw(it) {
      const [topC, con, shortsC, motifC] = it.colors;
      const sh = shortsPath(530, 5, 6);
      const shClip = H.clip('c-' + it.id + '-sh', sh);
      const top = G.shirtPath({ sleeve: it.sleeve ?? 1, pad: 3, sleevePad: 2, bottom: 444, neck: 'high' });
      const clip = H.clip('c-' + it.id, top);
      const sl = it.sleeve ?? 1;
      const panel = `<path d="M108,290 Q150,360 146,450 L130,450 Q130,360 96,290Z M292,290 Q250,360 254,450 L270,450 Q270,360 304,290Z" fill="${con}"/>` +
        sleeveBand('L', sl - .08, sl, sl, 2, 0, con) + sleeveBand('R', sl - .08, sl, sl, 2, 0, con) +
        `<rect x="0" y="430" width="400" height="16" fill="${con}"/>`;
      const fillTop = it.pattern ? H.fill(it) : H.grad(topC);
      return `<path d="${sh}" fill="${H.grad(shortsC)}"/><g clip-path="${shClip}"><rect x="0" y="512" width="400" height="20" fill="${con}" opacity=".9"/>` +
        `<path d="M150,440 V530 M250,440 V530" stroke="#fff" stroke-width="5" opacity=".8"/></g>` + outline(sh, shortsC, 'h') +
        `<path d="${top}" fill="${fillTop}"/><g clip-path="${clip}">${panel}</g>` + outline(top, shade(topC, -.15)) +
        // zip collar
        `<path d="M184,242 Q200,256 216,242 L216,232 Q200,240 184,232Z" fill="${H.grad(con)}" stroke="${ink(con)}" stroke-width="2" stroke-linejoin="round"/>` +
        `<path d="M200,246 V300" stroke="${ink(topC)}" stroke-width="3" stroke-dasharray="2 2"/><rect x="196" y="296" width="8" height="12" rx="3" fill="#f2f4f8" stroke="${ink(topC)}" stroke-width="1.4"/>` +
        (it.motif === 'sun' ? sun(160, 340, 11, '#fff6d6', motifC) : it.motif === 'wave' ? `<path d="M150,360 q12,-14 24,0 t24,0 t24,0 t24,0" fill="none" stroke="${motifC}" stroke-width="5" stroke-linecap="round"/>` : H.star(160, 340, 12, motifC));
    },
  });

  /* -------------------------------------------------------------
     Pyjamas: long-sleeved button top with piping and a collar,
     long trousers with cuffs. Pattern on the main colour.
     Params: top 'shirt' (buttons + collar) | 'tee' (crew neck, motif),
             legs 'long' | 'shorts', motif 'moon'|'puffin'|'heart'|'cloud'|'none'
     colors: [main, pattern colour, piping, trousers (optional, else main)]
     ------------------------------------------------------------- */
  DOLL.shape('pyjamas', {
    slot: 'suit', occupies: SUIT,
    thumb: [60, 236, 280, 480],
    draw(it) {
      const [main, pc, pipe, trous] = it.colors;
      const fillTop = H.fill(it);
      const fillLegs = trous ? (it.legPattern ? H.pat(it.legPattern, trous, it.legPatternColor || pc, it.patternSize || 22) : H.grad(trous)) : fillTop;
      const legC = trous || main;
      const pantsBottom = it.legs === 'shorts' ? 540 : 700;
      const pants = G.pantsPath({ top: 400, bottom: pantsBottom, pad: 5, flare: it.legs === 'shorts' ? 6 : 4 });
      const pClip = H.clip('c-' + it.id + '-p', pants);
      const cuffH = 14;
      const top = G.shirtPath({ sleeve: it.sleeve ?? 1, pad: 6, sleevePad: 4, sleeveFlare: 2, bottom: 460, flare: 6, neck: it.top === 'tee' ? 'round' : 'v', neckDepth: it.top === 'tee' ? undefined : 34 });
      const tClip = H.clip('c-' + it.id + '-t', top);
      const sl = it.sleeve ?? 1;
      let out = `<path d="${pants}" fill="${fillLegs}"/><g clip-path="${pClip}"><rect x="0" y="${pantsBottom - cuffH}" width="400" height="${cuffH + 4}" fill="${H.grad(pipe)}"/>` +
        `</g>` +
        H.line(`M190,476 l-8,10 M210,476 l8,10 M160,${pantsBottom - 40} q10,6 22,0 M218,${pantsBottom - 40} q10,6 22,0`, legC, 1.6, .4) + outline(pants, legC, 'h');
      // top
      out += `<path d="${top}" fill="${fillTop}"/><g clip-path="${tClip}">` +
        `<rect x="0" y="448" width="400" height="16" fill="${H.grad(pipe)}"/>` + sleeveBand('L', sl - .07, sl, sl, 4, 2, H.grad(pipe)) + sleeveBand('R', sl - .07, sl, sl, 4, 2, H.grad(pipe)) + `</g>` +
        H.line('M152,322 q8,14 4,30 M248,322 q-8,14 -4,30', main, 1.6, .4) + outline(top, shade(main, -.12));
      if (it.top === 'tee') {
        out += `<path d="M183,250.5 Q200,270.5 217,250.5" fill="none" stroke="${pipe}" stroke-width="7" stroke-linecap="round"/>`;
      } else {
        // shirt collar with piping, button placket
        out += both(`<path d="M183,250 L200,288 L176,292 Q160,282 158,262 Q170,256 183,250Z" fill="${H.grad(main)}" stroke="${ink(main)}" stroke-width="2" stroke-linejoin="round"/>` +
          `<path d="M178,286 Q164,280 162,264" fill="none" stroke="${pipe}" stroke-width="3" stroke-linecap="round"/>`) +
          `<path d="M200,288 V456" stroke="${pipe}" stroke-width="3"/>` +
          [310, 344, 378, 412].map(y => `<circle cx="206" cy="${y}" r="4" fill="${H.grad('#ffffff', 'r')}" stroke="${ink(pipe)}" stroke-width="1.4"/>`).join('') +
          `<path d="M148,330 h28 v24 q0,6 -6,6 h-16 q-6,0 -6,-6Z" fill="${fillTop}" stroke="${ink(main)}" stroke-width="1.8"/><path d="M148,330 h28 v6 h-28Z" fill="${pipe}"/>`;
      }
      const m = it.motif;
      if (m === 'moon') out += `<path d="M196,326 a22,22 0 1 0 0,42 a16,16 0 1 1 0,-42Z" fill="${H.grad('#fbe38a')}" stroke="${ink('#fbe38a')}" stroke-width="1.6"/>` + H.star(210, 340, 6, '#fff6c8') + `<circle cx="186" cy="352" r="2" fill="#f2a0a0"/>`;
      if (m === 'puffin') out += puffin(200, 384, 1.7, 1);
      if (m === 'heart') out += H.heart(200, 350, 16, pc) + `<path d="M190,342 q4,-5 9,-3" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".7"/>`;
      if (m === 'cloud') out += cloud(200, 354, 16) + `<path d="M186,368 l-3,8 M200,368 l-3,8 M214,368 l-3,8" stroke="#7fb6e8" stroke-width="2.6" stroke-linecap="round"/>`;
      if (m === 'star') out += H.star(200, 352, 16, pc).replace('/>', ` stroke="${ink(pc)}" stroke-width="1.4"/>`);
      return out;
    },
  });

  /* -------------------------------------------------------------
     Nightgown: long A-line gown from the shoulders, smocked yoke with
     lace edge, puff or long sleeves with lace cuffs, lace hem and
     tiny embroidered flowers.
     colors: [main, lace/trim, yoke, flowers]   pattern on main
     ------------------------------------------------------------- */
  DOLL.shape('nightgown', {
    slot: 'suit', occupies: SUIT,
    thumb: [50, 236, 300, 480],
    draw(it) {
      const [main, lace, yoke, fl] = it.colors;
      const sl = it.sleeve ?? .55, sp = 7, sfl = 6, hemY = it.hem || 664;
      const d = G.shirtPath({ sleeve: sl, pad: 5, sleevePad: sp, sleeveFlare: sfl, bottom: hemY, flare: 60, neck: 'round' });
      const clip = H.clip('c-' + it.id, d);
      const yokeD = 'M0,240 H400 V318 Q200,330 0,318Z';
      const smock = [276, 288, 300].map((y, i) => `<path d="M140,${y}` + Array.from({ length: 30 }, (_, k) => `l4,${k % 2 ? -3 : 3}`).join('') + `" fill="none" stroke="${i % 2 ? fl : lace}" stroke-width="1.6"/>`).join('');
      let inner = `<path d="${yokeD}" fill="${H.grad(yoke)}"/>` + smock +
        `<path d="M0,318 Q200,330 400,318" fill="none" stroke="${lace}" stroke-width="5"/>` +
        `<rect x="0" y="${hemY - 22}" width="400" height="5" fill="${lace}"/>` +
        sleeveBand('L', sl - .05, sl, sl, sp, sfl, lace) + sleeveBand('R', sl - .05, sl, sl, sp, sfl, lace);
      const folds = 'M170,340 Q160,480 140,640 M230,340 Q240,480 260,640 M200,340 V640';
      // lace scallop hem below the gown edge
      const x0 = G.torsoX(hemY) - 5 - 60;
      let laceHem = `M${F(x0)},${hemY}`; const n = 15, w = (400 - 2 * x0) / n;
      for (let i = 0; i < n; i++) laceHem += `q${F(w / 2)},10 ${F(w)},0`;
      const flowers = [[150, 600], [250, 600], [200, 620], [120, 640], [280, 640], [176, 560], [226, 560]].map(([x, y], i) => H.flower(x, y, 6, i % 2 ? fl : lace)).join('');
      return `<path d="${laceHem}" fill="none" stroke="${lace}" stroke-width="8" stroke-linecap="round"/><path d="${laceHem}" fill="none" stroke="${ink(lace)}" stroke-width="1.2" stroke-dasharray="2 4"/>` +
        `<path d="${d}" fill="${it.pattern ? H.pat(it.pattern, main, fl, it.patternSize || 20) : H.grad(main)}"/><g clip-path="${clip}">${inner}${flowers}</g>` + H.line(folds, main, 1.8, .3) + outline(d, shade(main, -.1)) +
        bow(200, 268, 9, fl) + `<path d="M183,252 Q200,270 217,252" fill="none" stroke="${lace}" stroke-width="5" stroke-linecap="round"/>`;
    },
  });

  /* -------------------------------------------------------------
     Footed onesie: one-piece sleepsuit with a zip, rib cuffs, a tummy
     motif, feet with grippy dots and a hood (with ears) lying down behind
     the neck. ears: 'bear' | 'bunny' | 'none'
     colors: [main, cuffs/inner ears, motif, sole dots]
     ------------------------------------------------------------- */
  DOLL.shape('onesie', {
    slot: 'suit', occupies: SUIT,
    thumb: [40, 130, 320, 620],
    draw(it) {
      const [main, inner, motifC, dots] = it.colors;
      const fillM = H.fill(it);
      const legs = G.pantsPath({ top: 400, bottom: 712, pad: 5, flare: 4 });
      const body = G.shirtPath({ sleeve: 1, pad: 6, sleevePad: 4, bottom: 470, neck: 'round' });
      const bClip = H.clip('c-' + it.id + '-b', body), lClip = H.clip('c-' + it.id + '-l', legs);
      const feet = ['L', 'R'].map(sd => {
        const fp = G.footPath(sd, 5, 2), [fx, fy] = G.feet[sd === 'L' ? 0 : 1];
        const fc = H.clip(`c-${it.id}-f${sd}`, fp);
        return `<path d="${fp}" fill="${fillM}"/><g clip-path="${fc}"><rect x="${fx - 40}" y="${fy + 6}" width="80" height="30" fill="${H.grad(inner)}"/>` +
          [-10, 0, 10].map(k => `<circle cx="${fx + k}" cy="${fy + 12}" r="2.2" fill="${dots}"/>`).join('') + `</g>` + outline(fp, main, 'r');
      }).join('');
      // ears: a lop-eared bunny's floppy ears lie over the shoulders (front); the bear gets a bear face on the tummy patch
      const floppy = it.ears === 'bunny' ? both(`<path d="M168,252 C150,252 132,266 130,292 C128,316 140,330 152,322 C162,314 160,290 176,262Z" fill="${H.grad(main)}" stroke="${ink(main)}" stroke-width="${SW}" stroke-linejoin="round"/>` +
        `<path d="M164,262 C150,266 140,280 140,298 C140,312 148,318 152,312 C158,302 158,284 168,268Z" fill="${H.grad(inner)}"/>`) : '';
      const hood = `<path d="M140,276 C134,236 166,220 200,220 C234,220 266,236 260,276 Z" fill="${H.grad(shade(main, -.12))}" stroke="${ink(main)}" stroke-width="${SW}"/>`;
      const front = feet +
        `<path d="${legs}" fill="${fillM}"/><g clip-path="${lClip}"><rect x="0" y="690" width="400" height="30" fill="${H.pat('stripes', inner, shade(inner, -.12), 5)}"/></g>` + outline(legs, main, 'h') +
        `<path d="${body}" fill="${fillM}"/><g clip-path="${bClip}">${sleeveBand('L', .9, 1, 1, 4, 0, H.pat('stripes', inner, shade(inner, -.12), 5))}${sleeveBand('R', .9, 1, 1, 4, 0, H.pat('stripes', inner, shade(inner, -.12), 5))}</g>` +
        H.line('M152,322 q8,14 4,30 M248,322 q-8,14 -4,30', main, 1.6, .4) + outline(body, main) +
        `<path d="M183,250.5 Q200,270.5 217,250.5" fill="none" stroke="${inner}" stroke-width="7" stroke-linecap="round"/>` +
        // tummy patch with motif, then zip down to the crotch
        `<ellipse cx="200" cy="390" rx="34" ry="40" fill="${H.grad(inner)}" stroke="${ink(main)}" stroke-width="1.8" stroke-dasharray="4 3"/>` +
        (it.ears === 'bear' ? ['L', 'R'].map(sd => { const x = sd === 'L' ? 178 : 222; return `<circle cx="${x}" cy="368" r="9" fill="${H.grad(main)}" stroke="${ink(main)}" stroke-width="1.6"/><circle cx="${x}" cy="368" r="4.5" fill="${motifC}" opacity=".7"/>`; }).join('') +
          `<circle cx="200" cy="392" r="22" fill="${H.grad(main)}" stroke="${ink(main)}" stroke-width="1.6"/><ellipse cx="200" cy="400" rx="10" ry="7" fill="${H.grad(inner)}"/><ellipse cx="200" cy="396" rx="3.5" ry="2.6" fill="#4a3030"/>` +
          `<circle cx="192" cy="386" r="2.4" fill="#4a3030"/><circle cx="208" cy="386" r="2.4" fill="#4a3030"/><circle cx="186" cy="396" r="3" fill="${motifC}" opacity=".45"/><circle cx="214" cy="396" r="3" fill="${motifC}" opacity=".45"/>` :
          it.motif === 'heart' ? H.heart(200, 392, 16, motifC) : it.motif === 'star' ? H.star(200, 392, 18, motifC) : it.motif === 'moon' ? `<path d="M198,368 a24,24 0 1 0 0,48 a18,18 0 1 1 0,-48Z" fill="${H.grad(motifC)}" stroke="${ink(motifC)}" stroke-width="1.6"/>` : '') +
        `<path d="M200,266 V350 M200,432 V476" stroke="${ink(main)}" stroke-width="2.4" stroke-dasharray="2 2" opacity=".7"/><rect x="196" y="266" width="8" height="13" rx="3" fill="#f2f4f8" stroke="${ink(main)}" stroke-width="1.4"/>` + floppy;
      return { back: hood, front };
    },
  });

  /* -------------------------------------------------------------
     Catalog: swimwear and pyjamas
     ------------------------------------------------------------- */
  DOLL.add([
    { id: 'swim-ruffle', shape: 'swimsuit', cat: 'swim', name: { is: 'Sundbolur með blúndum', en: 'Ruffle swimsuit' }, colors: ['#f6729c', '#ffffff', '#ffd1e0', '#ffffff'], pattern: 'dots', patternSize: 16, ruffle: 'shoulder', neck: 'scoop', neckDepth: 18 },
    { id: 'swim-strawberry', shape: 'swimsuit', cat: 'swim', name: { is: 'Jarðarberjasundbolur', en: 'Strawberry swimsuit' }, colors: ['#fff1f4', '#e5404f', '#e5404f', '#4fae5b'], pattern: 'strawberry', patternSize: 26, ruffle: 'chest', neck: 'scoop', neckDepth: 18 },
    { id: 'swim-wave', shape: 'swimsuit', cat: 'swim', name: { is: 'Öldusundbolur', en: 'Wave swimsuit' }, colors: ['#5fb8e8', '#ffffff', '#2f6fb8', '#f59a8b'], waveBand: true, neck: 'round', motif: 'shell' },
    { id: 'swim-skirt', shape: 'swimsuit', cat: 'swim', name: { is: 'Sundbolur með pilsi', en: 'Swim dress' }, colors: ['#b39af0', '#f7c843', '#d8c8ff', '#f7c843'], pattern: 'stars', patternSize: 20, skirt: true, motif: 'star', neck: 'scoop', neckDepth: 16 },
    { id: 'swim-rainbow', shape: 'swimsuit', cat: 'swim', name: { is: 'Regnbogasundbolur', en: 'Rainbow swimsuit' }, colors: ['#ffffff', '#6fb3e6', '#fff1a8', '#ef6f6c'], pattern: 'rainbow', patternSize: 60, ruffle: 'shoulder', neck: 'scoop', neckDepth: 18, motif: 'heart' },
    { id: 'swim-tankini', shape: 'swimsuit', cat: 'swim', name: { is: 'Tvískipt sundföt', en: 'Two-piece swimsuit' }, colors: ['#ffd84d', '#f48c4a', '#ffefa8', '#f48c4a'], pattern: 'flowers', patternSize: 22, twoPiece: true, neck: 'scoop', neckDepth: 12 },
    { id: 'swim-puffin', shape: 'swimsuit', cat: 'swim', name: { is: 'Lundasundbolur', en: 'Puffin swimsuit' }, colors: ['#26386e', '#f07c2a', '#ffffff', '#f07c2a'], band: '#f07c2a', neck: 'round', motif: 'puffin' },
    { id: 'swim-rashguard', shape: 'swim-rashguard', cat: 'swim', name: { is: 'Sólarsundsett', en: 'Rash guard set' }, colors: ['#3fb6a8', '#f7c843', '#2f6fb8', '#f08a3c'], motif: 'sun' },
    { id: 'swim-rashguard-pink', shape: 'swim-rashguard', cat: 'swim', name: { is: 'Bleikt sundsett', en: 'Pink rash guard set' }, colors: ['#f7a8c8', '#ffffff', '#ef5b8d', '#ffffff'], pattern: 'hearts', patternSize: 22, sleeve: .55, motif: 'wave' },

    { id: 'pj-moon', shape: 'pyjamas', cat: 'pyjamas', name: { is: 'Tungl- og stjörnunáttföt', en: 'Moon and star pyjamas' }, colors: ['#3b4a9a', '#fbe38a', '#fbe38a'], pattern: 'stars', patternSize: 24, top: 'tee', motif: 'moon' },
    { id: 'pj-hearts', shape: 'pyjamas', cat: 'pyjamas', name: { is: 'Hjartanáttföt', en: 'Heart pyjamas' }, colors: ['#ffe1ec', '#f06a96', '#f06a96'], pattern: 'hearts', patternSize: 22, top: 'shirt' },
    { id: 'pj-puffin', shape: 'pyjamas', cat: 'pyjamas', name: { is: 'Lundanáttföt', en: 'Puffin pyjamas' }, colors: ['#cfe8f7', '#26386e', '#f07c2a', '#26386e'], pattern: 'dots', patternSize: 16, legPattern: 'stars', legPatternColor: '#ffffff', top: 'tee', motif: 'puffin' },
    { id: 'pj-clouds', shape: 'pyjamas', cat: 'pyjamas', name: { is: 'Skýjanáttföt', en: 'Cloud pyjamas' }, colors: ['#b8dcf7', '#ffffff', '#ffffff'], pattern: 'dots', patternSize: 22, top: 'tee', motif: 'cloud' },
    { id: 'pj-stripes', shape: 'pyjamas', cat: 'pyjamas', name: { is: 'Röndótt náttföt', en: 'Striped pyjamas' }, colors: ['#ffffff', '#7fcf8a', '#3f8a4f'], pattern: 'stripes', patternSize: 14, top: 'shirt' },
    { id: 'pj-summer', shape: 'pyjamas', cat: 'pyjamas', name: { is: 'Sumarnáttföt', en: 'Summer pyjamas' }, colors: ['#fff3c2', '#f6a65a', '#f6a65a', '#f6a65a'], pattern: 'strawberry', patternSize: 26, legPattern: 'dots', legPatternColor: '#ffffff', top: 'tee', sleeve: .3, legs: 'shorts', motif: 'heart' },
    { id: 'pj-nightgown', shape: 'nightgown', cat: 'pyjamas', name: { is: 'Náttkjóll', en: 'Nightgown' }, colors: ['#f4e9ff', '#ffffff', '#d9c4f5', '#f7a6c2'], pattern: 'dots', patternSize: 18 },
    { id: 'pj-nightgown-rose', shape: 'nightgown', cat: 'pyjamas', name: { is: 'Bleikur náttkjóll', en: 'Pink nightgown' }, colors: ['#ffd9e6', '#ffffff', '#ffffff', '#f06a96'], pattern: 'flowers', patternSize: 26, sleeve: 1 },
    { id: 'pj-onesie-bear', shape: 'onesie', cat: 'pyjamas', name: { is: 'Bangsasamfella', en: 'Bear onesie' }, colors: ['#c99a6e', '#f3dcc4', '#f06a96', '#a36f4a'], ears: 'bear', motif: 'heart' },
    { id: 'pj-onesie-bunny', shape: 'onesie', cat: 'pyjamas', name: { is: 'Kanínusamfella', en: 'Bunny onesie' }, colors: ['#e9e4f7', '#f7c0d6', '#b39af0', '#f06a96'], pattern: 'stars', patternSize: 22, ears: 'bunny', motif: 'moon' },
  ]);
})();
