
#include "roundedConstraint.h"
#include "global/global.h"

/**
 * Signed-distance between two intervals, represented by the left endpoint and width.
 *
 * The formula is `max(l1 - r2, 0) + min(r1 - l2, 0)`.
 */
double interval_distance(double l1, double w1, double l2, double w2) {
	return max(l1 - l2 - w2, 0.0) + min(l1 + w1 - l2, 0.0);
}

double RoundedConstraint::constraint(const double *x, double *grad) const {
	auto m = x[Shared::last];
	auto d = dist * m;
	auto dx = interval_distance(x[i * 2], m * (*flaps)[i].width, x[j * 2], m * (*flaps)[j].width);
	auto dy = interval_distance(x[i * 2 + 1], m * (*flaps)[i].height, x[j * 2 + 1], m * (*flaps)[j].height);

	if (grad) {
		auto dx_s = dx > 0 ? -(*flaps)[j].width : (dx < 0 ? (*flaps)[i].width : 0);
		auto dy_s = dy > 0 ? -(*flaps)[j].height : (dy < 0 ? (*flaps)[i].height : 0);
		reset(grad, 2 * dist * d - 2 * dx * dx_s - 2 * dy * dy_s);
		grad[i * 2] = -2 * dx;
		grad[j * 2] = 2 * dx;
		grad[i * 2 + 1] = -2 * dy;
		grad[j * 2 + 1] = 2 * dy;
	}
	return d * d - dx * dx - dy * dy;
}

double RoundedConstraint::exact(const vector<double> &x, int i, int j, int dist, const vector<Flap> &flaps) {
	auto dx = interval_distance(x[i * 2], flaps[i].width, x[j * 2], flaps[j].width);
	auto dy = interval_distance(x[i * 2 + 1], flaps[i].height, x[j * 2 + 1], flaps[j].height);
	return dist * dist - dx * dx - dy * dy;
}
