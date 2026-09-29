
#pragma once

#include "sheet.h"

class Diag: public Sheet {
  public:
	static Sheet *getInstance() {
		if(instance == nullptr) instance = new Diag();
		return instance;
	}

	Diag(const Diag &) = delete;
	Diag &operator=(const Diag &) = delete;

	void add_bounds(ConstraintList &cons, const vector<Flap> &flaps) const override;

	int size_step() const override { return 2; }
	int ceil_size(const double size) const override;
	bool int_contains(const int x, const int y, const Flap &flap, const int size) const override;
	vector<int> int_output(const vector<int> &grid, const vector<Flap> &flaps) const override;

  private:
	Diag(): Sheet(0.5) {} // Use the center of the sheet as origin
	static Diag *instance;
};
