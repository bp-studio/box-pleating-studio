
#pragma once

#include "constraint.h"

class FixedConstraint : public Constraint {
  public:
	FixedConstraint(int i, double v, double offset)
		: Constraint(Type::equality), i(i), v(v), offset(offset) {}

  protected:
	const int i;
	const double v;
	const double offset;

	double constraint(const vector<double> &x, vector<double> &grad) const override;
};
