/* =====================================================================
   Tails – cat tails (slot "tail", behind the body) and a mermaid costume:
   mermaid tail (covers both legs and the feet), seashell tops, starfish /
   shell hair clips, a shell necklace and a little plush fish to hold.
   She asked for these herself.
   Drawing order inside a piece: fill → details → soft shading + tinted outline.
   ===================================================================== */
(function () {
  'use strict';
  const { shade, ink, mix } = H;
  const SW = G.stroke;
  /** Round a number to 1 decimal, as text. */
  const F = v => (Math.round(v * 10) / 10).toString();
  /** "x,y" text of a point, rounded for path strings. */
  const P = p => F(p[0]) + ',' + F(p[1]);

  /** Final pass for a shape: soft shading overlay plus the tinted outline. */
  const outline = (d, base, soft = 'v', sw = SW) =>
    `<path d="${d}" fill="url(#soft-${soft})" stroke="${ink(base)}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"/>`;

  /** Register a linear gradient with [offset, colour] stops (top → bottom by default). Returns url(#id). */
  const addGrad = (id, stops, extra = 'x1="0" y1="0" x2="0" y2="1"') =>
    H.def(id, `<linearGradient id="${id}" ${extra}>${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>`);

  /** Mirror a list of points to the right side of the doll. */
  const mirror = pts => pts.map(([x, y]) => [400 - x, y]);

  /** Little four-point twinkle (sparkle) at x,y with radius r. */
  const twinkle = (x, y, r, c = '#ffffff') =>
    `<path d="M${x},${y - r}Q${x},${y} ${x + r},${y}Q${x},${y} ${x},${y + r}Q${x},${y} ${x - r},${y}Q${x},${y} ${x},${y - r}Z" fill="${c}"/>`;

  /** A round pearl with a white glint. */
  const pearl = (x, y, r, c = '#fff7f0') =>
    `<circle cx="${F(x)}" cy="${F(y)}" r="${r}" fill="${H.grad(c, 'r')}" stroke="${ink(c)}" stroke-width="1"/>` +
    `<circle cx="${F(x - r * .35)}" cy="${F(y - r * .35)}" r="${F(r * .32)}" fill="#fff" opacity=".9"/>`;

  /**
   * Scallop sea shell: a fan with ribs and a wavy top edge, hinge at the bottom.
   * Centre (cx,cy), size r, rotated rot degrees. c = shell colour.
   */
  const shell = (cx, cy, r, c, rot = 0) => {
    const ox = 0, oy = r * .55, R = r * 1.15, n = 5;           // fan centre (local) and radius
    // angle (radians) of the i-th fan ridge on the shell
    const ang = i => (205 + 130 * i / n) * Math.PI / 180;
    // point at angle a and distance rr from the fan centre
    const pt = (a, rr) => [ox + Math.cos(a) * rr, oy + Math.sin(a) * rr];
    let d = `M${P(pt(ang(0), r * .25))}L${P(pt(ang(0), R))}`;
    for (let i = 0; i < n; i++) {                              // one bump per rib gap
      const b = pt(ang(i + 1), R), m = pt((ang(i) + ang(i + 1)) / 2, R * 1.14);
      d += `Q${P(m)} ${P(b)}`;
    }
    d += `L${P(pt(ang(n), r * .25))}Z`;
    const ribs = Array.from({ length: n - 1 }, (_, i) => `M${P(pt(ang(i + 1), r * .3))}L${P(pt(ang(i + 1), R * .96))}`).join('');
    // hinge "ears" at the bottom of the shell
    const hinge = `M${F(-r * .38)},${F(oy - r * .05)}L${F(r * .38)},${F(oy - r * .05)}L${F(r * .22)},${F(oy + r * .28)}L${F(-r * .22)},${F(oy + r * .28)}Z`;
    return `<g transform="translate(${F(cx)},${F(cy)}) rotate(${rot})">` +
      `<path d="${hinge}" fill="${H.grad(shade(c, -.08))}" stroke="${ink(c)}" stroke-width="1.4" stroke-linejoin="round"/>` +
      `<path d="${d}" fill="${H.grad(c, 'r')}" stroke="${ink(c)}" stroke-width="1.6" stroke-linejoin="round"/>` +
      `<path d="${ribs}" stroke="${ink(c)}" stroke-width="1.2" stroke-linecap="round" opacity=".55"/>` +
      `<path d="M${P(pt(ang(1) - .12, R * .82))}Q${P(pt(ang(1.6), R * .95))} ${P(pt(ang(2.3), R * .9))}" fill="none" stroke="#fff" stroke-width="${F(Math.max(1.4, r * .12))}" stroke-linecap="round" opacity=".8"/>` +
      `</g>`;
  };

  /** Soft starfish: five rounded arms, dotted texture and a glint. Centre (cx,cy), radius r. */
  const starfish = (cx, cy, r, c, rot = 0) => {
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const a = (-90 + rot + i * 36) * Math.PI / 180, rr = i % 2 ? r * .5 : r;
      pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
    }
    const d = H.smooth(pts, true, .35);
    // two little dots along each arm
    const dots = [0, 2, 4, 6, 8].map(i => [.45, .72].map(k => {
      const [x, y] = pts[i];
      return `<circle cx="${F(cx + (x - cx) * k)}" cy="${F(cy + (y - cy) * k)}" r="${F(r * .08)}" fill="${shade(c, .5)}"/>`;
    }).join('')).join('');
    return `<path d="${d}" fill="${H.grad(c, 'r')}"/>` + dots +
      `<circle cx="${cx}" cy="${cy}" r="${F(r * .16)}" fill="${shade(c, .35)}"/>` +
      outline(d, c, 'r', 1.7) +
      `<path d="M${F(cx - r * .55)},${F(cy - r * .12)} q${F(r * .1)},${F(-r * .25)} ${F(r * .3)},${F(-r * .3)}" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".85"/>`;
  };

  /* =============================================================
     CAT TAILS
     ============================================================= */

  /**
   * Sample a smooth curve through pts (Catmull-Rom spline).
   * Returns n+1 samples {x, y, tx, ty (direction), nx, ny (normal, to the left of travel)}.
   */
  function spine(pts, n) {
    const seg = pts.length - 1, p = i => pts[Math.max(0, Math.min(seg, i))];
    // point on the smooth curve through pts at position s (0 = first point, seg = last)
    const at = s => {
      const i = Math.min(seg - 1, Math.floor(s)), t = s - i, t2 = t * t, t3 = t2 * t;
      const p0 = p(i - 1), p1 = p(i), p2 = p(i + 1), p3 = p(i + 2);
      return [0, 1].map(k => .5 * (2 * p1[k] + (p2[k] - p0[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (3 * p1[k] - p0[k] - 3 * p2[k] + p3[k]) * t3));
    };
    const out = [];
    for (let j = 0; j <= n; j++) {
      const s = seg * j / n, a = at(Math.max(0, s - .02)), b = at(Math.min(seg, s + .02)), c = at(s);
      const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
      out.push({ x: c[0], y: c[1], tx: dx / l, ty: dy / l, nx: dy / l, ny: -dx / l });
    }
    return out;
  }

  // Centre line of the cat tail: starts behind her lower back (206,446), sweeps down and out
  // behind her right hip, curls up past her hand and ends in a tip that bends outwards (a soft S).
  const CAT_SPINE = [[206, 446], [236, 478], [272, 504], [308, 514], [336, 496], [348, 462], [344, 428], [330, 400], [326, 372], [331, 348], [341, 330]];
  const CAT_N = 48;
  const CAT_S = spine(CAT_SPINE, CAT_N);
  const TIP = .74;                                   // where the fluffy tip begins (0 root … 1 end)
  /** Half-width of the tail at t: slim at the root, a little thicker, then a fluffy bulge at the tip. */
  const catW = t => 10 + 2 * t + (t > .66 ? 6.5 * Math.sin(Math.min(1, (t - .66) / .26) * Math.PI / 2) : 0);

  /**
   * Outline of the tail from sample i0 to the end: left edge out, round cap, right edge back.
   * Fluffy segments (t > TIP) bulge outwards so the tip looks furry. Returns path d.
   */
  function catOutline(i0, extra = 0) {
    const left = [], right = [];
    for (let i = i0; i <= CAT_N; i++) {
      const s = CAT_S[i], w = catW(i / CAT_N) + extra;
      left.push([s.x + s.nx * w, s.y + s.ny * w, i / CAT_N]);
      right.push([s.x - s.nx * w, s.y - s.ny * w, i / CAT_N]);
    }
    // round cap at the end of the tail
    const e = CAT_S[CAT_N], we = catW(1) + extra, a0 = Math.atan2(e.ny, e.nx), cap = [];
    for (let k = 1; k < 8; k++) { const a = a0 + Math.PI * k / 8; cap.push([e.x + Math.cos(a) * we, e.y + Math.sin(a) * we, 1]); }
    const pts = left.concat(cap, right.reverse());
    // fluffy part: every second point only, joined by outward bulges (tufts of fur)
    let d = `M${P(pts[0])}`, i = 1;
    while (i < pts.length) {
      const fluffy = pts[i][2] > TIP && pts[i - 1][2] > TIP - .01;
      if (!fluffy) { d += `L${P(pts[i])}`; i++; continue; }
      const j = Math.min(pts.length - 1, i + 1), a = pts[i - 1], b = pts[j];
      const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1];
      d += `Q${F(mx + dy * .48)},${F(my - dx * .48)} ${P(b)}`;
      i = j + 1;
    }
    return d + 'Z';
  }
  const CAT_D = catOutline(0);

  /**
   * Cat tail. colors: [fur, stripes, tip, bow]
   * it.stripes = draw tabby stripes; it.bow = a ribbon bow tied round the tail.
   */
  DOLL.shape('tl-cat-tail', {
    slot: 'tail',
    sway: 'tail',
    thumb: [230, 296, 158, 236],
    draw(it) {
      const [fur, stripe = shade(it.colors[0], -.3), tip = fur, bowC = '#ef5b8d'] = it.colors;
      const clip = H.clip('c-' + it.id, CAT_D);
      let inner = '';
      // tabby stripes: curved bands across the tail, pointing towards the tip
      if (it.stripes) {
        let sd = '';
        for (let t = .2; t < TIP - .02; t += .075) {
          const s = CAT_S[Math.round(t * CAT_N)], w = catW(t) + 4;
          sd += `M${F(s.x + s.nx * w)},${F(s.y + s.ny * w)}Q${F(s.x + s.tx * 7)},${F(s.y + s.ty * 7)} ${F(s.x - s.nx * w)},${F(s.y - s.ny * w)}`;
        }
        inner += `<path d="${sd}" fill="none" stroke="${stripe}" stroke-width="5" stroke-linecap="round"/>`;
      }
      // the fluffy tip in its own colour, with a furry zigzag where the colours meet
      if (tip !== fur) {
        const i0 = Math.round(TIP * CAT_N) - 1;
        inner += `<path d="${catOutline(i0, 3)}" fill="${H.grad(tip, 'r')}"/>`;
        const s = CAT_S[i0], w = catW(TIP) + 3;
        let z = '';
        for (let k = 0; k <= 6; k++) { const u = 1 - 2 * k / 6, o = k % 2 ? 4 : -1; z += (k ? 'L' : 'M') + F(s.x + s.nx * w * u + s.tx * o) + ',' + F(s.y + s.ny * w * u + s.ty * o); }
        inner += `<path d="${z}" fill="none" stroke="${tip}" stroke-width="5" stroke-linejoin="round"/>`;
      }
      // roundness: a light streak along one side and a shadow along the other
      const along = (k, t0, t1) => 'M' + CAT_S.slice(Math.round(t0 * CAT_N), Math.round(t1 * CAT_N) + 1).map(s => { const w = catW(Math.min(TIP, 1)) * k; return F(s.x + s.nx * w) + ',' + F(s.y + s.ny * w); }).join('L');
      inner += `<path d="${along(-.45, .12, .8)}" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" opacity=".38"/>` +
        `<path d="${along(.62, .1, .7)}" fill="none" stroke="${shade(fur, -.4)}" stroke-width="3.5" stroke-linecap="round" opacity=".28"/>`;
      // little fur flicks on the fluffy tip
      const flicks = [.8, .86, .92].map(t => { const s = CAT_S[Math.round(t * CAT_N)], w = catW(t) * .55;
        return `M${F(s.x + s.nx * w)},${F(s.y + s.ny * w)}l${F(s.tx * 6 + s.nx * 2)},${F(s.ty * 6 + s.ny * 2)}M${F(s.x - s.nx * w)},${F(s.y - s.ny * w)}l${F(s.tx * 6 - s.nx * 2)},${F(s.ty * 6 - s.ny * 2)}`; }).join('');
      inner += H.line(flicks, tip, 1.5, .5);
      let out = `<path d="${CAT_D}" fill="${H.grad(fur, 'r')}"/><g clip-path="${clip}">${inner}</g>` + outline(CAT_D, fur, 'r');
      // ribbon bow tied round the tail (band across + two loops on the outer edge)
      if (it.bow) {
        const s = CAT_S[Math.round(.58 * CAT_N)], w = catW(.58);
        const rot = Math.atan2(s.ty, s.tx) * 180 / Math.PI;
        out += `<g transform="translate(${F(s.x)},${F(s.y)}) rotate(${F(rot + 180)})">` +
          `<rect x="-3.5" y="${F(-w - 1.5)}" width="7" height="${F(2 * w + 3)}" rx="2.5" fill="${H.grad(bowC)}" stroke="${ink(bowC)}" stroke-width="1.6"/>` +
          `<g transform="translate(0,${F(-w - 3)})">` +
            `<path d="M0,0 C-6,-8 -16,-10 -16,-2 C-16,5 -6,4 0,0Z M0,0 C6,-8 16,-10 16,-2 C16,5 6,4 0,0Z" fill="${H.grad(bowC)}" stroke="${ink(bowC)}" stroke-width="1.6" stroke-linejoin="round"/>` +
            `<path d="M-2,2 L-7,12 L-3,11 L-1,14Z M2,2 L7,12 L3,11 L1,14Z" fill="${shade(bowC, -.08)}" stroke="${ink(bowC)}" stroke-width="1.3" stroke-linejoin="round"/>` +
            `<circle r="3.6" fill="${shade(bowC, .2)}" stroke="${ink(bowC)}" stroke-width="1.4"/>` +
            `<path d="M-12,-3 q3,-4 7,-3 M12,-3 q-3,-4 -7,-3" fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round" opacity=".75"/>` +
          `</g></g>`;
      }
      return out;
    },
  });

  /* =============================================================
     MERMAID TAIL (slot bottom, also hides the feet)
     ============================================================= */

  // Left side of the tail, waist to just above the fin. Always outside the leg outline so no skin peeks out.
  const MT_L = [[G.torsoX(398) - 3, 398], [138, 418], [133.5, 440], [132, 470], [134, 510], [139, 555], [144, 600], [148, 640], [152, 670], [155, 692]];
  /** Closed outline of the mermaid tail body: left edge down, across the bottom, mirrored right edge up. */
  const MT_BODY = (() => {
    const l = H.smooth(MT_L, false), r = H.smooth(mirror(MT_L).reverse(), false);
    return l + `Q200,700 ${r.slice(1)}Z`;
  })();
  // The tail fin (left half drawn, right half mirrored): two big wavy lobes resting on the ground.
  const FIN_L = [[200, 680], [160, 682], [140, 700], [116, 720], [96, 740], [86, 756], [104, 756], [122, 748], [144, 754], [164, 746], [184, 740], [200, 733]];
  const FIN_D = H.smooth(FIN_L.concat(mirror(FIN_L.slice(1, -1)).reverse()), true, .4);
  // little frilly fins on the sides at knee height (left drawn, right mirrored)
  const SIDE_FIN = 'M145,586 C128,590 112,606 108,630 C116,624 124,624 130,630 C132,622 140,618 148,620 Z';
  /** Mirror a path string to the right side (x becomes 400 - x). */
  const mirrorD = d => d.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, (m, x, y) => F(400 - x) + ',' + y);

  /**
   * Mermaid tail. colors: [main, deep (scale lines), fin, sparkle]
   * it.rainbow = rainbow body with gold scale lines.
   */
  DOLL.shape('tl-mermaid', {
    slot: 'bottom',
    occupies: ['bottom', 'shoes'],
    thumb: [74, 380, 252, 384],
    draw(it) {
      const [main, deep, fin, spark = '#ffffff'] = it.colors;
      const id = 'tl-' + it.id;
      // body fill: two-tone gradient down the tail, or a rainbow
      const bodyFill = it.rainbow
        ? addGrad(id + '-g', [[0, '#ff8fa8'], [.18, '#ffb36b'], [.36, '#ffe37a'], [.54, '#86dc9a'], [.72, '#6cc6f2'], [.9, '#a690f0'], [1, '#c98ae6']], 'gradientUnits="userSpaceOnUse" x1="0" y1="400" x2="0" y2="710"')
        : addGrad(id + '-g', [[0, shade(main, .18)], [.55, main], [1, mix(main, deep, .45)]]);
      const finFill = addGrad(id + '-f', [[0, shade(fin, -.05)], [.55, fin], [1, shade(fin, .55)]]);
      const clipB = H.clip('c-' + id + '-b', MT_BODY), clipF = H.clip('c-' + id + '-f', FIN_D);
      // fin ribs fanning out from the joint, plus a soft light band
      const ribs = [100, 118, 138, 158, 178, 192].map(x => `M${F(196 - (196 - x) * .12)},692Q${F(x + 10)},716 ${x},752`).join('');
      const fins = `<path d="${FIN_D}" fill="${finFill}"/>` +
        `<g clip-path="${clipF}"><path d="${ribs}${mirrorD(ribs)}" fill="none" stroke="${ink(fin)}" stroke-width="1.6" stroke-linecap="round" opacity=".42"/>` +
        `<path d="M98,744 Q140,722 170,742 M302,744 Q260,722 230,742" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".45"/></g>` +
        outline(FIN_D, fin, 'v');
      // one side fin: fill, a few vein lines and outline (d is the left or the mirrored path)
      const sideFin = d => `<path d="${d}" fill="${finFill}"/>` +
        H.line(d === SIDE_FIN ? 'M140,594 Q124,606 116,624 M144,604 Q132,612 126,626' : mirrorD('M140,594 Q124,606 116,624 M144,604 Q132,612 126,626'), fin, 1.4, .45) + outline(d, fin, 'v', 2.2);
      // scales: a repeating tile of little scallops (every other row shifted half a scale)
      const scaleC = it.rainbow ? '#e0a92a' : deep, pid = 'tl-scales-' + scaleC.slice(1);
      const scales = H.def(pid, `<pattern id="${pid}" width="16" height="22" patternUnits="userSpaceOnUse">` +
        `<path d="M0,0q8,10 16,0M-8,11q8,10 16,0M8,11q8,10 16,0M0,22q8,10 16,0" fill="none" stroke="${scaleC}" stroke-width="1.7" stroke-linecap="round"/></pattern>`);
      // white glints on some of the scales (left half, where the light falls)
      let glints = '';
      for (let y = 418; y < 690; y += 22) for (let x = 144; x < 210; x += 32) glints += `M${x + 4},${y + 3}q4,3.5 8,0`;
      const sparkles = [[160, 470, 4], [236, 520, 5], [176, 600, 4], [222, 650, 3.5], [186, 430, 3]].map(a => twinkle(...a, spark)).join('');
      // waist frill: a row of fin-coloured scallops round the hips
      const wx = G.torsoX(404) - 3, n = 9, w = (400 - 2 * wx) / n;
      let frill = `M${F(wx - 1)},398`;
      for (let i = 0; i < n; i++) frill += `q${F(w / 2)},18 ${F(w)},0`;
      frill += `L${F(400 - wx + 1)},398Q200,404 ${F(wx - 1)},398Z`;
      // joint frill where the tail meets the fin
      let cuff = 'M148,680';
      for (let i = 0; i < 6; i++) cuff += `q8.67,17 17.33,0`;
      cuff += 'Q200,668 148,680Z';
      return sideFin(SIDE_FIN) + sideFin(mirrorD(SIDE_FIN)) + fins +
        `<path d="${MT_BODY}" fill="${bodyFill}"/>` +
        `<g clip-path="${clipB}">` +
          `<rect x="100" y="396" width="200" height="320" fill="${scales}" opacity="${it.rainbow ? .85 : .5}"/>` +
          `<path d="${glints}" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".45"/>` +
          // shine down the left of the tail, shadow down the middle where the legs meet
          `<path d="M146,430 Q136,520 150,640 Q146,540 160,440 Z" fill="url(#shine)" opacity=".6"/>` +
          `<path d="M200,500 Q196,600 200,700" stroke="${shade(main, -.4)}" stroke-width="10" fill="none" opacity=".08"/>` +
        `</g>` + sparkles +
        outline(MT_BODY, it.rainbow ? '#8a72dc' : main, 'h') +
        `<path d="${cuff}" fill="${finFill}"/>` + outline(cuff, fin, 'v', 2) +
        `<path d="${frill}" fill="${finFill}"/>` + outline(frill, fin, 'v', 2);
    },
  });

  /* =============================================================
     SEASHELL TOP (slot top): sleeveless top with two big shells,
     a pearl string along the neckline and a scalloped hem.
     colors: [main, shells, hem, pearls]
     ============================================================= */
  DOLL.shape('tl-shell-top', {
    slot: 'top',
    thumb: [96, 236, 208, 190],
    draw(it) {
      const [main, shellC, hem = shade(it.colors[0], -.12), pearlC = '#fff7f0'] = it.colors;
      const d = G.shirtPath({ sleeve: 0, pad: 2, bottom: 404, neck: 'scoop', neckDepth: 14 });
      const clip = H.clip('c-tl-' + it.id, d);
      // soft wavy water lines across the fabric
      const waves = [330, 358, 386].map(y => `M100,${y}q12,-6 24,0t24,0t24,0t24,0t24,0t24,0t24,0t24,0`).join('');
      // scalloped hem band at the waist
      const wx = G.torsoX(404) - 3, n = 8, w = (400 - 2 * wx) / n;
      let pep = `M${F(wx - 1)},396`;
      pep += `L${F(wx - 1)},402`;
      for (let i = 0; i < n; i++) pep += `q${F(w / 2)},14 ${F(w)},0`;
      pep += `L${F(400 - wx + 1)},396Q200,400 ${F(wx - 1)},396Z`;
      // pearls along the scoop neckline (left computed, right mirrored)
      const neckPearls = Array.from({ length: 4 }, (_, i) => { const t = (i + .5) / 4, x = 175 + 25 * t, y = 252 + 26 * Math.sin(t * Math.PI / 2);
        return pearl(x, y, 3.2, pearlC) + pearl(400 - x, y, 3.2, pearlC); }).join('');
      return `<path d="${d}" fill="${H.grad(main)}"/>` +
        `<g clip-path="${clip}"><path d="${waves}" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".35"/></g>` +
        H.line('M156,328 q6,12 4,26 M244,328 q-6,12 -4,26', main, 1.6, .4) +
        outline(d, main) +
        `<path d="${pep}" fill="${H.grad(hem)}"/>` + outline(pep, hem, 'v', 2) +
        `<path d="M${F(wx + 6)},402 H${F(400 - wx - 6)}" stroke="#fff" stroke-width="2" stroke-dasharray="1 6" stroke-linecap="round" opacity=".7"/>` +
        neckPearls +
        // two big shells over the chest, tilted outwards (the right one mirrors the left)
        shell(178, 318, 19, shellC, -14) + shell(222, 318, 19, shellC, 14) +
        pearl(200, 322, 4.6, pearlC) + twinkle(160, 352, 4) + twinkle(244, 360, 3.5);
    },
  });

  /* =============================================================
     HAIR CLIP (slot hairband): a starfish or a shell above her right
     temple (the mermaid hairstyle has its own shell on the left).
     colors: [main]   it.kind = 'star' | 'shell'
     ============================================================= */
  DOLL.shape('tl-clip', {
    slot: 'hairband',
    thumb: [214, 62, 76, 76],
    draw(it) {
      const c = it.colors[0], [x, y] = [252, 100];
      // the metal clip bar peeking out under the motif
      const bar = `<rect x="${x - 14}" y="${y + 9}" width="28" height="6" rx="3" fill="${H.grad('#e9eef3')}" stroke="${ink('#c9d0d8')}" stroke-width="1.2" transform="rotate(32 ${x} ${y})"/>`;
      const m = it.kind === 'shell' ? shell(x, y - 2, 16, c, 28) + pearl(x + 9, y + 12, 3.2) : starfish(x, y, 17, c, 14) + pearl(x, y, 2.6);
      return bar + m;
    },
  });

  /* =============================================================
     SHELL NECKLACE (slot necklace): a string of pearls with a shell pendant.
     colors: [shell, pearls]
     ============================================================= */
  DOLL.shape('tl-shell-necklace', {
    slot: 'necklace',
    draw(it) {
      const [c, pc = '#fff7f0'] = it.colors;
      // pearls along the same curve as the other necklaces (bezier 181,246 → 200,~280 → 219,246)
      const bz = t => { const u = 1 - t; return [u * u * u * 181 + 3 * u * u * t * 181 + 3 * u * t * t * 219 + t * t * t * 219, u * u * u * 246 + 3 * u * u * t * 292 + 3 * u * t * t * 292 + t * t * t * 246]; };
      const beads = Array.from({ length: 13 }, (_, i) => i === 6 ? '' : pearl(...bz(i / 12), 3.6, pc)).join('');
      return `<path d="M181,246 C181,292 219,292 219,246" fill="none" stroke="#c9c2b8" stroke-width="1.2"/>` + beads +
        shell(200, 292, 12, c, 0);
    },
  });

  /* =============================================================
     PLUSH FISH (slot hold): a round, soft toy fish she holds in her
     right hand, tucked against her side. Head towards her, tail outwards.
     colors: [body, stripes/fins, cheeks]
     ============================================================= */
  DOLL.shape('tl-fish-plush', {
    slot: 'hold',
    thumb: [252, 416, 124, 112],
    draw(it) {
      const [c, c2, cheek = '#f7a6c2'] = it.colors;
      const cx = 306, cy = 474;
      const body = `M${cx - 32},${cy} C${cx - 32},${cy - 22} ${cx - 8},${cy - 26} ${cx + 10},${cy - 18} C${cx + 22},${cy - 12} ${cx + 28},${cy - 6} ${cx + 30},${cy} C${cx + 28},${cy + 6} ${cx + 22},${cy + 13} ${cx + 10},${cy + 18} C${cx - 8},${cy + 26} ${cx - 32},${cy + 22} ${cx - 32},${cy} Z`;
      const tail = `M${cx + 24},${cy} C${cx + 34},${cy - 8} ${cx + 44},${cy - 22} ${cx + 54},${cy - 20} C${cx + 50},${cy - 8} ${cx + 48},${cy + 6} ${cx + 54},${cy + 20} C${cx + 44},${cy + 22} ${cx + 34},${cy + 8} ${cx + 24},${cy} Z`;
      const topFin = `M${cx - 12},${cy - 22} C${cx - 8},${cy - 36} ${cx + 10},${cy - 36} ${cx + 16},${cy - 15} Z`;
      const bc = H.clip('c-tl-' + it.id, body);
      return `<path d="${tail}" fill="${H.grad(c2)}"/>` + H.line(`M${cx + 30},${cy - 2} L${cx + 50},${cy - 14} M${cx + 30},${cy + 2} L${cx + 50},${cy + 14} M${cx + 31},${cy} L${cx + 50},${cy}`, c2, 1.4, .45) + outline(tail, c2) +
        `<path d="${topFin}" fill="${H.grad(c2)}"/>` + outline(topFin, c2) +
        `<path d="${body}" fill="${H.grad(c, 'r')}"/>` +
        // two soft stripes, a stitched seam and a belly highlight
        `<g clip-path="${bc}"><path d="M${cx + 4},${cy - 30} q-8,30 0,60 M${cx + 16},${cy - 30} q-7,30 0,60" fill="none" stroke="${c2}" stroke-width="5"/>` +
        `<ellipse cx="${cx - 8}" cy="${cy + 14}" rx="18" ry="7" fill="#fff" opacity=".35"/></g>` +
        `<path d="M${cx - 28},${cy + 6} Q${cx},${cy + 24} ${cx + 26},${cy + 4}" fill="none" stroke="${ink(c)}" stroke-width="1.2" stroke-dasharray="2.5 3" opacity=".5"/>` +
        outline(body, c, 'r') +
        // little side fin
        `<path d="M${cx - 4},${cy + 4} q8,10 18,6 q-6,-8 -18,-6Z" fill="${H.grad(c2)}" stroke="${ink(c2)}" stroke-width="1.4" stroke-linejoin="round"/>` +
        // big friendly eye, smile and a pink cheek
        `<circle cx="${cx - 18}" cy="${cy - 6}" r="5.6" fill="#2e2a34"/><circle cx="${cx - 16}" cy="${cy - 8}" r="2" fill="#fff"/><circle cx="${cx - 19.5}" cy="${cy - 4}" r="1" fill="#fff"/>` +
        `<path d="M${cx - 29},${cy + 4} q4,4 8,0" fill="none" stroke="${ink(c)}" stroke-width="1.8" stroke-linecap="round"/>` +
        `<ellipse cx="${cx - 12}" cy="${cy + 5}" rx="4.5" ry="3" fill="${cheek}" opacity=".7"/>` +
        twinkle(cx + 2, cy - 12, 3.2);
    },
  });

  /* -------------------------------------------------------------
     Catalog
     ------------------------------------------------------------- */
  DOLL.add([
    // cat tails (match the cat-ear hairbands band-cat and band-cat-ginger)
    { id: 'tail-cat-black', shape: 'tl-cat-tail', cat: 'tail', name: { is: 'Svart kisuskott', en: 'Black cat tail' }, colors: ['#3d3540', '#3d3540', '#ffffff'] },
    { id: 'tail-cat-ginger', shape: 'tl-cat-tail', cat: 'tail', name: { is: 'Rautt kisuskott', en: 'Ginger cat tail' }, colors: ['#f08a3c', '#cf6420', '#fff1dc'], stripes: true },
    { id: 'tail-cat-tabby', shape: 'tl-cat-tail', cat: 'tail', name: { is: 'Bröndótt kisuskott', en: 'Grey tabby cat tail' }, colors: ['#a8a3b0', '#5f5a68', '#5f5a68'], stripes: true },
    { id: 'tail-cat-white', shape: 'tl-cat-tail', cat: 'tail', name: { is: 'Hvítt kisuskott með slaufu', en: 'White cat tail with a bow' }, colors: ['#fbf6f9', '#fbf6f9', '#f7b6cc', '#ef5b8d'], bow: true },
    // mermaid tails
    { id: 'tail-mermaid-sea', shape: 'tl-mermaid', cat: 'tail', name: { is: 'Grænn hafmeyjusporður', en: 'Sea-green mermaid tail' }, colors: ['#2fb5a5', '#1d6f86', '#6fd3e0', '#e6fffa'] },
    { id: 'tail-mermaid-pink', shape: 'tl-mermaid', cat: 'tail', name: { is: 'Bleikur hafmeyjusporður', en: 'Pink mermaid tail' }, colors: ['#f48cc0', '#9a5cc0', '#c3a6f2', '#ffffff'] },
    { id: 'tail-mermaid-rainbow', shape: 'tl-mermaid', cat: 'tail', name: { is: 'Regnbogahafmeyjusporður', en: 'Rainbow mermaid tail' }, colors: ['#9f8be0', '#e0a92a', '#f6cf5e', '#ffffff'], rainbow: true },
    // seashell tops
    { id: 'top-shell-sea', shape: 'tl-shell-top', cat: 'swim', name: { is: 'Grænn skeljatoppur', en: 'Sea-green shell top' }, colors: ['#3cbcae', '#ffc4d2', '#6fd3e0', '#fff7f0'] },
    { id: 'top-shell-pink', shape: 'tl-shell-top', cat: 'swim', name: { is: 'Bleikur skeljatoppur', en: 'Pink shell top' }, colors: ['#f7a0c8', '#d9c8fa', '#c3a6f2', '#fff7f0'] },
    { id: 'top-shell-gold', shape: 'tl-shell-top', cat: 'swim', name: { is: 'Gylltur skeljatoppur', en: 'Gold shell top' }, colors: ['#f6cf5e', '#ffc4d8', '#b39af0', '#fff7f0'] },
    // hair clips
    { id: 'clip-starfish-coral', shape: 'tl-clip', cat: 'hairband', name: { is: 'Krossfiskaspenna', en: 'Starfish hair clip' }, colors: ['#ff8a6b'], kind: 'star' },
    { id: 'clip-starfish-gold', shape: 'tl-clip', cat: 'hairband', name: { is: 'Gyllt krossfiskaspenna', en: 'Gold starfish hair clip' }, colors: ['#f6c544'], kind: 'star' },
    { id: 'clip-shell-pink', shape: 'tl-clip', cat: 'hairband', name: { is: 'Skeljaspenna', en: 'Shell hair clip' }, colors: ['#ffc4d8'], kind: 'shell' },
    // necklace and plush fish
    { id: 'neck-shell-pearls', shape: 'tl-shell-necklace', cat: 'necklace', name: { is: 'Skeljahálsmen', en: 'Shell necklace' }, colors: ['#ffc4d2', '#fff7f0'] },
    { id: 'hold-fish-plush', shape: 'tl-fish-plush', cat: 'hold', name: { is: 'Fiskabangsi', en: 'Plush fish' }, colors: ['#ffb347', '#ff7a6b', '#f7a6c2'] },
    { id: 'hold-fish-plush-blue', shape: 'tl-fish-plush', cat: 'hold', name: { is: 'Blár fiskabangsi', en: 'Blue plush fish' }, colors: ['#7cc8f2', '#b39af0', '#f7a6c2'] },
  ]);

  /* Mermaid costume looks (chest tab "Búningar"). First item = the tile icon (the tail). */
  DOLL.look([
    { id: 'look-mermaid-sea', name: { is: 'Hafmeyja', en: 'Mermaid' }, hair: 'mermaid',
      items: ['tail-mermaid-sea', 'top-shell-sea', 'clip-starfish-coral', 'neck-shell-pearls', 'hold-fish-plush'] },
    { id: 'look-mermaid-pink', name: { is: 'Bleik hafmeyja', en: 'Pink mermaid' }, hair: 'extensions',
      items: ['tail-mermaid-pink', 'top-shell-pink', 'clip-shell-pink', 'neck-shell-pearls', 'hold-fish-plush-blue'] },
    { id: 'look-mermaid-rainbow', name: { is: 'Regnbogahafmeyja', en: 'Rainbow mermaid' }, hair: 'rainbow',
      items: ['tail-mermaid-rainbow', 'top-shell-gold', 'clip-starfish-gold', 'neck-shell-pearls', 'hold-fish-plush'] },
  ]);
})();
