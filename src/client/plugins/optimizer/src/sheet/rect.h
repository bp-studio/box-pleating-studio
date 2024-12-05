
#pragma once

#include "sheet.h"

class Rect : public Sheet {
  public:
	static Sheet *getInstance() {
		if (instance == nullptr) instance = new Rect();
		return instance;
	}

	Rect(const Rect &) = delete;
	Rect &operator=(const Rect &) = delete;

	void enlarge_if_necessary(vector<double> &xk, double x, double y) const override;
	void add_bounds(ConstraintList &cons, const vector<Flap> &flaps, const vector<bool> *fixed) const override;
	bool check_bounds(const vector<double> &xk, int n, const vector<Flap> &flaps) const override;
	vector<int> output(const vector<double> &solution) const override;

  private:
	Rect() : Sheet(0) {} // No offset
	static Rect *instance;
};
