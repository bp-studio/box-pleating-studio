
#include "diag.h"

Diag *Diag::instance = nullptr;

class DiagBounds : public Constraint {
  public:
	DiagBounds(int i, int fx, int fy, int offset, double v)
		: Constraint(Type::inequality), i(i), fx(fx), fy(fy), offset(offset), v(v) {}

  protected:
	const int i;
	const int fx;
	const int fy;
	const int offset;
	const double v;

	double constraint(const vector<double> &x, vector<double> &grad) const override {
		if (!grad.empty()) {
			for (double &v : grad) v = 0;
			grad[i * 2] = fx;
			grad[i * 2 + 1] = fy;
			grad[Shared::last] = offset;
		}
		return fx * x[i * 2] + fy * x[i * 2 + 1] + offset * x[Shared::last] + v;
	}
};

void Diag::add_bounds(ConstraintList &cons, const vector<Flap> &flaps, const vector<bool> *fixed) const {
	for (int i = 0; i < Shared::flap_count; i++) {
		if (fixed && (*fixed)[i]) continue;
		auto &flap = flaps[i];
		auto offset = min(flap.width, flap.height);
		cons.emplace_back(make_unique<DiagBounds>(i, -1, -1, -offset, 0.5)); // LL
		cons.emplace_back(make_unique<DiagBounds>(i, 1, 1, offset, -1.5));	 // UR
		cons.emplace_back(make_unique<DiagBounds>(i, -1, 1, offset, -0.5));	 // UL
		cons.emplace_back(make_unique<DiagBounds>(i, 1, -1, offset, -0.5));	 // LR
	}
}

bool Diag::check_bounds(const vector<double> &xk, int n, const vector<Flap> &flaps) const {
	return true; // For diagonal sheet there's nothing to check
}

vector<int> Diag::output(const vector<double> &solution) const {
	// For diagonal sheet, we only output even grid size
	vector<int> result;
	for (int i = 0; i < Shared::last; i++) {
		int r = round(solution[i]);
		result.push_back(r);
	}
	int grid = 0;
	for (int i = 0; i < Shared::flap_count; i++) {
		auto x = result[i * 2];
		auto y = result[i * 2 + 1];
		auto v = abs(x) + abs(y);
		if (v > grid) grid = v;
	}
	for (auto &v : result) v += grid;
	result.push_back(2 * grid);
	return result;
}

void Diag::enlarge_if_necessary(vector<double> &xk, double x, double y) const {
	auto &s = xk[Shared::last];
	double r = 2 * (abs(x) + abs(y));
	if (r > s) s = r;
}
