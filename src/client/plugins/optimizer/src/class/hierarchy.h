
#pragma once

#include "constraint/constraint.h"
#include "global/global.h"
#include "parent.h"
#include "sheet/sheet.h"
#include "tree.h"

#include <emscripten/bind.h>
#include <unordered_map>
#include <vector>

using namespace std;

struct DistMap {
	int i;
	int j;
	int dist;
};

class Hierarchy {
  public:
	Hierarchy(const emscripten::val &data, const Sheet *sheet);

	const Sheet *sheet;
	vector<Flap> flaps;
	vector<DistMap> dist_map;

	/** The structure of the tree; only available for the last hierarchy, and could be null. */
	const Tree *tree = nullptr;

	ConstraintList generate_constraints() const;
	const Parent *get_parent(const int id) const;

  private:
	unordered_map<int, const Parent *> parent_map;
	vector<Parent> parents;
};
