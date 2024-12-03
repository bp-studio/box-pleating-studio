
#pragma once

#include "branchingContext.h"
#include "class/hierarchy.h"

#include <vector>

using namespace std;

/**
 * For now this is the only reliable fitting algorithm I came up,
 * in the sense that it is guaranteed to find a valid fitting on grids for any circle packing.
 * For that reason, I currently do not provide alternative options for the users.
 */
vector<int> greedy_solve_integer(const vector<double> &x0, Hierarchy *hierarchy);
