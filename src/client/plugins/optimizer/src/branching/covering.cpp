
#include "covering.h"

#include <algorithm>
#include <numeric>

namespace {

	/** Minimal union-find over quadrant codes. */
	class UnionFind {
	  public:
		UnionFind(const int size): parent(size) {
			iota(parent.begin(), parent.end(), 0); // NOLINT(modernize-use-ranges)
		}

		int find(const int x) {
			if(parent[x] != x) parent[x] = find(parent[x]);
			return parent[x];
		}

		void unite(const int x, const int y) {
			parent[find(x)] = find(y);
		}

	  private:
		vector<int> parent;
	};

	/** An axis-aligned rectangle given by two corners (normalized), replicating `Rectangle` in the Core. */
	struct Rect {
		int x1;
		int y1;
		int x2;
		int y2;

		Rect(const int ax, const int ay, const int bx, const int by)
			: x1(min(ax, bx)), y1(min(ay, by)), x2(max(ax, bx)), y2(max(ay, by)) {}

		bool contains(const Rect &that) const {
			return x1 <= that.x1 && y1 <= that.y1 && x2 >= that.x2 && y2 >= that.y2;
		}

		bool operator==(const Rect &that) const = default;
	};

	constexpr int QUADRANTS = 4;

	int opposite(const int dir) {
		return (dir + 2) % QUADRANTS;
	}

	/** Based on the given canonical distance to get the comparison rectangle. */
	Rect base_rectangle(const Junction &j, const int distance_to_a) {
		const int x = j.tip_x + distance_to_a * j.fx;
		const int y = j.tip_y + distance_to_a * j.fy;
		return {x, y, x - j.ox * j.fx, y - j.oy * j.fy};
	}

	bool closer_than(const Junction &j1, const Junction &j2) {
		return j1.sx < j2.sx || j1.sy < j2.sy;
	}

	pair<int, int> oriented(const Junction &j) {
		return j.fx > 0 ? pair{j.a, j.b} : pair{j.b, j.a};
	}

} // namespace

Covering::Covering(const Hierarchy *hierarchy): hierarchy(hierarchy), tree(hierarchy->tree) {
	if(!tree) return;
	nodes.reserve(Shared::flap_count);
	for(const auto &flap: hierarchy->flaps) {
		const int node = tree->index_of(flap.id);
		if(node < 0) { // Not expected; disable the covering rules
			tree = nullptr;
			return;
		}
		nodes.push_back(node);
	}
}

void Covering::compute(const GridLayout &layout) {
	list.clear();
	for(const auto &[i, j, dist]: hierarchy->dist_map) create_junction(i, j, dist, layout);
	if(!tree) return;

	const int count = list.size();
	covered_by.assign(count, {});
	memo.assign(count, -1);

	// First round of grouping, by the connectivity of the quadrants
	UnionFind uf(Shared::flap_count * QUADRANTS);
	for(const auto &j: list) uf.unite(j.a * QUADRANTS + j.dir, j.b * QUADRANTS + opposite(j.dir));
	vector<int> team(count);
	for(int j = 0; j < count; j++) team[j] = uf.find(list[j].a * QUADRANTS + list[j].dir);

	// Geometrical covering checks within each team
	for(int j1 = 0; j1 < count; j1++) {
		for(int j2 = j1 + 1; j2 < count; j2++) {
			if(team[j1] == team[j2]) check_covering(j1, j2);
		}
	}

	// Practical covering
	for(int j = 0; j < count; j++) list[j].covered = is_covered(j);
}

int64_t Covering::uncovered_area() const {
	int64_t result = 0;
	for(const auto &j: list) {
		if(!j.covered) result += j.area;
	}
	return result;
}

