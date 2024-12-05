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

The optimization algorithm consists of two major stages:

1. Pre-solving: forget about the grid for the moment,
   pretend that the problem is continuous,
   and try to find a good solution for it.
2. Fitting: try to find a layout constrained to the grid that
   resembles the continuous solution found in the pre-solving stage.

Both stages involve solving a series of optimization problems with nonlinear constraints,
which are instances of the classical circle-river packing problem
studied by Robert J. Lang and implemented in his [TreeMaker](https://langorigami.com/article/treemaker/) app.
Essentially, the problem is about minimizing the sheet size while constraining the Euclidean
distances between each pair of flaps to be at least the corresponding structural distances.
We use the sequential least squares programming
(SLSQP, a type of [SQP](https://en.wikipedia.org/wiki/Sequential_quadratic_programming) method)
implemented in NLopt (which was inspired by that of SciPy) to solve such problems.
The method starts with a given initial layout (discussed next) and improves the layout progressively,
until it finds a solution that has no better alternatives nearby (i.e. local optima).

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

Discrete optimization typically uses [branch-and-bound](https://en.wikipedia.org/wiki/Branch_and_bound)
algorithms to find integral solutions from a given non-integral solution.
BP Studio Optimizer, on the other hand, uses a much simpler "greedy algorithm" approach,
which is a lot faster but could potentially lead to larger sheet sizes.
Basically, it chooses a center of origin (which is the lower left corner for square sheets and the center point for diagonal sheets),
and process the flaps one by one by their distances to the origin.
For each flap, it will try to assign its location to the four closest grid points
(by adding additional constraints to the original problem)
run SLSQP for each of the four choices
(excluding those that violate the distance constraints with the already processed flaps;
and if all four violate the constraints, it will use the next closest grid point that works),
and use the best result to continue.
During the process, the sheet will automatically enlarge itself if needed.
This method is guaranteed to produce valid layouts on grids that are near-optimal.
