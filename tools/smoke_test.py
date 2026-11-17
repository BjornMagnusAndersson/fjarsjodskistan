"""End-to-end checks of the built web app (docs/) in real Chrome. Run after python tools/build.py.

Needs Playwright (pip install playwright) and Google Chrome.

    python tools/smoke_test.py

Covers: saving and its safety nets, backup export/import, offline start, two-finger drag,
normal drags, the heart jar and friend arrival, and the error codes (errors.js). Prints PASS/FAIL lines; exit code 1 on any FAIL.

Gotcha for writing tests: the game saves on page hide, so seeding localStorage while the
game page is open gets overwritten on reload. Seed from another page of the same site
(manifest.webmanifest) and then open the game.
"""
import json, pathlib, subprocess, sys, tempfile, time
from playwright.sync_api import sync_playwright

root = pathlib.Path(__file__).resolve().parent.parent
PORT = 8791
URL = f'http://localhost:{PORT}/'
KEY = 'fjarsjodskistan.v1'
ERRKEY = 'fjarsjodskistan.errors'
fails = 0

def ok(cond, msg):
    global fails
    fails += 0 if cond else 1
    print(('PASS ' if cond else 'FAIL ') + msg)

def codes(pg):
    """Error codes in the game's error log (newest first)."""
    return pg.evaluate('FJ.list().map(e => e.code)')

def seed(pg, state):
    """Write a save while the game is NOT open, then open the game."""
    pg.goto(URL + 'manifest.webmanifest')
    pg.evaluate(f'localStorage.setItem("{KEY}", {json.dumps(json.dumps(state))})')
    pg.goto(URL); pg.wait_for_timeout(1300)

srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '-d', str(root / 'docs')], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1.2)
tmpdir = pathlib.Path(tempfile.mkdtemp())
try:
    with sync_playwright() as p:
        b = p.chromium.launch(channel='chrome')

        # ---- saving, backup, offline ----
        ctx = b.new_context(viewport={'width': 1280, 'height': 800}, accept_downloads=True)
        pg = ctx.new_page(); errors = []
        pg.on('pageerror', lambda e: errors.append(str(e)))
        pg.goto(URL); pg.wait_for_timeout(1200)
        worn = pg.evaluate('(() => { const t = DOLL.items.find(i => DOLL.slotOf(i) === "top"), h = DOLL.items.find(i => DOLL.slotOf(i) === "hat"); return { top: t.id, hat: h.id }; })()')
        st = lambda: pg.evaluate(f'JSON.parse(localStorage.getItem("{KEY}"))')
        seed(pg, {'version': 1, 'hair': 'braids', 'worn': worn, 'outfits': [{'id': 'oa', 'createdAt': '2026-01-01', 'hair': 'braids', 'worn': worn}, {'junk': 1}], 'settings': {'sound': False}})
        pg.click('#btnSave'); pg.click('#btnSave'); pg.reload(); pg.wait_for_timeout(1200)
        ok(len(st()['outfits']) == 1, 'saving the same outfit twice keeps one')
        ok(st()['settings'].get('calm') is False and st()['settings'].get('rewards') is True, 'old settings get new defaults')
        pg.evaluate('document.querySelector("#btnUndress").click()'); pg.reload(); pg.wait_for_timeout(1000)
        ok(st()['worn'] == {}, 'a change right before closing is saved')
        pg.goto(URL + 'manifest.webmanifest'); pg.evaluate(f'localStorage.setItem("{KEY}", "{{broken")'); pg.goto(URL); pg.wait_for_timeout(1200)
        ok(pg.evaluate(f'localStorage.getItem("{KEY}.broken")') == '{broken', 'damaged save is parked, not overwritten')
        ok('FJ-S02' in codes(pg), 'a damaged save is logged with code FJ-S02')
        ok(pg.evaluate("document.querySelector('#btnGallery').click(), document.querySelectorAll('#gallery .card').length") == 1, 'outfits come back from the backup copy')
        pg.evaluate("document.querySelector('#gallery').hidden = true")
        g = pg.locator('#btnGear').bounding_box(); pg.mouse.move(g['x'] + 20, g['y'] + 20); pg.mouse.down(); pg.wait_for_timeout(1200); pg.mouse.up()
        ok(pg.is_visible('#menu'), 'parent menu opens on long press')
        with pg.expect_download() as dl: pg.click('#menuExport')
        exp = json.loads(pathlib.Path(dl.value.path()).read_text(encoding='utf-8'))
        ok(exp.get('app') == 'fjarsjodskistan', 'backup file exported')
        exp['outfits'].append({'id': 'onew', 'createdAt': '2026-11-01', 'hair': 'loose', 'worn': {'top': worn['top']}})
        f = tmpdir / 'import.json'; f.write_text(json.dumps(exp), encoding='utf-8')
        pg.set_input_files('#importFile', str(f)); pg.wait_for_timeout(400)
        ok(len(st()['outfits']) == 2, 'importing adds only new outfits')
        bad = tmpdir / 'bad.json'; bad.write_text('not a backup', encoding='utf-8')
        pg.set_input_files('#importFile', str(bad)); pg.wait_for_timeout(400)
        ok('FJ-S04' in codes(pg) and len(st()['outfits']) == 2, 'a wrong backup file is refused and logged (FJ-S04)')
        pg.click('#errSum'); pg.wait_for_timeout(100)
        ok('FJ-S04' in pg.inner_text('#errLog') and 'FJ-S02' in pg.inner_text('#errLog'), 'the parent menu shows the error codes')
        pg.click('#menuClose'); pg.reload(); pg.wait_for_timeout(1500)
        ok(pg.evaluate('navigator.serviceWorker.controller !== null'), 'service worker active')
        ctx.set_offline(True); pg.reload(); pg.wait_for_timeout(1500)
        ok(pg.locator('#doll svg').count() == 1, 'starts offline'); ctx.set_offline(False)
        ok(not errors, f'no page errors {errors}')
        ctx.close()

        # ---- error codes: a broken piece is skipped, a broken file is named ----
        pg = b.new_page(viewport={'width': 1280, 'height': 800}); pg.goto(URL); pg.wait_for_timeout(1000); pg.evaluate('FJ.clear()')
        drawn = pg.evaluate("""(() => { DOLL.shape('test-broken', { slot: 'top', draw() { throw new Error('boom'); } });
          DOLL.add([{ id: 'top-test-broken', shape: 'test-broken', cat: 'top', colors: [] }]);
          return DOLL.renderDoll({ hair: 'loose', worn: { top: 'top-test-broken' } }).length; })()""")
        log = pg.evaluate('FJ.list()')
        ok(drawn > 1000 and log and log[0]['code'] == 'FJ-D01' and log[0]['detail'] == 'top-test-broken', 'a broken piece is left out and logged (FJ-D01 + its id)')
        pg.add_script_tag(content="FJ.loading('test-file.js');"); pg.add_script_tag(content="throw new Error('start-up boom');"); pg.add_script_tag(content="FJ.loading('');")
        log = pg.evaluate('FJ.list()')
        ok(log[0]['code'] == 'FJ-A05' and log[0]['detail'] == 'test-file.js', 'a file that breaks while starting is named (FJ-A05)')
        pg.evaluate('setTimeout(() => { null.x; })'); pg.wait_for_timeout(200)
        ok(pg.evaluate('FJ.list()[0].code') == 'FJ-A01', 'an unexpected error later gets FJ-A01')
        pg.evaluate('FJ.clear()'); pg.close()

        # ---- touch: two-finger drag and normal drags ----
        ctx = b.new_context(viewport={'width': 1280, 'height': 800}, has_touch=True, is_mobile=True); pg = ctx.new_page()
        pg.goto(URL); pg.wait_for_timeout(1000)
        tops = pg.evaluate('DOLL.items.filter(i => DOLL.slotOf(i) === "top").slice(0, 2).map(i => i.id)')
        seed(pg, {'version': 1, 'loose': [{'id': tops[0], 'x': 60, 'y': 60}, {'id': tops[1], 'x': 75, 'y': 30}]})
        cdp = ctx.new_cdp_session(pg)
        T = lambda kind, pts: cdp.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': [{'x': x, 'y': y, 'id': i} for i, x, y in pts]})
        (ax, ay), (bx, by) = pg.evaluate("[...document.querySelectorAll('#loose .loose')].map(l => { const r = l.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; })")
        T('touchStart', [(1, ax, ay)])
        for k in range(1, 8): T('touchMove', [(1, ax - k * 15, ay + k * 5)]); pg.wait_for_timeout(16)
        T('touchStart', [(1, ax - 105, ay + 35), (2, bx, by)])
        for k in range(1, 8): T('touchMove', [(1, ax - 105, ay + 35), (2, bx - k * 15, by + k * 10)]); pg.wait_for_timeout(16)
        T('touchEnd', [(2, bx - 105, by + 70)]); T('touchEnd', []); pg.wait_for_timeout(800)
        ok(pg.evaluate("document.querySelectorAll('.ghost').length") == 0 and pg.locator('#loose .loose').count() == 2, 'two-finger drag leaves no stuck piece')
        l = pg.locator('#loose .loose').first.bounding_box(); d = pg.locator('#doll').bounding_box()
        (x0, y0), (x1, y1) = (l['x'] + l['width'] / 2, l['y'] + l['height'] / 2), (d['x'] + d['width'] / 2, d['y'] + d['height'] * .45)
        T('touchStart', [(1, x0, y0)])
        for k in range(1, 13): T('touchMove', [(1, x0 + (x1 - x0) * k / 12, y0 + (y1 - y0) * k / 12)]); pg.wait_for_timeout(16)
        T('touchEnd', []); pg.wait_for_timeout(900)
        ok(bool(pg.evaluate(f'JSON.parse(localStorage.getItem("{KEY}") || "{{}}").worn || null')), 'dragging a piece onto the doll dresses her')
        ok(codes(pg) == [], f'normal play logs no errors {codes(pg)}')
        ctx.close()

        # ---- costume tab: tapping a look keeps the list where she scrolled to ----
        pg = b.new_page(viewport={'width': 1280, 'height': 800})
        seed(pg, {'version': 1, 'cat': 'costume'})
        pg.click('#chest'); pg.wait_for_timeout(800)
        pg.evaluate("document.querySelector('#tabs').scrollLeft = 400"); pg.wait_for_timeout(100)
        tabs_before = pg.evaluate("document.querySelector('#tabs').scrollLeft")
        pg.evaluate("document.querySelector('#grid').scrollTop = 600"); pg.wait_for_timeout(400)
        before = pg.evaluate("document.querySelector('#grid').scrollTop")
        tile = pg.evaluate("(() => { const g = document.querySelector('#grid'), r = g.getBoundingClientRect(); const t = [...g.querySelectorAll('.tile.look')].find(t => { const b = t.getBoundingClientRect(); return b.top > r.top && b.bottom < r.bottom; }); t.click(); return t.dataset.look; })()")
        pg.wait_for_timeout(900)
        ok(before > 0 and pg.evaluate("document.querySelector('#grid').scrollTop") == before, 'tapping a costume keeps the list scrolled')
        ok(pg.evaluate(f"document.querySelector('[data-look=\"{tile}\"]').classList.contains('worn')"), 'the tapped costume gets the gold border')
        ok(tabs_before > 0 and pg.evaluate("document.querySelector('#tabs').scrollLeft") == tabs_before, 'the tab row stays where it was')
        pg.close()

        # ---- heart jar and friends, both orientations ----
        for vp, tag in (({'width': 1280, 'height': 800}, 'landscape'), ({'width': 800, 'height': 1280}, 'portrait')):
            pg = b.new_page(viewport=vp)
            seed(pg, {'version': 1, 'hair': 'loose', 'worn': {'top': worn['top']}, 'rewards': {'hearts': 8, 'friends': [], 'hairSeen': ['loose']}})
            rw = lambda: pg.evaluate(f'JSON.parse(localStorage.getItem("{KEY}")).rewards')
            pg.click('#btnSave'); pg.wait_for_timeout(1600)
            ok(rw()['hearts'] == 9, f'[{tag}] a new outfit gives a heart')
            pg.click('#btnSave'); pg.wait_for_timeout(1300)
            ok(rw()['hearts'] == 9, f'[{tag}] the same outfit again gives none')
            pg.click('#chest'); pg.wait_for_timeout(800); pg.click('#tabs [data-cat=hair]'); pg.wait_for_timeout(300)
            pg.click('#grid .tile:nth-child(4)'); pg.wait_for_timeout(1000)
            ok(rw()['friends'] == ['lion'] and rw()['hearts'] == 0, f'[{tag}] a full jar brings the first friend')
            pg.click('#chest'); pg.wait_for_timeout(4000)
            ok(pg.evaluate("(() => { const e = document.querySelector('[data-friend=lion]'); return !!e && !e.hidden && !e.classList.contains('arriving'); })()"), f'[{tag}] the friend is in the scene')
            ok(pg.evaluate("document.querySelectorAll('.ghost').length") == 0, f'[{tag}] nothing left flying')
            pg.close()
        b.close()
finally:
    srv.terminate()
print('ALL PASSED' if not fails else f'{fails} FAILED')
sys.exit(1 if fails else 0)
