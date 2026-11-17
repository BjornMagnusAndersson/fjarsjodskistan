"""Build a preview page of the bare doll in each hairstyle and screenshot it."""
import subprocess, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
core = (root / 'src/core.js').read_text()
html = f"""<!doctype html><meta charset="utf-8">
<style>
 body{{margin:0;background:linear-gradient(#bfe3f2,#e9f6ea 70%,#cfe8b8);font-family:sans-serif}}
 .row{{display:flex;gap:10px;justify-content:center;padding:20px 10px 0}}
 svg.doll{{width:360px;height:720px}}
 .face{{width:300px;height:300px}}
 .lid{{transform:scaleY(0);transform-box:fill-box;transform-origin:top}}
 #defs{{position:absolute;width:0;height:0}}
 p{{text-align:center;margin:0 0 6px;color:#3b4a3c;font-size:18px}}
</style>
<svg id="defs"><defs></defs></svg>
<div class="row" id="row"></div>
<script>{core}</script>
<script>
 const row=document.getElementById('row');
 const add=(st,label,cls='doll',vb='0 30 400 740')=>{{const d=document.createElement('div');d.innerHTML=`<svg class="${{cls}}" viewBox="${{vb}}">${{DOLL.renderDoll(st)}}</svg><p>${{label}}</p>`;row.appendChild(d);}};
 add({{hair:'loose'}},'Loose hair');
 add({{hair:'braids',mood:'happy'}},'Braids (happy face)');
 add({{hair:'ponytail'}},'Ponytail');
 document.querySelector('#defs defs').innerHTML=DOLL.defsString();
</script>"""
out = root / 'tools/doll_preview.html'
out.write_text(html)
print(subprocess.run(['python3', str(root/'tools/shot.py'), str(out), str(root/'tools/doll_preview.png'), '1180', '800'], capture_output=True, text=True).stdout)
