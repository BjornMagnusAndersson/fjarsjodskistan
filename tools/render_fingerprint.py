"""Fingerprint everything the game draws, to prove a change (like adding comments) changed nothing.

    python tools/render_fingerprint.py before.json      # save fingerprints
    python tools/render_fingerprint.py after.json before.json   # save and compare; exit 1 on any difference

Covers every item (dressed and as a chest tile), every hairstyle, every costume look, every scene and every
creature/friend drawing, rendered straight from src/ in the same file order as the build.
Needs Playwright + Chrome (see CLAUDE.md).
"""
import hashlib, json, pathlib, re, sys
from playwright.sync_api import sync_playwright

root = pathlib.Path(__file__).resolve().parent.parent
src = root / 'src'
order = re.search(r"order\s*=\s*\[([^\]]*)\]", (root / 'tools' / 'build.py').read_text(encoding='utf-8')).group(1)
garments = re.findall(r"'([^']+\.js)'", order)
scripts = [src / 'core.js'] + [src / 'garments' / g for g in garments if (src / 'garments' / g).exists()] + [src / 'scenes.js']
html = '<!doctype html><meta charset=utf-8>' + ''.join('<script>' + p.read_text(encoding='utf-8') + '</script>' for p in scripts)

JS = r'''() => {
  const out = {};
  for (const it of DOLL.items) { out['item:' + it.id] = DOLL.renderDoll({ hair: 'loose', worn: { [DOLL.slotOf(it)]: it.id } }) + DOLL.renderThumb(it); }
  for (const h of DOLL.hairKeys || DOLL.hairstyles) out['hair:' + h] = DOLL.renderHairThumb(h) + DOLL.renderDoll({ hair: h });
  for (const l of DOLL.looks || []) out['look:' + l.id] = JSON.stringify(l);
  for (const k in SCENES) { try { out['scene:' + k] = SCENES[k].svg({}); } catch (e) { out['scene:' + k] = 'ERROR ' + e.message; } }
  for (const k in CREATURES) { try { out['creature:' + k] = typeof CREATURES[k] === 'function' ? String(CREATURES[k]()) : JSON.stringify(CREATURES[k]); } catch (e) { out['creature:' + k] = 'ERROR ' + e.message; } }
  return out;
}'''

with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome'); pg = b.new_page()
    errors = []; pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.set_content(html)
    raw = pg.evaluate(JS); b.close()
if errors:
    print('PAGE ERRORS:', errors); sys.exit(1)
prints = {k: hashlib.sha1(v.encode('utf-8')).hexdigest()[:16] for k, v in raw.items()}
pathlib.Path(sys.argv[1]).write_text(json.dumps(prints, indent=0, sort_keys=True), encoding='utf-8')
print(len(prints), 'things fingerprinted')
if len(sys.argv) > 2:
    old = json.loads(pathlib.Path(sys.argv[2]).read_text(encoding='utf-8'))
    diff = [k for k in sorted(set(old) | set(prints)) if old.get(k) != prints.get(k)]
    for k in diff: print('DIFFERENT', k, old.get(k), '->', prints.get(k))
    print('IDENTICAL' if not diff else f'{len(diff)} differ')
    sys.exit(1 if diff else 0)
