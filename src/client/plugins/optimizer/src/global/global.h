
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
class Shared {
  public:
	static int flap_count;
	static int dim;
	static int last;
	static bool async;

	static void setup(int count);
};

/**
 * Utility function for reading sequential data from pointer.
 */
inline double read(double *&ptr) {
	return *(ptr++);
}

constexpr double D_RAND_MAX = static_cast<double>(RAND_MAX);

/**
 * Helper function for returning a uniform random number between 0 and 1.
 */
inline double random01() {
	return static_cast<double>(std::rand()) / D_RAND_MAX;
}
