
#include "constraint.h"
#include "class/hierarchy.h"

#include <nlopt.h>

constexpr double TOL = 1e-10;

void Constraint::add_to(nlopt_opt opt) {
	if(type == Type::equality) {
		nlopt_add_equality_constraint(opt, constraint_wrapper, this, TOL);
	} else {
		nlopt_add_inequality_constraint(opt, constraint_wrapper, this, TOL);
	}
}

double Constraint::constraint_wrapper(unsigned n, const double *x, double *grad, void *data) {
	const auto *const self = static_cast<const Constraint *>(data);
	return self->constraint(x, grad);
}
