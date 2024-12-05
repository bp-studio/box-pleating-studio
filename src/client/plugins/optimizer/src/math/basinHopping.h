
#pragma once

#include "constraint/constraint.h"
#include "optimizeResult.h"

// These are the default values in SciPy, for the record.
struct AdaptiveStepSizeParam {
	double accept_rate = 0.5;
	int interval = 50;
	double factor = 0.9;
};

struct BasinHoppingParams {
	int niter = 100;
	int niter_success = 102;
	double T = 1.0;
	double stepsize = 0.5;
	AdaptiveStepSizeParam step;
};

/**
 * Find the global minimum of a function using the basin-hopping algorithm.
 *
 * Basin-hopping is a two-phase method that combines a global stepping algorithm with local minimization at each step.
 * Designed to mimic the natural process of energy minimization of clusters of atoms,
 * it works well for similar problems with "funnel-like, but rugged" energy landscapes.
 *
 * Based on the implementation of SciPy:
 * https://github.com/scipy/scipy/blob/main/scipy/optimize/_basinhopping.py
 */
OptimizeResult basin_hopping(vector<double> x0, const ConstraintList &cons, int trials, const BasinHoppingParams &params, double best_s);
