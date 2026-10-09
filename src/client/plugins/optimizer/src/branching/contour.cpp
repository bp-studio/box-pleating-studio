
#include "contour.h"

#include <algorithm>

Contour::Contour(const Hierarchy *hierarchy): hierarchy(hierarchy), tree(hierarchy->tree) {
	if(!tree) return;
	const int n = tree->size();
	nodes.reserve(Shared::flap_count);
	leaves.assign(n, {});
	cache.assign(n, 0);
	for(int i = 0; i < Shared::flap_count; i++) {
		const int leaf = tree->index_of(hierarchy->flaps[i].id);
		if(leaf < 0) { // Not expected; disable
			tree = nullptr;
			return;
		}
		nodes.push_back(leaf);
		// Register the flap to all its ancestors except the root (which has no contour)
		for(int node = leaf; tree->parent(node) >= 0; node = tree->parent(node)) {
			leaves[node].push_back({.flap = i, .expansion = tree->dist(leaf) - tree->dist(node)});
		}
	}
}

void Contour::compute(const GridLayout &layout) {
	if(!tree) return;
	sum = 0;
	for(int node = 0; node < tree->size(); node++) {
		cache[node] = count(node, layout);
		sum += cache[node];
	}
}

void Contour::update(const GridLayout &layout, const vector<int> &moved) {
	if(!tree) return;
	vector<bool> done(tree->size(), false);
	for(const int flap: moved) {
		for(int node = nodes[flap]; tree->parent(node) >= 0 && !done[node]; node = tree->parent(node)) {
			done[node] = true;
			const auto value = count(node, layout);
			sum += value - cache[node];
			cache[node] = value;
		}
	}
}

/** Count the vertices of the union of the expanded rectangles of the flaps under the given node. */
int64_t Contour::count(const int node, const GridLayout &layout) const {
	const auto &list = leaves[node];
	if(list.empty()) return 0;

	// Coordinate compression
	struct Rect {
		int x1;
		int y1;
		int x2;
		int y2;
	};
	vector<Rect> rects;
	vector<int> xs;
	vector<int> ys;
	rects.reserve(list.size());
	xs.reserve(list.size() * 2);
	ys.reserve(list.size() * 2);
	for(const auto &[flap, expansion]: list) {
		const auto c = layout.at(flap);
		const auto &f = hierarchy->flaps[flap];
		const Rect r = {.x1 = c.x - expansion, .y1 = c.y - expansion, .x2 = c.x + f.width + expansion, .y2 = c.y + f.height + expansion};
		rects.push_back(r);
		xs.push_back(r.x1);
		xs.push_back(r.x2);
		ys.push_back(r.y1);
		ys.push_back(r.y2);
	}
	sort(xs.begin(), xs.end()); // NOLINT(modernize-use-ranges)
	sort(ys.begin(), ys.end()); // NOLINT(modernize-use-ranges)
	xs.erase(unique(xs.begin(), xs.end()), xs.end()); // NOLINT(modernize-use-ranges)
	ys.erase(unique(ys.begin(), ys.end()), ys.end()); // NOLINT(modernize-use-ranges)
	const int kx = xs.size() - 1; // number of cells in x
	const int ky = ys.size() - 1;
	auto index = [](const vector<int> &v, const int value) {
		return static_cast<int>(lower_bound(v.begin(), v.end(), value) - v.begin()); // NOLINT(modernize-use-ranges)
	};

	// Rasterize using a 2D difference array; cell (i, j) covers [xs[i], xs[i+1]] x [ys[j], ys[j+1]]
	const int stride = ky + 1;
	vector<int> filled((kx + 1) * stride, 0);
	for(const auto &r: rects) {
		const int i1 = index(xs, r.x1), i2 = index(xs, r.x2); // NOLINT(readability-isolate-declaration)
		const int j1 = index(ys, r.y1), j2 = index(ys, r.y2); // NOLINT(readability-isolate-declaration)
		filled[i1 * stride + j1]++;
		filled[i1 * stride + j2]--;
		filled[i2 * stride + j1]--;
		filled[i2 * stride + j2]++;
	}
	for(int i = 0; i < kx; i++) {
		for(int j = 0; j < ky; j++) {
			int v = filled[i * stride + j];
			if(i > 0) v += filled[(i - 1) * stride + j];
			if(j > 0) v += filled[i * stride + j - 1];
			if(i > 0 && j > 0) v -= filled[(i - 1) * stride + j - 1];
			filled[i * stride + j] = v;
		}
	}

	// Count the vertices: a grid point is a vertex if the 2x2 cells around it form a corner
	auto at = [&](const int i, const int j) -> int {
		if(i < 0 || j < 0 || i >= kx || j >= ky) return 0;
		return filled[i * stride + j] > 0 ? 1 : 0;
	};
	int64_t result = 0;
	for(int i = 0; i <= kx; i++) {
		for(int j = 0; j <= ky; j++) {
			const int a = at(i - 1, j - 1), b = at(i, j - 1), c = at(i - 1, j), d = at(i, j); // NOLINT(readability-isolate-declaration)
			const int total = a + b + c + d;
			if(total == 1 || total == 3) result += 1;
			else if(total == 2 && a == d) result += 2; // Two polygons touching at the corner
		}
	}
	return result;
}
