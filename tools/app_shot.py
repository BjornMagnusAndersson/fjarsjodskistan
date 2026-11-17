"""Screenshot the built game. Usage: app_shot.py out.png [w h] [actions]"""
import sys, pathlib
from playwright.sync_api import sync_playwright
root = pathlib.Path(__file__).resolve().parent.parent
out = sys.argv[1]; w = int(sys.argv[2]) if len(sys.argv) > 2 else 1280; h = int(sys.argv[3]) if len(sys.argv) > 3 else 800
acts = sys.argv[4] if len(sys.argv) > 4 else ''
html = (root / 'dist/fjarsjodskistan.html').read_text()
page_html = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>' + html + '</body></html>'
tmp = root / 'tools/_app.html'; tmp.write_text(page_html)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome')
    pg = b.new_page(viewport={'width': w, 'height': h})
    logs = []
    pg.on('console', lambda m: logs.append(f'{m.type}: {m.text}') if m.type in ('error', 'warning') else None)
    pg.on('pageerror', lambda e: logs.append(f'pageerror: {e}'))
    pg.goto('file://' + str(tmp)); pg.wait_for_timeout(800)
    for a in filter(None, [x.strip() for x in acts.split(';')]):
        exec(a)
    pg.wait_for_timeout(1500)
    pg.screenshot(path=out)
    b.close()
    print('\n'.join(logs[:20]))
