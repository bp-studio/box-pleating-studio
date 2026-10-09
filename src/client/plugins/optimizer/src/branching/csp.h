
#pragma once

#include "class/hierarchy.h"
#include "grid.h"

#include <vector>

using namespace std;

/**
 * The fitting algorithm, which models the fitting as a
 * binary constraint satisfaction problem (CSP) over a small window of grid points
 * around the continuous solution, and solves it exactly by
 * maintaining arc consistency (MAC) with backtracking search.
 *
 * The sheet size is searched incrementally (starting one step below the
 * ceiling of the continuous solution), so the first size for which a solution
 * is found is the smallest one within the search window.
 *
 * Returns an empty layout if no solution is found (not expected in practice).
 */
GridLayout csp_solve_integer(const vector<double> &x0, const Hierarchy *hierarchy);
