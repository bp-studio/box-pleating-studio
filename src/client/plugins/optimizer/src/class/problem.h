
#pragma once

#include "hierarchy.h"

#include <emscripten/bind.h>
#include <vector>

using namespace std;

class Problem {
  public:
	Problem(const emscripten::val &data);

	vector<Hierarchy> hierarchies;
};
