"""Inline everything into one HTML file: dist/fjarsjodskistan.html"""
import pathlib
root = pathlib.Path(__file__).resolve().parent.parent
src = root / 'src'
order = ['examples.js', 'heads.js', 'tops.js', 'dresses.js', 'bottoms.js', 'feet.js']
garments = [src / 'garments' / n for n in order if (src / 'garments' / n).exists()]
js = '\n'.join(p.read_text() for p in [src / 'core.js', *garments, src / 'scenes.js'])
app = (src / 'app.js').read_text().replace("const CHEST_SVG", "const CHEST_SVG")
html = (src / 'index.html').read_text()
html = html.replace('/*CSS*/', (src / 'app.css').read_text())
html = html.replace('<script>/*JS*/</script>', '<script>\n' + js + '\n</script>\n<script>\n' + app + "\ndocument.getElementById('chest').innerHTML = document.getElementById('chest').innerHTML;\n</script>")
out = root / 'dist' / 'fjarsjodskistan.html'
out.write_text(html)
print(out, len(html) // 1024, 'KB', 'garment files:', [p.name for p in garments])
