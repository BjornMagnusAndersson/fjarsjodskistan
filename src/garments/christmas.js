/* =====================================================================
   Christmas clothes (jólaföt): Santa and elf hats, reindeer antlers,
   Christmas sweaters (jólapeysur), party dresses, a Santa coat and
   trousers, boots and elf shoes, a red reindeer nose, a necklace of
   Christmas lights, bauble earrings, mittens, a candy-cane scarf,
   things to hold (candy cane, present, lantern) and Christmas pyjamas.
   Every piece is a normal item in its own chest tab, and four finished
   costumes are registered as looks for the "Búningar" tab.
   Same style as examples.js: fill → details → soft shading → tinted outline.
   Our own friendly designs only: no film characters, no logos, no text.
   Shape names start with "xm-" (Christmas).
   ===================================================================== */
(function () {
  'use strict';
  const { shade, ink } = H;
  const SW = G.stroke;

  /* ---------------------------------------------------------------
     Small helpers
     --------------------------------------------------------------- */
  // round a number to one decimal and turn it into text (keeps the SVG short)
  const n1 = v => (Math.round(v * 10) / 10).toString();
  // turn a point [x, y] into the text 'x,y' for use in SVG paths
  const P = p => n1(p[0]) + ',' + n1(p[1]);
  /** Final pass for a shape: soft shading overlay plus the tinted outline. */
  const outline = (d, base, soft = 'v', sw = SW) =>
    `<path d="${d}" fill="url(#soft-${soft})" stroke="${ink(base)}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"/>`;
  /** Mirror markup drawn on the left side over to the right side (x → 400 - x). */
  const mirror = m => `<g transform="matrix(-1,0,0,1,400,0)">${m}</g>`;
  /** Left piece plus its mirrored right piece. */
  const pair = fn => fn() + mirror(fn());
  /** A line drawn twice (ink underneath, colour on top): ribbons, cords, antlers. */
  const cord = (d, c, w) => `<path d="${d}" fill="none" stroke="${ink(c)}" stroke-width="${n1(w + 2.6)}" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  /** White highlight stroke. */
  const gloss = (d, w = 4, op = .5) => `<path d="${d}" fill="none" stroke="#fff" stroke-width="${w}" stroke-linecap="round" opacity="${op}"/>`;
  /** Point on a circle, angle in degrees. */
  const pol = (cx, cy, r, deg) => [cx + Math.cos(deg * Math.PI / 180) * r, cy + Math.sin(deg * Math.PI / 180) * r];
  /** Point on the head ellipse grown by `off` (degrees, 270 = top of the head). */
  const at = (deg, off) => {
    const { cx, cy, rx, ry } = G.head, a = deg * Math.PI / 180;
    return [cx + Math.cos(a) * (rx + off), cy + Math.sin(a) * (ry + off)];
  };
  /** Safe id fragment from colours. */
  const idOf = s => String(s).replace(/[^a-z0-9]/gi, '');
  /** n+1 points along a quadratic curve from a to b with control point c. */
  const qb = (a, c, b, n) => Array.from({ length: n + 1 }, (_, i) => { const t = i / n, u = 1 - t; return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]; });
  /** Points every `step` px along a line through pts (both ends included). */
  const resample = (pts, step) => {
    const out = [pts[0]];
    let carry = 0;
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], L = Math.hypot(x1 - x0, y1 - y0);
      let s = step - carry;
      while (s <= L) { out.push([x0 + (x1 - x0) * s / L, y0 + (y1 - y0) * s / L]); s += step; }
      carry = L - (s - step);
    }
    const last = pts[pts.length - 1], prev = out[out.length - 1];
    if (Math.hypot(last[0] - prev[0], last[1] - prev[1]) > step * .4) out.push(last);
    return out;
  };

  const FUR = '#fbf8f4';   // the soft white of Santa fur trims
  /**
   * Fluffy white fur trim along a line of points (pts): a row of round puffs
   * gives the scalloped fluffy edge, a thick stroke fills in the middle, and
   * little grey curls give it a furry texture. r = puff radius (half the trim width).
   */
  const fur = (pts, r, c = FUR) => {
    const s = resample(pts, r * 1.05);
    const line = 'M' + pts.map(P).join('L');
    return s.map(p => `<circle cx="${n1(p[0])}" cy="${n1(p[1])}" r="${r}" fill="${H.grad(c, 'r')}" stroke="${ink(c)}" stroke-width="1.5"/>`).join('') +
      `<path d="${line}" fill="none" stroke="${c}" stroke-width="${n1(2 * r - 2.6)}" stroke-linecap="round" stroke-linejoin="round"/>` +
      s.filter((_, i) => i % 2).map(([x, y]) => `<path d="M${n1(x - r * .35)},${n1(y + r * .2)} q${n1(r * .3)},${n1(-r * .45)} ${n1(r * .7)},0" fill="none" stroke="${shade(c, -.25)}" stroke-width="1.3" stroke-linecap="round" opacity=".7"/>`).join('');
  };
  /** Fur cuff round the left arm at position t (0 shoulder … 1 wrist); hw = half its width. Mirror for the right arm. */
  const furCuffL = (t, hw, r) => {
    const [x, y] = G.armPoint('L', t), [x2, y2] = G.armPoint('L', Math.min(1, t + .05));
    const l = Math.hypot(x2 - x, y2 - y), nx = (y2 - y) / l, ny = -(x2 - x) / l;   // across the arm
    return fur([[x - nx * hw, y - ny * hw], [x + nx * hw, y + ny * hw]], r);
  };

  /** Fluffy pompom: a ring of small puffs around a centre ball. */
  const pompom = (cx, cy, r, col) => {
    let s = '';
    for (let a = 0; a < 360; a += 30) { const [x, y] = pol(cx, cy, r, a); s += `<circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(r * .58)}" fill="${H.grad(col, 'r')}" stroke="${ink(col)}" stroke-width="1.6"/>`; }
    return s + `<circle cx="${cx}" cy="${cy}" r="${n1(r * .93)}" fill="${H.grad(col, 'r')}"/>` +
      `<path d="M${n1(cx - r * .5)},${n1(cy - r * .3)} q${n1(r * .3)},${n1(-r * .4)} ${n1(r * .7)},${n1(-r * .3)}" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".7"/>`;
  };
  /** Little jingle bell hanging at (x, y) with radius r: a dome, a rim, a slot and a shine. */
  const bell = (x, y, r, c = '#f2c34d') => {
    const d = `M${n1(x - r)},${n1(y + r * .55)} C${n1(x - r)},${n1(y - r * .9)} ${n1(x + r)},${n1(y - r * .9)} ${n1(x + r)},${n1(y + r * .55)} Q${n1(x + r * 1.25)},${n1(y + r * .8)} ${n1(x)},${n1(y + r * .85)} Q${n1(x - r * 1.25)},${n1(y + r * .8)} ${n1(x - r)},${n1(y + r * .55)} Z`;
    return `<circle cx="${n1(x)}" cy="${n1(y - r * .85)}" r="${n1(r * .3)}" fill="none" stroke="${ink(c)}" stroke-width="1.2"/>` +
      `<path d="${d}" fill="${H.grad(c, 'r')}" stroke="${ink(c)}" stroke-width="1.3" stroke-linejoin="round"/>` +
      `<path d="M${n1(x - r * .55)},${n1(y + r * .25)} H${n1(x + r * .55)}" stroke="${ink(c)}" stroke-width="1.1" opacity=".7"/>` +
      `<circle cx="${n1(x)}" cy="${n1(y + r * .85)}" r="${n1(r * .28)}" fill="${shade(c, -.35)}"/>` +
      `<path d="M${n1(x - r * .45)},${n1(y - r * .1)} q${n1(r * .1)},${n1(-r * .4)} ${n1(r * .4)},${n1(-r * .5)}" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".85"/>`;
  };
  /** Holly sprig at (x, y): two spiky leaves and three red berries; s = size, rot = turn in degrees. */
  const holly = (x, y, s = 1, rot = 0, leafC = '#3f9a4a', berryC = '#e0313c') => {
    const leaf = 'M0,0 Q4,-6 8,-4 Q10,-9 14,-6 Q17,-10 21,-5 Q24,-3 27,0 Q24,3 21,5 Q17,10 14,6 Q10,9 8,4 Q4,6 0,0 Z';
    // one leaf turned by a degrees, with a light middle vein
    const one = a => `<g transform="rotate(${a})"><path d="${leaf}" fill="${H.grad(leafC)}" stroke="${ink(leafC)}" stroke-width="1.3" stroke-linejoin="round"/><path d="M2,0 H23" stroke="${shade(leafC, .35)}" stroke-width="1.1"/></g>`;
    // one shiny red berry at (bx, by)
    const berry = (bx, by) => `<circle cx="${bx}" cy="${by}" r="3.6" fill="${H.grad(berryC, 'r')}" stroke="${ink(berryC)}" stroke-width="1.1"/><circle cx="${bx - 1.2}" cy="${by - 1.2}" r="1" fill="#fff" opacity=".85"/>`;
    return `<g transform="translate(${n1(x)},${n1(y)}) rotate(${rot}) scale(${s})">` + one(-160) + one(-20) + berry(-3, -2) + berry(3, -2.5) + berry(0, 3) + `</g>`;
  };
  /** Small ribbon bow at (x, y): two loops, two tails and a knot; s = size. */
  const bow = (x, y, s, c) => {
    const loop = 'M0,0 C-6,-9 -16,-10 -15,-2 C-14,5 -6,4 0,0 Z', tail = 'M-1,1 L-7,13 L-3,12 L-1,15 L2,2 Z';
    const half = `<path d="${tail}" fill="${H.grad(shade(c, -.08))}" stroke="${ink(c)}" stroke-width="1.3" stroke-linejoin="round"/><path d="${loop}" fill="${H.grad(c)}" stroke="${ink(c)}" stroke-width="1.3" stroke-linejoin="round"/>`;
    return `<g transform="translate(${n1(x)},${n1(y)}) scale(${s})">${half}<g transform="scale(-1,1)">${half}</g>` +
      `<ellipse cx="0" cy="0" rx="3.4" ry="4" fill="${H.grad(c, 'r')}" stroke="${ink(c)}" stroke-width="1.3"/></g>`;
  };
  /** Outlined five-point star. */
  const starO = (cx, cy, r, col, sw = 1.5) => {
    let d = '';
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .48 : r; d += (i ? 'L' : 'M') + n1(cx + Math.cos(a) * rr) + ',' + n1(cy + Math.sin(a) * rr); }
    return `<path d="${d}Z" fill="${H.grad(col, 'r')}" stroke="${ink(col)}" stroke-width="${sw}" stroke-linejoin="round"/>`;
  };
  /** Snowflake with little branch ticks (stroke based), with a soft darker edge. */
  const flakeO = (cx, cy, r, col, w = 2.2) => {
    let d = '';
    for (let i = 0; i < 6; i++) {
      const a = i * 60 - 90, [x, y] = pol(cx, cy, r, a), [bx, by] = pol(cx, cy, r * .55, a);
      const [t1x, t1y] = pol(bx, by, r * .32, a - 45), [t2x, t2y] = pol(bx, by, r * .32, a + 45);
      d += `M${n1(cx)},${n1(cy)}L${n1(x)},${n1(y)}M${n1(bx)},${n1(by)}L${n1(t1x)},${n1(t1y)}M${n1(bx)},${n1(by)}L${n1(t2x)},${n1(t2y)}`;
    }
    return `<path d="${d}" stroke="${ink(col)}" stroke-width="${w + 2}" stroke-linecap="round" fill="none" opacity=".45"/>` +
      `<path d="${d}" stroke="${col}" stroke-width="${w}" stroke-linecap="round" fill="none"/>`;
  };

  /** Tartan (plaid) fill: base colour, wide crossing bands and thin lines. Shared by items with the same colours. */
  const tartan = (c1, c2, c3, size = 36) => {
    const id = 'xm-tartan-' + idOf(c1) + idOf(c2) + idOf(c3) + size, u = size / 36;
    return H.def(id, `<pattern id="${id}" width="${size}" height="${size}" patternUnits="userSpaceOnUse">` +
      `<rect width="${size}" height="${size}" fill="${c1}"/>` +
      `<rect y="${12 * u}" width="${size}" height="${12 * u}" fill="${c2}" opacity=".55"/><rect x="${12 * u}" width="${12 * u}" height="${size}" fill="${c2}" opacity=".55"/>` +
      `<rect y="${17 * u}" width="${size}" height="${2 * u}" fill="${c3}" opacity=".85"/><rect x="${17 * u}" width="${2 * u}" height="${size}" fill="${c3}" opacity=".85"/>` +
      `<rect y="${31 * u}" width="${size}" height="${1.5 * u}" fill="${shade(c1, -.4)}" opacity=".5"/><rect x="${31 * u}" width="${1.5 * u}" height="${size}" fill="${shade(c1, -.4)}" opacity=".5"/>` +
      `</pattern>`);
  };
  /** Candy-cane fill: diagonal stripes of two colours. Shared by items with the same colours. */
  const candy = (c1, c2, size = 16) => {
    const id = 'xm-candy-' + idOf(c1) + idOf(c2) + size;
    return H.def(id, `<pattern id="${id}" width="${size}" height="${size}" patternUnits="userSpaceOnUse" patternTransform="rotate(40)">` +
      `<rect width="${size}" height="${size}" fill="${c1}"/><rect width="${size * .45}" height="${size}" fill="${c2}"/></pattern>`);
  };

  /** Cute reindeer face motif centred at (cx, cy), s = size: antlers, ears, head, light muzzle, red nose, smile. */
  const reindeerFace = (cx, cy, s, furC = '#a8754a', light = '#ecd3ae', nose = '#e2363e', antler = '#e0bb7e') => {
    const ant = cord('M-8,-17 C-11,-28 -17,-34 -25,-42 M-14,-29 C-21,-30 -27,-27 -32,-22 M-19,-35 C-19,-42 -17,-47 -14,-52', antler, 3.6);
    const ear = `<g transform="rotate(-12 -21 -8)"><ellipse cx="-21" cy="-8" rx="10" ry="5" fill="${H.grad(furC)}" stroke="${ink(furC)}" stroke-width="1.6"/><ellipse cx="-22.5" cy="-8" rx="6" ry="2.4" fill="${light}"/></g>`;
    const half = ant + ear;
    return `<g transform="translate(${n1(cx)},${n1(cy)}) scale(${s})">` + half + `<g transform="scale(-1,1)">${half}</g>` +
      `<ellipse cx="0" cy="0" rx="17" ry="19" fill="${H.grad(furC, 'r')}" stroke="${ink(furC)}" stroke-width="1.8"/>` +
      `<ellipse cx="0" cy="9.5" rx="11" ry="8.5" fill="${H.grad(light, 'r')}" stroke="${ink(light)}" stroke-width="1.2"/>` +
      `<circle cx="-7" cy="-4" r="2.8" fill="#3a2a30"/><circle cx="7" cy="-4" r="2.8" fill="#3a2a30"/>` +
      `<circle cx="-6" cy="-5" r="1" fill="#fff"/><circle cx="8" cy="-5" r="1" fill="#fff"/>` +
      `<circle cx="-11" cy="5" r="2.8" fill="#f28a8c" opacity=".5"/><circle cx="11" cy="5" r="2.8" fill="#f28a8c" opacity=".5"/>` +
      `<path d="M-4,13 q4,4 8,0" fill="none" stroke="#5a3a36" stroke-width="1.6" stroke-linecap="round"/>` +
      `<circle cx="0" cy="6" r="5.5" fill="${H.grad(nose, 'r')}" stroke="${ink(nose)}" stroke-width="1.3"/>` +
      `<circle cx="-1.8" cy="4.2" r="1.6" fill="#fff" opacity=".85"/></g>`;
  };
  /** Little Christmas tree motif centred at (cx, cy), s = size: three green tiers, garland, baubles, a star and a trunk. */
  const xmasTree = (cx, cy, s, green = '#3f9a4a', star = '#f6d04d') => {
    // one tier of the tree: a triangle from its top point to a softly rounded bottom edge
    const tier = (top, bot, w) => `M0,${top} L${-w / 2},${bot} Q0,${bot + 7} ${w / 2},${bot} Z`;
    const tiers = [[-14, 32, 70], [-30, 8, 54], [-44, -14, 38]].map(([t, b, w]) =>
      `<path d="${tier(t, b, w)}" fill="${H.grad(green)}" stroke="${ink(green)}" stroke-width="1.8" stroke-linejoin="round"/>`).join('');
    const balls = [[-14, 20, '#e2363e'], [12, 24, '#f6d04d'], [-2, 4, '#5aa9ec'], [14, 0, '#e2363e'], [-12, -4, '#f6d04d'], [3, -22, '#f58bb8']]
      .map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="3.6" fill="${H.grad(c, 'r')}" stroke="${ink(c)}" stroke-width="1"/><circle cx="${x - 1.1}" cy="${y - 1.1}" r="1" fill="#fff" opacity=".85"/>`).join('');
    return `<g transform="translate(${n1(cx)},${n1(cy)}) scale(${s})">` +
      `<rect x="-6" y="34" width="12" height="11" rx="2" fill="${H.grad('#9a6a44')}" stroke="${ink('#9a6a44')}" stroke-width="1.5"/>` + tiers +
      `<path d="M-24,14 Q0,24 26,10 M-18,-8 Q0,0 20,-12" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="1 4" stroke-linecap="round"/>` +
      balls + starO(0, -46, 9, star, 1.4) + `</g>`;
  };

  /* ---------------------------------------------------------------
     Held props: the right hand (G.hands[1]) holds them.
     A prop is drawn twice: `back` sits just under the hands layer (z 40)
     so the fingers lie over the handle, and `front` (z 66) draws the same
     prop again everywhere EXCEPT inside the hand outline, so the prop is
     still on top of sleeves and coats. (Same trick as costumes_work.js.)
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
  const HAND_OUT = H.def('xm-handout', `<clipPath id="xm-handout"><path clip-rule="evenodd" d="M-100,-100H500V900H-100Z${HAND_R}"/></clipPath>`);
  /** Split a prop into back (under the fingers) and front (over everything but the hand). extra = front-only bits. */
  const held = (m, extra = '') => ({ back: m, front: `<g clip-path="${HAND_OUT}">${m}</g>` + extra });

  /* =================================================================
     HATS (slot hat, cat hat)
     Hats cover the top of the hair (hair top ≈ 58, outer width ≈ 106–294)
     and come down to ≈ y 120–135 at the sides.
     ================================================================= */

  /* -------------------------------------------------------------
     Santa hat (jólasveinahúfa): soft hat whose top flops over to the
     right side of the head, a thick fluffy fur band and a fur pompom
     hanging at the tip.
     colors: [hat, fur, pompom]
     ------------------------------------------------------------- */
  DOLL.shape('xm-santahat', {
    slot: 'hat',
    thumb: [80, 4, 270, 192],
    draw(it) {
      const [c, furC = FUR, pom = furC] = it.colors;
      const body = 'M110,118 C100,58 140,20 196,16 C252,12 292,40 308,86 C318,114 324,140 327,166 C314,152 302,130 290,112 Z';
      // the soft fold where the top flops over
      const fold = 'M236,28 C272,44 292,78 298,114';
      return `<path d="${body}" fill="${H.grad(c)}"/>` +
        `<path d="M254,34 C286,54 304,100 312,142 C304,110 290,82 272,60 Z" fill="${shade(c, -.18)}" opacity=".5"/>` +
        H.line(fold, c, 2, .5) + H.line('M150,58 Q164,74 166,98', c, 1.6, .35) +
        gloss('M130,82 Q140,54 172,42', 5, .4) + outline(body, c) +
        // thick fur band round the head, then the pompom on the tip
        fur(qb([106, 120], [200, 100], [294, 120], 12), 14, furC) +
        pompom(327, 170, 14, pom);
    },
  });

  /* -------------------------------------------------------------
     Elf hat (álfahúfa): tall striped cone leaning to the left, a cuff
     with felt points round the forehead and a little bell on the tip.
     colors: [hat, stripes, cuff, bell]
     ------------------------------------------------------------- */
  DOLL.shape('xm-elfhat', {
    slot: 'hat',
    thumb: [84, -4, 232, 160],
    draw(it) {
      const [c, stripe, cuffC, bellC = '#f2c34d'] = it.colors;
      const cone = 'M110,114 C110,76 116,42 124,14 C170,30 262,54 290,114 Z';
      const clip = H.clip('c-' + it.id, cone);
      // stripes across the cone (perpendicular to its lean)
      let stripes = '';
      for (let k = 0; k < 7; k++) stripes += `<rect x="-100" y="${96 - k * 26}" width="600" height="13" fill="${stripe}"/>`;
      // cuff: top edge curved, bottom edge cut into felt points
      const yb = x => 112 + 9 * Math.pow((x - 200) / 96, 2);
      let cuff = 'M104,104 Q200,84 296,104 L296,' + n1(yb(296));
      const N = 9, w = 192 / N;
      for (let i = 0; i < N; i++) {
        const x1 = 296 - (i + .5) * w, x2 = 296 - (i + 1) * w;
        cuff += `L${n1(x1)},${n1(yb(x1) + 15)}L${n1(x2)},${n1(yb(x2))}`;
      }
      cuff += 'Z';
      return `<path d="${cone}" fill="${H.grad(c)}"/>` +
        `<g clip-path="${clip}"><g transform="rotate(-37 200 114)">${stripes}</g></g>` +
        gloss('M128,90 Q130,60 136,40', 4, .4) + outline(cone, c) +
        `<path d="${cuff}" fill="${H.grad(cuffC)}"/>` +
        `<path d="M108,108 Q200,90 292,108" fill="none" stroke="${shade(cuffC, .35)}" stroke-width="2" stroke-dasharray="3 3" opacity=".8"/>` +
        outline(cuff, cuffC, 'v', 2.2) +
        // little bell hanging from the tip on a short cord
        cord('M124,15 Q118,18 115,24', bellC, 1.6) + bell(114, 32, 10, bellC);
    },
  });

  /* =================================================================
     HAIRBAND: reindeer antlers (slot hairband, cat hairband)
     ================================================================= */

  /* -------------------------------------------------------------
     Reindeer antlers on a headband. The left antler is drawn and
     mirrored for the right. it.deco = 'holly' (holly sprig) or 'bells'
     (a bow with a little bell at each antler); it.ears = soft reindeer ears.
     colors: [antlers, band, ears, bow]
     ------------------------------------------------------------- */
  DOLL.shape('xm-antlers', {
    slot: 'hairband',
    thumb: [92, 0, 216, 150],
    draw(it) {
      const [c, band, earC = '#a8754a', bowC = '#e0313c'] = it.colors;
      const [bx, by] = at(242, 2);
      // one antler on the left: a curved beam with three tines, as thick rounded strokes
      const antlerD = `M${bx},${by + 6} C${bx - 2},${by - 16} ${bx - 12},${by - 34} ${bx - 28},${by - 52} ` +
        `M${bx - 4},${by - 16} C${bx},${by - 26} ${bx + 4},${by - 34} ${bx + 6},${by - 44} ` +
        `M${bx - 13},${by - 34} C${bx - 21},${by - 36} ${bx - 29},${by - 34} ${bx - 37},${by - 28} ` +
        `M${bx - 20},${by - 43} C${bx - 19},${by - 53} ${bx - 16},${by - 60} ${bx - 11},${by - 67}`;
      const antler = cord(antlerD, c, 8) +
        `<path d="${antlerD}" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".35" transform="translate(-1.5,-1)"/>`;
      // soft ear pointing out to the side, with a lighter inside
      const [ex, ey] = at(226, 8);
      const ear = it.ears ? `<g transform="rotate(28 ${n1(ex - 10)} ${n1(ey)})"><ellipse cx="${n1(ex - 10)}" cy="${n1(ey)}" rx="18" ry="8.5" fill="${H.grad(earC)}" stroke="${ink(earC)}" stroke-width="2"/>` +
        `<ellipse cx="${n1(ex - 13)}" cy="${n1(ey)}" rx="11" ry="4" fill="${shade(earC, .55)}"/></g>` : '';
      // decoration at the bottom of the left antler
      const deco = it.deco === 'bells'
        ? bell(bx - 6, by + 14, 6.5) + bow(bx + 2, by + 4, .75, bowC)
        : holly(bx + 12, by + 2, .85, -10);
      const arc = G.headArc(197, 343, 3, 30), mid = 'M' + arc.map(P).join('L');
      return mirror(antler + ear) + antler + ear +
        // the band itself: ink edge, fill, a highlight line
        `<path d="${mid}" fill="none" stroke="${ink(band)}" stroke-width="11.6" stroke-linecap="round" stroke-linejoin="round"/>` +
        `<path d="${mid}" fill="none" stroke="${H.grad(band)}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>` +
        `<path d="M${G.headArc(214, 326, 5.5, 20).map(P).join('L')}" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".45"/>` +
        deco + (it.deco === 'bells' ? mirror(deco) : '');
    },
  });

  /* =================================================================
     SWEATERS: jólapeysur (slot sweater, cat sweater)
     ================================================================= */

  /** A knitted pattern band across the sweater at y (height h): bg colour, fg motif ('tree' | 'flake' | 'heart' | 'zig'). */
  const bandRow = (y, h, bg, fg, kind) => {
    const cy = y + h / 2;
    let m = `<rect x="0" y="${y}" width="400" height="${h}" fill="${bg}"/>` +
      `<rect x="0" y="${y + 2}" width="400" height="1.8" fill="${fg}" opacity=".85"/><rect x="0" y="${y + h - 3.8}" width="400" height="1.8" fill="${fg}" opacity=".85"/>`;
    if (kind === 'zig') {
      let z = `M0,${cy + 3.5}`;
      for (let x = 0; x < 400; x += 8) z += `l4,-7l4,7`;
      return m + `<path d="${z}" fill="none" stroke="${fg}" stroke-width="2.2" stroke-linejoin="round"/>`;
    }
    for (let x = 8; x < 400; x += 16) {
      if (kind === 'tree') m += `<path d="M${x},${n1(cy - 5.5)} l5,9 h-10 Z" fill="${fg}"/>`;
      else if (kind === 'heart') m += H.heart(x, cy, 4.2, fg);
      else m += H.flake(x, cy, 4.6, fg);
    }
    return m;
  };

  /* -------------------------------------------------------------
     Christmas sweater (jólapeysa): knitted look, ribbed cuffs, hem and
     neck, a knitted pattern band across the chest and above the hem,
     bands on the sleeves and a big motif on the front.
     it.motif = 'reindeer' | 'tree' | 'snow' (snowflakes and stars) |
                'fawn' (brown reindeer-costume sweater with a cream tummy and a bell collar)
     it.band = band motif ('tree' | 'flake' | 'heart' | 'zig')
     colors: [knit, band background, band motif, motif colour, accent]
     ------------------------------------------------------------- */
  DOLL.shape('xm-jolapeysa', {
    slot: 'sweater',
    draw(it) {
      const [c, bandBg, bandFg = '#ffffff', mot = '#ffffff', acc = '#f6d04d'] = it.colors;
      const d = G.shirtPath({ sleeve: 1, pad: 8, sleevePad: 5, bottom: 456, neck: 'round', neckDepth: 6 });
      const clip = H.clip('c-' + it.id, d);
      const rib = shade(c, -.18);
      const fawn = it.motif === 'fawn';
      // ribbed cuff (darker, with rib lines) at the wrist of the given side
      const cuff = side => `<path d="${G.armPath(side, .9, 1.02, 7)}" fill="${H.pat('stripes', rib, shade(rib, -.15), 5)}"/>`;
      // knitted band round the sleeve of the given side
      const sband = side => `<path d="${G.armPath(side, .72, .8, 7)}" fill="${bandBg}"/>` +
        `<path d="${G.armPath(side, .745, .775, 7)}" fill="${bandFg}" opacity=".9"/>`;
      let inner = '';
      if (!fawn) inner += bandRow(292, 26, bandBg, bandFg, it.band) + bandRow(404, 22, bandBg, bandFg, it.band) + sband('L') + sband('R');
      else inner += `<ellipse cx="200" cy="384" rx="38" ry="58" fill="${H.pat('knit', mot, shade(mot, -.2), 10)}"/>` +
        `<ellipse cx="200" cy="384" rx="38" ry="58" fill="none" stroke="${ink(mot)}" stroke-width="1.6" stroke-dasharray="3 3" opacity=".5"/>` +
        // little light spots like a young deer
        [[156, 330], [244, 340], [150, 368], [250, 380], [160, 414], [240, 420]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.4" fill="${mot}" opacity=".85"/>`).join('');
      inner += `<rect x="0" y="438" width="400" height="24" fill="${H.pat('stripes', rib, shade(rib, -.15), 5)}"/>` + cuff('L') + cuff('R');
      let motif = '';
      if (it.motif === 'reindeer') motif = reindeerFace(200, 362, 1.25);
      else if (it.motif === 'tree') motif = xmasTree(200, 356, .95);
      else if (it.motif === 'snow') {
        motif = [[178, 350, 15], [228, 376, 12], [164, 392, 8], [244, 340, 8], [206, 392, 7]].map(([x, y, r]) => flakeO(x, y, r, mot, 2.6)).join('') +
          [[210, 336, 7], [150, 344, 5], [250, 400, 5.5], [186, 382, 4.5]].map(([x, y, r]) => starO(x, y, r, acc, 1.2)).join('');
      } else if (fawn) {
        // red ribbon collar with a jingle bell
        motif = cord('M180,262 Q200,276 220,262', it.colors[4] || '#e0313c', 5) + bell(200, 282, 9);
      }
      return `<path d="${d}" fill="${H.pat('knit', c, shade(c, -.25), 10)}"/>` +
        `<g clip-path="${clip}">${inner}</g>` +
        H.line('M151,322 q7,12 4,26 M249,322 q-7,12 -4,26', c, 1.8, .4) +
        outline(d, c) +
        // ribbed crew neck
        `<path d="M184,252 Q200,268 216,252" fill="none" stroke="${ink(rib)}" stroke-width="10.4" stroke-linecap="round"/>` +
        `<path d="M184,252 Q200,268 216,252" fill="none" stroke="${rib}" stroke-width="8" stroke-linecap="round"/>` +
        motif;
    },
  });

  /* =================================================================
     DRESSES (slot dress, cat frock)
     ================================================================= */

  /* -------------------------------------------------------------
     Christmas dress (jólakjóll): fitted bodice, A-line skirt to the knee.
     it.style = 'velvet': red velvet with long sleeves, white fur at the
                 neck, cuffs and hem, a holly brooch and a gold waist ribbon.
                colors: [velvet, fur, gold]
     it.style = 'tartan': plaid with puff sleeves, a white round collar,
                 a sash with a big bow and a ribbon near the hem.
                colors: [tartan base, tartan band, tartan line, sash]
     ------------------------------------------------------------- */
  DOLL.shape('xm-frock', {
    slot: 'dress', occupies: ['dress', 'top', 'bottom'],
    thumb: [56, 236, 288, 384],
    draw(it) {
      const velvet = it.style !== 'tartan';
      const [c, c2, c3, sash = '#d23a40'] = it.colors;
      const fill = velvet ? H.grad(c) : tartan(c, c2, c3);
      const hemY = 588, hx = 102, xw = 142, top = 404;
      const skirt = `M${xw},${top} C${xw - 8},440 ${hx + 10},${hemY - 70} ${hx},${hemY} Q200,${hemY + 14} ${400 - hx},${hemY} C${400 - hx - 10},${hemY - 70} ${400 - xw + 8},440 ${400 - xw},${top} Z`;
      const sclip = H.clip('c-' + it.id + '-sk', skirt);
      const sleeves = G.shirtPath(velvet ? { sleeve: 1, pad: 3, sleevePad: 4, bottom: 380, neck: 'round' } : { sleeve: .3, pad: 3, sleevePad: 9, sleeveFlare: 2, bottom: 380, neck: 'round' });
      const bodice = G.shirtPath({ sleeve: 0, pad: 2, bottom: 412, neck: 'round' });
      const line = velvet ? c : shade(c, -.1);
      // gathered folds falling from the waist
      const folds = 'M168,420 Q160,500 148,576 M188,424 Q186,500 180,584 M212,424 Q214,500 220,584 M232,420 Q240,500 252,576';
      // velvet sheen: soft light bands down the skirt
      const sheen = `<path d="M150,410 Q132,500 116,586 L134,590 Q148,500 162,412 Z M206,410 Q206,500 204,594 L216,594 Q216,500 214,410 Z" fill="#fff" opacity=".14"/>`;
      let out = `<path d="${skirt}" fill="${fill}"/><g clip-path="${sclip}">${velvet ? sheen : `<rect x="0" y="${hemY - 30}" width="400" height="8" fill="${sash}"/>`}</g>` +
        H.line(folds, c, 1.6, .35) + outline(skirt, line, 'h');
      if (velvet) out += fur(qb([hx - 2, hemY], [200, hemY + 14], [402 - hx, hemY], 14), 9, c2);
      // sleeves, then the bodice on top
      out += `<path d="${sleeves}" fill="${fill}"/>` + outline(sleeves, line);
      if (velvet) out += pair(() => furCuffL(.93, 18, 7));
      else out += H.line('M140,286 q-6,10 -4,22 M260,286 q6,10 4,22', c, 1.4, .45);
      out += `<path d="${bodice}" fill="${fill}"/>` +
        (velvet ? `<path d="M168,268 Q160,330 164,400 L174,400 Q170,330 176,270 Z" fill="#fff" opacity=".12"/>` : '') +
        outline(bodice, line);
      if (velvet) {
        // gold ribbon at the waist, fur round the neckline, holly brooch
        out += `<path d="M${xw},404 Q200,412 ${400 - xw},404" fill="none" stroke="${ink(c3)}" stroke-width="7.6" stroke-linecap="round"/>` +
          `<path d="M${xw},404 Q200,412 ${400 - xw},404" fill="none" stroke="${c3}" stroke-width="5" stroke-linecap="round"/>` +
          fur(qb([182, 252], [200, 274], [218, 252], 6), 6.5, c2) +
          holly(200, 290, .9, 0);
      } else {
        // white round collar (left half mirrored), sash and big bow
        const collar = `<path d="M200,262 C190,262 186,256 183,251 C168,252 156,264 161,277 C168,291 193,287 200,264 Z" fill="${H.grad('#ffffff')}" stroke="${ink('#ffffff')}" stroke-width="1.8" stroke-linejoin="round"/>`;
        out += collar + mirror(collar) +
          `<path d="M${xw - 1},398 Q200,406 ${401 - xw},398 L${401 - xw},412 Q200,420 ${xw - 1},412 Z" fill="${H.grad(sash)}" stroke="${ink(sash)}" stroke-width="2" stroke-linejoin="round"/>` +
          bow(200, 408, 1.25, sash) + bell(200, 278, 6);
      }
      return out;
    },
  });

  /* =================================================================
     JACKETS AND TOPS
     ================================================================= */

  /* -------------------------------------------------------------
     Santa coat (jólasveinajakki): long red coat with fluffy white fur
     down the front, round the hem, the cuffs and the collar, and a black
     belt with a big gold buckle.
     colors: [coat, fur, belt, buckle]
     ------------------------------------------------------------- */
  DOLL.shape('xm-santacoat', {
    slot: 'jacket',
    thumb: [50, 226, 300, 296],
    draw(it) {
      const [c, furC = FUR, belt = '#2e2a33', buckle = '#f2c34d'] = it.colors;
      const bottom = 492, pad = 9, flare = 8;
      const d = G.shirtPath({ sleeve: 1, pad, sleevePad: 7, bottom, flare, neck: 'round', neckDepth: 6 });
      const clip = H.clip('c-' + it.id, d);
      const hx = G.torsoX(bottom) - pad - flare;   // left edge of the hem
      return `<path d="${d}" fill="${H.grad(c)}"/>` +
        `<g clip-path="${clip}"><rect x="0" y="390" width="400" height="18" fill="${H.grad(belt)}"/>` +
        `<path d="M0,393 H400" stroke="#fff" stroke-width="1.6" opacity=".25"/></g>` +
        H.line('M151,320 q7,12 4,26 M249,320 q-7,12 -4,26 M170,450 q4,10 2,22 M232,448 q-3,11 -1,22', c, 1.8, .45) +
        gloss('M142,298 Q132,326 134,370', 4.5, .3) +
        outline(d, c) +
        fur([[200, 262], [200, bottom]], 9, furC) +
        fur(qb([hx + 4, bottom - 2], [200, bottom + 8], [396 - hx, bottom - 2], 12), 9, furC) +
        pair(() => furCuffL(.93, 19, 8)) +
        fur(qb([180, 252], [200, 272], [220, 252], 6), 8, furC) +
        // gold buckle over the fur
        `<rect x="184" y="386" width="32" height="26" rx="4" fill="${H.grad(buckle)}" stroke="${ink(buckle)}" stroke-width="2"/>` +
        `<rect x="191" y="393" width="18" height="12" rx="2" fill="${H.grad(belt)}" stroke="${ink(buckle)}" stroke-width="1.4"/>` +
        gloss('M188,390 h10', 2, .7);
    },
  });

  /* -------------------------------------------------------------
     Elf tunic (álfakyrtill): long-sleeved tunic with a pointy hem,
     a belt with a gold buckle, red cuffs and a pointy felt collar
     with little bells on the points.
     colors: [tunic, collar / cuffs, belt, bells]
     ------------------------------------------------------------- */
  DOLL.shape('xm-elftunic', {
    slot: 'top',
    thumb: [56, 226, 288, 290],
    draw(it) {
      const [c, col = '#d23a40', belt = '#3a2e2a', bellC = '#f2c34d'] = it.colors;
      const body = G.shirtPath({ sleeve: 1, pad: 6, sleevePad: 4, bottom: 446, neck: 'round' });
      const bclip = H.clip('c-' + it.id, body);
      // pointy skirt part below the belt: from the hips down to 8 felt points
      const x0 = G.torsoX(436) - 6, x1 = 116, N = 8, w = (400 - 2 * x1) / N;
      let pd = `M${n1(x0)},430 L${x1},486`;
      for (let i = 0; i < N; i++) pd += `L${n1(x1 + (i + .5) * w)},${i % 2 ? 504 : 500}L${n1(x1 + (i + 1) * w)},486`;
      pd += `L${n1(400 - x0)},430 Z`;
      // pointy collar lying on the shoulders: teeth round the neck, back along the neckline
      let cd = '';
      for (let i = 0; i <= 10; i++) {
        const a = (172 - i * 16.4) * Math.PI / 180, tip = i % 2 === 0;
        const rx = tip ? 54 : 38, ry = tip ? 44 : 26;
        cd += (i ? 'L' : 'M') + n1(200 + Math.cos(a) * rx) + ',' + n1(250 + Math.sin(a) * ry);
      }
      cd += 'L217,251 Q200,272 183,251 Z';
      const tips = [0, 2, 4, 6, 8, 10].map(i => { const a = (172 - i * 16.4) * Math.PI / 180; return [200 + Math.cos(a) * 54, 250 + Math.sin(a) * 44]; });
      return `<path d="${pd}" fill="${H.grad(c)}"/>` + H.line('M150,488 l4,-30 M250,488 l-4,-30 M200,500 v-34', c, 1.4, .35) + outline(pd, c) +
        `<path d="${body}" fill="${H.grad(c)}"/>` +
        `<g clip-path="${bclip}"><rect x="0" y="428" width="400" height="40" fill="${H.grad(belt)}"/>` +
        `<path d="${G.armPath('L', .9, 1.02, 6)}${G.armPath('R', .9, 1.02, 6)}" fill="${H.grad(col)}"/></g>` +
        H.line('M151,322 q7,12 4,26 M249,322 q-7,12 -4,26', c, 1.8, .4) + outline(body, c) +
        `<rect x="186" y="428" width="28" height="22" rx="4" fill="${H.grad(bellC)}" stroke="${ink(bellC)}" stroke-width="2"/>` +
        `<rect x="192" y="434" width="16" height="10" rx="2" fill="${belt}" stroke="${ink(bellC)}" stroke-width="1.2"/>` +
        `<path d="${cd}" fill="${H.grad(col)}"/>` + outline(cd, col, 'v', 2.2) +
        tips.filter((_, i) => i > 0 && i < 5).map(([x, y]) => bell(x, y + 5, 5.5, bellC)).join('');
    },
  });

  /* =================================================================
     TROUSERS (slot bottom, cat pants)
     ================================================================= */

  /* -------------------------------------------------------------
     Santa trousers: roomy trousers with an elastic waist and fluffy
     fur cuffs at the ankles (tuck them into the boots, or not).
     colors: [trousers, fur cuffs]
     ------------------------------------------------------------- */
  DOLL.shape('xm-pants', {
    slot: 'bottom',
    draw(it) {
      const [c, furC = FUR] = it.colors;
      const pad = 6, flare = 5, bottom = 690;
      const d = G.pantsPath({ top: 398, bottom, pad, flare });
      const clip = H.clip('c-' + it.id, d);
      const xo = G.legOutX(bottom) - pad - flare, xi = G.legInX(bottom) + pad + flare * .6;
      // elastic waistband with little gathers
      const gathers = Array.from({ length: 24 }, (_, i) => `M${140 + i * 5},400 v12`).join('');
      return `<path d="${d}" fill="${H.grad(c)}"/>` +
        `<g clip-path="${clip}"><rect x="0" y="398" width="400" height="15" fill="${shade(c, -.08)}"/>` +
        `<path d="${gathers}" stroke="${ink(c)}" stroke-width="1.2" opacity=".35"/>` +
        `<ellipse cx="170" cy="580" rx="14" ry="30" fill="#fff" opacity=".1"/><ellipse cx="230" cy="580" rx="14" ry="30" fill="#fff" opacity=".1"/></g>` +
        H.line('M190,472 l-10,9 M210,472 l10,9 M156,570 q12,6 26,0 M218,570 q12,6 26,0 M170,500 q-4,30 -2,60 M230,500 q4,30 2,60', c, 1.6, .4) +
        outline(d, c, 'h') +
        // fur cuffs kept inside the trouser leg, so they hide neatly inside boots
        pair(() => fur([[xo + 9, bottom - 5], [xi - 9, bottom - 5]], 7.5, furC));
    },
  });

  /* =================================================================
     SHOES (slot shoes)
     ================================================================= */
  /** x of the left boot shaft's outer / inner edge at height y (pad = looseness, flare = extra width at the bottom). */
  const shaftX = (top, low, pad, flare, y, inner) => {
    const k = (y - top) / (low - top);
    return inner ? G.legInX(y) + pad + flare * k * .6 : G.legOutX(y) - pad - flare * k;
  };

  /* -------------------------------------------------------------
     Boots with a fluffy fur cuff (Santa boots): glossy shaft, a sole,
     and white fur round the top.
     colors: [boot, fur, sole]
     ------------------------------------------------------------- */
  DOLL.shape('xm-boots', {
    slot: 'shoes',
    thumb: [116, 600, 168, 156],
    draw(it) {
      const [c, furC = FUR, soleC = shade(c, -.35)] = it.colors;
      const top = 632, low = 716, pad = 8, flare = 4;
      // one boot (left side; the right one is mirrored)
      const one = () => {
        const outer = [], inner = [];
        for (let y = top; y <= low + .1; y += (low - top) / 6) {
          outer.push([shaftX(top, low, pad, flare, y, false), y]);
          inner.push([shaftX(top, low, pad, flare, y, true), y]);
        }
        const sh = H.polyPath(outer.concat(inner.slice().reverse()));
        const edges = 'M' + outer.map(P).join('L') + 'M' + inner.map(P).join('L');
        const foot = G.footPath('L', 6, 3);
        const [fx, fy] = G.feet[0];
        return `<path d="${foot}" fill="${H.grad(c)}"/>` +
          `<g clip-path="${H.clip('c-' + it.id + '-sole', foot)}"><rect x="${fx - 60}" y="${fy + 9}" width="120" height="30" fill="${soleC}"/></g>` + outline(foot, c, 'r') +
          `<path d="${sh}" fill="${H.grad(c, 'h')}"/><path d="${sh}" fill="url(#soft-h)"/>` +
          `<path d="${edges}" fill="none" stroke="${ink(c)}" stroke-width="${SW}" stroke-linecap="round"/>` +
          gloss('M157,654 Q155,676 158,698', 4, .45) + gloss(`M${fx - 18},${fy - 6} q-3,5 -2,10`, 3, .6) +
          fur([[outer[0][0] + 5, top + 2], [inner[0][0] - 9, top + 2]], 10, furC);
      };
      return pair(one);
    },
  });

  /* -------------------------------------------------------------
     Elf shoes (álfaskór): soft felt shoes whose toes curl up into a
     point with a little bell, and a pointy cuff round the ankle.
     colors: [shoe, cuff, bell]
     ------------------------------------------------------------- */
  DOLL.shape('xm-elfshoes', {
    slot: 'shoes',
    thumb: [96, 646, 208, 104],
    draw(it) {
      const [c, cuffC = '#d23a40', bellC = '#f2c34d'] = it.colors;
      const [fx, fy] = G.feet[0];
      // the curled toe: a tapering band along a curve that rolls up and back, built from both edges
      const curve = [...Array.from({ length: 13 }, (_, i) => { const t = i / 12, u = 1 - t;
        return [u * u * u * 152 + 3 * u * u * t * 128 + 3 * u * t * t * 108 + t * t * t * 110, u * u * u * 728 + 3 * u * u * t * 732 + 3 * u * t * t * 716 + t * t * t * 696]; }),
        ...Array.from({ length: 6 }, (_, i) => { const t = (i + 1) / 6, u = 1 - t;
          return [u * u * u * 110 + 3 * u * u * t * 111 + 3 * u * t * t * 124 + t * t * t * 122, u * u * u * 696 + 3 * u * u * t * 684 + 3 * u * t * t * 686 + t * t * t * 696]; })];
      const L = [], R = [];
      curve.forEach((p, i) => {
        const q = curve[Math.min(curve.length - 1, i + 1)], o = curve[Math.max(0, i - 1)];
        const dx = q[0] - o[0], dy = q[1] - o[1], l = Math.hypot(dx, dy) || 1, w = 11 * (1 - i / curve.length) + 1.6;
        L.push([p[0] - dy / l * w, p[1] + dx / l * w]); R.push([p[0] + dy / l * w, p[1] - dx / l * w]);
      });
      const toe = H.polyPath(L.concat(R.reverse()));
      const end = curve[curve.length - 1];
      // pointy felt cuff round the ankle
      let cuff = 'M152,700 Q170,694 188,700';
      for (let i = 0; i < 5; i++) { const x = 188 - (i + .5) * 7.2; cuff += `L${n1(x)},${i % 2 ? 712 : 714}L${n1(188 - (i + 1) * 7.2)},703`; }
      cuff += 'Z';
      // one shoe (left side; the right one is mirrored)
      const one = () => {
        const foot = G.footPath('L', 4, 2);
        return `<path d="${toe}" fill="${H.grad(c)}"/>` + outline(toe, c, 'v', 2.2) +
          `<path d="${foot}" fill="${H.grad(c)}"/>` +
          `<g clip-path="${H.clip('c-' + it.id + '-sole', foot)}"><rect x="${fx - 60}" y="${fy + 10}" width="120" height="30" fill="${shade(c, -.3)}"/></g>` +
          outline(foot, c, 'r') +
          H.line(`M${fx - 4},${fy - 14} q-6,10 -4,22`, c, 1.4, .4) +
          gloss(`M${fx - 14},${fy - 4} q-3,4 -2,9`, 2.6, .6) +
          `<path d="${cuff}" fill="${H.grad(cuffC)}"/>` + outline(cuff, cuffC, 'v', 2) +
          bell(end[0] - 1, end[1] + 6, 5.5, bellC);
      };
      return pair(one);
    },
  });

  /* =================================================================
     FACE: red reindeer nose (slot face, cat face)
     ================================================================= */

  /* -------------------------------------------------------------
     Red reindeer nose: a round shiny red nose over her own nose with a
     soft glow round it.
     colors: [nose]
     ------------------------------------------------------------- */
  DOLL.shape('xm-nose', {
    slot: 'face',
    thumb: [164, 150, 72, 66],
    draw(it) {
      const [c] = it.colors;
      return `<circle cx="200" cy="183" r="17" fill="${c}" opacity=".18"/>` +
        `<circle cx="200" cy="183" r="11.5" fill="${H.grad(c, 'r')}" stroke="${ink(c)}" stroke-width="2"/>` +
        `<ellipse cx="196" cy="178.5" rx="4.2" ry="2.8" fill="#fff" opacity=".85"/>` +
        `<circle cx="205" cy="188" r="1.4" fill="#fff" opacity=".5"/>`;
    },
  });

  /* =================================================================
     NECKLACE: Christmas lights (slot necklace, cat necklace)
     ================================================================= */
  // the wire follows a U round the base of the neck (like the necklaces in heads.js, a little wider)
  const NA = [178, 248], NC1 = [176, 300], NC2 = [224, 300], NB = [222, 248];
  /** Point and direction on the necklace curve at t (0..1). */
  const neckAt = t => {
    const u = 1 - t, a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
    const x = a * NA[0] + b * NC1[0] + c * NC2[0] + d * NB[0], y = a * NA[1] + b * NC1[1] + c * NC2[1] + d * NB[1];
    const dx = 3 * u * u * (NC1[0] - NA[0]) + 6 * u * t * (NC2[0] - NC1[0]) + 3 * t * t * (NB[0] - NC2[0]);
    const dy = 3 * u * u * (NC1[1] - NA[1]) + 6 * u * t * (NC2[1] - NC1[1]) + 3 * t * t * (NB[1] - NC2[1]);
    return { x, y, dx, dy };
  };

  /* -------------------------------------------------------------
     Christmas lights necklace: a dark green wire round the neck with
     little glowing bulbs in many colours, pointing outwards.
     colors: [wire, bulb colours...]
     ------------------------------------------------------------- */
  DOLL.shape('xm-lights', {
    slot: 'necklace',
    thumb: [150, 232, 100, 92],
    draw(it) {
      const [wire, ...bulbs] = it.colors;
      const cols = bulbs.length ? bulbs : ['#ef4a4f', '#f6c63d', '#4cbf6a', '#4aa8e8', '#f27ab6'];
      const wd = `M${NA.join(',')} C${NC1.join(',')} ${NC2.join(',')} ${NB.join(',')}`;
      let g = cord(wd, wire, 2.4) + `<path d="${wd}" fill="none" stroke="${shade(wire, .35)}" stroke-width="1" stroke-dasharray="2 4" opacity=".7"/>`;
      const n = 9;
      for (let i = 0; i < n; i++) {
        const { x, y, dx, dy } = neckAt(.08 + .84 * i / (n - 1));
        // the bulb points away from the neck: normal of the curve, turned to face outwards/down
        let nx = dy, ny = -dx; if (ny < 0 || (Math.abs(ny) < .01 && nx * (x - 200) < 0)) { nx = -nx; ny = -ny; }
        const ang = Math.atan2(ny, nx) * 180 / Math.PI - 90, col = cols[i % cols.length];
        g += `<g transform="translate(${n1(x)},${n1(y)}) rotate(${n1(ang)})">` +
          `<circle cx="0" cy="11" r="9" fill="${col}" opacity=".22"/>` +
          `<rect x="-2.8" y="-1" width="5.6" height="5.4" rx="1.2" fill="${H.grad(wire)}" stroke="${ink(wire)}" stroke-width="1"/>` +
          `<path d="M-3.6,4.2 C-5,9 -3.6,15 0,17 C3.6,15 5,9 3.6,4.2 Z" fill="${H.grad(col, 'r')}" stroke="${ink(col)}" stroke-width="1.1"/>` +
          `<path d="M-1.6,7 q-.6,3 .2,6" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".85"/></g>`;
      }
      return g;
    },
  });

  /* =================================================================
     EARRINGS: Christmas baubles (slot earrings, cat earrings)
     ================================================================= */

  /* -------------------------------------------------------------
     Bauble earrings: a little Christmas-tree bauble on a gold hook,
     with a gold cap, a white band and a shine. The left and right
     baubles can have different colours.
     colors: [left bauble, right bauble, cap, band]
     ------------------------------------------------------------- */
  DOLL.shape('xm-bauble', {
    slot: 'earrings',
    thumb: [105, 162, 44, 50],
    draw(it) {
      const [cl, cr = cl, cap = '#f2c34d', band = '#ffffff'] = it.colors;
      const [x, y] = G.earlobes[0];
      // one bauble hanging from the left earlobe, in colour c (the right one is mirrored)
      const one = c => {
        const clip = H.clip('c-' + it.id + '-' + idOf(c), `M${x - 8},${y + 18}a8,8 0 1 0 16,0a8,8 0 1 0 -16,0Z`);
        return `<path d="M${x},${y - 1} V${y + 7}" stroke="${ink(cap)}" stroke-width="2.8" stroke-linecap="round"/><path d="M${x},${y - 1} V${y + 7}" stroke="${cap}" stroke-width="1.4" stroke-linecap="round"/>` +
          `<circle cx="${x}" cy="${y}" r="2.4" fill="${H.grad(cap, 'r')}" stroke="${ink(cap)}" stroke-width="1"/>` +
          `<circle cx="${x}" cy="${y + 18}" r="8" fill="${H.grad(c, 'r')}"/>` +
          `<g clip-path="${clip}"><path d="M${x - 9},${y + 18} q9,4 18,0" stroke="${band}" stroke-width="2.6" fill="none"/>` +
          `<path d="M${x - 9},${y + 22.5} q9,4 18,0" stroke="${band}" stroke-width="1.2" fill="none" stroke-dasharray="1.4 2"/></g>` +
          `<circle cx="${x}" cy="${y + 18}" r="8" fill="none" stroke="${ink(c)}" stroke-width="1.4"/>` +
          `<rect x="${x - 3.2}" y="${y + 7}" width="6.4" height="4.6" rx="1.2" fill="${H.grad(cap)}" stroke="${ink(cap)}" stroke-width="1"/>` +
          `<circle cx="${x - 3}" cy="${y + 15}" r="1.9" fill="#fff" opacity=".9"/>`;
      };
      return one(cl) + mirror(one(cr));
    },
  });

  /* =================================================================
     MITTENS (slot mittens, cat mittens)
     Drawn in the doll's hand space (like feet.js): wrist at (0,0),
     fingers pointing down, body side = +x; the right one is mirrored.
     ================================================================= */
  // mitten outline with the thumb (same as feet.js), the thumb fold, and the cuff band
  const MITT = 'M-15.5,-3 C-17.5,9 -18.5,22 -16.5,32 C-14.5,42 -6,47.5 1,47 C8.5,46.5 13.5,41 13.8,32.5 ' +
    'C14,30 14,28.5 14.2,27.5 C16,30.5 19.5,32 22,30.5 C24.8,28.8 25,24 23.4,18.5 C21.6,12 18.5,6 16.4,-3 Z';
  const MITT_FOLD = 'M14.2,27.5 C13.8,22 14.5,16 16.5,10';
  /** Place local-space mitten markup on the left or right hand (same transform as the hand). */
  const onHand = (side, m) => {
    const [wx, wy] = G.armPoint(side, 1);
    const tilt = side === 'L' ? 8.7 : -8.7, flip = side === 'L' ? '' : ' scale(-1,1)';
    return `<g transform="translate(${n1(wx)},${n1(wy - 2)}) rotate(${tilt})${flip}">${m}</g>`;
  };

  /* -------------------------------------------------------------
     Christmas mittens: red knitted mittens with a white snowflake and
     a fluffy white fur cuff.
     colors: [mitten, cuff, snowflake]
     ------------------------------------------------------------- */
  DOLL.shape('xm-mitten', {
    slot: 'mittens',
    thumb: [58, 404, 84, 90],
    draw(it) {
      const [c, cuffC = FUR, mot = '#ffffff'] = it.colors;
      const clip = H.clip('c-' + it.id, MITT);
      const m = `<path d="${MITT}" fill="${H.pat('knit', c, shade(c, -.28), 7)}"/>` +
        `<g clip-path="${clip}">${flakeO(-1.5, 24, 10.5, mot, 2.2)}<circle cx="-1.5" cy="24" r="2" fill="${mot}"/></g>` +
        H.line(MITT_FOLD, c, 1.6, .6) + outline(MITT, c, 'h') +
        fur([[-14, -8], [14, -8]], 7.5, cuffC);
      return onHand('L', m) + onHand('R', m);
    },
  });

  /* =================================================================
     SCARF: candy-cane stripes (slot scarf, cat scarf)
     ================================================================= */
  // wrap round the neck (same shapes as the knitted scarves in feet.js): two rolls
  const WRAP = 'M171,250 C170,238 178,232 186,233 Q200,242 214,233 C222,232 230,238 229,250 C229,266 216,276 200,276 C184,276 171,266 171,250 Z';
  const WRAP2 = 'M168,262 C170,256 178,258 188,264 Q200,270 212,264 C222,258 230,256 232,262 C233,276 218,288 200,288 C182,288 167,276 168,262 Z';
  /** One hanging scarf tail from the knot (x0,y0) down to the end (x1,y1), width w, with a soft wave. */
  const tailD = (x0, y0, x1, y1, w) => {
    const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
    return `M${x0 - w / 2},${y0} Q${mx - w / 2 - 4},${my} ${x1 - w / 2},${y1} L${x1 + w / 2},${y1 + 3} Q${mx + w / 2 - 4},${my} ${x0 + w / 2},${y0} Z`;
  };

  /* -------------------------------------------------------------
     Candy-cane scarf: wound twice round the neck, two tails with
     diagonal red-and-white stripes, soft knit ribs and a fringe.
     colors: [stripe 1, stripe 2]
     ------------------------------------------------------------- */
  DOLL.shape('xm-candyscarf', {
    slot: 'scarf',
    thumb: [134, 214, 132, 222],
    draw(it) {
      const [c1, c2 = '#ffffff'] = it.colors;
      const fill = candy(c2, c1, 18);
      const T1 = [184, 268, 176, 396, 24], T2 = [202, 270, 210, 362, 22];
      // a scarf part (tail or roll) with the stripes, soft ribs and the outline
      const part = (d, k) => `<path d="${d}" fill="${fill}"/>` +
        `<g clip-path="${H.clip('c-' + it.id + '-' + k, d)}"><path d="${Array.from({ length: 30 }, (_, i) => `M${150 + i * 4},220v190`).join('')}" stroke="${ink(c1)}" stroke-width=".8" opacity=".18"/></g>` +
        outline(d, c1, 'h');
      // fringe at the end of a tail (x1, y1 = end, w = width)
      const fringe = ([, , x1, y1, w]) => {
        let d = '';
        for (let i = 0; i <= 6; i++) { const x = x1 - w / 2 + 2 + i * (w - 4) / 6, y = y1 + 1 + i * 3 / 6; d += `M${n1(x)},${n1(y)}q${i % 2 ? 1 : -1},6 0,12`; }
        return `<path d="${d}" fill="none" stroke="${ink(c1)}" stroke-width="3.6" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${c1}" stroke-width="2" stroke-linecap="round" stroke-dasharray="3 3"/>` +
          `<path d="${d}" fill="none" stroke="${c2}" stroke-width="2" stroke-linecap="round" stroke-dasharray="3 3" stroke-dashoffset="3"/>`;
      };
      const knot = 'M178,262 C180,254 196,252 200,262 C202,272 196,280 188,280 C180,280 176,272 178,262 Z';
      return part(tailD(...T2), 't2') + fringe(T2) + part(WRAP2, 'w2') + part(WRAP, 'w1') +
        part(tailD(...T1), 't1') + fringe(T1) +
        `<path d="${knot}" fill="${candy(shade(c2, -.1), shade(c1, -.12), 14)}"/>` + outline(knot, c1, 'r') + H.line('M184,262 q2,8 0,14 M192,261 q2,9 -1,16', c1, 1.4, .5);
    },
  });

  /* =================================================================
     THINGS TO HOLD (slot hold, cat hold): right hand, backZ 40 trick
     ================================================================= */

  /* -------------------------------------------------------------
     Candy cane (jólastafur): a striped stick held in the fist with the
     hook at the top, and a little green bow with holly.
     colors: [stripe, base]
     ------------------------------------------------------------- */
  DOLL.shape('xm-candycane', {
    slot: 'hold',
    backZ: 40,
    thumb: [212, 384, 170, 178],
    draw(it) {
      const [c1, c2 = '#ffffff'] = it.colors;
      const d = 'M304,552 V412 A15,15 0 0 0 274,412 V426';
      const g = `<path d="${d}" fill="none" stroke="${ink(c1)}" stroke-width="13.6" stroke-linecap="round"/>` +
        `<path d="${d}" fill="none" stroke="${candy(c2, c1, 14)}" stroke-width="11" stroke-linecap="round"/>` +
        `<path d="M300,548 V412 A11,11 0 0 0 286,401" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".6"/>` +
        holly(304, 494, .7, 0) + bow(304, 494, .8, '#3f9a4a');
      return held(g);
    },
  });

  /* -------------------------------------------------------------
     Christmas present (jólapakki): a box with a patterned paper, a lid,
     a ribbon round it and a bow; she carries it by the ribbon loop.
     colors: [paper, ribbon, paper pattern colour]; it.pattern = paper pattern
     ------------------------------------------------------------- */
  DOLL.shape('xm-present', {
    slot: 'hold',
    backZ: 40,
    thumb: [244, 428, 116, 140],
    draw(it) {
      const [paper, ribbon = '#f2c34d', pc = '#ffffff'] = it.colors;
      const pfill = it.pattern ? H.pat(it.pattern, paper, pc, 18) : H.grad(paper);
      const box = 'M272,512 h62 v46 q0,4 -4,4 h-54 q-4,0 -4,-4 Z', lid = 'M266,500 h74 q3,0 3,3 v11 q0,3 -3,3 h-74 q-3,0 -3,-3 v-11 q0,-3 3,-3 Z';
      const g = cord('M295,502 C286,474 294,452 303,451 C312,452 319,474 311,502', ribbon, 3.2) +
        `<path d="${box}" fill="${pfill}"/>` + `<rect x="296" y="512" width="14" height="50" fill="${H.grad(ribbon, 'h')}"/>` + outline(box, paper) +
        `<path d="${lid}" fill="${pfill}"/>` + `<rect x="295" y="500" width="16" height="17" fill="${H.grad(ribbon, 'h')}"/>` + outline(lid, paper) +
        gloss('M276,518 V552', 3, .4) + bow(303, 500, 1.15, ribbon);
      return held(g);
    },
  });

  /* -------------------------------------------------------------
     Christmas lantern (jólaljósker): a little lantern with a roof, a
     glass window and a candle inside whose flame glows warmly; she
     carries it by the wire handle.
     colors: [frame, metal handle, glow]
     ------------------------------------------------------------- */
  DOLL.shape('xm-lantern', {
    slot: 'hold',
    backZ: 40,
    thumb: [248, 428, 108, 140],
    draw(it) {
      const [frame, metal = '#f2c34d', glow = '#ffd76a'] = it.colors;
      const gid = 'xm-glow-' + idOf(glow);
      const halo = H.def(gid, `<radialGradient id="${gid}"><stop offset="0" stop-color="${glow}" stop-opacity=".75"/><stop offset=".55" stop-color="${glow}" stop-opacity=".25"/><stop offset="1" stop-color="${glow}" stop-opacity="0"/></radialGradient>`);
      const roof = 'M284,500 Q292,488 302,482 Q312,488 320,500 Z';
      const flame = 'M302,507 C307,514 308,521 302,524 C296,521 297,514 302,507 Z';
      const g = `<circle cx="302" cy="524" r="36" fill="${halo}"/>` +
        cord('M290,498 C289,456 315,456 314,498', metal, 2.4) +
        // glass window with the glow and the candle inside
        `<rect x="286" y="504" width="32" height="44" rx="3" fill="#fff6d6"/>` +
        `<circle cx="302" cy="520" r="16" fill="${halo}"/>` +
        `<rect x="297" y="525" width="10" height="21" rx="2" fill="${H.grad('#fbf3e4')}" stroke="${ink('#fbf3e4')}" stroke-width="1"/>` +
        `<path d="M302,525 v-2" stroke="#5a4048" stroke-width="1.2"/>` +
        `<path d="${flame}" fill="${H.grad('#f7a33a', 'r')}" stroke="#d9822a" stroke-width=".8"/>` +
        `<path d="M302,513 C304,517 304,520 302,521 C300,520 300,517 302,513 Z" fill="#fff7c2"/>` +
        `<path d="M290,508 V538" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".7"/>` +
        // frame: side posts, roof with a knob, top rim and base
        `<rect x="284" y="503" width="36" height="46" rx="3" fill="none" stroke="${ink(frame)}" stroke-width="5.6"/>` +
        `<rect x="284" y="503" width="36" height="46" rx="3" fill="none" stroke="${frame}" stroke-width="3.2"/>` +
        `<path d="${roof}" fill="${H.grad(frame)}"/>` + outline(roof, frame, 'v', 1.8) +
        `<circle cx="302" cy="481" r="3.4" fill="${H.grad(metal, 'r')}" stroke="${ink(metal)}" stroke-width="1.2"/>` +
        `<rect x="280" y="498" width="44" height="7" rx="3" fill="${H.grad(frame)}" stroke="${ink(frame)}" stroke-width="1.6"/>` +
        `<rect x="280" y="547" width="44" height="9" rx="3" fill="${H.grad(frame)}" stroke="${ink(frame)}" stroke-width="1.6"/>` +
        H.heart(302, 552, 3, metal);
      return held(g);
    },
  });

  /* =================================================================
     PYJAMAS (slot suit, cat pyjamas)
     ================================================================= */

  /* -------------------------------------------------------------
     Christmas pyjamas (jólanáttföt): long-sleeved top with a snowflake
     pattern and a big motif on a round patch, tartan trousers, ribbed
     cuffs and neckband.
     it.motif = 'reindeer' | 'tree'
     colors: [top, snowflakes, trousers, trouser band, cuffs]
     ------------------------------------------------------------- */
  DOLL.shape('xm-pyjamas', {
    slot: 'suit', occupies: ['suit', 'top', 'bottom'],
    thumb: [60, 236, 280, 480],
    draw(it) {
      const [c, flakeC = '#ffffff', tr, tr2, cuffC = '#ffffff'] = it.colors;
      const pants = G.pantsPath({ top: 400, bottom: 700, pad: 5, flare: 4 });
      const pclip = H.clip('c-' + it.id + '-p', pants);
      const top = G.shirtPath({ sleeve: 1, pad: 6, sleevePad: 4, sleeveFlare: 2, bottom: 462, flare: 6, neck: 'round' });
      const tclip = H.clip('c-' + it.id + '-t', top);
      const motif = it.motif === 'tree' ? xmasTree(200, 352, .62) : reindeerFace(200, 354, .92);
      return `<path d="${pants}" fill="${tartan(tr, tr2, '#ffffff', 30)}"/>` +
        `<g clip-path="${pclip}"><rect x="0" y="688" width="400" height="16" fill="${H.grad(cuffC)}"/></g>` +
        H.line('M190,476 l-8,10 M210,476 l8,10 M160,660 q10,6 22,0 M218,660 q10,6 22,0', tr, 1.6, .4) + outline(pants, tr, 'h') +
        `<path d="${top}" fill="${H.pat('snow', c, flakeC, 26)}"/>` +
        `<g clip-path="${tclip}"><rect x="0" y="448" width="400" height="18" fill="${H.grad(cuffC)}"/>` +
        `<path d="${G.armPath('L', .92, 1.04, 6)}${G.armPath('R', .92, 1.04, 6)}" fill="${H.grad(cuffC)}"/></g>` +
        H.line('M152,322 q8,14 4,30 M248,322 q-8,14 -4,30', c, 1.6, .4) + outline(top, c) +
        `<path d="M183,251 Q200,271 217,251" fill="none" stroke="${ink(cuffC)}" stroke-width="9.6" stroke-linecap="round"/>` +
        `<path d="M183,251 Q200,271 217,251" fill="none" stroke="${cuffC}" stroke-width="7" stroke-linecap="round"/>` +
        // round patch for the motif, with a stitched edge
        `<circle cx="200" cy="356" r="36" fill="${H.grad('#fbf6ee')}" stroke="${ink(c)}" stroke-width="2"/>` +
        `<circle cx="200" cy="356" r="31" fill="none" stroke="${c}" stroke-width="1.4" stroke-dasharray="3 3"/>` + motif;
    },
  });

  /* =================================================================
     CATALOG
     ================================================================= */
  DOLL.add([
    // --- hats ---
    { id: 'hat-xmas-santa-red', shape: 'xm-santahat', cat: 'hat', name: { is: 'Rauð jólasveinahúfa', en: 'Red Santa hat' }, colors: ['#d8343c', FUR, FUR] },
    { id: 'hat-xmas-santa-green', shape: 'xm-santahat', cat: 'hat', name: { is: 'Græn jólasveinahúfa', en: 'Green Santa hat' }, colors: ['#2f8a4a', FUR, FUR] },
    { id: 'hat-xmas-elf', shape: 'xm-elfhat', cat: 'hat', name: { is: 'Álfahúfa', en: 'Elf hat' }, colors: ['#3a9a52', '#e0393e', '#e0393e', '#f2c34d'] },

    // --- reindeer antlers ---
    { id: 'band-xmas-antlers', shape: 'xm-antlers', cat: 'hairband', deco: 'holly', ears: true, name: { is: 'Hreindýrahorn', en: 'Reindeer antlers' }, colors: ['#b98552', '#7a4e30', '#c08a5a', '#e0313c'] },
    { id: 'band-xmas-antlers-gold', shape: 'xm-antlers', cat: 'hairband', deco: 'bells', name: { is: 'Gyllt hreindýrahorn', en: 'Golden antlers' }, colors: ['#f0c24e', '#d8343c', '#a8754a', '#d8343c'] },

    // --- Christmas sweaters ---
    { id: 'sweater-xmas-reindeer', shape: 'xm-jolapeysa', cat: 'sweater', motif: 'reindeer', band: 'flake', name: { is: 'Jólapeysa með hreindýri', en: 'Reindeer Christmas sweater' }, colors: ['#d23a40', '#2f7a46', '#ffffff', '#ffffff'] },
    { id: 'sweater-xmas-snow', shape: 'xm-jolapeysa', cat: 'sweater', motif: 'snow', band: 'zig', name: { is: 'Jólapeysa með snjókornum', en: 'Snowflake Christmas sweater' }, colors: ['#3a63b8', '#ffffff', '#d23a40', '#ffffff', '#f6d04d'] },
    { id: 'sweater-xmas-tree', shape: 'xm-jolapeysa', cat: 'sweater', motif: 'tree', band: 'heart', name: { is: 'Jólapeysa með jólatré', en: 'Christmas tree sweater' }, colors: ['#f3e9d6', '#d23a40', '#ffffff', '#ffffff'] },
    { id: 'sweater-xmas-fawn', shape: 'xm-jolapeysa', cat: 'sweater', motif: 'fawn', name: { is: 'Brún hreindýrapeysa', en: 'Brown reindeer sweater' }, colors: ['#a8754a', '#a8754a', '#ffffff', '#ecd3ae', '#d8343c'] },

    // --- Christmas dresses ---
    { id: 'frock-xmas-velvet', shape: 'xm-frock', cat: 'frock', style: 'velvet', name: { is: 'Rauður flauelskjóll', en: 'Red velvet Christmas dress' }, colors: ['#c8263a', FUR, '#f2c34d'] },
    { id: 'frock-xmas-tartan', shape: 'xm-frock', cat: 'frock', style: 'tartan', name: { is: 'Köflóttur jólakjóll', en: 'Tartan Christmas dress' }, colors: ['#2f7a46', '#1f5634', '#e0393e', '#d23a40'] },

    // --- coat, tunic, trousers ---
    { id: 'jacket-xmas-santa', shape: 'xm-santacoat', cat: 'jacket', name: { is: 'Jólasveinajakki', en: 'Santa coat' }, colors: ['#d8343c', FUR, '#2e2a33', '#f2c34d'] },
    { id: 'top-xmas-elf', shape: 'xm-elftunic', cat: 'top', name: { is: 'Álfakyrtill', en: 'Elf tunic' }, colors: ['#3a9a52', '#e0393e', '#5a3a2a', '#f2c34d'] },
    { id: 'pants-xmas-santa', shape: 'xm-pants', cat: 'pants', name: { is: 'Jólasveinabuxur', en: 'Santa trousers' }, colors: ['#d8343c', FUR] },
    { id: 'pants-xmas-reindeer', shape: 'xm-pants', cat: 'pants', name: { is: 'Brúnar hreindýrabuxur', en: 'Brown reindeer trousers' }, colors: ['#8a5a38', '#ecd3ae'] },
    { id: 'leggings-xmas-stripes', shape: 'leggings', cat: 'pants', name: { is: 'Röndóttar álfabuxur', en: 'Striped elf leggings' }, colors: ['#e0393e', '#ffffff', '#c92f36'], pattern: 'hstripes', patternSize: 22 },

    // --- shoes and boots ---
    { id: 'boots-xmas-black', shape: 'xm-boots', cat: 'boots', name: { is: 'Svört jólasveinastígvél', en: 'Black Santa boots' }, colors: ['#2e2a33', FUR, '#1c1a20'] },
    { id: 'boots-xmas-brown', shape: 'xm-boots', cat: 'boots', name: { is: 'Brún hreindýrastígvél', en: 'Brown reindeer boots' }, colors: ['#6e4a32', '#ecd3ae', '#3e2a20'] },
    { id: 'shoes-xmas-elf', shape: 'xm-elfshoes', cat: 'shoes', name: { is: 'Álfaskór', en: 'Elf shoes' }, colors: ['#3a9a52', '#e0393e', '#f2c34d'] },

    // --- face, necklace, earrings ---
    { id: 'face-xmas-nose', shape: 'xm-nose', cat: 'face', name: { is: 'Rautt hreindýranef', en: 'Red reindeer nose' }, colors: ['#e2363e'] },
    { id: 'neck-xmas-lights', shape: 'xm-lights', cat: 'necklace', name: { is: 'Jólaljósahálsmen', en: 'Christmas lights necklace' }, colors: ['#2f5a3a', '#ef4a4f', '#f6c63d', '#4cbf6a', '#4aa8e8', '#f27ab6'] },
    { id: 'ear-xmas-bauble-red', shape: 'xm-bauble', cat: 'earrings', name: { is: 'Rauðir jólakúlueyrnalokkar', en: 'Red bauble earrings' }, colors: ['#e0313c', '#e0313c', '#f2c34d', '#ffffff'] },
    { id: 'ear-xmas-bauble-mix', shape: 'xm-bauble', cat: 'earrings', name: { is: 'Grænir og rauðir jólakúlueyrnalokkar', en: 'Green and red bauble earrings' }, colors: ['#2f9a52', '#e0313c', '#f2c34d', '#ffffff'] },

    // --- mittens, scarf ---
    { id: 'mittens-xmas-red', shape: 'xm-mitten', cat: 'mittens', name: { is: 'Rauðir jólavettlingar', en: 'Red Christmas mittens' }, colors: ['#d8343c', FUR, '#ffffff'] },
    { id: 'scarf-xmas-candy', shape: 'xm-candyscarf', cat: 'scarf', name: { is: 'Röndóttur jólatrefill', en: 'Candy-cane scarf' }, colors: ['#e0313c', '#ffffff'] },

    // --- things to hold ---
    { id: 'hold-xmas-candycane', shape: 'xm-candycane', cat: 'hold', name: { is: 'Jólastafur', en: 'Candy cane' }, colors: ['#e0313c', '#ffffff'] },
    { id: 'hold-xmas-present', shape: 'xm-present', cat: 'hold', pattern: 'stars', name: { is: 'Jólapakki', en: 'Christmas present' }, colors: ['#2f8a4a', '#e0313c', '#f6d04d'] },
    { id: 'hold-xmas-lantern', shape: 'xm-lantern', cat: 'hold', name: { is: 'Jólaljósker', en: 'Christmas lantern' }, colors: ['#c8323a', '#f2c34d', '#ffd76a'] },

    // --- pyjamas ---
    { id: 'pj-xmas-reindeer', shape: 'xm-pyjamas', cat: 'pyjamas', motif: 'reindeer', name: { is: 'Jólanáttföt með hreindýri', en: 'Reindeer Christmas pyjamas' }, colors: ['#d8434a', '#ffffff', '#2f7a46', '#1f5634', '#ffffff'] },
    { id: 'pj-xmas-tree', shape: 'xm-pyjamas', cat: 'pyjamas', motif: 'tree', name: { is: 'Jólanáttföt með jólatré', en: 'Christmas tree pyjamas' }, colors: ['#7fb6e6', '#ffffff', '#d8434a', '#a8262e', '#ffffff'] },
  ]);

  /* Finished Christmas costume looks (first item = the tile icon). */
  DOLL.look([
    { id: 'look-xmas-santa', name: { is: 'Jólasveinn', en: 'Santa' }, items: ['hat-xmas-santa-red', 'jacket-xmas-santa', 'pants-xmas-santa', 'boots-xmas-black', 'hold-xmas-present'] },
    { id: 'look-xmas-elf', name: { is: 'Jólaálfur', en: 'Christmas elf' }, items: ['hat-xmas-elf', 'top-xmas-elf', 'leggings-xmas-stripes', 'shoes-xmas-elf', 'hold-xmas-lantern'] },
    { id: 'look-xmas-reindeer', name: { is: 'Hreindýr', en: 'Reindeer' }, items: ['band-xmas-antlers', 'face-xmas-nose', 'sweater-xmas-fawn', 'pants-xmas-reindeer', 'boots-xmas-brown'] },
    { id: 'look-xmas-party', name: { is: 'Jólaball', en: 'Christmas party' }, items: ['frock-xmas-velvet', 'ear-xmas-bauble-red', 'neck-xmas-lights', 'shoes-glitter-gold', 'hold-xmas-candycane'] },
  ]);
})();
