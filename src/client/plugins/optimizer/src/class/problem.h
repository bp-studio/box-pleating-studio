
#pragma once

#include "hierarchy.h"
#include "tree.h"

#include <emscripten/bind.h>
#include <memory>
#include <vector>

using namespace std;

class Problem {
  public:
	Problem(const emscripten::val &data);

	vector<Hierarchy> hierarchies;

	/** The structure of the tree; could be absent (in which case the covering rules are not applied). */
	unique_ptr<Tree> tree;
};
