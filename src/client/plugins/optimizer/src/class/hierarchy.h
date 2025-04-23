
#pragma once

#include "constraint/constraint.h"
#include "global/global.h"
#include "parent.h"
#include "sheet/sheet.h"

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

	ConstraintList generate_constraints(const vector<bool> *fixed) const;
	bool check(const vector<double> &x, int n, const vector<bool> &fixed) const;
	const Parent *get_parent(int id) const;

  private:
	unordered_map<int, const Parent *> parent_map;
	vector<Parent> parents;
};
