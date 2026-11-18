/* =====================================================================
   Fjársjóðskistan – the game
   Wires the doll, scenes, creatures, the treasure chest, dragging,
   sounds and saving together.
   ===================================================================== */
(function () {
  'use strict';
  /** Shorthand for document.querySelector. */
  const $ = s => document.querySelector(s);
  // error codes (errors.js): report(code, detail, error) writes to the log in the parent menu;
  // guard(code, detail, fn, fallback) runs fn and logs + returns fallback if it throws
  const FJ = window.FJ, { report, guard } = FJ;
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
  const JAR_SIZE = 10;                // hearts in a full jar (a full jar brings a new friend)
  /** Parse stored JSON: { raw text, data } where data is null when missing or unreadable. */
  function readJSON(key) {
    let raw = null;
    try { raw = localStorage.getItem(key); } catch (e) { report('FJ-S03', key, e); return { raw: null, data: null }; }
    try { const d = JSON.parse(raw || 'null'); return { raw, data: d && typeof d === 'object' ? d : null }; }
    catch (e) { return { raw, data: null }; }
  }
  const LocalStore = {
    ok: true,                 // false when the browser refuses to store anything
    /** Read the saved state. Falls back to the backup copy if the main copy is damaged (code FJ-S02). */
    load() {
      const main = readJSON(KEY);
      if (main.data) { try { localStorage.setItem(BACKUP, main.raw); } catch (e) { report('FJ-S01', 'backup copy', e); } return main.data; }
      if (main.raw) { report('FJ-S02', main.raw.length + ' characters'); try { localStorage.setItem(BROKEN, main.raw); } catch (e) { report('FJ-S01', 'parking the damaged save', e); } }
      return readJSON(BACKUP).data;
    },
    /** Write the whole state. Remembers if it failed so the parent menu can say so (code FJ-S01). */
    save(data) {
      try { localStorage.setItem(KEY, JSON.stringify(data)); this.ok = true; }
      catch (e) { this.ok = false; report('FJ-S01', 'save', e); }
    },
  };
  const Store = LocalStore;

  /** Default state: everything the game remembers. */
  function freshState() {
    return {
      version: VERSION,
      scene: 'meadow',
      hair: 'loose',
      hairColor: '',            // hair colour dot she picked (DOLL.hairColors key); '' = each style's own colours
      worn: {},                 // slot → item id
      friendWorn: {},           // what her friends wear: { lion: { hat: itemId, glasses: itemId, ... } }
      loose: [],                // [{ id, x, y }] pieces lying in the scene, x/y in % of the stage
      outfits: [],              // [{ id, createdAt, hair, hairColor, worn, scene }]
      lastBackup: '',           // when parents last saved a backup file (ISO time), for the reminder in the menu
      backupOutfits: 0,         // how many saved outfits there were then
      settings: { sound: true, calm: false, rewards: true },
      cat: 'top',               // open chest tab
      // heart jar: hearts in the jar now, friends earned (keys of FRIENDS, in order),
      // hairstyles and hair colours already tried (colours as 'c:copper')
      rewards: { hearts: 0, friends: [], hairSeen: [] },
    };
  }
  /** True for a plain object (not null, not a list). */
  const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
  /** Short text or '' (anything else, or very long text, from a file that was tampered with). */
  const shortText = (v, max = 80) => (typeof v === 'string' && v.length <= max ? v : '');
  /**
   * Keep only short text ids (at most 40 pieces), so a strange file can't sneak anything else into her save.
   * Slot names are NOT checked against today's slots: an old save must keep every piece it has.
   */
  const cleanWorn = w => Object.fromEntries(Object.entries(w).filter(([s, id]) => shortText(s) && shortText(id)).slice(0, 40));
  /** Keep only well-formed outfits (from storage or from an imported backup file). */
  function cleanOutfits(list) {
    return (Array.isArray(list) ? list : []).slice(0, MAX_OUTFITS * 2).filter(o => isObj(o) && shortText(o.id) && isObj(o.worn))
      .map(o => ({ id: o.id, createdAt: shortText(o.createdAt, 40), hair: shortText(o.hair) || 'loose',
        hairColor: shortText(o.hairColor), worn: cleanWorn(o.worn), scene: shortText(o.scene) }));
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
    if (typeof d.hairColor === 'string') s.hairColor = d.hairColor;
    if (typeof d.cat === 'string') s.cat = d.cat;
    if (typeof d.lastBackup === 'string') s.lastBackup = d.lastBackup;
    if (Number.isFinite(d.backupOutfits)) s.backupOutfits = d.backupOutfits;
    // friends' clothes: keep only { friend: { slot: itemId } } with text ids
    if (isObj(d.friendWorn)) for (const k in d.friendWorn) if (isObj(d.friendWorn[k])) {
      s.friendWorn[k] = Object.fromEntries(Object.entries(d.friendWorn[k]).filter(([, id]) => typeof id === 'string'));
    }
    if (isObj(d.worn)) s.worn = Object.assign({}, d.worn);
    if (Array.isArray(d.loose)) s.loose = d.loose.filter(p => isObj(p) && typeof p.id === 'string');
    s.outfits = cleanOutfits(d.outfits).slice(0, MAX_OUTFITS);
    if (isObj(d.settings)) Object.assign(s.settings, d.settings);
    if (isObj(d.rewards)) {
      const r = d.rewards, strs = a => (Array.isArray(a) ? a : []).filter(x => typeof x === 'string');
      s.rewards.hearts = Math.max(0, Math.min(JAR_SIZE - 1, Math.floor(+r.hearts) || 0));
      s.rewards.friends = [...new Set(strs(r.friends))];
      s.rewards.hairSeen = [...new Set(strs(r.hairSeen))];
    }
    // the hairstyle she starts with does not earn a heart
    if (!s.rewards.hairSeen.length) s.rewards.hairSeen = [s.hair];
    return s;
  }
  const state = upgrade(Store.load());
  // drop ids that no longer exist (saved outfits keep theirs: the gallery skips them when drawing).
  // Each one is logged (FJ-S06): it usually means an id was renamed, which must never happen.
  for (const s in state.worn) if (!DOLL.byId[state.worn[s]]) { report('FJ-S06', 'worn ' + state.worn[s]); delete state.worn[s]; }
  for (const p of state.loose) if (!DOLL.byId[p.id]) report('FJ-S06', 'loose ' + p.id);
  state.loose = state.loose.filter(p => DOLL.byId[p.id]);
  if (!DOLL.hairKeys.includes(state.hair)) { report('FJ-S06', 'hair ' + state.hair); state.hair = 'loose'; }
  if (state.hairColor && !DOLL.hairColors.some(c => c.k === state.hairColor)) { report('FJ-S06', 'hair colour ' + state.hairColor); state.hairColor = ''; }
  [state.hair, state.hairColor] = hairOf(state.hair, state.hairColor);
  for (const k in state.friendWorn) for (const slot in state.friendWorn[k]) {
    if (!DOLL.byId[state.friendWorn[k][slot]]) { report('FJ-S06', k + ' wears ' + state.friendWorn[k][slot]); delete state.friendWorn[k][slot]; }
  }
  if (!Object.prototype.hasOwnProperty.call(SCENES, state.scene)) { report('FJ-S06', 'scene ' + state.scene); state.scene = 'meadow'; }

  /**
   * The hairstyle and colour to wear for a stored [style, colour]. Old keys that were "a style in a colour"
   * (like redbraids) become that style with that colour, so the chest shows them as chosen. Other styles keep the colour.
   */
  function hairOf(hair, color) {
    const old = DOLL.legacyHair[hair];
    return old ? [old[0], old[1]] : [hair, color || ''];
  }

  /* Zoom guard: the game should never be zoomed. If the page is zoomed in anyway
     (a pinch in some corner, or a browser setting that forces zoom), rewriting the
     viewport tag makes Chrome snap back to normal size. */
  function resetZoom() {
    const vv = window.visualViewport, meta = document.getElementById('vp');
    if (!vv || !meta || vv.scale <= 1.01) return;
    const c = meta.getAttribute('content');
    meta.setAttribute('content', c.replace('maximum-scale=1', 'maximum-scale=1.01'));
    setTimeout(() => meta.setAttribute('content', c), 60);
  }
  if (window.visualViewport) visualViewport.addEventListener('resize', () => { clearTimeout(resetZoom.t); resetZoom.t = setTimeout(resetZoom, 400); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') resetZoom(); });
  setTimeout(resetZoom, 500);

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
    init() {
      if (!this.ctx && !this.failed) {
        try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); }
        catch (e) { this.ctx = null; this.failed = true; report('FJ-A03', '', e); }   // tried once; the game stays silent
      }
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    },
    /** One soft tone. */
    tone(freq, dur = .18, type = 'sine', vol = .06, delay = 0, slideTo = 0) {
      if (!state.settings.sound) return; this.init(); const c = this.ctx; if (!c) return;
      const t = c.currentTime + delay, o = c.createOscillator(), g = c.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, t); if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .015); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
      o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + .02);
    },
    /** A piece clicks onto the doll: two bright notes. */
    snap() { this.tone(1046, .16); this.tone(1318, .22, 'sine', .05, .08); },
    /** A piece comes off: one note sliding down. */
    off() { this.tone(660, .14, 'sine', .045, 0, 440); },
    /** An outfit is saved: four rising notes. */
    save() { [784, 988, 1175, 1568].forEach((f, i) => this.tone(f, .25, 'sine', .05, i * .08)); },
    /** Puffin (and fox) chirp. */
    chirp() { this.tone(1800, .08, 'sine', .04, 0, 2600); this.tone(2000, .08, 'sine', .04, .1, 2900); },
    /** Sheep: a soft wobbly "baa". */
    baa() { this.tone(330, .35, 'triangle', .035, 0, 300); this.tone(338, .35, 'triangle', .02, .02, 305); },
    /** Horse hooves: four soft clops. */
    clop() { [0, .14, .28, .42].forEach(d => this.tone(180, .05, 'square', .02, d, 120)); },
    /** Unicorn magic: a quick run of high twinkles. */
    sparkle() { [1568, 1760, 2093, 2349, 2637].forEach((f, i) => this.tone(f, .2, 'sine', .03, i * .06)); },
    /** Magic puff: a soft, quick shimmer of three high notes, quieter than the unicorn's sparkle. */
    magic() { [2093, 2637, 3136].forEach((f, i) => this.tone(f, .22, 'sine', .022, .05 + i * .05)); },
    /** The elf's little bell. */
    bell() { this.tone(1318, .4, 'sine', .04); this.tone(1976, .3, 'sine', .02, .02); },
    /** Things fly back to the chest, or the scene changes. */
    whoosh() { this.tone(500, .25, 'triangle', .02, 0, 900); },
    /** The bus driver's friendly horn: a soft "bíb bíb". */
    horn() { this.tone(523, .16, 'triangle', .05, 0); this.tone(659, .2, 'triangle', .05, .2); },
    /** A heart lands in the jar: two soft bell notes. */
    heart() { this.tone(1318, .3, 'sine', .035); this.tone(1568, .4, 'sine', .03, .1); },
    /** Full jar: a short music-box tune (C major, up and back down to a happy end). */
    melody() { [1047, 1319, 1568, 2093, 1568, 1319, 1568, 2093].forEach((f, i) => { this.tone(f, .45, 'sine', .035, i * .17); this.tone(f / 2, .5, 'triangle', .012, i * .17); }); },
    /** A friend lands in the scene. */
    arrive() { this.tone(523, .25, 'sine', .04, 0, 784); this.sparkle(); },
    /** What a friend sounds like when tapped (voice from FRIENDS). */
    voice(v) {
      if (v === 'mew') this.tone(900, .28, 'sine', .035, 0, 620);
      else if (v === 'yip') { this.tone(700, .09, 'triangle', .03, 0, 1000); this.tone(760, .09, 'triangle', .03, .14, 1080); }
      else if (v === 'sparkle') this.sparkle();
      else { this.tone(523, .22, 'sine', .035); this.tone(784, .3, 'sine', .03, .12); }
    },
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
    const markup = DOLL.renderDoll({ hair: state.hair, hairColor: state.hairColor, worn: state.worn, mood });
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
  /** Where the doll is on screen (a rectangle in pixels). */
  const dollRect = () => dollEl.getBoundingClientRect();
  /** Where the treasure chest is on screen. */
  const chestRect = () => chestEl.getBoundingClientRect();
  /** Is point x,y inside rectangle r (grown by pad pixels on every side)? */
  const inside = (r, x, y, pad = 0) => x >= r.left - pad && x <= r.right + pad && y >= r.top - pad && y <= r.bottom + pad;
  /** The centre point [x, y] of a rectangle. */
  const centre = r => [r.left + r.width / 2, r.top + r.height / 2];
  /** Is a point over the doll's body area (generous, so small hands succeed)? */
  function overDoll(x, y, leaving = false) {
    const r = dollRect(), k = leaving ? .3 : .08;   // pulled off the doll: must leave her body area, not just the picture box
    return inside({ left: r.left + r.width * k, right: r.right - r.width * k, top: r.top + (leaving ? r.height * .05 : 0), bottom: r.bottom - (leaving ? r.height * .04 : 0) }, x, y, leaving ? 0 : 20);
  }
  /** Is a point over the chest, or over the open tray of pieces? */
  function overChest(x, y) { return inside(chestRect(), x, y, 10) || (!trayEl.hidden && inside(trayEl.getBoundingClientRect(), x, y)); }

  /* ---------------------------------------------------------------
     Little effects: flying thumbnails and sparkles
     --------------------------------------------------------------- */
  /** A thumbnail flies from one rect to another (used when pieces go home). */
  function flyThumb(id, from, to, ms = 600, carrier) {
    const it = DOLL.byId[id]; if (!it) return Promise.resolve();
    return flyMarkup((carrier ? `<div style="position:absolute;left:-10%;top:-75%;width:80%;height:80%">${carrier}</div>` : '') + DOLL.renderThumb(it), from, to, ms);
  }
  /** Any picture flies from one rect to another in an arc (pieces, hearts, friends). cls adds a size class. */
  function flyMarkup(markup, from, to, ms = 600, cls = '') {
    const el = document.createElement('div'); el.className = 'ghost' + (cls ? ' ' + cls : '');
    el.innerHTML = markup;
    document.body.appendChild(el); syncDefs();
    const [x0, y0] = centre(from), [x1, y1] = centre(to), lift = Math.min(y0, y1) - 120;
    const anim = el.animate([
      { left: x0 + 'px', top: y0 + 'px', transform: 'translate(-50%,-50%) scale(.8)' },
      { left: (x0 + x1) / 2 + 'px', top: lift + 'px', transform: 'translate(-50%,-50%) scale(1)', offset: .5 },
      { left: x1 + 'px', top: y1 + 'px', transform: 'translate(-50%,-50%) scale(.6)' },
    ], { duration: ms, easing: 'ease-in-out' });
    // finish on the animation end, with a timer as a backup so a flying piece can never get stuck on screen
    return new Promise(res => {
      let done = false;
      // remove the flying picture and finish (only once, whichever comes first)
      const end = () => { if (done) return; done = true; el.remove(); res(); };
      anim.onfinish = end; anim.oncancel = end; setTimeout(end, ms + 400);
    });
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
  /** A helper carries a piece from the chest to the doll and puts it on (puffin twice, then the elf), with a magic puff. */
  function carry(id, fromRect) {
    const useElf = helperTurn++ % 3 === 2;
    Sound[useElf ? 'bell' : 'chirp']();
    const helper = guard('FJ-D04', useElf ? 'elf' : 'puffin', () => (useElf ? CREATURES.elf() : CREATURES.puffin()), '');
    return flyThumb(id, fromRect || chestRect(), dollRect(), 900, helper).then(() => { equip(id); magicPuff(id); });
  }

  const PUFF_COLS = ['#ff9aa8', '#ffbe7a', '#ffe680', '#9de59a', '#8fd0f5', '#c3a8f5'];   // soft rainbow, red → violet
  /**
   * A small glittery rainbow puff where a piece was just put on, as if by magic: six soft rainbow clouds
   * spread out from the piece and fade, with a few twinkling stars. Only transform/opacity animate (cheap on
   * the tablet), and every puff removes itself afterwards, so nothing is left behind.
   */
  function magicPuff(id) {
    const sr = stage.getBoundingClientRect(), dr = dollRect();
    // the piece on the doll (the doll was just redrawn by equip); if it can't be found, use the doll's middle
    const piece = dollEl.querySelector(`[data-item="${CSS.escape(id)}"]`);
    let r = piece ? piece.getBoundingClientRect() : null;
    if (!r || !r.width || !r.height) r = { left: dr.left + dr.width * .3, top: dr.top + dr.height * .3, width: dr.width * .4, height: dr.height * .3 };
    const [cx, cy] = centre(r), size = Math.max(36, Math.min(90, dr.width * .2));
    const ring = Math.max(r.width, r.height) * .35 + size * .35;   // how far the clouds spread out
    PUFF_COLS.forEach((col, i) => {
      const p = document.createElement('div'); p.className = 'puff';
      p.style.cssText = `left:${cx - sr.left}px;top:${cy - sr.top}px;width:${size}px;height:${size}px;background:radial-gradient(circle, ${col} 0 38%, ${col}00 70%)`;
      stage.appendChild(p);
      const a = (i / PUFF_COLS.length) * Math.PI * 2 - Math.PI / 2, dx = Math.cos(a) * ring, dy = Math.sin(a) * ring;
      const anim = p.animate([
        { transform: 'translate(-50%,-50%) scale(.2)', opacity: 0 },
        { transform: `translate(calc(-50% + ${dx * .6}px),calc(-50% + ${dy * .6}px)) scale(1)`, opacity: .95, offset: .35 },
        { transform: `translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(1.35)`, opacity: 0 },
      ], { duration: 900, delay: i * 25, easing: 'ease-out', fill: 'backwards' });
      // remove the cloud when it has faded (a timer too, in case the animation is interrupted)
      const gone = () => p.remove(); anim.onfinish = gone; anim.oncancel = gone; setTimeout(gone, 1400);
    });
    sparkleAt(r, 10);   // the glitter
    Sound.magic();
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
  /** Costume looks whose pieces all exist. */
  const looks = () => DOLL.looks.filter(l => l.items.length && l.items.every(id => DOLL.byId[id]));
  /** Chest tabs that have something in them (hair always does). */
  const catsWithItems = () => CATS.filter(c => c.id === 'hair' || (c.id === 'costume' ? looks().length : itemsIn(c.id).length));
  /** Small picture of a whole look: the doll from head to knees wearing it. */
  const lookThumb = l => {
    const worn = {}; for (const id of l.items) worn[DOLL.slotOf(DOLL.byId[id])] = id;
    const [hair, hairColor] = l.hair ? hairOf(l.hair, state.hairColor) : [state.hair, state.hairColor];
    return `<svg viewBox="40 0 320 560" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${DOLL.renderDoll({ hair, hairColor, worn })}</svg>`;
  };
  /** Put a whole costume on: everything she wears goes back to the chest first, then every piece of the look. */
  function applyLook(l, fromRect) {
    const worn = {};
    for (const id of l.items) {
      const it = DOLL.byId[id]; if (!it) continue;
      const occ = DOLL.occupiesOf(it);
      for (const s in worn) if (s === DOLL.slotOf(it) || DOLL.occupiesOf(DOLL.byId[worn[s]]).some(x => occ.includes(x))) delete worn[s];
      worn[DOLL.slotOf(it)] = id;
    }
    state.worn = worn;
    if (l.hair && HAIR_OK(l.hair)) [state.hair, state.hairColor] = hairOf(l.hair, state.hairColor);
    // happy() redraws the doll, which also moves the gold borders; the list itself is NOT rebuilt,
    // so it stays where she has scrolled to
    Sound.sparkle(); happy(1400); sparkleAt(dollRect(), 12); persist();
  }
  /** Is h a hairstyle that exists (also the old keys)? */
  const HAIR_OK = h => DOLL.hairKeys.includes(h);
  /**
   * A watcher that draws a picture only when its box scrolls into view inside `root` (a whole doll per picture
   * is heavy for an old tablet). Returns null in browsers without IntersectionObserver.
   */
  function lazyWatcher(root, margin) {
    if (!('IntersectionObserver' in window)) return null;
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (!e.isIntersecting || !e.target._draw) return;
      e.target.insertAdjacentHTML('afterbegin', e.target._draw()); e.target._draw = null; io.unobserve(e.target); syncDefs();
    }), { root, rootMargin: margin });
    return io;
  }
  const lazyIO = lazyWatcher(gridEl, '200px'), galleryIO = lazyWatcher(galleryEl, '0px 300px');
  /** Give a box its picture later, when it scrolls into view (or right away in browsers without IntersectionObserver). */
  function lazyThumb(el, draw, io = lazyIO) { if (io) { el._draw = draw; io.observe(el); } else el.insertAdjacentHTML('afterbegin', draw()); }

  /** Build the category tabs; each tab icon is the first piece in that category. */
  function renderTabs() {
    const keep = tabsEl.scrollLeft;          // rebuilding the row must not jump it back to the start
    tabsEl.innerHTML = '';
    for (const c of catsWithItems()) {
      const b = document.createElement('button');
      b.className = 'tab'; b.setAttribute('role', 'tab'); b.setAttribute('aria-label', c.is); b.dataset.cat = c.id;
      b.setAttribute('aria-selected', String(c.id === state.cat));
      b.innerHTML = c.id === 'hair' ? DOLL.renderHairThumb(state.hair, state.hairColor)
        : c.id === 'costume' ? DOLL.renderThumb(DOLL.byId[(looks().find(l => l.id === 'look-fire-red') || looks()[0]).items[0]])   // the firefighter helmet says "costumes"
        : DOLL.renderThumb(itemsIn(c.id)[0]);
      b.addEventListener('click', () => { state.cat = c.id; Sound.tone(880, .08, 'sine', .03); renderTabs(); renderGrid(); persist(); });
      tabsEl.appendChild(b);
    }
    tabsEl.scrollLeft = keep;
    syncDefs();
  }

  /** Build the grid of pieces for the open tab. */
  function renderGrid() {
    if (lazyIO) lazyIO.disconnect();   // stop watching the old tiles, so they can be freed from memory
    gridEl.innerHTML = ''; gridEl.scrollTop = 0;
    if (state.cat === 'hair') {
      gridEl.appendChild(hairColorRow());
      for (const h of DOLL.hairstyles) {
        const t = document.createElement('button'); t.className = 'tile' + (state.hair === h ? ' worn' : ''); t.setAttribute('aria-label', h);
        t.dataset.hair = h;
        t.innerHTML = DOLL.renderHairThumb(h, state.hairColor);
        t.addEventListener('click', () => {
          const first = !state.rewards.hairSeen.includes(h), from = t.getBoundingClientRect();
          state.hair = h; Sound.snap(); happy(); renderTabs(); persist();
          gridEl.querySelectorAll('.tile').forEach(x => x.classList.toggle('worn', x === t));   // move the gold border, keep the scroll
          if (first) { state.rewards.hairSeen.push(h); giveHeart(from); }   // first try of a hairstyle earns a heart
        });
        gridEl.appendChild(t);
      }
    } else if (state.cat === 'costume') {
      for (const l of looks()) {
        const t = document.createElement('button'); t.className = 'tile look'; t.dataset.look = l.id; t.setAttribute('aria-label', l.name ? l.name.is : l.id);
        t.addEventListener('click', () => applyLook(l, t.getBoundingClientRect()));
        gridEl.appendChild(t);
        lazyThumb(t, () => lookThumb(l));
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
  /**
   * The row of hair colour dots above the hairstyles. Tapping a dot colours her hair (and every style tile);
   * tapping the chosen dot again goes back to each style's own colours. The first try of each colour earns a heart.
   */
  function hairColorRow() {
    const row = document.createElement('div'); row.className = 'hair-colors';
    for (const c of DOLL.hairColors) {
      const b = document.createElement('button'); b.className = 'hair-dot' + (state.hairColor === c.k ? ' on' : '');
      b.setAttribute('aria-label', c.is); b.dataset.color = c.k;
      b.innerHTML = DOLL.renderHairSwatch(c.k);
      b.addEventListener('click', () => {
        state.hairColor = state.hairColor === c.k ? '' : c.k;
        const seen = 'c:' + c.k, first = state.hairColor && !state.rewards.hairSeen.includes(seen);
        row.querySelectorAll('.hair-dot').forEach(x => x.classList.toggle('on', x.dataset.color === state.hairColor));
        // redraw the style pictures in the new colour, in place (the list keeps its scroll)
        gridEl.querySelectorAll('.tile[data-hair]').forEach(t => { t.innerHTML = DOLL.renderHairThumb(t.dataset.hair, state.hairColor); });
        Sound.sparkle(); happy(); renderTabs(); syncDefs(); persist();
        if (first) { state.rewards.hairSeen.push(seen); giveHeart(b.getBoundingClientRect()); }
      });
      row.appendChild(b);
    }
    return row;
  }
  /** Gold border on tiles the doll is wearing. */
  function markWornTiles() {
    const worn = new Set(Object.values(state.worn));
    gridEl.querySelectorAll('.tile[data-id]').forEach(t => t.classList.toggle('worn', worn.has(t.dataset.id)));
    // a look gets the gold border while she wears all of it
    gridEl.querySelectorAll('.tile[data-look]').forEach(t => { const l = DOLL.looks.find(x => x.id === t.dataset.look); t.classList.toggle('worn', !!l && l.items.every(id => worn.has(id))); });
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
  /** A finger (or mouse) goes down on a piece: get ready to drag it (the drag starts once it moves 10 px). */
  function startDrag(e, id, origin, el) {
    if (e.button > 0) return;
    // Only one drag at a time. A second finger (or a drag whose finger-up was lost) would
    // otherwise orphan the first ghost: it stays on screen forever and taps pass through it.
    // So the earlier piece is put down where it is first.
    if (drag) settleDrag();
    document.querySelectorAll('.ghost.dragging').forEach(g => g.remove());
    Sound.init();
    drag = { id, origin, el, x0: e.clientX, y0: e.clientY, moved: false, ghost: null, pointer: e.pointerId };
    if (origin !== 'tray') e.preventDefault();
    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
  }
  /** The finger moves: start the drag (show the floating piece) or move the piece along. */
  function onMove(e) {
    if (!drag || e.pointerId !== drag.pointer) return;
    const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
    if (!drag.moved) {
      // in the tray, a mostly vertical move scrolls the list instead of dragging
      if (drag.origin === 'tray' && Math.abs(dy) > Math.abs(dx) * 1.3 && Math.abs(dy) > 8) { cleanupDrag(); return; }
      if (Math.hypot(dx, dy) < 10) return;
      drag.moved = true;
      const g = document.createElement('div'); g.className = 'ghost dragging'; g.innerHTML = DOLL.renderThumb(DOLL.byId[drag.id]);
      document.body.appendChild(g); drag.ghost = g; syncDefs();
      if (drag.origin === 'doll') { unequip(drag.id); Sound.off(); }
      if (drag.origin === 'friend') { undressFriend(drag.friend, drag.id); Sound.off(); }
      if (drag.origin === 'loose') { drag.el.remove(); state.loose = state.loose.filter(p => p !== drag.loosePiece); }
    }
    e.preventDefault();
    drag.ghost.style.left = e.clientX + 'px'; drag.ghost.style.top = e.clientY + 'px';
    drag.lastX = e.clientX; drag.lastY = e.clientY;
  }
  /** The finger lifts: a tap, or drop the piece on the doll, into the chest, or in the scene. */
  function onUp(e) {
    if (!drag || e.pointerId !== drag.pointer) return;
    const d = drag; cleanupDrag();
    const x = e.clientX, y = e.clientY;
    if (!d.moved) return onTap(d);
    d.ghost.remove();
    const ghostRect = { left: x - 40, right: x + 40, top: y - 40, bottom: y + 40, width: 80, height: 80 };
    const friend = friendAt(x, y);
    if (friend && canWear(friend, d.id)) dressFriend(friend, d.id);                 // dressing the lion
    else if (overDoll(x, y, d.origin === 'doll')) { equip(d.id); renderDoll(); }
    else if (overChest(x, y)) { flyThumb(d.id, ghostRect, chestRect(), 350); Sound.off(); chestEl.classList.remove('wiggle'); void chestEl.offsetWidth; chestEl.classList.add('wiggle'); persist(); }
    else dropLoose(d.id, x, y);
  }
  /** The browser cancelled the touch (e.g. a system gesture): put the piece down where it is. */
  function onCancel(e) {
    if (drag && e && e.pointerId !== undefined && e.pointerId !== drag.pointer) return;   // another finger was cancelled
    settleDrag();
  }
  /** End the current drag without a drop target: the piece is put down where it was (nothing is lost). */
  function settleDrag() {
    const d = drag; cleanupDrag();
    if (d && d.ghost) { d.ghost.remove(); if (d.origin !== 'tray') dropLoose(d.id, d.lastX ?? d.x0, d.lastY ?? d.y0); }
  }
  // the app is switched away from or loses focus mid-drag: put the piece down
  window.addEventListener('blur', () => { if (drag) settleDrag(); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && drag) settleDrag(); });
  /** Stop listening to the finger and forget the drag. */
  function cleanupDrag() {
    window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); window.removeEventListener('pointercancel', onCancel);
    drag = null;
  }
  /** Taps: chest piece → a helper carries it on; loose piece → hops on; piece worn by her or a friend → goes home. */
  function onTap(d) {
    if (d.origin === 'tray') carry(d.id, d.el.getBoundingClientRect());
    else if (d.origin === 'loose') { const r = d.el.getBoundingClientRect(); d.el.remove(); state.loose = state.loose.filter(p => p !== d.loosePiece); flyThumb(d.id, r, dollRect(), 450).then(() => { equip(d.id); renderDoll(); }); }
    else if (d.origin === 'doll') { unequip(d.id); Sound.off(); flyThumb(d.id, dollRect(), chestRect(), 500); }
    else if (d.origin === 'friend') { undressFriend(d.friend, d.id); Sound.off(); flyThumb(d.id, d.el.getBoundingClientRect(), chestRect(), 500); }
  }

  /* ---------------------------------------------------------------
     Loose pieces stay in the scene where they were dropped
     --------------------------------------------------------------- */
  /** Keep a % position inside the screen edges. */
  const clampPct = v => Math.max(7, Math.min(93, v));
  /** Leave a piece lying in the scene at screen point x,y (saved as % of the stage). */
  function dropLoose(id, x, y) {
    const sr = stage.getBoundingClientRect();
    const p = { id, x: +clampPct((x - sr.left) / sr.width * 100).toFixed(2), y: +clampPct((y - sr.top) / sr.height * 100).toFixed(2) };
    state.loose.push(p); addLooseEl(p); Sound.tone(587, .1, 'sine', .035); persist();
  }
  /** Show one lying piece and let her pick it up again. */
  function addLooseEl(p) {
    const el = document.createElement('div'); el.className = 'loose';
    el.style.left = p.x + '%'; el.style.top = p.y + '%';
    el.innerHTML = DOLL.renderThumb(DOLL.byId[p.id]);
    el.addEventListener('pointerdown', e => { startDrag(e, p.id, 'loose', el); if (drag) drag.loosePiece = p; });
    looseLayer.appendChild(el);
  }
  /** Draw every lying piece again (kept inside the screen edges). */
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
  /** Draw the chosen scene with its animals, her friends (or bus passengers) and snow. */
  function renderScene() {
    let sc = SCENES[state.scene] || SCENES.meadow;
    const opts = sc.layout ? busOptions() : undefined;     // the bus is drawn to fit where the doll stands
    const svg = guard('FJ-D03', state.scene, () => sc.svg(opts), null);
    if (svg === null) sc = SCENES.meadow;                   // a broken scene: show the meadow instead
    sceneEl.innerHTML = svg ?? sc.svg();
    stage.style.setProperty('--wind', sc.wind + 's');
    critterLayer.innerHTML = '';
    if (sc.layout) seatPassengers(sc, opts);
    (sc.layout ? [] : sc.creatures.concat(friendsHere())).forEach((c, i) => {
      const pic = guard('FJ-D04', c.k, () => (c.friend ? friendPic(c.k) : CREATURES[c.k](c.lantern)), null);
      if (pic === null) return;                               // an animal that can't be drawn is left out
      const el = document.createElement('div');
      el.className = 'creature' + (c.peek ? ' peek' : '') + (c.k === 'puffin' || c.k === 'seal' ? ' idle-bob' : '');
      if (c.friend) el.dataset.friend = c.k;
      // on tall phone screens the animals stand further away on the hillside, so the doll has the foreground
      const spot = portrait && c.k !== 'seal' ? PORTRAIT_SPOTS[i % PORTRAIT_SPOTS.length] : null;   // the seal stays on its beach rock
      // sc.ground: lowest line where the land starts (the sea is above it in Reykjavík), in % of the stage
      el.style.left = (spot ? spot[0] : c.x) + '%'; el.style.top = Math.max(spot ? spot[1] : c.y, sc.ground || 0) + '%'; el.style.height = (portrait ? c.h * .62 : c.h * wideScale()) + '%';
      el.setAttribute('role', 'button'); el.setAttribute('aria-label', c.k);
      el.innerHTML = `<div class="inner">${pic}</div>`;
      el.querySelectorAll('.tail,.head').forEach(n => n.style.animationDelay = (-i * .7) + 's');
      el.addEventListener('pointerdown', e => {
        const piece = c.friend && e.target.closest('[data-item]');   // a piece the friend wears: drag it off
        if (piece) { startDrag(e, piece.dataset.item, 'friend', el); if (drag) drag.friend = c.k; return; }
        e.preventDefault(); creatureTap(c, el);
      });
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
  /* ---- the bus scene: passengers in the windows ---- */
  /** How the 1600×1000 scene maps onto the stage (preserveAspectRatio xMidYMax slice). */
  function sceneMap() {
    const r = stage.getBoundingClientRect(), s = Math.max(r.width / 1600, r.height / 1000);
    return { r, s, ox: (r.width - 1600 * s) / 2, oy: r.height - 1000 * s };
  }
  /** Where the doll stands, in scene units: the door goes behind her and is a bit taller than she is. */
  function busOptions() {
    const m = sceneMap(), d = dollRect();
    // screen pixels → scene units
    const toX = px => (px - m.r.left - m.ox) / m.s, toY = py => (py - m.r.top - m.oy) / m.s;
    const head = toY(d.top + d.height * 50 / 780), feet = toY(d.top + d.height * 752 / 780);   // the doll drawing spans y 50–752 of 780
    return { doorX: toX(d.left + d.width / 2), groundY: feet, k: (feet - head) / 860, left: toX(m.r.left), right: toX(m.r.right) };
  }
  // side-view animals are wide with the head on the right: one per window, pushed right so the head shows
  const WIDE = ['unicorn', 'horse', 'sheep', 'fox', 'foalpink', 'foalmint', 'seal'];
  /** Put passengers in the bus windows (her friends first, newest first) and the driver at the front. */
  function seatPassengers(sc, opts) {
    const L = sc.layout(opts), m = sceneMap();
    const friends = state.settings.rewards ? state.rewards.friends.filter(k => CREATURES[k] && friendOf(k)).slice().reverse() : [];
    const queue = friends.concat(sc.passengers);
    // put one passenger (key) in window w; slot/of: seat 0 or 1 of 1 or 2 in that window
    const seat = (w, key, slot, of) => {
      const box = document.createElement('div'); box.className = 'seat-window';
      Object.assign(box.style, { left: (m.ox + w.x * m.s) + 'px', top: (m.oy + w.y * m.s) + 'px', width: (w.w * m.s) + 'px', height: (w.h * m.s) + 'px' });
      const pic = guard('FJ-D04', key, () => (friendOf(key) ? friendPic(key) : CREATURES[key]()), null);
      if (pic === null) return;
      const f = friendOf(key), c = { k: key, friend: !!f, voice: f && f.voice, seat: true };
      const el = document.createElement('div'); el.className = 'creature seated'; el.dataset.seat = key;
      el.setAttribute('role', 'button'); el.setAttribute('aria-label', f ? f.is : key);
      el.innerHTML = `<div class="inner">${pic}</div>`;
      const H = w.h * m.s * (key === 'driver' ? 1.05 : WIDE.includes(key) ? .95 : .85);   // creature height in px
      const vb = (el.querySelector('svg').getAttribute('viewBox') || '0 0 1 1').split(/\s+/).map(Number);
      const Wd = H * vb[2] / vb[3], bw = w.w * m.s;
      el.style.height = H + 'px';
      el.style.top = (w.h * m.s + H * (key === 'driver' ? .32 : .36)) + 'px';             // the lower third sits below the window: they are sitting
      el.style.left = (key === 'driver' ? bw * .46 : WIDE.includes(key) ? bw - Wd / 2 + bw * .06 : bw * (of === 1 ? .5 : slot ? .72 : .3)) + 'px';
      el.addEventListener('pointerdown', e => { e.preventDefault(); creatureTap(c, el); });
      box.appendChild(el); critterLayer.appendChild(box);
    };
    for (const w of L.windows) {
      if (!queue.length) break;
      const first = queue.shift();
      if (WIDE.includes(first) || !queue.length || WIDE.includes(queue[0])) seat(w, first, 0, 1);
      else { seat(w, first, 0, 2); seat(w, queue.shift(), 1, 2); }
    }
    seat(L.driver, 'driver', 0, 1);
  }

  /**
   * Move animals sideways so none overlap each other, the doll, the chest or the buttons.
   * Works in screen pixels after layout, then writes the result back as % positions.
   * If an animal can't fit anywhere it is made a little smaller and tried again.
   */
  function spreadCreatures() {
    const sr = stage.getBoundingClientRect(), pad = 10;
    // a rectangle grown by m pixels on every side
    const grow = (r, m) => ({ left: r.left - m, right: r.right + m, top: r.top - m, bottom: r.bottom + m });
    // do two rectangles overlap?
    const hit = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    const d = dollRect();
    const blockers = [
      { left: d.left + d.width * .12, right: d.right - d.width * .12, top: d.top, bottom: d.bottom },   // the doll's body
      grow(chestRect(), 6),
      grow(document.querySelector('.bar.left-low').getBoundingClientRect(), 6),
    ];
    // her friends are placed first so they always find a spot; then left to right
    const els = [...critterLayer.children].filter(el => el.classList.contains('creature')).sort((a, b) => (b.dataset.friend ? 1 : 0) - (a.dataset.friend ? 1 : 0) ||
      a.getBoundingClientRect().left - b.getBoundingClientRect().left);
    for (const el of els) {
      let placed = false;
      for (let tries = 0; tries < 4 && !placed; tries++) {
        const r0 = el.getBoundingClientRect(), w = r0.width, h = r0.height;
        const ground = sr.top + sr.height * ((SCENES[state.scene] || {}).ground || 0) / 100;   // feet must stand on land
        // would the animal fit at this spot: on screen, on land, and not overlapping anything?
        const fits = (left, top) => { const r = { left, right: left + w, top, bottom: top + h }; return left >= sr.left + 4 && left + w <= sr.right - 4 && top >= sr.top + sr.height * .45 && top + h >= ground && !blockers.some(b => hit(grow(r, pad), b)); };
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
    for (const el of critterLayer.querySelectorAll('.creature:not(.seated)')) {   // bus passengers keep facing forward
      const [cx] = centre(el.getBoundingClientRect());
      el.classList.toggle('flip', cx > dx);
    }
  }

  /** What each creature does when tapped: a sound and a little hop or wave. The unicorn shows the rainbow. */
  function creatureTap(c, el) {
    Sound.init();
    const cls = c.k === 'horse' && !c.seat ? 'react-tolt' : c.k === 'elf' || c.k === 'driver' ? 'react-wave' : 'react';
    el.classList.remove('react', 'react-tolt', 'react-wave'); void el.offsetWidth; el.classList.add(cls);
    setTimeout(() => el.classList.remove(cls), 1100);
    if (c.friend) { Sound.voice(c.voice); sparkleAt(el.getBoundingClientRect(), 4); return; }
    ({ puffin: () => Sound.chirp(), sheep: () => Sound.baa(), horse: () => Sound.clop(), fox: () => Sound.chirp(), seal: () => Sound.tone(300, .2, 'triangle', .04, 0, 420),
       unicorn: () => { Sound.sparkle(); showRainbow(); sparkleAt(el.getBoundingClientRect(), 10); },
       driver: () => Sound.horn(),
       // the elf only waves and rings his bell; he never puts clothes on her by himself (she chooses her clothes)
       elf: () => { Sound.bell(); sparkleAt(el.getBoundingClientRect(), 4); } })[c.k]?.();
  }
  /** The rainbow shows for a while (unicorn magic). */
  function showRainbow() {
    let rb = sceneEl.querySelector('#rainbow');
    if (!rb) return;
    rb.classList.add('show'); setTimeout(() => rb.classList.remove('show'), 7000);
  }

  /* ---------------------------------------------------------------
     Saved outfits (she saves them herself with the heart)
     --------------------------------------------------------------- */
  /** Text fingerprint of an outfit: hair (and colour, if one is picked) plus the sorted item ids. */
  function outfitKey(hair, worn, color = '') { return hair + (color ? '~' + color : '') + '|' + Object.values(worn).sort().join(','); }
  /** The heart button: save what she wears (a new outfit earns a heart). */
  function saveOutfit() {
    if (!Object.keys(state.worn).length) { Sound.tone(330, .15); return; }
    // Same clothes and hair already saved? Move that one to the front instead of making a copy.
    const sig = outfitKey(state.hair, state.worn, state.hairColor);
    const same = state.outfits.find(x => outfitKey(x.hair, x.worn, x.hairColor) === sig);
    const o = same || { id: 'o' + Date.now().toString(36), createdAt: new Date().toISOString(), hair: state.hair, hairColor: state.hairColor,
      worn: Object.assign({}, state.worn), scene: state.scene };
    state.outfits = [o, ...state.outfits.filter(x => x !== o)].slice(0, MAX_OUTFITS);
    Sound.save(); sparkleAt(dollRect(), 14); happy(1600);
    if (!same) setTimeout(() => giveHeart(dollRect()), 350);   // a new outfit earns a heart for the jar
    const b = $('#btnGallery'); b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop');
    persist(); renderBackupDot(); if (!galleryEl.hidden) renderGallery();
  }
  /** The saved-outfits picture frame: tap one to wear it, long-press to delete. */
  function renderGallery() {
    if (galleryIO) galleryIO.disconnect();   // forget the old cards
    galleryEl.innerHTML = '';
    if (!state.outfits.length) {
      galleryEl.innerHTML = `<div class="empty">${ICON.heart} Ýttu á hjartað til að vista föt</div>`; return;
    }
    for (const o of state.outfits) {
      const card = document.createElement('div'); card.className = 'card'; card.setAttribute('role', 'button');
      card.innerHTML = '<button class="del" aria-label="Eyða">✕</button>';
      // the doll picture is drawn only when the card scrolls into view (with many saved outfits that is much lighter)
      lazyThumb(card, () => `<svg viewBox="60 20 280 740">${DOLL.renderDoll({ hair: o.hair, hairColor: o.hairColor, worn: o.worn })}</svg>`, galleryIO);
      let pressTimer = 0, long = false;
      card.addEventListener('pointerdown', () => { long = false; pressTimer = setTimeout(() => { long = true; card.classList.add('deleting'); }, 800); });
      card.addEventListener('pointerup', e => {
        clearTimeout(pressTimer);
        if (e.target.closest('.del')) { state.outfits = state.outfits.filter(x => x !== o); Sound.off(); persist(); renderGallery(); return; }
        if (long) return;
        if (card.classList.contains('deleting')) { card.classList.remove('deleting'); return; }
        [state.hair, state.hairColor] = hairOf(HAIR_OK(o.hair) ? o.hair : 'loose', o.hairColor); state.worn = Object.fromEntries(Object.entries(o.worn).filter(([, id]) => DOLL.byId[id]));
        Sound.sparkle(); happy(); sparkleAt(dollRect(), 10); persist(); galleryEl.hidden = true;
      });
      card.addEventListener('pointerleave', () => clearTimeout(pressTimer));
      galleryEl.appendChild(card);
    }
    syncDefs();
  }

  /* ---------------------------------------------------------------
     Heart jar and friends (the reward)
     She earns a heart for each NEW outfit she saves and for each
     hairstyle she tries for the first time. A heart flies into the jar.
     10 hearts: a little music-box tune, and a surprise friend flies out
     of the jar into the scene and stays (order: FRIENDS in scenes.js).
     Nothing is ever taken away, there are no timers and no clothes are
     locked. Parents can switch it off in the menu.
     --------------------------------------------------------------- */
  const jarBtn = document.createElement('button');
  jarBtn.className = 'btn jar-btn'; jarBtn.setAttribute('aria-label', 'Hjartakrukka');
  const friendsEl = $('#friends');
  const HEART_D = 'M20,34 C4,24 4,10 13,8 C17,7 19,10 20,12 C21,10 23,7 27,8 C36,10 36,24 20,34Z';
  const HEART_COLS = ['#ef5b7a', '#f48cc0', '#f7a13f', '#f2cf3b', '#5fc46d', '#4aa8e0', '#9b72e0', '#ef5b7a', '#f48cc0', '#5fc46d'];
  /** A small heart centred at cx,cy (k = scale; the base heart is ~32 wide). */
  const heartAt = (cx, cy, k, col) => `<path transform="translate(${cx - 20 * k},${cy - 21 * k}) scale(${k})" d="${HEART_D}" fill="${col}" stroke="${H.ink(col)}" stroke-width="${2.4 / k * .5}"/>`;
  // where the hearts sit inside the jar, bottom row first
  const JAR_SPOTS = [[21, 57], [31, 58], [41, 57], [26, 49.5], [36, 49.5], [20, 42], [31, 42], [42, 42], [26, 34.5], [36, 34.5]];
  /** The glass jar with n hearts inside, a pink ribbon on the lid and a glassy shine. */
  function jarSVG(n) {
    const hearts = JAR_SPOTS.slice(0, n).map(([x, y], i) => heartAt(x, y, .3, HEART_COLS[i])).join('');
    return `<svg viewBox="0 0 60 70" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">` +
      `<path d="M15,22 Q11,26 11,33 V58 Q11,65 18,65 H42 Q49,65 49,58 V33 Q49,26 45,22 Z" fill="#eaf6fb" fill-opacity=".75" stroke="#7fa9bf" stroke-width="2.2"/>` +
      hearts +
      `<path d="M16,30 Q15,44 16,58" stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none" opacity=".8"/>` +
      `<path d="M44,34 Q45,42 44,48" stroke="#fff" stroke-width="2" stroke-linecap="round" fill="none" opacity=".6"/>` +
      `<rect x="14" y="13" width="32" height="10" rx="3.5" fill="#f9c9dc" stroke="#c46b90" stroke-width="2"/>` +
      `<path d="M30,18 l-8,-6 v11z M30,18 l8,-6 v11z" fill="#ef5b8d" stroke="#b33c68" stroke-width="1.6" stroke-linejoin="round"/>` +
      `<circle cx="30" cy="18" r="2.6" fill="#f48cb0" stroke="#b33c68" stroke-width="1.4"/></svg>`;
  }
  // hearts drawn in the jar: the saved count minus hearts still flying towards it
  let heartsInFlight = 0, jarShown = state.rewards.hearts;
  /** Draw the jar with the hearts that have already landed. */
  function renderJar() {
    jarBtn.hidden = !state.settings.rewards;
    jarBtn.innerHTML = jarSVG(Math.max(0, Math.min(JAR_SIZE, jarShown)));
  }
  /** Where the heart jar button is on screen. */
  const jarRect = () => jarBtn.getBoundingClientRect();
  /** Friend info by key. */
  const friendOf = k => FRIENDS.find(f => f.k === k);
  /** Can friend k wear this item? (Friends with dress: true take hats, hairbands, glasses, necklaces and scarves.) */
  const canWear = (k, id) => !!(friendOf(k) && friendOf(k).dress && DOLL.byId[id] && PLUSH_WEAR[DOLL.slotOf(DOLL.byId[id])]);
  /**
   * The friend's picture, wearing what she put on it. Each piece is drawn as on the doll and moved onto the
   * plush by PLUSH_WEAR (scenes.js); hat brims go behind the head, the rest on top, in the doll's layer order.
   */
  function friendPic(k) {
    const f = friendOf(k), worn = state.friendWorn[k] || {};
    if (!f || !f.dress) return CREATURES[k]();
    const wear = { headBack: '', head: '', body: '' };
    for (const slot of Object.keys(worn).sort((a, b) => SLOTS[a].z - SLOTS[b].z)) {
      const it = DOLL.byId[worn[slot]], fit = PLUSH_WEAR[slot];
      if (!it || !fit) continue;
      const out = DOLL.drawItem(it);
      // one part of the piece, moved onto the plush; data-item lets her drag it off again
      const g = m => (m ? `<g data-item="${it.id}" transform="${fit.t}">${m}</g>` : '');
      if (fit.layer === 'head') { wear.headBack += g(out.back); wear.head += g(out.front); }
      else wear.body += g(out.back) + g(out.front);
    }
    return CREATURES[k](wear);
  }
  /** Draw friend k again everywhere it shows (after she dressed or undressed it). */
  function refreshFriend(k) {
    critterLayer.querySelectorAll(`[data-friend="${k}"] .inner, [data-seat="${k}"] .inner`).forEach(n => { n.innerHTML = guard('FJ-D04', k, () => friendPic(k), ''); });
    syncDefs();
  }
  /** Which dressable friend is at screen point x,y (or undefined)? */
  function friendAt(x, y) {
    const el = [...critterLayer.querySelectorAll('.creature[data-friend]')].find(e => !e.hidden && friendOf(e.dataset.friend)?.dress && inside(e.getBoundingClientRect(), x, y, 12));
    return el && el.dataset.friend;
  }
  /** Put a piece on friend k (replacing what it wore in that slot); the friend hops and says thank you. */
  function dressFriend(k, id) {
    const w = state.friendWorn[k] = state.friendWorn[k] || {};
    w[DOLL.slotOf(DOLL.byId[id])] = id;
    refreshFriend(k); Sound.snap(); Sound.voice(friendOf(k).voice);
    const el = critterLayer.querySelector(`[data-friend="${k}"]`);
    if (el) { el.classList.remove('react'); void el.offsetWidth; el.classList.add('react'); setTimeout(() => el.classList.remove('react'), 1100); sparkleAt(el.getBoundingClientRect(), 6); }
    persist();
  }
  /** Take a piece off friend k. */
  function undressFriend(k, id) {
    const w = state.friendWorn[k] || {};
    for (const slot in w) if (w[slot] === id) delete w[slot];
    refreshFriend(k); persist();
  }
  /** Friends shown in this scene: the newest one always, plus one more that changes from scene to scene. */
  function friendsHere() {
    if (!state.settings.rewards) return [];
    const got = state.rewards.friends.filter(k => friendOf(k) && CREATURES[k]);
    if (!got.length) return [];
    const newest = got[got.length - 1], others = got.slice(0, -1);
    const pick = [newest];
    if (others.length) pick.push(others[Math.max(0, Object.keys(SCENES).indexOf(state.scene)) % others.length]);
    return pick.map((k, i) => Object.assign({ k, x: 44 + i * 9, y: 97, friend: true }, friendOf(k)));
  }

  /**
   * Give one heart. It is counted and saved right away (so closing the app can't lose it),
   * then flies from `from` into the jar. A full jar starts the celebration when the heart lands.
   */
  function giveHeart(from) {
    if (!state.settings.rewards) return;
    const r = state.rewards;
    r.hearts++;
    let friend;                                   // undefined: jar not full yet; null: full but every friend already came
    if (r.hearts >= JAR_SIZE) {
      r.hearts = 0;
      const next = FRIENDS.find(f => !r.friends.includes(f.k));
      friend = next ? next.k : null;
      if (next) r.friends.push(next.k);
    }
    flush();
    heartsInFlight++;
    const full = friend !== undefined;
    const col = HEART_COLS[Math.floor(Math.random() * HEART_COLS.length)];
    flyMarkup(`<svg viewBox="0 0 40 40">${heartAt(20, 21, 1, col)}</svg>`, from, jarRect(), 900, 'heart-fly').then(() => {
      heartsInFlight--;
      if (full) { jarShown = JAR_SIZE; renderJar(); celebrate(friend); }
      else { jarShown++; Sound.heart(); renderJar(); }
      jarBtn.classList.remove('pop'); void jarBtn.offsetWidth; jarBtn.classList.add('pop');
    });
  }

  /** Full jar: tune and sparkles, the jar empties, and the new friend flies out into the scene. */
  function celebrate(friend) {
    Sound.melody();
    jarBtn.classList.add('glow');
    sparkleAt(jarRect(), 12);
    setTimeout(() => {
      jarBtn.classList.remove('glow'); jarShown = Math.max(0, state.rewards.hearts - heartsInFlight); renderJar(); sparkleAt(jarRect(), 8);
      if (friend) {
        renderScene();                              // the friend gets its place in the scene (hidden until it lands)
        const el = critterLayer.querySelector(`[data-friend="${friend}"]`);
        if (!el) return;
        el.classList.add('arriving');
        flyMarkup(guard('FJ-D04', friend, () => friendPic(friend), ''), jarRect(), el.getBoundingClientRect(), 1400, 'friend-fly').then(() => {
          el.classList.remove('arriving'); Sound.arrive(); sparkleAt(el.getBoundingClientRect(), 14);
          el.classList.remove('react'); void el.offsetWidth; el.classList.add('react'); setTimeout(() => el.classList.remove('react'), 1100);
          happy(1600);
          if (!friendsEl.hidden) renderFriends();
        });
      } else {
        // every friend is already here: they all hop and the rainbow comes out
        critterLayer.querySelectorAll('[data-friend]').forEach(el => { el.classList.remove('react'); void el.offsetWidth; el.classList.add('react'); setTimeout(() => el.classList.remove('react'), 1100); });
        showRainbow(); happy(1600);
      }
    }, 1500);
  }

  /** Friends shelf (tap the jar): every friend she has, and a wrapped present for the next surprise. */
  function renderFriends() {
    friendsEl.innerHTML = '';
    for (const k of state.rewards.friends) {
      const f = friendOf(k); if (!f || !CREATURES[k]) continue;
      const pic = guard('FJ-D04', k, () => friendPic(k), null); if (pic === null) continue;
      const card = document.createElement('button'); card.className = 'card friend-card'; card.setAttribute('aria-label', f.is);
      card.innerHTML = pic;
      card.addEventListener('click', () => { Sound.voice(f.voice); card.classList.remove('hop'); void card.offsetWidth; card.classList.add('hop'); });
      friendsEl.appendChild(card);
    }
    if (FRIENDS.some(f => !state.rewards.friends.includes(f.k))) {
      // the next friend is a surprise: a present, with the hearts collected so far underneath
      const n = state.rewards.hearts;
      const gift = document.createElement('div'); gift.className = 'card friend-card gift'; gift.setAttribute('aria-label', 'Óvænt');
      gift.innerHTML = `<svg viewBox="0 0 100 124" xmlns="http://www.w3.org/2000/svg">` +
        `<rect x="18" y="38" width="64" height="48" rx="6" fill="#9fd3f0" stroke="#4f8db3" stroke-width="2.5"/>` +
        `<rect x="12" y="28" width="76" height="16" rx="5" fill="#bfe3f7" stroke="#4f8db3" stroke-width="2.5"/>` +
        `<rect x="45" y="28" width="10" height="58" fill="#f48cc0" stroke="#c4568c" stroke-width="2"/>` +
        `<path d="M50,28 C36,10 22,20 36,28 Z M50,28 C64,10 78,20 64,28 Z" fill="#f48cc0" stroke="#c4568c" stroke-width="2" stroke-linejoin="round"/>` +
        // two rows of five hearts: coloured = collected, pale = still to come
        Array.from({ length: JAR_SIZE }, (_, i) => heartAt(14 + (i % 5) * 18, 100 + Math.floor(i / 5) * 15, .36, i < n ? HEART_COLS[i] : '#e4dcd2')).join('') + `</svg>`;
      friendsEl.appendChild(gift);
    }
  }
  jarBtn.addEventListener('click', () => {
    galleryEl.hidden = true;
    friendsEl.hidden = !friendsEl.hidden;
    if (!friendsEl.hidden) { renderFriends(); Sound.heart(); }
  });

  /* ---------------------------------------------------------------
     Parent menu (opens on a long press so little fingers don't find it)
     --------------------------------------------------------------- */
  /** Fill in the parent menu: switches, the storage note and the error log. */
  function renderMenu() {
    $('#optSound').checked = state.settings.sound; $('#optCalm').checked = state.settings.calm; $('#optRewards').checked = state.settings.rewards;
    $('#backupMsg').hidden = true;
    flush();
    $('#storeMsg').textContent = Store.ok
      ? `Allt er vistað á þessu tæki (${state.outfits.length} vistuð föt). Taktu afrit af og til.`
      : 'Vafrinn leyfir ekki að vista. Fötin gleymast þegar leiknum er lokað.';
    renderBackupNote();
    renderErrors();
  }

  const MONTHS_IS = ['janúar', 'febrúar', 'mars', 'apríl', 'maí', 'júní', 'júlí', 'ágúst', 'september', 'október', 'nóvember', 'desember'];
  /** A date in Icelandic, e.g. "1. september 2026" (written out here because not every browser knows Icelandic dates). */
  const dateIs = d => `${d.getDate()}. ${MONTHS_IS[d.getMonth()]} ${d.getFullYear()}`;
  /** Days since the last backup file (Infinity if there never was one). */
  const daysSinceBackup = () => (state.lastBackup ? Math.floor((Date.now() - Date.parse(state.lastBackup)) / 864e5) : Infinity);
  /** Is a backup due? Outfits exist that are not in a backup, and the last one is over 30 days old (or never). */
  const backupDue = () => state.outfits.length > 0 && state.outfits.length !== state.backupOutfits && daysSinceBackup() > 30;
  /** The line in the parent menu that says when the last backup was, and a gentle dot on the gear when one is due. */
  function renderBackupNote() {
    const el = $('#backupWhen'), days = daysSinceBackup(), since = state.outfits.length - state.backupOutfits;
    el.textContent = !state.lastBackup ? 'Ekkert afrit hefur verið tekið enn.'
      : `Síðasta afrit: ${dateIs(new Date(state.lastBackup))}` +
        ` (${days === 0 ? 'í dag' : days === 1 ? 'í gær' : `fyrir ${days} dögum`})` + (since > 0 ? `, ${since} ný föt síðan.` : '.');
    el.classList.toggle('due', backupDue());
  }
  /** The small dot on the gear button (only parents know it): shows when a backup is due. */
  function renderBackupDot() { $('#btnGear').classList.toggle('remind', backupDue()); }
  /** A backup file was saved: remember when, so the reminder goes away. */
  function backupDone() { state.lastBackup = new Date().toISOString(); state.backupOutfits = state.outfits.length; flush(); renderBackupNote(); renderBackupDot(); }

  /** The error log in the parent menu: one line per problem, newest first (code, how often, when, what). */
  function renderErrors() {
    const log = FJ.list();
    $('#errSum').textContent = log.length ? `Villukóðar (${log.length})` : 'Villukóðar';
    $('#errLog').textContent = log.length
      ? log.map(e => `${e.code}${e.n > 1 ? ' ×' + e.n : ''}  ${(FJ.codes[e.code] || ['?'])[0]}\n  ${e.last.slice(0, 16).replace('T', ' ')}  ${e.detail}${e.msg ? ' – ' + e.msg : ''}`).join('\n')
      : `Engar villur skráðar. (útgáfa ${FJ.build || '?'})`;
    $('#errMsg').hidden = true;
  }
  /*  "Afrita" copies the whole log as text (with where in the code each happened), ready to paste
      into a message so the problem can be traced. */
  $('#errCopy').addEventListener('click', async () => {
    const msg = $('#errMsg'); msg.hidden = false;
    try { await navigator.clipboard.writeText(FJ.asText()); msg.textContent = 'Afritað. Límdu það í skilaboð.'; }
    catch (e) {
      // no clipboard access: show the text selected so it can be copied by hand
      $('#errLog').textContent = FJ.asText();
      getSelection().selectAllChildren($('#errLog'));
      msg.textContent = 'Haltu inni á textanum til að afrita hann.';
    }
  });
  $('#errClear').addEventListener('click', () => { FJ.clear(); renderErrors(); });
  $('#errBox').addEventListener('toggle', () => { if ($('#errBox').open) renderErrors(); });   // always fresh when opened
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
      if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: name }); backupDone(); backupNote('Afrit sent.'); return; }
    } catch (e) { if (e && e.name === 'AbortError') return; report('FJ-S05', 'share (now trying a download)', e); }
    try {
      const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = name;
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      backupDone(); backupNote('Afrit vistað í niðurhal (Downloads).');
    } catch (e) { report('FJ-S05', 'download', e); backupNote('Ekki tókst að búa til afrit. Sjá villukóða.'); }
  });
  /*  Opening a backup ADDS its outfits to the ones already here (nothing is deleted).
      The doll, scene and settings stay as they are. */
  $('#menuImport').addEventListener('click', () => $('#importFile').click());
  $('#importFile').addEventListener('change', async e => {
    const f = e.target.files && e.target.files[0]; e.target.value = '';
    if (!f) return;
    // a real backup is well under 1 MB (200 outfits); a huge file is not ours and would only fill the memory
    if (f.size > 5e6) { report('FJ-S04', f.name.slice(0, 60) + ' (' + Math.round(f.size / 1e6) + ' MB)'); backupNote('Þetta er ekki afrit úr Fjársjóðskistunni.'); return; }
    let d = null, why = null; try { d = JSON.parse(await f.text()); } catch (err) { why = err; }
    if (!isObj(d) || !Array.isArray(d.outfits)) { report('FJ-S04', f.name, why); backupNote('Þetta er ekki afrit úr Fjársjóðskistunni.'); return; }
    const have = new Set(state.outfits.map(o => o.id)), keys = new Set(state.outfits.map(o => outfitKey(o.hair, o.worn, o.hairColor)));
    const added = cleanOutfits(d.outfits).filter(o => !have.has(o.id) && !keys.has(outfitKey(o.hair, o.worn, o.hairColor)));
    state.outfits = state.outfits.concat(added)
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).slice(0, MAX_OUTFITS);
    flush(); renderMenu();
    backupNote(added.length ? `${added.length} föt bættust við.` : 'Öll fötin í afritinu voru þegar hér.');
    if (!galleryEl.hidden) renderGallery();
  });
  $('#optSound').addEventListener('change', e => { state.settings.sound = e.target.checked; persist(); });
  $('#optCalm').addEventListener('change', e => { state.settings.calm = e.target.checked; stage.classList.toggle('calm', state.settings.calm); persist(); });
  $('#optRewards').addEventListener('change', e => { state.settings.rewards = e.target.checked; friendsEl.hidden = true; renderJar(); renderScene(); persist(); });
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
    if (b.dataset.armed) { state.worn = {}; state.loose = []; state.outfits = []; state.friendWorn = {}; renderAll(); flush(); b.textContent = 'Eyða öllu'; delete b.dataset.armed; menuEl.hidden = true; }
    else { b.dataset.armed = '1'; b.textContent = 'Ýttu aftur til að staðfesta'; }
  });
  /**
   * The gear opens the parent menu only when held for 1 second, so she doesn't open it by accident.
   * While it is held a ring fills around the gear; a short tap shows a small "Haltu inni" (hold it) note
   * above it, so a grown-up knows what to do. The finger is "captured", so a small wobble off the button
   * doesn't cancel the hold, and Android's own long-press menu is switched off for the button.
   */
  (function longPress(btn) {
    let t = 0, downAt = 0;
    /** Stop holding: empty the ring and forget the timer. */
    const stop = () => { clearTimeout(t); btn.classList.remove('holding'); };
    btn.addEventListener('contextmenu', e => e.preventDefault());
    btn.addEventListener('pointerdown', e => {
      try { btn.setPointerCapture(e.pointerId); } catch (err) { /* older browsers: the hold still works without it */ }
      downAt = Date.now(); btn.classList.add('holding');
      t = setTimeout(() => { stop(); downAt = 0; renderMenu(); menuEl.hidden = false; }, 1000);
    });
    btn.addEventListener('pointerup', () => { const short = downAt && Date.now() - downAt < 1000; stop(); downAt = 0; if (short) holdHint(btn); });
    ['pointercancel', 'lostpointercapture'].forEach(ev => btn.addEventListener(ev, () => { stop(); downAt = 0; }));
  })($('#btnGear'));
  /** The little "Haltu inni" note above the gear for a moment (it never blocks a tap). */
  function holdHint(btn) {
    let n = $('#holdHint');
    if (!n) { n = document.createElement('div'); n.id = 'holdHint'; n.textContent = 'Haltu inni'; document.body.appendChild(n); }
    const r = btn.getBoundingClientRect();
    n.style.left = Math.max(56, Math.min(innerWidth - 56, r.left + r.width / 2)) + 'px';
    n.style.top = Math.max(8, r.top - 10) + 'px';
    n.classList.remove('show'); void n.offsetWidth; n.classList.add('show');
    clearTimeout(holdHint.t); holdHint.t = setTimeout(() => n.classList.remove('show'), 1600);
  }

  /* ---------------------------------------------------------------
     Buttons
     --------------------------------------------------------------- */
  const ICON = {
    heart: '<svg viewBox="0 0 40 40"><path d="M20,34 C4,24 4,10 13,8 C17,7 19,10 20,12 C21,10 23,7 27,8 C36,10 36,24 20,34Z" fill="#ef5b7a" stroke="#b8344f" stroke-width="2.5" stroke-linejoin="round"/><path d="M12,14 q2,-3 5,-2" stroke="#fff" stroke-width="2.5" stroke-linecap="round" fill="none"/></svg>',
    frame: '<svg viewBox="0 0 40 40"><rect x="7" y="5" width="26" height="30" rx="4" fill="#ffe08a" stroke="#c4901e" stroke-width="2.5"/><rect x="11" y="9" width="18" height="22" rx="2" fill="#bfe3f2"/><circle cx="20" cy="16" r="4" fill="#f7d7c3"/><path d="M14,30 Q20,20 26,30Z" fill="#ef5b7a"/></svg>',
    undress: '<svg viewBox="0 0 40 40"><path d="M12,8 l-7,6 4,5 3,-2 v16 h16 v-16 l3,2 4,-5 -7,-6 q-4,4 -8,0 q-4,4 -8,0z" fill="#7fc3ea" stroke="#3f7fa8" stroke-width="2.4" stroke-linejoin="round"/><path d="M28,24 l8,8 M36,24 l-8,8" stroke="#e2505b" stroke-width="3.5" stroke-linecap="round"/></svg>',
    tidy: '<svg viewBox="0 0 40 40"><path d="M6,22 h28 v12 h-28z" fill="#b47a45" stroke="#5c3a1f" stroke-width="2.4"/><path d="M20,4 v14 M14,12 l6,6 6,-6" stroke="#3f8fd2" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    // the gear; the outer "hold-ring" fills up while a grown-up holds the button
    gear: '<svg viewBox="0 0 40 40"><circle class="hold-ring" cx="20" cy="20" r="18" pathLength="100" transform="rotate(-90 20 20)"/><circle cx="20" cy="20" r="7" fill="none" stroke="#7a6a7a" stroke-width="3"/><path d="M20,4v6M20,30v6M4,20h6M30,20h6M8.7,8.7l4.2,4.2M27.1,27.1l4.2,4.2M8.7,31.3l4.2,-4.2M27.1,12.9l4.2,-4.2" stroke="#7a6a7a" stroke-width="3" stroke-linecap="round"/></svg>',
  };
  $('#btnSave').innerHTML = ICON.heart; $('#btnGallery').innerHTML = ICON.frame; $('#btnUndress').innerHTML = ICON.undress; $('#btnTidy').innerHTML = ICON.tidy; $('#btnGear').innerHTML = ICON.gear;
  $('#btnSave').addEventListener('click', saveOutfit);
  $('#btnGallery').addEventListener('click', () => { friendsEl.hidden = true; galleryEl.hidden = !galleryEl.hidden; if (!galleryEl.hidden) { renderGallery(); Sound.tone(698, .1); } });
  $('#btnUndress').addEventListener('click', undress);
  $('#btnTidy').addEventListener('click', tidyUp);
  // scene picker buttons show a tiny version of each scene
  const sceneBar = $('#scenes');
  for (const k of Object.keys(SCENES)) {
    const b = document.createElement('button'); b.className = 'btn scene-btn'; b.dataset.scene = k; b.setAttribute('aria-label', SCENES[k].name);
    b.innerHTML = guard('FJ-D03', k + ' (button)', () => SCENES[k].svg().replace('xMidYMax slice', 'xMidYMid slice'), '');
    b.addEventListener('click', () => { if (state.scene === k) return; state.scene = k; Sound.whoosh(); sceneEl.classList.add('fading'); setTimeout(() => { renderScene(); sceneEl.classList.remove('fading'); }, 300); persist(); });
    sceneBar.appendChild(b);
  }
  sceneBar.appendChild(jarBtn);   // the heart jar sits at the end of the scene row
  stage.addEventListener('pointerdown', () => Sound.init(), { once: true });
  // tapping the scene background closes the gallery
  sceneEl.addEventListener('pointerdown', () => { galleryEl.hidden = true; friendsEl.hidden = true; });

  /** Draw everything from state. */
  function renderAll() { renderScene(); renderDoll(); renderLoose(); renderTabs(); renderGrid(); renderJar(); renderBackupDot(); stage.classList.toggle('calm', state.settings.calm); }
  renderAll();
  trayEl.hidden = true;
})();
