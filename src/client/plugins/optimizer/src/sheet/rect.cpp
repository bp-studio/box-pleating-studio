
#include "rect.h"
#include "math/scale.h"

Rect *Rect::instance = nullptr;

class RectBounds: public ScalarConstraint {
  public:
	RectBounds(const int i, const int dim)
		: ScalarConstraint(Type::inequality), i(i), dim(dim) {}

  protected:
	const int i;
	const int dim;

	double constraint(const double *x, double *grad) const override {
		if(grad) {
			reset(grad, dim);
			grad[i] = 1;
		}
		return x[i] + dim * x[Shared::last] - 1;
	}
};

void Rect::add_bounds(ConstraintList &cons, const vector<Flap> &flaps) const {
	for(int i = 0; i < Shared::flap_count; i++) {
		const auto &flap = flaps[i];
		if(flap.width != 0) {
			cons.emplace_back(make_unique<RectBounds>(i * 2, flap.width));
		}
		if(flap.height != 0) {
			cons.emplace_back(make_unique<RectBounds>(i * 2 + 1, flap.height));
		}
	}
}

int Rect::ceil_size(const double size) const {
	return int_scale(size);
}

bool Rect::int_contains(const int x, const int y, const Flap &flap, const int size) const {
	return x >= 0 && y >= 0 && x + flap.width <= size && y + flap.height <= size;
}

vector<int> Rect::int_output(const vector<int> &grid, const vector<Flap> &flaps) const {
	vector<int> result(grid);
	int max = 0;
	for(int i = 0; i < Shared::flap_count; i++) {
		max = std::max({max, grid[i * 2] + flaps[i].width, grid[i * 2 + 1] + flaps[i].height});
	}
	result.push_back(max);
	return result;
}
