
#include "solver.h"
#include "math/scale.h"

#include <iostream>
#include <nlopt.hpp>

double objective(const vector<double> &x, vector<double> &grad, void *data) {
	// Uncomment the next two lines to debug issues
	// for (auto &v : x) cout << v << ",";
	// cout << endl;

	if (!grad.empty()) {
		for (int i = 0; i < Shared::last; i++) grad[i] = 0;
		grad[Shared::last] = -1;
	}
	return -x[Shared::last];
}

void clip_to_bounds(vector<double> &x0, const vector<double> &lower_bounds, const vector<double> &upper_bounds) {
	for (int i = 0; i < Shared::dim; ++i) {
		x0[i] = min(max(x0[i], lower_bounds[i]), upper_bounds[i]);
	}
}

OptimizeResult pack(vector<double> x, const ConstraintList &cons) {
	nlopt::opt optimizer(nlopt::LD_SLSQP, Shared::dim);

	optimizer.set_min_objective(objective, nullptr);

	for (auto &con : cons) con->add_to(optimizer);

	vector<double> lb(Shared::dim, 0);
	vector<double> ub(Shared::dim, 1);
	lb.back() = 1.0 / MAX_SHEET_SIZE;
	ub.back() = 1.0 / MIN_SHEET_SIZE;
	optimizer.set_lower_bounds(lb);
	optimizer.set_upper_bounds(ub);

	clip_to_bounds(x, lb, ub);

	optimizer.set_maxeval(200);
	optimizer.set_xtol_abs(1e-6);
	optimizer.set_ftol_abs(1e-5);

	double minf;
	auto result = optimizer.optimize(x, minf);
	return {x, result > 0, result, minf}; // RVO, no need to move x
}
