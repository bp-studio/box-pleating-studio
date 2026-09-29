
#include "csp.h"
#include "global/interrupt.h"
#include "grid.h"
#include "math/scale.h"

#include <algorithm>
#include <cmath>
#include <iostream>
#include <numbers>

namespace {

	/**
	 * Maximal window radius. A window of radius r contains at most (2r)^2 grid points,
	 * so that a domain always fits into a 64-bit mask.
	 */
	constexpr int MAX_RADIUS = 4;
	static_assert((2 * MAX_RADIUS) * (2 * MAX_RADIUS) <= MAX_DOMAIN_SIZE);

	/**
	 * Maximal number of search nodes per attempt before giving up.
	 *
	 * Empirically, feasible attempts are solved within ~100 nodes and
	 * infeasible ones are proven within a few thousand nodes,
	 * while the rare undecidable ones remain so even with millions of nodes.
	 * So this is essentially a stop-loss, and increasing it buys nothing.
	 */
	constexpr long NODE_LIMIT = 20000;

	/** Tolerance for treating a continuous coordinate as integral. */
	constexpr double INT_TOLERANCE = 1e-5;

	/** A binary constraint between two variables, with support tables in both directions. */
	struct Arc {
		int i;
		int j;
		vector<Mask> sup_i; // sup_i[a] = mask of D_j values compatible with value a of D_i
		vector<Mask> sup_j; // sup_j[b] = mask of D_i values compatible with value b of D_j
	};

	struct Var {
		double px; // continuous position (in grid units)
		double py;
		vector<Candidate> values; // sorted by closeness to (px, py)
		vector<int> arcs;		  // indices into the arc list
	};

	class Csp {
	  public:
		Csp(const vector<double> &x0, const Hierarchy *hierarchy)
			: x0(x0), hierarchy(hierarchy), sheet(hierarchy->sheet), flaps(hierarchy->flaps), vars(Shared::flap_count) {}

		long nodes = 0;
		bool aborted = false;

		/** Try to find an integral solution of the given sheet size within the given window radius. */
		bool attempt(const int size, const int radius, GridLayout &out) {
			nodes = 0;
			aborted = false;
			reason = "";
			out.size = size;

			setup_positions(size);
			if(!build_domains(size, radius)) return false;
			build_arcs(radius);

			vector<Mask> dom(vars.size());
			vector<int> queue;
			queue.reserve(vars.size());
			for(int i = 0; i < vars.size(); i++) {
				dom[i] = full_mask(vars[i].values.size());
				queue.push_back(i);
			}
			if(!propagate(dom, queue)) {
				reason = "arc consistency (arcs=" + to_string(arcs.size()) + ")";
				return false;
			}

			if(!search(dom)) {
				reason = aborted ? "aborted" : "search exhausted (arcs=" + to_string(arcs.size()) + ")";
				return false;
			}

			for(int i = 0; i < vars.size(); i++) {
				const auto &c = vars[i].values[countr_zero(solution[i])];
				out.grid[i * 2] = c.x;
				out.grid[i * 2 + 1] = c.y;
			}
			// Independently verify the solution against all constraints (including the dropped ones)
			if(!verify_layout(out, hierarchy)) reason = "verification failed";
			return reason.empty();
		}

		string reason;

		/** Best-effort result by naive rounding, used when the process is interrupted. */
		void round(const int size, GridLayout &out) {
			out.size = size;
			setup_positions(size);
			for(int i = 0; i < vars.size(); i++) {
				out.grid[i * 2] = std::round(vars[i].px);
				out.grid[i * 2 + 1] = std::round(vars[i].py);
			}
		}

	  private:
		const vector<double> &x0;
		const Hierarchy *hierarchy;
		const Sheet *sheet;
		const vector<Flap> &flaps;
		vector<Var> vars;
		vector<Arc> arcs;
		vector<Mask> solution;

		static double snap(const double v) {
			auto r = std::round(v);
			return abs(v - r) < INT_TOLERANCE ? r : v;
		}

