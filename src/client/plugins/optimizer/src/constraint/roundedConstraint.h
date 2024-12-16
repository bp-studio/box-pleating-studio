
#pragma once

#include "class/flap.h"
#include "constraint.h"

class RoundedConstraint: public Constraint {
  public:
	RoundedConstraint(int i, int j, int dist, const vector<Flap> *flaps)
		: Constraint(Type::inequality), i(i), j(j), dist(dist), flaps(flaps) {}

	static double exact(const vector<double> &x, int i, int j, int dist, const vector<Flap> &flaps);

  protected:
	const int i;
	const int j;
	const int dist;
	const vector<Flap> *flaps;

	double constraint(const double *x, double *grad) const override;
};
