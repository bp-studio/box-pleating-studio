
#pragma once

#include "class/hierarchy.h"
#include "grid.h"

/**
 * The tidying stage, which runs after the fitting.
 *
 * Layouts produced by the fitting are valid but often messy.
 * This stage rearranges the flaps within the same sheet size (keeping the layout valid)
 * to minimize the number of vertices of the rough contours and then the area of the uncovered junctions,
 * which pushes the flaps towards axis-aligned arrangements.
 *
 * The algorithm is a Large Neighborhood Search (LNS):
 * repeatedly pick a small group of flaps around a junction, fix all the other flaps,
 * and find the optimal arrangement of the group exactly by branch-and-bound
 * within a window around their current locations.
 */
void tidy_layout(GridLayout &layout, const Hierarchy *hierarchy);