		/** Scale the continuous solution to the given sheet size, in grid coordinates. */
		void setup_positions(const int size) {
			const auto offset = sheet->offset;
			for(int i = 0; i < vars.size(); i++) {
				vars[i].px = snap((x0[i * 2] - offset) * size);
				vars[i].py = snap((x0[i * 2 + 1] - offset) * size);
			}
		}

		/**
		 * Collect the candidate grid points of each flap within the window
		 * [floor(p) - (radius - 1), ceil(p) + (radius - 1)] on each axis.
		 * Returns false if some flap has no candidate at all.
		 */
		bool build_domains(const int size, const int radius) {
			for(int i = 0; i < vars.size(); i++) {
				auto &var = vars[i];
				auto &values = var.values;
				values.clear();
				const int x_lo = static_cast<int>(floor(var.px)) - (radius - 1);
				const int x_hi = static_cast<int>(ceil(var.px)) + (radius - 1);
				const int y_lo = static_cast<int>(floor(var.py)) - (radius - 1);
				const int y_hi = static_cast<int>(ceil(var.py)) + (radius - 1);
				for(int x = x_lo; x <= x_hi; x++) {
					for(int y = y_lo; y <= y_hi; y++) {
						if(sheet->int_contains(x, y, flaps[i], size)) values.push_back({.x = x, .y = y});
					}
				}
				if(values.empty()) {
					reason = "empty domain for flap " + to_string(flaps[i].id) + " at (" + to_string(var.px) + ", " + to_string(var.py) + ")";
					return false;
				}
				const double px = var.px;
				const double py = var.py;
				auto dist2 = [=](const Candidate &c) { return (c.x - px) * (c.x - px) + (c.y - py) * (c.y - py); };
				// ranges::stable_sort doesn't work with VS Code IntelliSense for some reason
				stable_sort(values.begin(), values.end(), [&](const Candidate &a, const Candidate &b) { // NOLINT(modernize-use-ranges)
					return dist2(a) < dist2(b);
				});
			}
			return true;
		}

		/** Continuous slack of a distance constraint, in grid units. */
		double slack(const int i, const int j, const int dist) const {
			const auto &fi = flaps[i];
			const auto &fj = flaps[j];
			const auto &vi = vars[i];
			const auto &vj = vars[j];
			const double dx = interval_distance(vi.px, static_cast<double>(fi.width), vj.px, static_cast<double>(fj.width));
			const double dy = interval_distance(vi.py, static_cast<double>(fi.height), vj.py, static_cast<double>(fj.height));
			return sqrt(dx * dx + dy * dy) - dist;
		}

		/**
		 * Build the binary constraints. Distance constraints that cannot possibly be violated
		 * within the window are dropped (they are still checked in {@link verify}).
		 */
		void build_arcs(const int radius) {
			arcs.clear();
			for(auto &var: vars) var.arcs.clear();

			// Each point moves less than `radius` on each axis, i.e. less than radius * sqrt(2) in Euclidean distance.
			const double max_change = 2 * radius * numbers::sqrt2;

			for(const auto &[i, j, dist]: hierarchy->dist_map) {
				if(slack(i, j, dist) >= max_change) continue;

				const auto &vi = vars[i].values;
				const auto &vj = vars[j].values;
				Arc arc = {.i = i, .j = j, .sup_i = vector<Mask>(vi.size(), 0), .sup_j = vector<Mask>(vj.size(), 0)};
				bool trivial = true;
				for(int a = 0; a < vi.size(); a++) {
					for(int b = 0; b < vj.size(); b++) {
						if(compatible(flaps[i], vi[a], flaps[j], vj[b], dist)) {
							arc.sup_i[a] |= bit(b);
							arc.sup_j[b] |= bit(a);
						} else {
							trivial = false;
						}
					}
				}
				if(trivial) continue;

				vars[i].arcs.push_back(arcs.size());
				vars[j].arcs.push_back(arcs.size());
				arcs.push_back(std::move(arc));
			}
		}

