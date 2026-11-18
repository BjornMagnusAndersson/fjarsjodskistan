"""Build the game.

    python tools/build.py

Writes two things:
  dist/fjarsjodskistan.html  – everything inlined in one file (open it directly, or paste it anywhere)
  docs/                      – the installable web app that GitHub Pages serves:
                               index.html + manifest + service worker + icons
"""
import base64
import hashlib
import pathlib
import re
import shutil

root = pathlib.Path(__file__).resolve().parent.parent
src = root / 'src'
read = lambda p: p.read_text(encoding='utf-8')

order = ['examples.js', 'heads.js', 'face.js', 'wrists.js', 'tops.js', 'dresses.js', 'bottoms.js', 'feet.js',
         'swim.js', 'costumes_work.js', 'costumes_care.js', 'costumes_magic.js', 'tails.js', 'christmas.js']
garments = [src / 'garments' / n for n in order if (src / 'garments' / n).exists()]
sources = [src / 'core.js', *garments, src / 'scenes.js', src / 'app.js']


def script(path):
    """One <script> per source file, so a file that breaks can't stop the others from starting.
    Each first tells the error log which file is starting (an error during start-up then names the file, FJ-A05)."""
    return f"<script>\nFJ.loading('{path.name}');\n{read(path)}\n</script>\n"


# errors.js comes first so it catches problems in every file after it; BUILD_ID is filled in below
scripts = ('<script>\n' + read(src / 'errors.js') + "\nFJ.build = 'BUILD_ID';\n</script>\n" +
           ''.join(script(p) for p in sources) +
           # all files have started; re-setting the chest picture makes the browser redraw its gradients
           "<script>\nFJ.loading('');\ndocument.getElementById('chest').innerHTML = document.getElementById('chest').innerHTML;\n</script>")
html = read(src / 'index.html')
html = html.replace('/*CSS*/', read(src / 'app.css'))
html = html.replace('<script>/*JS*/</script>', scripts)


# 2) web app for GitHub Pages (written first, because the build id comes from it)
web = src / 'web'
docs = root / 'docs'
docs.mkdir(exist_ok=True)
head = '''<!doctype html>
<html lang="is">
<head>
<meta charset="utf-8">
<meta name="viewport" id="vp" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
<meta name="theme-color" content="#bfe3f2">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Fjársjóðskistan">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" type="image/png" sizes="192x192" href="icon-192.png">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
'''
register = '''<script>
// offline copy of the game; if it can't be set up, note it in the error log (FJ-A04)
if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(e => FJ.report('FJ-A04', '', e)));
</script>
'''
page = html.replace('<meta name="claude:viewport-fit-sides" content="cover">\n', '')
body_start = page.index('<svg id="defs"')   # title, font links and <style> go in <head>, the rest in <body>
page = head + page[:body_start] + '</head>\n<body>\n' + page[body_start:] + register + '</body>\n</html>\n'

# the build id: a fingerprint of the whole page. It is shown with the error codes and names the offline cache.
build = hashlib.sha1(page.encode('utf-8')).hexdigest()[:10]
page = page.replace("FJ.build = 'BUILD_ID';", f"FJ.build = '{build}';")


def security_policy(page):
    """The page's security rules (Content-Security-Policy). The browser then runs ONLY the scripts written here at
    build time (each is named by a fingerprint of its exact text), so code that sneaks in later can't run: no
    injected scripts, no onclick="..." in drawings, nothing loaded from other websites. Allowed from outside: only
    the Google font. Saving (localStorage) and the backup download are not affected."""
    hashes = ' '.join("'sha256-" + base64.b64encode(hashlib.sha256(s.encode('utf-8')).digest()).decode() + "'"
                      for s in re.findall(r'<script>(.*?)</script>', page, flags=re.S))
    rules = ["default-src 'self'", f"script-src {hashes}", "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
             "font-src https://fonts.gstatic.com", "img-src 'self' data: blob:", "connect-src 'self'", "worker-src 'self'",
             "manifest-src 'self'", "object-src 'none'", "base-uri 'none'", "form-action 'none'"]
    return f'<meta http-equiv="Content-Security-Policy" content="{"; ".join(rules)}">\n'


page = page.replace('<meta charset="utf-8">\n', '<meta charset="utf-8">\n' + security_policy(page), 1)
(docs / 'index.html').write_text(page, encoding='utf-8', newline='\n')
(docs / 'sw.js').write_text(read(web / 'sw.js').replace('BUILD', build), encoding='utf-8', newline='\n')

# 1) single file (same page without the web-app parts)
single = html.replace("FJ.build = 'BUILD_ID';", f"FJ.build = '{build}';")
out = root / 'dist' / 'fjarsjodskistan.html'
out.parent.mkdir(exist_ok=True)
out.write_text(single, encoding='utf-8', newline='\n')
print(out, len(single) // 1024, 'KB', 'garment files:', [p.name for p in garments])
for name in ['manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png']:
    shutil.copyfile(web / name, docs / name)
(docs / '.nojekyll').write_text('')
print(docs, 'build', build)
