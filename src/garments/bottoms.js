/* =====================================================================
   Bottoms group: trousers, leggings, dungarees, shorts, skirts,
   snowsuits (kuldagallar) and rain bib trousers (pollabuxur).
   Same style as examples.js: fill → details → soft shading + tinted outline.
   Everything is computed for the LEFT side of the picture and mirrored
   with X() for the right side, so both legs always match.
   ===================================================================== */
(function () {
  'use strict';
  const { shade, ink, mix } = H;
  /** Safe id fragment from a colour. */
  const idOf = s => String(s).replace(/[^a-z0-9]/gi, '');
  const SW = G.stroke;

  /** Final pass for a shape: soft shading overlay plus the tinted outline (same as examples.js). */
  const outline = (d, base, soft = 'v') =>
    `<path d="${d}" fill="url(#soft-${soft})" stroke="${ink(base)}" stroke-width="${SW}" stroke-linejoin="round" stroke-linecap="round"/>`;

  /** Number formatting for path strings. */
  const n1 = v => (Math.round(v * 10) / 10).toString();
  // "x,y" text of a point, rounded for path strings
  const P = p => n1(p[0]) + ',' + n1(p[1]);
  /** Mirror x for side 'R'. */
  const XS = (side, x) => side === 'R' ? 400 - x : x;

  /** Dashed stitching line (jeans style). */
  const dash = (d, col, w = 1.5) => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-dasharray="3 2.5" stroke-linecap="round"/>`;

  /**
   * Edges of the LEFT trouser leg at height y, for a G.pantsPath with the same pad/flare/bottom.
   * Returns [outerX, innerX].
   */
  const legEdges = (y, pad, flare, bottom) => {
    const k = Math.max(0, (y - 476) / Math.max(1, bottom - 476));
    const out = (y <= 476 ? Math.min(G.torsoX(y), G.legOutX(y)) : G.legOutX(y)) - pad - flare * k;
    return [out, G.legInX(y) + pad + flare * k * .6];
  };

  /**
   * Trousers path like G.pantsPath, but safe for loose fits (big pad): the inner leg edge is
   * kept left of the centre line, with the gap between the legs opening softly below the
   * crotch, so the two legs never cross. crotchDrop lowers the crotch (snowsuits).
   * Returns { d, edges(y) } where edges(y) gives [outerX, innerX] of the left leg.
   */
  const trousers = ({ top = 398, bottom = 700, pad = 3, flare = 0, crotchDrop = 0 }) => {
    const crotch = G.crotchY + 2 + pad * .4 + crotchDrop;
    // how far down the leg y is: 0 at the hip, 1 at the hem
    const k = y => Math.max(0, (y - 476) / Math.max(1, bottom - 476));
    // waist → hip: eased curve from the waist width out to the hip (no step at the waistband)
    const hipY = Math.max(top + 30, 446), x0 = G.torsoX(top), x1 = G.legOutX(hipY);
    // smooth curve from 0 to 1 (starts quickly, then flattens)
    const ease = t => 1 - Math.pow(1 - t, 2);
    // outer edge x of the trousers at height y
    const outer = y => (y <= hipY ? x0 + (x1 - x0) * ease(Math.max(0, (y - top) / (hipY - top))) : G.legOutX(Math.min(y, 702))) - pad - flare * k(y);
    // the inner edge may come no closer to the centre than this (0 at the crotch, growing below)
    const inner = y => Math.min(G.legInX(Math.min(y, 702)) + pad + flare * k(y) * .6, 200 - Math.min(1, (y - crotch) / 30) * 4 - .5);
    const ys = [];
    for (let y = top + 6; y < hipY; y += 6) ys.push(y);
    for (let y = hipY; y < bottom; y += 18) ys.push(y);
    ys.push(bottom);
    const outL = [[G.torsoX(top) - pad, top]].concat(ys.map(y => [outer(y), y]));
    const inL = ys.filter(y => y > crotch + 4).map(y => [inner(y), y]).reverse();
    const left = outL.concat(inL).concat([[200, crotch]]);
    const right = left.slice(0, -1).reverse().map(([x, y]) => [400 - x, y]);
    return { d: H.polyPath(left.concat(right)), edges: y => [outer(y), inner(y)], crotch };
  };

  /**
   * Several overlapping paths drawn as ONE garment: a double-width outline under everything,
   * then the fills on top, so the inner seams vanish and only the outer edge shows (at the
   * standard width). `fill` should be a page-space fill (see pageGrad) so no colour jump shows.
   */
  const merged = (paths, fill, base) =>
    paths.map(d => `<path d="${d}" fill="none" stroke="${ink(base)}" stroke-width="${SW * 2}" stroke-linejoin="round"/>`).join('') +
    paths.map(d => `<path d="${d}" fill="${fill}"/>`).join('');

  /** Clip path that is the UNION of several paths (one <path> per part, so windings never cancel). */
  const clipUnion = (id, paths) => H.def(id, `<clipPath id="${id}">${paths.map(d => `<path d="${d}"/>`).join('')}</clipPath>`);

  /** Vertical gradient in page space (same colour at the same height in every part of a piece). */
  const pageGrad = (hex, y0, y1) => {
    const id = 'bt-pg' + hex.replace('#', '') + y0 + '-' + y1;
    return H.def(id, `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="${y0}" x2="0" y2="${y1}"><stop offset="0" stop-color="${shade(hex, .12)}"/><stop offset="1" stop-color="${shade(hex, -.1)}"/></linearGradient>`);
  };

  /** Soft vertical rib / cord texture (many thin lines), meant to be clipped. */
  const ribs = (x0, x1, y0, y1, step, col, w, op) => {
    let d = '';
    for (let x = x0; x <= x1; x += step) d += `M${n1(x)},${y0}V${y1}`;
    return `<path d="${d}" stroke="${col}" stroke-width="${w}" opacity="${op}"/>`;
  };

  /** Waistband with elastic gathers between y0 and y1 (clip it to the garment). */
  const elasticBand = (y0, y1, col) =>
    `<rect x="0" y="${y0}" width="400" height="${y1 - y0}" fill="${H.grad(col)}"/>` +
    ribs(120, 280, y0 + 2, y1 - 2, 4, ink(col), 1, .3) +
    `<path d="M0,${y1}H400" stroke="${ink(col)}" stroke-width="1.6" opacity=".55"/>`;

  /**
   * Clip that hides a garment where the doll's hands are, so the hands look like they
   * hang IN FRONT of wide skirts, tutus and snowsuit legs (hands belong to the body layer,
   * which is drawn below every garment). Uses a copy of core.js's hand silhouette
   * (wrist at 0,0, all absolute commands; extended 30px up the forearm) moved by the same transform core uses:
   * translate(wrist x, wrist y - 2) rotate(±8.7°), mirrored for the right hand.
   */
  const HAND_D = 'M-12,-30 L-11.5,0 C-13,5 -14.5,11 -14.5,17 C-14.8,23 -13.5,28.5 -10.5,29.2 C-7.8,29.8 -7,27 -7,24 ' +
    'C-7.2,30 -6,34.5 -3.4,34.8 C-0.8,35.1 0,32 0,28.5 C0,34 1.4,37.6 3.8,37.6 C6.3,37.6 7,34.5 7,31 ' +
    'C7.3,34 8.6,35.2 10.6,34.7 C12.8,34.1 13.8,30.5 13.7,26.5 C13.6,24.5 14,23 15.2,22.2 ' +
    'C17.2,20.8 17.8,17.5 17,14.5 C16,10.5 14,7 12.4,4.5 C11.8,3 11.5,1.5 11.5,0 L12,-30 Z';
  /** Outline of a hand placed at the wrist of the given side. */
  const handPath = side => {
    const [wx, wy] = G.armPoint(side, 1), L = side === 'L';
    const a = (L ? 8.7 : -8.7) * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
    // grow the hand by ~1px so its outline is fully outside the hole edge
    return HAND_D.replace(/(-?[\d.]+),(-?[\d.]+)/g, (m, xs, ys) => {
      let x = +xs * 1.06, y = +ys * 1.04; if (!L) x = -x;
      return n1(wx + x * ca - y * sa) + ',' + n1(wy - 2 + x * sa + y * ca);
    });
  };
  /** clip-path url: everything except the two hands. */
  const noHands = () => H.def('c-bottoms-nohands', `<clipPath id="c-bottoms-nohands"><path clip-rule="evenodd" d="M-50,-50H450V850H-50Z ${handPath('L')} ${handPath('R')}"/></clipPath>`);

  /**
   * Wrap garment markup so the doll's hands show in front of it. The clip is applied by a CSS
   * rule that only matches inside core's worn-piece group (<g class="piece">), so chest
   * thumbnails (no hands there) are not cut.
   */
  // Hands now have their own layer above skirts in core.js, so no cut-out is needed any more.
  const handsFront = markup => markup;

  /** Tiny four-point twinkle (sparkle) star. */
  const twinkle = (x, y, r, col = '#fff') =>
    `<path d="M${x},${y - r}Q${x},${y} ${x + r},${y}Q${x},${y} ${x},${y + r}Q${x},${y} ${x - r},${y}Q${x},${y} ${x},${y - r}Z" fill="${col}"/>`;

  /* =================================================================
     PANTS
     ================================================================= */

  /* -------------------------------------------------------------
     Leggings: skin-tight, elastic waistband, optional pattern.
     colors: [base, motif colour (for patterns), waistband]
     ------------------------------------------------------------- */
  DOLL.shape('leggings', {
    slot: 'bottom',
    draw(it) {
      const c = it.colors[0], wb = it.colors[2] || shade(c, -.1);
      const d = G.pantsPath({ top: 400, bottom: 698, pad: 2 });
      const clip = H.clip('c-' + it.id, d);
      return `<path d="${d}" fill="${H.fill(it)}"/>` +
        `<g clip-path="${clip}">` +
          elasticBand(398, 412, wb) +
          // soft shine down the front of each leg and over the knees
          `<path d="M160,500 Q156,580 162,680 L170,680 Q164,580 168,500 Z M232,500 Q236,580 230,680 L238,680 Q244,580 240,500 Z" fill="#fff" opacity=".18"/>` +
          `<rect x="0" y="690" width="400" height="10" fill="${shade(c, -.12)}" opacity=".5"/>` +
        `</g>` +
        // creases at the crotch and knees
        H.line('M190,470 l-9,8 M210,470 l9,8 M158,570 q10,5 22,0 M220,570 q10,5 22,0', c, 1.5, .4) +
        outline(d, c, 'h');
    },
  });

  /* -------------------------------------------------------------
     Joggers: loose legs gathered into ribbed ankle cuffs, ribbed
     waistband with a drawstring bow, optional side stripe.
     colors: [base, cuff/waistband, stripe (optional), cord]
     ------------------------------------------------------------- */
  DOLL.shape('joggers', {
    slot: 'bottom',
    draw(it) {
      const c = it.colors[0], rib = it.colors[1] || shade(c, -.1), stripe = it.colors[2], cord = it.colors[3] || '#ffffff';
      const pad = 6, bottom = 684;
      const d = trousers({ top: 398, bottom, pad }).d;
      const clip = H.clip('c-' + it.id, d);
      /** Ribbed ankle cuff for one side (narrower than the leg, so the leg looks gathered). */
      const cuff = side => {
        const cd = G.legPath(side, 676, 700, 2.5);
        const lines = Array.from({ length: 7 }, (_, i) => { const y = 678; const [o, n] = [G.legOutX(y) - 2.5, G.legInX(y) + 2.5]; const x = o + (n - o) * (i + 1) / 8; return `M${n1(XS(side, x))},679v19`; }).join('');
        return `<path d="${cd}" fill="${H.grad(rib)}"/><path d="${lines}" stroke="${ink(rib)}" stroke-width="1.1" opacity=".35"/>` + outline(cd, rib, 'h');
      };
      /** Side stripe following the outer seam of one leg. */
      const sideStripe = side => {
        const pts = [];
        for (let y = 420; y <= 678; y += 16) pts.push([XS(side, legEdges(y, pad, 0, bottom)[0] + 6), y]);
        const d2 = 'M' + pts.map(P).join('L');
        return `<path d="${d2}" fill="none" stroke="${stripe}" stroke-width="6" stroke-linecap="round"/>` +
          `<path d="${d2}" fill="none" stroke="#fff" stroke-width="1.6" stroke-dasharray="1 0" opacity=".5"/>`;
      };
      // gathers just above each cuff (mirrored)
      const gathers = side => H.line(['M', XS(side, 152), ',664 q', side === 'L' ? 3 : -3, ',6 2,12 M', XS(side, 166), ',666 q0,6 0,11 M', XS(side, 180), ',664 q', side === 'L' ? -3 : 3, ',6 -2,12'].join(''), c, 1.5, .5);
      // drawstring: two cords from the eyelets, tied in a small bow
      const string = `<circle cx="194" cy="406" r="2" fill="${ink(rib)}"/><circle cx="206" cy="406" r="2" fill="${ink(rib)}"/>` +
        `<path d="M194,406 Q190,424 186,436 M206,406 Q210,424 214,436" fill="none" stroke="${cord}" stroke-width="3" stroke-linecap="round"/>` +
        `<path d="M194,406 Q190,424 186,436 M206,406 Q210,424 214,436" fill="none" stroke="${ink(cord)}" stroke-width=".8" opacity=".5"/>` +
        `<rect x="183" y="434" width="6" height="9" rx="2" fill="${ink(rib)}"/><rect x="211" y="434" width="6" height="9" rx="2" fill="${ink(rib)}"/>`;
      return `<path d="${d}" fill="${H.fill(it)}"/>` +
        `<g clip-path="${clip}">` + elasticBand(397, 414, rib) +
          (stripe ? sideStripe('L') + sideStripe('R') : '') +
          `<ellipse cx="170" cy="584" rx="13" ry="22" fill="#fff" opacity=".12"/><ellipse cx="230" cy="584" rx="13" ry="22" fill="#fff" opacity=".12"/>` +
        `</g>` +
        // slanted side pockets and soft folds
        H.line('M150,418 Q160,430 160,448 M250,418 Q240,430 240,448', c, 1.8, .55) +
        H.line('M190,470 l-10,9 M210,470 l10,9 M156,560 q12,8 26,2 M244,560 q-12,8 -26,2', c, 1.5, .4) +
        gathers('L') + gathers('R') +
        outline(d, c, 'h') + string + cuff('L') + cuff('R');
    },
  });

  /* -------------------------------------------------------------
     Corduroy trousers: fine vertical cords, rolled cuffs, pockets,
     a heart patch on one knee.
     colors: [base, patch]
     ------------------------------------------------------------- */
  DOLL.shape('cords', {
    slot: 'bottom',
    draw(it) {
      const c = it.colors[0], patch = it.colors[1] || '#f27aa0';
      const d = G.pantsPath({ top: 398, bottom: 702, pad: 4, flare: 3 });
      const clip = H.clip('c-' + it.id, d);
      return `<path d="${d}" fill="${H.grad(c)}"/>` +
        `<g clip-path="${clip}">` +
          // corduroy wales: dark grooves with a light ridge beside each
          ribs(100, 300, 414, 686, 5, shade(c, -.28), 1.6, .38) + ribs(102, 302, 414, 686, 5, '#fff', 1, .18) +
          `<rect x="0" y="397" width="400" height="15" fill="${shade(c, -.07)}"/>` +
          // rolled cuff
          `<rect x="0" y="684" width="400" height="20" fill="${shade(c, .14)}"/>` + ribs(100, 300, 686, 702, 5, shade(c, -.2), 1.4, .3) +
          `<path d="M100,684H300" stroke="${ink(c)}" stroke-width="1.6" opacity=".55"/>` +
        `</g>` +
        `<path d="M142,412H258" stroke="${ink(c)}" stroke-width="1.4" opacity=".45"/>` +
        // curved front pockets, fly and button, belt loops
        H.line('M147,414 Q166,420 171,440 M253,414 Q234,420 229,440 M200,414 V450 Q200,460 192,466', c, 2, .65) +
        `<circle cx="200" cy="405" r="3.6" fill="${H.grad(shade(c, -.25))}" stroke="${ink(c)}" stroke-width="1.4"/>` +
        `<path d="M160,396 v17 M240,396 v17" stroke="${shade(c, -.18)}" stroke-width="4" stroke-linecap="round"/>` +
        // heart patch with running stitches on the left knee
        `<g transform="translate(170,580)">${H.heart(0, 0, 13, patch)}<path d="M0,10.5 C-15,0 -8,-11 0,-4 C8,-11 15,0 0,10.5Z" fill="none" stroke="#fff" stroke-width="1.2" stroke-dasharray="2 2" opacity=".8"/></g>` +
        H.line('M190,470 l-10,8 M210,470 l10,8', c, 1.6, .45) +
        outline(d, c, 'h');
    },
  });

  /* -------------------------------------------------------------
     Flared trousers: fitted to the knee, then a wide flare to the hem.
     colors: [base, motif (for pattern), hem trim]
     it.daisies = true adds embroidered daisies along the flares.
     ------------------------------------------------------------- */
  DOLL.shape('flares', {
    slot: 'bottom',
    draw(it) {
      const c = it.colors[0], trim = it.colors[2] || shade(c, -.15);
      const pad = 3, flare = 20, bottom = 704;
      // fitted down to just above the knee, then an eased flare out to the hem
      const kf = y => { const t = Math.max(0, Math.min(1, (y - 540) / (bottom - 540))); return t * t * (3 - 2 * t); };
      const outL = [[G.torsoX(398) - pad, 398], [G.torsoX(434) - pad, 434], [G.legOutX(476) - pad, 476]];
      for (let y = 500; y <= bottom; y += 12) outL.push([G.legOutX(Math.min(y, 702)) - pad - flare * kf(y), Math.min(y, bottom)]);
      outL.push([G.legOutX(702) - pad - flare, bottom]);
      const inL = [];
      for (let y = bottom; y > 480; y -= 12) inL.push([G.legInX(Math.min(y, 702)) + pad + flare * .45 * kf(y), y]);
      // gentle hem curve: inner corner a touch higher than the outer
      inL[0][1] = bottom - 2;
      const crotch = G.crotchY + 3;
      const left = outL.concat(inL).concat([[200, crotch]]);
      const d = H.polyPath(left.concat(left.slice(0, -1).reverse().map(([x, y]) => [400 - x, y])));
      const clip = H.clip('c-' + it.id, d);
      // daisies along the lower flare, placed for L and mirrored for R
      const daisies = it.daisies ? ['L', 'R'].map(s => [[150, 676, 7], [168, 688, 6], [186, 676, 6], [160, 650, 5]].map(([x, y, r]) =>
        H.flower(XS(s, x), y, r, '#ffffff')).join('')).join('') : '';
      return `<path d="${d}" fill="${H.fill(it)}"/>` +
        `<g clip-path="${clip}">` +
          `<rect x="0" y="397" width="400" height="14" fill="${shade(c, -.08)}"/>` +
          `<rect x="0" y="694" width="400" height="12" fill="${trim}"/>` +
          // light falling down the flare
          `<path d="M152,600 Q146,650 140,700 L150,700 Q154,650 160,600 Z M248,600 Q254,650 260,700 L250,700 Q246,650 240,600 Z" fill="#fff" opacity=".2"/>` +
        `</g>` + daisies +
        `<circle cx="200" cy="404" r="3.6" fill="#f4e7c8" stroke="${ink(c)}" stroke-width="1.4"/>` +
        H.line('M200,412 V448 Q200,460 192,466 M190,470 l-10,8 M210,470 l10,8', c, 1.8, .5) +
        // folds where the flare starts
        H.line('M160,600 q-4,40 -12,90 M240,600 q4,40 12,90 M178,610 q2,40 4,82 M222,610 q-2,40 -4,82', c, 1.4, .35) +
        outline(d, c, 'h');
    },
  });

  /* -------------------------------------------------------------
     Dungarees (smekkbuxur): trousers with a chest bib and two
     shoulder straps with buttons. Drawn at z 40: over tops, under sweaters.
     colors: [base, stitching, buttons]
     ------------------------------------------------------------- */
  DOLL.shape('dungarees', {
    slot: 'bottom',
    z: 40,
    thumb: [96, 236, 208, 480],
    draw(it) {
      const c = it.colors[0], stitch = it.colors[1] || shade(c, .35), btn = it.colors[2] || '#f2c34d';
      const fillMain = it.pattern ? H.fill(it) : H.grad(c);
      const legs = trousers({ top: 396, bottom: 702, pad: 6, flare: 3 }).d;
      const clip = H.clip('c-' + it.id, legs);
      // the bib: slightly narrower at the top, rounded top corners, joins the waistband
      const bib = 'M171,402 L173,312 Q173,302 183,302 L217,302 Q227,302 227,312 L229,402 Z';
      /** One shoulder strap from the bib corner up over the shoulder (mirrored for R). */
      const strap = side => {
        const s = side === 'L' ? 1 : -1;
        const d = `M${XS(side, 178)},306 C${XS(side, 174)},290 ${XS(side, 170)},274 ${XS(side, 166)},258`;
        return `<path d="${d}" fill="none" stroke="${ink(c)}" stroke-width="12.5" stroke-linecap="round"/>` +
          `<path d="${d}" fill="none" stroke="${c}" stroke-width="9.5" stroke-linecap="round"/>` +
          `<path d="M${XS(side, 178) - s * 2.5},302 C${XS(side, 174) - s * 2.5},290 ${XS(side, 170) - s * 2.5},274 ${XS(side, 166) - s * 2.5},260" fill="none" stroke="${stitch}" stroke-width="1.2" stroke-dasharray="2.5 2" opacity=".9"/>`;
      };
      /** Big button where a strap meets the bib. */
      const button = side => `<circle cx="${XS(side, 180)}" cy="314" r="5" fill="${H.grad(btn, 'r')}" stroke="${ink(btn)}" stroke-width="1.6"/>` +
        `<circle cx="${XS(side, 180) - 1.5}" cy="313" r="1" fill="${ink(btn)}"/><circle cx="${XS(side, 180) + 1.5}" cy="315" r="1" fill="${ink(btn)}"/>`;
      return `<path d="${legs}" fill="${fillMain}"/>` +
        `<g clip-path="${clip}">` +
          `<rect x="0" y="396" width="400" height="14" fill="${shade(c, -.07)}"/>` +
          `<rect x="0" y="686" width="400" height="20" fill="${shade(c, .16)}"/>` + dash('M100,690H300', stitch) +
          `<path d="M100,686H300" stroke="${ink(c)}" stroke-width="1.6" opacity=".5"/>` +
          `<ellipse cx="170" cy="580" rx="14" ry="24" fill="#fff" opacity=".12"/><ellipse cx="230" cy="580" rx="14" ry="24" fill="#fff" opacity=".12"/>` +
        `</g>` +
        dash('M142,407H258', stitch) +
        // side buttons at the hips
        `<circle cx="150" cy="420" r="3.4" fill="${H.grad(btn, 'r')}" stroke="${ink(btn)}" stroke-width="1.3"/><circle cx="250" cy="420" r="3.4" fill="${H.grad(btn, 'r')}" stroke="${ink(btn)}" stroke-width="1.3"/>` +
        H.line('M200,412 V452 Q200,462 192,468 M190,472 l-10,8 M210,472 l10,8 M156,572 q12,6 26,0 M218,572 q12,6 26,0', c, 1.6, .45) +
        outline(legs, c, 'h') +
        // bib on top of the waistband, with a pocket and a little heart
        `<path d="${bib}" fill="${fillMain}"/>` +
        dash('M177,398 L178.5,316 Q179,308 186,308 L214,308 Q221,308 221.5,316 L223,398', stitch) +
        `<path d="M186,338 H214 V356 Q214,364 206,364 H194 Q186,364 186,356 Z" fill="${H.grad(shade(c, .05))}" stroke="${ink(c)}" stroke-width="1.8" stroke-linejoin="round"/>` +
        dash('M188,343 H212', stitch, 1.2) + H.heart(200, 353, 6, it.colors[3] || '#f27aa0') +
        outline(bib, c) +
        strap('L') + strap('R') + button('L') + button('R');
    },
  });

  /* =================================================================
     SHORTS
     All shorts end at y ≥ 508 so the doll's lace vest shorts (hem ≈ 503)
     never peek out.
     ================================================================= */
  const SHORTS_THUMB = [100, 384, 200, 170];

  /**
   * Leg-opening band for one side (cuffs, piping, ruffle tops): a strip from y0 to y1
   * that follows a shorts leg cut with G.pantsPath({pad, bottom}); grow = extra width each side.
   */
  const legBand = (side, y0, y1, pad, bottom, grow = 0) => {
    const [o0, i0] = legEdges(y0, pad, 0, bottom), [o1, i1] = legEdges(y1, pad, 0, bottom);
    return H.polyPath([[o0 - grow, y0], [i0 + grow, y0], [i1 + grow, y1], [o1 - grow, y1]].map(([x, y]) => [XS(side, x), y]));
  };

  /* -------------------------------------------------------------
     Denim shorts with rolled cuffs, pockets and stitching.
     Also used with a pattern for "patterned shorts".
     colors: [base, motif (for pattern) or stitching, cuff, stitching]
     ------------------------------------------------------------- */
  DOLL.shape('shorts-denim', {
    slot: 'bottom',
    thumb: SHORTS_THUMB,
    draw(it) {
      const c = it.colors[0], cuffC = it.colors[2] || shade(c, .2), stitch = it.colors[3] || it.colors[1] || '#e7a54b';
      const pad = 5, bottom = 514;
      const d = G.pantsPath({ top: 398, bottom, pad });
      const clip = H.clip('c-' + it.id, d);
      /** Rolled cuff: a slightly wider band at the leg opening. */
      const cuff = side => { const cd = legBand(side, bottom - 13, bottom + 1, pad, bottom, 2.5); return `<path d="${cd}" fill="${H.grad(cuffC)}"/>` + outline(cd, cuffC); };
      return `<path d="${d}" fill="${H.fill(it)}"/>` +
        `<g clip-path="${clip}"><rect x="0" y="397" width="400" height="14" fill="${shade(c, -.08)}" opacity="${it.pattern ? .85 : 1}"/></g>` +
        dash('M141,410H259', stitch) +
        H.line('M146,413 Q166,420 172,442 M254,413 Q234,420 228,442 M200,413 V452 Q200,462 192,468', c, 2, .65) +
        dash('M150,416 Q166,423 170,440', stitch) + dash('M250,416 Q234,423 230,440', stitch) +
        `<circle cx="200" cy="404" r="3.6" fill="#c98a3c" stroke="#8a5a24" stroke-width="1.3"/>` +
        `<path d="M160,396 v16 M240,396 v16" stroke="${shade(c, -.2)}" stroke-width="4" stroke-linecap="round"/>` +
        H.line('M188,474 l-9,8 M212,474 l9,8', c, 1.5, .45) +
        outline(d, c, 'h') + cuff('L') + cuff('R');
    },
  });

  /* -------------------------------------------------------------
     Sporty shorts: loose, elastic waist with drawstring, side
     stripes and a contrast hem piping.
     colors: [base, stripe / piping, waistband]
     ------------------------------------------------------------- */
  DOLL.shape('shorts-sport', {
    slot: 'bottom',
    thumb: SHORTS_THUMB,
    draw(it) {
      const c = it.colors[0], pipe = it.colors[1] || '#ffffff', wb = it.colors[2] || shade(c, -.1);
      const pad = 7, bottom = 512;
      const d = trousers({ top: 398, bottom, pad }).d;
      const clip = H.clip('c-' + it.id, d);
      /** Two parallel stripes down the outer seam of one side. */
      const stripes = side => [6, 12].map(off => {
        const pts = [];
        for (let y = 414; y <= bottom; y += 14) pts.push([XS(side, legEdges(y, pad, 0, bottom)[0] + off), y]);
        return `<path d="M${pts.map(P).join('L')}" fill="none" stroke="${pipe}" stroke-width="3.6" stroke-linecap="round"/>`;
      }).join('');
      return `<path d="${d}" fill="${H.fill(it)}"/>` +
        `<g clip-path="${clip}">` + elasticBand(397, 413, wb) + stripes('L') + stripes('R') +
          `<path d="${legBand('L', bottom - 7, bottom + 2, pad, bottom, 1)}${legBand('R', bottom - 7, bottom + 2, pad, bottom, 1)}" fill="${pipe}"/>` +
        `</g>` +
        // drawstring bow
        `<path d="M196,407 q-10,4 -12,14 M204,407 q10,4 12,14" fill="none" stroke="${pipe}" stroke-width="2.6" stroke-linecap="round"/>` +
        `<path d="M196,407 q-10,4 -12,14 M204,407 q10,4 12,14" fill="none" stroke="${ink(pipe)}" stroke-width=".8" opacity=".5"/>` +
        H.line('M188,474 l-9,8 M212,474 l9,8 M160,440 q6,20 4,40 M240,440 q-6,20 -4,40', c, 1.5, .4) +
        outline(d, c, 'h');
    },
  });

  /* -------------------------------------------------------------
     Frilly shorts: elastic waist, a gathered scalloped ruffle round
     each leg and a little bow at the front.
     colors: [base, motif (pattern), ruffle, bow]
     ------------------------------------------------------------- */
  DOLL.shape('shorts-frill', {
    slot: 'bottom',
    thumb: SHORTS_THUMB,
    draw(it) {
      const c = it.colors[0], ruf = it.colors[2] || '#ffffff', bow = it.colors[3] || '#ef5b8d';
      const pad = 5, bottom = 506;
      const d = G.pantsPath({ top: 398, bottom, pad });
      const clip = H.clip('c-' + it.id, d);
      /** Ruffle around one leg opening: flares out, scalloped lower edge (absolute points, then mirrored). */
      const ruffle = side => {
        const [o, i] = legEdges(bottom - 4, pad, 0, bottom);
        const x0 = o - 6, x1 = i + 5, y = bottom + 13, n = 5, w = (x1 - x0) / n;
        let d2 = `M${P([XS(side, o - 1), bottom - 5])}L${P([XS(side, x0), y])}`;
        for (let k = 0; k < n; k++) d2 += `Q${P([XS(side, x0 + w * (k + .5)), y + 8])} ${P([XS(side, x0 + w * (k + 1)), y])}`;
        d2 += `L${P([XS(side, i + 1), bottom - 5])}Z`;
        const gathers = Array.from({ length: n }, (_, k) => `M${n1(XS(side, x0 + w * (k + .5)))},${bottom}v${11}`).join('');
        return `<path d="${d2}" fill="${H.grad(ruf)}"/>` + `<path d="${gathers}" stroke="${ink(ruf)}" stroke-width="1.2" opacity=".35"/>` + outline(d2, ruf);
      };
      const bowD = 'M200,410 l-12,-7 q-3,7 0,14 Z M200,410 l12,-7 q3,7 0,14 Z';
      return ruffle('L') + ruffle('R') +
        `<path d="${d}" fill="${H.fill(it)}"/>` +
        `<g clip-path="${clip}">` + elasticBand(397, 413, it.pattern ? shade(c, -.06) : shade(c, -.08)) + `</g>` +
        H.line('M188,474 l-9,8 M212,474 l9,8', c, 1.5, .45) +
        outline(d, c, 'h') +
        `<path d="${bowD}" fill="${H.grad(bow)}" stroke="${ink(bow)}" stroke-width="1.6" stroke-linejoin="round"/>` +
        `<circle cx="200" cy="410" r="3" fill="${shade(bow, .2)}" stroke="${ink(bow)}" stroke-width="1.3"/>`;
    },
  });

  /* -------------------------------------------------------------
     Bike shorts: tight, down to above the knee, with a side panel.
     colors: [base, motif (pattern), side panel]
     ------------------------------------------------------------- */
  DOLL.shape('shorts-bike', {
    slot: 'bottom',
    thumb: [100, 384, 200, 190],
    draw(it) {
      const c = it.colors[0], panel = it.colors[2] || shade(c, -.2);
      const pad = 2, bottom = 548;
      const d = G.pantsPath({ top: 400, bottom, pad });
      const clip = H.clip('c-' + it.id, d);
      /** Side panel along the outer seam of one leg. */
      const sidePanel = side => {
        const pts = [], inner = [];
        for (let y = 412; y <= bottom + 4; y += 12) { const o = legEdges(Math.min(y, bottom), pad, 0, bottom)[0]; pts.push([XS(side, o - 2), y]); inner.push([XS(side, o + 10), y]); }
        return H.polyPath(pts.concat(inner.reverse()));
      };
      return `<path d="${d}" fill="${H.fill(it)}"/>` +
        `<g clip-path="${clip}">` + elasticBand(398, 412, shade(c, -.06)) +
          `<path d="${sidePanel('L')}${sidePanel('R')}" fill="${H.grad(panel)}"/>` +
          `<rect x="0" y="${bottom - 6}" width="400" height="8" fill="${shade(c, -.12)}"/>` +
          `<path d="M162,470 Q158,500 162,540 L169,540 Q165,500 169,470 Z M231,470 Q235,500 231,540 L238,540 Q242,500 238,470 Z" fill="#fff" opacity=".2"/>` +
        `</g>` +
        H.line('M190,472 l-9,8 M210,472 l9,8', c, 1.5, .4) +
        outline(d, c, 'h');
    },
  });

  /* =================================================================
     SKIRTS
     ================================================================= */
  const SKIRT_THUMB = [64, 384, 272, 236];

  /**
   * A-line skirt outline as one closed path (left side computed, right mirrored).
   * top waist y, bottom hem y, flare = hem spread beyond the hips, pad = looseness at the waist,
   * hem: 'curve' (soft round hem), 'scallop' (round petals/ruffle), 'zig' (tulle points);
   * step = width of one scallop/point, amp = its depth, shift = phase shift of the scallops (0..1).
   */
  const skirtShape = ({ top = 400, bottom = 540, flare = 30, pad = 4, hem = 'curve', step = 24, amp = 10, shift = 0 }) => {
    const wx = G.torsoX(top) - pad, hx = G.torsoX(Math.min(bottom, 476)) - pad - flare;
    // left edge x of the skirt at height y (widens from waist to hem)
    const xl = y => wx + (hx - wx) * Math.pow((y - top) / (bottom - top), .72);
    const L = [];
    for (let y = top; y < bottom; y += 8) L.push([xl(y), y]);
    L.push([hx, bottom]);
    let d = 'M' + L.map(P).join('L');
    const x0 = hx, x1 = 400 - hx;
    if (hem === 'curve') d += `Q200,${bottom + 12} ${P([x1, bottom])}`;
    else {
      const n = Math.max(3, Math.round((x1 - x0) / step)), w = (x1 - x0) / n;
      // the hem bows down a little in the middle, like a real skirt seen from the front
      const yb = x => bottom + 8 * Math.sin(Math.PI * (x - x0) / (x1 - x0));
      if (shift) d += `L${P([x0 + w * shift, yb(x0 + w * shift)])}`;
      for (let k = 0; k < n; k++) {
        const a = x0 + w * (k + shift), b = Math.min(x1, a + w), m = (a + b) / 2;
        if (a >= x1) break;
        d += hem === 'zig' ? `L${P([m, yb(m) + (k % 2 ? amp * .7 : amp)])}L${P([b, yb(b)])}` : `Q${P([m, yb(m) + amp * 2])} ${P([b, yb(b)])}`;
      }
      d += `L${P([x1, bottom])}`;
    }
    d += 'L' + L.slice().reverse().map(([x, y]) => P([400 - x, y])).join('L') + 'Z';
    return { d, wx, hx, xl };
  };

  /** Waistband for skirts: a rounded band from the left waist edge to the right. */
  const skirtBand = (wx, top, h, col) => {
    const d = `M${n1(wx - 1)},${top - 2} H${n1(401 - wx)} L${n1(401 - wx - .5)},${top + h} H${n1(wx - .5)} Z`;
    return `<path d="${d}" fill="${H.grad(col)}"/>` + outline(d, col);
  };

  /* -------------------------------------------------------------
     Tutu: four layers of soft tulle with pointed hems, gathered at
     a satin waistband, sprinkled with sparkles; bow at the front.
     colors: [tulle, deeper tulle, waistband, sparkle]
     ------------------------------------------------------------- */
  DOLL.shape('tutu', {
    slot: 'bottom',
    thumb: [56, 384, 288, 170],
    draw(it) {
      const [c, deep, band = shade(c, -.15), sparkle = '#ffffff'] = it.colors;
      const top = 402;
      const layers = [
        skirtShape({ top, bottom: 520, flare: 62, pad: 6, hem: 'zig', step: 15, amp: 12, shift: .5 }),
        skirtShape({ top, bottom: 512, flare: 56, pad: 6, hem: 'zig', step: 17, amp: 13 }),
        skirtShape({ top, bottom: 500, flare: 50, pad: 6, hem: 'zig', step: 16, amp: 12, shift: .5 }),
        skirtShape({ top, bottom: 488, flare: 42, pad: 6, hem: 'zig', step: 18, amp: 11 }),
      ];
      const cols = [shade(deep, -.06), deep, mix(c, deep, .4), c];
      /** Fine tulle gathers: lines fanning out from the waist to the hem, clipped to a layer. */
      const gathers = (L, i) => {
        let g = '';
        for (let k = 0; k <= 16; k++) { const t = k / 16; const xb = L.hx + (400 - 2 * L.hx) * t, xt = L.wx + (400 - 2 * L.wx) * t; g += `M${n1(xt)},${top}Q${n1((xt + xb) / 2)},${top + 40} ${n1(xb)},540`; }
        return `<g clip-path="${H.clip(`c-${it.id}-${i}`, L.d)}"><path d="${g}" fill="none" stroke="#fff" stroke-width="1.3" opacity=".35"/></g>`;
      };
      let out = '';
      layers.forEach((L, i) => {
        out += `<path d="${L.d}" fill="${H.grad(cols[i])}" opacity="${i === 3 ? .95 : .9}"/>` + gathers(L, i) +
          // shading + outline in one pass
          `<path d="${L.d}" fill="url(#soft-h)" fill-opacity=".3" stroke="${ink(deep)}" stroke-width="${i === 3 ? 2.2 : 1.6}" stroke-linejoin="round" stroke-opacity="${i === 3 ? .9 : .55}"/>`;
      });
      // sparkles and glitter dots (left half placed by hand, right half mirrored)
      const spots = [[132, 470, 5], [150, 492, 4], [170, 456, 4], [116, 500, 3.5], [186, 482, 3], [142, 444, 3]];
      out += spots.map(([x, y, r]) => twinkle(x, y, r, sparkle) + twinkle(400 - x, y + 4, r, sparkle)).join('');
      out += [[124, 482], [160, 474], [178, 500], [136, 458], [104, 508]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6" fill="${sparkle}"/><circle cx="${400 - x}" cy="${y - 3}" r="1.6" fill="${sparkle}"/>`).join('');
      // satin waistband with a bow
      const wx = G.torsoX(top) - 6;
      out += skirtBand(wx, top - 2, 12, band) +
        `<path d="M${n1(wx + 4)},${top + 1}H${n1(396 - wx)}" stroke="#fff" stroke-width="2" opacity=".5" stroke-linecap="round"/>` +
        `<path d="M200,406 l-14,-8 q-4,8 0,16 Z M200,406 l14,-8 q4,8 0,16 Z M197,408 l-6,16 l5,-2 l3,4 Z M203,408 l6,16 l-5,-2 l-3,4 Z" fill="${H.grad(band)}" stroke="${ink(band)}" stroke-width="1.5" stroke-linejoin="round"/>` +
        `<circle cx="200" cy="406" r="3.6" fill="${shade(band, .25)}" stroke="${ink(band)}" stroke-width="1.3"/>`;
      return handsFront(out);
    },
  });

  /* -------------------------------------------------------------
     Pleated skirt: knife pleats as alternating light/dark panels
     from the waistband to the hem. With it.tartan it becomes a kilt:
     check fabric, a wrapped front flap with fringe and a big pin.
     colors: [base, check colour (tartan), thin line (tartan)]
     ------------------------------------------------------------- */
  DOLL.shape('skirt-pleat', {
    slot: 'bottom',
    thumb: SKIRT_THUMB,
    draw(it) {
      const [c, c2 = '#ffffff', c3 = '#f7d660'] = it.colors;
      const top = 400, bottom = it.long ? 560 : 532;
      const S = skirtShape({ top, bottom, flare: 28, pad: 4 });
      const clip = H.clip('c-' + it.id, S.d);
      let fill = H.grad(c);
      if (it.tartan) {
        // tartan: wide see-through bands both ways + thin bright lines
        const id = 'tartan-' + it.id, s = 36;
        fill = H.def(id, `<pattern id="${id}" width="${s}" height="${s}" patternUnits="userSpaceOnUse"><rect width="${s}" height="${s}" fill="${c}"/>` +
          `<rect x="4" width="12" height="${s}" fill="${c2}" opacity=".45"/><rect y="4" width="${s}" height="12" fill="${c2}" opacity=".45"/>` +
          `<rect x="24" width="2" height="${s}" fill="${c3}" opacity=".9"/><rect y="24" width="${s}" height="2" fill="${c3}" opacity=".9"/>` +
          `<rect x="9" width="2" height="${s}" fill="${shade(c, -.4)}" opacity=".5"/><rect y="9" width="${s}" height="2" fill="${shade(c, -.4)}" opacity=".5"/></pattern>`);
      }
      // pleat panels: every other panel is in shadow, with a crisp fold line
      const N = 12;
      let panels = '', folds = '';
      for (let i = 0; i < N; i++) {
        const xt0 = S.wx + (400 - 2 * S.wx) * i / N, xt1 = S.wx + (400 - 2 * S.wx) * (i + 1) / N;
        const xb0 = S.hx + (400 - 2 * S.hx) * i / N, xb1 = S.hx + (400 - 2 * S.hx) * (i + 1) / N;
        if (i % 2) panels += `<path d="M${n1(xt0)},${top}L${n1(xt1)},${top}L${n1(xb1)},${bottom + 20}L${n1(xb0)},${bottom + 20}Z" fill="#2a1630" opacity=".12"/>`;
        if (i) folds += `M${n1(xt0)},${top + 12}L${n1(xb0)},${bottom + 20}`;
      }
      let flap = '';
      if (it.tartan) {
        // wrapped front flap on the right side with a fringed edge and a kilt pin
        const fd = `M226,${top}L${n1(400 - S.hx + 2)},${top}L${n1(400 - S.hx)},${bottom}L242,${bottom + 6}Z`;
        const fringe = Array.from({ length: 14 }, (_, k) => { const t = k / 13, x = 226 + 16 * t, y = top + 12 + (bottom - top - 8) * t; return `M${n1(x)},${n1(y)}l-6,1`; }).join('');
        flap = `<g clip-path="${clip}"><path d="${fd}" fill="${fill}"/><path d="M226,${top}L242,${bottom + 6}" stroke="${ink(c)}" stroke-width="2"/></g>` +
          `<path d="${fringe}" stroke="${c2}" stroke-width="1.8" stroke-linecap="round"/>` +
          // pin: a bar with a round head and two little charms
          `<path d="M246,${bottom - 52} L254,${bottom - 20}" stroke="#d9dde3" stroke-width="3" stroke-linecap="round"/><path d="M246,${bottom - 52} L254,${bottom - 20}" stroke="#8a8f99" stroke-width="1"/>` +
          `<circle cx="245" cy="${bottom - 55}" r="3.6" fill="#f2c34d" stroke="#a87a1e" stroke-width="1.2"/>` + H.heart(251, bottom - 33, 4, '#e8475a');
      }
      return handsFront(`<path d="${S.d}" fill="${fill}"/>` +
        `<g clip-path="${clip}">${panels}<path d="${folds}" stroke="${ink(c)}" stroke-width="1.3" opacity=".4"/></g>` +
        flap + outline(S.d, c, 'h') + skirtBand(S.wx, top, 12, shade(c, -.1)) +
        (it.tartan ? '' : `<circle cx="200" cy="406" r="3.4" fill="${H.grad('#f4e7c8', 'r')}" stroke="${ink(c)}" stroke-width="1.3"/>`));
    },
  });

  /* -------------------------------------------------------------
     Denim skirt: short A-line with front seam, pockets, button,
     orange stitching and a frayed hem.
     colors: [base, stitching]
     ------------------------------------------------------------- */
  DOLL.shape('skirt-denim', {
    slot: 'bottom',
    thumb: SKIRT_THUMB,
    draw(it) {
      const c = it.colors[0], stitch = it.colors[1] || '#e7a54b';
      const top = 398, bottom = 526;
      const S = skirtShape({ top, bottom, flare: 14, pad: 4 });
      const clip = H.clip('c-' + it.id, S.d);
      // frayed threads along the soft hem curve (quadratic Bezier from hx to 400-hx through 200,bottom+12)
      const qy = t => (1 - t) * (1 - t) * bottom + 2 * (1 - t) * t * (bottom + 12) + t * t * bottom;
      let fray = '';
      for (let k = 1; k < 30; k++) { const t = k / 30, x = S.hx + (400 - 2 * S.hx) * t; fray += `M${n1(x)},${n1(qy(t) - 1)}l${k % 3 - 1},${4 + (k % 2) * 2}`; }
      return handsFront(`<path d="${S.d}" fill="${H.grad(c)}"/>` +
        `<g clip-path="${clip}">` +
          `<rect x="0" y="${top - 1}" width="400" height="14" fill="${shade(c, -.08)}"/>` +
          `<rect x="0" y="${bottom - 10}" width="400" height="30" fill="${shade(c, .18)}" opacity=".6"/>` +
          `<ellipse cx="166" cy="480" rx="16" ry="28" fill="#fff" opacity=".1"/><ellipse cx="234" cy="480" rx="16" ry="28" fill="#fff" opacity=".1"/>` +
        `</g>` +
        dash(`M${n1(S.wx + 3)},${top + 12}H${n1(397 - S.wx)}`, stitch) +
        // yoke seam, front seam with double stitching, pockets
        H.line('M146,430 Q200,440 254,430 M200,412 V532', c, 1.8, .6) + dash('M147,434 Q200,444 253,434', stitch) + dash('M204,440 V530', stitch) +
        H.line('M146,414 Q164,418 170,432 M254,414 Q236,418 230,432', c, 1.8, .6) +
        `<circle cx="200" cy="405" r="3.8" fill="#c98a3c" stroke="#8a5a24" stroke-width="1.4"/>` +
        `<path d="M160,396 v16 M240,396 v16" stroke="${shade(c, -.2)}" stroke-width="4" stroke-linecap="round"/>` +
        outline(S.d, c, 'h') + `<path d="${fray}" stroke="${shade(c, .4)}" stroke-width="1.4" stroke-linecap="round"/>`);
    },
  });

  /* -------------------------------------------------------------
     Tiered ruffle skirt: 3–6 tiers, each wider than the one above,
     with gathered scalloped hems. One colour per tier in it.colors,
     so a rainbow skirt is just six tiers.
     colors: [tier1, tier2, ...]; it.lace = white lace edge on each tier
     ------------------------------------------------------------- */
  DOLL.shape('skirt-tiered', {
    slot: 'bottom',
    thumb: [50, 384, 300, 250],
    draw(it) {
      const cols = it.colors, n = cols.length, top = 400, end = it.long ? 596 : 572;
      let out = '';
      // bottom tier first, then each shorter tier on top of it
      for (let i = n - 1; i >= 0; i--) {
        const bottom = Math.round(452 + (end - 452) * (i / Math.max(1, n - 1)));
        const S = skirtShape({ top, bottom, flare: 18 + 34 * (i + 1) / n, pad: 4, hem: 'scallop', step: 20, amp: 4, shift: i % 2 ? .5 : 0 });
        const c = cols[i];
        const yS = i ? Math.round(452 + (end - 452) * ((i - 1) / Math.max(1, n - 1))) : top;   // where this tier shows from
        const xs = S.xl(Math.min(yS + 2, bottom - 1));
        // gathers: short soft lines just under the seam of the tier above
        let g = '';
        for (let k = 1; k < 18; k++) { const x = xs + (400 - 2 * xs) * k / 18; g += `M${n1(x)},${yS + 4}q${k % 2 ? 2 : -2},8 0,${Math.min(16, bottom - yS - 6)}`; }
        out += `<path d="${S.d}" fill="${H.grad(c)}"/>` +
          `<g clip-path="${H.clip(`c-${it.id}-${i}`, S.d)}">${H.line(g, c, 1.4, .4)}</g>` + outline(S.d, c, 'h');
        if (it.lace) {
          // white lace scallop just inside the hem
          // follows the hem, which bows down 8px in the middle (see skirtShape)
          const [x0, x1] = [S.hx + 3, 397 - S.hx];
          // y of the hem at x (bows down in the middle)
          const yb = x => bottom + 8 * Math.sin(Math.PI * (x - S.hx) / (400 - 2 * S.hx)) - 1;
          const m = Math.round((x1 - x0) / 10), w = (x1 - x0) / m;
          let l = `M${n1(x0)},${n1(yb(x0))}`;
          for (let k = 0; k < m; k++) { const xa = x0 + w * k, xb = xa + w; l += `Q${n1(xa + w / 2)},${n1(yb(xa + w / 2) + 5)} ${n1(xb)},${n1(yb(xb))}`; }
          out += `<g clip-path="${H.clip(`c-${it.id}-${i}`, S.d)}"><path d="${l}" fill="none" stroke="#fff" stroke-width="2.4" stroke-dasharray="2 3" stroke-linecap="round" opacity=".9"/></g>`;
        }
      }
      return handsFront(out + skirtBand(G.torsoX(top) - 4, top, 11, shade(cols[0], -.12)));
    },
  });

  /* -------------------------------------------------------------
     Flower petal skirt: flowery fabric, petal-cut hem with a darker
     petal layer peeking between, ribbon belt and a big flower.
     colors: [base, flower motif, under-petals, belt]
     ------------------------------------------------------------- */
  DOLL.shape('skirt-petal', {
    slot: 'bottom',
    thumb: [56, 384, 288, 216],
    draw(it) {
      const [c, motif = '#ffffff', under = shade(c, -.2), belt = '#7fcf8a'] = it.colors;
      const top = 400;
      const U = skirtShape({ top, bottom: 552, flare: 40, pad: 4, hem: 'scallop', step: 30, amp: 8, shift: .5 });
      const S = skirtShape({ top, bottom: 540, flare: 36, pad: 4, hem: 'scallop', step: 30, amp: 9 });
      // small five-petal flower with a yellow centre at x,y, radius r
      const bloom = (x, y, r) => {
        let p = '';
        for (let k = 0; k < 5; k++) { const a = (k * 72 - 90) * Math.PI / 180; p += `<ellipse cx="${n1(x + Math.cos(a) * r * .62)}" cy="${n1(y + Math.sin(a) * r * .62)}" rx="${n1(r * .5)}" ry="${n1(r * .38)}" transform="rotate(${k * 72} ${n1(x + Math.cos(a) * r * .62)} ${n1(y + Math.sin(a) * r * .62)})" fill="${H.grad('#ffffff', 'r')}" stroke="${ink(c)}" stroke-width="1.2"/>`; }
        return p + `<circle cx="${x}" cy="${y}" r="${n1(r * .32)}" fill="#ffd84d" stroke="#c99a1e" stroke-width="1.2"/>`;
      };
      return handsFront(`<path d="${U.d}" fill="${H.grad(under)}"/>` + outline(U.d, under, 'h') +
        `<path d="${S.d}" fill="${H.pat('flowers', c, motif, it.patternSize || 26)}"/>` +
        `<g clip-path="${H.clip('c-' + it.id, S.d)}">${H.line('M150,430 q-8,50 -20,100 M250,430 q8,50 20,100 M182,440 q-2,50 -6,96 M218,440 q2,50 6,96', c, 1.4, .35)}</g>` +
        outline(S.d, c, 'h') +
        skirtBand(G.torsoX(top) - 4, top, 11, belt) + bloom(164, 407, 12));
    },
  });

  /* =================================================================
     SNOWSUIT (kuldagalli)
     ================================================================= */

  /* -------------------------------------------------------------
     Puffy one-piece winter overall from the neck to the ankles:
     quilted (horizontal puff seams), long sleeves with ribbed cuffs,
     zip with a big pull, reflective strips on arms and legs,
     knee patches, ankle cuffs, a stand-up collar and a hood lying
     down behind the neck (back part).
     Built from G.shirtPath (top, rounded shoulders) + trousers() (legs)
     drawn as one fill and merged by a shared outline.
     colors: [base, patch/cuff colour, reflective, motif (pattern)]
     it.pattern optional (e.g. 'snow', 'stars'): body fabric pattern.
     ------------------------------------------------------------- */
  DOLL.shape('snowsuit', {
    slot: 'jacket',
    occupies: ['jacket', 'bottom'],
    thumb: [50, 214, 300, 510],
    draw(it) {
      const c = it.colors[0], acc = it.colors[1] || shade(c, -.25), refl = it.colors[2] || '#dfe5ec';
      const body = it.pattern ? H.pat(it.pattern, c, it.colors[3] || '#ffffff', it.patternSize || 28) : pageGrad(c, 240, 700);
      // top and legs use the same looseness so their sides meet without a step
      const pad = 11, bottom = 690;
      const top = G.shirtPath({ sleeve: .93, pad, sleevePad: 9, sleeveFlare: 2, bottom: 448, neck: 'high' });
      const T = trousers({ top: 424, bottom, pad, crotchDrop: 4 });
      const legs = T.d;
      const clipAll = clipUnion('c-' + it.id, [top, legs]);
      // quilting: wavy horizontal puff seams across body and legs (one path, clipped)
      // drawn as a tiled pattern (dark seam + light ridge + soft puff highlight), so the markup stays small
      const qid = 'bt-quilt-' + idOf(c);
      const quiltFill = H.def(qid, `<pattern id="${qid}" width="26" height="34" patternUnits="userSpaceOnUse" y="300">` +
        `<path d="M0,0q13,4 26,0" fill="none" stroke="${ink(c)}" stroke-width="1.6" opacity=".35"/>` +
        `<path d="M0,2.5q13,4 26,0" fill="none" stroke="#fff" stroke-width="1.2" opacity=".35"/>` +
        `<ellipse cx="13" cy="17" rx="10" ry="5" fill="#fff" opacity=".16"/></pattern>`);
      // quilting on the sleeves: short seams across each arm, mirrored
      const sleeveSeams = side => [.3, .5, .7].map(t => {
        const [x, y] = G.armPoint(side, t), s = side === 'L' ? 1 : -1;
        return `M${n1(x - s * 26)},${n1(y - 5)}Q${n1(x)},${n1(y + 3)} ${n1(x + s * 26)},${n1(y + 3)}`;
      }).join('');
      // ribbed sleeve cuffs and reflective strips on each arm (mirrored via armPath)
      const cuff = side => { const cd = G.armPath(side, .86, .95, 8.5); return `<path d="${cd}" fill="${H.grad(acc)}"/>` + `<path d="${cd}" fill="url(#soft-h)"/>` + `<path d="${cd}" fill="none" stroke="${ink(acc)}" stroke-width="1.8" stroke-linejoin="round"/>`; };
      // reflective strip across the arm
      const armStrip = side => `<path d="${G.armPath(side, .62, .67, 10)}" fill="${refl}"/>`;
      /** Leg pieces for one side: reflective strip, knee patch, ankle cuff. */
      const legBits = side => {
        // band across the leg between heights y0 and y1, made `grow` px wider on each side
        const band = (y0, y1, grow) => {
          const [o0, i0] = T.edges(y0), [o1, i1] = T.edges(y1);
          return H.polyPath([[o0 - grow, y0], [i0 + grow, y0], [i1 + grow, y1], [o1 - grow, y1]].map(([x, y]) => [XS(side, x), y]));
        };
        const [ko, ki] = T.edges(574), kx = XS(side, (ko + ki) / 2);
        const patch = `M${kx - 17},560 Q${kx - 18},548 ${kx - 6},547 H${kx + 6} Q${kx + 18},548 ${kx + 17},560 V590 Q${kx + 16},602 ${kx},602 Q${kx - 16},602 ${kx - 17},590 Z`;
        const cd = band(bottom - 18, bottom + 1, 1.5);
        return `<path d="${band(632, 641, 0)}" fill="${refl}"/>` +
          `<path d="${patch}" fill="${H.grad(acc)}" stroke="${ink(acc)}" stroke-width="1.8" stroke-linejoin="round"/>` +
          `<path d="M${kx - 12},556 H${kx + 12} M${kx - 12},592 H${kx + 12}" stroke="#fff" stroke-width="1.2" stroke-dasharray="2 2" opacity=".7"/>` +
          `<path d="${cd}" fill="${H.grad(acc)}"/><path d="${cd}" fill="none" stroke="${ink(acc)}" stroke-width="1.8" stroke-linejoin="round"/>` +
          ribs(Math.min(XS(side, T.edges(bottom)[0]), XS(side, T.edges(bottom)[1])) + 4, Math.max(XS(side, T.edges(bottom)[0]), XS(side, T.edges(bottom)[1])) - 3, bottom - 15, bottom - 2, 5, ink(acc), 1, .3);
      };
      const hood = `M146,266 C140,236 166,220 200,220 C234,220 260,236 254,266 Z`;
      const hoodTrim = `M150,262 C146,240 170,228 200,228 C230,228 254,240 250,262`;
      const collar = `M180,236 Q200,232 220,236 L224,262 Q200,270 176,262 Z`;
      return {
        // hood lying down behind the neck: lining, then a fluffy edge
        back: `<path d="${hood}" fill="${H.grad(shade(c, -.25))}" stroke="${ink(c)}" stroke-width="${SW}" stroke-linejoin="round"/>` +
          `<path d="${hoodTrim}" fill="none" stroke="${acc}" stroke-width="6" stroke-linecap="round"/>`,
        front: merged([top, legs], body, c) +
          `<g clip-path="${clipAll}">` +
            `<rect x="0" y="290" width="400" height="410" fill="${quiltFill}"/>` +
            `<path d="${sleeveSeams('L')}${sleeveSeams('R')}" fill="none" stroke="${ink(c)}" stroke-width="1.5" opacity=".35"/>` +
            // chest reflective band and the arm strips
            `<rect x="0" y="352" width="400" height="9" fill="${refl}"/><rect x="0" y="352" width="400" height="9" fill="url(#shine)" opacity=".6"/>` +
            armStrip('L') + armStrip('R') +
            // soft shading over body and legs together
            `<rect x="0" y="230" width="400" height="480" fill="url(#soft-h)" opacity=".7"/>` +
          `</g>` +
          legBits('L') + legBits('R') +
          cuff('L') + cuff('R') +
          // zip from collar to crotch and a chunky pull
          `<path d="M200,262 V474" stroke="${shade(c, -.45)}" stroke-width="4.5" stroke-dasharray="2 2"/>` +
          `<path d="M200,262 V474" stroke="${ink(c)}" stroke-width="1" opacity=".4" transform="translate(-3.5,0)"/>` +
          `<rect x="195" y="266" width="10" height="17" rx="4" fill="${H.grad(acc)}" stroke="${ink(acc)}" stroke-width="1.6"/>` +
          `<circle cx="200" cy="279" r="2" fill="#fff" opacity=".7"/>` +
          // chest pocket with a flap on the left, mirrored star badge on the right
          `<path d="M152,384 h30 v20 q0,7 -7,7 h-16 q-7,0 -7,-7 Z" fill="${body}" stroke="${ink(c)}" stroke-width="1.8" stroke-linejoin="round"/>` +
          `<path d="M150,380 h34 v9 q-17,5 -34,0 Z" fill="${H.grad(acc)}" stroke="${ink(acc)}" stroke-width="1.8" stroke-linejoin="round"/>` +
          H.star(234, 394, 9, refl) +
          // stand-up collar
          `<path d="${collar}" fill="${H.grad(acc)}" stroke="${ink(acc)}" stroke-width="${SW}" stroke-linejoin="round"/>` +
          `<path d="M200,240 V266" stroke="${shade(acc, -.35)}" stroke-width="2"/>`,
      };
    },
  });

  /* =================================================================
     RAIN BIB TROUSERS (pollabuxur)
     ================================================================= */

  /* -------------------------------------------------------------
     Glossy rubber rain trousers with a high bib, elastic braces with
     plastic clips, welded seams, reflective strip at the shins and
     ankle hems. z 48: the bib sits over sweaters, under jackets.
     colors: [base, braces, reflective]
     ------------------------------------------------------------- */
  DOLL.shape('rainbib', {
    slot: 'bottom',
    z: 48,
    thumb: [96, 236, 208, 480],
    draw(it) {
      const c = it.colors[0], brace = it.colors[1] || shade(c, -.35), refl = it.colors[2] || '#dfe5ec';
      const T = trousers({ top: 468, bottom: 700, pad: 9, flare: 3 });
      // high bib: its sides sweep out from the chest down to the hips, where they meet the
      // trouser sides exactly (same x), so bib and trousers read as one piece
      const ox = n1(T.edges(468)[0] + .3);
      const bibL = `M${ox},470 C${ox},440 166,414 166,380 C167,350 167,330 168,316 Q169,306 180,306 H220 Q231,306 232,316 C233,330 233,350 234,380 C234,414 ${n1(400 - ox)},440 ${n1(400 - ox)},470 Z`;
      const fillC = pageGrad(c, 300, 710);
      const clip = clipUnion('c-' + it.id, [T.d, bibL]);
      /** Elastic brace from a bib corner over the shoulder (left computed, right mirrored). */
      const braceL = side => {
        const d = `M${XS(side, 176)},312 C${XS(side, 172)},292 ${XS(side, 168)},274 ${XS(side, 164)},256`;
        return `<path d="${d}" fill="none" stroke="${ink(brace)}" stroke-width="11" stroke-linecap="round"/>` +
          `<path d="${d}" fill="none" stroke="${brace}" stroke-width="8" stroke-linecap="round"/>` +
          `<path d="${d}" fill="none" stroke="#fff" stroke-width="1.2" stroke-dasharray="1 3" opacity=".6"/>`;
      };
      /** Plastic buckle where the brace meets the bib. */
      const buckle = side => `<rect x="${XS(side, 176) - 7}" y="309" width="14" height="11" rx="3" fill="${H.grad('#3b3f4a')}" stroke="#22252c" stroke-width="1.4"/>` +
        `<rect x="${XS(side, 176) - 3.5}" y="312" width="7" height="5" rx="1.5" fill="${shade(c, .1)}"/>`;
      /** Strip band across one leg between y0 and y1. */
      const legBand = (side, y0, y1, grow) => {
        const [o0, i0] = T.edges(y0), [o1, i1] = T.edges(y1);
        return H.polyPath([[o0 - grow, y0], [i0 + grow, y0], [i1 + grow, y1], [o1 - grow, y1]].map(([x, y]) => [XS(side, x), y]));
      };
      // glossy shine streaks (left computed, right mirrored)
      const shineL = [[154, 470, 150, 560], [160, 600, 158, 680], [174, 322, 172, 400]];
      const shine = shineL.map(([x0, y0, x1, y1]) => ['L', 'R'].map(s => `<path d="M${XS(s, x0)},${y0} Q${XS(s, x0 - 4)},${(y0 + y1) / 2} ${XS(s, x1)},${y1}" stroke="#fff" stroke-width="5" stroke-linecap="round" fill="none" opacity=".5"/>`).join('')).join('');
      return merged([T.d, bibL], fillC, c) +
        `<g clip-path="${clip}">` +
          `<path d="${legBand('L', 640, 650, 0)}${legBand('R', 640, 650, 0)}" fill="${refl}"/>` +
          `<path d="${legBand('L', 686, 704, 0)}${legBand('R', 686, 704, 0)}" fill="${shade(c, -.12)}"/>` +
          `<rect x="0" y="300" width="400" height="420" fill="url(#soft-h)" opacity=".8"/>` +
          // welded seams: the bib edge and the inside leg
          `<path d="M146,436 Q200,446 254,436" fill="none" stroke="${shade(c, -.25)}" stroke-width="2.4" opacity=".45"/>` +
        `</g>` +
        // bib pocket with a zip
        `<path d="M184,340 H216 V366 Q216,374 208,374 H192 Q184,374 184,366 Z" fill="${H.grad(shade(c, .06))}" stroke="${ink(c)}" stroke-width="1.8" stroke-linejoin="round"/>` +
        `<path d="M188,346 H212" stroke="${shade(c, -.4)}" stroke-width="2.5" stroke-dasharray="1.5 1.5"/>` +
        `<rect x="207" y="343" width="4" height="9" rx="1.5" fill="#d9dde3" stroke="${ink(c)}" stroke-width="1"/>` +
        H.line('M200,428 V470 M190,474 l-10,8 M210,474 l10,8 M156,568 q12,7 26,0 M218,568 q12,7 26,0', c, 1.8, .45) +
        shine +
        braceL('L') + braceL('R') + buckle('L') + buckle('R');
    },
  });

  /* =================================================================
     Catalog: pants
     ================================================================= */
  DOLL.add([
    { id: 'jeans-pink', shape: 'jeans', cat: 'pants', name: { is: 'Bleikar gallabuxur', en: 'Pink jeans' }, colors: ['#ee9cbb', '#ffffff'] },
    { id: 'jeans-light', shape: 'jeans', cat: 'pants', name: { is: 'Ljósar gallabuxur', en: 'Light jeans' }, colors: ['#8db5df', '#f2b75d'] },
    { id: 'jeans-purple', shape: 'jeans', cat: 'pants', name: { is: 'Fjólubláar gallabuxur', en: 'Purple jeans' }, colors: ['#9b82cf', '#f7d660'] },
    { id: 'leggings-pink', shape: 'leggings', cat: 'pants', name: { is: 'Bleikar leggings', en: 'Pink leggings' }, colors: ['#f48fb6', '#ffffff', '#e2709c'] },
    { id: 'leggings-hearts', shape: 'leggings', cat: 'pants', name: { is: 'Hjartaleggings', en: 'Heart leggings' }, colors: ['#fbe3ec', '#ef5b8d', '#ef7aa3'], pattern: 'hearts', patternSize: 26 },
    { id: 'leggings-stars', shape: 'leggings', cat: 'pants', name: { is: 'Stjörnuleggings', en: 'Star leggings' }, colors: ['#4c5aa8', '#f7d660', '#3b4690'], pattern: 'stars', patternSize: 26 },
    { id: 'leggings-rainbow', shape: 'leggings', cat: 'pants', name: { is: 'Regnbogaleggings', en: 'Rainbow leggings' }, colors: ['#a58be0', '#ffffff', '#8a6fd0'], pattern: 'rainbow', patternSize: 72 },
    { id: 'leggings-snow', shape: 'leggings', cat: 'pants', name: { is: 'Snjókornaleggings', en: 'Snowflake leggings' }, colors: ['#7fb8e6', '#ffffff', '#5f9bd0'], pattern: 'snow', patternSize: 26 },
    { id: 'joggers-grey', shape: 'joggers', cat: 'pants', name: { is: 'Gráar joggingbuxur', en: 'Grey joggers' }, colors: ['#b7bcc6', '#9aa0ad', null, '#f48fb6'] },
    { id: 'joggers-pink', shape: 'joggers', cat: 'pants', name: { is: 'Bleikar joggingbuxur', en: 'Pink joggers' }, colors: ['#f6a9c6', '#ec8db3', '#ffffff', '#ffffff'] },
    { id: 'joggers-navy', shape: 'joggers', cat: 'pants', name: { is: 'Bláar joggingbuxur', en: 'Navy joggers' }, colors: ['#4d5f9e', '#3e4f8a', '#7fd3c4', '#ffffff'] },
    { id: 'cords-mustard', shape: 'cords', cat: 'pants', name: { is: 'Gular flauelsbuxur', en: 'Mustard corduroys' }, colors: ['#e0aa3e', '#e7547a'] },
    { id: 'cords-raspberry', shape: 'cords', cat: 'pants', name: { is: 'Hindberjaflauelsbuxur', en: 'Raspberry corduroys' }, colors: ['#d0577f', '#7fd3c4'] },
    { id: 'dungarees-denim', shape: 'dungarees', cat: 'pants', name: { is: 'Smekkbuxur', en: 'Denim dungarees' }, colors: ['#5f86c4', '#eaa64c', '#f2c34d', '#ef5b6f'] },
    { id: 'dungarees-pink', shape: 'dungarees', cat: 'pants', name: { is: 'Bleikar smekkbuxur', en: 'Pink dungarees' }, colors: ['#f29ac0', '#ffffff', '#ffffff', '#e8475a'] },
    { id: 'dungarees-yellow', shape: 'dungarees', cat: 'pants', name: { is: 'Gular smekkbuxur', en: 'Yellow dungarees' }, colors: ['#f4cf4f', '#ffffff', '#6fb3e6', '#6fb3e6'] },
    { id: 'flares-purple', shape: 'flares', cat: 'pants', name: { is: 'Útvíðar buxur', en: 'Purple flares' }, colors: ['#a77fd8', '#ffffff', '#8a62c4'], daisies: true },
    { id: 'flares-flower', shape: 'flares', cat: 'pants', name: { is: 'Útvíðar blómabuxur', en: 'Flower flares' }, colors: ['#8fd0e8', '#ffffff', '#5fb0d0'], pattern: 'flowers', patternSize: 30 },
    /* shorts */
    { id: 'shorts-denim', shape: 'shorts-denim', cat: 'shorts', name: { is: 'Gallastuttbuxur', en: 'Denim shorts' }, colors: ['#6a8fcb', '#eaa64c', '#a9c3e6'] },
    { id: 'shorts-denim-white', shape: 'shorts-denim', cat: 'shorts', name: { is: 'Hvítar stuttbuxur', en: 'White shorts' }, colors: ['#f5f2ee', '#f27aa0', '#ffffff', '#f27aa0'] },
    { id: 'shorts-strawberry', shape: 'shorts-denim', cat: 'shorts', name: { is: 'Jarðarberjastuttbuxur', en: 'Strawberry shorts' }, colors: ['#fde7ec', '#ffffff', '#f6b3c4', '#e8475a'], pattern: 'strawberry', patternSize: 26 },
    { id: 'shorts-dots', shape: 'shorts-denim', cat: 'shorts', name: { is: 'Doppóttar stuttbuxur', en: 'Polka dot shorts' }, colors: ['#6fc4b8', '#ffffff', '#ffffff', '#ffffff'], pattern: 'dots', patternSize: 18 },
    { id: 'shorts-sport-red', shape: 'shorts-sport', cat: 'shorts', name: { is: 'Íþróttastuttbuxur', en: 'Sporty shorts' }, colors: ['#e2505b', '#ffffff', '#c93d4a'] },
    { id: 'shorts-sport-teal', shape: 'shorts-sport', cat: 'shorts', name: { is: 'Grænbláar íþróttabuxur', en: 'Teal sporty shorts' }, colors: ['#46b7b0', '#fbe36a', '#349a94'] },
    { id: 'shorts-frill-pink', shape: 'shorts-frill', cat: 'shorts', name: { is: 'Pífustuttbuxur', en: 'Frilly shorts' }, colors: ['#f6a9c6', '#ffffff', '#ffffff', '#e8475a'] },
    { id: 'shorts-frill-hearts', shape: 'shorts-frill', cat: 'shorts', name: { is: 'Hjartastuttbuxur', en: 'Heart frilly shorts' }, colors: ['#fff0f4', '#ef5b8d', '#f7b8cd', '#ef5b8d'], pattern: 'hearts', patternSize: 22 },
    { id: 'shorts-bike-purple', shape: 'shorts-bike', cat: 'shorts', name: { is: 'Hjólabuxur', en: 'Bike shorts' }, colors: ['#8e6fd0', '#ffffff', '#f48fb6'] },
    { id: 'shorts-bike-stars', shape: 'shorts-bike', cat: 'shorts', name: { is: 'Stjörnuhjólabuxur', en: 'Star bike shorts' }, colors: ['#2f3f7a', '#f7d660', '#f7d660'], pattern: 'stars', patternSize: 22 },
    /* skirts */
    { id: 'tutu-pink', shape: 'tutu', cat: 'skirt', name: { is: 'Bleikt ballettpils', en: 'Pink tutu' }, colors: ['#fbd3e2', '#f19bbd', '#e66f9b', '#ffffff'] },
    { id: 'tutu-lilac', shape: 'tutu', cat: 'skirt', name: { is: 'Fjólublátt ballettpils', en: 'Lilac tutu' }, colors: ['#e3d6fb', '#b49be8', '#8f73d6', '#fff6b0'] },
    { id: 'tutu-mint', shape: 'tutu', cat: 'skirt', name: { is: 'Myntugrænt ballettpils', en: 'Mint tutu' }, colors: ['#d6f5ec', '#8fdcc6', '#5fbfa6', '#ffffff'] },
    { id: 'skirt-pleat-navy', shape: 'skirt-pleat', cat: 'skirt', name: { is: 'Plíserað pils', en: 'Pleated skirt' }, colors: ['#4d5f9e'] },
    { id: 'skirt-pleat-pink', shape: 'skirt-pleat', cat: 'skirt', name: { is: 'Bleikt plíserað pils', en: 'Pink pleated skirt' }, colors: ['#f29ac0'] },
    { id: 'skirt-kilt-red', shape: 'skirt-pleat', cat: 'skirt', name: { is: 'Köflótt pils', en: 'Check kilt skirt' }, colors: ['#d8414f', '#2f4f8f', '#f7d660'], tartan: true },
    { id: 'skirt-kilt-green', shape: 'skirt-pleat', cat: 'skirt', name: { is: 'Grænt köflótt pils', en: 'Green check skirt' }, colors: ['#3f9a6b', '#2f4f8f', '#ffffff'], tartan: true },
    { id: 'skirt-denim', shape: 'skirt-denim', cat: 'skirt', name: { is: 'Gallapils', en: 'Denim skirt' }, colors: ['#5f86c4', '#eaa64c'] },
    { id: 'skirt-ruffle-pink', shape: 'skirt-tiered', cat: 'skirt', name: { is: 'Pífupils', en: 'Ruffle skirt' }, colors: ['#fbd3e2', '#f6b0cb', '#f08bb2'], lace: true },
    { id: 'skirt-ruffle-blue', shape: 'skirt-tiered', cat: 'skirt', name: { is: 'Blátt pífupils', en: 'Blue ruffle skirt' }, colors: ['#d4ecfb', '#a8d4f2', '#78b6e6'], lace: true },
    { id: 'skirt-rainbow', shape: 'skirt-tiered', cat: 'skirt', name: { is: 'Regnbogapils', en: 'Rainbow skirt' }, colors: ['#ef6f6c', '#f6a65a', '#f7d660', '#7fcf8a', '#6fb3e6', '#a58be0'], long: true },
    { id: 'skirt-flower', shape: 'skirt-petal', cat: 'skirt', name: { is: 'Blómapils', en: 'Flower skirt' }, colors: ['#f6a9c6', '#ffffff', '#e2709c', '#7fcf8a'] },
    /* snowsuits (kuldagallar) */
    { id: 'snowsuit-pink', shape: 'snowsuit', cat: 'snowsuit', name: { is: 'Bleikur kuldagalli', en: 'Pink snowsuit' }, colors: ['#f08bb2', '#8e6fd0', '#e4e9ef'] },
    { id: 'snowsuit-purple', shape: 'snowsuit', cat: 'snowsuit', name: { is: 'Fjólublár kuldagalli', en: 'Purple snowsuit' }, colors: ['#9479d6', '#f48fb6', '#e4e9ef'] },
    { id: 'snowsuit-blue', shape: 'snowsuit', cat: 'snowsuit', name: { is: 'Blár kuldagalli', en: 'Blue snowsuit' }, colors: ['#4f8fd8', '#f7d660', '#e4e9ef'] },
    { id: 'snowsuit-red', shape: 'snowsuit', cat: 'snowsuit', name: { is: 'Rauður kuldagalli', en: 'Red snowsuit' }, colors: ['#e2505b', '#3f5a9a', '#e4e9ef'] },
    { id: 'snowsuit-mint', shape: 'snowsuit', cat: 'snowsuit', name: { is: 'Myntugrænn kuldagalli', en: 'Mint snowsuit' }, colors: ['#6fd0b8', '#f08bb2', '#e4e9ef'] },
    { id: 'snowsuit-snow', shape: 'snowsuit', cat: 'snowsuit', name: { is: 'Snjókornagalli', en: 'Snowflake snowsuit' }, colors: ['#5a6fc4', '#f08bb2', '#e4e9ef', '#ffffff'], pattern: 'snow', patternSize: 30 },
    /* rain bib trousers (pollabuxur) */
    { id: 'rainbib-yellow', shape: 'rainbib', cat: 'rain', name: { is: 'Gular pollabuxur', en: 'Yellow rain trousers' }, colors: ['#f6c636', '#3f5a9a', '#e4e9ef'] },
    { id: 'rainbib-red', shape: 'rainbib', cat: 'rain', name: { is: 'Rauðar pollabuxur', en: 'Red rain trousers' }, colors: ['#e2464c', '#2f3a5a', '#e4e9ef'] },
    { id: 'rainbib-blue', shape: 'rainbib', cat: 'rain', name: { is: 'Bláar pollabuxur', en: 'Blue rain trousers' }, colors: ['#3f86d0', '#f6c636', '#e4e9ef'] },
    { id: 'rainbib-pink', shape: 'rainbib', cat: 'rain', name: { is: 'Bleikar pollabuxur', en: 'Pink rain trousers' }, colors: ['#f07fae', '#8e4fae', '#e4e9ef'] },
  ]);
})();
