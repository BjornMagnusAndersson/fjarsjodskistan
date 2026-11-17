/* =====================================================================
   Bracelets and bangles (slot bracelet, cat bracelet).
   Drawn in local "wrist space", exactly like the mittens: the wrist is
   at (0,0), the forearm goes up (negative y), the hand hangs down
   (positive y). onWrist() moves the markup to the left or right wrist
   and mirrors it for the right side, so every bracelet follows the
   arm's angle. The forearm is about 23 wide here, so a bracelet that
   goes round it is about 28 wide (BR = half width).
   Layer z 56: over sleeves and jackets, under mittens.
   ===================================================================== */
(function () {
  'use strict';
  const { shade, ink } = H;

  const BR = 14;          // half width of a bracelet round the forearm
  const Y = -6;           // bracelet centre, just above the wrist
  const SAG = 3;          // how much the front of the ring curves down (makes it look round)
  const n1 = v => (Math.round(v * 10) / 10).toString();

  /** Put local wrist-space markup on one wrist (same transform as the hand). */
  const onWrist = (side, m) => {
    const [wx, wy] = G.armPoint(side, 1);
    const tilt = side === 'L' ? 8.7 : -8.7, flip = side === 'L' ? '' : ' scale(-1,1)';
    return `<g transform="translate(${n1(wx)},${n1(wy - 2)}) rotate(${tilt})${flip}">${m}</g>`;
  };
  /** Both wrists, or just the left one in the picture (it.sides === 'L'). */
  const wear = (it, m) => onWrist('L', m) + (it.sides === 'L' ? '' : onWrist('R', m));

  /**
   * A ring round the forearm seen from the front: a band of height h centred at y,
   * curving down in the middle, with rounded ends where it turns behind the arm.
   */
  const ring = (y, h, rx = BR) => {
    const t = y - h / 2, b = y + h / 2, r = h / 2;
    return `M${-rx},${n1(t)} Q0,${n1(t + SAG * 2)} ${rx},${n1(t)} A${n1(r)},${n1(r)} 0 0 1 ${rx},${n1(b)} Q0,${n1(b + SAG * 2)} ${-rx},${n1(b)} A${n1(r)},${n1(r)} 0 0 1 ${-rx},${n1(t)} Z`;
  };
  /** Point on the front curve of a ring at x (y follows the sag). */
  const onFront = (x, y) => [x, y + SAG * (1 - (x / BR) * (x / BR))];
  /** Shine line along the upper front edge of a band. */
  const shine = (y, h, op = .7) => `<path d="M${-BR * .6},${n1(y - h * .18 + SAG * .7)} Q0,${n1(y - h * .18 + SAG * 1.7)} ${BR * .35},${n1(y - h * .18 + SAG * 1.25)}" stroke="#fff" stroke-width="${n1(Math.max(1, h * .22))}" fill="none" stroke-linecap="round" opacity="${op}"/>`;
  /** Filled band with a tinted outline. */
  const band = (y, h, fill, base, sw = 1.4) => `<path d="${ring(y, h)}" fill="${fill}" stroke="${ink(base)}" stroke-width="${sw}" stroke-linejoin="round"/>`;
  /** Round shiny bead. */
  const bead = (x, y, r, c) => `<circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(r)}" fill="${H.grad(c, 'r')}" stroke="${ink(c)}" stroke-width="1"/>` +
    `<circle cx="${n1(x - r * .35)}" cy="${n1(y - r * .35)}" r="${n1(r * .32)}" fill="#fff" opacity=".85"/>`;
  /** Little faceted gem. */
  const gem = (x, y, r, c) => `<ellipse cx="${n1(x)}" cy="${n1(y)}" rx="${n1(r)}" ry="${n1(r * .85)}" fill="${H.grad(c, 'r')}" stroke="${ink(c)}" stroke-width="1.1"/>` +
    `<path d="M${n1(x - r * .45)},${n1(y - r * .2)} l${n1(r * .3)},${n1(-r * .35)}" stroke="#fff" stroke-width="${n1(r * .3)}" stroke-linecap="round" opacity=".9"/>`;

  /* -------------------------------------------------------------
     Bangles: stacked rings (it.kind 'stack', colors = one per bangle,
     glitter adds sparkle) or one wide cuff (it.kind 'cuff',
     colors [cuff, gem, small dots], it.motif 'flakes' for snowflakes).
     ------------------------------------------------------------- */
  DOLL.shape('wrist-bangle', {
    slot: 'bracelet',
    draw(it) {
      let m = '';
      if (it.kind === 'cuff') {
        const [c, g = '#6fb3e6', dot = '#ffffff'] = it.colors;
        const h = 12;
        m = band(Y, h, it.pattern ? H.pat(it.pattern, c, it.colors[3] || '#ffffff', 8) : H.grad(c), c, 1.6) +
          // rows of tiny dots along the top and bottom edges
          [-9, -4.5, 4.5, 9].map(x => { const [px, py] = onFront(x, Y - h * .33); const [qx, qy] = onFront(x, Y + h * .33); return `<circle cx="${n1(px)}" cy="${n1(py)}" r="1.2" fill="${dot}"/><circle cx="${n1(qx)}" cy="${n1(qy)}" r="1.2" fill="${dot}"/>`; }).join('') +
          (it.motif === 'flakes' ? H.flake(-7.5, Y + 2.4, 3, '#ffffff') + H.flake(7.5, Y + 2.4, 3, '#ffffff') : '') +
          gem(0, Y + SAG, 4.6, g) + shine(Y, h, .55);
      } else {
        // stack of thin bangles, each tilted a little differently so they look loose
        const cols = it.colors, h = it.thin ? 3.2 : 4.2, gap = h + .9;
        cols.forEach((c, i) => {
          const y = Y + 5 - i * gap, tilt = (i % 2 ? 3 : -3);
          const fill = it.glitter ? H.pat('sparkle', c, shade(c, .6), 6) : H.grad(c);
          m += `<g transform="rotate(${tilt} 0 ${n1(y)})">` + band(y, h, fill, c, 1.2) + shine(y, h, .8) +
            (it.gems ? gem(0, y + SAG, h * .55, it.gems[i % it.gems.length]) : '') + `</g>`;
        });
      }
      return wear(it, m);
    },
  });

  /* -------------------------------------------------------------
     Beaded bracelet: beads along the front of the ring on a thin
     thread. colors cycle; it.heart / it.star = every third bead is a
     little heart or star; it.big = bigger beads.
     ------------------------------------------------------------- */
  DOLL.shape('wrist-beads', {
    slot: 'bracelet',
    draw(it) {
      const n = it.big ? 6 : 8, r = it.big ? 3.6 : 2.9;
      let m = `<path d="M${-BR},${Y} Q0,${Y + SAG * 2} ${BR},${Y}" stroke="#cfc6bd" stroke-width="1.2" fill="none"/>`;
      for (let i = 0; i < n; i++) {
        const x = -BR + 1.5 + i * (BR * 2 - 3) / (n - 1), [px, py] = onFront(x, Y);
        const c = it.colors[i % it.colors.length];
        const k = .75 + .25 * Math.cos(x / BR * Math.PI / 2);     // beads at the sides are seen edge-on: a bit smaller
        // pass numbers (not strings) to H.heart: it does arithmetic with them
        if (it.heart && i % 3 === 1) m += H.heart(px, py, r * 1.15 * k, it.heart) + `<circle cx="${n1(px - 1)}" cy="${n1(py - 1)}" r=".9" fill="#fff" opacity=".8"/>`;
        else if (it.star && i % 3 === 1) m += H.star(px, py, r * 1.35 * k, it.star);
        else m += bead(px, py, r * k, c);
      }
      return wear(it, m);
    },
  });

  /* -------------------------------------------------------------
     Charm bracelet: a fine chain with little charms hanging below.
     colors [chain]; it.charms: list of 'heart' | 'star' | 'moon' |
     'rainbow' | 'horn' (unicorn horn) | 'lion' | 'flower'; it.cc = charm colours.
     ------------------------------------------------------------- */
  const charm = (kind, x, y, c) => {
    const loop = `<circle cx="${n1(x)}" cy="${n1(y - 3.6)}" r="1.4" fill="none" stroke="${ink(c)}" stroke-width="1"/>`;
    switch (kind) {
      case 'heart': return loop + H.heart(x, y + .6, 3.6, c) + `<circle cx="${n1(x - 1.2)}" cy="${n1(y - .4)}" r=".9" fill="#fff" opacity=".8"/>`;
      case 'star': return loop + H.star(x, y + .6, 4.2, c);
      case 'moon': return loop + `<path d="M${n1(x + 1.5)},${n1(y - 3)} a3.8,3.8 0 1 0 0,7.6 a3,3 0 1 1 0,-7.6z" fill="${c}" stroke="${ink(c)}" stroke-width=".8"/>`;
      case 'flower': return loop + H.flower(x, y + .8, 3.8, c);
      case 'rainbow': return loop + ['#ef6f6c', '#f7d660', '#7fcf8a', '#6fb3e6'].map((col, i) =>
        `<path d="M${n1(x - 4.4 + i * 1.1)},${n1(y + 3)} a${n1(4.4 - i * 1.1)},${n1(4.4 - i * 1.1)} 0 0 1 ${n1(8.8 - i * 2.2)},0" stroke="${col}" stroke-width="1.1" fill="none"/>`).join('');
      case 'horn': return loop + `<path d="M${n1(x - 2.4)},${n1(y - 2)} L${n1(x)},${n1(y + 5.5)} L${n1(x + 2.4)},${n1(y - 2)} Z" fill="${H.grad('#f6cf55')}" stroke="#b9862a" stroke-width=".9"/>` +
        `<path d="M${n1(x - 1.6)},${n1(y)} l3.2,-.8 M${n1(x - 1)},${n1(y + 2.2)} l2,-.6" stroke="#fff3b8" stroke-width=".8"/>`;
      case 'lion': return loop + `<circle cx="${n1(x)}" cy="${n1(y + 1)}" r="4.4" fill="#ee8a2e" stroke="${ink('#ee8a2e')}" stroke-width=".9"/>` +
        `<circle cx="${n1(x)}" cy="${n1(y + 1)}" r="3" fill="#f6c45a"/><circle cx="${n1(x - 1.1)}" cy="${n1(y + .4)}" r=".55" fill="#3a2a2a"/><circle cx="${n1(x + 1.1)}" cy="${n1(y + .4)}" r=".55" fill="#3a2a2a"/>` +
        `<path d="M${n1(x - .6)},${n1(y + 1.6)} h1.2 l-.6,.7z" fill="#7a4a2a"/>`;
      default: return '';
    }
  };
  DOLL.shape('wrist-charm', {
    slot: 'bracelet',
    draw(it) {
      const metal = it.colors[0];
      let m = `<path d="M${-BR},${Y} Q0,${Y + SAG * 2} ${BR},${Y}" stroke="${ink(metal)}" stroke-width="3" fill="none" stroke-linecap="round"/>` +
        `<path d="M${-BR},${Y} Q0,${Y + SAG * 2} ${BR},${Y}" stroke="${metal}" stroke-width="1.8" fill="none" stroke-dasharray="2 1.2" stroke-linecap="round"/>`;
      const xs = it.charms.length === 2 ? [-5, 5] : [-8, 0, 8];
      it.charms.forEach((k, i) => { const [px, py] = onFront(xs[i], Y); m += charm(k, px, py + 5.5, (it.cc || [])[i] || metal); });
      return wear(it, m);
    },
  });

  /* -------------------------------------------------------------
     Woven friendship bracelet: a soft band with diagonal stripes in
     the given colours and two little tassels on the outer side.
     ------------------------------------------------------------- */
  DOLL.shape('wrist-woven', {
    slot: 'bracelet',
    draw(it) {
      const h = 6.5, d = ring(Y, h), c = it.colors[0];
      const clip = H.clip('c-' + it.id, d);
      let stripes = '';
      for (let i = -6; i < 8; i++) stripes += `<path d="M${n1(i * 4.2 - 6)},${Y + 8} l8,-16 h4.2 l-8,16z" fill="${it.colors[(i + 12) % it.colors.length]}"/>`;
      const tassel = it.colors.slice(0, 2).map((col, i) => `<path d="M${-BR + 1 + i * 2},${Y + 2} q${-2 - i},6 ${-1 - i},11" stroke="${col}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`).join('');
      return wear(it, tassel + `<g clip-path="${clip}">${stripes}</g>` +
        `<path d="${d}" fill="url(#soft-v)" stroke="${ink(c)}" stroke-width="1.3"/>` + shine(Y, h, .45));
    },
  });

  /* -------------------------------------------------------------
     Glow bracelets: thin neon rings with a soft halo that gently
     pulses (class "glow"), like the bracelets at a party.
     ------------------------------------------------------------- */
  DOLL.shape('wrist-glow', {
    slot: 'bracelet',
    draw(it) {
      const m = it.colors.map((c, i) => {
        const y = Y + 4 - i * 5, ring1 = `M${-BR},${y} Q0,${y + SAG * 2} ${BR},${y}`;
        return `<g transform="rotate(${i % 2 ? 4 : -4} 0 ${y})"><path class="glow" style="animation-delay:${-i * .8}s" d="${ring1}" stroke="${c}" stroke-width="7" fill="none" stroke-linecap="round" opacity=".35"/>` +
          `<path d="${ring1}" stroke="${c}" stroke-width="2.8" fill="none" stroke-linecap="round"/>` +
          `<path d="${ring1}" stroke="#ffffff" stroke-width="1" fill="none" stroke-linecap="round" opacity=".8"/></g>`;
      }).join('');
      return wear(it, m);
    },
  });

  /* -------------------------------------------------------------
     Toy watch: soft strap with a round face; the face is a flower
     with two little hands. colors [strap, case, face flower]. One wrist.
     ------------------------------------------------------------- */
  DOLL.shape('wrist-watch', {
    slot: 'bracelet',
    draw(it) {
      const [strap, cs = '#f2c34d', fl = '#f48cc0'] = it.colors;
      const [fx, fy] = onFront(0, Y);
      const m = band(Y, 6.5, H.grad(strap), strap) +
        [-9, -6].map(x => { const [px, py] = onFront(x, Y); return `<circle cx="${n1(px)}" cy="${n1(py)}" r=".9" fill="${shade(strap, -.35)}"/>`; }).join('') +
        `<circle cx="${n1(fx)}" cy="${n1(fy)}" r="7.4" fill="${H.grad(cs, 'r')}" stroke="${ink(cs)}" stroke-width="1.3"/>` +
        `<circle cx="${n1(fx)}" cy="${n1(fy)}" r="5.6" fill="#ffffff" stroke="${shade(cs, -.2)}" stroke-width=".8"/>` +
        H.flower(fx, fy, 5.2, shade(fl, .35)) +
        `<path d="M${n1(fx)},${n1(fy)} l0,-3.6 M${n1(fx)},${n1(fy)} l2.6,1.2" stroke="#4a3a4a" stroke-width="1" stroke-linecap="round"/>` +
        `<path d="M${n1(fx - 4)},${n1(fy - 3)} q2,-2.4 5,-2.6" stroke="#fff" stroke-width="1.2" fill="none" opacity=".9"/>`;
      return wear(it, m);
    },
  });

  /* -------------------------------------------------------------
     Flower bracelet: a green band with little daisies along the front.
     colors [petals, centre, band].
     ------------------------------------------------------------- */
  DOLL.shape('wrist-flowers', {
    slot: 'bracelet',
    draw(it) {
      const [pet, mid = '#f7d04a', bnd = '#6aa65a'] = it.colors;
      let m = `<path d="M${-BR},${Y} Q0,${Y + SAG * 2} ${BR},${Y}" stroke="${ink(bnd)}" stroke-width="3.6" fill="none" stroke-linecap="round"/>` +
        `<path d="M${-BR},${Y} Q0,${Y + SAG * 2} ${BR},${Y}" stroke="${bnd}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
      [-9.5, 0, 9.5].forEach((x, i) => {
        const [px, py] = onFront(x, Y), r = i === 1 ? 4.6 : 3.8, col = (it.colors[3] && i !== 1) ? it.colors[3] : pet;
        for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; m += `<ellipse cx="${n1(px + Math.cos(a) * r * .55)}" cy="${n1(py + Math.sin(a) * r * .55)}" rx="${n1(r * .42)}" ry="${n1(r * .3)}" transform="rotate(${k * 60} ${n1(px + Math.cos(a) * r * .55)} ${n1(py + Math.sin(a) * r * .55)})" fill="${col}" stroke="${ink(col)}" stroke-width=".5"/>`; }
        m += `<circle cx="${n1(px)}" cy="${n1(py)}" r="${n1(r * .3)}" fill="${mid}"/>`;
      });
      return wear(it, m);
    },
  });

  DOLL.add([
    // bangles and cuffs
    { id: 'bangle-gold', shape: 'wrist-bangle', cat: 'bracelet', name: { is: 'Gullarmbönd', en: 'Gold bangles' }, colors: ['#f2c34d', '#f6d36a'] },
    { id: 'bangle-rainbow', shape: 'wrist-bangle', cat: 'bracelet', name: { is: 'Regnbogaarmbönd', en: 'Rainbow bangles' }, colors: ['#ef6f6c', '#f6a65a', '#f7d660', '#7fcf8a', '#6fb3e6', '#a58be0'], thin: true },
    { id: 'bangle-glitter-pink', shape: 'wrist-bangle', cat: 'bracelet', name: { is: 'Bleik glimmerarmbönd', en: 'Pink glitter bangles' }, colors: ['#f48cc0', '#e86aa6'], glitter: true },
    { id: 'bangle-pastel', shape: 'wrist-bangle', cat: 'bracelet', name: { is: 'Pastelarmbönd', en: 'Pastel bangles' }, colors: ['#9fe0cf', '#c8b4f0', '#ffc9a8', '#ffe08a'], thin: true },
    { id: 'bangle-silver-gems', shape: 'wrist-bangle', cat: 'bracelet', name: { is: 'Silfurarmband með steinum', en: 'Silver bangle with gems' }, colors: ['#dfe4ec'], gems: ['#f48cc0'] },
    { id: 'cuff-princess', shape: 'wrist-bangle', cat: 'bracelet', kind: 'cuff', name: { is: 'Prinsessuarmband', en: 'Princess cuff' }, colors: ['#f2c34d', '#5aa9ec', '#ffffff'] },
    { id: 'cuff-ice', shape: 'wrist-bangle', cat: 'bracelet', kind: 'cuff', motif: 'flakes', name: { is: 'Ísarmband', en: 'Ice cuff' }, colors: ['#9fd6f2', '#e6f6ff', '#ffffff'] },
    // beads
    { id: 'beads-rainbow', shape: 'wrist-beads', cat: 'bracelet', name: { is: 'Regnbogaperlur', en: 'Rainbow beads' }, colors: ['#ef6f6c', '#f6a65a', '#f7d660', '#7fcf8a', '#6fb3e6', '#a58be0'] },
    { id: 'beads-pearl', shape: 'wrist-beads', cat: 'bracelet', name: { is: 'Perluarmband', en: 'Pearl bracelet' }, colors: ['#fbf6ee'] },
    { id: 'beads-hearts', shape: 'wrist-beads', cat: 'bracelet', name: { is: 'Hjartaperlur', en: 'Heart beads' }, colors: ['#f7c0d4', '#ffffff'], heart: '#e8457a' },
    { id: 'beads-candy', shape: 'wrist-beads', cat: 'bracelet', big: true, name: { is: 'Sælgætisperlur', en: 'Candy beads' }, colors: ['#ff8fb8', '#8fd8ff', '#fff07a', '#b9f0a8'] },
    { id: 'beads-stars', shape: 'wrist-beads', cat: 'bracelet', name: { is: 'Stjörnuperlur', en: 'Star beads' }, colors: ['#3f6fc4', '#6fa0e8'], star: '#f6cf55' },
    // charms
    { id: 'charm-gold', shape: 'wrist-charm', cat: 'bracelet', sides: 'L', name: { is: 'Gullkeðja með hengjum', en: 'Gold charm bracelet' }, colors: ['#f2c34d'], charms: ['heart', 'star', 'moon'], cc: ['#ef5b7a', '#f6cf55', '#f6cf55'] },
    { id: 'charm-unicorn', shape: 'wrist-charm', cat: 'bracelet', sides: 'L', name: { is: 'Einhyrningsarmband', en: 'Unicorn charm bracelet' }, colors: ['#dfe4ec'], charms: ['horn', 'rainbow', 'heart'], cc: ['#f6cf55', '#ffffff', '#c9a8ff'] },
    { id: 'charm-lion', shape: 'wrist-charm', cat: 'bracelet', sides: 'L', name: { is: 'Ljónaarmband', en: 'Lion charm bracelet' }, colors: ['#f2c34d'], charms: ['lion', 'heart'], cc: ['#ee8a2e', '#ef5b7a'] },
    // woven friendship bands
    { id: 'woven-rainbow', shape: 'wrist-woven', cat: 'bracelet', name: { is: 'Regnbogavinaband', en: 'Rainbow friendship band' }, colors: ['#ef6f6c', '#f7d660', '#7fcf8a', '#6fb3e6', '#a58be0'] },
    { id: 'woven-pink', shape: 'wrist-woven', cat: 'bracelet', sides: 'L', name: { is: 'Bleikt vinaband', en: 'Pink friendship band' }, colors: ['#f48cc0', '#ffffff', '#b59be6'] },
    // glow, watch, flowers
    { id: 'glow-party', shape: 'wrist-glow', cat: 'bracelet', name: { is: 'Glóarmbönd', en: 'Glow bracelets' }, colors: ['#ff5fc8', '#5cf08a', '#5cc8ff'] },
    { id: 'watch-flower', shape: 'wrist-watch', cat: 'bracelet', sides: 'L', name: { is: 'Blómaúr', en: 'Flower watch' }, colors: ['#f48cc0', '#f2c34d', '#f48cc0'] },
    { id: 'flowers-daisy', shape: 'wrist-flowers', cat: 'bracelet', name: { is: 'Blómaarmband', en: 'Daisy bracelet' }, colors: ['#ffffff', '#f7d04a', '#6aa65a', '#f7a6c2'] },
  ]);
})();
