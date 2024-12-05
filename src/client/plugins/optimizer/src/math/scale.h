
#pragma once

#include "class/hierarchy.h"

#include <vector>

using namespace std;

void setup_initial_scale(vector<double> &x, const Hierarchy *hierarchy);

int int_scale(double s);

inline double get_scale(const vector<double> &x) {
	return 1.0 / x[Shared::last];
}

const int MIN_SHEET_SIZE = 4;
const int MAX_SHEET_SIZE = 8192;
const int MAX_INIT_SCALE = 1024;
