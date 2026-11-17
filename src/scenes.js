/* =====================================================================
   Fjársjóðskistan – Icelandic scenes and creatures
   Scenes are SVGs in a 1600×1000 space (cropped to fill the screen).
   Moving parts use CSS classes (see app.css) that only animate
   transform and opacity, so they stay smooth on older tablets.
   ===================================================================== */
(function (root) {
  'use strict';

  /** Small seeded random so scenes look the same every time. */
  function rng(seed) { return () => (seed = (seed * 16807) % 2147483647) / 2147483647; }

  /** A swaying Icelandic lupine (purple flower spike) standing at x,y with height h. */
  function lupine(x, y, h, hue, delay) {
    const cols = [['#7a5bd6', '#a48af0'], ['#5c6fd8', '#8fa0f2'], ['#b06fd6', '#d3a2f0']][hue % 3];
    let g = `<g class="sway" style="transform-origin:${x}px ${y}px;animation-delay:${delay}s"><path d="M${x},${y} Q${x - 3},${y - h * .5} ${x},${y - h}" stroke="#4f8f45" stroke-width="3" fill="none"/>`;
    for (let i = 0; i < 9; i++) {
      const yy = y - h * .42 - i * h * .065, r = 7 - i * .55;
      g += `<ellipse cx="${x - 4}" cy="${yy}" rx="${r}" ry="${r * .7}" fill="${cols[i % 2]}"/><ellipse cx="${x + 4}" cy="${yy - 3}" rx="${r}" ry="${r * .7}" fill="${cols[(i + 1) % 2]}"/>`;
    }
    g += `<path d="M${x},${y - h * .25} q-14,-6 -20,4 M${x},${y - h * .3} q14,-6 20,4" stroke="#5ea353" stroke-width="4" fill="none" stroke-linecap="round"/>`;
    return g + '</g>';
  }

  /** Fluffy cloud that drifts across the sky. */
  function cloud(x, y, s, dur, delay) {
    return `<g class="drift" style="animation-duration:${dur}s;animation-delay:${delay}s"><g transform="translate(${x},${y}) scale(${s})">` +
      `<ellipse cx="0" cy="0" rx="70" ry="30" fill="#fff"/><ellipse cx="-40" cy="8" rx="45" ry="24" fill="#fff"/><ellipse cx="45" cy="6" rx="50" ry="26" fill="#fff"/><ellipse cx="5" cy="-18" rx="40" ry="28" fill="#fff"/>` +
      `<ellipse cx="0" cy="14" rx="90" ry="14" fill="#dbeaf3"/></g></g>`;
  }

  /** Rainbow arcs (hidden until shown). */
  function rainbow(cx, cy, r, cls = 'rainbow') {
    const cols = ['#ef6f6c', '#f6a65a', '#f7d660', '#7fcf8a', '#6fb3e6', '#a58be0'];
    return `<g class="${cls}" id="rainbow">` + cols.map((c, i) => `<path d="M${cx - r + i * 14},${cy} A${r - i * 14},${r - i * 14} 0 0 1 ${cx + r - i * 14},${cy}" fill="none" stroke="${c}" stroke-width="15" opacity=".75"/>`).join('') + '</g>';
  }

  /** Sun with a glow and slowly turning rays. */
  function sun(x, y, r) {
    let rays = '';
    for (let i = 0; i < 12; i++) rays += `<path d="M0,0 L${-14},${-r * 3.4} L${14},${-r * 3.4}Z" fill="#fff7c8" opacity=".22" transform="rotate(${i * 30})"/>`;
    return `<g transform="translate(${x},${y})"><g class="spin">${rays}</g>` +
      `<circle r="${r * 1.9}" fill="url(#sunglow)"/><circle r="${r}" fill="#ffe27a"/><circle r="${r * .8}" fill="#fff0a8"/></g>`;
  }

  const commonDefs = `
    <radialGradient id="sunglow"><stop offset="0" stop-color="#fff6c0" stop-opacity=".9"/><stop offset="1" stop-color="#fff6c0" stop-opacity="0"/></radialGradient>`;

  /* ---------------- Scene 1: lupine meadow ---------------- */
  function meadow() {
    const r = rng(7);
    let lup = '';
    for (let i = 0; i < 34; i++) {
      const fg = i > 22, x = fg ? 60 + r() * 1480 : 200 + r() * 1300, y = fg ? 900 + r() * 90 : 700 + r() * 110;
      lup += lupine(Math.round(x), Math.round(y), fg ? 120 + r() * 50 : 60 + r() * 40, i, (r() * 3).toFixed(2));
    }
    let buttercups = '';
    for (let i = 0; i < 60; i++) buttercups += `<circle cx="${Math.round(r() * 1600)}" cy="${Math.round(760 + r() * 240)}" r="${3 + r() * 3}" fill="${i % 3 ? '#ffd84d' : '#fff'}"/>`;
    return `<svg viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg"><defs>${commonDefs}
      <linearGradient id="m-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7cc7ef"/><stop offset=".7" stop-color="#d7f0fb"/></linearGradient>
      <linearGradient id="m-near" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7cc96a"/><stop offset="1" stop-color="#4f9e45"/></linearGradient></defs>
      <rect width="1600" height="1000" fill="url(#m-sky)"/>
      ${sun(1340, 170, 62)}
      ${cloud(300, 140, 1, 90, -20)}${cloud(900, 90, .7, 120, -70)}${cloud(1200, 250, .55, 100, -40)}
      ${rainbow(820, 700, 420, 'rainbow cycle')}
      <path d="M0,560 L160,430 L250,480 L420,350 L560,470 L700,400 L860,500 L1000,380 L1180,480 L1320,410 L1480,490 L1600,440 L1600,700 L0,700Z" fill="#9db5cf"/>
      <path d="M420,350 L380,390 L405,385 L430,400 L460,380Z M1000,380 L965,415 L990,410 L1012,425 L1040,405Z M160,430 L130,460 L160,455 L185,465Z" fill="#fff"/>
      <path d="M0,640 Q300,560 640,620 T1300,600 T1600,610 L1600,800 L0,800Z" fill="#a8db8f"/>
      <path d="M0,720 Q420,640 860,720 T1600,700 L1600,1000 L0,1000Z" fill="url(#m-near)"/>
      ${buttercups}
      <g transform="translate(1160,840)"><ellipse cx="0" cy="40" rx="110" ry="22" fill="#3e7a39" opacity=".35"/><path d="M-100,40 Q-110,-30 -30,-50 Q40,-70 90,-20 Q118,10 100,40Z" fill="#8c8f96"/><path d="M-60,-30 Q-10,-50 40,-40" stroke="#b5b8be" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M-90,30 Q-60,10 -20,20" stroke="#6fae5c" stroke-width="10" fill="none" stroke-linecap="round"/></g>
      ${lup}
    </svg>`;
  }

  /* ---------------- Scene 2: black sand beach ---------------- */
  function beach() {
    const waves = [0, 1, 2, 3].map(i => `<g class="wave" style="animation-duration:${7 + i * 2}s;animation-delay:${-i * 1.7}s"><path d="M-200,${560 + i * 38} q50,-14 100,0 t100,0 t100,0 t100,0 t100,0 t100,0 t100,0 t100,0 t100,0 t100,0 t100,0 t100,0 t100,0 t100,0 t100,0 t100,0 t100,0 t100,0 t100,0 t100,0" fill="none" stroke="#fff" stroke-width="${4 - i * .5}" opacity="${.55 - i * .08}"/></g>`).join('');
    /** A basalt sea stack: rough rock silhouette with faint column lines and a splash of foam at the base. */
    const stack = (x, w, h) => {
      const top = 640 - h, n = Math.max(3, Math.round(w / 22));
      let d = `M${x},652 L${x + w * .06},${top + h * .35}`;
      for (let i = 0; i <= n; i++) d += `L${(x + w * .1 + i * w * .8 / n).toFixed(0)},${(top + (i % 2 ? 14 : 0) + (i === 0 || i === n ? h * .12 : 0)).toFixed(0)}`;
      d += `L${x + w * .94},${top + h * .3} L${x + w},652Z`;
      let cols = '';
      for (let i = 1; i < n; i++) cols += `M${(x + w * .1 + i * w * .8 / n).toFixed(0)},${top + 24} V640`;
      return `<path d="${d}" fill="#3a3d45"/><path d="${cols}" stroke="#4b4f58" stroke-width="3"/>` +
        `<path d="M${x + w * .2},${top + 30} Q${x + w * .3},${top + h * .5} ${x + w * .22},${top + h * .9}" stroke="#5a5e68" stroke-width="5" fill="none" stroke-linecap="round" opacity=".7"/>` +
        `<ellipse cx="${x + w / 2}" cy="650" rx="${w * .65}" ry="9" fill="#fff" opacity=".55" class="foam"/>`;
    };
    const gulls = [0, 1, 2].map(i => `<g class="drift" style="animation-duration:${40 + i * 12}s;animation-delay:${-i * 15}s"><path d="M${200 + i * 300},${170 + i * 40} q14,-12 28,0 q14,-12 28,0" fill="none" stroke="#4d5866" stroke-width="4" stroke-linecap="round"/></g>`).join('');
    return `<svg viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg"><defs>${commonDefs}
      <linearGradient id="b-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fd2ec"/><stop offset="1" stop-color="#eaf6fb"/></linearGradient>
      <linearGradient id="b-sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3f86b6"/><stop offset="1" stop-color="#77bcd9"/></linearGradient>
      <linearGradient id="b-sand" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#55555e"/><stop offset="1" stop-color="#26262c"/></linearGradient></defs>
      <rect width="1600" height="1000" fill="url(#b-sky)"/>
      ${sun(260, 160, 56)}${cloud(1100, 120, .8, 110, -30)}${gulls}
      <rect y="520" width="1600" height="220" fill="url(#b-sea)"/>${waves}
      ${stack(1180, 120, 300)}${stack(1340, 70, 200)}${stack(1440, 40, 120)}
      <path d="M0,690 Q400,660 800,700 T1600,690 L1600,1000 L0,1000Z" fill="url(#b-sand)"/>
      <g class="foam"><path d="M0,700 Q200,684 400,700 T800,700 T1200,700 T1600,700" fill="none" stroke="#fff" stroke-width="6" opacity=".6" stroke-linecap="round"/></g>
      ${Array.from({ length: 40 }, (_, i) => `<circle cx="${(i * 397) % 1600}" cy="${760 + (i * 131) % 230}" r="${2 + (i % 3)}" fill="#6a6a74"/>`).join('')}
      <g transform="translate(330,880)"><path d="M-80,30 Q-90,-30 -20,-40 Q60,-50 80,30Z" fill="#3a3c43"/><path d="M-50,-20 Q0,-36 40,-26" stroke="#5a5d66" stroke-width="7" fill="none" stroke-linecap="round"/></g>
    </svg>`;
  }

  /* ---------------- Scene 3: waterfall ---------------- */
  function waterfall() {
    const streams = Array.from({ length: 9 }, (_, i) => `<path d="M${720 + i * 18},210 C${716 + i * 18},400 ${712 + i * 19},560 ${706 + i * 20},690" stroke="#fff" stroke-width="${5 + (i % 3) * 2}" fill="none" opacity="${.5 + (i % 2) * .3}" stroke-dasharray="40 30" class="flow" style="animation-duration:${1.2 + (i % 4) * .25}s"/>`).join('');
    const mist = [0, 1, 2, 3, 4].map(i => `<ellipse class="mist" style="animation-delay:${-i * .8}s" cx="${690 + i * 50}" cy="${700 + (i % 2) * 14}" rx="${70 + (i % 3) * 20}" ry="28" fill="#fff" opacity=".5"/>`).join('');
    return `<svg viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg"><defs>${commonDefs}
      <linearGradient id="w-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#86c9ea"/><stop offset="1" stop-color="#e1f3fa"/></linearGradient>
      <linearGradient id="w-fall" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b9e2f2"/><stop offset=".5" stop-color="#eaf8fd"/><stop offset="1" stop-color="#b9e2f2"/></linearGradient>
      <linearGradient id="w-pool" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5fb0d6"/><stop offset="1" stop-color="#3c88b4"/></linearGradient></defs>
      <rect width="1600" height="1000" fill="url(#w-sky)"/>
      ${cloud(250, 120, .8, 100, -10)}${cloud(1300, 90, .6, 130, -60)}
      <path d="M0,200 L560,190 Q640,180 700,210 L700,720 L0,760Z" fill="#6f8f5a"/><path d="M0,200 L560,190 Q640,180 700,210 L700,300 Q400,260 0,300Z" fill="#82a86a"/>
      <path d="M1600,200 L1000,190 Q920,180 880,210 L880,720 L1600,760Z" fill="#6a8a56"/><path d="M1600,200 L1000,190 Q920,180 880,210 L880,300 Q1200,260 1600,300Z" fill="#7fa565"/>
      <path d="M560,320 l40,-6 M610,420 l50,-4 M960,330 l-40,-6 M940,450 l-50,-4 M300,380 l60,-6 M1250,370 l-60,-6" stroke="#58744a" stroke-width="6" stroke-linecap="round"/>
      <rect x="700" y="205" width="180" height="500" fill="url(#w-fall)"/>${streams}
      <ellipse cx="790" cy="720" rx="330" ry="60" fill="url(#w-pool)"/>${mist}
      ${rainbow(790, 690, 210, 'rainbow shimmer')}
      <path d="M0,760 Q400,700 790,790 T1600,760 L1600,1000 L0,1000Z" fill="#5ea353"/>
      <path d="M0,840 Q500,780 1000,850 T1600,830 L1600,1000 L0,1000Z" fill="#6db95f"/>
      <g transform="translate(1240,860)"><path d="M-110,40 Q-120,-30 -40,-50 Q50,-66 100,-10 Q122,16 104,40Z" fill="#7d8088"/><path d="M-90,30 Q-50,0 -10,14" stroke="#76b766" stroke-width="12" fill="none" stroke-linecap="round"/></g>
      ${Array.from({ length: 30 }, (_, i) => `<circle cx="${(i * 523) % 1600}" cy="${860 + (i * 71) % 130}" r="4" fill="${i % 2 ? '#fff' : '#ffd84d'}"/>`).join('')}
    </svg>`;
  }

  /* ---------------- Scene 4: northern lights night ---------------- */
  function night() {
    const r = rng(42);
    const stars = [0, 1, 2].map(g => `<g class="twinkle" style="animation-delay:${-g * 1.3}s">` +
      Array.from({ length: 24 }, () => `<circle cx="${Math.round(r() * 1600)}" cy="${Math.round(r() * 520)}" r="${(1 + r() * 2.2).toFixed(1)}" fill="#fff"/>`).join('') + '</g>').join('');
    const aurora = (d, a, b, cls, delay) => `<g class="${cls}" style="animation-delay:${delay}s"><path d="${d}" fill="none" stroke="url(#${a})" stroke-width="90" stroke-linecap="round" opacity=".55"/><path d="${d}" fill="none" stroke="url(#${b})" stroke-width="30" stroke-linecap="round" opacity=".6"/></g>`;
    return `<svg viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg"><defs>${commonDefs}
      <linearGradient id="n-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#081634"/><stop offset=".7" stop-color="#1d3d70"/><stop offset="1" stop-color="#2e5688"/></linearGradient>
      <linearGradient id="au-g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4dffb0" stop-opacity="0"/><stop offset=".3" stop-color="#4dffb0"/><stop offset=".7" stop-color="#6bf0d8"/><stop offset="1" stop-color="#6bf0d8" stop-opacity="0"/></linearGradient>
      <linearGradient id="au-p" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff8bd8" stop-opacity="0"/><stop offset=".5" stop-color="#d79bff"/><stop offset="1" stop-color="#ff8bd8" stop-opacity="0"/></linearGradient>
      <linearGradient id="n-snow" gradientUnits="userSpaceOnUse" x1="0" y1="650" x2="0" y2="1000"><stop offset="0" stop-color="#e3eefa"/><stop offset="1" stop-color="#b9cfe8"/></linearGradient>
      <radialGradient id="moonglow"><stop offset="0" stop-color="#fffbe6" stop-opacity=".7"/><stop offset="1" stop-color="#fffbe6" stop-opacity="0"/></radialGradient>
      <radialGradient id="winglow"><stop offset="0" stop-color="#ffd36b" stop-opacity=".9"/><stop offset="1" stop-color="#ffd36b" stop-opacity="0"/></radialGradient></defs>
      <rect width="1600" height="1000" fill="url(#n-sky)"/>${stars}
      ${aurora('M-100,330 C200,180 500,360 800,220 S1300,160 1700,300', 'au-g', 'au-p', 'aurora', 0)}
      ${aurora('M-100,200 C300,90 600,260 900,140 S1400,80 1700,180', 'au-g', 'au-g', 'aurora slow', -4)}
      <circle cx="1330" cy="150" r="120" fill="url(#moonglow)"/><circle cx="1330" cy="150" r="46" fill="#fffbe6"/><circle cx="1350" cy="140" r="40" fill="#1a3463" opacity=".12"/>
      <path d="M0,620 L200,480 L330,560 L520,440 L700,560 L900,470 L1080,570 L1260,480 L1440,560 L1600,500 L1600,760 L0,760Z" fill="#203a62"/>
      <path d="M520,440 L480,480 L520,474 L556,486Z M900,470 L860,505 L900,500 L935,512Z M1260,480 L1222,514 L1260,510 L1295,520Z" fill="#dfe9f6"/>
      <path d="M0,720 Q420,650 860,730 T1600,710 L1600,1000 L0,1000Z" fill="url(#n-snow)"/>
      <g transform="translate(1170,724)">
        <!-- turf house: grass roof with snow on top, a stone chimney with soft smoke, wooden gable front -->
        <rect x="58" y="-74" width="16" height="34" fill="#8f8a90" stroke="#5f5a66" stroke-width="3"/>
        ${[0, 1, 2].map(i => `<circle class="smoke" style="animation-delay:${-i * 1.4}s" cx="66" cy="-80" r="9" fill="#e8f1fb" opacity=".7"/>`).join('')}
        <path d="M-120,40 L-120,-10 Q0,-110 120,-10 L120,40Z" fill="#4f7d4a"/><path d="M-120,-10 Q0,-110 120,-10" fill="none" stroke="#e8f1fb" stroke-width="12" stroke-linecap="round"/>
        <path d="M-40,40 L-40,-30 L0,-62 L40,-30 L40,40Z" fill="#8a5a3c" stroke="#5e3b26" stroke-width="4"/>
        <rect x="-14" y="2" width="28" height="38" rx="4" fill="#5e3b26"/>
        <circle cx="0" cy="-28" r="40" fill="url(#winglow)" class="glow"/><rect x="-11" y="-38" width="22" height="20" rx="3" fill="#ffd36b" stroke="#5e3b26" stroke-width="3"/>
      </g>
      <!-- snowdrift in front of the house so it sits down in the snow (dips at the door so the door stays clear) -->
      <path d="M1010,820 L1010,776 Q1060,752 1124,758 Q1170,768 1216,758 Q1280,752 1330,776 L1330,820Z" fill="url(#n-snow)"/>
      <path d="M1010,776 Q1060,752 1124,758 Q1170,768 1216,758 Q1280,752 1330,776" fill="none" stroke="#f4f8fd" stroke-width="5" stroke-linecap="round"/>
    </svg>`;
  }

  /* ---- town helpers (Reykjavík and Kópavogur) ---- */
  /** Darker outline colour for a scene fill. */
  const sink = h => { const A = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)), B = [59, 40, 56]; return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * .45).toString(16).padStart(2, '0')).join(''); };
  /**
   * Little Icelandic house: painted wall, steep corrugated-iron roof, white windows.
   * x = left, base = ground line, w/h = wall size. smoke = chimney with rising puffs.
   */
  function house(x, base, w, h, wall, roof, smoke = false, delay = 0) {
    const top = base - h, peak = top - w * .48;
    let s = `<path d="M${x},${base} V${top} H${x + w} V${base}Z" fill="${wall}" stroke="${sink(wall)}" stroke-width="2.5"/>`;
    if (smoke) s += `<rect x="${x + w * .66}" y="${peak + w * .12}" width="${w * .12}" height="${w * .3}" fill="#9a8a86" stroke="#6a5a58" stroke-width="2"/>` +
      [0, 1, 2].map(i => `<circle class="smoke" style="animation-delay:${delay - i * 1.4}s" cx="${x + w * .72}" cy="${peak + w * .06}" r="${w * .09}" fill="#fff" opacity=".7"/>`).join('');
    s += `<path d="M${x - 5},${top + 2} L${x + w / 2},${peak} L${x + w + 5},${top + 2}Z" fill="${roof}" stroke="${sink(roof)}" stroke-width="2.5" stroke-linejoin="round"/>`;
    // corrugated iron: thin lines down the roof
    for (let i = 1; i < 6; i++) { const t = i / 6; s += `<path d="M${x + w / 2},${peak + 4} L${(x - 5 + (w + 10) * t).toFixed(0)},${top}" stroke="${sink(roof)}" stroke-width="1" opacity=".35"/>`; }
    const win = (wx, wy, ww, wh) => `<rect x="${wx}" y="${wy}" width="${ww}" height="${wh}" fill="#bfe3f2" stroke="#fff" stroke-width="3"/><path d="M${wx + ww / 2},${wy} V${wy + wh} M${wx},${wy + wh / 2} H${wx + ww}" stroke="#fff" stroke-width="2"/>`;
    const ww = w * .24, wh = h * .3;
    s += win(x + w * .14, top + h * .2, ww, wh) + win(x + w * .62, top + h * .2, ww, wh);
    if (w > 46) s += `<rect x="${x + w * .4}" y="${base - h * .42}" width="${w * .2}" height="${h * .42}" rx="3" fill="${sink(wall)}"/>`;
    // little attic window in the gable
    s += `<circle cx="${x + w / 2}" cy="${top - w * .17}" r="${w * .07}" fill="#bfe3f2" stroke="#fff" stroke-width="2"/>`;
    return s;
  }

  /* ---------------- Scene 5: Reykjavík harbour ---------------- */
  function reykjavik() {
    const r = rng(11);
    const waves = [0, 1, 2].map(i => `<g class="wave" style="animation-duration:${8 + i * 2}s;animation-delay:${-i * 2.1}s"><path d="M-200,${598 + i * 30} q50,-10 100,0 t100,0 t100,0 t100,0 t100,0 t100,0 t100,0 t100,0 t100,0 t100,0 t100,0 t100,0 t100,0 t100,0 t100,0 t100,0 t100,0 t100,0 t100,0 t100,0" fill="none" stroke="#fff" stroke-width="${3.5 - i * .5}" opacity="${.5 - i * .1}"/></g>`).join('');
    const gulls = [0, 1, 2].map(i => `<g class="drift" style="animation-duration:${45 + i * 14}s;animation-delay:${-i * 17}s"><path d="M${250 + i * 330},${200 + i * 36} q14,-12 28,0 q14,-12 28,0" fill="none" stroke="#4d5866" stroke-width="4" stroke-linecap="round"/></g>`).join('');
    /** Small fishing boat that rocks on the water. */
    const boat = (x, y, hull, delay) => `<g class="boat" style="animation-delay:${delay}s">` +
      `<path d="M${x - 46},${y - 18} H${x + 50} L${x + 38},${y} H${x - 38}Z" fill="${hull}" stroke="${sink(hull)}" stroke-width="2.5" stroke-linejoin="round"/>` +
      `<path d="M${x - 40},${y - 12} H${x + 46}" stroke="#fff" stroke-width="3"/>` +
      `<rect x="${x - 22}" y="${y - 42}" width="30" height="24" rx="3" fill="#fbfaf6" stroke="#9a9ca6" stroke-width="2"/><rect x="${x - 17}" y="${y - 37}" width="9" height="8" fill="#8fc6e2"/><rect x="${x - 4}" y="${y - 37}" width="9" height="8" fill="#8fc6e2"/>` +
      `<path d="M${x + 22},${y - 18} V${y - 66}" stroke="#7a7f8a" stroke-width="3"/><path d="M${x + 22},${y - 64} L${x + 40},${y - 58} L${x + 22},${y - 52}Z" fill="#ef6f6c"/></g>`;
    // Hallgrímskirkja: tall concrete tower with stepped columns falling away on both sides like basalt.
    // base 578 is a little below the hilltop, so every column stands on the hill (none over the sea).
    let church = '';
    const cx = 1010, base = 578;
    for (let i = 5; i >= 0; i--) {
      const top = 312 + i * 40, w = 15;
      for (const s of [-1, 1]) {
        const x = s < 0 ? cx - 34 - (i + 1) * w : cx + 34 + i * w;
        church += `<rect x="${x}" y="${top}" width="${w}" height="${base - top}" fill="${i % 2 ? '#e9e6e0' : '#dcd8d1'}" stroke="#a9a49c" stroke-width="1.8"/>` +
          `<path d="M${x + w / 2},${top + 6} V${base - 6}" stroke="#c4bfb6" stroke-width="1.4"/>`;
      }
    }
    church += `<path d="M${cx - 34},${base} V250 L${cx},150 L${cx + 34},250 V${base}Z" fill="#efece6" stroke="#a9a49c" stroke-width="2.2" stroke-linejoin="round"/>` +
      `<path d="M${cx - 12},${base} V270 M${cx + 12},${base} V270" stroke="#cfcac2" stroke-width="2"/>` +
      `<rect x="${cx - 18}" y="262" width="36" height="22" rx="4" fill="#5e6b7a"/><path d="M${cx - 12},262 v22 M${cx},262 v22 M${cx + 12},262 v22" stroke="#efece6" stroke-width="3"/>` +
      `<circle cx="${cx}" cy="306" r="11" fill="#fdfbf6" stroke="#8a857e" stroke-width="2"/><path d="M${cx},306 v-7 M${cx},306 h5" stroke="#4a4a52" stroke-width="2" stroke-linecap="round"/>` +
      `<path d="M${cx},150 V122 M${cx - 8},131 H${cx + 8}" stroke="#a9a49c" stroke-width="4" stroke-linecap="round"/>` +
      `<path d="M${cx - 9},${base} V${base - 46} Q${cx},${base - 60} ${cx + 9},${base - 46} V${base}Z" fill="#7a6a5e"/>`;
    /* Harpa: the glass concert hall on the harbour. A crystal-like block with a slanted, folded roof
       (low on the left, highest just right of the middle, sloping down to the right), three glass faces
       lit differently, and the honeycomb glass bricks all over. Some bricks glint in colours (three
       groups twinkle in turn), like the coloured panes on the real building. */
    const HARPA = 'M1232,696 V598 L1266,568 L1338,524 L1420,516 L1478,542 L1542,592 V696Z';
    const facets = [   // [corner points, gradient id] left face (sunlit), middle face, right face (in shade)
      ['1232,696 1232,598 1266,568 1300,696', 'r-h1'],
      ['1266,568 1338,524 1420,516 1446,696 1300,696', 'r-h2'],
      ['1420,516 1478,542 1542,592 1542,696 1446,696', 'r-h3'],
    ].map(([p, g]) => `<polygon points="${p}" fill="url(#${g})"/>`).join('');
    // honeycomb: pointy-top hexagons of radius 9 (one row every 13.5, every other row shifted half a cell)
    const HX = 9, HW = HX * Math.sqrt(3);
    const hex = (x, y) => `M${x},${y - HX} L${(x + HW / 2).toFixed(1)},${y - HX / 2} V${y + HX / 2} L${x},${y + HX} L${(x - HW / 2).toFixed(1)},${y + HX / 2} V${y - HX / 2}Z`;
    const hexTile = [[HW / 2, HX], [0, 2.5 * HX], [HW, 2.5 * HX], [0, -.5 * HX], [HW, -.5 * HX], [HW / 2, 4 * HX]].map(([x, y]) => hex(+x.toFixed(1), y)).join('');
    let panes = '';
    for (let gx = 0; gx < 3; gx++) {
      panes += `<g class="twinkle" style="animation-delay:${-gx * 1.1}s">`;
      for (let k = 0; k < 11; k++) {
        const row = 38 + Math.floor(r() * 12), col = 79 + Math.floor(r() * 20);   // a cell somewhere on the facade
        const x = +(col * HW + (row % 2 ? 0 : HW / 2)).toFixed(1), y = HX + row * 1.5 * HX;
        panes += `<path d="${hex(x, y)}" fill="${['#ffe27a', '#9ff0d0', '#d7b4ff'][gx]}" opacity=".8"/>`;
      }
      panes += '</g>';
    }
    // the Sun Voyager: a steel boat skeleton on a stone by the shore
    const solfar = `<g transform="translate(150,700)"><path d="M-70,0 H80 L70,14 H-60Z" fill="#9aa0aa" stroke="#6c7280" stroke-width="2"/>` +
      `<path d="M-90,-30 Q0,-6 100,-34" stroke="#cdd3dc" stroke-width="6" fill="none" stroke-linecap="round"/>` +
      `<path d="M100,-34 L118,-62 M-90,-30 L-104,-50" stroke="#cdd3dc" stroke-width="5" stroke-linecap="round"/>` +
      [-60, -35, -10, 15, 40, 65].map(x => `<path d="M${x},${-14 - Math.abs(x) * .1} L${x - 6},${-46}" stroke="#b7bec9" stroke-width="4" stroke-linecap="round"/>`).join('') +
      `<path d="M-60,-46 Q0,-40 60,-48" stroke="#e4e8ee" stroke-width="2.5" fill="none" opacity=".8"/></g>`;
    // colourful houses on the hill below the church: [left, ground line, width, height, wall, roof, chimney smoke?, smoke delay]
    const houses = [
      [940, 616, 46, 42, '#f7d16a', '#c4504a', true, 0], [1090, 594, 50, 44, '#8fc6e2', '#c4504a'], [1150, 602, 46, 40, '#f4f1ea', '#4f9a6a', true, -2],
      [928, 682, 56, 52, '#a58be0', '#4f9a6a'], [992, 684, 50, 44, '#f48c7a', '#4a5f8a'],
      [1050, 688, 54, 48, '#9edb8a', '#c4504a', true, -3], [1112, 692, 48, 44, '#6fb3e6', '#e2564c'], [1172, 696, 56, 50, '#ef8a7a', '#5a7fae'],
    ].map(h => house(...h)).join('');
    return `<svg viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg"><defs>${commonDefs}
      <linearGradient id="r-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#86c8ee"/><stop offset="1" stop-color="#e6f6fc"/></linearGradient>
      <linearGradient id="r-sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3f88bb"/><stop offset="1" stop-color="#78bddc"/></linearGradient>
      <linearGradient id="r-h1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b4e0ee"/><stop offset="1" stop-color="#6fa8c4"/></linearGradient>
      <linearGradient id="r-h2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fb8d4"/><stop offset="1" stop-color="#3f7697"/></linearGradient>
      <linearGradient id="r-h3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4f84a6"/><stop offset="1" stop-color="#2a5674"/></linearGradient>
      <pattern id="r-hex" patternUnits="userSpaceOnUse" width="${HW.toFixed(3)}" height="${3 * HX}"><path d="${hexTile}" fill="none" stroke="#e4f6fc" stroke-width="1.3" opacity=".55"/></pattern>
      <clipPath id="r-harpa"><path d="${HARPA}"/></clipPath>
      <linearGradient id="r-grass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#86c96f"/><stop offset="1" stop-color="#57a24b"/></linearGradient>
      <clipPath id="r-water"><rect x="0" y="0" width="1600" height="636"/></clipPath></defs>
      <rect width="1600" height="1000" fill="url(#r-sky)"/>
      ${sun(1440, 150, 52)}${cloud(300, 130, .9, 110, -25)}${cloud(1000, 80, .6, 130, -80)}${gulls}
      ${rainbow(820, 640, 400)}
      <path d="M-60,600 V478 Q80,440 210,450 Q330,418 470,432 Q600,410 720,446 Q830,462 920,520 L920,600Z" fill="#8ea6c4"/>
      <path d="M196,462 q-6,12 -12,22 M212,460 q2,12 6,24 M456,444 q-8,14 -14,26 M472,442 q0,14 4,28 M488,446 q6,10 14,18 M640,448 q-6,10 -10,18 M654,448 q2,10 6,18" stroke="#fff" stroke-width="7" stroke-linecap="round" fill="none" opacity=".85"/>
      <rect y="566" width="1600" height="140" fill="url(#r-sea)"/>${waves}
      <g clip-path="url(#r-water)"><g class="whale"><g transform="translate(690,640)">
        <path d="M0,0 C-2,-30 -6,-52 -20,-70 C-36,-84 -60,-80 -70,-72 C-52,-70 -30,-62 -12,-40 C-6,-36 6,-36 12,-40 C30,-62 52,-70 70,-72 C60,-80 36,-84 20,-70 C6,-52 2,-30 0,0Z" fill="#3e5b78" stroke="#263a52" stroke-width="3" stroke-linejoin="round"/>
        <path d="M-58,-74 C-40,-74 -22,-64 -12,-48" stroke="#7d9cba" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M-30,-12 q-10,-14 -4,-26 M30,-12 q10,-14 4,-26" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/></g></g></g>
      <ellipse class="foam" cx="690" cy="638" rx="46" ry="6" fill="#fff" opacity=".5"/>
      ${boat(800, 662, '#e2564c', 0)}
      <!-- Skólavörðuholt: the hill rises steeply from the shore and is flat on top right under the church -->
      <path d="M846,706 C858,640 864,582 904,564 Q1010,540 1140,546 Q1350,524 1600,532 L1600,720 L846,720Z" fill="#9cc37e"/>
      ${church}${houses}
      <!-- Harpa: three glass faces, honeycomb bricks, coloured glints, a light roof edge and a glowing lobby -->
      <g clip-path="url(#r-harpa)">${facets}
        <path d="${HARPA}" fill="url(#r-hex)"/>${panes}
        <path d="M1244,676 L1330,540 L1352,540 L1266,676Z M1280,676 L1372,532 L1384,532 L1292,676Z" fill="#fff" opacity=".16"/>
        <path d="M1232,680 H1542 V696 H1232Z" fill="#1f3f56"/>
        ${[1262, 1310, 1358, 1406, 1454, 1502].map(x => `<rect x="${x}" y="683" width="30" height="13" fill="#ffe9a8" opacity=".9"/>`).join('')}
        <path d="M1300,696 L1266,568 M1446,696 L1420,516" stroke="#1f3f56" stroke-width="2" opacity=".5"/></g>
      <path d="M1232,598 L1266,568 L1338,524 L1420,516 L1478,542 L1542,592" fill="none" stroke="#eaf8fd" stroke-width="4" stroke-linejoin="round" opacity=".85"/>
      <path d="${HARPA}" fill="none" stroke="#1f3f56" stroke-width="3" stroke-linejoin="round"/>
      <!-- Icelandic flag on the hill just right of Harpa -->
      <g transform="translate(1554,606)"><path d="M0,0 V-104" stroke="#c9ccd4" stroke-width="4"/>
        <g class="flag"><path d="M2,-104 H44 V-76 H2Z" fill="#2457a6"/><path d="M2,-90 H44 M16,-104 V-76" stroke="#fff" stroke-width="8"/><path d="M2,-90 H44 M16,-104 V-76" stroke="#d72830" stroke-width="4.5"/></g></g>
      <path d="M0,706 H1600 V722 H0Z" fill="#8e939c"/><path d="M0,706 H1600" stroke="#b9bdc4" stroke-width="3"/>
      ${solfar}
      <path d="M0,722 L1600,722 L1600,1000 L0,1000Z" fill="url(#r-grass)"/>
      <path d="M-20,1000 Q500,830 1000,860 T1620,800 L1620,850 Q1100,890 1000,905 T-20,1060Z" fill="#d9d4ca" opacity=".9"/>
      ${Array.from({ length: 36 }, (_, i) => `<circle cx="${(i * 431) % 1600}" cy="${760 + (i * 113) % 230}" r="${3 + (i % 3)}" fill="${['#ffd84d', '#fff', '#f48cc0'][i % 3]}"/>`).join('')}
    </svg>`;
  }

  /* ---------------- Scene 6: Kópavogur park ---------------- */
  function kopavogur() {
    /** Birch tree that sways a little. */
    const birch = (x, y, s, delay) => `<g class="sway" style="transform-origin:${x}px ${y}px;animation-delay:${delay}s;animation-duration:4.6s">` +
      `<path d="M${x - 6 * s},${y} Q${x - 3 * s},${y - 80 * s} ${x},${y - 150 * s} Q${x + 3 * s},${y - 80 * s} ${x + 6 * s},${y}Z" fill="#f4f1ea" stroke="#9a948a" stroke-width="2"/>` +
      `<path d="M${x - 3 * s},${y - 30 * s} h5 M${x - 2 * s},${y - 70 * s} h4 M${x - 1 * s},${y - 105 * s} h3" stroke="#4a4a52" stroke-width="3" stroke-linecap="round"/>` +
      [[-34, -150, 46], [26, -165, 42], [-6, -200, 50], [30, -118, 34], [-36, -112, 32]].map(([dx, dy, rr], i) =>
        `<circle cx="${x + dx * s}" cy="${y + dy * s}" r="${rr * s}" fill="${i % 2 ? '#7cc45e' : '#94d36f'}" stroke="#5a9a4a" stroke-width="2"/>`).join('') + `</g>`;
    /** Duck family: mother and two ducklings swimming back and forth on the stream. */
    const duck = (x, y, k, body, head, beak) => `<g transform="translate(${x},${y}) scale(${k})">` +
      `<ellipse cx="0" cy="0" rx="20" ry="11" fill="${body}" stroke="${sink(body)}" stroke-width="2"/><path d="M-20,-4 l-8,-6 l2,9z" fill="${body}" stroke="${sink(body)}" stroke-width="2"/>` +
      `<circle cx="14" cy="-13" r="9" fill="${head}" stroke="${sink(head)}" stroke-width="2"/><path d="M21,-13 l10,2 l-10,4z" fill="${beak}" stroke="${sink(beak)}" stroke-width="1.5"/>` +
      `<circle cx="16" cy="-15" r="2" fill="#2a1d26"/><circle cx="16.6" cy="-15.6" r=".7" fill="#fff"/><path d="M-8,-2 q8,-6 14,2" stroke="${sink(body)}" stroke-width="2" fill="none"/></g>`;
    const ducks = `<g class="duck"><g class="boat" style="animation-duration:2.6s">` + duck(980, 706, 1, '#b98a5a', '#4f9a6a', '#f6a23a') +
      duck(944, 712, .62, '#ffe066', '#ffe066', '#f6a23a') + duck(916, 714, .58, '#ffe066', '#ffe066', '#f6a23a') + `</g></g>`;
    // Kópavogskirkja: white church on its hill, tall arched front with a stained-glass window
    const kirk = `<g transform="translate(870,560)">
      <path d="M-92,40 V-6 Q-62,-70 -32,-6 V40Z" fill="#ecebe6" stroke="#a9a49c" stroke-width="2.5"/>
      <path d="M92,40 V-6 Q62,-70 32,-6 V40Z" fill="#ecebe6" stroke="#a9a49c" stroke-width="2.5"/>
      <path d="M-58,40 V-30 Q0,-190 58,-30 V40Z" fill="#f7f6f2" stroke="#a9a49c" stroke-width="3"/>
      <path d="M-30,38 V-28 Q0,-130 30,-28 V38Z" fill="url(#k-glass)" stroke="#8a857e" stroke-width="2.5"/>
      <path d="M-10,38 V-80 M10,38 V-80 M-30,0 H30 M-26,-40 H26" stroke="#efece6" stroke-width="3" opacity=".8"/>
      <path d="M0,-112 V-150 M-11,-138 H11" stroke="#a9a49c" stroke-width="5" stroke-linecap="round"/></g>`;
    /* Turninn (the Smáratorg tower): the tallest building in Iceland. A big block of black glass on a
       low dark base, a glass grid all over, sky reflections, and "TURNINN" at the top (owner's photo). */
    const TX = 1068, TW = 110, TT = 304;   // left edge, width, top of the tower
    let tower = `<rect x="1030" y="626" width="176" height="38" fill="#1f2731"/>` +                       // the low dark base building
      `<rect x="${TX}" y="${TT}" width="${TW}" height="${664 - TT}" fill="url(#k-tower)" stroke="#0f141b" stroke-width="2.5"/>`;
    for (let x = TX + 11; x < TX + TW; x += 11) tower += `<path d="M${x},${TT + 2} V662" stroke="#7d93a8" stroke-width="1" opacity=".35"/>`;   // glass grid
    for (let y = TT + 30; y < 660; y += 17) tower += `<path d="M${TX + 1},${y} H${TX + TW - 1}" stroke="#7d93a8" stroke-width="1" opacity=".4"/>`;
    tower += `<path d="M${TX},420 L${TX + TW},372 V404 L${TX},456Z M${TX},520 L${TX + TW},486 V500 L${TX},536Z" fill="#9fd0ec" opacity=".22"/>` +   // sky reflections
      `<rect x="${TX + 26}" y="${TT - 14}" width="${TW - 52}" height="14" fill="#55606c" stroke="#2a323c" stroke-width="2"/>` +      // little roof house
      `<text x="${TX + TW / 2}" y="${TT + 21}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="14" textLength="80" lengthAdjust="spacingAndGlyphs" fill="#fff">TURNINN</text>`;
    /* Smáralind: the big shopping centre, shaped a bit like a whale. A long deep-blue wall, a pale roof
       that curves down at the left end like the whale's head, a row of little humps along the roof,
       a tall white pylon at the left end, and the big orange HAGKAUP letters that everyone sees. */
    const roofY = x => 560 - (x - 1264) * 6 / 302;   // top of the roof (slopes up very slightly to the right)
    const mall = `<path d="M1226,664 V592 Q1236,578 1266,576 H1566 V664Z" fill="url(#k-mall)"/>` +
      Array.from({ length: 12 }, (_, i) => `<path d="M${1270 + i * 24},580 V664" stroke="#5f80d0" stroke-width="1.2" opacity=".5"/>`).join('') +
      `<path d="M1212,652 Q1200,578 1264,560 L1566,554 V576 L1266,578 Q1230,584 1226,652Z" fill="#e3e7ec" stroke="#98a2ae" stroke-width="2" stroke-linejoin="round"/>` +
      Array.from({ length: 8 }, (_, i) => { const x = 1292 + i * 34, y = roofY(x);
        return `<path d="M${x - 10},${y.toFixed(1)} Q${x},${(y - 22).toFixed(1)} ${x + 10},${y.toFixed(1)}Z" fill="#d6e8f6" stroke="#98a2ae" stroke-width="1.5"/>`; }).join('') +
      `<rect x="1298" y="634" width="36" height="30" fill="#bfe3f2" stroke="#fff" stroke-width="2.5"/><path d="M1316,634 V664" stroke="#fff" stroke-width="2"/>` +   // entrance
      `<text x="1446" y="618" text-anchor="middle" font-family="Arial Black, Arial, Helvetica, sans-serif" font-weight="900" font-size="30" textLength="176" lengthAdjust="spacingAndGlyphs" fill="#f47a2a" stroke="#a8451a" stroke-width=".8">HAGKAUP</text>` +
      `<path d="M1186,664 V470 L1210,460 V664Z" fill="#f2f4f6" stroke="#a9b0b8" stroke-width="2" stroke-linejoin="round"/>` +   // white pylon at the left end
      `<circle cx="1198" cy="490" r="8" fill="none" stroke="#f48cc0" stroke-width="3.5"/><circle cx="1198" cy="490" r="3" fill="#6fb3e6"/>`;
    /* Little wooden footbridge over the stream. The stream runs left-right across the picture, so the
       bridge runs away from us: the near end sits on the grass in front of the stream (y 752), the far
       end on the far bank (y 690), and it gets narrower further away. The ducks swim under it.
       t = 0 near end ... 1 far end. */
    const bY = t => 752 - 62 * t, bL = t => 1136 + 20 * t, bR = t => 1224 - 20 * t, bH = t => 32 - 12 * t;
    const pt = (x, y) => `${x.toFixed(1)},${y.toFixed(1)}`;
    let bridge = `<path d="M1166,662 H1194 L1204,690 H1156Z M1136,760 H1224 Q1236,880 1290,1000 H1070 Q1124,880 1136,760Z" fill="#e6dcc4" opacity=".8"/>` +    // gravel path on both banks
      `<polygon points="${pt(bL(0), bY(0))} ${pt(bR(0), bY(0))} ${pt(bR(1), bY(1))} ${pt(bL(1), bY(1))}" fill="#c48a52" stroke="#8a5a34" stroke-width="2.5" stroke-linejoin="round"/>`;
    for (let k = 1; k < 9; k++) { const t = k / 9; bridge += `<path d="M${pt(bL(t), bY(t))} L${pt(bR(t), bY(t))}" stroke="#8a5a34" stroke-width="1.6" opacity=".6"/>`; }   // planks
    bridge += `<rect x="1136" y="752" width="88" height="9" fill="#8a5a34"/>`;   // front edge of the deck
    for (const side of [bL, bR]) {
      const ts = [0, .5, 1];
      bridge += ts.map(t => `<path d="M${pt(side(t), bY(t))} V${(bY(t) - bH(t)).toFixed(1)}" stroke="#7a4e2c" stroke-width="${(6 - 2 * t).toFixed(1)}" stroke-linecap="round"/>`).join('') +   // posts
        `<path d="M${ts.map(t => pt(side(t), bY(t) - bH(t))).join(' L')}" stroke="#b47a45" stroke-width="5" fill="none" stroke-linecap="round"/>` +   // top rail
        `<path d="M${ts.map(t => pt(side(t), bY(t) - bH(t) / 2)).join(' L')}" stroke="#b47a45" stroke-width="3" fill="none" stroke-linecap="round"/>`;   // middle rail
    }
    // swing set: A-frame with one swing that swings
    const swing = `<g transform="translate(1440,640)"><path d="M-80,160 L-60,0 L-40,160 M80,160 L60,0 L40,160" stroke="#d0473f" stroke-width="9" stroke-linecap="round" fill="none"/>
      <path d="M-66,0 H66" stroke="#8a5a34" stroke-width="10" stroke-linecap="round"/>
      <g class="swing" style="transform-origin:0px 0px"><path d="M-14,0 V108 M14,0 V108" stroke="#7a7f8a" stroke-width="3"/><rect x="-22" y="106" width="44" height="9" rx="4" fill="#f7d16a" stroke="#c49a2a" stroke-width="2"/></g></g>`;
    // slide on the left
    const slide = `<g transform="translate(150,640)"><path d="M-40,150 V0 H-10 V150" stroke="#6fb3e6" stroke-width="8" fill="none"/><path d="M-40,40 H-10 M-40,80 H-10 M-40,120 H-10" stroke="#6fb3e6" stroke-width="6"/>
      <path d="M-10,0 Q40,10 70,140 L94,150 L84,160 L56,148 Q30,30 -10,18Z" fill="#f48cc0" stroke="#c4568c" stroke-width="3" stroke-linejoin="round"/>
      <path d="M-46,0 H-4" stroke="#8a5a34" stroke-width="8" stroke-linecap="round"/></g>`;
    // kite on a long string
    const kite = `<path d="M600,250 Q640,520 700,760" stroke="#fff" stroke-width="1.6" fill="none" opacity=".7"/>
      <g class="kite" style="transform-origin:600px 250px"><path d="M600,190 L640,250 L600,320 L560,250Z" fill="#f48cc0" stroke="#c4568c" stroke-width="3" stroke-linejoin="round"/>
      <path d="M600,190 V320 M560,250 H640" stroke="#fff" stroke-width="2.5"/><path d="M600,190 L640,250 L600,250Z" fill="#f7d16a" opacity=".85"/>
      <path d="M600,320 q-14,20 0,40 q14,20 0,40" stroke="#6fb3e6" stroke-width="3" fill="none"/>
      ${[[600, 340, '#ef6f6c'], [600, 372, '#7fcf8a'], [600, 404, '#a58be0']].map(([x, y, c]) => `<path d="M${x - 8},${y} l8,-6 l8,6 l-8,6z" fill="${c}"/>`).join('')}</g>`;
    return `<svg viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg"><defs>${commonDefs}
      <linearGradient id="k-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8ccdf0"/><stop offset="1" stop-color="#eef8fc"/></linearGradient>
      <linearGradient id="k-glass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd36b"/><stop offset=".35" stop-color="#f48cc0"/><stop offset=".7" stop-color="#8f7fe0"/><stop offset="1" stop-color="#5aa9ec"/></linearGradient>
      <linearGradient id="k-tower" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#435060"/><stop offset=".5" stop-color="#232c37"/><stop offset="1" stop-color="#121820"/></linearGradient>
      <linearGradient id="k-mall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a62c0"/><stop offset="1" stop-color="#22408e"/></linearGradient>
      <linearGradient id="k-grass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fd06f"/><stop offset="1" stop-color="#5aa64c"/></linearGradient>
      <linearGradient id="k-water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6ec0e6"/><stop offset="1" stop-color="#3f92c4"/></linearGradient></defs>
      <rect width="1600" height="1000" fill="url(#k-sky)"/>
      ${sun(380, 140, 50)}${cloud(900, 120, .8, 100, -40)}${cloud(1350, 200, .55, 120, -10)}
      ${rainbow(860, 620, 420)}
      <path d="M0,560 Q200,470 420,520 Q600,460 820,510 Q1050,450 1280,510 Q1450,480 1600,520 L1600,640 L0,640Z" fill="#a9b8d8"/>
      <path d="M380,500 l-20,16 l16,-2 l8,10 l10,-20Z M1050,462 l-16,14 l14,-2 l6,8 l8,-16Z" fill="#fff" opacity=".85"/>
      ${tower}${mall}
      <path d="M600,660 Q870,500 1140,660Z" fill="#7dbf63"/>
      ${kirk}
      ${kite}
      <path d="M0,640 Q500,600 1000,640 T1600,630 L1600,1000 L0,1000Z" fill="url(#k-grass)"/>
      <path d="M-60,692 Q300,704 560,700 Q900,680 1200,700 T1660,720 L1660,752 Q1300,730 1200,734 T560,734 Q300,738 -60,726Z" fill="url(#k-water)" stroke="#3f86b6" stroke-width="2"/>
      ${[0, 1, 2].map(i => `<path d="M${640 + i * 300},${712 + i * 3} q40,-6 80,0" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" stroke-dasharray="16 22" class="flow" style="animation-duration:${2.2 + i * .4}s"/>`).join('')}
      ${ducks}
      ${bridge}
      ${birch(1020, 650, 1, 0)}${birch(1590, 660, 1.1, -1.5)}${birch(440, 655, .85, -2.4)}
      ${slide}${swing}
      ${Array.from({ length: 40 }, (_, i) => `<circle cx="${(i * 389) % 1600}" cy="${780 + (i * 97) % 210}" r="${3 + (i % 3)}" fill="${['#ffd84d', '#fff', '#b59be6'][i % 3]}"/>`).join('')}
    </svg>`;
  }

  /* ---------------- Scene 7: Strætó, the yellow city bus ----------------
     A close-up of the bus side. The open door is drawn exactly behind the doll, so
     she stands in the doorway; passengers (animals and her heart-jar friends) sit in
     the windows and the driver sits at the front looking ahead to the right.
     The app measures where the doll stands and passes it in (see busOptions in app.js):
       o = { doorX, groundY (scene units), k (bus scale), left, right (visible scene x range) }
     Bus drawing units: the door opening is 300 wide and 900 tall, its floor at (0,0).
     The passengers and the driver are NOT in this SVG: the app puts them in the window
     rectangles from busLayout(), clipped by the window, so they can be tapped. */
  const BUS = { winTop: -840, winBot: -470, winW: 230, gap: 30, driverW: 250, doorHalf: 150 };
  /** Where everything goes, in scene units, for the doll's current position. */
  function busLayout(o = {}) {
    const doorX = o.doorX ?? 520, groundY = o.groundY ?? 975, k = o.k ?? .95, left = o.left ?? 0, right = o.right ?? 1600;
    const rightSpace = (right - doorX) / k, leftSpace = (doorX - left) / k;
    // driver at the far right of what is visible (right next to the door on narrow screens)
    const driverX = Math.max(BUS.doorHalf + 40, Math.min(rightSpace - BUS.driverW - 30, 1400));
    /** Fill the stretch from a to b with as many windows as fit (at least 180 wide), sharing the space evenly. */
    const fill = (a, b) => {
      const span = b - a, n = Math.floor((span + BUS.gap) / (180 + BUS.gap));
      if (n < 1) return [];
      const w = Math.min(320, (span - (n - 1) * BUS.gap) / n), x0 = a + (span - (n * w + (n - 1) * BUS.gap)) / 2;
      return Array.from({ length: n }, (_, i) => ({ x: x0 + i * (w + BUS.gap), w }));
    };
    const wins = fill(BUS.doorHalf + 40, driverX - 40)                                   // between the door and the driver
      .concat(fill(-leftSpace - 40, -BUS.doorHalf - 40).reverse());                      // behind the door (nearest first)
    const rect = (lx, w) => ({ x: doorX + lx * k, y: groundY + BUS.winTop * k, w: w * k, h: (BUS.winBot - BUS.winTop) * k });
    return { doorX, groundY, k, left, right, driverX, wins, leftSpace,
      windows: wins.map(o => rect(o.x, o.w)), driver: rect(driverX, BUS.driverW) };
  }
  function bus(o) {
    const L = busLayout(o), k = L.k, T = BUS.winTop, B = BUS.winBot;
    const rearX = -L.leftSpace - 80, noseX = L.driverX + BUS.driverW + 230;
    /** Window: black rubber frame, dark glass, seat backs inside (the passengers sit in front of them). */
    const win = (x, w, seats) => `<rect x="${x - 10}" y="${T - 10}" width="${w + 20}" height="${B - T + 20}" rx="26" fill="#2a2e36"/>` +
      `<rect x="${x}" y="${T}" width="${w}" height="${B - T}" rx="18" fill="url(#bus-glass)"/>` +
      (seats ? [x + w * .28, x + w * .72].map(cx => `<rect x="${cx - 44}" y="${B - 120}" width="88" height="140" rx="22" fill="#c8453e" stroke="#8e2a26" stroke-width="5"/><path d="M${cx - 30},${B - 100} h60 M${cx - 30},${B - 70} h60" stroke="#e7766c" stroke-width="5" stroke-dasharray="6 8"/>`).join('') : '') +
      `<path d="M${x + 24},${T + 40} L${x + 70},${T + 10} M${x + 24},${T + 90} L${x + 120},${T + 18}" stroke="#fff" stroke-width="10" stroke-linecap="round" opacity=".18"/>`;
    const wheel = x => `<path d="M${x - 170},30 V-90 Q${x - 170},-170 ${x},-170 Q${x + 170},-170 ${x + 170},-90 V30Z" fill="#3a3f48"/>` +
      `<circle cx="${x}" cy="40" r="130" fill="#26292f"/><circle cx="${x}" cy="40" r="72" fill="#c9ccd4" stroke="#8a8e98" stroke-width="8"/><circle cx="${x}" cy="40" r="24" fill="#8a8e98"/>`;
    let parts = '';
    // body: long yellow side with a rounded nose at the front (right)
    parts += `<path d="M${rearX},-1080 H${noseX - 160} Q${noseX},-1080 ${noseX},-900 V-40 Q${noseX},30 ${noseX - 70},30 H${rearX}Z" fill="url(#bus-body)" stroke="#b8860b" stroke-width="6"/>`;
    parts += `<rect x="${rearX}" y="-420" width="${noseX - rearX}" height="34" fill="#e2a514"/><rect x="${rearX}" y="-60" width="${noseX - rearX}" height="90" fill="#4a4f5a"/>`;
    parts += wheel(-BUS.doorHalf - 420) + wheel(L.driverX + 120);
    // windows with seats, the driver's window (no seats, a dashboard instead) and the windscreen
    parts += L.wins.map(o => win(o.x, o.w, true)).join('');
    parts += win(L.driverX, BUS.driverW, false) + `<rect x="${L.driverX}" y="${B - 60}" width="${BUS.driverW}" height="60" rx="10" fill="#3a3f48"/>`;
    parts += `<path d="M${L.driverX + BUS.driverW + 40},${T} H${noseX - 60} Q${noseX - 20},${T + 120} ${noseX - 30},${B + 60} H${L.driverX + BUS.driverW + 40}Z" fill="url(#bus-glass)" stroke="#2a2e36" stroke-width="14" stroke-linejoin="round"/>`;
    // the door: dark inside, lit steps, hand poles, and the two glass door leaves folded open
    const D = BUS.doorHalf;
    parts += `<rect x="${-D - 34}" y="-934" width="${2 * D + 68}" height="964" rx="20" fill="#2a2e36"/>` +
      `<rect x="${-D}" y="-900" width="${2 * D}" height="900" fill="url(#bus-inside)"/>` +
      `<rect x="${-D}" y="-60" width="${2 * D}" height="60" fill="#8a919e"/><rect x="${-D}" y="-60" width="${2 * D}" height="8" fill="#ffd84a"/>` +
      `<path d="M${-D + 30},-880 V-60 M${D - 30},-880 V-60" stroke="#d6dbe3" stroke-width="12" stroke-linecap="round"/>` +
      `<path d="M${-D + 30},-520 h22 M${D - 30},-520 h-22" stroke="#ffd84a" stroke-width="14" stroke-linecap="round"/>` +
      [-1, 1].map(s => `<path d="M${s * D},-890 L${s * (D + 46)},-860 V-50 L${s * D},-20Z" fill="url(#bus-glass)" stroke="#2a2e36" stroke-width="8" stroke-linejoin="round"/>`).join('') +
      // little amber light above the door that blinks while the door is open
      `<circle class="twinkle" cx="0" cy="-960" r="18" fill="#ffb02e" stroke="#c4761a" stroke-width="4" style="animation-duration:1.2s"/>`;
    return `<svg viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg"><defs>${commonDefs}
      <linearGradient id="s-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#86c8ee"/><stop offset="1" stop-color="#e6f6fc"/></linearGradient>
      <linearGradient id="bus-body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe066"/><stop offset=".55" stop-color="#f7c825"/><stop offset="1" stop-color="#e8a913"/></linearGradient>
      <linearGradient id="bus-glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9cc7e2"/><stop offset=".5" stop-color="#5f8fb4"/><stop offset="1" stop-color="#3f6a8f"/></linearGradient>
      <linearGradient id="bus-inside" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a5262"/><stop offset="1" stop-color="#6c7586"/></linearGradient></defs>
      <rect width="1600" height="1000" fill="url(#s-sky)"/>
      ${sun(1380, 150, 50)}${cloud(400, 120, .8, 110, -30)}${cloud(1100, 200, .6, 130, -70)}
      ${rainbow(800, 700, 420)}
      <path d="M0,420 Q160,300 360,320 Q560,290 760,330 Q980,300 1200,340 Q1420,310 1600,350 L1600,1000 L0,1000Z" fill="#a9b8d8"/>
      <path d="M330,322 q-12,18 -20,30 M560,294 q-10,16 -16,28 M1000,304 q-8,14 -12,24" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity=".85"/>
      <g transform="translate(860,250)"><path d="M-10,150 V40 L0,0 L10,40 V150Z" fill="#efece6" stroke="#a9a49c" stroke-width="2"/>
        ${[1, 2, 3].map(i => `<rect x="${-10 - i * 8}" y="${40 + i * 26}" width="8" height="${110 - i * 26}" fill="#e2ded6" stroke="#a9a49c" stroke-width="1.5"/><rect x="${10 + (i - 1) * 8}" y="${40 + i * 26}" width="8" height="${110 - i * 26}" fill="#e2ded6" stroke="#a9a49c" stroke-width="1.5"/>`).join('')}</g>
      <path d="M0,640 Q300,560 640,610 T1300,590 T1600,600 L1600,1000 L0,1000Z" fill="#a8db8f"/>
      ${house(120, 640, 70, 60, '#ef8a7a', '#5a7fae')}${house(1220, 630, 70, 60, '#8fc6e2', '#c4504a')}${house(1320, 640, 60, 54, '#f7d16a', '#4f9a6a')}
      <rect y="940" width="1600" height="60" fill="#8e939c"/>
      <g transform="translate(${L.doorX.toFixed(1)},${L.groundY.toFixed(1)}) scale(${k.toFixed(4)})">${parts}</g>
    </svg>`;
  }

  /* =====================================================================
     Creatures: each returns a standalone SVG whose feet (or rock) sit on
     the bottom edge of its viewBox; the app places them by bottom-centre.
     Moving parts carry the classes app.css animates (wing, tail, head,
     arm, arm2, glow, sparkles .tw), each with transform-origin at its joint
     in viewBox units.
     Style follows the doll: soft gradients lit from the upper left, tinted
     outlines (never black), big eyes with white catchlights, a little blush.
     No SVG filters (slow on the old tablet). Def ids are prefixed per
     creature (cr-<name>-…) because several SVGs share one page.
     ===================================================================== */

  /* ---- small drawing helpers for the creatures ---- */
  const hexRgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  /** Mix two #rrggbb colours (t = 0 gives a, t = 1 gives b). */
  const cmix = (a, b, t) => { const A = hexRgb(a), B = hexRgb(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
  /** Outline colour for a fill: darker and slightly plum, the same rule as the doll (never black). */
  const cink = (h, t = .55) => cmix(h, '#3b2838', t);
  /** Gradient stops from [[offset, colour, opacity?], ...]. */
  const stops = s => s.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}"${a < 1 ? ` stop-opacity="${a}"` : ''}/>`).join('');
  /** Linear gradient. dir: 'v' top to bottom, 'h' left to right, 'd' upper left to lower right. */
  const lin = (id, s, dir = 'v') => { const [x2, y2] = dir === 'h' ? [1, 0] : dir === 'd' ? [1, 1] : [0, 1]; return `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops(s)}</linearGradient>`; };
  /** Radial gradient (cx, cy, r are fractions of the shape's box). The default centre is upper left, where the light comes from. */
  const rad = (id, s, cx = .38, cy = .32, r = .78) => `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops(s)}</radialGradient>`;
  /** Filled shape with a tinted outline. */
  const shape = (d, fill, line, w = 2.2, more = '') => `<path d="${d}" fill="${fill}" stroke="${line}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"${more}/>`;
  /** Open line (fur strokes, mouths, creases). */
  const stroke = (d, col, w = 1.6, op = 1) => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${op < 1 ? ` opacity="${op}"` : ''}/>`;
  /** Soft ellipse (glows, shadows, blush, spots). */
  const oval = (cx, cy, rx, ry, fill, op = 1, more = '') => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}"${op < 1 ? ` opacity="${op}"` : ''}${more}/>`;
  const r1 = n => Math.round(n * 10) / 10;
  /**
   * Fluffy outline through a closed list of points (clockwise on screen):
   * every edge bulges outward by bump × its length, which gives fleece, fur tufts and clouds.
   */
  const fluff = (pts, bump = .3) => {
    let d = `M${pts[0][0]},${pts[0][1]}`;
    pts.forEach((a, i) => {
      const b = pts[(i + 1) % pts.length], dx = b[0] - a[0], dy = b[1] - a[1];
      d += `Q${r1((a[0] + b[0]) / 2 + dy * bump)},${r1((a[1] + b[1]) / 2 - dx * bump)} ${b[0]},${b[1]}`;
    });
    return d + 'Z';
  };
  /** n points on an ellipse, clockwise from angle a0 (degrees). */
  const ring = (cx, cy, rx, ry, n, a0 = 0, jit = 0) => Array.from({ length: n }, (_, i) => {
    const a = (a0 + i * 360 / n) * Math.PI / 180, k = 1 + (i % 2 ? jit : -jit);
    return [r1(cx + Math.cos(a) * rx * k), r1(cy + Math.sin(a) * ry * k)];
  });
  /** The soft defs every creature uses: white glow, ground shadow, cheek blush and a dark eye (ids prefixed p). */
  const baseDefs = p => rad(`${p}-glow`, [[0, '#fff', .95], [1, '#fff', 0]], .5, .5, .5) +
    rad(`${p}-sh`, [[0, '#2a1d33', .36], [.6, '#2a1d33', .13], [1, '#2a1d33', 0]], .5, .5, .5) +
    rad(`${p}-blush`, [[0, '#f28a8c', .85], [.55, '#f28a8c', .38], [1, '#f28a8c', 0]], .5, .5, .5) +
    lin(`${p}-iris`, [[0, '#120d16'], [.5, '#2c2030'], [1, '#76544a']]);
  /** Big friendly eye: dark iris with a warm glow low down, a large catchlight upper right and a small one lower left (like the doll). */
  const bigEye = (p, cx, cy, rx, ry, line = '#2a1d26') =>
    oval(cx, cy, rx, ry, `url(#${p}-iris)`, 1, ` stroke="${line}" stroke-width="1.2"`) +
    oval(r1(cx + rx * .3), r1(cy - ry * .36), r1(rx * .44), r1(ry * .36), '#fff') +
    `<circle cx="${r1(cx - rx * .36)}" cy="${r1(cy + ry * .46)}" r="${r1(rx * .18)}" fill="#fff" opacity=".9"/>`;
  /** Four-pointed twinkle star path. */
  const twinkle = (x, y, r) => `M${x},${y - r}Q${x + r * .18},${y - r * .18} ${x + r},${y}Q${x + r * .18},${y + r * .18} ${x},${y + r}Q${x - r * .18},${y + r * .18} ${x - r},${y}Q${x - r * .18},${y - r * .18} ${x},${y - r}Z`;
  /** Wrap one creature drawing into its own standalone SVG. */
  const svgOf = (vb, p, defs, body) => `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg"><defs>${baseDefs(p)}${defs}</defs>${body}</svg>`;
  /**
   * One lock of hair (mane, tail, forelock): a curved teardrop hanging from its root (x,y).
   * len = length, w = width at the root, ang = rotation in degrees (0 hangs straight down,
   * positive swings it back/left), curl = how far the tip bends sideways.
   */
  const lock = (x, y, len, w, ang, curl, fill, line, sw = 1.6) =>
    `<path transform="translate(${r1(x)},${r1(y)}) rotate(${r1(ang)})" d="M${r1(-w / 2)},0C${r1(-w / 2)},${r1(len * .45)} ${r1(-w * .3 + curl * .4)},${r1(len * .8)} ${r1(curl)},${r1(len)}C${r1(w * .2 + curl * .5)},${r1(len * .72)} ${r1(w / 2)},${r1(len * .42)} ${r1(w / 2)},0Z" fill="${fill}" stroke="${line}" stroke-width="${sw}" stroke-linejoin="round"/>`;

  /**
   * Icelandic pony, used by both the horse and the unicorn. Side view facing right,
   * viewBox 220×180 with the hooves on the bottom edge. Short sturdy legs, round barrel,
   * thick neck, a big soft muzzle and a thick mane and forelock.
   * o: p (id prefix), coat [light, base, dark], muzzle colour, mane [lock colours, cycled],
   *    maneLine, hoof [light, dark], blaze (white stripe on the face), unicorn (horn, lashes, sparkles).
   */
  function pony(o) {
    const p = o.p, [cl, cb, cd] = o.coat, line = o.line || cink(cd, .5), mane = o.mane, ml = o.maneLine, M = i => mane[i % mane.length];
    // one silhouette for barrel, neck and the two near legs (no seams)
    const BODY = 'M58,80C78,70 106,82 130,78C138,77 142,74 146,70C150,58 156,46 164,36L182,52' +
      'C176,66 172,84 170,100C168,112 160,118 158,126C157,138 158,150 158,162L144,162C144,152 144,142 142,134C141,131 138,129 132,129' +
      'C116,134 98,134 86,130C83,136 80,142 79,150C78,154 78,158 78,162L64,162C64,156 62,151 58,146C51,138 47,126 46,112C45,96 48,84 58,80Z';
    const HEAD = 'M166,42C164,28 176,19 189,22C199,25 204,38 208,50C213,60 212,72 202,75C194,77 187,74 182,70C174,70 166,62 166,52C166,48 166,45 166,42Z';
    const defs = rad(`${p}-coat`, [[0, cl], [.5, cb], [1, cd]], .45, .2, .9) +
      lin(`${p}-far`, [[0, cmix(cb, cd, .6)], [1, cmix(cd, '#3b2838', .25)]]) +
      rad(`${p}-head`, [[0, cl], [.55, cb], [1, cd]], .3, .3, .85) +
      lin(`${p}-hoof`, [[0, o.hoof[0]], [1, o.hoof[1]]]) +
      rad(`${p}-muz`, [[0, cmix(o.muzzle, '#ffffff', .35)], [1, o.muzzle]], .4, .3, .8) +
      `<clipPath id="${p}-bc"><path d="${BODY}"/></clipPath><clipPath id="${p}-hc"><path d="${HEAD}"/></clipPath>` +
      (o.unicorn ? lin(`${p}-horn`, [[0, '#fff3b8'], [.5, '#f6cf55'], [1, '#d9a42a']], 'h') : '');
    const hoof = (x, w, far) => shape(`M${x},${162}h${w}c1,4 2,8 2,11h${-w - 3}c0,-4 0,-7 1,-11z`, `url(#${p}-hoof)`, cink(o.hoof[1], .4), 2, far ? ' opacity=".9"' : '');
    // tail: one full flowing shape from the croup to near the ground, with long locks on top for texture
    const TAIL = 'M62,78C44,72 28,84 24,104C20,124 22,146 16,162Q24,160 27,167Q33,158 38,165Q41,156 47,160Q44,146 46,132C48,116 46,104 54,92Z';
    const tailLocks = shape(TAIL, M(0), ml, 1.8) +
      [[14, 82, 16, 6], [4, 84, 14, -5], [22, 70, 12, 8], [-4, 72, 12, -4]].map(([a, len, w, c], i) => lock(46 + i * 1.5, 84 + i, len, w, a, c, M(i + 1), ml, 1.4)).join('') +
      stroke('M38,92C32,110 30,132 28,150M46,96C40,116 38,136 40,152', '#ffffff', 1.4, .45);
    // mane: a wavy band along the crest (poll to withers) with long locks hanging over the near side of the neck
    const crest = t => [(1 - t) * (1 - t) * 172 + 2 * (1 - t) * t * 154 + t * t * 140, (1 - t) * (1 - t) * 26 + 2 * (1 - t) * t * 40 + t * t * 78];
    const off = (t, k) => { const [x, y] = crest(t); return [r1(x + .85 * k), r1(y + .53 * k)]; };
    const band = [], ts = [0, .14, .28, .42, .56, .7, .84, 1];
    ts.forEach(t => band.push(off(t, 7)));
    ts.slice().reverse().forEach((t, i) => band.push(off(t, -11 + (i % 2) * 3)));
    let maneLocks = '';
    for (let i = 7; i >= 0; i--) {
      const t = .03 + i * .127, [x, y] = off(t, 4);
      maneLocks += lock(x, y, 40 + (i % 2) * 9 - i * 1.5, 17, 8 - i * 1.2 + (i % 2) * 5, i % 2 ? 4 : -4, M(i), ml);
    }
    const maneFront = maneLocks + shape(fluff(band, .22), M(0), ml, 1.8) +
      stroke(ts.slice(1, 7).map(t => { const [a, b] = off(t, -4), [c, d] = off(t + .06, 3); return `M${a},${b}L${c},${d}`; }).join(''), '#ffffff', 1.4, .45);
    const eye = o.unicorn
      ? bigEye(p, 186, 41, 5.6, 6.6) + stroke('M181,36q-4,-3 -6,-7M183.5,34.5q-2,-4 -2,-8M186.5,34q0,-4 2,-7', '#3a2838', 1.6)
      : bigEye(p, 186, 41, 5.4, 6.2) + stroke('M180,35.5q6,-4.5 12,0', cink(cb, .5), 1.4, .6);
    const horn = o.unicorn ? `<g>${shape('M182,25L198,2L192,29Z', `url(#${p}-horn)`, '#b9862a', 1.8)}` +
      stroke('M184.5,22.5l8,-2.5M187.5,17l7,-2.5M190.5,11.5l5.5,-2M193.5,6.5l3.5,-1.5', '#c9952a', 1.4) + stroke('M186,23L196,5', '#fffbe0', 1.4, .8) + '</g>' : '';
    const sparkles = o.unicorn ? `<g class="sparkles">${[[30, 34, 7], [110, 40, 6], [150, 14, 5], [212, 70, 6], [90, 152, 5]].map(([x, y, r], i) =>
      `<path class="tw" style="animation-delay:${i * .4}s" d="${twinkle(x, y, r)}" fill="#fff6b8" stroke="#f0c75a" stroke-width=".8"/>`).join('')}</g>` : '';
    const forelock = [[-30, 18, 11, -4], [-6, 20, 11, -5], [16, 16, 10, -3]].map(([a, len, w, c], i) => lock(179 + i * 3, 22 + i, len, w, a, c, M(i + 2), ml)).join('');
    return svgOf('0 0 220 180', p, defs,
      oval(112, 172, 84, 7, `url(#${p}-sh)`) +
      // tail (behind everything)
      `<g class="tail" style="transform-origin:56px 82px">${tailLocks}</g>` +
      // far legs, a shade darker
      shape('M84,120C88,132 92,142 92,150L92,162L105,162L104,148C103,138 102,128 100,118Z', `url(#${p}-far)`, line, 2.2) +
      shape('M126,118L128,162L141,162L140,118Z', `url(#${p}-far)`, line, 2.2) +
      hoof(91, 14, 1) + hoof(127, 14, 1) +
      // body with soft roundness: rump and shoulder highlights, darker belly and leg backs
      shape(BODY, `url(#${p}-coat)`, line, 2.4) +
      `<g clip-path="url(#${p}-bc)">` +
        oval(112, 132, 60, 14, cd, .35) + oval(70, 92, 18, 12, `url(#${p}-glow)`, .5) + oval(148, 90, 12, 14, `url(#${p}-glow)`, .35) +
        oval(150, 150, 5, 16, cd, .3) + oval(70, 150, 6, 14, cd, .3) +
      `</g>` +
      stroke('M146,84C152,96 152,110 146,122', line, 1.6, .35) + stroke('M60,88C72,96 76,110 72,124', line, 1.6, .35) +
      hoof(143, 15) + hoof(63, 15) +
      // mane locks that fall over the near side of the neck
      maneFront +
      // head (nods from the throat)
      `<g class="head" style="transform-origin:172px 60px">` +
        lock(170, 28, 15, 9, 168, 0, cmix(cb, cd, .5), line, 2) +
        horn +
        shape(HEAD, `url(#${p}-head)`, line, 2.4) +
        `<g clip-path="url(#${p}-hc)">` +
          shape('M196,56C204,52 214,58 214,68C214,78 200,80 190,76C186,70 188,60 196,56Z', `url(#${p}-muz)`, 'none', 0) +
          (o.blaze ? shape('M186,24C190,22 194,24 194,30C196,40 200,48 205,56L198,60C194,50 190,40 186,32Z', '#fff7ee', 'none', 0, ' opacity=".95"') : '') +
          oval(172, 56, 9, 10, cd, .18) +
        `</g>` +
        oval(178, 33, 9, 5, `url(#${p}-glow)`, .5) +
        eye +
        stroke('M203.5,58.5q3.5,-1 4.5,3', cink(o.muzzle, .55), 1.8) +
        stroke('M197,70.5q5,2.5 10,-1', cink(o.muzzle, .5), 1.8) +
        oval(193, 54, 6, 4, `url(#${p}-blush)`) +
        lock(176, 24, 17, 10, 186, 2, cb, line, 2) + oval(176, 16, 2, 5, cmix(cb, '#f2a0a8', .5), .8) +
        forelock +
      `</g>` + sparkles);
  }

  /**
   * Sitting plush friend (reward friends from the heart jar), front view, viewBox 120×130
   * (bunny ears reach higher, so it uses a taller box). Round head, pear body, little arms,
   * two feet with paw pads. Options:
   *   p id prefix, fur [light, base, dark], belly, muzzle, nose, earIn (inner ear),
   *   ears 'round' | 'cat' | 'bunny' | 'floppy' (earColor), mane [colours] (lion), spikes [light, dark] (hedgehog),
   *   tail 'lion' | 'cat' | 'puff' | 'curl', whiskers, stripes, stitch (teddy seams), bow colour.
   */
  function plush(o) {
    const p = o.p, [fl, fb, fd] = o.fur, line = o.line || cink(fd, .5);
    const fur = `url(#${p}-fur)`;
    const defs = rad(`${p}-fur`, [[0, fl], [.6, fb], [1, fd]], .4, .3, .85) +
      rad(`${p}-belly`, [[0, '#ffffff'], [.5, o.belly], [1, cmix(o.belly, fd, .35)]], .45, .3, .8) +
      (o.mane ? rad(`${p}-mane`, [[0, o.mane[0]], [.6, o.mane[1]], [1, o.mane[2]]], .5, .45, .6) : '') +
      (o.spikes ? rad(`${p}-spk`, [[0, o.spikes[0]], [1, o.spikes[1]]], .5, .6, .7) : '');
    const mirror = (d) => d.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, (m, x, y) => r1(120 - x) + ',' + y);
    let back = '', ears = '';
    // tail (behind the body, wags)
    if (o.tail === 'lion') back += `<g class="tail" style="transform-origin:88px 112px">` + stroke('M88,112C104,114 110,100 104,88', fd, 5) + shape(fluff(ring(104, 84, 7, 7, 7), .4), o.mane ? `url(#${p}-mane)` : fd, line, 1.6) + `</g>`;
    if (o.tail === 'cat') back += `<g class="tail" style="transform-origin:88px 114px">` + stroke('M88,114C108,116 112,96 104,84', line, 9) + stroke('M88,114C108,116 112,96 104,84', fb, 6) + `</g>`;
    if (o.tail === 'curl') back += `<g class="tail" style="transform-origin:88px 110px">` + stroke('M88,110C104,108 106,92 98,90C92,90 94,98 98,98', line, 8) + stroke('M88,110C104,108 106,92 98,90C92,90 94,98 98,98', fb, 5) + `</g>`;
    if (o.tail === 'puff') back += shape(fluff(ring(92, 114, 9, 8, 8), .4), '#ffffff', line, 1.6);
    // lion mane: a big fluffy ring behind the head
    if (o.mane) back += shape(fluff(ring(60, 48, 42, 40, 16, 0, .05), .32), `url(#${p}-mane)`, cink(o.mane[2], .45), 2);
    // hedgehog spikes: a spiky coat behind head and body
    if (o.spikes) {
      const pts = [];
      // symmetric arc over the top, from lower left round to lower right, alternating spike tips and dips
      for (let i = 0; i <= 22; i++) { const a = Math.PI - .3 + (Math.PI + .6) * i / 22, r = i % 2 ? 1.22 : 1; pts.push([r1(60 + Math.cos(a) * 46 * r), r1(78 + Math.sin(a) * 58 * r)]); }
      pts.push([98, 118], [22, 118]);
      back += shape('M' + pts.map(q => q.join(',')).join('L') + 'Z', `url(#${p}-spk)`, cink(o.spikes[1], .45), 2) +
        stroke(pts.slice(1, 22).filter((_, j) => j % 2 === 0).map(([x, y]) => `M${r1(60 + (x - 60) * .7)},${r1(78 + (y - 78) * .7)}L${x},${y}`).join(''), o.spikes[0], 1.6, .6);
    }
    // ears
    const earIn = o.earIn || cmix(fb, '#f7a6b8', .5);
    if (o.ears === 'round') ears = `<circle cx="35" cy="26" r="12" fill="${fur}" stroke="${line}" stroke-width="2"/><circle cx="85" cy="26" r="12" fill="${fur}" stroke="${line}" stroke-width="2"/>` +
      oval(36, 27, 6.5, 6.5, earIn) + oval(84, 27, 6.5, 6.5, earIn);
    if (o.ears === 'cat') { const e = 'M30,38L33,8L54,26Z', i = 'M35,32L37,16L48,26Z'; ears = shape(e, fur, line, 2) + shape(mirror(e), fur, line, 2) + shape(i, earIn, 'none', 0) + shape(mirror(i), earIn, 'none', 0); }
    if (o.ears === 'bunny') { const e = 'M44,26C34,10 34,-18 44,-22C54,-18 54,10 50,26Z', i = 'M45,20C39,8 39,-12 44,-15C49,-12 49,8 48,20Z'; ears = shape(e, fur, line, 2) + shape(mirror(e), fur, line, 2) + shape(i, earIn, 'none', 0) + shape(mirror(i), earIn, 'none', 0); }
    let front = '';
    if (o.ears === 'floppy') { const e = 'M34,28C20,30 14,52 20,64C28,70 36,58 38,40Z', ec = o.earColor || fd; front = shape(e, ec, cink(ec, .45), 2) + shape(mirror(e), ec, cink(ec, .45), 2); }
    const arm = 'M34,78C24,84 22,98 30,104C38,106 42,96 42,86Z';
    const feet = [42, 78].map(x => oval(x, 117, 14, 9, fur, 1, ` stroke="${line}" stroke-width="2"`) +
      oval(x, 119, 6, 4, o.pad || earIn) + [-6, 0, 6].map(dx => oval(x + dx, 112.5, 2.2, 1.8, o.pad || earIn)).join('')).join('');
    const whiskers = o.whiskers ? stroke('M49,56L34,52M49,59L34,60', cink(fb, .4), 1.2, .7) + stroke(mirror('M49,56L34,52M49,59L34,60'), cink(fb, .4), 1.2, .7) : '';
    const headStripes = o.stripes ? stroke('M54,20l2,7M60,19v8M66,20l-2,7', fd, 2.4, .7) : '';
    const armStripes = o.stripes ? stroke('M27,92q5,2 10,0M83,92q5,2 10,0', fd, 2, .6) : '';
    const stitch = o.stitch ? `<path d="M60,74V116" stroke="${cink(o.belly, .3)}" stroke-width="1.4" stroke-dasharray="3 3" fill="none"/>` : '';
    const bow = o.bow ? shape('M60,70l-11,-7v14z M60,70l11,-7v14z', o.bow, cink(o.bow, .5), 1.8) + `<circle cx="60" cy="70" r="3.4" fill="${o.bow}" stroke="${cink(o.bow, .5)}" stroke-width="1.6"/>` : '';
    const vb = o.ears === 'bunny' ? '0 -26 120 156' : '0 0 120 130';
    return svgOf(vb, p, defs,
      oval(60, 126, 42, 5, `url(#${p}-sh)`) + back +
      // body, belly, arms and feet
      shape('M60,60C84,60 96,82 96,100C96,118 82,124 60,124C38,124 24,118 24,100C24,82 36,60 60,60Z', fur, line, 2.2) +
      oval(60, 100, 20, 17, `url(#${p}-belly)`) + stitch +
      shape(arm, fur, line, 2) + shape(mirror(arm), fur, line, 2) + armStripes + feet +
      // head (nods from the neck)
      `<g class="head" style="transform-origin:60px 70px">` + ears +
        shape('M60,19C80,19 91,32 91,47C91,62 78,72 60,72C42,72 29,62 29,47C29,32 40,19 60,19Z', fur, line, 2.2) + front +
        oval(52, 30, 10, 6, `url(#${p}-glow)`, .5) + headStripes +
        oval(60, 57, 13, 9.5, o.muzzle) +
        bigEye(p, 48, 43, 4.4, 5.2) + bigEye(p, 72, 43, 4.4, 5.2) +
        shape('M55,51.5q5,-3 10,0q-1,4 -5,5q-4,-1 -5,-5Z', o.nose, cink(o.nose, .45), 1.2) +
        stroke('M60,56.5v2.5M55.5,59.5q4.5,3.5 9,0', cink(o.muzzle, .6), 1.5) + whiskers +
        oval(40, 54, 6, 4, `url(#${p}-blush)`) + oval(80, 54, 6, 4, `url(#${p}-blush)`) +
      `</g>` + bow);
  }

  const C = {
    /** Atlantic puffin, upright, side view facing right: black back and cap, white face disc with a grey cheek, big striped beak, orange feet. */
    puffin: () => {
      const p = 'cr-puffin';
      const BEAK = 'M83,28C91,27 99,33 104,41C107,46 105,50 100,52C94,54 89,55 84,56C82,46 82,37 83,28Z';
      const foot = x => shape(`M${x - 3},128h7v9C${x + 10},138 ${x + 16},141 ${x + 20},145C${x + 16},148 ${x + 12},146 ${x + 9},148C${x + 6},149 ${x + 3},147 ${x},148C${x - 4},149 ${x - 8},148 ${x - 8},145C${x - 6},141 ${x - 4},139 ${x - 3},137Z`, `url(#${p}-foot)`, '#b24e22', 2) +
        stroke(`M${x + 1},140l7,6M${x + 4},139l12,6`, '#d65e26', 1.3, .7);
      const defs = rad(`${p}-blk`, [[0, '#5a5b70'], [.45, '#2e2e3c'], [1, '#18161f']], .32, .2, .9) +
        rad(`${p}-face`, [[0, '#ffffff'], [.55, '#f4f3ef'], [1, '#c4c6d1']], .6, .3, .75) +
        rad(`${p}-belly`, [[0, '#ffffff'], [.6, '#f5f4f0'], [1, '#c9cbd6']], .65, .2, .9) +
        lin(`${p}-beak`, [[0, '#ffa255'], [1, '#e9532d']]) +
        lin(`${p}-foot`, [[0, '#ffa552'], [1, '#e8682a']]) +
        `<clipPath id="${p}-bk"><path d="${BEAK}"/></clipPath>`;
      const blk = `url(#${p}-blk)`, line = '#1d1824';
      return svgOf('0 0 120 150', p, defs,
        oval(60, 146, 34, 5, `url(#${p}-sh)`) +
        foot(44) + foot(66) +
        // round body and head in one dark silhouette
        shape('M58,58C80,56 93,82 93,103C93,124 79,136 58,136C37,136 23,125 23,104C23,84 36,60 58,58Z', blk, line, 2.2) +
        // white belly on the front
        shape('M80,74C93,88 95,110 89,122C83,132 70,137 56,136C49,124 50,104 58,90C64,81 72,76 80,74Z', `url(#${p}-belly)`, '#9a9caa', 1.8) +
        oval(37, 92, 6, 14, `url(#${p}-glow)`, .25) +
        // folded wing (flaps when tapped)
        `<g class="wing" style="transform-origin:52px 78px">` +
          shape('M50,74C38,80 31,94 31,110C31,120 34,128 38,132L42,128L44,133L48,127C54,116 58,102 58,88C58,80 55,75 50,74Z', blk, line, 2) +
          stroke('M54,80C57,92 55,108 48,124', '#6a6c82', 1.6, .8) + stroke('M44,92C42,104 40,114 39,124M50,96C48,106 46,114 44,122', '#4a4b5e', 1.2, .8) +
        `</g>` +
        // head: black cap and nape, white face disc with grey cheek
        `<circle cx="62" cy="44" r="27" fill="${blk}" stroke="${line}" stroke-width="2.2"/>` +
        oval(50, 27, 10, 6, `url(#${p}-glow)`, .4) +
        shape('M38,48C39,37 49,31 61,30C71,29 79,28 84,30L86,54C80,63 72,68 62,68C50,68 40,60 38,50Z', `url(#${p}-face)`, '#8d909e', 1.6) +
        oval(52, 57, 12, 8, '#9aa0b2', .35) +
        stroke('M61,44q-6,2.5 -13,1', '#7d8192', 1.6, .8) +
        shape('M66,35.5l2,-5.5l2.4,5.5z', '#8a8e9c', 'none', 0) +
        // eye with its little red ring
        oval(68, 42, 6.8, 7.4, 'none', 1, ' stroke="#f07a5a" stroke-width="1.5"') + bigEye(p, 68, 42, 5.2, 5.8) +
        oval(75, 55, 6, 4, `url(#${p}-blush)`) +
        // beak: blue-grey base, yellow ridge, orange outer half with grooves, yellow gape
        `<g clip-path="url(#${p}-bk)"><rect x="80" y="20" width="40" height="40" fill="url(#${p}-beak)"/>` +
          '<rect x="80" y="20" width="7.5" height="40" fill="#8a97b0"/><rect x="87.5" y="20" width="2.5" height="40" fill="#ffd24d"/>' +
          stroke('M94,32C97,38 98,46 96,54M99,36C101,42 101,48 100,53', '#ffcf73', 2) + oval(96, 34, 4, 2.5, '#fff', .4) + `</g>` +
        shape(BEAK, 'none', '#a8442a', 2) +
        stroke('M85,48.5C92,48.5 98,48.5 104,47', '#b2452a', 1.6) +
        `<circle cx="84.5" cy="49.5" r="2.8" fill="#ffcc4d" stroke="#d48a2a" stroke-width="1"/>`);
    },

    /** Icelandic horse: chestnut pony with a thick flaxen mane, forelock and tail, and a white blaze. */
    horse: () => pony({ p: 'cr-horse', coat: ['#e0a06b', '#b8693a', '#874521'], muzzle: '#d9a07c', mane: ['#f7e7bd', '#ecd49c', '#fbf0d2', '#e2c387'], maneLine: '#b08d55', hoof: ['#7a6258', '#4a3a36'], blaze: true }),

    /** Unicorn: white pony with a pastel rainbow mane and tail, golden spiral horn and gold hooves. */
    unicorn: () => pony({ p: 'cr-unicorn', coat: ['#ffffff', '#fbf8ff', '#d9d0ee'], line: '#a99cc6', muzzle: '#fbe3ef', mane: ['#ffb3d6', '#ffcfa6', '#fff0a6', '#b9efc8', '#a9dcff', '#d3bcff'], maneLine: '#b98bc0', hoof: ['#ffe58a', '#e0a92e'], unicorn: true }),

    /** Icelandic sheep: fluffy cream fleece, friendly face turned to us, little curled horns. */
    sheep: () => {
      const p = 'cr-sheep';
      const FLEECE = fluff(ring(76, 74, 52, 32, 16, 180, .03), .2);
      const leg = (x, far) => shape(`M${x - 4.5},92C${x - 4.5},102 ${x - 3.5},108 ${x - 3.5},117L${x + 3.5},117C${x + 3.5},108 ${x + 4.5},102 ${x + 4.5},92Z`, far ? `url(#${p}-legf)` : `url(#${p}-leg)`, '#8a7264', 1.8) +
        shape(`M${x - 3.8},116h7.6l1,6h-9.6z`, '#6a5550', '#4a3a38', 1.4);
      const defs = rad(`${p}-wool`, [[0, '#ffffff'], [.55, '#f8f2e8'], [1, '#d9cbb8']], .4, .25, .85) +
        rad(`${p}-face`, [[0, '#fffaf4'], [.6, '#f3e5d6'], [1, '#d8bea7']], .4, .3, .8) +
        lin(`${p}-leg`, [[0, '#e6d5c4'], [.5, '#d2bba6'], [1, '#ab927e']], 'h') + lin(`${p}-legf`, [[0, '#b9a18d'], [1, '#97806e']], 'h') +
        lin(`${p}-horn`, [[0, '#f6ead2'], [1, '#c9b18a']]) + `<clipPath id="${p}-fc"><path d="${FLEECE}"/></clipPath>`;
      const curls = [[44, 64], [62, 54], [84, 56], [104, 66], [52, 86], [74, 80], [96, 88], [34, 78], [70, 66], [116, 82]]
        .map(([x, y]) => `M${x - 4},${y}q4,-5 8,0q-1,4 -4,3`).join('');
      const tuft = fluff(ring(128, 47, 13, 8, 8, 180, .05), .32);
      return svgOf('0 0 160 130', p, defs,
        oval(80, 125, 56, 5, `url(#${p}-sh)`) +
        leg(60, 1) + leg(98, 1) + leg(46) + leg(112) +
        shape(fluff(ring(24, 68, 7, 6, 6, 0), .35), `url(#${p}-wool)`, '#b6a68f', 2) +
        shape(FLEECE, `url(#${p}-wool)`, '#b6a68f', 2.2) +
        `<g clip-path="url(#${p}-fc)">${oval(76, 100, 56, 12, '#cdbca4', .35)}${oval(58, 60, 26, 12, `url(#${p}-glow)`, .55)}</g>` +
        stroke(curls, '#d6c7b1', 1.6, .9) +
        // head turned towards us (nods from the neck)
        `<g class="head" style="transform-origin:120px 76px">` +
          shape('M114,60C106,56 98,58 94,64C100,68 108,68 114,66Z', `url(#${p}-face)`, '#a88d7a', 2) + stroke('M110,62.5C105,61.5 101,62.5 98,64', '#f0a9a6', 2.2, .8) +
          shape('M142,60C150,56 158,58 162,64C156,68 148,68 142,66Z', `url(#${p}-face)`, '#a88d7a', 2) + stroke('M146,62.5C151,61.5 155,62.5 158,64', '#f0a9a6', 2.2, .8) +
          stroke('M117,52C108,47 104,56 110,59C114,61 116,57 113,55', `url(#${p}-horn)`, 4.2) + stroke('M139,52C148,47 152,56 146,59C142,61 140,57 143,55', `url(#${p}-horn)`, 4.2) +
          shape('M128,46C140,46 146,56 145,68C144,80 138,90 128,90C118,90 112,80 111,68C110,56 116,46 128,46Z', `url(#${p}-face)`, '#a88d7a', 2.2) +
          oval(128, 82, 10, 7, '#f2d6c6', .8) +
          shape(tuft, `url(#${p}-wool)`, '#b6a68f', 2) +
          bigEye(p, 121, 68, 3.8, 4.6) + bigEye(p, 135, 68, 3.8, 4.6) +
          stroke('M116.5,62q4.5,-2.5 9,0M130.5,62q4.5,-2.5 9,0', '#a88d7a', 1.2, .7) +
          shape('M125,79.5q3,-1.5 6,0q-1,2.4 -3,2.6q-2,-.2 -3,-2.6Z', '#d98c95', '#b5677a', 1) +
          stroke('M128,82v2.5M124,85q4,3 8,0', '#a46676', 1.4) +
          oval(116, 77, 5, 3.4, `url(#${p}-blush)`) + oval(140, 77, 5, 3.4, `url(#${p}-blush)`) +
        `</g>`);
    },

    /** Arctic fox in its white winter coat: very fluffy tail, small round ears, dark nose, face turned towards us. */
    fox: () => {
      const p = 'cr-fox', line = '#9aa6bd';
      const TAIL = fluff([[62, 68], [58, 82], [46, 90], [30, 90], [16, 82], [8, 68], [6, 52], [10, 38], [18, 28], [30, 24], [40, 28], [43, 40], [41, 52], [46, 62], [54, 66]], .2);
      const BODY = fluff([[62, 60], [80, 54], [100, 54], [116, 52], [128, 62], [126, 80], [116, 92], [96, 95], [76, 95], [60, 90], [52, 76]], .14);
      const HEAD = fluff([[116, 32], [130, 28], [144, 32], [152, 42], [158, 52], [156, 60], [146, 66], [134, 70], [122, 68], [112, 62], [106, 54], [110, 42]], .1);
      const leg = (x, far) => shape(`M${x - 6},84C${x - 6},96 ${x - 5},104 ${x - 5},110C${x - 7},114 ${x - 6},118 ${x},118C${x + 6},118 ${x + 7},114 ${x + 5},110C${x + 5},104 ${x + 6},96 ${x + 6},84Z`, far ? `url(#${p}-far)` : `url(#${p}-fur)`, line, 2) +
        stroke(`M${x - 2},114v3M${x + 2},114v3`, line, 1.1, .8);
      const ear = (x, y, a) => `<g transform="translate(${x},${y}) rotate(${a})">${shape('M-8,8C-9,-2 -5,-10 0,-12C5,-10 9,-2 8,8Z', `url(#${p}-fur)`, line, 2)}${shape('M-4,6C-4.5,0 -2.5,-5 0,-7C2.5,-5 4.5,0 4,6Z', '#c9bfd2', 'none', 0)}</g>`;
      const defs = rad(`${p}-fur`, [[0, '#ffffff'], [.6, '#f7f8fd'], [1, '#d2d9e8']], .38, .25, .85) +
        lin(`${p}-far`, [[0, '#dde2ee'], [1, '#c3cbdd']]) +
        rad(`${p}-tail`, [[0, '#ffffff'], [.6, '#f6f7fc'], [1, '#d4dbea']], .55, .3, .8);
      return svgOf('0 0 170 125', p, defs,
        oval(90, 120, 58, 5, `url(#${p}-sh)`) +
        // big fluffy tail (sways)
        `<g class="tail" style="transform-origin:58px 72px">${shape(TAIL, `url(#${p}-tail)`, line, 2.2)}` +
          stroke('M22,44C20,58 26,72 40,80M32,40C30,54 34,66 48,74M14,52C14,66 20,76 30,84', '#d8deec', 1.6, .9) + oval(22, 40, 8, 11, `url(#${p}-glow)`, .8) + '</g>' +
        leg(76, 1) + leg(112, 1) + leg(64) + leg(122) +
        shape(BODY, `url(#${p}-fur)`, line, 2.2) +
        stroke('M70,82q6,4 12,2M92,86q6,3 12,0', '#d3d9e8', 1.6) +
        oval(84, 64, 18, 7, `url(#${p}-glow)`, .55) +
        // fluffy chest ruff
        shape(fluff([[112, 60], [126, 58], [134, 70], [130, 84], [120, 90], [112, 80]], .2), `url(#${p}-fur)`, line, 2) +
        // head with a short muzzle pointing right (nods from the neck)
        `<g class="head" style="transform-origin:122px 64px">` +
          ear(118, 30, -14) + ear(142, 28, 16) +
          shape(HEAD, `url(#${p}-fur)`, line, 2.2) +
          shape('M128,54C136,50 148,50 157,54C160,56 159,60 155,62C148,66 136,66 129,62C126,60 126,56 128,54Z', '#ffffff', 'none', 0) +
          oval(124, 38, 8, 5, `url(#${p}-glow)`, .7) +
          bigEye(p, 125, 47, 4.6, 5.4) + bigEye(p, 141, 46, 4, 5.2) +
          shape('M151,51.5C154,50 158.5,50.5 159,53C159,56 156,57.5 154,57.5C151.5,57.5 149.5,54 151,51.5Z', '#2b2433', '#1f1a27', 1.2) + oval(153.5, 52.5, 1.6, 1, '#fff', .7) +
          stroke('M154.5,57.5q-1,4 -5,4.5q-4,0 -6,-3', '#7b738c', 1.5) +
          oval(118, 57, 5.5, 3.6, `url(#${p}-blush)`) + oval(146, 59, 4.5, 3, `url(#${p}-blush)`, .8) +
        `</g>`);
    },

    /** Harbour seal resting on a dark beach rock (the rock is part of the drawing; no water). Grey with darker spots. */
    seal: () => {
      const p = 'cr-seal', line = '#5d6677';
      const ROCK = 'M6,125C4,110 12,98 28,94C48,88 70,92 94,90C118,88 142,86 160,94C174,100 178,114 176,125Z';
      const BODY = 'M28,84C38,72 60,68 86,68C104,68 116,64 124,56L156,58C158,72 152,86 140,92C116,98 76,98 44,96C34,95 26,90 28,84Z';
      const HEAD = 'M118,44C118,28 130,19 143,19C157,19 167,30 167,44C167,58 157,67 143,67C129,67 118,58 118,44Z';
      const spots = [[52, 76, 2.4], [62, 80, 1.8], [72, 74, 2.6], [84, 78, 2], [94, 72, 2.2], [102, 80, 1.8], [44, 84, 1.8], [112, 70, 2], [80, 86, 1.6], [66, 88, 1.5], [130, 30, 1.6], [154, 28, 1.4], [124, 52, 1.4]];
      const defs = rad(`${p}-fur`, [[0, '#d2d8e0'], [.5, '#a4aebb'], [1, '#76808f']], .42, .2, .9) +
        rad(`${p}-head`, [[0, '#dce1e8'], [.55, '#aab4c1'], [1, '#7d8796']], .35, .25, .85) +
        lin(`${p}-rock`, [[0, '#575a64'], [.5, '#3c3e47'], [1, '#26272e']]) +
        `<clipPath id="${p}-bc"><path d="${BODY}"/></clipPath>`;
      return svgOf('0 0 180 125', p, defs,
        // dark basalt rock with a lighter top edge, speckles and a bit of seaweed
        shape(ROCK, `url(#${p}-rock)`, '#1f1f26', 2.2) +
        stroke('M20,98C40,90 70,94 96,92C120,90 140,88 158,96', '#7a7d88', 3, .6) +
        stroke('M40,110q14,-4 26,2M110,108q16,-5 30,1', '#2d2e36', 2.4, .7) +
        [[30, 106], [58, 116], [88, 104], [124, 114], [150, 106], [72, 100], [140, 118]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6" fill="#6c6f7a"/>`).join('') +
        oval(156, 110, 6, 3.5, '#6d7079') + oval(30, 116, 4, 2.5, '#6d7079') +
        oval(86, 97, 64, 5, '#1a1a20', .4) +
        // hind flippers (wiggle when tapped)
        `<g class="arm2" style="transform-origin:32px 86px">` +
          shape('M34,84C26,80 16,72 8,68C5,72 7,79 12,82C7,84 5,90 9,93C16,93 25,91 34,90Z', `url(#${p}-fur)`, line, 2) +
          stroke('M28,84l-14,-8M28,88l-14,2', '#7c8696', 1.2, .8) + '</g>' +
        // long round body lying on its belly
        shape(BODY, `url(#${p}-fur)`, line, 2.4) +
        `<g clip-path="url(#${p}-bc)">${oval(90, 98, 70, 9, '#e6eaef', .7)}${oval(76, 74, 30, 6, `url(#${p}-glow)`, .5)}` +
          spots.slice(0, 10).map(([x, y, r]) => oval(x, y, r * 1.3, r, '#5f6878', .55)).join('') + '</g>' +
        // front flipper resting on the rock (flaps when tapped)
        `<g class="arm" style="transform-origin:122px 80px">` +
          shape('M118,76C127,78 135,86 139,94C134,98 125,97 119,92C115,88 113,80 118,76Z', `url(#${p}-fur)`, line, 2) +
          stroke('M128,90l6,4M124,92l5,3', '#7c8696', 1.1, .8) + '</g>' +
        // round head turned towards us
        shape(HEAD, `url(#${p}-head)`, line, 2.4) +
        spots.slice(10).map(([x, y, r]) => oval(x, y, r * 1.3, r, '#5f6878', .5)).join('') +
        oval(132, 30, 9, 6, `url(#${p}-glow)`, .6) +
        bigEye(p, 133, 41, 5.8, 6.6) + bigEye(p, 153, 41, 5.8, 6.6) +
        oval(138, 53, 6.5, 5, '#e4e8ee') + oval(148, 53, 6.5, 5, '#e4e8ee') +
        `<circle cx="136" cy="52" r=".8" fill="#6a7383"/><circle cx="139" cy="54.5" r=".8" fill="#6a7383"/><circle cx="147" cy="54.5" r=".8" fill="#6a7383"/><circle cx="150" cy="52" r=".8" fill="#6a7383"/>` +
        shape('M139.5,47.5C141.5,46 145.5,46 147.5,47.5C147,50 145,51.5 143.5,51.5C142,51.5 140,50 139.5,47.5Z', '#2b2532', '#1f1a26', 1) + oval(142.5, 47.8, 1.6, .8, '#fff', .6) +
        stroke('M143.5,51.5v2.5M139.5,57q4,2.5 8,0', '#4d5463', 1.4) +
        stroke('M132,52l-14,-2M132,55l-13,3M154,52l14,-2M154,55l13,3', '#ffffff', 1.1, .85) +
        oval(127, 50, 5, 3.4, `url(#${p}-blush)`) + oval(159, 50, 5, 3.4, `url(#${p}-blush)`));
    },

    /** Small friendly Christmas lad (jólasveinn-ish): red pointy hat, green tunic, rosy cheeks, doll-style face. lantern = carries a glowing lantern. */
    elf: (lantern) => {
      const p = 'cr-elf';
      const SK = { base: '#f7d7c3', light: '#fdeadd', shade: '#eab49c', line: '#c2857a' };
      const eye = (cx, cy) => oval(cx, cy, 4.8, 5.8, '#fff', 1, ' stroke="#b49094" stroke-width=".8"') +
        oval(cx, cy + .8, 4, 4.8, `url(#${p}-eye)`, 1, ' stroke="#4a2e22" stroke-width=".9"') +
        oval(cx, cy + 1, 2, 2.4, '#1e1620') + oval(cx + 1.6, cy - 1.2, 1.7, 1.5, '#fff') + `<circle cx="${cx - 1.6}" cy="${cy + 2.8}" r=".8" fill="#fff"/>` +
        stroke(`M${cx - 5.2},${cy - 1.8}Q${cx},${cy - 7.6} ${cx + 5.2},${cy - 2.2}`, '#3a2830', 1.8);
      const sleeve = d => shape(d, `url(#${p}-tunic)`, '#2f6a3e', 2);
      const hand = (x, y) => shape(`M${x - 4.5},${y - 3}C${x - 6},${y + 2} ${x - 3},${y + 6} ${x},${y + 6}C${x + 4},${y + 6} ${x + 6},${y + 2} ${x + 4.5},${y - 3}Z`, `url(#${p}-skin)`, SK.line, 1.6);
      const defs = rad(`${p}-skin`, [[0, SK.light], [.6, SK.base], [1, SK.shade]], .4, .35, .75) +
        lin(`${p}-eye`, [[0, '#4a2a18'], [.5, '#8a5a32'], [1, '#d3a46a']]) +
        rad(`${p}-hat`, [[0, '#ff8a80'], [.5, '#e3463f'], [1, '#a92a2e']], .3, .3, .9) +
        rad(`${p}-tunic`, [[0, '#7fcf86'], [.55, '#43a05a'], [1, '#2c7343']], .35, .2, .9) +
        lin(`${p}-hair`, [[0, '#efbf88'], [1, '#b8723f']]) +
        rad(`${p}-lamp`, [[0, '#fff7c8'], [.6, '#ffd36b'], [1, '#ffb347']], .5, .5, .6) +
        rad(`${p}-halo`, [[0, '#ffe08a', .85], [1, '#ffe08a', 0]], .5, .5, .5);
      const lamp = lantern ? stroke('M24,121v7', '#5e3b26', 1.6) +
        `<circle class="glow" cx="24" cy="137" r="16" fill="url(#${p}-halo)"/>` +
        shape('M17,129h14l-1,15h-12z', `url(#${p}-lamp)`, '#6b4426', 1.8) + shape('M15,127h18v3h-18zM16,144h16v2.5h-16z', '#7a4e2c', '#5e3b26', 1.2) +
        stroke('M21,130v13M27,130v13', '#b07a3e', 1, .7) : '';
      return svgOf('0 0 100 150', p, defs,
        oval(50, 146, 26, 4, `url(#${p}-sh)`) +
        // striped stockings and curly-toed brown shoes
        shape('M40,118h8v18h-8zM52,118h8v18h-8z', '#fff6f0', '#c2857a', 1.6) +
        stroke('M40,122h8M40,127h8M40,132h8M52,122h8M52,127h8M52,132h8', '#e3463f', 2.6) +
        shape('M48,134C48,141 44,145 36,145C30,145 27,142 28,139C32,140 35,138 38,135C40,134 44,133 48,134Z', '#8b5a3a', '#5e3b26', 1.8) +
        shape('M52,134C52,141 56,145 64,145C70,145 73,142 72,139C68,140 65,138 62,135C60,134 56,133 52,134Z', '#8b5a3a', '#5e3b26', 1.8) +
        // left arm hanging down (holds the lantern at night)
        sleeve('M36,92C30,98 26,108 24,116L31,118C33,110 36,102 40,96Z') + hand(27.5, 118) + lamp +
        // tunic with a scalloped hem, belt and buckle
        shape('M38,88C30,98 28,112 27,122Q33,126 38,122Q44,126 50,122Q56,126 62,122Q67,126 73,122C72,112 70,98 62,88Z', `url(#${p}-tunic)`, '#2f6a3e', 2.2) +
        stroke('M29,121Q33,125 38,121Q44,125 50,121Q56,125 62,121Q67,125 71,121', '#e8f6e4', 1.6, .8) +
        shape('M31,106h38v6h-38z', '#7a4e2c', '#5e3b26', 1.4) + shape('M46,105h8v8h-8z', 'none', '#f2c94c', 1.8) +
        oval(40, 98, 4, 8, `url(#${p}-glow)`, .35) +
        // red collar
        shape('M36,88Q50,96 64,88L62,94Q50,101 38,94Z', '#e3463f', '#a92a2e', 1.6) +
        // right arm waving
        `<g class="arm" style="transform-origin:62px 93px">${sleeve('M60,90C68,90 74,84 78,76L84,80C80,90 72,98 62,98Z')}${hand(81, 74).replace(/<path /, '<path transform="rotate(200 81 77)" ')}</g>` +
        // pointy ears, face, hair tufts
        shape('M30,62C24,60 18,54 16,50C22,50 28,52 32,56Z', `url(#${p}-skin)`, SK.line, 1.6) +
        shape('M70,62C76,60 82,54 84,50C78,50 72,52 68,56Z', `url(#${p}-skin)`, SK.line, 1.6) +
        shape('M28,64C28,50 38,44 50,44C62,44 72,50 72,64C72,78 62,87 50,87C38,87 28,78 28,64Z', `url(#${p}-skin)`, SK.line, 2) +
        shape('M29,58C28,64 30,68 33,70C33,64 34,60 37,56ZM71,58C72,64 70,68 67,70C67,64 66,60 63,56Z', `url(#${p}-hair)`, '#8a5a32', 1.4) +
        // face: blush, eyes, brows, nose, happy open smile
        oval(36, 75, 6, 4, `url(#${p}-blush)`) + oval(64, 75, 6, 4, `url(#${p}-blush)`) +
        eye(41, 66) + eye(59, 66) +
        stroke('M36.5,55.5q4.5,-3 9,-1M54.5,54.5q4.5,-2 9,1', '#b8723f', 1.4) +
        oval(50, 73, 2.4, 1.8, '#eba792') + `<circle cx="49.4" cy="72.4" r=".7" fill="#fff" opacity=".8"/>` +
        shape('M44,78Q50,86 56,78Q50,80 44,78Z', '#b8424f', '#963443', 1.2) + shape('M46.5,81Q50,84 53.5,81Q50,82 46.5,81Z', '#ef8f98', 'none', 0) +
        [[35, 71], [38, 73], [62, 73], [65, 71]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".7" fill="#c98a6a" opacity=".7"/>`).join('') +
        // red pointy hat flopping to the side, white fur brim, pom-pom
        shape('M27,54C27,34 38,18 54,10C64,5 76,6 84,14C78,13 72,15 68,22C69,32 72,42 73,54Z', `url(#${p}-hat)`, '#a32a2e', 2.2) +
        stroke('M42,24C48,18 56,13 64,11', '#ff9d94', 2, .7) +
        shape('M24,55C24,48 36,44 50,44C64,44 76,48 76,55C76,60 72,61 68,59C60,56 40,56 32,59C28,61 24,60 24,55Z', '#fbf7f2', '#c9bcb4', 1.8) +
        stroke('M30,52q3,2 6,0M42,50q3,2 6,0M54,50q3,2 6,0M66,52q3,2 6,0', '#e2d8d0', 1.4) +
        shape(fluff(ring(86, 15, 7, 7, 8, 0), .3), '#fbf7f2', '#c9bcb4', 1.6));
    },
  };

  /**
   * Bus driver, seated, seen from the side looking ahead to the right, hands on the big
   * steering wheel. Only the upper body shows in the driver's window. The near arm has
   * class "arm" (shoulder pivot) so a tap makes the driver wave.
   */
  C.driver = () => {
    const p = 'cr-driver', skin = '#f2c9a8', line = '#b98a74';
    const defs = lin(`${p}-shirt`, [[0, '#7fb0e6'], [1, '#4a78b8']]) + lin(`${p}-cap`, [[0, '#3d5486'], [1, '#26365c']]);
    return svgOf('0 0 170 160', p, defs,
      // seat back behind the driver
      shape('M14,160 V52 Q14,36 30,36 H44 Q56,36 56,52 V160Z', '#5a6070', '#3a3f48', 2) +
      // body in a blue uniform shirt, with a yellow tie
      shape('M38,160 C36,122 44,94 70,90 C98,88 110,114 112,160Z', `url(#${p}-shirt)`, '#35598c', 2.2) +
      shape('M80,94 L86,96 L84,128 L80,134 L76,128 Z', '#f7c825', '#b8860b', 1.4) +
      shape('M70,72 h16 v22 h-16Z', skin, line, 1.8) +
      // head in profile facing right: hair at the back, ear, nose, eye, smile, blush
      shape('M56,52 C54,30 70,22 84,24 C100,26 106,40 104,52 C103,66 96,76 82,78 C66,78 57,68 56,52Z', skin, line, 2) +
      shape('M56,52 C54,36 62,28 72,26 C66,36 64,48 66,60 C62,62 58,60 56,52Z', '#8a5a3a', '#5e3b26', 1.6) +
      oval(68, 54, 5, 7, skin, 1, ` stroke="${line}" stroke-width="1.6"`) +
      shape('M103,48 q7,4 1,10', skin, line, 1.8) +
      oval(93, 48, 3.2, 4, '#2a1d26') + oval(94.2, 46.6, 1.2, 1.4, '#fff') +
      stroke('M88,40 q5,-3 10,0', '#5e3b26', 2) +
      stroke('M89,64 q6,4 12,-1', '#b5677a', 2) + oval(86, 60, 6, 4, `url(#${p}-blush)`) +
      // peaked cap with a yellow band, peak pointing ahead
      shape('M54,40 C54,20 70,12 84,13 C100,14 108,24 106,36 L124,40 Q110,46 80,43 Q62,42 54,40Z', `url(#${p}-cap)`, '#1c2848', 2) +
      `<rect x="56" y="33" width="50" height="6" fill="#f7c825"/>` +
      // steering wheel (seen from the side, tilted) and its column
      stroke('M150,160 L140,112', '#3a3f48', 7) +
      oval(146, 98, 9, 30, 'none', 1, ' stroke="#2a2e36" stroke-width="7" transform="rotate(-14 146 98)"') +
      // near arm reaching for the wheel (waves when the driver is tapped)
      `<g class="arm" style="transform-origin:86px 100px">` +
        shape('M80,96 C96,98 120,96 138,92 L140,104 C120,110 98,112 82,112Z', `url(#${p}-shirt)`, '#35598c', 2) +
        `<circle cx="141" cy="97" r="8" fill="${skin}" stroke="${line}" stroke-width="1.8"/>` +
      `</g>`);
  };

  /* ---- Reward friends (they come out of the heart jar, one per full jar) ---- */
  Object.assign(C, {
    /** Lion teddy: golden plush with a big orange mane, tufted tail and a stitched belly. */
    lion: () => plush({ p: 'cr-lion', fur: ['#ffe9a8', '#f4c35a', '#d18f2c'], belly: '#fff3d0', muzzle: '#fff4dc', nose: '#9a5a3a',
      ears: 'round', earIn: '#f7d48a', mane: ['#ffb45a', '#ee8a2e', '#c4621c'], tail: 'lion', stitch: true }),
    /** Baby unicorn, pink with a lilac and blue mane. */
    foalpink: () => pony({ p: 'cr-foalpink', coat: ['#fff3f9', '#ffd8ec', '#e9a9c8'], line: '#c48aa8', muzzle: '#ffe8f2',
      mane: ['#c9a8ff', '#a9dcff', '#ffffff', '#d9c4ff'], maneLine: '#9a86c8', hoof: ['#fff3b0', '#e0b84a'], unicorn: true }),
    /** Kitten: soft grey tabby with stripes and whiskers. */
    kitten: () => plush({ p: 'cr-kitten', fur: ['#f1f1f6', '#c9c9d6', '#9a9aae'], belly: '#ffffff', muzzle: '#ffffff', nose: '#f39ab0',
      ears: 'cat', tail: 'cat', whiskers: true, stripes: true, bow: '#7fc6e8' }),
    /** Bunny: white with pink ears and a fluffy tail. */
    bunny: () => plush({ p: 'cr-bunny', fur: ['#ffffff', '#f6f1f4', '#d6cbd3'], belly: '#ffffff', muzzle: '#ffffff', nose: '#f39ab0',
      ears: 'bunny', earIn: '#ffc4d6', tail: 'puff', bow: '#f48cc0' }),
    /** Teddy bear: classic brown teddy with a stitched belly and a red bow. */
    teddy: () => plush({ p: 'cr-teddy', fur: ['#d9a77a', '#b07a4c', '#7f5131'], belly: '#f0d2b0', muzzle: '#f3dcc0', nose: '#5a3a2a',
      ears: 'round', earIn: '#e7c09a', stitch: true, bow: '#e2464c' }),
    /** Baby unicorn, mint green with a rainbow mane. */
    foalmint: () => pony({ p: 'cr-foalmint', coat: ['#f4fffb', '#d2f4e8', '#9fd6c2'], line: '#80b4a2', muzzle: '#eafff7',
      mane: ['#ffb3d6', '#ffe08a', '#b9efc8', '#a9dcff', '#d3bcff'], maneLine: '#9a8ac0', hoof: ['#ffe58a', '#e0a92e'], unicorn: true }),
    /** Hedgehog: brown spiky coat, light face and tummy. */
    hedgehog: () => plush({ p: 'cr-hedgehog', fur: ['#fbefe0', '#ecd3b5', '#c9a582'], belly: '#fff6ea', muzzle: '#fff6ea', nose: '#3a2a2a',
      ears: 'round', earIn: '#f2c4b4', spikes: ['#b98a62', '#6e4a30'] }),
    /** Puppy: cream with floppy brown ears and a curly tail. */
    puppy: () => plush({ p: 'cr-puppy', fur: ['#fff8ec', '#f1dcc0', '#cfae88'], belly: '#ffffff', muzzle: '#ffffff', nose: '#3a2a2a',
      ears: 'floppy', earColor: '#b07a4c', tail: 'curl', bow: '#6cc6f2' }),
  });
  /**
   * The order friends come out of the jar. The first one is the lion teddy (her favourite).
   * h = height in % of the stage; voice = what a tap sounds like (see Sound in app.js).
   * Keys are stored in her save: never rename. Add new friends at the end.
   */
  const FRIENDS = [
    { k: 'lion', is: 'Ljónabangsi', h: 9, voice: 'soft' },
    { k: 'foalpink', is: 'Bleikur einhyrningur', h: 11, voice: 'sparkle' },
    { k: 'kitten', is: 'Kisa', h: 8.5, voice: 'mew' },
    { k: 'bunny', is: 'Kanína', h: 10, voice: 'soft' },
    { k: 'teddy', is: 'Bangsi', h: 8.5, voice: 'soft' },
    { k: 'foalmint', is: 'Grænn einhyrningur', h: 11, voice: 'sparkle' },
    { k: 'hedgehog', is: 'Broddgöltur', h: 8, voice: 'soft' },
    { k: 'puppy', is: 'Hvolpur', h: 8.5, voice: 'yip' },
  ];

  /* Where creatures stand in each scene: x/y are % of the stage (feet position), h is height in % of stage height.
     flip mirrors the creature. Each scene picks a helper that carries pieces from the chest. */
  const SCENES = {
    meadow: { name: 'Lúpínuengi', svg: meadow, wind: 3.4, creatures: [
      { k: 'horse', x: 56, y: 84, h: 20 }, { k: 'sheep', x: 70, y: 92, h: 11, flip: true }, { k: 'unicorn', x: 82, y: 74, h: 17, flip: true },
      { k: 'elf', x: 70, y: 82, h: 11, peek: true }, { k: 'puffin', x: 48, y: 96, h: 10 }] },
    beach: { name: 'Svört strönd', svg: beach, wind: 2.2, creatures: [
      { k: 'puffin', x: 54, y: 90, h: 12 }, { k: 'puffin', x: 63, y: 86, h: 9, flip: true }, { k: 'seal', x: 76, y: 80, h: 13 },
      { k: 'elf', x: 22, y: 90, h: 11, peek: true }] },
    waterfall: { name: 'Foss', svg: waterfall, wind: 3, creatures: [
      { k: 'sheep', x: 58, y: 92, h: 11 }, { k: 'fox', x: 68, y: 96, h: 10, flip: true }, { k: 'horse', x: 88, y: 88, h: 17, flip: true },
      { k: 'elf', x: 77, y: 86, h: 11, peek: true }, { k: 'puffin', x: 48, y: 97, h: 10 }] },
    night: { name: 'Norðurljós', svg: night, wind: 5, snow: true, creatures: [
      { k: 'fox', x: 56, y: 92, h: 10 }, { k: 'unicorn', x: 84, y: 82, h: 17, flip: true },
      { k: 'elf', x: 66, y: 74, h: 10, lantern: true }, { k: 'puffin', x: 48, y: 96, h: 10 }] },
    // ground: creatures' feet stay below this line (% of the stage), so nobody stands on the sea or the stream
    reykjavik: { name: 'Reykjavík', svg: reykjavik, wind: 2.8, ground: 76, creatures: [
      { k: 'seal', x: 62, y: 80, h: 11 }, { k: 'puffin', x: 50, y: 95, h: 10 }, { k: 'unicorn', x: 84, y: 86, h: 16, flip: true },
      { k: 'elf', x: 73, y: 88, h: 10, peek: true }] },
    kopavogur: { name: 'Kópavogur', svg: kopavogur, wind: 3.2, ground: 77, creatures: [
      { k: 'unicorn', x: 70, y: 86, h: 16 }, { k: 'sheep', x: 56, y: 94, h: 11 }, { k: 'puffin', x: 48, y: 97, h: 10 },
      { k: 'elf', x: 84, y: 90, h: 10, peek: true }] },
    // the yellow city bus: no animals on the ground; they ride as passengers in the windows
    // (her heart-jar friends first, newest first, then these), and the driver sits at the front
    bus: { name: 'Strætó', svg: bus, layout: busLayout, wind: 3, creatures: [],
      passengers: ['unicorn', 'puffin', 'sheep', 'fox', 'puffin', 'horse'] },
  };

  root.SCENES = SCENES;
  root.CREATURES = C;
  root.FRIENDS = FRIENDS;
})(typeof window !== 'undefined' ? window : globalThis);
