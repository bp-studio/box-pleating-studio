
#include "hierarchy.h"
#include "constraint/circleConstraint.h"
#include "constraint/roundedConstraint.h"

Hierarchy::Hierarchy(double *&ptr, const Sheet *sheet) : sheet(sheet) {
	int flap_count = read(ptr);
	flaps.reserve(flap_count);
	unordered_map<int, int> id_map;
	id_map.reserve(flap_count);

	for(int i = 0; i < flap_count; i++) {
		int id = read(ptr);
		id_map.emplace(id, i);
		flaps.emplace_back(id, 0, 0);
	}

	int dist_map_count = read(ptr);
	dist_map.reserve(dist_map_count);
	for(int n = 0; n < dist_map_count; n++) {
		int i = id_map.at(read(ptr));
		int j = id_map.at(read(ptr));
		int dist = read(ptr);
		dist_map.emplace_back(i, j, dist);
	}

	int parent_count = read(ptr);
	parents.reserve(parent_count);
	for(int i = 0; i < parent_count; i++) {
		parents.emplace_back(ptr);
	}

	for(const auto &parent: parents) {
		for(auto id: parent.children) {
			parent_map.emplace(id, &parent);
		}
	}
}

ConstraintList Hierarchy::generate_constraints(const vector<bool> *fixed) const {
	ConstraintList cons;
	sheet->add_bounds(cons, flaps, fixed);

	for(const auto &entry: dist_map) {
		auto [i, j, dist] = entry;
		if(fixed && (*fixed)[i] && (*fixed)[j]) continue;
		if(flaps[i].has_dimension() || flaps[j].has_dimension()) {
			cons.emplace_back(make_unique<RoundedConstraint>(i, j, dist, &flaps));
		} else {
			cons.emplace_back(make_unique<CircleConstraint>(i, j, dist));
		}
	}
	return cons;
}

bool Hierarchy::check(const vector<double> &x, int n, const vector<bool> &fixed) const {
	if(!sheet->check_bounds(x, n, flaps)) return false;

	for(const auto &entry: dist_map) {
		auto [i, j, dist] = entry;
		if(i == n && fixed[j] || j == n && fixed[i]) {
			if(RoundedConstraint::exact(x, i, j, dist, flaps) > 0) return false;
		}
	}
	return true;
}

const Parent *Hierarchy::get_parent(int id) const {
	auto iter = parent_map.find(id);
	if(iter != parent_map.end()) return iter->second;
	return nullptr;
}
