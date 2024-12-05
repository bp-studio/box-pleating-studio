
#pragma once

#include "constraint/constraint.h"
#include "global/global.h"
#include "parent.h"
#include "sheet/sheet.h"

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
	Hierarchy(double *&ptr, const Sheet *sheet);

	const Sheet *sheet;
	vector<Flap> flaps;
	unordered_map<int, int> id_map;
	unordered_map<int, int> id_lookup;

	vector<DistMap> dist_map;
	vector<Parent> parents;
	unordered_map<int, Parent *> parent_map;

	ConstraintList generate_constraints(const vector<bool> *fixed) const;
	bool check(const vector<double> &x, int n, const vector<bool> &fixed) const;
};
