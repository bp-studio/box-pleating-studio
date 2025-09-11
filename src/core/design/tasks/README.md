# Design Tasks

This folder contains the design update tasks for Box Pleating Studio Core. These tasks execute in dependency order, processing the entire data flow from tree structure to final graphics rendering.

## Task System Architecture

Each task inherits from the `Task` base class with priority and dependency management. Tasks are automatically ordered and executed based on their dependencies.

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
- **[`roughContour.ts`](roughContour.ts)** - Generates rough contours
- **[`traceContour.ts`](traceContour.ts)** - Traces final contours
- **[`patternContour.ts`](patternContour.ts)** - Processes pattern contours

### Pattern Processing
- **[`stretch.ts`](stretch.ts)** - Manages stretch patterns
- **[`pattern.ts`](pattern.ts)** - Finds all possible configurations and patterns

### Graphics Generation
- **[`graphics.ts`](graphics.ts)** - Generates final graphics data

## Utilities

The `utils/` folder contains helper functions:
- **`climb.ts`** - Tree traversal utilities
- **`combine.ts`** - Contour combination tools  
- **`expand.ts`** - Path expansion and simplification tools

## Execution Order

Tasks execute following this dependency chain:
```
height → balance → structure → aabb → {junction, roughContour} 
→ {invalidJunction, stretch, traceContour} 
→ {pattern, patternContour} 
→ graphics
```

This design ensures each task executes only after its dependencies complete, maintaining data flow consistency.
