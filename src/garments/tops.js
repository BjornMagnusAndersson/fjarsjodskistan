/* =====================================================================
   Tops, sweaters and jackets.
   Same rules as examples.js: every piece is drawn in doll space
   (viewBox 0 0 400 800) on top of G.shirtPath, so shoulders stay round
   and pieces fit the doll. Left side (x < 200) is computed first and
   mirrored for the right side (x → 400 - x).
   Drawing order inside a piece: fill → details → shading + outline.
   Layer widths (so each layer covers the one below it):
     top      pad 4–5, sleevePad ≤ 5
     sweater  pad 7–8, sleevePad 5
     jacket   pad 10–13, sleevePad 7–9
   ===================================================================== */
(function () {
  'use strict';
  const { shade, ink, mix } = H;
  const SW = G.stroke;

  /* -------------------------------------------------------------
     Shared helpers
     ------------------------------------------------------------- */

  /** Final pass for a shape: soft shading overlay plus the tinted outline (same as examples.js). */
  const outline = (d, base, soft = 'v') =>
    `<path d="${d}" fill="url(#soft-${soft})" stroke="${ink(base)}" stroke-width="${SW}" stroke-linejoin="round" stroke-linecap="round"/>`;

  /** Mirror x for side 'R'. */
  const X = (side, x) => (side === 'L' ? x : 400 - x);
  /** Round a number to 1 decimal, as text. */
  const n1 = v => (Math.round(v * 10) / 10).toString();
  /** "x,y" text of a point, rounded for path strings. */
  const P = p => n1(p[0]) + ',' + n1(p[1]);
  /** Mirror a list of points to the right side. */
  const mirrorPts = pts => pts.map(([x, y]) => [400 - x, y]);

  /** Arm half-width at t (same numbers as core: 17 at the shoulder, 14 at the elbow, 11.5 at the wrist). */
  const hwAt = t => (t <= .5 ? 17 + (14 - 17) * t / .5 : 14 + (11.5 - 14) * (t - .5) / .5);

  /**
   * The two edge points across a sleeve at t on one side: [outer, inner].
   * w = half-width of the sleeve (arm half-width + sleevePad).
   * Computed on the left arm and mirrored for 'R'.
   */
  function across(side, t, w) {
    const p = G.armPoint('L', t), a = G.armPoint('L', Math.max(0, t - .02)), b = G.armPoint('L', Math.min(1, t + .02));
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy);
    const nx = dy / l, ny = -dx / l;                       // normal pointing toward the body
    let outer = [p[0] - nx * w, p[1] - ny * w], inner = [p[0] + nx * w, p[1] + ny * w];
    if (side === 'R') { outer = [400 - outer[0], outer[1]]; inner = [400 - inner[0], inner[1]]; }
    return [outer, inner];
  }

  /** A seam or quilting line across the sleeve at t, bowing slightly down the arm. */
  function seamAcross(side, t, w, bow = 3) {
    const [o, i] = across(side, t, w);
    const p = G.armPoint(side, Math.min(1, t + .03)), c = G.armPoint(side, t);
    const dx = p[0] - c[0], dy = p[1] - c[1], l = Math.hypot(dx, dy) || 1;
    const mid = [(o[0] + i[0]) / 2 + dx / l * bow, (o[1] + i[1]) / 2 + dy / l * bow];
    return `M${P(o)}Q${P(mid)} ${P(i)}`;
  }

  /** Neck point height used by G.shirtPath for a given neck type and pad (to line up collars). */
  const neckY = (neck, pad) => 252 - (neck === 'high' ? 8 : 0) - pad * .3;

  /**
   * Open front: a clip that keeps the left and right front panels and cuts away a gap in the middle,
   * so the layer underneath shows. edge = points of the LEFT front edge from the neck down past the hem.
   * Returns { clip, edges } – clip url and the path of both front edges (for outlining).
   */
  function openFront(id, edge) {
    const e = edge, r = mirrorPts(edge), last = e[e.length - 1];
    const sl = H.smooth(e, false).replace(/^M[^C]*/, ''), sr = H.smooth(r, false).replace(/^M[^C]*/, '');
    const dL = `M0,0L${P([e[0][0], 0])}L${P(e[0])}${sl}L${P([last[0], 900])}L0,900Z`;
    const dR = `M400,0L${P([r[0][0], 0])}L${P(r[0])}${sr}L${P([r[r.length - 1][0], 900])}L400,900Z`;
    return { clip: H.clip('c-' + id + '-open', dL + dR), edges: H.smooth(e, false) + H.smooth(r, false) };
  }

  /** Small round button with a shine and two holes. */
  const button = (x, y, r, c) =>
    `<circle cx="${n1(x)}" cy="${n1(y)}" r="${r}" fill="${H.grad(c, 'r')}" stroke="${ink(c)}" stroke-width="1.4"/>` +
    `<circle cx="${n1(x - r * .3)}" cy="${n1(y)}" r="${(r * .18).toFixed(2)}" fill="${ink(c)}"/><circle cx="${n1(x + r * .3)}" cy="${n1(y)}" r="${(r * .18).toFixed(2)}" fill="${ink(c)}"/>`;

  /** Ribbed band: short parallel lines across a band at the hem (x from 60 to 340), clipped by the caller. */
  const ribLines = (y0, y1, step = 5) => Array.from({ length: Math.ceil(280 / step) }, (_, i) => `M${60 + i * step},${y0}V${y1}`).join('');

  /** Ribbed cuff on one sleeve: a band between t0 and 1 plus little rib lines across it. */
  function ribCuff(side, t0, pad, c) {
    let ribs = '';
    // rib lines run along the arm, spaced evenly across the cuff width
    for (let s = -.8; s <= .81; s += .2) {
      const a = across(side, t0, hwAt(t0) + pad), b = across(side, 1, hwAt(1) + pad);
      const pa = [a[0][0] + (a[1][0] - a[0][0]) * (s + 1) / 2, a[0][1] + (a[1][1] - a[0][1]) * (s + 1) / 2];
      const pb = [b[0][0] + (b[1][0] - b[0][0]) * (s + 1) / 2, b[0][1] + (b[1][1] - b[0][1]) * (s + 1) / 2];
      ribs += `M${P(pa)}L${P(pb)}`;
    }
    return `<path d="${G.armPath(side, t0, 1, pad)}" fill="${H.grad(c)}" stroke="${ink(c)}" stroke-width="1.8" stroke-linejoin="round"/>` +
      `<path d="${ribs}" stroke="${ink(c)}" stroke-width="1.1" opacity=".35"/>`;
  }

  /** Heart path (for chest pictures). */
  const heartD = (cx, cy, r) => `M${cx},${cy + r * .95} C${cx - r * 1.5},${cy + r * .05} ${cx - r * .95},${cy - r * 1.05} ${cx},${cy - r * .38} C${cx + r * .95},${cy - r * 1.05} ${cx + r * 1.5},${cy + r * .05} ${cx},${cy + r * .95} Z`;
  /** Five-point star path. */
  const starD = (cx, cy, r, inner = .48) => {
    let d = '';
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * inner : r; d += (i ? 'L' : 'M') + n1(cx + Math.cos(a) * rr) + ',' + n1(cy + Math.sin(a) * rr); }
    return d + 'Z';
  };
  /** Four-point twinkle (sparkle). */
  const twinkle = (x, y, r, c = '#fff') => `<path d="M${x},${y - r}Q${x},${y} ${x + r},${y}Q${x},${y} ${x},${y + r}Q${x},${y} ${x - r},${y}Q${x},${y} ${x},${y - r}Z" fill="${c}"/>`;

  /* -------------------------------------------------------------
     Chest pictures for the motif tee. Each draws centred on (cx, cy),
     about 70 px tall, with its own outlines.
     ------------------------------------------------------------- */
  const MOTIF = {
    /** Puffin seen from the front: black body, white face and belly, big striped beak, orange feet. */
    puffin(cx, cy) {
      const blk = '#2f2b36', wh = '#fbf8f2', org = '#f2793a', face = '#ece8e4';
      // one little puffin wing (s is -1 for left, +1 for right)
      const wing = s => `<path d="M${cx + s * 21},${cy + 2} Q${cx + s * 31},${cy + 20} ${cx + s * 19},${cy + 36} Q${cx + s * 15},${cy + 18} ${cx + s * 21},${cy + 2}Z" fill="#45404f" stroke="${ink(blk)}" stroke-width="1.4"/>`;
      return `<path d="M${cx - 16},${cy + 38} l7,-6 l7,6 Z M${cx + 2},${cy + 38} l7,-6 l7,6 Z" fill="${org}" stroke="${ink(org)}" stroke-width="1.6" stroke-linejoin="round"/>` +
        // body: black back, white belly
        `<ellipse cx="${cx}" cy="${cy + 13}" rx="22" ry="24" fill="${blk}" stroke="${ink(blk)}" stroke-width="1.8"/>` +
        `<ellipse cx="${cx}" cy="${cy + 19}" rx="14" ry="17" fill="${wh}"/>` + wing(-1) + wing(1) +
        // head: black cap with the pale grey face mask puffins have
        `<ellipse cx="${cx}" cy="${cy - 16}" rx="21" ry="19" fill="${blk}" stroke="${ink(blk)}" stroke-width="1.8"/>` +
        `<path d="M${cx - 18},${cy - 12} Q${cx - 18},${cy - 28} ${cx},${cy - 26} Q${cx + 18},${cy - 28} ${cx + 18},${cy - 12} Q${cx + 14},${cy} ${cx},${cy - 2} Q${cx - 14},${cy} ${cx - 18},${cy - 12}Z" fill="${face}"/>` +
        // eyes with the little dark triangle above and the line behind
        `<circle cx="${cx - 9}" cy="${cy - 17}" r="3.2" fill="${blk}"/><circle cx="${cx + 9}" cy="${cy - 17}" r="3.2" fill="${blk}"/>` +
        `<circle cx="${cx - 8}" cy="${cy - 18.2}" r="1.2" fill="#fff"/><circle cx="${cx + 10}" cy="${cy - 18.2}" r="1.2" fill="#fff"/>` +
        `<path d="M${cx - 13},${cy - 15} q-3,2 -5,1 M${cx + 13},${cy - 15} q3,2 5,1" stroke="#9a948f" stroke-width="1.2" fill="none" stroke-linecap="round"/>` +
        // big triangular beak: grey base band, then orange with yellow stripes
        `<path d="M${cx - 9},${cy - 12} Q${cx},${cy - 15} ${cx + 9},${cy - 12} L${cx + 4},${cy + 6} Q${cx},${cy + 10} ${cx - 4},${cy + 6} Z" fill="${org}" stroke="#a8432a" stroke-width="1.6" stroke-linejoin="round"/>` +
        `<path d="M${cx - 8.6},${cy - 11} Q${cx},${cy - 14} ${cx + 8.6},${cy - 11} L${cx + 7.6},${cy - 7.5} Q${cx},${cy - 10} ${cx - 7.6},${cy - 7.5}Z" fill="#8f8d93"/>` +
        `<path d="M${cx - 6},${cy - 3} Q${cx},${cy - 5.5} ${cx + 6},${cy - 3} M${cx - 4.5},${cy + 2} Q${cx},${cy} ${cx + 4.5},${cy + 2}" stroke="#ffd166" stroke-width="1.8" fill="none" stroke-linecap="round"/>` +
        `<ellipse cx="${cx - 14}" cy="${cy - 7}" rx="3.5" ry="2" fill="#f4a3a8" opacity=".85"/><ellipse cx="${cx + 14}" cy="${cy - 7}" rx="3.5" ry="2" fill="#f4a3a8" opacity=".85"/>`;
    },
    /** Unicorn face: white head, golden horn, rainbow mane, sleepy happy eyes. */
    unicorn(cx, cy) {
      const wh = '#fffafc', line = '#b48aa6';
      const mane = [['#f59ac0', -20, -12, 10], ['#b99af0', -24, 2, 9], ['#8fd0f2', -22, 15, 8], ['#f59ac0', 20, -12, 10], ['#b99af0', 24, 2, 9], ['#8fd0f2', 22, 15, 8]]
        .map(([c, dx, dy, r]) => `<circle cx="${cx + dx}" cy="${cy + dy}" r="${r}" fill="${c}" stroke="${ink(c)}" stroke-width="1.4"/>`).join('');
      // one unicorn ear with pink inside (s is -1 for left, +1 for right)
      const ear = s => `<path d="M${cx + s * 10},${cy - 16} L${cx + s * 19},${cy - 32} L${cx + s * 21},${cy - 12}Z" fill="${wh}" stroke="${line}" stroke-width="1.6" stroke-linejoin="round"/>` +
        `<path d="M${cx + s * 13},${cy - 17} L${cx + s * 18.5},${cy - 27} L${cx + s * 19.5},${cy - 15}Z" fill="#f7bfd2"/>`;
      return mane + ear(-1) + ear(1) +
        `<ellipse cx="${cx}" cy="${cy + 6}" rx="20" ry="24" fill="${wh}" stroke="${line}" stroke-width="1.8"/>` +
        // soft muzzle blush and two small nostril curves (no snout outline, so it doesn't read as a pig)
        `<ellipse cx="${cx}" cy="${cy + 21}" rx="13" ry="8" fill="#fbdde8"/>` +
        `<path d="M${cx - 6},${cy + 20} q1.5,-2 3,0 M${cx + 3},${cy + 20} q1.5,-2 3,0 M${cx - 4},${cy + 26} q4,2.5 8,0" stroke="${line}" stroke-width="1.4" fill="none" stroke-linecap="round"/>` +
        // horn with spiral lines
        `<path d="M${cx - 6},${cy - 16} L${cx},${cy - 44} L${cx + 6},${cy - 16}Z" fill="#f6cf5a" stroke="#c39a2c" stroke-width="1.6" stroke-linejoin="round"/>` +
        `<path d="M${cx - 4.6},${cy - 22} l9,-3 M${cx - 3.4},${cy - 29} l6.6,-2.4 M${cx - 2},${cy - 36} l4,-1.6" stroke="#c39a2c" stroke-width="1.3" stroke-linecap="round"/>` +
        // forelock
        `<path d="M${cx - 12},${cy - 14} Q${cx - 4},${cy - 24} ${cx + 6},${cy - 16} Q${cx},${cy - 6} ${cx - 12},${cy - 14}Z" fill="#f59ac0" stroke="${ink('#f59ac0')}" stroke-width="1.4"/>` +
        // closed happy eyes with lashes, cheeks
        `<path d="M${cx - 13},${cy + 2} Q${cx - 8},${cy + 7} ${cx - 3},${cy + 2} M${cx + 3},${cy + 2} Q${cx + 8},${cy + 7} ${cx + 13},${cy + 2}" stroke="#5a3d55" stroke-width="2" fill="none" stroke-linecap="round"/>` +
        `<path d="M${cx - 13},${cy + 2} l-3,-2 M${cx + 13},${cy + 2} l3,-2" stroke="#5a3d55" stroke-width="1.6" stroke-linecap="round"/>` +
        `<ellipse cx="${cx - 13}" cy="${cy + 10}" rx="4" ry="2.4" fill="#f4a3b8" opacity=".85"/><ellipse cx="${cx + 13}" cy="${cy + 10}" rx="4" ry="2.4" fill="#f4a3b8" opacity=".85"/>`;
    },
    /** Big shiny heart. */
    heart(cx, cy, c = '#ef5b7b') {
      const d = heartD(cx, cy + 4, 30);
      return `<path d="${d}" fill="${H.grad(c, 'r')}" stroke="${ink(c)}" stroke-width="2"/>` +
        `<path d="M${cx - 24},${cy - 4} Q${cx - 22},${cy - 18} ${cx - 10},${cy - 18}" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".8"/>` +
        twinkle(cx + 32, cy - 22, 6) + twinkle(cx - 34, cy + 22, 4);
    },
    /** Rainbow arc with two clouds. */
    rainbow(cx, cy) {
      const cols = ['#ef6f6c', '#f6a65a', '#f7d660', '#7fcf8a', '#6fb3e6', '#a58be0'];
      let s = '';
      cols.forEach((c, i) => { const r = 34 - i * 5; s += `<path d="M${cx - r},${cy + 14} A${r},${r} 0 0 1 ${cx + r},${cy + 14}" fill="none" stroke="${c}" stroke-width="5.4"/>`; });
      s += `<path d="M${cx - 36.7},${cy + 14} A36.7,36.7 0 0 1 ${cx + 36.7},${cy + 14} M${cx - 6.3},${cy + 14} A6.3,6.3 0 0 1 ${cx + 6.3},${cy + 14}" fill="none" stroke="#9a7aa8" stroke-width="1.2" opacity=".6"/>`;
      // small white cloud at the foot of the rainbow, centred on x
      const cloud = x => `<path d="M${x - 14},${cy + 22} a7,7 0 0 1 3,-12 a9,9 0 0 1 16,-3 a7,7 0 0 1 10,8 a6,6 0 0 1 -1,7 Z" fill="#fff" stroke="#a9bfd6" stroke-width="1.6" stroke-linejoin="round"/>`;
      return s + cloud(cx - 30) + cloud(cx + 28);
    },
    /** Big strawberry with seeds and a leafy top. */
    strawberry(cx, cy) {
      const r = 30, red = '#e8475a';
      const body = `M${cx},${cy + r * 1.1} C${cx - r * 1.2},${cy + r * .3} ${cx - r * 1.1},${cy - r * .6} ${cx},${cy - r * .5} C${cx + r * 1.1},${cy - r * .6} ${cx + r * 1.2},${cy + r * .3} ${cx},${cy + r * 1.1}Z`;
      let seeds = '';
      [[-12, -4], [0, -6], [12, -4], [-16, 8], [-5, 6], [6, 8], [16, 6], [-9, 18], [3, 20], [12, 16], [-2, 30], [-14, -12], [14, -12]].forEach(([dx, dy]) => {
        seeds += `<ellipse cx="${cx + dx}" cy="${cy + dy}" rx="1.4" ry="2.2" fill="#ffe08a"/>`;
      });
      const leaves = `<path d="M${cx - 18},${cy - 16} L${cx - 6},${cy - 10} L${cx},${cy - 22} L${cx + 6},${cy - 10} L${cx + 18},${cy - 16} L${cx + 8},${cy - 4} L${cx},${cy - 8} L${cx - 8},${cy - 4}Z" fill="#5bb766" stroke="#2f7a3c" stroke-width="1.6" stroke-linejoin="round"/>` +
        `<path d="M${cx},${cy - 20} q1,-8 5,-12" stroke="#2f7a3c" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
      return `<path d="${body}" fill="${H.grad(red, 'r')}" stroke="${ink(red)}" stroke-width="2"/>` + seeds + leaves +
        `<path d="M${cx - 20},${cy + 4} Q${cx - 18},${cy + 16} ${cx - 10},${cy + 24}" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".55"/>`;
    },
    /** Big golden star with a shine and little sparkles. */
    star(cx, cy, c = '#f6c946') {
      const d = starD(cx, cy + 2, 36, .5);
      return `<path d="${d}" fill="${H.grad(c, 'r')}" stroke="${ink(c)}" stroke-width="2.2" stroke-linejoin="round"/>` +
        `<path d="M${cx - 5},${cy - 18} L${cx - 3},${cy - 13}" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".75"/>` +
        twinkle(cx + 34, cy - 26, 6) + twinkle(cx - 36, cy - 18, 4.5) + twinkle(cx + 30, cy + 30, 4);
    },
  };

  /* =============================================================
     TOPS (slot 'top')
     ============================================================= */

  /* -------------------------------------------------------------
     Long-sleeve top. colors: [body, pattern colour, cuffs/collar]
     it.raglan: sleeves in colors[3] (baseball style)
     ------------------------------------------------------------- */
  DOLL.shape('tops-long', {
    slot: 'top',
    draw(it) {
      const c = it.colors[0], trim = it.colors[2] || shade(c, -.12);
      const d = G.shirtPath({ sleeve: 1, pad: 4, sleevePad: 3, bottom: 448, neck: 'round' });
      let raglan = '';
      if (it.raglan) {
        // sleeve colour: everything outside the seam line from the neck to the armpit
        const rc = it.colors[3];
        const clip = H.clip('c-' + it.id, d);
        // raglan sleeve area on one side (side L or R)
        const reg = side => H.polyPath([[X(side, 186), 230], [X(side, 186), 252], [X(side, 150), 314], [X(side, 140), 332], [X(side, 120), 480], [X(side, 0), 480], [X(side, 0), 230]]);
        raglan = `<g clip-path="${clip}"><path d="${reg('L')}${reg('R')}" fill="${H.grad(rc)}"/></g>` +
          H.line('M185,253 L150,314 M215,253 L250,314', rc, 1.8, .6);
      }
      return `<path d="${d}" fill="${H.fill(it)}"/>` + raglan +
        ribCuff('L', .9, 3.4, trim) + ribCuff('R', .9, 3.4, trim) +
        `<path d="M183,250.5 Q200,270.5 217,250.5" fill="none" stroke="${trim}" stroke-width="7" stroke-linecap="round"/>` +
        `<path d="M184,254 Q200,272 216,254" fill="none" stroke="${ink(c)}" stroke-width="1.4" opacity=".5"/>` +
        // folds: armpits, elbows, hem
        H.line('M151,322 q7,12 4,26 M249,322 q-7,12 -4,26 M176,428 q4,8 2,15 M226,426 q-3,9 -1,16', c, 1.8, .45) +
        H.line('M104,362 q8,4 14,0 M296,362 q-8,4 -14,0', c, 1.6, .4) +
        outline(d, c);
    },
  });

  /* -------------------------------------------------------------
     T-shirt with a big chest picture (it.motif: puffin, unicorn, heart,
     rainbow, strawberry, star). colors: [body, -, sleeve hems/collar]
     ------------------------------------------------------------- */
  DOLL.shape('tops-motif', {
    slot: 'top',
    draw(it) {
      const c = it.colors[0], trim = it.colors[2] || shade(c, -.12);
      const d = G.shirtPath({ sleeve: .3, pad: 5, bottom: 448, neck: 'round' });
      const pic = (MOTIF[it.motif] || MOTIF.heart)(200, 338);
      return `<path d="${d}" fill="${H.grad(c)}"/>` +
        `<path d="${G.armPath('L', .25, .3, 5.5)}" fill="${trim}"/><path d="${G.armPath('R', .25, .3, 5.5)}" fill="${trim}"/>` +
        `<path d="M183,250.5 Q200,270.5 217,250.5" fill="none" stroke="${trim}" stroke-width="7" stroke-linecap="round"/>` +
        `<path d="M184,254 Q200,272 216,254" fill="none" stroke="${ink(c)}" stroke-width="1.4" opacity=".5"/>` +
        H.line('M151,322 q7,12 4,26 M249,322 q-7,12 -4,26 M176,428 q4,8 2,15 M226,426 q-3,9 -1,16', c, 1.8, .45) +
        outline(d, c) + pic;
    },
  });

  /* -------------------------------------------------------------
     Blouse with a round (Peter Pan) collar and a button placket.
     colors: [body, pattern colour, collar, buttons]; it.sleeve .3 or 1
     ------------------------------------------------------------- */
  DOLL.shape('tops-blouse', {
    slot: 'top',
    draw(it) {
      const c = it.colors[0], col = it.colors[2] || '#ffffff', btn = it.colors[3] || '#f4b8c8';
      const sleeve = it.sleeve || .3;
      const d = G.shirtPath({ sleeve, pad: 5, sleevePad: sleeve > .5 ? 3.5 : 5, sleeveFlare: sleeve > .5 ? 0 : 2, bottom: 450, neck: 'round' });
      // round collar lobe on the left, mirrored on the right
      const lobe = side => H.smooth([[X(side, 199.5), 262], [X(side, 186), 252], [X(side, 172), 254], [X(side, 165), 262], [X(side, 170), 274], [X(side, 184), 279], [X(side, 197), 272]]);
      const cuffs = sleeve > .5
        ? `<path d="${G.armPath('L', .88, 1, 4)}${G.armPath('R', .88, 1, 4)}" fill="${H.grad(col)}" stroke="${ink(c)}" stroke-width="1.8" stroke-linejoin="round"/>`
        : `<path d="${G.armPath('L', .24, .3, 7.2)}${G.armPath('R', .24, .3, 7.2)}" fill="${H.grad(col)}" stroke="${ink(c)}" stroke-width="1.6" stroke-linejoin="round"/>`;
      const buttons = [304, 336, 368, 400, 432].map(y => button(200, y, 3.6, btn)).join('');
      return `<path d="${d}" fill="${H.fill(it)}"/>` +
        // placket: two stitched lines down the front
        H.line('M194,276 V450 M206,276 V450', c, 1.4, .5) +
        H.line('M151,322 q7,12 4,26 M249,322 q-7,12 -4,26 M174,430 q4,8 2,14 M228,428 q-3,9 -1,16', c, 1.8, .4) +
        cuffs + outline(d, c) +
        `<path d="${lobe('L')}${lobe('R')}" fill="${H.grad(col)}" stroke="${ink(col === '#ffffff' ? c : col)}" stroke-width="2" stroke-linejoin="round"/>` +
        `<path d="M176,258 Q172,268 180,277 M224,258 Q228,268 220,277" stroke="${shade(col, -.15)}" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-dasharray="2 3"/>` +
        buttons;
    },
  });

  /* -------------------------------------------------------------
     Blouse with frilly shoulders: flutter sleeves in two scalloped tiers.
     colors: [body, pattern colour, frill]
     ------------------------------------------------------------- */
  DOLL.shape('tops-frill', {
    slot: 'top',
    draw(it) {
      const c = it.colors[0], fr = it.colors[2] || shade(c, .35);
      const d = G.shirtPath({ sleeve: 0, pad: 4, bottom: 448, neck: 'scoop', neckDepth: 18 });
      /** One flutter tier on the left arm: from the shoulder top down to t, flaring, with a scalloped edge; mirrored for R. */
      const tier = (side, t, flare) => {
        const top = [[160, 256], [150, 260], [140, 266]];          // along the shoulder
        const [o, i] = across('L', t, hwAt(t) + 4 + flare);
        // scallops along the hem from outer to inner
        const n = 4, pts = [];
        for (let k = 0; k <= n; k++) pts.push([o[0] + (i[0] - o[0]) * k / n, o[1] + (i[1] - o[1]) * k / n]);
        let dd = `M${P(top[0])}Q${P([137, 264])} ${P([o[0] + 3, o[1] - 20])}L${P(o)}`;
        for (let k = 1; k <= n; k++) {
          const a = pts[k - 1], b = pts[k], m = [(a[0] + b[0]) / 2 + 2.5, (a[1] + b[1]) / 2 + 7];
          dd += `Q${P(m)} ${P(b)}`;
        }
        dd += `Q${P([i[0] + 6, i[1] - 18])} ${P([150, 300])}Q${P([152, 276])} ${P(top[0])}Z`;
        if (side === 'R') dd = dd.replace(/(-?\d+\.?\d*),(-?\d+\.?\d*)/g, (m, x, y) => n1(400 - parseFloat(x)) + ',' + y);
        return dd;
      };
      // the two stacked frills on one sleeve (side L or R)
      const frills = side => {
        const a = tier(side, .3, -.5), b = tier(side, .2, -2);   // widths kept inside a sweater sleeve
        return `<path d="${a}" fill="${H.grad(shade(fr, -.08))}"/>` + outline(a, shade(fr, -.1), 'h') +
          `<path d="${b}" fill="${H.grad(fr)}"/>` + outline(b, shade(fr, -.1), 'h');
      };
      return `<path d="${d}" fill="${H.fill(it)}"/>` +
        `<path d="M177,262 Q200,300 223,262" fill="none" stroke="${fr}" stroke-width="5" stroke-linecap="round"/>` +
        H.line('M176,428 q4,8 2,15 M226,426 q-3,9 -1,16 M186,300 q-2,30 0,60 M214,300 q2,30 0,60', c, 1.6, .35) +
        outline(d, c) + frills('L') + frills('R') +
        // small bow at the neckline
        `<path d="M200,292 l-10,-6 v12z M200,292 l10,-6 v12z" fill="${fr}" stroke="${ink(fr)}" stroke-width="1.5" stroke-linejoin="round"/><circle cx="200" cy="292" r="3" fill="${shade(fr, .3)}" stroke="${ink(fr)}" stroke-width="1.3"/>`;
    },
  });

  /* -------------------------------------------------------------
     Tank top with a ruffled hem and a little bow.
     colors: [body, pattern colour, trim]
     ------------------------------------------------------------- */
  DOLL.shape('tops-tank', {
    slot: 'top',
    draw(it) {
      const c = it.colors[0], trim = it.colors[2] || '#ffffff';
      const d = G.shirtPath({ sleeve: 0, pad: 3, bottom: 440, neck: 'scoop', neckDepth: 20 });
      // ruffle: a row of scallops just below the hem
      const x0 = G.torsoX(440) - 3, x1 = 400 - x0, n = 9, w = (x1 - x0) / n;
      let ruf = `M${n1(x0 - 2)},440`;
      for (let k = 0; k < n; k++) ruf += `q${n1((w + .45) / 2)},18 ${n1(w + .45)},0`;
      ruf += `L${n1(x1)},430L${n1(x0)},430Z`;
      return `<path d="${ruf}" fill="${H.grad(trim)}"/>` + outline(ruf, trim) +
        `<path d="${d}" fill="${H.fill(it)}"/>` +
        // trim along the armholes and neckline
        `<path d="M160,257 Q145,262 140,276 Q137,296 145,312 M240,257 Q255,262 260,276 Q263,296 255,312" fill="none" stroke="${trim}" stroke-width="4" stroke-linecap="round"/>` +
        `<path d="M182,252 Q200,294 218,252" fill="none" stroke="${trim}" stroke-width="4" stroke-linecap="round"/>` +
        H.line('M176,420 q4,8 2,14 M226,418 q-3,9 -1,16', c, 1.6, .4) +
        outline(d, c) +
        `<path d="M200,284 l-9,-6 v12z M200,284 l9,-6 v12z" fill="${trim}" stroke="${ink(trim === '#ffffff' ? c : trim)}" stroke-width="1.5" stroke-linejoin="round"/><circle cx="200" cy="284" r="2.8" fill="${trim}" stroke="${ink(trim === '#ffffff' ? c : trim)}" stroke-width="1.3"/>`;
    },
  });

  /* -------------------------------------------------------------
     Sailor top: big square sailor collar with stripes and a tied scarf.
     colors: [body, collar, stripe, scarf]
     ------------------------------------------------------------- */
  DOLL.shape('tops-sailor', {
    slot: 'top',
    draw(it) {
      const [c, col, stripe, scarf] = it.colors;
      const d = G.shirtPath({ sleeve: .3, pad: 5, bottom: 448, neck: 'v', neckDepth: 44 });
      const ny = neckY('v', 5);
      // left collar flap: from the neck out over the shoulder and down to the V point; mirrored
      const flap = side => H.polyPath([[X(side, 183), ny], [X(side, 160), 257], [X(side, 147), 266], [X(side, 158), 290], [X(side, 200), ny + 46], [X(side, 200), ny + 44]]);
      // two sailor stripes on one collar flap (side L or R)
      const stripes = side => `M${X(side, 151)},270 L${X(side, 163)},288 L${X(side, 196)},${ny + 40}M${X(side, 155)},266 L${X(side, 165)},282 L${X(side, 196)},${ny + 34}`;
      const knot = `<path d="M200,${ny + 46} l-14,26 l8,2 l6,-14 l6,14 l8,-2 Z" fill="${H.grad(scarf)}" stroke="${ink(scarf)}" stroke-width="1.8" stroke-linejoin="round"/>` +
        `<ellipse cx="200" cy="${ny + 46}" rx="7" ry="6" fill="${H.grad(scarf, 'r')}" stroke="${ink(scarf)}" stroke-width="1.8"/>`;
      return `<path d="${d}" fill="${H.fill(it)}"/>` +
        `<path d="${G.armPath('L', .22, .3, 5.6)}${G.armPath('R', .22, .3, 5.6)}" fill="${col}"/>` +
        `<path d="${seamAcross('L', .25, hwAt(.25) + 5.6, 1)}${seamAcross('R', .25, hwAt(.25) + 5.6, 1)}" stroke="${stripe}" stroke-width="2" fill="none"/>` +
        H.line('M151,322 q7,12 4,26 M249,322 q-7,12 -4,26 M176,428 q4,8 2,15 M226,426 q-3,9 -1,16', c, 1.8, .4) +
        outline(d, c) +
        `<path d="${flap('L')}${flap('R')}" fill="${H.grad(col)}" stroke="${ink(col)}" stroke-width="2.2" stroke-linejoin="round"/>` +
        `<path d="${stripes('L')}${stripes('R')}" stroke="${stripe}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` +
        knot;
    },
  });

  /* -------------------------------------------------------------
     Polo shirt: pointed collar, short placket with two buttons.
     colors: [body, pattern colour, collar/trim]
     ------------------------------------------------------------- */
  DOLL.shape('tops-polo', {
    slot: 'top',
    draw(it) {
      const c = it.colors[0], col = it.colors[2] || '#ffffff';
      const d = G.shirtPath({ sleeve: .3, pad: 5, bottom: 448, neck: 'round' });
      // pointed collar on the left, mirrored
      const flap = side => H.polyPath([[X(side, 200), 266], [X(side, 186), 248], [X(side, 178), 250], [X(side, 166), 260], [X(side, 178), 286]]);
      return `<path d="${d}" fill="${H.fill(it)}"/>` +
        `<path d="${G.armPath('L', .24, .3, 5.6)}${G.armPath('R', .24, .3, 5.6)}" fill="${col}"/>` +
        `<rect x="193" y="258" width="14" height="52" rx="3" fill="${H.grad(shade(c, -.04))}" stroke="${ink(c)}" stroke-width="1.6"/>` +
        button(200, 280, 3.2, '#ffffff') + button(200, 298, 3.2, '#ffffff') +
        H.line('M151,322 q7,12 4,26 M249,322 q-7,12 -4,26 M176,428 q4,8 2,15 M226,426 q-3,9 -1,16', c, 1.8, .4) +
        outline(d, c) +
        `<path d="${flap('L')}${flap('R')}" fill="${H.grad(col)}" stroke="${ink(col === '#ffffff' ? c : col)}" stroke-width="2" stroke-linejoin="round"/>`;
    },
  });

  DOLL.add([
    // T-shirts (reuse the approved 'tee' shape)
    { id: 'tee-hearts', shape: 'tee', cat: 'top', name: { is: 'Hjartabolur', en: 'Hearts tee' }, colors: ['#ffe3ec', '#f2668b', '#f48ca0'], pattern: 'hearts', patternSize: 28 },
    { id: 'tee-stars', shape: 'tee', cat: 'top', name: { is: 'Stjörnubolur', en: 'Stars tee' }, colors: ['#3e5fa8', '#ffd75a', '#2c467f'], pattern: 'stars', patternSize: 30 },
    { id: 'tee-stripes', shape: 'tee', cat: 'top', name: { is: 'Röndóttur bolur', en: 'Striped tee' }, colors: ['#ffffff', '#5aa0dc', '#e2505b'], pattern: 'hstripes', patternSize: 18 },
    { id: 'tee-rainbow', shape: 'tee', cat: 'top', name: { is: 'Regnbogabolur', en: 'Rainbow tee' }, colors: ['#ffffff', '#ffffff', '#ffffff'], pattern: 'rainbow', patternSize: 72 },
    { id: 'tee-flowers', shape: 'tee', cat: 'top', name: { is: 'Blómabolur', en: 'Flower tee' }, colors: ['#e3f4dc', '#f08ab0', '#7fbf7a'], pattern: 'flowers', patternSize: 30 },
    { id: 'tee-dots', shape: 'tee', cat: 'top', name: { is: 'Doppóttur bolur', en: 'Polka dot tee' }, colors: ['#f6c636', '#ffffff', '#e39b2a'], pattern: 'dots', patternSize: 20 },
    { id: 'tee-lilac', shape: 'tee', cat: 'top', name: { is: 'Fjólublár bolur', en: 'Lilac tee' }, colors: ['#c9b5f0', '#c9b5f0', '#a58be0'] },
    // Long-sleeve tops
    { id: 'top-long-stripes', shape: 'tops-long', cat: 'top', name: { is: 'Langermabolur með röndum', en: 'Striped long-sleeve top' }, colors: ['#fff6ea', '#e2505b', '#e2505b'], pattern: 'hstripes', patternSize: 16 },
    { id: 'top-long-mint', shape: 'tops-long', cat: 'top', name: { is: 'Myntugrænn langermabolur', en: 'Mint long-sleeve top' }, colors: ['#a8e2cf', '#a8e2cf', '#ffffff'] },
    { id: 'top-long-hearts', shape: 'tops-long', cat: 'top', name: { is: 'Bleikur hjartabolur', en: 'Pink hearts long-sleeve top' }, colors: ['#f6b2c8', '#ffffff', '#e7799c'], pattern: 'hearts', patternSize: 24 },
    { id: 'top-long-raglan', shape: 'tops-long', cat: 'top', name: { is: 'Hafnaboltabolur', en: 'Two-colour long-sleeve top' }, colors: ['#ffffff', '#ffffff', '#3e5fa8', '#5f86cc'], raglan: true },
    // Tees with a big chest picture
    { id: 'tee-puffin', shape: 'tops-motif', cat: 'top', name: { is: 'Lundabolur', en: 'Puffin tee' }, colors: ['#9fd3f0', '#9fd3f0', '#6fb3e6'], motif: 'puffin' },
    { id: 'tee-unicorn', shape: 'tops-motif', cat: 'top', name: { is: 'Einhyrningsbolur', en: 'Unicorn tee' }, colors: ['#d9c6f6', '#d9c6f6', '#b59ae8'], motif: 'unicorn' },
    { id: 'tee-bigheart', shape: 'tops-motif', cat: 'top', name: { is: 'Bolur með stóru hjarta', en: 'Big heart tee' }, colors: ['#ffffff', '#ffffff', '#ef5b7b'], motif: 'heart' },
    { id: 'tee-bigrainbow', shape: 'tops-motif', cat: 'top', name: { is: 'Bolur með regnboga', en: 'Rainbow picture tee' }, colors: ['#bfe6f7', '#bfe6f7', '#8ccbe9'], motif: 'rainbow' },
    { id: 'tee-bigberry', shape: 'tops-motif', cat: 'top', name: { is: 'Bolur með jarðarberi', en: 'Strawberry picture tee' }, colors: ['#fde2e7', '#fde2e7', '#7fbf7a'], motif: 'strawberry' },
    { id: 'tee-bigstar', shape: 'tops-motif', cat: 'top', name: { is: 'Stjörnubolur', en: 'Big star tee' }, colors: ['#5b4ea8', '#5b4ea8', '#43388a'], motif: 'star' },
    // Blouses
    { id: 'blouse-white', shape: 'tops-blouse', cat: 'top', name: { is: 'Hvít skyrta með kraga', en: 'White collar blouse' }, colors: ['#ffffff', '#ffffff', '#f7d3de', '#f19ab4'], sleeve: .3 },
    { id: 'blouse-flowers', shape: 'tops-blouse', cat: 'top', name: { is: 'Blómaskyrta', en: 'Flower blouse' }, colors: ['#fff3d9', '#f08ab0', '#ffffff', '#f6c946'], pattern: 'flowers', patternSize: 26, sleeve: 1 },
    { id: 'blouse-check', shape: 'tops-blouse', cat: 'top', name: { is: 'Köflótt skyrta', en: 'Gingham blouse' }, colors: ['#ffffff', '#e86a7a', '#ffffff', '#e86a7a'], pattern: 'check', patternSize: 14, sleeve: 1 },
    // Frilly shoulder blouses
    { id: 'frill-pink', shape: 'tops-frill', cat: 'top', name: { is: 'Bleik pífublússa', en: 'Pink frill blouse' }, colors: ['#f8c3d4', '#f8c3d4', '#ffffff'] },
    { id: 'frill-yellow', shape: 'tops-frill', cat: 'top', name: { is: 'Gul pífublússa', en: 'Yellow frill blouse' }, colors: ['#fff0b8', '#ffffff', '#f7b8cf'], pattern: 'dots', patternSize: 16 },
    // Tank tops
    { id: 'tank-coral', shape: 'tops-tank', cat: 'top', name: { is: 'Hlýrabolur', en: 'Coral tank top' }, colors: ['#f7907e', '#f7907e', '#ffffff'] },
    { id: 'tank-strawberry', shape: 'tops-tank', cat: 'top', name: { is: 'Jarðarberjahlýrabolur', en: 'Strawberry tank top' }, colors: ['#fff1f4', '#ffffff', '#f48ca0'], pattern: 'strawberry', patternSize: 26 },
    // Sailor tops
    { id: 'sailor-navy', shape: 'tops-sailor', cat: 'top', name: { is: 'Sjómannabolur', en: 'Sailor top' }, colors: ['#ffffff', '#2f4a86', '#ffffff', '#e2464c'] },
    // Polo shirts
    { id: 'polo-green', shape: 'tops-polo', cat: 'top', name: { is: 'Grænn pólóbolur', en: 'Green polo shirt' }, colors: ['#7cc79a', '#7cc79a', '#ffffff'] },
    { id: 'polo-pink', shape: 'tops-polo', cat: 'top', name: { is: 'Bleikur pólóbolur', en: 'Pink polo shirt' }, colors: ['#f6a6c1', '#f6a6c1', '#ffffff'] },
  ]);
  /* =============================================================
     SWEATERS (slot 'sweater')  – pad 8, sleevePad 5, hem 452
     ============================================================= */

  /** Ring between two radii (knitted yokes); same idea as in examples.js. */
  const annulus = (cx, cy, r0, r1) =>
    `M${cx - r1},${cy}a${r1},${r1} 0 1 0 ${2 * r1},0a${r1},${r1} 0 1 0 ${-2 * r1},0Z` +
    `M${cx - r0},${cy}a${r0},${r0} 0 1 0 ${2 * r0},0a${r0},${r0} 0 1 0 ${-2 * r0},0Z`;
  /** Point on a circle, angle in degrees. */
  const pol = (cx, cy, r, deg) => [cx + Math.cos(deg * Math.PI / 180) * r, cy + Math.sin(deg * Math.PI / 180) * r];

  /** Ribbed hem band at the bottom of a sweater (clipped by the caller): base colour band plus rib lines. */
  const ribHem = (y0, y1, c) => `<rect x="40" y="${y0}" width="320" height="${y1 - y0 + 12}" fill="${shade(c, -.06)}"/>` +
    `<path d="${ribLines(y0, y1 + 12)}" stroke="${ink(c)}" stroke-width="1.2" opacity=".32"/>` +
    `<path d="M40,${y0}H360" stroke="${ink(c)}" stroke-width="1.4" opacity=".5"/>`;

  /** Ribbed knitted sleeve cuffs on both arms. */
  const cuffs = (c, t0 = .88, pad = 5.4) => ribCuff('L', t0, pad, shade(c, -.06)) + ribCuff('R', t0, pad, shade(c, -.06));

  /** Fold lines at elbows and armpits shared by long-sleeved sweaters. */
  const sweaterFolds = c => H.line('M152,326 q8,12 5,28 M248,326 q-8,12 -5,28 M100,360 q9,5 16,0 M300,360 q-9,5 -16,0', c, 1.7, .4);

  /* -------------------------------------------------------------
     Lopapeysa cardigan: round knitted yoke like the lopi sweater, but
     open down the front with a zip (it.close 'zip') or wooden buttons.
     colors: [base, dark, middle band, light dots]
     ------------------------------------------------------------- */
  DOLL.shape('sweater-lopicardi', {
    slot: 'sweater',
    draw(it) {
      const [base, dark, mid, light] = it.colors;
      const d = G.shirtPath({ sleeve: 1, pad: 8, sleevePad: 5, bottom: 452, neck: 'round', neckDepth: 8 });
      const clip = H.clip('c-' + it.id, d);
      const cx = 200, cy = 246;
      let yoke = `<path d="${annulus(cx, cy, 93, 97)}" fill="${dark}" fill-rule="evenodd"/>`;
      // stepped "tree" teeth pointing outward, then a light band with dark crosses
      for (let a = 0; a < 360; a += 15) {
        // point of a tooth shape: radius k[0], angle offset k[1] from the current angle a
        const p = k => P(pol(cx, cy, k[0], a + k[1]));
        yoke += `<path d="M${p([78, -6])}L${p([84, -6])}L${p([84, -3])}L${p([92, 0])}L${p([84, 3])}L${p([84, 6])}L${p([78, 6])}Z" fill="${dark}"/>`;
      }
      yoke += `<path d="${annulus(cx, cy, 62, 78)}" fill="${mid}" fill-rule="evenodd"/>`;
      for (let a = 0; a < 360; a += 10) { const [x, y] = pol(cx, cy, 70, a); yoke += `<path d="M${n1(x - 3)},${n1(y - 3)}l6,6M${n1(x + 3)},${n1(y - 3)}l-6,6" stroke="${light}" stroke-width="1.8" stroke-linecap="round"/>`; }
      for (let a = 5; a < 360; a += 15) { const [x, y] = pol(cx, cy, 55, a); yoke += `<circle cx="${n1(x)}" cy="${n1(y)}" r="3" fill="${dark}"/>`; }
      yoke += `<path d="${annulus(cx, cy, 44, 49)}" fill="${dark}" fill-rule="evenodd"/>`;
      // hem band: only across the torso (x 128–272), so it never runs into the sleeve cuffs beside it
      const band = y => `<rect x="128" y="${y}" width="144" height="4" fill="${dark}"/><rect x="128" y="${y + 5}" width="144" height="9" fill="${mid}"/>` +
        Array.from({ length: 12 }, (_, i) => `<path d="M${i * 12 + 130},${y + 7}l5,5M${i * 12 + 135},${y + 7}l-5,5" stroke="${light}" stroke-width="1.5" stroke-linecap="round"/>`).join('');
      // cuffs: dark line, then a patterned band with little light dots placed along the arm (left computed, right mirrored)
      const cuff = side => {
        let dots = '';
        for (const k of [-.6, -.2, .2, .6]) {
          const [o, i] = across(side, .915, hwAt(.915) + 6);
          dots += `<circle cx="${n1(o[0] + (i[0] - o[0]) * (k + 1) / 2)}" cy="${n1(o[1] + (i[1] - o[1]) * (k + 1) / 2)}" r="2" fill="${light}"/>`;
        }
        return `<path d="${G.armPath(side, .83, .87, 6)}" fill="${dark}"/><path d="${G.armPath(side, .88, .95, 6)}" fill="${mid}"/>` + dots;
      };
      // front button band (both edges) and the closure
      const bandD = 'M193,258 L193,458 L207,458 L207,258 Z';
      const close = it.close === 'buttons'
        ? [286, 322, 358, 394, 430].map(y => `<ellipse cx="200" cy="${y}" rx="5" ry="4.4" fill="${H.grad('#b98552', 'r')}" stroke="#6e4a2a" stroke-width="1.4"/><path d="M197.5,${y}h5" stroke="#6e4a2a" stroke-width="1.2"/>`).join('')
        : `<path d="M200,262 V456" stroke="#c9ccd2" stroke-width="3.6" stroke-dasharray="2 2"/>` +
          `<rect x="195.5" y="262" width="9" height="16" rx="3" fill="#dfe3e8" stroke="${ink(dark)}" stroke-width="1.5"/><circle cx="200" cy="281" r="3.2" fill="none" stroke="${ink(dark)}" stroke-width="1.5"/>`;
      return `<path d="${d}" fill="${H.pat('knit', base, shade(base, -.25), 10)}"/>` +
        `<g clip-path="${clip}">${yoke}${band(424)}<path d="${ribLines(442, 456)}" stroke="${ink(base)}" stroke-width="1.2" opacity=".35"/>${cuff('L')}${cuff('R')}` +
        `<path d="${bandD}" fill="${H.grad(dark)}"/><path d="M196.5,262V458M203.5,262V458" stroke="${shade(dark, .25)}" stroke-width="1" stroke-dasharray="2 3"/></g>` +
        H.line('M193,258V456M207,258V456', dark, 1.6, .8) +
        `<path d="M183,250 Q200,264 217,250" fill="none" stroke="${dark}" stroke-width="8" stroke-linecap="round"/>` +
        outline(d, base) + close;
    },
  });

  /* -------------------------------------------------------------
     Hoodie: hood lying behind the shoulders, hood rim framing the neck,
     drawstrings, kangaroo pocket, ribbed cuffs and hem.
     colors: [body, pattern colour, hood lining / strings]
     it.ears: little bear ears on the hood
     ------------------------------------------------------------- */
  DOLL.shape('sweater-hoodie', {
    slot: 'sweater',
    thumb: [60, 204, 280, 280],
    draw(it) {
      const c = it.colors[0], lin = it.colors[2] || shade(c, .4);
      const d = G.shirtPath({ sleeve: 1, pad: 8, sleevePad: 5, bottom: 452, neck: 'round', neckDepth: 10 });
      const clip = H.clip('c-' + it.id, d);
      // hood lying down behind the neck and shoulders
      const hood = 'M146,268 C140,236 166,220 200,220 C234,220 260,236 254,268 Z';
      // bear ears stick out at the top corners of the lying hood (left computed, right mirrored)
      const ears = it.ears ? ['L', 'R'].map(side => { const x = X(side, 153), y = 238; return `<circle cx="${x}" cy="${y}" r="12" fill="${H.grad(c, 'r')}" stroke="${ink(c)}" stroke-width="${SW}"/><circle cx="${x}" cy="${y}" r="6" fill="${lin}"/>`; }).join('') : '';
      // hood rim in front: a soft band around the neck meeting in a shallow V (left half, mirrored)
      const rimL = H.smooth([[201, 286], [188, 276], [176, 262], [172, 250], [180, 246], [188, 256], [200, 272]]);
      const rimR = H.smooth(mirrorPts([[201, 286], [188, 276], [176, 262], [172, 250], [180, 246], [188, 256], [200, 272]]));
      const pocket = 'M160,388 Q166,372 182,370 L218,370 Q234,372 240,388 L244,432 L156,432 Z';
      const strings = `<path d="M192,282 q-2,24 -1,40 M208,282 q2,24 1,40" stroke="${lin}" stroke-width="3" fill="none" stroke-linecap="round"/>` +
        `<rect x="187.5" y="320" width="6" height="9" rx="2" fill="${shade(lin, -.1)}" stroke="${ink(lin)}" stroke-width="1.2"/><rect x="206.5" y="320" width="6" height="9" rx="2" fill="${shade(lin, -.1)}" stroke="${ink(lin)}" stroke-width="1.2"/>`;
      return {
        back: ears + `<path d="${hood}" fill="${H.grad(shade(c, -.15))}" stroke="${ink(c)}" stroke-width="${SW}"/>` +
          `<path d="M160,262 C158,242 176,232 200,232 C224,232 242,242 240,262 Z" fill="${H.grad(lin)}"/>`,
        front: `<path d="${d}" fill="${H.fill(it)}"/>` +
          `<g clip-path="${clip}">${ribHem(436, 452, c)}</g>` + cuffs(c) +
          `<path d="${pocket}" fill="${H.fill(it)}"/><path d="${pocket}" fill="url(#soft-v)" stroke="${ink(c)}" stroke-width="2" stroke-linejoin="round"/>` +
          H.line('M166,390 Q170,378 182,376 M234,390 Q230,378 218,376', c, 1.4, .5) +
          sweaterFolds(c) + outline(d, c) +
          `<path d="${rimL}${rimR}" fill="${H.grad(c)}" stroke="${ink(c)}" stroke-width="2.2" stroke-linejoin="round"/>` +
          H.line('M184,262 q6,10 14,16 M216,262 q-6,10 -14,16', lin, 3, .9) + strings,
      };
    },
  });

  /* -------------------------------------------------------------
     Cardigan with a V neck, buttons, ribbed edges and two patch pockets.
     colors: [body, pattern colour, buttons, edge band]
     ------------------------------------------------------------- */
  DOLL.shape('sweater-cardigan', {
    slot: 'sweater',
    draw(it) {
      const c = it.colors[0], btn = it.colors[2] || '#ffffff', edge = it.colors[3] || shade(c, -.08);
      const d = G.shirtPath({ sleeve: 1, pad: 8, sleevePad: 5, bottom: 452, neck: 'v', neckDepth: 52 });
      const clip = H.clip('c-' + it.id, d);
      const ny = neckY('v', 8);
      // front edge bands: from the neck down the V and on to the hem
      const band = `M${200 - 17},${n1(ny)} L200,${n1(ny + 52)} L200,456 M${200 + 17},${n1(ny)} L200,${n1(ny + 52)}`;
      // small patch pocket whose left edge is at x
      const pocket = x => `<path d="M${x},398 h28 v22 q0,6 -6,6 h-16 q-6,0 -6,-6 Z" fill="${H.fill(it)}" stroke="${ink(c)}" stroke-width="1.8"/>` +
        `<rect x="${x}" y="398" width="28" height="6" fill="${edge}" stroke="${ink(c)}" stroke-width="1.4"/>`;
      const buttons = [320, 352, 384, 416].map(y => button(200, y, 4.2, btn)).join('');
      return `<path d="${d}" fill="${H.fill(it)}"/>` +
        `<g clip-path="${clip}">${ribHem(438, 452, edge)}<path d="${band}" stroke="${edge}" stroke-width="10" fill="none" stroke-linejoin="round"/>` +
        `<path d="${band}" stroke="${ink(edge)}" stroke-width="1.2" fill="none" opacity=".45" stroke-dasharray="2 2.5"/></g>` +
        cuffs(edge) + pocket(156) + pocket(216) + sweaterFolds(c) + outline(d, c) +
        `<path d="M200,${n1(ny + 52)} V452" stroke="${ink(c)}" stroke-width="1.6" opacity=".6"/>` + buttons;
    },
  });

  /* -------------------------------------------------------------
     Knitted sweater with a ribbed crew neck. Options:
       it.stripes  – list of stripe colours, repeated down the sweater
       it.band     – 'snow': snowflake band across chest and arms (colors[2] band, colors[3] flakes)
       it.cable    – cable-knit ropes down the front
     colors: [body, -, band, motif]
     ------------------------------------------------------------- */
  DOLL.shape('sweater-knit', {
    slot: 'sweater',
    draw(it) {
      const c = it.colors[0];
      const d = G.shirtPath({ sleeve: 1, pad: 8, sleevePad: 5, bottom: 452, neck: 'round', neckDepth: 6 });
      const clip = H.clip('c-' + it.id, d);
      let inside = '';
      if (it.stripes) {
        const h = it.stripeH || 18;
        for (let y = 262, i = 0; y < 460; y += h, i++) inside += `<rect x="0" y="${y}" width="400" height="${h + .4}" fill="${it.stripes[i % it.stripes.length]}"/>`;
        // knit texture on top of the stripes
        inside += `<rect x="0" y="240" width="400" height="230" fill="${H.pat('knit', 'transparent', shade(c, -.35), 10)}" opacity=".6"/>`;
      }
      if (it.band === 'snow') {
        const bc = it.colors[2], fc = it.colors[3] || '#ffffff', y0 = 312, y1 = 352;
        inside += `<rect x="0" y="${y0}" width="400" height="${y1 - y0}" fill="${bc}"/>` +
          `<rect x="0" y="${y0 - 6}" width="400" height="3" fill="${bc}"/><rect x="0" y="${y1 + 3}" width="400" height="3" fill="${bc}"/>`;
        for (let x = 66, i = 0; x < 340; x += 26, i++) {          // band only spans the visible garment width
          inside += H.flake(x, (y0 + y1) / 2, 11, fc) + `<circle cx="${x}" cy="${(y0 + y1) / 2}" r="2.6" fill="${bc}"/>`;
          inside += H.diamond(x + 13, y0 + 7, 3, fc) + H.diamond(x + 13, y1 - 7, 3, fc);
        }
        // little dot rows above and below the band
        for (let x = 64; x < 340; x += 10) inside += `<circle cx="${x}" cy="${y0 - 12}" r="1.8" fill="${bc}"/><circle cx="${x + 5}" cy="${y1 + 12}" r="1.8" fill="${bc}"/>`;
      }
      if (it.cable) {
        // one twisted cable-knit rope running down the front at x
        const rope = x => { let s = `M${x},266`; for (let y = 266; y < 440; y += 16) s += `q8,8 0,16`; let t = `M${x},266`; for (let y = 266; y < 440; y += 16) t += `q-8,8 0,16`; return s + t; };
        inside += `<path d="${rope(178)}${rope(222)}${rope(200)}" stroke="${shade(c, -.25)}" stroke-width="2.4" fill="none" opacity=".7"/>` +
          `<path d="M166,266V440M190,266V440M210,266V440M234,266V440" stroke="${shade(c, -.2)}" stroke-width="1.5" opacity=".6"/>`;
      }
      const knitFill = it.stripes ? '#fff' : H.pat('knit', c, shade(c, -.22), 10);
      return `<path d="${d}" fill="${knitFill}"/>` +
        `<g clip-path="${clip}">${inside}${ribHem(438, 452, it.stripes ? it.stripes[0] : c)}</g>` +
        cuffs(it.stripes ? it.stripes[0] : c) + sweaterFolds(c) +
        `<path d="M185,251.5 Q200,265 215,251.5" fill="none" stroke="${shade(it.stripes ? it.stripes[0] : c, -.08)}" stroke-width="8" stroke-linecap="round"/>` +
        `<path d="M185,251.5 Q200,265 215,251.5" fill="none" stroke="${ink(c)}" stroke-width="1.2" stroke-dasharray="1.4 3" opacity=".5"/>` +
        outline(d, c);
    },
  });

  DOLL.add([
    // Lopapeysur in classic Icelandic colourways (approved 'lopi' shape)
    { id: 'lopi-grey', shape: 'lopi', cat: 'sweater', name: { is: 'Grá lopapeysa', en: 'Grey lopapeysa' }, colors: ['#a9a6a2', '#2f2b2c', '#ffffff', '#2f2b2c'] },
    { id: 'lopi-black', shape: 'lopi', cat: 'sweater', name: { is: 'Svört lopapeysa', en: 'Black lopapeysa' }, colors: ['#3b3739', '#f3eee4', '#a9a6a2', '#3b3739'] },
    { id: 'lopi-white', shape: 'lopi', cat: 'sweater', name: { is: 'Hvít lopapeysa', en: 'White lopapeysa' }, colors: ['#f6f2ea', '#8a6a52', '#c9b8a2', '#ffffff'] },
    { id: 'lopi-blue', shape: 'lopi', cat: 'sweater', name: { is: 'Blá lopapeysa', en: 'Blue lopapeysa' }, colors: ['#3e5f96', '#f3eee4', '#9cc0e6', '#3e5f96'] },
    { id: 'lopi-red', shape: 'lopi', cat: 'sweater', name: { is: 'Rauð lopapeysa', en: 'Red lopapeysa' }, colors: ['#c3434a', '#f3eee4', '#3b3739', '#f3eee4'] },
    { id: 'lopi-green', shape: 'lopi', cat: 'sweater', name: { is: 'Græn lopapeysa', en: 'Green lopapeysa' }, colors: ['#5d8a5e', '#f3eee4', '#c9a64a', '#f3eee4'] },
    { id: 'lopi-pink', shape: 'lopi', cat: 'sweater', name: { is: 'Bleik lopapeysa', en: 'Pink lopapeysa' }, colors: ['#f2b6c6', '#7a4058', '#ffffff', '#f2b6c6'] },
    { id: 'lopi-brown', shape: 'lopi', cat: 'sweater', name: { is: 'Brún lopapeysa', en: 'Brown lopapeysa' }, colors: ['#8a6a52', '#f3eee4', '#c9b8a2', '#5a4436'] },
    // Lopapeysa cardigans
    { id: 'lopicardi-grey', shape: 'sweater-lopicardi', cat: 'sweater', name: { is: 'Lopapeysa með rennilás', en: 'Zip lopapeysa cardigan' }, colors: ['#bdb8b1', '#3b3739', '#f3eee4', '#3b3739'], close: 'zip' },
    { id: 'lopicardi-white', shape: 'sweater-lopicardi', cat: 'sweater', name: { is: 'Hneppt lopapeysa', en: 'Button lopapeysa cardigan' }, colors: ['#f6f2ea', '#6f4a3a', '#d98a8f', '#f6f2ea'], close: 'buttons' },
    // Hoodies
    { id: 'hoodie-pink', shape: 'sweater-hoodie', cat: 'sweater', name: { is: 'Bleik hettupeysa', en: 'Pink hoodie' }, colors: ['#f39ab8', '#f39ab8', '#ffffff'] },
    { id: 'hoodie-grey', shape: 'sweater-hoodie', cat: 'sweater', name: { is: 'Grá hettupeysa', en: 'Grey hoodie' }, colors: ['#b8bcc4', '#b8bcc4', '#f6c636'] },
    { id: 'hoodie-bear', shape: 'sweater-hoodie', cat: 'sweater', name: { is: 'Bangsahettupeysa', en: 'Teddy hoodie' }, colors: ['#b98a64', '#b98a64', '#f3dcc4'], ears: true },
    { id: 'hoodie-stars', shape: 'sweater-hoodie', cat: 'sweater', name: { is: 'Stjörnuhettupeysa', en: 'Stars hoodie' }, colors: ['#5b6fc4', '#ffd75a', '#ffd75a'], pattern: 'stars', patternSize: 30 },
    // Cardigans
    { id: 'cardigan-yellow', shape: 'sweater-cardigan', cat: 'sweater', name: { is: 'Gul prjónapeysa', en: 'Yellow cardigan' }, colors: ['#f7d66a', '#f7d66a', '#ffffff', '#f2c43c'] },
    { id: 'cardigan-lilac', shape: 'sweater-cardigan', cat: 'sweater', name: { is: 'Fjólublá prjónapeysa', en: 'Lilac cardigan' }, colors: ['#c6b2ee', '#c6b2ee', '#f6a6c1', '#ad94e2'] },
    { id: 'cardigan-hearts', shape: 'sweater-cardigan', cat: 'sweater', name: { is: 'Hjartapeysa', en: 'Hearts cardigan' }, colors: ['#e2505b', '#ffd3dc', '#ffffff', '#c63b48'], pattern: 'hearts', patternSize: 26 },
    // Plain, striped and patterned knits
    { id: 'knit-teal', shape: 'sweater-knit', cat: 'sweater', name: { is: 'Grænblá peysa', en: 'Teal sweater' }, colors: ['#4fb0ad'] },
    { id: 'knit-cream', shape: 'sweater-knit', cat: 'sweater', name: { is: 'Köðlupeysa', en: 'Cable-knit sweater' }, colors: ['#f2e8d6'], cable: true },
    { id: 'knit-stripes', shape: 'sweater-knit', cat: 'sweater', name: { is: 'Röndótt peysa', en: 'Striped sweater' }, colors: ['#f6a6c1'], stripes: ['#f6a6c1', '#ffffff', '#9cc8ea', '#ffffff'] },
    { id: 'knit-snow', shape: 'sweater-knit', cat: 'sweater', name: { is: 'Snjókornapeysa', en: 'Snowflake sweater' }, colors: ['#d9434e', '-', '#ffffff', '#d9434e'], band: 'snow' },
    { id: 'knit-snow-blue', shape: 'sweater-knit', cat: 'sweater', name: { is: 'Blá snjókornapeysa', en: 'Blue snowflake sweater' }, colors: ['#3e5f96', '-', '#ffffff', '#3e5f96'], band: 'snow' },
  ]);
  /* =============================================================
     JACKETS (slot 'jacket') – pad 11–13, sleevePad 8–9, so they
     cover sweaters (pad 8 / sleevePad 5 + cuffs) underneath.
     Open jackets cut a gap down the middle with openFront(), so the
     layer underneath shows.
     ============================================================= */

  /** Draw an open garment: fill + details + shading/outline inside the open clip, then the two front edges.
   *  d = closed silhouette, edge = left front edge points, inner = markup drawn inside the open clip. */
  function openGarment(it, d, edge, base, fill, inner, facing) {
    const o = openFront(it.id, edge);
    const dc = H.clip('c-' + it.id + '-body', d);
    // everything inside the open clip AND the garment silhouette, so facings never poke out above the neckline
    return `<g clip-path="${o.clip}"><g clip-path="${dc}"><path d="${d}" fill="${fill}"/>${inner}` +
      `<path d="${o.edges}" fill="none" stroke="${facing || shade(base, -.14)}" stroke-width="7"/></g>` + outline(d, base) + `</g>` +
      // front edge lines, kept inside the garment so they stop at the hem
      `<g clip-path="${dc}"><path d="${o.edges}" fill="none" stroke="${ink(base)}" stroke-width="${SW}" stroke-linecap="round"/></g>`;
  }

  /** Inside of the back of an open jacket (drawn behind the body): only visible in the chest thumbnail gap. */
  const lining = (d, c) => `<path d="${d}" fill="${H.grad(shade(c, -.3))}"/>`;

  /** Left front edge of an open jacket from the neck to below the hem (gap widens a little toward the hem). */
  const openEdge = (top, bottom, x0 = 190, x1 = 182) => [[x0, top], [x0 - 1, top + 30], [(x0 + x1) / 2, (top + bottom) / 2], [x1, bottom + 10]];

  /** Dashed stitching line. */
  const stitch = (d, c, w = 1.4) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-dasharray="3 2.5" stroke-linecap="round"/>`;

  /* -------------------------------------------------------------
     Denim jacket, worn open: pointed collar, chest pockets with flaps,
     yoke seams, buttons and a waistband, orange stitching.
     colors: [denim, stitching, buttons]
     ------------------------------------------------------------- */
  DOLL.shape('jacket-denim', {
    slot: 'jacket',
    draw(it) {
      const c = it.colors[0], st = it.colors[1] || '#eaa64c', btn = it.colors[2] || '#c98a3c';
      const bottom = 458;
      const d = G.shirtPath({ sleeve: 1, pad: 11, sleevePad: 9, bottom, neck: 'round', neckDepth: 8 });
      const clip = H.clip('c-' + it.id, d);
      const edge = openEdge(240, bottom, 192, 184);
      // chest pocket with a pointed flap (left, mirrored)
      const pocket = side => {
        const x = side === 'L' ? 152 : 400 - 152 - 30;
        return `<path d="M${x},312 h30 v26 l-15,6 l-15,-6 Z" fill="none" stroke="${ink(c)}" stroke-width="1.6" opacity=".7"/>` +
          `<path d="M${x - 2},304 h34 v10 l-17,7 l-17,-7 Z" fill="${H.grad(shade(c, .05))}" stroke="${ink(c)}" stroke-width="1.8" stroke-linejoin="round"/>` +
          stitch(`M${x + 1},308h28`, st) + button(x + 15, 313, 3.2, btn);
      };
      // sleeve cuff on one side (with stitching and a button)
      const cuff = side => `<path d="${G.armPath(side, .88, 1, 8.6)}" fill="${H.grad(shade(c, .06))}" stroke="${ink(c)}" stroke-width="1.8" stroke-linejoin="round"/>` +
        stitch(seamAcross(side, .9, hwAt(.9) + 8, 1), st) + button(...G.armPoint(side, .95), 2.8, btn);
      const inner = `<g clip-path="${clip}">` +
        // waistband and yoke seam
        `<rect x="0" y="${bottom - 20}" width="400" height="30" fill="${shade(c, .06)}"/>` + `<path d="M0,${bottom - 20}H400" stroke="${ink(c)}" stroke-width="1.8" opacity=".7"/>` +
        stitch(`M0,${bottom - 16}H400`, st) + stitch('M120,292 Q160,286 196,292 M204,292 Q240,286 280,292', st) +
        H.line('M118,288 Q160,282 196,288 M204,288 Q240,282 282,288', c, 1.6, .6) +
        stitch('M168,346 V430 M232,346 V430', st) + `</g>` +
        pocket('L') + pocket('R') +
        H.line('M150,346 q8,12 5,28 M250,346 q-8,12 -5,28 M98,362 q10,5 18,0 M302,362 q-10,5 -18,0', c, 1.7, .45);
      // buttons down the left front edge, matching button holes on the right
      const buttons = [330, 372, 414, bottom - 8].map(y => button(178, y, 3.6, btn)).join('') +
        [330, 372, 414].map(y => `<path d="M216,${y}h8" stroke="${ink(c)}" stroke-width="1.6" stroke-linecap="round" opacity=".6"/>`).join('');
      // pointed collar lying on the shoulders (left, mirrored)
      const collarPts = [[192, 238], [178, 242], [158, 254], [150, 262], [166, 286], [186, 268], [192, 252]];
      const collar = H.polyPath(collarPts) + H.polyPath(mirrorPts(collarPts));
      return { back: lining(d, c), front: `<path d="M168,256 Q200,236 232,256 L226,248 Q200,232 174,248Z" fill="${shade(c, -.2)}"/>` +
        openGarment(it, d, edge, c, H.grad(c), inner) + cuff('L') + cuff('R') + buttons +
        `<path d="${collar}" fill="${H.grad(shade(c, .04))}" stroke="${ink(c)}" stroke-width="2.2" stroke-linejoin="round"/>` +
        stitch('M156,262 L168,280 M244,262 L232,280', st) };
    },
  });

  /* -------------------------------------------------------------
     Puffer jacket: quilted puffy bands on body and sleeves, zip, stand-up collar.
     colors: [shell, zip/lining, collar trim]
     it.hood: a fluffy hood lying behind the shoulders
     ------------------------------------------------------------- */
  DOLL.shape('jacket-puffer', {
    slot: 'jacket',
    thumb: [50, 200, 300, 300],
    draw(it) {
      const c = it.colors[0], zipc = it.colors[1] || shade(c, -.35), trim = it.colors[2] || shade(c, -.1);
      const bottom = 466;
      const d = G.shirtPath({ sleeve: 1, pad: 13, sleevePad: 9, bottom, flare: 4, neck: 'round', neckDepth: 6 });
      const clip = H.clip('c-' + it.id, d);
      // body quilting: curved seams with a light puff band above each seam
      let quilt = '';
      for (let y = 300; y < bottom; y += 34) {
        quilt += `<path d="M60,${y - 30} Q200,${y - 22} 340,${y - 30} L340,${y - 18} Q200,${y - 10} 60,${y - 18}Z" fill="#fff" opacity=".18"/>`;
        quilt += `<path d="M60,${y} Q200,${y + 8} 340,${y}" fill="none" stroke="${ink(c)}" stroke-width="1.8" opacity=".55"/>`;
      }
      // sleeve quilting (left computed, right mirrored inside seamAcross)
      let sq = '';
      for (const t of [.18, .38, .58, .78]) for (const side of ['L', 'R']) sq += seamAcross(side, t, hwAt(t) + 9, 4);
      // sleeve cuff on one side
      const cuff = side => `<path d="${G.armPath(side, .92, 1, 7.5)}" fill="${H.grad(shade(c, -.12))}" stroke="${ink(c)}" stroke-width="1.8" stroke-linejoin="round"/>`;
      const collar = 'M174,262 Q170,246 178,236 Q200,230 222,236 Q230,246 226,262 Q200,252 174,262Z';
      const hood = it.hood ? `<path d="M140,270 C132,232 164,214 200,214 C236,214 268,232 260,270 Z" fill="${H.grad(shade(c, -.12))}" stroke="${ink(c)}" stroke-width="${SW}"/>` +
        Array.from({ length: 11 }, (_, i) => { const [x, y] = pol(200, 266, 54, 180 + i * 18); return `<circle cx="${n1(x)}" cy="${n1(y)}" r="9" fill="${H.grad('#f4efe8', 'r')}" stroke="#c9bfb2" stroke-width="1.3"/>`; }).join('') : '';
      return {
        back: hood,
        front: `<path d="${d}" fill="${H.grad(c)}"/>` +
          `<g clip-path="${clip}">${quilt}<path d="${sq}" fill="none" stroke="${ink(c)}" stroke-width="1.8" opacity=".55"/>` +
          `<rect x="0" y="${bottom - 10}" width="400" height="20" fill="${shade(c, -.12)}"/></g>` +
          cuff('L') + cuff('R') +
          `<path d="M146,300 Q136,330 138,380 Q142,338 154,306 Z" fill="#fff" opacity=".35"/>` +
          outline(d, c) +
          `<path d="M200,262 V${bottom + 4}" stroke="${zipc}" stroke-width="4" stroke-dasharray="2 2"/>` +
          `<path d="${collar}" fill="${H.grad(trim)}" stroke="${ink(c)}" stroke-width="2.2" stroke-linejoin="round"/>` +
          `<path d="M200,236 V258" stroke="${zipc}" stroke-width="3" stroke-dasharray="2 2"/>` +
          `<rect x="196" y="254" width="8" height="15" rx="3" fill="#e2e5ea" stroke="${ink(c)}" stroke-width="1.5"/>`,
      };
    },
  });

  /* -------------------------------------------------------------
     Fleece jacket: soft dotted fleece, contrast shoulder yoke, stand-up
     collar, zip and a chest zip pocket.
     colors: [fleece, yoke/trim]
     ------------------------------------------------------------- */
  DOLL.shape('jacket-fleece', {
    slot: 'jacket',
    draw(it) {
      const c = it.colors[0], tr = it.colors[1] || shade(c, -.2);
      const bottom = 462;
      const d = G.shirtPath({ sleeve: 1, pad: 11, sleevePad: 8, bottom, neck: 'round', neckDepth: 6 });
      const clip = H.clip('c-' + it.id, d);
      // shoulder yoke panel on one side (side L or R)
      const yoke = side => H.polyPath([[X(side, 200), 230], [X(side, 200), 300], [X(side, 160), 304], [X(side, 136), 330], [X(side, 60), 340], [X(side, 60), 230]]);
      // sleeve cuff on one side
      const cuff = side => `<path d="${G.armPath(side, .9, 1, 7)}" fill="${H.grad(tr)}" stroke="${ink(tr)}" stroke-width="1.8" stroke-linejoin="round"/>`;
      return `<path d="${d}" fill="${H.pat('dots', c, shade(c, .14), 7)}"/>` +
        `<g clip-path="${clip}"><path d="${yoke('L')}${yoke('R')}" fill="${H.grad(tr)}"/>` +
        `<path d="M60,340 L136,330 L160,304 L200,300 L240,304 L264,330 L340,340" fill="none" stroke="${ink(tr)}" stroke-width="1.8" opacity=".7"/>` +
        `<rect x="0" y="${bottom - 12}" width="400" height="20" fill="${H.grad(tr)}"/></g>` +
        cuff('L') + cuff('R') +
        H.line('M150,348 q8,12 5,28 M250,348 q-8,12 -5,28 M98,362 q10,5 18,0 M302,362 q-10,5 -18,0', c, 1.7, .4) +
        // chest zip pocket on the right side of the picture
        `<path d="M222,330 L246,326" stroke="${shade(tr, -.2)}" stroke-width="3" stroke-dasharray="2 1.6"/><rect x="243" y="324" width="5" height="10" rx="2" fill="#e2e5ea" stroke="${ink(c)}" stroke-width="1.2"/>` +
        outline(d, c) +
        `<path d="M200,258 V${bottom + 4}" stroke="${shade(tr, -.25)}" stroke-width="4" stroke-dasharray="2 2"/>` +
        `<path d="M172,262 Q168,246 176,234 Q200,228 224,234 Q232,246 228,262 Q200,254 172,262Z" fill="${H.grad(tr)}" stroke="${ink(tr)}" stroke-width="2.2" stroke-linejoin="round"/>` +
        `<path d="M200,234 V258" stroke="${shade(tr, -.25)}" stroke-width="3" stroke-dasharray="2 2"/>` +
        `<rect x="196" y="252" width="8" height="15" rx="3" fill="#e2e5ea" stroke="${ink(c)}" stroke-width="1.5"/>`;
    },
  });

  /* -------------------------------------------------------------
     Wool coat with a hood and toggle fastening (duffle style): wooden
     toggles on cord loops, patch pockets, knee-free length to y 500.
     colors: [wool, toggles, cord/hood lining]
     ------------------------------------------------------------- */
  DOLL.shape('jacket-toggle', {
    slot: 'jacket',
    thumb: [36, 206, 328, 328],
    draw(it) {
      const c = it.colors[0], tog = it.colors[1] || '#d9b98a', cord = it.colors[2] || '#5a4436';
      const bottom = 500;
      const d = G.shirtPath({ sleeve: 1, pad: 11, sleevePad: 8, bottom, flare: 5, neck: 'round', neckDepth: 6 });
      const clip = H.clip('c-' + it.id, d);
      const hood = 'M144,270 C138,232 166,216 200,216 C234,216 262,232 256,270 Z';
      /** One duffle toggle at height y: leather tab on each front, a cord loop from the right tab
       *  wrapped round a horn peg sitting on the left tab. */
      const toggle = y => `<rect x="176" y="${y - 6}" width="14" height="12" rx="3" fill="${H.grad(cord)}" stroke="${ink(cord)}" stroke-width="1.3"/>` +
        `<rect x="210" y="${y - 6}" width="14" height="12" rx="3" fill="${H.grad(cord)}" stroke="${ink(cord)}" stroke-width="1.3"/>` +
        `<path d="M214,${y - 2.5} H194 M214,${y + 2.5} H194" stroke="${shade(cord, .15)}" stroke-width="2.2" stroke-linecap="round"/>` +
        `<rect x="${190}" y="${y - 12}" width="8" height="24" rx="4" fill="${H.grad(tog, 'h')}" stroke="${ink(tog)}" stroke-width="1.5" transform="rotate(14 194 ${y})"/>`;
      // patch pocket whose left edge is at x
      const pocket = x => `<path d="M${x},424 h34 v30 q0,8 -8,8 h-18 q-8,0 -8,-8 Z" fill="${H.grad(shade(c, -.03))}" stroke="${ink(c)}" stroke-width="2"/>` +
        stitch(`M${x + 3},428 h28`, shade(c, .3), 1.2);
      return {
        back: `<path d="${hood}" fill="${H.grad(shade(c, -.1))}" stroke="${ink(c)}" stroke-width="${SW}"/>` +
          `<path d="M158,264 C156,242 176,230 200,230 C224,230 244,242 242,264 Z" fill="${H.pat('check', cord, shade(cord, .3), 10)}"/>`,
        front: `<path d="${d}" fill="${H.pat('knit', c, shade(c, -.12), 12)}"/>` +
          `<path d="${d}" fill="${H.grad(c)}" opacity=".55"/>` +
          `<g clip-path="${clip}">${H.line('M206,262 V' + (bottom + 6), c, 2, .6)}</g>` +
          // shoulder yoke (duffle style): a band across the shoulders with a stitched lower edge
          `<g clip-path="${clip}"><path d="M40,220 H360 V300 Q300,300 252,292 Q226,300 200,300 Q174,300 148,292 Q100,300 40,300 Z" fill="${H.grad(shade(c, -.06))}"/></g>` +
          H.line('M138,296 Q144,296 148,293 Q174,301 200,301 Q226,301 252,293 Q256,296 262,296', c, 1.8, .7) +
          stitch('M148,288 Q174,296 200,296 Q226,296 252,288', shade(c, .3), 1.2) +
          pocket(148) + pocket(218) +
          `<path d="${G.armPath('L', .88, .92, 8.4)}${G.armPath('R', .88, .92, 8.4)}" fill="${shade(c, -.15)}"/>` +
          H.line('M150,348 q8,12 5,28 M250,348 q-8,12 -5,28 M98,362 q10,5 18,0 M302,362 q-10,5 -18,0', c, 1.7, .45) +
          outline(d, c) + [318, 360, 402].map(toggle).join(''),
      };
    },
  });

  /* -------------------------------------------------------------
     Trench raincoat: double-breasted buttons, wide collar with lapels,
     tied belt with a buckle, sleeve straps, flared hem to y 520.
     colors: [cloth, buttons, belt]
     ------------------------------------------------------------- */
  DOLL.shape('jacket-trench', {
    slot: 'jacket',
    thumb: [36, 226, 328, 318],
    draw(it) {
      const c = it.colors[0], btn = it.colors[1] || '#6e4a2a', beltc = it.colors[2] || c;
      const bottom = 520;
      const d = G.shirtPath({ sleeve: 1, pad: 11, sleevePad: 8, bottom, flare: 6, neck: 'v', neckDepth: 40 });
      const clip = H.clip('c-' + it.id, d);
      const ny = neckY('v', 11);
      // lapel + collar (left, mirrored): collar over the shoulder, lapel folding down to the V
      // collar part (rounded over the shoulder) then the notch, then the lapel running down to the V
      const lapPts = [[186, ny - 4], [174, 252], [162, 260], [160, 270], [168, 278], [174, 276], [172, 290], [199, ny + 40]];
      const lapel = H.polyPath(lapPts) + H.polyPath(mirrorPts(lapPts));
      const buttons = [308, 340, 372, 432, 466].map(y => button(180, y, 3.8, btn) + button(220, y, 3.8, btn)).join('');
      const belt = `<g clip-path="${clip}"><rect x="0" y="394" width="400" height="14" fill="${H.grad(beltc)}"/><path d="M0,394H400M0,408H400" stroke="${ink(beltc)}" stroke-width="1.6"/></g>` +
        `<rect x="190" y="391" width="20" height="20" rx="3" fill="none" stroke="#c9a14a" stroke-width="3.2"/>` +
        `<path d="M212,402 q8,10 4,30 l7,2 q2,-20 -5,-32 Z" fill="${H.grad(beltc)}" stroke="${ink(beltc)}" stroke-width="1.6" stroke-linejoin="round"/>`;
      // shoulder strap on one side (side L or R)
      const strap = side => {
        const [o, i] = across(side, .84, hwAt(.84) + 8.6), [o2, i2] = across(side, .89, hwAt(.89) + 8.6);
        return `<path d="M${P(o)}L${P(i)}L${P(i2)}L${P(o2)}Z" fill="${H.grad(beltc)}" stroke="${ink(c)}" stroke-width="1.6" stroke-linejoin="round"/>`;
      };
      return `<path d="${d}" fill="${H.grad(c)}"/>` +
        `<g clip-path="${clip}">${H.line('M200,' + (ny + 40) + ' V' + (bottom + 6), c, 1.8, .55)}${H.line('M150,430 q-6,40 -10,86 M250,430 q6,40 10,86 M186,440 q-2,40 -4,78 M214,440 q2,40 4,78', c, 1.6, .35)}</g>` +
        H.line('M150,346 q8,12 5,28 M250,346 q-8,12 -5,28 M98,362 q10,5 18,0 M302,362 q-10,5 -18,0', c, 1.7, .45) +
        strap('L') + strap('R') +
        `<path d="M144,430 l26,0 M230,430 l26,0" stroke="${ink(c)}" stroke-width="2" stroke-linecap="round" opacity=".6"/>` +
        outline(d, c) + belt + buttons +
        `<path d="${lapel}" fill="${H.grad(shade(c, .04))}" stroke="${ink(c)}" stroke-width="2.2" stroke-linejoin="round"/>`;
    },
  });

  /* -------------------------------------------------------------
     Sparkly party jacket (short bolero), open with curved fronts,
     edged with a beaded trim and a heart clasp.
     colors: [shine colour, sparkle, trim]
     ------------------------------------------------------------- */
  DOLL.shape('jacket-party', {
    slot: 'jacket',
    draw(it) {
      const c = it.colors[0], sp = it.colors[1] || '#ffffff', tr = it.colors[2] || '#ffffff';
      const bottom = 378;
      const d = G.shirtPath({ sleeve: 1, pad: 11, sleevePad: 9.5, sleeveFlare: 2, bottom, neck: 'round', neckDepth: 6 });
      // curved fronts: from the neck sweeping out toward the side seams
      const edge = [[192, 236], [190, 270], [184, 320], [170, 362], [150, 392]];
      const o = openFront(it.id, edge);
      const shine = `<path d="M142,300 Q132,330 134,380 Q138,338 150,306 Z" fill="#fff" opacity=".45"/>`;
      // sleeve cuff on one side
      const cuff = side => `<path d="${G.armPath(side, .9, 1, 10.4)}" fill="${H.grad(tr)}" stroke="${ink(c)}" stroke-width="1.8" stroke-linejoin="round"/>`;
      // beads along each front edge (left computed, right mirrored)
      let beads = '';
      for (let k = 0; k <= 7; k++) {
        const t = k / 7, i = Math.min(edge.length - 2, Math.floor(t * (edge.length - 1))), u = t * (edge.length - 1) - i;
        const x = edge[i][0] + (edge[i + 1][0] - edge[i][0]) * u, y = edge[i][1] + (edge[i + 1][1] - edge[i][1]) * u;
        if (y > bottom + 2 || y < 262) continue;   // only along the visible front edge, not on the neck
        beads += `<circle cx="${n1(x - 4)}" cy="${n1(y)}" r="2.6" fill="${tr}"/><circle cx="${n1(400 - x + 4)}" cy="${n1(y)}" r="2.6" fill="${tr}"/>`;
      }
      return { back: lining(d, c), front: `<g clip-path="${o.clip}"><path d="${d}" fill="${H.pat('sparkle', c, sp, 14)}"/>${shine}` +
        H.line('M98,362 q10,5 18,0 M302,362 q-10,5 -18,0', c, 1.7, .45) +
        `<g clip-path="${H.clip('c-' + it.id + '-body', d)}"><path d="${o.edges}" fill="none" stroke="${tr}" stroke-width="8"/></g>` + outline(d, c) + `</g>` +
        `<g clip-path="${H.clip('c-' + it.id + '-body', d)}"><path d="${o.edges}" fill="none" stroke="${ink(c)}" stroke-width="${SW}" stroke-linecap="round"/></g>` + beads +
        cuff('L') + cuff('R') +
        twinkle(146, 290, 5) + twinkle(254, 296, 4) + twinkle(112, 380, 4) + twinkle(292, 400, 5) +
        // little heart clasp near the neck joining the two fronts
        `<path d="M191,272 H209" stroke="${tr}" stroke-width="2.4"/><path d="${heartD(200, 271, 7)}" fill="${H.grad(tr, 'r')}" stroke="${ink(c)}" stroke-width="1.5"/>` };
    },
  });

  /* -------------------------------------------------------------
     Long knitted cardigan coat (to y 540), worn open with a wide ribbed
     front band and two pockets.
     colors: [knit, band]
     ------------------------------------------------------------- */
  DOLL.shape('jacket-longcardi', {
    slot: 'jacket',
    thumb: [32, 226, 336, 336],
    draw(it) {
      const c = it.colors[0], band = it.colors[1] || shade(c, -.1);
      const bottom = 540;
      const d = G.shirtPath({ sleeve: 1, pad: 11, sleevePad: 8, bottom, flare: 5, neck: 'v', neckDepth: 30 });
      const clip = H.clip('c-' + it.id, d);
      const edge = openEdge(236, bottom, 186, 174);
      // knit patch pocket on one side (side L or R)
      const pocket = side => { const x = side === 'L' ? 132 : 400 - 132 - 34; return `<path d="M${x},440 h34 v32 q0,6 -6,6 h-22 q-6,0 -6,-6 Z" fill="${H.pat('knit', c, shade(c, -.2), 10)}" stroke="${ink(c)}" stroke-width="1.8"/><rect x="${x}" y="440" width="34" height="7" fill="${band}" stroke="${ink(c)}" stroke-width="1.4"/>`; };
      const inner = `<g clip-path="${clip}">${ribHem(bottom - 14, bottom, band)}</g>` +
        `<path d="${G.armPath('L', .86, 1, 8.6)}${G.armPath('R', .86, 1, 8.6)}" fill="${H.grad(band)}" stroke="${ink(c)}" stroke-width="1.8" stroke-linejoin="round"/>` +
        pocket('L') + pocket('R') +
        H.line('M150,346 q8,12 5,28 M250,346 q-8,12 -5,28 M98,362 q10,5 18,0 M302,362 q-10,5 -18,0', c, 1.7, .4);
      const o = openFront(it.id, edge);
      return { back: lining(d, c), front: openGarment(it, d, edge, c, H.pat('knit', c, shade(c, -.2), 12), inner + `<path d="${o.edges}" fill="none" stroke="${band}" stroke-width="22"/>` +
        // rib stitching inside each band: offset toward the outside on the left, mirrored on the right
        `<path d="${H.smooth(edge.map(([x, y]) => [x - 6, y]), false)}${H.smooth(mirrorPts(edge.map(([x, y]) => [x - 6, y])), false)}" fill="none" stroke="${ink(band)}" stroke-width="1" stroke-dasharray="1.5 3" opacity=".5"/>`, band) };
    },
  });

  DOLL.add([
    // Rain jackets in more colours (approved 'rainjacket' shape)
    { id: 'rainjacket-red', shape: 'rainjacket', cat: 'rain', name: { is: 'Rauður pollagalli', en: 'Red rain jacket' }, colors: ['#e2464c', '#d5dbe2'] },
    { id: 'rainjacket-blue', shape: 'rainjacket', cat: 'rain', name: { is: 'Blár pollagalli', en: 'Blue rain jacket' }, colors: ['#3f8fd2', '#d5dbe2'] },
    { id: 'rainjacket-pink', shape: 'rainjacket', cat: 'rain', name: { is: 'Bleikur pollagalli', en: 'Pink rain jacket' }, colors: ['#f17aa6', '#d5dbe2'] },
    { id: 'rainjacket-green', shape: 'rainjacket', cat: 'rain', name: { is: 'Grænn pollagalli', en: 'Green rain jacket' }, colors: ['#4fb36a', '#d5dbe2'] },
    // Jackets
    { id: 'denim-blue', shape: 'jacket-denim', cat: 'jacket', name: { is: 'Gallajakki', en: 'Denim jacket' }, colors: ['#6a8cc8', '#eaa64c', '#c98a3c'] },
    { id: 'denim-pink', shape: 'jacket-denim', cat: 'jacket', name: { is: 'Bleikur gallajakki', en: 'Pink denim jacket' }, colors: ['#f1a2bf', '#ffffff', '#e8e2ea'] },
    { id: 'puffer-pink', shape: 'jacket-puffer', cat: 'jacket', name: { is: 'Bleik dúnúlpa', en: 'Pink puffer jacket' }, colors: ['#f48fb1', '#b84a74', '#f9c0d3'] },
    { id: 'puffer-purple', shape: 'jacket-puffer', cat: 'jacket', name: { is: 'Fjólublá dúnúlpa', en: 'Purple puffer jacket' }, colors: ['#8e6fd6', '#4a3684', '#b9a3ef'], hood: true },
    { id: 'puffer-navy', shape: 'jacket-puffer', cat: 'jacket', name: { is: 'Dökkblá dúnúlpa', en: 'Navy puffer jacket' }, colors: ['#33497f', '#e2464c', '#4a63a3'], hood: true },
    { id: 'puffer-mint', shape: 'jacket-puffer', cat: 'jacket', name: { is: 'Myntugræn dúnúlpa', en: 'Mint puffer jacket' }, colors: ['#8fd6bf', '#3f8a73', '#b9e9d9'] },
    { id: 'fleece-teal', shape: 'jacket-fleece', cat: 'jacket', name: { is: 'Flíspeysa', en: 'Teal fleece jacket' }, colors: ['#4fb0ad', '#2f6f8f'] },
    { id: 'fleece-lilac', shape: 'jacket-fleece', cat: 'jacket', name: { is: 'Fjólublá flíspeysa', en: 'Lilac fleece jacket' }, colors: ['#c6b2ee', '#f39ab8'] },
    { id: 'toggle-camel', shape: 'jacket-toggle', cat: 'jacket', name: { is: 'Ullarkápa', en: 'Camel toggle coat' }, colors: ['#c79a6a', '#f3e2c2', '#5a4436'] },
    { id: 'toggle-red', shape: 'jacket-toggle', cat: 'jacket', name: { is: 'Rauð ullarkápa', en: 'Red toggle coat' }, colors: ['#c8434c', '#f3e2c2', '#3b3739'] },
    { id: 'trench-beige', shape: 'jacket-trench', cat: 'jacket', name: { is: 'Rykfrakki', en: 'Trench coat' }, colors: ['#dcc093', '#6e4a2a', '#cfb07e'] },
    { id: 'trench-yellow', shape: 'jacket-trench', cat: 'jacket', name: { is: 'Gulur regnfrakki', en: 'Yellow trench raincoat' }, colors: ['#f6c636', '#ffffff', '#e8b52a'] },
    { id: 'party-gold', shape: 'jacket-party', cat: 'jacket', name: { is: 'Gylltur sparijakki', en: 'Gold party jacket' }, colors: ['#f2c34d', '#fff6d0', '#ffffff'] },
    { id: 'party-pink', shape: 'jacket-party', cat: 'jacket', name: { is: 'Glitrandi bleikur jakki', en: 'Sparkly pink jacket' }, colors: ['#f07fb0', '#ffffff', '#fde4ec'] },
    { id: 'longcardi-oat', shape: 'jacket-longcardi', cat: 'jacket', name: { is: 'Síð prjónakápa', en: 'Long knitted coat' }, colors: ['#e7d8bf', '#cdb895'] },
    { id: 'longcardi-rose', shape: 'jacket-longcardi', cat: 'jacket', name: { is: 'Bleik prjónakápa', en: 'Rose knitted coat' }, colors: ['#e9a3b5', '#d48197'] },
  ]);
})();
