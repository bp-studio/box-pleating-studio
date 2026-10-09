
#pragma once

#include "sheet.h"

class Rect: public Sheet {
  public:
	static Sheet *getInstance() {
		if(instance == nullptr) instance = new Rect();
		return instance;
	}

	Rect(const Rect &) = delete;
	Rect &operator=(const Rect &) = delete;

	void add_bounds(ConstraintList &cons, const vector<Flap> &flaps) const override;

	int size_step() const override { return 1; }
	int ceil_size(const double size) const override;
	bool int_contains(const int x, const int y, const Flap &flap, const int size) const override;
	vector<int> int_output(const vector<int> &grid, const vector<Flap> &flaps) const override;

  private:
	Rect(): Sheet(0) {} // No offset
	static Rect *instance;
};
