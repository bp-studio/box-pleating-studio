# Optimizer

The BP Studio Optimizer is written in C++ and running in the web page by compiling to WebAssembly through [Emscripten](https://emscripten.org/).
Originally, it was written in Python using [SciPy](https://scipy.org/) and ran through [Pyodide](https://pyodide.org/),
but it turns out that re-writing everything in C++ dramatically improve everything:

1. Performance improved by up to 10x.
2. Total package size went from 69MB to less than 1MB.
3. Memory usage went down by 10x.
4. Browser compatibility is a lot better, especially for Safari.

The idea of using the SciPy as optimizer was originally suggested by
[Brandon Wong](https://web.mit.edu/wongb/www/origami/), and it turned out to be pretty successful.
After migrating to C++, we use [NLopt](https://github.com/stevengj/nlopt) as the core optimizer instead.
Both SciPy and NLopt has some pretty mature functionality when it comes to solving continuous optimization problems.
However, dealing with box pleating requires discrete optimization and a few more ingredients.
I shall give a brief explanation of how the algorithm works here.

## Basic idea

The optimization algorithm consists of three major stages:

1. Pre-solving: forget about the grid for the moment,
   pretend that the problem is continuous,
   and try to find a good solution for it.
2. Fitting: try to find a layout constrained to the grid that
   resembles the continuous solution found in the pre-solving stage.
3. Tidying: keep the sheet size found in the fitting stage,
   but rearrange the flaps to make the layout as neat as possible.

The pre-solving stage involves solving a series of optimization problems with nonlinear constraints,
which are instances of the classical circle-river packing problem
studied by Robert J. Lang and implemented in his [TreeMaker](https://langorigami.com/article/treemaker/) app.
Essentially, the problem is about minimizing the sheet size while constraining the Euclidean
distances between each pair of flaps to be at least the corresponding structural distances.
We use the sequential least squares programming
(SLSQP, a type of [SQP](https://en.wikipedia.org/wiki/Sequential_quadratic_programming) method)
implemented in NLopt (which was inspired by that of SciPy) to solve such problems.
The method starts with a given initial layout (discussed next) and improves the layout progressively,
until it finds a solution that has no better alternatives nearby (i.e. local optima).
The other two stages, on the other hand, work entirely on the integer grid
and are solved by combinatorial search instead.

## Pre-solving

There are two modes for choosing the initial layout for solving in the pre-solving stage.
One can either use the current layout in the workspace,
or let the Optimizer to generate random layouts and use the most promising one.

When we use the current layout as reference,
using only SLSQP will typically result in a layout that has essentially the same arrangement,
only packed as tightly as possible.
To explore more possible arrangements, there is an option of "trying variations",
and what it does is to use the [Basin-hopping algorithm](https://en.wikipedia.org/wiki/Basin-hopping)
to find potentially better solutions.
Simply put, it tries to slightly "jiggle" the arrangement and run SLSQP again on the jiggled layout,
repeating the process several times.
This will take longer than a single round of SLSQP,
but has a pretty good chance of finding a better arrangement if there is one.

Random layout mode, on the other hand,
will generate random arrangements of flaps as the initial layouts for solving,
allowing us to explore unexpected possibilities.
Completely random layouts, however,
tend to be terrible choices as relevant flaps are almost never grouped together.
To overcome this, the Optimizer generates the layouts with the tree structure in mind.
Basically, it will first simplify the tree by representing large branches with single flaps of comparable areas,
generate random layouts with the simplified tree,
and then refine the layout by placing the flaps in a simplified branch randomly into the corresponding region.
More complicated tree could be simplified multiple times,
ensuring the generated layout makes basic sense.
Also, Basin-hopping is automatically enabled in this mode.

## Fitting

The first generation of the fitting algorithm was essentially what is known as
[NLP diving](https://www.scipopt.org/doc/html/heur__nlpdiving_8h.html) in the MINLP literature:
it fixed the flaps one by one to nearby grid points (in the order of their distances to the origin),
re-ran SLSQP after each fixing to let the remaining flaps adjust, and never backtracked.
It always produced valid layouts, but it was slow (one SLSQP run per flap per candidate)
and could end up with sheets noticeably larger than necessary.

The current algorithm takes a completely different view of the problem.
Once we fix the sheet size, there is nothing continuous left to optimize:
each flap simply needs an integer grid location,
and the only requirement is that every pair of flaps keeps their required distance.
That is a classical [constraint satisfaction problem](https://en.wikipedia.org/wiki/Constraint_satisfaction_problem) (CSP),
and since the fitting is supposed to resemble the continuous solution anyway,
we only need to consider a small window of grid points around the continuous location of each flap.
So the algorithm goes like this:

1. Start with the sheet size one step below the ceiling of the continuous solution
   (it is occasionally possible to beat the continuous solution on grids), and scale the continuous solution to that size.
2. For each flap, list the grid points within a small window around its scaled location as its candidates.
   The window starts as just the floor/ceil combinations (at most 4 points),
   and is enlarged up to 8×8 points if the smaller ones fail.
3. Drop all the distance constraints that cannot possibly be violated within the windows,
   which leaves us with only the pairs of flaps that are close to each other in the continuous solution.
4. Solve the CSP: first by [arc consistency](https://en.wikipedia.org/wiki/Local_consistency#Arc_consistency)
   (repeatedly removing candidates that are incompatible with every candidate of some neighbor,
   which very often already proves that there is no solution),
   and then by backtracking search that always picks the flap with the fewest remaining candidates
   and tries its candidates in the order of closeness.
   The search has a node limit so that a hopeless attempt is abandoned quickly.
5. If a solution is found, it is verified once more against all constraints using exact integer arithmetic, and we are done.
   Otherwise, enlarge the window; if all windows fail, enlarge the sheet by one step and start over.

Since the sheet sizes are tried in increasing order,
the first solution found is the smallest one within the search windows,
and in practice the whole process takes only a few milliseconds even for designs with a hundred flaps,
typically resulting in sheets equal to or smaller than those produced by the first generation.

## Tidying

The layout produced by the fitting stage is valid, but it tends to be messy:
flaps end up diagonally next to each other in all sorts of ways,
each such pair forms a *junction* (the overlapping of the two flaps' regions, see the Core)
that has to be resolved by gadgets in the crease pattern,
and the rivers zigzag around them instead of running straight.
So the tidying stage rearranges the flaps to make the layout as neat as possible,
keeping the sheet size and the validity of the layout.

Neatness is measured by two numbers, compared lexicographically:

1. The total number of vertices of the *rough contours* of the flaps and rivers
   (the regions in the layout view, before the gadgets are inserted).
   The fewer vertices there are, the straighter the rivers are and the simpler the crease pattern is.
   The rough contour of a node is the union of the rectangles of the flaps below it,
   each expanded by its distance to the node, and its vertices are counted on a compressed grid
   in `branching/contour.cpp`.
2. The total area of the *uncovered* junctions.
   A junction that is *covered* by another one (in the sense of `stretchTask` in the Core)
   doesn't show up in the crease pattern at all, so only the rest counts,
   and for that the covering rules of the Core are replicated in `branching/covering.cpp`
   (which requires the structure of the tree to be passed along with the problem).
   Note that the area of a junction decreases as the two flaps slide from the diagonal position
   towards the axis-aligned position (where the junction vanishes),
   so minimizing it also pushes the flaps into neat rows and columns.

Neither number is a sum over pairs of flaps
(the contours are unions, and whether a junction is covered depends on the other junctions),
which matters for the search algorithm described next.

A tight layout typically has a good portion of flaps that cannot move at all on their own
(every unit move of them is blocked by some neighbor),
so moving one flap at a time gets stuck almost immediately.
Instead, we use [Large Neighborhood Search](https://en.wikipedia.org/wiki/Large_neighbourhood_search):

1. List all the junctions, largest first.
2. For each junction, form a small group of flaps (the two flaps of the junction,
   plus a few of the flaps interacting with them) and fix all the other flaps.
3. Find the best arrangement of the group *exactly*, using the same machinery as in the fitting stage
   (candidate windows, arc consistency and backtracking search),
   but now with a *proxy* objective that is a sum over pairs of flaps
   (so that [branch-and-bound](https://en.wikipedia.org/wiki/Branch_and_bound) pruning works).
   The primary term is the pairwise version of the contour vertices:
   the rectangles of the two flaps are expanded to their lowest common ancestor in the tree,
   and we count the vertical and horizontal lines occupied by the vertices of their union
   (so that touching or collinear edges are rewarded).
   The secondary term is the junction area weighted by the covering state of the current layout
   (covered junctions weigh nothing, so the search is free to sacrifice them for the ones that matter).
   The current arrangement is the incumbent, so the result can only be equal or better in terms of the proxy.
4. Accept the new arrangement only if the actual objective improves.
5. Repeat the passes until no group can be improved anymore.
   Then, as the proxy gives no guidance in some cases, try moving each single flap
   directly in terms of the actual objective, and try swapping pairs of flaps
   (followed by a repair of their neighborhoods) to escape the local optimum, and repeat.

Since the flaps in a group are re-arranged jointly, the ones that are stuck individually
can move together with their neighbors, and over multiple passes they can travel far from
where the fitting stage put them.
As the result depends quite a bit on the path taken by the search,
the whole process is run twice, with and without the covering weights in the proxy,
and the better result is kept.
