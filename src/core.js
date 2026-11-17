/* =====================================================================
   Fjársjóðskistan – core
   Geometry standard, drawing helpers, garment registry and doll renderer.
   Everything here is plain functions that return SVG strings, so it runs
   both in the browser and in Node (for the preview tool).
   Coordinate system: one fixed doll pose in viewBox "0 0 400 800".
   ===================================================================== */
(function (root) {
  'use strict';

  /* ---------------------------------------------------------------
     Colour helpers
     --------------------------------------------------------------- */

  /** Parse "#rgb" or "#rrggbb" into [r,g,b]. */
  function hexToRgb(hex) {
    let h = String(hex).replace('#', '');
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  /** Turn [r,g,b] back into "#rrggbb". */
  function rgbToHex(rgb) {
    return '#' + rgb.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  }

  /** Mix two colours. t=0 gives a, t=1 gives b. */
  function mix(a, b, t) {
    const A = hexToRgb(a), B = hexToRgb(b);
    return rgbToHex(A.map((v, i) => v + (B[i] - v) * t));
  }

  /** Lighten (amt>0) or darken (amt<0) a colour. amt is -1..1. */
  function shade(hex, amt) {
    return amt >= 0 ? mix(hex, '#ffffff', amt) : mix(hex, '#2a1e2e', -amt);
  }

  /** Outline colour for a fill: a dark, slightly plum version of the fill (never pure black). */
  function ink(hex) {
    return mix(hex, '#3b2838', 0.58);
  }

  /* ---------------------------------------------------------------
     Shared defs registry (gradients + patterns)
     Helpers register defs once by id; the app writes them into one
     hidden <svg> so every doll and thumbnail can reference them.
     --------------------------------------------------------------- */
  const DEFS = new Map();
  let defsVersion = 0;

  /** Register a def by id (only the first registration counts). */
  function addDef(id, markup) {
    if (!DEFS.has(id)) { DEFS.set(id, markup); defsVersion++; }
    return 'url(#' + id + ')';
  }

  /** Safe id fragment from a colour/name. */
  const idOf = s => String(s).replace(/[^a-z0-9]/gi, '');

  // Global soft-shading overlays. Draw a shape a second time with one of
  // these fills to get the storybook "rounded" look without SVG filters
  // (filters are slow on older Android tablets).
  addDef('soft-v', '<linearGradient id="soft-v" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" stop-color="#fff" stop-opacity=".28"/>' +
    '<stop offset=".45" stop-color="#fff" stop-opacity="0"/>' +
    '<stop offset="1" stop-color="#2a1630" stop-opacity=".22"/></linearGradient>');
  addDef('soft-h', '<linearGradient id="soft-h" x1="0" y1="0" x2="1" y2="0">' +
    '<stop offset="0" stop-color="#2a1630" stop-opacity=".2"/>' +
    '<stop offset=".35" stop-color="#fff" stop-opacity=".18"/>' +
    '<stop offset=".6" stop-color="#fff" stop-opacity="0"/>' +
    '<stop offset="1" stop-color="#2a1630" stop-opacity=".24"/></linearGradient>');
  addDef('soft-r', '<radialGradient id="soft-r" cx=".38" cy=".32" r=".75">' +
    '<stop offset="0" stop-color="#fff" stop-opacity=".35"/>' +
    '<stop offset=".5" stop-color="#fff" stop-opacity="0"/>' +
    '<stop offset="1" stop-color="#2a1630" stop-opacity=".22"/></radialGradient>');
  addDef('shine', '<linearGradient id="shine" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0" stop-color="#fff" stop-opacity=".75"/>' +
    '<stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>');

  /** Small motif tiles used by H.pat(). Each draws one tile of size s. */
  const MOTIFS = {
    stripes: (c1, c2, s) => `<rect width="${s}" height="${s}" fill="${c1}"/><rect width="${s * 0.4}" height="${s}" fill="${c2}"/>`,
    hstripes: (c1, c2, s) => `<rect width="${s}" height="${s}" fill="${c1}"/><rect width="${s}" height="${s * 0.4}" fill="${c2}"/>`,
    dots: (c1, c2, s) => `<rect width="${s}" height="${s}" fill="${c1}"/><circle cx="${s * .25}" cy="${s * .25}" r="${s * .13}" fill="${c2}"/><circle cx="${s * .75}" cy="${s * .75}" r="${s * .13}" fill="${c2}"/>`,
    check: (c1, c2, s) => `<rect width="${s}" height="${s}" fill="${c1}"/><rect width="${s * .5}" height="${s}" fill="${c2}" opacity=".45"/><rect width="${s}" height="${s * .5}" fill="${c2}" opacity=".45"/>`,
    stars: (c1, c2, s) => `<rect width="${s}" height="${s}" fill="${c1}"/>${star(s * .3, s * .3, s * .16, c2)}${star(s * .78, s * .72, s * .11, c2)}`,
    hearts: (c1, c2, s) => `<rect width="${s}" height="${s}" fill="${c1}"/>${heart(s * .3, s * .32, s * .2, c2)}${heart(s * .78, s * .8, s * .14, c2)}`,
    snow: (c1, c2, s) => `<rect width="${s}" height="${s}" fill="${c1}"/>${flake(s * .3, s * .3, s * .17, c2)}${flake(s * .78, s * .76, s * .1, c2)}`,
    flowers: (c1, c2, s) => `<rect width="${s}" height="${s}" fill="${c1}"/>${flower(s * .3, s * .3, s * .16, c2)}${flower(s * .8, s * .78, s * .11, c2)}`,
    strawberry: (c1, c2, s) => `<rect width="${s}" height="${s}" fill="${c1}"/>${berry(s * .32, s * .34, s * .17)}${berry(s * .8, s * .8, s * .12)}`,
    sparkle: (c1, c2, s) => `<rect width="${s}" height="${s}" fill="${c1}"/>${diamond(s * .28, s * .3, s * .12, c2)}${diamond(s * .76, s * .74, s * .08, c2)}`,
    knit: (c1, c2, s) => `<rect width="${s}" height="${s}" fill="${c1}"/><path d="M0,${s * .15} l${s * .25},${s * .3} l${s * .25},-${s * .3} l${s * .25},${s * .3} l${s * .25},-${s * .3} M0,${s * .65} l${s * .25},${s * .3} l${s * .25},-${s * .3} l${s * .25},${s * .3} l${s * .25},-${s * .3}" fill="none" stroke="${c2}" stroke-width="${(s * .09).toFixed(2)}" stroke-linecap="round" opacity=".55"/>`,
    rainbow: (c1, c2, s) => ['#ef6f6c', '#f6a65a', '#f7d660', '#7fcf8a', '#6fb3e6', '#a58be0'].map((c, i) => `<rect y="${i * s / 6}" width="${s}" height="${s / 6 + .3}" fill="${c}"/>`).join(''),
  };

  function star(cx, cy, r, c) {
    let d = '';
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .45 : r;
      d += (i ? 'L' : 'M') + (cx + Math.cos(a) * rr).toFixed(2) + ',' + (cy + Math.sin(a) * rr).toFixed(2);
    }
    return `<path d="${d}Z" fill="${c}"/>`;
  }
  function heart(cx, cy, r, c) {
    return `<path d="M${cx},${cy + r * .9} C${cx - r * 1.4},${cy} ${cx - r * .7},${cy - r} ${cx},${cy - r * .35} C${cx + r * .7},${cy - r} ${cx + r * 1.4},${cy} ${cx},${cy + r * .9}Z" fill="${c}"/>`;
  }
  function flake(cx, cy, r, c) {
    let d = '';
    for (let i = 0; i < 3; i++) {
      const a = i * Math.PI / 3;
      d += `M${(cx - Math.cos(a) * r).toFixed(2)},${(cy - Math.sin(a) * r).toFixed(2)}L${(cx + Math.cos(a) * r).toFixed(2)},${(cy + Math.sin(a) * r).toFixed(2)}`;
    }
    return `<path d="${d}" stroke="${c}" stroke-width="${(r * .28).toFixed(2)}" stroke-linecap="round" fill="none"/>`;
  }
  function flower(cx, cy, r, c) {
    let s = '';
    for (let i = 0; i < 5; i++) {
      const a = i * Math.PI * 2 / 5;
      s += `<circle cx="${(cx + Math.cos(a) * r * .55).toFixed(2)}" cy="${(cy + Math.sin(a) * r * .55).toFixed(2)}" r="${(r * .42).toFixed(2)}" fill="${c}"/>`;
    }
    return s + `<circle cx="${cx}" cy="${cy}" r="${(r * .3).toFixed(2)}" fill="#ffd84d"/>`;
  }
  function berry(cx, cy, r) {
    return `<path d="M${cx},${cy + r} C${cx - r * 1.1},${cy + r * .2} ${cx - r},${cy - r * .7} ${cx},${cy - r * .55} C${cx + r},${cy - r * .7} ${cx + r * 1.1},${cy + r * .2} ${cx},${cy + r}Z" fill="#e8475a"/>` +
      `<path d="M${cx - r * .6},${cy - r * .55} L${cx},${cy - r * .25} L${cx + r * .6},${cy - r * .55} L${cx},${cy - r}Z" fill="#4fae5b"/>`;
  }
  function diamond(cx, cy, r, c) {
    return `<path d="M${cx},${cy - r} L${cx + r * .6},${cy} L${cx},${cy + r} L${cx - r * .6},${cy}Z" fill="${c}"/>`;
  }

  /* ---------------------------------------------------------------
     Path helpers
     --------------------------------------------------------------- */

  /** Smooth closed or open path through points (Catmull-Rom to Bezier). */
  function smooth(pts, closed = true, tension = 0.5) {
    const n = pts.length;
    if (n < 3) return 'M' + pts.map(p => p.join(',')).join('L') + (closed ? 'Z' : '');
    const p = i => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
    let d = `M${f(pts[0][0])},${f(pts[0][1])}`;
    const segs = closed ? n : n - 1;
    for (let i = 0; i < segs; i++) {
      const p0 = p(i - 1), p1 = p(i), p2 = p(i + 1), p3 = p(i + 2);
      const t = tension / 3;
      d += `C${f(p1[0] + (p2[0] - p0[0]) * t)},${f(p1[1] + (p2[1] - p0[1]) * t)} ` +
           `${f(p2[0] - (p3[0] - p1[0]) * t)},${f(p2[1] - (p3[1] - p1[1]) * t)} ${f(p2[0])},${f(p2[1])}`;
    }
    return d + (closed ? 'Z' : '');
  }
  const f = v => (Math.round(v * 10) / 10).toString();

  /** Linear interpolation of x along a list of [y,x] stops. */
  function interp(stops, y) {
    if (y <= stops[0][0]) return stops[0][1];
    for (let i = 1; i < stops.length; i++) {
      if (y <= stops[i][0]) {
        const [y0, x0] = stops[i - 1], [y1, x1] = stops[i];
        return x0 + (x1 - x0) * (y - y0) / (y1 - y0);
      }
    }
    return stops[stops.length - 1][1];
  }

  /** Mirror an x coordinate across the doll's centre line (x=200). */
  const mx = x => 400 - x;

  /* ---------------------------------------------------------------
     G – the geometry standard (see STANDARD.md)
     All numbers are in doll space, viewBox 0 0 400 800.
     "L" = the doll's right-hand side as you look at her? No:
     L means the LEFT side of the picture (x < 200). R = mirror.
     --------------------------------------------------------------- */
  const G = {
    W: 400, H: 800, CX: 200,
    stroke: 2.6,                                     // standard outline width
    head: { cx: 200, cy: 152, rx: 72, ry: 77 },      // face ellipse
    hairTop: 60,                                     // top of hair
    hatLine: 112,                                    // where a hat's lower edge sits (forehead)
    eyes: [[172, 163], [228, 163]],
    ears: [[127, 165], [273, 165]],
    earlobes: [[127, 178], [273, 178]],
    neck: { x0: 186, x1: 214, top: 216, base: 254 },
    necklineY: 262,                                  // natural round neckline
    shoulders: [[118, 290], [282, 290]],             // outer edge of the rounded shoulder
    armpits: [[148, 308], [252, 308]],
    elbows: [[112, 364], [288, 364]],
    wrists: [[100, 442], [300, 442]],
    hands: [[98, 458], [302, 458]],                  // hand centres (hand ≈ 30 wide, 38 long, fingers down)
    waistY: 400, hipY: 434, crotchY: 476,
    kneeY: 574, ankleY: 702,
    feet: [[166, 724], [234, 724]],                  // bare foot centres
    groundY: 748,
  };

  // Arm centreline (left side) as t:0 shoulder → t:1 wrist, with half-widths.
  const ARM = [
    { t: 0, x: 138, y: 280, hw: 17 },
    { t: .5, x: 113, y: 364, hw: 14 },
    { t: 1, x: 101, y: 442, hw: 11.5 },
  ];
  function armAt(t) {
    const i = t <= .5 ? 0 : 1, a = ARM[i], b = ARM[i + 1];
    const k = (t - a.t) / (b.t - a.t);
    return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, hw: a.hw + (b.hw - a.hw) * k,
             dx: b.x - a.x, dy: b.y - a.y };
  }

  /**
   * Sleeve / arm tube on one side.
   * side 'L' or 'R'; t0..t1 along arm (0 shoulder, .5 elbow, 1 wrist);
   * pad = extra width each side; flare = extra width added toward t1 (puffy or bell sleeves).
   */
  G.armPath = function (side, t0 = 0, t1 = 1, pad = 0, flare = 0) {
    const N = 8, outer = [], inner = [];
    for (let i = 0; i <= N; i++) {
      const t = t0 + (t1 - t0) * i / N, a = armAt(t);
      const len = Math.hypot(a.dx, a.dy), nx = a.dy / len, ny = -a.dx / len; // normal pointing outward (left)
      const w = a.hw + pad + flare * (i / N);
      outer.push([a.x - nx * w * -1, a.y - ny * w * -1]);
      inner.push([a.x - nx * w, a.y - ny * w]);
    }
    let pts = outer.concat(inner.reverse());
    if (side === 'R') pts = pts.map(([x, y]) => [mx(x), y]);
    return polyPath(pts);
  };

  /** Point on the arm (for cuffs, bracelets, mitten placement). Returns [x,y]. */
  G.armPoint = function (side, t) {
    const a = armAt(t);
    return side === 'R' ? [mx(a.x), a.y] : [a.x, a.y];
  };

  // Torso side profile (left side x for a given y). Mirror for right.
  const TORSO = [[306, 148], [340, 146.5], [400, 145.5], [434, 139], [476, 137], [560, 136]];
  /** x of the torso edge (left side) at height y. */
  G.torsoX = y => interp(TORSO, y);

  /** Quadratic Bezier sampled into points (excluding the start point). */
  function qpts(a, c, b, n = 10) {
    const out = [];
    for (let i = 1; i <= n; i++) {
      const t = i / n, u = 1 - t;
      out.push([u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]);
    }
    return out;
  }
  /** Where two lines meet: p + s·u and q + r·v. Falls back to the midpoint if parallel. */
  function meet(p, u, q, v) {
    const det = -u[0] * v[1] + u[1] * v[0];
    if (Math.abs(det) < 1e-6) return [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
    const dx = q[0] - p[0], dy = q[1] - p[1];
    const s = (-dx * v[1] + dy * v[0]) / det;
    return [p[0] + u[0] * s, p[1] + u[1] * s];
  }
  const unit = (x, y) => { const l = Math.hypot(x, y) || 1; return [x / l, y / l]; };
  /** Edge of the left arm at t. dir -1 = outer edge (away from body), +1 = inner edge. w = half-width. */
  function armEdge(t, dir, w) {
    const a = armAt(t), [nx, ny] = unit(a.dy, -a.dx);   // normal pointing toward the body
    return [a.x + dir * nx * w, a.y + dir * ny * w];
  }

  /**
   * Upper-body garment silhouette with natural ROUNDED shoulders, as one closed path.
   * The sleeve grows out of the shoulder curve, so there is no boxy corner.
   * opts:
   *   sleeve      0 = sleeveless, .15 cap sleeve, .3 short, .55 elbow, 1 = long (to the wrist)
   *   pad         looseness around the body (default 4)
   *   sleevePad   looseness around the arm (default = pad)
   *   sleeveFlare extra width at the cuff (bell or puffy sleeves)
   *   bottom      hem height (444 hip, 470 tunic, longer for coats/dress bodices)
   *   flare       extra width at the hem
   *   neck        'round' | 'v' | 'high' | 'square' | 'scoop' | 'boat';  neckDepth overrides the dip
   */
  G.shirtPath = function ({ sleeve = 0.3, pad = 4, sleevePad, sleeveFlare = 0, bottom = 444, flare = 0, neck = 'round', neckDepth } = {}) {
    const sp = sleevePad ?? pad;
    const depth = neckDepth ?? { round: 10, v: 46, high: 2, square: 26, scoop: 30, boat: 4 }[neck] ?? 10;
    const nw = { round: 17, v: 17, high: 15, square: 22, scoop: 25, boat: 34 }[neck] ?? 17;
    const ny = 252 - (neck === 'high' ? 8 : 0) - pad * .3;
    const side = y => G.torsoX(y) - pad - flare * Math.max(0, (y - 320) / Math.max(1, bottom - 320));
    const N = [200 - nw, ny];
    const T = [160, 258 - pad * .7];                     // top of the shoulder
    const L = [N, ...qpts(N, [174, ny + 1], T, 6)];      // neck → shoulder (gentle slope)
    if (sleeve > 0) {
      const t0 = Math.min(0.12, sleeve * 0.6);           // where the shoulder curve joins the sleeve
      const w = t => armAt(t).hw + sp + sleeveFlare * Math.max(0, (t - t0) / Math.max(.01, sleeve - t0));
      const P1 = armEdge(t0, -1, w(t0));
      const a0 = armAt(t0), up = unit(-a0.dx, -a0.dy);
      const C = meet(T, unit(T[0] - N[0], T[1] - N[1]), P1, up);
      L.push(...qpts(T, C, P1, 12));                     // rounded shoulder
      const steps = Math.max(2, Math.round((sleeve - t0) / .04));
      for (let i = 1; i <= steps; i++) { const t = t0 + (sleeve - t0) * i / steps; L.push(armEdge(t, -1, w(t))); }
      // cuff, then the inner edge back up until it meets the body side
      let lastY = armEdge(sleeve, 1, w(sleeve))[1];
      for (let t = sleeve; t >= 0; t -= .02) {
        const p = armEdge(t, 1, w(t));
        if (p[0] >= side(p[1])) break;
        L.push(p); lastY = p[1];
      }
      L.push([side(lastY - 2), lastY - 2]);
    } else {
      // sleeveless: soft round shoulder, armhole curving in to the armpit
      const Sh = [142 - pad * .8, 272];
      L.push(...qpts(T, [148 - pad * .6, 260 - pad * .3], Sh, 6));
      L.push(...qpts(Sh, [136 - pad, 292], [side(312), 312], 8));
    }
    const startY = L[L.length - 1][1];
    for (let y = Math.ceil((startY + 4) / 8) * 8; y < bottom; y += 8) L.push([side(y), y]);
    L.push([side(bottom), bottom]);
    const R = L.slice().reverse().map(([x, y]) => [mx(x), y]);
    const pt = p => f(p[0]) + ',' + f(p[1]);
    let d = 'M' + L.map(pt).join('L');
    d += `Q200,${f(bottom + 6)} ${pt(R[0])}`;            // slightly curved hem
    d += 'L' + R.slice(1).map(pt).join('L');
    if (neck === 'v') d += `L200,${f(ny + depth)}Z`;
    else if (neck === 'square') d += `L${200 + nw},${f(ny + depth)}L${200 - nw},${f(ny + depth)}Z`;
    else d += `Q200,${f(ny + depth * 2)} ${pt(N)}Z`;
    return d;
  };

  /** Sleeveless body (kept for older code): same as shirtPath with sleeve 0. */
  G.torsoPath = function (opts = {}) { return G.shirtPath(Object.assign({}, opts, { sleeve: 0 })); };

  // Leg profiles (left leg). outer edge and inner edge x by y.
  const LEG_OUT = [[434, 138], [476, 140], [574, 148], [702, 157]];
  const LEG_IN = [[476, 197], [574, 192], [702, 184]];
  G.legOutX = y => interp(LEG_OUT, y);
  G.legInX = y => interp(LEG_IN, y);

  /** One leg tube from y0 to y1 (y0 ≥ 476 for a clean tube). pad = looseness, flare = extra width at y1. */
  G.legPath = function (side, y0 = 476, y1 = 702, pad = 0, flare = 0) {
    const N = 6, out = [], inn = [];
    for (let i = 0; i <= N; i++) {
      const y = y0 + (y1 - y0) * i / N, k = i / N;
      out.push([G.legOutX(y) - pad - flare * k, y]);
      inn.push([G.legInX(y) + pad + flare * k * .6, y]);
    }
    let pts = out.concat(inn.reverse());
    if (side === 'R') pts = pts.map(([x, y]) => [mx(x), y]);
    return polyPath(pts);
  };

  /**
   * Trousers/shorts/leggings as one closed path: waistband at `top`, legs down to `bottom`.
   * pad = looseness, flare = extra width at the hem (bootcut, wide legs).
   */
  G.pantsPath = function ({ top = 398, bottom = 700, pad = 3, flare = 0 } = {}) {
    const crotch = G.crotchY + 2 + pad * .4;
    const ys = [top, 434, 476, 520, 574, 640, 702].filter(y => y > top && y < bottom).concat([bottom]);
    const k = y => Math.max(0, (y - 476) / Math.max(1, bottom - 476));
    const outL = [[G.torsoX(top) - pad, top]].concat(ys.map(y => [(y <= 476 ? Math.min(G.torsoX(y), G.legOutX(y)) : G.legOutX(y)) - pad - flare * k(y), y]));
    const inL = ys.filter(y => y > crotch).map(y => [G.legInX(y) + pad + flare * k(y) * .6, y]).reverse();
    const left = outL.concat(inL.length ? inL : [[196, bottom]]).concat([[200, crotch]]);
    const right = left.slice(0, -1).reverse().map(([x, y]) => [mx(x), y]);
    return polyPath(left.concat(right));
  };

  /** Skirt (A-line) from waist `top` to hem `bottom`; flare = how far the hem spreads beyond the hips. */
  G.skirtPath = function ({ top = 398, bottom = 540, flare = 30, pad = 4 } = {}) {
    const wx = G.torsoX(top) - pad, hx = G.torsoX(Math.min(bottom, 476)) - pad - flare;
    return `M${f(wx)},${top} C${f(wx - 4)},${f(top + 30)} ${f(hx + 6)},${f(bottom - 40)} ${f(hx)},${bottom}` +
      ` Q200,${f(bottom + 14)} ${f(mx(hx))},${bottom} C${f(mx(hx + 6))},${f(bottom - 40)} ${f(mx(wx - 4))},${f(top + 30)} ${f(mx(wx))},${top} Z`;
  };

  /** Foot outline (for shoes). pad = shoe size around the foot, toe = extra length outward. */
  G.footPath = function (side, pad = 4, toe = 0) {
    const [cx, cy] = G.feet[0];
    const pts = [
      [cx - 24 - pad - toe, cy + 4], [cx - 18 - pad - toe, cy - 10 - pad * .4], [cx - 8, cy - 22 - pad * .5],
      [cx + 12 + pad * .4, cy - 22 - pad * .5], [cx + 17 + pad, cy - 6], [cx + 16 + pad, cy + 10 + pad * .4],
      [cx - 2, cy + 14 + pad * .5], [cx - 20 - pad - toe, cy + 13 + pad * .4],
    ];
    return smooth(side === 'R' ? pts.map(([x, y]) => [mx(x), y]) : pts);
  };

  /** Points along the head ellipse grown by `offset`, from angle a0 to a1 in degrees (0 = right, 270 = top). */
  G.headArc = function (a0, a1, offset = 0, n = 16) {
    const { cx, cy, rx, ry } = G.head, pts = [];
    for (let i = 0; i <= n; i++) {
      const a = (a0 + (a1 - a0) * i / n) * Math.PI / 180;
      pts.push([cx + Math.cos(a) * (rx + offset), cy + Math.sin(a) * (ry + offset)]);
    }
    return pts;
  };

  /** Path through points with straight segments (use for polygons from the helpers). */
  function polyPath(pts) { return 'M' + pts.map(p => f(p[0]) + ',' + f(p[1])).join('L') + 'Z'; }
  G.crotchY = 476;

  /* ---------------------------------------------------------------
     H – drawing helpers for garment authors
     --------------------------------------------------------------- */
  const H = {
    mix, shade, ink, smooth, polyPath, mx, star, heart, flake, flower, berry, diamond,

    /** Vertical soft gradient based on one colour (light top, darker bottom). Returns fill url. */
    grad(hex, kind = 'v') {
      const id = `g${kind}${idOf(hex)}`;
      if (kind === 'h') {
        return addDef(id, `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${shade(hex, -.14)}"/><stop offset=".4" stop-color="${shade(hex, .1)}"/><stop offset="1" stop-color="${shade(hex, -.16)}"/></linearGradient>`);
      }
      if (kind === 'r') {
        return addDef(id, `<radialGradient id="${id}" cx=".38" cy=".3" r=".8"><stop offset="0" stop-color="${shade(hex, .25)}"/><stop offset="1" stop-color="${shade(hex, -.12)}"/></radialGradient>`);
      }
      return addDef(id, `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(hex, .12)}"/><stop offset="1" stop-color="${shade(hex, -.1)}"/></linearGradient>`);
    },

    /** Pattern fill (userSpaceOnUse, so all garments share one scale). name from MOTIFS. */
    pat(name, c1, c2 = '#ffffff', size = 22) {
      if (!MOTIFS[name]) return H.grad(c1);
      const id = `p${name}${idOf(c1)}${idOf(c2)}${size}`;
      return addDef(id, `<pattern id="${id}" width="${size}" height="${size}" patternUnits="userSpaceOnUse">${MOTIFS[name](c1, c2, size)}</pattern>`);
    },

    /** Main fill for an item: its pattern if any, otherwise a soft gradient of colours[i]. */
    fill(item, i = 0) {
      const c = (item.colors && (item.colors[i] || item.colors[0])) || '#cccccc';
      if (i === 0 && item.pattern && item.pattern !== 'solid') return H.pat(item.pattern, c, item.colors[1] || '#ffffff', item.patternSize || 22);
      return H.grad(c);
    },

    /** Standard paint attributes: fill + tinted outline. */
    paint(fill, baseHex, sw = G.stroke) {
      return `fill="${fill}" stroke="${ink(baseHex)}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"`;
    },

    /** A path drawn with fill + outline, then the soft shading overlay on top. */
    part(d, fill, baseHex, soft = 'v', sw = G.stroke) {
      return `<path d="${d}" ${H.paint(fill, baseHex, sw)}/>` + (soft ? `<path d="${d}" fill="url(#soft-${soft})"/>` : '');
    },

    /** Register any def (gradient, pattern) by id. Returns url(#id). */
    def(id, markup) { return addDef(id, markup); },

    /** Register a clip path by id (use a unique id per item, e.g. 'c-' + item.id + '-yoke'). Returns url(#id). */
    clip(id, d) { return addDef(id, `<clipPath id="${id}"><path d="${d}"/></clipPath>`); },

    /** Thin fold / seam line in a darker tone of the base colour. */
    line(d, baseHex, sw = 2, op = .55) {
      return `<path d="${d}" fill="none" stroke="${ink(baseHex)}" stroke-width="${sw}" stroke-linecap="round" opacity="${op}"/>`;
    },
  };

  /* ---------------------------------------------------------------
     Slots: where a piece is worn and its layer (z). Higher z is on top.
     backZ: layer for the optional `back` part of a piece (behind the body).
     thumb: default thumbnail window [x,y,w,h] for the chest.
     --------------------------------------------------------------- */
  const SLOTS = {
    wings:    { z: 2,  thumb: [10, 190, 380, 320] },
    cape:     { z: 64, backZ: 4, thumb: [40, 220, 320, 470] },
    bag:      { z: 62, backZ: 5, thumb: [100, 236, 200, 230] },
    suit:     { z: 30, thumb: [80, 240, 240, 270] },
    bottom:   { z: 34, thumb: [110, 380, 180, 340] },
    top:      { z: 36, thumb: [70, 236, 260, 250] },
    dress:    { z: 38, thumb: [50, 236, 300, 500] },
    shoes:    { z: 42, thumb: [128, 640, 144, 110] },
    sweater:  { z: 46, thumb: [60, 232, 280, 270] },
    jacket:   { z: 52, thumb: [54, 228, 292, 300] },
    mittens:  { z: 58, thumb: [72, 422, 256, 82] },
    scarf:    { z: 60, thumb: [140, 210, 130, 190] },
    necklace: { z: 70, thumb: [156, 236, 88, 90] },
    face:     { z: 72, thumb: [130, 150, 140, 70] },   // face paint: on the face, under the front hair

    earrings: { z: 78, thumb: [105, 160, 44, 64] },
    glasses:  { z: 80, thumb: [118, 128, 164, 76] },
    hairband: { z: 84, thumb: [104, 50, 192, 120] },
    hat:      { z: 88, backZ: 9, thumb: [84, 14, 232, 156] },
  };

  /* Categories = the tabs in the treasure chest. A category is for browsing;
     the item's shape decides the slot it is worn in. */
  const CATS = [
    { id: 'hair',     is: 'Hár' },
    { id: 'hat',      is: 'Húfur og hattar' },
    { id: 'crown',    is: 'Kórónur' },
    { id: 'hairband', is: 'Spangir og slaufur' },
    { id: 'glasses',  is: 'Gleraugu' },
    { id: 'face',     is: 'Andlitsmálning' },
    { id: 'earrings', is: 'Eyrnalokkar' },
    { id: 'necklace', is: 'Hálsmen' },
    { id: 'top',      is: 'Bolir' },
    { id: 'sweater',  is: 'Peysur' },
    { id: 'jacket',   is: 'Jakkar' },
    { id: 'rain',     is: 'Pollagallar' },
    { id: 'snowsuit', is: 'Kuldagallar' },
    { id: 'dress',    is: 'Prinsessukjólar' },
    { id: 'frock',    is: 'Kjólar' },
    { id: 'pants',    is: 'Buxur' },
    { id: 'shorts',   is: 'Stuttbuxur' },
    { id: 'skirt',    is: 'Pils' },
    { id: 'swim',     is: 'Sundföt' },
    { id: 'pyjamas',  is: 'Náttföt' },
    { id: 'mittens',  is: 'Vettlingar' },
    { id: 'scarf',    is: 'Treflar' },
    { id: 'shoes',    is: 'Skór' },
    { id: 'boots',    is: 'Stígvél' },
    { id: 'cape',     is: 'Skikkjur og vængir' },
    { id: 'bag',      is: 'Bakpokar' },
  ];

  /* ---------------------------------------------------------------
     Registry
     --------------------------------------------------------------- */
  const DOLL = {
    shapes: {}, items: [], byId: {},

    /**
     * Register a garment shape.
     * def: { slot, occupies?, z?, backZ?, thumb?, sway?, draw(item) → string | {back, front} }
     */
    shape(name, def) {
      if (!def.slot || !SLOTS[def.slot]) throw new Error('shape ' + name + ': unknown slot ' + def.slot);
      def.name = name;
      def.occupies = def.occupies || [def.slot];
      DOLL.shapes[name] = def;
    },

    /** Register catalog items: [{ id, shape, cat, name:{is,en}, colors:[...], pattern?, ...extra }]. */
    add(list) {
      for (const it of list) {
        if (DOLL.byId[it.id]) { console.warn('duplicate item id', it.id); continue; }
        if (!DOLL.shapes[it.shape]) { console.warn('item ' + it.id + ' has unknown shape ' + it.shape); continue; }
        DOLL.items.push(it); DOLL.byId[it.id] = it;
      }
    },

    /** Slot an item is worn in, and the slots it blocks. */
    slotOf(item) { return DOLL.shapes[item.shape].slot; },
    occupiesOf(item) { return item.occupies || DOLL.shapes[item.shape].occupies; },

    /** Draw one item, returning {back, front} strings (either may be ''). */
    drawItem(item) {
      let out;
      try { out = DOLL.shapes[item.shape].draw(item); }
      catch (e) { console.warn('draw failed', item.id, e); out = ''; }
      return typeof out === 'string' ? { back: '', front: out } : { back: out.back || '', front: out.front || '' };
    },

    /** Every registered def as one string (for the hidden defs <svg>). */
    defsString() { return [...DEFS.values()].join(''); },
    get defsVersion() { return defsVersion; },
  };

  /* ---------------------------------------------------------------
     The doll's body, face and hair (drawn by core, not by garment files)
     Shading uses gradients and soft radial blobs only (no SVG filters,
     which are slow on older Android tablets).
     --------------------------------------------------------------- */
  const SKIN = { base: '#f7d7c3', light: '#fdeadd', shade: '#eab49c', deep: '#d18d77', line: '#c2857a', blush: '#f28a8c' };
  const HAIR = { base: '#cf8f5a', light: '#efbf88', glow: '#fce4c0', dark: '#a7623a', deep: '#7a4225', line: '#7c4a2c' };
  const EYE = { ring: '#1f4f8f', pupil: '#172238' };

  // Skin, eye and ground gradients (registered once, shared by every doll)
  const SK = {
    limb: addDef('sk-limb', `<linearGradient id="sk-limb" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${SKIN.shade}"/><stop offset=".3" stop-color="${SKIN.light}"/><stop offset=".62" stop-color="${SKIN.base}"/><stop offset="1" stop-color="${SKIN.shade}"/></linearGradient>`),
    face: addDef('sk-face', `<radialGradient id="sk-face" cx=".42" cy=".36" r=".72"><stop offset="0" stop-color="${SKIN.light}"/><stop offset=".6" stop-color="${SKIN.base}"/><stop offset="1" stop-color="${SKIN.shade}"/></radialGradient>`),
    neck: addDef('sk-neck', `<linearGradient id="sk-neck" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${SKIN.deep}"/><stop offset=".45" stop-color="${SKIN.shade}"/><stop offset="1" stop-color="${SKIN.base}"/></linearGradient>`),
    shadow: addDef('sk-shadow', `<radialGradient id="sk-shadow"><stop offset="0" stop-color="${SKIN.deep}" stop-opacity=".75"/><stop offset="1" stop-color="${SKIN.deep}" stop-opacity="0"/></radialGradient>`),
    blush: addDef('sk-blush', `<radialGradient id="sk-blush"><stop offset="0" stop-color="${SKIN.blush}" stop-opacity=".75"/><stop offset=".55" stop-color="${SKIN.blush}" stop-opacity=".32"/><stop offset="1" stop-color="${SKIN.blush}" stop-opacity="0"/></radialGradient>`),
    glow: addDef('sk-glow', `<radialGradient id="sk-glow"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>`),
    sclera: addDef('eye-sclera', `<linearGradient id="eye-sclera" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d6cde2"/><stop offset=".42" stop-color="#ffffff"/></linearGradient>`),
    iris: addDef('eye-iris', `<linearGradient id="eye-iris" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d4a8a"/><stop offset=".45" stop-color="#3a8ad6"/><stop offset="1" stop-color="#93d6fb"/></linearGradient>`),
    ground: addDef('ground-sh', `<radialGradient id="ground-sh"><stop offset="0" stop-color="#2a1d33" stop-opacity=".34"/><stop offset=".65" stop-color="#2a1d33" stop-opacity=".12"/><stop offset="1" stop-color="#2a1d33" stop-opacity="0"/></radialGradient>`),
    vest: addDef('vest-g', `<linearGradient id="vest-g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#eadccb"/><stop offset=".32" stop-color="#fffaf3"/><stop offset=".7" stop-color="#fbf2e6"/><stop offset="1" stop-color="#e4d3bf"/></linearGradient>`),
  };
  const FACE_D = 'M128,150 C128,96 160,75 200,75 C240,75 272,96 272,150 C272,202 242,230 200,230 C158,230 128,202 128,150 Z';
  addDef('faceclip', `<clipPath id="faceclip"><path d="${FACE_D}"/></clipPath>`);

  /** Soft ellipse used for shadows, blush and glows. */
  const blob = (cx, cy, rx, ry, fill, op = 1) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" opacity="${op}"/>`;
  /** Row of small lace scallops from x0 to x1 at height y (dir 1 = scallops point down). */
  const lace = (x0, x1, y, dir = 1, col = '#f3c4cc') => {
    let d = `M${x0},${y}`;
    for (let x = x0; x < x1 - 1; x += 8) d += `q4,${dir * 7} 8,0`;
    return `<path d="${d}" fill="none" stroke="${col}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`;
  };

  /**
   * Relaxed hand hanging down, seen from the back with the thumb in front.
   * Drawn in local space (wrist at 0,0, fingers pointing down, body side = +x),
   * then mirrored for the right hand and tilted to follow the forearm.
   */
  /** Hands also get their own layer (z 41) so wide skirts never hide them. ext = how far the top reaches up the wrist. */
  const hand = (side, ext = 7) => {
    const sk = SKIN.line;
    // whole-hand silhouette: palm plus four slightly curled fingers (pinky, ring, middle, index)
    // The thumb is part of the outline: a short rounded bump on the body side that rests against the index finger.
    const silhouette = `M-11.5,${-ext} L-11.5,0 C-13,5 -14.5,11 -14.5,17 C-14.8,23 -13.5,28.5 -10.5,29.2 C-7.8,29.8 -7,27 -7,24 ` +
      'C-7.2,30 -6,34.5 -3.4,34.8 C-0.8,35.1 0,32 0,28.5 C0,34 1.4,37.6 3.8,37.6 C6.3,37.6 7,34.5 7,31 ' +
      'C7.3,34 8.6,35.2 10.6,34.7 C12.8,34.1 13.8,30.5 13.7,26.5 C13.6,24.5 14,23 15.2,22.2 ' +
      `C17.2,20.8 17.8,17.5 17,14.5 C16,10.5 14,7 12.4,4.5 C11.8,3 11.5,1.5 11.5,0 L11.5,${-ext}`;  // left open at the top so no seam shows at the wrist
    const [wx, wy] = G.armPoint(side, 1);
    const tilt = side === 'L' ? 8.7 : -8.7, flip = side === 'L' ? '' : ' scale(-1,1)';
    return `<g transform="translate(${f(wx)},${f(wy - 2)}) rotate(${tilt})${flip}">` +
      `<path d="${silhouette}" fill="${SKIN.base}" stroke="${sk}" stroke-width="1.9" stroke-linejoin="round"/>` +
      `<path d="${silhouette}" fill="url(#soft-h)" opacity=".5"/>` +
      // finger gaps, knuckle hints and fingertip nails
      `<path d="M-7,24 L-7,20 M0,28.5 L0,22.5 M7,31 L7,24.5" stroke="${sk}" stroke-width="1.5" stroke-linecap="round" opacity=".8"/>` +
      `<path d="M-12,15 q2,-2 4,0 M-5,16 q2,-2 4,0 M2,16.5 q2,-2 4,0" stroke="${SKIN.shade}" stroke-width="1.4" fill="none" stroke-linecap="round"/>` +
      `<path d="M-12.4,26.5 q2,1.5 3.6,0 M-5.4,32 q2,1.4 3.6,0 M1.8,35 q2,1.4 3.6,0 M8.8,32.2 q2,1.2 3.4,-.4" stroke="#f5c4c0" stroke-width="1.6" fill="none" stroke-linecap="round"/>` +
      blob(-3, 13, 7, 5.5, SK.glow, .4) +
      // soft crease where the thumb meets the palm
      `<path d="M14,24.5 Q12,19 9.5,14.5" stroke="${sk}" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".7"/>` +
      `</g>`;
  };

  /** Bare body with a cream vest and shorts underneath everything. */
  function drawBody() {
    const limb = d => `<path d="${d}" fill="${SK.limb}" stroke="${SKIN.line}" stroke-width="2.2" stroke-linejoin="round"/>`;
    const foot = side => {
      const s = side === 'L' ? -1 : 1, [fx, fy] = G.feet[side === 'L' ? 0 : 1];
      return `<path d="${G.footPath(side, -2)}" fill="${SK.face}" stroke="${SKIN.line}" stroke-width="2.2"/>` +
        blob(fx + s * 2, fy - 9, 11, 5, SK.glow, .5) +
        `<path d="M${fx + s * 13},${fy + 4} q${s * 3},4 ${s * 8},5 M${fx + s * 7},${fy + 7} q${s * 2},3 ${s * 6},4" fill="none" stroke="${SKIN.line}" stroke-width="1.5" stroke-linecap="round" opacity=".75"/>`;
    };
    // torso and both arms as ONE skin shape, so the shoulders round smoothly into the arms
    const upper = G.shirtPath({ sleeve: 1, pad: 0, neck: 'high', bottom: 470 });
    const vestD = G.torsoPath({ bottom: 446, pad: 1, neck: 'scoop', neckDepth: 22 });
    const shortsD = G.pantsPath({ top: 432, bottom: 498, pad: 2 });
    const bow = `<path d="M200,282 l-11,-7 v14z M200,282 l11,-7 v14z" fill="#f3a7b5" stroke="#d27586" stroke-width="1.6" stroke-linejoin="round"/><circle cx="200" cy="282" r="3.2" fill="#f7c0ca" stroke="#d27586" stroke-width="1.4"/>`;
    return [
      // legs + feet (with knee blush)
      limb(G.legPath('L', 440, 706)), limb(G.legPath('R', 440, 706)),
      blob(171, G.kneeY, 12, 8, SK.blush, .55), blob(229, G.kneeY, 12, 8, SK.blush, .55),
      `<path d="M163,${G.kneeY + 6} q8,5 17,0 M220,${G.kneeY + 6} q8,5 17,0" stroke="${SKIN.shade}" stroke-width="2" fill="none" stroke-linecap="round"/>`,
      blob(171, 690, 10, 16, SK.shadow, .35), blob(229, 690, 10, 16, SK.shadow, .35),
      foot('L'), foot('R'),
      // torso + arms skin, then roundness: arm shading, shoulder highlights, elbow blush, armpit crease
      `<path d="${upper}" fill="${SKIN.base}" stroke="${SKIN.line}" stroke-width="2.2" stroke-linejoin="round"/>`,
      `<path d="${G.torsoPath({ bottom: 470, pad: -2, neck: 'high' })}" fill="url(#soft-h)" opacity=".45"/>`,
      `<path d="${G.armPath('L', .16, 1, -1)}" fill="url(#soft-h)" opacity=".55"/><path d="${G.armPath('R', .16, 1, -1)}" fill="url(#soft-h)" opacity=".55"/>`,
      // hands on top: their open top edge hides the wrist line of the arm
      hand('L'), hand('R'),
      blob(132, 286, 11, 8, SK.glow, .5), blob(268, 286, 11, 8, SK.glow, .5),
      blob(113, 364, 9, 7, SK.blush, .45), blob(287, 364, 9, 7, SK.blush, .45),
      `<path d="M147,312 q-3,10 -8,18 M253,312 q3,10 8,18" stroke="${SKIN.line}" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".6"/>`,
      `<path d="M181,268 q-12,-3 -23,3 M219,268 q12,-3 23,3" stroke="${SKIN.shade}" stroke-width="2" fill="none" stroke-linecap="round"/>`,
      // shorts (drawn first, the vest overlaps their waistband)
      `<path d="${shortsD}" fill="${SK.vest}" stroke="#d6c2ab" stroke-width="2"/>`,
      `<path d="M168,${470} q2,12 -2,24 M232,${470} q-2,12 2,24" stroke="#e3d1bc" stroke-width="2" fill="none" stroke-linecap="round"/>`,
      lace(140, 196, 496, 1), lace(204, 260, 496, 1),
      // vest with soft folds, lace hem, dotted neckline and a little bow
      `<path d="${vestD}" fill="${SK.vest}" stroke="#d6c2ab" stroke-width="2"/>`,
      `<path d="M176,322 q-5,50 1,104 M226,318 q6,56 0,108" stroke="#e8d8c4" stroke-width="2.2" fill="none" stroke-linecap="round"/>`,
      blob(184, 330, 14, 40, SK.glow, .35),
      lace(146, 254, 448, 1),
      `<path d="M176,276 q24,14 48,0" fill="none" stroke="#f2b8c0" stroke-width="2.4" stroke-dasharray="3 4" stroke-linecap="round"/>`,
      bow,
      // neck, shaded darker under the chin
      `<path d="M186,212 L186,258 Q200,266 214,258 L214,212 Z" fill="${SK.neck}" stroke="${SKIN.line}" stroke-width="2.2"/>`,
    ].join('');
  }

  /** Face: shape with soft shading, eyes (with blink lids), brows, nose, mouth (smile or happy), cheeks, freckles. */
  function drawFace(mood) {
    // o = outer direction of the eye: -1 for the left eye, +1 for the right eye
    const eye = ([cx, cy], o) =>
      `<ellipse cx="${cx}" cy="${cy}" rx="14" ry="16" fill="${SK.sclera}"/>` +
      `<ellipse cx="${cx}" cy="${cy + 2}" rx="11.6" ry="12.8" fill="${SK.iris}" stroke="${EYE.ring}" stroke-width="1.8"/>` +
      `<ellipse cx="${cx}" cy="${cy + 8}" rx="7.5" ry="4.2" fill="#c4eeff" opacity=".5"/>` +
      `<ellipse cx="${cx}" cy="${cy + 2.5}" rx="5.4" ry="6.2" fill="${EYE.pupil}"/>` +
      `<ellipse cx="${cx + 4.6}" cy="${cy - 3.4}" rx="4.5" ry="3.9" fill="#fff"/>` +
      `<circle cx="${cx - 4.3}" cy="${cy + 7.6}" r="1.9" fill="#fff" opacity=".95"/>` +
      `<circle cx="${cx + 6.6}" cy="${cy + 4.6}" r="1.05" fill="#fff" opacity=".85"/>` +
      `<ellipse cx="${cx}" cy="${cy}" rx="14" ry="16" fill="none" stroke="#7d5f63" stroke-width="1.1" opacity=".55"/>` +
      // crease, upper lash line with outer flick, lower lash line
      `<path d="M${cx - o * 11},${cy - 19} Q${cx},${cy - 26} ${cx + o * 12},${cy - 18}" fill="none" stroke="${SKIN.deep}" stroke-width="1.6" stroke-linecap="round" opacity=".45"/>` +
      `<path d="M${cx - o * 14},${cy - 5} Q${cx - o * 2},${cy - 21} ${cx + o * 14},${cy - 6} l${o * 6},-3" fill="none" stroke="#3a2830" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<path d="M${cx + o * 9},${cy - 13} q${o * 3},-3 ${o * 8},-3" fill="none" stroke="#3a2830" stroke-width="2.2" stroke-linecap="round"/>` +
      `<path d="M${cx - 9},${cy + 15} Q${cx},${cy + 18.5} ${cx + 9},${cy + 15}" fill="none" stroke="${SKIN.deep}" stroke-width="1.5" stroke-linecap="round" opacity=".55"/>` +
      // eyelid for blinking (scaled from 0 to 1 by CSS)
      `<ellipse class="lid" cx="${cx}" cy="${cy}" rx="15.5" ry="17.5" fill="${SKIN.base}" stroke="${SKIN.line}" stroke-width="1.4"/>`;
    const brows = `<path d="M157,140 Q171,128 188,135" fill="none" stroke="${HAIR.dark}" stroke-width="4" stroke-linecap="round"/>` +
      `<path d="M212,135 Q229,128 243,140" fill="none" stroke="${HAIR.dark}" stroke-width="4" stroke-linecap="round"/>` +
      `<path d="M162,136 Q172,130 182,133 M218,133 Q228,130 238,136" fill="none" stroke="${HAIR.light}" stroke-width="1.4" stroke-linecap="round" opacity=".8"/>`;
    const nose = `<path d="M195,184 Q200,190 206,185" fill="none" stroke="${SKIN.line}" stroke-width="2.4" stroke-linecap="round"/>` +
      `<circle cx="202" cy="177" r="2.4" fill="#fff" opacity=".6"/>`;
    const mouth = mood === 'happy'
      ? `<path d="M183,199 Q200,226 217,199 Q200,205 183,199 Z" fill="#b8424f" stroke="#963443" stroke-width="2" stroke-linejoin="round"/>` +
        `<path d="M187,201 Q200,206 213,201 L212,205 Q200,210 188,205 Z" fill="#fff"/>` +
        `<path d="M191,213 Q200,221 209,213 Q200,210 191,213 Z" fill="#ef8f98"/>` +
        `<path d="M195,220 q5,2 10,0" stroke="#f7c0c6" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".8"/>`
      : `<path d="M185,200 Q200,213 215,200" fill="none" stroke="#c45f69" stroke-width="3.2" stroke-linecap="round"/>` +
        `<path d="M193,208 Q200,212 207,208" fill="none" stroke="#e8a0a8" stroke-width="2.4" stroke-linecap="round" opacity=".75"/>` +
        `<path d="M183,197 q-2,3 0,6 M217,197 q2,3 0,6" fill="none" stroke="${SKIN.line}" stroke-width="1.4" stroke-linecap="round" opacity=".6"/>`;
    const freckles = [[183, 182], [189, 187], [177, 188], [217, 182], [211, 187], [223, 188], [195, 177], [206, 176]]
      .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.5" fill="#c98a6a" opacity=".7"/>`).join('');
    return `<path d="${FACE_D}" fill="${SK.face}" stroke="${SKIN.line}" stroke-width="2.4"/>` +
      // soft shading inside the face: under the fringe, along the jaw, under the chin, plus highlights
      `<g clip-path="url(#faceclip)">` +
        blob(200, 124, 78, 22, SK.shadow, .7) +
        blob(130, 184, 20, 46, SK.shadow, .4) + blob(270, 184, 20, 46, SK.shadow, .4) +
        blob(200, 238, 48, 16, SK.shadow, .5) +
        blob(168, 150, 30, 26, SK.glow, .18) +
      `</g>` +
      blob(152, 193, 19, 12, SK.blush, .9) + blob(248, 193, 19, 12, SK.blush, .9) +
      blob(157, 187, 8, 4, SK.glow, .65) + blob(243, 187, 8, 4, SK.glow, .65) +
      freckles + `<g class="eyes">${eye(G.eyes[0], -1)}${eye(G.eyes[1], 1)}</g>` + brows + nose + `<g class="mouth">${mouth}</g>`;
  }

  /** Ears, drawn above the hair so hair looks tucked behind them. */
  function drawEars() {
    return G.ears.map(([cx, cy], i) => {
      const s = i ? 1 : -1;
      return `<ellipse cx="${cx}" cy="${cy}" rx="10" ry="14" fill="${SK.face}" stroke="${SKIN.line}" stroke-width="2.2"/>` +
        blob(cx + s * 2, cy + 1, 5, 9, SK.blush, .5) +
        `<path d="M${cx + s * 3},${cy - 7} q${s * 4},7 0,13" fill="none" stroke="${SKIN.line}" stroke-width="1.8" stroke-linecap="round"/>`;
    }).join('');
  }

  /* Hairstyles: each returns {back, front}. Groups with class "sway-*"
     move in the wind (CSS in the app). Back hair uses a darker gradient
     than front hair, which gives the hair depth.
     Every helper takes a palette (default: her own brown), so the same
     shapes can be drawn in rainbow, mermaid or dark curly colours. */
  const stopsOf = s => s.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('');
  /**
   * A hair colour set. P = { base, light, glow, dark, deep, line }.
   * front/back: optional gradient stops [[offset, colour]].
   * span [y0, y1]: run the gradient over the whole doll instead of over each
   * shape, so the colours of multi-colour hair line up between the pieces.
   */
  function hairPalette(key, P, front, back, span) {
    const fid = key ? 'hairg-' + key : 'hairg', bid = key ? 'hairb-' + key : 'hairb';
    const dir = span ? ` gradientUnits="userSpaceOnUse" x1="0" y1="${span[0]}" x2="0" y2="${span[1]}"` : ' x1="0" y1="0" x2="0" y2="1"';
    const fs = front || [[0, P.light], [.25, P.light], [.6, P.base], [1, P.dark]];
    const bs = back || [[0, P.base], [.55, P.dark], [1, P.deep]];
    return Object.assign({}, P, {
      fill: () => addDef(fid, `<linearGradient id="${fid}"${dir}>${stopsOf(fs)}</linearGradient>`),
      bfill: () => addDef(bid, `<linearGradient id="${bid}"${dir}>${stopsOf(bs)}</linearGradient>`),
    });
  }
  // Her own hair (the approved brown).
  const BROWN = hairPalette('', HAIR);
  // Rainbow: red at the top of the head down to violet at the tips.
  const RAINBOW = hairPalette('rainbow', { base: '#9f8be0', light: '#ffe36e', glow: '#ffffff', dark: '#7d6bd0', deep: '#5b4a9e', line: '#6d5590' },
    [[0, '#ff8a9a'], [.2, '#ffb562'], [.36, '#ffe36e'], [.52, '#86dc8c'], [.7, '#6cc6f2'], [.86, '#a690f0'], [1, '#d58ae6']],
    [[0, '#ef7088'], [.2, '#f29a4c'], [.36, '#f2cf52'], [.52, '#62c070'], [.7, '#4aa8dc'], [.86, '#8a72dc'], [1, '#bb6ccf']], [62, 380]);
  // Mermaid: sea green at the roots, ocean blue, then violet tips.
  const MERMAID = hairPalette('mermaid', { base: '#3fb8b0', light: '#8fe3d6', glow: '#e6fffa', dark: '#5d7fd0', deep: '#3f3a86', line: '#2f5f78' },
    [[0, '#8fe3d6'], [.3, '#52c7c0'], [.65, '#6a9be0'], [1, '#b07ee0']],
    [[0, '#3fa8a8'], [.5, '#4f78c8'], [1, '#7a55b8']], [60, 540]);
  // Dark chocolate brown (curly cloud).
  const DARK = hairPalette('dark', { base: '#6e4532', light: '#a06e52', glow: '#e0bea2', dark: '#4b2c1f', deep: '#2f1b13', line: '#3b2319' });
  const hairFill = () => BROWN.fill();

  const hp = (d, back = false, pal = BROWN) => `<path d="${d}" fill="${back ? pal.bfill() : pal.fill()}" stroke="${pal.line}" stroke-width="2.4" stroke-linejoin="round"/>` +
    `<path d="${d}" fill="url(#soft-h)" opacity=".55"/>`;
  const strand = (d, w = 2, pal = BROWN) => `<path d="${d}" fill="none" stroke="${pal.deep}" stroke-width="${w}" stroke-linecap="round" opacity=".45"/>`;
  const lstrand = (d, w = 1.8, pal = BROWN) => `<path d="${d}" fill="none" stroke="${pal.glow}" stroke-width="${w}" stroke-linecap="round" opacity=".7"/>`;
  /** Glossy shine: a few light lens shapes following the curve of the head. */
  const shine = (pal = BROWN) => [
    'M146,112 Q156,92 176,84 Q162,96 152,116 Z',
    'M184,79 Q200,74 214,76 Q200,80 186,84 Z',
    'M224,78 Q244,84 256,100 Q240,90 222,84 Z',
  ].map(d => `<path d="${d}" fill="${pal.glow}" opacity=".85"/>`).join('');
  /** Mirror a path drawn on the left side to the right side (absolute x,y pairs only). */
  const mirrorD = d => d.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, (m, x, y) => f(400 - x) + ',' + y);

  // Hair cap with a side-swept fringe, shared by all styles.
  const CAP = 'M122,170 C114,108 150,62 202,62 C254,62 288,106 278,170 C273,146 266,128 254,116 C246,128 230,132 214,124 C204,134 184,138 168,130 C158,140 140,150 122,170 Z';
  const capFront = (pal = BROWN) => hp(CAP, false, pal) +
    strand('M170,74 Q150,96 146,128', 2, pal) + strand('M214,70 Q236,86 250,112', 2, pal) + strand('M168,128 Q186,108 206,90', 1.8, pal) +
    strand('M214,122 Q232,104 244,92', 1.8, pal) + lstrand('M156,124 Q164,104 182,90', 1.8, pal) + lstrand('M236,104 Q246,112 252,122', 1.8, pal) +
    shine(pal);
  // Short back hair that ends at the nape (under braids, ponytail, buns...).
  const NAPE = 'M200,58 C140,58 110,98 110,158 C110,186 118,204 134,214 Q200,240 266,214 C282,204 290,186 290,158 C290,98 260,58 200,58 Z';

  /**
   * Long loose hair (her default style), in any palette.
   * extra: optional markup added inside the back hair and each front lock
   * (used for the coloured extensions).
   */
  const LOOSE_BACK = 'M200,58 C138,58 106,98 106,162 C106,222 98,286 96,338 Q116,356 138,342 Q160,360 182,346 Q200,362 218,346 Q240,360 262,342 Q284,356 304,338 C302,286 294,222 294,162 C294,98 262,58 200,58 Z';
  const LOOSE_LOCK_L = 'M138,128 C120,168 112,236 118,300 Q120,336 136,352 Q146,330 144,298 C140,246 146,186 154,146 Z';
  function looseHair(pal, extra = {}) {
    const backD = LOOSE_BACK;
    const back = `<g class="sway-b">` + hp(backD, true, pal) +
      strand('M128,220 Q120,280 124,330', 2, pal) + strand('M272,220 Q280,280 276,330', 2, pal) + strand('M112,260 Q106,300 110,334', 2, pal) + strand('M288,260 Q294,300 290,334', 2, pal) +
      lstrand('M120,200 Q114,250 118,300', 1.6, pal) + lstrand('M280,200 Q286,250 282,300', 1.6, pal) + (extra.back || '') + `</g>`;
    const lockLD = LOOSE_LOCK_L;
    const lockRD = 'M262,128 C280,168 288,236 282,300 Q280,336 264,352 Q254,330 256,298 C260,246 254,186 246,146 Z';
    const lockL = `<g class="sway-l">` + hp(lockLD, false, pal) + strand('M134,170 Q126,240 132,320', 2, pal) + lstrand('M142,156 Q134,220 138,290', 1.8, pal) + (extra.lockL || '') + `</g>`;
    const lockR = `<g class="sway-r">` + hp(lockRD, false, pal) + strand('M266,170 Q274,240 268,320', 2, pal) + lstrand('M258,156 Q266,220 262,290', 1.8, pal) + (extra.lockR || '') + `</g>`;
    return { back, front: lockL + lockR + capFront(pal) };
  }

  /** One braid segment (a plump oval with a shine on top and a crease below). */
  const braidBump = (x, y, rx, ry, pal = BROWN) => {
    const k = ry / 15;   // the approved braid uses ry 15; offsets scale with it
    return `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}" fill="${pal.fill()}" stroke="${pal.line}" stroke-width="2.2"/>` +
      `<path d="M${f(x - rx * .5)},${f(y - 8 * k)} Q${f(x)},${f(y - 12 * k)} ${f(x + rx * .5)},${f(y - 7 * k)}" fill="none" stroke="${pal.glow}" stroke-width="2.4" stroke-linecap="round" opacity=".8"/>` +
      `<path d="M${f(x - rx * .7)},${f(y + 7 * k)} Q${f(x)},${f(y + 13 * k)} ${f(x + rx * .7)},${f(y + 7 * k)}" fill="none" stroke="${pal.deep}" stroke-width="1.8" stroke-linecap="round" opacity=".45"/>`;
  };
  /** Little ribbon bow (pink by default), centred at x,y. */
  const hairBow = (x, y, c = '#e45a73', dk = '#a8344c', hi = '#f7a6b6', mid = '#f07d92') =>
    `<path d="M${x},${y} l-14,-9 v20z M${x},${y} l14,-9 v20z" fill="${c}" stroke="${dk}" stroke-width="2" stroke-linejoin="round"/>` +
    `<path d="M${x - 11},${y - 5} l6,3 M${x + 11},${y - 5} l-6,3" stroke="${hi}" stroke-width="2" stroke-linecap="round"/>` +
    `<circle cx="${x}" cy="${y}" r="4.5" fill="${mid}" stroke="${dk}" stroke-width="2"/>`;
  /** Scrunchie: a puffy ring seen from the side. */
  const scrunchie = (x, y, rx, ry, c) =>
    `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${c}" stroke="${ink(c)}" stroke-width="2"/>` +
    `<path d="M${x - rx * .6},${y - ry * .2} q${rx * .3},-${ry * .6} ${rx * .6},0 q${rx * .3},-${ry * .6} ${rx * .6},0" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>`;
  /** A bumpy outline through pts: each segment bulges outwards by amt × its length (curls, clouds). */
  const bumpy = (pts, amt) => {
    let d = `M${f(pts[0][0])},${f(pts[0][1])}`;
    for (let i = 0; i < pts.length; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % pts.length];
      const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, dx = x1 - x0, dy = y1 - y0;
      d += `Q${f(mx + dy * amt)},${f(my - dx * amt)} ${f(x1)},${f(y1)}`;
    }
    return d + 'Z';
  };
  /** Small curl spirals scattered over curly hair. */
  const curlMarks = (pts, pal) => pts.map(([x, y], i) =>
    `<path d="M${x},${y} a5,5 0 1 ${i % 2} 8,-3" fill="none" stroke="${i % 3 ? pal.deep : pal.glow}" stroke-width="2" stroke-linecap="round" opacity="${i % 3 ? .45 : .7}"/>`).join('');
  /** One loc (dreadlock): a soft rope from (x0,y0) curving through (cx,cy) to (x1,y1), with a bead near the end. */
  const loc = (x0, y0, cx, cy, x1, y1, w, pal, bead) => {
    const d = `M${x0},${y0} Q${cx},${cy} ${x1},${y1}`;
    const at = t => [(1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x1, (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cy + t * t * y1];
    const [bx, by] = at(.82);
    return `<path d="${d}" fill="none" stroke="${pal.line}" stroke-width="${w + 4}" stroke-linecap="round"/>` +
      `<path d="${d}" fill="none" stroke="${pal.base}" stroke-width="${w}" stroke-linecap="round"/>` +
      `<path d="${d}" fill="none" stroke="${pal.dark}" stroke-width="3" stroke-linecap="round" opacity=".5" transform="translate(${w / 2 - 2.5},0)"/>` +
      `<path d="${d}" fill="none" stroke="${pal.deep}" stroke-width="${w - 6}" stroke-dasharray="1.6 6" opacity=".3"/>` +
      `<path d="${d}" fill="none" stroke="${pal.glow}" stroke-width="2.2" stroke-linecap="round" stroke-dasharray="9 5" opacity=".6" transform="translate(${-w / 4},0)"/>` +
      (bead ? `<ellipse cx="${f(bx)}" cy="${f(by)}" rx="${f(w / 2 + 2.5)}" ry="5" fill="${bead}" stroke="${ink(bead)}" stroke-width="1.6"/>` +
        `<ellipse cx="${f(bx - 2)}" cy="${f(by - 1.5)}" rx="2.4" ry="1.4" fill="#fff" opacity=".8"/>` : '');
  };

  const HAIRSTYLES = {
    loose() { return looseHair(BROWN); },
    braids() {
      const back = hp(NAPE, true);
      const braid = (x, s, cls) => {
        let g = `<g class="${cls}">`;
        for (let i = 0; i < 7; i++) {
          const y = 196 + i * 23, ox = (i % 2 ? 4 : -4) * s, rx = 15 - i * .6;
          g += braidBump(x + ox, y, rx, 15);
        }
        g += `<path d="M${x - 9},364 q9,14 18,0 q-4,22 -9,26 q-5,-4 -9,-26z" fill="${hairFill()}" stroke="${HAIR.line}" stroke-width="2.2"/>`;
        g += `<path d="M${x},357 l-14,-9 v20z M${x},357 l14,-9 v20z" fill="#e45a73" stroke="#a8344c" stroke-width="2" stroke-linejoin="round"/>` +
          `<path d="M${x - 11},${352} l6,3 M${x + 11},${352} l-6,3" stroke="#f7a6b6" stroke-width="2" stroke-linecap="round"/>` +
          `<circle cx="${x}" cy="357" r="4.5" fill="#f07d92" stroke="#a8344c" stroke-width="2"/>`;
        return g + '</g>';
      };
      return { back, front: braid(124, -1, 'sway-l') + braid(276, 1, 'sway-r') + capFront() };
    },
    ponytail() {
      const tailD = 'M262,96 C306,92 322,150 314,214 C308,262 316,300 302,334 Q292,316 290,292 C286,250 292,200 280,150 C274,124 262,110 262,96 Z';
      const back = hp('M200,58 C140,58 110,98 110,158 C110,186 118,204 134,214 Q200,240 266,214 C282,204 290,186 290,158 C290,98 260,58 200,58 Z', true) +
        `<g class="sway-p">` + hp(tailD) + strand('M300,140 Q308,220 300,310') + lstrand('M292,126 Q300,190 296,260') + strand('M286,160 Q292,230 292,290', 1.6) + `</g>`;
      const tie = `<ellipse cx="270" cy="104" rx="11" ry="9" fill="#7ac0e8" stroke="#3e7ea6" stroke-width="2"/><ellipse cx="267" cy="101" rx="4" ry="2.6" fill="#d7f0ff" opacity=".9"/>`;
      return { back, front: capFront() + tie };
    },

    /* ---- Added hairstyles (keys are stored in saved outfits: never rename) ---- */

    /** Rainbow: her long loose hair in rainbow colours, red at the top to violet at the tips. */
    rainbow() { return looseHair(RAINBOW); },

    /** Bob: short hair that ends just under the chin and curls in at the ends. */
    bob() {
      const backD = 'M200,58 C136,58 104,100 106,160 C108,196 108,224 116,246 Q134,258 152,250 L248,250 Q266,258 284,246 C292,224 292,196 294,160 C296,100 264,58 200,58 Z';
      const sideL = 'M132,126 C114,160 110,206 116,238 Q122,254 138,256 Q154,256 162,246 Q146,236 142,212 C138,188 140,160 150,140 Z';
      const side = (d, cls, s) => `<g class="${cls}">` + hp(d) +
        strand(s < 0 ? 'M130,150 Q120,200 132,246' : mirrorD('M130,150 Q120,200 132,246')) +
        lstrand(s < 0 ? 'M140,148 Q132,190 140,232' : mirrorD('M140,148 Q132,190 140,232')) + `</g>`;
      return {
        back: hp(backD, true) + strand('M122,180 Q118,220 126,244') + strand('M278,180 Q282,220 274,244'),
        front: side(sideL, 'sway-l', -1) + side(mirrorD(sideL), 'sway-r', 1) + capFront(),
      };
    },

    /** Extra long: straight hair all the way down past the hands. */
    longest() {
      const backD = 'M200,58 C138,58 106,98 106,162 C106,240 100,330 102,420 C104,500 112,560 120,600 Q140,588 158,604 Q178,590 200,606 Q222,590 242,604 Q260,588 280,600 C288,560 296,500 298,420 C300,330 294,240 294,162 C294,98 262,58 200,58 Z';
      const lockLD = 'M138,128 C120,170 110,250 114,340 C116,400 120,440 130,480 Q144,466 148,440 C144,380 142,300 146,230 C148,190 150,160 154,146 Z';
      const lock = (d, cls, m) => `<g class="${cls}">` + hp(d) +
        strand(m('M134,170 Q122,300 134,460')) + lstrand(m('M142,156 Q132,260 140,420')) + `</g>`;
      const id = d => d;
      return {
        back: `<g class="sway-b">` + hp(backD, true) +
          ['M124,230 Q112,400 126,586', 'M112,300 Q106,450 118,590', 'M140,420 Q138,500 150,596'].map(d => strand(d) + strand(mirrorD(d))).join('') +
          lstrand('M120,220 Q110,360 120,520', 1.6) + lstrand(mirrorD('M120,220 Q110,360 120,520'), 1.6) + `</g>`,
        front: lock(lockLD, 'sway-l', id) + lock(mirrorD(lockLD), 'sway-r', mirrorD) + capFront(),
      };
    },

    /** Mermaid: long wavy hair, sea green to ocean blue to violet, with a shell clip. */
    mermaid() {
      const backD = 'M200,58 C138,58 104,98 104,162 C104,220 94,262 104,300 C114,340 96,380 102,420 C108,460 96,490 108,524 Q126,512 142,528 Q160,512 178,526 Q200,512 222,526 Q240,512 258,528 Q274,512 292,524 C304,490 292,460 298,420 C304,380 286,340 296,300 C306,262 296,220 296,162 C296,98 262,58 200,58 Z';
      const lockLD = 'M138,128 C118,170 128,210 116,250 C104,290 128,330 118,370 C112,400 118,430 132,456 Q148,438 144,410 C142,380 136,350 144,320 C152,290 140,260 148,220 C152,190 150,160 154,146 Z';
      const wave = 'M132,170 C124,210 128,240 122,270 C116,300 132,330 126,370 C122,400 126,420 134,440';
      const lock = (d, cls, m) => `<g class="${cls}">` + hp(d, false, MERMAID) + strand(m(wave), 2, MERMAID) +
        lstrand(m('M144,160 C140,200 144,230 138,260'), 1.8, MERMAID) + `</g>`;
      // shell clip above the left ear: a fan with ridges
      const shell = `<path d="M150,112 L136,94 Q150,84 166,92 Z" fill="#fbd3e0" stroke="#c97a98" stroke-width="2" stroke-linejoin="round"/>` +
        `<path d="M150,112 L141,92 M150,112 L150,88 M150,112 L159,90" stroke="#c97a98" stroke-width="1.4" stroke-linecap="round"/>` +
        `<circle cx="150" cy="111" r="3.4" fill="#fff6fa" stroke="#c97a98" stroke-width="1.4"/>`;
      return {
        back: `<g class="sway-b">` + hp(backD, true, MERMAID) +
          ['M122,220 C110,280 128,330 116,380 C108,430 120,470 124,512', 'M140,380 C134,420 146,470 150,516'].map(d => strand(d, 2, MERMAID) + strand(mirrorD(d), 2, MERMAID)).join('') +
          lstrand('M114,200 C104,260 120,310 110,360', 1.6, MERMAID) + lstrand(mirrorD('M114,200 C104,260 120,310 110,360'), 1.6, MERMAID) + `</g>`,
        front: lock(lockLD, 'sway-l', d => d) + lock(mirrorD(lockLD), 'sway-r', mirrorD) + capFront(MERMAID) + shell,
      };
    },

    /** Extensions: her loose hair with clip-in coloured streaks (pink, lilac, blue, mint) and little clips at the roots. */
    extensions() {
      const COLS = ['#f48cc0', '#a98be0', '#5cc8e8', '#7fdc9a'];
      const clipB = addDef('hx-back', `<clipPath id="hx-back"><path d="${LOOSE_BACK}"/></clipPath>`);
      const clipL = addDef('hx-lockL', `<clipPath id="hx-lockL"><path d="${LOOSE_LOCK_L}"/></clipPath>`);
      const clipR = addDef('hx-lockR', `<clipPath id="hx-lockR"><path d="${mirrorD(LOOSE_LOCK_L)}"/></clipPath>`);
      // a dyed streak inside the hair: colour band, a darker edge strand and a light shine strand
      const streak = (d, c, w) =>
        `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" opacity=".92"/>` +
        `<path d="${d}" fill="none" stroke="${ink(c)}" stroke-width="1.6" stroke-linecap="round" opacity=".45" transform="translate(${w / 2 - 1},0)"/>` +
        `<path d="${d}" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" opacity=".55" transform="translate(${-w / 4},0)"/>`;
      // tiny clip holding a streak in (gold with a gem)
      const hairClip = (x, y, c) => `<rect x="${x - 7}" y="${y - 3.5}" width="14" height="7" rx="3.5" fill="#f6d36a" stroke="#b8862a" stroke-width="1.6"/>` +
        `<circle cx="${x}" cy="${y}" r="2.4" fill="${c}" stroke="${ink(c)}" stroke-width="1"/>`;
      const backS = ['M114,190 Q100,280 110,350', 'M132,220 Q124,290 134,350'];
      const back = `<g clip-path="${clipB}">` + backS.map((d, i) => streak(d, COLS[i], 13) + streak(mirrorD(d), COLS[3 - i], 13)).join('') + `</g>`;
      const front = 'M138,140 Q124,230 130,350', front2 = 'M147,150 Q138,240 141,330';
      return looseHair(BROWN, {
        back,
        lockL: `<g clip-path="${clipL}">` + streak(front, COLS[0], 9) + streak(front2, COLS[2], 6) + `</g>` + hairClip(138, 164, COLS[0]),
        lockR: `<g clip-path="${clipR}">` + streak(mirrorD(front), COLS[1], 9) + streak(mirrorD(front2), COLS[3], 6) + `</g>` + hairClip(262, 164, COLS[1]),
      });
    },

    /** Space buns: two round buns on top of the head with scrunchies. The buns hide under hats. */
    spacebuns(o = {}) {
      const bun = (x, s, c) => {
        const cy = 74;
        return hp(`M${x - 31},${cy} a31,30 0 1 1 62,0 a31,30 0 1 1 -62,0Z`) +
          strand(`M${x - 20},${cy - 4} q10,-16 26,-6 q10,8 0,18`, 2) + strand(`M${x - 14},${cy + 10} q12,8 24,-4`, 1.8) +
          lstrand(`M${x - 18},${cy - 12} q8,-10 20,-8`, 2.2) +
          scrunchie(x + s * 6, cy + 26, 26, 8, c);
      };
      const buns = o.hat ? '' : bun(146, 1, '#f48cc0') + bun(254, -1, '#a98be0');
      return { back: buns + hp(NAPE, true), front: capFront() };
    },

    /** Pigtails: two fluffy bunches above the ears, tied with ribbon bows. */
    pigtails() {
      const tailL = 'M124,116 C98,100 72,124 76,164 C78,196 66,226 78,262 C84,284 100,296 112,286 Q102,272 106,252 Q90,250 96,226 Q108,226 110,206 Q96,196 104,176 Q116,178 118,160 Q108,146 120,134 Z';
      const tail = (d, cls, m) => `<g class="${cls}">` + hp(d) +
        strand(m('M108,130 C88,150 92,200 86,250'), 2) + strand(m('M116,150 C104,180 104,220 98,270'), 1.6) +
        lstrand(m('M98,122 C84,140 82,170 84,196'), 2) + hairBow(m === mirrorD ? 276 : 124, 122) + `</g>`;
      return { back: hp(NAPE, true), front: tail(tailL, 'sway-l', d => d) + tail(mirrorD(tailL), 'sway-r', mirrorD) + capFront() };
    },

    /** Curly cloud: a big round cloud of dark curls with a curly fringe. */
    curls() {
      const ring = [];
      for (let i = 0; i < 22; i++) {
        const a = Math.PI / 2 + i / 22 * Math.PI * 2;
        ring.push([200 + Math.cos(a) * 126, 156 + Math.sin(a) * 120]);
      }
      const back = hp(bumpy(ring, .32), true, DARK) +
        curlMarks([[96, 150], [104, 200], [114, 240], [92, 110], [300, 150], [292, 200], [282, 240], [304, 110], [130, 60], [170, 44], [226, 44], [266, 60], [112, 228], [288, 228]], DARK);
      // fringe: bumpy top following the head, curls along the forehead
      const fringe = bumpy([[122, 172], [116, 136], [126, 104], [148, 80], [176, 66], [200, 62], [226, 66], [252, 80], [274, 104], [284, 136], [278, 172],
        [270, 150], [258, 132], [242, 124], [224, 128], [208, 122], [190, 128], [172, 124], [156, 132], [140, 146], [130, 160]], .22);
      const front = hp(fringe, false, DARK) +
        curlMarks([[142, 96], [168, 80], [196, 74], [222, 78], [250, 92], [138, 128], [264, 122], [182, 102], [214, 100], [234, 108], [160, 112]], DARK) +
        shine(DARK);
      return { back, front };
    },

    /** Locs: rope-like locs falling to the shoulders, with colourful beads. */
    locs() {
      const BEADS = ['#e2464c', '#f7c948', '#4caf6a', '#f48ca0', '#6cc6f2'];
      let back = hp(NAPE, true);
      // locs behind the head, hanging down the back
      for (let i = 0; i < 10; i++) {
        const x = 112 + i * 19.5, out = (x - 200) * .28, y1 = 300 + (i % 3) * 18;
        back += loc(x, 150, x + out, 230, x + out * 1.1, y1, 13, BROWN, i % 2 ? BEADS[(i >> 1) % 5] : '');
      }
      // locs in front, lying over the shoulders
      // roots tucked under the hair cap at the temples; they curve outwards so the face stays free
      const sideL = [[126, 150, 100, 220, 96, 312], [136, 140, 112, 230, 112, 332], [146, 136, 120, 200, 130, 300]];
      const front = (s, m) => sideL.map(([x0, y0, cx, cy, x1, y1], i) => {
        const X = v => m ? 400 - v : v;
        return loc(X(x0), y0, X(cx), cy, X(x1), y1, 13, BROWN, BEADS[(i + (m ? 2 : 0)) % 5]);
      }).join('');
      return { back, front: `<g class="sway-l">${front(0, false)}</g><g class="sway-r">${front(0, true)}</g>` + capFront() };
    },

    /** Side braid: one thick braid over her shoulder, finished with a flower. */
    sidebraid() {
      let braid = '<g class="sway-r">';
      const pts = [];
      for (let i = 0; i < 10; i++) {
        const t = i / 9;
        pts.push([270 - 14 * t - 6 * Math.sin(t * Math.PI), 188 + 210 * t]);
      }
      pts.forEach(([x, y], i) => { braid += braidBump(x + (i % 2 ? 5 : -5), y, 18 - i * .7, 16); });
      const [ex, ey] = pts[9];
      braid += `<path d="M${f(ex - 10)},${f(ey + 10)} q10,14 20,0 q-4,24 -10,28 q-6,-4 -10,-28z" fill="${hairFill()}" stroke="${HAIR.line}" stroke-width="2.2"/>` +
        H.flower(ex, ey + 6, 11, '#f48cc0') + '</g>';
      return { back: hp(NAPE, true), front: braid + capFront() };
    },
  };

  /* ---------------------------------------------------------------
     Doll renderer
     state: { hair: a key of HAIRSTYLES, worn:{slot:itemId}, mood:'smile'|'happy' }
     Returns the inner markup of an <svg viewBox="0 0 400 800">.
     --------------------------------------------------------------- */
  DOLL.renderDoll = function (state = {}) {
    const hairDef = HAIRSTYLES[state.hair] || HAIRSTYLES.loose;
    const hair = hairDef({ hat: !!(state.worn && state.worn.hat) });
    const layers = [];                      // [z, markup]
    layers.push([10, `<g class="hair-back">${hair.back}</g>`]);
    layers.push([20, `<g class="body">${drawBody()}</g>`]);
    layers.push([22, `<g class="face">${drawFace(state.mood)}</g>`]);
    layers.push([41, `<g class="hands">${hand('L', 0)}${hand('R', 0)}</g>`]);
    layers.push([74, `<g class="hair-front">${hair.front}</g>`]);
    layers.push([76, `<g class="ears">${drawEars()}</g>`]);
    const worn = state.worn || {};
    for (const slot in worn) {
      const item = DOLL.byId[worn[slot]];
      if (!item) continue;
      const shp = DOLL.shapes[item.shape], s = SLOTS[shp.slot];
      const out = DOLL.drawItem(item);
      const tag = `data-item="${item.id}"`;
      const sway = shp.sway ? ' sway-' + shp.sway : '';
      if (out.back) layers.push([shp.backZ ?? s.backZ ?? 6, `<g class="piece back${sway}" ${tag}>${out.back}</g>`]);
      if (out.front) layers.push([shp.z ?? s.z, `<g class="piece${sway}" ${tag}>${out.front}</g>`]);
    }
    layers.sort((a, b) => a[0] - b[0]);
    const shadow = `<ellipse cx="200" cy="${G.groundY}" rx="112" ry="18" fill="url(#ground-sh)"/>`;
    return shadow + layers.map(l => l[1]).join('');
  };

  /** Thumbnail svg markup for one item (used in the chest and for loose pieces). */
  DOLL.renderThumb = function (item) {
    const shp = DOLL.shapes[item.shape];
    const box = item.thumb || shp.thumb || SLOTS[shp.slot].thumb;
    const out = DOLL.drawItem(item);
    return `<svg viewBox="${box.join(' ')}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${out.back}${out.front}</svg>`;
  };

  /** Hairstyle "items" so hair can be picked from the chest like clothes. */
  DOLL.hairstyles = Object.keys(HAIRSTYLES);
  DOLL.renderHairThumb = function (style) {
    const h = HAIRSTYLES[style]();
    return `<svg viewBox="70 40 260 340" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${h.back}<g>${drawFace('smile')}</g>${h.front}${drawEars()}</svg>`;
  };

  root.G = G; root.H = H; root.DOLL = DOLL; root.SLOTS = SLOTS; root.CATS = CATS;
  root.PALETTE = { SKIN, HAIR, EYE };
})(typeof window !== 'undefined' ? window : globalThis);
