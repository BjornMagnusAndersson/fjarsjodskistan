/* =====================================================================
   Headwear and accessories: hats, crowns, hairbands, glasses,
   earrings and necklaces.
   Every shape draws in doll space (viewBox 0 0 400 800) from the G
   geometry, so it sits on the head, eyes, earlobes or neck.
   Drawing order inside a piece: fill → details → outline + soft shading.
   ===================================================================== */
(function () {
  'use strict';
  const { shade, ink } = H;
  const SW = G.stroke;

  /** Final pass for a shape: soft shading overlay plus the tinted outline. */
  const outline = (d, base, soft = 'v', sw = SW) =>
    `<path d="${d}" fill="url(#soft-${soft})" stroke="${ink(base)}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"/>`;

  /** Number formatting and point helpers. */
  const n1 = v => (Math.round(v * 10) / 10).toString();
  // turn a point [x, y] into the text 'x,y' (one decimal) for use in SVG paths
  const P = p => n1(p[0]) + ',' + n1(p[1]);
  /** Point on a circle, angle in degrees. */
  const pol = (cx, cy, r, deg) => [cx + Math.cos(deg * Math.PI / 180) * r, cy + Math.sin(deg * Math.PI / 180) * r];
  /** Point on the head ellipse grown by `off` (degrees, 270 = top of the head). */
  const at = (deg, off) => {
    const { cx, cy, rx, ry } = G.head, a = deg * Math.PI / 180;
    return [cx + Math.cos(a) * (rx + off), cy + Math.sin(a) * (ry + off)];
  };
  /** Mirror any markup across the centre line (x → 400 - x). Used for right-side copies. */
  const mirror = s => `<g transform="matrix(-1 0 0 1 400 0)">${s}</g>`;
  /** Register a vertical gradient with [offset, colour] stops. Returns url(#id). */
  const addGrad = (id, stops, x2 = 0, y2 = 1) => H.def(id, `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.map(([o, c, op]) => `<stop offset="${o}" stop-color="${c}"${op != null ? ` stop-opacity="${op}"` : ''}/>`).join('')}</linearGradient>`);

  /** Fluffy pompom: a ring of small puffs around a centre ball. */
  const pompom = (cx, cy, r, col) => {
    let s = '';
    for (let a = 0; a < 360; a += 30) { const [x, y] = pol(cx, cy, r, a); s += `<circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(r * .58)}" fill="${H.grad(col, 'r')}" stroke="${ink(col)}" stroke-width="1.6"/>`; }
    return s + `<circle cx="${cx}" cy="${cy}" r="${n1(r * .93)}" fill="${H.grad(col, 'r')}"/>`;
  };
  /** Five-petal flower with outline (r = flower radius). */
  const bloom = (cx, cy, r, col, mid = '#ffd84d', petals = 5, rot = -90) => {
    let s = '';
    for (let i = 0; i < petals; i++) {
      const [x, y] = pol(cx, cy, r * .55, rot + i * 360 / petals);
      s += `<circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(r * (petals > 5 ? .36 : .46))}" fill="${H.grad(col, 'r')}" stroke="${ink(col)}" stroke-width="1.2"/>`;
    }
    return s + `<circle cx="${n1(cx)}" cy="${n1(cy)}" r="${n1(r * .3)}" fill="${H.grad(mid, 'r')}" stroke="${ink(mid)}" stroke-width="1"/>`;
  };
  /** Leaf pointing at angle `deg` from (x,y), length l. */
  const leaf = (x, y, l, deg, col = '#5fae5a') => {
    const [tx, ty] = pol(x, y, l, deg), [a1, b1] = pol(x, y, l * .55, deg - 28), [a2, b2] = pol(x, y, l * .55, deg + 28);
    return `<path d="M${n1(x)},${n1(y)}Q${n1(a1)},${n1(b1)} ${n1(tx)},${n1(ty)}Q${n1(a2)},${n1(b2)} ${n1(x)},${n1(y)}Z" fill="${H.grad(col)}" stroke="${ink(col)}" stroke-width="1.2" stroke-linejoin="round"/>`;
  };
  /** Outlined five-point star. */
  const starO = (cx, cy, r, col, sw = 1.5) => {
    let d = '';
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .48 : r; d += (i ? 'L' : 'M') + n1(cx + Math.cos(a) * rr) + ',' + n1(cy + Math.sin(a) * rr); }
    return `<path d="${d}Z" fill="${H.grad(col, 'r')}" stroke="${ink(col)}" stroke-width="${sw}" stroke-linejoin="round"/>`;
  };
  /** Heart outline path (point down). */
  const heartD = (cx, cy, r) => `M${n1(cx)},${n1(cy + r * .95)} C${n1(cx - r * 1.5)},${n1(cy + r * .05)} ${n1(cx - r * .95)},${n1(cy - r * 1.05)} ${n1(cx)},${n1(cy - r * .38)} C${n1(cx + r * .95)},${n1(cy - r * 1.05)} ${n1(cx + r * 1.5)},${n1(cy + r * .05)} ${n1(cx)},${n1(cy + r * .95)} Z`;
  /** Small white four-point twinkle. */
  const twinkle = (x, y, r, col = '#fff') => `<path d="M${x},${y - r}Q${x},${y} ${x + r},${y}Q${x},${y} ${x},${y + r}Q${x},${y} ${x - r},${y}Q${x},${y} ${x},${y - r}Z" fill="${col}"/>`;
  /** Outlined strawberry with seeds and a leafy top. */
  const strawberry = (cx, cy, r) =>
    `<path d="M${n1(cx)},${n1(cy + r)} C${n1(cx - r * 1.15)},${n1(cy + r * .2)} ${n1(cx - r)},${n1(cy - r * .75)} ${n1(cx)},${n1(cy - r * .6)} C${n1(cx + r)},${n1(cy - r * .75)} ${n1(cx + r * 1.15)},${n1(cy + r * .2)} ${n1(cx)},${n1(cy + r)}Z" fill="${H.grad('#e8475a', 'r')}" stroke="${ink('#e8475a')}" stroke-width="1.3"/>` +
    [[-.35, -.15], [.3, -.2], [0, .15], [-.3, .3], [.3, .35], [0, -.35]].map(([a, b]) => `<ellipse cx="${n1(cx + a * r)}" cy="${n1(cy + b * r)}" rx="${n1(r * .07 + .3)}" ry="${n1(r * .1 + .3)}" fill="#ffe08a"/>`).join('') +
    `<path d="M${n1(cx - r * .7)},${n1(cy - r * .55)} L${n1(cx - r * .2)},${n1(cy - r * .45)} L${n1(cx)},${n1(cy - r * .9)} L${n1(cx + r * .2)},${n1(cy - r * .45)} L${n1(cx + r * .7)},${n1(cy - r * .55)} Q${n1(cx)},${n1(cy - r * .2)} ${n1(cx - r * .7)},${n1(cy - r * .55)}Z" fill="#4fae5b" stroke="${ink('#4fae5b')}" stroke-width="1.1" stroke-linejoin="round"/>`;
  /** Snowflake with little branch ticks (stroke based). */
  const flakeO = (cx, cy, r, col, w = 2.2) => {
    let d = '';
    for (let i = 0; i < 6; i++) {
      const a = i * 60 - 90, [x, y] = pol(cx, cy, r, a), [bx, by] = pol(cx, cy, r * .55, a);
      const [t1x, t1y] = pol(bx, by, r * .32, a - 45), [t2x, t2y] = pol(bx, by, r * .32, a + 45);
      d += `M${n1(cx)},${n1(cy)}L${n1(x)},${n1(y)}M${n1(bx)},${n1(by)}L${n1(t1x)},${n1(t1y)}M${n1(bx)},${n1(by)}L${n1(t2x)},${n1(t2y)}`;
    }
    return `<path d="${d}" stroke="${ink(col)}" stroke-width="${w + 2}" stroke-linecap="round" fill="none" opacity=".6"/>` +
      `<path d="${d}" stroke="${col}" stroke-width="${w}" stroke-linecap="round" fill="none"/>`;
  };

  /* =====================================================================
     HATS (slot hat). All hats cover the top of the hair (hair top ≈ y 60,
     outer width ≈ 106–294) and come down to ≈ y 125–135 at the sides.
     ===================================================================== */

  /* -------------------------------------------------------------
     Knitted earflap hat (Icelandic style) with a pattern band,
     earflaps over the ears and braided ties with tassels.
     colors: [base knit, band, band motif, pompom + ties]
     ------------------------------------------------------------- */
  DOLL.shape('head-earflap', {
    slot: 'hat',
    thumb: [84, 18, 232, 262],
    draw(it) {
      const [base, band, motif, pom] = it.colors;
      const dome = 'M112,126 C106,68 148,44 200,44 C252,44 294,68 288,126 Z';
      const bandD = 'M108,104 Q200,88 292,104 L294,132 Q200,116 106,132 Z';
      // left earflap: covers the ear, rounded at the bottom
      const flap = 'M108,118 C104,148 106,176 114,192 Q128,206 142,192 C148,170 148,144 146,120 Z';
      /** Braided tie hanging from the left flap, with a tassel. */
      const braid = (() => {
        let s = '';
        for (let i = 0; i < 7; i++) {
          const y = 204 + i * 7.5, x = 128 + (i % 2 ? 1.8 : -1.8);
          s += `<ellipse cx="${n1(x)}" cy="${y}" rx="3.6" ry="5.4" transform="rotate(${i % 2 ? -28 : 28} ${n1(x)} ${y})" fill="${H.grad(pom)}" stroke="${ink(pom)}" stroke-width="1.2"/>`;
        }
        // tassel: a knot and a fan of strands
        s += `<path d="M128,256 l-6,16 M128,256 l-2,18 M128,256 l2,18 M128,256 l6,16" stroke="${ink(pom)}" stroke-width="4.4" stroke-linecap="round"/>` +
          `<path d="M128,256 l-6,16 M128,256 l-2,18 M128,256 l2,18 M128,256 l6,16" stroke="${pom}" stroke-width="2.6" stroke-linecap="round"/>` +
          `<circle cx="128" cy="256" r="4.6" fill="${H.grad(pom, 'r')}" stroke="${ink(pom)}" stroke-width="1.3"/>`;
        return s;
      })();
      const flapFill = H.pat('knit', base, shade(base, -.3), 10);
      const flapL = `<path d="${flap}" fill="${flapFill}"/>` +
        `<path d="M112,180 Q128,194 144,178" fill="none" stroke="${band}" stroke-width="5" stroke-linecap="round"/>` + outline(flap, base, 'h') + braid;
      // band motif: little triangles pointing up and down plus dots
      const clip = H.clip('c-' + it.id + '-band', bandD);
      let motifs = '';
      for (let x = 112; x < 292; x += 12) {
        const y = 104 + (Math.pow((x - 200) / 92, 2) - 1) * 8 + 4;
        motifs += `<path d="M${x - 4},${n1(y + 5)} l4,-6 l4,6 Z M${x + 2},${n1(y + 10)} l4,6 l4,-6Z" fill="${motif}"/>`;
      }
      return mirror(flapL) + flapL +
        `<path d="${dome}" fill="${H.pat('knit', base, shade(base, -.3), 10)}"/>` + outline(dome, base) +
        `<path d="${bandD}" fill="${H.grad(band)}"/><g clip-path="${clip}">${motifs}</g>` + outline(bandD, band) +
        pompom(200, 38, 13, pom);
    },
  });

  /* -------------------------------------------------------------
     Sun hat with a wide brim and a ribbon. The brim's far half
     is drawn behind the head (`back`), the near half in front.
     colors: [straw, ribbon, flower colours...]; it.flowers = true adds blooms
     ------------------------------------------------------------- */
  DOLL.shape('head-sunhat', {
    slot: 'hat',
    thumb: [56, 20, 288, 136],
    draw(it) {
      const [straw, ribbon] = it.colors;
      const cx = 200, cy = 108, rx = 138, ry = 26;
      const weave = it.pattern ? H.pat(it.pattern, straw, it.colors[2] || '#ffffff', 16) : H.pat('check', straw, shade(straw, -.22), 7);
      const brimAll = `M${cx - rx},${cy} A${rx},${ry} 0 1 0 ${cx + rx},${cy} A${rx},${ry} 0 1 0 ${cx - rx},${cy} Z`;
      const brimFront = `M${cx - rx},${cy} A${rx},${ry} 0 0 0 ${cx + rx},${cy} L292,${cy} Q200,${cy - 10} 108,${cy} Z`;
      const crown = `M108,${cy} C104,58 148,40 200,40 C252,40 296,58 292,${cy} Q200,${cy - 10} 108,${cy} Z`;
      const ribbonD = `M107,${cy - 16} Q200,${cy - 30} 293,${cy - 16} L292,${cy} Q200,${cy - 10} 108,${cy} Z`;
      // bow tails on the right side of the ribbon
      const bowTail = `M262,${cy - 14} q14,18 6,40 l8,-4 l4,8 q8,-24 -6,-44 Z`;
      let flowers = '';
      if (it.flowers) {
        const cols = it.colors.slice(2);
        flowers = leaf(134, cy - 12, 16, 200) + leaf(150, cy - 22, 15, 260) +
          [[140, cy - 14, 12], [162, cy - 18, 10], [124, cy - 4, 9]].map(([x, y, r], i) => bloom(x, y, r, cols[i % cols.length])).join('');
      }
      return {
        // far half of the brim (behind the head) with a soft inner shadow
        back: `<path d="${brimAll}" fill="${weave}"/><ellipse cx="${cx}" cy="${cy - 6}" rx="${rx - 30}" ry="${ry - 10}" fill="${shade(straw, -.4)}" opacity=".25"/>` + outline(brimAll, straw, 'v'),
        front: `<path d="${crown}" fill="${weave}"/>` + outline(crown, straw) +
          `<path d="${ribbonD}" fill="${H.grad(ribbon)}"/>` + outline(ribbonD, ribbon, 'v', 2) +
          `<path d="${brimFront}" fill="${weave}"/>` +
          // underside shading along the brim edge and a highlight
          `<path d="M${cx - rx + 8},${cy + 6} A${rx - 8},${ry - 4} 0 0 0 ${cx + rx - 8},${cy + 6}" fill="none" stroke="${shade(straw, -.3)}" stroke-width="4" opacity=".35"/>` +
          outline(brimFront, straw) +
          `<path d="M130,70 Q150,52 180,47" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".45"/>` +
          `<path d="${bowTail}" fill="${H.grad(ribbon)}" stroke="${ink(ribbon)}" stroke-width="2" stroke-linejoin="round"/>` +
          `<ellipse cx="262" cy="${cy - 15}" rx="7" ry="6" fill="${H.grad(ribbon, 'r')}" stroke="${ink(ribbon)}" stroke-width="2"/>` +
          flowers,
      };
    },
  });

  /* -------------------------------------------------------------
     Baseball cap: six-panel crown, top button, curved visor and a
     small motif (star or heart) on the front panel.
     colors: [crown, visor, motif]; it.motif = 'star' | 'heart'
     ------------------------------------------------------------- */
  DOLL.shape('head-cap', {
    slot: 'hat',
    thumb: [96, 30, 208, 124],
    draw(it) {
      const [c, visor, mc = '#ffffff'] = it.colors;
      const crown = 'M112,122 C106,64 150,44 200,44 C250,44 294,64 288,122 Q200,104 112,122 Z';
      const visorD = 'M122,114 Q200,98 278,114 Q290,128 268,136 Q200,152 132,136 Q110,128 122,114 Z';
      const seams = 'M200,46 Q168,70 156,114 M200,46 Q232,70 244,114 M200,46 V106';
      const motif = it.motif === 'heart'
        ? `<path d="${heartD(200, 78, 12)}" fill="${H.grad(mc, 'r')}" stroke="${ink(mc)}" stroke-width="1.6"/>`
        : starO(200, 78, 14, mc, 1.6);
      return `<path d="${crown}" fill="${H.fill(it)}"/>` + H.line(seams, c, 1.8, .5) +
        `<path d="M118,112 Q200,96 282,112" fill="none" stroke="${shade(c, -.2)}" stroke-width="4" opacity=".5"/>` +
        `<path d="M140,72 Q154,54 180,48" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".4"/>` +
        outline(crown, c) + motif +
        `<ellipse cx="200" cy="45" rx="9" ry="5" fill="${H.grad(visor, 'r')}" stroke="${ink(visor)}" stroke-width="1.8"/>` +
        `<path d="${visorD}" fill="${H.grad(visor)}"/>` +
        // stitching rows on the visor
        `<path d="M130,124 Q200,110 270,124 M134,130 Q200,118 266,130" fill="none" stroke="${shade(visor, .35)}" stroke-width="1.4" stroke-dasharray="3 3" opacity=".8"/>` +
        outline(visorD, visor);
    },
  });

  /* -------------------------------------------------------------
     Bucket hat: rounded crown, band and a soft sloping brim.
     colors: [main, motif colour for the pattern, band]
     ------------------------------------------------------------- */
  DOLL.shape('head-bucket', {
    slot: 'hat',
    thumb: [88, 28, 224, 130],
    draw(it) {
      const c = it.colors[0], band = it.colors[2] || shade(c, -.2);
      const crown = 'M114,98 C110,54 152,40 200,40 C248,40 290,54 286,98 Z';
      const brim = 'M112,90 Q200,78 288,90 C296,102 304,116 310,128 Q200,152 90,128 C96,116 104,102 112,90 Z';
      const bandD = 'M113,84 Q200,72 287,84 L288,96 Q200,84 112,96 Z';
      return `<path d="${crown}" fill="${H.fill(it)}"/>` + outline(crown, c) +
        `<path d="${brim}" fill="${H.fill(it)}"/>` +
        // stitched rings around the brim
        `<path d="M106,104 Q200,92 294,104 M100,116 Q200,104 300,116" fill="none" stroke="${ink(c)}" stroke-width="1.3" stroke-dasharray="3 3" opacity=".55"/>` +
        outline(brim, c) +
        `<path d="${bandD}" fill="${H.grad(band)}"/>` + outline(bandD, band, 'v', 1.8) +
        `<path d="M136,62 Q152,50 176,46" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".45"/>`;
    },
  });

  /* -------------------------------------------------------------
     Sou'wester rain hat: glossy crown with seams, brim that curves
     down over the sides and a long back flap (behind the head).
     colors: [main, lining]
     ------------------------------------------------------------- */
  DOLL.shape('head-souwester', {
    slot: 'hat',
    thumb: [76, 26, 248, 150],
    draw(it) {
      const [c, lining = shade(c, -.25)] = it.colors;
      const crown = 'M116,104 C112,58 152,42 200,42 C248,42 288,58 284,104 Z';
      const brim = 'M112,92 Q200,80 288,92 C300,104 308,124 308,144 Q308,152 298,150 Q292,140 284,136 Q200,118 116,136 Q108,140 102,150 Q92,152 92,144 C92,124 100,104 112,92 Z';
      const flap = 'M100,116 C94,166 102,204 122,222 Q200,242 278,222 C298,204 306,166 300,116 Z';
      const shine = `<path d="M136,70 Q152,52 178,47" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".55"/>` +
        `<path d="M118,112 Q130,104 150,100" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" opacity=".5"/>`;
      return {
        back: `<path d="${flap}" fill="${H.grad(lining)}"/>` + outline(flap, c),
        front: `<path d="${crown}" fill="${H.grad(c)}"/>` +
          H.line('M200,44 V100 M200,44 Q160,64 152,100 M200,44 Q240,64 248,100', c, 1.8, .45) +
          outline(crown, c) +
          `<path d="${brim}" fill="${H.grad(c)}"/>` +
          // two stitched rows along the brim edge
          `<path d="M98,142 Q104,130 116,128 Q200,110 284,128 Q296,130 302,142" fill="none" stroke="${ink(c)}" stroke-width="1.4" stroke-dasharray="4 3" opacity=".55"/>` +
          shine + outline(brim, c) +
          `<circle cx="200" cy="44" r="4" fill="${H.grad(shade(c, -.1), 'r')}" stroke="${ink(c)}" stroke-width="1.5"/>`,
      };
    },
  });

  /* -------------------------------------------------------------
     Party hat: striped cone sitting on top of the head, zigzag
     trim at the base and a pompom on the tip.
     colors: [main, stripe/motif, trim, pompom]; it.pattern for the motif
     ------------------------------------------------------------- */
  DOLL.shape('head-party', {
    slot: 'hat',
    thumb: [124, 6, 152, 104],
    draw(it) {
      const [c, c2, trim, pom] = it.colors;
      const cone = 'M148,84 L196,24 Q200,19 204,24 L252,84 Q200,104 148,84 Z';
      let zig = 'M146,84';
      for (let i = 0; i < 12; i++) { const t = (i + 1) / 12, x = 146 + 108 * t, y = 84 + Math.sin(t * Math.PI) * 18; zig += `L${n1(x - 4.5)},${n1(y + (i % 2 ? 0 : 7))}L${n1(x)},${n1(y)}`; }
      const trimD = 'M146,80 Q200,100 254,80 L256,90 Q200,112 144,90 Z';
      return `<path d="${cone}" fill="${H.pat(it.pattern || 'stripes', c, c2, it.patternSize || 14)}"/>` +
        `<path d="M176,52 Q170,66 168,82" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".5"/>` +
        outline(cone, c) +
        `<path d="${trimD}" fill="${H.grad(trim)}"/>` +
        // fringe on the trim
        Array.from({ length: 14 }, (_, i) => { const x = 148 + i * 8, y = 88 + Math.sin(((x - 144) / 112) * Math.PI) * 18; return `<path d="M${x},${n1(y - 2)} l-2,${7}" stroke="${shade(trim, -.25)}" stroke-width="1.6" stroke-linecap="round"/>`; }).join('') +
        outline(trimD, trim, 'v', 2) + pompom(200, 21, 10, pom);
    },
  });

  /* -------------------------------------------------------------
     Animal knit hats on the beanie base: puffin (black with a white
     face, orange beak) or unicorn (golden horn, ears, flowers).
     colors: [knit, cuff, accent]; it.kind = 'puffin' | 'unicorn'
     ------------------------------------------------------------- */
  DOLL.shape('head-critter', {
    slot: 'hat',
    thumb: [80, 2, 240, 168],
    draw(it) {
      const [c, cuffC, acc] = it.colors;
      const dome = 'M114,124 C108,68 148,44 200,44 C252,44 292,68 286,124 Z';
      const cuff = 'M106,106 Q200,90 294,106 L296,134 Q200,116 104,134 Z';
      const ribs = Array.from({ length: 37 }, (_, i) => { const x = 110 + i * 5; return `M${x},${n1(104 - Math.sin((x - 106) / 188 * Math.PI) * 12)}v26`; }).join('');
      const knit = H.pat('knit', c, shade(c, -.3), 10);
      let extra = '', ears = '';
      if (it.kind === 'puffin') {
        // white face mask with two cheek lobes, dark eyes with the red eye ring and grey mark, striped beak
        const face = 'M150,96 C140,74 160,56 182,62 Q200,68 218,62 C240,56 260,74 250,96 Q200,90 150,96 Z';
        // one bird eye at x: grey mark, red ring, dark pupil and a white glint
        const eye = x => `<path d="M${x - 10},${66} l6,4 l-6,4 Z" fill="#9aa3b4"/>` +
          `<circle cx="${x}" cy="72" r="6" fill="#e2573d"/><circle cx="${x}" cy="72" r="4.2" fill="#2a2430"/><circle cx="${x + 1.6}" cy="70.4" r="1.6" fill="#fff"/>`;
        const beak = 'M184,74 Q200,64 216,74 Q220,94 200,118 Q180,94 184,74 Z';
        const beakClip = H.clip('c-' + it.id + '-beak', beak);
        extra = `<path d="${face}" fill="${H.grad('#f6f4ef')}"/>` + outline(face, '#cfcac0', 'v', 2) +
          eye(170) + mirror(eye(170)) +
          `<path d="${beak}" fill="#e8582f"/><g clip-path="${beakClip}"><path d="M176,64 Q200,58 224,64 V78 Q200,72 176,78 Z" fill="#7d8899"/><path d="M176,79 Q200,73 224,79 V84 Q200,78 176,84 Z" fill="#f6c43c"/><path d="M184,96 Q200,90 216,96 M188,104 Q200,99 212,104" stroke="#c43c22" stroke-width="2" fill="none"/></g>` +
          outline(beak, '#e8582f', 'h', 2) +
          `<path d="M190,88 q3,-4 7,-3" stroke="#fff" stroke-width="1.6" stroke-linecap="round" fill="none" opacity=".7"/>`;

      } else {
        // golden spiral horn on top, white ears with pink insides, two flowers
        const horn = 'M188,52 L198,8 Q200,4 202,8 L212,52 Q200,58 188,52 Z';
        const hclip = H.clip('c-' + it.id + '-horn', horn);
        const spiral = [46, 36, 26, 16].map(y => `M${188 + (52 - y) * .2},${y + 4} Q200,${y - 2} ${212 - (52 - y) * .2},${y - 4}`).join('');
        const ear = `<path d="M148,74 L136,40 Q136,36 140,38 L172,58 Z" fill="${H.grad(c)}" stroke="${ink(c)}" stroke-width="2" stroke-linejoin="round"/>` +
          `<path d="M150,66 L142,46 L164,60 Z" fill="${acc}" opacity=".8"/>`;
        ears = ear + mirror(ear);
        extra = `<path d="${horn}" fill="${H.grad('#f6cf5e')}"/><g clip-path="${hclip}"><path d="${spiral}" stroke="#d99a2b" stroke-width="2.4" fill="none"/></g>` + outline(horn, '#f2c34d', 'h', 2) +
          bloom(176, 58, 10, acc) + bloom(224, 58, 10, '#b9a8f2') + leaf(186, 62, 10, 300) + leaf(214, 62, 10, 240);
      }
      return (it.kind === 'puffin' ? '' : ears) +
        `<path d="${dome}" fill="${knit}"/>` + outline(dome, c) +
        (it.kind === 'puffin' ? '' : extra) +
        `<path d="${cuff}" fill="${H.grad(cuffC)}"/><path d="${ribs}" stroke="${ink(cuffC)}" stroke-width="1.3" opacity=".35"/>` + outline(cuff, cuffC) +
        (it.kind === 'puffin' ? extra + ears : '');
    },
  });

  DOLL.add([
    // bobble beanies (shape from examples.js)
    { id: 'hat-beanie-stripes', shape: 'beanie', cat: 'hat', name: { is: 'Röndótt dúskhúfa', en: 'Striped bobble hat' }, colors: ['#6fb3e6', '#ffffff', '#ffffff'], pattern: 'hstripes' },
    { id: 'hat-beanie-snow', shape: 'beanie', cat: 'hat', name: { is: 'Snjókornahúfa', en: 'Snowflake hat' }, colors: ['#3f6fb8', '#ffffff', '#ffffff'], pattern: 'snow' },
    { id: 'hat-beanie-hearts', shape: 'beanie', cat: 'hat', name: { is: 'Hjartahúfa', en: 'Heart hat' }, colors: ['#f7b6c8', '#e2506f', '#e2506f'], pattern: 'hearts' },
    { id: 'hat-beanie-mint', shape: 'beanie', cat: 'hat', name: { is: 'Myntugræn prjónahúfa', en: 'Mint knit hat' }, colors: ['#7fd1b6', '#ffffff', '#f7d660'] },
    { id: 'hat-beanie-lilac', shape: 'beanie', cat: 'hat', name: { is: 'Fjólublá prjónahúfa', en: 'Lilac knit hat' }, colors: ['#b59be6', '#ffffff', '#f48ca0'] },
    // earflap hats
    { id: 'hat-earflap-lopi', shape: 'head-earflap', cat: 'hat', name: { is: 'Eyrnaskjólshúfa', en: 'Earflap hat' }, colors: ['#ece3d2', '#4b3a35', '#ffffff', '#6f9cc9'] },
    { id: 'hat-earflap-pink', shape: 'head-earflap', cat: 'hat', name: { is: 'Bleik eyrnaskjólshúfa', en: 'Pink earflap hat' }, colors: ['#f4a7bd', '#7a4fa8', '#f7d660', '#ffffff'] },
    // sun hats
    { id: 'hat-sun-straw', shape: 'head-sunhat', cat: 'hat', name: { is: 'Stráhattur', en: 'Straw sun hat' }, colors: ['#ecd08e', '#e8607a'] },
    { id: 'hat-sun-flowers', shape: 'head-sunhat', cat: 'hat', name: { is: 'Blómahattur', en: 'Flower sun hat' }, colors: ['#f6e7c1', '#7fc6e8', '#f48ca0', '#ffffff', '#b59be6'], flowers: true },
    { id: 'hat-sun-dots', shape: 'head-sunhat', cat: 'hat', name: { is: 'Doppóttur sólhattur', en: 'Dotty sun hat' }, colors: ['#9fd3f2', '#f7d660', '#ffffff'], pattern: 'dots' },
    // caps
    { id: 'hat-cap-blue', shape: 'head-cap', cat: 'hat', name: { is: 'Blá derhúfa', en: 'Blue cap' }, colors: ['#4f86d6', '#f7d660', '#f7d660'], motif: 'star' },
    { id: 'hat-cap-pink', shape: 'head-cap', cat: 'hat', name: { is: 'Bleik derhúfa', en: 'Pink cap' }, colors: ['#f48ca0', '#ffffff', '#ffffff'], motif: 'heart' },
    // bucket hats
    { id: 'hat-bucket-flowers', shape: 'head-bucket', cat: 'hat', name: { is: 'Blómafötuhattur', en: 'Flower bucket hat' }, colors: ['#bfe6c4', '#f48ca0', '#5fae5a'], pattern: 'flowers', patternSize: 22 },
    { id: 'hat-bucket-yellow', shape: 'head-bucket', cat: 'hat', name: { is: 'Gulur fötuhattur', en: 'Yellow bucket hat' }, colors: ['#f7d660', '#ffffff', '#e2913c'], pattern: 'dots', patternSize: 18 },
    // sou'westers
    { id: 'hat-souwester-yellow', shape: 'head-souwester', cat: 'hat', name: { is: 'Gulur sjóhattur', en: "Yellow sou'wester" }, colors: ['#f6c636', '#e7a92a'] },
    { id: 'hat-souwester-red', shape: 'head-souwester', cat: 'hat', name: { is: 'Rauður sjóhattur', en: "Red sou'wester" }, colors: ['#e2464c', '#b8333a'] },
    // party hats
    { id: 'hat-party-stripes', shape: 'head-party', cat: 'hat', name: { is: 'Veisluhattur', en: 'Party hat' }, colors: ['#f48ca0', '#ffffff', '#7fc6e8', '#f7d660'] },
    { id: 'hat-party-stars', shape: 'head-party', cat: 'hat', name: { is: 'Stjörnuveisluhattur', en: 'Star party hat' }, colors: ['#7a5fc9', '#f7d660', '#f7d660', '#ffffff'], pattern: 'stars', patternSize: 18 },
    // animal knits
    { id: 'hat-puffin', shape: 'head-critter', cat: 'hat', name: { is: 'Lundahúfa', en: 'Puffin hat' }, colors: ['#34313f', '#f08a3c', '#f08a3c'], kind: 'puffin' },
    { id: 'hat-unicorn', shape: 'head-critter', cat: 'hat', name: { is: 'Einhyrningshúfa', en: 'Unicorn hat' }, colors: ['#f6f1fb', '#f7a6c2', '#f48ca0'], kind: 'unicorn' },
  ]);

  /* =====================================================================
     CROWNS (slot hat, cat crown). Crowns sit on top of the hair along the
     head arc (G.headArc), so they follow the head shape for every hairstyle.
     ===================================================================== */

  /* -------------------------------------------------------------
     Full crown: a curved band wrapping the head with upright points
     ending in little balls, gems on the band, optional velvet cap
     inside and optional white "ermine" fur trim along the bottom.
     colors: [metal, velvet (or ''), big gem, small gems]; it.ermine = true
     ------------------------------------------------------------- */
  DOLL.shape('head-crown', {
    slot: 'hat',
    thumb: [110, 0, 180, 128],
    draw(it) {
      const [metal, velvet, gem, gem2] = it.colors;
      const low = G.headArc(212, 328, 4, 24);                 // bottom edge of the band
      const up = low.map(([x, y]) => [x, y - 18]);              // top edge (band is 18 tall)
      const band = H.polyPath(low.concat(up.slice().reverse()));
      // upright points: [index along the band, height]
      const tips = [[2, 18], [7, 24], [12, 32], [17, 24], [22, 18]];
      let pts = [up[0]];
      tips.forEach(([i, h], k) => {
        const [x, y] = up[i], w = k === 2 ? 10 : 8;
        pts.push([x - w, y + 1 - Math.abs(k - 2) * 0], [x, y - h], [x + w, y + 1]);
      });
      pts.push(up[up.length - 1]);
      const spikes = H.polyPath(pts.concat(up.slice().reverse()));
      let out = '';
      if (velvet) {
        // velvet cap puffing up inside the crown
        const capD = `M${P(up[1])} C${n1(up[1][0])},40 160,28 200,28 C240,28 ${n1(up[23][0])},40 ${P(up[23])} L${up.slice(2, 23).reverse().map(P).join('L')} Z`;  // bottom follows the band so nothing peeks below it
        out += `<path d="${capD}" fill="${H.grad(velvet, 'r')}"/>` + outline(capD, velvet, 'r', 2) +
          `<path d="M170,44 Q184,34 200,33" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".35"/>` +
          // cross-shaped arch on top of the cap
          `<circle cx="200" cy="22" r="6" fill="${H.grad(metal, 'r')}" stroke="${ink(metal)}" stroke-width="1.6"/>`;
      }
      out += `<path d="${spikes}" fill="${H.grad(metal)}" stroke="${ink(metal)}" stroke-width="2" stroke-linejoin="round"/>` +
        tips.map(([i, h]) => { const [x, y] = up[i]; return `<circle cx="${n1(x)}" cy="${n1(y - h)}" r="${i === 12 ? 5 : 4}" fill="${H.grad(gem2, 'r')}" stroke="${ink(gem2)}" stroke-width="1.3"/>`; }).join('') +
        `<path d="${band}" fill="${H.grad(metal)}"/>` +
        // engraved line and shine on the band
        `<path d="M${low.map(([x, y]) => P([x, y - 4])).join('L')}" fill="none" stroke="${ink(metal)}" stroke-width="1.2" opacity=".4"/>` +
        `<path d="${band}" fill="url(#shine)" opacity=".45"/>` + outline(band, metal, 'v', 2);
      // gems on the band: big oval in the middle, small ones either side
      [4, 8, 16, 20].forEach(i => { const [x, y] = low[i]; out += H.diamond(x, y - 9, 6, gem2) + `<path d="M${n1(x)},${n1(y - 15)}l3.6,6l-3.6,6l-3.6,-6Z" fill="none" stroke="${ink(gem2)}" stroke-width="1.1"/>`; });
      const [mx0, my0] = low[12];
      out += `<ellipse cx="${n1(mx0)}" cy="${n1(my0 - 9)}" rx="8" ry="7" fill="${H.grad(gem, 'r')}" stroke="${ink(gem)}" stroke-width="1.5"/>` +
        `<path d="M${n1(mx0 - 4)},${n1(my0 - 12)} q2,-3 5,-3" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round"/>`;
      if (it.ermine) {
        // white fur roll with little black tail tips
        const fur = H.polyPath(G.headArc(210, 330, 10, 26).concat(G.headArc(330, 210, 0, 26)));
        out += `<path d="${fur}" fill="${H.grad('#fbf8f2')}" stroke="#bdb5aa" stroke-width="2" stroke-linejoin="round"/>` +
          G.headArc(218, 322, 5, 8).map(([x, y]) => `<path d="M${n1(x)},${n1(y - 2)} l-1.6,4 l1.6,1.4 l1.6,-1.4 Z" fill="#2e2a30"/>`).join('');
      }
      return out;
    },
  });

  /* -------------------------------------------------------------
     Motif crown: a slim band along the head with motifs standing on
     it (snowflakes, stars or strawberries), biggest in the middle.
     colors: [band, motif, motif 2]; it.motif = 'flake' | 'star' | 'berry' | 'heart'
     ------------------------------------------------------------- */
  DOLL.shape('head-crown-motif', {
    slot: 'hat',
    thumb: [110, 6, 180, 120],
    draw(it) {
      const [metal, mc, mc2 = mc] = it.colors;
      const band = H.polyPath(G.headArc(212, 328, 9, 24).concat(G.headArc(328, 212, 1, 24)));
      const spots = [[226, 8], [248, 11], [270, 16], [292, 11], [314, 8]];
      /** One motif centred on (x,y) with radius r; i alternates colours. */
      const motif = (x, y, r, i) => {
        const c = i % 2 ? mc2 : mc;
        if (it.motif === 'flake') return flakeO(x, y, r, c, r > 12 ? 3 : 2.4) + `<circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(r * .25)}" fill="${H.grad(mc2, 'r')}" stroke="${ink(mc2)}" stroke-width="1"/>`;
        if (it.motif === 'berry') return strawberry(x, y, r);
        if (it.motif === 'heart') return `<path d="${heartD(x, y, r * .9)}" fill="${H.grad(c, 'r')}" stroke="${ink(c)}" stroke-width="1.5"/>`;
        return starO(x, y, r, c, 1.6) + `<path d="M${n1(x - r * .3)},${n1(y - r * .2)} l${n1(r * .2)},${n1(-r * .3)}" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>`;
      };
      // little stems joining each motif to the band
      const stems = spots.map(([a, r]) => { const [x0, y0] = at(a, 8), [x1, y1] = at(a, 9 + r * .6); return `M${P([x0, y0])}L${P([x1, y1])}`; }).join('');
      return `<path d="${stems}" stroke="${ink(metal)}" stroke-width="5" stroke-linecap="round"/><path d="${stems}" stroke="${metal}" stroke-width="3" stroke-linecap="round"/>` +
        spots.map(([a, r], i) => { const [x, y] = at(a, 9 + r); return motif(x, y, r, i); }).join('') +
        `<path d="${band}" fill="${H.grad(metal)}"/><path d="${band}" fill="url(#shine)" opacity=".5"/>` + outline(band, metal, 'v', 2) +
        G.headArc(222, 318, 5, 8).map(([x, y], i) => i % 2 ? '' : `<circle cx="${n1(x)}" cy="${n1(y)}" r="2.2" fill="#fff" opacity=".85"/>`).join('');
    },
  });

  /* -------------------------------------------------------------
     Flower wreath: leaves and Icelandic wildflowers along the head.
     holtasóley (white, 8 petals), gleym-mér-ei (small blue), lambagras
     (pink), fífill (yellow, many petals), blóðberg (purple cluster).
     colors: [leaf green, ...flower order keys are in it.flowers]
     ------------------------------------------------------------- */
  const WILD = {
    /** Mountain avens: white with eight petals and a yellow centre. */
    holtasoley: (x, y, r) => bloom(x, y, r, '#fbfaf4', '#f2c43c', 8, -90),
    /** Forget-me-not: small sky blue flowers in a little bunch. */
    gleymmerei: (x, y, r) => bloom(x - r * .45, y + r * .2, r * .6, '#7fb8ec', '#f7e27a') + bloom(x + r * .45, y - r * .1, r * .6, '#6aa8e6', '#f7e27a') + bloom(x, y - r * .45, r * .55, '#93c6f2', '#f7e27a'),
    /** Moss campion: bright pink five-petal flower. */
    lambagras: (x, y, r) => bloom(x, y, r * .85, '#f37fb0', '#fbe0ea'),
    /** Dandelion: yellow with many thin petals. */
    fifill: (x, y, r) => {
      let s = '';
      for (let i = 0; i < 16; i++) { const [px, py] = pol(x, y, r, i * 22.5); s += `M${n1(x)},${n1(y)}L${n1(px)},${n1(py)}`; }
      return `<path d="${s}" stroke="${ink('#f6c93a')}" stroke-width="4.6" stroke-linecap="round"/><path d="${s}" stroke="#f8d24a" stroke-width="3" stroke-linecap="round"/><circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(r * .4)}" fill="#f3b52a"/>`;
    },
    /** Wild thyme: purple cluster of tiny dots. */
    blodberg: (x, y, r) => [[0, 0], [-.45, .25], [.45, .25], [-.25, -.4], [.25, -.4], [0, .55]].map(([a, b]) => `<circle cx="${n1(x + a * r)}" cy="${n1(y + b * r)}" r="${n1(r * .33)}" fill="${H.grad('#b46ad0', 'r')}" stroke="${ink('#b46ad0')}" stroke-width=".9"/>`).join(''),
  };
  DOLL.shape('head-wreath', {
    slot: 'hat',
    thumb: [104, 30, 192, 126],
    // flower wreath: a leafy vine along the top of the head with flowers on it
    draw(it) {
      const leafC = it.colors[0];
      const arc = G.headArc(200, 340, 4, 28);
      // vine under the flowers
      let s = `<path d="M${arc.map(P).join('L')}" fill="none" stroke="${ink(leafC)}" stroke-width="5" stroke-linecap="round"/><path d="M${arc.map(P).join('L')}" fill="none" stroke="${shade(leafC, -.1)}" stroke-width="3" stroke-linecap="round"/>`;
      // leaves pointing outward and inward along the vine
      for (let i = 1; i < arc.length; i += 2) {
        const a = 200 + 140 * i / 28, [x, y] = arc[i];
        s += leaf(x, y, 13, a + (i % 4 === 1 ? -50 : 50), i % 4 === 1 ? leafC : shade(leafC, .15));
      }
      // flowers along the vine in the item's order (biggest near the top)
      const kinds = it.flowers, nF = 9;
      for (let k = 0; k < nF; k++) {
        const a = 206 + 128 * k / (nF - 1), r = 10 - Math.abs(k - 4) * .5;
        const [x, y] = at(a, 6);
        s += WILD[kinds[k % kinds.length]](x, y, r);
      }
      return s;
    },
  });

  /* =====================================================================
     HAIRBANDS AND CLIPS (slot hairband). The band follows the head arc
     on top of the hair and ends just above the ears.
     ===================================================================== */

  /** Bow with two loops, a knot and two tails; centred at (cx,cy), s = scale, rot in degrees. */
  const bow = (cx, cy, s, col, rot = 0, fill) => {
    const f = fill || H.grad(col), sw = n1(2 / s), k = ink(col);
    const loopL = 'M-2,0 C-10,-16 -28,-18 -28,-3 C-28,11 -12,12 -2,0 Z';
    const tailL = 'M-3,3 Q-9,16 -15,27 L-8,26 L-5,32 Q-1,18 2,4 Z';
    const fold = 'M-6,-2 Q-15,-8 -22,-5 M-6,2 Q-14,6 -21,4';
    // one half of the bow (m = 1 left side, m = -1 mirrored right side): a loop, a tail and a fold line
    const half = (m) => `<g transform="scale(${m},1)"><path d="${tailL}" fill="${f}" stroke="${k}" stroke-width="${sw}" stroke-linejoin="round"/>` +
      `<path d="${loopL}" fill="${f}" stroke="${k}" stroke-width="${sw}" stroke-linejoin="round"/><path d="${loopL}" fill="url(#soft-r)"/>` +
      `<path d="${fold}" stroke="${k}" stroke-width="${n1(1.3 / s)}" fill="none" opacity=".5" stroke-linecap="round"/></g>`;
    return `<g transform="translate(${n1(cx)},${n1(cy)}) rotate(${rot}) scale(${s})">` + half(1) + half(-1) +
      `<ellipse cx="0" cy="0" rx="6" ry="7" fill="${H.grad(shade(col, -.06), 'r')}" stroke="${k}" stroke-width="${sw}"/>` +
      `<path d="M-14,-9 q4,-4 9,-3" stroke="#fff" stroke-width="${n1(2 / s)}" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
  };
  /** Butterfly centred at (cx,cy), s = scale; colors: wings, wing spots. */
  const butterfly = (cx, cy, s, col, spot, rot = 0) => {
    const k = ink(col), sw = n1(1.6 / s);
    const up = 'M0,-1 C-5,-15 -21,-18 -20,-6 C-19,1 -9,2 0,-1 Z', lo = 'M0,1 C-5,3 -16,6 -13,14 C-10,19 -3,10 0,1 Z';
    // one side of the butterfly (m = 1 left, m = -1 mirrored right): upper wing, lower wing and two spots
    const half = m => `<g transform="scale(${m},1)"><path d="${up}" fill="${H.grad(col, 'r')}" stroke="${k}" stroke-width="${sw}"/><path d="${lo}" fill="${H.grad(shade(col, .15), 'r')}" stroke="${k}" stroke-width="${sw}"/>` +
      `<circle cx="-12" cy="-7" r="3.2" fill="${spot}"/><circle cx="-8" cy="8" r="2.2" fill="${spot}"/></g>`;
    return `<g transform="translate(${n1(cx)},${n1(cy)}) rotate(${rot}) scale(${s})">` + half(1) + half(-1) +
      `<path d="M-1,-8 q-3,-7 -7,-9 M1,-8 q3,-7 7,-9" stroke="${k}" stroke-width="${sw}" fill="none" stroke-linecap="round"/>` +
      `<ellipse cx="0" cy="1" rx="2.4" ry="9" fill="${k}"/></g>`;
  };

  /* -------------------------------------------------------------
     Hairband: a band along the head arc, plus an optional topper:
     'bow' (big bow on the side), 'flowers', 'cat' ears, 'bunny' ears,
     'unicorn' horn with ears, 'knot' (knotted top) or 'gems'.
     colors: [band, band motif / second colour, topper, topper detail]
     ------------------------------------------------------------- */
  DOLL.shape('head-band', {
    slot: 'hairband',
    draw(it) {
      const [c, c2 = '#ffffff', tc = c, td = '#ffffff'] = it.colors;
      const arc = G.headArc(197, 343, 3, 30), mid = 'M' + arc.map(P).join('L');
      const w = it.wide ? 13 : 9;
      const fill = it.pattern ? H.pat(it.pattern, c, c2, it.patternSize || 12) : H.grad(c);
      let out = '';
      const top = it.top;
      // things standing behind the band (ears, horn) are drawn first
      if (top === 'cat') {
        // cat ear pointing out at angle a, with a lighter inner ear
        const ear = a => { const b1 = at(a - 11, 4), b2 = at(a + 11, 4), tip = at(a, 34), i1 = at(a - 6, 8), i2 = at(a + 6, 8), it2 = at(a, 26);
          return `<path d="M${P(b1)}Q${P(at(a - 6, 24))} ${P(tip)}Q${P(at(a + 6, 24))} ${P(b2)}Z" fill="${H.grad(tc)}" stroke="${ink(tc)}" stroke-width="2.2" stroke-linejoin="round"/>` +
            `<path d="M${P(i1)}Q${P(at(a - 3, 20))} ${P(it2)}Q${P(at(a + 3, 20))} ${P(i2)}Z" fill="${td}" opacity=".9"/>`; };
        out += ear(232) + ear(308);
      } else if (top === 'bunny') {
        /** Long upright bunny ear at head angle a, leaning by lean degrees. */
        const ear = (a, lean) => { const [bx, by] = at(a, 4);
          return `<g transform="translate(${n1(bx)},${n1(by)}) rotate(${lean})"><path d="M-9,4 C-14,-30 -10,-62 0,-66 C10,-62 14,-30 9,4 Z" fill="${H.grad(tc)}" stroke="${ink(tc)}" stroke-width="2.2"/>` +
            `<path d="M-4,0 C-7,-26 -5,-50 0,-56 C5,-50 7,-26 4,0 Z" fill="${td}" opacity=".85"/><path d="M-9,4 C-14,-30 -10,-62 0,-66 C10,-62 14,-30 9,4 Z" fill="url(#soft-h)"/></g>`; };
        out += ear(250, -14) + ear(290, 14);
      } else if (top === 'unicorn') {
        const [hx, hy] = at(270, 4);
        const horn = `M${n1(hx - 10)},${n1(hy + 2)} L${n1(hx - 1.5)},${n1(hy - 44)} Q${n1(hx)},${n1(hy - 47)} ${n1(hx + 1.5)},${n1(hy - 44)} L${n1(hx + 10)},${n1(hy + 2)} Z`;
        const hclip = H.clip('c-' + it.id + '-horn', horn);
        const spiral = [-6, -16, -26, -36].map(dy => `M${n1(hx - 12)},${n1(hy + dy + 4)} L${n1(hx + 12)},${n1(hy + dy - 4)}`).join('');
        // unicorn ear at angle a
        const ear = a => { const b1 = at(a - 7, 4), b2 = at(a + 7, 4), tip = at(a - (a < 270 ? 4 : -4), 24);
          return `<path d="M${P(b1)}Q${P(at(a - 4, 18))} ${P(tip)}Q${P(at(a + 4, 18))} ${P(b2)}Z" fill="${H.grad(c)}" stroke="${ink(c)}" stroke-width="2" stroke-linejoin="round"/>`; };
        out += ear(240) + ear(300) +
          `<path d="${horn}" fill="${H.grad(tc)}"/><g clip-path="${hclip}"><path d="${spiral}" stroke="${td}" stroke-width="3" fill="none"/></g>` + outline(horn, tc, 'h', 2);
      }
      // the band itself: ink edge, fill, a highlight line
      out += `<path d="${mid}" fill="none" stroke="${ink(c)}" stroke-width="${w + 2.6}" stroke-linecap="round" stroke-linejoin="round"/>` +
        `<path d="${mid}" fill="none" stroke="${fill}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>` +
        `<path d="M${G.headArc(214, 326, 3 + w * .28, 20).map(P).join('L')}" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".5"/>`;
      if (top === 'bow') {
        const [x, y] = at(236, 6);
        out += bow(x, y, it.bowSize || 1.05, tc, -32, it.bowPattern ? H.pat(it.bowPattern, tc, td, 10) : null);
      } else if (top === 'flowers') {
        out += leaf(...at(236, 4), 14, 160) + leaf(...at(254, 6), 14, 300) +
          [[226, 9], [242, 12], [258, 9]].map(([a, r], i) => { const [x, y] = at(a, 5); return bloom(x, y, r, [tc, td, tc][i]); }).join('');
      } else if (top === 'unicorn') {
        out += bloom(...at(252, 6), 9, '#f7a6c2') + bloom(...at(288, 6), 9, '#b9a8f2') + leaf(...at(260, 5), 10, 320) + leaf(...at(280, 5), 10, 220);
      } else if (top === 'knot') {
        // knotted top: a puffy twist in the middle of a wide band
        const [x, y] = at(270, 3);
        out += `<path d="M${x - 14},${y - 6} C${x - 10},${y - 18} ${x + 10},${y - 18} ${x + 14},${y - 6} C${x + 10},${y + 8} ${x - 10},${y + 8} ${x - 14},${y - 6} Z" fill="${fill}" stroke="${ink(c)}" stroke-width="2.2"/>` +
          `<path d="M${x - 14},${y - 6} C${x - 10},${y - 18} ${x + 10},${y - 18} ${x + 14},${y - 6} C${x + 10},${y + 8} ${x - 10},${y + 8} ${x - 14},${y - 6} Z" fill="url(#soft-r)"/>` +
          H.line(`M${x - 8},${y - 10} Q${x},${y - 2} ${x + 8},${y + 2} M${x - 9},${y + 1} Q${x},${y - 4} ${x + 7},${y - 11}`, c, 1.6, .5);
      } else if (top === 'gems') {
        out += G.headArc(222, 318, 3, 8).map(([x, y], i) => i % 2 ? `<circle cx="${n1(x)}" cy="${n1(y)}" r="3" fill="${H.grad(td, 'r')}" stroke="${ink(td)}" stroke-width="1"/>` : H.diamond(x, y, 5.5, tc)).join('');
      }
      return out;
    },
  });

  /* -------------------------------------------------------------
     Hair clips: a pair of clips on each side of the head (left side
     computed, right side mirrored). it.kind = 'flower' | 'butterfly' | 'star' | 'heart'.
     colors: [main, second, clip bar]
     ------------------------------------------------------------- */
  DOLL.shape('head-clips', {
    slot: 'hairband',
    thumb: [116, 70, 72, 72],
    draw(it) {
      const [c, c2, bar = '#e9eef3'] = it.colors;
      /** One clip at head angle a, size r. */
      const clip = (a, r, i) => {
        const [x, y] = at(a, -6), rot = a - 270;
        const col = i % 2 ? c2 : c;
        const barD = `<g transform="rotate(${n1(rot + 90)} ${n1(x)} ${n1(y)})"><rect x="${n1(x - 2.5)}" y="${n1(y - r * 1.4)}" width="5" height="${n1(r * 2.8)}" rx="2.5" fill="${H.grad(bar)}" stroke="${ink(bar)}" stroke-width="1.2"/></g>`;
        let m;
        if (it.kind === 'butterfly') m = butterfly(x, y, r / 13, col, i % 2 ? c : c2, rot + 20);
        else if (it.kind === 'star') m = starO(x, y, r, col, 1.6) + `<path d="M${n1(x - r * .3)},${n1(y - r * .25)} l${n1(r * .2)},${n1(-r * .28)}" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>`;
        else if (it.kind === 'heart') m = `<path d="${heartD(x, y, r * .9)}" fill="${H.grad(col, 'r')}" stroke="${ink(col)}" stroke-width="1.5"/>` + `<path d="M${n1(x - r * .55)},${n1(y - r * .2)} q2,-4 5,-4" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
        else m = bloom(x, y, r, col, i % 2 ? '#ffd84d' : c2);
        return barD + m;
      };
      const side = clip(214, it.kind === 'butterfly' ? 12 : 10, 0) + clip(233, it.kind === 'butterfly' ? 13 : 11, 1);
      return side + mirror(side);
    },
  });

  /* -------------------------------------------------------------
     Big bow on its own, clipped to the upper right of the head
     (above the ponytail tie when the ponytail is worn).
     colors: [bow, pattern colour]; it.pattern optional
     ------------------------------------------------------------- */
  DOLL.shape('head-bigbow', {
    slot: 'hairband',
    thumb: [196, 30, 120, 92],
    draw(it) {
      const [c, c2 = '#ffffff'] = it.colors;
      const [x, y] = at(302, 8);
      return bow(x, y, 1.45, c, 28, it.pattern ? H.pat(it.pattern, c, c2, 12) : null);
    },
  });

  /* =====================================================================
     GLASSES (slot glasses). Lenses are centred on G.eyes and see-through
     (tint with low opacity) so the eyes still show. The left half is drawn
     and mirrored; the bridge and lens shines are drawn once.
     ===================================================================== */

  /** Lens outline for the LEFT eye at (cx,cy), by kind. */
  const lensPath = (kind, cx, cy) => {
    if (kind === 'cateye') return H.smooth([[cx + 19, cy - 9], [cx + 8, cy - 17], [cx - 10, cy - 18], [cx - 25, cy - 23], [cx - 22, cy - 6], [cx - 14, cy + 14], [cx + 2, cy + 20], [cx + 16, cy + 13]]);
    if (kind === 'aviator') return H.smooth([[cx + 19, cy - 13], [cx, cy - 17], [cx - 19, cy - 15], [cx - 23, cy - 2], [cx - 16, cy + 15], [cx - 1, cy + 22], [cx + 14, cy + 15], [cx + 20, cy + 1]]);
    if (kind === 'star') {
      const pts = [];
      for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 16 : 28; pts.push([cx + Math.cos(a) * r, cy + 3 + Math.sin(a) * r]); }
      return H.polyPath(pts);
    }
    if (kind === 'flower') {
      const pts = [];
      for (let i = 0; i < 48; i++) { const a = i / 48 * Math.PI * 2, r = 21.5 + 3.5 * Math.cos(6 * a + Math.PI); pts.push([cx + Math.cos(a) * r, cy + 1 + Math.sin(a) * r]); }
      return H.smooth(pts);
    }
    if (kind === 'square') return `M${cx - 13},${cy - 15} H${cx + 13} Q${cx + 22},${cy - 15} ${cx + 22},${cy - 6} V${cy + 8} Q${cx + 22},${cy + 17} ${cx + 13},${cy + 17} H${cx - 13} Q${cx - 22},${cy + 17} ${cx - 22},${cy + 8} V${cy - 6} Q${cx - 22},${cy - 15} ${cx - 13},${cy - 15} Z`;
    // round
    return `M${cx - 21},${cy + 1}a21,21 0 1 0 42,0a21,21 0 1 0 -42,0Z`;
  };

  DOLL.shape('head-specs', {
    slot: 'glasses',
    // glasses: a frame in the chosen shape over both eyes, with tinted lenses
    draw(it) {
      const [frame, lens = '#ffffff', deco] = it.colors;
      const kind = it.kind || 'round', [lx, ly] = G.eyes[0];
      const d = lensPath(kind, lx, ly);
      const op = it.tint ?? .3;
      const fw = it.thin ? 2.6 : 4.2;
      // temple arm from the lens's outer edge back to the ear
      const temple = `M${lx - 20},${ly - 6} L128,${ly - 8}`;
      let frameMarkup;
      if (kind === 'rainbow') {
        const cols = ['#ef6f6c', '#f6a65a', '#f7d660', '#7fcf8a', '#6fb3e6', '#a58be0'];
        frameMarkup = `<path d="M${lx - 25},${ly + 1}a25,25 0 1 0 50,0a25,25 0 1 0 -50,0Z M${lx - 17},${ly + 1}a17,17 0 1 0 34,0a17,17 0 1 0 -34,0Z" fill="none" stroke="${ink('#a58be0')}" stroke-width="1.6"/>` +
          cols.map((col, i) => `<circle cx="${lx}" cy="${ly + 1}" r="${n1(24 - i * 1.33)}" fill="none" stroke="${col}" stroke-width="1.6"/>`).join('');
      } else {
        frameMarkup = `<path d="${d}" fill="none" stroke="${ink(frame)}" stroke-width="${fw + 2.8}" stroke-linejoin="round"/>` +
          `<path d="${d}" fill="none" stroke="${frame}" stroke-width="${fw}" stroke-linejoin="round"/>`;
      }
      const armCol = kind === 'rainbow' ? '#a58be0' : frame;
      const half = `<path d="${temple}" stroke="${ink(armCol)}" stroke-width="${fw + 2.4}" stroke-linecap="round"/><path d="${temple}" stroke="${armCol}" stroke-width="${fw}" stroke-linecap="round"/>` +
        `<path d="${d}" fill="${lens}" opacity="${op}"/>` + frameMarkup +
        // little decorations on the outer top corner (cat-eye gems, dots)
        (deco ? [[-17, -16], [-10, -18], [-23, -19]].map(([a, b], i) => i < (kind === 'cateye' ? 3 : 0) ? `<circle cx="${lx + a}" cy="${ly + b + 1}" r="1.8" fill="${deco}" stroke="${ink(deco)}" stroke-width=".7"/>` : '').join('') : '');
      const bridgeD = kind === 'aviator' ? 'M191,152 Q200,148 209,152 M191,159 Q200,155 209,159' : (kind === 'star' ? 'M188,159 Q200,151 212,159' : 'M191,158 Q200,151 209,158');
      const bridge = `<path d="${bridgeD}" fill="none" stroke="${ink(armCol)}" stroke-width="${fw + 2.4}" stroke-linecap="round"/><path d="${bridgeD}" fill="none" stroke="${armCol}" stroke-width="${fw}" stroke-linecap="round"/>`;
      // white shine strokes on both lenses (same direction on both = one light source)
      const shine = G.eyes.map(([x, y]) => `<path d="M${x - 11},${y - 6} q3,-6 9,-7" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".75"/>`).join('');
      return half + mirror(half) + bridge + shine;
    },
  });

  /* -------------------------------------------------------------
     Goggles: 'ski' (one wide mirrored lens, padded frame, wide strap)
     or 'swim' (two small cups with a thin strap). Lenses stay see-through.
     colors: [frame, lens tint 1, lens tint 2, strap]
     ------------------------------------------------------------- */
  DOLL.shape('head-goggles', {
    slot: 'glasses',
    thumb: [100, 122, 200, 84],
    draw(it) {
      const [frame, t1, t2 = t1, strap = frame] = it.colors;
      const gid = 'gg-' + it.id;
      const lensFill = addGrad(gid, [[0, t1], [1, t2]]);
      if (it.kind === 'swim') {
        // oval goggle cup around the eye at [x, y]
        const cup = ([x, y]) => `M${x - 19},${y + 1}a19,16 0 1 0 38,0a19,16 0 1 0 -38,0Z`;
        const strapL = 'M154,160 L112,158';
        const sl = `<path d="${strapL}" stroke="${ink(strap)}" stroke-width="7.6" stroke-linecap="round"/><path d="${strapL}" stroke="${strap}" stroke-width="5" stroke-linecap="round"/>`;
        return sl + mirror(sl) +
          G.eyes.map(e => `<path d="${cup(e)}" fill="${lensFill}" opacity=".42"/>` +
            `<path d="${cup(e)}" fill="none" stroke="${ink(frame)}" stroke-width="7.6"/><path d="${cup(e)}" fill="none" stroke="${frame}" stroke-width="5"/>` +
            `<path d="M${e[0] - 12},${e[1] - 4} q3,-6 9,-7" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".8"/>`).join('') +
          `<path d="M190,160 Q200,154 210,160" fill="none" stroke="${ink(frame)}" stroke-width="5"/><path d="M190,160 Q200,154 210,160" fill="none" stroke="${frame}" stroke-width="3"/>`;
      }
      // ski goggles
      const lens = 'M142,140 Q200,130 258,140 Q270,144 270,162 Q270,186 252,190 Q228,192 214,184 Q206,177 200,177 Q194,177 186,184 Q172,192 148,190 Q130,186 130,162 Q130,144 142,140 Z';
      const strapL = 'M134,150 L108,148 L108,172 L134,174 Z';
      const sl = `<path d="${strapL}" fill="${it.pattern ? H.pat(it.pattern, strap, '#ffffff', 10) : H.grad(strap)}"/>` + outline(strapL, strap, 'v', 2);
      return sl + mirror(sl) +
        `<path d="${lens}" fill="${lensFill}" opacity=".5"/>` +
        // mirror reflections across the lens
        `<path d="M150,180 L176,140 L188,140 L162,182 Z M196,140 L204,140 L180,182 L174,182 Z" fill="#fff" opacity=".28"/>` +
        `<path d="${lens}" fill="none" stroke="${ink(frame)}" stroke-width="10.6" stroke-linejoin="round"/>` +
        `<path d="${lens}" fill="none" stroke="${frame}" stroke-width="8" stroke-linejoin="round"/>` +
        `<path d="M146,141 Q200,132 254,141" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" opacity=".55"/>`;
    },
  });

  /* =====================================================================
     EARRINGS (slot earrings). Hang from G.earlobes; the left one is drawn
     and mirrored for the right ear (x → 400 - x).
     ===================================================================== */
  DOLL.shape('head-earring', {
    slot: 'earrings',
    thumb: [107, 164, 40, 52],
    draw(it) {
      const [c, c2 = '#ffffff'] = it.colors;
      const [x, y] = G.earlobes[0];
      const kind = it.kind;
      // short gold/silver hook through the lobe, for dangling kinds
      const metal = it.metal || '#f2c34d';
      // little metal hook through the earlobe, len long, with a small ring at the top
      const hook = (len) => `<path d="M${x},${y - 1} V${y + len}" stroke="${ink(metal)}" stroke-width="2.8" stroke-linecap="round"/><path d="M${x},${y - 1} V${y + len}" stroke="${metal}" stroke-width="1.4" stroke-linecap="round"/>` +
        `<circle cx="${x}" cy="${y}" r="2.4" fill="${H.grad(metal, 'r')}" stroke="${ink(metal)}" stroke-width="1"/>`;
      // tiny white sparkle dot at gx, gy
      const glint = (gx, gy) => `<circle cx="${n1(gx)}" cy="${n1(gy)}" r="1.3" fill="#fff" opacity=".9"/>`;
      let m = '';
      if (kind === 'stud') {
        // round stone in a little metal cup
        m = `<circle cx="${x}" cy="${y}" r="6.6" fill="${H.grad(metal, 'r')}" stroke="${ink(metal)}" stroke-width="1.2"/>` +
          `<circle cx="${x}" cy="${y}" r="4.6" fill="${H.grad(c, 'r')}" stroke="${ink(c)}" stroke-width="1"/>` + glint(x - 1.6, y - 1.6);
      } else if (kind === 'gem') {
        // faceted crystal stud (square-cut, turned 45 degrees) in a silver setting
        m = `<path d="M${x},${y - 7.5} L${x + 7.5},${y} L${x},${y + 7.5} L${x - 7.5},${y} Z" fill="${H.grad(metal, 'r')}" stroke="${ink(metal)}" stroke-width="1.2" stroke-linejoin="round"/>` +
          `<path d="M${x},${y - 5.5} L${x + 5.5},${y} L${x},${y + 5.5} L${x - 5.5},${y} Z" fill="${H.grad(c, 'r')}" stroke="${ink(c)}" stroke-width=".9" stroke-linejoin="round"/>` +
          `<path d="M${x - 5.5},${y} H${x + 5.5} M${x},${y - 5.5} V${y + 5.5}" stroke="#fff" stroke-width=".8" opacity=".6"/>` + glint(x - 2, y - 2);
      } else if (kind === 'pearl') {
        m = `<circle cx="${x}" cy="${y}" r="3.6" fill="${H.grad(metal, 'r')}" stroke="${ink(metal)}" stroke-width="1"/>` + hook(9) +
          `<circle cx="${x}" cy="${y + 15}" r="6.2" fill="${H.grad(c, 'r')}" stroke="${ink(c)}" stroke-width="1.3"/>` + glint(x - 2, y + 13);
      } else if (kind === 'heart') {
        m = hook(6) + `<path d="${heartD(x, y + 14, 8)}" fill="${H.grad(c, 'r')}" stroke="${ink(c)}" stroke-width="1.4"/>` + glint(x - 4, y + 11);
      } else if (kind === 'star') {
        m = hook(5) + starO(x, y + 14, 9, c, 1.4) + glint(x - 2, y + 12);
      } else if (kind === 'berry') {
        m = hook(5) + strawberry(x, y + 15, 8.5);
      } else if (kind === 'hoop') {
        m = `<circle cx="${x}" cy="${y + 10}" r="10" fill="none" stroke="${ink(c)}" stroke-width="4.6"/><circle cx="${x}" cy="${y + 10}" r="10" fill="none" stroke="${c}" stroke-width="2.8"/>` +
          `<path d="M${x - 8},${y + 5} a10,10 0 0 1 4,-4" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".8"/>` +
          (it.charm ? `<path d="${heartD(x, y + 21, 4.4)}" fill="${H.grad(c2, 'r')}" stroke="${ink(c2)}" stroke-width="1"/>` : '');
      } else if (kind === 'flake') {
        m = hook(5) + flakeO(x, y + 15, 9, c, 2.2) + `<circle cx="${x}" cy="${y + 15}" r="2.2" fill="${c2}"/>`;
      } else if (kind === 'cherry') {
        // two cherries on stems from one leafy top, hanging toward the face side and away
        m = `<circle cx="${x}" cy="${y}" r="2.4" fill="#4fae5b" stroke="${ink('#4fae5b')}" stroke-width="1"/>` +
          `<path d="M${x},${y + 1} Q${x - 5},${y + 8} ${x - 6},${y + 15} M${x},${y + 1} Q${x + 4},${y + 9} ${x + 5},${y + 17}" stroke="#6b8a3a" stroke-width="1.6" fill="none" stroke-linecap="round"/>` +
          leaf(x, y, 8, -20, '#5fae5a') +
          `<circle cx="${x - 6}" cy="${y + 19}" r="5.4" fill="${H.grad(c, 'r')}" stroke="${ink(c)}" stroke-width="1.3"/><circle cx="${x + 5}" cy="${y + 21}" r="5.4" fill="${H.grad(c, 'r')}" stroke="${ink(c)}" stroke-width="1.3"/>` +
          glint(x - 8, y + 17) + glint(x + 3, y + 19);
      } else if (kind === 'drop') {
        // teardrop gem in a metal cup
        const dd = `M${x},${y + 6} Q${x + 8},${y + 16} ${x + 6},${y + 21} Q${x},${y + 28} ${x - 6},${y + 21} Q${x - 8},${y + 16} ${x},${y + 6} Z`;
        m = hook(6) + `<path d="${dd}" fill="${H.grad(c, 'r')}" stroke="${ink(c)}" stroke-width="1.4"/>` +
          `<path d="M${x - 2},${y + 12} l-2,6" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".85"/>`;
      }
      return m + mirror(m);
    },
  });

  /* =====================================================================
     NECKLACES (slot necklace). The chain follows a U-shaped cubic curve
     around the base of the neck: (181,246) → bottom (200,281) → (219,246).
     The ends tuck in at the sides of the neck, so it reads as going round.
     ===================================================================== */
  const NA = [181, 246], NC1 = [181, 292], NC2 = [219, 292], NB = [219, 246];
  /** Point on the necklace curve, t 0..1 (cubic Bezier). */
  const neckPt = t => { const u = 1 - t, a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
    return [a * NA[0] + b * NC1[0] + c * NC2[0] + d * NB[0], a * NA[1] + b * NC1[1] + c * NC2[1] + d * NB[1]]; };
  /** n evenly-ish spaced points along the curve (re-sampled by length). */
  const neckPts = n => {
    const fine = Array.from({ length: 201 }, (_, i) => neckPt(i / 200)), len = [0];
    for (let i = 1; i < fine.length; i++) len.push(len[i - 1] + Math.hypot(fine[i][0] - fine[i - 1][0], fine[i][1] - fine[i - 1][1]));
    const total = len[len.length - 1], out = [];
    for (let k = 0; k < n; k++) { const L = total * k / (n - 1); let i = len.findIndex(v => v >= L); out.push(fine[Math.max(0, i)]); }
    return out;
  };
  const NECK_D = `M${NA.join(',')} C${NC1.join(',')} ${NC2.join(',')} ${NB.join(',')}`;

  DOLL.shape('head-necklace', {
    slot: 'necklace',
    // necklace: a chain along the curve of the neck with the chosen pendant or beads (it.kind)
    draw(it) {
      const [c, c2 = '#ffffff', c3 = c2] = it.colors;
      const kind = it.kind;
      const metal = it.metal || '#f2c34d';
      /** Thin chain (or cord) along the curve. */
      const chain = (col = metal, w = 2) => `<path d="${NECK_D}" fill="none" stroke="${ink(col)}" stroke-width="${w + 1.6}" stroke-linecap="round"/><path d="${NECK_D}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round"${w <= 2 ? ' stroke-dasharray="2.4 1.2"' : ''}/>`;
      /** Small loop (bail) at the bottom of the curve that a pendant hangs from. */
      const bail = `<circle cx="200" cy="283" r="3" fill="none" stroke="${ink(metal)}" stroke-width="3"/><circle cx="200" cy="283" r="3" fill="none" stroke="${metal}" stroke-width="1.6"/>`;
      const px = 200, py = 297;   // pendant centre
      if (kind === 'beads') {
        // round beads all the way round: one colour (pearls) or cycling colours
        const cols = it.beads || [c];
        const pts = neckPts(it.count || 15);
        return chain('#c9c2b8', 1.2) + pts.map(([x, y], i) => { const col = cols[i % cols.length], r = it.beadR || 4.4;
          if (it.hearts && i % 4 === 2) return `<path d="${heartD(x, y, r * 1.15)}" fill="${H.grad(col, 'r')}" stroke="${ink(col)}" stroke-width="1"/>`;
          return `<circle cx="${n1(x)}" cy="${n1(y)}" r="${r}" fill="${H.grad(col, 'r')}" stroke="${ink(col)}" stroke-width="1.1"/><circle cx="${n1(x - r * .35)}" cy="${n1(y - r * .35)}" r="${n1(r * .3)}" fill="#fff" opacity=".85"/>`; }).join('');
      }
      if (kind === 'daisies') {
        const pts = neckPts(9);
        return chain('#6aa65a', 2.6) + pts.map(([x, y], i) => i % 2 ? leaf(x, y, 8, 90 + (x < 200 ? 30 : -30), '#6aa65a') : bloom(x, y, 7, i % 4 ? c : c2, '#f7d04a')).join('');
      }
      let pend = '';
      if (kind === 'locket') {
        pend = `<path d="${heartD(px, py + 1, 12)}" fill="${H.grad(c, 'r')}" stroke="${ink(c)}" stroke-width="1.6"/>` +
          `<path d="${heartD(px, py + 1, 8.5)}" fill="none" stroke="${shade(c, .35)}" stroke-width="1.2" opacity=".8"/>` +
          `<circle cx="${px}" cy="${py + 1}" r="2.4" fill="${H.grad(c2, 'r')}" stroke="${ink(c2)}" stroke-width=".8"/>` +
          `<path d="M${px - 7},${py - 4} q2,-4 6,-4" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".8"/>`;
      } else if (kind === 'star') {
        pend = starO(px, py + 2, 12, c, 1.6) + `<path d="M${px - 4},${py - 2} l2,-4" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>`;
      } else if (kind === 'flake') {
        pend = flakeO(px, py + 2, 12, c, 2.6) + `<circle cx="${px}" cy="${py + 2}" r="3" fill="${H.grad(c2, 'r')}" stroke="${ink(c2)}" stroke-width="1"/>`;
      } else if (kind === 'crystal') {
        // faceted gem hanging point down
        const g = `M${px},${py - 10} L${px + 8},${py - 2} L${px},${py + 16} L${px - 8},${py - 2} Z`;
        pend = `<path d="${g}" fill="${H.grad(c, 'r')}" stroke="${ink(c)}" stroke-width="1.5" stroke-linejoin="round"/>` +
          `<path d="M${px - 8},${py - 2} H${px + 8} M${px},${py - 10} L${px - 3},${py - 2} L${px},${py + 16} L${px + 3},${py - 2} Z" fill="none" stroke="#fff" stroke-width="1" opacity=".6"/>` +
          `<path d="M${px - 3},${py - 6} l-2,3" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>`;
      } else if (kind === 'berry') {
        pend = strawberry(px, py + 3, 11);
      } else if (kind === 'puffin') {
        // round medallion with a puffin head in profile (black cap, white cheek, big orange beak)
        pend = `<circle cx="${px}" cy="${py + 2}" r="12.5" fill="${H.grad(c, 'r')}" stroke="${ink(c)}" stroke-width="1.6"/>` +
          `<circle cx="${px}" cy="${py + 2}" r="10" fill="#cfe9f5"/>` +
          `<path d="M${px - 8},${py + 9} C${px - 11},${py - 2} ${px - 6},${py - 7} ${px},${py - 6} C${px + 5},${py - 6} ${px + 6},${py - 2} ${px + 5},${py + 3} L${px + 2},${py + 10} Z" fill="#2e2a34"/>` +
          `<ellipse cx="${px - 1}" cy="${py + 1}" rx="4.2" ry="3.6" fill="#fff"/>` +
          `<circle cx="${px}" cy="${py}" r="1.2" fill="#2e2a34"/>` +
          `<path d="M${px + 3},${py - 3} Q${px + 12},${py + 1} ${px + 4},${py + 6} Z" fill="#ef6a33" stroke="#a8401c" stroke-width=".9" stroke-linejoin="round"/>` +
          `<path d="M${px + 4},${py - 2} L${px + 4.5},${py + 5}" stroke="#f6c43c" stroke-width="1.4"/>` +
          `<circle cx="${px}" cy="${py + 2}" r="12.5" fill="url(#soft-r)"/>`;
      }
      return chain(it.cord || metal, it.cord ? 2.6 : 2) + bail + pend;
    },
  });


  DOLL.add([
    // crowns
    { id: 'crown-tiara-silver', shape: 'tiara', cat: 'crown', name: { is: 'Silfurkóróna', en: 'Silver tiara' }, colors: ['#dfe5ee', '#5fb7ea', '#b9a8f2'] },
    { id: 'crown-tiara-rose', shape: 'tiara', cat: 'crown', name: { is: 'Rósagull-kóróna', en: 'Rose gold tiara' }, colors: ['#f2b8a6', '#e8476f', '#ffffff'] },
    { id: 'crown-tiara-emerald', shape: 'tiara', cat: 'crown', name: { is: 'Grænsteinakóróna', en: 'Emerald tiara' }, colors: ['#f2c34d', '#3fbf7f', '#7fd1f0'] },
    { id: 'crown-royal-gold', shape: 'head-crown', cat: 'crown', name: { is: 'Konungskóróna', en: 'Royal crown' }, colors: ['#f2c34d', '#d23a4c', '#3f8fd2', '#e8475a'], ermine: true },
    { id: 'crown-royal-silver', shape: 'head-crown', cat: 'crown', name: { is: 'Silfurdrottningarkóróna', en: 'Silver queen crown' }, colors: ['#dfe5ee', '#5a6fd6', '#b46ad0', '#7fc6e8'] },
    { id: 'crown-princess-pink', shape: 'head-crown', cat: 'crown', name: { is: 'Bleik prinsessukóróna', en: 'Pink princess crown' }, colors: ['#f7a6c2', '', '#ffffff', '#ffffff'] },
    { id: 'crown-snowflake', shape: 'head-crown-motif', cat: 'crown', name: { is: 'Snjókornakóróna', en: 'Snowflake crown' }, colors: ['#dfe9f4', '#ffffff', '#9fd3f2'], motif: 'flake' },
    { id: 'crown-star', shape: 'head-crown-motif', cat: 'crown', name: { is: 'Stjörnukóróna', en: 'Star crown' }, colors: ['#f2c34d', '#f7d660', '#f6a65a'], motif: 'star' },
    { id: 'crown-strawberry', shape: 'head-crown-motif', cat: 'crown', name: { is: 'Jarðarberjakóróna', en: 'Strawberry crown' }, colors: ['#7cc46e', '#e8475a', '#e8475a'], motif: 'berry' },
    { id: 'crown-hearts', shape: 'head-crown-motif', cat: 'crown', name: { is: 'Hjartakóróna', en: 'Heart crown' }, colors: ['#f2c34d', '#ef5b8d', '#f7a6c2'], motif: 'heart' },
    { id: 'crown-wreath-wild', shape: 'head-wreath', cat: 'crown', name: { is: 'Villiblómakrans', en: 'Wildflower wreath' }, colors: ['#5fae5a'], flowers: ['holtasoley', 'gleymmerei', 'lambagras', 'fifill', 'blodberg'] },
    { id: 'crown-wreath-meadow', shape: 'head-wreath', cat: 'crown', name: { is: 'Engjablómakrans', en: 'Meadow wreath' }, colors: ['#6fb86a'], flowers: ['lambagras', 'holtasoley', 'blodberg', 'holtasoley'] },

    // hairbands
    { id: 'band-pink-dots', shape: 'head-band', cat: 'hairband', name: { is: 'Doppótt spöng', en: 'Dotty hairband' }, colors: ['#f48ca0', '#ffffff'], pattern: 'dots', patternSize: 10 },
    { id: 'band-rainbow', shape: 'head-band', cat: 'hairband', name: { is: 'Regnbogaspöng', en: 'Rainbow hairband' }, colors: ['#ef6f6c', '#ffffff'], pattern: 'rainbow', patternSize: 13, wide: true },
    { id: 'band-bow-red', shape: 'head-band', cat: 'hairband', name: { is: 'Spöng með slaufu', en: 'Bow hairband' }, colors: ['#e2464c', '#ffffff', '#e2464c'], top: 'bow' },
    { id: 'band-bow-polka', shape: 'head-band', cat: 'hairband', name: { is: 'Doppótt slaufuspöng', en: 'Polka bow hairband' }, colors: ['#6fb3e6', '#ffffff', '#6fb3e6', '#ffffff'], top: 'bow', bowPattern: 'dots' },
    { id: 'band-bow-lilac', shape: 'head-band', cat: 'hairband', name: { is: 'Fjólublá slaufuspöng', en: 'Lilac bow hairband' }, colors: ['#b59be6', '#ffffff', '#b59be6', '#ffffff'], top: 'bow', bowSize: 1.25 },
    { id: 'band-flowers', shape: 'head-band', cat: 'hairband', name: { is: 'Blómaspöng', en: 'Flower hairband' }, colors: ['#8fcf88', '#ffffff', '#f48ca0', '#ffffff'], top: 'flowers' },
    { id: 'band-cat', shape: 'head-band', cat: 'hairband', name: { is: 'Kisueyru', en: 'Cat ears' }, colors: ['#3d3540', '#ffffff', '#3d3540', '#f7a6c2'], top: 'cat' },
    { id: 'band-cat-ginger', shape: 'head-band', cat: 'hairband', name: { is: 'Rauð kisueyru', en: 'Ginger cat ears' }, colors: ['#f08a3c', '#ffffff', '#f08a3c', '#fbe0ea'], top: 'cat' },
    { id: 'band-bunny', shape: 'head-band', cat: 'hairband', name: { is: 'Kanínueyru', en: 'Bunny ears' }, colors: ['#f7f3f6', '#ffffff', '#f7f3f6', '#f7b6c8'], top: 'bunny', thumb: [92, 4, 216, 160] },
    { id: 'band-unicorn', shape: 'head-band', cat: 'hairband', name: { is: 'Einhyrningsspöng', en: 'Unicorn hairband' }, colors: ['#f7f3fb', '#ffffff', '#f6cf5e', '#d99a2b'], top: 'unicorn', thumb: [100, 18, 200, 140] },
    { id: 'band-knot', shape: 'head-band', cat: 'hairband', name: { is: 'Hnútaspöng', en: 'Knot hairband' }, colors: ['#3fae9a', '#ffffff'], top: 'knot', wide: true },
    { id: 'band-gems', shape: 'head-band', cat: 'hairband', name: { is: 'Glitrandi spöng', en: 'Sparkle hairband' }, colors: ['#7a5fc9', '#ffffff', '#ffffff', '#f48ca0'], top: 'gems' },
    { id: 'clips-flower', shape: 'head-clips', cat: 'hairband', name: { is: 'Blómaspennur', en: 'Flower clips' }, colors: ['#f48ca0', '#ffffff', '#e9eef3'], kind: 'flower' },
    { id: 'clips-butterfly', shape: 'head-clips', cat: 'hairband', name: { is: 'Fiðrildaspennur', en: 'Butterfly clips' }, colors: ['#7fc6e8', '#b59be6', '#e9eef3'], kind: 'butterfly' },
    { id: 'clips-star', shape: 'head-clips', cat: 'hairband', name: { is: 'Stjörnuspennur', en: 'Star clips' }, colors: ['#f7d660', '#f6a65a', '#e9eef3'], kind: 'star' },
    { id: 'clips-heart', shape: 'head-clips', cat: 'hairband', name: { is: 'Hjartaspennur', en: 'Heart clips' }, colors: ['#ef5b8d', '#f7a6c2', '#e9eef3'], kind: 'heart' },
    { id: 'bow-big-pink', shape: 'head-bigbow', cat: 'hairband', name: { is: 'Stór bleik slaufa', en: 'Big pink bow' }, colors: ['#f48ca0'] },
    { id: 'bow-big-gingham', shape: 'head-bigbow', cat: 'hairband', name: { is: 'Köflótt slaufa', en: 'Gingham bow' }, colors: ['#e2464c', '#ffffff'], pattern: 'check' },

    // glasses
    { id: 'glasses-round-gold', shape: 'head-specs', cat: 'glasses', name: { is: 'Kringlótt gleraugu', en: 'Round glasses' }, colors: ['#d9a93a', '#ffffff'], kind: 'round', thin: true, tint: .25 },
    { id: 'glasses-round-red', shape: 'head-specs', cat: 'glasses', name: { is: 'Rauð gleraugu', en: 'Red glasses' }, colors: ['#e2464c', '#ffffff'], kind: 'round', tint: .25 },
    { id: 'glasses-square-blue', shape: 'head-specs', cat: 'glasses', name: { is: 'Blá gleraugu', en: 'Blue glasses' }, colors: ['#4f86d6', '#ffffff'], kind: 'square', tint: .25 },
    { id: 'glasses-cateye-pink', shape: 'head-specs', cat: 'glasses', name: { is: 'Kisugleraugu', en: 'Cat-eye glasses' }, colors: ['#ef5b8d', '#ffffff', '#ffffff'], kind: 'cateye', tint: .25 },
    { id: 'glasses-cateye-purple', shape: 'head-specs', cat: 'glasses', name: { is: 'Fjólublá kisugleraugu', en: 'Purple cat-eye sunglasses' }, colors: ['#7a5fc9', '#b59be6', '#f7d660'], kind: 'cateye', tint: .4 },
    { id: 'glasses-star-yellow', shape: 'head-specs', cat: 'glasses', name: { is: 'Stjörnusólgleraugu', en: 'Star sunglasses' }, colors: ['#f7c836', '#f6a65a'], kind: 'star', tint: .38 },
    { id: 'glasses-star-blue', shape: 'head-specs', cat: 'glasses', name: { is: 'Bláar stjörnur', en: 'Blue star sunglasses' }, colors: ['#4fb0e6', '#7fc6e8'], kind: 'star', tint: .38 },
    { id: 'glasses-heart-purple', shape: 'glasses-heart', cat: 'glasses', name: { is: 'Fjólublá hjartagleraugu', en: 'Purple heart glasses' }, colors: ['#9a6fe0', '#c9b4f4'] },
    { id: 'glasses-aviator', shape: 'head-specs', cat: 'glasses', name: { is: 'Flugmannssólgleraugu', en: 'Pilot sunglasses' }, colors: ['#c9a24a', '#4f86d6'], kind: 'aviator', thin: true, tint: .4 },
    { id: 'glasses-flower', shape: 'head-specs', cat: 'glasses', name: { is: 'Blómagleraugu', en: 'Flower sunglasses' }, colors: ['#f48ca0', '#f7d660'], kind: 'flower', tint: .38 },
    { id: 'glasses-rainbow', shape: 'head-specs', cat: 'glasses', name: { is: 'Regnbogagleraugu', en: 'Rainbow glasses' }, colors: ['#a58be0', '#ffffff'], kind: 'rainbow', tint: .2 },
    { id: 'glasses-ski', shape: 'head-goggles', cat: 'glasses', name: { is: 'Skíðagleraugu', en: 'Ski goggles' }, colors: ['#3d4f86', '#f6a65a', '#c86fd6', '#e2464c'], kind: 'ski', pattern: 'hstripes' },
    { id: 'glasses-swim', shape: 'head-goggles', cat: 'glasses', name: { is: 'Sundgleraugu', en: 'Swimming goggles' }, colors: ['#3fbfb0', '#7fe0f0', '#4fb0e6', '#3fbfb0'], kind: 'swim' },

    // earrings
    { id: 'ear-stud-pink', shape: 'head-earring', cat: 'earrings', name: { is: 'Bleikir pinnar', en: 'Pink studs' }, colors: ['#f48ca0'], kind: 'stud' },
    { id: 'ear-heart', shape: 'head-earring', cat: 'earrings', name: { is: 'Hjartalokkar', en: 'Heart earrings' }, colors: ['#e8476f'], kind: 'heart' },
    { id: 'ear-star', shape: 'head-earring', cat: 'earrings', name: { is: 'Stjörnulokkar', en: 'Star earrings' }, colors: ['#f7c836'], kind: 'star' },
    { id: 'ear-strawberry', shape: 'head-earring', cat: 'earrings', name: { is: 'Jarðarberjalokkar', en: 'Strawberry earrings' }, colors: ['#e8475a'], kind: 'berry' },
    { id: 'ear-hoop-gold', shape: 'head-earring', cat: 'earrings', name: { is: 'Gullhringir', en: 'Gold hoops' }, colors: ['#f2c34d'], kind: 'hoop' },
    { id: 'ear-hoop-heart', shape: 'head-earring', cat: 'earrings', name: { is: 'Hringir með hjarta', en: 'Hoops with hearts' }, colors: ['#dfe5ee', '#ef5b8d'], kind: 'hoop', charm: true, metal: '#dfe5ee' },
    { id: 'ear-snowflake', shape: 'head-earring', cat: 'earrings', name: { is: 'Snjókornalokkar', en: 'Snowflake earrings' }, colors: ['#9fd3f2', '#ffffff'], kind: 'flake', metal: '#dfe5ee' },
    { id: 'ear-pearl', shape: 'head-earring', cat: 'earrings', name: { is: 'Perlulokkar', en: 'Pearl earrings' }, colors: ['#f6f1ea'], kind: 'pearl' },
    { id: 'ear-cherry', shape: 'head-earring', cat: 'earrings', name: { is: 'Kirsuberjalokkar', en: 'Cherry earrings' }, colors: ['#d8304a'], kind: 'cherry' },
    { id: 'ear-drop-blue', shape: 'head-earring', cat: 'earrings', name: { is: 'Bláir dropar', en: 'Blue drop earrings' }, colors: ['#4fa8e6'], kind: 'drop', metal: '#dfe5ee' },
    { id: 'ear-stud-crystal', shape: 'head-earring', cat: 'earrings', name: { is: 'Kristalspinnar', en: 'Crystal studs' }, colors: ['#c9b4f4'], kind: 'gem', metal: '#dfe5ee' },

    // necklaces
    { id: 'neck-pearls', shape: 'head-necklace', cat: 'necklace', name: { is: 'Perlufesti', en: 'Pearl necklace' }, colors: ['#f6f1ea'], kind: 'beads', beads: ['#f6f1ea'], count: 15 },
    { id: 'neck-locket', shape: 'head-necklace', cat: 'necklace', name: { is: 'Hjartanisti', en: 'Heart locket' }, colors: ['#f2c34d', '#ef5b8d'], kind: 'locket' },
    { id: 'neck-star', shape: 'head-necklace', cat: 'necklace', name: { is: 'Stjörnuhálsmen', en: 'Star necklace' }, colors: ['#f7c836'], kind: 'star' },
    { id: 'neck-daisies', shape: 'head-necklace', cat: 'necklace', name: { is: 'Blómafesti', en: 'Daisy chain' }, colors: ['#ffffff', '#f7a6c2'], kind: 'daisies' },
    { id: 'neck-puffin', shape: 'head-necklace', cat: 'necklace', name: { is: 'Lundahálsmen', en: 'Puffin necklace' }, colors: ['#dfe5ee'], kind: 'puffin', metal: '#dfe5ee' },
    { id: 'neck-rainbow', shape: 'head-necklace', cat: 'necklace', name: { is: 'Regnbogaperlur', en: 'Rainbow beads' }, colors: ['#ef6f6c'], kind: 'beads', beads: ['#ef6f6c', '#f6a65a', '#f7d660', '#7fcf8a', '#6fb3e6', '#a58be0'], count: 13, beadR: 4.8 },
    { id: 'neck-snowflake', shape: 'head-necklace', cat: 'necklace', name: { is: 'Snjókornahálsmen', en: 'Snowflake necklace' }, colors: ['#e9f4fc', '#7fc6e8'], kind: 'flake', metal: '#dfe5ee' },
    { id: 'neck-friendship', shape: 'head-necklace', cat: 'necklace', name: { is: 'Vinaperlur', en: 'Friendship beads' }, colors: ['#f7a6c2'], kind: 'beads', beads: ['#f7a6c2', '#ffffff', '#9fd3f2', '#ffffff', '#f7d660', '#ffffff', '#b59be6', '#ffffff'], count: 13, beadR: 4.2, hearts: true },
    { id: 'neck-crystal', shape: 'head-necklace', cat: 'necklace', name: { is: 'Kristalshálsmen', en: 'Crystal necklace' }, colors: ['#b9a8f2'], kind: 'crystal', metal: '#dfe5ee' },
    { id: 'neck-strawberry', shape: 'head-necklace', cat: 'necklace', name: { is: 'Jarðarberjahálsmen', en: 'Strawberry necklace' }, colors: ['#e8475a'], kind: 'berry', cord: '#f7a6c2' },
  ]);
})();
