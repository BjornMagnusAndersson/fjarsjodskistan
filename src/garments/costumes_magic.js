/* =====================================================================
   Magic dress-up costumes: friendly witch, pirate, ballerina,
   superhero, knight and magician.
   Every piece is a normal item in its own chest tab (hat, crown, top,
   jacket, frock, pants, skirt, shoes, boots, glasses, cape, hold), so
   she can swap parts; DOLL.look() at the bottom puts each variation
   together as a finished costume for the "Búningar" tab.
   Same style as examples.js: fill → details → soft shading → tinted outline.
   Left/right pieces are drawn once on the left and mirrored (x → 400 - x).
   Held things (slot hold) are drawn just UNDER the hands (backZ 40), so
   her right hand is drawn over the handle and looks like it grips it.
   Friendly only: no weapons, no skulls (hearts and stars instead).
   ===================================================================== */
(function () {
  'use strict';
  const { shade, ink, mix } = H;
  const SW = G.stroke;
  const SKIN = PALETTE.SKIN;

  /* ---------------- small helpers ---------------- */

  const n1 = v => (Math.round(v * 10) / 10).toString();
  // "x,y" text of a point, rounded, for building SVG paths
  const P = p => n1(p[0]) + ',' + n1(p[1]);
  /** Safe id fragment from a colour. */
  const idc = c => String(c).replace(/[^a-z0-9]/gi, '');

  /** Final pass for a shape: soft shading overlay plus the tinted outline. */
  const outline = (d, base, soft = 'v', sw = SW) =>
    `<path d="${d}" fill="url(#soft-${soft})" stroke="${ink(base)}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"/>`;
  /** Outline only (no shading), for small parts. */
  const edge = (d, base, sw = 1.6) => `<path d="${d}" fill="none" stroke="${ink(base)}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"/>`;

  /** Mirror markup drawn on the left side over to the right side. */
  const mirror = m => `<g transform="matrix(-1 0 0 1 400 0)">${m}</g>`;
  /** Left piece plus its mirrored right piece. */
  const pair = m => m + mirror(m);

  /** Register a linear gradient: stops [[offset, colour, opacity?]], dir 'v' (top→bottom) or 'h' (left→right). */
  const grad = (id, stops, dir = 'v') => H.def(id, `<linearGradient id="${id}" x1="0" y1="0" x2="${dir === 'h' ? 1 : 0}" y2="${dir === 'h' ? 0 : 1}">` +
    stops.map(([o, c, op]) => `<stop offset="${o}" stop-color="${c}"${op != null ? ` stop-opacity="${op}"` : ''}/>`).join('') + `</linearGradient>`);
  /** Shiny metal: light streak, darker edges (armour, helmets, brass). */
  const metal = (c, dir = 'h') => grad(`cm-metal-${dir}${idc(c)}`, [[0, shade(c, -.28)], [.28, shade(c, .45)], [.45, shade(c, .12)], [.72, c], [1, shade(c, -.3)]], dir);
  /** Round tube shading for a horizontal rod (light on top, dark underneath). */
  const cyl = c => grad(`cm-cyl-${idc(c)}`, [[0, shade(c, .32)], [.35, shade(c, .12)], [.7, c], [1, shade(c, -.3)]]);
  /** Chain-mail pattern: rows of little rings. */
  const mail = c => {
    const id = 'cm-mail-' + idc(c);
    return H.def(id, `<pattern id="${id}" width="8" height="7" patternUnits="userSpaceOnUse"><rect width="8" height="7" fill="${c}"/>` +
      `<path d="M0,1 a4,4 0 0 0 8,0 M-4,4.5 a4,4 0 0 0 8,0 M4,4.5 a4,4 0 0 0 8,0" fill="none" stroke="${shade(c, -.35)}" stroke-width="1.1"/>` +
      `<path d="M1.6,2.6 a3,3 0 0 0 4.8,0" fill="none" stroke="${shade(c, .45)}" stroke-width=".8"/></pattern>`);
  };

  /** Small white four-point twinkle. */
  const twinkle = (x, y, r, col = '#fff') => `<path d="M${n1(x)},${n1(y - r)}Q${n1(x)},${n1(y)} ${n1(x + r)},${n1(y)}Q${n1(x)},${n1(y)} ${n1(x)},${n1(y + r)}Q${n1(x)},${n1(y)} ${n1(x - r)},${n1(y)}Q${n1(x)},${n1(y)} ${n1(x)},${n1(y - r)}Z" fill="${col}"/>`;
  /** Five-point star path. */
  const starD = (cx, cy, r, inner = .46) => {
    let d = '';
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * inner : r; d += (i ? 'L' : 'M') + n1(cx + Math.cos(a) * rr) + ',' + n1(cy + Math.sin(a) * rr); }
    return d + 'Z';
  };
  /** Outlined, softly shaded star. */
  const starO = (cx, cy, r, col, sw = 1.5) => `<path d="${starD(cx, cy, r)}" fill="${H.grad(col, 'r')}" stroke="${ink(col)}" stroke-width="${sw}" stroke-linejoin="round"/>`;
  /** Heart path (point down). */
  const heartD = (cx, cy, r) => `M${n1(cx)},${n1(cy + r * .95)} C${n1(cx - r * 1.5)},${n1(cy + r * .05)} ${n1(cx - r * .95)},${n1(cy - r * 1.05)} ${n1(cx)},${n1(cy - r * .38)} C${n1(cx + r * .95)},${n1(cy - r * 1.05)} ${n1(cx + r * 1.5)},${n1(cy + r * .05)} ${n1(cx)},${n1(cy + r * .95)} Z`;
  /** Outlined heart with a little shine. */
  const heartO = (cx, cy, r, col, sw = 1.5) => `<path d="${heartD(cx, cy, r)}" fill="${H.grad(col, 'r')}" stroke="${ink(col)}" stroke-width="${sw}" stroke-linejoin="round"/>` +
    `<path d="M${n1(cx - r * .7)},${n1(cy - r * .25)} q${n1(r * .1)},${n1(-r * .4)} ${n1(r * .4)},${n1(-r * .45)}" stroke="#fff" stroke-width="${n1(Math.max(1.2, r * .14))}" fill="none" stroke-linecap="round" opacity=".8"/>`;
  /** Stroke drawn twice (dark underneath, colour on top) so a cord or ribbon gets an outline. */
  const strap = (d, c, w) => `<path d="${d}" fill="none" stroke="${ink(c)}" stroke-width="${w + 2.6}" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  /** Straight rod from (x0,y0) to (x1,y1), w wide, with round ends (wand sticks, broom handle). */
  const rodD = (x0, y0, x1, y1, w) => {
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), nx = -dy / L * w / 2, ny = dx / L * w / 2, r = n1(w / 2);
    return `M${n1(x0 + nx)},${n1(y0 + ny)}L${n1(x1 + nx)},${n1(y1 + ny)}A${r},${r} 0 0 0 ${n1(x1 - nx)},${n1(y1 - ny)}L${n1(x0 - nx)},${n1(y0 - ny)}A${r},${r} 0 0 0 ${n1(x0 + nx)},${n1(y0 + ny)}Z`;
  };
  /** Ellipse as a path (so it can be clipped / outlined like other parts). */
  const ellD = (cx, cy, rx, ry) => `M${n1(cx - rx)},${n1(cy)}a${n1(rx)},${n1(ry)} 0 1 0 ${n1(2 * rx)},0a${n1(rx)},${n1(ry)} 0 1 0 ${n1(-2 * rx)},0Z`;
  /** Little ribbon bow centred at x,y (two loops, two tails and a knot). */
  const bow = (x, y, s, c) => {
    const loops = `M${x},${y} l${-s},${-s * .65} q${-s * .25},${s * .65} 0,${s * 1.3} Z M${x},${y} l${s},${-s * .65} q${s * .25},${s * .65} 0,${s * 1.3} Z`;
    const tails = `M${x - 1},${y + 1} l${-s * .45},${s} l${s * .3},-${s * .12} l${s * .15},${s * .25} Z M${x + 1},${y + 1} l${s * .45},${s} l-${s * .3},-${s * .12} l-${s * .15},${s * .25} Z`;
    return `<path d="${tails}${loops}" fill="${H.grad(c)}" stroke="${ink(c)}" stroke-width="1.4" stroke-linejoin="round"/>` +
      `<circle cx="${x}" cy="${y}" r="${n1(s * .3)}" fill="${shade(c, .2)}" stroke="${ink(c)}" stroke-width="1.2"/>`;
  };

  /** Left-foot centre (the right foot is the mirror). */
  const [FX, FY] = G.feet[0];
  /** Sole band at the bottom of a shoe outline, clipped to the shoe so it follows its curve. */
  const sole = (id, foot, y0, c, h = 30) =>
    `<g clip-path="${H.clip(id, foot)}"><rect x="${FX - 60}" y="${y0}" width="120" height="${h}" fill="${c}"/>` +
    `<path d="M${FX - 60},${y0} H${FX + 60}" stroke="${ink(c)}" stroke-width="1.6" opacity=".7"/></g>`;
  /**
   * Boot shaft for the left leg from `top` down to `low` (built from the leg profile, so it always fits).
   * Returns the closed path, the two side edges and the edge points.
   */
  function shaft(top, low = 716, pad = 6, flare = 3) {
    // 0 at the top of the shaft, 1 at the bottom (how far down y is)
    const k = y => (y - top) / (low - top), outer = [], inner = [];
    const step = (low - top) / Math.max(4, Math.round((low - top) / 13));
    for (let y = top; y <= low + .1; y += step) {
      outer.push([G.legOutX(y) - pad - flare * k(y), y]);
      inner.push([G.legInX(y) + pad + flare * k(y) * .6, y]);
    }
    return { outer, inner, d: H.polyPath(outer.concat(inner.slice().reverse())), edges: 'M' + outer.map(P).join('L') + 'M' + inner.map(P).join('L') };
  }
  /** x of the outer / inner shaft edge at height y (left side). */
  const shaftX = (top, low, pad, flare, y, inner) => {
    const k = (y - top) / (low - top);
    return inner ? G.legInX(y) + pad + flare * k * .6 : G.legOutX(y) - pad - flare * k;
  };

  /* =====================================================================
     WITCH (norn) – friendly, bright colours, stars and a smiling cat
     ===================================================================== */

  /* -------------------------------------------------------------
     Pointy witch hat: wide round brim (far half behind the head),
     tall cone whose tip flops to the side with a little star hanging
     from it, a band with a star buckle and a stitched patch.
     colors: [hat, band, star, motif (for it.pattern)]
     ------------------------------------------------------------- */
  DOLL.shape('cm-witch-hat', {
    slot: 'hat',
    thumb: [64, 0, 272, 150],
    draw(it) {
      const [c, band, star = '#ffd45e', motif = '#f7d65a'] = it.colors;
      const fill = it.pattern ? H.pat(it.pattern, c, motif, 26) : H.grad(c);
      const cx = 200, cy = 104, rx = 128, ry = 20;
      // whole brim (drawn behind the head) and its near half (drawn in front)
      const brimAll = `M${cx - rx},${cy} A${rx},${ry} 0 1 0 ${cx + rx},${cy} A${rx},${ry} 0 1 0 ${cx - rx},${cy} Z`;
      const brimFront = `M${cx - rx},${cy} A${rx},${ry} 0 0 0 ${cx + rx},${cy} Q200,${cy - 14} ${cx - rx},${cy} Z`;
      // cone with gently curved sides; the tip bends over to the right
      const cone = 'M110,106 C128,80 154,50 178,28 Q194,10 218,8 Q244,8 258,28 Q242,21 228,25 C238,54 264,82 290,106 Z';
      // band round the bottom of the cone
      const bandD = 'M114,92 Q200,78 286,92 L289,104 Q200,90 111,104 Z';
      // stitched square patch (a friendly "mended" look)
      const patch = `<path d="M152,56 L176,52 L180,74 L156,78 Z" fill="${H.grad(band)}" stroke="${ink(band)}" stroke-width="1.4" stroke-linejoin="round"/>` +
        `<path d="M155,59 L174,55.5 L177.5,72 L158,75.5 Z" fill="none" stroke="#fff" stroke-width="1.2" stroke-dasharray="2.5 2.5" opacity=".85"/>`;
      // little star hanging from the bent tip on a thread
      const dangle = `<path d="M257,29 Q260,34 258,38" stroke="${ink(star)}" stroke-width="1.5" fill="none"/>` + starO(258, 45, 8, star) +
        `<circle cx="255.5" cy="42.5" r="1.4" fill="#fff" opacity=".9"/>`;
      const shine = `<path d="M134,88 Q150,62 172,40" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".35"/>` + twinkle(236, 64, 5) + twinkle(214, 40, 3.5);
      return {
        back: `<path d="${brimAll}" fill="${fill}"/>` +
          `<ellipse cx="${cx}" cy="${cy - 3}" rx="${rx - 34}" ry="${ry - 8}" fill="${shade(c, -.45)}" opacity=".35"/>` + outline(brimAll, c),
        front: `<path d="${cone}" fill="${fill}"/>` + patch + shine + outline(cone, c) + dangle +
          `<path d="${bandD}" fill="${H.grad(band)}"/>` + outline(bandD, band, 'v', 2) + starO(200, 90, 9, star) +
          `<path d="${brimFront}" fill="${fill}"/>` +
          // soft shadow along the brim's lower edge, then the outline
          `<path d="M${cx - rx + 10},${cy + 5} A${rx - 10},${ry - 5} 0 0 0 ${cx + rx - 10},${cy + 5}" fill="none" stroke="${shade(c, -.35)}" stroke-width="4" opacity=".3"/>` +
          outline(brimFront, c) +
          `<path d="M90,110 Q120,120 160,123" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".35"/>`,
      };
    },
  });

  /* -------------------------------------------------------------
     Witch dress: bell sleeves with a contrast cuff, pointed collar,
     laced bodice, a belt with a star buckle and a knee-length skirt
     with a pointy (zigzag) hem over a contrast petticoat.
     colors: [dress, trim (collar, cuffs, petticoat, belt), accent (lacing, buckle), motif (for it.pattern)]
     ------------------------------------------------------------- */
  DOLL.shape('cm-witch-dress', {
    slot: 'dress',
    occupies: ['dress', 'top', 'bottom'],
    thumb: [50, 236, 300, 380],
    draw(it) {
      const [c, trim, acc = '#ffd45e', motif = '#f7d65a'] = it.colors;
      const fill = it.pattern ? H.pat(it.pattern, c, motif, 30) : H.grad(c);
      const top = 404, bot = 574, wx = G.torsoX(top) - 4;
      // left skirt edge at height y (A-line); the right side mirrors it
      const xl = y => wx - (wx - 94) * Math.pow(Math.max(0, (y - top) / (bot - top)), .8);
      const ys = []; for (let y = top + 22; y < bot + 8; y += 22) ys.push(y);
      /** Skirt from the waist to yEnd with n pointed tips; shift = tips at the corners instead (petticoat). */
      const skirt = (yEnd, n, amp, shift) => {
        const x0 = xl(yEnd), x1 = 400 - x0, w = (x1 - x0) / n, up = ys.filter(y => y < yEnd);
        let hem = '';
        if (shift) { for (let i = 0; i <= n; i++) hem += `L${n1(x0 + w * i)},${n1(yEnd + amp)}` + (i < n ? `L${n1(x0 + w * (i + .5))},${yEnd}` : ''); }
        else { for (let i = 0; i < n; i++) hem += `L${n1(x0 + w * (i + .5))},${n1(yEnd + amp)}L${n1(x0 + w * (i + 1))},${yEnd}`; }
        const d = `M${n1(wx)},${top}` + up.map(y => `L${n1(xl(y))},${y}`).join('') + `L${n1(x0)},${yEnd}` + hem +
          `L${n1(x1)},${yEnd}` + up.slice().reverse().map(y => `L${n1(400 - xl(y))},${y}`).join('') + `L${n1(400 - wx)},${top}Z`;
        return { d, hem: `M${n1(x0)},${yEnd}` + hem };
      };
      const under = skirt(bot + 6, 6, 20, true), main = skirt(bot, 6, 26, false);
      const sclip = H.clip('c-' + it.id + '-sk', main.d);
      // little stars stitched on the skirt (plain dresses only; patterned ones have their own)
      const stars = it.pattern ? '' : pair([[128, 540, 6], [160, 496, 5], [176, 556, 4.5]].map(([x, y, r]) => starO(x, y, r, acc, 1.1)).join(''));
      const folds = 'M150,440 Q140,500 124,566 M178,436 Q174,500 168,574 M222,436 Q226,500 232,574 M250,440 Q260,500 276,566';
      // bodice with bell sleeves
      const bod = G.shirtPath({ sleeve: 1, pad: 4, sleevePad: 5, sleeveFlare: 12, bottom: 414, neck: 'round' });
      const bclip = H.clip('c-' + it.id + '-bod', bod);
      // wide sleeve cuff in the trim colour with a darker edge line, for the given side
      const cuff = side => `<path d="${G.armPath(side, .84, 1.04, 40)}" fill="${H.grad(trim)}"/>` +
        `<path d="${G.armPath(side, .84, .845, 40)}" fill="${ink(trim)}" opacity=".5"/>`;
      const cuffDots = pair([.9, .97].map(t => { const [x, y] = G.armPoint('L', t); return `<circle cx="${n1(x - 20)}" cy="${n1(y + 2)}" r="2.2" fill="${acc}"/>`; }).join(''));
      // pointed collar (left drawn, right mirrored)
      const collar = pair(`<path d="M185,250 Q170,254 156,266 L176,288 Q186,272 199,262 Z" fill="${H.grad(trim)}"/>` + outline('M185,250 Q170,254 156,266 L176,288 Q186,272 199,262 Z', trim, 'v', 2));
      // criss-cross lacing down the bodice, with eyelets and a bow at the top
      let lace = '', eyes = '';
      for (let y = 300; y < 384; y += 16) { lace += `M193,${y}L207,${y + 16}M207,${y}L193,${y + 16}`; eyes += `<circle cx="193" cy="${y}" r="2" fill="${ink(c)}"/><circle cx="207" cy="${y}" r="2" fill="${ink(c)}"/>`; }
      const belt = `M${n1(wx - 1)},397 H${n1(401 - wx)} V412 H${n1(wx - 1)} Z`;
      return `<path d="${under.d}" fill="${H.grad(trim)}"/>` + outline(under.d, trim, 'h', 2) +
        `<path d="${main.d}" fill="${fill}"/>` +
        `<g clip-path="${sclip}">${H.line(folds, c, 1.8, .4)}<path d="${main.hem}" fill="none" stroke="${trim}" stroke-width="7" stroke-linejoin="round"/>` +
          `<path d="${main.hem}" fill="none" stroke="#fff" stroke-width="1.4" stroke-dasharray="3 4" stroke-linejoin="round" opacity=".7" transform="translate(0,-6)"/></g>` +
        stars + outline(main.d, c, 'h') +
        `<path d="${bod}" fill="${fill}"/>` +
        `<g clip-path="${bclip}">${cuff('L')}${cuff('R')}</g>` + cuffDots +
        H.line('M150,330 q6,14 3,30 M250,330 q-6,14 -3,30', c, 1.6, .4) +
        eyes + `<path d="${lace}" fill="none" stroke="${ink(acc)}" stroke-width="3.6" stroke-linecap="round"/><path d="${lace}" fill="none" stroke="${acc}" stroke-width="2" stroke-linecap="round"/>` +
        outline(bod, c) + collar + bow(200, 290, 8, acc) +
        `<path d="${belt}" fill="${H.grad(trim)}"/>` + outline(belt, trim, 'v', 2) + starO(200, 404.5, 9.5, acc);
    },
  });

  /* -------------------------------------------------------------
     Witch shoes: stripy stockings up to just under the knee with a
     frilly top, and pointy shoes whose toes curl up into a pompom.
     colors: [shoe, stripe 1, stripe 2, buckle]
     ------------------------------------------------------------- */
  DOLL.shape('cm-witch-shoes', {
    slot: 'shoes',
    thumb: [96, 590, 208, 164],
    draw(it) {
      const [c, s1, s2, buckle = '#f2c34d'] = it.colors;
      const leg = G.legPath('L', 604, 714, 1.5);
      const foot = G.footPath('L', 4, 6);
      // curled toe: a tapering horn from the toe up and outward, ending in a pompom
      const curl = 'M146,714 C134,712 122,708 118,698 Q116,690 122,690 Q124,700 134,704 C142,707 148,708 154,716 Z';
      // frilly top of the stocking: small scallops round the leg
      const x0 = G.legOutX(604) - 3, x1 = G.legInX(604) + 3, n = 5, w = (x1 - x0) / n;
      let frill = `M${n1(x0)},606`;
      for (let i = 0; i < n; i++) frill += `q${n1(w / 2)},-8 ${n1(w)},0`;
      frill += `L${n1(x1)},611 L${n1(x0)},611 Z`;
      const one = `<path d="${leg}" fill="${H.pat('hstripes', s1, s2, 14)}"/><path d="${leg}" fill="url(#soft-h)"/>` + edge(leg, s1, 2) +
        `<path d="${frill}" fill="${H.grad(s1)}"/>` + edge(frill, s1, 1.6) +
        `<path d="${curl}" fill="${H.grad(c)}"/>` + outline(curl, c, 'v', 2) +
        `<circle cx="120" cy="690" r="5" fill="${H.grad(s1, 'r')}" stroke="${ink(s1)}" stroke-width="1.4"/>` +
        `<path d="${foot}" fill="${H.grad(c)}"/>` + sole('c-' + it.id, foot, FY + 10, shade(c, -.35), 20) + outline(foot, c, 'r') +
        // little square buckle on the instep
        `<rect x="160" y="703" width="13" height="10" rx="2" fill="none" stroke="${ink(buckle)}" stroke-width="4"/>` +
        `<rect x="160" y="703" width="13" height="10" rx="2" fill="none" stroke="${buckle}" stroke-width="2.4"/>` +
        `<path d="M${FX - 16},${FY - 2} q-3,4 -2,8" stroke="#fff" stroke-width="2.4" stroke-linecap="round" fill="none" opacity=".6"/>`;
      return pair(one);
    },
  });

  /* -------------------------------------------------------------
     Witch broom (held): wooden handle with a ribbon bow, straw
     bristles tied with two cords. Held upright beside her.
     colors: [wood, straw, ribbon]
     ------------------------------------------------------------- */
  DOLL.shape('cm-broom', {
    slot: 'hold',
    backZ: 40,
    thumb: [226, 400, 170, 350],
    draw(it) {
      const [wood, straw, ribbon] = it.colors;
      const stick = rodD(300, 312, 311, 648, 8);
      // bristle head, wider at the bottom with a wavy end
      const head = 'M299,640 C292,668 283,700 281,730 Q291,740 301,733 Q312,742 322,734 Q333,742 345,730 C341,700 332,668 325,640 Z';
      const hclip = H.clip('c-' + it.id + '-head', head);
      let br = '';
      for (let i = 0; i <= 9; i++) { const xt = 300 + i * 2.6, xb = 283 + i * 6.6; br += `M${n1(xt)},646 Q${n1((xt + xb) / 2 - 1)},690 ${n1(xb)},740`; }
      return {
        back: `<path d="${stick}" fill="${H.grad(wood, 'h')}"/>` +
          `<path d="M301,330 L309,620" stroke="${shade(wood, .35)}" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>` + edge(stick, wood, 2.2) +
          `<circle cx="300" cy="312" r="6.5" fill="${H.grad(wood, 'r')}" stroke="${ink(wood)}" stroke-width="2"/>` +
          bow(302, 362, 11, ribbon) +
          `<path d="${head}" fill="${H.grad(straw)}"/><g clip-path="${hclip}"><path d="${br}" fill="none" stroke="${shade(straw, -.3)}" stroke-width="1.5" opacity=".6"/></g>` +
          outline(head, straw) +
          strap('M296,652 Q312,658 328,652', ribbon, 4.5) + strap('M294,666 Q312,672 330,666', ribbon, 3.5),
      };
    },
  });

  /* -------------------------------------------------------------
     Black cat plush (held): a soft toy cat she holds by its paw,
     with big friendly eyes, a pink nose, a smile and a bow.
     colors: [fur, bow, eyes]
     ------------------------------------------------------------- */
  DOLL.shape('cm-cat-plush', {
    slot: 'hold',
    backZ: 40,
    thumb: [262, 436, 126, 160],
    draw(it) {
      const [fur, bowC, eye = '#9fdc6a'] = it.colors;
      const light = shade(fur, .35);
      const arm = 'M318,528 C310,512 302,494 299,474 Q305,465 312,471 C316,490 324,506 332,520 Z';      // raised paw up to her hand
      const tail = 'M352,568 C372,562 380,538 370,522 Q362,514 359,523 C366,536 361,552 348,556 Z';
      const body = ellD(337, 556, 21, 26);
      const head = ellD(338, 500, 24, 22);
      const earL = 'M317,494 L318,468 L336,480 Z', earR = 'M340,479 L358,467 L360,494 Z';
      // one cartoon eye (white, coloured iris, pupil and sparkle) centred at x
      const eyeAt = x => `<ellipse cx="${x}" cy="501" rx="5.6" ry="6.6" fill="#fff" stroke="${ink(fur)}" stroke-width="1"/>` +
        `<circle cx="${x + .5}" cy="502" r="4.2" fill="${eye}"/><circle cx="${x + .5}" cy="502.5" r="2.4" fill="#1d1a24"/><circle cx="${x + 2}" cy="500" r="1.3" fill="#fff"/>`;
      return {
        back: `<path d="${tail}" fill="${H.grad(fur)}"/>` + outline(tail, fur, 'v', 2) +
          `<path d="${body}" fill="${H.grad(fur, 'r')}"/><ellipse cx="337" cy="562" rx="11" ry="15" fill="${light}" opacity=".55"/>` + outline(body, fur, 'r', 2) +
          `<ellipse cx="327" cy="581" rx="8" ry="5.5" fill="${H.grad(fur)}" stroke="${ink(fur)}" stroke-width="1.6"/><ellipse cx="347" cy="581" rx="8" ry="5.5" fill="${H.grad(fur)}" stroke="${ink(fur)}" stroke-width="1.6"/>` +
          `<path d="${arm}" fill="${H.grad(fur)}"/>` + outline(arm, fur, 'v', 2) +
          `<path d="${earL}${earR}" fill="${H.grad(fur)}" stroke="${ink(fur)}" stroke-width="2" stroke-linejoin="round"/>` +
          `<path d="M321,488 L322,474 L331,481 Z M345,481 L355,473 L356,488 Z" fill="#f4a3c0"/>` +
          `<path d="${head}" fill="${H.grad(fur, 'r')}"/>` + outline(head, fur, 'r', 2) +
          eyeAt(329) + eyeAt(347) +
          `<ellipse cx="324" cy="511" rx="4.5" ry="2.8" fill="#f28aa8" opacity=".55"/><ellipse cx="352" cy="511" rx="4.5" ry="2.8" fill="#f28aa8" opacity=".55"/>` +
          `<path d="M335.5,508 L341.5,508 L338.5,511.5 Z" fill="#f4a3c0" stroke="#c76b8a" stroke-width=".8" stroke-linejoin="round"/>` +
          `<path d="M334,513 q2.25,3 4.5,0 q2.25,3 4.5,0" fill="none" stroke="${light}" stroke-width="1.6" stroke-linecap="round"/>` +
          `<path d="M326,509 l-10,-2 M326,512 l-10,2 M351,509 l10,-2 M351,512 l10,2" stroke="${light}" stroke-width="1.2" stroke-linecap="round" opacity=".8"/>` +
          bow(338, 524, 8, bowC),
      };
    },
  });

  /* =====================================================================
     PIRATE (sjóræningi) – hearts instead of skulls, no swords
     ===================================================================== */

  /* -------------------------------------------------------------
     Tricorn pirate hat: rounded crown, brim turned up into three
     corners, gold edging, a heart badge and an optional feather.
     colors: [hat, gold trim, heart, feather (optional)]
     ------------------------------------------------------------- */
  DOLL.shape('cm-tricorn', {
    slot: 'hat',
    thumb: [62, 8, 268, 148],
    draw(it) {
      const [c, trim, emb, feather] = it.colors;
      const crown = 'M126,96 C122,48 158,30 200,30 C242,30 278,48 274,96 Z';
      const brim = 'M84,96 C92,72 116,52 146,56 Q176,60 200,74 Q224,60 254,56 C284,52 308,72 316,96 Q302,108 272,110 Q236,114 200,130 Q164,114 128,110 Q98,108 84,96 Z';
      const rim = 'M87,94 C95,72 117,55 146,59 Q176,63 200,77 Q224,63 254,59 C283,55 305,72 313,94';
      const plume = feather ? `<path d="M124,74 C104,48 86,30 66,26 C76,40 88,58 106,82 Z" fill="${H.grad(feather)}"/>` +
        `<path d="M118,74 Q96,48 72,30" stroke="${shade(feather, .45)}" stroke-width="1.6" fill="none" stroke-linecap="round"/>` +
        H.line('M100,56 l-8,4 M92,46 l-8,3 M110,66 l-7,5', feather, 1.3, .5) + outline('M124,74 C104,48 86,30 66,26 C76,40 88,58 106,82 Z', feather, 'v', 2) : '';
      return `<path d="${crown}" fill="${H.grad(c)}"/>` + outline(crown, c) +
        `<path d="M146,44 Q164,34 186,33" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round" opacity=".35"/>` +
        plume +
        `<path d="${brim}" fill="${H.grad(c)}"/>` +
        H.line('M110,100 Q150,104 186,120 M290,100 Q250,104 214,120', c, 1.6, .5) +
        outline(brim, c) +
        strap(rim, trim, 3.6) +
        heartO(200, 99, 12, emb) + twinkle(222, 88, 3.5) + twinkle(178, 112, 2.5);
    },
  });

  /* -------------------------------------------------------------
     Pirate bandana: a spotty kerchief over the head with a rolled
     edge across the forehead and a knot with two tails on the side.
     colors: [cloth, dots]; it.pattern (default dots)
     ------------------------------------------------------------- */
  DOLL.shape('cm-bandana', {
    slot: 'hat',
    thumb: [88, 30, 264, 166],
    draw(it) {
      const [c, dot = '#ffffff'] = it.colors;
      const fill = H.pat(it.pattern || 'dots', c, dot, 18);
      const cap = 'M108,126 C100,70 148,44 200,44 C252,44 300,70 292,126 Q200,104 108,126 Z';
      const fold = 'M104,112 Q200,92 296,112 L296,129 Q200,109 104,129 Z';
      const tail1 = 'M288,122 C306,134 316,156 312,184 L297,178 C300,158 294,142 282,132 Z';
      const tail2 = 'M296,118 C320,118 338,134 344,158 L329,163 C323,144 312,132 294,130 Z';
      return `<path d="${tail1}" fill="${fill}"/>` + outline(tail1, c, 'h', 2) +
        `<path d="${tail2}" fill="${fill}"/>` + outline(tail2, c, 'h', 2) +
        `<path d="${cap}" fill="${fill}"/>` + H.line('M150,70 Q172,92 176,112 M230,62 Q252,86 254,108', c, 1.6, .4) + outline(cap, c) +
        `<path d="M136,74 Q152,56 178,50" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".35"/>` +
        `<path d="${fold}" fill="${fill}"/>` + `<path d="M108,121 Q200,101 292,121" fill="none" stroke="${ink(c)}" stroke-width="1.3" opacity=".35"/>` + outline(fold, c, 'v', 2) +
        `<ellipse cx="292" cy="120" rx="11" ry="10" fill="${fill}"/>` + outline(ellD(292, 120, 11, 10), c, 'r', 2) +
        H.line('M286,114 q6,4 12,0', c, 1.3, .5);
    },
  });

  /* -------------------------------------------------------------
     Pirate shirt: puffy long-sleeved blouse (plain or stripy) with
     ruffled cuffs and a laced neck, under an open waistcoat with
     gold piping and buttons, and a wide sash knotted at the hip.
     colors: [waistcoat, sash, blouse, gold]; it.stripes = stripe colour
     ------------------------------------------------------------- */
  DOLL.shape('cm-pirate-top', {
    slot: 'top',
    draw(it) {
      const [vest, sash, blouse, gold = '#f2c34d'] = it.colors;
      const shirt = G.shirtPath({ sleeve: 1, pad: 6, sleevePad: 5, sleeveFlare: 9, bottom: 452, neck: 'v', neckDepth: 30 });
      const sFill = it.stripes ? H.pat('hstripes', blouse, it.stripes, 16) : H.grad(blouse);
      // gathered cuff band and a frill at each wrist
      const cuff = side => `<path d="${G.armPath(side, .88, .95, 6)}" fill="${H.grad(blouse)}"/>` + outline(G.armPath(side, .88, .95, 6), blouse, 'h', 1.8) +
        `<path d="${G.armPath(side, .95, 1.02, 9, 4)}" fill="${H.grad(blouse)}"/>` + outline(G.armPath(side, .95, 1.02, 9, 4), blouse, 'h', 1.6);
      const vestD = G.shirtPath({ sleeve: 0, pad: 8, bottom: 450, neck: 'v', neckDepth: 192 });
      const btns = [304, 344, 384].map(y => { const x = 183 + 17 * (y - 250) / 192 - 9; return `<circle cx="${n1(x)}" cy="${y}" r="3.6" fill="${H.grad(gold, 'r')}" stroke="${ink(gold)}" stroke-width="1.2"/>`; }).join('');
      const sashD = 'M137,395 Q200,407 263,395 L265,421 Q200,433 135,421 Z';
      const sTail = 'M144,416 C138,440 136,460 140,480 L153,476 C151,458 153,438 156,418 Z M152,416 C157,438 165,456 174,470 L184,462 C174,448 166,432 161,415 Z';
      // laced V at the blouse neck
      const lace = 'M186,258 L214,266 M214,258 L186,266 M190,268 L210,276 M210,268 L190,276';
      return `<path d="${shirt}" fill="${sFill}"/>` +
        H.line('M118,330 q-4,30 -10,60 M282,330 q4,30 10,60 M122,400 q4,14 0,30 M278,400 q-4,14 0,30', blouse, 1.6, .5) +
        outline(shirt, blouse) + cuff('L') + cuff('R') +
        `<path d="${lace}" stroke="#8a5a34" stroke-width="2" stroke-linecap="round"/>` +
        `<path d="${vestD}" fill="${H.grad(vest)}"/>` +
        `<path d="M183,252 L200,442 L217,252" fill="none" stroke="${gold}" stroke-width="3" stroke-linejoin="round"/>` +
        // little welt pockets
        `<path d="M152,420 h18 M230,420 h18" stroke="${gold}" stroke-width="3" stroke-linecap="round"/>` +
        outline(vestD, vest) + btns +
        `<path d="${sashD}" fill="${H.grad(sash)}"/>` + H.line('M140,405 Q200,416 260,405 M138,413 Q200,424 262,413', sash, 1.4, .45) + outline(sashD, sash, 'v', 2) +
        `<path d="${sTail}" fill="${H.grad(sash)}"/>` + outline(sTail, sash, 'h', 2) +
        `<ellipse cx="152" cy="411" rx="10" ry="9" fill="${H.grad(sash, 'r')}" stroke="${ink(sash)}" stroke-width="2"/>`;
    },
  });

  /* -------------------------------------------------------------
     Pirate trousers: knee-length breeches with buttoned cuffs and a
     stitched heart patch on one knee. Plain or stripy.
     colors: [cloth, stripe/second colour, cuff + waistband]
     ------------------------------------------------------------- */
  DOLL.shape('cm-pirate-pants', {
    slot: 'bottom',
    thumb: [104, 384, 192, 236],
    draw(it) {
      const [c, c2 = '#ffffff', cuffC = shade(c, -.15)] = it.colors;
      const d = G.pantsPath({ top: 398, bottom: 606, pad: 6, flare: 5 });
      const clip = H.clip('c-' + it.id, d);
      const fill = it.pattern ? H.pat(it.pattern, c, c2, it.patternSize || 20) : H.grad(c);
      const bx = G.legOutX(598) - 6 - 4.6 + 6;
      return `<path d="${d}" fill="${fill}"/>` +
        `<g clip-path="${clip}"><rect x="0" y="397" width="400" height="13" fill="${H.grad(cuffC)}"/><rect x="0" y="588" width="400" height="20" fill="${H.grad(cuffC)}"/>` +
          `<path d="M0,588 H400 M0,410 H400" stroke="${ink(cuffC)}" stroke-width="1.4" opacity=".6"/></g>` +
        pair(`<circle cx="${n1(bx)}" cy="598" r="3.2" fill="${H.grad('#f2c34d', 'r')}" stroke="${ink('#f2c34d')}" stroke-width="1.2"/>`) +
        // heart patch with running stitches on the left knee
        `<path d="${heartD(170, 548, 13)}" fill="${H.grad(cuffC)}" stroke="${ink(cuffC)}" stroke-width="1.5"/>` +
        `<path d="${heartD(170, 548, 9.5)}" fill="none" stroke="#fff" stroke-width="1.2" stroke-dasharray="2 2.4" opacity=".85"/>` +
        H.line('M190,470 l-9,8 M210,470 l9,8 M200,412 V452', c, 1.6, .5) + outline(d, c, 'h') +
        `<circle cx="200" cy="404" r="3.4" fill="${H.grad('#f2c34d', 'r')}" stroke="${ink('#f2c34d')}" stroke-width="1.2"/>`;
    },
  });

  /* -------------------------------------------------------------
     Pirate boots: tall boots with a wide folded-down cuff, a strap
     with a gold buckle over the foot and a dark sole.
     colors: [leather, cuff, buckle]
     ------------------------------------------------------------- */
  DOLL.shape('cm-pirate-boots', {
    slot: 'shoes',
    thumb: [100, 570, 200, 184],
    draw(it) {
      const [c, cuffC = shade(c, .14), buckle = '#f2c34d'] = it.colors;
      const top = 612, low = 716, sh = shaft(top, low, 6, 3);
      const foot = G.footPath('L', 6, 4);
      // wide cuff folded down over the top of the shaft
      const ct = 584, cb = 628;
      const o0 = G.legOutX(ct) - 20, i0 = G.legInX(ct) + 12, o1 = shaftX(top, low, 6, 3, cb, false) - 3, i1 = shaftX(top, low, 6, 3, cb, true) + 3;
      const cuffD = `M${n1(o0)},${ct} Q${n1((o0 + i0) / 2)},${ct - 7} ${n1(i0)},${ct} L${n1(i1)},${cb} Q${n1((o1 + i1) / 2)},${cb + 6} ${n1(o1)},${cb} Z`;
      const one = `<path d="${foot}" fill="${H.grad(c)}"/>` + sole('c-' + it.id, foot, FY + 9, shade(c, -.45), 24) + outline(foot, c, 'r') +
        `<path d="${sh.d}" fill="${H.grad(c, 'h')}"/><path d="${sh.d}" fill="url(#soft-h)"/>` +
        `<path d="${sh.edges}" fill="none" stroke="${ink(c)}" stroke-width="${SW}" stroke-linecap="round"/>` +
        H.line('M158,698 q12,5 26,0', c, 1.6, .5) +
        `<path d="${cuffD}" fill="${H.grad(cuffC)}"/>` + H.line(`M${n1(o0 + 10)},${ct + 4} L${n1(o1 + 6)},${cb - 4} M${n1(i0 - 8)},${ct + 4} L${n1(i1 - 5)},${cb - 4}`, cuffC, 1.4, .45) + outline(cuffD, cuffC, 'h', 2.2) +
        strap('M152,704 Q168,712 186,703', shade(c, -.25), 5) +
        `<rect x="161" y="702" width="11" height="10" rx="2" fill="none" stroke="${ink(buckle)}" stroke-width="4"/><rect x="161" y="702" width="11" height="10" rx="2" fill="none" stroke="${buckle}" stroke-width="2.2"/>` +
        `<path d="M${n1(sh.outer[1][0] + 5)},${top + 22} q-2,30 2,64" stroke="#fff" stroke-width="3.2" stroke-linecap="round" fill="none" opacity=".4"/>`;
      return pair(one);
    },
  });

  /* -------------------------------------------------------------
     Spyglass (held): a brass telescope with a leather grip, pointing
     up and out from her hand.
     colors: [brass, leather]
     ------------------------------------------------------------- */
  DOLL.shape('cm-spyglass', {
    slot: 'hold',
    backZ: 40,
    thumb: [248, 352, 136, 164],
    draw(it) {
      const [brass, leather] = it.colors;
      /** One tube section along the x axis from x0 to x1, radius r0 → r1. */
      const tube = (x0, x1, r0, r1, c) => { const d = `M${x0},${-r0} L${x1},${-r1} L${x1},${r1} L${x0},${r0} Z`; return `<path d="${d}" fill="${cyl(c)}"/>` + edge(d, c, 1.8); };
      // thin brass ring round the tube at x, radius r, width w
      const ring = (x, r, w) => tube(x - w / 2, x + w / 2, r, r, shade(brass, -.08));
      const body = tube(-44, -14, 4.5, 4.5, brass) + ring(-15, 6.5, 6) +
        tube(-12, 42, 7.5, 7.5, leather) + `<path d="M-10,-4.5 H40" stroke="${shade(leather, .4)}" stroke-width="1.2" stroke-dasharray="3 2.5"/>` +
        tube(44, 98, 9.5, 11, brass) + ring(43, 9.5, 7) + ring(100, 12.5, 8) +
        `<path d="M50,-6 L94,-7.5" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".6"/>` +
        `<ellipse cx="104" cy="0" rx="3" ry="10.5" fill="#bfe6f7" stroke="${ink(brass)}" stroke-width="1.6"/><path d="M104,-6 v4" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>` +
        `<ellipse cx="-44" cy="0" rx="2" ry="4.5" fill="${shade(brass, -.2)}" stroke="${ink(brass)}" stroke-width="1.4"/>`;
      return { back: `<g transform="translate(303,463) rotate(-60)">${body}</g>` + twinkle(364, 366, 5) + twinkle(372, 384, 3) };
    },
  });

  /* -------------------------------------------------------------
     Treasure map (held): a parchment scroll she holds by the top roll,
     with waves, an island with a palm tree, a dotted path, a red X,
     a heart and a little compass star.
     colors: [paper, red ink]
     ------------------------------------------------------------- */
  DOLL.shape('cm-map', {
    slot: 'hold',
    backZ: 40,
    thumb: [262, 432, 120, 140],
    draw(it) {
      const [paper, red = '#d8364a'] = it.colors;
      const sheet = 'M290,458 L360,458 Q356,480 360,502 Q364,526 358,556 L292,556 Q296,530 290,506 Q286,482 290,458 Z';
      const clip = H.clip('c-' + it.id, sheet);
      // one rolled-up end of the paper at height y, spanning x0 to x1
      const roll = (y, x0, x1) => { const d = `M${x0 + 6},${y - 6} H${x1 - 6} a6,6 0 0 1 0,12 H${x0 + 6} a6,6 0 0 1 0,-12 Z`; return `<path d="${d}" fill="${cyl(shade(paper, -.1))}"/>` + edge(d, paper, 1.8) + `<ellipse cx="${x1 - 6}" cy="${y}" rx="2.4" ry="5" fill="${shade(paper, -.3)}"/>`; };
      const waves = [[300, 482], [340, 470], [306, 528], [340, 546]].map(([x, y]) => `M${x},${y} q3,-3 6,0 q3,3 6,0`).join('');
      const island = 'M318,508 Q322,494 336,494 Q350,494 352,508 Q336,514 318,508 Z';
      return {
        back: `<path d="${sheet}" fill="${H.grad(paper)}"/>` +
          `<g clip-path="${clip}"><ellipse cx="325" cy="507" rx="40" ry="44" fill="${shade(paper, -.08)}" opacity=".5"/>` +
            `<path d="${waves}" fill="none" stroke="#5aa6d6" stroke-width="1.6" stroke-linecap="round"/>` +
            `<path d="${island}" fill="#8fce6a" stroke="#4f8f3c" stroke-width="1.4"/><path d="M322,508 Q336,503 350,508" stroke="#f3d27a" stroke-width="2.4" fill="none"/>` +
            // palm tree on the island
            `<path d="M330,505 Q328,492 332,482" stroke="#9a6a3c" stroke-width="2.4" fill="none" stroke-linecap="round"/>` +
            `<path d="M332,482 q-9,-3 -13,4 M332,482 q8,-4 13,2 M332,482 q-3,-8 -9,-9 M332,482 q4,-8 10,-8" stroke="#4fae5b" stroke-width="2.6" fill="none" stroke-linecap="round"/>` +
            // dotted path from the corner to the X, and a little heart
            `<path d="M300,544 Q314,530 316,518 Q318,504 344,498" fill="none" stroke="${red}" stroke-width="1.8" stroke-dasharray="2.5 3" stroke-linecap="round"/>` +
            `<path d="M340,494 l8,8 M348,494 l-8,8" stroke="${red}" stroke-width="3" stroke-linecap="round"/>` +
            `<path d="${heartD(350, 528, 5)}" fill="${red}"/>` +
            // compass star in the corner
            `<path d="M306,468 l2,6 l6,2 l-6,2 l-2,6 l-2,-6 l-6,-2 l6,-2 Z" fill="${shade(paper, -.45)}" opacity=".8"/>` +
          `</g>` + outline(sheet, paper, 'h', 2) +
          roll(458, 284, 366) + roll(556, 286, 364),
      };
    },
  });

  /* =====================================================================
     BALLERINA (ballerína)
     ===================================================================== */

  /* -------------------------------------------------------------
     Ballet leotard: sparkly sleeveless bodice with puffy tulle at
     the shoulders, a pearl neckline, a little bow, princess seams
     and a pearl trim at the hip. it.feathers = swan feathers round
     the neckline instead of pearls.
     colors: [leotard, sparkle, trim/bow, tulle]
     ------------------------------------------------------------- */
  DOLL.shape('cm-leotard', {
    slot: 'top',
    thumb: [84, 232, 232, 224],
    draw(it) {
      const [c, sp = '#ffffff', trim = shade(c, -.22), tulle = '#ffffff'] = it.colors;
      const d = G.shirtPath({ sleeve: 0, pad: 1.5, bottom: 440, neck: 'scoop', neckDepth: 18 });
      // round puff of tulle on each shoulder (drawn first, so the bodice tucks over it)
      const puffD = 'M146,268 Q128,262 117,274 Q108,288 114,302 Q122,314 136,310 Q142,316 150,306 Z';
      const puff = `<path d="${puffD}" fill="${tulle}" opacity=".9"/>` + H.line('M140,272 Q126,280 122,300 M146,276 Q136,288 136,306 M132,268 Q118,276 116,292', trim, 1.3, .45) +
        `<path d="M118,284 Q122,272 134,268" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".8"/>` + outline(puffD, trim, 'r', 1.6);
      const neck = 'M175.5,251.5 Q200,287.5 224.5,251.5';
      let deco;
      if (it.feathers) {
        // small swan feathers fanning out along the neckline
        deco = '';
        for (let i = 0; i <= 10; i++) {
          const t = i / 10, x = (1 - t) * (1 - t) * 175.5 + 2 * (1 - t) * t * 200 + t * t * 224.5, y = (1 - t) * (1 - t) * 251.5 + 2 * (1 - t) * t * 287.5 + t * t * 251.5;
          const a = 90 + (t - .5) * -150;
          deco += `<g transform="translate(${n1(x)},${n1(y + 3)}) rotate(${n1(a)})"><path d="M0,0 C3,-4 10,-4 14,0 C10,4 3,4 0,0 Z" fill="#fff" stroke="${ink(trim)}" stroke-width=".9"/><path d="M1,0 H12" stroke="${trim}" stroke-width=".7"/></g>`;
        }
      } else {
        deco = `<path d="${neck}" fill="none" stroke="${ink(trim)}" stroke-width="6.4" stroke-dasharray="0 7" stroke-linecap="round"/>` +
          `<path d="${neck}" fill="none" stroke="#fff8fb" stroke-width="4.6" stroke-dasharray="0 7" stroke-linecap="round"/>`;
      }
      const hem = 'M137.5,441 Q200,453 262.5,441';
      // satin waist ribbon (fitted ballet bodice look)
      const wx = G.torsoX(398) - 2;
      const sash = `M${n1(wx)},393 Q200,401 ${n1(400 - wx)},393 L${n1(400 - wx)},404 Q200,412 ${n1(wx)},404 Z`;
      return pair(puff) +
        `<path d="${d}" fill="${H.pat('sparkle', c, sp, 14)}"/>` +
        H.line('M178,292 Q170,340 176,392 M222,292 Q230,340 224,392 M176,408 Q172,424 174,442 M224,408 Q228,424 226,442', c, 1.6, .45) +
        `<path d="M152,300 Q148,340 152,380" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".35"/>` +
        outline(d, c) + deco +
        `<path d="${sash}" fill="${H.grad(trim)}"/>` + outline(sash, trim, 'v', 1.8) +
        `<path d="${hem}" fill="none" stroke="${ink(trim)}" stroke-width="5.6" stroke-dasharray="0 7" stroke-linecap="round"/>` +
        `<path d="${hem}" fill="none" stroke="${it.feathers ? '#e6ecf8' : '#fff8fb'}" stroke-width="4" stroke-dasharray="0 7" stroke-linecap="round"/>` +
        (it.feathers ? `<path d="M200,282 l-6,10 l6,10 l6,-10 Z" fill="${H.grad('#bcd4f6', 'r')}" stroke="${ink(trim)}" stroke-width="1.2"/>` : bow(200, 284, 9, trim));
    },
  });

  /* -------------------------------------------------------------
     Swan tutu: a flat "pancake" tutu that stands straight out, two
     layers edged with soft white feathers, silver sparkles and a
     satin band at the waist.
     colors: [tulle, shadow tint, sparkle]
     ------------------------------------------------------------- */
  DOLL.shape('cm-swan-tutu', {
    slot: 'bottom',
    thumb: [64, 388, 272, 124],
    draw(it) {
      const [c, tint, sp] = it.colors;
      const top = 402, wx = G.torsoX(top) - 5;
      /** One tulle disk from the waist out to rx, its front edge dipping to yC + drop. */
      const disk = (rx, yC, drop) => ({
        d: `M${n1(wx)},${top} C${n1(wx - 16)},${top + 26} ${200 - rx + 30},${yC - 22} ${200 - rx},${yC} Q200,${yC + drop * 2} ${200 + rx},${yC} C${170 + rx},${yC - 22} ${n1(416 - wx)},${top + 26} ${n1(400 - wx)},${top} Z`,
        at: t => [(1 - t) * (1 - t) * (200 - rx) + 2 * (1 - t) * t * 200 + t * t * (200 + rx),(1 - t) * (1 - t) * yC + 2 * (1 - t) * t * (yC + drop * 2) + t * t * yC],
      });
      /**
       * Soft overlapping feathers along a disk's front edge, pointing outward from the waist (base tucked inside
       * the edge). Each feather is a small leaf shape computed straight in doll space (no transforms), so the
       * markup stays small; one group gives them all the same fill and outline.
       */
      const feathers = (D, n, col, len) => {
        let s = '';
        for (let i = 0; i <= n; i++) {
          const [x, y] = D.at(i / n), a = Math.atan2(y - 404, x - 200), ca = Math.cos(a), sa = Math.sin(a);
          // point at u along the feather and v across it, turned to point away from the waist
          const p = (u, v) => n1(x + u * ca - v * sa) + ',' + n1(y + u * sa + v * ca);
          s += `<path d="M${p(-len * .5, 0)}C${p(-len * .2, -8)} ${p(len * .4, -8)} ${p(len * .6, 0)}C${p(len * .4, 8)} ${p(-len * .2, 8)} ${p(-len * .5, 0)}Z"/>`;
        }
        return `<g fill="${H.grad(col)}" stroke="${mix(tint, '#8a96b8', .5)}" stroke-width=".9">${s}</g>`;
      };
      const back = disk(124, 468, 18), front = disk(112, 460, 15);
      const gathers = Array.from({ length: 15 }, (_, i) => { const [x, y] = front.at(i / 14); return `M${n1(wx + (400 - 2 * wx) * i / 14)},${top + 4} L${n1(x)},${n1(y - 4)}`; }).join('');
      const spark = [[118, 462, 4.5], [150, 474, 4], [176, 452, 3.5], [138, 440, 3]].map(([x, y, r]) => twinkle(x, y, r, sp) + twinkle(400 - x, y + 3, r, sp)).join('');
      return `<path d="${back.d}" fill="${H.grad(tint)}"/>` + edge(back.d, tint, 1.6) + feathers(back, 30, mix(c, tint, .5), 24) +
        `<path d="${front.d}" fill="${H.grad(c)}"/>` + `<path d="${gathers}" stroke="${tint}" stroke-width="1.2" opacity=".7"/>` +
        `<path d="${front.d}" fill="url(#soft-h)" fill-opacity=".35" stroke="${ink(tint)}" stroke-width="1.8" stroke-linejoin="round"/>` +
        feathers(front, 28, c, 20) + spark +
        `<path d="M${n1(wx - 1)},${top - 3} H${n1(401 - wx)} L${n1(400.5 - wx)},${top + 9} H${n1(wx - .5)} Z" fill="${H.grad(tint)}" stroke="${ink(tint)}" stroke-width="1.6"/>`;
    },
  });

  /* -------------------------------------------------------------
     Ballet slippers with satin ribbons that cross up the ankle and
     tie round the leg, with a tiny bow on the outer side.
     colors: [satin, ribbon]
     ------------------------------------------------------------- */
  DOLL.shape('cm-pointe', {
    slot: 'shoes',
    thumb: [112, 644, 176, 108],
    draw(it) {
      const [c, rib = c] = it.colors;
      const foot = G.footPath('L', 2, 1);
      const open = 'M151,708 Q164,699 182,704 Q178,714 164,716 Q154,716 151,708 Z';
      const one = `<path d="${foot}" fill="${H.grad(c)}"/>` + sole('c-' + it.id, foot, FY + 12, shade(c, -.18), 20) + outline(foot, c, 'r') +
        `<path d="${foot}" fill="url(#shine)" opacity=".3"/>` +
        `<path d="${open}" fill="${SKIN.base}"/><path d="${open}" fill="url(#soft-v)" opacity=".6"/>` +
        `<path d="${open}" fill="none" stroke="${shade(c, -.15)}" stroke-width="2.4" stroke-linejoin="round"/>` +
        // ribbons: two crossing up the front of the ankle, then one round the leg
        strap('M157,706 C164,692 176,678 185,664', rib, 3.4) + strap('M184,706 C176,692 164,678 155,664', rib, 3.4) +
        strap('M154,664 Q170,670 187,663', rib, 3.4) +
        `<path d="M154,664 q-8,-6 -8,2 q0,5 8,-2 M154,664 q-4,8 -9,10 M154,664 q-1,9 -4,14" fill="none" stroke="${ink(rib)}" stroke-width="3.6" stroke-linecap="round"/>` +
        `<path d="M154,664 q-8,-6 -8,2 q0,5 8,-2 M154,664 q-4,8 -9,10 M154,664 q-1,9 -4,14" fill="none" stroke="${rib}" stroke-width="2" stroke-linecap="round"/>` +
        `<path d="M${FX - 18},${FY + 2} q-1,4 1,7" stroke="#fff" stroke-width="2.6" stroke-linecap="round" fill="none" opacity=".7"/>`;
      return pair(one);
    },
  });

  /* -------------------------------------------------------------
     Ribbon wand (held): a little stick with a golden star on top and
     two long satin ribbons swirling down from it.
     colors: [ribbon, second ribbon, star, stick]
     ------------------------------------------------------------- */
  DOLL.shape('cm-ribbon-wand', {
    slot: 'hold',
    backZ: 40,
    thumb: [258, 366, 126, 262],
    draw(it) {
      const [r1, r2, starC = '#f6cf5e', stickC = '#ffffff'] = it.colors;
      const stick = rodD(297, 482, 330, 402, 6);
      const ribA = 'M333,404 C362,414 362,452 336,460 C310,468 316,506 344,512 C368,518 364,560 338,568 C318,574 322,602 342,612';
      const ribB = 'M330,406 C350,428 344,450 326,474 C312,494 330,520 352,532 C366,542 356,578 344,590';
      /** A satin ribbon: dark edge, colour, then a thin shiny line. */
      const ribbon = (d, c, w) => strap(d, c, w) + `<path d="${d}" fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity=".55" transform="translate(-1,-1)"/>`;
      return {
        back: ribbon(ribB, r2, 4) + ribbon(ribA, r1, 6.5) +
          `<path d="${stick}" fill="${H.grad(stickC, 'h')}"/>` + edge(stick, stickC, 2) +
          `<path d="M302,474 L328,410" stroke="${mix(r1, '#ffffff', .4)}" stroke-width="2" stroke-dasharray="4 5"/>` +
          starO(332, 396, 14, starC, 1.8) + `<circle cx="327" cy="391" r="2.2" fill="#fff" opacity=".9"/>` +
          twinkle(352, 386, 5) + twinkle(312, 392, 3.5) + twinkle(362, 430, 3),
      };
    },
  });

  /* -------------------------------------------------------------
     Swan feather tiara: a silver band on the hair with soft white
     feathers fanning up (tallest in the middle) and a blue jewel.
     colors: [band metal, feathers, jewel]
     ------------------------------------------------------------- */
  DOLL.shape('cm-feather-crown', {
    slot: 'hat',
    thumb: [104, 10, 192, 112],
    draw(it) {
      const [m, fc, gem] = it.colors;
      const { cx, cy, rx, ry } = G.head;
      // point on an ellipse around the head at angle deg (off pixels outside the head edge)
      const at = (deg, off) => [cx + Math.cos(deg * Math.PI / 180) * (rx + off), cy + Math.sin(deg * Math.PI / 180) * (ry + off)];
      const band = H.polyPath(G.headArc(214, 326, 8, 24).concat(G.headArc(326, 214, 1, 24)));
      let feathers = '';
      // outer feathers first so the tall middle ones lie on top
      const angles = [232, 308, 241, 299, 250, 290, 259, 281, 270];
      for (const a of angles) {
        const [x, y] = at(a, 6), len = 16 + 22 * Math.cos((a - 270) * Math.PI / 80), w = 6 + len * .12;
        feathers += `<g transform="translate(${n1(x)},${n1(y)}) rotate(${a})"><path d="M0,0 C${n1(len * .25)},${n1(-w)} ${n1(len * .8)},${n1(-w * .8)} ${n1(len)},0 C${n1(len * .8)},${n1(w * .8)} ${n1(len * .25)},${n1(w)} 0,0 Z" fill="${H.grad(fc, 'r')}" stroke="${ink(mix(fc, m, .5))}" stroke-width="1.2"/>` +
          `<path d="M1,0 H${n1(len - 3)}" stroke="${shade(fc, -.18)}" stroke-width="1"/>` +
          `<path d="M${n1(len * .3)},0 l${n1(len * .18)},-4 M${n1(len * .5)},0 l${n1(len * .16)},4" stroke="${shade(fc, -.12)}" stroke-width=".8"/></g>`;
      }
      const [gx, gy] = at(270, 13);
      const drop = `<path d="M${gx},${n1(gy - 9)} Q${gx + 8},${n1(gy + 1)} ${gx},${n1(gy + 8)} Q${gx - 8},${n1(gy + 1)} ${gx},${n1(gy - 9)} Z" fill="${H.grad(gem, 'r')}" stroke="${ink(gem)}" stroke-width="1.4"/>` +
        `<path d="M${gx - 2},${n1(gy - 3)} l2,-3" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>`;
      const pearls = [228, 246, 294, 312].map(a => { const [x, y] = at(a, 5); return `<circle cx="${n1(x)}" cy="${n1(y)}" r="2.6" fill="${H.grad('#ffffff', 'r')}" stroke="${ink(m)}" stroke-width="1"/>`; }).join('');
      return feathers + `<path d="${band}" fill="${metal(m)}" stroke="${ink(m)}" stroke-width="2" stroke-linejoin="round"/>` +
        `<path d="${band}" fill="url(#shine)" opacity=".5"/>` + pearls + drop + twinkle(156, 64, 4) + twinkle(246, 60, 3.5);
    },
  });

  /* =====================================================================
     SUPERHERO (ofurhetja) – our own generic star hero
     ===================================================================== */

  /* -------------------------------------------------------------
     Hero eye mask: covers round the eyes with see-through eye holes,
     little upswept corners and a star on the bridge of the nose.
     colors: [mask, star]
     ------------------------------------------------------------- */
  DOLL.shape('cm-hero-mask', {
    slot: 'glasses',
    draw(it) {
      const [c, st] = it.colors;
      const [[lx, ly], [rx, ry]] = G.eyes;
      const outer = 'M130,140 Q150,141 166,143 Q200,151 234,143 Q250,141 270,140 Q267,157 262,169 C255,185 240,190 226,187 C214,183 206,177 200,175 C194,177 186,183 174,187 C160,190 145,185 138,169 Q133,157 130,140 Z';
      const holes = ellD(lx, ly, 14.5, 12) + ellD(rx, ry, 14.5, 12);
      const d = outer + holes;
      return `<path d="${d}" fill="${H.grad(c)}" fill-rule="evenodd"/>` +
        `<path d="M144,150 Q152,146 160,147 M240,147 Q248,146 256,150" stroke="#fff" stroke-width="2.4" stroke-linecap="round" fill="none" opacity=".6"/>` +
        `<path d="${d}" fill="url(#soft-v)" fill-rule="evenodd" stroke="${ink(c)}" stroke-width="2.2" stroke-linejoin="round"/>` +
        starO(200, 162, 6.5, st, 1.2);
    },
  });

  /* -------------------------------------------------------------
     Hero top: fitted long-sleeved top with a big star badge on the
     chest, glove-like cuffs, a collar band and a belt with a star buckle.
     colors: [suit, accent (star, cuffs, belt), badge disc, collar]
     ------------------------------------------------------------- */
  DOLL.shape('cm-hero-top', {
    slot: 'top',
    draw(it) {
      const [c, acc, disc = '#ffffff', collar = acc] = it.colors;
      const d = G.shirtPath({ sleeve: 1, pad: 3, sleevePad: 3, bottom: 446, neck: 'round' });
      // glove-coloured lower sleeve on the given side, with a light cuff line
      const glove = side => { const g = G.armPath(side, .74, 1, 5, 3); return `<path d="${g}" fill="${H.grad(acc)}"/>` + outline(g, acc, 'h', 2) + `<path d="${G.armPath(side, .74, .78, 5.2, 0)}" fill="${shade(acc, -.15)}" opacity=".6"/>`; };
      const wx = G.torsoX(400) - 3;
      const belt = `M${n1(wx)},397 H${n1(400 - wx)} V411 H${n1(wx)} Z`;
      return `<path d="${d}" fill="${H.grad(c)}"/>` +
        // soft side panels in a lighter tone and a shine down the front
        `<g clip-path="${H.clip('c-' + it.id, d)}"><path d="M140,300 Q150,370 142,446 L156,446 Q164,370 156,300 Z M260,300 Q250,370 258,446 L244,446 Q236,370 244,300 Z" fill="${shade(c, .18)}" opacity=".6"/></g>` +
        H.line('M118,330 q-3,24 -8,48 M282,330 q3,24 8,48', c, 1.5, .4) +
        outline(d, c) + glove('L') + glove('R') +
        `<path d="M183,250.5 Q200,270.5 217,250.5" fill="none" stroke="${ink(collar)}" stroke-width="8.6" stroke-linecap="round"/><path d="M183,250.5 Q200,270.5 217,250.5" fill="none" stroke="${collar}" stroke-width="6" stroke-linecap="round"/>` +
        // chest badge: a ring with a big star
        `<circle cx="200" cy="322" r="31" fill="${H.grad(disc, 'r')}" stroke="${ink(c)}" stroke-width="2.2"/>` +
        `<circle cx="200" cy="322" r="27" fill="none" stroke="${acc}" stroke-width="4"/>` +
        starO(200, 324, 21, acc, 2) + `<path d="M190,314 l5,-6" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".8"/>` +
        `<path d="${belt}" fill="${H.grad(acc)}"/>` + outline(belt, acc, 'v', 2) +
        `<rect x="189" y="395" width="22" height="18" rx="5" fill="${H.grad(disc)}" stroke="${ink(acc)}" stroke-width="1.8"/>` + starO(200, 404.5, 6.5, acc, 1.1);
    },
  });

  /* -------------------------------------------------------------
     Tights with a side stripe (hero leggings, magician trousers).
     it.stars = little stars along the stripe; it.loose = straight
     trouser legs instead of skin-tight.
     colors: [cloth, stripe, star]
     ------------------------------------------------------------- */
  DOLL.shape('cm-tights', {
    slot: 'bottom',
    draw(it) {
      const [c, stripe, st = '#ffffff'] = it.colors;
      const pad = it.loose ? 6 : 2;
      const d = G.pantsPath({ top: 400, bottom: it.loose ? 702 : 698, pad, flare: it.loose ? 3 : 0 });
      const clip = H.clip('c-' + it.id, d);
      // x of the outer edge of the left leg at height y (the torso edge near the hip)
      const outX = y => (y <= 476 ? Math.min(G.torsoX(y), G.legOutX(y)) : G.legOutX(y)) - pad;
      // stripe down the outer seam of the left leg (mirrored for the right)
      const L = [], R = [];
      for (let y = 410; y <= 706; y += 16) { L.push([outX(y) - 2, y]); R.push([outX(y) + 7, y]); }
      const sd = H.polyPath(L.concat(R.reverse()));
      const stars = it.stars ? [440, 500, 560, 620, 680].map(y => starO(outX(y) + 4, y, 4.2, st, .9)).join('') : '';
      return `<path d="${d}" fill="${H.grad(c)}"/>` +
        `<g clip-path="${clip}">${pair(`<path d="${sd}" fill="${H.grad(stripe)}"/>` + stars)}` +
          `<rect x="0" y="398" width="400" height="12" fill="${shade(c, -.12)}"/>` +
          `<path d="M160,500 Q156,580 162,680 L170,680 Q164,580 168,500 Z M232,500 Q236,580 230,680 L238,680 Q244,580 240,500 Z" fill="#fff" opacity=".16"/></g>` +
        H.line('M190,470 l-9,8 M210,470 l9,8 M158,570 q10,5 22,0 M220,570 q10,5 22,0', c, 1.5, .4) +
        outline(d, c, 'h');
    },
  });

  /* -------------------------------------------------------------
     Hero boots: shiny boots to mid-shin with a pointed top edge,
     a contrast trim along the top and a star on the front.
     colors: [boot, trim + star]
     ------------------------------------------------------------- */
  DOLL.shape('cm-hero-boots', {
    slot: 'shoes',
    thumb: [112, 584, 176, 168],
    draw(it) {
      const [c, acc] = it.colors;
      const top = 620, low = 716, sh = shaft(top, low, 5, 2);
      const foot = G.footPath('L', 5, 3);
      const o = sh.outer[0], i = sh.inner[0], mid = [(o[0] + i[0]) / 2, top - 20];
      const peak = `M${P(o)} L${P(mid)} L${P(i)} Z`;
      const one = `<path d="${foot}" fill="${H.grad(c)}"/>` + sole('c-' + it.id, foot, FY + 10, acc, 20) + outline(foot, c, 'r') +
        `<path d="${sh.d}" fill="${H.grad(c, 'h')}"/><path d="${peak}" fill="${H.grad(c, 'h')}"/><path d="${sh.d}" fill="url(#soft-h)"/>` +
        `<path d="${sh.edges}" fill="none" stroke="${ink(c)}" stroke-width="${SW}" stroke-linecap="round"/>` +
        strap(`M${P(o)} L${P(mid)} L${P(i)}`, acc, 4.4) +
        starO(mid[0], top + 14, 7.5, acc, 1.2) +
        `<path d="M${n1(o[0] + 5)},${top + 10} q-2,26 2,58" stroke="#fff" stroke-width="3.2" stroke-linecap="round" fill="none" opacity=".5"/>` +
        H.line('M160,700 q10,4 22,0', c, 1.6, .5);
      return pair(one);
    },
  });

  /* =====================================================================
     KNIGHT (riddari) – shiny armour, a plume, and a shield (no sword)
     ===================================================================== */

  /* -------------------------------------------------------------
     Open-face knight helmet: rounded dome with a centre ridge,
     a riveted brow rim, cheek guards over the ears and a feather plume.
     colors: [metal, plume, trim]
     ------------------------------------------------------------- */
  DOLL.shape('cm-knight-helmet', {
    slot: 'hat',
    thumb: [76, 2, 248, 214],
    draw(it) {
      const [m, plume, trim] = it.colors;
      const helm = 'M104,150 C100,74 146,40 200,40 C254,40 300,74 296,150 L294,198 Q284,214 266,208 L262,156 C260,128 238,112 200,112 C162,112 140,128 138,156 L134,208 Q116,214 106,198 Z';
      const rim = 'M136,160 C138,126 162,110 200,110 C238,110 262,126 264,160';
      const rivets = [[146, 128], [168, 114], [200, 110], [232, 114], [254, 128], [120, 176], [122, 196], [280, 176], [278, 196]]
        .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6" fill="${H.grad(trim, 'r')}" stroke="${ink(trim)}" stroke-width="1"/>`).join('');
      // feather plume rising from a little holder on top and sweeping back
      const pl = 'M196,44 C178,18 196,6 222,8 C250,10 270,30 282,58 C268,44 254,36 238,36 C250,46 256,60 256,76 C242,58 222,46 204,46 Z';
      return `<path d="${pl}" fill="${H.grad(plume)}"/>` +
        H.line('M202,40 C214,22 240,18 268,40 M206,42 C222,32 240,38 252,62', plume, 1.6, .5) +
        `<path d="M206,24 Q222,14 242,16" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".45"/>` + outline(pl, plume, 'v', 2) +
        `<path d="${helm}" fill="${metal(m)}"/>` +
        // centre ridge and cheek guard lines
        `<path d="M200,42 V108" stroke="${shade(m, -.25)}" stroke-width="6" stroke-linecap="round"/><path d="M198,46 V106" stroke="${shade(m, .5)}" stroke-width="2" stroke-linecap="round"/>` +
        H.line('M112,166 Q122,170 134,168 M288,166 Q278,170 266,168', m, 1.6, .5) +
        `<path d="M134,74 Q152,54 178,48" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".5"/>` +
        outline(helm, m) +
        strap(rim, shade(m, -.06), 6) + rivets +
        `<rect x="192" y="36" width="16" height="10" rx="3" fill="${H.grad(trim)}" stroke="${ink(trim)}" stroke-width="1.6"/>`;
    },
  });

  /* -------------------------------------------------------------
     Knight armour (top): chain-mail shirt with long sleeves, a shiny
     breastplate with a heart, layered shoulder plates, forearm
     guards and two hip plates.
     colors: [plate metal, chain mail, trim, heart]
     ------------------------------------------------------------- */
  DOLL.shape('cm-knight-armour', {
    slot: 'top',
    thumb: [62, 232, 276, 262],
    draw(it) {
      const [m, chain, trim, heart = '#e2464c'] = it.colors;
      const shirt = G.shirtPath({ sleeve: 1, pad: 5, sleevePad: 4, bottom: 462, neck: 'high' });
      const plate = 'M166,262 Q200,272 234,262 C250,272 258,296 256,326 C255,362 250,394 248,418 Q200,434 152,418 C150,394 145,362 144,326 C142,296 150,272 166,262 Z';
      const pclip = H.clip('c-' + it.id + '-pl', plate);
      const fauld1 = 'M151,414 Q200,431 249,414 L253,436 Q200,453 147,436 Z', fauld2 = 'M148,432 Q200,449 252,432 L256,456 Q200,473 144,456 Z';
      // shoulder plates (left; mirrored for the right)
      const pa = 'M170,262 C140,256 114,270 108,302 Q122,310 140,302 C142,284 154,272 174,268 Z';
      const pb = 'M110,298 Q104,314 110,326 Q126,332 142,322 Q138,312 140,300 Q124,308 110,298 Z';
      const shoulder = `<path d="${pb}" fill="${metal(m)}"/>` + outline(pb, m, 'v', 2) + `<path d="${pa}" fill="${metal(m)}"/>` + outline(pa, m, 'v', 2) +
        `<circle cx="128" cy="292" r="2.4" fill="${trim}" stroke="${ink(trim)}" stroke-width=".9"/><path d="M118,286 Q132,272 156,268" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".55"/>`;
      // armoured forearm guard on the given side, with a trim stripe
      const guard = side => { const g = G.armPath(side, .62, .95, 4.5); return `<path d="${g}" fill="${metal(m)}"/>` + outline(g, m, 'h', 2) + `<path d="${G.armPath(side, .76, .78, 4.6)}" fill="${trim}"/>`; };
      return `<path d="${shirt}" fill="${mail(chain)}"/>` + outline(shirt, chain) +
        guard('L') + guard('R') +
        `<path d="${fauld2}" fill="${metal(m)}"/>` + outline(fauld2, m, 'v', 2) + `<path d="${fauld1}" fill="${metal(m)}"/>` + outline(fauld1, m, 'v', 2) +
        `<path d="${plate}" fill="${metal(m)}"/>` +
        `<g clip-path="${pclip}"><path d="${plate}" fill="none" stroke="${trim}" stroke-width="8"/>` +
          `<path d="M200,268 V432" stroke="${shade(m, -.2)}" stroke-width="3"/><path d="M197,270 V430" stroke="${shade(m, .55)}" stroke-width="1.6"/>` +
          `<path d="M160,290 Q154,330 160,380" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".45"/></g>` +
        outline(plate, m) + heartO(200, 330, 15, heart, 1.6) +
        pair(shoulder) +
        [[158, 424], [242, 424], [154, 444], [246, 444]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.4" fill="${trim}" stroke="${ink(trim)}" stroke-width=".9"/>`).join('');
    },
  });

  /* -------------------------------------------------------------
     Knight leggings: chain-mail legs with shiny thigh plates and
     round knee guards with a little side fan.
     colors: [chain mail, plate metal, rivets]
     ------------------------------------------------------------- */
  DOLL.shape('cm-knight-legs', {
    slot: 'bottom',
    draw(it) {
      const [chain, m, riv = '#f2c34d'] = it.colors;
      const d = G.pantsPath({ top: 398, bottom: 702, pad: 3 });
      const thigh = 'M150,488 Q172,481 194,489 L192,546 Q172,553 152,546 Z';
      const knee = 'M155,562 Q171,548 187,562 Q191,577 183,591 Q171,599 159,591 Q151,577 155,562 Z';
      const fan = 'M156,566 Q141,571 145,590 Q152,586 159,580 Z';
      const one = `<path d="${thigh}" fill="${metal(m)}"/>` + outline(thigh, m, 'v', 2) +
        `<path d="M156,500 Q172,494 190,500" stroke="${shade(m, -.2)}" stroke-width="1.6" fill="none" opacity=".6"/>` +
        `<path d="${fan}" fill="${metal(m)}"/>` + outline(fan, m, 'v', 1.8) +
        `<path d="${knee}" fill="${H.grad(m, 'r')}"/>` + outline(knee, m, 'r', 2) +
        `<circle cx="171" cy="574" r="3.2" fill="${H.grad(riv, 'r')}" stroke="${ink(riv)}" stroke-width="1"/>` +
        `<circle cx="158" cy="494" r="2.2" fill="${riv}"/><circle cx="186" cy="494" r="2.2" fill="${riv}"/>` +
        `<path d="M162,560 Q170,554 180,558" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".6"/>`;
      return `<path d="${d}" fill="${mail(chain)}"/>` +
        `<g clip-path="${H.clip('c-' + it.id, d)}"><rect x="0" y="396" width="400" height="12" fill="${H.grad(shade(chain, -.25))}"/></g>` +
        outline(d, chain, 'h') + pair(one);
    },
  });

  /* -------------------------------------------------------------
     Knight boots: metal shin guards with a ridge and rivets, and
     foot plates in overlapping bands.
     colors: [metal, trim]
     ------------------------------------------------------------- */
  DOLL.shape('cm-knight-boots', {
    slot: 'shoes',
    thumb: [112, 584, 176, 168],
    draw(it) {
      const [m, trim] = it.colors;
      const top = 604, low = 716, sh = shaft(top, low, 5, 2);
      const foot = G.footPath('L', 5, 4);
      // x halfway between the left and right edge of the boot shaft at height y
      const midX = y => (shaftX(top, low, 5, 2, y, false) + shaftX(top, low, 5, 2, y, true)) / 2;
      const fclip = H.clip('c-' + it.id + '-f', foot);
      const lames = 'M154,704 Q150,718 154,734 M144,708 Q140,720 143,734 M164,702 Q160,716 163,734';
      const one = `<path d="${foot}" fill="${metal(m)}"/>` +
        `<g clip-path="${fclip}"><path d="${lames}" fill="none" stroke="${ink(m)}" stroke-width="1.6" opacity=".7"/><path d="${lames}" fill="none" stroke="#fff" stroke-width="1.2" opacity=".5" transform="translate(2,0)"/>` +
          `<rect x="${FX - 60}" y="${FY + 12}" width="120" height="20" fill="${shade(m, -.4)}"/></g>` + outline(foot, m, 'r') +
        `<path d="${sh.d}" fill="${metal(m)}"/><path d="${sh.d}" fill="url(#soft-h)" opacity=".6"/>` +
        `<path d="M${n1(midX(top + 4))},${top + 4} L${n1(midX(696))},696" stroke="${shade(m, -.22)}" stroke-width="3" stroke-linecap="round"/>` +
        `<path d="M${n1(midX(top + 4) - 2)},${top + 6} L${n1(midX(696) - 2)},694" stroke="${shade(m, .5)}" stroke-width="1.4" stroke-linecap="round"/>` +
        `<path d="${sh.edges}" fill="none" stroke="${ink(m)}" stroke-width="${SW}" stroke-linecap="round"/>` +
        strap(`M${P(sh.outer[0])} Q${n1(midX(top))},${top + 5} ${P(sh.inner[0])}`, trim, 5) +
        [[shaftX(top, low, 5, 2, 640, false) + 6, 640], [shaftX(top, low, 5, 2, 640, true) - 6, 640], [shaftX(top, low, 5, 2, 680, false) + 6, 680], [shaftX(top, low, 5, 2, 680, true) - 6, 680]]
          .map(([x, y]) => `<circle cx="${n1(x)}" cy="${y}" r="2.3" fill="${trim}" stroke="${ink(trim)}" stroke-width=".9"/>`).join('') +
        strap('M154,702 Q170,708 186,701', shade(m, -.1), 3);
      return pair(one);
    },
  });

  /* -------------------------------------------------------------
     Shield (held by its top edge): a pointed shield with a metal
     rim and rivets, and a crest – a big heart, or a friendly lion face.
     colors: [field, rim, heart (heart crest) | mane (lion crest)]; it.crest = 'heart' | 'lion'
     ------------------------------------------------------------- */
  DOLL.shape('cm-shield', {
    slot: 'hold',
    backZ: 40,
    thumb: [262, 432, 116, 152],
    draw(it) {
      const [field, rim, emb] = it.colors;
      const outer = 'M279,452 Q319,444 359,452 L359,492 C359,532 341,560 319,577 C297,560 279,532 279,492 Z';
      const inner = 'M287,460 Q319,453 351,460 L351,492 C351,526 336,550 319,565 C302,550 287,526 287,492 Z';
      const iclip = H.clip('c-' + it.id, inner);
      let crest;
      if (it.crest === 'lion') {
        // friendly lion: a round mane of tufts, golden face, ears, eyes, muzzle and a smile
        const cx = 319, cy = 507;
        let mane = '';
        for (let a = 0; a < 360; a += 30) { const x = cx + Math.cos(a * Math.PI / 180) * 18, y = cy + Math.sin(a * Math.PI / 180) * 18; mane += `<circle cx="${n1(x)}" cy="${n1(y)}" r="9" fill="${H.grad(emb, 'r')}" stroke="${ink(emb)}" stroke-width="1.3"/>`; }
        const face = '#f6c35a';
        crest = mane + `<circle cx="${cx}" cy="${cy}" r="18" fill="${H.grad(emb, 'r')}"/>` +
          `<circle cx="${cx - 11}" cy="${cy - 12}" r="5" fill="${face}" stroke="${ink(face)}" stroke-width="1.2"/><circle cx="${cx + 11}" cy="${cy - 12}" r="5" fill="${face}" stroke="${ink(face)}" stroke-width="1.2"/>` +
          `<circle cx="${cx - 11}" cy="${cy - 12}" r="2.2" fill="#f4a3a0"/><circle cx="${cx + 11}" cy="${cy - 12}" r="2.2" fill="#f4a3a0"/>` +
          `<circle cx="${cx}" cy="${cy + 1}" r="14" fill="${H.grad(face, 'r')}" stroke="${ink(face)}" stroke-width="1.4"/>` +
          `<circle cx="${cx - 5.5}" cy="${cy - 2}" r="2.2" fill="#3a2a2a"/><circle cx="${cx + 5.5}" cy="${cy - 2}" r="2.2" fill="#3a2a2a"/>` +
          `<circle cx="${cx - 4.8}" cy="${cy - 2.8}" r=".8" fill="#fff"/><circle cx="${cx + 6.2}" cy="${cy - 2.8}" r=".8" fill="#fff"/>` +
          `<ellipse cx="${cx}" cy="${cy + 6}" rx="7" ry="5" fill="#fbe7b8"/>` +
          `<path d="M${cx - 3},${cy + 2.5} h6 l-3,3 Z" fill="#9a5a4a"/>` +
          `<path d="M${cx},${cy + 5.5} v2 M${cx - 4},${cy + 8} q4,3 8,0" stroke="#9a5a4a" stroke-width="1.2" fill="none" stroke-linecap="round"/>` +
          `<ellipse cx="${cx - 9}" cy="${cy + 4}" rx="2.6" ry="1.6" fill="#f28a8c" opacity=".5"/><ellipse cx="${cx + 9}" cy="${cy + 4}" rx="2.6" ry="1.6" fill="#f28a8c" opacity=".5"/>`;
      } else {
        crest = heartO(319, 506, 21, emb, 1.8);
      }
      return {
        back: `<path d="${outer}" fill="${metal(rim)}"/>` + outline(outer, rim, 'v', 2.2) +
          `<path d="${inner}" fill="${H.grad(field)}"/>` +
          `<g clip-path="${iclip}"><path d="M287,460 L351,524 L351,540 L287,476 Z" fill="${shade(field, .14)}" opacity=".7"/>` +
            `<path d="M292,470 Q296,520 314,556" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".3"/></g>` +
          edge(inner, field, 1.6) + crest +
          [[285, 457], [353, 457], [319, 571], [284, 520], [354, 520]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.2" fill="${shade(rim, .4)}" stroke="${ink(rim)}" stroke-width=".9"/>`).join(''),
      };
    },
  });

  /* =====================================================================
     MAGICIAN (töframaður)
     ===================================================================== */

  /* -------------------------------------------------------------
     Top hat: tall crown with a lighter top, a band with a star, and a
     brim that curls up at the sides.
     colors: [hat, band, star, motif (for it.pattern)]
     ------------------------------------------------------------- */
  DOLL.shape('cm-top-hat', {
    slot: 'hat',
    thumb: [84, 0, 232, 140],
    draw(it) {
      const [c, band, star, motif = '#fbe38a'] = it.colors;
      const fill = it.pattern ? H.pat(it.pattern, c, motif, 24) : H.grad(c, 'h');
      const crown = 'M128,98 C132,70 130,40 124,14 Q200,24 276,14 C270,40 268,70 272,98 Z';
      const lid = 'M124,14 Q200,24 276,14 Q200,2 124,14 Z';
      const bandD = 'M129,74 Q200,84 271,74 L271,96 Q200,106 129,96 Z';
      const brim = 'M94,100 Q98,84 124,92 Q200,104 276,92 Q302,84 306,100 Q308,114 284,118 Q200,130 116,118 Q92,114 94,100 Z';
      return `<path d="${crown}" fill="${fill}"/>` +
        `<path d="M146,22 Q150,56 146,90" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".3"/>` +
        outline(crown, c, 'h') +
        `<path d="${lid}" fill="${H.grad(shade(c, .2))}"/>` + edge(lid, c, 2) +
        `<path d="${bandD}" fill="${H.grad(band)}"/>` + outline(bandD, band, 'v', 2) +
        starO(160, 86, 10, star, 1.6) + twinkle(176, 78, 3) +
        `<path d="${brim}" fill="${H.grad(shade(c, .06))}"/>` +
        `<path d="M110,112 Q200,124 290,112" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".3"/>` +
        outline(brim, c);
    },
  });

  /* -------------------------------------------------------------
     Magician's tailcoat (jacket): long sleeves with satin cuffs,
     satin lapels, white shirt front with a bow tie, a gold button at
     the waist, a hanky in the pocket and two long tails at the back.
     colors: [coat, satin (lapels, cuffs), shirt, bow tie, buttons, motif (for it.pattern)]
     ------------------------------------------------------------- */
  DOLL.shape('cm-tailcoat', {
    slot: 'jacket',
    thumb: [50, 228, 300, 410],
    draw(it) {
      const [c, satin, shirt = '#ffffff', tie = '#d8364a', btn = '#f2c34d', motif = '#fbe38a'] = it.colors;
      const fill = it.pattern ? H.pat(it.pattern, c, motif, 26) : H.grad(c);
      const body = G.shirtPath({ sleeve: 1, pad: 9, sleevePad: 6, bottom: 406, neck: 'v', neckDepth: 150 });
      const front = 'M180,250 L220,250 L214,410 L186,410 Z';
      // front skirt panels sweeping back from the waist (left; mirrored)
      const skirt = 'M137,398 L186,404 C172,428 158,452 150,476 L130,472 C131,446 133,420 137,398 Z';
      // long tails behind the legs (drawn behind the body)
      const tail = 'M146,404 C130,472 116,552 120,628 Q140,636 158,620 C166,546 178,474 194,408 Z';
      const lapel = 'M184,250 Q166,262 160,292 Q170,330 196,394 L199,397 L192,358 Q182,320 184,284 Q186,266 195,256 Z';
      // satin cuff at the wrist of the given side
      const cuff = side => { const g = G.armPath(side, .88, 1, 7.5); return `<path d="${g}" fill="${H.grad(satin)}"/>` + outline(g, satin, 'h', 2); };
      const bowtie = `<path d="M200,262 l-14,-8 v16 Z M200,262 l14,-8 v16 Z" fill="${H.grad(tie)}" stroke="${ink(tie)}" stroke-width="1.6" stroke-linejoin="round"/><circle cx="200" cy="262" r="4" fill="${shade(tie, .15)}" stroke="${ink(tie)}" stroke-width="1.4"/>`;
      return {
        back: pair(`<path d="${tail}" fill="${fill}"/>` + H.line('M150,440 Q138,520 136,600', c, 1.6, .4) + outline(tail, c, 'h')),
        front: `<path d="${front}" fill="${H.grad(shirt)}"/>` +
          H.line('M193,284 V404 M207,284 V404', shirt, 1.2, .35) +
          [300, 330, 360].map(y => `<circle cx="200" cy="${y}" r="2.4" fill="#fff" stroke="${ink(shirt)}" stroke-width="1"/>`).join('') +
          pair(`<path d="${skirt}" fill="${fill}"/>` + outline(skirt, c, 'h')) +
          `<path d="${body}" fill="${fill}"/>` +
          H.line('M150,330 q6,14 3,30 M250,330 q-6,14 -3,30 M118,330 q-4,30 -10,60 M282,330 q4,30 10,60', c, 1.6, .45) +
          outline(body, c) + cuff('L') + cuff('R') +
          pair(`<path d="${lapel}" fill="${H.grad(satin)}"/>` + `<path d="M168,300 Q176,330 192,370" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".4"/>` + outline(lapel, satin, 'v', 2)) +
          // red hanky peeping out of the breast pocket
          `<path d="M224,318 h22" stroke="${ink(c)}" stroke-width="2" stroke-linecap="round"/>` +
          `<path d="M227,318 Q226,308 232,309 Q235,302 240,307 Q246,306 244,318 Z" fill="${H.grad(tie)}" stroke="${ink(tie)}" stroke-width="1.2" stroke-linejoin="round"/>` +
          bowtie +
          `<circle cx="200" cy="401" r="4.6" fill="${H.grad(btn, 'r')}" stroke="${ink(btn)}" stroke-width="1.3"/>` +
          pair(`<circle cx="176" cy="430" r="3.4" fill="${H.grad(btn, 'r')}" stroke="${ink(btn)}" stroke-width="1.1"/>`),
      };
    },
  });

  /* -------------------------------------------------------------
     Magic top hat with a bunny (held): an upside-down top hat she
     holds by the brim, with a white bunny peeking out, paws on the edge.
     colors: [hat, band, bunny]
     ------------------------------------------------------------- */
  DOLL.shape('cm-bunny-hat', {
    slot: 'hold',
    backZ: 40,
    thumb: [270, 390, 120, 172],
    draw(it) {
      const [c, band, bun = '#ffffff'] = it.colors;
      const crown = 'M304,478 L299,546 Q332,558 365,546 L360,478 Z';
      const bandD = 'M304,480 Q332,488 360,480 L359,494 Q332,502 305,494 Z';
      const earL = 'M322,446 C312,426 312,404 318,398 C324,394 330,410 330,442 Z', earR = 'M336,442 C338,414 348,398 356,402 C362,408 352,428 344,448 Z';
      const head = ellD(332, 457, 17, 15);
      const pink = '#f4a3c0';
      return {
        back: `<path d="${crown}" fill="${H.grad(c, 'h')}"/>` + outline(crown, c, 'h') +
          `<path d="M312,500 Q310,526 308,544" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".3"/>` +
          `<path d="${bandD}" fill="${H.grad(band)}"/>` + outline(bandD, band, 'v', 1.8) +
          // the hat opening (dark inside), then the bunny, then the near edge of the brim
          `<ellipse cx="332" cy="474" rx="35" ry="9" fill="${H.grad(shade(c, .06))}" stroke="${ink(c)}" stroke-width="2"/>` +
          `<ellipse cx="332" cy="474" rx="28" ry="5.5" fill="${shade(c, -.5)}"/>` +
          `<path d="${earL}${earR}" fill="${H.grad(bun)}" stroke="${ink('#d9cfe0')}" stroke-width="1.8"/>` +
          `<path d="M322,440 C317,424 318,410 320,404 C324,414 326,428 326,440 Z M340,440 C343,422 349,410 352,406 C353,416 347,430 343,442 Z" fill="${pink}" opacity=".8"/>` +
          `<path d="${head}" fill="${H.grad(bun, 'r')}"/>` + outline(head, '#d9cfe0', 'r', 1.8) +
          `<circle cx="326" cy="455" r="2.4" fill="#2a2430"/><circle cx="338" cy="455" r="2.4" fill="#2a2430"/><circle cx="326.8" cy="454.2" r=".8" fill="#fff"/><circle cx="338.8" cy="454.2" r=".8" fill="#fff"/>` +
          `<path d="M330,460 h4 l-2,2.6 Z" fill="${pink}"/><path d="M332,462.6 v1.6 M329,465 q3,2 6,0" stroke="#b8869a" stroke-width="1.1" fill="none" stroke-linecap="round"/>` +
          `<ellipse cx="322" cy="462" rx="3.4" ry="2" fill="${pink}" opacity=".6"/><ellipse cx="342" cy="462" rx="3.4" ry="2" fill="${pink}" opacity=".6"/>` +
          // near half of the brim over the bunny's chin, and two little paws on it
          `<path d="M297,474 A35,9 0 0 0 367,474 L360,474 A28,5.5 0 0 1 304,474 Z" fill="${H.grad(shade(c, .06))}" stroke="${ink(c)}" stroke-width="1.6"/>` +
          `<ellipse cx="322" cy="475" rx="5" ry="3.6" fill="${bun}" stroke="#c9bdd4" stroke-width="1.2"/><ellipse cx="343" cy="475" rx="5" ry="3.6" fill="${bun}" stroke="#c9bdd4" stroke-width="1.2"/>` +
          twinkle(366, 440, 5) + twinkle(304, 428, 3.5),
      };
    },
  });

  /* -------------------------------------------------------------
     Magic wand (held): a black stick with white tips, with gold
     sparkles twinkling round the top.
     colors: [stick, tips, sparkles]
     ------------------------------------------------------------- */
  DOLL.shape('cm-magic-wand', {
    slot: 'hold',
    backZ: 40,
    thumb: [262, 360, 120, 150],
    draw(it) {
      const [c, tip, sp] = it.colors;
      const x0 = 292, y0 = 488, x1 = 342, y1 = 392, L = Math.hypot(x1 - x0, y1 - y0), ux = (x1 - x0) / L, uy = (y1 - y0) / L;
      const stick = rodD(x0, y0, x1, y1, 7);
      const tipA = rodD(x0, y0, x0 + ux * 14, y0 + uy * 14, 7.4), tipB = rodD(x1 - ux * 16, y1 - uy * 16, x1, y1, 7.4);
      return {
        back: `<path d="M342,392 Q356,376 370,384 Q382,394 372,404" fill="none" stroke="${sp}" stroke-width="2" stroke-dasharray="1 5" stroke-linecap="round"/>` +
          `<path d="${stick}" fill="${H.grad(c, 'h')}"/>` + edge(stick, c, 2) +
          `<path d="${tipA}" fill="${H.grad(tip, 'h')}"/>` + edge(tipA, '#9a92a8', 1.6) +
          `<path d="${tipB}" fill="${H.grad(tip, 'h')}"/>` + edge(tipB, '#9a92a8', 1.6) +
          `<path d="M${n1(x0 + ux * 18 - 2)},${n1(y0 + uy * 18)} L${n1(x1 - ux * 20 - 2)},${n1(y1 - uy * 20)}" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity=".45"/>` +
          starO(356, 374, 7, sp, 1.2) + starO(330, 374, 4.5, sp, 1) + twinkle(364, 396, 5) + twinkle(346, 360, 4, sp) + twinkle(318, 388, 3),
      };
    },
  });

  /* =====================================================================
     Catalog
     ===================================================================== */
  DOLL.add([
    // witch
    { id: 'hat-witch-purple', shape: 'cm-witch-hat', cat: 'hat', name: { is: 'Fjólublár nornahattur', en: 'Purple witch hat' }, colors: ['#8e5bd0', '#7fd36b', '#ffd45e'] },
    { id: 'hat-witch-green', shape: 'cm-witch-hat', cat: 'hat', name: { is: 'Grænn nornahattur', en: 'Green witch hat' }, colors: ['#4fae6a', '#ff9f43', '#ffd45e'] },
    { id: 'hat-witch-stars', shape: 'cm-witch-hat', cat: 'hat', name: { is: 'Stjörnunornahattur', en: 'Starry witch hat' }, colors: ['#3d3358', '#b28cf0', '#ffd45e', '#f7d65a'], pattern: 'stars' },
    { id: 'frock-witch-purple', shape: 'cm-witch-dress', cat: 'frock', name: { is: 'Fjólublár nornakjóll', en: 'Purple witch dress' }, colors: ['#9a6ad6', '#7fd36b', '#ffd45e'] },
    { id: 'frock-witch-green', shape: 'cm-witch-dress', cat: 'frock', name: { is: 'Grænn nornakjóll', en: 'Green witch dress' }, colors: ['#58b56c', '#ff9f43', '#ffe066'] },
    { id: 'frock-witch-stars', shape: 'cm-witch-dress', cat: 'frock', name: { is: 'Stjörnunornakjóll', en: 'Starry witch dress' }, colors: ['#3d3358', '#b28cf0', '#ffd45e', '#f7d65a'], pattern: 'stars' },
    { id: 'shoes-witch-purple', shape: 'cm-witch-shoes', cat: 'shoes', name: { is: 'Nornaskór með fjólubláum röndum', en: 'Witch shoes, purple stripes' }, colors: ['#3d3358', '#9a6ad6', '#ffffff'] },
    { id: 'shoes-witch-green', shape: 'cm-witch-shoes', cat: 'shoes', name: { is: 'Nornaskór með grænum röndum', en: 'Witch shoes, green stripes' }, colors: ['#5a3e8a', '#58b56c', '#ffe066'] },
    { id: 'hold-witch-broom', shape: 'cm-broom', cat: 'hold', name: { is: 'Nornakústur', en: 'Witch broom' }, colors: ['#a8703f', '#ecc66a', '#b07ce8'] },
    { id: 'hold-witch-cat', shape: 'cm-cat-plush', cat: 'hold', name: { is: 'Svört tuskukisa', en: 'Black cat plush' }, colors: ['#3a3346', '#b28cf0', '#9fdc6a'] },
    // pirate
    { id: 'hat-pirate-tricorn', shape: 'cm-tricorn', cat: 'hat', name: { is: 'Sjóræningjahattur', en: 'Pirate hat' }, colors: ['#3a3346', '#f2c34d', '#e2464c', '#ffffff'] },
    { id: 'hat-pirate-bandana', shape: 'cm-bandana', cat: 'hat', name: { is: 'Sjóræningjaklútur', en: 'Pirate bandana' }, colors: ['#2f6fc4', '#ffffff'] },
    { id: 'top-pirate-red', shape: 'cm-pirate-top', cat: 'top', name: { is: 'Rauð sjóræningjaskyrta', en: 'Red pirate shirt' }, colors: ['#d8364a', '#f6c343', '#fff7ea', '#f2c34d'] },
    { id: 'top-pirate-blue', shape: 'cm-pirate-top', cat: 'top', name: { is: 'Blá sjóræningjaskyrta', en: 'Blue pirate shirt' }, colors: ['#2f6fc4', '#e2464c', '#ffffff', '#f2c34d'], stripes: '#7fb3e8' },
    { id: 'pants-pirate-stripes', shape: 'cm-pirate-pants', cat: 'pants', name: { is: 'Röndóttar sjóræningjabuxur', en: 'Striped pirate trousers' }, colors: ['#ffffff', '#e2464c', '#3a3346'], pattern: 'stripes', patternSize: 18 },
    { id: 'pants-pirate-tan', shape: 'cm-pirate-pants', cat: 'pants', name: { is: 'Ljósar sjóræningjabuxur', en: 'Sand pirate trousers' }, colors: ['#e9d3a8', '#ffffff', '#a8703f'] },
    { id: 'boots-pirate-black', shape: 'cm-pirate-boots', cat: 'boots', name: { is: 'Svört sjóræningjastígvél', en: 'Black pirate boots' }, colors: ['#3a3346', '#55506a', '#f2c34d'] },
    { id: 'boots-pirate-brown', shape: 'cm-pirate-boots', cat: 'boots', name: { is: 'Brún sjóræningjastígvél', en: 'Brown pirate boots' }, colors: ['#8a5232', '#a8683e', '#f2c34d'] },
    { id: 'hold-pirate-spyglass', shape: 'cm-spyglass', cat: 'hold', name: { is: 'Sjónauki', en: 'Spyglass' }, colors: ['#e8b84a', '#8a5232'] },
    { id: 'hold-pirate-map', shape: 'cm-map', cat: 'hold', name: { is: 'Fjársjóðskort', en: 'Treasure map' }, colors: ['#f6e3b4', '#d8364a'] },
    // ballerina
    { id: 'top-ballet-pink', shape: 'cm-leotard', cat: 'top', name: { is: 'Bleikur ballettbolur', en: 'Pink ballet leotard' }, colors: ['#f7a6c2', '#ffffff', '#e8708f', '#ffe6ef'] },
    { id: 'top-ballet-lilac', shape: 'cm-leotard', cat: 'top', name: { is: 'Ljósfjólublár ballettbolur', en: 'Lilac ballet leotard' }, colors: ['#c3a8f0', '#ffffff', '#8f6fd6', '#efe6ff'] },
    { id: 'top-ballet-swan', shape: 'cm-leotard', cat: 'top', name: { is: 'Hvítur svanabolur', en: 'White swan leotard' }, colors: ['#ffffff', '#b9c6e0', '#9fb2d6', '#ffffff'], feathers: true },
    { id: 'skirt-tutu-swan', shape: 'cm-swan-tutu', cat: 'skirt', name: { is: 'Svanaballettpils', en: 'Swan tutu' }, colors: ['#ffffff', '#dfe8f7', '#b9c6e0'] },
    { id: 'shoes-ballet-ribbon-pink', shape: 'cm-pointe', cat: 'shoes', name: { is: 'Bleikir táskór', en: 'Pink ballet slippers with ribbons' }, colors: ['#f7b8c9', '#f48cb0'] },
    { id: 'shoes-ballet-ribbon-lilac', shape: 'cm-pointe', cat: 'shoes', name: { is: 'Ljósfjólubláir táskór', en: 'Lilac ballet slippers with ribbons' }, colors: ['#d4c2f4', '#a98be0'] },
    { id: 'shoes-ballet-ribbon-white', shape: 'cm-pointe', cat: 'shoes', name: { is: 'Hvítir táskór', en: 'White ballet slippers with ribbons' }, colors: ['#f6f7fb', '#c9d6ee'] },
    { id: 'hold-ballet-ribbon-pink', shape: 'cm-ribbon-wand', cat: 'hold', name: { is: 'Bleikur borðasproti', en: 'Pink ribbon wand' }, colors: ['#f48cb0', '#ffd1e0', '#f6cf5e', '#ffffff'] },
    { id: 'hold-ballet-ribbon-lilac', shape: 'cm-ribbon-wand', cat: 'hold', name: { is: 'Ljósfjólublár borðasproti', en: 'Lilac ribbon wand' }, colors: ['#a98be0', '#f7b8d4', '#f6cf5e', '#ffffff'] },
    { id: 'hold-ballet-ribbon-silver', shape: 'cm-ribbon-wand', cat: 'hold', name: { is: 'Silfraður borðasproti', en: 'Silver ribbon wand' }, colors: ['#9fc4ec', '#ffffff', '#dfe5ef', '#ffffff'] },
    { id: 'crown-ballet-swan', shape: 'cm-feather-crown', cat: 'crown', name: { is: 'Svanakóróna', en: 'Swan feather tiara' }, colors: ['#d9dde8', '#ffffff', '#7fb8ec'] },
    // superhero
    { id: 'glasses-hero-teal', shape: 'cm-hero-mask', cat: 'glasses', name: { is: 'Grænblá hetjugríma', en: 'Teal hero mask' }, colors: ['#1fa6a0', '#f6c343'] },
    { id: 'glasses-hero-pink', shape: 'cm-hero-mask', cat: 'glasses', name: { is: 'Bleik hetjugríma', en: 'Pink hero mask' }, colors: ['#f48cb6', '#ffffff'] },
    { id: 'top-hero-teal', shape: 'cm-hero-top', cat: 'top', name: { is: 'Grænblár hetjubolur', en: 'Teal hero top' }, colors: ['#1fa6a0', '#f6c343', '#ffffff', '#f6c343'] },
    { id: 'top-hero-purple', shape: 'cm-hero-top', cat: 'top', name: { is: 'Fjólublár hetjubolur', en: 'Purple hero top' }, colors: ['#7a52c8', '#f48cb6', '#ffffff', '#f48cb6'] },
    { id: 'pants-hero-teal', shape: 'cm-tights', cat: 'pants', name: { is: 'Grænbláar hetjubuxur', en: 'Teal hero tights' }, colors: ['#1a8f8a', '#f6c343', '#ffffff'], stars: true },
    { id: 'pants-hero-purple', shape: 'cm-tights', cat: 'pants', name: { is: 'Fjólubláar hetjubuxur', en: 'Purple hero tights' }, colors: ['#6a46b4', '#f48cb6', '#ffffff'], stars: true },
    { id: 'boots-hero-yellow', shape: 'cm-hero-boots', cat: 'boots', name: { is: 'Gul hetjustígvél', en: 'Yellow hero boots' }, colors: ['#f6c343', '#1fa6a0'] },
    { id: 'boots-hero-pink', shape: 'cm-hero-boots', cat: 'boots', name: { is: 'Bleik hetjustígvél', en: 'Pink hero boots' }, colors: ['#f48cb6', '#7a52c8'] },
    { id: 'cape-hero-pink', shape: 'cape', cat: 'cape', name: { is: 'Bleik ofurhetjuskikkja', en: 'Pink hero cape' }, colors: ['#f48cb6', '#7a52c8', '#f6c343', '#ffffff'], hem: 'zig', step: 46, amp: 26, hemY: 650, motif: 'none', collar: 'stand', clasp: 'star' },
    // knight
    { id: 'hat-knight-silver', shape: 'cm-knight-helmet', cat: 'hat', name: { is: 'Silfraður riddarahjálmur', en: 'Silver knight helmet' }, colors: ['#c9d1dc', '#e2464c', '#f2c34d'] },
    { id: 'hat-knight-gold', shape: 'cm-knight-helmet', cat: 'hat', name: { is: 'Gylltur riddarahjálmur', en: 'Gold knight helmet' }, colors: ['#f2c34d', '#5b8fe0', '#e9edf3'] },
    { id: 'top-knight-silver', shape: 'cm-knight-armour', cat: 'top', name: { is: 'Silfruð riddarabrynja', en: 'Silver knight armour' }, colors: ['#c9d1dc', '#a3abb8', '#f2c34d', '#e2464c'] },
    { id: 'top-knight-gold', shape: 'cm-knight-armour', cat: 'top', name: { is: 'Gyllt riddarabrynja', en: 'Gold knight armour' }, colors: ['#f2c34d', '#b3bac6', '#e9edf3', '#5b8fe0'] },
    { id: 'pants-knight-silver', shape: 'cm-knight-legs', cat: 'pants', name: { is: 'Silfraðar riddarabuxur', en: 'Silver knight leggings' }, colors: ['#a3abb8', '#c9d1dc', '#f2c34d'] },
    { id: 'pants-knight-gold', shape: 'cm-knight-legs', cat: 'pants', name: { is: 'Gylltar riddarabuxur', en: 'Gold knight leggings' }, colors: ['#b3bac6', '#f2c34d', '#e9edf3'] },
    { id: 'boots-knight-silver', shape: 'cm-knight-boots', cat: 'boots', name: { is: 'Silfruð riddarastígvél', en: 'Silver knight boots' }, colors: ['#c9d1dc', '#f2c34d'] },
    { id: 'boots-knight-gold', shape: 'cm-knight-boots', cat: 'boots', name: { is: 'Gyllt riddarastígvél', en: 'Gold knight boots' }, colors: ['#f2c34d', '#e9edf3'] },
    { id: 'hold-knight-shield-heart', shape: 'cm-shield', cat: 'hold', name: { is: 'Hjartaskjöldur', en: 'Heart shield' }, colors: ['#5b8fe0', '#c9d1dc', '#e2464c'], crest: 'heart' },
    { id: 'hold-knight-shield-lion', shape: 'cm-shield', cat: 'hold', name: { is: 'Ljónaskjöldur', en: 'Lion shield' }, colors: ['#d8364a', '#f2c34d', '#e0862e'], crest: 'lion' },
    { id: 'cape-knight-red', shape: 'cape', cat: 'cape', name: { is: 'Rauð riddaraskikkja', en: 'Red knight cape' }, colors: ['#c8323f', '#f2c34d', '#f2c34d', '#ffffff'], hem: 'flat', hemY: 690, motif: 'none', collar: 'stand', clasp: 'heart' },
    // magician
    { id: 'hat-magician-black', shape: 'cm-top-hat', cat: 'hat', name: { is: 'Svartur pípuhattur', en: 'Black top hat' }, colors: ['#2e2a3a', '#d8364a', '#f2c34d'] },
    { id: 'hat-magician-stars', shape: 'cm-top-hat', cat: 'hat', name: { is: 'Stjörnupípuhattur', en: 'Starry top hat' }, colors: ['#24306e', '#f2c34d', '#fbe38a', '#fbe38a'], pattern: 'stars' },
    { id: 'jacket-magician-black', shape: 'cm-tailcoat', cat: 'jacket', name: { is: 'Svartur töframannsjakki', en: 'Black magician tailcoat' }, colors: ['#2e2a3a', '#c8323f', '#ffffff', '#d8364a', '#f2c34d'] },
    { id: 'jacket-magician-stars', shape: 'cm-tailcoat', cat: 'jacket', name: { is: 'Stjörnutöframannsjakki', en: 'Starry magician tailcoat' }, colors: ['#24306e', '#3c4ea0', '#ffffff', '#f2c34d', '#f2c34d', '#fbe38a'], pattern: 'stars' },
    { id: 'pants-magician-black', shape: 'cm-tights', cat: 'pants', name: { is: 'Svartar sparibuxur', en: 'Black magician trousers' }, colors: ['#2e2a3a', '#c8323f'], loose: true },
    { id: 'pants-magician-blue', shape: 'cm-tights', cat: 'pants', name: { is: 'Dökkbláar sparibuxur', en: 'Midnight blue magician trousers' }, colors: ['#24306e', '#f2c34d', '#fbe38a'], loose: true },
    { id: 'cape-magician-red', shape: 'cape', cat: 'cape', name: { is: 'Rauð töframannsskikkja', en: 'Red magician cape' }, colors: ['#c8323f', '#2e2a3a', '#f2c34d', '#f2c34d'], hem: 'flat', hemY: 690, motif: 'none', collar: 'stand', clasp: 'star' },
    { id: 'hold-magician-hat', shape: 'cm-bunny-hat', cat: 'hold', name: { is: 'Töfrahattur með kanínu', en: 'Magic hat with a bunny' }, colors: ['#2e2a3a', '#d8364a', '#ffffff'] },
    { id: 'hold-magician-wand', shape: 'cm-magic-wand', cat: 'hold', name: { is: 'Töfrasproti', en: 'Magic wand' }, colors: ['#2e2a3a', '#ffffff', '#f6cf5e'] },
  ]);

  /* Costume looks (first item = the tile icon) */
  DOLL.look([
    { id: 'look-witch-purple', name: { is: 'Fjólublá norn', en: 'Purple witch' }, items: ['hat-witch-purple', 'frock-witch-purple', 'shoes-witch-purple', 'hold-witch-broom'] },
    { id: 'look-witch-green', name: { is: 'Græn norn', en: 'Green witch' }, items: ['hat-witch-green', 'frock-witch-green', 'shoes-witch-green', 'hold-witch-broom'] },
    { id: 'look-witch-stars', name: { is: 'Stjörnunorn', en: 'Starry witch' }, items: ['hat-witch-stars', 'frock-witch-stars', 'shoes-witch-purple', 'hold-witch-cat'] },
    { id: 'look-pirate-red', name: { is: 'Rauður sjóræningi', en: 'Red pirate' }, items: ['hat-pirate-tricorn', 'top-pirate-red', 'pants-pirate-stripes', 'boots-pirate-black', 'hold-pirate-spyglass'] },
    { id: 'look-pirate-blue', name: { is: 'Blár sjóræningi', en: 'Blue pirate' }, items: ['hat-pirate-bandana', 'top-pirate-blue', 'pants-pirate-tan', 'boots-pirate-brown', 'hold-pirate-map'] },
    { id: 'look-ballerina-pink', name: { is: 'Bleik ballerína', en: 'Pink ballerina' }, items: ['tutu-pink', 'top-ballet-pink', 'crown-tiara-rose', 'shoes-ballet-ribbon-pink', 'hold-ballet-ribbon-pink'] },
    { id: 'look-ballerina-lilac', name: { is: 'Ljósfjólublá ballerína', en: 'Lilac ballerina' }, items: ['tutu-lilac', 'top-ballet-lilac', 'crown-tiara-silver', 'shoes-ballet-ribbon-lilac', 'hold-ballet-ribbon-lilac'] },
    { id: 'look-ballerina-swan', name: { is: 'Svanaballerína', en: 'White swan ballerina' }, items: ['skirt-tutu-swan', 'top-ballet-swan', 'crown-ballet-swan', 'shoes-ballet-ribbon-white', 'hold-ballet-ribbon-silver'] },
    { id: 'look-hero-teal', name: { is: 'Grænblá ofurhetja', en: 'Teal superhero' }, items: ['top-hero-teal', 'glasses-hero-teal', 'cape-hero', 'pants-hero-teal', 'boots-hero-yellow'] },
    { id: 'look-hero-pink', name: { is: 'Bleik ofurhetja', en: 'Pink superhero' }, items: ['top-hero-purple', 'glasses-hero-pink', 'cape-hero-pink', 'pants-hero-purple', 'boots-hero-pink'] },
    { id: 'look-knight-silver', name: { is: 'Silfurriddari', en: 'Silver knight' }, items: ['hat-knight-silver', 'top-knight-silver', 'pants-knight-silver', 'boots-knight-silver', 'cape-knight-red', 'hold-knight-shield-heart'] },
    { id: 'look-knight-gold', name: { is: 'Gullriddari', en: 'Gold knight' }, items: ['hat-knight-gold', 'top-knight-gold', 'pants-knight-gold', 'boots-knight-gold', 'cape-velvet', 'hold-knight-shield-lion'] },
    { id: 'look-magician-black', name: { is: 'Töframaður', en: 'Magician' }, items: ['hat-magician-black', 'jacket-magician-black', 'pants-magician-black', 'boots-riding-black', 'cape-magician-red', 'hold-magician-hat'] },
    { id: 'look-magician-stars', name: { is: 'Stjörnutöframaður', en: 'Starry magician' }, items: ['hat-magician-stars', 'jacket-magician-stars', 'pants-magician-blue', 'boots-riding-black', 'cape-stars', 'hold-magician-wand'] },
  ]);
})();
