
#include "fixedConstraint.h"
#include "global/global.h"

void FixedConstraint::constraint(double *result, const double *x, double *grad) const {
	if(grad) {
		reset(grad, -vx);
		reset(grad + Shared::dim, -vy);
		grad[i] = 1;
		grad[i + 1 + Shared::dim] = 1;
	}
	*result = x[i] - offset - vx * x[Shared::last];
	*(result + 1) = x[i + 1] - offset - vy * x[Shared::last];
}