		/** Remove the values of D_i that have no support in D_j. Returns false if D_i becomes empty. */
		static bool revise(Mask &di, const Mask dj, const vector<Mask> &sup) {
			Mask result = 0;
			for(Mask rest = di; rest; rest &= rest - 1) {
				const int a = countr_zero(rest);
				if(sup[a] & dj) result |= bit(a);
			}
			di = result;
			return result != 0;
		}

		/** AC-3 propagation, starting from the variables in the queue whose domains have changed. */
		bool propagate(vector<Mask> &dom, vector<int> &queue) const {
			while(!queue.empty()) {
				const int j = queue.back();
				queue.pop_back();
				for(const int index: vars[j].arcs) {
					const auto &arc = arcs[index];
					const int i = arc.i == j ? arc.j : arc.i;
					const auto &sup = arc.i == j ? arc.sup_j : arc.sup_i;
					const Mask before = dom[i];
					if(!revise(dom[i], dom[j], sup)) return false;
					if(dom[i] != before) queue.push_back(i);
				}
			}
			return true;
		}

		/** Pick the unassigned variable with the smallest domain (ties broken by degree). Returns -1 if all assigned. */
		int select(const vector<Mask> &dom) const {
			int best = -1;
			int best_size = 0;
			for(int i = 0; i < dom.size(); i++) {
				const int size = popcount(dom[i]);
				if(size <= 1) continue;
				if(best == -1 || size < best_size || (size == best_size && vars[i].arcs.size() > vars[best].arcs.size())) {
					best = i;
					best_size = size;
				}
			}
			return best;
		}

		/** Backtracking search maintaining arc consistency. */
		bool search(vector<Mask> &dom) {
			if(aborted) return false;
			if(++nodes > NODE_LIMIT) {
				aborted = true;
				return false;
			}
			const int v = select(dom);
			if(v == -1) {
				solution = dom;
				return true;
			}
			vector<Mask> copy;
			vector<int> queue;
			for(Mask rest = dom[v]; rest; rest &= rest - 1) {
				copy = dom;
				copy[v] = lowest_bit(rest); // i.e. the closest remaining candidate
				queue.assign(1, v);
				if(propagate(copy, queue) && search(copy)) return true;
				if(aborted) return false;
			}
			return false;
		}

	};

	/**
	 * Report the progress to the UI in the format [size, progress],
	 * where the progress is out of the flap count.
	 * Here we map the window radius onto the progress of the current size.
	 */
	void report(const int size, const int radius) {
		const int progress = Shared::flap_count * radius / MAX_RADIUS;
		cout << R"({"event": "fit", "data": [)" << size << ", " << progress << "]}" << endl;
	}

} // namespace

GridLayout csp_solve_integer(const vector<double> &x0, const Hierarchy *hierarchy) {
	const Sheet *sheet = hierarchy->sheet;
	const int step = sheet->size_step();

	// We also try one step below the ceiling of the continuous solution,
	// as it is occasionally possible to beat the (local) continuous optimum on grids.
	int size = sheet->ceil_size(get_scale(x0)) - step;
	if(size < MIN_SHEET_SIZE) size += step;

	Csp csp(x0, hierarchy);
	GridLayout layout = {.grid = vector<int>(Shared::last)};
	// Enlarging the sheet scales up all the slacks proportionally,
	// so a solution will eventually be found as the size grows.
	for(; size <= MAX_SHEET_SIZE; size += step) {
		for(int radius = 1; radius <= MAX_RADIUS; radius++) {
			report(size, radius - 1);
			const bool ok = csp.attempt(size, radius, layout);
			cout << "CSP: size=" << size << " radius=" << radius << " nodes=" << csp.nodes
				 << (ok ? " solved" : " failed: " + csp.reason) << endl;
			if(ok) {
				report(size, MAX_RADIUS);
				return layout;
			}
			if(check_interrupt()) {
				csp.round(size, layout);
				return layout;
			}
		}
	}

	return {}; // Exceeding the maximal sheet size; this is not expected to happen in practice.
}
