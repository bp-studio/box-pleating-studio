
#include "fixedConstraint.h"
#include "global/global.h"

double FixedConstraint::constraint(const double *x, double *grad) const {
	if (grad) {
		reset(grad, -v);
		grad[i] = 1;
	}
	return x[i] - offset - v * x[Shared::last];
}
