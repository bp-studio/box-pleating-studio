
#include "constraint.h"
#include "class/hierarchy.h"

#include <nlopt.hpp>

constexpr double TOL = 1e-10;

void Constraint::add_to(nlopt::opt &opt) {
	if (type == Type::equality) {
		opt.add_equality_constraint(constraint_wrapper, this, TOL);
	} else {
		opt.add_inequality_constraint(constraint_wrapper, this, TOL);
	}
}

double Constraint::constraint_wrapper(unsigned n, const double *x, double *grad, void *data) {
	auto self = static_cast<const Constraint *>(data);
	return self->constraint(x, grad);
}
