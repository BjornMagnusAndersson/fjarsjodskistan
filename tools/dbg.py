import pathlib
from playwright.sync_api import sync_playwright
root = pathlib.Path('/home/claude/doll')
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome')
    pg = b.new_page(viewport={'width': 412, 'height': 860})
    pg.goto('file://' + str(root / 'tools/_app.html')); pg.wait_for_timeout(500)
    pg.evaluate("localStorage.setItem('fjarsjodskistan.v1', JSON.stringify({worn:{wings:'wings-butterfly-blue'}}))"); pg.reload(); pg.wait_for_timeout(600)
    r = pg.eval_on_selector('#doll', 'e => { const b = e.getBoundingClientRect(); return [b.left, b.top, b.width, b.height]; }')
    print('doll rect', r)
    for fx, fy in [(.12,.4),(.2,.35),(.25,.45),(.8,.4)]:
        x, y = r[0]+r[2]*fx, r[1]+r[3]*fy
        print(fx, fy, pg.evaluate(f"(() => {{ const e = document.elementFromPoint({x},{y}); const g = e && e.closest('[data-item]'); return [e && (e.id || e.className.baseVal || e.className || e.tagName), g && g.dataset.item]; }})()"))
    pg.screenshot(path=str(root/'tools/dbg.png'))
    b.close()
