
#include "hierarchy.h"
#include "constraint/circleConstraint.h"
#include "constraint/roundedConstraint.h"

Hierarchy::Hierarchy(const emscripten::val &data, const Sheet *sheet): sheet(sheet) {
	auto array = data["leaves"];
	const int flap_count = array["length"].as<int>();
	flaps.reserve(flap_count);
	unordered_map<int, int> id_map;
	id_map.reserve(flap_count);

	for(int i = 0; i < flap_count; i++) {
		int id = array[i].as<int>();
		id_map.emplace(id, i);
		flaps.emplace_back(id, 0, 0);
	}

	array = data["distMap"];
	const int dist_map_count = array["length"].as<int>();
	dist_map.reserve(dist_map_count);
	for(int n = 0; n < dist_map_count; n++) {
		auto map = array[n];
		int i = id_map.at(map[0].as<int>());
		int j = id_map.at(map[1].as<int>());
		int dist = map[2].as<int>();
		dist_map.emplace_back(i, j, dist);
	}

	array = data["parents"];
	const int parent_count = array["length"].as<int>();
	parents.reserve(parent_count);
	for(int i = 0; i < parent_count; i++) {
		parents.emplace_back(array[i]);
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
