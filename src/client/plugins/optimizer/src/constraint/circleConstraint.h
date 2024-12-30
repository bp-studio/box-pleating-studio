
#pragma once

#include "constraint.h"

class CircleConstraint: public ScalarConstraint {
  public:
	CircleConstraint(int i, int j, int dist)
		: ScalarConstraint(Type::inequality), i(i), j(j), dist(dist) {}

  protected:
	const int i;
	const int j;
	const int dist;

	double constraint(const double *x, double *grad) const override;
};
