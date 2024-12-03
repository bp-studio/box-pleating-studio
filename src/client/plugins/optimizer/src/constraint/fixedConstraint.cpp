
#include "global/global.h"
#include "fixedConstraint.h"

double FixedConstraint::constraint(const vector<double> &x, vector<double> &grad) const {
	if (!grad.empty()) {
		for (double &e : grad) e = 0;
		grad[i] = 1;
		grad[Shared::last] = -v;
	}
	return x[i] - offset - v * x[Shared::last];
}
