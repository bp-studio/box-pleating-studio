
#pragma once

#include "class/flap.h"
#include "constraint/constraint.h"
#include "global/global.h"
#include <vector>

using namespace std;

class Sheet {
  public:
	Sheet(const double offset): offset(offset) {}
	virtual ~Sheet() = default;

	const double offset;

	virtual void enlarge_if_necessary(vector<double> &xk, const double x, const double y) const = 0;
	virtual void add_bounds(ConstraintList &cons, const vector<Flap> &flaps, const vector<bool> *fixed) const = 0;
	virtual bool check_bounds(const vector<double> &xk, const int n, const vector<Flap> &flaps) const = 0;
	virtual vector<int> output(const vector<double> &solution) const = 0;
};
