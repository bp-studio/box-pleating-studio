
#include "tree.h"

Tree::Tree(const emscripten::val &data) {
	const int count = data["length"].as<int>();
	parents.reserve(count);
	dists.reserve(count);
	id_map.reserve(count);
	vector<int> parent_ids;
	parent_ids.reserve(count);
	for(int i = 0; i < count; i++) {
		auto node = data[i];
		id_map.emplace(node["id"].as<int>(), i);
		dists.push_back(node["dist"].as<int>());
		auto parent = node["parent"];
		parent_ids.push_back(parent.isNull() ? -1 : parent.as<int>());
	}
	for(const int id: parent_ids) parents.push_back(id < 0 ? -1 : index_of(id));
}

int Tree::index_of(const int id) const {
	auto iter = id_map.find(id);
	return iter == id_map.end() ? -1 : iter->second;
}

int Tree::lca(int a, int b) const {
	// Comparing the distances works the same as comparing the depths here (see getLCA in the Core)
	while(a != b) {
		if(dists[a] > dists[b]) {
			a = parents[a];
		} else if(dists[b] > dists[a]) {
			b = parents[b];
		} else {
			a = parents[a];
			b = parents[b];
		}
	}
	return a;
}

bool Tree::is_ancestor(const int p, int n) const {
	while(dists[n] > dists[p]) n = parents[n];
	return n == p;
}
