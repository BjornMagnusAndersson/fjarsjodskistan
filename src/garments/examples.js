/* =====================================================================
   Example garments – the reference style for every piece of clothing.
   Each shape draws in doll space (viewBox 0 0 400 800) using the G
   geometry helpers, so pieces always fit the doll's body.
   Drawing order inside a piece: fill → details → outline + soft shading.
   ===================================================================== */
(function () {
  'use strict';
  const { shade, ink } = H;
  const SW = G.stroke;

  /** Final pass for a shape: soft shading overlay plus the tinted outline. */
  const outline = (d, base, soft = 'v') =>
    `<path d="${d}" fill="url(#soft-${soft})" stroke="${ink(base)}" stroke-width="${SW}" stroke-linejoin="round" stroke-linecap="round"/>`;

  /** Ring between two radii (for knitted yokes). */
  const annulus = (cx, cy, r0, r1) =>
    `M${cx - r1},${cy}a${r1},${r1} 0 1 0 ${2 * r1},0a${r1},${r1} 0 1 0 ${-2 * r1},0Z` +
    `M${cx - r0},${cy}a${r0},${r0} 0 1 0 ${2 * r0},0a${r0},${r0} 0 1 0 ${-2 * r0},0Z`;

  /** Register a vertical gradient with [offset, colour] stops. Returns url(#id). */
  const addGrad = (id, stops) => H.def(id, `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>`);

  /** Point on a circle, angle in degrees. */
  const pol = (cx, cy, r, deg) => [cx + Math.cos(deg * Math.PI / 180) * r, cy + Math.sin(deg * Math.PI / 180) * r];
  // turn a point [x, y] into the text 'x,y' (one decimal) for use in SVG paths
  const P = p => p[0].toFixed(1) + ',' + p[1].toFixed(1);

  /* -------------------------------------------------------------
     1. T-shirt (top)
     ------------------------------------------------------------- */
  DOLL.shape('tee', {
    slot: 'top',
    draw(it) {
      const c = it.colors[0], trim = it.colors[2] || shade(c, -.12);
      const d = G.shirtPath({ sleeve: .3, pad: 5, bottom: 448, neck: 'round' });
      return `<path d="${d}" fill="${H.fill(it)}"/>` +
        // sleeve hems
        `<path d="${G.armPath('L', .25, .3, 5.5)}" fill="${trim}"/><path d="${G.armPath('R', .25, .3, 5.5)}" fill="${trim}"/>` +
        // ribbed collar
        `<path d="M183,250.5 Q200,270.5 217,250.5" fill="none" stroke="${trim}" stroke-width="7" stroke-linecap="round"/>` +
        `<path d="M184,254 Q200,272 216,254" fill="none" stroke="${ink(c)}" stroke-width="1.4" opacity=".5"/>` +
        // soft folds at the armpits and hem
        H.line('M151,322 q7,12 4,26 M249,322 q-7,12 -4,26 M176,428 q4,8 2,15 M226,426 q-3,9 -1,16', c, 1.8, .45) +
        outline(d, c);
    },
  });

  /* -------------------------------------------------------------
     2. Lopapeysa – Icelandic sweater with a round knitted yoke
     colors: [base, dark, middle band, light dots]
     ------------------------------------------------------------- */
  DOLL.shape('lopi', {
    slot: 'sweater',
    draw(it) {
      const [base, dark, mid, light] = it.colors;
      const d = G.shirtPath({ sleeve: 1, pad: 8, sleevePad: 5, bottom: 452, neck: 'high' });
      const clip = H.clip('c-' + it.id, d);
      const cx = 200, cy = 244;
      let yoke = '';
      // outer thin line and outward teeth
      yoke += `<path d="${annulus(cx, cy, 95, 99)}" fill="${dark}" fill-rule="evenodd"/>`;
      for (let a = 0; a < 360; a += 12) {
        yoke += `<path d="M${P(pol(cx, cy, 80, a - 6))}L${P(pol(cx, cy, 94, a))}L${P(pol(cx, cy, 80, a + 6))}Z" fill="${dark}"/>`;
      }
      // middle band with light dots
      yoke += `<path d="${annulus(cx, cy, 64, 80)}" fill="${mid}" fill-rule="evenodd"/>`;
      for (let a = 0; a < 360; a += 9) { const [x, y] = pol(cx, cy, 72, a); yoke += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.6" fill="${light}"/>`; }
      // inner row of small diamonds, then a dark collar ring
      for (let a = 0; a < 360; a += 14) { const [x, y] = pol(cx, cy, 57, a); yoke += H.diamond(x, y, 5.5, dark); }
      yoke += `<path d="${annulus(cx, cy, 44, 50)}" fill="${dark}" fill-rule="evenodd"/>`;
      // hem band and cuffs repeat the yoke colours
      const band = (y) => `<rect x="0" y="${y}" width="400" height="5" fill="${dark}"/><rect x="0" y="${y + 6}" width="400" height="9" fill="${mid}"/>` +
        Array.from({ length: 34 }, (_, i) => `<circle cx="${i * 12 + 4}" cy="${y + 10.5}" r="2.2" fill="${light}"/>`).join('');
      const rib = Array.from({ length: 50 }, (_, i) => `M${i * 5 + 76},442v12`).join('');
      // two coloured bands near the wrist, for one side
      const cuff = side => `<path d="${G.armPath(side, .84, .88, 7)}" fill="${dark}"/><path d="${G.armPath(side, .89, .95, 7)}" fill="${mid}"/>`;
      return `<path d="${d}" fill="${H.pat('knit', base, shade(base, -.25), 10)}"/>` +
        `<g clip-path="${clip}">${yoke}${band(424)}<path d="${rib}" stroke="${ink(base)}" stroke-width="1.2" opacity=".35"/>${cuff('L')}${cuff('R')}</g>` +
        // high ribbed collar
        `<path d="M185,242 Q200,256 215,242" fill="none" stroke="${dark}" stroke-width="9" stroke-linecap="round"/>` +
        outline(d, base);
    },
  });

  /* -------------------------------------------------------------
     3. Rain jacket (pollagalli jakki) with hood, zip, pockets and reflective strips
     ------------------------------------------------------------- */
  DOLL.shape('rainjacket', {
    slot: 'jacket',
    draw(it) {
      const c = it.colors[0], refl = it.colors[1] || '#cfd6de', lining = shade(c, -.28);
      const d = G.shirtPath({ sleeve: 1, pad: 10, sleevePad: 7, bottom: 476, flare: 8, neck: 'round', neckDepth: 6 });
      const clip = H.clip('c-' + it.id, d);
      const hood = 'M148,264 C144,240 168,226 200,226 C232,226 256,240 252,264 Z';  // hood lying down behind the neck
      const collar = 'M186,244 Q172,250 168,266 Q184,272 199,262 Z M214,244 Q228,250 232,266 Q216,272 201,262 Z';
      // patch pocket with a flap and a button; x is the left edge of the pocket
      const pocket = x => `<path d="M${x},402 h34 v24 q0,8 -8,8 h-18 q-8,0 -8,-8 Z" fill="${H.grad(c)}" stroke="${ink(c)}" stroke-width="2"/>` +
        `<path d="M${x - 2},398 h38 v10 q-19,5 -38,0 Z" fill="${H.grad(shade(c, -.06))}" stroke="${ink(c)}" stroke-width="2" stroke-linejoin="round"/>` +
        `<circle cx="${x + 17}" cy="${405}" r="2.4" fill="${ink(c)}"/>`;
      // reflective stripe across the sleeve, for one side
      const strip = side => `<path d="${G.armPath(side, .7, .76, 9)}" fill="${refl}"/>`;
      const shine = `<path d="M142,300 Q132,330 134,380 Q138,338 150,306 Z" fill="#fff" opacity=".45"/>` +
        `<path d="M170,280 Q160,310 162,350 Q166,316 176,288 Z" fill="#fff" opacity=".35"/>`;
      return {
        back: `<path d="${hood}" fill="${H.grad(lining)}" stroke="${ink(c)}" stroke-width="${SW}"/>`,
        front: `<path d="${d}" fill="${H.grad(c)}"/>` +
          `<g clip-path="${clip}"><rect x="0" y="344" width="400" height="10" fill="${refl}"/><rect x="0" y="344" width="400" height="10" fill="url(#shine)" opacity=".5"/>${strip('L')}${strip('R')}</g>` +
          pocket(148) + pocket(218) +
          // zip and its pull
          `<path d="M200,262 V478" stroke="${shade(c, -.4)}" stroke-width="4" stroke-dasharray="2 2"/>` +
          `<rect x="196" y="262" width="8" height="14" rx="3" fill="#d9dde3" stroke="${ink(c)}" stroke-width="1.6"/>` +
          shine + outline(d, c) +
          `<path d="${collar}" fill="${H.grad(c)}" stroke="${ink(c)}" stroke-width="${SW}" stroke-linejoin="round"/>` +
          '',
      };
    },
  });

  /* -------------------------------------------------------------
     4. Jeans with pockets, orange stitching and rolled cuffs
     ------------------------------------------------------------- */
  DOLL.shape('jeans', {
    slot: 'bottom',
    draw(it) {
      const c = it.colors[0], stitch = it.colors[1] || '#e7a54b';
      const d = G.pantsPath({ top: 398, bottom: 704, pad: 4, flare: 3 });
      const clip = H.clip('c-' + it.id, d);
      // dashed stitching line along the given path
      const dash = (path) => `<path d="${path}" fill="none" stroke="${stitch}" stroke-width="1.5" stroke-dasharray="3 2.5" stroke-linecap="round"/>`;
      return `<path d="${d}" fill="${H.grad(c)}"/>` +
        `<g clip-path="${clip}">` +
          `<rect x="0" y="398" width="400" height="14" fill="${shade(c, -.08)}"/>` +
          `<rect x="0" y="686" width="400" height="20" fill="${shade(c, .2)}"/>` + dash('M100,690 H300') +
          `<path d="M120,686 H280" stroke="${ink(c)}" stroke-width="1.6" opacity=".5"/>` +
          // knee fades
          `<ellipse cx="170" cy="580" rx="14" ry="26" fill="#fff" opacity=".12"/><ellipse cx="230" cy="580" rx="14" ry="26" fill="#fff" opacity=".12"/>` +
        `</g>` +
        dash('M140,410 H260') +
        // front pockets, fly and button
        H.line('M146,413 Q166,420 172,442 M254,413 Q234,420 228,442', c, 2, .7) + dash('M150,416 Q166,423 170,440') + dash('M250,416 Q234,423 230,440') +
        H.line('M200,414 V450 Q200,462 190,468', c, 2, .6) + dash('M206,414 V448 Q205,458 198,463') +
        `<circle cx="200" cy="405" r="3.8" fill="#c98a3c" stroke="#8a5a24" stroke-width="1.4"/>` +
        // belt loops
        `<path d="M158,396 v17 M242,396 v17" stroke="${shade(c, -.2)}" stroke-width="4" stroke-linecap="round"/>` +
        // creases at crotch and knees
        H.line('M190,470 l-10,8 M210,470 l10,8 M156,572 q12,6 26,0 M218,572 q12,6 26,0', c, 1.6, .45) +
        outline(d, c, 'h');
    },
  });

  /* -------------------------------------------------------------
     5. Ice princess dress (our own design): puff sleeves, crystal belt,
     layered skirt with an icicle hem and snowflakes
     colors: [ice, deep, sparkle]
     ------------------------------------------------------------- */
  DOLL.shape('gown-ice', {
    slot: 'dress',
    occupies: ['dress', 'top', 'bottom'],
    draw(it) {
      const [ice, deep, sparkle, lilac = '#b9a8f2'] = it.colors;
      const wx = G.torsoX(406) - 3, top = 404;
      // skirt edge (left side) at height y; the right side mirrors it
      const xl = y => wx - (wx - 58) * Math.pow(Math.max(0, (y - top) / 304), .7);
      /** One skirt tier from the waist down to yEnd, with a scalloped (or icicle) hem. */
      const tier = (yEnd, step, amp, icicle) => {
        let d = `M${wx},${top}`;
        for (let y = top + 20; y < yEnd; y += 20) d += `L${xl(y).toFixed(1)},${y}`;
        const x0 = xl(yEnd), x1 = 400 - x0, n = Math.max(4, Math.round((x1 - x0) / step)), w = (x1 - x0) / n;
        d += `L${x0.toFixed(1)},${yEnd}`;
        for (let i = 0; i < n; i++) d += icicle ? `l${(w / 2).toFixed(1)},${i % 2 ? amp * .6 : amp}l${(w / 2).toFixed(1)},${i % 2 ? -amp * .6 : -amp}` : `q${(w / 2).toFixed(1)},${amp} ${w.toFixed(1)},0`;
        for (let y = Math.floor((yEnd - 1) / 20) * 20; y > top; y -= 20) d += `L${(400 - xl(y)).toFixed(1)},${y}`;
        return d + `L${400 - wx},${top}Z`;
      };
      // make a gradient for this item (id suffix + colour stops) and return it for use as a fill
      const g = (id, stops) => addGrad('ig-' + it.id + id, stops);
      const t3 = tier(700, 19, 12, true), t2 = tier(612, 26, 14), t1 = tier(526, 30, 14);
      /** Scalloped white frost band at hem height y (drawn just above a tier edge). */
      const ruffle = (yEnd, step, amp) => {
        const x0 = xl(yEnd), x1 = 400 - x0, n = Math.max(4, Math.round((x1 - x0) / step)), w = (x1 - x0) / n;
        let d = `M${x0.toFixed(1)},${yEnd}`;
        for (let i = 0; i < n; i++) d += `q${(w / 2).toFixed(1)},${amp} ${w.toFixed(1)},0`;
        return `<path d="${d}" fill="none" stroke="#ffffff" stroke-width="6" stroke-linecap="round" opacity=".9"/>` +
          `<path d="${d}" fill="none" stroke="#bfe0f4" stroke-width="2" stroke-dasharray="2 6" stroke-linecap="round"/>`;
      };
      // crystals on the icicle tips
      const x0 = xl(700), n3 = Math.max(4, Math.round((400 - 2 * x0) / 19)), w3 = (400 - 2 * x0) / n3;
      const crystals = Array.from({ length: n3 }, (_, i) => i % 2 ? '' : H.diamond(x0 + w3 * (i + .5), 712 + 2, 3.4, '#ffffff')).join('');
      // frost swirls and snowflakes
      const swirl = (x, y, s) => `<path d="M${x},${y} q${8 * s},-10 ${16 * s},0 q${6 * s},8 -2,${12 * s > 0 ? 12 : -12} q-8,2 -8,-6" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".75"/>`;
      const swirls = [[110, 660, 1], [170, 676, 1], [230, 668, -1], [290, 656, -1], [128, 586, 1], [272, 590, -1], [200, 640, 1], [150, 500, 1], [250, 496, -1]].map(a => swirl(...a)).join('');
      const flakes = [[118, 646, 10], [282, 640, 11], [200, 676, 9], [160, 570, 9], [244, 566, 10], [200, 488, 8], [134, 470, 6], [266, 468, 6]]
        .map(([x, y, r]) => H.flake(x, y, r, '#ffffff') + `<circle cx="${x}" cy="${y}" r="${r * .22}" fill="${lilac}"/>`).join('');
      // little four-pointed sparkle at x,y with radius r
      const twinkle = (x, y, r) => `<path d="M${x},${y - r}Q${x},${y} ${x + r},${y}Q${x},${y} ${x},${y + r}Q${x},${y} ${x - r},${y}Q${x},${y} ${x},${y - r}Z" fill="#fff"/>`;
      const twinkles = [[140, 540, 5], [262, 530, 6], [104, 690, 4], [300, 684, 5], [186, 600, 4], [226, 616, 5], [176, 452, 4], [232, 444, 4]].map(a => twinkle(...a)).join('');
      // bodice, sleeves with fluffy trim, crystal belt, snowflake brooch
      const sleeves = G.shirtPath({ sleeve: .24, pad: 3, sleevePad: 8, sleeveFlare: 3, bottom: 380, neck: 'scoop' });
      const bodice = G.shirtPath({ sleeve: 0, pad: 2, bottom: 412, neck: 'scoop', neckDepth: 18 });
      // row of five fluffy white balls along the sleeve edge, for one side
      const fluff = side => Array.from({ length: 5 }, (_, i) => { const [x, y] = G.armPoint(side, .25); const k = (i - 2) * 6.5; const sx = side === 'L' ? 1 : -1; return `<circle cx="${(x + sx * k * .96).toFixed(1)}" cy="${(y + k * .28).toFixed(1)}" r="5.2" fill="#fff" stroke="#c9dceb" stroke-width="1.2"/>`; }).join('');
      const belt = Array.from({ length: 9 }, (_, i) => H.diamond(160 + i * 10, 408, 5, i % 2 ? '#ffffff' : lilac)).join('');
      const brooch = H.flake(200, 300, 13, '#ffffff') + H.flake(200, 300, 7, lilac) + `<circle cx="200" cy="300" r="3.5" fill="#fff" stroke="${ink(deep)}" stroke-width="1"/>`;
      const tierCols = [[shade(deep, -.08), deep], [shade(deep, .18), shade(ice, -.05)], [ice, '#e8f7ff']];
      // gradient fill for skirt tier number i (0 = top tier, 2 = bottom tier)
      const tierFill = (i) => g(String(i), [[0, tierCols[i][0]], [1, tierCols[i][1]]]);
      /** White frosted ruffle along a tier's scalloped hem. */
      const frost = d => `<path d="${d}" fill="none" stroke="#ffffff" stroke-width="5" stroke-dasharray="0 1000"/>`;
      return `<path d="${t3}" fill="${tierFill(2)}"/>` + `<path d="${t3}" fill="url(#soft-h)" opacity=".2"/>` + outline(t3, deep) + crystals +
        `<path d="${t2}" fill="${tierFill(1)}"/>` + `<path d="${t2}" fill="url(#soft-h)" opacity=".35"/>` + outline(t2, deep) + ruffle(612, 26, 14) +
        `<path d="${t1}" fill="${tierFill(0)}"/>` + `<path d="${t1}" fill="url(#soft-h)" opacity=".35"/>` + outline(t1, deep) + ruffle(526, 30, 14) +
        swirls + flakes + twinkles +
        `<path d="M132,520 Q114,600 104,680 Q124,604 144,526 Z" fill="url(#shine)" opacity=".5"/>` +
        `<path d="${sleeves}" fill="${H.pat('sparkle', shade(ice, .1), '#ffffff', 16)}"/>` + outline(sleeves, deep) + fluff('L') + fluff('R') +
        `<path d="${bodice}" fill="${H.pat('sparkle', deep, '#e6f6ff', 16)}"/>` + outline(bodice, deep) +
        `<path d="M175,252 Q200,290 225,252" fill="none" stroke="#ffffff" stroke-width="3" stroke-dasharray="1 5" stroke-linecap="round"/>` + brooch +
        `<rect x="${wx}" y="402" width="${400 - 2 * wx}" height="12" rx="4" fill="${H.grad(shade(deep, -.15))}" stroke="${ink(deep)}" stroke-width="2"/>` + belt;
    },
  });

  /* -------------------------------------------------------------
     6. Bobble beanie with a folded rib cuff
     ------------------------------------------------------------- */
  DOLL.shape('beanie', {
    slot: 'hat',
    draw(it) {
      const c = it.colors[0], c2 = it.colors[1] || '#ffffff', pom = it.colors[2] || c2;
      const dome = 'M114,124 C108,68 148,44 200,44 C252,44 292,68 286,124 Z';
      const cuff = 'M106,106 Q200,90 294,106 L296,134 Q200,116 104,134 Z';
      const fill = it.pattern ? H.pat(it.pattern, c, c2, 20) : H.pat('knit', c, shade(c, -.3), 10);
      const ribs = Array.from({ length: 37 }, (_, i) => { const x = 110 + i * 5; return `M${x},${104 - Math.sin((x - 106) / 188 * Math.PI) * 12}v26`; }).join('');
      // fluffy pompom: a ring of small puffs
      let puffs = '';
      for (let a = 0; a < 360; a += 30) { const [x, y] = pol(200, 36, 14, a); puffs += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="8" fill="${H.grad(pom, 'r')}" stroke="${ink(pom)}" stroke-width="1.6"/>`; }
      return `<path d="${dome}" fill="${fill}"/>` + outline(dome, c) +
        `<path d="${cuff}" fill="${H.grad(shade(c, -.05))}"/>` + `<path d="${ribs}" stroke="${ink(c)}" stroke-width="1.3" opacity=".35"/>` + outline(cuff, c) +
        puffs + `<circle cx="200" cy="36" r="13" fill="${H.grad(pom, 'r')}"/>`;
    },
  });

  /* -------------------------------------------------------------
     7. Tiara with three peaks and gems (sits on top of the hair)
     colors: [metal, main gem, small gems]
     ------------------------------------------------------------- */
  DOLL.shape('tiara', {
    slot: 'hat',
    thumb: [114, 22, 172, 96],
    draw(it) {
      const [metal, gem, gem2] = it.colors;
      const { cx, cy, rx, ry } = G.head;
      // point on the head outline at angle deg, pushed outward by off
      const at = (deg, off) => [cx + Math.cos(deg * Math.PI / 180) * (rx + off), cy + Math.sin(deg * Math.PI / 180) * (ry + off)];
      // one pointed crown spike on the head outline at angle a, with height h and half-width w
      const peak = (a, h, w) => `M${P(at(a - w, 7))}Q${P(at(a - w * .35, 7 + h * .55))} ${P(at(a, 7 + h))}Q${P(at(a + w * .35, 7 + h * .55))} ${P(at(a + w, 7))}Z`;
      const peaks = [[234, 13, 8], [252, 19, 9], [270, 30, 10], [288, 19, 9], [306, 13, 8]].map(([a, h, w]) => peak(a, h, w)).join('');
      const outer = G.headArc(214, 326, 7, 24), inner = G.headArc(326, 214, 0, 24);
      const band = H.polyPath(outer.concat(inner));
      const gems = [234, 252, 288, 306].map(a => { const [x, y] = at(a, 15); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.6" fill="${H.grad(gem2, 'r')}" stroke="${ink(gem2)}" stroke-width="1.2"/>`; }).join('');
      const [tx, ty] = at(270, 22);
      const drop = `<path d="M${tx},${ty - 9} Q${tx + 8},${ty + 2} ${tx},${ty + 8} Q${tx - 8},${ty + 2} ${tx},${ty - 9} Z" fill="${H.grad(gem, 'r')}" stroke="${ink(gem)}" stroke-width="1.5"/>` +
        `<path d="M${tx - 2},${ty - 3} l2,-3" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>`;
      return `<path d="${peaks}" fill="${H.grad(metal)}" stroke="${ink(metal)}" stroke-width="2" stroke-linejoin="round"/>` +
        `<path d="${band}" fill="${H.grad(metal)}" stroke="${ink(metal)}" stroke-width="2" stroke-linejoin="round"/>` +
        `<path d="${band}" fill="url(#shine)" opacity=".5"/>` + gems + drop;
    },
  });

  /* -------------------------------------------------------------
     8. Heart sunglasses (see-through lenses so the eyes still show)
     ------------------------------------------------------------- */
  const heartD = (cx, cy, r) => `M${cx},${cy + r * .95} C${cx - r * 1.5},${cy + r * .05} ${cx - r * .95},${cy - r * 1.05} ${cx},${cy - r * .38} C${cx + r * .95},${cy - r * 1.05} ${cx + r * 1.5},${cy + r * .05} ${cx},${cy + r * .95} Z`;
  DOLL.shape('glasses-heart', {
    slot: 'glasses',
    // heart-shaped see-through lenses over the eyes, with a frame and a bridge over the nose
    draw(it) {
      const frame = it.colors[0], lens = it.colors[1] || '#f7a6c2';
      const [[lx, ly], [rx, ry]] = G.eyes;
      const lens1 = heartD(lx, ly + 2, 20), lens2 = heartD(rx, ry + 2, 20);
      return `<path d="${lens1}${lens2}" fill="${lens}" opacity=".42"/>` +
        `<path d="M${lx - 8},${ly - 6} q4,-5 9,-4 M${rx - 8},${ry - 6} q4,-5 9,-4" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity=".85"/>` +
        `<path d="${lens1}${lens2}M190,157 Q200,150 210,157 M150,156 L129,154 M250,156 L271,154" fill="none" stroke="${ink(frame)}" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"/>` +
        `<path d="${lens1}${lens2}M190,157 Q200,150 210,157 M150,156 L129,154 M250,156 L271,154" fill="none" stroke="${frame}" stroke-width="4.2" stroke-linejoin="round" stroke-linecap="round"/>`;
    },
  });

  /* -------------------------------------------------------------
     9. Rain boots (glossy shaft, rim and dark sole)
     ------------------------------------------------------------- */
  DOLL.shape('rainboots', {
    slot: 'shoes',
    thumb: [116, 596, 168, 158],
    draw(it) {
      const c = it.colors[0], rim = it.colors[1] || shade(c, .25), sole = it.colors[2] || '#4a3b3f';
      const top = 612, low = 716, pad = 6, flare = 3;
      // one boot (s = 'L' or 'R'): glossy shaft, rim and sole
      const side = (s) => {
        const L = s === 'L', X = x => L ? x : 400 - x;
        // how far down the boot y is: 0 at the top edge, 1 at the bottom
        const k = y => (y - top) / (low - top);
        const outer = [], inner = [];
        for (let y = top; y <= low; y += 13) {
          outer.push([X(G.legOutX(y) - pad - flare * k(y)), y]);
          inner.push([X(G.legInX(y) + pad + flare * k(y) * .6), y]);
        }
        const shaft = H.polyPath(outer.concat(inner.slice().reverse()));
        const edges = 'M' + outer.map(P).join('L') + 'M' + inner.map(P).join('L');
        const foot = G.footPath(s, 6, 3);
        const fclip = H.clip(`c-${it.id}-${s}`, foot);
        const [fx, fy] = G.feet[L ? 0 : 1];
        const rimD = H.polyPath([outer[0], [outer[0][0] + (L ? -2 : 2), top + 12], [inner[0][0] + (L ? 2 : -2), top + 12], inner[0]]);
        return `<path d="${foot}" fill="${H.fill(it)}"/>` + `<g clip-path="${fclip}"><rect x="${fx - 50}" y="${fy + 8}" width="100" height="30" fill="${sole}"/></g>` + outline(foot, c, 'r') +
          `<path d="${shaft}" fill="${H.fill(it)}"/><path d="${shaft}" fill="url(#soft-h)"/>` +
          `<path d="${edges}" fill="none" stroke="${ink(c)}" stroke-width="${SW}" stroke-linecap="round"/>` +
          `<path d="${rimD}" fill="${H.grad(rim)}" stroke="${ink(c)}" stroke-width="2" stroke-linejoin="round"/>` +
          `<path d="M${X(158)},630 Q${X(155)},660 ${X(158)},690" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".55" fill="none"/>`;
      };
      return side('L') + side('R');
    },
  });

  /* -------------------------------------------------------------
     10. Mary Jane shoes with a strap and button
     ------------------------------------------------------------- */
  DOLL.shape('maryjane', {
    slot: 'shoes',
    draw(it) {
      const c = it.colors[0], sole = it.colors[1] || '#5a3a3f';
      // one Mary Jane shoe (s = 'L' or 'R'): shoe, sole, strap across the foot and a button
      const side = s => {
        const L = s === 'L', [fx, fy] = G.feet[L ? 0 : 1], o = L ? -1 : 1;
        const foot = G.footPath(s, 3, 2);
        const fclip = H.clip(`c-${it.id}-${s}`, foot);
        const opening = `<ellipse cx="${fx + o * 2}" cy="${fy - 15}" rx="13" ry="7" fill="${PALETTE.SKIN.base}" stroke="${ink(c)}" stroke-width="1.8"/>`;
        const strap = `<path d="M${fx - 15},${fy - 12} Q${fx},${fy - 18} ${fx + 15},${fy - 13}" fill="none" stroke="${ink(c)}" stroke-width="7.5" stroke-linecap="round"/>` +
          `<path d="M${fx - 15},${fy - 12} Q${fx},${fy - 18} ${fx + 15},${fy - 13}" fill="none" stroke="${shade(c, -.3)}" stroke-width="4.5" stroke-linecap="round"/>`;
        const button = `<circle cx="${fx - o * 13}" cy="${fy - 13}" r="3.2" fill="#f4e7c8" stroke="${ink(c)}" stroke-width="1.4"/>`;
        return `<path d="${foot}" fill="${H.grad(c)}"/>` + `<g clip-path="${fclip}"><rect x="${fx - 50}" y="${fy + 10}" width="100" height="20" fill="${sole}"/></g>` +
          outline(foot, c, 'r') + opening + strap + button +
          `<path d="M${fx + o * 14},${fy - 2} q${o * 4},3 ${o * 4},8" stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none" opacity=".7"/>`;
      };
      return side('L') + side('R');
    },
  });

  /* -------------------------------------------------------------
     Catalog entries for the examples
     ------------------------------------------------------------- */
  DOLL.add([
    { id: 'tee-strawberry', shape: 'tee', cat: 'top', name: { is: 'Jarðarberjabolur', en: 'Strawberry tee' }, colors: ['#fff1f4', '#ffffff', '#f48ca0'], pattern: 'strawberry', patternSize: 30 },
    { id: 'lopi-classic', shape: 'lopi', cat: 'sweater', name: { is: 'Lopapeysa', en: 'Lopapeysa' }, colors: ['#ece3d2', '#4b3a35', '#6f9cc9', '#ffffff'] },
    { id: 'rainjacket-yellow', shape: 'rainjacket', cat: 'rain', name: { is: 'Gulur pollagalli', en: 'Yellow rain jacket' }, colors: ['#f6c636', '#d5dbe2'] },
    { id: 'jeans-blue', shape: 'jeans', cat: 'pants', name: { is: 'Gallabuxur', en: 'Jeans' }, colors: ['#5577b8', '#eaa64c'] },
    { id: 'gown-ice', shape: 'gown-ice', cat: 'dress', name: { is: 'Ísprinsessukjóll', en: 'Ice princess dress' }, colors: ['#cdeefc', '#3f8fd2', '#ffffff', '#b9a8f2'] },
    { id: 'beanie-red', shape: 'beanie', cat: 'hat', name: { is: 'Rauð dúskhúfa', en: 'Red bobble hat' }, colors: ['#e2505b', '#ffffff', '#ffffff'] },
    { id: 'tiara-gold', shape: 'tiara', cat: 'crown', name: { is: 'Gullkóróna', en: 'Gold tiara' }, colors: ['#f2c34d', '#5fb7ea', '#f27aa0'] },
    { id: 'glasses-heart-pink', shape: 'glasses-heart', cat: 'glasses', name: { is: 'Hjartagleraugu', en: 'Heart glasses' }, colors: ['#ef5b8d', '#f7a6c2'] },
    { id: 'rainboots-ladybug', shape: 'rainboots', cat: 'boots', name: { is: 'Maríubjöllustígvél', en: 'Ladybug rain boots' }, colors: ['#e2464c', '#2e2a30', '#3b3236'], pattern: 'dots' },
    { id: 'maryjane-red', shape: 'maryjane', cat: 'shoes', name: { is: 'Rauðir spariskór', en: 'Red party shoes' }, colors: ['#d8364a', '#5a2a33'] },
  ]);
})();
