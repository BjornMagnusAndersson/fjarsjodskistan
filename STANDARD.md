# Fjársjóðskistan – clothing standard

This is the standard every piece of clothing follows. It is written for whoever draws garments:
people, Claude agents, and later a photo → garment skill.

The game is a storybook dress-up doll for a 4-year-old girl in Iceland. The doll is approved.
**Do not change `src/core.js` body, face, hair or geometry.** Garments only.

## Files

- `src/core.js` – geometry (`G`), drawing helpers (`H`), slots, categories, registry (`DOLL`), the doll itself.
- `src/garments/examples.js` – **10 approved reference pieces. Read this whole file first and match its style.**
- `src/garments/<group>.js` – your file. Same wrapper as examples.js: `(function(){ 'use strict'; ... })();`
- `tools/garment_preview.py` – renders your pieces (thumbnails + dressed dolls) to a PNG you can look at.

## Coordinate system

One fixed doll pose, `viewBox="0 0 400 800"`, centre line x = 200. L = left side of the picture (x < 200), R = mirror.

| Part | Numbers |
|---|---|
| Head ellipse | `G.head` = cx 200, cy 152, rx 72, ry 77 (top of face 75, chin 230) |
| Hair | top ≈ 58–62, outer width ≈ 106–294 (loose hair falls to y 360 behind; side locks cover the shoulders at x 116–154 and 246–284) |
| Hat brim / forehead line | `G.hatLine` 112. Eyebrows at y 128–140. Hats come down to ≈ y 125–135 at the sides |
| Eyes | `G.eyes` (172,163) (228,163), eye ≈ 14×16 |
| Ears / earlobes | `G.ears` (127,165) (273,165); `G.earlobes` (127,178) (273,178) |
| Neck | x 186–214, y 212–258 |
| Shoulders | rounded, outer edge ≈ (118,290) / (282,290) |
| Arms | hang slightly outward. `G.armPoint(side, t)` centreline: t 0 shoulder (138,280), .5 elbow (113,364), 1 wrist (101,442) |
| Hands | `G.hands` centres (98,458) (302,458); hand ≈ 30 wide, 38 long, fingers down |
| Torso | `G.torsoX(y)` left edge: 148 at y 306, 145.5 at waist 400, 139 at hips 434, 137 at 476 |
| Waist / hips / crotch | `G.waistY` 400, `G.hipY` 434, `G.crotchY` 476 |
| Legs | `G.legOutX(y)`, `G.legInX(y)` left leg; knee 574, ankle 702 |
| Feet | `G.feet` (166,724) (234,724); `G.footPath(side, pad, toe)` |
| Ground | 748 |

## Shape helpers (use these – they keep everything fitted)

- `G.shirtPath({ sleeve, pad, sleevePad, sleeveFlare, bottom, flare, neck, neckDepth })` – **upper-body garment with rounded shoulders, one closed path.**
  sleeve: 0 sleeveless, .15 cap, .3 short, .55 elbow, 1 long. neck: `round|v|high|square|scoop|boat`. Use this for every top, sweater, jacket, bodice, swimsuit top. Never build a boxy torso by hand.
- `G.armPath(side, t0, t1, pad, flare)` – a band of the arm between t0 and t1 (cuffs, stripes, sleeve trims).
- `G.pantsPath({ top, bottom, pad, flare })` – trousers/shorts/leggings in one path.
- `G.legPath(side, y0, y1, pad, flare)` – one leg tube (socks, boot shafts, leg warmers).
- `G.skirtPath({ top, bottom, flare, pad })` – A-line skirt.
- `G.footPath(side, pad, toe)` – shoe outline.
- `G.headArc(a0, a1, offset, n)` – points along the head ellipse (degrees, 270 = top). Hairbands, tiaras, crowns.
- `H.fill(item, i)` – item's pattern (colors[0] + colors[1]) or soft gradient of colors[i].
- `H.grad(hex, 'v'|'h'|'r')`, `H.pat(name, c1, c2, size)` patterns: `stripes hstripes dots check stars hearts snow flowers strawberry sparkle rainbow knit`.
- `H.part(d, fill, base)` – fill + outline + soft shading in one go.
- `H.line(d, base, width, opacity)` – folds and seams.
- `H.clip(id, d)` – clip path (unique id per item and side: `'c-' + it.id + '-L'`). Keep yokes, soles and stripes inside a shape.
- `H.def(id, markup)` – register any gradient. Ids must be unique per item: prefix with the item id.
- `H.shade`, `H.ink`, `H.mix`, `H.smooth`, `H.polyPath`, `H.heart/star/flake/flower/berry/diamond(cx,cy,r,col)`.
- Global fills: `url(#soft-v)`, `url(#soft-h)`, `url(#soft-r)` shading overlays, `url(#shine)` highlight.
- `PALETTE.SKIN.base` for skin showing through openings.

## Registering

```js
DOLL.shape('shape-name', {
  slot: 'top',                       // see slots below
  occupies: ['dress','top','bottom'],// optional: slots this piece blocks (dresses, suits)
  thumb: [x, y, w, h],               // optional: chest thumbnail window if the slot default doesn't fit
  draw(it) { return '<svg markup>'; }   // or { back: '...', front: '...' }
});
DOLL.add([{ id, shape, cat, name: { is, en }, colors: [...], pattern?, patternSize? , ...your own params }]);
```

