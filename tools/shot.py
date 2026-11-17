"""Screenshot an HTML file with headless Chrome. Usage: python3 shot.py in.html out.png [width] [height]"""
import sys
from playwright.sync_api import sync_playwright
src, out = sys.argv[1], sys.argv[2]
w = int(sys.argv[3]) if len(sys.argv) > 3 else 1200
h = int(sys.argv[4]) if len(sys.argv) > 4 else 900
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome')
    pg = b.new_page(viewport={'width': w, 'height': h}, device_scale_factor=1)
    msgs = []
    pg.on('console', lambda m: msgs.append(f'{m.type}: {m.text}'))
    pg.on('pageerror', lambda e: msgs.append(f'pageerror: {e}'))
    pg.goto('file://' + src)
    pg.wait_for_timeout(600)
    pg.screenshot(path=out, full_page=True)
    b.close()
    for m in msgs: print(m)
