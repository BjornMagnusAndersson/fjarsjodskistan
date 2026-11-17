"""Render dolls, hairstyles, item thumbnails or friends from the built game to one PNG, to look at.

Needs: python tools/build.py first, Playwright (pip install playwright) and Google Chrome.

    python tools/preview.py out.png '<json list>' [page width] [doll viewBox]

Each entry in the JSON list is one tile:
    {"hair": "bob", "items": ["face-cat-pink", "glasses-round-gold"], "mood": "happy"}  a dressed doll
    {"hair": "bob", "thumb": 1}            the hairstyle's chest tile
    {"itemThumb": "tee-strawberry"}        an item's chest tile
    {"friend": "lion"}                     a reward friend / creature drawing (any CREATURES key)
    {"look": "fire-red"}                   a costume look (DOLL.looks) on the doll
Optional per tile: "w", "h" (tile size in px), "label".
Example (heads only, zoomed): python tools/preview.py tools/p.png '[{"hair":"locs","w":300,"h":390}]' 1000 "70 30 260 340"

--files a.js b.js   (at the end) render straight from src/ instead of dist/: core.js, the approved garment files and
                    the listed files from src/garments/, each in its own <script> (so a broken file elsewhere can't stop
                    yours). Use this while drawing; no build needed.
"""
import json, sys, pathlib
from playwright.sync_api import sync_playwright

root = pathlib.Path(__file__).resolve().parent.parent
argv = sys.argv[1:]
files = []
if '--files' in argv:
    i = argv.index('--files'); files = argv[i + 1:]; argv = argv[:i]
out = pathlib.Path(argv[0]).resolve(); spec = json.loads(argv[1])
width = int(argv[2]) if len(argv) > 2 else 1400
vb = argv[3] if len(argv) > 3 else '40 10 320 640'
if files:
    src = root / 'src'
    base = ['examples.js', 'heads.js', 'face.js', 'wrists.js', 'tops.js', 'dresses.js', 'bottoms.js', 'feet.js']
    parts = [src / 'core.js'] + [src / 'garments' / n for n in base if n not in files] + [src / 'garments' / pathlib.Path(n).name for n in files] + [src / 'scenes.js']
    html = ''.join('<script>\n' + p.read_text(encoding='utf-8') + '\n</script>\n' for p in parts if p.exists())
else:
    html = (root / 'dist' / 'fjarsjodskistan.html').read_text(encoding='utf-8')
tmp = out.with_suffix('.html')
tmp.write_text('<!doctype html><html><head><meta charset="utf-8"></head><body>' + html + '</body></html>', encoding='utf-8')
with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome'); pg = b.new_page(viewport={'width': width, 'height': 900}); errors = []
    pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.on('console', lambda m: errors.append(f'{m.type}: {m.text}') if m.type in ('error', 'warning') else None)   # duplicate ids, unknown items ...
    pg.goto(tmp.as_uri()); pg.wait_for_timeout(600)
    pg.evaluate("""([spec, vb]) => {
      document.body.innerHTML = '<svg id="defs" style="position:absolute;width:0;height:0"><defs></defs></svg><div id="g" style="display:flex;flex-wrap:wrap;gap:8px;padding:10px;background:linear-gradient(#bfe3f2,#e9f6ea)"></div>';
      document.body.style.overflow = 'auto';
      for (const s of spec) {
        if (s.look) { const l = DOLL.looks.find(x => x.id === s.look); if (!l) console.error('unknown look ' + s.look); s.items = l ? l.items : []; s.hair = s.hair || (l && l.hair) || 'loose'; s.label = s.label || s.look; }
        const worn = {}; for (const id of (s.items || [])) { const it = DOLL.byId[id]; if (it) worn[DOLL.slotOf(it)] = id; else console.error('unknown item ' + id); }
        const inner = s.friend ? CREATURES[s.friend]()
          : s.thumb ? DOLL.renderHairThumb(s.hair)
          : s.itemThumb ? DOLL.renderThumb(DOLL.byId[s.itemThumb])
          : `<svg viewBox="${vb}">${DOLL.renderDoll({ hair: s.hair, worn, mood: s.mood })}</svg>`;
        const tile = !!(s.friend || s.thumb || s.itemThumb);
        const d = document.createElement('div'); d.style.cssText = 'text-align:center;font:12px sans-serif';
        d.innerHTML = `<div style="width:${s.w || (tile ? 130 : 240)}px;height:${s.h || (tile ? 130 : 480)}px;background:${tile ? '#fff' : 'none'};border-radius:12px">` +
          inner.replace('<svg ', '<svg width="100%" height="100%" ') + `</div>${s.label || s.friend || s.itemThumb || s.hair || ''}`;
        document.getElementById('g').appendChild(d);
      }
      document.querySelector('#defs defs').innerHTML = DOLL.defsString();
      document.querySelectorAll('.lid').forEach(l => l.style.display = 'none');   // eyes open
    }""", [spec, vb])
    pg.wait_for_timeout(300)
    pg.screenshot(path=str(out), full_page=True)
    b.close()
tmp.unlink()
print(out, '| page errors:', errors or 'none')
