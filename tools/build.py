"""Build the game.

    python tools/build.py

Writes two things:
  dist/fjarsjodskistan.html  – everything inlined in one file (open it directly, or paste it anywhere)
  docs/                      – the installable web app that GitHub Pages serves:
                               index.html + manifest + service worker + icons
"""
import hashlib
import pathlib
import shutil

root = pathlib.Path(__file__).resolve().parent.parent
src = root / 'src'
read = lambda p: p.read_text(encoding='utf-8')

order = ['examples.js', 'heads.js', 'tops.js', 'dresses.js', 'bottoms.js', 'feet.js']
garments = [src / 'garments' / n for n in order if (src / 'garments' / n).exists()]
js = '\n'.join(read(p) for p in [src / 'core.js', *garments, src / 'scenes.js'])
app = read(src / 'app.js')
html = read(src / 'index.html')
html = html.replace('/*CSS*/', read(src / 'app.css'))
html = html.replace('<script>/*JS*/</script>', '<script>\n' + js + '\n</script>\n<script>\n' + app + "\ndocument.getElementById('chest').innerHTML = document.getElementById('chest').innerHTML;\n</script>")

# 1) single file
out = root / 'dist' / 'fjarsjodskistan.html'
out.parent.mkdir(exist_ok=True)
out.write_text(html, encoding='utf-8', newline='\n')
print(out, len(html) // 1024, 'KB', 'garment files:', [p.name for p in garments])

# 2) web app for GitHub Pages
web = src / 'web'
docs = root / 'docs'
docs.mkdir(exist_ok=True)
head = '''<!doctype html>
<html lang="is">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#bfe3f2">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Fjársjóðskistan">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" type="image/png" sizes="192x192" href="icon-192.png">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
'''
register = '''<script>
if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
</script>
'''
page = html.replace('<meta name="claude:viewport-fit-sides" content="cover">\n', '')
body_start = page.index('<svg id="defs"')   # title, font links and <style> go in <head>, the rest in <body>
page = head + page[:body_start] + '</head>\n<body>\n' + page[body_start:] + register + '</body>\n</html>\n'
(docs / 'index.html').write_text(page, encoding='utf-8', newline='\n')

build = hashlib.sha1(page.encode('utf-8')).hexdigest()[:10]
(docs / 'sw.js').write_text(read(web / 'sw.js').replace('BUILD', build), encoding='utf-8', newline='\n')
for name in ['manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png']:
    shutil.copyfile(web / name, docs / name)
(docs / '.nojekyll').write_text('')
print(docs, 'build', build)
