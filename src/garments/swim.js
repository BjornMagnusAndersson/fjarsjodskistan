/* =====================================================================
   Swim things (chest tab "Sundföt", cat 'swim'):
   swimsuits, a swim set, a shorty wetsuit, board shorts, a hooded lion
   towel, swim rings (slot float), arm floats / armkútar (slot armfloats),
   swim goggles and diving masks with a snorkel (slot glasses), swim caps
   (slot hat), flippers and flip-flops (slot shoes), a scuba tank (slot bag)
   and things to hold at the pool (slot hold): beach ball, kickboard,
   bucket and spade, rubber duck.
   Plus two costume looks: a scuba diver and a day at the pool.
   Every shape draws in doll space (viewBox 0 0 400 800) from the G
   geometry, so it fits the doll. Drawing order inside a piece:
   fill → details → outline + soft shading.
   ===================================================================== */
(function () {
  'use strict';
  const { shade, ink } = H;
  const SW = G.stroke;
  const SUIT = ['suit', 'top', 'bottom'];
  const SKIN = PALETTE.SKIN;

  /** Number formatting and point helpers. */
  const F = v => (Math.round(v * 10) / 10).toString();
  const P = p => F(p[0]) + ',' + F(p[1]);
  /** Point on a circle, angle in degrees. */
  const pol = (cx, cy, r, deg) => [cx + Math.cos(deg * Math.PI / 180) * r, cy + Math.sin(deg * Math.PI / 180) * r];
  /** Safe id fragment from colours. */
  const idf = s => String(s).replace(/[^a-z0-9]/gi, '');

  /** Final pass for a shape: soft shading overlay plus the tinted outline. */
  const outline = (d, base, soft = 'v', sw = SW) =>
    `<path d="${d}" fill="url(#soft-${soft})" stroke="${ink(base)}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"/>`;
  /** Mirror any markup across the centre line (x → 400 - x), and "draw left, copy to the right". */
  const mirror = s => `<g transform="matrix(-1 0 0 1 400 0)">${s}</g>`;
  const both = s => s + mirror(s);
  /** Register a linear gradient with [offset, colour, opacity?] stops. Returns url(#id). */
  const grad = (id, stops, x2 = 0, y2 = 1) => H.def(id, `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">` +
    stops.map(([o, c, op]) => `<stop offset="${o}" stop-color="${c}"${op != null ? ` stop-opacity="${op}"` : ''}/>`).join('') + `</linearGradient>`);
  /** Thick line with a darker edge: straps, tubes, piping. */
  const rope = (d, c, w, op = 1) =>
    `<path d="${d}" fill="none" stroke="${ink(c)}" stroke-width="${F(w + 2.6)}" stroke-linecap="round" stroke-linejoin="round" opacity="${op}"/>` +
    `<path d="${d}" fill="none" stroke="${c}" stroke-width="${F(w)}" stroke-linecap="round" stroke-linejoin="round" opacity="${op}"/>`;
  /** Small white four-point twinkle. */
  const twinkle = (x, y, r, col = '#fff') => `<path d="M${x},${y - r}Q${x},${y} ${x + r},${y}Q${x},${y} ${x},${y + r}Q${x},${y} ${x - r},${y}Q${x},${y} ${x},${y - r}Z" fill="${col}"/>`;
  /** Outlined five-point star (inner = how deep the points are cut). */
  const starO = (cx, cy, r, col, sw = 1.4, inner = .48) => {
    let d = '';
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * inner : r; d += (i ? 'L' : 'M') + F(cx + Math.cos(a) * rr) + ',' + F(cy + Math.sin(a) * rr); }
    return `<path d="${d}Z" fill="${H.grad(col, 'r')}" stroke="${ink(col)}" stroke-width="${sw}" stroke-linejoin="round"/>`;
  };
  /** Outlined heart. */
  const heartO = (cx, cy, r, col, sw = 1.2) => H.heart(cx, cy, r, H.grad(col, 'r')).replace('/>', ` stroke="${ink(col)}" stroke-width="${sw}"/>`);
  /** Little bow (two loops and a knot). */
  const bow = (x, y, s, c) =>
    `<path d="M${x},${y} l${-11 * s},${-7 * s} v${14 * s}z M${x},${y} l${11 * s},${-7 * s} v${14 * s}z" fill="${H.grad(c)}" stroke="${ink(c)}" stroke-width="1.6" stroke-linejoin="round"/>` +
    `<circle cx="${x}" cy="${y}" r="${F(3.4 * s)}" fill="${shade(c, .2)}" stroke="${ink(c)}" stroke-width="1.4"/>`;
  /** Friendly starfish: fat rounded star with dots. */
  const starfish = (cx, cy, r, c) => {
    let d = '';
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .5 : r; d += (i ? 'L' : 'M') + F(cx + Math.cos(a) * rr) + ',' + F(cy + Math.sin(a) * rr); }
    return `<path d="${d}Z" fill="${ink(c)}" stroke="${ink(c)}" stroke-width="5" stroke-linejoin="round"/>` +
      `<path d="${d}Z" fill="${H.grad(c, 'r')}" stroke="${c}" stroke-width="2.6" stroke-linejoin="round"/>` +
      [0, 72, 144, 216, 288].map(a => { const [x, y] = pol(cx, cy, r * .52, a - 90); return `<circle cx="${F(x)}" cy="${F(y)}" r="${F(r * .09 + .4)}" fill="#fff" opacity=".8"/>`; }).join('');
  };
  /** Scallop sea shell (fan with ridges), point at the bottom. */
  const seashell = (cx, cy, r, c) => {
    const d = `M${cx},${F(cy + r * .62)} L${F(cx - r)},${F(cy - r * .15)} Q${F(cx - r * .85)},${F(cy - r)} ${cx},${F(cy - r)} Q${F(cx + r * .85)},${F(cy - r)} ${F(cx + r)},${F(cy - r * .15)} Z`;
    const ridges = [-.62, -.3, 0, .3, .62].map(k => `M${cx},${F(cy + r * .55)} L${F(cx + k * r)},${F(cy - r * (.92 - Math.abs(k) * .35))}`).join('');
    return `<path d="${d}" fill="${H.grad(c, 'r')}" stroke="${ink(c)}" stroke-width="1.6" stroke-linejoin="round"/>` +
      `<path d="${ridges}" stroke="${ink(c)}" stroke-width="1.2" opacity=".55" stroke-linecap="round"/>` +
      `<path d="M${F(cx - r * .35)},${F(cy + r * .5)} h${F(r * .7)} l${F(-r * .12)},${F(r * .22)} h${F(-r * .46)}Z" fill="${shade(c, -.08)}" stroke="${ink(c)}" stroke-width="1.2" stroke-linejoin="round"/>`;
  };
  /** Paw print: a big pad and four toe beans. */
  const paw = (x, y, s, c) => `<g fill="${c}" opacity=".9"><ellipse cx="${x}" cy="${y}" rx="${F(8 * s)}" ry="${F(6.5 * s)}"/>` +
    [[-9, -9], [-3.2, -13], [3.2, -13], [9, -9]].map(([a, b]) => `<ellipse cx="${F(x + a * s)}" cy="${F(y + b * s)}" rx="${F(2.8 * s)}" ry="${F(3.4 * s)}"/>`).join('') + `</g>`;

  const RAINBOW = ['#ef6f6c', '#f6a65a', '#f7d660', '#7fcf8a', '#6fb3e6', '#a58be0'];

  /* =================================================================
     SWIMWEAR (slot suit / bottom / jacket)
     ================================================================= */

  /**
   * One-piece swimsuit outline: a sleeveless G.shirtPath whose hem is swapped
   * for two leg openings meeting at the crotch (short cut, ends at y 508, so
   * the doll's underwear never peeks out).
   */
  function suitPath(neck = 'scoop', neckDepth, pad = 2) {
    const bottom = 452, y = 508;
    const d = G.shirtPath({ sleeve: 0, pad, bottom, neck, neckDepth });
    const xo = G.legOutX(y) - pad - 1, xi = G.legInX(y) + 1, m = (xo + xi) / 2;
    const legs = `L${F(G.torsoX(476) - pad)},476L${F(xo)},${y}Q${F(m)},${y + 4} ${F(xi)},${y}L200,${G.crotchY + 6}` +
      `L${F(400 - xi)},${y}Q${F(400 - m)},${y + 4} ${F(400 - xo)},${y}L${F(400 - G.torsoX(476) + pad)},476L`;
    return d.replace(`Q200,${bottom + 6} `, legs);
  }
  /** Piping round both leg openings of suitPath. */
  const legPiping = (pad = 2) => {
    const y = 506, xo = G.legOutX(y) - pad - 1, xi = G.legInX(y) + 1, m = (xo + xi) / 2;
    return `M${F(xo)},${y}Q${F(m)},${y + 4} ${F(xi)},${y}M${F(400 - xo)},${y}Q${F(400 - m)},${y + 4} ${F(400 - xi)},${y}`;
  };
  /** Neckline curve of a sleeveless shirtPath (same numbers as core), for trims. */
  const neckLine = (neck, depth, pad = 2) => {
    const nw = { round: 17, scoop: 25, square: 22 }[neck] || 17, ny = 252 - pad * .3;
    return `M${F(200 - nw)},${F(ny)}Q200,${F(ny + depth * 2)} ${F(200 + nw)},${F(ny)}`;
  };
  /** Armhole of a sleeveless shirtPath (left side), for shoulder ruffles. */
  const ARMHOLE_L = 'M172,253 Q160,256 150,259 Q141,264 139,276 Q134,294 146,312';

  /** Cute front-facing unicorn face (for the unicorn swimsuit). s = size. */
  const unicornFace = (cx, cy, s) => {
    const X = v => F(cx + v * s), Y = v => F(cy + v * s);
    // rainbow mane puffs behind the head
    const puffs = [[-22, -6], [-19, -18], [-9, -26], [9, -26], [19, -18], [22, -6]].map(([x, y], i) =>
      `<circle cx="${X(x)}" cy="${Y(y)}" r="${F(9 * s)}" fill="${H.grad(RAINBOW[i], 'r')}" stroke="${ink(RAINBOW[i])}" stroke-width="1.3"/>`).join('');
    // pointy ears with pink insides
    const ear = o => `<path d="M${X(o * 9)},${Y(-15)} L${X(o * 17)},${Y(-31)} L${X(o * 20)},${Y(-11)} Z" fill="#fffafd" stroke="#9c8aa6" stroke-width="1.4" stroke-linejoin="round"/>` +
      `<path d="M${X(o * 12)},${Y(-15)} L${X(o * 16.5)},${Y(-26)} L${X(o * 18)},${Y(-14)} Z" fill="#f7b6cf"/>`;
    // head, pink muzzle with nostrils, closed happy eyes, cheeks
    const head = `<ellipse cx="${cx}" cy="${cy}" rx="${F(21 * s)}" ry="${F(19 * s)}" fill="${H.grad('#fffafd', 'r')}" stroke="#9c8aa6" stroke-width="1.6"/>` +
      `<ellipse cx="${cx}" cy="${Y(9)}" rx="${F(13 * s)}" ry="${F(8.5 * s)}" fill="#f9c9da" stroke="#c98aa4" stroke-width="1.2"/>` +
      `<ellipse cx="${X(-4.5)}" cy="${Y(9)}" rx="${F(1.6 * s)}" ry="${F(2.2 * s)}" fill="#c4708f"/><ellipse cx="${X(4.5)}" cy="${Y(9)}" rx="${F(1.6 * s)}" ry="${F(2.2 * s)}" fill="#c4708f"/>` +
      `<path d="M${X(-13)},${Y(-3)} q${F(5 * s)},${F(5 * s)} ${F(10 * s)},0 M${X(3)},${Y(-3)} q${F(5 * s)},${F(5 * s)} ${F(10 * s)},0" fill="none" stroke="#3a2830" stroke-width="2" stroke-linecap="round"/>` +
      `<path d="M${X(-13)},${Y(-3)} l${F(-3 * s)},${F(-2 * s)} M${X(13)},${Y(-3)} l${F(3 * s)},${F(-2 * s)}" stroke="#3a2830" stroke-width="1.6" stroke-linecap="round"/>` +
      `<ellipse cx="${X(-14)}" cy="${Y(4)}" rx="${F(4 * s)}" ry="${F(2.6 * s)}" fill="#f48ca0" opacity=".55"/><ellipse cx="${X(14)}" cy="${Y(4)}" rx="${F(4 * s)}" ry="${F(2.6 * s)}" fill="#f48ca0" opacity=".55"/>`;
    // golden spiral horn and a forelock puff
    const horn = `<path d="M${X(-5)},${Y(-16)} L${cx},${Y(-42)} L${X(5)},${Y(-16)} Z" fill="${H.grad('#f6c84a')}" stroke="${ink('#f6c84a')}" stroke-width="1.4" stroke-linejoin="round"/>` +
      `<path d="M${X(-4)},${Y(-21)} l${F(7 * s)},${F(-3 * s)} M${X(-2.6)},${Y(-28)} l${F(5 * s)},${F(-2.4 * s)} M${X(-1.4)},${Y(-35)} l${F(3 * s)},${F(-1.4 * s)}" stroke="${ink('#f6c84a')}" stroke-width="1.2" opacity=".7"/>`;
    return puffs + ear(-1) + ear(1) + head + horn +
      `<circle cx="${X(-6)}" cy="${Y(-15)}" r="${F(5 * s)}" fill="${H.grad('#f48cc0', 'r')}" stroke="${ink('#f48cc0')}" stroke-width="1.1"/>` +
      `<circle cx="${X(6)}" cy="${Y(-16)}" r="${F(4.4 * s)}" fill="${H.grad('#a58be0', 'r')}" stroke="${ink('#a58be0')}" stroke-width="1.1"/>`;
  };

  /** Flamingo standing on one leg, facing left (for the flamingo swim dress). */
  const flamingo = (cx, cy, s, c) => {
    const X = v => F(cx + v * s), Y = v => F(cy + v * s);
    return `<path d="M${X(4)},${Y(12)} V${Y(34)} M${X(4)},${Y(22)} l${F(8 * s)},${F(-5 * s)} l${F(-3 * s)},${F(-4 * s)}" stroke="#d0607e" stroke-width="${F(2 * s)}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` +
      // body, wing, S-shaped neck, head and bent black-tipped beak
      `<ellipse cx="${X(6)}" cy="${Y(6)}" rx="${F(14 * s)}" ry="${F(9 * s)}" transform="rotate(-12 ${X(6)} ${Y(6)})" fill="${H.grad(c, 'r')}" stroke="${ink(c)}" stroke-width="1.4"/>` +
      `<path d="M${X(4)},${Y(3)} q${F(8 * s)},${F(-4 * s)} ${F(15 * s)},${F(2 * s)} q${F(-6 * s)},${F(6 * s)} ${F(-15 * s)},${F(-2 * s)}Z" fill="${shade(c, -.15)}" opacity=".8"/>` +
      `<path d="M${X(-6)},${Y(2)} C${X(-16)},${Y(-6)} ${X(-2)},${Y(-14)} ${X(-6)},${Y(-22)}" stroke="${ink(c)}" stroke-width="${F(5.6 * s)}" fill="none" stroke-linecap="round"/>` +
      `<path d="M${X(-6)},${Y(2)} C${X(-16)},${Y(-6)} ${X(-2)},${Y(-14)} ${X(-6)},${Y(-22)}" stroke="${c}" stroke-width="${F(3.4 * s)}" fill="none" stroke-linecap="round"/>` +
      `<circle cx="${X(-5)}" cy="${Y(-24)}" r="${F(5 * s)}" fill="${H.grad(c, 'r')}" stroke="${ink(c)}" stroke-width="1.3"/>` +
      `<path d="M${X(-9)},${Y(-26)} q${F(-6 * s)},${F(1 * s)} ${F(-6 * s)},${F(7 * s)} l${F(2.5 * s)},${F(-1 * s)} q${F(.5 * s)},${F(-3 * s)} ${F(3.5 * s)},${F(-3.5 * s)}Z" fill="#fff4ea" stroke="#5a3a40" stroke-width="1.1" stroke-linejoin="round"/>` +
      `<path d="M${X(-15)},${Y(-19)} l${F(2.5 * s)},${F(-1 * s)} l${F(-1 * s)},${F(3 * s)}Z" fill="#3a2830"/>` +
      `<circle cx="${X(-4)}" cy="${Y(-25)}" r="${F(1.1 * s)}" fill="#3a2830"/>`;
  };

  /** One ruffled skirt tier from the waist area (top) to a scalloped hem (bot); x0/x1 = left edge at top/bottom. */
  const ruffleTier = (top, bot, x0, x1, step, amp) => {
    const n = Math.max(4, Math.round((400 - 2 * x1) / step)), w = (400 - 2 * x1) / n;
    let hem = `M${F(x1)},${bot}`;
    for (let i = 0; i < n; i++) hem += `q${F(w / 2)},${amp} ${F(w)},0`;
    const d = `M${F(x0)},${top} Q${F(x0 - 4)},${F((top + bot) / 2)} ${F(x1)},${bot}` + hem.slice(hem.indexOf('q')) +
      `Q${F(404 - x0)},${F((top + bot) / 2)} ${F(400 - x0)},${top} Z`;
    // little gathering folds hanging from the top of the tier
    let folds = '';
    for (let i = 1; i < n; i++) { const x = x1 + w * i, xt = x0 + (400 - 2 * x0) * i / n; folds += `M${F(xt)},${top + 6} L${F(x + (x - 200) * .02)},${bot - 4}`; }
    return { d, hem, folds };
  };

  /* -------------------------------------------------------------
     One-piece swimsuit with a theme (it.deco):
       'mermaid'  scale print fading from sea green to violet, pearl neckline,
                  shell on the chest and a starfish on the hip
       'unicorn'  starry suit with a unicorn face, shoulder ruffles and rainbow piping
       'flamingo' swim dress: two ruffled skirt tiers, sash bow and a flamingo
       'sailor'   stripes with a sailor bib, red bow and a little anchor
     colors: [main, second, trim, detail]   pattern (optional) on main
     ------------------------------------------------------------- */
  DOLL.shape('swim-onepiece', {
    slot: 'suit', occupies: SUIT,
    thumb: [96, 236, 208, 290],
    draw(it) {
      const [main, second, trim, det = trim] = it.colors;
      const deco = it.deco;
      const neck = it.neck || 'scoop', depth = it.neckDepth ?? 18;
      const d = suitPath(neck, depth, 2);
      const clip = H.clip('c-' + it.id, d);
      let fill = H.fill(it), inner = '', top = '';
      if (deco === 'mermaid') {
        // sea green → ocean blue → violet, with a white scale print on top
        fill = grad('g-' + it.id, [[0, main], [.55, second], [1, trim]]);
        const sc = 'swim-scales-' + idf(det);
        inner += `<rect x="0" y="230" width="400" height="300" fill="${H.def(sc, `<pattern id="${sc}" width="18" height="18" patternUnits="userSpaceOnUse"><path d="M0,0 A9,9 0 0 0 18,0 M-9,9 A9,9 0 0 0 9,9 M9,9 A9,9 0 0 0 27,9 M0,18 A9,9 0 0 0 18,18" fill="none" stroke="${det}" stroke-width="1.6"/></pattern>`)}" opacity=".5"/>` +
          [[160, 330], [238, 360], [176, 420], [226, 452], [150, 470]].map(([x, y]) => twinkle(x, y, 5)).join('');
        // pearls along the neckline, shell on the chest, starfish on the hip, bubbles
        const pearls = [];
        for (let i = 0; i <= 12; i++) { const t = i / 12, u = 1 - t, ny = 251.4; pearls.push([u * u * 175 + 2 * u * t * 200 + t * t * 225, u * u * ny + 2 * u * t * (ny + depth * 2) + t * t * ny]); }
        top += pearls.map(([x, y]) => `<circle cx="${F(x)}" cy="${F(y + 3)}" r="3.2" fill="${H.grad('#fff6fb', 'r')}" stroke="#b49ac0" stroke-width=".9"/>`).join('') +
          seashell(200, 296, 15, '#fbd3e0') + `<circle cx="200" cy="309" r="3.6" fill="${H.grad('#ffffff', 'r')}" stroke="#b49ac0" stroke-width="1"/>` +
          starfish(166, 452, 13, '#f7a65a') +
          `<circle cx="236" cy="404" r="4" fill="none" stroke="#fff" stroke-width="1.6" opacity=".8"/><circle cx="244" cy="392" r="2.6" fill="none" stroke="#fff" stroke-width="1.4" opacity=".8"/>`;
      } else if (deco === 'unicorn') {
        // rainbow piping round the legs (drawn after the outline) and the unicorn on the tummy
        top += unicornFace(200, 372, 1.25) + twinkle(160, 318, 6, '#f6c84a') + twinkle(244, 330, 5, '#f6c84a') + twinkle(236, 446, 4, '#fff');
      } else if (deco === 'flamingo') {
        top += flamingo(200, 330, 1.3, '#f48cae') + heartO(232, 300, 5, '#ffffff', 1) + heartO(168, 360, 4, '#ffffff', 1);
      } else if (deco === 'sailor') {
        // sailor bib with white piping, red bow and a small anchor
        top += `<path d="M175,251.4 L200,306 L225,251.4 Q200,262 175,251.4Z" fill="${H.grad(second)}" stroke="${ink(second)}" stroke-width="2" stroke-linejoin="round"/>` +
          `<path d="M181,256 L200,296 L219,256" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>` +
          bow(200, 304, 1.1, trim) +
          `<g fill="none" stroke="${second}" stroke-width="3" stroke-linecap="round"><circle cx="230" cy="432" r="3.4"/><path d="M230,436 V456 M222,442 H238 M219,450 Q230,462 241,450"/></g>`;
      }
      let out = `<path d="${d}" fill="${fill}"/><g clip-path="${clip}">${inner}</g>` + outline(d, shade(main, -.12));
      // leg-opening piping (rainbow for the unicorn)
      if (deco === 'unicorn') {
        out += RAINBOW.slice(0, 3).map((c, i) => `<path d="${legPiping()}" fill="none" stroke="${c}" stroke-width="2.4" stroke-linecap="round" transform="translate(0,${-5 + i * 2.2})"/>`).join('');
      } else out += `<path d="${legPiping()}" fill="none" stroke="${trim}" stroke-width="4.6" stroke-linecap="round" transform="translate(0,-3)"/>`;
      // neckline binding
      if (deco !== 'mermaid' && deco !== 'sailor') out += `<path d="${neckLine(neck, depth)}" fill="none" stroke="${trim}" stroke-width="3.4" stroke-linecap="round"/>`;
      // frilly shoulder ruffles (left drawn, right mirrored)
      if (it.ruffle) {
        const rc = it.ruffle;
        out += both(`<path d="${ARMHOLE_L}" fill="none" stroke="${ink(rc)}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>` +
          `<path d="${ARMHOLE_L}" fill="none" stroke="${rc}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="7 1.4"/>` +
          `<path d="M160,254 q-4,6 -10,7 M143,268 q-1,7 -6,10 M138,292 q2,7 -1,12" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".75"/>`);
      }
      // ruffled swim-dress skirt: lower tier first, then upper tier, then a sash with a bow
      if (deco === 'flamingo') {
        const t2 = ruffleTier(436, 512, 132, 100, 17, 8), t1 = ruffleTier(404, 468, G.torsoX(404) - 3, 118, 16, 8);
        const tierDraw = (t, c) => `<path d="${t.d}" fill="${H.grad(c)}"/>` + H.line(t.folds, c, 1.6, .35) + outline(t.d, c) +
          `<path d="${t.hem}" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="1 5" stroke-linecap="round" transform="translate(0,-4)"/>`;
        out += tierDraw(t2, second) + tierDraw(t1, main) +
          `<path d="M${F(G.torsoX(404) - 4)},398 Q200,404 ${F(404 - G.torsoX(404))},398 L${F(404 - G.torsoX(412))},412 Q200,418 ${F(G.torsoX(412) - 4)},412Z" fill="${H.grad(trim)}" stroke="${ink(trim)}" stroke-width="2" stroke-linejoin="round"/>` +
          bow(236, 406, 1.2, trim) + `<path d="M232,410 l-6,16 M240,410 l6,16" stroke="${ink(trim)}" stroke-width="5" stroke-linecap="round"/><path d="M232,410 l-6,16 M240,410 l6,16" stroke="${trim}" stroke-width="3" stroke-linecap="round"/>`;
      }
      return out + top;
    },
  });

  /* -------------------------------------------------------------
     Fish swim set: short-sleeved rash top with a fish print, contrast raglan
     seams and cuffs, plus swim shorts with a wave hem.
     colors: [top, fish 1, shorts, fish 2 + trims]
     ------------------------------------------------------------- */
  const fishIcon = (x, y, dir, c) =>
    `<path d="M${x - 7 * dir},${y} Q${x},${y - 6} ${x + 6 * dir},${y} Q${x},${y + 6} ${x - 7 * dir},${y} Z M${x - 6 * dir},${y} l${-5 * dir},-4 v8 Z" fill="${c}"/>` +
    `<circle cx="${x + 2.6 * dir}" cy="${y - 1}" r="1.1" fill="#2b2733"/>`;
  DOLL.shape('swim-fishset', {
    slot: 'suit', occupies: SUIT,
    thumb: [70, 236, 260, 300],
    draw(it) {
      const [topC, fishA, shortsC, fishB] = it.colors;
      const pid = `swim-fishp-${idf(topC)}${idf(fishA)}${idf(fishB)}`;
      const print = H.def(pid, `<pattern id="${pid}" width="44" height="36" patternUnits="userSpaceOnUse"><rect width="44" height="36" fill="${topC}"/>` +
        fishIcon(12, 10, 1, fishA) + fishIcon(32, 27, -1, fishB) + `<circle cx="34" cy="9" r="2" fill="#fff" opacity=".85"/><circle cx="38" cy="4" r="1.3" fill="#fff" opacity=".85"/></pattern>`);
      const sh = G.pantsPath({ top: 428, bottom: 524, pad: 5, flare: 6 });
      const shClip = H.clip('c-' + it.id + '-sh', sh);
      const top = G.shirtPath({ sleeve: .3, pad: 3, sleevePad: 3, bottom: 446, neck: 'round' });
      const clip = H.clip('c-' + it.id, top);
      // shorts: side stripes and a white wave above the hem
      const wave = 'M0,508 q10,-7 20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0';
      const shorts = `<path d="${sh}" fill="${H.grad(shortsC)}"/><g clip-path="${shClip}">` +
        `<path d="M138,440 L132,530 M262,440 L268,530" stroke="${fishB}" stroke-width="6"/>` +
        `<path d="${wave}" fill="none" stroke="#fff" stroke-width="3.4" opacity=".9"/><rect x="0" y="514" width="400" height="14" fill="${shade(shortsC, -.12)}"/></g>` +
        H.line('M190,480 l-8,10 M210,480 l8,10', shortsC, 1.6, .45) + outline(sh, shortsC, 'h');
      // top: cuffs, hem band, raglan seams, neck binding
      const cuff = s => `<path d="${G.armPath(s, .25, .3, 4)}" fill="${fishB}"/>`;
      const tee = `<path d="${top}" fill="${print}"/><g clip-path="${clip}">${cuff('L')}${cuff('R')}<rect x="0" y="436" width="400" height="14" fill="${fishB}"/></g>` +
        both(`<path d="M178,256 Q164,282 150,314" fill="none" stroke="${ink(fishB)}" stroke-width="7" stroke-linecap="round" opacity=".5"/><path d="M178,256 Q164,282 150,314" fill="none" stroke="${fishB}" stroke-width="5" stroke-linecap="round"/>`) +
        H.line('M152,330 q7,12 4,26 M248,330 q-7,12 -4,26', topC, 1.6, .4) + outline(top, shade(topC, -.15)) +
        `<path d="M183,250.5 Q200,270.5 217,250.5" fill="none" stroke="${fishB}" stroke-width="6" stroke-linecap="round"/>` +
        // a bigger smiling fish on the chest
        `<g transform="translate(222 320) scale(1.9)">${fishIcon(0, 0, -1, fishA)}</g>` +
        `<path d="M210,318 q2,3 5,2" stroke="#2b2733" stroke-width="1.1" fill="none" stroke-linecap="round"/>`;
      return shorts + tee;
    },
  });

  /* -------------------------------------------------------------
     Shorty wetsuit (Kafarabúningur): short sleeves, legs to above the knee,
     high collar with a zip, contrast side panels, chest band and cuffs.
     colors: [base, panels, accent]
     ------------------------------------------------------------- */
  DOLL.shape('swim-wetsuit', {
    slot: 'suit', occupies: SUIT,
    thumb: [64, 230, 272, 340],
    draw(it) {
      const [c, pan, acc] = it.colors;
      const legs = G.pantsPath({ top: 430, bottom: 558, pad: 3, flare: 1 });
      const lClip = H.clip('c-' + it.id + '-l', legs);
      const top = G.shirtPath({ sleeve: .32, pad: 3, sleevePad: 2, bottom: 452, neck: 'high' });
      const clip = H.clip('c-' + it.id, top);
      const shine = `<path d="M150,300 Q142,340 146,390 Q150,344 158,306Z M232,290 Q246,320 246,350 Q240,322 228,298Z" fill="#fff" opacity=".22"/>`;
      // legs: outer side stripes and accent knee cuffs
      const legPart = `<path d="${legs}" fill="${H.grad(c)}"/><g clip-path="${lClip}">` +
        `<path d="M132,440 L144,440 L152,560 L140,560Z M268,440 L256,440 L248,560 L260,560Z" fill="${pan}"/>` +
        `<rect x="0" y="544" width="400" height="16" fill="${H.grad(acc)}"/></g>` +
        H.line('M190,482 l-8,10 M210,482 l8,10 M166,520 q10,4 20,0 M214,520 q10,4 20,0', c, 1.6, .5) + outline(legs, c, 'h');
      // body: side panels, curved chest band, sleeve cuffs
      const cuff = s => `<path d="${G.armPath(s, .26, .32, 4)}" fill="${H.grad(acc)}"/>`;
      const body = `<path d="${top}" fill="${H.grad(c)}"/><g clip-path="${clip}">` +
        `<path d="M104,290 Q150,350 146,460 L130,460 Q130,350 92,290Z M296,290 Q250,350 254,460 L270,460 Q270,350 308,290Z" fill="${pan}"/>` +
        `<path d="M0,300 Q200,346 400,300 V320 Q200,366 0,320Z" fill="${pan}"/><path d="M0,322 Q200,368 400,322" stroke="${acc}" stroke-width="3" fill="none"/>` +
        cuff('L') + cuff('R') + shine + `</g>` + outline(top, c);
      // high collar, zip with a long pull cord, starfish badge
      const collar = `<path d="M184,244 Q200,256 216,244 L216,232 Q200,240 184,232Z" fill="${H.grad(pan)}" stroke="${ink(pan)}" stroke-width="2" stroke-linejoin="round"/>` +
        `<path d="M200,250 V430" stroke="${shade(c, -.4)}" stroke-width="3.2" stroke-dasharray="2 2"/>` +
        `<rect x="196" y="250" width="8" height="12" rx="3" fill="#e6e9ee" stroke="${ink(c)}" stroke-width="1.4"/>` +
        rope('M200,262 Q206,280 204,300', acc, 2.4) + `<circle cx="204" cy="302" r="3.4" fill="${H.grad(acc, 'r')}" stroke="${ink(acc)}" stroke-width="1.2"/>` +
        starfish(166, 360, 9, acc);
      return legPart + body + collar;
    },
  });

  /* -------------------------------------------------------------
     Board shorts (slot bottom): long loose swim shorts with a flower print,
     tie waistband, side stripe and a little side split at the hem.
     colors: [base, print, band]
     ------------------------------------------------------------- */
  DOLL.shape('swim-boardshorts', {
    slot: 'bottom',
    thumb: [104, 380, 192, 190],
    draw(it) {
      const [c, pc, band] = it.colors;
      const d = G.pantsPath({ top: 398, bottom: 548, pad: 6, flare: 9 });
      const clip = H.clip('c-' + it.id, d);
      // big hibiscus-like flowers scattered over the print
      const bloom = (x, y, r) => [0, 72, 144, 216, 288].map(a => { const [px, py] = pol(x, y, r * .55, a - 90); return `<circle cx="${F(px)}" cy="${F(py)}" r="${F(r * .5)}" fill="${pc}" opacity=".9"/>`; }).join('') +
        `<circle cx="${x}" cy="${y}" r="${F(r * .25)}" fill="#ffd84d"/>`;
      const flowers = [[160, 452, 13], [236, 470, 12], [172, 520, 11], [224, 528, 10], [146, 498, 8], [258, 432, 8]].map(a => bloom(...a)).join('');
      return `<path d="${d}" fill="${H.fill(it)}"/><g clip-path="${clip}">${flowers}` +
        `<path d="M136,410 L128,552 L140,552 L146,410Z M264,410 L272,552 L260,552 L254,410Z" fill="${band}"/>` +
        `<rect x="0" y="398" width="400" height="16" fill="${H.grad(band)}"/><rect x="0" y="536" width="400" height="14" fill="${shade(c, -.1)}"/></g>` +
        // side splits at the hem
        H.line('M136,548 l4,-12 l4,12 M264,548 l-4,-12 l-4,12', c, 1.8, .7) +
        H.line('M190,480 l-8,10 M210,480 l8,10', c, 1.6, .45) + outline(d, c, 'h') +
        // drawstring tied in a bow
        `<circle cx="196" cy="406" r="2" fill="${ink(band)}"/><circle cx="204" cy="406" r="2" fill="${ink(band)}"/>` +
        rope('M196,407 q-6,8 -10,22 M204,407 q6,8 10,22', '#ffffff', 2.2) + bow(200, 410, .7, '#ffffff');
    },
  });

  /* -------------------------------------------------------------
     Hooded lion towel (slot jacket): a terry-towel poncho with wide sleeves,
     a hood worn up with a fluffy mane and round ears, a striped hem and
     paw prints.
     colors: [towel, mane, inner ear / paws]
     ------------------------------------------------------------- */
  DOLL.shape('swim-towel', {
    slot: 'jacket',
    thumb: [36, 18, 328, 548],
    draw(it) {
      const [c, mane, det] = it.colors;
      const terry = H.pat('dots', c, shade(c, .2), 7);
      const body = G.shirtPath({ sleeve: .55, pad: 12, sleevePad: 8, sleeveFlare: 12, bottom: 548, flare: 30, neck: 'round', neckDepth: 6 });
      const clip = H.clip('c-' + it.id, body);
      const cuff = s => `<path d="${G.armPath(s, .47, .56, 24)}" fill="${H.grad(mane)}"/>`;
      const poncho = `<path d="${body}" fill="${terry}"/><g clip-path="${clip}">` +
        `<rect x="0" y="522" width="400" height="30" fill="${H.grad(mane)}"/><path d="M0,530 H400" stroke="#fff" stroke-width="2" stroke-dasharray="4 3"/>` +
        cuff('L') + cuff('R') + `</g>` +
        H.line('M150,340 q-6,60 -10,120 M250,340 q6,60 10,120 M184,440 q-2,40 -4,80 M216,440 q2,40 4,80', c, 1.8, .4) +
        outline(body, c) + paw(170, 486, 1.1, det) + paw(232, 470, .9, det);
      // mane puffs round the hood, then ears, then the hood itself
      let puffs = '';
      G.headArc(150, 390, 38, 15).forEach(([x, y], i) => {
        const col = i % 2 ? shade(mane, -.1) : mane;
        puffs += `<circle cx="${F(x)}" cy="${F(y)}" r="16" fill="${H.grad(col, 'r')}" stroke="${ink(mane)}" stroke-width="1.8"/>`;
      });
      const ears = [236, 304].map(a => { const [x, y] = G.headArc(a, a, 46, 1)[0]; return `<circle cx="${F(x)}" cy="${F(y)}" r="18" fill="${H.grad(c, 'r')}" stroke="${ink(c)}" stroke-width="2"/><circle cx="${F(x)}" cy="${F(y + 1.5)}" r="10" fill="${det}"/>`; }).join('');
      const outer = G.headArc(150, 390, 26, 18), inner = G.headArc(388, 152, 3, 18);
      const hoodPts = [[132, 250]].concat(outer, [[272, 250], [236, 244]], inner, [[164, 244]]);
      const hood = H.smooth(hoodPts, true, .35);
      const hoodPart = `<path d="${hood}" fill="${terry}"/>` + outline(hood, c, 'r') +
        `<path d="M${inner.map(P).join('L')}" fill="none" stroke="${shade(c, -.15)}" stroke-width="4" opacity=".5" stroke-linecap="round"/>`;
      return poncho + puffs + ears + hoodPart;
    },
  });

  /* =================================================================
     SWIM RINGS (slot float). The ring sits round the waist; its back half is
     drawn behind the body, its front half in front, so the arms hang inside.
     The tube is one thick stroked ellipse half: dark edge, colour, then a
     soft shadow underneath and a white shine on top.
     ================================================================= */
  const RG = { cx: 200, cy: 408, rx: 112, ry: 34, r: 18 };
  /** Half of the ring's centre line (front = lower half). dr grows it, dy moves it down. */
  const ringArc = (front, dr = 0, dy = 0) => {
    const a = RG.rx + dr, b = RG.ry + dr;
    return `M${F(RG.cx - a)},${F(RG.cy + dy)}A${F(a)},${F(b)} 0 0 ${front ? 0 : 1} ${F(RG.cx + a)},${F(RG.cy + dy)}`;
  };
  /** Point on the tube's centre line at angle deg (90 = front middle, 270 = back middle). */
  const ringPt = (deg, dr = 0, dy = 0) => [RG.cx + Math.cos(deg * Math.PI / 180) * (RG.rx + dr), RG.cy + dy + Math.sin(deg * Math.PI / 180) * (RG.ry + dr)];

  /** The tube for one half of the ring, in the style of the item. */
  function ringTube(it, front) {
    const [c, c2 = '#ffffff', acc = '#f7d660'] = it.colors, st = it.style, w = RG.r * 2, d = ringArc(front);
    let s = `<path d="${d}" fill="none" stroke="${ink(st === 'rainbow' ? '#8a72dc' : c)}" stroke-width="${F(w + 2 * SW)}"/>`;
    if (st === 'rainbow') {
      // six bands, red outside to violet inside
      RAINBOW.forEach((col, k) => { s += `<path d="${ringArc(front, RG.r - (2 * k + 1) * RG.r / 6)}" fill="none" stroke="${col}" stroke-width="${F(w / 6 + .7)}"/>`; });
    } else {
      s += `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}"/>`;
      if (it.stripes) s += `<path d="${d}" pathLength="100" fill="none" stroke="${c2}" stroke-width="${w}" stroke-dasharray="${it.stripes}"/>`;
      if (st === 'donut') {
        // pink icing on the top of the tube with round drips, then sprinkles
        const iy = -RG.r * .3;
        s += `<path d="${ringArc(front, 0, iy)}" fill="none" stroke="${ink(c2)}" stroke-width="${F(w * .74 + 2)}" opacity=".5"/>` +
          `<path d="${ringArc(front, 0, iy)}" fill="none" stroke="${c2}" stroke-width="${F(w * .74)}"/>`;
        const a0 = front ? 12 : 192;
        for (let a = a0; a < a0 + 160; a += 17) {
          const [x, y] = ringPt(a, 0, RG.r * .36), k = (a / 17) % 2 ? 4.2 : 3;
          s += `<ellipse cx="${F(x)}" cy="${F(y + k * .4)}" rx="${F(k)}" ry="${F(k * 1.35)}" fill="${c2}"/>`;
        }
        const cols = ['#ffffff', '#6fb3e6', '#f7d660', '#7fcf8a', '#a58be0', '#ef6f6c'];
        let i = 0;
        for (let a = a0 - 4; a < a0 + 166; a += 9, i++) {
          const [x, y] = ringPt(a, (i % 3 - 1) * 5, -RG.r * .34 + (i % 2) * 4);
          s += `<rect x="${F(x - 3.4)}" y="${F(y - 1.2)}" width="6.8" height="2.4" rx="1.2" fill="${cols[i % 6]}" transform="rotate(${(i * 47) % 180} ${F(x)} ${F(y)})"/>`;
        }
      }
    }
    // shading: soft shadow on the underside, white shine along the top
    s += `<path d="${ringArc(front, 0, RG.r * .5)}" fill="none" stroke="#2a1630" stroke-width="${F(RG.r * .7)}" opacity=".13"/>` +
      `<path d="${ringArc(front, 0, -RG.r * .5)}" pathLength="100" fill="none" stroke="#fff" stroke-width="${F(RG.r * .3)}" stroke-linecap="round" stroke-dasharray="0 14 72 14" opacity=".6"/>`;
    if (front) {
      // air valve on the right front
      const [vx, vy] = ringPt(58, 0, -RG.r * .55);
      s += `<rect x="${F(vx - 4)}" y="${F(vy - 3)}" width="8" height="7" rx="2" fill="${shade(c, -.1)}" stroke="${ink(c)}" stroke-width="1.3"/>` +
        `<rect x="${F(vx - 5.5)}" y="${F(vy - 8)}" width="11" height="5.4" rx="2.4" fill="${H.grad(st === 'rainbow' ? '#ffffff' : c2)}" stroke="${ink(c)}" stroke-width="1.3"/>`;
    }
    return s;
  }

  /** Unicorn head rising from the front-left of the ring, facing left. */
  const ringUnicorn = (c, acc) => {
    const maneD = [[150, 330], [156, 346], [158, 364], [160, 382], [160, 400], [158, 418]];
    const mane = maneD.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="10" fill="${H.grad(RAINBOW[i], 'r')}" stroke="${ink(RAINBOW[i])}" stroke-width="1.5"/>`).join('');
    const neck = 'M120,446 C114,420 110,398 114,372 L150,366 C150,392 152,420 154,444 Q138,452 120,446 Z';
    const head = 'M150,352 C150,332 136,324 120,326 C104,328 96,338 92,350 C86,362 90,378 103,380 C114,382 122,380 132,377 C145,373 150,366 150,352 Z';
    const horn = `<path d="M110,334 L104,298 L122,330 Z" fill="${H.grad(acc)}" stroke="${ink(acc)}" stroke-width="1.6" stroke-linejoin="round"/>` +
      H.line('M110,322 l9,-2 M108,312 l7,-2 M106,304 l4,-1', acc, 1.3, .7);
    const ear = `<path d="M134,334 L144,310 L150,334 Z" fill="${H.grad(c)}" stroke="${ink(c)}" stroke-width="1.6" stroke-linejoin="round"/><path d="M139,330 L144,317 L147,331 Z" fill="#f7b6cf"/>`;
    return mane + `<path d="${neck}" fill="${H.grad(c, 'h')}"/>` + outline(neck, c, 'h') + ear +
      `<path d="${head}" fill="${H.grad(c, 'r')}"/>` + outline(head, c, 'r') +
      `<ellipse cx="99" cy="366" rx="9" ry="11" fill="#f9c9da" opacity=".9"/><ellipse cx="94" cy="363" rx="1.8" ry="2.6" fill="#c4708f"/>` +
      `<path d="M95,374 q5,3 10,0" stroke="#c4708f" stroke-width="1.6" fill="none" stroke-linecap="round"/>` +
      `<path d="M116,350 q7,6 14,0 M116,350 l-3,-2 M120,354 l-2,3 M126,354 l1,3" fill="none" stroke="#3a2830" stroke-width="2" stroke-linecap="round"/>` +
      `<ellipse cx="132" cy="363" rx="5" ry="3.4" fill="#f48ca0" opacity=".55"/>` + horn +
      `<circle cx="126" cy="326" r="7" fill="${H.grad('#f48cc0', 'r')}" stroke="${ink('#f48cc0')}" stroke-width="1.3"/>` + twinkle(84, 318, 6, acc);
  };
  /** Rainbow tail rising from the back-right of the ring (behind the body). */
  const ringTail = () => ['M300,404 C320,398 334,382 330,358', 'M302,408 C328,404 344,388 346,366', 'M302,412 C326,414 348,404 356,388']
    .map((d, i) => rope(d, RAINBOW[[0, 2, 4][i]], 7) + rope(d, RAINBOW[[1, 3, 5][i]], 2.4, .8)).join('');
  /** Flamingo head on an S-neck from the front-left of the ring. */
  const ringFlamingo = c => {
    const neckD = 'M134,440 C110,424 104,398 120,382 C136,366 138,348 124,334';
    return `<path d="${neckD}" fill="none" stroke="${ink(c)}" stroke-width="16" stroke-linecap="round"/><path d="${neckD}" fill="none" stroke="${c}" stroke-width="12" stroke-linecap="round"/>` +
      `<path d="M110,402 C112,390 122,382 128,372" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".55"/>` +
      `<circle cx="120" cy="330" r="14" fill="${H.grad(c, 'r')}" stroke="${ink(c)}" stroke-width="2"/>` +
      // bent beak: white base, black tip
      `<path d="M108,326 C96,326 90,336 92,352 L98,350 C98,342 102,338 110,338 Z" fill="#fff4ea" stroke="#5a3a40" stroke-width="1.6" stroke-linejoin="round"/>` +
      `<path d="M92.6,346 L92,352 L98,350 L98.4,344 Z" fill="#3a2830"/>` +
      `<circle cx="121" cy="326" r="2.6" fill="#3a2830"/><circle cx="122" cy="325" r=".9" fill="#fff"/>` +
      `<ellipse cx="128" cy="336" rx="4" ry="2.6" fill="#ef5b8d" opacity=".5"/>`;
  };
  /** Flamingo tail feathers at the back-right of the ring. */
  const ringFeathers = c => [[0, 0], [10, 8], [18, 18]].map(([a, b]) =>
    `<path d="M${296 + a},${404 - b * .2} Q${318 + a},${380 - b} ${340 + a},${372 + b * .4} Q${322 + a},${398 - b * .2} ${298 + a},${410}Z" fill="${H.grad(shade(c, -a / 90))}" stroke="${ink(c)}" stroke-width="1.6" stroke-linejoin="round"/>`).join('');

  /* -------------------------------------------------------------
     Swim ring. it.style: 'unicorn' | 'flamingo' | 'donut' | 'rainbow'
     it.stripes: dash pattern for colour stripes (pathLength 100 per half)
     colors: [tube, second (stripes / icing), accent]
     ------------------------------------------------------------- */
  DOLL.shape('swim-ring', {
    slot: 'float',
    thumb: [62, 290, 300, 196],
    draw(it) {
      const [c, , acc = '#f6c84a'] = it.colors;
      let back = '', front = '';
      if (it.style === 'unicorn') back += ringTail();
      if (it.style === 'flamingo') back += ringFeathers(c);
      back += ringTube(it, false);
      front += ringTube(it, true);
      if (it.style === 'unicorn') front += `<g transform="translate(187 442) scale(.84) translate(-137 -444)">${ringUnicorn(c, acc)}</g>` + twinkle(250, 444, 5, acc) + twinkle(282, 432, 3.6, acc) + twinkle(120, 440, 4, '#fff');
      if (it.style === 'flamingo') front += `<g transform="translate(184 440) scale(.9) translate(-134 -440)">${ringFlamingo(c)}</g>` + heartO(236, 446, 5, '#ffffff') + heartO(276, 432, 4, '#ffffff');
      return { back, front };
    },
  });

  /* =================================================================
     ARM FLOATS / armkútar (slot armfloats): puffy bands round the upper arms.
     Drawn in "upper-arm space": origin on the arm at t .31, +y down the arm,
     +x toward the body; onUpperArm() places it on each arm (mirrored right).
     ================================================================= */
  const onUpperArm = (side, m) => {
    const [x, y] = G.armPoint(side, .31);
    const tilt = side === 'L' ? 16.6 : -16.6, flip = side === 'L' ? '' : ' scale(-1,1)';
    return `<g transform="translate(${F(x)},${F(y)}) rotate(${tilt})${flip}">${m}</g>`;
  };
  /* -------------------------------------------------------------
     Arm float: two-chamber cylinder with a welded seam, the arm going in at
     the top, an air valve on the outside and a print (it.motif).
     it.motif: 'band' (classic white band) | 'hearts' | 'stars'
     colors: [float, print, valve]
     ------------------------------------------------------------- */
  DOLL.shape('swim-armband', {
    slot: 'armfloats',
    thumb: [72, 268, 108, 118],
    draw(it) {
      const [c, pc = '#ffffff', vc = '#ffffff'] = it.colors;
      const W = 23, T = -22, B = 22, ry = 7, aw = 15.1, bu = 10;
      // two puffy chambers (upper and lower) meeting at a seam in the middle
      const body = `M${-W},${T} C${-W - bu},${T + 4} ${-W - bu},${-6} ${-W - 2},0 C${-W - bu},6 ${-W - bu},${B - 4} ${-W},${B} A${W},${ry + 2} 0 0 0 ${W},${B} C${W + bu},${B - 4} ${W + bu},6 ${W + 2},0 C${W + bu},${-6} ${W + bu},${T + 4} ${W},${T} A${W},${ry} 0 0 0 ${-W},${T} Z`;
      const cid = 'c-' + it.id;
      let print = '';
      if (it.motif === 'band') print = `<rect x="-40" y="-8" width="80" height="16" fill="${pc}"/><rect x="-40" y="-8" width="80" height="16" fill="url(#soft-h)"/>`;
      if (it.motif === 'hearts') print = [[-12, -12, 6], [8, -6, 5], [-4, 12, 6], [14, 14, 4.4]].map(([x, y, r]) => H.heart(x, y, r, pc)).join('');
      if (it.motif === 'stars') print = [[-12, -12, 7], [9, -8, 5.4], [-5, 12, 6.4], [14, 13, 4.6]].map(([x, y, r]) => H.star(x, y, r, pc)).join('');
      const m =
        // body of the float with soft cylinder shading
        `<path d="${body}" fill="${H.grad(c, 'h')}"/><g clip-path="${H.clip(cid, body)}">${print}</g>` +
        `<path d="${body}" fill="url(#soft-h)"/>` +
        // welded seam round the middle
        `<path d="M${-W - 1},0 A${W + 1},6 0 0 0 ${W + 1},0" fill="none" stroke="${ink(c)}" stroke-width="1.6" opacity=".55"/>` +
        `<path d="M${-W - 1},1.6 A${W + 1},6 0 0 0 ${W + 1},1.6" fill="none" stroke="#fff" stroke-width="1.2" opacity=".5"/>` +
        // opening at the top: dark inside, the arm going in, then the front lip
        `<ellipse cx="0" cy="${T}" rx="${aw + 3}" ry="${ry - 2.4}" fill="${shade(c, -.4)}"/>` +
        `<rect x="${-aw}" y="${T - ry - 1}" width="${2 * aw}" height="${ry + 2}" fill="url(#sk-limb)"/>` +
        `<path d="M${-aw},${T - ry - 1} V${T + 1} M${aw},${T - ry - 1} V${T + 1}" stroke="${SKIN.line}" stroke-width="2"/>` +
        `<path d="M${-aw - 3},${T} A${aw + 3},${ry - 2.4} 0 0 0 ${aw + 3},${T}" fill="none" stroke="${ink(c)}" stroke-width="1.6"/>` +
        // outline and shine on each chamber
        `<path d="${body}" fill="none" stroke="${ink(c)}" stroke-width="${SW}" stroke-linejoin="round"/>` +
        `<path d="M${-W - 3},${T + 6} Q${-W - 5},${-8} ${-W - 2},${-4} M${-W - 3},${6} Q${-W - 5},${B - 8} ${-W - 1},${B - 3}" stroke="#fff" stroke-width="3.2" stroke-linecap="round" fill="none" opacity=".75"/>` +
        `<ellipse cx="${-8}" cy="${T + 7}" rx="6" ry="2.4" fill="#fff" opacity=".45"/>` +
        // air valve on the outer side
        `<rect x="${-W - 13}" y="-15" width="6" height="12" rx="2.4" fill="${H.grad(vc)}" stroke="${ink(c)}" stroke-width="1.3"/>` +
        `<path d="M${-W - 7},-9 h-2" stroke="${ink(c)}" stroke-width="3.4" stroke-linecap="round"/>`;
      return onUpperArm('L', m) + onUpperArm('R', m);
    },
  });

  /* =================================================================
     GOGGLES AND DIVING MASKS (slot glasses)
     ================================================================= */
  /** Goggle lens outline round one eye: rounded, a little wider on the outer side. */
  const LENS = [[-22, -3], [-16, -14], [0, -17.5], [14, -13.5], [19.5, 0], [13, 13.5], [-2, 16.5], [-17, 11]];
  const lensD = s => { const [ex, ey] = G.eyes[s === 'L' ? 0 : 1], o = s === 'L' ? 1 : -1; return H.smooth(LENS.map(([x, y]) => [ex + x * o, ey + y])); };
  /* -------------------------------------------------------------
     Swim goggles: see-through tinted lenses with a rubber gasket, nose
     bridge with a bead, wide straps with clips and a little decoration.
     it.deco: 'heart' | 'star' | 'fish'; it.rainbow: rainbow-tinted lenses
     colors: [frame, lens tint 1, lens tint 2, strap, decoration]
     ------------------------------------------------------------- */
  DOLL.shape('swim-goggles', {
    slot: 'glasses',
    thumb: [100, 124, 200, 80],
    draw(it) {
      const [frame, t1, t2 = t1, strap = frame, dc = '#ffffff'] = it.colors;
      const tint = it.rainbow
        ? grad('g-' + it.id, RAINBOW.map((c, i) => [i / 5, shade(c, .3)]), 1, 1)
        : grad('g-' + it.id, [[0, t1], [1, t2]], 1, 1);
      // rainbow goggles get a rainbow frame (left to right across each lens)
      const rainbowFrame = grad('gf-' + it.id, RAINBOW.map((c, i) => [i / 5, c]), 1, 0);
      const strapD = 'M150,159 C136,157 122,156 108,158';
      const strapL = `<path d="${strapD}" stroke="${ink(strap)}" stroke-width="10.6" stroke-linecap="round" fill="none"/>` +
        `<path d="${strapD}" stroke="${strap}" stroke-width="8" stroke-linecap="round" fill="none"/>` +
        `<path d="${strapD}" stroke="#fff" stroke-width="1.6" stroke-dasharray="3 4" fill="none" opacity=".7"/>` +
        `<rect x="143" y="152" width="10" height="13" rx="3" fill="${H.grad(frame)}" stroke="${ink(frame)}" stroke-width="1.4"/>`;
      const lens = s => {
        const d = lensD(s), [ex, ey] = G.eyes[s === 'L' ? 0 : 1], o = s === 'L' ? 1 : -1;
        return `<path d="${d}" fill="${tint}" opacity=".42"/>` +
          `<path d="M${ex - 12 * o},${ey - 5} q${3 * o},-7 ${10 * o},-8 M${ex + 8 * o},${ey + 9} q${3 * o},-1 ${5 * o},-4" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".85"/>` +
          `<path d="${d}" fill="none" stroke="${ink(frame)}" stroke-width="9.6" stroke-linejoin="round"/>` +
          `<path d="${d}" fill="none" stroke="${it.rainbow ? rainbowFrame : frame}" stroke-width="7" stroke-linejoin="round"/>` +
          `<path d="${d}" fill="none" stroke="#fff" stroke-width="1.4" opacity=".5" transform="translate(${ex} ${ey}) scale(1.04) translate(${-ex} ${-ey - 1})"/>`;
      };
      const [lx, ly] = G.eyes[0];
      const decoL = it.deco === 'heart' ? heartO(lx - 18, ly - 15, 6.5, dc)
        : it.deco === 'star' ? starO(lx - 18, ly - 15, 7.5, dc)
          : it.deco === 'fish' ? `<g transform="translate(${lx - 18} ${ly - 15}) scale(1.1)">${fishIcon(0, 0, 1, dc)}</g>` : '';
      return strapL + mirror(strapL) + lens('L') + lens('R') +
        rope('M192,161 Q200,155 208,161', frame, 4) + `<circle cx="200" cy="157.6" r="3" fill="${H.grad(dc, 'r')}" stroke="${ink(dc)}" stroke-width="1.1"/>` +
        decoL + mirror(decoL);
    },
  });

  /* -------------------------------------------------------------
     Diving mask with snorkel: one wide lens over eyes and nose (see-through),
     a soft silicone skirt, wide strap, and a J-shaped snorkel on the right
     with a mouthpiece at the corner of her mouth and a coloured top.
     colors: [skirt, strap, snorkel, snorkel top]
     ------------------------------------------------------------- */
  const MASK = [[134, 150], [141, 132], [168, 124], [200, 129], [232, 124], [259, 132], [266, 150], [262, 174], [248, 188], [226, 187], [214, 196], [200, 203], [186, 196], [174, 187], [152, 188], [138, 174]];
  DOLL.shape('swim-mask', {
    slot: 'glasses',
    thumb: [96, 52, 214, 176],
    draw(it) {
      const [sk, strap, tube, topC] = it.colors;
      const outer = H.smooth(MASK), inner = H.smooth(MASK.map(([x, y]) => [200 + (x - 200) * .85, 160 + (y - 160) * .79]));
      const glass = grad('g-' + it.id, [[0, '#dff6ff'], [1, '#7cc8ec']], 1, 1);
      const strapD = 'M138,150 C126,148 116,148 106,150';
      const strapL = rope(strapD, strap, 12) + `<path d="${strapD}" stroke="${shade(strap, .3)}" stroke-width="2" fill="none" stroke-dasharray="5 3"/>`;
      // snorkel: mouthpiece, J-tube up the right side, clip on the strap, coloured top
      const tubeD = 'M224,210 C246,224 280,222 285,194 L291,80';
      const snorkel = `<rect x="208" y="203" width="20" height="12" rx="5" fill="${H.grad('#5b6b7c')}" stroke="#36404c" stroke-width="1.6"/>` +
        rope(tubeD, tube, 9) + `<path d="M232,212 C252,220 276,218 281,194 L286.4,84" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".55"/>` +
        `<rect x="281" y="140" width="15" height="12" rx="3" fill="${H.grad(strap)}" stroke="${ink(strap)}" stroke-width="1.6"/>` +
        `<path d="M282,84 Q281,62 292,58 Q303,60 302,84 Z" fill="${H.grad(topC)}" stroke="${ink(topC)}" stroke-width="1.8" stroke-linejoin="round"/>` +
        `<path d="M285,70 h14 M284.4,77 h15" stroke="${ink(topC)}" stroke-width="1.3" opacity=".6"/>`;
      return strapL + mirror(strapL) +
        `<path d="${inner}" fill="${glass}" opacity=".32"/>` +
        `<path d="M156,182 L182,138 M168,184 L190,146" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".45"/>` +
        // soft silicone skirt: a ring between the outer and inner outline
        `<path d="${outer}${inner}" fill-rule="evenodd" fill="${H.grad(sk)}"/>` +
        `<path d="${outer}${inner}" fill-rule="evenodd" fill="url(#soft-v)"/>` +
        `<path d="${outer}" fill="none" stroke="${ink(sk)}" stroke-width="${SW}" stroke-linejoin="round"/>` +
        `<path d="${inner}" fill="none" stroke="${shade(sk, -.35)}" stroke-width="3.4" stroke-linejoin="round"/>` +
        `<path d="M150,131 Q170,125 190,131" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".7"/>` +
        snorkel;
    },
  });

  /* =================================================================
     SWIM CAPS (slot hat): a smooth rubber dome that covers the hair top and
     comes down over the tops of the ears, with a rolled edge.
     ================================================================= */
  const CAP_D = 'M108,168 C98,112 122,46 200,44 C278,46 302,112 292,168 Q284,175 275,166 C268,144 256,126 238,120 Q200,108 162,120 C144,126 132,144 125,166 Q116,175 108,168 Z';
  const CAP_EDGE = 'M108,168 Q116,175 125,166 C132,144 144,126 162,120 Q200,108 238,120 C256,126 268,144 275,166 Q284,175 292,168';
  /** Rubber flower with 3D petals. */
  const rubberFlower = (cx, cy, r, c, mid = '#ffd84d') => {
    let s = '';
    for (let i = 0; i < 6; i++) {
      const a = i * 60 - 90, [x, y] = pol(cx, cy, r * .55, a);
      s += `<ellipse cx="${F(x)}" cy="${F(y)}" rx="${F(r * .5)}" ry="${F(r * .32)}" transform="rotate(${a} ${F(x)} ${F(y)})" fill="${H.grad(c, 'r')}" stroke="${ink(c)}" stroke-width="1.2"/>`;
    }
    return s + `<circle cx="${cx}" cy="${cy}" r="${F(r * .3)}" fill="${H.grad(mid, 'r')}" stroke="${ink(mid)}" stroke-width="1"/>`;
  };
  /* -------------------------------------------------------------
     Swim cap. it.style 'flowers' (rubber flowers all over) |
     'unicorn' (ears, golden horn, rainbow mane puffs and stars)
     colors: [cap, decoration 1, decoration 2]
     ------------------------------------------------------------- */
  DOLL.shape('swim-cap', {
    slot: 'hat',
    thumb: [84, 4, 232, 182],
    draw(it) {
      const [c, d1, d2] = it.colors;
      const clip = H.clip('c-' + it.id, CAP_D);
      let under = '', inside = '', over = '';
      if (it.style === 'flowers') {
        over = [[150, 74, 15, d1], [204, 58, 16, d2], [254, 78, 15, d1], [126, 116, 12, d2], [274, 118, 12, d2], [178, 98, 12, d2], [228, 100, 13, d1], [112, 152, 8, d1], [288, 152, 8, d1]]
          .map(([x, y, r, col]) => rubberFlower(x, y, r, col)).join('');
      }
      if (it.style === 'unicorn') {
        // pastel rainbow stripe over the top, ears, mane puffs and a golden horn
        inside = RAINBOW.map((col, i) => `<path d="M${112 + i * 4.4},172 C${104 + i * 4.4},${84 + i * 3} ${148 + i * 2},${50 + i * 4.4} 200,${50 + i * 4.4} C${252 - i * 2},${50 + i * 4.4} ${296 - i * 4.4},${84 + i * 3} ${288 - i * 4.4},172" fill="none" stroke="${shade(col, .3)}" stroke-width="4.8"/>`).join('') +
          twinkle(242, 92, 6, '#f6c84a') + twinkle(266, 128, 4.6, '#f6c84a') + twinkle(230, 132, 3.6, '#fff');
        const ear = `<path d="M136,74 L134,34 L166,56 Z" fill="${H.grad(c)}" stroke="${ink(c)}" stroke-width="2" stroke-linejoin="round"/><path d="M141,64 L140,44 L157,56 Z" fill="${d1}"/>`;
        under = ear + mirror(ear);
        over = [[180, 44, 9, 0], [192, 36, 9, 1], [208, 36, 9, 4], [220, 44, 9, 5]].map(([x, y, r, k]) =>
          `<circle cx="${x}" cy="${y}" r="${r}" fill="${H.grad(RAINBOW[k], 'r')}" stroke="${ink(RAINBOW[k])}" stroke-width="1.4"/>`).join('') +
          `<path d="M192,42 L200,6 L208,42 Z" fill="${H.grad(d2)}" stroke="${ink(d2)}" stroke-width="1.8" stroke-linejoin="round"/>` +
          H.line('M194,34 l12,-4 M196,24 l9,-3 M198,15 l4,-1.4', d2, 1.3, .7);
      }
      return under + `<path d="${CAP_D}" fill="${H.grad(c)}"/><g clip-path="${clip}">${inside}</g>` +
        `<path d="M136,96 Q150,64 186,52" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round" opacity=".45"/>` +
        outline(CAP_D, c) +
        // rolled rubber edge
        `<path d="${CAP_EDGE}" fill="none" stroke="${ink(c)}" stroke-width="7.6" stroke-linecap="round" stroke-linejoin="round"/>` +
        `<path d="${CAP_EDGE}" fill="none" stroke="${shade(c, .12)}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>` + over;
    },
  });

  /* =================================================================
     FEET (slot shoes): flippers and flip-flops
     ================================================================= */
  /* -------------------------------------------------------------
     Flippers: a foot pocket with a heel strap and a long blade pointing
     outwards (left drawn, right mirrored). it.frog: webbed frog feet with
     three round toes and two frog eyes on top.
     colors: [blade, pocket, strap]
     ------------------------------------------------------------- */
  DOLL.shape('swim-flipper', {
    slot: 'shoes',
    thumb: [70, 672, 260, 100],
    draw(it) {
      const [c, pk = c, st = shade(c, -.25)] = it.colors;
      const side = s => {
        const L = s === 'L', X = x => L ? x : 400 - x;
        const M = d => L ? d : d.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, (m, x, y) => F(400 - x) + ',' + y);
        let blade, extra = '';
        if (it.frog) {
          // webbed edge dips in between three round toes
          blade = M('M154,708 C132,708 110,712 94,718 Q104,728 92,740 Q104,750 100,760 C118,756 136,750 152,744 Z');
          extra = [[92, 716], [88, 741], [99, 761]].map(([x, y]) => `<circle cx="${X(x)}" cy="${y}" r="8" fill="${H.grad(shade(c, .12), 'r')}" stroke="${ink(c)}" stroke-width="2"/>`).join('');
        } else {
          blade = M('M154,708 C130,708 106,712 88,722 Q84,744 100,764 C118,758 136,750 152,744 Z');
          extra = `<path d="${M('M88,722 Q84,744 100,764')}" fill="none" stroke="#fff" stroke-width="5" opacity=".35" transform="translate(${L ? 5 : -5},0)"/>`;
        }
        // raised ribs along the blade
        const ribs = M('M150,717 Q120,718 96,730 M150,734 Q124,744 102,754');
        const foot = G.footPath(s, 5, 2);
        const [fx, fy] = G.feet[L ? 0 : 1], o = L ? 1 : -1;
        const eyes = it.frog ? [[-6, -22], [8, -24]].map(([a, b]) => `<circle cx="${fx + a * o}" cy="${fy + b}" r="7" fill="${H.grad(pk, 'r')}" stroke="${ink(pk)}" stroke-width="1.8"/>` +
          `<circle cx="${fx + a * o}" cy="${fy + b - 1}" r="3.6" fill="#fff"/><circle cx="${fx + a * o - o}" cy="${fy + b - 1}" r="2" fill="#2b2733"/>`).join('') : '';
        return `<path d="${blade}" fill="${H.grad(c, 'h')}"/>` + extra + `<path d="${blade}" fill="url(#soft-v)"/>` +
          `<path d="${ribs}" fill="none" stroke="${shade(c, -.2)}" stroke-width="4" stroke-linecap="round"/><path d="${ribs}" fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity=".6" transform="translate(0,-1.4)"/>` +
          `<path d="${blade}" fill="none" stroke="${ink(c)}" stroke-width="${SW}" stroke-linejoin="round"/>` +
          // foot pocket with a heel strap and buckle
          `<path d="${foot}" fill="${H.grad(pk)}"/>` + outline(foot, pk, 'r') +
          `<path d="M${fx - 4 * o},${fy - 14} Q${fx + 4 * o},${fy - 4} ${fx + 18 * o},${fy - 8}" fill="none" stroke="${ink(st)}" stroke-width="7.4" stroke-linecap="round"/>` +
          `<path d="M${fx - 4 * o},${fy - 14} Q${fx + 4 * o},${fy - 4} ${fx + 18 * o},${fy - 8}" fill="none" stroke="${st}" stroke-width="4.8" stroke-linecap="round"/>` +
          `<rect x="${fx + 4 * o - 4}" y="${fy - 12}" width="8" height="8" rx="2" fill="#e6e9ee" stroke="${ink(st)}" stroke-width="1.2"/>` +
          `<path d="M${fx - 14 * o},${fy - 2} q${-4 * o},4 ${-3 * o},10" stroke="#fff" stroke-width="2.6" stroke-linecap="round" fill="none" opacity=".6"/>` + eyes;
      };
      return side('L') + side('R');
    },
  });

  /* -------------------------------------------------------------
     Flip-flops: a thick patterned sole under the bare foot, a Y-strap
     and a flower on the toe post.
     colors: [sole, sole edge, strap, flower]
     ------------------------------------------------------------- */
  DOLL.shape('swim-flipflop', {
    slot: 'shoes',
    thumb: [124, 680, 152, 74],
    draw(it) {
      const [c, edge, st, fl] = it.colors;
      const side = s => {
        const L = s === 'L', [fx, fy] = G.feet[L ? 0 : 1], o = L ? -1 : 1;
        const sole = G.footPath(s, 8, 4);
        const toes = `M${fx + o * 13},${fy + 4} q${o * 3},4 ${o * 8},5 M${fx + o * 7},${fy + 7} q${o * 2},3 ${o * 6},4`;
        const strapD = `M${fx + o * 14},${fy + 2} Q${fx + o * 12},${fy - 14} ${fx},${fy - 20} M${fx + o * 14},${fy + 2} Q${fx},${fy + 6} ${fx - o * 16},${fy + 4}`;
        return `<path d="${sole}" fill="${H.grad(edge)}" stroke="${ink(edge)}" stroke-width="2.2" transform="translate(0,5)"/>` +
          `<path d="${sole}" fill="${H.fill(it)}" stroke="${ink(c)}" stroke-width="2"/>` +
          // the bare foot on top of the sole (same drawing as the doll's foot)
          `<path d="${G.footPath(s, -2)}" fill="url(#sk-face)" stroke="${SKIN.line}" stroke-width="2.2"/>` +
          `<path d="${toes}" fill="none" stroke="${SKIN.line}" stroke-width="1.5" stroke-linecap="round" opacity=".75"/>` +
          rope(strapD, st, 4.4) + H.flower(fx + o * 14, fy + 2, 9, fl);
      };
      return side('L') + side('R');
    },
  });

  /* =================================================================
     SCUBA TANK (slot bag): twin yellow tanks on her back (back part), and in
     front black harness straps, a hose to the mouthpiece (regulator) on the
     right and a round pressure gauge on the left.
     colors: [tanks, straps, buckles + regulator]
     ================================================================= */
  DOLL.shape('swim-tank', {
    slot: 'bag',
    backZ: 12,
    thumb: [86, 146, 228, 300],
    draw(it) {
      const [c, st, acc] = it.colors;
      const tank = cx => {
        const d = `M${cx - 30},440 L${cx - 30},212 C${cx - 30},176 ${cx + 30},176 ${cx + 30},212 L${cx + 30},440 Z`;
        return `<path d="${d}" fill="${H.grad(c, 'h')}"/><path d="M${cx - 30},236 H${cx + 30} M${cx - 30},420 H${cx + 30}" stroke="${shade(c, -.25)}" stroke-width="5"/>` +
          `<path d="M${cx - 18},204 Q${cx - 16},190 ${cx - 4},184" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".55"/>` +
          `<path d="M${cx - 18},250 V400" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".35"/>` + outline(d, c, 'h') +
          // valve with a black knob
          `<rect x="${cx - 7}" y="166" width="14" height="16" rx="3" fill="${H.grad('#d9dde3', 'h')}" stroke="#7d8590" stroke-width="1.6"/>` +
          `<ellipse cx="${cx}" cy="164" rx="11" ry="6" fill="${H.grad('#3b3f4a', 'r')}" stroke="#22252c" stroke-width="1.6"/>`;
      };
      const strap = 'M168,252 C160,262 150,290 143,338 L157,342 C162,300 170,272 182,258 Z';
      const front = both(`<path d="${strap}" fill="${H.grad(st, 'h')}" stroke="${ink(st)}" stroke-width="2.2" stroke-linejoin="round"/>` +
        `<rect x="145" y="306" width="16" height="9" rx="2" transform="rotate(-80 153 310.5)" fill="${H.grad(acc)}" stroke="${ink(acc)}" stroke-width="1.3"/>`) +
        rope('M154,334 Q200,342 246,334', st, 5) + `<rect x="190" y="332" width="20" height="10" rx="3" fill="${H.grad(acc)}" stroke="${ink(acc)}" stroke-width="1.4"/>` +
        // hose over the right shoulder to the regulator, hose on the left to the gauge
        rope('M262,238 C276,268 262,312 238,352', '#3b3f4a', 6) + rope('M138,238 C122,276 132,340 146,378', '#3b3f4a', 6) +
        `<circle cx="232" cy="362" r="14" fill="${H.grad(acc, 'r')}" stroke="${ink(acc)}" stroke-width="2"/><circle cx="232" cy="362" r="7" fill="${H.grad('#3b3f4a', 'r')}"/>` +
        `<rect x="216" y="370" width="12" height="10" rx="4" fill="#3b3f4a" transform="rotate(30 222 375)"/>` +
        `<circle cx="148" cy="390" r="14" fill="${H.grad('#d9dde3', 'r')}" stroke="#5b6470" stroke-width="2"/><circle cx="148" cy="390" r="10" fill="#fff"/>` +
        `<path d="M141,390 A7,7 0 0 1 155,390" fill="none" stroke="#7fcf8a" stroke-width="3"/><path d="M148,390 L153,384" stroke="#e2464c" stroke-width="2" stroke-linecap="round"/><circle cx="148" cy="390" r="1.8" fill="#3b3f4a"/>`;
      return { back: tank(162) + tank(238), front };
    },
  });

  /* =================================================================
     THINGS TO HOLD (slot hold). Drawn in the shape's `back` part at z 40:
     above her clothes but just under her hands (z 41), so her right hand
     (centre G.hands[1] = 302,458) looks like it holds the thing.
     ================================================================= */
  /* -------------------------------------------------------------
     Beach ball: six-panel ball tipped a little, with a white pole cap.
     colors: panel colours (white is put between them)
     ------------------------------------------------------------- */
  DOLL.shape('swim-ball', {
    slot: 'hold', backZ: 40,
    thumb: [262, 430, 112, 112],
    draw(it) {
      const cx = 318, cy = 488, r = 38, cols = it.colors;
      // panels between meridians (longitude) φ seen from the front, then the ball is tilted
      const xAt = phi => r * Math.sin(phi * Math.PI / 180);
      const edges = [-90, -54, -18, 18, 54, 90], fills = [cols[0], '#ffffff', cols[1], '#ffffff', cols[2]];
      let panels = '';
      for (let i = 0; i < 5; i++) {
        const a = edges[i], b = edges[i + 1], xa = xAt(a), xb = xAt(b);
        const down = `A${F(Math.abs(xa))},${r} 0 0 ${a > 0 ? 1 : 0} ${cx},${cy + r}`;
        const up = `A${F(Math.abs(xb))},${r} 0 0 ${b > 0 ? 0 : 1} ${cx},${cy - r}`;
        panels += `<path d="M${cx},${cy - r}${Math.abs(xa) < .5 ? `L${cx},${cy + r}` : down}${Math.abs(xb) < .5 ? `L${cx},${cy - r}` : up}Z" fill="${H.grad(fills[i], 'r')}"/>`;
      }
      const seams = [-54, -18, 18, 54].map(p => { const x = xAt(p); return `M${cx},${cy - r}A${F(Math.abs(x))},${r} 0 0 ${p > 0 ? 1 : 0} ${cx},${cy + r}`; }).join('');
      const ball = `<g transform="rotate(-28 ${cx} ${cy})">${panels}<path d="${seams}" fill="none" stroke="${ink(cols[2] || cols[0])}" stroke-width="1.4" opacity=".5"/>` +
        `<ellipse cx="${cx}" cy="${cy - r + 4}" rx="9" ry="4.6" fill="#fff" stroke="${ink('#cccccc')}" stroke-width="1.2"/></g>`;
      return {
        back: `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#ffffff"/>` + ball +
          `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#soft-r)" stroke="${ink(cols[0])}" stroke-width="${SW}"/>` +
          `<path d="M${cx - 24},${cy - 14} Q${cx - 18},${cy - 28} ${cx - 4},${cy - 32}" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".7"/>`,
      };
    },
  });

  /* -------------------------------------------------------------
     Kickboard (sundbretti): foam board with a rounded top held in her hand,
     a wave stripe and a friendly whale.
     colors: [board, wave, whale]
     ------------------------------------------------------------- */
  DOLL.shape('swim-kickboard', {
    slot: 'hold', backZ: 40,
    thumb: [258, 426, 112, 150],
    draw(it) {
      const [c, wv, wh] = it.colors;
      const d = 'M282,470 C282,446 296,438 314,438 C332,438 346,446 346,470 L346,552 Q346,566 332,566 L296,566 Q282,566 282,552 Z';
      const clip = H.clip('c-' + it.id, d);
      const whale = `<path d="M296,508 C296,494 312,488 324,492 C334,494 338,500 340,506 L348,498 L346,512 L340,512 C336,522 302,524 296,508 Z" fill="${H.grad(wh)}" stroke="${ink(wh)}" stroke-width="1.6" stroke-linejoin="round"/>` +
        `<path d="M298,510 C306,518 326,518 336,512" fill="none" stroke="#fff" stroke-width="2" opacity=".8"/>` +
        `<circle cx="306" cy="502" r="1.8" fill="#2b2733"/><path d="M302,508 q3,2 6,0" stroke="#2b2733" stroke-width="1.2" fill="none" stroke-linecap="round"/>` +
        `<path d="M314,488 q-2,-8 -8,-10 M314,488 q2,-8 8,-10 M314,488 v-10" stroke="${shade(wv, .2)}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
      return {
        back: `<path d="${d}" fill="${H.grad(c, 'h')}"/><g clip-path="${clip}">` +
          `<path d="M270,540 q8,-8 16,0 t16,0 t16,0 t16,0 t16,0 V580 H270Z" fill="${H.grad(wv)}"/><path d="M270,548 q8,-8 16,0 t16,0 t16,0 t16,0 t16,0" fill="none" stroke="#fff" stroke-width="2.4" opacity=".8"/></g>` +
          whale + `<path d="M290,470 Q290,452 304,446" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".6"/>` + outline(d, c, 'h'),
      };
    },
  });

  /* -------------------------------------------------------------
     Bucket and spade: a bucket hanging from her hand by its handle, a
     starfish on the side and a spade standing in it.
     colors: [bucket, rim + handle, spade]
     ------------------------------------------------------------- */
  DOLL.shape('swim-bucket', {
    slot: 'hold', backZ: 40,
    thumb: [252, 436, 124, 140],
    draw(it) {
      const [c, rim, sp] = it.colors;
      const body = 'M276,500 L284,562 Q312,572 340,562 L348,500 Z';
      return {
        back:
          // handle up into her hand, inside of the bucket, the spade, then the bucket front
          rope('M278,502 C278,470 292,458 304,458 C316,458 344,470 346,502', rim, 3.2) +
          `<ellipse cx="312" cy="500" rx="36" ry="9" fill="${shade(c, -.35)}"/>` +
          rope('M322,500 L340,446', '#c98a3c', 4) + rope('M332,446 H348', '#c98a3c', 4) +
          `<path d="${body}" fill="${H.grad(c, 'h')}"/>` + starfish(312, 530, 12, '#f7d660') + outline(body, c, 'h') +
          `<path d="M276,500 Q312,512 348,500 L348,506 Q312,518 276,506 Z" fill="${H.grad(rim)}" stroke="${ink(rim)}" stroke-width="1.8" stroke-linejoin="round"/>` +
          `<path d="M286,512 Q288,534 292,552" stroke="#fff" stroke-width="3.4" stroke-linecap="round" fill="none" opacity=".55"/>` +
          // spade blade leaning on the rim outside the bucket
          `<path d="M346,488 l14,-12 q8,4 6,14 l-14,10 Z" fill="${H.grad(sp)}" stroke="${ink(sp)}" stroke-width="1.6" stroke-linejoin="round" transform="rotate(10 346 488)"/>`,
      };
    },
  });

  /* -------------------------------------------------------------
     Rubber duck squeezed in her hand: round yellow body, wing, orange beak,
     a little hair curl and shiny highlights.
     colors: [duck, beak]
     ------------------------------------------------------------- */
  DOLL.shape('swim-duck', {
    slot: 'hold', backZ: 40,
    thumb: [276, 420, 104, 104],
    draw(it) {
      const [c, bk] = it.colors;
      const body = 'M292,478 C292,500 306,512 330,512 C352,512 364,500 362,484 C360,474 352,470 344,470 C336,470 332,476 326,476 C314,476 304,464 296,462 C292,466 292,472 292,478 Z';
      return {
        back: `<path d="${body}" fill="${H.grad(c, 'r')}"/>` + outline(body, c, 'r') +
          `<path d="M310,484 Q324,480 334,490 Q322,500 310,484 Z" fill="${shade(c, -.12)}" stroke="${ink(c)}" stroke-width="1.4" stroke-linejoin="round"/>` +
          `<circle cx="342" cy="456" r="17" fill="${H.grad(c, 'r')}" stroke="${ink(c)}" stroke-width="${SW}"/>` +
          `<path d="M356,458 Q370,454 372,462 Q366,470 354,466 Z" fill="${H.grad(bk)}" stroke="${ink(bk)}" stroke-width="1.6" stroke-linejoin="round"/>` +
          `<circle cx="347" cy="452" r="2.8" fill="#2b2733"/><circle cx="348" cy="451" r="1" fill="#fff"/>` +
          `<ellipse cx="341" cy="462" rx="4" ry="2.6" fill="#f48ca0" opacity=".55"/>` +
          `<path d="M340,440 q-4,-8 4,-10" stroke="${ink(c)}" stroke-width="2" fill="none" stroke-linecap="round"/>` +
          `<path d="M332,448 q4,-6 10,-6 M302,490 q2,10 12,14" stroke="#fff" stroke-width="2.8" fill="none" stroke-linecap="round" opacity=".7"/>`,
      };
    },
  });

  /* =================================================================
     Catalog (all in the swimming tab)
     ================================================================= */
  DOLL.add([
    // swimwear
    { id: 'swim-mermaid', shape: 'swim-onepiece', cat: 'swim', name: { is: 'Hafmeyjusundbolur', en: 'Mermaid swimsuit' }, colors: ['#4fc7b8', '#4b8fd8', '#9a6fd8', '#ffffff'], deco: 'mermaid', neck: 'scoop', neckDepth: 18 },
    { id: 'swim-unicorn', shape: 'swim-onepiece', cat: 'swim', name: { is: 'Einhyrningasundbolur', en: 'Unicorn swimsuit' }, colors: ['#e9ddff', '#f6c84a', '#f48cc0'], pattern: 'stars', patternSize: 22, deco: 'unicorn', ruffle: '#f7b6cf', neck: 'scoop', neckDepth: 16 },
    { id: 'swim-flamingo', shape: 'swim-onepiece', cat: 'swim', name: { is: 'Flamingósundkjóll', en: 'Flamingo swim dress' }, colors: ['#7fd6cf', '#ffd1df', '#f48cae'], deco: 'flamingo', ruffle: '#ffd1df', neck: 'scoop', neckDepth: 14 },
    { id: 'swim-stripes', shape: 'swim-onepiece', cat: 'swim', name: { is: 'Röndóttur sundbolur', en: 'Striped sailor swimsuit' }, colors: ['#ffffff', '#2f4f8f', '#e2464c'], pattern: 'hstripes', patternSize: 16, deco: 'sailor', neck: 'round', neckDepth: 10 },
    { id: 'swim-fishset', shape: 'swim-fishset', cat: 'swim', name: { is: 'Fiskasundsett', en: 'Fish swim set' }, colors: ['#ffe27a', '#f0884a', '#2f6fb8', '#3fb6a8'] },
    { id: 'swim-wetsuit', shape: 'swim-wetsuit', cat: 'swim', name: { is: 'Kafarabúningur', en: 'Shorty wetsuit' }, colors: ['#2c3f73', '#3fc1c9', '#f47c5c'] },
    { id: 'swim-boardshorts', shape: 'swim-boardshorts', cat: 'swim', name: { is: 'Blómasundbuxur', en: 'Flower board shorts' }, colors: ['#3fb6d8', '#ffffff', '#f7c843'], pattern: 'dots', patternSize: 12 },
    { id: 'swim-lion-towel', shape: 'swim-towel', cat: 'swim', name: { is: 'Ljónahandklæði', en: 'Hooded lion towel' }, colors: ['#f8d36a', '#e8893a', '#f7b6a4'] },
    // swim rings
    { id: 'ring-unicorn', shape: 'swim-ring', cat: 'swim', name: { is: 'Sundhringur með einhyrningi', en: 'Unicorn swim ring' }, colors: ['#fbf7ff', '#f7c6dc', '#f6c84a'], style: 'unicorn', stripes: '5 7.5' },
    { id: 'ring-flamingo', shape: 'swim-ring', cat: 'swim', name: { is: 'Flamingósundhringur', en: 'Flamingo swim ring' }, colors: ['#f7a1c4', '#ffd1e2'], style: 'flamingo', stripes: '2 10.5' },
    { id: 'ring-donut', shape: 'swim-ring', cat: 'swim', name: { is: 'Kleinuhringur með kökuskrauti', en: 'Sprinkle donut ring' }, colors: ['#e7b37a', '#f48cc0'], style: 'donut' },
    { id: 'ring-rainbow', shape: 'swim-ring', cat: 'swim', name: { is: 'Regnbogasundhringur', en: 'Rainbow swim ring' }, colors: ['#ffffff', '#ffffff'], style: 'rainbow' },
    // arm floats
    { id: 'armfloat-orange', shape: 'swim-armband', cat: 'swim', name: { is: 'Appelsínugulir armkútar', en: 'Orange arm floats' }, colors: ['#f7882f', '#ffffff', '#ffffff'], motif: 'band' },
    { id: 'armfloat-pink', shape: 'swim-armband', cat: 'swim', name: { is: 'Bleikir armkútar með hjörtum', en: 'Pink heart arm floats' }, colors: ['#f7a6c8', '#ffffff', '#ffe27a'], motif: 'hearts' },
    { id: 'armfloat-blue', shape: 'swim-armband', cat: 'swim', name: { is: 'Bláir armkútar með stjörnum', en: 'Blue star arm floats' }, colors: ['#5fb3ea', '#ffe27a', '#ffffff'], motif: 'stars' },
    // goggles and masks
    { id: 'goggles-pink', shape: 'swim-goggles', cat: 'swim', name: { is: 'Bleik sundgleraugu', en: 'Pink heart goggles' }, colors: ['#ef5b9d', '#ffc2dc', '#f48cc0', '#f7a6c8', '#ffffff'], deco: 'heart' },
    { id: 'goggles-mint', shape: 'swim-goggles', cat: 'swim', name: { is: 'Myntugræn sundgleraugu', en: 'Mint fish goggles' }, colors: ['#3fbf9f', '#bff3e6', '#6fd0e8', '#7fdcc0', '#f7882f'], deco: 'fish' },
    { id: 'goggles-rainbow', shape: 'swim-goggles', cat: 'swim', name: { is: 'Regnbogasundgleraugu', en: 'Rainbow goggles' }, colors: ['#8a72dc', '#a58be0', '#a58be0', '#b9a6f2', '#f7d660'], deco: 'star', rainbow: true },
    { id: 'mask-blue', shape: 'swim-mask', cat: 'swim', name: { is: 'Blá köfunargríma með snorkli', en: 'Blue diving mask with snorkel' }, colors: ['#6fc6ee', '#2f6fb8', '#f6c636', '#f47c5c'] },
    { id: 'mask-pink', shape: 'swim-mask', cat: 'swim', name: { is: 'Bleik köfunargríma með snorkli', en: 'Pink diving mask with snorkel' }, colors: ['#f7a6c8', '#a58be0', '#a58be0', '#7fdcc0'] },
    // swim caps
    { id: 'cap-flowers', shape: 'swim-cap', cat: 'swim', name: { is: 'Blómasundhetta', en: 'Flower swim cap' }, colors: ['#ffffff', '#f48cc0', '#f7d660'], style: 'flowers' },
    { id: 'cap-unicorn', shape: 'swim-cap', cat: 'swim', name: { is: 'Einhyrningasundhetta', en: 'Unicorn swim cap' }, colors: ['#f6efff', '#f7b6cf', '#f6c84a'], style: 'unicorn' },
    // feet
    { id: 'flipper-blue', shape: 'swim-flipper', cat: 'swim', name: { is: 'Bláar froskalappir', en: 'Blue flippers' }, colors: ['#4fa8e8', '#2f6fb8', '#f6c636'] },
    { id: 'flipper-frog', shape: 'swim-flipper', cat: 'swim', name: { is: 'Froskafætur', en: 'Green frog flippers' }, colors: ['#7fcf5a', '#6cc04a', '#3f8f3a'], frog: true },
    { id: 'flipflop-flower', shape: 'swim-flipflop', cat: 'swim', name: { is: 'Blómasandalar', en: 'Flower flip-flops' }, colors: ['#ffd1e2', '#ef6f9c', '#7fd6cf', '#f48cc0'], pattern: 'dots', patternSize: 10 },
    // scuba tank
    { id: 'scuba-tank', shape: 'swim-tank', cat: 'swim', name: { is: 'Köfunarkútur', en: 'Scuba tank' }, colors: ['#f6c636', '#3b3f4a', '#f47c5c'] },
    // things to hold
    { id: 'beachball-rainbow', shape: 'swim-ball', cat: 'swim', name: { is: 'Strandbolti', en: 'Beach ball' }, colors: ['#ef6f6c', '#6fb3e6', '#f7d660'] },
    { id: 'kickboard-whale', shape: 'swim-kickboard', cat: 'swim', name: { is: 'Sundbretti', en: 'Kickboard' }, colors: ['#7fdcc0', '#4fa8e8', '#6f8fd8'] },
    { id: 'bucket-spade', shape: 'swim-bucket', cat: 'swim', name: { is: 'Fata og skófla', en: 'Bucket and spade' }, colors: ['#f48cc0', '#7fd6cf', '#f7d660'] },
    { id: 'duck-rubber', shape: 'swim-duck', cat: 'swim', name: { is: 'Gúmmíönd', en: 'Rubber duck' }, colors: ['#ffd84d', '#f7882f'] },
  ]);

  /* Costume looks (Búningar tab). First item = the tile icon. */
  DOLL.look([
    { id: 'look-scuba', name: { is: 'Kafari', en: 'Scuba diver' }, items: ['mask-blue', 'scuba-tank', 'swim-wetsuit', 'flipper-blue'], hair: 'ponytail' },
    { id: 'look-pool', name: { is: 'Sundferð', en: 'Pool day' }, items: ['ring-unicorn', 'swim-unicorn', 'armfloat-pink', 'goggles-pink', 'flipflop-flower'] },
  ]);
})();
