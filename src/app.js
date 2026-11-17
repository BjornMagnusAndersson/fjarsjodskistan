/* =====================================================================
   Fjársjóðskistan – the game
   Wires the doll, scenes, creatures, the treasure chest, dragging,
   sounds and saving together.
   ===================================================================== */
(function () {
  'use strict';
  const $ = s => document.querySelector(s);
  const stage = $('#stage'), dollEl = $('#doll'), chestEl = $('#chest'), trayEl = $('#tray'),
    tabsEl = $('#tabs'), gridEl = $('#grid'), looseLayer = $('#loose'), sceneEl = $('#scene'),
    critterLayer = $('#critters'), galleryEl = $('#gallery'), menuEl = $('#menu'), defsEl = $('#defs defs');

  /* ---------------------------------------------------------------
     Storage adapter.
     Today: localStorage in this browser. Later: swap LocalStore for a
     FirestoreStore with the same two methods (load / save) and the
     same data shape, e.g. users/{uid}/state and users/{uid}/outfits/{id}.
     Saved outfits keep only item ids, so a planner board can reuse them.
     --------------------------------------------------------------- */
  const KEY = 'fjarsjodskistan.v1';
  const BACKUP = KEY + '.backup';     // last state that loaded fine (written once per start)
  const BROKEN = KEY + '.broken';     // unreadable data is parked here instead of being overwritten
  const VERSION = 1;
  const MAX_OUTFITS = 200;            // ~300 bytes each, far below the browser limit
  /** Parse stored JSON; null when missing or unreadable. */
  function readJSON(key) {
    let raw = null;
    try { raw = localStorage.getItem(key); } catch (e) { return { raw: null, data: null }; }
    try { const d = JSON.parse(raw || 'null'); return { raw, data: d && typeof d === 'object' ? d : null }; }
    catch (e) { return { raw, data: null }; }
  }
  const LocalStore = {
    ok: true,                 // false when the browser refuses to store anything
    /** Read the saved state. Falls back to the backup copy if the main copy is damaged. */
    load() {
      const main = readJSON(KEY);
      if (main.data) { try { localStorage.setItem(BACKUP, main.raw); } catch (e) { /* full or blocked */ } return main.data; }
      if (main.raw) { try { localStorage.setItem(BROKEN, main.raw); } catch (e) { /* ignore */ } }
      return readJSON(BACKUP).data;
    },
    /** Write the whole state. Remembers if it failed so the parent menu can say so. */
    save(data) {
      try { localStorage.setItem(KEY, JSON.stringify(data)); this.ok = true; }
      catch (e) { this.ok = false; }
    },
  };
  const Store = LocalStore;

  /** Default state: everything the game remembers. */
  function freshState() {
    return {
      version: VERSION,
      scene: 'meadow',
      hair: 'loose',
      worn: {},                 // slot → item id
      loose: [],                // [{ id, x, y }] pieces lying in the scene, x/y in % of the stage
      outfits: [],              // [{ id, createdAt, hair, worn, scene }]
      settings: { sound: true, calm: false },
      cat: 'top',               // open chest tab
    };
  }
  const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
  /** Keep only well-formed outfits (from storage or from an imported backup file). */
  function cleanOutfits(list) {
    return (Array.isArray(list) ? list : []).filter(o => isObj(o) && typeof o.id === 'string' && isObj(o.worn))
      .map(o => ({ id: o.id, createdAt: String(o.createdAt || ''), hair: typeof o.hair === 'string' ? o.hair : 'loose', worn: Object.assign({}, o.worn), scene: o.scene }));
  }
  /**
   * Turn whatever was stored into a valid current-version state.
   * Settings are merged key by key, so a setting added later gets its default
   * instead of disappearing. Add migrations here when VERSION goes up:
   *   if (d.version < 2) { ...change d...; }
   */
  function upgrade(d) {
    const s = freshState();
    if (!isObj(d)) return s;
    if (typeof d.scene === 'string') s.scene = d.scene;
    if (typeof d.hair === 'string') s.hair = d.hair;
    if (typeof d.cat === 'string') s.cat = d.cat;
    if (isObj(d.worn)) s.worn = Object.assign({}, d.worn);
    if (Array.isArray(d.loose)) s.loose = d.loose.filter(p => isObj(p) && typeof p.id === 'string');
    s.outfits = cleanOutfits(d.outfits).slice(0, MAX_OUTFITS);
    if (isObj(d.settings)) Object.assign(s.settings, d.settings);
    return s;
  }
  const state = upgrade(Store.load());
  // drop ids of pieces that no longer exist (saved outfits keep theirs: the gallery skips them when drawing)
  for (const s in state.worn) if (!DOLL.byId[state.worn[s]]) delete state.worn[s];
  state.loose = state.loose.filter(p => DOLL.byId[p.id]);

  let saveTimer = 0;
  /** Save shortly after changes (batches quick taps into one write). */
  function persist() { clearTimeout(saveTimer); saveTimer = setTimeout(flush, 300); }
  /** Save right now (when the app is hidden or closed, so the last tap isn't lost). */
  function flush() { clearTimeout(saveTimer); saveTimer = 0; Store.save(state); }
  addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });
  // Ask the browser to never clear our data when space runs low (granted automatically for installed apps).
  if (navigator.storage && navigator.storage.persist) navigator.storage.persisted().then(p => p || navigator.storage.persist()).catch(() => {});

  /* ---------------------------------------------------------------
     Sounds: tiny synthesized chimes and chirps (Web Audio, no files).
     Starts on the first tap because browsers block sound before that.
     --------------------------------------------------------------- */
  const Sound = {
    ctx: null,
    /** Create the audio context on first use. */
    init() { if (!this.ctx) { try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { this.ctx = null; } } if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); },
    /** One soft tone. */
    tone(freq, dur = .18, type = 'sine', vol = .06, delay = 0, slideTo = 0) {
      if (!state.settings.sound) return; this.init(); const c = this.ctx; if (!c) return;
      const t = c.currentTime + delay, o = c.createOscillator(), g = c.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, t); if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .015); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
      o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + .02);
    },
    snap() { this.tone(1046, .16); this.tone(1318, .22, 'sine', .05, .08); },
    off() { this.tone(660, .14, 'sine', .045, 0, 440); },
    save() { [784, 988, 1175, 1568].forEach((f, i) => this.tone(f, .25, 'sine', .05, i * .08)); },
    chirp() { this.tone(1800, .08, 'sine', .04, 0, 2600); this.tone(2000, .08, 'sine', .04, .1, 2900); },
    baa() { this.tone(330, .35, 'triangle', .035, 0, 300); this.tone(338, .35, 'triangle', .02, .02, 305); },
    clop() { [0, .14, .28, .42].forEach(d => this.tone(180, .05, 'square', .02, d, 120)); },
    sparkle() { [1568, 1760, 2093, 2349, 2637].forEach((f, i) => this.tone(f, .2, 'sine', .03, i * .06)); },
    bell() { this.tone(1318, .4, 'sine', .04); this.tone(1976, .3, 'sine', .02, .02); },
    whoosh() { this.tone(500, .25, 'triangle', .02, 0, 900); },
  };

  /* ---------------------------------------------------------------
     Shared SVG defs (gradients and patterns registered by the drawings)
     --------------------------------------------------------------- */
  let defsSeen = -1;
  /** Copy newly registered gradients/patterns into the hidden defs svg. */
  function syncDefs() { if (DOLL.defsVersion !== defsSeen) { defsEl.innerHTML = DOLL.defsString(); defsSeen = DOLL.defsVersion; } }

  /* ---------------------------------------------------------------
     Doll
     --------------------------------------------------------------- */
  let mood = 'smile', moodTimer = 0;
  /** Redraw the doll from state. */
  function renderDoll() {
    const markup = DOLL.renderDoll({ hair: state.hair, worn: state.worn, mood });
    dollEl.innerHTML = `<svg viewBox="0 0 400 780" xmlns="http://www.w3.org/2000/svg" aria-label="Dúkkan"><g id="dollBody">${markup}</g></svg>`;
    syncDefs();
    markWornTiles();
  }
  /** Big smile and a little bounce for a moment. */
  function happy(ms = 1300) {
    mood = 'happy'; renderDoll();
    const g = $('#dollBody'); if (g) { g.classList.remove('bounce'); void g.getBBox; g.classList.add('bounce'); }
    clearTimeout(moodTimer); moodTimer = setTimeout(() => { mood = 'smile'; renderDoll(); }, ms);
  }

  /** Put an item on the doll. Pieces it replaces go back into the chest. */
  function equip(id, fromRect) {
    const it = DOLL.byId[id]; if (!it) return;
    const slot = DOLL.slotOf(it), occ = DOLL.occupiesOf(it);
    for (const s in state.worn) {
      const other = DOLL.byId[state.worn[s]];
      if (!other || other.id === id) continue;
      const oOcc = DOLL.occupiesOf(other);
      if (s === slot || oOcc.some(x => occ.includes(x))) { flyThumb(other.id, dollRect(), chestRect(), 450); delete state.worn[s]; }
    }
    state.worn[slot] = id;
    Sound.snap(); happy(); sparkleAt(dollRect(), 6); persist();
  }
  /** Take an item off the doll (it is not placed anywhere yet). */
  function unequip(id) {
    for (const s in state.worn) if (state.worn[s] === id) delete state.worn[s];
    renderDoll(); persist();
  }

  /* ---------------------------------------------------------------
     Geometry helpers
     --------------------------------------------------------------- */
  const dollRect = () => dollEl.getBoundingClientRect();
  const chestRect = () => chestEl.getBoundingClientRect();
  const inside = (r, x, y, pad = 0) => x >= r.left - pad && x <= r.right + pad && y >= r.top - pad && y <= r.bottom + pad;
  const centre = r => [r.left + r.width / 2, r.top + r.height / 2];
  /** Is a point over the doll's body area (generous, so small hands succeed)? */
  function overDoll(x, y, leaving = false) {
    const r = dollRect(), k = leaving ? .3 : .08;   // pulled off the doll: must leave her body area, not just the picture box
    return inside({ left: r.left + r.width * k, right: r.right - r.width * k, top: r.top + (leaving ? r.height * .05 : 0), bottom: r.bottom - (leaving ? r.height * .04 : 0) }, x, y, leaving ? 0 : 20);
  }
  function overChest(x, y) { return inside(chestRect(), x, y, 10) || (!trayEl.hidden && inside(trayEl.getBoundingClientRect(), x, y)); }

  /* ---------------------------------------------------------------
     Little effects: flying thumbnails and sparkles
     --------------------------------------------------------------- */
  /** A thumbnail flies from one rect to another (used when pieces go home). */
  function flyThumb(id, from, to, ms = 600, carrier) {
    const it = DOLL.byId[id]; if (!it) return Promise.resolve();
    const el = document.createElement('div'); el.className = 'ghost';
    el.innerHTML = (carrier ? `<div style="position:absolute;left:-10%;top:-75%;width:80%;height:80%">${carrier}</div>` : '') + DOLL.renderThumb(it);
    document.body.appendChild(el); syncDefs();
    const [x0, y0] = centre(from), [x1, y1] = centre(to), lift = Math.min(y0, y1) - 120;
    const anim = el.animate([
      { left: x0 + 'px', top: y0 + 'px', transform: 'translate(-50%,-50%) scale(.8)' },
      { left: (x0 + x1) / 2 + 'px', top: lift + 'px', transform: 'translate(-50%,-50%) scale(1)', offset: .5 },
      { left: x1 + 'px', top: y1 + 'px', transform: 'translate(-50%,-50%) scale(.6)' },
    ], { duration: ms, easing: 'ease-in-out' });
    return new Promise(res => { anim.onfinish = () => { el.remove(); res(); }; });
  }
  const SPARK = '<svg viewBox="-10 -10 20 20"><path d="M0,-10Q0,0 10,0Q0,0 0,10Q0,0 -10,0Q0,0 0,-10Z" fill="#fff6a8" stroke="#f2c34d" stroke-width="1"/></svg>';
  /** A burst of little stars around a rect. */
  function sparkleAt(r, n = 8) {
    const sr = stage.getBoundingClientRect();
    for (let i = 0; i < n; i++) {
      const s = document.createElement('div'); s.className = 'spark'; s.innerHTML = SPARK;
      const x = r.left - sr.left + r.width * (.25 + Math.random() * .5), y = r.top - sr.top + r.height * (.2 + Math.random() * .5);
      s.style.left = x + 'px'; s.style.top = y + 'px'; stage.appendChild(s);
      const dx = (Math.random() - .5) * 120, dy = (Math.random() - .7) * 120;
      s.animate([{ transform: 'scale(0)', opacity: 1 }, { transform: `translate(${dx}px,${dy}px) scale(1.3) rotate(90deg)`, opacity: 0 }], { duration: 700 + Math.random() * 400, easing: 'ease-out' }).onfinish = () => s.remove();
    }
  }

  /* ---------------------------------------------------------------
     Helpers who carry pieces: a puffin flies them over, or an elf does.
     --------------------------------------------------------------- */
  let helperTurn = 0;
  function carry(id, fromRect) {
    const useElf = helperTurn++ % 3 === 2;
    Sound[useElf ? 'bell' : 'chirp']();
    return flyThumb(id, fromRect || chestRect(), dollRect(), 900, useElf ? CREATURES.elf() : CREATURES.puffin()).then(() => equip(id));
  }

  /* ---------------------------------------------------------------
     Chest and tray
     --------------------------------------------------------------- */
  const CHEST_SVG = `<svg viewBox="0 0 260 220" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs><linearGradient id="ch-wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b47a45"/><stop offset="1" stop-color="#7a4b28"/></linearGradient>
    <linearGradient id="ch-lid" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c58a52"/><stop offset="1" stop-color="#8c5a30"/></linearGradient>
    <linearGradient id="ch-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe08a"/><stop offset="1" stop-color="#d49a1e"/></linearGradient>
    <radialGradient id="ch-glow"><stop offset="0" stop-color="#fff2a8" stop-opacity=".95"/><stop offset="1" stop-color="#fff2a8" stop-opacity="0"/></radialGradient></defs>
    <ellipse cx="130" cy="210" rx="120" ry="10" fill="#000" opacity=".18"/>
    <ellipse class="glow" cx="130" cy="90" rx="130" ry="70" fill="url(#ch-glow)"/>
    <rect x="18" y="92" width="224" height="112" rx="12" fill="url(#ch-wood)" stroke="#4a2c14" stroke-width="5"/>
    <path d="M22,126 H238 M22,160 H238" stroke="#5c3a1f" stroke-width="3" opacity=".6"/>
    <path d="M40,98 v100 M220,98 v100" stroke="#3b3b44" stroke-width="12"/><path d="M40,98 v100 M220,98 v100" stroke="#6b6b78" stroke-width="5"/>
    <g class="lid"><path d="M14,96 Q14,30 130,26 Q246,30 246,96 Z" fill="url(#ch-lid)" stroke="#4a2c14" stroke-width="5" stroke-linejoin="round"/>
      <path d="M40,94 Q42,44 60,36 M220,94 Q218,44 200,36" stroke="#3b3b44" stroke-width="12" fill="none"/><path d="M40,94 Q42,44 60,36 M220,94 Q218,44 200,36" stroke="#6b6b78" stroke-width="5" fill="none"/>
      <path d="M60,60 Q130,40 200,60" stroke="#e7b77e" stroke-width="5" fill="none" opacity=".6" stroke-linecap="round"/>
      ${[[70, 52], [130, 40], [190, 52]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="url(#ch-gold)" stroke="#8a5a10" stroke-width="1.5"/>`).join('')}</g>
    <rect x="110" y="96" width="40" height="46" rx="8" fill="url(#ch-gold)" stroke="#8a5a10" stroke-width="3"/>
    <path d="M130,110 a6,6 0 1 1 0.1,0 M130,116 v12" stroke="#5a3a08" stroke-width="5" fill="none" stroke-linecap="round"/>
    ${[[30, 104], [30, 192], [230, 104], [230, 192]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" fill="url(#ch-gold)"/>`).join('')}
  </svg>`;

  /** Items for a chest tab (hair is special: hairstyles, not clothes). */
  const itemsIn = cat => DOLL.items.filter(i => i.cat === cat);
  const catsWithItems = () => CATS.filter(c => c.id === 'hair' || itemsIn(c.id).length);

  /** Build the category tabs; each tab icon is the first piece in that category. */
  function renderTabs() {
    tabsEl.innerHTML = '';
    for (const c of catsWithItems()) {
      const b = document.createElement('button');
      b.className = 'tab'; b.setAttribute('role', 'tab'); b.setAttribute('aria-label', c.is); b.dataset.cat = c.id;
      b.setAttribute('aria-selected', String(c.id === state.cat));
      b.innerHTML = c.id === 'hair' ? DOLL.renderHairThumb(state.hair) : DOLL.renderThumb(itemsIn(c.id)[0]);
      b.addEventListener('click', () => { state.cat = c.id; Sound.tone(880, .08, 'sine', .03); renderTabs(); renderGrid(); persist(); });
      tabsEl.appendChild(b);
    }
    syncDefs();
  }

  /** Build the grid of pieces for the open tab. */
  function renderGrid() {
    gridEl.innerHTML = ''; gridEl.scrollTop = 0;
    if (state.cat === 'hair') {
      for (const h of DOLL.hairstyles) {
        const t = document.createElement('button'); t.className = 'tile' + (state.hair === h ? ' worn' : ''); t.setAttribute('aria-label', h);
        t.innerHTML = DOLL.renderHairThumb(h);
        t.addEventListener('click', () => { state.hair = h; Sound.snap(); happy(); renderGrid(); renderTabs(); persist(); });
        gridEl.appendChild(t);
      }
    } else {
      for (const it of itemsIn(state.cat)) {
        const t = document.createElement('button'); t.className = 'tile'; t.dataset.id = it.id; t.setAttribute('aria-label', it.name ? it.name.is : it.id);
        t.innerHTML = DOLL.renderThumb(it);
        t.addEventListener('pointerdown', e => startDrag(e, it.id, 'tray', t));
        gridEl.appendChild(t);
      }
    }
    syncDefs(); markWornTiles();
  }
  /** Gold border on tiles the doll is wearing. */
  function markWornTiles() {
    const worn = new Set(Object.values(state.worn));
    gridEl.querySelectorAll('.tile[data-id]').forEach(t => t.classList.toggle('worn', worn.has(t.dataset.id)));
  }
  /** Open or close the chest. */
  function setChest(open) {
    chestEl.classList.toggle('open', open); trayEl.hidden = !open;
    if (open) { Sound.tone(523, .12, 'sine', .04); Sound.tone(784, .2, 'sine', .04, .08); if (!gridEl.children.length) { renderTabs(); renderGrid(); } }
    else Sound.tone(392, .14, 'sine', .035);
  }

  /* ---------------------------------------------------------------
     Dragging (pointer events work for touch, pen and mouse)
     origin: 'tray' | 'loose' | 'doll'
     --------------------------------------------------------------- */
  let drag = null;
  function startDrag(e, id, origin, el) {
    if (e.button > 0) return;
    Sound.init();
    drag = { id, origin, el, x0: e.clientX, y0: e.clientY, moved: false, ghost: null, pointer: e.pointerId };
    if (origin !== 'tray') e.preventDefault();
    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
  }
  function onMove(e) {
    if (!drag || e.pointerId !== drag.pointer) return;
    const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
    if (!drag.moved) {
      // in the tray, a mostly vertical move scrolls the list instead of dragging
      if (drag.origin === 'tray' && Math.abs(dy) > Math.abs(dx) * 1.3 && Math.abs(dy) > 8) { cleanupDrag(); return; }
      if (Math.hypot(dx, dy) < 10) return;
      drag.moved = true;
      const g = document.createElement('div'); g.className = 'ghost'; g.innerHTML = DOLL.renderThumb(DOLL.byId[drag.id]);
      document.body.appendChild(g); drag.ghost = g; syncDefs();
      if (drag.origin === 'doll') { unequip(drag.id); Sound.off(); }
      if (drag.origin === 'loose') { drag.el.remove(); state.loose = state.loose.filter(p => p !== drag.loosePiece); }
    }
    e.preventDefault();
    drag.ghost.style.left = e.clientX + 'px'; drag.ghost.style.top = e.clientY + 'px';
    drag.lastX = e.clientX; drag.lastY = e.clientY;
  }
  function onUp(e) {
    if (!drag || e.pointerId !== drag.pointer) return;
    const d = drag; cleanupDrag();
    const x = e.clientX, y = e.clientY;
    if (!d.moved) return onTap(d);
    d.ghost.remove();
    const ghostRect = { left: x - 40, right: x + 40, top: y - 40, bottom: y + 40, width: 80, height: 80 };
    if (overDoll(x, y, d.origin === 'doll')) { equip(d.id); renderDoll(); }
    else if (overChest(x, y)) { flyThumb(d.id, ghostRect, chestRect(), 350); Sound.off(); chestEl.classList.remove('wiggle'); void chestEl.offsetWidth; chestEl.classList.add('wiggle'); persist(); }
    else dropLoose(d.id, x, y);
  }
  function onCancel() {
    const d = drag; cleanupDrag();
    if (d && d.ghost) { d.ghost.remove(); if (d.origin !== 'tray') dropLoose(d.id, d.lastX ?? d.x0, d.lastY ?? d.y0); }
  }
  function cleanupDrag() {
    window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); window.removeEventListener('pointercancel', onCancel);
    drag = null;
  }
  /** Taps: chest piece → a helper carries it on; loose piece → hops on; worn piece → goes home. */
  function onTap(d) {
    if (d.origin === 'tray') carry(d.id, d.el.getBoundingClientRect());
    else if (d.origin === 'loose') { const r = d.el.getBoundingClientRect(); d.el.remove(); state.loose = state.loose.filter(p => p !== d.loosePiece); flyThumb(d.id, r, dollRect(), 450).then(() => { equip(d.id); renderDoll(); }); }
    else if (d.origin === 'doll') { unequip(d.id); Sound.off(); flyThumb(d.id, dollRect(), chestRect(), 500); }
  }

  /* ---------------------------------------------------------------
     Loose pieces stay in the scene where they were dropped
     --------------------------------------------------------------- */
  /** Keep a % position inside the screen edges. */
  const clampPct = v => Math.max(7, Math.min(93, v));
  function dropLoose(id, x, y) {
    const sr = stage.getBoundingClientRect();
    const p = { id, x: +clampPct((x - sr.left) / sr.width * 100).toFixed(2), y: +clampPct((y - sr.top) / sr.height * 100).toFixed(2) };
    state.loose.push(p); addLooseEl(p); Sound.tone(587, .1, 'sine', .035); persist();
  }
  function addLooseEl(p) {
    const el = document.createElement('div'); el.className = 'loose';
    el.style.left = p.x + '%'; el.style.top = p.y + '%';
    el.innerHTML = DOLL.renderThumb(DOLL.byId[p.id]);
    el.addEventListener('pointerdown', e => { startDrag(e, p.id, 'loose', el); if (drag) drag.loosePiece = p; });
    looseLayer.appendChild(el);
  }
  function renderLoose() { looseLayer.innerHTML = ''; state.loose.forEach(p => { p.x = clampPct(p.x); p.y = clampPct(p.y); addLooseEl(p); }); syncDefs(); }
  // turning the tablet or phone: redraw loose pieces so none end up off screen
  window.addEventListener('resize', () => { clearTimeout(renderLoose.t); renderLoose.t = setTimeout(renderLoose, 200); });
  /** Send every loose piece back into the chest. */
  function tidyUp() {
    const els = [...looseLayer.children];
    state.loose.forEach((p, i) => flyThumb(p.id, els[i].getBoundingClientRect(), chestRect(), 500 + i * 60));
    state.loose = []; looseLayer.innerHTML = ''; Sound.whoosh(); persist();
  }
  /** Undress the doll: everything flies back to the chest. */
  function undress() {
    const ids = Object.values(state.worn);
    if (!ids.length) { if (state.loose.length) tidyUp(); return; }
    ids.forEach((id, i) => flyThumb(id, dollRect(), chestRect(), 500 + i * 70));
    state.worn = {}; renderDoll(); Sound.whoosh(); persist();
  }

  /* doll: grab a worn piece by its drawing */
  dollEl.addEventListener('pointerdown', e => {
    const g = e.target.closest('[data-item]');
    if (g) startDrag(e, g.dataset.item, 'doll', g);
    else if (e.target.closest('.body,.face,.hair-front,.hair-back')) { Sound.tone(988, .1); Sound.tone(1318, .12, 'sine', .04, .08); happy(900); }
  });
  chestEl.innerHTML = CHEST_SVG;
  chestEl.addEventListener('click', () => setChest(trayEl.hidden));

  /* ---------------------------------------------------------------
     Scenes and creatures
     --------------------------------------------------------------- */
  let snowEls = [];
  const PORTRAIT_SPOTS = [[86, 70], [16, 68], [70, 66], [94, 76], [30, 66]];
  const portraitQuery = window.matchMedia('(max-aspect-ratio: 4/5)');
  let portrait = portraitQuery.matches;
  portraitQuery.addEventListener?.('change', e => { portrait = e.matches; renderScene(); });
  /** On wide screens (phone in landscape) the scene is cropped top and bottom, so animals get bigger to match. */
  const wideScale = () => Math.max(1.15, Math.min(1.7, (innerWidth / innerHeight) / 1.25));
  window.addEventListener('resize', () => { clearTimeout(renderScene.t); renderScene.t = setTimeout(renderScene, 250); });
  function renderScene() {
    const sc = SCENES[state.scene] || SCENES.meadow;
    sceneEl.innerHTML = sc.svg();
    stage.style.setProperty('--wind', sc.wind + 's');
    critterLayer.innerHTML = '';
    sc.creatures.forEach((c, i) => {
      const el = document.createElement('div');
      el.className = 'creature' + (c.peek ? ' peek' : '') + (c.k === 'puffin' || c.k === 'seal' ? ' idle-bob' : '');
      // on tall phone screens the animals stand further away on the hillside, so the doll has the foreground
      const spot = portrait && c.k !== 'seal' ? PORTRAIT_SPOTS[i % PORTRAIT_SPOTS.length] : null;   // the seal stays on its beach rock
      el.style.left = (spot ? spot[0] : c.x) + '%'; el.style.top = (spot ? spot[1] : c.y) + '%'; el.style.height = (portrait ? c.h * .62 : c.h * wideScale()) + '%';
      el.setAttribute('role', 'button'); el.setAttribute('aria-label', c.k);
      el.innerHTML = `<div class="inner">${CREATURES[c.k](c.lantern)}</div>`;
      el.querySelectorAll('.tail,.head').forEach(n => n.style.animationDelay = (-i * .7) + 's');
      el.addEventListener('pointerdown', e => { e.preventDefault(); creatureTap(c, el); });
      critterLayer.appendChild(el);
    });
    spreadCreatures();
    faceTheDoll();
    snowEls.forEach(s => s.remove()); snowEls = [];
    if (sc.snow) for (let i = 0; i < 22; i++) {
      const s = document.createElement('div'); s.className = 'snow';
      s.style.left = (Math.random() * 100) + '%'; s.style.animationDuration = (8 + Math.random() * 8) + 's'; s.style.animationDelay = (-Math.random() * 16) + 's';
      const sz = 4 + Math.random() * 6; s.style.width = s.style.height = sz + 'px';
      stage.insertBefore(s, critterLayer); snowEls.push(s);
    }
    document.querySelectorAll('.scene-btn').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.scene === state.scene)));
  }
  /**
   * Move animals sideways so none overlap each other, the doll, the chest or the buttons.
   * Works in screen pixels after layout, then writes the result back as % positions.
   * If an animal can't fit anywhere it is made a little smaller and tried again.
   */
  function spreadCreatures() {
    const sr = stage.getBoundingClientRect(), pad = 10;
    const grow = (r, m) => ({ left: r.left - m, right: r.right + m, top: r.top - m, bottom: r.bottom + m });
    const hit = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    const d = dollRect();
    const blockers = [
      { left: d.left + d.width * .12, right: d.right - d.width * .12, top: d.top, bottom: d.bottom },   // the doll's body
      grow(chestRect(), 6),
      grow(document.querySelector('.bar.left-low').getBoundingClientRect(), 6),
    ];
    const els = [...critterLayer.children].sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left);
    for (const el of els) {
      let placed = false;
      for (let tries = 0; tries < 4 && !placed; tries++) {
        const r0 = el.getBoundingClientRect(), w = r0.width, h = r0.height;
        const fits = (left, top) => { const r = { left, right: left + w, top, bottom: top + h }; return left >= sr.left + 4 && left + w <= sr.right - 4 && top >= sr.top + sr.height * .45 && !blockers.some(b => hit(grow(r, pad), b)); };
        // try the planned height first, then a bit further back up the hill or nearer; at each, step outwards left and right
        for (const dy of [0, -.05, -.1, .04, -.15]) {
          const top = r0.top + dy * sr.height;
          let best = null;
          for (let step = 0; step < sr.width && best === null; step += 8) {
            if (fits(r0.left + step, top)) best = r0.left + step; else if (fits(r0.left - step, top)) best = r0.left - step;
          }
          if (best !== null) {
            el.style.left = ((best + w / 2 - sr.left) / sr.width * 100).toFixed(2) + '%';
            el.style.top = ((top + h - sr.top) / sr.height * 100).toFixed(2) + '%';
            blockers.push({ left: best, right: best + w, top, bottom: top + h });
            placed = true; break;
          }
        }
        if (!placed) el.style.height = (parseFloat(el.style.height) * .82).toFixed(2) + '%';   // too crowded: shrink and retry
      }
      if (!placed) el.hidden = true;   // never draw an animal on top of something
    }
  }

  /** Every animal is drawn facing right; mirror the ones standing right of the doll so they all look at her. */
  function faceTheDoll() {
    const [dx] = centre(dollRect());
    for (const el of critterLayer.children) {
      const [cx] = centre(el.getBoundingClientRect());
      el.classList.toggle('flip', cx > dx);
    }
  }

  /** What each creature does when tapped. Elves and unicorns help with clothes. */
  function creatureTap(c, el) {
    Sound.init();
    const cls = c.k === 'horse' ? 'react-tolt' : c.k === 'elf' ? 'react-wave' : 'react';
    el.classList.remove('react', 'react-tolt', 'react-wave'); void el.offsetWidth; el.classList.add(cls);
    setTimeout(() => el.classList.remove(cls), 1100);
    ({ puffin: () => Sound.chirp(), sheep: () => Sound.baa(), horse: () => Sound.clop(), fox: () => Sound.chirp(), seal: () => Sound.tone(300, .2, 'triangle', .04, 0, 420),
       unicorn: () => { Sound.sparkle(); showRainbow(); sparkleAt(el.getBoundingClientRect(), 10); },
       elf: () => { Sound.bell(); surprise(el); } })[c.k]?.();
  }
  /** The rainbow shows for a while (unicorn magic). */
  function showRainbow() {
    let rb = sceneEl.querySelector('#rainbow');
    if (!rb) return;
    rb.classList.add('show'); setTimeout(() => rb.classList.remove('show'), 7000);
  }
  /** An elf fetches a surprise piece from the chest and puts it on the doll. */
  function surprise(elfEl) {
    const pool = DOLL.items.filter(i => !Object.values(state.worn).includes(i.id));
    if (!pool.length) return;
    const it = pool[Math.floor(Math.random() * pool.length)];
    setTimeout(() => flyThumb(it.id, chestRect(), dollRect(), 1000, CREATURES.elf()).then(() => { equip(it.id); renderDoll(); }), 400);
  }

  /* ---------------------------------------------------------------
     Saved outfits (she saves them herself with the heart)
     --------------------------------------------------------------- */
  /** Text fingerprint of an outfit: hair plus the sorted item ids. */
  function outfitKey(hair, worn) { return hair + '|' + Object.values(worn).sort().join(','); }
  function saveOutfit() {
    if (!Object.keys(state.worn).length) { Sound.tone(330, .15); return; }
    // Same clothes and hair already saved? Move that one to the front instead of making a copy.
    const sig = outfitKey(state.hair, state.worn);
    const same = state.outfits.find(x => outfitKey(x.hair, x.worn) === sig);
    const o = same || { id: 'o' + Date.now().toString(36), createdAt: new Date().toISOString(), hair: state.hair, worn: Object.assign({}, state.worn), scene: state.scene };
    state.outfits = [o, ...state.outfits.filter(x => x !== o)].slice(0, MAX_OUTFITS);
    Sound.save(); sparkleAt(dollRect(), 14); happy(1600);
    const b = $('#btnGallery'); b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop');
    persist(); if (!galleryEl.hidden) renderGallery();
  }
  function renderGallery() {
    galleryEl.innerHTML = '';
    if (!state.outfits.length) {
      galleryEl.innerHTML = `<div class="empty">${ICON.heart} Ýttu á hjartað til að vista föt</div>`; return;
    }
    for (const o of state.outfits) {
      const card = document.createElement('div'); card.className = 'card'; card.setAttribute('role', 'button');
      card.innerHTML = `<svg viewBox="60 20 280 740">${DOLL.renderDoll({ hair: o.hair, worn: o.worn })}</svg><button class="del" aria-label="Eyða">✕</button>`;
      let pressTimer = 0, long = false;
      card.addEventListener('pointerdown', () => { long = false; pressTimer = setTimeout(() => { long = true; card.classList.add('deleting'); }, 800); });
      card.addEventListener('pointerup', e => {
        clearTimeout(pressTimer);
        if (e.target.closest('.del')) { state.outfits = state.outfits.filter(x => x !== o); Sound.off(); persist(); renderGallery(); return; }
        if (long) return;
        if (card.classList.contains('deleting')) { card.classList.remove('deleting'); return; }
        state.hair = o.hair; state.worn = Object.fromEntries(Object.entries(o.worn).filter(([, id]) => DOLL.byId[id]));
        Sound.sparkle(); happy(); sparkleAt(dollRect(), 10); persist(); galleryEl.hidden = true;
      });
      card.addEventListener('pointerleave', () => clearTimeout(pressTimer));
      galleryEl.appendChild(card);
    }
    syncDefs();
  }

  /* ---------------------------------------------------------------
     Parent menu (opens on a long press so little fingers don't find it)
     --------------------------------------------------------------- */
  function renderMenu() {
    $('#optSound').checked = state.settings.sound; $('#optCalm').checked = state.settings.calm;
    $('#backupMsg').hidden = true;
    flush();
    $('#storeMsg').textContent = Store.ok
      ? `Allt er vistað á þessu tæki (${state.outfits.length} vistuð föt). Taktu afrit af og til.`
      : 'Vafrinn leyfir ekki að vista. Fötin gleymast þegar leiknum er lokað.';
  }
  /** Short note under the backup buttons. */
  function backupNote(text) { const m = $('#backupMsg'); m.textContent = text; m.hidden = false; }

  /*  Backup file for parents: all saved outfits and settings as JSON.
      On Android it opens the share sheet (Drive, email, …); elsewhere it downloads. */
  $('#menuExport').addEventListener('click', async () => {
    flush();
    const day = new Date().toISOString().slice(0, 10);
    const name = `fjarsjodskistan-${day}.json`;
    const data = JSON.stringify(Object.assign({ app: 'fjarsjodskistan', exportedAt: new Date().toISOString() }, state), null, 1);
    const file = new File([data], name, { type: 'application/json' });
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: name }); backupNote('Afrit sent.'); return; }
    } catch (e) { if (e && e.name === 'AbortError') return; /* sharing failed: download instead */ }
    const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = name;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    backupNote('Afrit vistað í niðurhal (Downloads).');
  });
  /*  Opening a backup ADDS its outfits to the ones already here (nothing is deleted).
      The doll, scene and settings stay as they are. */
  $('#menuImport').addEventListener('click', () => $('#importFile').click());
  $('#importFile').addEventListener('change', async e => {
    const f = e.target.files && e.target.files[0]; e.target.value = '';
    if (!f) return;
    let d = null; try { d = JSON.parse(await f.text()); } catch (err) { d = null; }
    if (!isObj(d) || !Array.isArray(d.outfits)) { backupNote('Þetta er ekki afrit úr Fjársjóðskistunni.'); return; }
    const have = new Set(state.outfits.map(o => o.id)), keys = new Set(state.outfits.map(o => outfitKey(o.hair, o.worn)));
    const added = cleanOutfits(d.outfits).filter(o => !have.has(o.id) && !keys.has(outfitKey(o.hair, o.worn)));
    state.outfits = state.outfits.concat(added)
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).slice(0, MAX_OUTFITS);
    flush(); renderMenu();
    backupNote(added.length ? `${added.length} föt bættust við.` : 'Öll fötin í afritinu voru þegar hér.');
    if (!galleryEl.hidden) renderGallery();
  });
  $('#optSound').addEventListener('change', e => { state.settings.sound = e.target.checked; persist(); });
  $('#optCalm').addEventListener('change', e => { state.settings.calm = e.target.checked; stage.classList.toggle('calm', state.settings.calm); persist(); });
  $('#menuClose').addEventListener('click', () => { menuEl.hidden = true; });
  /** Full screen on a tap (Android Chrome supports it; some app views block it, then a note shows). */
  $('#menuFull').addEventListener('click', async () => {
    const msg = $('#fullMsg'); msg.hidden = true;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else { await document.documentElement.requestFullscreen({ navigationUI: 'hide' }); menuEl.hidden = true; }
    } catch (e) { msg.hidden = false; }
  });
  $('#menuReset').addEventListener('click', () => {
    const b = $('#menuReset');
    if (b.dataset.armed) { state.worn = {}; state.loose = []; state.outfits = []; renderAll(); flush(); b.textContent = 'Eyða öllu'; delete b.dataset.armed; menuEl.hidden = true; }
    else { b.dataset.armed = '1'; b.textContent = 'Ýttu aftur til að staðfesta'; }
  });
  (function longPress(btn) {
    let t = 0;
    btn.addEventListener('pointerdown', () => { t = setTimeout(() => { renderMenu(); menuEl.hidden = false; }, 1000); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => btn.addEventListener(ev, () => clearTimeout(t)));
  })($('#btnGear'));

  /* ---------------------------------------------------------------
     Buttons
     --------------------------------------------------------------- */
  const ICON = {
    heart: '<svg viewBox="0 0 40 40"><path d="M20,34 C4,24 4,10 13,8 C17,7 19,10 20,12 C21,10 23,7 27,8 C36,10 36,24 20,34Z" fill="#ef5b7a" stroke="#b8344f" stroke-width="2.5" stroke-linejoin="round"/><path d="M12,14 q2,-3 5,-2" stroke="#fff" stroke-width="2.5" stroke-linecap="round" fill="none"/></svg>',
    frame: '<svg viewBox="0 0 40 40"><rect x="7" y="5" width="26" height="30" rx="4" fill="#ffe08a" stroke="#c4901e" stroke-width="2.5"/><rect x="11" y="9" width="18" height="22" rx="2" fill="#bfe3f2"/><circle cx="20" cy="16" r="4" fill="#f7d7c3"/><path d="M14,30 Q20,20 26,30Z" fill="#ef5b7a"/></svg>',
    undress: '<svg viewBox="0 0 40 40"><path d="M12,8 l-7,6 4,5 3,-2 v16 h16 v-16 l3,2 4,-5 -7,-6 q-4,4 -8,0 q-4,4 -8,0z" fill="#7fc3ea" stroke="#3f7fa8" stroke-width="2.4" stroke-linejoin="round"/><path d="M28,24 l8,8 M36,24 l-8,8" stroke="#e2505b" stroke-width="3.5" stroke-linecap="round"/></svg>',
    tidy: '<svg viewBox="0 0 40 40"><path d="M6,22 h28 v12 h-28z" fill="#b47a45" stroke="#5c3a1f" stroke-width="2.4"/><path d="M20,4 v14 M14,12 l6,6 6,-6" stroke="#3f8fd2" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    gear: '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="7" fill="none" stroke="#7a6a7a" stroke-width="3"/><path d="M20,4v6M20,30v6M4,20h6M30,20h6M8.7,8.7l4.2,4.2M27.1,27.1l4.2,4.2M8.7,31.3l4.2,-4.2M27.1,12.9l4.2,-4.2" stroke="#7a6a7a" stroke-width="3" stroke-linecap="round"/></svg>',
  };
  $('#btnSave').innerHTML = ICON.heart; $('#btnGallery').innerHTML = ICON.frame; $('#btnUndress').innerHTML = ICON.undress; $('#btnTidy').innerHTML = ICON.tidy; $('#btnGear').innerHTML = ICON.gear;
  $('#btnSave').addEventListener('click', saveOutfit);
  $('#btnGallery').addEventListener('click', () => { galleryEl.hidden = !galleryEl.hidden; if (!galleryEl.hidden) { renderGallery(); Sound.tone(698, .1); } });
  $('#btnUndress').addEventListener('click', undress);
  $('#btnTidy').addEventListener('click', tidyUp);
  // scene picker buttons show a tiny version of each scene
  const sceneBar = $('#scenes');
  for (const k of Object.keys(SCENES)) {
    const b = document.createElement('button'); b.className = 'btn scene-btn'; b.dataset.scene = k; b.setAttribute('aria-label', SCENES[k].name);
    b.innerHTML = SCENES[k].svg().replace('xMidYMax slice', 'xMidYMid slice');
    b.addEventListener('click', () => { if (state.scene === k) return; state.scene = k; Sound.whoosh(); sceneEl.classList.add('fading'); setTimeout(() => { renderScene(); sceneEl.classList.remove('fading'); }, 300); persist(); });
    sceneBar.appendChild(b);
  }
  stage.addEventListener('pointerdown', () => Sound.init(), { once: true });
  // tapping the scene background closes the gallery
  sceneEl.addEventListener('pointerdown', () => { galleryEl.hidden = true; });

  /** Draw everything from state. */
  function renderAll() { renderScene(); renderDoll(); renderLoose(); renderTabs(); renderGrid(); stage.classList.toggle('calm', state.settings.calm); }
  renderAll();
  trayEl.hidden = true;
})();
