
#pragma once

#include "sheet.h"

class Diag : public Sheet {
  public:
	static Sheet *getInstance() {
		if (instance == nullptr) instance = new Diag();
		return instance;
	}

	Diag(const Diag &) = delete;
	Diag &operator=(const Diag &) = delete;

	void enlarge_if_necessary(vector<double> &xk, double x, double y) const override;
	void add_bounds(ConstraintList &cons, const vector<Flap> &flaps, const vector<bool> *fixed) const override;
	bool check_bounds(const vector<double> &xk, int n, const vector<Flap> &flaps) const override;
	vector<int> output(const vector<double> &solution) const override;

  private:
	Diag() : Sheet(0.5) {} // Use the center of the sheet as origin
	static Diag *instance;
};
