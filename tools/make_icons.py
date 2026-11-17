"""Render the app icons (PNG) into src/web/. Run once after changing the drawing.

Needs Playwright (pip install playwright) and Chrome installed. The PNGs are
committed, so the normal build (tools/build.py) does not need this.

    python tools/make_icons.py
"""
import pathlib
from playwright.sync_api import sync_playwright

root = pathlib.Path(__file__).resolve().parent.parent
out = root / 'src' / 'web'
out.mkdir(parents=True, exist_ok=True)

# A treasure chest with a heart and sparkles on a sky background.
# Everything important sits inside the middle 80 % circle so Android's
# round/squircle masks never cut it ("maskable" safe zone).
CHEST = '''
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fd6f0"/><stop offset="1" stop-color="#d9f1e0"/></linearGradient>
    <linearGradient id="wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c98a50"/><stop offset="1" stop-color="#8f5a2c"/></linearGradient>
    <linearGradient id="lid" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d99a5c"/><stop offset="1" stop-color="#a86a36"/></linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe48a"/><stop offset="1" stop-color="#e0a92a"/></linearGradient>
  </defs>
  <ellipse cx="256" cy="402" rx="150" ry="16" fill="#6aa877" opacity=".35"/>
  <!-- heart rising out of the chest -->
  <path d="M256,206 C196,170 200,116 236,114 C248,114 254,124 256,132 C258,124 264,114 276,114 C312,116 316,170 256,206Z" fill="#ef5b7a" stroke="#b8344f" stroke-width="7" stroke-linejoin="round"/>
  <path d="M226,134 q8,-10 20,-6" stroke="#fff" stroke-width="8" stroke-linecap="round" fill="none"/>
  <!-- sparkles -->
  <path d="M158,150 l7,18 18,7 -18,7 -7,18 -7,-18 -18,-7 18,-7z" fill="#fff6c4" stroke="#e0a92a" stroke-width="3"/>
  <path d="M352,128 l5,13 13,5 -13,5 -5,13 -5,-13 -13,-5 13,-5z" fill="#fff6c4" stroke="#e0a92a" stroke-width="3"/>
  <!-- lid (open a little, so the heart can come out) -->
  <path d="M128,236 Q128,186 178,184 L334,184 Q384,186 384,236 Z" fill="url(#lid)" stroke="#5c3a1f" stroke-width="8" stroke-linejoin="round"/>
  <path d="M170,184 Q160,206 158,236 M342,184 Q352,206 354,236" stroke="url(#gold)" stroke-width="16" fill="none"/>
  <!-- box -->
  <rect x="128" y="236" width="256" height="160" rx="18" fill="url(#wood)" stroke="#5c3a1f" stroke-width="8"/>
  <path d="M136,276 H376" stroke="#5c3a1f" stroke-width="5" opacity=".35"/>
  <rect x="150" y="236" width="24" height="160" fill="url(#gold)" stroke="#a87414" stroke-width="4"/>
  <rect x="338" y="236" width="24" height="160" fill="url(#gold)" stroke="#a87414" stroke-width="4"/>
  <!-- lock -->
  <rect x="230" y="248" width="52" height="60" rx="10" fill="url(#gold)" stroke="#a87414" stroke-width="5"/>
  <circle cx="256" cy="272" r="7" fill="#7a4a12"/><path d="M256,276 v16" stroke="#7a4a12" stroke-width="6" stroke-linecap="round"/>
'''

def svg(maskable: bool) -> str:
    # 'any' icon: rounded tile. 'maskable': full-bleed background, Android cuts the shape.
    bg = '<rect width="512" height="512" fill="url(#sky)"/>' if maskable else '<rect x="16" y="16" width="480" height="480" rx="110" fill="url(#sky)"/>'
    body = CHEST.replace('<ellipse', bg + '\n  <ellipse', 1)
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">{body}</svg>'

targets = [('icon-192.png', 192, False), ('icon-512.png', 512, False),
           ('icon-maskable-512.png', 512, True), ('apple-touch-icon.png', 180, True)]
(out / 'icon.svg').write_text(svg(False), encoding='utf-8')
with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome')
    for name, size, mask in targets:
        pg = b.new_page(viewport={'width': size, 'height': size})
        pg.set_content(f'<html><body style="margin:0;background:transparent">'
                       f'<div style="width:{size}px;height:{size}px">{svg(mask).replace("<svg ", f"<svg width=\"{size}\" height=\"{size}\" ", 1)}</div></body></html>')
        pg.screenshot(path=str(out / name), omit_background=True)
        pg.close()
        print('wrote', out / name)
    b.close()
