
#pragma once

#include <vector>

using namespace std;

/**
 * Represents the optimization result.
 */
struct OptimizeResult {
	vector<double> x;
	bool success;
	int status;
	double fun;
	bool interrupted = false;
};