/** Replicates `createJunction` in the Core. */
void Covering::create_junction(int i, int j, const int dist, const GridLayout &layout) {
	const auto &flaps = hierarchy->flaps;
	if(flaps[i].id > flaps[j].id) swap(i, j);
	const auto &fa = flaps[i];
	const auto &fb = flaps[j];
	const auto pa = layout.at(i);
	const auto pb = layout.at(j);
	const int l1 = pa.x, r1 = pa.x + fa.width, b1 = pa.y, t1 = pa.y + fa.height; // NOLINT(readability-isolate-declaration)
	const int l2 = pb.x, r2 = pb.x + fb.width, b2 = pb.y, t2 = pb.y + fb.height; // NOLINT(readability-isolate-declaration)

	const int x = l2 - r1;
	const int y = b2 - t1;
	const int sx = max(l1 - r2, x);
	const int sy = max(b1 - t2, y);
	if(sx <= 0 || sy <= 0 || sx >= dist || sy >= dist) return; // No junction
	if(square(sx) + square(sy) < square(dist)) return;		   // Invalid junction (should not happen for valid layouts)

	const int fx = x > 0 ? 1 : -1;
	const int fy = y > 0 ? 1 : -1;
	const int dir = (fx == fy ? 0 : 1) + (y > 0 ? 0 : 2);
	// The corners of flap a, in the order of quadrants: UR, UL, LL, LR
	const int tip_x = dir == 0 || dir == 3 ? r1 : l1;
	const int tip_y = dir == 0 || dir == 1 ? t1 : b1;

	list.push_back({
		.a = i,
		.b = j,
		.lca = tree ? tree->lca(nodes[i], nodes[j]) : -1,
		.sx = sx,
		.sy = sy,
		.ox = dist - sx,
		.oy = dist - sy,
		.fx = fx,
		.fy = fy,
		.dir = dir,
		.tip_x = tip_x,
		.tip_y = tip_y,
		.area = static_cast<int64_t>(dist - sx) * (dist - sy),
	});
}

/** Replicates `checkGeometricalCovering` (and `getPathIntersectionDistances`) in the Core. */
void Covering::check_covering(int j1, int j2) {
	if(tree->dist(list[j2].lca) > tree->dist(list[j1].lca)) swap(j1, j2);
	const auto &J1 = list[j1];
	const auto &J2 = list[j2];

	// Find a common node on the two corresponding paths,
	// and get the distances of the two junction.a's to that node (the canonical distances).
	const int p1 = J1.lca;
	const int p2 = J2.lca;
	const int a1 = nodes[J1.a];
	const int a2 = nodes[J2.a];
	const int b2 = nodes[J2.b];
	int n1 = 0;
	int n2 = 0;
	if(p1 == p2 || tree->dist(p1) != tree->dist(p2) && tree->is_ancestor(p1, a2)) {
		n1 = tree->dist(a1) - tree->dist(p1);
		n2 = tree->dist(a2) - tree->dist(p1);
	} else if(tree->dist(p1) != tree->dist(p2) && tree->is_ancestor(p1, b2)) {
		n1 = tree->dist(a1) - tree->dist(p1);
		n2 = tree->dist(a2) + tree->dist(p1) - 2 * tree->dist(p2);
	} else {
		return;
	}

	const auto r1 = base_rectangle(J1, n1);
	const auto r2 = base_rectangle(J2, n2);
	const bool j1_closer = closer_than(J1, J2);
	if(r1 == r2) {
		// In case of equal junctions, at least one side should be of the same flap
		const auto [a1o, b1o] = oriented(J1);
		const auto [a2o, b2o] = oriented(J2);
		if(a1o != a2o && b1o != b2o) return;
		// Then the near one covers the far one
		if(j1_closer) covered_by[j2].push_back(j1);
		else covered_by[j1].push_back(j2);
	} else if(j1_closer && r1.contains(r2)) {
		covered_by[j2].push_back(j1);
	} else if(closer_than(J2, J1) && r2.contains(r1)) {
		covered_by[j1].push_back(j2);
	}
}

/**
 * Whether the junction is "practically" covered (replicating `ValidJunction.$isCovered` in the Core):
 * it is covered by some junction that is itself not covered.
 */
bool Covering::is_covered(const int j) {
	if(memo[j] == 2) return false; // Cyclic covering; not expected
	if(memo[j] >= 0) return memo[j] == 1;
	memo[j] = 2;
	bool result = false;
	for(const int k: covered_by[j]) {
		if(!is_covered(k)) {
			result = true;
			break;
		}
	}
	memo[j] = result ? 1 : 0;
	return result;
}
