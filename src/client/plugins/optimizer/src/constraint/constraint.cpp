
#include "constraint.h"
#include "class/hierarchy.h"

#include <nlopt.h>

constexpr double TOL = 1e-10;

void ScalarConstraint::add_to(nlopt_opt opt) {
	if(type == Type::equality) {
		nlopt_add_equality_constraint(opt, constraint_wrapper, this, TOL);
	} else {
		nlopt_add_inequality_constraint(opt, constraint_wrapper, this, TOL);
	}
}

double ScalarConstraint::constraint_wrapper(unsigned n, const double *x, double *grad, void *data) {
	const auto *const self = static_cast<const ScalarConstraint *>(data);
	return self->constraint(x, grad);
}

void VectorConstraint::add_to(nlopt_opt opt) {
	if(type == Type::equality) {
		nlopt_add_equality_mconstraint(opt, dim, constraint_wrapper, this, tol.data());
	} else {
		nlopt_add_inequality_mconstraint(opt, dim, constraint_wrapper, this, tol.data());
	}
}

void VectorConstraint::constraint_wrapper(unsigned m, double *result, unsigned n, const double *x, double *grad, void *data) {
	const auto *const self = static_cast<const VectorConstraint *>(data);
	self->constraint(result, x, grad);
}

const vector<double> VectorConstraint::tol = {TOL, TOL, TOL, TOL};
