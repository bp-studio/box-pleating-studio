
#pragma once

#include <iostream>
#include <vector>

using namespace std;

struct Pt {
	double x;
	double y;
};

/**
 * Global variables.
 */
namespace Shared {
	inline int flap_count = 0;
	inline int dim = 0;
	inline int last = 0;
	inline bool async = false;

	inline void setup(int count) {
		flap_count = count;
		dim = flap_count * 2 + 1;
		last = dim - 1;
	}
};

constexpr double D_RAND_MAX = static_cast<double>(RAND_MAX);

/**
 * Helper function for returning a uniform random number between 0 and 1.
 */
inline double random01() {
	return static_cast<double>(std::rand()) / D_RAND_MAX;
}
