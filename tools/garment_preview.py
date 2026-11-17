"""Preview garments: a grid of chest thumbnails plus dressed dolls.
Usage: python3 garment_preview.py out.png garments/a.js [garments/b.js ...] [--outfits outfits.json] [--only-thumbs]"""
import sys, json, pathlib, subprocess
root = pathlib.Path(__file__).resolve().parent.parent
args = sys.argv[1:]
out = pathlib.Path(args.pop(0)).resolve()
outfits = []
if '--outfits' in args:
    i = args.index('--outfits'); outfits = json.loads(pathlib.Path(args[i + 1]).read_text()); del args[i:i + 2]
only = '--only-thumbs' in args
args = [a for a in args if a != '--only-thumbs']
scripts = (root / 'src/core.js').read_text() + '\n' + '\n'.join((root / 'src' / a).read_text() for a in args)
html = f"""<!doctype html><meta charset="utf-8">
<style>
 body{{margin:0;background:#eef4f1;font-family:sans-serif;color:#2c3a33}}
 .grid{{display:grid;grid-template-columns:repeat(auto-fill,150px);gap:10px;padding:16px}}
 .t{{background:#fffaf2;border:2px solid #d9c9b2;border-radius:14px;height:170px;display:flex;flex-direction:column;align-items:center;justify-content:center}}
 .t svg{{width:128px;height:128px}} .t p{{margin:4px 0 0;font-size:11px;text-align:center}}
 .dolls{{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;padding:6px 10px 16px;background:linear-gradient(#bfe3f2,#e9f6ea 70%,#cfe8b8)}}
 .dolls svg{{width:280px;height:540px}}
 .lid{{transform:scaleY(0);transform-box:fill-box;transform-origin:top}}
 #defs{{position:absolute;width:0;height:0}}
 .err{{color:#b00;padding:10px}}
</style>
<svg id="defs"><defs></defs></svg>
<div class="dolls" id="dolls"></div>
<div class="grid" id="grid"></div>
<script>{scripts}</script>
<script>
 const outfits = {json.dumps(outfits)};
 const only = {json.dumps(only)};
 const grid = document.getElementById('grid'), dolls = document.getElementById('dolls');
 for (const it of DOLL.items) {{
   const d = document.createElement('div'); d.className = 't';
   d.innerHTML = DOLL.renderThumb(it) + `<p>${{it.id}}</p>`; grid.appendChild(d);
 }}
 if (!only) for (const o of outfits) {{
   const worn = {{}};
   for (const id of o.items) {{ const it = DOLL.byId[id]; if (!it) {{ console.error('missing item ' + id); continue; }} worn[DOLL.slotOf(it)] = id; }}
   const d = document.createElement('div');
   d.innerHTML = `<svg viewBox="0 10 400 760">${{DOLL.renderDoll({{ hair: o.hair || 'loose', worn, mood: o.mood }})}}</svg>`;
   dolls.appendChild(d);
 }}
 if (only) dolls.remove();
 document.querySelector('#defs defs').innerHTML = DOLL.defsString();
 console.log('items:', DOLL.items.length);
</script>"""
page = out.with_suffix('.html'); page.write_text(html)
r = subprocess.run(['python3', str(root / 'tools/shot.py'), str(page), str(out), '1240', '700'], capture_output=True, text=True)
print(r.stdout, r.stderr)
