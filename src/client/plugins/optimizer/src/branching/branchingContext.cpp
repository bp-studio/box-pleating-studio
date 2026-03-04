
#include "branchingContext.h"
#include "constraint/fixedConstraint.h"
#include "math/scale.h"

BranchingContext::BranchingContext(const vector<double> &x0, Hierarchy *hierarchy)
	: hierarchy(hierarchy), fixed(Shared::flap_count, false), solution(to_grid(x0)) {
}

vector<double> BranchingContext::to_grid(const vector<double> &x) const {
	auto grid = get_scale(x);
	const auto &offset = hierarchy->sheet->offset;
	vector<double> result;
	result.reserve(Shared::dim);
	for(int i = 0; i < Shared::last; i++) {
		double v = (x[i] - offset) * grid;
		if(fixed[i]) v = round(v);
		result.push_back(v);
	}
	result.push_back(grid);
	return result;
}

vector<double> BranchingContext::to_double(const vector<double> &x) const {
	auto grid = get_scale(x);
	const auto &offset = hierarchy->sheet->offset;
	vector<double> result;
	result.reserve(Shared::dim);
	for(int i = 0; i < Shared::last; i++) {
		double v = x[i] * grid + offset;
		result.push_back(v);
	}
	result.push_back(grid);
	return result;
}

double convert_if_almost_integer(const double x) {
	auto rnd = round(x);
	return abs(x - rnd) < 1e-5 ? rnd : x;
}

bool isInteger(const double value) {
	return value == floor(value);
}

double _branch(const double x, const int dir) {
	return dir ? ceil(x) : floor(x);
}

Pt BranchingContext::get(const int i) const {
	return {
		.x = convert_if_almost_integer(solution[i * 2]),
		.y = convert_if_almost_integer(solution[i * 2 + 1])
	};
}

vector<double> BranchingContext::branch(const vector<double> *vec, const double x, const double y, const int i, const int q) const {
	if(isInteger(x) && q % 2 || isInteger(y) && q > 1) return {};
	return make_xk(vec, _branch(x, q & 1), _branch(y, q >> 1), i);
}

vector<double> BranchingContext::make_xk(const vector<double> *vec, const double x, const double y, const int i) const {
	auto xk = vec == nullptr ? solution : *vec; // copy
	xk[i * 2] = x;
	xk[i * 2 + 1] = y;
	if(!hierarchy->check(xk, i, fixed)) return {};
	hierarchy->sheet->enlarge_if_necessary(xk, x, y);
	return xk;
}

vector<int> BranchingContext::output() const {
	return hierarchy->sheet->output(solution);
}

ConstraintList BranchingContext::generate_constraints(const vector<double> &sol) const {
	auto result = hierarchy->generate_constraints(&fixed);
	const auto &offset = hierarchy->sheet->offset;
	for(int i = 0; i < Shared::flap_count; i++) {
		if(!fixed[i]) continue;
		result.emplace_back(make_unique<FixedConstraint>(i * 2, sol[i * 2], sol[i * 2 + 1], offset));
	}
	return result;
}
