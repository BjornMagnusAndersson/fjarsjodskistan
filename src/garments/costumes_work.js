/* =====================================================================
   Work costumes: firefighter, police, bus driver, pilot, astronaut,
   builder and farmer. Every piece is a normal item in its own chest tab
   (hat, jacket, top, pants, boots, hold), and each costume variation is
   registered as a finished look for the "Búningar" tab.
   Same style as examples.js: fill → details → soft shading → tinted outline.
   Friendly toys only: no weapons, nothing scary, no logos or text.
   Shape names start with "cw-" (costumes, work).
   ===================================================================== */
(function () {
  'use strict';
  const { shade, ink } = H;
  const SW = G.stroke;

  /* ---------------------------------------------------------------
     Small helpers
     --------------------------------------------------------------- */
  const n1 = v => (Math.round(v * 10) / 10).toString();
  /** Final pass for a shape: soft shading overlay plus the tinted outline. */
  const outline = (d, base, soft = 'v', sw = SW) =>
    `<path d="${d}" fill="url(#soft-${soft})" stroke="${ink(base)}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"/>`;
  /** Mirror markup drawn on the left side over to the right side (x → 400 - x). */
  const mirror = m => `<g transform="matrix(-1,0,0,1,400,0)">${m}</g>`;
  /** Left piece plus its mirrored right piece. */
  const pair = fn => fn() + mirror(fn());
  /** Mirror an x coordinate for side 'R'. */
  const X = (side, x) => side === 'L' ? x : 400 - x;
  /** A line drawn twice (ink underneath, colour on top): straps, cords, hoses. */
  const cord = (d, c, w) => `<path d="${d}" fill="none" stroke="${ink(c)}" stroke-width="${w + 2.6}" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  /** White highlight stroke. */
  const gloss = (d, w = 4, op = .5) => `<path d="${d}" fill="none" stroke="#fff" stroke-width="${w}" stroke-linecap="round" opacity="${op}"/>`;
  /** Five-point star path. */
  const starD = (cx, cy, r, k = .48) => {
    let d = '';
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * k : r; d += (i ? 'L' : 'M') + n1(cx + Math.cos(a) * rr) + ',' + n1(cy + Math.sin(a) * rr); }
    return d + 'Z';
  };
  /** Outlined star with a soft round gradient. */
  const starO = (cx, cy, r, col, sw = 1.5) => `<path d="${starD(cx, cy, r)}" fill="${H.grad(col, 'r')}" stroke="${ink(col)}" stroke-width="${sw}" stroke-linejoin="round"/>`;
  /** Heart path, point down. */
  const heartD = (cx, cy, r) => `M${n1(cx)},${n1(cy + r * .95)} C${n1(cx - r * 1.5)},${n1(cy + r * .05)} ${n1(cx - r * .95)},${n1(cy - r * 1.05)} ${n1(cx)},${n1(cy - r * .38)} C${n1(cx + r * .95)},${n1(cy - r * 1.05)} ${n1(cx + r * 1.5)},${n1(cy + r * .05)} ${n1(cx)},${n1(cy + r * .95)} Z`;
  /** Round button with a little glint. */
  const button = (x, y, r, c) => `<circle cx="${n1(x)}" cy="${n1(y)}" r="${r}" fill="${H.grad(c, 'r')}" stroke="${ink(c)}" stroke-width="1.3"/>` +
    `<circle cx="${n1(x - r * .35)}" cy="${n1(y - r * .35)}" r="${n1(r * .3)}" fill="#fff" opacity=".8"/>`;
  /** Ellipse as a path (so it can be combined with others for holes). */
  const ell = (x, y, rx, ry) => `M${n1(x - rx)},${n1(y)}a${rx},${ry} 0 1 0 ${2 * rx},0a${rx},${ry} 0 1 0 ${-2 * rx},0Z`;
  /** Safe id fragment from colours. */
  const idOf = s => String(s).replace(/[^a-z0-9]/gi, '');

  /** Pilot wings badge: two feathered wings and a round middle with a star. s = size (1 ≈ 52 wide). */
  const wingsBadge = (cx, cy, s, c) => {
    const w = 'M-5,-2.5 C-11,-8 -21,-8.5 -26,-6.5 C-22,-5 -20,-4 -19,-3 C-22,-2.5 -23.5,-1.5 -24,0 C-20,-.2 -18,0 -16.5,.6 C-18.5,1.6 -19,2.6 -19,3.6 C-14,3.6 -9,3.4 -5,2.5 Z';
    const wing = `<path d="${w}" fill="${H.grad(c)}" stroke="${ink(c)}" stroke-width="${n1(1.1 / s)}" stroke-linejoin="round"/>` +
      `<path d="M-8,-1.5 L-20,-4.6 M-8,1 L-17,1.6" stroke="${ink(c)}" stroke-width="${n1(.7 / s)}" opacity=".6"/>`;
    return `<g transform="translate(${cx},${cy}) scale(${s})">${wing}<g transform="scale(-1,1)">${wing}</g>` +
      `<circle r="5.4" fill="${H.grad(c, 'r')}" stroke="${ink(c)}" stroke-width="${n1(1.1 / s)}"/>` +
      `<path d="${starD(0, .3, 3.4)}" fill="${shade(c, -.35)}"/></g>`;
  };
  /** Little steering-wheel emblem (bus driver's badge). */
  const wheelBadge = (cx, cy, r, c) => `<circle cx="${cx}" cy="${cy}" r="${r + 2.4}" fill="${H.grad(c, 'r')}" stroke="${ink(c)}" stroke-width="1.4"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${r - 1}" fill="none" stroke="${shade(c, -.4)}" stroke-width="2.2"/>` +
    `<path d="M${cx - r + 1},${cy} H${cx + r - 1} M${cx},${cy} V${cy + r - 1}" stroke="${shade(c, -.4)}" stroke-width="2"/>` +
    `<circle cx="${cx}" cy="${cy}" r="2.4" fill="${shade(c, -.4)}"/>`;
  /** Icelandic flag patch (25:18, cross set towards the pole), w wide, centred at 0,0. */
  const flagIS = w => {
    const u = w / 25, h = 18 * u, x0 = -w / 2, y0 = -h / 2;
    return `<rect x="${n1(x0)}" y="${n1(y0)}" width="${n1(w)}" height="${n1(h)}" rx="1.5" fill="#2c5fb4"/>` +
      `<rect x="${n1(x0 + 7 * u)}" y="${n1(y0)}" width="${n1(4 * u)}" height="${n1(h)}" fill="#ffffff"/><rect x="${n1(x0)}" y="${n1(y0 + 7 * u)}" width="${n1(w)}" height="${n1(4 * u)}" fill="#ffffff"/>` +
      `<rect x="${n1(x0 + 8 * u)}" y="${n1(y0)}" width="${n1(2 * u)}" height="${n1(h)}" fill="#d9363e"/><rect x="${n1(x0)}" y="${n1(y0 + 8 * u)}" width="${n1(w)}" height="${n1(2 * u)}" fill="#d9363e"/>` +
      `<rect x="${n1(x0)}" y="${n1(y0)}" width="${n1(w)}" height="${n1(h)}" rx="1.5" fill="none" stroke="#24406e" stroke-width="1.2"/>`;
  };
  /** Chequered band fill (two colours, 10 px squares), shared by every item with the same colours. */
  const chequer = (c1, c2) => {
    const id = 'cw-chq-' + idOf(c1) + idOf(c2);
    return H.def(id, `<pattern id="${id}" width="20" height="20" patternUnits="userSpaceOnUse"><rect width="20" height="20" fill="${c1}"/><rect width="10" height="10" fill="${c2}"/><rect x="10" y="10" width="10" height="10" fill="${c2}"/></pattern>`);
  };

  /* ---------------------------------------------------------------
     Held props: the right hand (G.hands[1]) holds them.
     A prop is drawn twice: `back` sits just under the hands layer (z 40)
     so the fingers lie over the handle, and `front` (z 66) draws the same
     prop again everywhere EXCEPT inside the hand outline, so the prop is
     still on top of sleeves and coats. In the chest tile back + front
     together show the whole prop.
     --------------------------------------------------------------- */
  // The doll's hand outline from core.js (local space: wrist at 0,0, fingers down), closed a little above the wrist.
  const HAND_LOCAL = 'M-11.5,-3 L-11.5,0 C-13,5 -14.5,11 -14.5,17 C-14.8,23 -13.5,28.5 -10.5,29.2 C-7.8,29.8 -7,27 -7,24 ' +
    'C-7.2,30 -6,34.5 -3.4,34.8 C-0.8,35.1 0,32 0,28.5 C0,34 1.4,37.6 3.8,37.6 C6.3,37.6 7,34.5 7,31 ' +
    'C7.3,34 8.6,35.2 10.6,34.7 C12.8,34.1 13.8,30.5 13.7,26.5 C13.6,24.5 14,23 15.2,22.2 ' +
    'C17.2,20.8 17.8,17.5 17,14.5 C16,10.5 14,7 12.4,4.5 C11.8,3 11.5,1.5 11.5,0 L11.5,-3 Z';
  // Move it onto the right hand exactly like core.js does: translate(wrist) rotate(-8.7) scale(-1,1).
  const HAND_R = (() => {
    const re = /-?\d*\.?\d+/g, nums = HAND_LOCAL.match(re).map(Number), out = [];
    const [wx, wy] = G.armPoint('R', 1), a = -8.7 * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
    for (let i = 0; i < nums.length; i += 2) {
      const x = -nums[i], y = nums[i + 1];
      out.push(wx + x * ca - y * sa, wy - 2 + x * sa + y * ca);
    }
    let k = 0;
    return HAND_LOCAL.replace(re, () => n1(out[k++]));
  })();
  // Clip = everything except the right hand.
  const HAND_OUT = H.def('cw-handout', `<clipPath id="cw-handout"><path clip-rule="evenodd" d="M-100,-100H500V900H-100Z${HAND_R}"/></clipPath>`);
  /** Split a prop into back (under the fingers) and front (over everything but the hand). extra = front-only bits (spray, sparkles). */
  const held = (m, extra = '') => ({ back: m, front: `<g clip-path="${HAND_OUT}">${m}</g>` + extra });

  /* =================================================================
     HATS (slot hat, cat hat)
     Every hat covers the top of the hair (hair top ≈ 58, curls ≈ 30,
     outer width ≈ 106–294) and comes down to ≈ y 120–135 at the sides.
     ================================================================= */

  /* -------------------------------------------------------------
     Firefighter helmet: round dome with a raised comb, a reflective
     band, a front shield with a star, and the long back brim
     (drawn behind the head) that shows at the sides.
     colors: [shell, shield, band]
     ------------------------------------------------------------- */
  DOLL.shape('cw-firehelmet', {
    slot: 'hat',
    thumb: [70, 14, 260, 186],
    draw(it) {
      const [c, badge = '#f2c34d', band = '#f6d64a'] = it.colors;
      const tail = 'M84,112 C74,140 82,172 104,190 Q200,208 296,190 C318,172 326,140 316,112 Q200,94 84,112 Z';
      const dome = 'M106,122 C100,60 146,26 200,26 C254,26 300,60 294,122 Q200,108 106,122 Z';
      const bandD = 'M100,96 Q200,80 300,96 L300,110 Q200,94 100,110 Z';
      const comb = 'M189,32 Q200,18 211,32 L213,100 Q200,104 187,100 Z';
      const brim = 'M80,114 Q200,92 320,114 Q332,126 312,133 Q200,116 88,133 Q68,126 80,114 Z';
      const shield = 'M172,50 Q200,38 228,50 L226,82 Q222,102 200,110 Q178,102 174,82 Z';
      const clip = H.clip('c-' + it.id, dome);
      return {
        // long back brim behind the head, darker underneath
        back: `<path d="${tail}" fill="${H.grad(shade(c, -.14))}"/>` +
          H.line('M96,134 Q100,166 118,180 M304,134 Q300,166 282,180', c, 1.8, .4) + outline(tail, c),
        front: `<path d="${dome}" fill="${H.grad(c)}"/>` +
          // reflective band round the dome (colour with a silver stripe)
          `<g clip-path="${clip}"><path d="${bandD}" fill="${band}"/><path d="M100,101 Q200,85 300,101 L300,105 Q200,89 100,105 Z" fill="#eef2f6" opacity=".9"/></g>` +
          // moulded ribs and a big shine
          H.line('M156,36 Q128,62 122,112 M244,36 Q272,62 278,112', c, 2, .45) +
          gloss('M128,70 Q138,46 166,34', 5, .5) + outline(dome, c) +
          // raised comb along the top
          `<path d="${comb}" fill="${H.grad(shade(c, .06), 'h')}"/>` + outline(comb, c, 'h', 2) +
          // brim with a darker underside edge
          `<path d="${brim}" fill="${H.grad(c)}"/>` +
          `<path d="M92,128 Q200,112 308,128" fill="none" stroke="${shade(c, -.3)}" stroke-width="3" opacity=".45"/>` + outline(brim, c) +
          // front shield with an inner border and a star
          `<path d="${shield}" fill="${H.grad(badge)}"/>` +
          `<path d="M178,55 Q200,45 222,55 L220,82 Q217,97 200,104 Q183,97 180,82 Z" fill="none" stroke="${shade(badge, -.25)}" stroke-width="1.6"/>` +
          starO(200, 76, 14, shade(badge, .25), 1.4) + outline(shield, badge, 'v', 2.2) +
          gloss('M180,58 Q190,51 202,50', 2.6, .7),
      };
    },
  });

  /* -------------------------------------------------------------
     Builder's hard hat: dome with a centre ridge and two side ridges,
     a narrow rim and a front peak. A cute sticker on the side.
     colors: [shell, sticker]; it.sticker = 'heart' | 'star'
     ------------------------------------------------------------- */
  DOLL.shape('cw-hardhat', {
    slot: 'hat',
    thumb: [84, 18, 232, 132],
    draw(it) {
      const [c, stick = '#ffffff'] = it.colors;
      const dome = 'M110,118 C104,62 148,28 200,28 C252,28 296,62 290,118 Q200,104 110,118 Z';
      const ridge = 'M188,32 Q200,22 212,32 L214,108 Q200,111 186,108 Z';
      const rim = 'M92,112 Q200,94 308,112 Q316,122 304,127 Q200,112 96,127 Q84,122 92,112 Z';
      const peak = 'M136,110 Q200,97 264,110 Q274,124 258,132 Q200,120 142,132 Q126,124 136,110 Z';
      const sideRidges = 'M162,38 Q144,64 142,110 M238,38 Q256,64 258,110';
      const sticker = it.sticker === 'star'
        ? starO(150, 80, 12, stick, 1.6)
        : `<path d="${heartD(150, 80, 11)}" fill="${H.grad(stick, 'r')}" stroke="${ink(stick)}" stroke-width="1.6" transform="rotate(-12 150 80)"/>`;
      return `<path d="${dome}" fill="${H.grad(c)}"/>` +
        // two side ridges: a dark line with a light edge beside it
        `<path d="${sideRidges}" fill="none" stroke="${ink(c)}" stroke-width="2.2" opacity=".45"/>` +
        `<path d="M165,38 Q147,64 145.5,110 M241,38 Q259,64 261.5,110" fill="none" stroke="#fff" stroke-width="2" opacity=".45"/>` +
        sticker + gloss('M124,76 Q132,52 160,38', 5, .5) + outline(dome, c) +
        // raised centre ridge
        `<path d="${ridge}" fill="${H.grad(shade(c, .08), 'h')}"/>` + outline(ridge, c, 'h', 2) +
        // narrow rim, then the front peak over it
        `<path d="${rim}" fill="${H.grad(shade(c, -.04))}"/>` + outline(rim, c, 'v', 2.2) +
        `<path d="${peak}" fill="${H.grad(c)}"/>` +
        `<path d="M144,124 Q200,112 256,124" fill="none" stroke="${shade(c, -.3)}" stroke-width="2.4" opacity=".4"/>` + outline(peak, c) +
        gloss('M150,112 Q170,106 190,104', 2.6, .55);
    },
  });

  /* -------------------------------------------------------------
     Peaked uniform cap (police, pilot, bus driver): wide crown,
     a band, a glossy visor and a badge on the front.
     colors: [crown, band, visor, badge, second band colour]
     it.band  = 'check' (chequered) | 'braid' (gold cord over the visor) | 'plain'
     it.badge = 'star' | 'wings' | 'wheel'
     ------------------------------------------------------------- */
  DOLL.shape('cw-peakcap', {
    slot: 'hat',
    thumb: [86, 16, 228, 140],
    draw(it) {
      const [c, band, visor = '#2a2832', badge = '#f2c34d', band2 = '#ffffff'] = it.colors;
      const crown = 'M118,104 C106,94 92,80 94,64 C98,42 150,30 200,30 C250,30 302,42 306,64 C308,80 294,94 282,104 Z';
      const bandD = 'M114,92 Q200,82 286,92 L286,116 Q200,106 114,116 Z';
      const visorD = 'M116,110 Q200,98 284,110 Q296,122 276,131 Q200,144 124,131 Q104,122 116,110 Z';
      const clip = H.clip('c-' + it.id + '-band', bandD);
      const bandFill = it.band === 'check' ? chequer(band, band2) : H.grad(band);
      const badgeM = it.badge === 'wings' ? wingsBadge(200, 66, 1.05, badge)
        : it.badge === 'wheel' ? wheelBadge(200, 66, 9, badge)
        : `<circle cx="200" cy="66" r="15" fill="${H.grad(shade(badge, -.1), 'r')}" stroke="${ink(badge)}" stroke-width="1.6"/>` + starO(200, 66.5, 11, shade(badge, .2), 1.3);
      return `<path d="${crown}" fill="${H.grad(c)}"/>` +
        // piping round the top of the crown and soft folds
        `<path d="M98,62 Q200,44 302,62" fill="none" stroke="${shade(c, .25)}" stroke-width="2.4" opacity=".7"/>` +
        H.line('M128,98 Q118,82 112,70 M272,98 Q282,82 288,70', c, 1.6, .4) +
        gloss('M118,54 Q140,40 172,36', 4, .45) + outline(crown, c) +
        // band (chequered, or plain with a thin stripe)
        `<path d="${bandD}" fill="${bandFill}"/>` +
        (it.band === 'check' ? '' : `<g clip-path="${clip}"><path d="M100,103 Q200,93 300,103" fill="none" stroke="${band2}" stroke-width="2.4" opacity=".8"/></g>`) +
        outline(bandD, band, 'v', 2) +
        badgeM +
        // glossy visor
        `<path d="${visorD}" fill="${H.grad(visor)}"/>` +
        gloss('M134,118 Q170,108 210,108', 3.4, .5) + outline(visorD, visor) +
        // gold cord with two little buttons (pilot)
        (it.band === 'braid' ? cord('M124,112 Q200,98 276,112', badge, 3) + button(124, 113, 3.6, badge) + button(276, 113, 3.6, badge) : '');
    },
  });

  /* -------------------------------------------------------------
     Astronaut space helmet: a big round shell with a round glass
     visor that shows her face, a coloured rim, ear pods, a little top
     lamp and a neck ring. The inside of the helmet (behind the head)
     is drawn in `back`.
     colors: [shell, rim / pods, glass tint]
     ------------------------------------------------------------- */
  DOLL.shape('cw-spacehelmet', {
    slot: 'hat',
    thumb: [62, 18, 276, 276],
    draw(it) {
      const [c, acc, glass = '#9fd8f5'] = it.colors;
      const cx = 200, cy = 150, RX = 128, RY = 124;      // shell: x 72–328, y 26–274
      const wx = 200, wy = 160, wrx = 86, wry = 88;      // window: x 114–286, y 72–248
      const shell = ell(cx, cy, RX, RY) + ell(wx, wy, wrx, wry);
      const rim = ell(wx, wy, wrx + 8, wry + 8) + ell(wx, wy, wrx, wry);
      /** Round ear pod with a light and three little grille lines. */
      const pod = x => `<circle cx="${x}" cy="168" r="19" fill="${H.grad(acc, 'r')}" stroke="${ink(acc)}" stroke-width="2.2"/>` +
        `<circle cx="${x}" cy="168" r="11" fill="${H.grad(shade(acc, .3), 'r')}" stroke="${ink(acc)}" stroke-width="1.4"/>` +
        H.line(`M${x - 5},164 h10 M${x - 6},168 h12 M${x - 5},172 h10`, acc, 1.4, .6);
      return {
        // inside of the helmet, seen around her head through the glass
        back: `<path d="${ell(cx, cy, RX - 4, RY - 4)}" fill="${H.grad(shade(glass, -.35))}"/>`,
        front:
          // the glass: a faint tint so the face shows clearly
          `<path d="${ell(wx, wy, wrx, wry)}" fill="${glass}" opacity=".16"/>` +
          // shell with the window cut out
          `<path d="${shell}" fill-rule="evenodd" fill="${H.grad(c, 'r')}"/>` +
          `<path d="${shell}" fill-rule="evenodd" fill="url(#soft-r)" stroke="${ink(c)}" stroke-width="${SW}"/>` +
          gloss('M96,108 Q108,64 150,40', 6, .6) +
          // coloured rim round the visor
          `<path d="${rim}" fill-rule="evenodd" fill="${H.grad(acc)}" stroke="${ink(acc)}" stroke-width="2"/>` +
          Array.from({ length: 10 }, (_, i) => { const a = (i * 36 + 18) * Math.PI / 180; return `<circle cx="${n1(wx + Math.cos(a) * (wrx + 4))}" cy="${n1(wy + Math.sin(a) * (wry + 4))}" r="1.6" fill="${shade(acc, .45)}"/>`; }).join('') +
          pod(80) + pod(320) +
          // little top lamp
          `<path d="M186,32 Q200,14 214,32 Z" fill="${H.grad('#ffe27a', 'r')}" stroke="${ink('#f2c34d')}" stroke-width="1.8" stroke-linejoin="round"/>` +
          `<rect x="182" y="30" width="36" height="7" rx="3" fill="${H.grad(acc)}" stroke="${ink(acc)}" stroke-width="1.6"/>` +
          // neck ring where the helmet meets the suit
          `<path d="${ell(200, 270, 70, 11)}" fill="${H.grad(shade(acc, -.05))}" stroke="${ink(acc)}" stroke-width="2"/>` +
          H.line('M140,270 Q200,282 260,270', acc, 1.4, .5) +
          // glass reflections
          gloss('M128,150 Q128,104 166,82', 7, .5) + gloss('M138,176 Q136,166 137,158', 4, .4) +
          gloss('M262,206 Q272,190 276,172', 4, .35),
      };
    },
  });

  /* -------------------------------------------------------------
     Farmer's straw hat: pinched crown, a band, a wide frayed brim
     (far half behind the head) and a wheat ear tucked in the band.
     colors: [straw, band]
     ------------------------------------------------------------- */
  DOLL.shape('cw-strawhat', {
    slot: 'hat',
    thumb: [50, 12, 300, 156],
    draw(it) {
      const [straw, band] = it.colors;
      const cx = 200, cy = 110, rx = 144, ry = 28;
      const weave = H.pat('check', straw, shade(straw, -.22), 7);
      const brimAll = ell(cx, cy, rx, ry);
      const brimFront = `M${cx - rx},${cy} A${rx},${ry} 0 0 0 ${cx + rx},${cy} L294,${cy} Q200,${cy - 10} 106,${cy} Z`;
      const crown = `M106,${cy} C98,64 122,30 164,28 Q182,37 200,35 Q218,37 236,28 C278,30 302,64 294,${cy} Q200,${cy - 10} 106,${cy} Z`;
      const bandD = `M104,${cy - 18} Q200,${cy - 30} 296,${cy - 18} L294,${cy} Q200,${cy - 10} 106,${cy} Z`;
      // frayed straw ends along the front edge of the brim
      let fray = '';
      for (let i = 1; i < 24; i++) {
        const t = Math.PI * i / 24, x = cx - Math.cos(t) * rx, y = cy + Math.sin(t) * ry;
        fray += `M${n1(x)},${n1(y - 1)} l${n1(-Math.cos(t) * 4 + (i % 2 ? 1.5 : -1.5))},${n1(Math.sin(t) * 6 + 1)}`;
      }
      // wheat ear: a stalk with plump grains on both sides
      let grains = '';
      for (let i = 0; i < 5; i++) {
        const gx = 266 + i * 3.6, gy = 64 - i * 6.4;
        grains += `<ellipse cx="${n1(gx - 3.6)}" cy="${n1(gy)}" rx="2.8" ry="4.6" transform="rotate(-10 ${n1(gx - 3.6)} ${n1(gy)})" fill="${H.grad('#e7b85a')}" stroke="${ink('#e7b85a')}" stroke-width="1"/>` +
          `<ellipse cx="${n1(gx + 3.6)}" cy="${n1(gy + 1)}" rx="2.8" ry="4.6" transform="rotate(40 ${n1(gx + 3.6)} ${n1(gy + 1)})" fill="${H.grad('#e7b85a')}" stroke="${ink('#e7b85a')}" stroke-width="1"/>`;
      }
      const wheat = cord('M254,96 Q262,80 282,34', '#d9a94a', 2) + grains;
      return {
        back: `<path d="${brimAll}" fill="${weave}"/><ellipse cx="${cx}" cy="${cy - 6}" rx="${rx - 30}" ry="${ry - 10}" fill="${shade(straw, -.4)}" opacity=".25"/>` + outline(brimAll, straw),
        front: `<path d="${crown}" fill="${weave}"/>` +
          // dents at the pinched top
          H.line('M164,30 Q172,50 170,70 M236,30 Q228,50 230,70', straw, 1.8, .45) + outline(crown, straw) +
          wheat +
          `<path d="${bandD}" fill="${H.grad(band)}"/>` + outline(bandD, band, 'v', 2) +
          // little knot on the band
          `<path d="M246,${cy - 24} q8,4 6,16 q-8,-2 -6,-16 Z" fill="${H.grad(shade(band, -.1))}" stroke="${ink(band)}" stroke-width="1.6"/>` +
          `<path d="${brimFront}" fill="${weave}"/>` +
          `<path d="M${cx - rx + 8},${cy + 6} A${rx - 8},${ry - 4} 0 0 0 ${cx + rx - 8},${cy + 6}" fill="none" stroke="${shade(straw, -.3)}" stroke-width="4" opacity=".35"/>` +
          outline(brimFront, straw) +
          `<path d="${fray}" fill="none" stroke="${shade(straw, -.25)}" stroke-width="1.6" stroke-linecap="round"/>` +
          gloss('M132,70 Q148,52 172,46', 4, .45),
      };
    },
  });

  /* =================================================================
     JACKETS AND TOPS
     ================================================================= */

  /* -------------------------------------------------------------
     Firefighter coat: long coat with reflective bands (colour with a
     silver stripe) round the chest, hem and cuffs, a storm flap with
     clasps, a stand-up collar and big pockets.
     colors: [coat, tape, tape stripe, clasps]
     ------------------------------------------------------------- */
  DOLL.shape('cw-firecoat', {
    slot: 'jacket',
    thumb: [48, 222, 304, 278],
    draw(it) {
      const [c, tape = '#f6d64a', mid = '#e3e8ee', clasp = '#3a3640'] = it.colors;
      const d = G.shirtPath({ sleeve: 1, pad: 10, sleevePad: 7, bottom: 486, flare: 10, neck: 'high' });
      const clip = H.clip('c-' + it.id, d);
      /** Reflective band across the coat at height y. */
      const hb = y => `<rect x="0" y="${y}" width="400" height="15" fill="${tape}"/><rect x="0" y="${y + 5}" width="400" height="5" fill="${mid}"/>`;
      /** Reflective band round a sleeve near the cuff. */
      const sb = side => `<path d="${G.armPath(side, .78, .86, 9)}" fill="${tape}"/><path d="${G.armPath(side, .806, .834, 9)}" fill="${mid}"/>`;
      const cuff = side => `<path d="${G.armPath(side, .93, 1.01, 8)}" fill="${shade(c, -.28)}"/>`;
      /** Big hip pocket with a flap that carries a strip of tape. */
      const pocket = x => `<path d="M${x},392 h34 v36 q0,8 -8,8 h-18 q-8,0 -8,-8 Z" fill="${H.grad(c)}" stroke="${ink(c)}" stroke-width="2"/>` +
        `<path d="M${x - 2},386 h38 v14 q-19,5 -38,0 Z" fill="${H.grad(shade(c, -.06))}" stroke="${ink(c)}" stroke-width="2" stroke-linejoin="round"/>` +
        `<rect x="${x + 1}" y="390" width="32" height="5" fill="${tape}"/>`;
      const clasps = [298, 344, 394, 432].map(y => `<rect x="188" y="${y}" width="24" height="8" rx="3" fill="${H.grad(clasp)}" stroke="${ink(clasp)}" stroke-width="1.4"/>` +
        `<path d="M193,${y + 4} h14" stroke="#dfe5ec" stroke-width="2" stroke-linecap="round"/>`).join('');
      const collar = 'M180,228 Q200,236 220,228 L222,252 Q200,262 178,252 Z';
      return `<path d="${d}" fill="${H.grad(c)}"/>` +
        // storm flap down the front
        `<path d="M192,250 H208 V490 H192 Z" fill="${shade(c, -.08)}"/>` +
        `<g clip-path="${clip}">${hb(336)}${hb(446)}${sb('L')}${sb('R')}${cuff('L')}${cuff('R')}` +
          `<rect x="0" y="336" width="400" height="15" fill="url(#shine)" opacity=".35"/></g>` +
        H.line('M192,252 V488 M208,252 V488', c, 1.6, .55) +
        pocket(148) + pocket(218) +
        // folds at the armpits and the hem
        H.line('M150,318 q8,12 4,26 M250,318 q-8,12 -4,26 M170,470 q4,8 2,16 M232,468 q-3,9 -1,17', c, 1.8, .45) +
        gloss('M140,300 Q130,330 132,380', 5, .35) +
        outline(d, c) +
        `<path d="${collar}" fill="${H.grad(shade(c, -.05))}"/>` + `<rect x="178" y="240" width="44" height="5" fill="${tape}" opacity=".9"/>` + outline(collar, c, 'v', 2.2) +
        clasps;
    },
  });

  /* -------------------------------------------------------------
     Police jacket: zipped uniform jacket with a chequered band across
     the chest, a star badge, shoulder straps, collar and pockets.
     colors: [jacket, chequer 1, chequer 2, badge]
     ------------------------------------------------------------- */
  DOLL.shape('cw-policejacket', {
    slot: 'jacket',
    thumb: [52, 226, 296, 262],
    draw(it) {
      const [c, ch1 = '#ffffff', ch2 = '#3f86d9', badge = '#f2c34d'] = it.colors;
      const d = G.shirtPath({ sleeve: 1, pad: 8, sleevePad: 6, bottom: 470, flare: 4, neck: 'round', neckDepth: 6 });
      const clip = H.clip('c-' + it.id, d);
      const collar = side => { const m = side === 'L' ? (s => s) : (s => mirror(s)); return m(`<path d="M185,246 Q170,252 162,268 L182,280 Q190,266 199,259 Z" fill="${H.grad(shade(c, .06))}" stroke="${ink(c)}" stroke-width="2" stroke-linejoin="round"/>`); };
      /** Shoulder strap with a button near the neck. */
      const strap = () => `<path d="M174,253 L136,268 L139,278 L176,262 Z" fill="${H.grad(shade(c, -.1))}" stroke="${ink(c)}" stroke-width="1.8" stroke-linejoin="round"/>` + button(170, 258, 2.8, badge);
      const pocket = x => `<path d="M${x},404 h32 v26 q0,6 -6,6 h-20 q-6,0 -6,-6 Z" fill="${H.grad(c)}" stroke="${ink(c)}" stroke-width="1.8"/>` +
        `<path d="M${x - 2},398 h36 v11 q-18,5 -36,0 Z" fill="${H.grad(shade(c, .05))}" stroke="${ink(c)}" stroke-width="1.8" stroke-linejoin="round"/>` + button(x + 16, 406, 2.6, shade(c, -.2));
      return `<path d="${d}" fill="${H.grad(c)}"/>` +
        `<g clip-path="${clip}"><rect x="0" y="350" width="400" height="20" fill="${chequer(ch1, ch2)}"/>` +
          `<path d="M0,350 H400 M0,370 H400" stroke="${ink(c)}" stroke-width="1.4" opacity=".6"/>` +
          `<path d="${G.armPath('L', .93, 1.01, 7)}${G.armPath('R', .93, 1.01, 7)}" fill="${shade(c, -.2)}"/></g>` +
        // zip with a pull
        `<path d="M200,262 V472" stroke="${shade(c, -.4)}" stroke-width="4" stroke-dasharray="2 2"/>` +
        `<rect x="196" y="264" width="8" height="14" rx="3" fill="#d9dde3" stroke="${ink(c)}" stroke-width="1.6"/>` +
        pocket(150) + pocket(218) +
        H.line('M151,320 q7,12 4,26 M249,320 q-7,12 -4,26 M174,452 q4,8 2,16 M228,450 q-3,9 -1,17', c, 1.8, .45) +
        gloss('M142,296 Q132,326 134,344', 4, .35) +
        outline(d, c) + pair(strap) + collar('L') + collar('R') +
        // star badge on the chest
        `<circle cx="234" cy="318" r="13" fill="${H.grad(shade(badge, -.08), 'r')}" stroke="${ink(badge)}" stroke-width="1.6"/>` + starO(234, 318.5, 10, shade(badge, .2), 1.2);
    },
  });

  /* -------------------------------------------------------------
     Pilot's jacket: V-neck uniform jacket showing a white shirt and
     tie, lapels, two rows of gold buttons, gold cuff stripes, shoulder
     straps with stripes and a wings badge.
     colors: [jacket, gold, shirt, tie]
     ------------------------------------------------------------- */
  DOLL.shape('cw-pilotjacket', {
    slot: 'jacket',
    thumb: [52, 226, 296, 262],
    draw(it) {
      const [c, gold = '#f2c34d', shirt = '#ffffff', tie = c] = it.colors;
      const d = G.shirtPath({ sleeve: 1, pad: 7, sleevePad: 5, bottom: 468, flare: 4, neck: 'v', neckDepth: 72 });
      const clip = H.clip('c-' + it.id, d);
      // shirt and tie showing in the V (drawn first, the jacket goes over it)
      const shirtV = `<path d="M181,246 L219,246 L200,330 Z" fill="${H.grad(shirt)}" stroke="${ink(shirt)}" stroke-width="1.4"/>` +
        `<path d="M194,258 L206,258 L204,268 L196,268 Z" fill="${H.grad(tie)}" stroke="${ink(tie)}" stroke-width="1.3"/>` +
        `<path d="M196,268 L204,268 L207,326 L193,326 Z" fill="${H.grad(tie)}" stroke="${ink(tie)}" stroke-width="1.3"/>` +
        `<path d="M184,248 L196,266 L200,256 Z M216,248 L204,266 L200,256 Z" fill="${H.grad(shirt)}" stroke="${ink(shirt)}" stroke-width="1.3" stroke-linejoin="round"/>`;
      /** Lapel along the left side of the V (mirrored for the right). */
      const lapel = () => `<path d="M182,250 L199,326 L188,330 L168,290 L176,282 L164,268 Z" fill="${H.grad(shade(c, .08))}" stroke="${ink(c)}" stroke-width="2" stroke-linejoin="round"/>`;
      const strap = () => `<path d="M170,256 L136,268 L139,278 L172,265 Z" fill="${H.grad(shade(c, -.06))}" stroke="${ink(c)}" stroke-width="1.8" stroke-linejoin="round"/>` +
        `<path d="M148,265 L150,272 M154,263 L156,270 M160,261 L162,268" stroke="${gold}" stroke-width="2.2" stroke-linecap="round"/>`;
      const stripes = side => [.84, .89, .94].map(t => `<path d="${G.armPath(side, t, t + .022, 7)}" fill="${gold}"/>`).join('');
      const btns = [352, 392, 432].map(y => button(184, y, 4, gold) + button(216, y, 4, gold)).join('');
      const pocket = x => `<path d="M${x - 2},410 h36 v9 q-18,4 -36,0 Z" fill="${H.grad(shade(c, .05))}" stroke="${ink(c)}" stroke-width="1.8" stroke-linejoin="round"/>`;
      return shirtV + `<path d="${d}" fill="${H.grad(c)}"/>` +
        `<g clip-path="${clip}">${stripes('L')}${stripes('R')}</g>` +
        // front edge where the jacket overlaps
        H.line('M207,330 V470', c, 1.8, .6) +
        pocket(150) + pocket(218) +
        `<path d="M222,344 h28" stroke="${ink(c)}" stroke-width="1.8" opacity=".6"/>` +
        H.line('M151,320 q7,12 4,26 M249,320 q-7,12 -4,26 M174,452 q4,8 2,16 M228,450 q-3,9 -1,17', c, 1.8, .45) +
        gloss('M142,296 Q132,326 134,350', 4, .3) +
        outline(d, c) + lapel() + mirror(lapel()) + pair(strap) + btns +
        wingsBadge(236, 334, .82, gold);
    },
  });

  /* -------------------------------------------------------------
     Uniform / work shirt with a pointed collar, button placket and two
     chest pockets. Options:
       it.sleeve    .3 short (default) or .55 rolled-up long sleeves
       it.tie       tie colour (no tie when missing)
       it.epaulette shoulder straps in this colour (it.stripe = stripe colour)
       it.badge     'star' (police), 'wings' (pilot), 'bus' (name tag with a little bus)
       pattern      e.g. 'check' for the farmer's checked shirt
     colors: [shirt, pattern colour, collar, buttons, badge]
     ------------------------------------------------------------- */
  DOLL.shape('cw-shirt', {
    slot: 'top',
    thumb: [62, 232, 276, 250],
    draw(it) {
      const [c, , col = c, btn = '#ffffff', badge = '#f2c34d'] = it.colors;
      const sl = it.sleeve || .3;
      const d = G.shirtPath({ sleeve: sl, pad: 5, sleevePad: sl > .5 ? 4.5 : 5.5, bottom: 452, neck: 'round', neckDepth: 6 });
      const clip = H.clip('c-' + it.id, d);
      const base = it.pattern ? shade(c, -.15) : c;
      /** Chest pocket with a flap and a button (left side; mirrored for the right). */
      const pocket = () => `<path d="M152,314 h28 v24 q0,6 -6,6 h-16 q-6,0 -6,-6 Z" fill="${H.fill(it)}" stroke="${ink(base)}" stroke-width="1.8"/>` +
        `<path d="M150,308 h32 v10 q-16,6 -32,0 Z" fill="${H.fill(it)}" stroke="${ink(base)}" stroke-width="1.8" stroke-linejoin="round"/>` + button(166, 316, 2.4, btn);
      /** Collar point (left side). */
      const collarL = `<path d="M186,247 Q177,252 170,258 L177,281 L199,263 Z" fill="${it.pattern ? H.fill(it) : H.grad(col)}" stroke="${ink(base)}" stroke-width="2" stroke-linejoin="round"/>`;
      const sleeveEnd = sl > .5
        // rolled-up sleeves: a wide turned-back band with a fold line
        ? `<path d="${G.armPath('L', .46, .56, 6.5)}${G.armPath('R', .46, .56, 6.5)}" fill="${H.grad(shade(c, .12))}" stroke="${ink(base)}" stroke-width="1.8" stroke-linejoin="round"/>` +
          `<path d="${G.armPath('L', .5, .52, 6.5)}${G.armPath('R', .5, .52, 6.5)}" fill="${ink(base)}" opacity=".25"/>`
        : `<path d="${G.armPath('L', .25, .3, 6.2)}${G.armPath('R', .25, .3, 6.2)}" fill="${shade(c, -.1)}" opacity=".7"/>`;
      let tie = '';
      if (it.tie) {
        tie = `<path d="M193,262 L207,262 L204,274 L196,274 Z" fill="${H.grad(it.tie)}" stroke="${ink(it.tie)}" stroke-width="1.4" stroke-linejoin="round"/>` +
          `<path d="M196,274 L204,274 L210,350 L200,362 L190,350 Z" fill="${H.grad(it.tie)}" stroke="${ink(it.tie)}" stroke-width="1.4" stroke-linejoin="round"/>` +
          `<path d="M197,290 L207,300 M195,314 L208,326 M193,338 L208,352" stroke="${shade(it.tie, .3)}" stroke-width="2" opacity=".6"/>`;
      }
      let eps = '';
      if (it.epaulette) {
        const st = it.stripe || '#f2c34d';
        eps = pair(() => `<path d="M171,254 L138,266 L141,276 L173,263 Z" fill="${H.grad(it.epaulette)}" stroke="${ink(it.epaulette)}" stroke-width="1.6" stroke-linejoin="round"/>` +
          (it.stripe ? `<path d="M148,264 L150,271 M154,262 L156,269 M160,260 L162,267" stroke="${st}" stroke-width="2.2" stroke-linecap="round"/>` : '') +
          button(167, 259, 2.4, st));
      }
      let badgeM = '';
      if (it.badge === 'star') badgeM = `<circle cx="234" cy="298" r="11" fill="${H.grad(shade(badge, -.08), 'r')}" stroke="${ink(badge)}" stroke-width="1.5"/>` + starO(234, 298.5, 8.5, shade(badge, .2), 1.1);
      if (it.badge === 'wings') badgeM = wingsBadge(234, 298, .72, badge);
      if (it.badge === 'bus') {
        // name tag without text: a little yellow bus with windows and wheels
        badgeM = `<rect x="214" y="290" width="38" height="16" rx="3" fill="#ffffff" stroke="${ink(c)}" stroke-width="1.5"/>` +
          `<rect x="220" y="293" width="26" height="9" rx="2.5" fill="#f6c636" stroke="#9a7a1c" stroke-width="1"/>` +
          `<path d="M223,295.5 h4 v3 h-4 Z M229,295.5 h4 v3 h-4 Z M235,295.5 h4 v3 h-4 Z" fill="#bfe3f6"/>` +
          `<circle cx="225" cy="302.5" r="1.8" fill="#3a3640"/><circle cx="241" cy="302.5" r="1.8" fill="#3a3640"/>`;
      }
      const buttons = (it.tie ? [398, 432] : [292, 326, 360, 394, 428]).map(y => button(200, y, 3, btn)).join('');
      return `<path d="${d}" fill="${H.fill(it)}"/>` +
        // placket
        H.line('M195,270 V452 M205,270 V452', base, 1.4, .5) +
        `<g clip-path="${clip}">${sl > .5 ? '' : sleeveEnd}</g>` +
        pocket() + mirror(pocket()) +
        H.line('M151,322 q7,12 4,26 M249,322 q-7,12 -4,26 M174,430 q4,8 2,14 M228,428 q-3,9 -1,16', base, 1.8, .4) +
        outline(d, base) +
        (sl > .5 ? sleeveEnd : '') +
        buttons + eps + collarL + mirror(collarL) + tie + badgeM;
    },
  });

  /* -------------------------------------------------------------
     Builder's high-visibility vest: sleeveless, V-neck, zip, silver
     reflective bands across and over the shoulders, hip pockets.
     colors: [vest, reflective, binding]
     ------------------------------------------------------------- */
  DOLL.shape('cw-hivis', {
    slot: 'jacket',
    thumb: [86, 226, 228, 262],
    draw(it) {
      const [c, refl = '#e3e8ee', bind = shade(c, -.2)] = it.colors;
      const d = G.shirtPath({ sleeve: 0, pad: 9, bottom: 472, flare: 6, neck: 'v', neckDepth: 58 });
      const clip = H.clip('c-' + it.id, d);
      /** Silver band with a fine line in the middle (looks shiny). */
      const band = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${refl}"/><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#shine)" opacity=".6"/>`;
      const pocket = x => `<path d="M${x},440 h32 v22 q0,6 -6,6 h-20 q-6,0 -6,-6 Z" fill="${H.grad(c)}" stroke="${ink(c)}" stroke-width="1.8"/>` +
        `<path d="M${x - 1},440 h34" stroke="${bind}" stroke-width="3.4" stroke-linecap="round"/>`;
      return `<path d="${d}" fill="${H.grad(c)}"/>` +
        `<g clip-path="${clip}">` +
          band(156, 240, 16, 160) + band(228, 240, 16, 160) + band(0, 388, 400, 14) + band(0, 420, 400, 14) +
          H.line('M156,240 V388 M172,240 V388 M228,240 V388 M244,240 V388 M0,388 H400 M0,402 H400 M0,420 H400 M0,434 H400', refl, 1.2, .5) +
        `</g>` +
        // zip from the V down to the hem
        `<path d="M200,308 V474" stroke="${shade(c, -.35)}" stroke-width="3.6" stroke-dasharray="2 2"/>` +
        `<rect x="196.5" y="310" width="7" height="12" rx="3" fill="#d9dde3" stroke="${ink(c)}" stroke-width="1.4"/>` +
        pocket(150) + pocket(218) +
        H.line('M170,456 q4,8 2,14 M232,454 q-3,9 -1,16', c, 1.8, .4) +
        outline(d, c) +
        // binding round the V-neck and the armholes
        `<path d="M183.3,251 L200,308 L216.7,251" fill="none" stroke="${bind}" stroke-width="3" stroke-linejoin="round" opacity=".8"/>`;
    },
  });

  /* -------------------------------------------------------------
     Astronaut suit top: puffy suit jacket with quilted sleeve rings,
     elbow pads, coloured cuffs, a chest control panel with buttons,
     an Icelandic flag patch on the arm and a star patch.
     colors: [suit, accent, panel]
     ------------------------------------------------------------- */
  DOLL.shape('cw-spacesuit', {
    slot: 'jacket',
    thumb: [44, 228, 312, 268],
    draw(it) {
      const [c, acc, panel = '#c9d2de'] = it.colors;
      const d = G.shirtPath({ sleeve: 1, pad: 12, sleevePad: 9, bottom: 470, flare: 8, neck: 'round', neckDepth: 2 });
      const clip = H.clip('c-' + it.id, d);
      const ring = (side, t) => H.line(G.armPath(side, t, t, 9.5).replace(/Z$/, ''), c, 1.6, .5);
      const arm = side => `<path d="${G.armPath(side, .43, .57, 12)}" fill="${H.grad(shade(c, -.06))}" stroke="${ink(c)}" stroke-width="1.6"/>` +
        `<path d="${G.armPath(side, .88, 1.01, 10)}" fill="${H.grad(acc)}"/>` + `<path d="${G.armPath(side, .86, .885, 10)}" fill="${shade(acc, .35)}"/>` +
        ring(side, .3) + ring(side, .7);
      const [fx, fy] = G.armPoint('L', .22);
      // control panel: screen with a heart, and four round buttons
      const box = `<rect x="174" y="312" width="52" height="46" rx="7" fill="${H.grad(panel)}" stroke="${ink(panel)}" stroke-width="2"/>` +
        `<rect x="180" y="318" width="22" height="16" rx="3" fill="#2e4766" stroke="${ink(panel)}" stroke-width="1.2"/>` +
        `<path d="${heartD(191, 326, 5)}" fill="#7fe0a0"/>` +
        button(213, 324, 4, '#ef6f6c') + button(185, 346, 3.6, '#f7d660') + button(198, 346, 3.6, '#7fcf8a') + button(212, 346, 3.6, '#6fb3e6') +
        `<rect x="174" y="312" width="52" height="46" rx="7" fill="url(#soft-v)"/>`;
      // round patch with a ringed planet and a star
      const patch = `<circle cx="238" cy="296" r="13" fill="#2e4766" stroke="${ink(acc)}" stroke-width="2"/><circle cx="238" cy="296" r="13" fill="none" stroke="${acc}" stroke-width="2.4" opacity=".9"/>` +
        `<circle cx="236" cy="298" r="5" fill="${H.grad('#f6a65a', 'r')}"/><ellipse cx="236" cy="298" rx="9" ry="2.6" fill="none" stroke="#ffe27a" stroke-width="1.4" transform="rotate(-18 236 298)"/>` +
        `<path d="${starD(244, 290, 2.6)}" fill="#fff"/>`;
      return `<path d="${d}" fill="${H.grad(c)}"/>` +
        `<g clip-path="${clip}">${arm('L')}${arm('R')}` +
          // puffy quilting rows on the body and a belt band
          H.line('M120,384 Q200,392 280,384 M120,428 Q200,436 280,428', c, 1.6, .45) +
          `<rect x="0" y="404" width="400" height="12" fill="${H.grad(acc)}"/><rect x="190" y="402" width="20" height="16" rx="3" fill="${H.grad(panel)}" stroke="${ink(panel)}" stroke-width="1.4"/>` +
        `</g>` +
        // air hose from the panel to the side
        cord('M226,348 C246,356 250,372 242,390', panel, 4) +
        H.line('M150,322 q7,12 4,26 M250,322 q-7,12 -4,26', c, 1.8, .4) +
        gloss('M138,300 Q126,330 128,370', 5, .45) +
        outline(d, c) + box + patch +
        `<g transform="translate(${n1(fx)},${n1(fy)}) rotate(17)">${flagIS(22)}</g>` +
        // neck ring
        `<path d="${ell(200, 252, 30, 8)}" fill="none" stroke="${ink(acc)}" stroke-width="7"/><path d="${ell(200, 252, 30, 8)}" fill="none" stroke="${acc}" stroke-width="4.4"/>`;
    },
  });

  /* =================================================================
     TROUSERS (slot bottom, cat pants)
     ================================================================= */

  /* -------------------------------------------------------------
     Work trousers, one shape with a few styles (it.style):
       'fire'    reflective bands on the shins
       'police'  side stripe and a black belt
       'plain'   pressed creases and a belt (bus driver, pilot)
       'space'   puffy suit trousers with knee pads and coloured cuffs
       'builder' knee pads, a thigh pocket and a tool belt with a pouch
     colors: [trousers, accent, accent 2]
     ------------------------------------------------------------- */
  DOLL.shape('cw-workpants', {
    slot: 'bottom',
    thumb: [102, 378, 196, 338],
    draw(it) {
      const st = it.style || 'plain';
      const [c, a1 = '#f6d64a', a2 = '#e3e8ee'] = it.colors;
      const pad = { fire: 7, space: 9, builder: 6 }[st] || 4.5, flare = st === 'space' ? 5 : 3, bottom = 706;
      const d = G.pantsPath({ top: 398, bottom, pad, flare });
      const clip = H.clip('c-' + it.id, d);
      /** Outer edge of the left leg at height y (same maths as G.pantsPath). */
      const edge = y => (y <= 476 ? Math.min(G.torsoX(y), G.legOutX(y)) : G.legOutX(y)) - pad - flare * Math.max(0, (y - 476) / (bottom - 476));
      let inside = `<rect x="0" y="398" width="400" height="13" fill="${shade(c, -.1)}"/>` +
        `<rect x="0" y="690" width="400" height="18" fill="${shade(c, -.07)}"/>` + `<path d="M0,690 H400" stroke="${ink(c)}" stroke-width="1.4" opacity=".45"/>`;
      let over = '';
      const belt = (col, buckle) => `<path d="M${n1(edge(400) + 4)},399 Q200,404 ${n1(396 - edge(400))},399 L${n1(396 - edge(410))},411 Q200,416 ${n1(edge(410) + 4)},411 Z" fill="${H.grad(col)}" stroke="${ink(col)}" stroke-width="1.8" stroke-linejoin="round"/>` +
        `<rect x="191" y="400" width="18" height="14" rx="2.5" fill="none" stroke="${buckle}" stroke-width="2.8"/>`;
      const creases = H.line('M170,488 V700 M230,488 V700', c, 1.4, .35) + `<path d="M172,488 V700 M232,488 V700" stroke="#fff" stroke-width="1.2" opacity=".25"/>`;
      if (st === 'fire') {
        inside += [600, 648].map(y => `<rect x="0" y="${y}" width="400" height="15" fill="${a1}"/><rect x="0" y="${y + 5}" width="400" height="5" fill="${a2}"/>`).join('') +
          `<rect x="0" y="600" width="400" height="15" fill="url(#shine)" opacity=".35"/>`;
        over = H.line('M200,412 V452 Q200,462 192,468', c, 1.6, .5);
      } else if (st === 'police') {
        const stripe = [412, 440, 476, 520, 574, 640, 706].map(y => [edge(y) + 4.5, y]);
        inside += `<path d="M${stripe.map(p => n1(p[0]) + ',' + p[1]).join('L')}" fill="none" stroke="${a1}" stroke-width="5"/>` +
          mirror(`<path d="M${stripe.map(p => n1(p[0]) + ',' + p[1]).join('L')}" fill="none" stroke="${a1}" stroke-width="5"/>`);
        over = creases + belt('#2e2a33', '#d9dde3');
      } else if (st === 'plain') {
        over = creases + belt(it.colors[1] || '#2e2a33', it.colors[2] || '#d9dde3');
      } else if (st === 'space') {
        inside += `<rect x="0" y="682" width="400" height="24" fill="${H.grad(a1)}"/>` +
          H.line('M120,470 Q160,478 198,470 M202,470 Q240,478 280,470 M130,628 Q160,636 194,630 M206,630 Q240,636 270,628', c, 1.6, .45);
        // knee pads, a thigh pocket with a flap
        over = pair(() => `<rect x="152" y="550" width="36" height="46" rx="12" fill="${H.grad(a2)}" stroke="${ink(a2)}" stroke-width="1.8"/>` +
            H.line('M156,573 h28', a2, 1.4, .5)) +
          `<path d="M140,490 h30 v30 q0,6 -6,6 h-18 q-6,0 -6,-6 Z" fill="${H.grad(c)}" stroke="${ink(c)}" stroke-width="1.8"/>` +
          `<path d="M138,486 h34 v9 q-17,5 -34,0 Z" fill="${H.grad(a1)}" stroke="${ink(a1)}" stroke-width="1.6"/>`;
      } else if (st === 'builder') {
        // tool pouch on the left hip with a pencil and a folding ruler
        const pouch = `<path d="M150,436 L156,448" stroke="${ink('#f2c34d')}" stroke-width="7" stroke-linecap="round"/><path d="M150,436 L156,448" stroke="#f2c34d" stroke-width="4.4" stroke-linecap="round"/>` +
          `<path d="M140,416 L130,394" stroke="${ink('#f6d64a')}" stroke-width="6.4" stroke-linecap="round"/><path d="M140,416 L130,394" stroke="#f6d64a" stroke-width="4" stroke-linecap="round"/><path d="M131.5,397 L129,392" stroke="#f48ca0" stroke-width="4" stroke-linecap="round"/>` +
          `<path d="M126,408 h38 v36 q0,8 -8,8 h-22 q-8,0 -8,-8 Z" fill="${H.grad(a1)}" stroke="${ink(a1)}" stroke-width="2"/>` +
          `<path d="M124,406 h42 v12 q-21,6 -42,0 Z" fill="${H.grad(shade(a1, -.08))}" stroke="${ink(a1)}" stroke-width="1.8" stroke-linejoin="round"/>` +
          `<path d="M130,430 h30" stroke="${shade(a1, .3)}" stroke-width="1.3" stroke-dasharray="3 2"/>`;
        over = pair(() => `<rect x="153" y="552" width="34" height="44" rx="10" fill="${H.grad(a2)}" stroke="${ink(a2)}" stroke-width="1.8"/>` +
            `<path d="M150,564 h40 M150,584 h40" stroke="${shade(a2, -.25)}" stroke-width="3" opacity=".7"/>`) +
          `<path d="M232,486 h30 v34 q0,6 -6,6 h-18 q-6,0 -6,-6 Z" fill="${H.grad(c)}" stroke="${ink(c)}" stroke-width="1.8"/>` +
          `<path d="M230,482 h34 v10 q-17,5 -34,0 Z" fill="${H.grad(shade(c, .06))}" stroke="${ink(c)}" stroke-width="1.6" stroke-linejoin="round"/>` +
          belt(a1, '#d9dde3') + cord('M142,410 V452 M158,410 V452', a1, 3) + `<g transform="translate(-4,44)">${pouch}</g>`;
      }
      return `<path d="${d}" fill="${H.grad(c)}"/>` +
        `<g clip-path="${clip}">${inside}</g>` +
        // crotch creases and knee folds
        H.line('M190,470 l-10,8 M210,470 l10,8 M156,572 q12,6 26,0 M218,572 q12,6 26,0', c, 1.6, .4) +
        outline(d, c, 'h') + over;
    },
  });

  /* =================================================================
     BOOTS (slot shoes, cat boots). Drawn once on the left foot,
     mirrored for the right (like feet.js).
     ================================================================= */
  const [FX, FY] = G.feet[0];
  /** Boot shaft for the left leg from top to low (built from the leg profile so it fits). */
  function shaft(top, low = 716, pad = 6, flare = 3) {
    const k = y => (y - top) / (low - top), outer = [], inner = [];
    const step = (low - top) / Math.max(4, Math.round((low - top) / 13));
    for (let y = top; y <= low + .1; y += step) {
      outer.push([G.legOutX(y) - pad - flare * k(y), y]);
      inner.push([G.legInX(y) + pad + flare * k(y) * .6, y]);
    }
    const pt = p => n1(p[0]) + ',' + n1(p[1]);
    return {
      outer, inner,
      d: H.polyPath(outer.concat(inner.slice().reverse())),
      edges: 'M' + outer.map(pt).join('L') + 'M' + inner.map(pt).join('L'),
    };
  }

  /* -------------------------------------------------------------
     Work boots in four styles (it.style):
       'fire'  tall rubber boots with a reflective band and pull loops
       'black' shiny black lace-up ankle boots (police)
       'shoe'  shiny black lace-up shoes (pilot, bus driver)
       'work'  sturdy tan work boots with a padded collar and a toe cap
       'moon'  puffy astronaut boots with a strap and a thick sole
     colors: [boot, accent, sole]
     ------------------------------------------------------------- */
  DOLL.shape('cw-boots', {
    slot: 'shoes',
    thumb: [110, 588, 180, 166],
    draw(it) {
      const st = it.style;
      const [c, a = '#f6d64a', soleC = '#3b3540'] = it.colors;
      /** Sole band clipped to the foot outline. */
      const sole = (foot, y0, h, col, tread) => `<g clip-path="${H.clip('c-' + it.id + '-s', foot)}"><rect x="${FX - 60}" y="${y0}" width="120" height="${h}" fill="${col}"/>` +
        `<path d="M${FX - 60},${y0} H${FX + 60}" stroke="${ink(col)}" stroke-width="1.6" opacity=".7"/>` +
        (tread ? `<path d="${Array.from({ length: 10 }, (_, i) => `M${FX - 30 + i * 6},${FY + 26} l3,-5 l3,5`).join('')}" fill="none" stroke="${shade(col, .3)}" stroke-width="1.3"/>` : '') + `</g>`;
      /** Criss-cross laces up the middle of a shaft between y0 and y1. */
      const laces = (sh, y0, y1, col) => {
        let s = '';
        for (let y = y0; y <= y1; y += 9) {
          const i = sh.inner.findIndex(p => p[1] >= y), o = sh.outer[Math.max(0, i)], n = sh.inner[Math.max(0, i)];
          const mid = (o[0] + n[0]) / 2;
          s += `M${n1(mid - 6)},${y} L${n1(mid + 6)},${y + 6} M${n1(mid + 6)},${y} L${n1(mid - 6)},${y + 6}`;
        }
        return `<path d="${s}" stroke="${ink(col)}" stroke-width="3.6" stroke-linecap="round"/><path d="${s}" stroke="${col}" stroke-width="2" stroke-linecap="round"/>`;
      };
      let one;
      if (st === 'shoe') {
        const foot = G.footPath('L', 4, 3);
        one = () => `<path d="${foot}" fill="${H.grad(c)}"/>` + sole(foot, FY + 11, 20, soleC) + outline(foot, c, 'r') +
          // tongue and a little bow of laces
          `<path d="M${FX - 8},${FY - 22} Q${FX},${FY - 26} ${FX + 8},${FY - 22} L${FX + 6},${FY - 10} Q${FX},${FY - 8} ${FX - 6},${FY - 10} Z" fill="${H.grad(shade(c, .1))}" stroke="${ink(c)}" stroke-width="1.6"/>` +
          `<path d="M${FX - 6},${FY - 18} L${FX + 6},${FY - 14} M${FX + 6},${FY - 18} L${FX - 6},${FY - 14}" stroke="${a}" stroke-width="1.8" stroke-linecap="round"/>` +
          gloss(`M${FX - 24},${FY - 2} q-2,-8 6,-14`, 3, .6) + gloss(`M${FX + 12},${FY - 16} q4,2 5,8`, 2.4, .5);
      } else {
        const cfg = { fire: [598, 8, 3, 7, 4], black: [662, 6, 2, 5, 3], work: [648, 8, 3, 8, 5], moon: [630, 11, 4, 10, 4] }[st] || [662, 6, 2, 5, 3];
        const [top, pad, fl, fpad, toe] = cfg;
        const sh = shaft(top, 716, pad, fl), foot = G.footPath('L', fpad, toe);
        const [o0, i0] = [sh.outer[0], sh.inner[0]];
        const fill = st === 'work' ? H.grad(c, 'h') : H.grad(c);
        let base = `<path d="${foot}" fill="${fill}"/>`, extra = '';
        if (st === 'fire') {
          base += sole(foot, FY + 6, 30, soleC, true);
          extra = `<g clip-path="${H.clip('c-' + it.id + '-sh', sh.d)}"><rect x="100" y="648" width="120" height="15" fill="${a}"/><rect x="100" y="653" width="120" height="5" fill="#e3e8ee"/></g>` +
            // rolled rim at the top and two pull loops
            `<path d="${H.polyPath([[o0[0] - 2, top - 2], [i0[0] + 2, top - 2], [i0[0] + 2, top + 10], [o0[0] - 2, top + 10]])}" fill="${H.grad(shade(c, .15))}" stroke="${ink(c)}" stroke-width="2" stroke-linejoin="round"/>` +
            `<path d="M${n1(o0[0] + 3)},${top} q0,-12 7,-12 q7,0 7,12 M${n1(i0[0] - 17)},${top} q0,-12 7,-12 q7,0 7,12" fill="none" stroke="${ink(c)}" stroke-width="4"/>` +
            `<path d="M${n1(o0[0] + 3)},${top} q0,-12 7,-12 q7,0 7,12 M${n1(i0[0] - 17)},${top} q0,-12 7,-12 q7,0 7,12" fill="none" stroke="${shade(c, .2)}" stroke-width="2"/>`;
        } else if (st === 'black') {
          base += sole(foot, FY + 10, 22, soleC);
          extra = laces(sh, top + 8, 700, a) +
            `<path d="${H.polyPath([[o0[0] - 1, top - 2], [i0[0] + 1, top - 2], [i0[0] + 1, top + 6], [o0[0] - 1, top + 6]])}" fill="${H.grad(shade(c, .12))}" stroke="${ink(c)}" stroke-width="1.8" stroke-linejoin="round"/>`;
        } else if (st === 'work') {
          // darker toe cap and a chunky treaded sole
          base += `<g clip-path="${H.clip('c-' + it.id + '-t', foot)}"><ellipse cx="${FX - 22}" cy="${FY + 2}" rx="22" ry="20" fill="${shade(c, -.2)}"/></g>` +
            H.line(`M${FX - 6},${FY - 16} Q${FX - 14},${FY} ${FX - 6},${FY + 14}`, c, 1.6, .6) +
            sole(foot, FY + 9, 26, soleC, true);
          extra = laces(sh, top + 14, 702, '#f2e6c8') +
            // padded collar round the top
            `<path d="M${n1(o0[0] - 3)},${top + 2} Q${n1((o0[0] + i0[0]) / 2)},${top - 6} ${n1(i0[0] + 3)},${top + 2} L${n1(i0[0] + 3)},${top + 10} Q${n1((o0[0] + i0[0]) / 2)},${top + 4} ${n1(o0[0] - 3)},${top + 10} Z" fill="${H.grad(a)}" stroke="${ink(a)}" stroke-width="1.8" stroke-linejoin="round"/>`;
        } else if (st === 'moon') {
          base += sole(foot, FY + 4, 30, soleC, true);
          const sy = 676, sa = sh.outer[4][0] - 1, sb = sh.inner[4][0] + 1;
          extra = `<g clip-path="${H.clip('c-' + it.id + '-sh', sh.d)}">${H.line('M110,654 q40,6 90,0 M110,700 q40,6 90,0', c, 1.6, .45)}</g>` +
            `<path d="M${n1(sa)},${sy - 6} Q${n1((sa + sb) / 2)},${sy - 2} ${n1(sb)},${sy - 6} L${n1(sb)},${sy + 6} Q${n1((sa + sb) / 2)},${sy + 10} ${n1(sa)},${sy + 6} Z" fill="${H.grad(a)}" stroke="${ink(a)}" stroke-width="1.8" stroke-linejoin="round"/>` +
            `<rect x="${n1((sa + sb) / 2 - 6)}" y="${sy - 5}" width="12" height="11" rx="2" fill="none" stroke="#d9dde3" stroke-width="2.4"/>` +
            // puffy rim at the top
            `<rect x="${n1(o0[0] - 4)}" y="${top - 8}" width="${n1(i0[0] - o0[0] + 8)}" height="16" rx="8" fill="${H.grad(a)}" stroke="${ink(a)}" stroke-width="2"/>`;
        }
        one = () => base + outline(foot, c, 'r') +
          `<path d="${sh.d}" fill="${fill}"/><path d="${sh.d}" fill="url(#soft-h)"/>` +
          `<path d="${sh.edges}" fill="none" stroke="${ink(c)}" stroke-width="${SW}" stroke-linecap="round"/>` +
          extra +
          gloss(`M${n1(o0[0] + 5)},${top + 14} Q${n1(o0[0] + 2)},${top + 34} ${n1(o0[0] + 5)},${Math.min(700, top + 60)}`, 3.4, st === 'work' ? .25 : .5) +
          gloss(`M${FX - 20},${FY - 3} q-3,4 -2,8`, 2.4, .55);
      }
      return pair(one);
    },
  });

  /* =================================================================
     THINGS TO HOLD (slot hold, cat hold): right hand at (302,458).
     backZ 40 puts the `back` copy just under the hand (see held()).
     ================================================================= */

  /* -------------------------------------------------------------
     Fire hose: a straight nozzle (grip, brass tip, coupling) held in
     the fist, the hose curling down to the ground, and a friendly
     splash of water drops.
     colors: [hose, brass, grip]
     ------------------------------------------------------------- */
  DOLL.shape('cw-hose', {
    slot: 'hold',
    backZ: 40,
    thumb: [256, 396, 144, 176],
    draw(it) {
      const [hose = '#e04848', brass = '#e8b64a', grip = '#3a3640'] = it.colors;
      const hd = 'M280,475 C262,500 296,556 314,604 C330,648 294,684 298,716 C302,742 340,744 376,738';
      const hosePart = cord(hd, hose, 12) + `<path d="${hd}" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="6 9" opacity=".45"/>`;
      // nozzle along the x axis in local space, tilted up to the right
      const noz = `<g transform="translate(302,463) rotate(-29)">` +
        `<rect x="-29" y="-9.5" width="14" height="19" rx="3" fill="${H.grad(brass)}" stroke="${ink(brass)}" stroke-width="1.6"/>` +
        H.line('M-25,-9 v18 M-20,-9 v18', brass, 1.2, .5) +
        `<rect x="-16" y="-8" width="38" height="16" rx="5" fill="${H.grad(grip)}" stroke="${ink(grip)}" stroke-width="1.6"/>` +
        `<path d="M-10,-7 v14 M-4,-7 v14 M2,-7 v14 M8,-7 v14" stroke="${shade(grip, .3)}" stroke-width="1.4"/>` +
        `<path d="M22,-9 L48,-5 Q52,0 48,5 L22,9 Z" fill="${H.grad(brass)}" stroke="${ink(brass)}" stroke-width="1.6" stroke-linejoin="round"/>` +
        `<rect x="18" y="-10.5" width="8" height="21" rx="3" fill="${H.grad(hose)}" stroke="${ink(hose)}" stroke-width="1.6"/>` +
        `<path d="M28,-5 L46,-2.6" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".7"/></g>`;
      const water = `<path d="M352,435 q16,-10 30,-8 M353,440 q18,-3 32,4 M350,430 q10,-15 26,-19" fill="none" stroke="#7cc8f0" stroke-width="3.4" stroke-linecap="round" opacity=".85"/>` +
        `<path d="M352,435 q16,-10 30,-8" fill="none" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity=".8"/>` +
        [[390, 428, 3.2], [389, 447, 2.6], [382, 410, 2.4], [396, 438, 2]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#9ad8f7" stroke="#4b9ccc" stroke-width="1"/>`).join('');
      return held(hosePart + noz, water);
    },
  });

  /* -------------------------------------------------------------
     Walkie-talkie (police): a chunky radio with an antenna, a speaker
     grille, a little screen and a blue light.
     colors: [body, light / buttons, screen]
     ------------------------------------------------------------- */
  DOLL.shape('cw-walkie', {
    slot: 'hold',
    backZ: 40,
    thumb: [262, 362, 110, 136],
    draw(it) {
      const [b = '#2f3a52', acc = '#4f8fe0', scr = '#bfe8b0'] = it.colors;
      const g = `<g transform="translate(301,470) rotate(26)">` +
        cord('M7,-64 V-90', b, 4.4) + `<circle cx="7" cy="-92" r="4.4" fill="${H.grad(acc, 'r')}" stroke="${ink(acc)}" stroke-width="1.3"/>` +
        `<rect x="-11" y="-72" width="9" height="9" rx="2.5" fill="${H.grad(acc, 'r')}" stroke="${ink(acc)}" stroke-width="1.3"/>` +
        `<rect x="-15" y="-66" width="30" height="80" rx="8" fill="${H.grad(b, 'h')}" stroke="${ink(b)}" stroke-width="2"/>` +
        // speaker grille
        `<path d="M-9,-56 h18 M-9,-51 h18 M-9,-46 h18" stroke="${shade(b, -.4)}" stroke-width="2.4" stroke-linecap="round"/>` +
        // screen with a little smiley heart
        `<rect x="-10" y="-39" width="20" height="13" rx="2.5" fill="${scr}" stroke="${ink(b)}" stroke-width="1.3"/>` +
        `<path d="${heartD(0, -33, 3.4)}" fill="${shade(scr, -.4)}"/>` +
        `<circle cx="-6" cy="-16" r="3" fill="${acc}"/><circle cx="6" cy="-16" r="3" fill="${acc}"/>` +
        `<rect x="-15" y="-66" width="30" height="80" rx="8" fill="url(#soft-v)"/>` +
        gloss('M-10,-60 V-20', 2.4, .35) + `</g>`;
      return held(g);
    },
  });

  /* -------------------------------------------------------------
     Bus steering wheel: a round rim held at the top left, three spokes
     and a hub with a star horn button.
     colors: [rim, spokes, hub]
     ------------------------------------------------------------- */
  DOLL.shape('cw-wheel', {
    slot: 'hold',
    backZ: 40,
    thumb: [276, 428, 112, 112],
    draw(it) {
      const [rim = '#3a3640', sp = '#c9d2de', hub = '#f6c636'] = it.colors;
      const cx = 331, cy = 491, r = 40;
      const spoke = a => { const x = cx + Math.cos(a * Math.PI / 180) * (r - 3), y = cy + Math.sin(a * Math.PI / 180) * (r - 3); return `M${cx},${cy} L${n1(x)},${n1(y)}`; };
      // little grip bumps all round the rim
      const bumps = Array.from({ length: 16 }, (_, i) => { const a = i * 22.5 * Math.PI / 180; return `<circle cx="${n1(cx + Math.cos(a) * (r + 3.8))}" cy="${n1(cy + Math.sin(a) * (r + 3.8))}" r="1.4" fill="${shade(rim, .35)}"/>`; }).join('');
      const g = cord(spoke(180) + spoke(0) + spoke(90), sp, 7) +
        `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${ink(rim)}" stroke-width="13"/>` +
        `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${rim}" stroke-width="9"/>` + bumps +
        `<path d="M${cx - 30},${cy - 24} A${r},${r} 0 0 1 ${cx + 18},${cy - 36}" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".4"/>` +
        `<circle cx="${cx}" cy="${cy}" r="14" fill="${H.grad(hub, 'r')}" stroke="${ink(hub)}" stroke-width="2"/>` +
        starO(cx, cy + .5, 8, shade(hub, .3), 1.2);
      return held(g);
    },
  });

  /* -------------------------------------------------------------
     Toy aeroplane (pilot): round body with windows, a tail fin with a
     heart, a wing and a propeller, flying up to the right.
     colors: [body, wings / tail, stripe]
     ------------------------------------------------------------- */
  DOLL.shape('cw-plane', {
    slot: 'hold',
    backZ: 40,
    thumb: [258, 374, 136, 136],
    draw(it) {
      const [b = '#ffffff', w = '#4f86d6', s = '#e2505b'] = it.colors;
      const body = 'M-30,-8 Q-34,-11 -28,-11 L44,-12 Q66,-11 68,0 Q66,11 44,11 L-26,8 Q-34,5 -30,-8 Z';
      const g = `<g transform="translate(302,463) rotate(-26) translate(16,0)">` +
        // tail fin and back wing
        `<path d="M-28,-10 L-36,-32 Q-35,-36 -29,-34 L-8,-11 Z" fill="${H.grad(w)}" stroke="${ink(w)}" stroke-width="1.8" stroke-linejoin="round"/>` +
        `<path d="${heartD(-27, -22, 4)}" fill="#fff"/>` +
        `<path d="${body}" fill="${H.grad(b)}"/>` +
        `<path d="M-28,1 L66,1 L64,5 L-27,5 Z" fill="${s}"/>` +
        // windows and the cockpit
        [8, 20, 32].map(x => `<circle cx="${x}" cy="-4" r="3.6" fill="#bfe3f6" stroke="${ink(b)}" stroke-width="1.2"/>`).join('') +
        `<path d="M46,-11 Q58,-10 62,-3 L46,-3 Z" fill="#bfe3f6" stroke="${ink(b)}" stroke-width="1.2" stroke-linejoin="round"/>` +
        outline(body, b) +
        `<ellipse cx="-22" cy="4" rx="11" ry="3.6" fill="${H.grad(w)}" stroke="${ink(w)}" stroke-width="1.6"/>` +
        // big wing across the body
        `<path d="M6,4 L36,4 Q40,6 34,9 L2,24 Q-5,27 -3,20 Z" fill="${H.grad(w)}" stroke="${ink(w)}" stroke-width="1.8" stroke-linejoin="round"/>` +
        // propeller
        `<ellipse cx="71" cy="0" rx="3" ry="17" fill="${H.grad('#9aa3b0')}" stroke="${ink('#9aa3b0')}" stroke-width="1.4"/>` +
        `<circle cx="69" cy="0" r="4.4" fill="${H.grad(s, 'r')}" stroke="${ink(s)}" stroke-width="1.4"/>` +
        gloss('M-20,-8 L40,-9', 2.4, .6) + `</g>`;
      return held(g);
    },
  });

  /* -------------------------------------------------------------
     Toy rocket (astronaut): round body with a porthole, a red nose,
     fins and a little puff cloud, flying up to the right.
     colors: [body, nose / fins, window]
     ------------------------------------------------------------- */
  DOLL.shape('cw-rocket', {
    slot: 'hold',
    backZ: 40,
    thumb: [244, 356, 150, 150],
    draw(it) {
      const [b = '#f4f6fa', n = '#e2505b', win = '#7cc8f0'] = it.colors;
      const body = 'M-30,-13 L40,-13 Q70,-12 86,0 Q70,12 40,13 L-30,13 Q-34,0 -30,-13 Z';
      const nose = 'M40,-13 Q70,-12 86,0 Q70,12 40,13 Q44,0 40,-13 Z';
      const g = `<g transform="translate(302,463) rotate(-40) translate(12,0)">` +
        // puff cloud behind the rocket
        [[-48, 0, 9], [-58, -6, 6.5], [-60, 7, 6]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${H.grad('#ffffff', 'r')}" stroke="#c9d2de" stroke-width="1.4"/>`).join('') +
        // fins (top and bottom) and nozzle
        `<path d="M-26,-12 L-42,-30 Q-45,-34 -38,-33 L-6,-13 Z M-26,12 L-42,30 Q-45,34 -38,33 L-6,13 Z" fill="${H.grad(n)}" stroke="${ink(n)}" stroke-width="1.8" stroke-linejoin="round"/>` +
        `<path d="M-30,-9 L-39,-12 L-39,12 L-30,9 Z" fill="${H.grad('#9aa3b0')}" stroke="${ink('#9aa3b0')}" stroke-width="1.6" stroke-linejoin="round"/>` +
        `<path d="${body}" fill="${H.grad(b)}"/>` + `<path d="${nose}" fill="${H.grad(n)}"/>` +
        `<path d="M-16,-13 v26" stroke="${n}" stroke-width="4"/>` +
        // porthole
        `<circle cx="18" cy="0" r="10.5" fill="${H.grad('#d9dde3')}" stroke="${ink(b)}" stroke-width="1.6"/>` +
        `<circle cx="18" cy="0" r="7" fill="${H.grad(win, 'r')}" stroke="${ink(win)}" stroke-width="1.2"/>` +
        `<path d="M14,-3 q2,-3 5,-3" stroke="#fff" stroke-width="2" stroke-linecap="round" fill="none"/>` +
        outline(body, b, 'h') + `<path d="M-6,-13 L-22,-23 M-6,13 L-22,23" stroke="${ink(n)}" stroke-width="1" opacity=".4"/>` +
        gloss('M-24,-8 L50,-8', 2.4, .6) + `</g>`;
      // little twinkling stars near the rocket (front only)
      const stars = [[356, 392, 5], [372, 420, 3.6], [334, 380, 3.2]].map(([x, y, r]) => `<path d="M${x},${y - r}Q${x},${y} ${x + r},${y}Q${x},${y} ${x},${y + r}Q${x},${y} ${x - r},${y}Q${x},${y} ${x},${y - r}Z" fill="#ffe27a" stroke="#c9a23a" stroke-width=".8"/>`).join('');
      return held(g, stars);
    },
  });

  /* -------------------------------------------------------------
     Toy tools (builder), it.kind:
       'hammer'  wooden handle with a rubber grip and a bright head
       'spanner' silver spanner with a ring end and an open end
     colors: [head / metal, grip]
     ------------------------------------------------------------- */
  DOLL.shape('cw-tool', {
    slot: 'hold',
    backZ: 40,
    thumb: [262, 380, 122, 122],
    draw(it) {
      const [c, grip = '#f6c636'] = it.colors;
      let g;
      if (it.kind === 'spanner') {
        const hex = r => H.polyPath(Array.from({ length: 6 }, (_, i) => [-38 + Math.cos(i * Math.PI / 3) * r, Math.sin(i * Math.PI / 3) * r]));
        const tool = 'M-30,-6 L40,-6 L46,-11 Q60,-20 70,-10 L61,-4 Q57,-7 53,-5 L53,5 Q57,7 61,4 L70,10 Q60,20 46,11 L40,6 L-30,6 Z';
        g = `<g transform="translate(302,463) rotate(-36) translate(8,0)">` +
          `<path d="${ell(-38, 0, 14, 14)}${hex(6.5)}" fill-rule="evenodd" fill="${H.grad(c)}" stroke="${ink(c)}" stroke-width="1.8"/>` +
          `<path d="${tool}" fill="${H.grad(c)}"/>` + `<rect x="-22" y="-2" width="54" height="4" rx="2" fill="${shade(c, -.15)}"/>` + outline(tool, c) +
          gloss('M-24,-4 L36,-4', 2, .7) + gloss('M-46,-6 Q-44,-12 -38,-13', 2, .7) + `</g>`;
      } else {
        const head = 'M40,-20 h20 q4,0 4,4 v32 q0,4 -4,4 h-20 q-4,0 -4,-4 v-32 q0,-4 4,-4 Z';
        g = `<g transform="translate(302,463) rotate(-38) translate(8,0)">` +
          `<rect x="-38" y="-5" width="80" height="10" rx="5" fill="${H.grad('#d9a35f')}" stroke="${ink('#d9a35f')}" stroke-width="1.6"/>` +
          // rubber grip with rings
          `<rect x="-40" y="-6.5" width="28" height="13" rx="6" fill="${H.grad(grip)}" stroke="${ink(grip)}" stroke-width="1.6"/>` +
          `<path d="M-32,-6 v12 M-25,-6 v12 M-18,-6 v12" stroke="${shade(grip, -.25)}" stroke-width="1.4"/>` +
          `<path d="${head}" fill="${H.grad(c, 'h')}"/>` +
          `<rect x="36" y="-20" width="28" height="7" rx="3" fill="${shade(c, .25)}"/><rect x="36" y="13" width="28" height="7" rx="3" fill="${shade(c, .25)}"/>` +
          outline(head, c, 'h') + `<path d="M50,-6 v12" stroke="${shade(c, -.3)}" stroke-width="2"/>` +
          gloss('M-8,-2.6 L34,-2.6', 2, .6) + `</g>`;
      }
      return held(g);
    },
  });

  /* -------------------------------------------------------------
     Farm basket with eggs: woven basket hanging from her hand by its
     handle, brown and white eggs and a checked cloth.
     colors: [wicker, cloth]
     ------------------------------------------------------------- */
  DOLL.shape('cw-basket', {
    slot: 'hold',
    backZ: 40,
    thumb: [256, 424, 102, 132],
    draw(it) {
      const [w = '#c98a4b', cloth = '#e2505b'] = it.colors;
      const body = 'M268,496 L340,496 L333,540 Q304,552 275,540 Z';
      const clip = H.clip('c-' + it.id, body);
      const egg = (x, y, c, rot) => `<ellipse cx="${x}" cy="${y}" rx="9" ry="11.5" transform="rotate(${rot} ${x} ${y})" fill="${H.grad(c, 'r')}" stroke="${ink(c)}" stroke-width="1.5"/>` +
        `<ellipse cx="${x - 3}" cy="${y - 4}" rx="2.2" ry="3.4" fill="#fff" opacity=".7"/>`;
      const g = cord('M277,498 C274,444 334,444 331,498', w, 6) +
        `<path d="M277,498 C274,444 334,444 331,498" fill="none" stroke="${shade(w, .3)}" stroke-width="1.6" stroke-dasharray="4 4"/>` +
        egg(288, 486, '#f1d2ad', -14) + egg(318, 485, '#ffffff', 12) + egg(303, 482, '#e8b585', 0) +
        `<path d="${body}" fill="${H.grad(w)}"/>` +
        // weave: rows and stakes
        `<g clip-path="${clip}">${H.line('M260,508 H350 M260,520 H350 M260,532 H350', w, 2, .55)}` +
          `${H.line('M280,496 L282,548 M292,496 L293,550 M304,496 V552 M316,496 L315,550 M328,496 L326,548', w, 1.6, .35)}</g>` +
        outline(body, w) +
        // rim and the checked cloth over one side
        `<rect x="264" y="490" width="80" height="10" rx="5" fill="${H.grad(shade(w, .1))}" stroke="${ink(w)}" stroke-width="1.8"/>` +
        `<path d="M266,492 L294,492 L288,520 L278,512 L270,522 Z" fill="${H.pat('check', '#ffffff', cloth, 8)}" stroke="${ink(cloth)}" stroke-width="1.6" stroke-linejoin="round"/>`;
      return held(g);
    },
  });

  /* -------------------------------------------------------------
     Lamb plush (farmer): fluffy body, a soft face with sleepy smiling
     eyes, little ears, a ribbon with a bell. She holds it by its back.
     colors: [wool, face / legs, ribbon]
     ------------------------------------------------------------- */
  DOLL.shape('cw-lamb', {
    slot: 'hold',
    backZ: 40,
    thumb: [270, 444, 110, 104],
    draw(it) {
      const [wool = '#fbf6ee', face = '#e9cdb8', rib = '#f48ca0'] = it.colors;
      const cx = 316, cy = 500, rx = 30, ry = 20;
      // fluffy outline: a ring of puffs round the body
      const puffs = Array.from({ length: 16 }, (_, i) => { const a = i * Math.PI / 8; return `<circle cx="${n1(cx + Math.cos(a) * rx)}" cy="${n1(cy + Math.sin(a) * ry)}" r="8.5" fill="${H.grad(wool, 'r')}" stroke="${ink(wool)}" stroke-width="1.6"/>`; }).join('');
      const leg = x => `<rect x="${x}" y="510" width="9" height="24" rx="4.5" fill="${H.grad(face)}" stroke="${ink(face)}" stroke-width="1.6"/>`;
      const hx = 352, hy = 486;
      const g = leg(294) + leg(306) + leg(320) + leg(332) +
        `<circle cx="282" cy="492" r="7" fill="${H.grad(wool, 'r')}" stroke="${ink(wool)}" stroke-width="1.6"/>` +
        puffs + `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${H.grad(wool, 'r')}"/>` +
        H.line('M300,494 a4,4 0 1 1 7,-2 M318,506 a4,4 0 1 1 7,-2 M326,490 a4,4 0 1 1 7,-2', wool, 1.4, .45) +
        // ears, head, wool tuft
        `<ellipse cx="${hx - 13}" cy="${hy - 6}" rx="9" ry="4.5" transform="rotate(-25 ${hx - 13} ${hy - 6})" fill="${H.grad(face)}" stroke="${ink(face)}" stroke-width="1.5"/>` +
        `<ellipse cx="${hx + 13}" cy="${hy - 6}" rx="9" ry="4.5" transform="rotate(25 ${hx + 13} ${hy - 6})" fill="${H.grad(face)}" stroke="${ink(face)}" stroke-width="1.5"/>` +
        `<ellipse cx="${hx}" cy="${hy}" rx="13" ry="14" fill="${H.grad(face, 'r')}" stroke="${ink(face)}" stroke-width="1.8"/>` +
        [[hx - 7, hy - 12], [hx, hy - 15], [hx + 7, hy - 12]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5.5" fill="${H.grad(wool, 'r')}" stroke="${ink(wool)}" stroke-width="1.3"/>`).join('') +
        // sleepy smiling eyes, pink nose, rosy cheeks
        `<path d="M${hx - 8},${hy - 1} q3,3 6,0 M${hx + 2},${hy - 1} q3,3 6,0" fill="none" stroke="#5a4048" stroke-width="1.8" stroke-linecap="round"/>` +
        `<path d="${heartD(hx, hy + 6, 3)}" fill="#e98a9a"/>` +
        `<circle cx="${hx - 8}" cy="${hy + 5}" r="2.6" fill="#f28a8c" opacity=".5"/><circle cx="${hx + 8}" cy="${hy + 5}" r="2.6" fill="#f28a8c" opacity=".5"/>` +
        // ribbon round the neck with a little gold bell
        cord(`M${hx - 13},${hy + 8} Q${hx - 4},${hy + 16} ${hx + 6},${hy + 12}`, rib, 3.4) +
        `<circle cx="${hx - 4}" cy="${hy + 18}" r="3.6" fill="${H.grad('#f2c34d', 'r')}" stroke="${ink('#f2c34d')}" stroke-width="1.2"/>`;
      return held(g);
    },
  });

  /* =================================================================
     CATALOG
     ================================================================= */
  DOLL.add([
    // --- Firefighter ---
    { id: 'hat-fire-red', shape: 'cw-firehelmet', cat: 'hat', name: { is: 'Rauður slökkviliðshjálmur', en: 'Red firefighter helmet' }, colors: ['#e0393e', '#f2c34d', '#f6d64a'] },
    { id: 'hat-fire-yellow', shape: 'cw-firehelmet', cat: 'hat', name: { is: 'Gulur slökkviliðshjálmur', en: 'Yellow firefighter helmet' }, colors: ['#f5c531', '#e3e8ee', '#e0393e'] },
    { id: 'jacket-fire-red', shape: 'cw-firecoat', cat: 'jacket', name: { is: 'Rauður slökkviliðsjakki', en: 'Red firefighter coat' }, colors: ['#d93a3e', '#f6d64a', '#e3e8ee', '#3a3640'] },
    { id: 'jacket-fire-yellow', shape: 'cw-firecoat', cat: 'jacket', name: { is: 'Gulur slökkviliðsjakki', en: 'Yellow firefighter coat' }, colors: ['#f2c33a', '#e3e8ee', '#e0393e', '#3a3640'] },
    { id: 'pants-fire-red', shape: 'cw-workpants', cat: 'pants', style: 'fire', name: { is: 'Rauðar slökkviliðsbuxur', en: 'Red firefighter trousers' }, colors: ['#d93a3e', '#f6d64a', '#e3e8ee'] },
    { id: 'pants-fire-yellow', shape: 'cw-workpants', cat: 'pants', style: 'fire', name: { is: 'Gular slökkviliðsbuxur', en: 'Yellow firefighter trousers' }, colors: ['#f2c33a', '#e3e8ee', '#e0393e'] },
    { id: 'boots-fire', shape: 'cw-boots', cat: 'boots', style: 'fire', name: { is: 'Slökkviliðsstígvél', en: 'Firefighter boots' }, colors: ['#35323c', '#f6d64a', '#26232c'] },
    { id: 'hold-fire-hose', shape: 'cw-hose', cat: 'hold', name: { is: 'Brunaslanga', en: 'Fire hose' }, colors: ['#e04848', '#e8b64a', '#3a3640'] },

    // --- Police ---
    { id: 'hat-police', shape: 'cw-peakcap', cat: 'hat', band: 'check', badge: 'star', name: { is: 'Lögregluhúfa', en: 'Police cap' }, colors: ['#2c4580', '#3f86d9', '#26232c', '#f2c34d', '#ffffff'] },
    { id: 'jacket-police', shape: 'cw-policejacket', cat: 'jacket', name: { is: 'Lögreglujakki', en: 'Police jacket' }, colors: ['#2c4580', '#ffffff', '#3f86d9', '#f2c34d'] },
    { id: 'top-police-light', shape: 'cw-shirt', cat: 'top', badge: 'star', tie: '#2c4580', epaulette: '#2c4580', name: { is: 'Ljósblá lögregluskyrta', en: 'Light blue police shirt' }, colors: ['#bcd8f2', '#bcd8f2', '#bcd8f2', '#ffffff', '#f2c34d'] },
    { id: 'pants-police', shape: 'cw-workpants', cat: 'pants', style: 'police', name: { is: 'Lögreglubuxur', en: 'Police trousers' }, colors: ['#2c4580', '#8fc0ee'] },
    { id: 'boots-police', shape: 'cw-boots', cat: 'boots', style: 'black', thumb: [116, 632, 168, 116], name: { is: 'Lögregluskór', en: 'Police boots' }, colors: ['#2e2b33', '#4a4652', '#1e1c22'] },
    { id: 'hold-police-walkie', shape: 'cw-walkie', cat: 'hold', name: { is: 'Talstöð', en: 'Walkie-talkie' }, colors: ['#2f3a52', '#4f8fe0', '#bfe8b0'] },

    // --- Bus driver ---
    { id: 'hat-bus-navy', shape: 'cw-peakcap', cat: 'hat', band: 'plain', badge: 'wheel', name: { is: 'Blá strætóhúfa', en: 'Blue bus driver cap' }, colors: ['#2f4f8f', '#f6c636', '#26232c', '#f6c636', '#ffffff'] },
    { id: 'hat-bus-yellow', shape: 'cw-peakcap', cat: 'hat', band: 'plain', badge: 'wheel', name: { is: 'Gul strætóhúfa', en: 'Yellow bus driver cap' }, colors: ['#f6c636', '#2f4f8f', '#26232c', '#ffffff', '#f6c636'] },
    { id: 'top-bus-blue', shape: 'cw-shirt', cat: 'top', badge: 'bus', tie: '#f6c636', name: { is: 'Ljósblá strætóskyrta', en: 'Light blue bus driver shirt' }, colors: ['#a9cdee', '#a9cdee', '#a9cdee', '#ffffff'] },
    { id: 'top-bus-yellow', shape: 'cw-shirt', cat: 'top', badge: 'bus', tie: '#2f4f8f', name: { is: 'Gul strætóskyrta', en: 'Yellow bus driver shirt' }, colors: ['#f8d75a', '#f8d75a', '#f8d75a', '#ffffff'] },
    { id: 'pants-bus', shape: 'cw-workpants', cat: 'pants', style: 'plain', name: { is: 'Gráar strætóbuxur', en: 'Grey bus driver trousers' }, colors: ['#5d6474', '#2e2a33', '#f6c636'] },
    { id: 'hold-bus-wheel', shape: 'cw-wheel', cat: 'hold', name: { is: 'Stýri', en: 'Steering wheel' }, colors: ['#3a3640', '#c9d2de', '#f6c636'] },

    // --- Pilot ---
    { id: 'hat-pilot-navy', shape: 'cw-peakcap', cat: 'hat', band: 'braid', badge: 'wings', name: { is: 'Dökkblá flugmannshúfa', en: 'Navy pilot cap' }, colors: ['#24345e', '#1c2440', '#26232c', '#f2c34d', '#24345e'] },
    { id: 'hat-pilot-white', shape: 'cw-peakcap', cat: 'hat', band: 'braid', badge: 'wings', name: { is: 'Hvít flugmannshúfa', en: 'White pilot cap' }, colors: ['#f8fafc', '#24345e', '#26232c', '#f2c34d', '#24345e'] },
    { id: 'jacket-pilot', shape: 'cw-pilotjacket', cat: 'jacket', name: { is: 'Flugmannsjakki', en: 'Pilot jacket' }, colors: ['#24345e', '#f2c34d', '#ffffff', '#24345e'] },
    { id: 'top-pilot-white', shape: 'cw-shirt', cat: 'top', badge: 'wings', tie: '#24345e', epaulette: '#24345e', stripe: '#f2c34d', name: { is: 'Hvít flugmannsskyrta', en: 'White pilot shirt' }, colors: ['#f8fafc', '#f8fafc', '#f8fafc', '#ffffff', '#f2c34d'] },
    { id: 'pants-pilot', shape: 'cw-workpants', cat: 'pants', style: 'plain', name: { is: 'Flugmannsbuxur', en: 'Pilot trousers' }, colors: ['#24345e', '#1e1c22', '#f2c34d'] },
    { id: 'boots-pilot', shape: 'cw-boots', cat: 'boots', style: 'shoe', thumb: [122, 664, 156, 96], name: { is: 'Svartir spariskór', en: 'Shiny black shoes' }, colors: ['#2e2b33', '#4a4652', '#1e1c22'] },
    { id: 'hold-pilot-plane', shape: 'cw-plane', cat: 'hold', name: { is: 'Leikfangaflugvél', en: 'Toy aeroplane' }, colors: ['#ffffff', '#4f86d6', '#e2505b'] },

    // --- Astronaut ---
    { id: 'hat-space-white', shape: 'cw-spacehelmet', cat: 'hat', name: { is: 'Hvítur geimhjálmur', en: 'White space helmet' }, colors: ['#f4f6fa', '#5b8fe0', '#9fd8f5'] },
    { id: 'hat-space-pink', shape: 'cw-spacehelmet', cat: 'hat', name: { is: 'Bleikur geimhjálmur', en: 'Pink space helmet' }, colors: ['#f9cfe0', '#a77be0', '#d9c6f7'] },
    { id: 'jacket-space-white', shape: 'cw-spacesuit', cat: 'jacket', name: { is: 'Hvítur geimbúningur', en: 'White space suit' }, colors: ['#f4f6fa', '#5b8fe0', '#c9d2de'] },
    { id: 'jacket-space-pink', shape: 'cw-spacesuit', cat: 'jacket', name: { is: 'Bleikur geimbúningur', en: 'Pink space suit' }, colors: ['#f9cfe0', '#a77be0', '#e6dcf2'] },
    { id: 'pants-space-white', shape: 'cw-workpants', cat: 'pants', style: 'space', name: { is: 'Hvítar geimbuxur', en: 'White space trousers' }, colors: ['#f4f6fa', '#5b8fe0', '#c9d2de'] },
    { id: 'pants-space-pink', shape: 'cw-workpants', cat: 'pants', style: 'space', name: { is: 'Bleikar geimbuxur', en: 'Pink space trousers' }, colors: ['#f9cfe0', '#a77be0', '#e6dcf2'] },
    { id: 'boots-space-white', shape: 'cw-boots', cat: 'boots', style: 'moon', name: { is: 'Hvít geimstígvél', en: 'White moon boots' }, colors: ['#f4f6fa', '#5b8fe0', '#8a93a3'] },
    { id: 'boots-space-pink', shape: 'cw-boots', cat: 'boots', style: 'moon', name: { is: 'Bleik geimstígvél', en: 'Pink moon boots' }, colors: ['#f9cfe0', '#a77be0', '#9a8fb0'] },
    { id: 'hold-space-rocket', shape: 'cw-rocket', cat: 'hold', name: { is: 'Lítil eldflaug', en: 'Toy rocket' }, colors: ['#f4f6fa', '#e2505b', '#7cc8f0'] },

    // --- Builder ---
    { id: 'hat-builder-orange', shape: 'cw-hardhat', cat: 'hat', sticker: 'heart', name: { is: 'Appelsínugulur öryggishjálmur', en: 'Orange hard hat' }, colors: ['#f58a2c', '#f48ca0'] },
    { id: 'hat-builder-yellow', shape: 'cw-hardhat', cat: 'hat', sticker: 'star', name: { is: 'Gulur öryggishjálmur', en: 'Yellow hard hat' }, colors: ['#f6c935', '#5aa0dc'] },
    { id: 'jacket-builder-orange', shape: 'cw-hivis', cat: 'jacket', name: { is: 'Appelsínugult endurskinsvesti', en: 'Orange safety vest' }, colors: ['#f7862a', '#e8edf2'] },
    { id: 'jacket-builder-yellow', shape: 'cw-hivis', cat: 'jacket', name: { is: 'Gult endurskinsvesti', en: 'Yellow safety vest' }, colors: ['#e6e840', '#e8edf2'] },
    { id: 'pants-builder', shape: 'cw-workpants', cat: 'pants', style: 'builder', name: { is: 'Smiðsbuxur', en: 'Builder trousers' }, colors: ['#3e5179', '#9a6236', '#5a5866'] },
    { id: 'boots-builder', shape: 'cw-boots', cat: 'boots', style: 'work', name: { is: 'Vinnuskór', en: 'Work boots' }, colors: ['#c98a4b', '#8a5530', '#4a3b3f'] },
    { id: 'hold-builder-hammer', shape: 'cw-tool', cat: 'hold', kind: 'hammer', name: { is: 'Hamar', en: 'Toy hammer' }, colors: ['#e2505b', '#f6c636'] },
    { id: 'hold-builder-spanner', shape: 'cw-tool', cat: 'hold', kind: 'spanner', name: { is: 'Skrúflykill', en: 'Spanner' }, colors: ['#b9c3cf'] },

    // --- Farmer ---
    { id: 'hat-farmer-blue', shape: 'cw-strawhat', cat: 'hat', name: { is: 'Stráhattur með bláum borða', en: 'Straw hat with a blue band' }, colors: ['#ecc97e', '#3f7ccc'] },
    { id: 'hat-farmer-red', shape: 'cw-strawhat', cat: 'hat', name: { is: 'Stráhattur með rauðum borða', en: 'Straw hat with a red band' }, colors: ['#ecc97e', '#d8433f'] },
    { id: 'top-farmer-red', shape: 'cw-shirt', cat: 'top', sleeve: .55, pattern: 'check', patternSize: 18, name: { is: 'Rauðköflótt skyrta', en: 'Red check shirt' }, colors: ['#e0473f', '#5a1f2a', '#e0473f', '#f4e7c8'] },
    { id: 'top-farmer-green', shape: 'cw-shirt', cat: 'top', sleeve: .55, pattern: 'check', patternSize: 18, name: { is: 'Grænköflótt skyrta', en: 'Green check shirt' }, colors: ['#6cbf6a', '#ffffff', '#6cbf6a', '#f4e7c8'] },
    { id: 'hold-farmer-eggs', shape: 'cw-basket', cat: 'hold', name: { is: 'Eggjakarfa', en: 'Basket of eggs' }, colors: ['#c98a4b', '#e2505b'] },
    { id: 'hold-farmer-lamb', shape: 'cw-lamb', cat: 'hold', name: { is: 'Lambabangsi', en: 'Lamb plush' }, colors: ['#fbf6ee', '#e9cdb8', '#f48ca0'] },
  ]);

  /* Finished costume looks (first item = the tile icon). */
  DOLL.look([
    { id: 'look-fire-red', name: { is: 'Slökkviliðsmaður í rauðu', en: 'Firefighter in red' }, items: ['hat-fire-red', 'jacket-fire-red', 'pants-fire-red', 'boots-fire', 'hold-fire-hose'] },
    { id: 'look-fire-yellow', name: { is: 'Slökkviliðsmaður í gulu', en: 'Firefighter in yellow' }, items: ['hat-fire-yellow', 'jacket-fire-yellow', 'pants-fire-yellow', 'boots-fire', 'hold-fire-hose'] },
    { id: 'look-police-dark', name: { is: 'Lögregla í jakka', en: 'Police officer in a jacket' }, items: ['hat-police', 'jacket-police', 'top-police-light', 'pants-police', 'boots-police', 'hold-police-walkie'] },
    { id: 'look-police-light', name: { is: 'Lögregla í ljósblárri skyrtu', en: 'Police officer in a light blue shirt' }, items: ['hat-police', 'top-police-light', 'pants-police', 'boots-police', 'hold-police-walkie'] },
    { id: 'look-bus-blue', name: { is: 'Strætóbílstjóri í bláu', en: 'Bus driver in blue' }, items: ['hat-bus-navy', 'top-bus-blue', 'pants-bus', 'boots-pilot', 'hold-bus-wheel'] },
    { id: 'look-bus-yellow', name: { is: 'Strætóbílstjóri í gulu', en: 'Bus driver in yellow' }, items: ['hat-bus-yellow', 'top-bus-yellow', 'pants-bus', 'boots-pilot', 'hold-bus-wheel'] },
    { id: 'look-pilot-navy', name: { is: 'Flugmaður í jakka', en: 'Pilot in a jacket' }, items: ['hat-pilot-navy', 'jacket-pilot', 'top-pilot-white', 'pants-pilot', 'boots-pilot', 'hold-pilot-plane'] },
    { id: 'look-pilot-white', name: { is: 'Flugmaður í hvítri skyrtu', en: 'Pilot in a white shirt' }, items: ['hat-pilot-white', 'top-pilot-white', 'pants-pilot', 'boots-pilot', 'hold-pilot-plane'] },
    { id: 'look-space-white', name: { is: 'Geimfari í hvítu', en: 'Astronaut in white' }, items: ['hat-space-white', 'jacket-space-white', 'pants-space-white', 'boots-space-white', 'hold-space-rocket'] },
    { id: 'look-space-pink', name: { is: 'Geimfari í bleiku', en: 'Astronaut in pink' }, items: ['hat-space-pink', 'jacket-space-pink', 'pants-space-pink', 'boots-space-pink', 'hold-space-rocket'] },
    { id: 'look-builder-orange', name: { is: 'Smiður í appelsínugulu', en: 'Builder in orange' }, items: ['hat-builder-orange', 'jacket-builder-orange', 'tee-stripes', 'pants-builder', 'boots-builder', 'hold-builder-hammer'] },
    { id: 'look-builder-yellow', name: { is: 'Smiður í gulu', en: 'Builder in yellow' }, items: ['hat-builder-yellow', 'jacket-builder-yellow', 'top-long-mint', 'pants-builder', 'boots-builder', 'hold-builder-spanner'] },
    { id: 'look-farmer-blue', name: { is: 'Bóndi með egg', en: 'Farmer with eggs' }, items: ['hat-farmer-blue', 'top-farmer-red', 'dungarees-denim', 'boots-rain-green', 'hold-farmer-eggs'] },
    { id: 'look-farmer-yellow', name: { is: 'Bóndi með lamb', en: 'Farmer with a lamb' }, items: ['hat-farmer-red', 'top-farmer-green', 'dungarees-yellow', 'boots-rain-yellow', 'hold-farmer-lamb'] },
  ]);
})();
