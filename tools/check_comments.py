"""List functions in src/ that have no comment, so every function can be explained in plain words.

    python tools/check_comments.py          # summary per file + every uncommented function
    python tools/check_comments.py --quiet  # only the summary; exit code 1 if anything is missing

A function counts as commented when the line just above it is a comment (// ... or the end of a /** ... */
block), or when the line itself ends with a // comment. Functions found:
    function name(...)            const name = (...) => ...       const name = x => ...
    name(...) {   (object methods, e.g. in HAIRSTYLES)            draw(it) { ... } inside DOLL.shape
Tiny one-line arrow helpers written inside an expression (like .map(x => ...)) are not counted.
"""
import re, sys, pathlib

root = pathlib.Path(__file__).resolve().parent.parent
FUNC = [
    re.compile(r'^\s*(?:async\s+)?function\s+(\w+)\s*\('),
    re.compile(r'^\s*(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?(?:\([^)]*\)|\w+)\s*=>'),
    re.compile(r'^\s*(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?function\b'),
    re.compile(r'^\s*(?!if\b|for\b|while\b|switch\b|catch\b|return\b|else\b)(\w+)\s*\([^)]*\)\s*\{\s*(?:$|//|return\b|.*\}\s*,?\s*(?://.*)?$)'),
]

def is_comment_end(line):
    s = line.strip()
    return s.startswith('//') or s.endswith('*/') or s.startswith('*') or s.startswith('/*')

def scan(path):
    lines = path.read_text(encoding='utf-8').splitlines()
    missing, total = [], 0
    for i, line in enumerate(lines):
        name = next((m.group(1) for rx in FUNC for m in [rx.match(line)] if m), None)
        if not name:
            continue
        total += 1
        prev = next((lines[j] for j in range(i - 1, -1, -1) if lines[j].strip()), '')
        if is_comment_end(prev) or re.search(r'//.*$', line.split('=>')[0] if '=>' in line else line):
            continue
        # draw(it) / svg(o) inside DOLL.shape('name', {...}): the comment above the DOLL.shape line describes it
        if name in ('draw', 'thumb', 'svg'):
            j = next((j for j in range(i - 1, max(i - 6, -1), -1) if 'DOLL.shape(' in lines[j]), None)
            if j is not None and is_comment_end(next((lines[k] for k in range(j - 1, -1, -1) if lines[k].strip()), '')):
                continue
        missing.append((i + 1, name))
    return total, missing

files = sorted((root / 'src').rglob('*.js')) + sorted((root / 'tools').glob('*.py'))[:0]
grand, gmiss = 0, 0
for f in files:
    total, missing = scan(f)
    grand += total; gmiss += len(missing)
    rel = f.relative_to(root).as_posix()
    print(f'{rel:40} {total - len(missing):4}/{total:<4} commented')
    if '--quiet' not in sys.argv:
        for ln, name in missing:
            print(f'    {rel}:{ln}  {name}')
print(f'TOTAL {grand - gmiss}/{grand} commented, {gmiss} missing')
sys.exit(1 if gmiss else 0)
