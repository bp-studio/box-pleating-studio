
#pragma once

#include "constraint.h"

class CircleConstraint : public Constraint {
  public:
	CircleConstraint(int i, int j, int dist)
		: Constraint(Type::inequality), i(i), j(j), dist(dist) {}

  protected:
	const int i;
	const int j;
	const int dist;

	double constraint(const vector<double> &x, vector<double> &grad) const override;
};
