
#pragma once

#include <emscripten/bind.h>
#include <unordered_map>
#include <vector>

using namespace std;

/**
 * The structure of the tree (parent relations and distances to the root),
 * used for replicating the covering rules of junctions in the Core.
 *
 * Nodes are referred to by their indices in this class.
 */
class Tree {
  public:
	Tree(const emscripten::val &data);

	/** Number of nodes. */
	int size() const { return static_cast<int>(parents.size()); }

	/** The index of the node with the given id, or -1 if not found. */
	int index_of(const int id) const;

	/** The distance of the node to the root. */
	int dist(const int node) const { return dists[node]; }

	/** The index of the parent node, or -1 for the root. */
	int parent(const int node) const { return parents[node]; }

	/** The lowest common ancestor of two nodes. */
	int lca(int a, int b) const;

	/** Whether node p is an ancestor of node n (or n itself). */
	bool is_ancestor(const int p, int n) const;

  private:
	vector<int> parents; // index of the parent node, or -1 for the root
	vector<int> dists;
	unordered_map<int, int> id_map;
};
