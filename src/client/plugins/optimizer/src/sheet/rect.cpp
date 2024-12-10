
#include "rect.h"

Rect *Rect::instance = nullptr;

class RectBounds : public Constraint {
  public:
	RectBounds(int i, int dim)
		: Constraint(Type::inequality), i(i), dim(dim) {}

  protected:
	const int i;
	const int dim;

	double constraint(const double *x, double *grad) const override {
		if (grad) {
			reset(grad, dim);
			grad[i] = 1;
		}
		return x[i] + dim * x[Shared::last] - 1;
	}
};

void Rect::add_bounds(ConstraintList &cons, const vector<Flap> &flaps, const vector<bool> *fixed) const {
	for (int i = 0; i < Shared::flap_count; i++) {
		if (fixed && (*fixed)[i]) continue;
		auto &flap = flaps[i];
		if (flap.width != 0) {
			cons.emplace_back(make_unique<RectBounds>(i * 2, flap.width));
		}
		if (flap.height != 0) {
			cons.emplace_back(make_unique<RectBounds>(i * 2 + 1, flap.height));
		}
	}
}

bool Rect::check_bounds(const vector<double> &xk, int n, const vector<Flap> &flaps) const {
	return xk[n * 2] >= 0 && xk[n * 2 + 1] >= 0;
}

vector<int> Rect::output(const vector<double> &solution) const {
	vector<int> result;
	int max = 0;
	for (int i = 0; i < Shared::last; i++) {
		int r = round(solution[i]);
		result.push_back(r);
		if (r > max) max = r;
	}
	result.push_back(max);
	return result;
}

void Rect::enlarge_if_necessary(vector<double> &xk, double x, double y) const {
	auto &s = xk[Shared::last];
	if (x > s) s = x;
	if (y > s) s = y;
}
