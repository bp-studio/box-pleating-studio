
#pragma once

#include "constraint.h"

class FixedConstraint: public VectorConstraint {
  public:
	FixedConstraint(const int i, const double x, const double y, const double offset)
		: VectorConstraint(Type::equality, 2), i(i), vx(x), vy(y), offset(offset) {}

  protected:
	const int i;
	const double vx;
	const double vy;
	const double offset;

	void constraint(double *result, const double *x, double *grad) const override;
};
