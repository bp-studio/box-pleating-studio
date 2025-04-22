
#include "greedy.h"
#include "global/interrupt.h"
#include "math/scale.h"
#include "math/solver.h"

#include <iostream>

double meg(double x, double y) {
	return sqrt(x * x + y * y);
}

int select_meg(const BranchingContext &context) {
	auto min_meg = 2 * context.solution.back();
	int min_n = 0;
	for(int n = 0; n < Shared::flap_count; n++) {
		if(context.fixed[n]) continue;
		auto m = meg(context.solution[n * 2], context.solution[n * 2 + 1]);
		if(m < min_meg) {
			min_meg = m;
			min_n = n;
		}
	}
	return min_n;
}

/** Returns all grid points of distance [r, r+1) from the given center (cx, cy). */
vector<Pt> annulus(int r, double cx, double cy) {
	vector<Pt> result;
	for(int x = -r; x <= r; x++) {
		int low = ceil(sqrt(r * r - x * x));
		int high = ceil(sqrt((r + 1) * (r + 1) - x * x));
		for(int y = low; y < high; y++) {
			result.emplace_back(cx + x, cy + y);
			if(y > 0) result.emplace_back(cx + x, cy - y);
		}
	}
	return result;
}

vector<double> branch(int branch_at, const BranchingContext &context) {
	vector<vector<double>> children;
	auto [x, y] = context.get(branch_at);

	// Try branching towards the 4 closest grid points.
	for(int q = 0; q < 4; q++) {
		auto xk = context.branch(x, y, branch_at, q);
		if(xk.empty()) continue;
		auto cons = context.generate_constraints(xk);
		auto sol = pack(context.to_double(xk), cons, nullptr);
		if(sol.success) {
			children.push_back(sol.x);
		}
	}
	if(!children.empty()) {
		// As a greedy algorithm, we don't do any backtracking.
		// We always navigate only the most promising branch.
		int n = 0;
		for(int i = 1; i < children.size(); i++) {
			if(children[i].back() > children[n].back()) n = i;
		}
		return children[n];
	}

	// In some cases, the flap to be branched could get stuck by fixed flaps,
	// and none of the branch direction works.
	// The best we can do then is to find the closest spot that does work and continue.
	auto rx = round(x);
	auto ry = round(y);
	int r = 1;
	while(true) {
		auto pts = annulus(r, rx, ry);
		// ranges::sort doesn't work with VS Code IntelliSense for some reason,
		// so we keep using the old-fashioned sort for now.
		sort(pts.begin(), pts.end(), [=](const Pt &a, const Pt &b) { // NOLINT
			return meg(a.x - x, a.y - y) < meg(b.x - x, b.y - y);	 // sorted by the distance to the original point
		});
		for(auto &pt: pts) {
			auto xk = context.make_xk(pt.x, pt.y, branch_at);
			if(xk.empty()) continue;
			auto cons = context.generate_constraints(xk);
			auto sol = pack(context.to_double(xk), cons, nullptr);
			if(sol.success) {
				cout << "Fallback [" << pt.x << ", " << pt.y << "]" << endl;
				return sol.x;
			}
		}
		r++;
	}
}

vector<int> greedy_solve_integer(const vector<double> &x0, Hierarchy *hierarchy) {
	BranchingContext context(x0, hierarchy);
	int depth = 0;
	while(depth < Shared::flap_count) {
		cout << R"({"event": "fit", "data": [)" << int_scale(context.solution.back()) << ", " << depth << "]}" << endl;
		const int branch_at = select_meg(context);
		context.fixed[branch_at] = true;
		context.solution = context.to_grid(branch(branch_at, context));
		depth++;

		if(check_interrupt()) break;
	}
	cout << R"({"event": "fit", "data": [)" << int_scale(context.solution.back()) << ", " << depth << "]}" << endl;
	return context.output();
}
