
# Icons

This section is for those icons not provided by [FontAwesome](https://fontawesome.com/).
The `src` folder contains the original SVG files,
and `dist` folder contains processed SVG files
(mainly by converting strokes to fills).
The `bps` font is then generated from the `dist` folder
by the `icon` Gulp task (see `gulp/tasks/static.js`),
which uses [@twbs/fantasticon](https://github.com/twbs/fantasticon).

Historically the font was generated with [IcoMoon](https://icomoon.io/app/),
which is why most `dist` files carry a `0 0 1024 1024` viewBox.

## Gotchas when adding or editing a `dist` icon

`@twbs/fantasticon` (via `svgicons2svgfont`) is stricter than IcoMoon.
When an icon fails to show up (renders as a blank / near-zero-width glyph),
it is almost always one of the following. `tree.svg` hit all three at once:

- **`<path>` only.** Basic shapes such as `<ellipse>`, `<circle>`, `<rect>`
  are ignored. Convert every shape to a `<path>`.
- **No group `transform`.** Transforms on `<g>` (e.g. `transform="translate(...)"`)
  are NOT applied to the glyph — only each path's `d` data is read.
  Bake the transform into the coordinates and remove it.
  (Inkscape's "Save as Optimized SVG" does NOT do this reliably;
  it tends to keep the translate on the `<g>`.)
- **Consistent coordinate scale.** fantasticon scales every icon with a fixed
  `fontHeight` (300), proportional to its raw coordinates — it does NOT
  normalize each glyph to fill the em box. All `dist` icons must therefore
  share the same `0 0 1024 1024` basis. An icon authored at, say, `20x20`
  will be scaled down to a tiny dot in the corner of the glyph even though
  its paths are perfectly valid. Scale the coordinates (and the viewBox)
  up to the `1024` basis.

Avoid `mm`/`px` units on `width`/`height` too; keep them unitless.
