
#include "circleConstraint.h"
#include "global/global.h"

/**
 * Corresponding to the formula `(x1 - x2)^2 + (y1 - y2)^2 >= (m d)^2`.
 *
 * I've also tried moving m to left side of the inequality,
 * but the current version performs better (in terms of both the quality of the solutions,
 * and the basin-hopping stability) in practice.
 */
double CircleConstraint::constraint(const vector<double> &x, vector<double> &grad) const {
	double d = dist * x[Shared::last];
	double dx = x[i * 2] - x[j * 2];
	double dy = x[i * 2 + 1] - x[j * 2 + 1];

	if (!grad.empty()) {
		for (double &v : grad) v = 0;
		grad[i * 2] = -2 * dx;
		grad[j * 2] = 2 * dx;
		grad[i * 2 + 1] = -2 * dy;
		grad[j * 2 + 1] = 2 * dy;
		grad[Shared::last] = 2 * dist * d;
	}
	return d * d - dx * dx - dy * dy;
}
