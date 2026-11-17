/* =====================================================================
   Footwear, mittens, scarves and bags.
   Same style as examples.js: fill → details → soft shading → tinted outline.
   Left/right: every pair piece is drawn ONCE in left-side coordinates and
   the right side is the same markup inside a mirror group (x → 400 - x),
   so offsets and directions can never get out of step between the sides.
   ===================================================================== */
(function () {
  'use strict';
  const { shade, ink } = H;
  const SW = G.stroke;
  const SKIN = PALETTE.SKIN;

  /** Final pass for a shape: soft shading overlay plus the tinted outline. */
  const outline = (d, base, soft = 'v', sw = SW) =>
    `<path d="${d}" fill="url(#soft-${soft})" stroke="${ink(base)}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"/>`;

  /** Mirror markup drawn on the left side over to the right side (x → 400 - x). */
  const mirror = m => `<g transform="matrix(-1,0,0,1,400,0)">${m}</g>`;
  /** Left piece plus its mirrored right piece. */
  const pair = fn => fn() + mirror(fn());

  // "x,y" text of a point, rounded to 1 decimal, for path strings
  const P = p => p[0].toFixed(1) + ',' + p[1].toFixed(1);
  /** Register a vertical gradient with [offset, colour] stops. Returns url(#id). */
  const addGrad = (id, stops, h) => H.def(id, `<linearGradient id="${id}" x1="0" y1="0" x2="${h ? 1 : 0}" y2="${h ? 0 : 1}">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>`);
  /** Small four-point twinkle star. */
  const twinkle = (x, y, r, c = '#fff') => `<path d="M${x},${y - r}Q${x},${y} ${x + r},${y}Q${x},${y} ${x},${y + r}Q${x},${y} ${x - r},${y}Q${x},${y} ${x},${y - r}Z" fill="${c}"/>`;
  /** Round gem with a light glint. */
  const gem = (x, y, r, c) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${H.grad(c, 'r')}" stroke="${ink(c)}" stroke-width="1.3"/>` +
    `<circle cx="${(x - r * .35).toFixed(1)}" cy="${(y - r * .35).toFixed(1)}" r="${(r * .32).toFixed(1)}" fill="#fff" opacity=".9"/>`;
  /** Stroke drawn twice (ink underneath, colour on top) so a strap or cord gets an outline. */
  const strap = (d, c, w) => `<path d="${d}" fill="none" stroke="${ink(c)}" stroke-width="${w + 2.6}" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;

  // Left foot centre (the right foot is the mirror).
  const [FX, FY] = G.feet[0];

  /** Sole band at the bottom of a shoe outline: clipped to the shoe so it follows its curve. */
  const sole = (id, foot, y0, c, h = 30) =>
    `<g clip-path="${H.clip(id, foot)}"><rect x="${FX - 60}" y="${y0}" width="120" height="${h}" fill="${c}"/>` +
    `<path d="M${FX - 60},${y0} H${FX + 60}" stroke="${ink(c)}" stroke-width="1.6" opacity=".7"/></g>`;

  /**
   * Boot shaft for the left leg from `top` down to just above the sole (like the
   * approved rainboots): built from G.legOutX / G.legInX so it always fits the leg.
   * Returns the closed shaft path, the two side edges (outline only on the sides,
   * so there is no seam line where the shaft meets the foot) and the edge points.
   */
  function shaft(top, low = 716, pad = 6, flare = 3) {
    // how far down the shaft y is: 0 at the top, 1 at the bottom
    const k = y => (y - top) / (low - top), outer = [], inner = [];
    const step = (low - top) / Math.max(4, Math.round((low - top) / 13));
    for (let y = top; y <= low + .1; y += step) {
      outer.push([G.legOutX(y) - pad - flare * k(y), y]);
      inner.push([G.legInX(y) + pad + flare * k(y) * .6, y]);
    }
    return {
      outer, inner,
      d: H.polyPath(outer.concat(inner.slice().reverse())),
      edges: 'M' + outer.map(P).join('L') + 'M' + inner.map(P).join('L'),
    };
  }
  /** x of the outer / inner shaft edge at height y (left side). */
  const shaftX = (top, low, pad, flare, y, inner) => {
    const k = (y - top) / (low - top);
    return inner ? G.legInX(y) + pad + flare * k * .6 : G.legOutX(y) - pad - flare * k;
  };

  /* =================================================================
     SHOES  (slot shoes, cat shoes)
     ================================================================= */

  /* -------------------------------------------------------------
     Sneakers with laces, a rubber toe cap, a side stripe and a thick sole.
     colors: [upper, sole/toe cap, accent (collar + stripe), laces]
     it.light = true → light-up sole: rainbow sole with glowing little lights.
     ------------------------------------------------------------- */
  DOLL.shape('feet-sneaker', {
    slot: 'shoes',
    draw(it) {
      const [c, soleC = '#ffffff', acc = '#6fb3e6', lace = '#ffffff'] = it.colors;
      const foot = G.footPath('L', 4, 3);
      // light-up sole: a horizontal rainbow gradient instead of plain rubber
      const soleFill = it.light ? addGrad('fs-light-' + it.id, [[0, '#ff7aa8'], [.25, '#ffd45e'], [.5, '#7be08f'], [.75, '#6cc6ff'], [1, '#b68cff']], true) : soleC;
      const lights = it.light ? [146, 157, 168, 179].map((x, i) => {
        const y = FY + 12 + (i === 0 ? -1 : 0);
        return `<circle cx="${x}" cy="${y}" r="4.6" fill="#fff" opacity=".45"/><circle cx="${x}" cy="${y}" r="2" fill="#fff"/>`;
      }).join('') : '';
      // laces: three crossing bars along the instep from the ankle toward the toe
      const bars = [0, 1, 2].map(i => {
        const x = 171 - i * 6.5, y = 706 + i * 4;
        return `M${x - 3.5},${y - 3.5} L${x + 2.5},${y + 3} M${x - 3.5},${y + 3} L${x + 2.5},${y - 3.5}`;
      }).join('');
      // one (left) shoe; pair() adds the mirrored right one
      const one = () =>
        `<path d="${foot}" fill="${H.grad(c)}"/>` +
        `<g clip-path="${H.clip('c-' + it.id + '-foot', foot)}">` +
          // rubber toe cap and sole
          `<ellipse cx="${FX - 22}" cy="${FY + 4}" rx="12" ry="13" fill="${soleC}" stroke="${ink(soleC)}" stroke-width="1.5"/>` +
          `<rect x="${FX - 60}" y="${FY + 7}" width="120" height="30" fill="${soleFill}"/>` +
          `<path d="M${FX - 60},${FY + 7} H${FX + 60}" stroke="${ink(soleC)}" stroke-width="1.6" opacity=".6"/>` +
          `<path d="M${FX - 60},${FY + 17.5} H${FX + 60}" stroke="${ink(soleC)}" stroke-width="1.2" opacity=".3"/>` +
          lights +
        `</g>` +
        // curved side stripe
        `<path d="M${FX - 6},${FY + 3} Q${FX + 4},${FY - 6} ${FX + 16},${FY - 4}" fill="none" stroke="${acc}" stroke-width="4" stroke-linecap="round"/>` +
        // tongue, then the laces over it
        `<path d="M160,708 Q160,697 170,696 Q178,696 177,706 Z" fill="${H.grad(shade(c, .08))}" stroke="${ink(c)}" stroke-width="1.6" stroke-linejoin="round"/>` +
        `<path d="${bars}" stroke="${ink(lace)}" stroke-width="3.6" stroke-linecap="round"/><path d="${bars}" stroke="${lace}" stroke-width="2" stroke-linecap="round"/>` +
        outline(foot, c, 'r') +
        // padded collar around the ankle
        `<path d="M157,702 Q168,708 183,702" fill="none" stroke="${ink(acc)}" stroke-width="6.4" stroke-linecap="round"/>` +
        `<path d="M157,702 Q168,708 183,702" fill="none" stroke="${acc}" stroke-width="4" stroke-linecap="round"/>` +
        // little lace bow
        `<path d="M171,704 q-6,-6 -8,-1 q1,4 8,1 q6,-6 8,-1 q-1,4 -8,1" fill="none" stroke="${ink(lace)}" stroke-width="3.4" stroke-linejoin="round"/>` +
        `<path d="M171,704 q-6,-6 -8,-1 q1,4 8,1 q6,-6 8,-1 q-1,4 -8,1" fill="none" stroke="${lace}" stroke-width="1.8" stroke-linejoin="round"/>` +
        `<path d="M${FX - 15},${FY - 4} q-3,4 -2,9" stroke="#fff" stroke-width="2.6" stroke-linecap="round" fill="none" opacity=".7"/>`;
      return pair(one);
    },
  });

  /* -------------------------------------------------------------
     Sandals: a thin sole under the foot and straps over it, so the toes show.
     colors: [straps, sole, flower]
     ------------------------------------------------------------- */
  DOLL.shape('feet-sandal', {
    slot: 'shoes',
    draw(it) {
      const [c, soleC = '#c99a6b', flo = '#ffffff'] = it.colors;
      // flat sole lying under the foot, a little longer than the toes
      const soleD = 'M139,731 Q137,742 147,744 L181,742.5 Q190,741 188,733 Q172,739 158,738.5 Q146,738 139,731 Z';
      // straps are wide bands clipped to the foot, so they wrap over it naturally
      const footD = G.footPath('L', -1, 0);
      const toe = 'M144,700 L156,700 L148,750 L136,750 Z';          // across the toes (toes peek out in front)
      const cross = 'M160,700 L170,700 L168,750 L158,750 Z';        // over the middle of the foot
      const ankle = 'M155,702 Q170,710 186,702';                    // round the ankle
      // one strap/band shape: gradient fill plus a tinted outline
      const band = d => `<path d="${d}" fill="${H.grad(c)}"/><path d="${d}" fill="none" stroke="${ink(c)}" stroke-width="2"/>`;
      // one (left) shoe; pair() adds the mirrored right one
      const one = () =>
        `<path d="${soleD}" fill="${H.grad(soleC)}" stroke="${ink(soleC)}" stroke-width="2" stroke-linejoin="round"/>` +
        `<path d="M142,737.5 Q160,741 186,736" fill="none" stroke="${shade(soleC, .35)}" stroke-width="1.6" stroke-linecap="round"/>` +
        `<g clip-path="${H.clip('c-' + it.id, footD)}">${band(toe)}${band(cross)}` +
          `<path d="M150,706 q-3,10 -6,22 M165,706 q-1,10 -2,22" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".55"/></g>` +
        strap(ankle, c, 4.5) +
        `<path d="M165,704 L165,710" stroke="${ink(c)}" stroke-width="7" stroke-linecap="round"/><path d="M165,704 L165,710" stroke="${c}" stroke-width="4.4" stroke-linecap="round"/>` +
        H.flower(150, 718, 7.5, flo) +
        `<circle cx="183" cy="703" r="2.6" fill="#f4e2b8" stroke="${ink(c)}" stroke-width="1.2"/>`;
      return pair(one);
    },
  });

  /* -------------------------------------------------------------
     Ballet flats: low shoe with a big opening (skin shows), soft binding and a bow.
     colors: [shoe, bow/binding]
     ------------------------------------------------------------- */
  DOLL.shape('feet-ballet', {
    slot: 'shoes',
    draw(it) {
      const [c, bow = shade(c, -.2)] = it.colors;
      const foot = G.footPath('L', 2, 1);
      const open = `M151,708 Q164,699 182,704 Q178,714 164,716 Q154,716 151,708 Z`;
      const bowD = 'M151,713 l-8,-6 l0,11 z M151,713 l7,-7 l1,11 z';
      // one (left) shoe; pair() adds the mirrored right one
      const one = () =>
        `<path d="${foot}" fill="${H.fill(it)}"/>` + sole('c-' + it.id, foot, FY + 11, shade(c, -.35), 20) +
        outline(foot, c, 'r') +
        `<path d="${open}" fill="${SKIN.base}"/><path d="${open}" fill="url(#soft-v)" opacity=".6"/>` +
        `<path d="${open}" fill="none" stroke="${bow}" stroke-width="2.6" stroke-linejoin="round"/>` +
        `<path d="${bowD}" fill="${H.grad(bow)}" stroke="${ink(bow)}" stroke-width="1.6" stroke-linejoin="round"/>` +
        `<circle cx="151" cy="713" r="2.6" fill="${bow}" stroke="${ink(bow)}" stroke-width="1.3"/>` +
        `<path d="M${FX - 18},${FY + 2} q-1,4 1,7" stroke="#fff" stroke-width="2.6" stroke-linecap="round" fill="none" opacity=".7"/>`;
      return pair(one);
    },
  });

  /* -------------------------------------------------------------
     Glitter party shoes: sparkly fill, ankle strap and a gem on the toe.
     colors: [shoe, glitter, gem]
     ------------------------------------------------------------- */
  DOLL.shape('feet-glitter', {
    slot: 'shoes',
    draw(it) {
      const [c, glit = '#ffffff', g = '#f27aa0'] = it.colors;
      const foot = G.footPath('L', 3, 2);
      const open = `M152,708 Q165,699 182,704 Q178,713 165,715 Q155,715 152,708 Z`;
      // one (left) shoe; pair() adds the mirrored right one
      const one = () =>
        `<path d="${foot}" fill="${H.pat('sparkle', c, glit, 9)}"/>` + sole('c-' + it.id, foot, FY + 11, shade(c, -.3), 20) +
        outline(foot, c, 'r') +
        `<path d="${foot}" fill="url(#shine)" opacity=".35"/>` +
        `<path d="${open}" fill="${SKIN.base}"/><path d="${open}" fill="url(#soft-v)" opacity=".6"/>` +
        `<path d="${open}" fill="none" stroke="${ink(c)}" stroke-width="1.8"/>` +
        strap('M155,700 Q170,707 186,700', c, 3.6) +
        gem(150, 713, 5, g) + twinkle(140, 722, 3.5) + twinkle(176, 724, 3) + twinkle(162, 732, 2.4);
      return pair(one);
    },
  });

  /* -------------------------------------------------------------
     Slippers: soft fuzzy slippers with a puffy cuff.
     it.face = 'pompom' (a big pompom on the toe) or 'bunny' (ears, eyes and a nose).
     colors: [slipper, fluff/cuff, details (nose, inner ear)]
     ------------------------------------------------------------- */
  DOLL.shape('feet-slipper', {
    slot: 'shoes',
    draw(it) {
      const [c, fl = '#ffffff', det = '#f48ca0'] = it.colors;
      const foot = G.footPath('L', 6, 3);
      // puffs along the top opening, like a fluffy cuff
      const cuff = [153, 160, 167, 174, 181, 187].map((x, i) =>
        `<circle cx="${x}" cy="${702 + (i === 0 || i === 5 ? 2 : 0) + (i % 2) * 1.5}" r="5.2" fill="${H.grad(fl, 'r')}" stroke="${ink(fl)}" stroke-width="1.3"/>`).join('');
      let deco = '';
      if (it.face === 'bunny') {
        // one bunny ear at x,y, tilted by rot degrees
        const ear = (x, y, rot) => `<g transform="translate(${x},${y}) rotate(${rot})">` +
          `<ellipse cx="0" cy="-12" rx="5.5" ry="13" fill="${H.grad(c)}" stroke="${ink(c)}" stroke-width="1.8"/>` +
          `<ellipse cx="0" cy="-11" rx="2.6" ry="8.5" fill="${det}" opacity=".8"/></g>`;
        deco = ear(150, 710, -28) + ear(158, 707, -8) +
          `<circle cx="144" cy="722" r="2.3" fill="#3a2830"/><circle cx="154" cy="719" r="2.3" fill="#3a2830"/>` +
          `<circle cx="144.8" cy="721.2" r=".8" fill="#fff"/><circle cx="154.8" cy="718.2" r=".8" fill="#fff"/>` +
          `<ellipse cx="147" cy="727" rx="2.6" ry="2" fill="${det}"/>` +
          `<path d="M147,729 q-2,3 -5,2 M147,729 q2,3 5,1.5" stroke="#3a2830" stroke-width="1.2" fill="none" stroke-linecap="round"/>` +
          `<circle cx="140" cy="727" r="2.4" fill="${det}" opacity=".45"/><circle cx="157" cy="724" r="2.4" fill="${det}" opacity=".45"/>`;
      } else {
        let puffs = '';
        for (let a = 0; a < 360; a += 45) {
          const x = 148 + Math.cos(a * Math.PI / 180) * 6, y = 714 + Math.sin(a * Math.PI / 180) * 6;
          puffs += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5" fill="${H.grad(det, 'r')}" stroke="${ink(det)}" stroke-width="1.2"/>`;
        }
        deco = puffs + `<circle cx="148" cy="714" r="6" fill="${H.grad(det, 'r')}"/>`;
      }
      // one (left) shoe; pair() adds the mirrored right one
      const one = () =>
        `<path d="${foot}" fill="${H.grad(c, 'r')}"/>` + sole('c-' + it.id, foot, FY + 13, shade(c, -.25), 20) +
        outline(foot, c, 'r') +
        // fuzzy edge: light dots along the outline make it look soft
        `<path d="${foot}" fill="none" stroke="${shade(c, .45)}" stroke-width="2.4" stroke-dasharray=".1 4.5" stroke-linecap="round"/>` +
        cuff + deco;
      return pair(one);
    },
  });

  /* -------------------------------------------------------------
     Clogs. it.style 'garden': chunky rubber clog with air holes, heel strap and a flower charm.
     it.style 'wood': Swedish-style wooden clog (träsko) with a leather top and brass studs.
     colors: [upper, sole/strap, charm]
     ------------------------------------------------------------- */
  DOLL.shape('feet-clog', {
    slot: 'shoes',
    draw(it) {
      const [c, c2 = shade(c, -.2), charm = '#ffffff'] = it.colors;
      const foot = G.footPath('L', 6, 4);
      let one;
      if (it.style === 'wood') {
        const wood = c2;
        one = () =>
          `<path d="${foot}" fill="${H.grad(c)}"/>` +
          `<g clip-path="${H.clip('c-' + it.id, foot)}">` +
            `<rect x="${FX - 60}" y="${FY + 4}" width="120" height="30" fill="${H.grad(wood)}"/>` +
            `<path d="M${FX - 60},${FY + 4} H${FX + 60}" stroke="${ink(wood)}" stroke-width="1.8"/>` +
            // wood grain
            `<path d="M140,734 q12,-3 24,1 t22,-1 M146,740 q10,-2 20,1 t18,-1" fill="none" stroke="${shade(wood, -.25)}" stroke-width="1.1" opacity=".6"/>` +
          `</g>` +
          // open back: skin of the heel shows at the top
          `<path d="M163,704 Q172,698 186,704 Q182,712 172,713 Q165,712 163,704 Z" fill="${SKIN.base}" stroke="${ink(c)}" stroke-width="1.6"/>` +
          // brass studs along the edge of the leather
          [140, 147, 154, 161, 168, 175, 182].map(x => `<circle cx="${x}" cy="${FY + 1}" r="1.8" fill="#f2c96a" stroke="#9a7330" stroke-width=".9"/>`).join('') +
          H.heart(149, 714, 5, charm) +
          outline(foot, c, 'r') +
          `<path d="M${FX - 20},${FY - 6} q-3,4 -2,9" stroke="#fff" stroke-width="2.6" stroke-linecap="round" fill="none" opacity=".6"/>`;
      } else {
        const holes = [[146, 714], [154, 710], [162, 707], [150, 721], [158, 717], [166, 714]]
          .map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="2.4" ry="1.9" fill="${shade(c, -.4)}"/><path d="M${x - 2},${y + 1.4} q2,1 4,0" stroke="#fff" stroke-width=".9" fill="none" opacity=".6"/>`).join('');
        one = () =>
          `<path d="${foot}" fill="${H.grad(c)}"/>` + sole('c-' + it.id, foot, FY + 9, c2, 30) +
          outline(foot, c, 'r') + holes +
          // heel strap around the back of the ankle with a rivet
          strap('M170,707 Q180,714 188,712', c2, 5) +
          `<circle cx="170" cy="707" r="3" fill="${H.grad(c2, 'r')}" stroke="${ink(c2)}" stroke-width="1.2"/>` +
          H.flower(158, 724, 7, charm) +
          `<path d="M${FX - 22},${FY - 4} q-3,4 -2,9" stroke="#fff" stroke-width="2.8" stroke-linecap="round" fill="none" opacity=".65"/>`;
      }
      return pair(one);
    },
  });

  /* =================================================================
     BOOTS  (slot shoes, cat boots)
     ================================================================= */
  const BOOT_THUMB = [112, 590, 176, 162];

  /* -------------------------------------------------------------
     Snow boots: quilted puffy shaft, fur cuff, toggle cord and a chunky treaded sole.
     colors: [boot, fur, sole]
     ------------------------------------------------------------- */
  DOLL.shape('feet-snowboots', {
    slot: 'shoes',
    thumb: [112, 616, 176, 136],
    draw(it) {
      const [c, fur = '#fff8ee', soleC = '#4a3b3f'] = it.colors;
      const top = 650, sh = shaft(top, 716, 8, 3);
      const foot = G.footPath('L', 8, 4);
      // fur cuff: overlapping puffs (their outlines read as fluffy fur)
      const x0 = sh.outer[0][0] - 4, x1 = sh.inner[0][0] + 4;
      let fluff = `<rect x="${x0}" y="${top - 8}" width="${x1 - x0}" height="18" rx="8" fill="${fur}"/>`;
      for (let i = 0, n = 6; i <= n; i++) {
        const x = x0 + (x1 - x0) * i / n;
        fluff += `<circle cx="${x.toFixed(1)}" cy="${top - 4 + (i % 2) * 6}" r="6.6" fill="${H.grad(fur, 'r')}" stroke="${ink(fur)}" stroke-width="1.2"/>`;
      }
      const tread = Array.from({ length: 9 }, (_, i) => `M${136 + i * 6},748 l3,-5 l3,5`).join('');
      // one (left) shoe; pair() adds the mirrored right one
      const one = () =>
        `<path d="${foot}" fill="${H.fill(it)}"/>` +
        `<g clip-path="${H.clip('c-' + it.id, foot)}"><rect x="${FX - 60}" y="${FY + 6}" width="120" height="30" fill="${soleC}"/>` +
          `<path d="M${FX - 60},${FY + 7} q8,-3 16,0 t16,0 t16,0 t16,0 t16,0 t16,0 t16,0" fill="none" stroke="${shade(soleC, .35)}" stroke-width="1.6"/>` +
          `<path d="${tread}" fill="none" stroke="${shade(soleC, .25)}" stroke-width="1.2"/></g>` +
        outline(foot, c, 'r') +
        `<path d="${sh.d}" fill="${H.fill(it)}"/><path d="${sh.d}" fill="url(#soft-h)"/>` +
        // quilting seams across the shaft
        `<g clip-path="${H.clip('c-' + it.id + '-sh', sh.d)}">${H.line('M120,670 q30,6 80,0 M120,692 q30,6 80,0', c, 1.8, .55)}` +
          `<path d="M120,671.5 q30,6 80,0 M120,693.5 q30,6 80,0" stroke="#fff" stroke-width="1.2" fill="none" opacity=".4"/></g>` +
        `<path d="${sh.edges}" fill="none" stroke="${ink(c)}" stroke-width="${SW}" stroke-linecap="round"/>` +
        // toggle cord hanging from the cuff
        `<path d="M170,654 q-3,12 -2,18" stroke="${ink(c)}" stroke-width="1.6" fill="none"/>` +
        `<rect x="164.5" y="670" width="7" height="9" rx="3" fill="${H.grad(soleC)}" stroke="${ink(soleC)}" stroke-width="1.2"/>` +
        fluff +
        `<path d="M${FX - 22},${FY - 2} q-3,4 -2,9" stroke="#fff" stroke-width="2.6" stroke-linecap="round" fill="none" opacity=".55"/>`;
      return pair(one);
    },
  });

  /* -------------------------------------------------------------
     Riding boots: tall slim leather boots to below the knee, buckle strap and zip.
     colors: [leather, strap/heel, buckle]
     ------------------------------------------------------------- */
  DOLL.shape('feet-riding', {
    slot: 'shoes',
    thumb: [112, 578, 176, 176],
    draw(it) {
      const [c, st = shade(c, -.25), buckle = '#f2c96a'] = it.colors;
      const top = 590, sh = shaft(top, 716, 6, 2);
      const foot = G.footPath('L', 5, 3);
      // top edge cut a little higher on the outer side
      const [o0, i0] = [sh.outer[0], sh.inner[0]];
      const topCap = `M${P([o0[0] - .5, top - 6])} Q${(o0[0] + i0[0]) / 2},${top - 4} ${P([i0[0], top + 2])} L${P(i0)} L${P(o0)} Z`;
      const sy = 606, sx0 = shaftX(top, 716, 6, 2, sy, false), sx1 = shaftX(top, 716, 6, 2, sy, true);
      // one (left) shoe; pair() adds the mirrored right one
      const one = () =>
        `<path d="${foot}" fill="${H.grad(c)}"/>` + sole('c-' + it.id, foot, FY + 10, st, 20) + outline(foot, c, 'r') +
        `<path d="${sh.d}" fill="${H.grad(c, 'h')}"/><path d="${topCap}" fill="${H.grad(c, 'h')}"/>` +
        `<path d="${sh.d}" fill="url(#soft-h)"/>` +
        // zip on the inner side, ankle crease
        `<path d="M${(sh.inner[2][0] - 4).toFixed(1)},${sh.inner[2][1]} L${(sh.inner[sh.inner.length - 2][0] - 4).toFixed(1)},${sh.inner[sh.inner.length - 2][1]}" stroke="${ink(c)}" stroke-width="1.4" stroke-dasharray="2 2" opacity=".6"/>` +
        H.line('M160,700 q10,4 22,0', c, 1.6, .5) +
        `<path d="${sh.edges}M${P([o0[0] - .5, top - 6])} Q${(o0[0] + i0[0]) / 2},${top - 4} ${P([i0[0], top + 2])}" fill="none" stroke="${ink(c)}" stroke-width="${SW}" stroke-linecap="round" stroke-linejoin="round"/>` +
        // buckle strap round the top of the shaft
        `<path d="M${sx0 - 1},${sy - 4} Q${(sx0 + sx1) / 2},${sy} ${sx1 + 1},${sy - 3} L${sx1 + 1},${sy + 4} Q${(sx0 + sx1) / 2},${sy + 7} ${sx0 - 1},${sy + 3} Z" fill="${H.grad(st)}" stroke="${ink(st)}" stroke-width="1.6" stroke-linejoin="round"/>` +
        `<rect x="${sx0 + 2}" y="${sy - 4.5}" width="8" height="9" rx="1.5" fill="none" stroke="${buckle}" stroke-width="2.2"/>` +
        `<path d="M${o0[0] + 5},${top + 14} Q${o0[0] + 2},650 ${o0[0] + 6},690" stroke="#fff" stroke-width="3.4" stroke-linecap="round" fill="none" opacity=".45"/>` +
        `<path d="M${FX - 18},${FY - 3} q-3,4 -2,8" stroke="#fff" stroke-width="2.4" stroke-linecap="round" fill="none" opacity=".6"/>`;
      return pair(one);
    },
  });

  /* -------------------------------------------------------------
     Princess boots: sparkly ankle boots with a scalloped top, two gem-buckle straps.
     colors: [boot, sparkle, gem, strap]
     ------------------------------------------------------------- */
  DOLL.shape('feet-princessboots', {
    slot: 'shoes',
    thumb: [112, 626, 176, 128],
    draw(it) {
      const [c, sp = '#ffffff', g = '#5fb7ea', st = shade(c, -.22)] = it.colors;
      const top = 652, sh = shaft(top, 716, 6, 2);
      const foot = G.footPath('L', 4, 3);
      const x0 = sh.outer[0][0] - 2, x1 = sh.inner[0][0] + 2, n = 5, w = (x1 - x0) / n;
      let scal = `M${x0.toFixed(1)},${top + 3}`;
      for (let i = 0; i < n; i++) scal += `q${(w / 2).toFixed(1)},-9 ${w.toFixed(1)},0`;
      scal += `L${x1.toFixed(1)},${top + 9}L${x0.toFixed(1)},${top + 9}Z`;
      // curved strap across the boot at height y with a small gem buckle
      const band = y => {
        const a = shaftX(top, 716, 6, 2, y, false) - 1, b = shaftX(top, 716, 6, 2, y, true) + 1;
        return `<path d="M${a.toFixed(1)},${y - 3} Q${(a + b) / 2},${y + 1} ${b.toFixed(1)},${y - 3} L${b.toFixed(1)},${y + 3} Q${(a + b) / 2},${y + 7} ${a.toFixed(1)},${y + 3} Z" fill="${H.grad(st)}" stroke="${ink(st)}" stroke-width="1.5" stroke-linejoin="round"/>` +
          gem(((a + b) / 2).toFixed(1), y + 2, 3.6, g);
      };
      // one (left) shoe; pair() adds the mirrored right one
      const one = () =>
        `<path d="${foot}" fill="${H.pat('sparkle', c, sp, 10)}"/>` + sole('c-' + it.id, foot, FY + 11, st, 20) + outline(foot, c, 'r') +
        `<path d="${sh.d}" fill="${H.pat('sparkle', c, sp, 10)}"/><path d="${sh.d}" fill="url(#soft-h)"/>` +
        `<path d="${sh.edges}" fill="none" stroke="${ink(c)}" stroke-width="${SW}" stroke-linecap="round"/>` +
        `<path d="${scal}" fill="${H.grad(st)}" stroke="${ink(st)}" stroke-width="1.8" stroke-linejoin="round"/>` +
        band(676) + band(698) +
        gem(150, 716, 4.2, g) +
        `<path d="M${sh.outer[1][0] + 5},${top + 16} q-2,18 1,36" stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none" opacity=".55"/>` +
        twinkle(176, 664, 3.4) + twinkle(140, 728, 2.8);
      return pair(one);
    },
  });

  /* -------------------------------------------------------------
     Wellies with a motif. Same glossy shaft as the rain boots, plus:
     it.motif 'puffin' → two puffins standing on a wave band;
     it.motif 'frog'   → frog eyes and a smile on the toes.
     colors: [boot, rim, sole]
     ------------------------------------------------------------- */
  /**
   * Small standing puffin (about 20 tall at s=1), facing right, centred at x with feet at y.
   * What makes it read as a puffin (not a penguin): the big striped orange beak,
   * the white face disc under a black cap, and orange feet.
   */
  const puffin = (x, y, s = 1) => `<g transform="translate(${x},${y}) scale(${s})">` +
    // orange feet
    `<path d="M-4,-.5 l-3,2.5 h6 Z M2,-.5 l-1,2.5 h6 Z" fill="#f2752a"/>` +
    // black body and head
    `<path d="M-1,-20 C5,-20 7,-15 6,-10 C7,-5 5,0 0,0 C-5,0 -7,-4 -7,-9 C-7,-15 -5,-20 -1,-20 Z" fill="#26222c"/>` +
    // white belly and white face disc
    `<path d="M1,-9 C4,-9 4.5,-5 3.5,-3 C2.5,-1 1,-.8 0,-.8 C-2,-.8 -3,-3 -2.5,-6 Z" fill="#fff"/>` +
    `<ellipse cx="1.5" cy="-14" rx="4.6" ry="3.8" fill="#fff"/>` +
    // eye with the little dark mark
    `<circle cx="2" cy="-15" r="1.1" fill="#26222c"/><path d="M2,-13.8 l1.4,1.6" stroke="#26222c" stroke-width=".6"/>` +
    // big triangular beak: grey base, orange tip, yellow stripe
    `<path d="M5,-17 Q11,-15.5 12,-12.5 Q9,-11 5,-11 Z" fill="#f05a28" stroke="#9a3a1a" stroke-width=".6" stroke-linejoin="round"/>` +
    `<path d="M5,-17 L6.6,-16.6 L6.6,-11.1 L5,-11 Z" fill="#8a8f98"/>` +
    `<path d="M7.8,-16 Q8.6,-14 7.8,-11.2" stroke="#f7d14a" stroke-width="1.1" fill="none"/></g>`;
  DOLL.shape('feet-wellies', {
    slot: 'shoes',
    thumb: [116, 596, 168, 158],
    // draws the wellies (rubber boots) using the chosen colours
    draw(it) {
      const [c, rim = shade(c, .25), soleC = '#3b3236'] = it.colors;
      const top = 612, sh = shaft(top, 716, 6, 3);
      const foot = G.footPath('L', 6, 3);
      const [o0, i0] = [sh.outer[0], sh.inner[0]];
      const rimD = H.polyPath([o0, [o0[0] - 2, top + 12], [i0[0] + 2, top + 12], i0]);
      let motif = '', toes = '';
      if (it.motif === 'puffin') {
        // white-capped waves along the bottom of the shaft, puffins above
        motif = `<g clip-path="${H.clip('c-' + it.id + '-sh', sh.d)}">` +
          `<path d="M120,690 q6,-6 12,0 t12,0 t12,0 t12,0 t12,0 t12,0 V720 H120 Z" fill="#5aa8d8"/>` +
          `<path d="M120,690 q6,-6 12,0 t12,0 t12,0 t12,0 t12,0 t12,0" fill="none" stroke="#fff" stroke-width="2.2"/>` +
          `</g>` + puffin(166, 689, 1.25) + puffin(168, 650, 1.05);
      } else if (it.motif === 'frog') {
        // two frog eyes peeking up on top of the foot, a smile and rosy cheeks on the toe
        const eye = (x, y) => `<circle cx="${x}" cy="${y}" r="6" fill="${H.grad(c, 'r')}" stroke="${ink(c)}" stroke-width="1.8"/>` +
          `<circle cx="${x}" cy="${y}" r="3.8" fill="#fff"/><circle cx="${x - .6}" cy="${y + .4}" r="2.2" fill="#2b2733"/><circle cx="${x - 1.2}" cy="${y - .6}" r=".8" fill="#fff"/>`;
        toes = eye(145, 712) + eye(158, 708) +
          `<path d="M141,724 Q150,731 160,723" fill="none" stroke="${ink(c)}" stroke-width="2" stroke-linecap="round"/>` +
          `<circle cx="140" cy="720" r="2.6" fill="#f48ca0" opacity=".6"/><circle cx="162" cy="718" r="2.6" fill="#f48ca0" opacity=".6"/>`;
        motif = [[166, 640, 4], [178, 668, 3], [160, 690, 3.5], [170, 650, 2]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${shade(c, -.18)}" opacity=".6"/>`).join('');
      }
      // one (left) shoe; pair() adds the mirrored right one
      const one = () =>
        `<path d="${foot}" fill="${H.fill(it)}"/>` + sole('c-' + it.id, foot, FY + 8, soleC, 30) + outline(foot, c, 'r') +
        `<path d="${sh.d}" fill="${H.fill(it)}"/>` + motif + `<path d="${sh.d}" fill="url(#soft-h)"/>` +
        `<path d="${sh.edges}" fill="none" stroke="${ink(c)}" stroke-width="${SW}" stroke-linecap="round"/>` +
        `<path d="${rimD}" fill="${H.grad(rim)}" stroke="${ink(c)}" stroke-width="2" stroke-linejoin="round"/>` +
        `<path d="M158,630 Q155,650 157,668" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".55" fill="none"/>` +
        toes;
      return pair(one);
    },
  });

  /* -------------------------------------------------------------
     Felt boots: soft felt boots with a folded cuff, embroidered flowers and pompom ties.
     colors: [felt, cuff, flower, pompom]
     ------------------------------------------------------------- */
  DOLL.shape('feet-felt', {
    slot: 'shoes',
    thumb: BOOT_THUMB,
    draw(it) {
      const [c, cuffC = shade(c, .4), flo = '#e2505b', pom = '#f6c636'] = it.colors;
      const top = 626, sh = shaft(top, 716, 8, 2);
      const foot = G.footPath('L', 7, 3);
      const cy = top + 14;
      const ca = shaftX(top, 716, 8, 2, cy, false) - 2, cb = shaftX(top, 716, 8, 2, cy, true) + 2;
      const [o0, i0] = [sh.outer[0], sh.inner[0]];
      const cuff = `M${o0[0] - 3},${top - 2} Q${(o0[0] + i0[0]) / 2},${top + 3} ${i0[0] + 3},${top - 2} L${cb},${cy} Q${(ca + cb) / 2},${cy + 6} ${ca},${cy} Z`;
      // embroidered vine: two flowers and leaves
      const leaf = (x, y, r) => `<ellipse cx="${x}" cy="${y}" rx="4.5" ry="2" transform="rotate(${r} ${x} ${y})" fill="#6dbb6a"/>`;
      const embro = H.line('M170,700 Q166,684 171,668', '#6dbb6a', 1.6, .9) + leaf(165, 690, -40) + leaf(176, 678, 30) +
        H.flower(171, 666, 7, flo) + H.flower(166, 698, 5.5, shade(flo, .35)) +
        `<path d="M146,722 l3,-3 l3,3 l3,-3 l3,3" fill="none" stroke="${cuffC}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`;
      const poms = `<path d="M${ca + 4},${cy - 2} q-3,8 -6,14 M${ca + 4},${cy - 2} q1,9 3,15" stroke="${ink(cuffC)}" stroke-width="1.4" fill="none"/>` +
        gem(ca - 2, cy + 13, 4, pom) + gem(ca + 7, cy + 14, 4, pom);
      // one (left) shoe; pair() adds the mirrored right one
      const one = () =>
        `<path d="${foot}" fill="${H.pat('knit', c, shade(c, -.12), 8)}"/>` + sole('c-' + it.id, foot, FY + 12, shade(c, -.4), 20) + outline(foot, c, 'r') +
        `<path d="${sh.d}" fill="${H.pat('knit', c, shade(c, -.12), 8)}"/><path d="${sh.d}" fill="url(#soft-h)"/>` +
        embro +
        `<path d="${sh.edges}" fill="none" stroke="${ink(c)}" stroke-width="${SW}" stroke-linecap="round"/>` +
        `<path d="${cuff}" fill="${H.grad(cuffC)}" stroke="${ink(cuffC)}" stroke-width="2" stroke-linejoin="round"/>` +
        `<path d="M${o0[0] + 2},${top + 6} Q${(o0[0] + i0[0]) / 2},${top + 10} ${i0[0] - 2},${top + 6}" stroke="${flo}" stroke-width="1.6" stroke-dasharray="2 3" fill="none"/>` +
        poms;
      return pair(one);
    },
  });


  /* =================================================================
     MITTENS  (slot mittens, cat mittens)
     Drawn in the same local space as the doll's hand in core.js:
     wrist at (0,0), fingers pointing down (+y), body side = +x.
     The group is then moved to the wrist and tilted 8.7° with the forearm;
     the right mitten is the same markup with scale(-1,1), exactly like the hand.
     ================================================================= */

  /**
   * Mitten silhouette in local hand space. The thumb is part of the one outline:
   * it leaves the body-side edge just below the wrist, angles down and out,
   * ends in a round tip and turns back into a small notch against the mitten.
   */
  const MITT = 'M-15.5,-3 C-17.5,9 -18.5,22 -16.5,32 C-14.5,42 -6,47.5 1,47 C8.5,46.5 13.5,41 13.8,32.5 ' +
    'C14,30 14,28.5 14.2,27.5 C16,30.5 19.5,32 22,30.5 C24.8,28.8 25,24 23.4,18.5 C21.6,12 18.5,6 16.4,-3 Z';
  /** Line where the thumb meets the hand (a soft fold, drawn inside the shape). */
  const MITT_FOLD = 'M14.2,27.5 C13.8,22 14.5,16 16.5,10';
  /** Ribbed cuff over the wrist (and over the end of a sleeve). */
  const CUFF = 'M-18,-16 Q0,-19 18,-16 L18.5,-1 Q0,2 -18.5,-1 Z';

  /** Place local-space mitten markup on the left or right hand (same transform as the hand). */
  const onHand = (side, m) => {
    const [wx, wy] = G.armPoint(side, 1);
    const tilt = side === 'L' ? 8.7 : -8.7, flip = side === 'L' ? '' : ' scale(-1,1)';
    return `<g transform="translate(${wx.toFixed(1)},${(wy - 2).toFixed(1)}) rotate(${tilt})${flip}">${m}</g>`;
  };

  /** Eight-petal rose (áttablaðarós), the classic Icelandic knitting star. */
  const rose = (cx, cy, r, c) => {
    let d = '';
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4, a1 = a - .32, a2 = a + .32;
      d += `M${cx},${cy}L${(cx + Math.cos(a1) * r * .62).toFixed(1)},${(cy + Math.sin(a1) * r * .62).toFixed(1)}L${(cx + Math.cos(a) * r).toFixed(1)},${(cy + Math.sin(a) * r).toFixed(1)}L${(cx + Math.cos(a2) * r * .62).toFixed(1)},${(cy + Math.sin(a2) * r * .62).toFixed(1)}Z`;
    }
    return `<path d="${d}" fill="${c}"/>`;
  };

  /* -------------------------------------------------------------
     Mittens. it.style picks the design:
       'knit'   knitted mittens with a ribbed cuff and a motif (it.motif 'heart' | 'star' | none)
       'lopi'   Icelandic pattern: zigzag band, eight-petal rose, dotted rows
       'snow'   snowflake mittens
       'ski'    waterproof ski mittens: glossy shell, long gauntlet cuff with a toggle, grip patch
       'fluffy' furry mittens with a scalloped fluffy outline and pompom ties
     it.string = true → a cord runs from each cuff up the inside of the arm (mittens on a string).
     colors: [main, cuff/second, motif, extra]
     ------------------------------------------------------------- */
  DOLL.shape('mitt', {
    slot: 'mittens',
    thumb: [58, 408, 84, 84],
    draw(it) {
      const [c, c2 = shade(c, -.2), mot = '#ffffff', c4 = '#ffffff'] = it.colors;
      const st = it.style || 'knit';
      const knit = H.pat('knit', c, shade(c, -.28), 7);
      const clip = H.clip('c-' + it.id, MITT);
      // vertical rib lines (knit cuff texture) between x0 and x1, from y0 down to y1
      const ribs = (x0, x1, y0, y1, col) => H.line(Array.from({ length: Math.round((x1 - x0) / 3.6) + 1 }, (_, i) => `M${(x0 + i * 3.6).toFixed(1)},${y0}V${y1}`).join(''), col, 1, .45);
      let body = '', cuff = '';
      if (st === 'ski') {
        // glossy shell with a grip patch at the fingertips and a reflective stripe
        body = `<path d="${MITT}" fill="${H.grad(c, 'h')}"/>` +
          `<g clip-path="${clip}"><path d="M-30,34 Q0,30 30,28 V60 H-30 Z" fill="${c2}"/>` +
          `<path d="M-30,10 L30,6 V11 L-30,15 Z" fill="${c4}" opacity=".9"/></g>` +
          H.line(MITT_FOLD, c, 1.6, .6) + outline(MITT, c, 'h') +
          `<path d="M-11,2 Q-14,14 -12,26" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".6"/>`;
        // long gauntlet cuff that flares over the sleeve, with a cord stopper
        const g = 'M-20,-26 Q0,-29 20,-26 L18,-1 Q0,2 -18,-1 Z';
        cuff = `<path d="${g}" fill="${H.grad(c2)}"/>` + `<path d="M-20,-26 Q0,-29 20,-26 L19.6,-22 Q0,-25 -19.6,-22 Z" fill="${shade(c2, -.25)}"/>` +
          outline(g, c2) +
          `<path d="M-17,-8 Q0,-5 17,-8" stroke="${mot}" stroke-width="3.2" fill="none" stroke-linecap="round"/>` +
          `<path d="M6,-22 q2,6 1,10" stroke="${ink(c2)}" stroke-width="1.2" fill="none"/>` +
          `<rect x="3.5" y="-13" width="7" height="8" rx="3" fill="${H.grad(mot)}" stroke="${ink(mot)}" stroke-width="1.2"/>`;
      } else if (st === 'fluffy') {
        // fur: small puffs all along the outline, then the soft body on top
        const pts = [[-16, 0], [-17.5, 8], [-18, 16], [-17.5, 24], [-16.5, 32], [-13, 40], [-7, 45], [0, 47], [7, 45.5], [12.5, 40], [14, 32], [18, 31.5], [23, 28], [24, 21], [22, 13], [19.5, 6], [17, 0]];
        body = pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4.6" fill="${c}" stroke="${ink(c)}" stroke-width="1.3"/>`).join('') +
          `<path d="${MITT}" fill="${H.grad(c, 'r')}"/>` + `<path d="${MITT}" fill="url(#soft-r)"/>` +
          H.line(MITT_FOLD, c, 1.4, .5) +
          // fur tufts
          H.line('M-12,6 q2,-3 4,0 M-13,34 q2,-3 4,0 M4,40 q2,-3 4,0 M16,14 q2,-3 4,0', c, 1.2, .5) +
          H.heart(-2, 24, 7, mot);
        cuff = `<path d="${CUFF}" fill="${H.grad(c2)}"/>` +
          [-15, -7.5, 0, 7.5, 15].map(x => `<circle cx="${x}" cy="-9" r="5.6" fill="${H.grad(c2, 'r')}" stroke="${ink(c2)}" stroke-width="1.2"/>`).join('') +
          // pompom ties hanging from the cuff
          `<path d="M-12,-4 q-2,6 -4,10 M-12,-4 q2,7 2,11" stroke="${ink(c4)}" stroke-width="1.2" fill="none"/>` +
          gem(-16, 7, 3.6, c4) + gem(-10, 8.5, 3.6, c4);
      } else {
        let motif = '';
        if (st === 'lopi') {
          // zigzag band and dot rows around the rose
          let zig = 'M-30,6';
          for (let x = -30; x < 30; x += 6) zig += 'l3,4l3,-4';
          motif = `<path d="${zig}" fill="none" stroke="${c2}" stroke-width="2.4" stroke-linejoin="round"/>` +
            `<rect x="-30" y="12.5" width="60" height="2.2" fill="${c2}"/>` +
            rose(-1.5, 26, 9, c2) + `<circle cx="-1.5" cy="26" r="2" fill="${mot}"/>` +
            [-11, 8].map(x => `<circle cx="${x}" cy="26" r="1.8" fill="${mot}"/>`).join('') +
            Array.from({ length: 9 }, (_, i) => `<circle cx="${-14 + i * 3.6}" cy="39" r="1.3" fill="${c2}"/>`).join('');
        } else if (st === 'snow') {
          motif = H.flake(-1.5, 24, 10, mot) + `<circle cx="-1.5" cy="24" r="2.4" fill="${c4}"/>` +
            H.flake(-11, 8, 3.5, mot) + H.flake(8, 40, 3.5, mot) + H.flake(19, 22, 2.8, mot);
        } else if (it.motif === 'heart') {
          motif = H.heart(-1.5, 23, 9, mot) + `<path d="M-6,19 q2,-3 4,-2" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".7"/>`;
        } else if (it.motif === 'star') {
          motif = H.star(-1.5, 24, 10, mot);
        }
        body = `<path d="${MITT}" fill="${knit}"/>` + `<g clip-path="${clip}">${motif}</g>` +
          H.line(MITT_FOLD, c, 1.6, .6) + outline(MITT, c, 'h');
        cuff = `<path d="${CUFF}" fill="${H.grad(c2)}"/>` + ribs(-16, 16, -15, -1, c2) + outline(CUFF, c2) +
          (st === 'lopi' ? `<path d="M-17,-8.5 Q0,-11 17,-8.5" stroke="${mot}" stroke-width="2.2" stroke-dasharray="1.5 3" stroke-linecap="round" fill="none"/>` : '');
      }
      // one mitten (side L or R), placed on the hand with its cuff
      const one = side => onHand(side, body + cuff);
      // mittens on a string: a cord from the inner cuff up the inside of the arm into the sleeve/armpit
      let cord = '';
      if (it.string) {
        const d = 'M112,432 C122,404 130,376 138,348 C142,334 146,322 149,314';
        cord = pair(() => `<path d="${d}" fill="none" stroke="${ink(c4)}" stroke-width="4.4" stroke-linecap="round"/>` +
          `<path d="${d}" fill="none" stroke="${c4}" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="3 2"/>`);
      }
      return cord + one('L') + one('R');
    },
  });

  /* =================================================================
     SCARVES  (slot scarf, cat scarf)
     A thick wrap sits round the neck just under the chin (neck x 186–214),
     resting on the shoulders; tails hang down the front.
     ================================================================= */
  // the wrap round the neck: top edge tucks under the chin, bottom rests on the collarbones
  const WRAP = 'M171,250 C170,238 178,232 186,233 Q200,242 214,233 C222,232 230,238 229,250 C229,266 216,276 200,276 C184,276 171,266 171,250 Z';
  // a second, lower roll so the wrap looks wound round twice
  const WRAP2 = 'M168,262 C170,256 178,258 188,264 Q200,270 212,264 C222,258 230,256 232,262 C233,276 218,288 200,288 C182,288 167,276 168,262 Z';
  /** One hanging tail: from the knot (x0,y0) down to the end (x1,y1), width w, with a soft wave. */
  const tailD = (x0, y0, x1, y1, w) => {
    const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
    return `M${x0 - w / 2},${y0} Q${mx - w / 2 - 4},${my} ${x1 - w / 2},${y1} L${x1 + w / 2},${y1 + 3} Q${mx + w / 2 - 4},${my} ${x0 + w / 2},${y0} Z`;
  };

  /* -------------------------------------------------------------
     Knitted scarf. it.tails 1 or 2; it.fringe = fringe at the ends;
     it.stripes = colours of the stripes across the tails and along the wrap;
     it.lopi = Icelandic pattern band near the ends;
     it.puffin = the long tail ends in a puffin head.
     colors: [main, second (cuff/stripe), motif]
     ------------------------------------------------------------- */
  DOLL.shape('scarf-knit', {
    slot: 'scarf',
    thumb: [134, 214, 132, 218],
    draw(it) {
      const [c, c2 = shade(c, -.2), mot = '#ffffff'] = it.colors;
      const knit = H.pat('knit', c, shade(c, -.25), 8);
      const tails = it.tails || 2;
      // tail ends: front tail from under the knot to y 396, the second one shorter and to the side
      const T1 = { x0: 184, y0: 268, x1: 176, y1: 396, w: 24 };
      const T2 = { x0: 202, y0: 270, x1: 210, y1: 360, w: 22 };
      // path of one scarf tail from its start/end points and width
      const tl = t => tailD(t.x0, t.y0, t.x1, t.y1, t.w);
      /** Decorations clipped inside one tail: stripes, lopi band, fringe. */
      const deco = (t, k) => {
        const d = tl(t), cl = H.clip(`c-${it.id}-t${k}`, d);
        let g = '';
        if (it.stripes) g += it.stripes.map((sc, i) => `<rect x="120" y="${t.y1 - 16 - i * 14}" width="160" height="7" fill="${sc}"/>`).join('') +
          it.stripes.map((sc, i) => `<rect x="120" y="${t.y0 + 18 + i * 14}" width="160" height="7" fill="${sc}"/>`).join('');
        if (it.lopi) {
          const y = t.y1 - 30;
          let zig = `M120,${y}`;
          for (let x = 120; x < 280; x += 6) zig += 'l3,4l3,-4';
          g += `<rect x="120" y="${y - 6}" width="160" height="2.4" fill="${c2}"/>` + `<path d="${zig}" fill="none" stroke="${c2}" stroke-width="2.2"/>` +
            `<rect x="120" y="${y + 7}" width="160" height="2.4" fill="${c2}"/>` +
            rose(t.x1 + 1, y - 22, 8, c2) + `<circle cx="${t.x1 + 1}" cy="${y - 22}" r="1.8" fill="${mot}"/>`;
        }
        return `<path d="${d}" fill="${knit}"/><g clip-path="${cl}">${g}</g>` + outline(d, c, 'h');
      };
      /** Fringe at a tail end. */
      const fringe = t => {
        if (!it.fringe) return '';
        let d = '';
        for (let i = 0; i <= 6; i++) { const x = t.x1 - t.w / 2 + 2 + i * (t.w - 4) / 6, y = t.y1 + 1 + i * 3 / 6; d += `M${x.toFixed(1)},${y.toFixed(1)}q${i % 2 ? 1 : -1},6 0,12`; }
        return `<path d="${d}" fill="none" stroke="${ink(c2)}" stroke-width="3.6" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${c2}" stroke-width="2" stroke-linecap="round"/>`;
      };
      /** Puffin head at the end of the front tail (a black head with white face, orange beak). */
      const puffinEnd = t => {
        const x = t.x1 + 1, y = t.y1 + 6;
        return `<ellipse cx="${x}" cy="${y}" rx="17" ry="15" fill="${H.grad('#2b2733', 'r')}" stroke="#18151c" stroke-width="2"/>` +
          `<ellipse cx="${x}" cy="${y + 3}" rx="12" ry="10" fill="#fbf8f2"/>` +
          `<circle cx="${x - 5}" cy="${y}" r="2.4" fill="#2b2733"/><circle cx="${x + 5}" cy="${y}" r="2.4" fill="#2b2733"/>` +
          `<circle cx="${x - 4.3}" cy="${y - .7}" r=".8" fill="#fff"/><circle cx="${x + 5.7}" cy="${y - .7}" r=".8" fill="#fff"/>` +
          `<path d="M${x - 6},${y - 3} l-3,-1.5 M${x + 6},${y - 3} l3,-1.5" stroke="#2b2733" stroke-width="1"/>` +
          // big triangular beak pointing down with a yellow stripe
          `<path d="M${x - 6},${y + 3} Q${x},${y + 1} ${x + 6},${y + 3} Q${x + 3},${y + 13} ${x},${y + 16} Q${x - 3},${y + 13} ${x - 6},${y + 3} Z" fill="#f05a28" stroke="#9a3a1a" stroke-width="1.2" stroke-linejoin="round"/>` +
          `<path d="M${x - 4.5},${y + 7} Q${x},${y + 5.5} ${x + 4.5},${y + 7}" stroke="#f7d14a" stroke-width="1.6" fill="none"/>` +
          `<path d="M${x - 5},${y + 3.4} Q${x},${y + 1.5} ${x + 5},${y + 3.4}" stroke="#8a8f98" stroke-width="1.6" fill="none"/>` +
          `<circle cx="${x - 9}" cy="${y + 7}" r="2.6" fill="#f48ca0" opacity=".55"/><circle cx="${x + 9}" cy="${y + 7}" r="2.6" fill="#f48ca0" opacity=".55"/>`;
      };
      /** The wrap (two rolls) with its pattern and soft ribbing. */
      const wrap = d => {
        const cl = H.clip(`c-${it.id}-w${d === WRAP ? 1 : 2}`, d);
        const st = it.stripes ? it.stripes.map((sc, i) => `<rect x="${168 + i * 22}" y="226" width="7" height="70" fill="${sc}"/>`).join('') : '';
        const lp = it.lopi ? Array.from({ length: 10 }, (_, i) => H.diamond(172 + i * 6.4, d === WRAP ? 258 : 276, 3, c2)).join('') : '';
        return `<path d="${d}" fill="${knit}"/><g clip-path="${cl}">${st}${lp}</g>` + outline(d, c, 'v');
      };
      let out = '';
      if (tails === 2) out += deco(T2, 2) + fringe(T2);
      out += wrap(WRAP2) + wrap(WRAP);
      out += deco(T1, 1) + (it.puffin ? puffinEnd(T1) : fringe(T1));
      // knot where the tails come out of the wrap
      const knot = 'M178,262 C180,254 196,252 200,262 C202,272 196,280 188,280 C180,280 176,272 178,262 Z';
      out += `<path d="${knot}" fill="${knit}"/>` + outline(knot, c, 'r') + H.line('M184,262 q2,8 0,14 M192,261 q2,9 -1,16', c, 1.4, .5);
      return out;
    },
  });

  /* -------------------------------------------------------------
     Snood: a chunky knitted tube round the neck (no tails), with cable ribs
     and a little heart patch. colors: [main, heart]
     ------------------------------------------------------------- */
  DOLL.shape('scarf-snood', {
    slot: 'scarf',
    thumb: [150, 214, 100, 100],
    draw(it) {
      const [c, pom = '#ffffff'] = it.colors;  // pom = heart patch colour
      const d = 'M166,256 C164,240 174,231 186,233 Q200,242 214,233 C226,231 236,240 234,256 C235,276 220,292 200,292 C180,292 165,276 166,256 Z';
      const cl = H.clip('c-' + it.id, d);
      // cable ribs: twisted ropes running up and down the tube
      let cables = '';
      for (let x = 172; x <= 228; x += 11) {
        for (let y = 232; y < 296; y += 8) cables += `M${x - 3},${y}q3,4 6,4M${x + 3},${y + 4}q-3,4 -6,4`;
      }
      return `<path d="${d}" fill="${H.pat('knit', c, shade(c, -.22), 8)}"/>` +
        `<g clip-path="${cl}"><path d="${cables}" fill="none" stroke="${ink(c)}" stroke-width="1.4" opacity=".4"/>` +
        `<path d="M160,274 Q200,300 240,274 L240,300 L160,300 Z" fill="${shade(c, -.1)}"/>` +
        `<path d="M160,274 Q200,300 240,274" fill="none" stroke="${ink(c)}" stroke-width="1.4" opacity=".5"/></g>` +
        outline(d, c, 'v') +
        `<path d="M176,244 Q200,256 224,244" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".4"/>` +
        // knitted heart patch on the front
        H.heart(214, 272, 7, pom);
    },
  });

  /* -------------------------------------------------------------
     Feather boa: a fluffy rope of puffs round the neck, both ends hanging down
     to the waist, with sparkles. colors: [main, light, sparkle]
     ------------------------------------------------------------- */
  DOLL.shape('scarf-boa', {
    slot: 'scarf',
    thumb: [130, 220, 140, 220],
    draw(it) {
      const [c, light = shade(c, .4), sp = '#ffffff'] = it.colors;
      // centre line: down the left front, round under the chin, down the right front
      const pts = [];
      // adds n+1 points along a curve from a to b (control point ctl) to the list
      const qb = (a, ctl, b, n) => { for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; pts.push([u * u * a[0] + 2 * u * t * ctl[0] + t * t * b[0], u * u * a[1] + 2 * u * t * ctl[1] + t * t * b[1]]); } };
      qb([166, 412], [160, 320], [176, 262], 9);
      qb([180, 254], [200, 274], [220, 254], 4);
      qb([224, 262], [240, 320], [234, 412], 9);
      let puffs = '';
      pts.forEach(([x, y], i) => {
        const r = 9.5 + (i % 3) * 1.2;
        puffs += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="${H.grad(c, 'r')}" stroke="${ink(c)}" stroke-width="1.4"/>`;
      });
      // light feather tufts and sparkles on top
      let tufts = '';
      pts.forEach(([x, y], i) => {
        tufts += `<path d="M${(x - 4).toFixed(1)},${(y - 2).toFixed(1)} q3,-4 7,-2" stroke="${light}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
        if (i % 3 === 1) tufts += twinkle(+(x + 4).toFixed(1), +(y + 3).toFixed(1), 3, sp);
      });
      // wispy feather ends at the bottom of both tails
      const ends = pair(() => `<path d="M160,418 q-4,10 -2,16 M166,420 q0,10 2,16 M172,418 q4,8 6,13" stroke="${ink(c)}" stroke-width="4.4" fill="none" stroke-linecap="round"/>` +
        `<path d="M160,418 q-4,10 -2,16 M166,420 q0,10 2,16 M172,418 q4,8 6,13" stroke="${c}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`);
      return ends + puffs + tufts;
    },
  });

  /* =================================================================
     BAGS  (slot bag, cat bag)
     Backpacks: `back` = the bag behind the body (it peeks out beside the neck,
     past the shoulders and between the arms and the waist), `front` = the
     shoulder straps. backZ 12 puts the bag over long loose hair (hair-back is
     z 10), otherwise loose hair would hide it completely.
     ================================================================= */
  /** Shoulder straps for a backpack (left side; mirrored for the right). */
  const packStraps = (c, buckle = '#d9dde3') => pair(() => {
    // flat band: outer edge and inner edge, from beside the neck over the shoulder to the armpit
    const d = 'M168,252 C160,262 150,290 143,338 L157,342 C162,300 170,272 182,258 Z';
    const mid = 'M175,256 C166,268 158,296 150,340';
    return `<path d="${d}" fill="${H.grad(c, 'h')}" stroke="${ink(c)}" stroke-width="2.2" stroke-linejoin="round"/>` +
      `<path d="${mid}" fill="none" stroke="${shade(c, .35)}" stroke-width="1.4" stroke-dasharray="3 3" stroke-linecap="round"/>` +
      // slide buckle where the length is adjusted
      `<rect x="145" y="312" width="16" height="7" rx="2" transform="rotate(-80 153 315.5)" fill="${H.grad(buckle)}" stroke="${ink(buckle)}" stroke-width="1.3"/>`;
  }) +
    // chest strap with a clip, the thing that makes it read as a backpack from the front
    `<path d="M156,326 Q200,334 244,326" fill="none" stroke="${ink(c)}" stroke-width="6.6" stroke-linecap="round"/>` +
    `<path d="M156,326 Q200,334 244,326" fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round"/>` +
    `<rect x="191" y="325" width="18" height="9" rx="3" fill="${H.grad(buckle)}" stroke="${ink(buckle)}" stroke-width="1.4"/>`;
  /** Rounded backpack body behind the doll (x 106–294, y 236–450). */
  const PACK = 'M148,236 C122,236 106,254 106,282 L108,418 C108,438 124,450 146,450 L254,450 C276,450 292,438 292,418 L294,282 C294,254 278,236 252,236 Z';

  /* -------------------------------------------------------------
     Backpack. it.style:
       'classic' rounded bag with a front pocket, zip and a little heart tag
       'stars'   a five-pointed star backpack (points peek out round the doll)
       'unicorn' white bag with ears, a gold horn and a rainbow mane down the side
       'puffin'  black bag with a white face, orange beak, wings and feet
     colors: [bag, strap, detail, extra]
     ------------------------------------------------------------- */
  DOLL.shape('bag-pack', {
    slot: 'bag',
    backZ: 12,
    thumb: [96, 196, 208, 270],
    draw(it) {
      const [c, st = shade(c, -.25), det = '#ffffff', ex = '#f6c636'] = it.colors;
      const style = it.style || 'classic';
      let bag = '';
      if (style === 'stars') {
        // big star body; its points stick out past the shoulders and beside the waist
        let d = '';
        for (let i = 0; i < 10; i++) {
          const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 62 : 128;
          d += (i ? 'L' : 'M') + (200 + Math.cos(a) * r).toFixed(1) + ',' + (344 + Math.sin(a) * r).toFixed(1);
        }
        bag = `<path d="${d}Z" fill="${H.fill(it)}" stroke="${ink(c)}" stroke-width="${SW}" stroke-linejoin="round"/>` +
          `<path d="${d}Z" fill="url(#soft-r)"/>` +
          H.star(200, 344, 36, det) + `<circle cx="188" cy="334" r="5" fill="#fff" opacity=".6"/>` +
          `<path d="${d}Z" fill="none" stroke="${det}" stroke-width="2" stroke-dasharray="3 4" transform="translate(200 344) scale(.88) translate(-200 -344)"/>`;
      } else {
        let extra = '', face = '';
        if (style === 'unicorn') {
          // ears and horn on top, rainbow mane down the left edge, sleepy eyes on the front
          const ear = x => `<path d="M${x - 12},252 Q${x - 6},222 ${x + 2},218 Q${x + 8},236 ${x + 10},254 Z" fill="${H.grad(c)}" stroke="${ink(c)}" stroke-width="2" stroke-linejoin="round"/>` +
            `<path d="M${x - 6},248 Q${x - 2},232 ${x + 2},228 Q${x + 5},240 ${x + 5},250 Z" fill="${det}" opacity=".8"/>`;
          extra = ear(146) + `<g transform="matrix(-1,0,0,1,400,0)">${ear(146)}</g>` +
            `<path d="M186,248 L200,182 L214,248 Z" fill="${H.grad(ex)}" stroke="${ink(ex)}" stroke-width="2" stroke-linejoin="round"/>` +
            H.line('M190,232 L210,226 M193,216 L207,211 M196,200 L204,197', ex, 1.6, .7);
          const mane = ['#ef6f6c', '#f6a65a', '#f7d660', '#7fcf8a', '#6fb3e6', '#a58be0'];
          face = mane.map((m, i) => `<circle cx="${118 + (i % 2) * 6}" cy="${262 + i * 30}" r="14" fill="${m}" stroke="${ink(m)}" stroke-width="1.6"/>`).join('') +
            `<path d="M170,330 q10,8 20,0 M210,330 q10,8 20,0" stroke="#3a2830" stroke-width="2.6" fill="none" stroke-linecap="round"/>` +
            `<circle cx="168" cy="350" r="7" fill="${det}" opacity=".7"/><circle cx="232" cy="350" r="7" fill="${det}" opacity=".7"/>` +
            twinkle(244, 400, 7, ex) + twinkle(156, 410, 5, ex);
        } else if (style === 'puffin') {
          // wings at the sides, orange feet at the bottom corners, a puffin face on the front
          const wing = `<path d="M114,300 C96,320 96,380 110,420 C118,400 120,360 118,310 Z" fill="${H.grad(c)}" stroke="${ink(c)}" stroke-width="2"/>`;
          const foot = `<path d="M136,440 l-10,18 h10 l4,-6 l4,6 h10 l-8,-18 Z" fill="#f2752a" stroke="#a24a17" stroke-width="1.8" stroke-linejoin="round"/>`;
          extra = wing + `<g transform="matrix(-1,0,0,1,400,0)">${wing}</g>` + foot + `<g transform="matrix(-1,0,0,1,400,0)">${foot}</g>`;
          face = `<path d="M200,262 C238,262 254,290 252,322 C250,356 230,376 200,376 C170,376 150,356 148,322 C146,290 162,262 200,262 Z" fill="#fbf8f2" stroke="${ink(c)}" stroke-width="1.6"/>` +
            `<circle cx="178" cy="312" r="7" fill="#2b2733"/><circle cx="222" cy="312" r="7" fill="#2b2733"/><circle cx="180" cy="309" r="2.4" fill="#fff"/><circle cx="224" cy="309" r="2.4" fill="#fff"/>` +
            `<path d="M170,302 l-8,-4 M230,302 l8,-4" stroke="#2b2733" stroke-width="2" stroke-linecap="round"/>` +
            `<path d="M184,330 Q200,322 216,330 Q210,356 200,366 Q190,356 184,330 Z" fill="#f05a28" stroke="#9a3a1a" stroke-width="2" stroke-linejoin="round"/>` +
            `<path d="M188,342 Q200,336 212,342" stroke="#f7d14a" stroke-width="3" fill="none"/><path d="M186,332 Q200,326 214,332" stroke="#8a8f98" stroke-width="3" fill="none"/>` +
            `<circle cx="166" cy="338" r="7" fill="#f48ca0" opacity=".5"/><circle cx="234" cy="338" r="7" fill="#f48ca0" opacity=".5"/>` +
            `<path d="M140,392 Q200,410 260,392" stroke="${shade(c, .2)}" stroke-width="3" fill="none" stroke-dasharray="4 4"/>`;
        } else {
          // classic: top handle, front pocket with a zip, heart tag on the zip pull
          extra = `<path d="M184,244 Q184,226 200,226 Q216,226 216,244" fill="none" stroke="${ink(st)}" stroke-width="8" stroke-linecap="round"/>` +
            `<path d="M184,244 Q184,226 200,226 Q216,226 216,244" fill="none" stroke="${st}" stroke-width="5" stroke-linecap="round"/>`;
          face = `<path d="M140,350 Q140,338 152,338 H248 Q260,338 260,350 V420 Q260,436 244,436 H156 Q140,436 140,420 Z" fill="${H.grad(shade(c, -.06))}" stroke="${ink(c)}" stroke-width="2"/>` +
            `<path d="M146,352 H254" stroke="${shade(c, -.4)}" stroke-width="3" stroke-dasharray="2 2"/>` +
            `<path d="M118,280 Q200,262 282,280" stroke="${shade(c, -.4)}" stroke-width="3" stroke-dasharray="2 2" fill="none"/>` +
            `<path d="M232,352 v12" stroke="${ink(det)}" stroke-width="1.6"/>` + H.heart(232, 372, 9, det) +
            `<path d="M112,300 V420 M288,300 V420" stroke="${st}" stroke-width="6" stroke-linecap="round" opacity=".8"/>`;
        }
        bag = extra + `<path d="${PACK}" fill="${H.fill(it)}"/>` + `<path d="${PACK}" fill="url(#soft-h)"/>` +
          `<path d="${PACK}" fill="none" stroke="${ink(c)}" stroke-width="${SW}" stroke-linejoin="round"/>` + face;
      }
      return { back: bag, front: packStraps(st) };
    },
  });

  /* -------------------------------------------------------------
     Little crossbody purse: thin strap from the left shoulder across the chest,
     purse resting at the right hip. it.style 'heart' | 'berry' | 'round'.
     colors: [purse, strap, detail]
     ------------------------------------------------------------- */
  DOLL.shape('bag-purse', {
    slot: 'bag',
    thumb: [188, 382, 104, 104],
    draw(it) {
      const [c, st = shade(c, -.25), det = '#ffffff'] = it.colors;
      const style = it.style || 'heart';
      const cx = 240, cy = 436;
      // strap: over the left shoulder, diagonally across the chest to the purse
      const strapD = `M174,256 C188,300 214,362 ${cx},${cy - 20}`;
      // small ring where the strap clips onto the purse
      const ring = `<circle cx="${cx}" cy="${cy - 19}" r="3.6" fill="none" stroke="${ink('#d9b04a')}" stroke-width="3.4"/><circle cx="${cx}" cy="${cy - 19}" r="3.6" fill="none" stroke="#f2cf6a" stroke-width="1.8"/>`;
      let purse = '';
      if (style === 'heart') {
        const d = `M${cx},${cy + 26} C${cx - 36},${cy + 4} ${cx - 26},${cy - 26} ${cx},${cy - 12} C${cx + 26},${cy - 26} ${cx + 36},${cy + 4} ${cx},${cy + 26} Z`;
        purse = `<path d="${d}" fill="${H.fill(it)}"/>` + outline(d, c, 'r') +
          `<path d="M${cx - 18},${cy - 4} Q${cx},${cy + 6} ${cx + 18},${cy - 4}" stroke="${ink(c)}" stroke-width="1.6" fill="none" stroke-dasharray="2 2"/>` +
          `<path d="M${cx - 16},${cy - 10} q3,-5 8,-6" stroke="#fff" stroke-width="2.6" stroke-linecap="round" fill="none" opacity=".7"/>` +
          gem(cx, cy + 4, 3.6, det);
      } else if (style === 'berry') {
        // strawberry purse: red berry body, seeds, green leafy flap
        const d = `M${cx},${cy + 28} C${cx - 30},${cy + 16} ${cx - 30},${cy - 20} ${cx},${cy - 18} C${cx + 30},${cy - 20} ${cx + 30},${cy + 16} ${cx},${cy + 28} Z`;
        const leaf = `M${cx - 22},${cy - 14} L${cx - 10},${cy - 6} L${cx - 4},${cy - 14} L${cx},${cy - 4} L${cx + 4},${cy - 14} L${cx + 10},${cy - 6} L${cx + 22},${cy - 14} Q${cx},${cy - 26} ${cx - 22},${cy - 14} Z`;
        const seeds = [[-12, 0], [0, 2], [12, 0], [-8, 12], [6, 12], [-2, 21], [-16, -8], [16, -8]].map(([x, y]) => `<ellipse cx="${cx + x}" cy="${cy + y}" rx="1.4" ry="2.2" fill="#ffe08a"/>`).join('');
        purse = `<path d="${d}" fill="${H.grad(c, 'r')}"/>` + seeds + outline(d, c, 'r') +
          `<path d="${leaf}" fill="${H.grad(det)}" stroke="${ink(det)}" stroke-width="1.8" stroke-linejoin="round"/>` +
          `<path d="M${cx - 15},${cy + 2} q2,-7 7,-9" stroke="#fff" stroke-width="2.6" stroke-linecap="round" fill="none" opacity=".6"/>`;
      } else {
        // round purse with a flap and a flower clasp
        const d = `M${cx - 22},${cy - 8} Q${cx - 24},${cy + 24} ${cx},${cy + 26} Q${cx + 24},${cy + 24} ${cx + 22},${cy - 8} Q${cx},${cy - 22} ${cx - 22},${cy - 8} Z`;
        const flap = `M${cx - 22},${cy - 8} Q${cx},${cy - 22} ${cx + 22},${cy - 8} Q${cx + 14},${cy + 10} ${cx},${cy + 10} Q${cx - 14},${cy + 10} ${cx - 22},${cy - 8} Z`;
        purse = `<path d="${d}" fill="${H.fill(it)}"/>` + outline(d, c, 'r') +
          `<path d="${flap}" fill="${H.grad(shade(c, -.1))}"/>` + outline(flap, c, 'v', 2) +
          H.flower(cx, cy + 8, 8, det);
      }
      // strap first (it goes behind the purse at the ends), then the purse
      return strap(strapD, st, 3.6) + purse + ring;
    },
  });

  /* =================================================================
     Catalog
     ================================================================= */
  DOLL.add([
    // --- shoes ---
    { id: 'shoes-sneaker-pink', shape: 'feet-sneaker', cat: 'shoes', name: { is: 'Bleikir strigaskór', en: 'Pink sneakers' }, colors: ['#f7a6c2', '#ffffff', '#a58be0', '#ffffff'] },
    { id: 'shoes-sneaker-blue', shape: 'feet-sneaker', cat: 'shoes', name: { is: 'Bláir strigaskór', en: 'Blue sneakers' }, colors: ['#5b9ee0', '#ffffff', '#f6c636', '#ffffff'] },
    { id: 'shoes-lightup-white', shape: 'feet-sneaker', cat: 'shoes', name: { is: 'Ljósaskór', en: 'Light-up sneakers' }, colors: ['#f4f1fb', '#ffffff', '#ef5b8d', '#f27aa0'], light: true },
    { id: 'shoes-lightup-purple', shape: 'feet-sneaker', cat: 'shoes', name: { is: 'Fjólubláir ljósaskór', en: 'Purple light-up sneakers' }, colors: ['#a58be0', '#ffffff', '#7fd6c8', '#ffffff'], light: true },
    { id: 'shoes-sandal-pink', shape: 'feet-sandal', cat: 'shoes', name: { is: 'Bleikir sandalar', en: 'Pink sandals' }, colors: ['#ef7aa0', '#f3d9a8', '#ffffff'] },
    { id: 'shoes-sandal-blue', shape: 'feet-sandal', cat: 'shoes', name: { is: 'Bláir sandalar', en: 'Blue sandals' }, colors: ['#4fa3d9', '#c99a6b', '#f6c636'] },
    { id: 'shoes-ballet-pink', shape: 'feet-ballet', cat: 'shoes', name: { is: 'Ballettskór', en: 'Ballet flats' }, colors: ['#f7b8c9', '#e8708f'] },
    { id: 'shoes-ballet-silver', shape: 'feet-ballet', cat: 'shoes', name: { is: 'Silfraðir ballettskór', en: 'Silver ballet flats' }, colors: ['#d9dde8', '#8f86d9'], pattern: 'sparkle', patternSize: 10 },
    { id: 'shoes-glitter-gold', shape: 'feet-glitter', cat: 'shoes', name: { is: 'Gyllt glimmerskór', en: 'Gold glitter shoes' }, colors: ['#f2c34d', '#fff6c8', '#ef5b8d'] },
    { id: 'shoes-glitter-pink', shape: 'feet-glitter', cat: 'shoes', name: { is: 'Bleikir glimmerskór', en: 'Pink glitter shoes' }, colors: ['#ee86b3', '#ffffff', '#7ec8f2'] },
    { id: 'shoes-maryjane-blue', shape: 'maryjane', cat: 'shoes', name: { is: 'Bláir spariskór', en: 'Blue Mary Janes' }, colors: ['#3f74c4', '#2b3a5c'] },
    { id: 'shoes-maryjane-yellow', shape: 'maryjane', cat: 'shoes', name: { is: 'Gulir spariskór', en: 'Yellow Mary Janes' }, colors: ['#f2bd36', '#7a5a2a'] },
    { id: 'shoes-slipper-pompom', shape: 'feet-slipper', cat: 'shoes', name: { is: 'Dúskainniskór', en: 'Pompom slippers' }, colors: ['#f7b8d2', '#ffffff', '#ef6f9a'], face: 'pompom' },
    { id: 'shoes-slipper-bunny', shape: 'feet-slipper', cat: 'shoes', name: { is: 'Kanínuinniskór', en: 'Bunny slippers' }, colors: ['#f4f0f2', '#fde3ec', '#f48ca0'], face: 'bunny' },
    { id: 'shoes-clog-green', shape: 'feet-clog', cat: 'shoes', name: { is: 'Grænir klossar', en: 'Green clogs' }, colors: ['#7fcf8a', '#4f9f63', '#ffffff'], style: 'garden' },
    { id: 'shoes-clog-wood', shape: 'feet-clog', cat: 'shoes', name: { is: 'Tréklossar', en: 'Wooden clogs' }, colors: ['#d8424e', '#e2b27a', '#ffffff'], style: 'wood' },

    // --- boots ---
    { id: 'boots-rain-yellow', shape: 'rainboots', cat: 'boots', name: { is: 'Gul stígvél', en: 'Yellow rain boots' }, colors: ['#f6c636', '#fbe48a', '#4a3b3f'] },
    { id: 'boots-rain-hearts', shape: 'rainboots', cat: 'boots', name: { is: 'Hjartastígvél', en: 'Heart rain boots' }, colors: ['#f48cb6', '#ffffff', '#8a3d5c'], pattern: 'hearts', patternSize: 20 },
    { id: 'boots-rain-stars', shape: 'rainboots', cat: 'boots', name: { is: 'Stjörnustígvél', en: 'Star rain boots' }, colors: ['#3f74c4', '#f7d660', '#2b3a5c'], pattern: 'stars', patternSize: 20 },
    { id: 'boots-rain-green', shape: 'rainboots', cat: 'boots', name: { is: 'Græn stígvél', en: 'Green rain boots' }, colors: ['#6cc04a', '#b6e58f', '#3c5a33'] },
    { id: 'boots-wellies-puffin', shape: 'feet-wellies', cat: 'boots', name: { is: 'Lundastígvél', en: 'Puffin wellies' }, colors: ['#2f5f8f', '#f08a2c', '#2b2733'], motif: 'puffin' },
    { id: 'boots-wellies-frog', shape: 'feet-wellies', cat: 'boots', name: { is: 'Froskastígvél', en: 'Frog wellies' }, colors: ['#7ccf4a', '#c3ee8c', '#3c5a33'], motif: 'frog' },
    { id: 'boots-snow-pink', shape: 'feet-snowboots', cat: 'boots', name: { is: 'Bleikir kuldaskór', en: 'Pink snow boots' }, colors: ['#ee86b3', '#fff8ee', '#4a3b3f'] },
    { id: 'boots-snow-blue', shape: 'feet-snowboots', cat: 'boots', name: { is: 'Bláir kuldaskór', en: 'Blue snow boots' }, colors: ['#6fb3e6', '#ffffff', '#3b3f55'] },
    { id: 'boots-riding-brown', shape: 'feet-riding', cat: 'boots', name: { is: 'Reiðstígvél', en: 'Riding boots' }, colors: ['#9a5a34', '#5e3420', '#f2c96a'] },
    { id: 'boots-riding-black', shape: 'feet-riding', cat: 'boots', name: { is: 'Svört reiðstígvél', en: 'Black riding boots' }, colors: ['#3d3540', '#2a2330', '#d9dde3'] },
    { id: 'boots-princess-lilac', shape: 'feet-princessboots', cat: 'boots', name: { is: 'Prinsessustígvél', en: 'Princess boots' }, colors: ['#c3a8f0', '#ffffff', '#5fb7ea', '#8f6fd6'] },
    { id: 'boots-princess-rose', shape: 'feet-princessboots', cat: 'boots', name: { is: 'Rósastígvél', en: 'Rose princess boots' }, colors: ['#f6a6c4', '#ffffff', '#ef5b8d', '#d9668f'] },
    { id: 'boots-felt-grey', shape: 'feet-felt', cat: 'boots', name: { is: 'Flókaskór', en: 'Felt boots' }, colors: ['#a9a6b3', '#e9e3d6', '#e2505b', '#f6c636'] },

    // --- mittens ---
    { id: 'mittens-knit-red', shape: 'mitt', cat: 'mittens', name: { is: 'Rauðir vettlingar', en: 'Red knitted mittens' }, colors: ['#e2505b', '#f4eee6', '#ffffff'], style: 'knit', motif: 'heart' },
    { id: 'mittens-knit-teal', shape: 'mitt', cat: 'mittens', name: { is: 'Stjörnuvettlingar', en: 'Star mittens' }, colors: ['#4fb3b0', '#f6c636', '#fff3b0'], style: 'knit', motif: 'star' },
    { id: 'mittens-lopi-classic', shape: 'mitt', cat: 'mittens', name: { is: 'Lopavettlingar', en: 'Icelandic mittens' }, colors: ['#ece3d2', '#4b3a35', '#6f9cc9'], style: 'lopi' },
    { id: 'mittens-lopi-red', shape: 'mitt', cat: 'mittens', name: { is: 'Rauðir lopavettlingar', en: 'Red Icelandic mittens' }, colors: ['#c8424c', '#fbf3e6', '#f6c636'], style: 'lopi' },
    { id: 'mittens-snow-blue', shape: 'mitt', cat: 'mittens', name: { is: 'Snjókornavettlingar', en: 'Snowflake mittens' }, colors: ['#4f8fd8', '#ffffff', '#ffffff', '#b9a8f2'], style: 'snow' },
    { id: 'mittens-ski-pink', shape: 'mitt', cat: 'mittens', name: { is: 'Skíðavettlingar', en: 'Ski mittens' }, colors: ['#ef5b8d', '#3b3f55', '#7fd6c8', '#e6ecf2'], style: 'ski' },
    { id: 'mittens-ski-blue', shape: 'mitt', cat: 'mittens', name: { is: 'Bláir skíðavettlingar', en: 'Blue ski mittens' }, colors: ['#3f86d0', '#2b3a5c', '#f6c636', '#e6ecf2'], style: 'ski' },
    { id: 'mittens-string-yellow', shape: 'mitt', cat: 'mittens', name: { is: 'Vettlingar í bandi', en: 'Mittens on a string' }, colors: ['#f6c636', '#e2505b', '#e2505b', '#e2505b'], style: 'knit', motif: 'heart', string: true },
    { id: 'mittens-fluffy-lilac', shape: 'mitt', cat: 'mittens', name: { is: 'Loðvettlingar', en: 'Fluffy mittens' }, colors: ['#d9c8f5', '#ffffff', '#f27aa0', '#f27aa0'], style: 'fluffy' },

    // --- scarves ---
    { id: 'scarf-knit-red', shape: 'scarf-knit', cat: 'scarf', name: { is: 'Rauður trefill', en: 'Red scarf' }, colors: ['#e2505b', '#f4eee6'], tails: 2, fringe: true },
    { id: 'scarf-stripes-rainbow', shape: 'scarf-knit', cat: 'scarf', name: { is: 'Röndóttur trefill', en: 'Striped scarf' }, colors: ['#fdf6ea', '#ef6f6c'], tails: 2, fringe: true, stripes: ['#ef6f6c', '#f7d660', '#6fb3e6'] },
    { id: 'scarf-stripes-mint', shape: 'scarf-knit', cat: 'scarf', name: { is: 'Myntugrænn trefill', en: 'Mint striped scarf' }, colors: ['#8ad8c4', '#ffffff'], tails: 1, fringe: true, stripes: ['#ffffff', '#f48cb6'] },
    { id: 'scarf-lopi', shape: 'scarf-knit', cat: 'scarf', name: { is: 'Lopatrefill', en: 'Icelandic scarf' }, colors: ['#ece3d2', '#4b3a35', '#6f9cc9'], tails: 2, fringe: true, lopi: true },
    { id: 'scarf-puffin', shape: 'scarf-knit', cat: 'scarf', name: { is: 'Lundatrefill', en: 'Puffin scarf' }, colors: ['#3d6ea8', '#f08a2c'], tails: 1, stripes: ['#f08a2c'], puffin: true },
    { id: 'scarf-snood-pink', shape: 'scarf-snood', cat: 'scarf', name: { is: 'Hálskragi', en: 'Pink snood' }, colors: ['#f4a3c0', '#ffffff'] },
    { id: 'scarf-snood-grey', shape: 'scarf-snood', cat: 'scarf', name: { is: 'Grár hálskragi', en: 'Grey snood' }, colors: ['#b7b4c2', '#f48ca0'] },
    { id: 'scarf-boa-pink', shape: 'scarf-boa', cat: 'scarf', name: { is: 'Fjaðratrefill', en: 'Feather boa' }, colors: ['#f48cc0', '#ffd6ea', '#ffffff'] },

    // --- bags ---
    { id: 'bag-pack-red', shape: 'bag-pack', cat: 'bag', name: { is: 'Rauður bakpoki', en: 'Red backpack' }, colors: ['#e2505b', '#8f2f3a', '#f7d660'], style: 'classic' },
    { id: 'bag-pack-dots', shape: 'bag-pack', cat: 'bag', name: { is: 'Doppóttur bakpoki', en: 'Dotty backpack' }, colors: ['#6fb3e6', '#ffffff', '#f48cb6'], pattern: 'dots', patternSize: 22, style: 'classic' },
    { id: 'bag-pack-star', shape: 'bag-pack', cat: 'bag', name: { is: 'Stjörnubakpoki', en: 'Star backpack' }, colors: ['#f6c636', '#3f74c4', '#fff6c8'], style: 'stars' },
    { id: 'bag-pack-unicorn', shape: 'bag-pack', cat: 'bag', name: { is: 'Einhyrningsbakpoki', en: 'Unicorn backpack' }, colors: ['#fbf6fb', '#c3a8f0', '#f7b8d2', '#f2c34d'], style: 'unicorn' },
    { id: 'bag-pack-puffin', shape: 'bag-pack', cat: 'bag', name: { is: 'Lundabakpoki', en: 'Puffin backpack' }, colors: ['#2b2733', '#f08a2c', '#ffffff'], style: 'puffin' },
    { id: 'bag-purse-heart', shape: 'bag-purse', cat: 'bag', name: { is: 'Hjartaveski', en: 'Heart purse' }, colors: ['#ef5b8d', '#f7b8d2', '#7ec8f2'], style: 'heart' },
    { id: 'bag-purse-berry', shape: 'bag-purse', cat: 'bag', name: { is: 'Jarðarberjaveski', en: 'Strawberry purse' }, colors: ['#e8475a', '#4fae5b', '#4fae5b'], style: 'berry' },
    { id: 'bag-purse-round', shape: 'bag-purse', cat: 'bag', name: { is: 'Blómaveski', en: 'Flower purse' }, colors: ['#8fd3c8', '#5a9f96', '#ffffff'], style: 'round' },
  ]);
})();
