
#include "diag.h"

#include <array>

Diag *Diag::instance = nullptr;

// LL, UR, UL, LR
const array<double, 4> fx = {-1, 1, -1, 1};
const array<double, 4> fy = {-1, 1, 1, -1};
const array<double, 4> v = {0.5, -1.5, -0.5, -0.5};

class DiagBounds: public VectorConstraint {
  public:
	DiagBounds(int i, int offset)
		: VectorConstraint(Type::inequality, 4), ix(i * 2), iy(i * 2 + 1), off{-offset, offset, offset, offset} {}

  protected:
	const int ix;
	const int iy;
	const array<int, 4> off;

	void constraint(double *result, const double *x, double *grad) const override {
		if(grad) {
			for(int n = 0; n < 4; n++) {
				reset(grad, off[n]);
				grad[ix] = fx[n];
				grad[iy] = fy[n];
				grad += Shared::dim;
			}
		}
		for(int n = 0; n < 4; n++) {
			*(result + n) = fx[n] * x[ix] + fy[n] * x[iy] + off[n] * x[Shared::last] + v[n];
		}
	}
};

void Diag::add_bounds(ConstraintList &cons, const vector<Flap> &flaps, const vector<bool> *fixed) const {
	for(int i = 0; i < Shared::flap_count; i++) {
		if(fixed && (*fixed)[i]) continue;
		const auto &flap = flaps[i];
		auto offset = min(flap.width, flap.height);
		cons.emplace_back(make_unique<DiagBounds>(i, offset));
	}
}

bool Diag::check_bounds(const vector<double> &xk, int n, const vector<Flap> &flaps) const {
	return true; // For diagonal sheet there's nothing to check
}

vector<int> Diag::output(const vector<double> &solution) const {
	// For diagonal sheet, we only output even grid size
	vector<int> result;
	for(int i = 0; i < Shared::last; i++) {
		int r = round(solution[i]);
		result.push_back(r);
	}
	int grid = 0;
	for(int i = 0; i < Shared::flap_count; i++) {
		auto x = result[i * 2];
		auto y = result[i * 2 + 1];
		auto v = abs(x) + abs(y);
		if(v > grid) grid = v;
	}
	for(auto &v: result) v += grid;
	result.push_back(2 * grid);
	return result;
}

void Diag::enlarge_if_necessary(vector<double> &xk, double x, double y) const {
	auto &s = xk[Shared::last];
	double r = 2 * (abs(x) + abs(y));
	if(r > s) s = r;
}
