
#pragma once

#include "class/hierarchy.h"
#include "grid.h"

#include <vector>

using namespace std;

/**
 * Counts the total number of vertices (equivalently, edges) of all the rough contours of a layout,
 * which measures how much the rivers bend.
 *
 * The rough contour of a tree edge (see `roughContourTask` in the Core) is the union of
 * the rectangles of all flaps under it, each expanded by its tree distance to the edge.
 * The vertices of such a union of axis-aligned rectangles are counted directly on a compressed grid,
 * without the need of actually constructing the polygons.
 *
 * The counts are cached per tree node, and only the ancestors of the moved flaps are recomputed.
 */
class Contour {
  public:
	Contour(const Hierarchy *hierarchy);

	/** Whether the counting is available (i.e. the tree structure is available). */
	bool available() const { return tree != nullptr; }

	/** Recompute everything for the given layout. */
	void compute(const GridLayout &layout);

	/** Recompute the nodes affected by the given flaps having moved. */
	void update(const GridLayout &layout, const vector<int> &moved);

	/** Total number of vertices of all rough contours. */
	int64_t total() const { return sum; }

  private:
	struct Leaf {
		int flap;
		int expansion; // tree distance from the flap to the node
	};

	const Hierarchy *hierarchy;
	const Tree *tree;
	vector<int> nodes;			 // node index of each flap
	vector<vector<Leaf>> leaves; // for each node, the flaps under it (empty for the root, which has no contour)
	vector<int64_t> cache;		 // vertex count of each node
	int64_t sum = 0;

	int64_t count(const int node, const GridLayout &layout) const;
};
