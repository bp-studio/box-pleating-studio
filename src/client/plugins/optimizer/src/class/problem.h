
#pragma once

#include "hierarchy.h"

#include <vector>

using namespace std;

class Problem {
  public:
	Problem(double *&ptr);

	vector<Hierarchy> hierarchies;
};
