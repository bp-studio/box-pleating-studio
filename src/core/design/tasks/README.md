# Design Tasks

This folder contains the design update tasks for Box Pleating Studio Core. These tasks execute in dependency order, processing the entire data flow from tree structure to final graphics rendering.

## Task System Architecture

Each task is an instance of the [`Task`](task.ts) class, constructed with its action and **the tasks depending on it** (rather than the tasks it depends on; see the comments in `task.ts` for the reason).
The priority of a task is one more than the maximal priority of its dependent tasks, and the [`Processor`](../../service/processor.ts) always executes the queued task with the highest priority first.
After a task executes, all of its dependent tasks are queued unconditionally.

Consequently, if a task reads the result of another task, the dependency must be declared explicitly.
Do not rely on the execution order that merely happens to follow from the priorities.

## Data Flow Mapping

The following tasks correspond to the Mermaid flowchart in [core/README.md](../../README.md):

### Tree Structure Processing
- **[`height.ts`](height.ts)** - Updates tree node heights
- **[`balance.ts`](balance.ts)** - Tree balancing operations
- **[`structure.ts`](structure.ts)** - Updates tree structure and node distances
- **[`aabb.ts`](aabb.ts)** - Updates AABB hierarchy

### Junction Processing
- **[`junction.ts`](junction.ts)** - Maintains junctions between overlapping flaps
- **[`invalidJunction.ts`](invalidJunction.ts)** - Handles invalid junctions

### Contour Processing
- **[`roughContour.ts`](roughContour.ts)** - Generates rough contours, carving the invading junction rectangles out of the leaves (see `ValidJunction.$invasion`)
- **[`traceContour.ts`](traceContour.ts)** - Traces final contours
- **[`patternContour.ts`](patternContour.ts)** - Processes pattern contours

### Pattern Processing
- **[`stretch.ts`](stretch.ts)** - Manages stretch patterns
- **[`pattern.ts`](pattern.ts)** - Finds all possible configurations and patterns

### Graphics Generation
- **[`graphics.ts`](graphics.ts)** - Combines the contours (including the regularization of the rivers) and generates final graphics data

## Utilities

The `utils/` folder contains helpers directly related to the scheduling of the tasks:
- **[`climb.ts`](utils/climb.ts)** - Updates the tree from the bottom up, starting from the given nodes and continuing to their parents as needed

The algorithms of the contours used by the tasks above are in [`layout/contour`](../layout/contour/) (see also [layout/README.md](../layout/README.md)).

## Execution Order

The dependencies between the tasks are as follows:
```
height
  ↓
balance
  ↓
structure
  ↓
aabb
  ↓
junction ───────┬───────────────┐
  ↓             ↓               ↓
stretch      roughContour    invalidJunction
  ↓             │
pattern         │
  ↓             │
traceContour ◄──┘
  ↓
patternContour
  ↓
graphics
```

That is, `traceContour` depends on both `pattern` and `roughContour`,
and `roughContour` depends on `junction` because of the carving.