`back` is drawn behind the body (hood lying down, cape, backpack bag, hat brim behind the head). `front` is drawn at the slot's layer.
Item ids: lowercase, unique, prefixed by category (`tee-…`, `lopi-…`). **Never rename or reuse an id once it is
published**: saved outfits and backup files store only ids, so a renamed piece silently drops out of her saved outfits.
To retire a piece, delete it; to change it, keep the id and change the drawing. Shape names unique across all files: prefix with your group if unsure.
A shape should be reusable: several items share one shape with different colours, patterns or params (`it.sleeve`, `it.trim`, …).

## Slots and layers (higher z is on top)

| slot | z | notes |
|---|---|---|
| wings | 2 | everything is behind the body |
| cape | 64 (back 4) | back = the cape, front = clasp/collar only |
| bag | 62 (back 5) | back = bag peeking out, front = straps |
| suit | 30 | swimsuits, pyjamas: `occupies: ['suit','top','bottom']` |
| bottom | 34 | trousers, shorts, skirts, rain bib trousers |
| top | 36 | |
| dress | 38 | `occupies: ['dress','top','bottom']` |
| shoes | 42 | shoes and boots |
| sweater | 46 | |
| jacket | 52 | snowsuit: slot jacket, `occupies: ['jacket','bottom']` |
| bracelet | 56 | bracelets and bangles (`src/garments/wrists.js`): drawn in wrist space with `onWrist`, like mittens |
| mittens | 58 | |
| scarf | 60 | |
| necklace | 70 | |
| face | 72 | face paint (cat nose and whiskers): on the face, under the front hair |
| hair front | 74 | (core) |
| ears | 76 | (core) |
| earrings | 78 | |
| glasses | 80 | |
| hairband | 84 | |
| hat | 88 (back 9) | crowns and tiaras use slot hat |

## Categories (`cat` = the chest tab)

hat, crown, hairband, glasses, face, earrings, necklace, bracelet, top, sweater, jacket, rain, snowsuit, dress (princess dresses), frock (everyday dresses), pants, shorts, skirt, swim, pyjamas, mittens, scarf, shoes, boots, cape (capes and wings), bag.

## Style rules (approved look)

1. **Storybook, not flat.** Base fill (gradient or pattern) → details → soft shading overlay → tinted outline last (see `outline()` in examples.js). Outline colour is always `H.ink(base)`, width `G.stroke` (2.6), round joins.
2. **No SVG filters** (blur, drop-shadow). They are slow on the target device, an old Samsung tablet. Use gradients, `opacity`, white highlight shapes.
3. **Natural shapes.** Rounded shoulders via `G.shirtPath`. No boxy corners. No odd separate blobs hanging off things (a hand-drawn thumb earlier looked wrong for exactly this reason).
4. **Mirror the right side.** When you place anything on both sides, compute it for L and mirror x for R (`400 - x`), including offsets and directions. Copying the left offsets to the right made a sleeve trim cross the hem in an earlier version.
5. **Fit.** Garments must cover the body parts they cover (check at the shoulders, armpits, crotch, ankles). Long skirts end ≈ y 700–712 at the sides so shoes and feet show. Hats sit down on the head and cover the top of the hair; nothing floats. Glasses lenses centred on `G.eyes`; earrings hang from `G.earlobes`.
6. **Bright, friendly colours** a 4-year-old likes. Strawberries, hearts, stars, rainbows, puffins, unicorns, snowflakes, flowers are welcome motifs.
7. **Our own designs only.** No film or TV character costumes or close lookalikes (no Frozen/Elsa/Anna, Disney princesses, Spider-Man, Paw Patrol, brands, logos, text). Generic themes are fine: ice, rose, ocean, rainbow, fairy, northern lights.
8. **Keep markup reasonable**: roughly under 10 KB of SVG per item. Loop-generated motifs are fine; avoid thousands of tiny nodes.
9. Thumbnails: check each item looks good in the chest tile. Set `thumb` when the default window crops or shows it too small.
10. Comment every shape (what it is, colour roles). The owner reads code but doesn't write much.

## Hairstyles

Hairstyles live in `HAIRSTYLES` in `src/core.js` (added at the owner's request; the original loose, braids and
ponytail are unchanged). Each style returns `{ back, front }`: back is drawn behind the body (z 10), front over the
face (z 74). Use the helpers there: `hp(d, back, palette)`, `strand`, `lstrand`, `capFront(palette)` (the shared
fringe), `NAPE` (short back hair), `looseHair(palette)`, `braidBump`, `mirrorD` (mirror a left-side path).
Colours come from a palette made with `hairPalette(...)` (`BROWN` is her own hair; `RAINBOW`, `MERMAID`, `DARK`).
A style gets `{ hat }` and can hide parts that would poke through a hat (see `spacebuns`).
**Style keys are stored in saved outfits: never rename one.** New styles appear in the chest automatically.

## Princess dresses

Every princess dress must be as rich as the approved ice dress (layered or tiered skirt, trims or ruffles, motifs, sparkles, a special bodice detail, sleeves or straps with a finish) and each must be clearly different from the others in silhouette and theme.

## Checking your work

```
cd /home/claude/doll
python3 tools/garment_preview.py tools/<group>.png garments/examples.js garments/<group>.js --outfits tools/<group>_outfits.json
```
Then open the PNG with the Read tool and look at it. Outfits JSON: `[{"hair":"loose|braids|ponytail","mood":"happy","items":["id",...]}]`.
Crop and zoom with Pillow when you need detail. Check every item on the doll with at least one hairstyle, and hats with all three. Fix what looks wrong, then look again.
