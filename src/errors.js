/* =====================================================================
   Fjársjóðskistan – error codes
   When something goes wrong the game carries on quietly (never a pop-up
   for her), but it writes a short note with an error code into a small
   log. Parents see the log in the parent menu (long-press the gear
   button for 1 second) and can copy it, so a problem can be traced and
   fixed: the code says WHAT went wrong and WHERE to look in the code.

   This file is loaded first, before every other file, so it also catches
   a file that breaks while the game is starting (code FJ-A05 + file name).
   The log lives under its own key, separate from her save, so it can
   never damage her outfits. It keeps the newest MAX entries; the same
   problem repeating only raises its counter (×n).

   Add a new code: add a line to CODES below (and to ERRORS.md), then call
   FJ.report('FJ-X00', 'what it was about', error) where it can happen.
   ===================================================================== */
(function (root) {
  'use strict';
  const LOG_KEY = 'fjarsjodskistan.errors';
  const MAX = 40;

  /** Every code: a short Icelandic label for the parent menu, and an English note on where to look. */
  const CODES = {
    // S: saving and backups (app.js, "Storage adapter" and the parent menu)
    'FJ-S01': ['Gat ekki vistað', 'Saving failed: the browser storage is full or blocked. LocalStore.save in app.js.'],
    'FJ-S02': ['Vistunin var skemmd, afritið var notað', 'The saved game could not be read; it was parked in .broken and the backup copy loaded. LocalStore.load in app.js.'],
    'FJ-S03': ['Vafrinn leyfir ekki að lesa vistun', 'Reading browser storage was refused (private mode or blocked site data). readJSON in app.js.'],
    'FJ-S04': ['Afritsskráin var ekki rétt', 'An imported backup file was not JSON from this game. The importFile handler in app.js.'],
    'FJ-S05': ['Gat ekki búið til afrit', 'Exporting the backup file failed. The menuExport handler in app.js.'],
    'FJ-S06': ['Flík eða greiðsla er ekki lengur til', 'A saved id (clothing piece, hairstyle or scene) no longer exists and was skipped. An id was renamed or removed: ids must never be renamed.'],
    // D: drawing (core.js, scenes.js, garment files)
    'FJ-D01': ['Flík teiknaðist ekki', 'A clothing piece threw while drawing; it is left out. Detail = item id; see its shape in src/garments/.'],
    'FJ-D02': ['Hárgreiðsla teiknaðist ekki', 'A hairstyle threw while drawing; the default hair was used. Detail = style key; HAIRSTYLES in core.js.'],
    'FJ-D03': ['Bakgrunnur teiknaðist ekki', 'A scene threw while drawing (or is unknown); the meadow was used. Detail = scene key; SCENES in scenes.js.'],
    'FJ-D04': ['Dýr teiknaðist ekki', 'A creature or friend threw while drawing; it is left out. Detail = creature key; CREATURES in scenes.js.'],
    // A: the app itself
    'FJ-A01': ['Óvænt villa', 'An unexpected error nobody caught. Detail = where (file:line) and the message.'],
    'FJ-A02': ['Óvænt villa (bið)', 'An unexpected error in something that runs later (a promise). Detail = the message.'],
    'FJ-A03': ['Hljóð fór ekki í gang', 'The sound system (Web Audio) could not start. Sound.init in app.js.'],
    'FJ-A04': ['Ónettengd útgáfa virkar ekki', 'The service worker (offline copy) could not be registered. The register script added by tools/build.py.'],
    'FJ-A05': ['Skrá hlóðst ekki', 'A source file threw while the game was starting; things after the error in that file are missing. Detail = file name.'],
  };

  let loadingFile = '';        // the source file currently starting (set by the build before each file)

  /** Read the log (newest first). Never throws: a broken log is just empty. */
  function list() {
    try { const l = JSON.parse(localStorage.getItem(LOG_KEY) || '[]'); return Array.isArray(l) ? l : []; }
    catch (e) { return []; }
  }

  /** Write the log back (silently gives up if storage is unavailable). */
  function save(log) {
    try { localStorage.setItem(LOG_KEY, JSON.stringify(log.slice(0, MAX))); } catch (e) { /* nothing more we can do */ }
  }

  /** First useful line of an error's stack ("at drawItem (index.html:1234:5)"), to see where it happened. */
  function whereOf(err) {
    const s = err && err.stack ? String(err.stack).split('\n').map(x => x.trim()).filter(x => x.startsWith('at ') || x.includes('@')) : [];
    return s.length ? s[0].replace(/^at /, '').replace(/\(?https?:\/\/[^)\s]*\//g, '(').slice(0, 120) : '';
  }

  /**
   * Note one problem in the log.
   * code: one of CODES; detail: what it was about (an item id, a file name ...); err: the caught error (optional).
   * Repeats of the same code + detail + message only raise the counter, so the log can't fill up with one problem.
   */
  function report(code, detail = '', err = null) {
    const msg = err ? String(err.message || err).slice(0, 200) : '';
    detail = String(detail).slice(0, 120);   // keep every entry small, whatever it is about
    const now = new Date().toISOString();
    const log = list();
    const same = log.find(e => e.code === code && e.detail === String(detail) && e.msg === msg);
    if (same) { same.n++; same.last = now; log.splice(log.indexOf(same), 1); log.unshift(same); }
    else log.unshift({ code, detail: String(detail), msg, where: whereOf(err), n: 1, first: now, last: now, build: FJ.build });
    save(log);
    console.warn(code, (CODES[code] || [''])[1], detail, err || '');
  }

  /** Run fn(); if it throws, log the code and return the fallback instead, so the game carries on. */
  function guard(code, detail, fn, fallback) {
    try { return fn(); } catch (e) { report(code, detail, e); return fallback; }
  }

  /** The log as plain text, one line per entry (for copying and sending). */
  function asText() {
    const log = list();
    if (!log.length) return 'Fjársjóðskistan: no errors logged (build ' + FJ.build + ').';
    return log.map(e => `${e.code}${e.n > 1 ? ' ×' + e.n : ''}  ${e.last.slice(0, 16).replace('T', ' ')}  [${e.build}]  ${e.detail}` +
      `${e.msg ? '  – ' + e.msg : ''}${e.where ? '  @ ' + e.where : ''}`).join('\n');
  }

  // Errors nobody caught: while a file is starting they are FJ-A05 (with the file name), later FJ-A01.
  root.addEventListener('error', e => {
    if (!e || !e.message) return;    // a picture or script that failed to download, not a code error
    if (loadingFile) report('FJ-A05', loadingFile, e.error || e.message);
    else report('FJ-A01', `${(e.filename || '').split('/').pop()}:${e.lineno}:${e.colno}`, e.error || e.message);
  });
  root.addEventListener('unhandledrejection', e => report('FJ-A02', '', e.reason));

  const FJ = {
    build: '',                 // set by the build to the build id (the same id as in sw.js)
    codes: CODES, report, guard, list, asText,
    /** Remove every entry (the "Hreinsa" button in the parent menu). */
    clear() { save([]); },
    /** The build calls this before each source file starts, and with '' when all have started. */
    loading(name) { loadingFile = name; },
  };
  root.FJ = FJ;
})(window);
