# Error codes

When something goes wrong, the game keeps going quietly. She never sees a pop-up, and a broken piece of clothing
is simply left out. Instead the game writes a short note with an **error code** into a small log.

**Where to see it:** long-press the gear button for 1 second to open the parent menu, then open **Villukóðar**.
- **Afrita** copies the whole log as text. Paste it into a message to whoever fixes the game.
- **Hreinsa** empties the log.

Each line shows:
- the code, and `×n` if it happened more than once
- when it last happened
- what it was about (an item id, a file name, a scene ...)
- the error message

The copied text also has the build id (the version) and where in the code it happened.

The log has its own storage key (`fjarsjodskistan.errors`), separate from her save, so it can never damage her outfits.
It keeps the newest 40 problems.

| Code | Meaning | Where to look |
|---|---|---|
| **FJ-S01** | Saving failed: browser storage is full or blocked. | `LocalStore.save` in `src/app.js` |
| **FJ-S02** | The saved game could not be read. It was parked in `.broken` and the backup copy was loaded. | `LocalStore.load` in `src/app.js` |
| **FJ-S03** | Reading storage was refused (private mode or blocked site data). | `readJSON` in `src/app.js` |
| **FJ-S04** | An imported backup file was not a backup from this game. | the `importFile` handler in `src/app.js` |
| **FJ-S05** | Exporting the backup file failed. | the `menuExport` handler in `src/app.js` |
| **FJ-S06** | A saved id (clothing piece, hairstyle, scene) no longer exists and was skipped. Someone renamed or removed an id, which must never happen. | the id in the detail |
| **FJ-D01** | A clothing piece failed to draw and is left out. Detail = item id. | its shape in `src/garments/` |
| **FJ-D02** | A hairstyle failed to draw, so her own hair was used. Detail = style key. | `HAIRSTYLES` in `src/core.js` |
| **FJ-D03** | A scene failed to draw (or doesn't exist), so the meadow was used. Detail = scene key. | `SCENES` in `src/scenes.js` |
| **FJ-D04** | An animal or friend failed to draw and is left out. Detail = creature key. | `CREATURES` in `src/scenes.js` |
| **FJ-P01** | Printing or saving a picture of the doll (colouring page or colour picture) failed. Detail = which one. | `pictureSVG`, `svgToPng`, `printColouring` in `src/app.js` |
| **FJ-A01** | An unexpected error that nothing caught. Detail = file:line. | the message and "@ where" in the copied text |
| **FJ-A02** | An unexpected error in something that ran later (a promise). | the message |
| **FJ-A03** | The sound could not start. The game stays silent. | `Sound.init` in `src/app.js` |
| **FJ-A04** | The offline copy (service worker) could not be set up. | the register script in `tools/build.py`, `src/web/sw.js` |
| **FJ-A05** | A source file broke while the game was starting. Detail = file name. Things after the error in that file are missing. The other files still load, because each file is its own script. | that file |

## For whoever changes the code

- The codes live in `CODES` in `src/errors.js`, which is loaded before every other file.
- To log something:
  - `FJ.report('FJ-X00', 'what it was about', error)`
  - or `FJ.guard('FJ-X00', 'detail', () => risky(), fallback)`, which runs the code and returns `fallback` if it throws
- New code: add it to `CODES` and to this table. Never reuse a code for something else.
- `python tools/smoke_test.py` checks that:
  - a damaged save, a bad backup file, a broken piece and a broken file each log the right code
  - normal play logs nothing
