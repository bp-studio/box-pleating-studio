
#include "diag.h"
#include "math/scale.h"

#include <array>

Diag *Diag::instance = nullptr;

// LL, UR, UL, LR
const array<double, 4> fx = {-1, 1, -1, 1};
const array<double, 4> fy = {-1, 1, 1, -1};
const array<double, 4> v = {0.5, -1.5, -0.5, -0.5};

class DiagBounds: public VectorConstraint {
  public:
    DiagBounds() = delete;
	DiagBounds(const int i, const int offset)
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

void Diag::add_bounds(ConstraintList &cons, const vector<Flap> &flaps) const {
	for(int i = 0; i < Shared::flap_count; i++) {
		const auto &flap = flaps[i];
		auto offset = min(flap.width, flap.height);
		cons.emplace_back(make_unique<DiagBounds>(i, offset));
	}
}

/** The minimal half-size of the sheet for the flap to be placed at (x, y); the inverse of {@link Diag::int_contains}. */
int min_half(const int x, const int y, const Flap &flap) {
	const int offset = min(flap.width, flap.height);
	return max({x + y + offset, y - x + offset, x - y + offset, -x - y - offset});
}

int Diag::ceil_size(const double size) const {
	// Only even sizes are admissible, so that the origin (the center) is a grid point
	int s = int_scale(size);
	return s % 2 ? s + 1 : s;
}

bool Diag::int_contains(const int x, const int y, const Flap &flap, const int size) const {
	// This is the integral version of DiagBounds (same signs as `off` there)
	const int half = size / 2;
	const int offset = min(flap.width, flap.height);
	return -x - y <= half + offset && x + y <= half - offset && y - x <= half - offset && x - y <= half - offset;
}

vector<int> Diag::int_output(const vector<int> &grid, const vector<Flap> &flaps) const {
	// For diagonal sheet, we only output even grid size
	vector<int> result(grid);
	int half = 0;
	for(int i = 0; i < Shared::flap_count; i++) {
		half = max(half, min_half(grid[i * 2], grid[i * 2 + 1], flaps[i]));
	}
	for(auto &v: result) v += half;
	result.push_back(2 * half);
	return result;
}
