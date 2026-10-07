# Render check

This tool generates a large number of valid layouts and checks them for
rendering problems automatically. Each problem found is shrunk into a minimal
layout and drawn as an SVG picture, ready to be investigated and turned into a
regression test.

Run it with:

```sh
pnpm check:render
```

The results are written to `tools/renderCheck/out` (ignored by git):
`report.md` lists the problems, each with the `parseTree()` call reproducing the
minimized layout, and a picture `issue-N.svg`. The run fails if any problem is
found.

## Options

The options are given by environment variables.

| Variable | Default | Meaning |
|---|---|---|
| `SECONDS` | 60 | The time limit of the search. |
| `SEED` | 1 | The first seed of the random layouts. Different seeds give different layouts. |
| `MAX_ISSUES` | 5 | Stop after finding this many distinct problems. |
| `OUT` | `tools/renderCheck/out` | The output folder. |
| `CASE` | | Instead of searching, check and draw the given layouts (see below). |
| `VIEW` | | With `CASE`, set to `trace` to also draw the internals of the contour algorithm. |
| `BOX` | | With `CASE`, the region to draw, given as `x1,y1,x2,y2`. Defaults to the whole layout. |

For example, in PowerShell:

```powershell
$env:SECONDS = 600; pnpm check:render
```

## Drawing cases

With `CASE`, the given layouts are checked and drawn side by side into
`case.svg`, and the results are listed in `case.txt`. This is handy for
investigating a problem, or comparing the results of different layouts.

The layouts are separated by `;`, each given as `edges|flaps|label|moves`:

- `edges` and `flaps` are the two arguments of `parseTree()`.
- `label` (optional) is shown in the title of the picture.
- `moves` (optional) are the device moves applied after building the layout,
  separated by `/`. Each is given as `stretch:device:dx:dy`, where `stretch` is
  the id of the stretch (the ids of its flaps joined by `,`), `device` is the
  index of the device in the pattern, and `dx`, `dy` are the offsets of the
  location.

With `VIEW=trace`, each layout is drawn in another picture as well, showing the
trace contours (dashed in raw mode), the pattern contours (with arrows), and
the ridges and side diagonals of the repos.

For example:

```powershell
$env:CASE = "(0,1,2),(0,2,2)|(1,0,0,0,0),(2,3,3,0,0)|before;" +
	"(0,1,2),(0,2,2)|(1,0,0,0,0),(2,3,3,0,0)|after|1,2:0:1:1"
$env:VIEW = "trace"
pnpm check:render
```

## Layouts

Purely random layouts are mostly sparse, and rarely involve patterns, let alone
the tricky cases such as raw mode. So the layouts are generated in two ways
(see `layouts.ts`):

- **Compact layouts**: start from a random tree with the flaps spread far
  apart, and then push a random flap towards the center one unit at a time, as
  long as the layout stays valid. Snapshots are taken along the way.
- **Perturbed samples**: move a few flaps of the sample designs in
  `test/samples` by small offsets, keeping the valid results.

Only the layouts with all junctions valid and all stretches solved are checked,
since otherwise the contours are expected to overlap.

## Checks

See `checks.ts`.

- **Crash**: the Core throws, including the failed debug assertions.
- **Crossing**: a hinge (an edge of a final contour) crosses a ridge in the
  interior of both, and they are not perpendicular. This never happens in
  valid layouts, so it means that some contour is cut wrong, or some ridge is
  misplaced.
- **Area**: the union of the final contours differs from that of the rough
  contours. In valid layouts the patterns only redistribute the regions where
  the rough contours overlap, so the two must agree.

These checks don't catch every problem. For example, two contours overlapping
each other without crossing any ridge go unnoticed.
