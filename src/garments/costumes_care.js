/* =====================================================================
   Costumes: doctor, nurse, vet (animal doctor), chef, artist (painter)
   and cowgirl. Every piece is a normal item in its own chest tab (hats,
   tops, jackets, trousers, skirts, boots, necklaces, scarves and things
   to hold), and each costume is also registered as finished looks with
   DOLL.look so she can dress up in one tap and then swap single parts.
   Friendly and gentle: no needles, a heart or a soft plus instead of any
   medical emblem, our own designs only.
   Same drawing rules as examples.js: doll space (viewBox 0 0 400 800),
   fill → details → soft shading + tinted outline last, no SVG filters.
   Shape names start with 'cc-' (care costumes).
   ===================================================================== */
(function () {
  'use strict';
  const { shade, ink } = H;
  const SW = G.stroke;

  /* -------------------------------------------------------------
     Shared helpers
     ------------------------------------------------------------- */

  /** Final pass for a shape: soft shading overlay plus the tinted outline (same as examples.js). */
  const outline = (d, base, soft = 'v', sw = SW) =>
    `<path d="${d}" fill="url(#soft-${soft})" stroke="${ink(base)}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"/>`;

  /** Number formatting and point helpers. */
  const n1 = v => (Math.round(v * 10) / 10).toString();
  // "x,y" text of a point, rounded, for building SVG paths
  const P = p => n1(p[0]) + ',' + n1(p[1]);
  /** Mirror x to the right side (x → 400 - x). */
  const X = (side, x) => (side === 'L' ? x : 400 - x);
  // the same list of points mirrored to the right side
  const mirrorPts = pts => pts.map(([x, y]) => [400 - x, y]);
  /** Mirror any markup across the centre line (for right-side copies of left-side details). */
  const mirror = s => `<g transform="matrix(-1 0 0 1 400 0)">${s}</g>`;
  /** Point on a circle, angle in degrees. */
  const pol = (cx, cy, r, deg) => [cx + Math.cos(deg * Math.PI / 180) * r, cy + Math.sin(deg * Math.PI / 180) * r];

  /** Heart outline path (point down). */
  const heartD = (cx, cy, r) => `M${n1(cx)},${n1(cy + r * .95)} C${n1(cx - r * 1.5)},${n1(cy + r * .05)} ${n1(cx - r * .95)},${n1(cy - r * 1.05)} ${n1(cx)},${n1(cy - r * .38)} C${n1(cx + r * .95)},${n1(cy - r * 1.05)} ${n1(cx + r * 1.5)},${n1(cy + r * .05)} ${n1(cx)},${n1(cy + r * .95)} Z`;
  /** Outlined heart with a small white shine. */
  const heartO = (cx, cy, r, col, sw = 1.4) =>
    `<path d="${heartD(cx, cy, r)}" fill="${H.grad(col, 'r')}" stroke="${ink(col)}" stroke-width="${sw}" stroke-linejoin="round"/>` +
    `<path d="M${n1(cx - r * .7)},${n1(cy - r * .2)} q${n1(r * .15)},${n1(-r * .4)} ${n1(r * .5)},${n1(-r * .45)}" stroke="#fff" stroke-width="${n1(Math.max(1, r * .18))}" stroke-linecap="round" fill="none" opacity=".75"/>`;
  /** Soft rounded plus (friendly "help" sign, never a red cross): coloured bars with a tinted edge. */
  const plusO = (cx, cy, r, col) => {
    const d = `M${n1(cx - r)},${n1(cy)}H${n1(cx + r)}M${n1(cx)},${n1(cy - r)}V${n1(cy + r)}`;
    return `<path d="${d}" stroke="${ink(col)}" stroke-width="${n1(r * .9 + 2.4)}" stroke-linecap="round"/>` +
      `<path d="${d}" stroke="${col}" stroke-width="${n1(r * .9)}" stroke-linecap="round"/>`;
  };
  /** Outlined five-point star. */
  const starO = (cx, cy, r, col, sw = 1.4) => {
    let d = '';
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .48 : r; d += (i ? 'L' : 'M') + n1(cx + Math.cos(a) * rr) + ',' + n1(cy + Math.sin(a) * rr); }
    return `<path d="${d}Z" fill="${H.grad(col, 'r')}" stroke="${ink(col)}" stroke-width="${sw}" stroke-linejoin="round"/>`;
  };
  /** Round sewn-on button with two holes. */
  const button = (x, y, r, col) =>
    `<circle cx="${n1(x)}" cy="${n1(y)}" r="${r}" fill="${H.grad(col, 'r')}" stroke="${ink(col)}" stroke-width="1.4"/>` +
    `<circle cx="${n1(x - r * .3)}" cy="${n1(y)}" r="${n1(r * .17)}" fill="${ink(col)}"/><circle cx="${n1(x + r * .3)}" cy="${n1(y)}" r="${n1(r * .17)}" fill="${ink(col)}"/>`;
  /** Dashed stitching line. */
  const stitch = (d, c, w = 1.4) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-dasharray="3 2.5" stroke-linecap="round"/>`;
  /** Little animal paw print: one big pad and four toes. */
  const paw = (cx, cy, r, col, op = 1) =>
    `<g opacity="${op}"><ellipse cx="${n1(cx)}" cy="${n1(cy + r * .3)}" rx="${n1(r * .55)}" ry="${n1(r * .45)}" fill="${col}"/>` +
    [[-.6, -.3], [-.22, -.68], [.22, -.68], [.6, -.3]].map(([a, b]) => `<ellipse cx="${n1(cx + a * r)}" cy="${n1(cy + b * r)}" rx="${n1(r * .19)}" ry="${n1(r * .25)}" fill="${col}"/>`).join('') + '</g>';
  /** Thick soft tube (stethoscope tubing, leash, rope): tinted edge, colour, thin shine. */
  const tube = (d, col, w = 4.6) =>
    `<path d="${d}" fill="none" stroke="${ink(col)}" stroke-width="${w + 2.4}" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="${d}" fill="none" stroke="#fff" stroke-width="${n1(w * .28)}" stroke-linecap="round" opacity=".45" transform="translate(-.8,-.8)"/>`;

  /**
   * Open front for coats and vests: a clip that keeps the left and right front panels and
   * cuts a gap down the middle so the layer underneath shows.
   * edge = points of the LEFT front edge, from the neck down past the hem (right side is mirrored).
   * Returns { clip, edges } – clip url and the path of both front edges (for the outline).
   */
  const openFront = (id, edge) => {
    const r = mirrorPts(edge), last = edge[edge.length - 1];
    const left = `M-20,-20L${P([edge[0][0], -20])}` + edge.map(p => 'L' + P(p)).join('') + `L${P([last[0], 900])}L-20,900Z`;
    const right = `M420,-20L${P([400 - edge[0][0], -20])}` + r.map(p => 'L' + P(p)).join('') + `L${P([400 - last[0], 900])}L420,900Z`;
    return { clip: H.clip(id, left + right), edges: 'M' + edge.map(P).join('L') + 'M' + r.map(P).join('L') };
  };

  /* -------------------------------------------------------------
     Held things (slot 'hold', right hand = picture right, G.hands[1]).
     The whole thing is drawn twice: once behind the body (back) and once
     in front with the hand's outline cut out. So the hand always sits ON
     TOP of the handle / stick / paw it holds and looks like it grips it,
     while everything outside the hand is drawn in front of the clothes.
     ------------------------------------------------------------- */
  /** Outline of the right hand in doll space (same pose as core's hand: wrist point, tilt, mirrored). */
  const HAND_PTS = (() => {
    const local = [[-11.5, -2], [-14.5, 17], [-13.5, 28.5], [-7, 34.5], [0, 37.6], [7, 34.5], [13.7, 26.5], [17, 14.5], [11.5, -2]];
    const [wx, wy] = G.armPoint('R', 1), a = -8.7 * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
    return local.map(([x, y]) => { const u = -x; return [wx + u * c - y * s, wy - 2 + u * s + y * c]; });
  })();
  /** Clip = whole doll space minus the right hand (even-odd hole). */
  const NOT_HAND = H.def('cc-nothand', `<clipPath id="cc-nothand"><path clip-rule="evenodd" d="M-50,-50H450V850H-50Z${H.polyPath(HAND_PTS)}"/></clipPath>`);
  /** Return a held thing as {back, front} so the hand covers the part it grips. */
  const held = markup => ({ back: markup, front: `<g clip-path="${NOT_HAND}">${markup}</g>` });
  /** Grip point for sticks (spoon, whisk, brush, toy horse): a little inside the palm. */
  const GRIP = [302, 462];
  /** Group rotated so local "up" (−y) points along a stick held in the hand, tilted `deg` outward. */
  const stickFrame = (deg, inner, at = GRIP) => `<g transform="translate(${at[0]},${at[1]}) rotate(${deg})">${inner}</g>`;

  /* =====================================================================
     HATS (slot hat): surgical cap, nurse cap, chef's toque, painter's
     beret and cowgirl hat. All sit down on the head over the hair (hair
     top ≈ y 60, width ≈ 106–294) and come down to ≈ y 112–132.
     it.kind picks the hat; colours per kind are listed below.
     ===================================================================== */
  DOLL.shape('cc-hat', {
    slot: 'hat',
    draw(it) {
      const k = it.kind;

      /* Soft surgical cap (doctor): patterned fabric over the whole top of the head,
         a folded band at the forehead and little ties knotted at the side.
         colors: [fabric, motif, band] */
      if (k === 'scrub') {
        const [c, motif = '#ffffff', band = shade(c, -.12)] = it.colors;
        const cap = 'M106,126 C98,66 146,38 200,38 C254,38 302,66 294,126 Q200,108 106,126 Z';
        const bandD = 'M104,130 Q200,112 296,130 L294,108 Q200,90 106,108 Z';
        const ties = 'M290,112 Q306,116 312,140 L304,142 Q300,124 288,120 Z M292,114 Q312,108 320,126 L313,130 Q306,118 292,120 Z';
        return `<path d="${cap}" fill="${H.pat(it.pattern || 'dots', c, motif, it.patternSize || 22)}"/>` +
          // soft gathers where the fabric meets the band, and a shine
          H.line('M140,104 q4,-10 2,-20 M172,98 q2,-10 0,-18 M228,98 q-2,-10 0,-18 M260,104 q-4,-10 -2,-20', c, 1.6, .4) +
          `<path d="M134,70 Q150,52 178,46" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".45"/>` +
          outline(cap, c) +
          `<path d="${ties}" fill="${H.grad(band)}" stroke="${ink(band)}" stroke-width="1.8" stroke-linejoin="round"/>` +
          `<path d="${bandD}" fill="${H.grad(band)}"/>` + stitch('M110,124 Q200,106 290,124', shade(band, .35), 1.3) + outline(bandD, band, 'v', 2.2) +
          `<ellipse cx="292" cy="116" rx="7" ry="6" fill="${H.grad(band, 'r')}" stroke="${ink(band)}" stroke-width="1.8"/>`;
      }

      /* Nurse cap: a soft white crown behind a tall folded front band with a
         coloured stripe and a heart. colors: [cap, stripe, heart] */
      if (k === 'nurse') {
        const [c, stripe, heart = stripe] = it.colors;
        const dome = 'M114,98 C110,56 150,40 200,40 C250,40 290,56 286,98 Z';
        const band = 'M110,128 Q200,108 290,128 L298,80 Q200,58 102,80 Z';
        const stripeD = 'M101,86 Q200,64 299,86 L298,79 Q200,57 102,79 Z';
        return `<path d="${dome}" fill="${H.grad(shade(c, -.04))}"/>` +
          H.line('M150,62 q12,10 16,26 M250,62 q-12,10 -16,26 M200,44 v40', c, 1.5, .35) + outline(dome, c) +
          `<path d="${band}" fill="${H.grad(c)}"/>` +
          `<path d="${stripeD}" fill="${H.grad(stripe)}"/>` +
          // pressed fold along the bottom of the band
          `<path d="M112,120 Q200,101 288,120" fill="none" stroke="${shade(c, -.12)}" stroke-width="2" opacity=".7"/>` +
          `<path d="M120,90 Q160,78 190,76" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" opacity=".7"/>` +
          outline(band, c, 'v') + heartO(200, 95, 13, heart, 1.6);
      }

      /* Chef's toque: a tall puffy top with pleats over a stiff band.
         colors: [puff, band, accent]; it.heart = little heart on the band */
      if (k === 'toque') {
        const [c, band = c, acc = '#ef5b7a'] = it.colors;
        const puff = 'M114,98 C86,94 82,60 106,50 C100,24 132,10 156,22 C166,6 194,2 210,16 C226,2 260,8 266,28 C292,18 318,42 302,64 C320,78 310,100 286,98 Q200,84 114,98 Z';
        const bandD = 'M108,132 Q200,114 292,132 L290,92 Q200,78 110,92 Z';
        const pleats = 'M146,94 Q140,70 148,40 M174,90 Q172,58 178,24 M200,88 V18 M226,90 Q228,58 222,24 M254,94 Q260,70 252,40';
        return `<path d="${puff}" fill="${H.grad(c)}"/>` + H.line(pleats, c, 1.8, .35) +
          // soft puff shading in the dips between the bumps
          `<path d="M110,56 Q130,64 150,60 M160,24 Q180,34 206,22 M264,30 Q280,42 296,62" fill="none" stroke="${shade(c, -.12)}" stroke-width="3" stroke-linecap="round" opacity=".5"/>` +
          `<path d="M120,48 Q130,30 150,26" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".7"/>` +
          outline(puff, c) +
          `<path d="${bandD}" fill="${H.grad(band)}"/>` +
          H.line('M112,104 Q200,88 288,104 M111,118 Q200,102 289,118', band, 1.4, .3) +
          outline(bandD, band) + (it.heart ? heartO(200, 110, 9, acc, 1.4) : '');
      }

      /* Painter's beret: soft round beret drooping to one side, a little stalk on top,
         a narrow band and a flower pin. colors: [beret, pin flower] */
      if (k === 'beret') {
        const [c, pin = '#f7d660'] = it.colors;
        const beret = 'M108,110 C78,104 72,68 102,48 C132,28 186,24 234,28 C282,34 314,56 306,82 C302,98 292,106 284,110 Q200,94 108,110 Z';
        const band = 'M110,116 Q200,98 290,116 L288,104 Q200,86 112,104 Z';
        const petals = Array.from({ length: 5 }, (_, i) => { const [x, y] = pol(138, 92, 5.5, -90 + i * 72); return `<circle cx="${n1(x)}" cy="${n1(y)}" r="4.4" fill="${H.grad(pin, 'r')}" stroke="${ink(pin)}" stroke-width="1.1"/>`; }).join('');
        return `<path d="${beret}" fill="${H.grad(c, 'r')}"/>` +
          // soft fold where the beret droops, and a highlight
          `<path d="M96,92 Q130,74 176,72" fill="none" stroke="${shade(c, -.25)}" stroke-width="2.4" stroke-linecap="round" opacity=".5"/>` +
          `<path d="M130,44 Q170,30 214,34" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".4"/>` +
          outline(beret, c, 'r') +
          `<path d="M204,30 q2,-10 11,-13" fill="none" stroke="${ink(c)}" stroke-width="6.4" stroke-linecap="round"/><path d="M204,30 q2,-10 11,-13" fill="none" stroke="${c}" stroke-width="3.8" stroke-linecap="round"/>` +
          `<path d="${band}" fill="${H.grad(shade(c, -.12))}"/>` + outline(band, c, 'v', 2) +
          petals + `<circle cx="138" cy="92" r="3" fill="${H.grad('#ffffff', 'r')}" stroke="${ink(pin)}" stroke-width=".9"/>`;
      }

      /* Cowgirl hat: pinched crown with a hat band and a star (or heart),
         wide brim curling up at both ends with stitching.
         colors: [felt, band, star]; it.motif = 'star' | 'heart' */
      const [c, band = '#7a4a2a', mc = '#f2c34d'] = it.colors;
      const crown = 'M118,100 C112,70 118,42 136,30 C152,22 172,32 200,26 C228,32 248,22 264,30 C282,42 288,70 282,100 Z';
      const brim = 'M58,82 C54,100 84,124 200,126 C316,124 346,100 342,82 C330,96 306,100 286,94 C250,84 150,84 114,94 C94,100 70,96 58,82 Z';
      const bandD = 'M117,88 Q200,74 283,88 L282,72 Q200,58 118,72 Z';
      const motif = it.motif === 'heart' ? heartO(200, 74, 9, mc, 1.4) : starO(200, 74, 10, mc, 1.4);
      return `<path d="${crown}" fill="${H.fill(it)}"/>` +
        // the pinch in the top of the crown
        `<path d="M156,36 Q200,54 244,36" fill="none" stroke="${shade(c, -.25)}" stroke-width="3" stroke-linecap="round" opacity=".55"/>` +
        H.line('M146,44 Q140,64 142,84 M254,44 Q260,64 258,84', c, 1.8, .4) +
        `<path d="M132,58 Q138,42 154,36" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".45"/>` +
        outline(crown, c) +
        `<path d="${bandD}" fill="${H.grad(band)}"/>` + outline(bandD, band, 'v', 2) + motif +
        `<path d="${brim}" fill="${H.fill(it)}"/>` +
        stitch('M66,90 C80,102 100,104 116,100 C150,92 250,92 284,100 C300,104 320,102 334,90', shade(c, .35), 1.4) +
        `<path d="M80,104 Q140,120 200,121 Q260,120 320,104" fill="none" stroke="${shade(c, -.25)}" stroke-width="3" opacity=".35"/>` +
        outline(brim, c);
    },
  });

  /* =====================================================================
     STETHOSCOPE (slot necklace): the tube lies round the back of the neck,
     the ear pieces hang down on one side and the round chest piece with
     a heart on the other. colors: [tube, metal, heart]
     ===================================================================== */
  DOLL.shape('cc-stethoscope', {
    slot: 'necklace',
    thumb: [136, 214, 128, 152],
    draw(it) {
      const [c, metal = '#d9dee6', heart = '#ef5b7a'] = it.colors;
      // left side: tube down to the Y joint, then two metal ear tubes with soft round tips
      const left = 'M186,240 C178,256 170,276 168,298';
      const ears = `<path d="M168,298 L160,322 M168,298 L176,324" fill="none" stroke="${ink(metal)}" stroke-width="5" stroke-linecap="round"/>` +
        `<path d="M168,298 L160,322 M168,298 L176,324" fill="none" stroke="${metal}" stroke-width="2.8" stroke-linecap="round"/>` +
        `<circle cx="159.5" cy="324" r="4" fill="${H.grad(c, 'r')}" stroke="${ink(c)}" stroke-width="1.3"/>` +
        `<circle cx="176.5" cy="326" r="4" fill="${H.grad(c, 'r')}" stroke="${ink(c)}" stroke-width="1.3"/>` +
        `<ellipse cx="168" cy="298" rx="4.4" ry="3.6" fill="${H.grad(metal, 'r')}" stroke="${ink(metal)}" stroke-width="1.3"/>`;
      // right side: tube down to the round chest piece
      const right = 'M214,240 C224,256 232,282 230,308 C229,322 226,330 224,336';
      const chest = `<circle cx="224" cy="346" r="12" fill="${H.grad(metal, 'r')}" stroke="${ink(metal)}" stroke-width="1.8"/>` +
        `<circle cx="224" cy="346" r="8" fill="${H.grad(shade(c, .3), 'r')}" stroke="${ink(metal)}" stroke-width="1"/>` +
        heartO(224, 346.5, 5, heart, 1) +
        `<rect x="220" y="332" width="8" height="5" rx="2" fill="${H.grad(metal)}" stroke="${ink(metal)}" stroke-width="1.2"/>`;
      return {
        // the bit of tube round the back of the neck (hidden on the doll, closes the loop in the chest tile)
        back: tube('M186,242 C184,222 216,222 214,242', c),
        front: tube(left, c) + ears + tube(right, c) + chest,
      };
    },
  });

  /* =====================================================================
     NECKERCHIEF (slot scarf): a triangle scarf knotted at the side of
     the neck, cowgirl style. colors: [cloth, dots]
     ===================================================================== */
  DOLL.shape('cc-neckerchief', {
    slot: 'scarf',
    thumb: [150, 222, 100, 110],
    draw(it) {
      const [c, dot = '#ffffff'] = it.colors;
      const fill = H.pat('dots', c, dot, 12);
      const band = 'M183,240 Q200,252 217,240 L220,252 Q200,266 180,252 Z';
      const tri = 'M172,252 Q200,268 228,252 L208,304 Q200,316 192,304 Z';
      // knot on the right side of the neck with two short tails
      const tails = 'M222,250 Q236,256 238,272 L230,272 Q228,262 220,258 Z M224,248 Q240,244 246,256 L239,260 Q234,252 224,254 Z';
      return `<path d="${band}" fill="${fill}"/>` + outline(band, c, 'v', 2.2) +
        `<path d="${tri}" fill="${fill}"/>` +
        H.line('M184,262 Q196,280 200,304 M216,262 Q206,280 200,304', c, 1.4, .35) +
        outline(tri, c, 'v', 2.4) +
        `<path d="${tails}" fill="${fill}" stroke="${ink(c)}" stroke-width="2" stroke-linejoin="round"/>` +
        `<ellipse cx="222" cy="253" rx="6" ry="5.5" fill="${H.grad(c, 'r')}" stroke="${ink(c)}" stroke-width="2"/>`;
    },
  });

  /* =====================================================================
     TOPS (slot top)
     ===================================================================== */

  /* -------------------------------------------------------------
     Scrubs top (doctor, vet): short sleeves, V-neck with a contrast
     band, chest pocket with a pen, two lower pockets.
     colors: [fabric, trim, motif]; it.paws = little paw prints all over,
     it.motif = 'heart' | 'paw' on the chest pocket
     ------------------------------------------------------------- */
  DOLL.shape('cc-scrubs', {
    slot: 'top',
    draw(it) {
      const [c, trim = shade(c, -.18), motif = '#ffffff'] = it.colors;
      const d = G.shirtPath({ sleeve: .32, pad: 5, sleevePad: 5, bottom: 466, neck: 'v', neckDepth: 40 });
      const clip = H.clip('c-' + it.id, d);
      // scattered paw prints (vet tops)
      const paws = it.paws ? [[160, 300, 8, -20], [236, 296, 7, 15], [204, 344, 8, 5], [150, 378, 7, -10], [252, 382, 8, 20], [184, 428, 7, -5], [234, 448, 7, 10], [116, 300, 6, -25], [284, 302, 6, 25]]
        .map(([x, y, r, rot]) => `<g transform="rotate(${rot} ${x} ${y})">${paw(x, y, r, motif, .5)}</g>`).join('') : '';
      // small patch pocket with a trim-coloured top band, drawn with its top-left corner at x,y (w wide, h tall)
      const pocket = (x, y, w, h) => `<path d="M${x},${y} h${w} v${h - 6} q0,6 -6,6 h${-(w - 12)} q-6,0 -6,-6 Z" fill="${H.fill(it)}" stroke="${ink(c)}" stroke-width="1.8" stroke-linejoin="round"/>` +
        `<path d="M${x},${y + 5} h${w}" stroke="${trim}" stroke-width="3"/>`;
      const pen = `<rect x="168" y="306" width="5" height="18" rx="2" fill="${H.grad(motif === '#ffffff' ? trim : motif)}" stroke="${ink(trim)}" stroke-width="1.2"/>` +
        `<path d="M172,308 v10" stroke="#fff" stroke-width="1.2" opacity=".7"/>`;
      const badge = it.motif === 'paw' ? paw(162, 334, 6.5, trim) : heartO(162, 333, 6, trim, 1.2);
      // trim-coloured band round the sleeve of the given side ("L" or "R")
      const sleeveHem = side => `<path d="${G.armPath(side, .26, .32, 5.5)}" fill="${H.grad(trim)}"/>`;
      return `<path d="${d}" fill="${H.fill(it)}"/>` +
        `<g clip-path="${clip}">${paws}${sleeveHem('L')}${sleeveHem('R')}<rect x="0" y="456" width="400" height="12" fill="${shade(c, -.05)}"/></g>` +
        // V-neck band
        `<path d="M181.5,248 L200,290 L218.5,248" fill="none" stroke="${ink(trim)}" stroke-width="8.6" stroke-linejoin="round"/>` +
        `<path d="M181.5,248 L200,290 L218.5,248" fill="none" stroke="${trim}" stroke-width="6" stroke-linejoin="round"/>` +
        pen + pocket(150, 318, 28, 28) + badge +
        pocket(148, 404, 34, 34) + pocket(218, 404, 34, 34) +
        // side slits and soft folds
        H.line('M145,456 v10 M255,456 v10 M152,326 q7,12 4,26 M248,326 q-7,12 -4,26 M196,380 q4,10 2,22', c, 1.6, .45) +
        outline(d, c);
    },
  });

  /* -------------------------------------------------------------
     Chef's jacket: double-breasted with two rows of knotted buttons,
     a little stand-up collar, rolled cuffs and a waist apron tied on top.
     colors: [jacket, buttons, apron, apron stripe]; it.apronMotif = 'heart' | 'none'
     ------------------------------------------------------------- */
  DOLL.shape('cc-chefcoat', {
    slot: 'top',
    thumb: [56, 222, 288, 380],
    draw(it) {
      const [c, btn = '#e2505b', apron = '#ffffff', stripe] = it.colors;
      const d = G.shirtPath({ sleeve: 1, pad: 5, sleevePad: 5, bottom: 472, neck: 'high' });
      const clip = H.clip('c-' + it.id, d);
      // edge of the front flap that buttons over to the right
      const flap = 'M214,246 Q236,262 238,290 L238,472';
      // a button, used for both the left and right column of buttons
      const knot = (x, y) => button(x, y, 4.4, btn);
      const buttons = [292, 330, 368].map(y => knot(178, y) + knot(222, y)).join('');
      // coloured cuff band at the wrist of the given side, with a thin fold line
      const cuff = side => `<path d="${G.armPath(side, .84, .98, 7.5)}" fill="${H.grad(shade(c, -.04))}" stroke="${ink(c)}" stroke-width="1.8" stroke-linejoin="round"/>` +
        H.line(G.armPath(side, .9, .91, 7.5), c, 1.2, .35);
      const collar = 'M183,232 Q200,240 217,232 L218,248 Q200,256 182,248 Z';
      // waist apron: wide band, softly flared skirt, pocket, ties hanging at the left hip
      const apronD = 'M146,404 L254,404 L266,578 Q200,590 134,578 Z';
      const apronFill = stripe ? H.pat('stripes', apron, stripe, 14) : H.grad(apron);
      const aClip = H.clip('c-' + it.id + '-apron', apronD);
      const pocketD = 'M176,452 h48 v24 q0,8 -8,8 h-32 q-8,0 -8,-8 Z';
      const pocketMark = it.apronMotif === 'heart' ? heartO(200, 467, 7, btn, 1.2) : '';
      const ties = `<path d="M144,410 Q130,420 132,446 L140,446 Q140,424 150,414 Z M146,410 Q126,404 118,420 L126,426 Q132,414 148,416 Z" fill="${H.grad(apron)}" stroke="${ink(apron)}" stroke-width="1.8" stroke-linejoin="round"/>`;
      return `<path d="${d}" fill="${H.fill(it)}"/>` +
        `<g clip-path="${clip}"><path d="M240,262 V472" stroke="${shade(c, -.12)}" stroke-width="5" opacity=".6"/></g>` +
        cuff('L') + cuff('R') +
        H.line('M152,322 q7,12 4,26 M248,322 q-7,12 -4,26', c, 1.6, .45) +
        outline(d, c) +
        H.line(flap, c, 2.2, .75) + buttons +
        `<path d="${collar}" fill="${H.grad(c)}" stroke="${ink(c)}" stroke-width="2.2" stroke-linejoin="round"/>` +
        `<path d="${apronD}" fill="${apronFill}"/>` +
        `<g clip-path="${aClip}"><rect x="0" y="566" width="400" height="30" fill="${shade(apron, -.06)}"/>` +
          H.line('M170,500 q-4,30 -10,70 M232,500 q4,30 10,70', apron, 1.6, .35) + `</g>` +
        stitch('M138,570 Q200,582 262,570', ink(apron), 1.2) +
        `<path d="${pocketD}" fill="${H.grad(shade(apron, -.03))}" stroke="${ink(apron)}" stroke-width="1.8" stroke-linejoin="round"/>` + pocketMark +
        outline(apronD, apron) +
        `<rect x="142" y="398" width="116" height="14" rx="5" fill="${H.grad(apron)}" stroke="${ink(apron)}" stroke-width="2"/>` + ties +
        `<ellipse cx="146" cy="410" rx="6" ry="5" fill="${H.grad(apron, 'r')}" stroke="${ink(apron)}" stroke-width="1.8"/>`;
    },
  });

  /* =====================================================================
     NURSE DRESS (slot dress): short puff sleeves with white cuffs, a
     round white collar, white bib apron with a heart, white belt and a
     knee-length skirt. colors: [dress, apron, heart]
     ===================================================================== */
  DOLL.shape('cc-nursedress', {
    slot: 'dress',
    occupies: ['dress', 'top', 'bottom'],
    thumb: [50, 230, 300, 380],
    draw(it) {
      const [c, apron = '#ffffff', heart = '#ef5b7a'] = it.colors;
      const skirt = G.skirtPath({ top: 400, bottom: 588, flare: 40, pad: 4 });
      const bodice = G.shirtPath({ sleeve: .27, pad: 4, sleevePad: 8, sleeveFlare: 3, bottom: 412, neck: 'round' });
      // apron-coloured cuff at the sleeve end of the given side
      const cuff = side => `<path d="${G.armPath(side, .22, .27, 11)}" fill="${H.grad(apron)}" stroke="${ink(c)}" stroke-width="1.8" stroke-linejoin="round"/>`;
      const bib = 'M174,298 Q200,292 226,298 L224,404 L176,404 Z';
      const straps = 'M176,302 L160,262 M224,302 L240,262';
      const aSkirt = 'M160,404 L240,404 L254,560 Q200,572 146,560 Z';
      const collar = 'M199,258 Q186,258 176,250 Q166,258 172,270 Q186,278 199,266 Z';
      // little scallops along the apron hem
      let lace = 'M146,560';
      for (let i = 0; i < 9; i++) lace += `q${n1(54 / 9)},${i % 2 ? 6 : 8} ${n1(108 / 9)},${n1(12 / 9 * (i < 4.5 ? 1 : -1))}`;
      return `<path d="${skirt}" fill="${H.grad(c)}"/>` +
        H.line('M162,450 q-10,60 -26,124 M200,440 v140 M238,450 q10,60 26,124', c, 1.8, .4) +
        outline(skirt, c, 'h') +
        `<path d="${bodice}" fill="${H.grad(c)}"/>` + H.line('M152,326 q7,12 4,26 M248,326 q-7,12 -4,26', c, 1.6, .45) + outline(bodice, c) +
        cuff('L') + cuff('R') +
        // apron skirt with a pocket, then the belt and the bib with a big heart
        `<path d="${aSkirt}" fill="${H.grad(apron)}"/>` + H.line('M180,420 q-6,60 -14,130 M220,420 q6,60 14,130', apron, 1.4, .3) +
        `<path d="M184,470 h32 v20 q0,8 -8,8 h-16 q-8,0 -8,-8 Z" fill="${H.grad(shade(apron, -.03))}" stroke="${ink(apron)}" stroke-width="1.6"/>` + heartO(200, 483, 5.5, heart, 1.1) +
        `<path d="${lace}" fill="none" stroke="${heart}" stroke-width="2" stroke-linecap="round" opacity=".7"/>` +
        outline(aSkirt, apron) +
        `<path d="${straps}" stroke="${ink(apron)}" stroke-width="9" stroke-linecap="round"/><path d="${straps}" stroke="${apron}" stroke-width="6.4" stroke-linecap="round"/>` +
        `<path d="${bib}" fill="${H.grad(apron)}"/>` + outline(bib, apron) + heartO(200, 346, 13, heart, 1.6) +
        `<rect x="${n1(G.torsoX(404) - 4)}" y="398" width="${n1(400 - 2 * (G.torsoX(404) - 4))}" height="13" rx="5" fill="${H.grad(apron)}" stroke="${ink(apron)}" stroke-width="2"/>` +
        `<path d="${collar}" fill="${H.grad(apron)}" stroke="${ink(c)}" stroke-width="2" stroke-linejoin="round"/>` +
        mirror(`<path d="${collar}" fill="${H.grad(apron)}" stroke="${ink(c)}" stroke-width="2" stroke-linejoin="round"/>`);
    },
  });

  /* =====================================================================
     JACKETS (slot jacket)
     ===================================================================== */

  /* -------------------------------------------------------------
     Doctor's coat: long white coat worn open, notched lapels, chest
     pocket with pens, a name badge with a heart, big lower pockets,
     buttons and turned-back cuffs.
     colors: [coat, trim (pocket edges, pens), badge heart]
     ------------------------------------------------------------- */
  DOLL.shape('cc-labcoat', {
    slot: 'jacket',
    thumb: [40, 222, 320, 360],
    draw(it) {
      const [c, trim = '#7fb8e6', heart = '#ef5b7a'] = it.colors;
      const bottom = 562;
      const d = G.shirtPath({ sleeve: 1, pad: 12, sleevePad: 8, bottom, flare: 20, neck: 'v', neckDepth: 70 });
      const o = openFront('c-' + it.id + '-open', [[184, 246], [188, 300], [191, 336], [190, 440], [187, bottom + 12]]);
      const dc = H.clip('c-' + it.id, d);
      // big lower pocket (left; mirrored for the right) with a coloured edge
      const pocket = `<path d="M140,454 h40 v34 q0,8 -8,8 h-24 q-8,0 -8,-8 Z" fill="${H.grad(c)}" stroke="${ink(c)}" stroke-width="1.8" stroke-linejoin="round"/>` +
        `<path d="M140,458 h40" stroke="${trim}" stroke-width="3.4"/>`;
      const chest = `<rect x="153" y="306" width="6" height="22" rx="2.5" fill="${H.grad(trim)}" stroke="${ink(trim)}" stroke-width="1.2"/>` +
        `<rect x="162" y="302" width="6" height="26" rx="2.5" fill="${H.grad(heart)}" stroke="${ink(heart)}" stroke-width="1.2"/>` +
        `<path d="M148,318 h30 v22 q0,6 -6,6 h-18 q-6,0 -6,-6 Z" fill="${H.grad(c)}" stroke="${ink(c)}" stroke-width="1.8" stroke-linejoin="round"/>` +
        `<path d="M148,322 h30" stroke="${trim}" stroke-width="3"/>`;
      const badge = `<rect x="222" y="318" width="32" height="18" rx="4" fill="${H.grad('#ffffff')}" stroke="${ink(trim)}" stroke-width="1.6"/>` +
        `<rect x="222" y="318" width="32" height="6" rx="3" fill="${trim}"/>` + heartO(238, 329, 4.5, heart, 1);
      // coloured cuff with a thin trim stripe at the wrist of the given side
      const cuff = side => `<path d="${G.armPath(side, .86, .97, 10)}" fill="${H.grad(shade(c, -.03))}" stroke="${ink(c)}" stroke-width="1.8" stroke-linejoin="round"/>` +
        `<path d="${G.armPath(side, .86, .875, 10)}" fill="${trim}" opacity=".8"/>`;
      // collar lying on the shoulder and the lapel folded back below it (left; mirrored)
      const collar = H.polyPath([[185, 246], [170, 250], [156, 260], [160, 272], [174, 271]]);
      const lapel = H.polyPath([[174, 271], [163, 279], [189, 338], [187, 298], [185, 256]]);
      const lap = `<path d="${lapel}" fill="${H.grad(shade(c, -.02))}" stroke="${ink(c)}" stroke-width="2.2" stroke-linejoin="round"/>` +
        `<path d="${collar}" fill="${H.grad(c)}" stroke="${ink(c)}" stroke-width="2.2" stroke-linejoin="round"/>`;
      const inner = `<g clip-path="${dc}">` +
        H.line('M150,346 q8,12 5,28 M250,346 q-8,12 -5,28 M150,420 q-6,50 -14,130 M250,420 q6,50 14,130 M98,362 q10,5 18,0 M302,362 q-10,5 -18,0', c, 1.6, .4) +
        `<path d="M146,300 Q136,330 138,380 Q142,338 154,306 Z" fill="#fff" opacity=".5"/></g>` +
        pocket + mirror(pocket) + chest + badge;
      return {
        // inside of the back of the coat, only seen through the open front in the chest tile
        back: `<path d="${d}" fill="${H.grad(shade(c, -.18))}"/>`,
        front: `<g clip-path="${o.clip}"><path d="${d}" fill="${H.grad(c)}"/>${inner}${outline(d, c)}</g>` +
          `<g clip-path="${dc}"><path d="${o.edges}" fill="none" stroke="${ink(c)}" stroke-width="${SW}" stroke-linecap="round"/></g>` +
          cuff('L') + cuff('R') +
          [360, 410, 460, 510].map(y => button(181, y, 3.8, shade(c, -.1))).join('') +
          lap + mirror(lap),
      };
    },
  });

  /* -------------------------------------------------------------
     Painter's smock: long loose smock with puffy sleeves gathered at the
     wrists, a gathered yoke, a big floppy bow, a pocket with brushes and
     happy paint splodges. colors: [smock, bow, ...paint colours]
     ------------------------------------------------------------- */
  DOLL.shape('cc-smock', {
    slot: 'jacket',
    thumb: [40, 222, 320, 330],
    draw(it) {
      const [c, bow, ...paints] = it.colors;
      const bottom = 528;
      const d = G.shirtPath({ sleeve: 1, pad: 12, sleevePad: 10, sleeveFlare: 5, bottom, flare: 34, neck: 'round', neckDepth: 6 });
      const clip = H.clip('c-' + it.id, d);
      /** Paint splodge: a wobbly blob with one little drop beside it. */
      const splat = (cx, cy, r, col, seed) => {
        const pts = Array.from({ length: 9 }, (_, i) => { const a = i / 9 * Math.PI * 2, k = .75 + .3 * (((i + 1) * seed) % 5) / 4; return [cx + Math.cos(a) * r * k, cy + Math.sin(a) * r * k]; });
        return `<path d="${H.smooth(pts)}" fill="${col}" opacity=".9"/><circle cx="${n1(cx + r * 1.3)}" cy="${n1(cy + r * .9)}" r="${n1(r * .25)}" fill="${col}" opacity=".9"/>`;
      };
      const spots = [[156, 360, 7, 3], [238, 336, 6, 2], [176, 480, 8, 4], [262, 470, 6, 3], [120, 330, 5, 2], [214, 402, 5, 4], [286, 330, 5, 3], [140, 500, 5, 2]]
        .map(([x, y, r, s], i) => splat(x, y, r, paints[i % paints.length], s)).join('');
      // gathered elastic cuffs and the gathered yoke line
      const cuff = side => `<path d="${G.armPath(side, .88, .95, 6)}" fill="${H.grad(shade(c, -.06))}" stroke="${ink(c)}" stroke-width="1.6" stroke-linejoin="round"/>`;
      const gathers = Array.from({ length: 13 }, (_, i) => `M${140 + i * 10},300 q1.5,9 0,18`).join('');
      // pocket on the right with two brushes peeking out
      const brush = (x, col, tip) => `<rect x="${x - 2}" y="424" width="4" height="26" rx="1.5" fill="${H.grad(col)}" stroke="${ink(col)}" stroke-width="1"/>` +
        `<path d="M${x - 2.5},425 q2.5,-12 5,0 Z" fill="${tip}" stroke="${ink(tip)}" stroke-width="1"/>`;
      const pocket = brush(226, '#e8b86a', paints[0] || '#ef5b7a') + brush(236, '#7fb8e6', paints[1] || '#5fae5a') +
        `<path d="M214,438 h40 v26 q0,8 -8,8 h-24 q-8,0 -8,-8 Z" fill="${H.grad(c)}" stroke="${ink(c)}" stroke-width="1.8" stroke-linejoin="round"/>` +
        stitch('M216,443 h36', ink(c), 1.1);
      // floppy bow at the neck: two loops, two tails, a knot
      const loops = 'M200,262 C186,248 166,252 168,266 C170,278 188,274 200,262 Z';
      const tail = 'M197,265 C192,280 186,292 180,302 L190,304 C194,292 198,280 200,268 Z';
      const bowM = `<path d="${tail}" fill="${H.grad(bow)}" stroke="${ink(bow)}" stroke-width="1.8" stroke-linejoin="round"/>` +
        `<path d="${loops}" fill="${H.grad(bow)}" stroke="${ink(bow)}" stroke-width="2" stroke-linejoin="round"/>`;
      return {
        back: `<path d="${d}" fill="${H.grad(shade(c, -.2))}"/>`,
        front: `<path d="${d}" fill="${H.grad(c)}"/>` +
          `<g clip-path="${clip}">${spots}<path d="M60,296 Q200,306 340,296" fill="none" stroke="${ink(c)}" stroke-width="1.6" opacity=".5"/>` +
          `<path d="${gathers}" fill="none" stroke="${ink(c)}" stroke-width="1.3" opacity=".35"/></g>` +
          H.line('M150,346 q8,12 5,28 M250,346 q-8,12 -5,28 M160,420 q-8,50 -20,100 M240,420 q8,50 20,100 M98,362 q10,5 18,0 M302,362 q-10,5 -18,0', c, 1.6, .4) +
          cuff('L') + cuff('R') + pocket + outline(d, c) +
          bowM + mirror(bowM) + `<ellipse cx="200" cy="264" rx="6.5" ry="6" fill="${H.grad(bow, 'r')}" stroke="${ink(bow)}" stroke-width="2"/>`,
      };
    },
  });

  /* -------------------------------------------------------------
     Cowgirl vest: sleeveless suede vest worn open, a stitched yoke with
     a row of fringe across the chest, fringe along the hem, pointed front
     tips and a star (or heart) stud. colors: [suede, fringe, stud]; it.motif
     ------------------------------------------------------------- */
  DOLL.shape('cc-vest', {
    slot: 'jacket',
    thumb: [70, 226, 260, 270],
    draw(it) {
      const [c, fr = shade(c, -.12), stud = '#f2c34d'] = it.colors;
      const bottom = 446;
      const d = G.shirtPath({ sleeve: 0, pad: 11, bottom, neck: 'v', neckDepth: 70 });
      const o = openFront('c-' + it.id + '-open', [[183, 246], [192, 326], [194, 380], [192, 470]]);
      const dc = H.clip('c-' + it.id, d);
      /** A row of fringe strands hanging from a line (left side; mirrored). */
      const fringe = (x0, x1, yAt, len) => {
        let s = '';
        for (let x = x0; x <= x1; x += 5) { const y = yAt(x); s += `M${n1(x)},${n1(y)} l${n1(-.6)},${len}`; }
        return `<path d="${s}" stroke="${ink(fr)}" stroke-width="4.4" stroke-linecap="round"/><path d="${s}" stroke="${fr}" stroke-width="2.6" stroke-linecap="round"/>`;
      };
      const tip = H.polyPath([[150, bottom - 4], [190, bottom - 4], [189, bottom + 18]]);
      const hemFringe = fringe(146, 182, x => bottom + (x - 146) / 36 * 14 - 1, 16);
      const yokeFringe = fringe(140, 186, x => 300 + (x - 140) * .2, 14);
      const motif = it.motif === 'heart' ? heartO(166, 352, 8, stud, 1.4) : starO(166, 352, 9, stud, 1.4);
      const side = `<path d="${tip}" fill="${H.grad(c)}" stroke="${ink(c)}" stroke-width="2.2" stroke-linejoin="round"/>` + hemFringe;
      return {
        back: `<path d="${d}" fill="${H.grad(shade(c, -.25))}"/>`,
        front: side + mirror(side) +
          `<g clip-path="${o.clip}"><path d="${d}" fill="${H.fill(it)}"/>` +
            `<g clip-path="${dc}">${stitch('M120,296 Q160,300 192,310 M280,296 Q240,300 208,310', shade(c, .35))}` +
            stitch(`M140,${bottom - 6} H190 M210,${bottom - 6} H260`, shade(c, .35)) +
            H.line('M118,292 Q160,296 194,306 M282,292 Q240,296 206,306', c, 1.6, .55) + `</g>` +
            outline(d, c, 'h') + `</g>` +
          `<g clip-path="${dc}"><path d="${o.edges}" fill="none" stroke="${ink(c)}" stroke-width="${SW}" stroke-linecap="round"/></g>` +
          yokeFringe + mirror(yokeFringe) + motif,
      };
    },
  });

  /* =====================================================================
     BOTTOMS (slot bottom)
     ===================================================================== */

  /* -------------------------------------------------------------
     Soft work trousers (scrubs, chef's checks): straight legs, a
     drawstring waistband with a bow, side pockets and hem bands.
     colors: [fabric, pattern colour]; pattern optional (e.g. 'check')
     ------------------------------------------------------------- */
  DOLL.shape('cc-pants', {
    slot: 'bottom',
    draw(it) {
      const c = it.colors[0], tie = it.colors[2] || '#ffffff';
      const d = G.pantsPath({ top: 398, bottom: 706, pad: 6, flare: 5 });
      const clip = H.clip('c-' + it.id, d);
      const bowL = 'M200,412 C192,404 184,408 186,414 C188,420 196,418 200,412 Z';
      const bowT = 'M199,413 q-4,10 -8,16 M201,413 q4,10 8,16';
      return `<path d="${d}" fill="${H.fill(it)}"/>` +
        `<g clip-path="${clip}"><rect x="0" y="396" width="400" height="16" fill="${H.grad(shade(c, -.06))}"/>` +
          `<path d="M0,404 H400" stroke="${ink(c)}" stroke-width="1" opacity=".35" stroke-dasharray="1.5 3"/>` +
          `<rect x="0" y="690" width="400" height="18" fill="${shade(c, -.06)}" opacity=".85"/>` +
          `<path d="M0,690 H400" stroke="${ink(c)}" stroke-width="1.4" opacity=".5"/></g>` +
        H.line('M148,416 Q158,428 156,446 M252,416 Q242,428 244,446 M190,472 l-10,8 M210,472 l10,8 M156,574 q12,6 26,0 M218,574 q12,6 26,0', c, 1.7, .5) +
        // drawstring bow
        `<path d="${bowT}" stroke="${ink(tie)}" stroke-width="3.6" stroke-linecap="round"/><path d="${bowT}" stroke="${tie}" stroke-width="2" stroke-linecap="round"/>` +
        `<path d="${bowL}" fill="${H.grad(tie)}" stroke="${ink(tie)}" stroke-width="1.4"/>` + mirror(`<path d="${bowL}" fill="${H.grad(tie)}" stroke="${ink(tie)}" stroke-width="1.4"/>`) +
        outline(d, c, 'h');
    },
  });

  /* -------------------------------------------------------------
     Fringe skirt (cowgirl): suede skirt with a waistband, stitched yoke
     with round studs, and soft fringe along the hem.
     colors: [suede, fringe, studs]
     ------------------------------------------------------------- */
  DOLL.shape('cc-fringeskirt', {
    slot: 'bottom',
    thumb: [100, 380, 200, 190],
    draw(it) {
      const [c, fr = shade(c, -.12), stud = '#f2c34d'] = it.colors;
      const top = 398, bottom = 522;
      const d = G.skirtPath({ top, bottom, flare: 22, pad: 5 });
      const clip = H.clip('c-' + it.id, d);
      const hx = G.torsoX(476) - 5 - 22;                // where the hem meets the sides
      // fringe strands following the curved hem (Q control at bottom + 14)
      let s = '';
      for (let i = 0; i <= 26; i++) { const t = i / 26, x = hx + (400 - 2 * hx) * t, y = bottom + 28 * t * (1 - t) - 3; s += `M${n1(x)},${n1(y)} l${n1((x - 200) * .02)},18`; }
      const studs = [150, 176, 200, 224, 250].map(x => `<circle cx="${x}" cy="${n1(442 + Math.abs(x - 200) * -.06)}" r="3.4" fill="${H.grad(stud, 'r')}" stroke="${ink(stud)}" stroke-width="1.1"/>`).join('');
      return `<path d="${s}" stroke="${ink(fr)}" stroke-width="4.4" stroke-linecap="round"/><path d="${s}" stroke="${fr}" stroke-width="2.6" stroke-linecap="round"/>` +
        `<path d="${d}" fill="${H.fill(it)}"/>` +
        `<g clip-path="${clip}"><rect x="0" y="396" width="400" height="15" fill="${H.grad(shade(c, -.08))}"/>` +
          stitch('M100,452 Q200,436 300,452', shade(c, .35)) + H.line('M100,456 Q200,440 300,456', c, 1.5, .5) +
          stitch(`M100,${bottom - 6} Q200,${bottom + 8} 300,${bottom - 6}`, shade(c, .35)) + `</g>` +
        studs + H.line('M168,470 q-6,22 -14,46 M232,470 q6,22 14,46', c, 1.6, .4) +
        outline(d, c, 'h');
    },
  });

  /* =====================================================================
     COWGIRL BOOTS (slot shoes): pointed toes, a little heel, a shaft with
     a dipped top, pull tabs and stitched swirls round a heart.
     colors: [leather, heel/sole, stitching]
     ===================================================================== */
  DOLL.shape('cc-cowboots', {
    slot: 'shoes',
    thumb: [112, 586, 176, 170],
    draw(it) {
      const [c, sole = shade(c, -.35), st = shade(c, .4)] = it.colors;
      const top = 604, low = 716, pad = 5, flare = 2;
      // builds one boot (s is "L" or "R")
      const side = s => {
        const L = s === 'L', Xs = x => (L ? x : 400 - x);
        // 0 at the top of the boot shaft, 1 at the bottom (how far down y is)
        const k = y => (y - top) / (low - top);
        const outer = [], inner = [];
        for (let y = top; y <= low; y += 14) {
          outer.push([Xs(G.legOutX(y) - pad - flare * k(y)), y]);
          inner.push([Xs(G.legInX(y) + pad + flare * k(y) * .6), y]);
        }
        const mid = (outer[0][0] + inner[0][0]) / 2;
        // shaft: down the outer side, back up the inner side, then a dip across the top
        const shaft = 'M' + outer.map(P).join('L') + 'L' + inner.slice().reverse().map(P).join('L') + `Q${n1(mid)},${top + 16} ${P(outer[0])}Z`;
        const foot = G.footPath(s, 5, 9);
        const [fx, fy] = G.feet[L ? 0 : 1];
        const fl = G.feet[0][0];                         // left-foot x, mirrored with Xs for the right boot
        const fclip = H.clip(`c-${it.id}-${s}`, foot);
        // small heel under the inner back of the foot
        const heel = `<path d="M${Xs(fl + 4)},${fy + 12} L${Xs(fl + 17)},${fy + 11} L${Xs(fl + 16)},${fy + 24} L${Xs(fl + 5)},${fy + 24} Z" fill="${H.grad(sole)}" stroke="${ink(sole)}" stroke-width="1.8" stroke-linejoin="round"/>`;
        // pull tabs at both sides of the top
        const tabs = [outer[0], inner[0]].map(([x, y]) => `<path d="M${n1(x + (x < mid ? 2 : -2))},${y + 4} q${x < mid ? -1 : 1},-14 ${x < mid ? 7 : -7},-12 l${x < mid ? 1 : -1},10" fill="none" stroke="${ink(c)}" stroke-width="4.4" stroke-linecap="round"/>` +
          `<path d="M${n1(x + (x < mid ? 2 : -2))},${y + 4} q${x < mid ? -1 : 1},-14 ${x < mid ? 7 : -7},-12 l${x < mid ? 1 : -1},10" fill="none" stroke="${shade(c, -.1)}" stroke-width="2.4" stroke-linecap="round"/>`).join('');
        // heart inlay on the shaft with stitching round it, a stitched line under the top edge, stitched toe cap
        const hx = mid, hy = 654;
        const deco = `<path d="${heartD(hx, hy, 9)}" fill="${H.grad(st, 'r')}" opacity=".9"/>` +
          `<path d="${heartD(hx, hy, 12.5)}" fill="none" stroke="${st}" stroke-width="1.5" stroke-dasharray="2.5 2"/>` +
          `<path d="M${P([outer[0][0] + (L ? 4 : -4), top + 10])} Q${n1(mid)},${top + 24} ${P([inner[0][0] + (L ? -4 : 4), top + 10])}" fill="none" stroke="${st}" stroke-width="1.5" stroke-dasharray="2.5 2"/>` +
          `<path d="M${n1(hx)},${hy + 16} V${hy + 40}" stroke="${st}" stroke-width="1.5" stroke-dasharray="2.5 2" stroke-linecap="round"/>`;
        const toe = `<path d="M${Xs(fl - 24)},${fy - 4} Q${Xs(fl - 14)},${fy - 15} ${Xs(fl - 2)},${fy - 12}" fill="none" stroke="${st}" stroke-width="1.4" stroke-dasharray="2.5 2"/>`;
        return heel + `<path d="${foot}" fill="${H.fill(it)}"/>` +
          `<g clip-path="${fclip}"><rect x="${fx - 60}" y="${fy + 11}" width="120" height="30" fill="${sole}"/></g>` + toe + outline(foot, c, 'r') +
          tabs + `<path d="${shaft}" fill="${H.fill(it)}"/><path d="${shaft}" fill="url(#soft-h)"/>` + deco +
          `<path d="M${n1(outer[0][0] + (L ? 5 : -5))},${top + 18} Q${n1(outer[0][0] + (L ? 2 : -2))},650 ${n1(outer[0][0] + (L ? 6 : -6))},694" stroke="#fff" stroke-width="3.4" stroke-linecap="round" fill="none" opacity=".45"/>` +
          `<path d="${shaft}" fill="none" stroke="${ink(c)}" stroke-width="${SW}" stroke-linejoin="round"/>`;
      };
      return side('L') + side('R');
    },
  });

  /* =====================================================================
     THINGS TO HOLD (slot hold, right hand). See held() above.
     ===================================================================== */

  /* -------------------------------------------------------------
     Doctor's bag (it.kind 'doctor'): rounded bag with a metal frame, a
     clasp and a heart badge; first-aid kit (it.kind 'kit'): a box with
     a handle and a soft plus or heart.
     colors: [bag, badge/plus colour, frame/handle]
     ------------------------------------------------------------- */
  DOLL.shape('cc-medbag', {
    slot: 'hold',
    thumb: [252, 430, 110, 120],
    draw(it) {
      const [c, mark = '#ef5b7a', fr = shade(c, -.3)] = it.colors;
      if (it.kind === 'kit') {
        const box = 'M274,488 h60 q8,0 8,8 v34 q0,8 -8,8 h-60 q-8,0 -8,-8 v-34 q0,-8 8,-8 Z';
        const handle = 'M290,490 V470 Q290,458 302,458 Q314,458 314,470 V490';
        return held(tube(handle, fr, 5) +
          `<path d="${box}" fill="${H.grad(c)}"/>` +
          `<path d="M266,502 H342" stroke="${ink(c)}" stroke-width="1.6" opacity=".5"/>` +
          `<rect x="272" y="499" width="6" height="7" rx="1.5" fill="${H.grad(fr)}" stroke="${ink(fr)}" stroke-width="1"/><rect x="330" y="499" width="6" height="7" rx="1.5" fill="${H.grad(fr)}" stroke="${ink(fr)}" stroke-width="1"/>` +
          `<circle cx="304" cy="520" r="11" fill="#fff" opacity=".9"/>` +
          (it.motif === 'heart' ? heartO(304, 520, 8, mark, 1.4) : plusO(304, 520, 6.5, mark)) +
          `<path d="M272,494 Q274,490 282,490" stroke="#fff" stroke-width="2.6" stroke-linecap="round" fill="none" opacity=".7"/>` +
          outline(box, c));
      }
      const bag = 'M276,492 Q304,482 332,492 L342,530 Q344,542 332,542 L276,542 Q264,542 266,530 Z';
      const frame = 'M273,488 Q304,474 335,488 L336,496 Q304,484 272,496 Z';
      const handle = 'M288,486 C286,448 322,448 320,486';
      return held(tube(handle, fr, 5.4) +
        `<path d="${bag}" fill="${H.grad(c)}"/>` +
        stitch('M272,534 H336', shade(c, .35), 1.2) +
        H.line('M286,498 Q282,516 284,536 M322,498 Q326,516 324,536', c, 1.5, .4) +
        `<circle cx="304" cy="516" r="11" fill="${H.grad('#ffffff', 'r')}" stroke="${ink(c)}" stroke-width="1.4"/>` + heartO(304, 516.5, 7, mark, 1.2) +
        `<path d="M276,500 Q274,512 276,526" stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none" opacity=".4"/>` +
        outline(bag, c) +
        `<path d="${frame}" fill="${H.grad(fr)}" stroke="${ink(fr)}" stroke-width="1.8" stroke-linejoin="round"/>` +
        `<rect x="299" y="482" width="10" height="9" rx="3" fill="${H.grad('#f2c96a')}" stroke="${ink('#f2c96a')}" stroke-width="1.3"/>`);
    },
  });

  /* -------------------------------------------------------------
     Vet's patients.
     it.kind 'lion': a little lion teddy hanging from its paw in her hand,
       with a heart plaster on its head and a bandage on one leg.
     it.kind 'puppy': a puppy sitting beside her on a lead, with a
       bandaged front paw. colors: [fur, light fur, dark (ears/mane), collar]
     ------------------------------------------------------------- */
  DOLL.shape('cc-patient', {
    slot: 'hold',
    draw(it) {
      const [fur, light, dark, collar = '#ef5b7a'] = it.colors;
      const line = shade(dark, -.35);
      // plaster (sticking plaster) at x,y turned by deg degrees, with a tiny heart on it
      const plaster = (x, y, deg) => `<g transform="rotate(${deg} ${x} ${y})"><rect x="${x - 9}" y="${y - 3.5}" width="18" height="7" rx="3.5" fill="#f6c9b0" stroke="#c98a6a" stroke-width="1"/>` +
        `<rect x="${x - 3.5}" y="${y - 3}" width="7" height="6" rx="1.5" fill="#fbe6da"/></g>` + heartO(x, y, 2.4, '#ef5b7a', .6);
      if (it.kind === 'lion') {
        const hx = 336, hy = 506;                      // head centre
        // fluffy mane: a ring of round tufts
        const mane = Array.from({ length: 14 }, (_, i) => { const [x, y] = pol(hx, hy, 21, i * 360 / 14); return `<circle cx="${n1(x)}" cy="${n1(y)}" r="9" fill="${H.grad(dark, 'r')}" stroke="${line}" stroke-width="1.4"/>`; }).join('');
        const tail = tube('M348,566 C364,566 368,552 364,544', fur, 4) + `<circle cx="364" cy="541" r="5" fill="${H.grad(dark, 'r')}" stroke="${line}" stroke-width="1.3"/>`;
        // the raised arm goes up into her hand (drawn full size, outside the scaled teddy below)
        const arm = tube('M323,552 C312,530 304,500 303,472', fur, 12) + `<circle cx="303" cy="469" r="8" fill="${H.grad(fur, 'r')}" stroke="${line}" stroke-width="1.6"/>`;
        const body = `<ellipse cx="336" cy="556" rx="19" ry="23" fill="${H.grad(fur, 'r')}" stroke="${line}" stroke-width="2"/>` +
          `<ellipse cx="336" cy="560" rx="11" ry="13" fill="${H.grad(light, 'r')}"/>` +
          `<path d="M336,546 V574" stroke="${shade(light, -.2)}" stroke-width="1.2" stroke-dasharray="2.5 2.5"/>`;
        const legs = [326, 346].map(x => `<ellipse cx="${x}" cy="582" rx="8" ry="10" fill="${H.grad(fur, 'r')}" stroke="${line}" stroke-width="1.8"/><ellipse cx="${x}" cy="587" rx="4" ry="3" fill="${light}"/>`).join('') +
          // bandage wrapped round the right leg
          `<path d="M338,576 h16 M338,581 h16" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/><path d="M338,576 h16 M338,581 h16" stroke="#d9dde3" stroke-width="1" stroke-linecap="round" stroke-dasharray="3 3"/>`;
        const other = `<ellipse cx="354" cy="552" rx="6" ry="10" transform="rotate(-20 354 552)" fill="${H.grad(fur, 'r')}" stroke="${line}" stroke-width="1.6"/>`;
        const head = mane +
          [[-13, -15], [13, -15]].map(([a, b]) => `<circle cx="${hx + a}" cy="${hy + b}" r="6" fill="${H.grad(fur, 'r')}" stroke="${line}" stroke-width="1.4"/><circle cx="${hx + a}" cy="${hy + b}" r="3" fill="${light}"/>`).join('') +
          `<circle cx="${hx}" cy="${hy}" r="17" fill="${H.grad(fur, 'r')}" stroke="${line}" stroke-width="1.8"/>` +
          `<ellipse cx="${hx}" cy="${hy + 7}" rx="8.5" ry="6.5" fill="${light}"/>` +
          `<circle cx="${hx - 6}" cy="${hy - 2}" r="2.4" fill="#3a2a2a"/><circle cx="${hx + 6}" cy="${hy - 2}" r="2.4" fill="#3a2a2a"/>` +
          `<circle cx="${hx - 5.3}" cy="${hy - 2.8}" r=".8" fill="#fff"/><circle cx="${hx + 6.7}" cy="${hy - 2.8}" r=".8" fill="#fff"/>` +
          `<path d="M${hx - 3},${hy + 3} h6 l-3,3 Z" fill="#9a5a3a" stroke="#6e3c24" stroke-width=".8" stroke-linejoin="round"/>` +
          `<path d="M${hx},${hy + 6} v2 M${hx - 3.5},${hy + 9} q3.5,3 7,0" fill="none" stroke="#6e3c24" stroke-width="1.2" stroke-linecap="round"/>` +
          `<ellipse cx="${hx - 11}" cy="${hy + 5}" rx="3.5" ry="2.3" fill="#f28a8c" opacity=".5"/><ellipse cx="${hx + 11}" cy="${hy + 5}" rx="3.5" ry="2.3" fill="#f28a8c" opacity=".5"/>` +
          plaster(hx + 6, hy - 11, -25);
        // the teddy is drawn round (336,506) and then made a little bigger and moved down a bit
        return held(arm + `<g transform="translate(340,514) scale(1.25) translate(-336,-506)">${tail + body + legs + other + head}</g>`);
      }
      // puppy sitting on the ground at her right, on a lead from her hand
      const px = 348, py = 650;                         // head centre
      // lead from her hand to the collar (collar end matches the puppy after it is scaled up below)
      const lead = tube('M302,466 C300,540 306,604 320,646', collar, 3);
      const ear = 'M330,636 C316,640 314,666 322,678 C330,684 336,668 336,650 Z';
      const body = `<path d="M324,744 C318,712 324,682 348,680 C372,682 378,712 372,744 Z" fill="${H.grad(fur)}" stroke="${line}" stroke-width="2" stroke-linejoin="round"/>` +
        `<ellipse cx="348" cy="694" rx="11" ry="10" fill="${H.grad(light, 'r')}"/>` +
        // haunches and back feet
        `<ellipse cx="326" cy="730" rx="10" ry="15" fill="${H.grad(fur, 'r')}" stroke="${line}" stroke-width="1.6"/><ellipse cx="370" cy="730" rx="10" ry="15" fill="${H.grad(fur, 'r')}" stroke="${line}" stroke-width="1.6"/>` +
        `<ellipse cx="322" cy="744" rx="10" ry="5" fill="${H.grad(light)}" stroke="${line}" stroke-width="1.5"/><ellipse cx="374" cy="744" rx="10" ry="5" fill="${H.grad(light)}" stroke="${line}" stroke-width="1.5"/>`;
      // front legs in fur colour with light round paws
      const frontLegs = [339, 357].map(x => `<path d="M${x - 5.5},716 Q${x},704 ${x + 5.5},716 C${x + 6},726 ${x + 6},734 ${x + 5},740 L${x - 5},740 C${x - 6},734 ${x - 6},726 ${x - 5.5},716 Z" fill="${H.grad(fur, 'h')}" stroke="${line}" stroke-width="1.6" stroke-linejoin="round"/>` +
        `<ellipse cx="${x}" cy="742" rx="7.5" ry="4.5" fill="${H.grad(light)}" stroke="${line}" stroke-width="1.5"/>` +
        `<path d="M${x - 2.5},740 v3 M${x + 2.5},740 v3" stroke="${line}" stroke-width="1" opacity=".6"/>`).join('') +
        // bandage on the left front paw with a heart plaster
        `<path d="M335,720 h10 M335,726 h10" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/><path d="M335,720 h10 M335,726 h10" stroke="#d9dde3" stroke-width="1" stroke-dasharray="2.5 2.5"/>` + heartO(340, 723, 3, '#ef5b7a', .8);
      const tail = tube('M372,724 C388,722 390,704 384,694', fur, 5);
      const head = `<path d="${ear}" fill="${H.grad(dark)}" stroke="${line}" stroke-width="1.8" stroke-linejoin="round"/>` +
        `<path d="${ear}" transform="matrix(-1 0 0 1 ${2 * px} 0)" fill="${H.grad(dark)}" stroke="${line}" stroke-width="1.8" stroke-linejoin="round"/>` +
        `<ellipse cx="${px}" cy="${py}" rx="21" ry="19" fill="${H.grad(fur, 'r')}" stroke="${line}" stroke-width="2"/>` +
        `<ellipse cx="${px + 8}" cy="${py - 4}" rx="7" ry="6" fill="${dark}" opacity=".55"/>` +
        `<ellipse cx="${px}" cy="${py + 9}" rx="11" ry="8" fill="${H.grad(light)}"/>` +
        `<circle cx="${px - 7}" cy="${py - 3}" r="2.8" fill="#2e2224"/><circle cx="${px + 7}" cy="${py - 3}" r="2.8" fill="#2e2224"/>` +
        `<circle cx="${px - 6.2}" cy="${py - 4}" r="1" fill="#fff"/><circle cx="${px + 7.8}" cy="${py - 4}" r="1" fill="#fff"/>` +
        `<ellipse cx="${px}" cy="${py + 5}" rx="4" ry="3" fill="#3a2a2a"/>` +
        `<path d="M${px - 4},${py + 10} q4,3 8,0" fill="none" stroke="#3a2a2a" stroke-width="1.2" stroke-linecap="round"/>` +
        `<path d="M${px - 2.5},${py + 11.5} q2.5,6 5,0 Z" fill="#f28a9c" stroke="#c95a6a" stroke-width=".8"/>` +
        `<ellipse cx="${px - 13}" cy="${py + 6}" rx="3.5" ry="2.3" fill="#f28a8c" opacity=".45"/><ellipse cx="${px + 13}" cy="${py + 6}" rx="3.5" ry="2.3" fill="#f28a8c" opacity=".45"/>`;
      const collarM = `<path d="M332,670 Q348,678 364,670 L364,676 Q348,684 332,676 Z" fill="${H.grad(collar)}" stroke="${ink(collar)}" stroke-width="1.4"/>` +
        heartO(348, 684, 4, '#f2c34d', 1);
      // the lead goes behind the hand (so she grips it) and in front of everything else
      const h = held(lead);
      // the puppy is drawn round (348,748) on the ground, then made a little bigger and moved left a bit
      return { back: h.back, front: `<g transform="translate(338,748) scale(1.3) translate(-348,-748)">${tail + body + frontLegs + head + collarM}</g>` + h.front };
    },
  });

  /* -------------------------------------------------------------
     Chef's tools held like a stick, tilted outward:
     it.kind 'spoon' (wooden spoon with a little heart burnt in) or
     'whisk' (balloon whisk with a coloured handle).
     colors: [handle, accent]
     ------------------------------------------------------------- */
  DOLL.shape('cc-utensil', {
    slot: 'hold',
    thumb: [262, 340, 130, 150],
    draw(it) {
      const [c, acc = '#ef5b7a'] = it.colors;
      if (it.kind === 'whisk') {
        const wires = 'M-3,-44 C-17,-62 -15,-98 0,-104 C15,-98 17,-62 3,-44 M-1.5,-44 C-9,-62 -8,-96 0,-104 C8,-96 9,-62 1.5,-44 M0,-44 V-104';
        const inner = `<path d="${wires}" fill="none" stroke="#7d8794" stroke-width="3.6" stroke-linecap="round"/><path d="${wires}" fill="none" stroke="#e3e8ee" stroke-width="2" stroke-linecap="round"/>` +
          `<rect x="-5" y="-46" width="10" height="8" rx="2" fill="${H.grad('#d9dee6')}" stroke="#7d8794" stroke-width="1.3"/>` +
          `<rect x="-5" y="-40" width="10" height="64" rx="5" fill="${H.grad(c, 'h')}" stroke="${ink(c)}" stroke-width="1.8"/>` +
          heartO(0, -18, 3.4, acc, .8) + `<circle cx="0" cy="18" r="2" fill="${ink(c)}"/>`;
        return held(stickFrame(40, inner));
      }
      const inner = `<rect x="-3.6" y="-74" width="7.2" height="98" rx="3.6" fill="${H.grad(c, 'h')}" stroke="${ink(c)}" stroke-width="1.8"/>` +
        `<ellipse cx="0" cy="-88" rx="11" ry="15" fill="${H.grad(c, 'r')}" stroke="${ink(c)}" stroke-width="1.8"/>` +
        `<ellipse cx="0" cy="-86" rx="6.5" ry="9.5" fill="${shade(c, -.12)}" opacity=".6"/>` +
        `<path d="M-5,-96 q2,-5 6,-6" stroke="#fff" stroke-width="2" stroke-linecap="round" fill="none" opacity=".7"/>` +
        `<path d="${heartD(0, 6, 3.2)}" fill="${shade(c, -.3)}" opacity=".7"/>`;
      return held(stickFrame(40, inner));
    },
  });

  /* -------------------------------------------------------------
     Artist's things: it.kind 'palette' (wooden palette with a thumb hole,
     blobs of paint and a small brush) or 'brush' (big paintbrush with a
     painted tip and a striped handle).
     colors: [wood/handle, ...paint colours]
     ------------------------------------------------------------- */
  DOLL.shape('cc-art', {
    slot: 'hold',
    thumb: [270, 410, 130, 130],
    draw(it) {
      const [wood, ...paints] = it.colors;
      if (it.kind === 'brush') {
        const tip = paints[0] || '#ef5b7a';
        const stripes = paints.slice(1).map((p, i) => `<rect x="-4.2" y="${-48 + i * 14}" width="8.4" height="6" fill="${p}"/>`).join('');
        const inner = `<rect x="-4.2" y="-60" width="8.4" height="88" rx="4.2" fill="${H.grad(wood, 'h')}"/>` + stripes +
          `<rect x="-4.2" y="-60" width="8.4" height="88" rx="4.2" fill="url(#soft-h)" stroke="${ink(wood)}" stroke-width="1.8"/>` +
          `<path d="M-5,-60 L-6,-74 H6 L5,-60 Z" fill="${H.grad('#d9dee6', 'h')}" stroke="#7d8794" stroke-width="1.4" stroke-linejoin="round"/>` +
          `<path d="M-6,-74 C-9,-88 -3,-100 0,-108 C3,-100 9,-88 6,-74 Z" fill="${H.grad('#e7c89a')}" stroke="${ink('#e7c89a')}" stroke-width="1.6" stroke-linejoin="round"/>` +
          `<path d="M-6.8,-86 C-6,-94 -3,-101 0,-108 C3,-101 6,-94 6.8,-86 Q0,-82 -6.8,-86 Z" fill="${H.grad(tip)}" stroke="${ink(tip)}" stroke-width="1.4" stroke-linejoin="round"/>` +
          `<path d="M-2,-98 q1,-4 2,-6" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>`;
        return held(stickFrame(38, inner));
      }
      // palette to the right of the hand; the hand holds its left edge
      const pal = 'M300,474 C298,454 326,446 350,450 C378,455 390,482 378,506 C368,526 338,532 318,524 C306,519 306,508 314,503 C321,499 320,489 310,489 C302,489 300,482 300,474 Z';
      const hole = `<ellipse cx="324" cy="474" rx="6" ry="5" fill="${shade(wood, -.35)}" stroke="${ink(wood)}" stroke-width="1.4"/>`;
      const blobs = [[342, 462, 0], [362, 470, 1], [370, 490, 2], [356, 508, 3], [334, 514, 4]].map(([x, y, i]) => {
        const p = paints[i % paints.length];
        return `<path d="M${x - 6},${y} C${x - 7},${y - 6} ${x + 6},${y - 7} ${x + 6},${y} C${x + 7},${y + 5} ${x - 5},${y + 7} ${x - 6},${y} Z" fill="${H.grad(p, 'r')}" stroke="${ink(p)}" stroke-width="1.1"/>`;
      }).join('');
      const brush = `<g transform="translate(330,500) rotate(-62)"><rect x="-2.4" y="-6" width="4.8" height="56" rx="2.4" fill="${H.grad('#7fb8e6', 'h')}" stroke="${ink('#7fb8e6')}" stroke-width="1.3"/>` +
        `<rect x="-2.8" y="-12" width="5.6" height="7" fill="#d9dee6" stroke="#7d8794" stroke-width="1"/>` +
        `<path d="M-3,-12 C-4,-18 -1,-24 0,-27 C1,-24 4,-18 3,-12 Z" fill="${paints[0]}" stroke="${ink(paints[0])}" stroke-width="1"/></g>`;
      return held(`<path d="${pal}" fill="${H.grad(wood, 'r')}"/>` + hole + blobs +
        `<path d="M312,460 Q330,452 350,454" stroke="#fff" stroke-width="2.6" stroke-linecap="round" fill="none" opacity=".55"/>` +
        outline(pal, wood, 'r', 2.2) + brush);
    },
  });

  /* -------------------------------------------------------------
     Toy horse on a stick (cowgirl): a soft horse head with a mane, a
     bridle with a little heart and a wooden stick with a wheel; it.horn
     makes it a unicorn. colors: [head, mane colours..., bridle]; it.mane = [..]
     ------------------------------------------------------------- */
  DOLL.shape('cc-stickhorse', {
    slot: 'hold',
    thumb: [240, 252, 160, 360],
    draw(it) {
      const [c, bridle = '#e2505b'] = it.colors;
      const manes = it.mane || [shade(c, -.4)];
      const line = ink(shade(c, -.1));
      // wooden stick from the neck down past the hand to a little wheel
      const stick = stickFrame(17, `<rect x="-4" y="-104" width="8" height="250" rx="4" fill="${H.grad('#d9a066', 'h')}" stroke="${ink('#d9a066')}" stroke-width="1.8"/>` +
        `<circle cx="0" cy="148" r="9" fill="${H.grad(bridle, 'r')}" stroke="${ink(bridle)}" stroke-width="1.8"/><circle cx="0" cy="148" r="3" fill="#fff"/>`);
      const head = 'M322,374 C316,348 316,318 328,300 C334,290 344,284 356,286 C368,288 380,298 386,310 C390,318 388,328 380,332 C372,336 362,334 354,334 C348,342 348,358 350,374 Z';
      // mane: round tufts down the back of the neck, cycling through the mane colours
      const tufts = Array.from({ length: 8 }, (_, i) => {
        const t = i / 7, x = 336 - 18 * t - 4 * Math.sin(t * Math.PI), y = 284 + 84 * t, col = manes[i % manes.length];
        return `<circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(9 - t * 2)}" fill="${H.grad(col, 'r')}" stroke="${ink(col)}" stroke-width="1.4"/>`;
      }).join('');
      const ears = `<path d="M332,296 L330,268 L346,288 Z" fill="${H.grad(c)}" stroke="${line}" stroke-width="2" stroke-linejoin="round"/>` +
        `<path d="M346,290 L352,266 L360,292 Z" fill="${H.grad(c)}" stroke="${line}" stroke-width="2" stroke-linejoin="round"/>` +
        `<path d="M349,287 L352,274 L356,289 Z" fill="#f6b2c8"/>`;
      const horn = it.horn ? `<path d="M348,288 L364,250 L358,292 Z" fill="${H.grad('#f2c34d')}" stroke="${ink('#f2c34d')}" stroke-width="1.8" stroke-linejoin="round"/>` +
        `<path d="M351,281 L360,277 M353,272 L361,268 M356,263 L362,260" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>` : '';
      const forelock = `<circle cx="344" cy="292" r="6" fill="${H.grad(manes[0], 'r')}" stroke="${ink(manes[0])}" stroke-width="1.2"/>` +
        `<circle cx="352" cy="294" r="5" fill="${H.grad(manes[1 % manes.length], 'r')}" stroke="${ink(manes[1 % manes.length])}" stroke-width="1.2"/>`;
      const face = `<ellipse cx="376" cy="320" rx="12" ry="11" fill="${H.grad(shade(c, -.08), 'r')}"/>` +
        `<ellipse cx="381" cy="317" rx="2" ry="2.6" fill="${ink(c)}"/>` +
        `<path d="M372,328 q5,3 10,0" stroke="${ink(c)}" stroke-width="1.4" fill="none" stroke-linecap="round"/>` +
        `<ellipse cx="352" cy="306" rx="4.4" ry="5.4" fill="#2e2224"/><circle cx="353.4" cy="304" r="1.6" fill="#fff"/>` +
        `<path d="M347,301 l-4,-3 M348,299 l-3,-4" stroke="#2e2224" stroke-width="1.3" stroke-linecap="round"/>` +
        `<ellipse cx="362" cy="318" rx="4" ry="2.6" fill="#f28a8c" opacity=".5"/>`;
      const bridleM = `<path d="M366,310 Q372,326 368,334 M366,310 Q352,320 344,312" fill="none" stroke="${ink(bridle)}" stroke-width="5" stroke-linecap="round"/>` +
        `<path d="M366,310 Q372,326 368,334 M366,310 Q352,320 344,312" fill="none" stroke="${bridle}" stroke-width="3" stroke-linecap="round"/>` +
        heartO(366, 311, 4.2, bridle, 1);
      const bow = `<path d="M336,372 l-12,-7 v14 Z M336,372 l12,-7 v14 Z" fill="${H.grad(bridle)}" stroke="${ink(bridle)}" stroke-width="1.6" stroke-linejoin="round"/><circle cx="336" cy="372" r="4" fill="${H.grad(bridle, 'r')}" stroke="${ink(bridle)}" stroke-width="1.4"/>`;
      return held(stick + tufts + horn + ears + `<path d="${head}" fill="${H.grad(c, 'r')}"/>` +
        `<path d="M332,306 Q330,330 334,350" stroke="#fff" stroke-width="3.4" stroke-linecap="round" fill="none" opacity=".45"/>` +
        outline(head, c, 'r', 2.2) + face + forelock + bridleM + bow);
    },
  });

  /* =====================================================================
     Catalog entries
     ===================================================================== */
  DOLL.add([
    // Hats
    { id: 'hat-doctor-cap-green', shape: 'cc-hat', kind: 'scrub', cat: 'hat', name: { is: 'Græn læknahúfa', en: 'Green scrub cap' }, colors: ['#6cc49a', '#ffffff', '#4fa67e'], pattern: 'hearts', patternSize: 24, thumb: [86, 28, 236, 120] },
    { id: 'hat-doctor-cap-pink', shape: 'cc-hat', kind: 'scrub', cat: 'hat', name: { is: 'Bleik læknahúfa', en: 'Pink scrub cap' }, colors: ['#f6a6c1', '#ffffff', '#e27aa0'], pattern: 'dots', patternSize: 18, thumb: [86, 28, 236, 120] },
    { id: 'hat-nurse-blue', shape: 'cc-hat', kind: 'nurse', cat: 'hat', name: { is: 'Blá hjúkrunarhúfa', en: 'Blue nurse cap' }, colors: ['#ffffff', '#7fb8e6', '#ef5b7a'], thumb: [90, 30, 220, 112] },
    { id: 'hat-nurse-pink', shape: 'cc-hat', kind: 'nurse', cat: 'hat', name: { is: 'Bleik hjúkrunarhúfa', en: 'Pink nurse cap' }, colors: ['#ffffff', '#f48fb6', '#ef5b7a'], thumb: [90, 30, 220, 112] },
    { id: 'hat-chef-white', shape: 'cc-hat', kind: 'toque', cat: 'hat', name: { is: 'Kokkahúfa', en: "Chef's hat" }, colors: ['#fbfbfd', '#f4f5f8', '#ef5b7a'], thumb: [78, 0, 244, 140] },
    { id: 'hat-chef-pink', shape: 'cc-hat', kind: 'toque', cat: 'hat', name: { is: 'Bleik kokkahúfa', en: 'Pink chef hat' }, colors: ['#fff4f8', '#f6a6c1', '#ef5b7a'], heart: true, thumb: [78, 0, 244, 140] },
    { id: 'hat-artist-beret-red', shape: 'cc-hat', kind: 'beret', cat: 'hat', name: { is: 'Rauð alpahúfa', en: 'Red beret' }, colors: ['#d8424e', '#f7d660'], thumb: [70, 6, 250, 124] },
    { id: 'hat-artist-beret-purple', shape: 'cc-hat', kind: 'beret', cat: 'hat', name: { is: 'Fjólublá alpahúfa', en: 'Purple beret' }, colors: ['#9b7fd8', '#f7a6c2'], thumb: [70, 6, 250, 124] },
    { id: 'hat-cowgirl-brown', shape: 'cc-hat', kind: 'cowgirl', cat: 'hat', name: { is: 'Kúrekahattur', en: 'Cowgirl hat' }, colors: ['#b07a4f', '#5e3a22', '#f2c34d'], motif: 'star', thumb: [52, 10, 296, 130] },
    { id: 'hat-cowgirl-pink', shape: 'cc-hat', kind: 'cowgirl', cat: 'hat', name: { is: 'Bleikur kúrekahattur', en: 'Pink cowgirl hat' }, colors: ['#f48fb6', '#ffffff', '#ef5b7a'], motif: 'heart', thumb: [52, 10, 296, 130] },

    // Stethoscopes and neckerchiefs
    { id: 'necklace-stethoscope-blue', shape: 'cc-stethoscope', cat: 'necklace', name: { is: 'Blá hlustunarpípa', en: 'Blue stethoscope' }, colors: ['#5b9ee0', '#d9dee6', '#ef5b7a'] },
    { id: 'necklace-stethoscope-pink', shape: 'cc-stethoscope', cat: 'necklace', name: { is: 'Bleik hlustunarpípa', en: 'Pink stethoscope' }, colors: ['#f27aa0', '#d9dee6', '#ffffff'] },
    { id: 'necklace-stethoscope-purple', shape: 'cc-stethoscope', cat: 'necklace', name: { is: 'Fjólublá hlustunarpípa', en: 'Purple stethoscope' }, colors: ['#9b7fd8', '#d9dee6', '#f7a6c2'] },
    { id: 'scarf-cowgirl-red', shape: 'cc-neckerchief', cat: 'scarf', name: { is: 'Rauður hálsklútur', en: 'Red neckerchief' }, colors: ['#d8424e', '#ffffff'] },
    { id: 'scarf-cowgirl-pink', shape: 'cc-neckerchief', cat: 'scarf', name: { is: 'Bleikur hálsklútur', en: 'Pink neckerchief' }, colors: ['#ef7aa3', '#ffffff'] },

    // Tops
    { id: 'top-scrubs-green', shape: 'cc-scrubs', cat: 'top', name: { is: 'Grænn læknabolur', en: 'Green scrubs top' }, colors: ['#7fcfa6', '#4fa67e', '#ffffff'], motif: 'heart' },
    { id: 'top-scrubs-pink', shape: 'cc-scrubs', cat: 'top', name: { is: 'Bleikur læknabolur', en: 'Pink scrubs top' }, colors: ['#f6a6c1', '#e27aa0', '#ffffff'], motif: 'heart' },
    { id: 'top-scrubs-vet-teal', shape: 'cc-scrubs', cat: 'top', name: { is: 'Dýralæknabolur með loppum', en: 'Vet top with paws' }, colors: ['#5fc2bd', '#3e9c98', '#ffffff'], paws: true, motif: 'paw' },
    { id: 'top-scrubs-vet-lilac', shape: 'cc-scrubs', cat: 'top', name: { is: 'Fjólublár dýralæknabolur', en: 'Lilac vet top' }, colors: ['#c3aef0', '#9b7fd8', '#ffffff'], paws: true, motif: 'paw' },
    { id: 'top-chef-white', shape: 'cc-chefcoat', cat: 'top', name: { is: 'Kokkajakki með svuntu', en: "Chef's jacket with apron" }, colors: ['#fbfbfd', '#d8424e', '#ffffff', '#7fa8de'] },
    { id: 'top-chef-pink', shape: 'cc-chefcoat', cat: 'top', name: { is: 'Bleikur kokkajakki', en: 'Pink chef jacket' }, colors: ['#f8b8cf', '#ffffff', '#ffffff'], apronMotif: 'heart' },

    // Nurse dresses
    { id: 'frock-nurse-blue', shape: 'cc-nursedress', cat: 'frock', name: { is: 'Blár hjúkrunarkjóll', en: 'Blue nurse dress' }, colors: ['#8fc3ee', '#ffffff', '#ef5b7a'] },
    { id: 'frock-nurse-pink', shape: 'cc-nursedress', cat: 'frock', name: { is: 'Bleikur hjúkrunarkjóll', en: 'Pink nurse dress' }, colors: ['#f6a6c1', '#ffffff', '#e2505b'] },

    // Jackets
    { id: 'jacket-doctor-coat', shape: 'cc-labcoat', cat: 'jacket', name: { is: 'Læknasloppur', en: "Doctor's coat" }, colors: ['#fbfcfe', '#7fb8e6', '#ef5b7a'] },
    { id: 'jacket-doctor-coat-pink', shape: 'cc-labcoat', cat: 'jacket', name: { is: 'Læknasloppur með bleiku', en: "Doctor's coat with pink" }, colors: ['#fbfcfe', '#f48fb6', '#a58be0'] },
    { id: 'jacket-artist-smock-blue', shape: 'cc-smock', cat: 'jacket', name: { is: 'Blár málarasloppur', en: "Blue artist's smock" }, colors: ['#a9d4f2', '#d8424e', '#ef5b7a', '#f7d660', '#5fae5a', '#a58be0'] },
    { id: 'jacket-artist-smock-yellow', shape: 'cc-smock', cat: 'jacket', name: { is: 'Gulur málarasloppur', en: "Yellow artist's smock" }, colors: ['#fbe08a', '#9b7fd8', '#5b9ee0', '#ef5b7a', '#5fae5a', '#f6a65a'] },
    { id: 'jacket-cowgirl-vest-brown', shape: 'cc-vest', cat: 'jacket', name: { is: 'Kúrekavesti', en: 'Cowgirl vest' }, colors: ['#b07a4f', '#d9a874', '#f2c34d'], motif: 'star' },
    { id: 'jacket-cowgirl-vest-pink', shape: 'cc-vest', cat: 'jacket', name: { is: 'Bleikt kúrekavesti', en: 'Pink cowgirl vest' }, colors: ['#f48fb6', '#ffffff', '#ffffff'], motif: 'heart' },

    // Trousers and skirts
    { id: 'pants-scrubs-green', shape: 'cc-pants', cat: 'pants', name: { is: 'Grænar læknabuxur', en: 'Green scrubs trousers' }, colors: ['#7fcfa6'] },
    { id: 'pants-scrubs-pink', shape: 'cc-pants', cat: 'pants', name: { is: 'Bleikar læknabuxur', en: 'Pink scrubs trousers' }, colors: ['#f6a6c1'] },
    { id: 'pants-scrubs-teal', shape: 'cc-pants', cat: 'pants', name: { is: 'Grænbláar læknabuxur', en: 'Teal scrubs trousers' }, colors: ['#5fc2bd'] },
    { id: 'pants-scrubs-lilac', shape: 'cc-pants', cat: 'pants', name: { is: 'Fjólubláar læknabuxur', en: 'Lilac scrubs trousers' }, colors: ['#c3aef0'] },
    { id: 'pants-chef-check', shape: 'cc-pants', cat: 'pants', name: { is: 'Köflóttar kokkabuxur', en: "Chef's check trousers" }, colors: ['#ffffff', '#4a5a8a', '#ffffff'], pattern: 'check', patternSize: 12 },
    { id: 'pants-chef-pink', shape: 'cc-pants', cat: 'pants', name: { is: 'Bleikar köflóttar buxur', en: 'Pink check trousers' }, colors: ['#ffffff', '#ef7aa3', '#ffffff'], pattern: 'check', patternSize: 12 },
    { id: 'skirt-cowgirl-tan', shape: 'cc-fringeskirt', cat: 'skirt', name: { is: 'Kögurpils', en: 'Fringe skirt' }, colors: ['#c99060', '#e0b47e', '#f2c34d'] },
    { id: 'skirt-cowgirl-pink', shape: 'cc-fringeskirt', cat: 'skirt', name: { is: 'Bleikt kögurpils', en: 'Pink fringe skirt' }, colors: ['#f48fb6', '#ffd0e0', '#ffffff'] },

    // Boots
    { id: 'boots-cowgirl-brown', shape: 'cc-cowboots', cat: 'boots', name: { is: 'Kúrekastígvél', en: 'Cowgirl boots' }, colors: ['#9a5a34', '#4e2e1c', '#f2c96a'] },
    { id: 'boots-cowgirl-pink', shape: 'cc-cowboots', cat: 'boots', name: { is: 'Bleik kúrekastígvél', en: 'Pink cowgirl boots' }, colors: ['#f48fb6', '#a8486e', '#ffffff'] },

    // Things to hold
    { id: 'hold-doctor-bag', shape: 'cc-medbag', kind: 'doctor', cat: 'hold', name: { is: 'Læknataska', en: "Doctor's bag" }, colors: ['#3f5f9e', '#ef5b7a', '#2b3a5c'] },
    { id: 'hold-doctor-bag-pink', shape: 'cc-medbag', kind: 'doctor', cat: 'hold', name: { is: 'Bleik læknataska', en: "Pink doctor's bag" }, colors: ['#ef7aa3', '#a58be0', '#a8486e'] },
    { id: 'hold-nurse-kit', shape: 'cc-medbag', kind: 'kit', cat: 'hold', name: { is: 'Sjúkrakassi', en: 'First-aid kit' }, colors: ['#ffffff', '#4fb6a6', '#5b9ee0'] },
    { id: 'hold-nurse-kit-pink', shape: 'cc-medbag', kind: 'kit', cat: 'hold', name: { is: 'Bleikur sjúkrakassi', en: 'Pink first-aid kit' }, colors: ['#f8b8cf', '#ef5b7a', '#e27aa0'], motif: 'heart' },
    { id: 'hold-vet-lion', shape: 'cc-patient', kind: 'lion', cat: 'hold', name: { is: 'Ljónabangsi með plástur', en: 'Lion teddy with a plaster' }, colors: ['#f4c35a', '#fff3d0', '#ee8a2e'], thumb: [282, 448, 114, 180] },
    { id: 'hold-vet-puppy', shape: 'cc-patient', kind: 'puppy', cat: 'hold', name: { is: 'Hvolpur í taumi', en: 'Puppy on a lead' }, colors: ['#e3b77e', '#fff6ea', '#9a6a43', '#ef5b7a'], thumb: [284, 590, 116, 164] },
    { id: 'hold-chef-spoon', shape: 'cc-utensil', kind: 'spoon', cat: 'hold', name: { is: 'Trésleif', en: 'Wooden spoon' }, colors: ['#d9a066', '#ef5b7a'] },
    { id: 'hold-chef-whisk', shape: 'cc-utensil', kind: 'whisk', cat: 'hold', name: { is: 'Bleikur þeytari', en: 'Pink whisk' }, colors: ['#f48fb6', '#ffffff'] },
    { id: 'hold-artist-palette', shape: 'cc-art', kind: 'palette', cat: 'hold', name: { is: 'Litaspjald og pensill', en: 'Palette and brush' }, colors: ['#e8c07a', '#ef5b7a', '#f7d660', '#5fae5a', '#5b9ee0', '#a58be0'] },
    { id: 'hold-artist-brush', shape: 'cc-art', kind: 'brush', cat: 'hold', name: { is: 'Stór pensill', en: 'Big paintbrush' }, colors: ['#f7d660', '#9b7fd8', '#ef5b7a', '#5b9ee0', '#5fae5a'], thumb: [262, 340, 130, 150] },
    { id: 'hold-cowgirl-horse', shape: 'cc-stickhorse', cat: 'hold', name: { is: 'Hestur á priki', en: 'Toy horse on a stick' }, colors: ['#b07a4f', '#e2505b'], mane: ['#5e3a22', '#7a4a2a'], thumb: [258, 246, 144, 200] },
    { id: 'hold-cowgirl-unicorn', shape: 'cc-stickhorse', cat: 'hold', name: { is: 'Einhyrningur á priki', en: 'Toy unicorn on a stick' }, colors: ['#fdfbff', '#f27aa0'], mane: ['#f48fb6', '#a58be0', '#7fc3ea', '#f7d660'], horn: true, thumb: [258, 240, 144, 206] },
  ]);

  /* =====================================================================
     Finished costume looks (chest tab "Búningar"). First item = tile icon.
     ===================================================================== */
  DOLL.look([
    { id: 'look-doctor-green', name: { is: 'Læknir í grænu', en: 'Doctor in green' },
      items: ['jacket-doctor-coat', 'hat-doctor-cap-green', 'top-scrubs-green', 'pants-scrubs-green', 'necklace-stethoscope-blue', 'shoes-clog-green', 'hold-doctor-bag'] },
    { id: 'look-doctor-pink', name: { is: 'Læknir í bleiku', en: 'Doctor in pink' },
      items: ['jacket-doctor-coat-pink', 'hat-doctor-cap-pink', 'top-scrubs-pink', 'pants-scrubs-pink', 'necklace-stethoscope-pink', 'shoes-sneaker-pink', 'hold-doctor-bag-pink'] },
    { id: 'look-nurse-blue', name: { is: 'Hjúkrunarfræðingur í bláu', en: 'Nurse in blue' },
      items: ['hat-nurse-blue', 'frock-nurse-blue', 'necklace-stethoscope-purple', 'shoes-lightup-white', 'hold-nurse-kit'] },
    { id: 'look-nurse-pink', name: { is: 'Hjúkrunarfræðingur í bleiku', en: 'Nurse in pink' },
      items: ['hat-nurse-pink', 'frock-nurse-pink', 'necklace-stethoscope-blue', 'maryjane-red', 'hold-nurse-kit-pink'] },
    { id: 'look-vet-lion', name: { is: 'Dýralæknir með ljónabangsa', en: 'Vet with a lion teddy' },
      items: ['hold-vet-lion', 'top-scrubs-vet-teal', 'pants-scrubs-teal', 'necklace-stethoscope-pink', 'shoes-sneaker-blue'] },
    { id: 'look-vet-puppy', name: { is: 'Dýralæknir með hvolp', en: 'Vet with a puppy' },
      items: ['hold-vet-puppy', 'top-scrubs-vet-lilac', 'pants-scrubs-lilac', 'necklace-stethoscope-blue', 'shoes-lightup-purple'] },
    { id: 'look-chef-white', name: { is: 'Kokkur í hvítu', en: 'Chef in white' },
      items: ['hat-chef-white', 'top-chef-white', 'pants-chef-check', 'scarf-cowgirl-red', 'shoes-clog-wood', 'hold-chef-spoon'] },
    { id: 'look-chef-pink', name: { is: 'Kokkur í bleiku', en: 'Chef in pink' },
      items: ['hat-chef-pink', 'top-chef-pink', 'pants-chef-pink', 'shoes-ballet-pink', 'hold-chef-whisk'] },
    { id: 'look-artist-red', name: { is: 'Listmálari með rauða alpahúfu', en: 'Artist with a red beret' },
      items: ['hat-artist-beret-red', 'jacket-artist-smock-blue', 'tee-stripes', 'jeans-blue', 'shoes-sneaker-pink', 'hold-artist-palette'] },
    { id: 'look-artist-purple', name: { is: 'Listmálari með fjólubláa alpahúfu', en: 'Artist with a purple beret' },
      items: ['hat-artist-beret-purple', 'jacket-artist-smock-yellow', 'tee-lilac', 'leggings-rainbow', 'shoes-lightup-purple', 'hold-artist-brush'] },
    { id: 'look-cowgirl-brown', name: { is: 'Kúrekastelpa í brúnu', en: 'Cowgirl in brown' },
      items: ['hat-cowgirl-brown', 'jacket-cowgirl-vest-brown', 'blouse-check', 'scarf-cowgirl-red', 'jeans-blue', 'boots-cowgirl-brown', 'hold-cowgirl-horse'] },
    { id: 'look-cowgirl-pink', name: { is: 'Kúrekastelpa í bleiku', en: 'Cowgirl in pink' },
      items: ['hat-cowgirl-pink', 'jacket-cowgirl-vest-pink', 'blouse-white', 'scarf-cowgirl-pink', 'skirt-cowgirl-pink', 'boots-cowgirl-pink', 'hold-cowgirl-unicorn'] },
  ]);
})();
