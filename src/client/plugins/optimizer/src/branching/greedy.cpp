
#include "greedy.h"
#include "global/interrupt.h"
#include "math/scale.h"
#include "math/solver.h"

#include <iostream>

double meg(const double x, const double y) {
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
vector<Pt> annulus(const int r, const double cx, const double cy) {
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

vector<double> branch(const int branch_at, int branch_at2, BranchingContext &context, int &depth) { // NOLINT
	vector<vector<double>> children;
	auto p = context.get(branch_at);

	if(branch_at2 >= 0) {
		// In parallel mode, we can handle 2 points at once!
		auto p2 = context.get(branch_at2);

#pragma omp parallel for
		for(int q = 0; q < 16; q++) {
			// This part will likely fail if p and p2 are close,
			// but in all cases we still have our fallback
			auto xk = context.branch(nullptr, p.x, p.y, branch_at, q >> 2);
			if(xk.empty()) continue;
			auto xk2 = context.branch(&xk, p2.x, p2.y, branch_at2, q % 4);
			if(xk2.empty()) continue;

			auto cons = context.generate_constraints(xk2);
			auto sol = pack(context.to_double(xk2), cons, nullptr);
			if(sol.success) {
#pragma omp critical
				{
					children.push_back(sol.x);
				}
			}
		}
		if(children.empty()) { // fallback
			context.fixed[branch_at2] = false;
			branch_at2 = -1;
		}
	}

	if(branch_at2 == -1) {
// Try branching towards the 4 closest grid points.
#pragma omp parallel for
		for(int q = 0; q < 4; q++) {
			auto xk = context.branch(nullptr, p.x, p.y, branch_at, q);
			if(xk.empty()) continue;
			auto cons = context.generate_constraints(xk);
			auto sol = pack(context.to_double(xk), cons, nullptr);
			if(sol.success) {
#pragma omp critical
				{
					children.push_back(sol.x);
				}
			}
		}
	}

	if(!children.empty()) {
		// As a greedy algorithm, we don't do any backtracking.
		// We always navigate only the most promising branch.
		int n = 0;
		for(int i = 1; i < children.size(); i++) {
			if(children[i].back() > children[n].back()) n = i;
		}
		depth += branch_at2 > -1 ? 2 : 1;
		return children[n];
	}

	// In some cases, the flap to be branched could get stuck by fixed flaps,
	// and none of the branch direction works.
	// The best we can do then is to find the closest spot that does work and continue.
	// In this mode we always handle just one point.
	auto rx = round(p.x);
	auto ry = round(p.y);
	int r = 1;
	children.resize(0);
	while(true) {
		auto pts = annulus(r, rx, ry);
		// ranges::sort doesn't work with VS Code IntelliSense for some reason,
		// so we keep using the old-fashioned sort for now.
		sort(pts.begin(), pts.end(), [=](const Pt &a, const Pt &b) {	  // NOLINT
			return meg(a.x - p.x, a.y - p.y) < meg(b.x - p.x, b.y - p.y); // sorted by the distance to the original point
		});
		const int size = pts.size();

#pragma omp parallel for
		for(int i = 0; i < size; i++) {
			if(!children.empty()) continue;
			auto &pt = pts[i];
			auto xk = context.make_xk(nullptr, pt.x, pt.y, branch_at);
			if(xk.empty()) continue;
			auto cons = context.generate_constraints(xk);
			auto sol = pack(context.to_double(xk), cons, nullptr);
			if(sol.success) {
#pragma omp critical
				{
					cout << "Fallback [" << pt.x << ", " << pt.y << "]" << endl;
#ifdef __EMSCRIPTEN_PTHREADS__
					children.push_back(sol.x);
#else
					depth++;
					return sol.x;
#endif
				}
			}
		}
#ifdef __EMSCRIPTEN_PTHREADS__
		if(!children.empty()) {
			depth++;
			return children[0];
		}
#endif
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
		int branch_at2 = -1;
#ifdef __EMSCRIPTEN_PTHREADS__
		if(depth < Shared::flap_count - 1) {
			branch_at2 = select_meg(context);
			context.fixed[branch_at2] = true;
		}
#endif
		context.solution = context.to_grid(branch(branch_at, branch_at2, context, depth));

		if(check_interrupt()) break;
	}
	cout << R"({"event": "fit", "data": [)" << int_scale(context.solution.back()) << ", " << depth << "]}" << endl;
	return context.output();
}
