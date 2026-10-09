
#pragma once

#include "class/hierarchy.h"
#include "grid.h"

#include <vector>

using namespace std;

/** A junction between two flaps, replicating `ValidJunction` in the Core. */
struct Junction {
	int a; // flap index; the flap with the smaller id
	int b; // flap index
	int lca; // node index in the tree
	int sx;
	int sy;
	int ox;
	int oy;
	int fx;
	int fy;
	int dir; // quadrant direction of a
	int tip_x;
	int tip_y;
	int64_t area;
	bool covered = false;
};

/**
 * Replicates the covering rules of junctions in the Core (see `stretchTask`),
 * so that we can tell which junctions actually matter (i.e. the uncovered ones).
 */
class Covering {
  public:
	Covering(const Hierarchy *hierarchy);

	/** Whether the covering rules can be applied (i.e. the tree structure is available). */
	bool available() const { return tree != nullptr; }

	/** Compute all junctions of the given layout and decide which are covered. */
	void compute(const GridLayout &layout);

	/** The junctions of the layout computed last time. */
	const vector<Junction> &junctions() const { return list; }

	/** Total area of the uncovered junctions computed last time. */
	int64_t uncovered_area() const;

  private:
	const Hierarchy *hierarchy;
	const Tree *tree;
	vector<int> nodes; // node index of each flap
	vector<Junction> list;
	vector<vector<int>> covered_by; // covered_by[j] = indices of junctions geometrically covering junction j
	vector<signed char> memo;		// memoization for the practical covering; -1 = unknown, 2 = computing

	void create_junction(const int i, const int j, const int dist, const GridLayout &layout);
	void check_covering(int j1, int j2);
	bool is_covered(const int j);
};
