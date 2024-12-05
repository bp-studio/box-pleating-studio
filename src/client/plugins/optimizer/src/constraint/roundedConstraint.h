
#pragma once

#include "constraint.h"
#include "class/flap.h"

class RoundedConstraint : public Constraint {
  public:
	RoundedConstraint(int i, int j, int dist, const vector<Flap>* flaps)
		: Constraint(Type::inequality), i(i), j(j), dist(dist), flaps(flaps) {}

	static double exact(const vector<double> &x, int i, int j, int dist, const vector<Flap> &flaps);

  protected:
	const int i;
	const int j;
	const int dist;
	const vector<Flap>* flaps;

	double constraint(const vector<double> &x, vector<double> &grad) const override;
};
