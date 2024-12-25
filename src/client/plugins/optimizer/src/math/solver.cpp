
#include "solver.h"
#include "math/scale.h"

#include <iostream>
#include <nlopt.h>

int step = 0;

double objective(unsigned int n, const double *x, double *grad, void *data) {
	// Uncomment the next two lines to debug issues
	// for(int i = 0; i < n; i++) cout << x[i] << ",";
	// cout << endl;

	if(data) {
		auto *callback = reinterpret_cast<cfunc>(data);
		callback(++step);
	}
	if(grad) Constraint::reset(grad, -1);
	return -x[Shared::last];
}

void clip_to_bounds(vector<double> &x0, const vector<double> &lower_bounds, const vector<double> &upper_bounds) {
	for(int i = 0; i < Shared::dim; ++i) {
		x0[i] = min(max(x0[i], lower_bounds[i]), upper_bounds[i]);
	}
}

OptimizeResult pack(vector<double> x, const ConstraintList &cons, cfunc callback) {
	/**
	 * We deliberately use the C API of NLopt instead of the C++ API,
	 * to save some overhead of conversion and error handling (which we don't need).
	 */
	nlopt_opt opt = nlopt_create(NLOPT_LD_SLSQP, Shared::dim);
	nlopt_set_min_objective(opt, objective, (void *)callback);

	for(const auto &con: cons) con->add_to(opt);

	vector<double> lb(Shared::dim, 0);
	vector<double> ub(Shared::dim, 1);
	lb.back() = 1.0 / MAX_SHEET_SIZE;
	ub.back() = 1.0 / MIN_SHEET_SIZE;

	nlopt_set_lower_bounds(opt, lb.data());
	nlopt_set_upper_bounds(opt, ub.data());

	clip_to_bounds(x, lb, ub);

	nlopt_set_maxeval(opt, 200);
	nlopt_set_xtol_abs1(opt, 1e-6);
	nlopt_set_ftol_abs(opt, 1e-5);
	step = 0;

	/**
	 * According to the [NLopt docs](https://nlopt.readthedocs.io/en/latest/NLopt_Reference/#error-codes-negative-return-values),
	 * in case of NLOPT_ROUNDOFF_LIMITED, the result is still typically useful.
	 * However, it is known that wrong setup of the problem can equally trigger this error,
	 * so in the end I think it is safer to treat it as failure still.
	 */
	double minf;
	auto result = nlopt_optimize(opt, x.data(), &minf);
	nlopt_destroy(opt);					  // With C API we need to manually do this
	return {x, result > 0, result, minf}; // RVO, no need to move x
}
