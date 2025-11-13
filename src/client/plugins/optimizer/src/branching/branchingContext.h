
#pragma once

#include "class/hierarchy.h"

#include <vector>

using namespace std;

class BranchingContext {
  private:
	Hierarchy *hierarchy; // This needs to be initialized first.

  public:
	BranchingContext(const vector<double> &x0, Hierarchy *hierarchy);

	vector<double> to_grid(const vector<double> &x) const;
	vector<double> to_double(const vector<double> &x) const;
	Pt get(const int i) const;
	vector<double> branch(const double x, const double y, const int i, const int q) const;
	vector<double> make_xk(const double x, const double y, const int i) const;
	vector<int> output() const;

	/**
	 * Generate a new set of constraints by the current fixing status.
	 * Each fixed flap will contribute equality constraints for its coordinates,
	 * and distance constraints between a pair of fixed flaps will be omitted.
	 */
	ConstraintList generate_constraints(const vector<double> &sol) const;

	vector<bool> fixed;
	vector<double> solution; // The current integral solution.
};
