
#include "heuristics.h"
#include "global/interrupt.h"
#include "scale.h"
#include "solver.h"

#include <algorithm>
#include <emscripten.h>
#include <iostream>

using namespace std;

using Vec = vector<double>;
using VecList = vector<Vec>;

struct Circle {
	double x;
	double y;
	double radius;
};

int find_index_by_id(const vector<Flap> &flaps, int id) {
	for (int i = 0; i < Shared::flap_count; i++) {
		if (flaps[i].id == id) return i;
	}
	throw std::runtime_error("Flap not found");
}

vector<Circle> make_circles(const Vec &vec, const Hierarchy &hierarchy, const Hierarchy &last_hierarchy) {
	vector<Circle> circles;
	circles.reserve(hierarchy.flaps.size());
	for (auto &f : hierarchy.flaps) {
		auto parent = hierarchy.parent_map.find(f.id);
		if (parent != hierarchy.parent_map.end()) {
			int n = find_index_by_id(last_hierarchy.flaps, parent->second->id);
			circles.emplace_back(vec[n * 2], vec[n * 2 + 1], parent->second->radius * vec.back());
		} else {
			int n = find_index_by_id(last_hierarchy.flaps, f.id);
			circles.emplace_back(vec[n * 2], vec[n * 2 + 1], 0);
		}
	}
	return circles;
}

Vec generate_in_circles(const vector<Circle> *circles) {
	Vec vec;
	vec.reserve(circles->size() * 2 + 1);
	for (auto &c : *circles) {
		if (c.radius == 0) {
			vec.push_back(c.x);
			vec.push_back(c.y);
		} else {
			auto theta = random01() * 2 * M_PI;
			auto r = c.radius * sqrt(random01()); // uniform with respect to area
			vec.push_back(c.x + r * cos(theta));
			vec.push_back(c.y + r * sin(theta));
		}
	}
	vec.push_back(0);
	return vec;
}

int estimate_total(int target, double growth, int rounds) {
	int total = 0;
	int vectors = 0;
	auto num = growth;
	for (int i = 0; i < rounds; i++) {
		if (i == 0) {
			vectors = floor(num);
		} else {
			int next_vec = 0;
			int num_per_vec = round(num / vectors);
			for (int j = 0; j < vectors; j++) {
				next_vec += min(num_per_vec, target - next_vec);
			}
			vectors = next_vec;
		}
		total += vectors;
		num *= growth;
	}
	return total;
}

class GenerateContext {
  public:
	GenerateContext(int total) : total(total) {}

	// We need the following because ConstraintList is holding unique_ptr
	GenerateContext(const GenerateContext &) = delete;
	GenerateContext &operator=(const GenerateContext &) = delete;

	void set_hierarchy(const Hierarchy *h) {
		hierarchy = h;
		Shared::setup(h->flaps.size()); // Next line depends on this
		constraints = h->generate_constraints(nullptr);
	}

	void callback() {
		cout << R"({"event": "candidate", "data": [)" << generated << ", " << total << "]}" << endl;
		generated++;
	}

	const Hierarchy *hierarchy;
	bool interrupted{false};
	ConstraintList constraints;

  private:
	int total;
	int generated{0};
};

Vec generate_random_vector(int size) {
	Vec result;
	result.reserve(size);
	for (int i = 0; i < size; i++) result.push_back(random01());
	return result;
}

Vec generate_random_candidate(const Hierarchy *hierarchy, const vector<Circle> *circles) {
	Vec result;
	for (int i = 0; i < 4; i++) {
		auto vec = circles ? generate_in_circles(circles) : generate_random_vector(hierarchy->flaps.size() * 2 + 1);
		setup_initial_scale(vec, hierarchy);
		if (result.empty() || get_scale(vec) < get_scale(result)) result = std::move(vec);
	}
	return result;
}

VecList generate_candidate(int target, GenerateContext &context, const vector<Circle> *circles) {
	VecList vectors;
	while (vectors.size() < target) {
		auto vec = generate_random_candidate(context.hierarchy, circles);
		if (!context.interrupted) {
			auto result = pack(vec, context.constraints);
			if (!result.success) continue;
			vec = result.x;
			if (check_interrupt()) context.interrupted = true;
		}
		vectors.push_back(vec);
		context.callback();
	}
	return vectors;
}

VecList generate_next_level(const VecList &vectors, GenerateContext &context, const Hierarchy &last_hierarchy, double num, int target) {
	VecList next_level;
	int num_per_vec = round(num / vectors.size());
	for (auto &vec : vectors) {
		auto circles = make_circles(vec, *context.hierarchy, last_hierarchy);
		auto n = min(num_per_vec, target - (int)next_level.size());
		auto candidates = generate_candidate(n, context, &circles);
		next_level.insert(next_level.end(), candidates.begin(), candidates.end());
	}
	return next_level;
}

VecList generate_candidate(int target, const vector<Hierarchy> &hierarchies) {
	VecList vectors;

	double growth = pow(target, 1.0 / hierarchies.size());
	double num = growth;
	int total = estimate_total(target, growth, hierarchies.size());
	int generated = 0;

	auto context = GenerateContext(total);
	context.callback();

	const Hierarchy *last_hierarchy = nullptr;
	for (auto &hierarchy : hierarchies) {
		context.set_hierarchy(&hierarchy);
		if (vectors.empty()) {
			vectors = generate_candidate(floor(num), context, nullptr);
		} else if (last_hierarchy) {
			vectors = generate_next_level(vectors, context, *last_hierarchy, num, target);
		}
		last_hierarchy = &hierarchy;
		num *= growth;
	}

	if (vectors.size() > target) {
		VecList sorted(target);
		partial_sort(vectors.begin(), vectors.begin() + target, vectors.end(), [](Vec a, Vec b) {
			return a[Shared::last] > b[Shared::last];
		});
		vectors.erase(vectors.begin() + target, vectors.end());
	}
	return vectors;
}
