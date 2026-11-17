import pathlib
from playwright.sync_api import sync_playwright
root = pathlib.Path('/home/claude/doll')
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome')
    pg = b.new_page(viewport={'width': 412, 'height': 860}, has_touch=True)
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('file://' + str(root / 'tools/_app.html')); pg.wait_for_timeout(600)
    pg.evaluate("localStorage.clear()"); pg.reload(); pg.wait_for_timeout(600)
    pg.click('#chest'); pg.wait_for_timeout(400); pg.click('[data-cat=cape]'); pg.wait_for_timeout(200)
    tiles = pg.query_selector_all('.tile'); tiles[-6].click(); pg.wait_for_timeout(1500)   # butterfly wings
    pg.click('#chest'); pg.wait_for_timeout(500)
    st = lambda: pg.evaluate("JSON.parse(localStorage.getItem('fjarsjodskistan.v1')||'{}')")
    pg.wait_for_timeout(400); print('worn after tap:', st().get('worn'))
    # drag from a wing tip (outside the body) a little way to the side
    r = pg.eval_on_selector('#doll', 'e => { const b = e.getBoundingClientRect(); return [b.left, b.top, b.width, b.height]; }')
    x0, y0 = r[0] + r[2] * .2, r[1] + r[3] * .35
    pg.mouse.move(x0, y0); pg.mouse.down(); pg.mouse.move(x0 - 20, y0 + 10, steps=5); pg.mouse.move(x0 - 30, y0 + 30, steps=5); pg.mouse.up()
    pg.wait_for_timeout(500); s = st(); print('worn after drag off:', s.get('worn'), 'loose:', s.get('loose'))
    print('errors', errs); b.close()
