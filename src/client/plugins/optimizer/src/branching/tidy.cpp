
#include "tidy.h"
#include "contour.h"
#include "covering.h"

#include <algorithm>
#include <array>
#include <cmath>
#include <compare>
#include <iostream>
#include <optional>
#include <tuple>

namespace {

	/** Window radius of each flap in a neighborhood; the window has (2r+1)^2 points. */
	constexpr int RADIUS = 3;
	static_assert((2 * RADIUS + 1) * (2 * RADIUS + 1) <= MAX_DOMAIN_SIZE);

	/** Maximal number of flaps in a neighborhood. */
	constexpr int GROUP_SIZE = 6;

	/** Maximal number of search nodes for one neighborhood. */
	constexpr long NODE_LIMIT = 20000;

	/** Maximal number of LNS passes over all junctions in a round. */
	constexpr int MAX_PASSES = 30;

	/** Maximal number of rounds (LNS passes followed by a swap pass). */
	constexpr int MAX_ROUNDS = 10;

	/** The scale of the primary term over the secondary term in the proxy objective. */
	constexpr int64_t PROXY_SCALE = 1 << 16;

	/**
	 * The actual objective, compared lexicographically:
	 * first the total number of vertices of the rough contours, then the total area of the uncovered junctions.
	 */
	struct Score {
		int64_t area;
		int64_t vertices;

		auto operator<=>(const Score &that) const {
			return tie(vertices, area) <=> tie(that.vertices, that.area);
		}
		bool operator==(const Score &) const = default;
	};

	ostream &operator<<(ostream &os, const Score &s) {
		return os << "(uncovered area " << s.area << ", contour vertices " << s.vertices << ")";
	}

	struct Box {
		int x1;
		int y1;
		int x2;
		int y2;
	};

	Box bounding_box(const vector<Candidate> &values) {
		Box box = {.x1 = values[0].x, .y1 = values[0].y, .x2 = values[0].x, .y2 = values[0].y};
		for(const auto &c: values) {
			box.x1 = min(box.x1, c.x);
			box.y1 = min(box.y1, c.y);
			box.x2 = max(box.x2, c.x);
			box.y2 = max(box.y2, c.y);
		}
		return box;
	}

	/** A pair of flaps serving as the seed of a neighborhood (an uncovered junction, or a misaligned adjacent pair). */
	struct Seed {
		int i;
		int j;
		int dist;
		int64_t priority;
	};

	/** A flap in the neighborhood being re-arranged. */
	struct Var {
		int flap;
		int current;			  // index of the current location in `values`
		vector<Candidate> values; // candidate locations
		vector<int64_t> unary;	  // unary[a] = total (weighted) junction area between candidate a and the fixed flaps
		vector<int> arcs;		  // indices into the arc list
	};

	/** The interaction between two flaps in the neighborhood. */
	struct Arc {
		int i;
		int j;
		vector<Mask> sup_i; // sup_i[a] = mask of D_j values compatible with value a of D_i
		vector<Mask> sup_j; // sup_j[b] = mask of D_i values compatible with value b of D_j
		vector<int64_t> cost; // cost[a * |D_j| + b] = (weighted) junction area between candidate a of i and candidate b of j
		int nj;				  // |D_j|
		int64_t min_cost;	  // minimal cost among all compatible pairs of candidates, for bounding

		int64_t at(const int a, const int b) const { return cost[a * nj + b]; }
	};

	/**
	 * Neither part of the objective is decomposable into pairs
	 * (the contours are unions, and whether a junction is covered depends on the other junctions).
	 * So for each neighborhood, we optimize a decomposable *proxy* instead:
	 * the number of lines occupied by the pairwise contour vertices (see `pair_lines`) as the primary term,
	 * plus the junction area weighted by the covering of the current layout (0 for covered junctions, 1 otherwise),
	 * and then accept the result only if the actual objective improves.
	 */
	class Tidy {
	  public:
		Tidy(GridLayout &layout, const Hierarchy *hierarchy)
			: layout(layout), hierarchy(hierarchy), sheet(hierarchy->sheet), flaps(hierarchy->flaps),
			  adj(Shared::flap_count), covering(hierarchy), contour(hierarchy),
			  weight(Shared::flap_count * Shared::flap_count, 1), expansion(Shared::flap_count * Shared::flap_count, 0) {
			const int n = Shared::flap_count;
			const Tree *tree = hierarchy->tree;
			for(const auto &[i, j, dist]: hierarchy->dist_map) {
				adj[i].push_back({.flap = j, .dist = dist});
				adj[j].push_back({.flap = i, .dist = dist});
				if(tree) {
					const int ni = tree->index_of(flaps[i].id);
					const int nj = tree->index_of(flaps[j].id);
					if(ni < 0 || nj < 0) continue;
					const int lca = tree->dist(tree->lca(ni, nj));
					expansion[i * n + j] = tree->dist(ni) - lca;
					expansion[j * n + i] = tree->dist(nj) - lca;
				} else {
					// Without the tree, fall back to splitting the distance evenly
					expansion[i * n + j] = expansion[j * n + i] = dist / 2;
				}
			}
		}

		void run() {
			initial = objective(nullptr);
			cout << "Tidy: initial junction area " << total_area() << " " << initial << ", " << mobility_summary() << endl;
			report(initial);

			// The search is quite sensitive to the path taken, and neither proxy dominates the other,
			// so we simply run both from the initial layout and keep the better result.
			const GridLayout start = layout;
			Score best_score = initial;
			GridLayout best_layout = layout;
			for(const bool use_covering: {true, false}) {
				layout = start;
				objective(nullptr);
				const auto result = optimize(use_covering);
				if(result < best_score) {
					best_score = result;
					best_layout = layout;
				}
			}
			layout = std::move(best_layout);
			report(best_score);
		}

	  private:
		/**
		 * Run the LNS with the given proxy until no improvement can be made,
		 * then try swapping flaps to escape the local optimum, and repeat.
		 * Returns the resulting objective.
		 */
		Score optimize(const bool use_covering) {
			const char *name = use_covering ? "covering" : "plain";
			Score current = objective(nullptr);
			for(int round = 1; round <= MAX_ROUNDS; round++) {
				for(int pass = 1; pass <= MAX_PASSES; pass++) {
					const int improved = lns_pass(current, use_covering);
					cout << "Tidy: " << name << " proxy, round " << round << " pass " << pass << " improved " << improved
						 << " neighborhoods, junction area " << total_area() << " " << current << endl;
					if(improved == 0) break;
				}
				const int moved = single_pass(current);
				cout << "Tidy: " << name << " proxy, round " << round << " moved " << moved
					 << " single flaps, junction area " << total_area() << " " << current << endl;
				const int swapped = swap_pass(current, use_covering);
				cout << "Tidy: " << name << " proxy, round " << round << " accepted " << swapped
					 << " swaps, junction area " << total_area() << " " << current << endl;
				if(moved == 0 && swapped == 0) break;
			}
			return current;
		}

		/**
		 * One pass over all flaps, moving each single flap to the best feasible location within its window
		 * in terms of the actual objective (evaluated directly, without the proxy).
		 * This covers the cases where the proxy gives no guidance at all.
		 * Returns the number of flaps moved.
		 */
		int single_pass(Score &current) {
			int moved = 0;
			for(int i = 0; i < Shared::flap_count; i++) {
				const auto p = layout.at(i);
				Candidate best_location = p;
				Score best_score = current;
				const vector<int> flap = {i};
				for(int x = p.x - RADIUS; x <= p.x + RADIUS; x++) {
					for(int y = p.y - RADIUS; y <= p.y + RADIUS; y++) {
						const Candidate c = {.x = x, .y = y};
						if((x == p.x && y == p.y) || !feasible(i, c)) continue;
						layout.grid[i * 2] = x;
						layout.grid[i * 2 + 1] = y;
						const auto score = objective(&flap);
						if(score < best_score) {
							best_score = score;
							best_location = c;
						}
					}
				}
				layout.grid[i * 2] = best_location.x;
				layout.grid[i * 2 + 1] = best_location.y;
				current = objective(&flap); // Also restores the cached states
				if(best_location.x != p.x || best_location.y != p.y) {
					moved++;
					report(current);
				}
			}
			return moved;
		}

		/** One pass of the LNS over all the seeds. Returns the number of improvements. */
		int lns_pass(Score &current, const bool use_covering) {
			int improved = 0;
			for(const auto &seed: list_seeds()) {
				// The seed might have been resolved by earlier moves in this pass
				if(seed_priority(seed.i, seed.j, seed.dist) == 0) continue;
				const auto result = improve(make_group(seed), current, use_covering, nullptr);
				if(result < current) {
					improved++;
					current = result;
					report(current);
				}
			}
			return improved;
		}

		/**
		 * One pass of swapping: for each seed, try swapping each pair of flaps in its group
		 * (which is generally infeasible), and repair the arrangement around them.
		 * Returns the number of accepted swaps.
		 */
		int swap_pass(Score &current, const bool use_covering) {
			int swapped = 0;
			for(const auto &seed: list_seeds()) {
				if(seed_priority(seed.i, seed.j, seed.dist) == 0) continue;
				const auto group = make_group(seed);
				for(int u = 0; u < group.size(); u++) {
					for(int v = u + 1; v < group.size(); v++) {
						if(exchangeable(group[u], group[v])) continue;
						const auto result = try_swap(group[u], group[v], current, use_covering);
						if(result < current) {
							swapped++;
							current = result;
							report(current);
						}
					}
				}
			}
			return swapped;
		}

		/** Whether swapping the two flaps makes no difference at all (same dimensions and same distances to all other flaps). */
		bool exchangeable(const int i, const int j) const {
			if(flaps[i].width != flaps[j].width || flaps[i].height != flaps[j].height) return false;
			vector<int> di(Shared::flap_count, 0);
			for(const auto &[k, dist]: adj[i]) di[k] = dist;
			for(const auto &[k, dist]: adj[j]) {
				if(k != i && di[k] != dist) return false;
			}
			return true;
		}

		/** Swap the locations of the two flaps (aligning their centers), and repair the arrangement around them. */
		Score try_swap(const int i, const int j, const Score current, const bool use_covering) {
			const auto pi = layout.at(i);
			const auto pj = layout.at(j);
			const auto &fi = flaps[i];
			const auto &fj = flaps[j];
			vector<Candidate> kick = {
				{.x = pj.x + (fj.width - fi.width) / 2, .y = pj.y + (fj.height - fi.height) / 2},
				{.x = pi.x + (fi.width - fj.width) / 2, .y = pi.y + (fi.height - fj.height) / 2},
			};
			vector<int> group = {i, j};
			extend_group(group, kick);
			return improve(group, current, use_covering, &kick);
		}

		struct Neighbor {
			int flap;
			int dist;
		};

		Score initial = {};

		GridLayout &layout;
		const Hierarchy *hierarchy;
		const Sheet *sheet;
		const vector<Flap> &flaps;
		vector<vector<Neighbor>> adj;
		Covering covering;
		Contour contour;
		vector<int> weight;	   // weight[i * n + j] = 0 if the junction between i and j is currently covered, 1 otherwise
		vector<int> expansion; // expansion[i * n + j] = tree distance from flap i to the LCA of flaps i and j

		// Neighborhood being solved
		vector<Var> vars;
		vector<Arc> arcs;
		long nodes = 0;
		int64_t best = 0;
		vector<int> best_values;

		/////////////////////////////////////////////////////////////////////////////////////////////////////
		// Evaluation
		/////////////////////////////////////////////////////////////////////////////////////////////////////

		int64_t pair_area(const int i, const int j, const int dist) const {
			return junction_area(flaps[i], layout.at(i), flaps[j], layout.at(j), dist);
		}

		int64_t total_area() const {
			int64_t result = 0;
			for(const auto &[i, j, dist]: hierarchy->dist_map) result += pair_area(i, j, dist);
			return result;
		}

		/**
		 * The actual objective. If `moved` is given, only the contours affected by those flaps are recomputed;
		 * otherwise everything is recomputed.
		 */
		Score objective(const vector<int> *moved) {
			covering.compute(layout);
			if(moved) contour.update(layout, *moved);
			else contour.compute(layout);
			return {.area = covering.uncovered_area(), .vertices = contour.total()};
		}

		/** Set up the weights of the proxy objective: either the frozen covering of the current layout, or none. */
		void setup_weights(const bool use_covering) {
			fill(weight.begin(), weight.end(), 1); // NOLINT(modernize-use-ranges)
			if(!use_covering) return;
			for(const auto &j: covering.junctions()) {
				if(j.covered) weight[j.a * Shared::flap_count + j.b] = weight[j.b * Shared::flap_count + j.a] = 0;
			}
		}

		/**
		 * The misalignment between two flaps at the given locations: for adjacent flaps
		 * (whose ranges overlap in one axis), the smaller of the differences of the edges in the other axis.
		 * Used for prioritizing the seeds of the neighborhoods.
		 */
		int64_t misalignment(const int i, const Candidate &a, const int j, const Candidate &b) const {
			const auto &fi = flaps[i];
			const auto &fj = flaps[j];
			const bool x_overlap = a.x < b.x + fj.width && b.x < a.x + fi.width;
			const bool y_overlap = a.y < b.y + fj.height && b.y < a.y + fi.height;
			if(x_overlap == y_overlap) return 0; // Diagonal, or overlapping (not expected)
			if(x_overlap) return min(abs(a.x - b.x), abs(a.x + fi.width - b.x - fj.width));
			return min(abs(a.y - b.y), abs(a.y + fi.height - b.y - fj.height));
		}

		/**
		 * The pairwise version of the contour vertices, serving as a decomposable proxy of them:
		 * expand the rectangles of the two flaps to their LCA (so that they are pieces of the same rough contour),
		 * and count the distinct vertical and horizontal lines occupied by the vertices of their union,
		 * minus 4 (so that it is 0 when the two merge into a single rectangle, and at most 4).
		 *
		 * Counting the lines instead of the vertices themselves rewards rectangles that are touching
		 * or have collinear edges, even when the union has as many vertices as if they were apart.
		 */
		int64_t pair_lines(const int i, const Candidate &a, const int j, const Candidate &b) const {
			const int ei = expansion[i * Shared::flap_count + j];
			const int ej = expansion[j * Shared::flap_count + i];
			const int ax1 = a.x - ei, ax2 = a.x + flaps[i].width + ei, ay1 = a.y - ei, ay2 = a.y + flaps[i].height + ei; // NOLINT(readability-isolate-declaration)
			const int bx1 = b.x - ej, bx2 = b.x + flaps[j].width + ej, by1 = b.y - ej, by2 = b.y + flaps[j].height + ej; // NOLINT(readability-isolate-declaration)

			// The compressed grid of the two rectangles (at most 3x3 cells)
			array<int, 4> xs = {ax1, ax2, bx1, bx2};
			array<int, 4> ys = {ay1, ay2, by1, by2};
			sort(xs.begin(), xs.end()); // NOLINT(modernize-use-ranges)
			sort(ys.begin(), ys.end()); // NOLINT(modernize-use-ranges)
			const int kx = unique(xs.begin(), xs.end()) - xs.begin() - 1; // NOLINT(modernize-use-ranges)
			const int ky = unique(ys.begin(), ys.end()) - ys.begin() - 1; // NOLINT(modernize-use-ranges)

			// Apart: every distinct coordinate is a line
			if(ax2 < bx1 || bx2 < ax1 || ay2 < by1 || by2 < ay1) return kx + ky - 2;

			auto filled = [&](const int p, const int q) -> int {
				if(p < 0 || q < 0 || p >= kx || q >= ky) return 0;
				const int x = xs[p], y = ys[q]; // NOLINT(readability-isolate-declaration)
				const bool in_a = x >= ax1 && x < ax2 && y >= ay1 && y < ay2;
				const bool in_b = x >= bx1 && x < bx2 && y >= by1 && y < by2;
				return in_a || in_b ? 1 : 0;
			};
			array<bool, 4> used_x = {}, used_y = {}; // NOLINT(readability-isolate-declaration)
			for(int p = 0; p <= kx; p++) {
				for(int q = 0; q <= ky; q++) {
					const int c1 = filled(p - 1, q - 1), c2 = filled(p, q - 1), c3 = filled(p - 1, q), c4 = filled(p, q); // NOLINT(readability-isolate-declaration)
					const int total = c1 + c2 + c3 + c4;
					if(total == 1 || total == 3 || (total == 2 && c1 == c4)) used_x[p] = used_y[q] = true; // A corner
				}
			}
			int64_t result = -4;
			for(int k = 0; k < 4; k++) result += (used_x[k] ? 1 : 0) + (used_y[k] ? 1 : 0);
			return result;
		}

		/** The proxy cost of a pair of flaps at the given locations. */
		int64_t proxy_cost(const int i, const Candidate &a, const int j, const Candidate &b, const int dist) const {
			const int64_t area = weight[i * Shared::flap_count + j] * junction_area(flaps[i], a, flaps[j], b, dist);
			return pair_lines(i, a, j, b) * PROXY_SCALE + area;
		}

		/** The priority of a pair as a seed: the (uncovered) junction area, or the misalignment (for adjacent pairs). */
		int64_t seed_priority(const int i, const int j, const int dist) const {
			const auto a = layout.at(i);
			const auto b = layout.at(j);
			const auto area = weight[i * Shared::flap_count + j] * junction_area(flaps[i], a, flaps[j], b, dist);
			return area > 0 ? area * PROXY_SCALE : misalignment(i, a, j, b);
		}

		/**
		 * List the seeds of the neighborhoods: the uncovered junctions (largest first),
		 * followed by the misaligned adjacent pairs (most misaligned first).
		 */
		vector<Seed> list_seeds() {
			setup_weights(true); // For seed_priority
			vector<Seed> result;
			for(const auto &[i, j, dist]: hierarchy->dist_map) {
				const auto priority = seed_priority(i, j, dist);
				if(priority > 0) result.push_back({.i = i, .j = j, .dist = dist, .priority = priority});
			}
			stable_sort(result.begin(), result.end(), [](const Seed &a, const Seed &b) { // NOLINT(modernize-use-ranges)
				return a.priority > b.priority;
			});
			return result;
		}

		/** Whether the given location is valid for flap i, with all other flaps staying put. */
		bool feasible(const int i, const Candidate &c) const {
			for(const auto &[j, dist]: adj[i]) {
				if(!compatible(flaps[i], c, flaps[j], layout.at(j), dist)) return false;
			}
			return sheet->int_contains(c.x, c.y, flaps[i], layout.size);
		}

		/** Number of the four unit moves that flap i can make with all other flaps staying put. */
		int mobility(const int i) const {
			const auto c = layout.at(i);
			int result = 0;
			for(const auto &m: {Candidate{.x = c.x + 1, .y = c.y}, Candidate{.x = c.x - 1, .y = c.y}, Candidate{.x = c.x, .y = c.y + 1}, Candidate{.x = c.x, .y = c.y - 1}}) {
				if(feasible(i, m)) result++;
			}
			return result;
		}

		string mobility_summary() const {
			int stuck = 0;
			for(int i = 0; i < Shared::flap_count; i++) {
				if(mobility(i) == 0) stuck++;
			}
			return to_string(stuck) + " of " + to_string(Shared::flap_count) + " flaps are stuck";
		}

		/////////////////////////////////////////////////////////////////////////////////////////////////////
		// Neighborhood
		/////////////////////////////////////////////////////////////////////////////////////////////////////

		/**
		 * Whether flap j (staying put) could interact with flap i located at `a`
		 * (either by the distance constraint or by forming a junction) when i moves within its window.
		 */
		bool interacts(const int i, const Candidate &a, const int j, const int dist) const {
			const auto b = layout.at(j);
			const int margin = dist + RADIUS + 1;
			return abs(interval_distance(a.x, flaps[i].width, b.x, flaps[j].width)) < margin &&
				abs(interval_distance(a.y, flaps[i].height, b.y, flaps[j].height)) < margin;
		}

		/** Form the group of flaps to re-arrange around the given junction. */
		vector<int> make_group(const Seed &seed) const {
			vector<int> group = {seed.i, seed.j};
			extend_group(group, {layout.at(seed.i), layout.at(seed.j)});
			return group;
		}

		/**
		 * Extend the group of seed flaps (located at the given centers) by the flaps interacting with them,
		 * ranked by the junction area with them (descending), then by slack (ascending; tight ones block moves).
		 */
		void extend_group(vector<int> &group, const vector<Candidate> &centers) const {
			struct Ranked {
				int flap;
				int64_t area;
				double slack;
			};
			vector<Ranked> ranked;
			for(int s = 0; s < group.size(); s++) {
				const int seed = group[s];
				const auto &a = centers[s];
				for(const auto &[k, dist]: adj[seed]) {
					if(find(group.begin(), group.end(), k) != group.end()) continue; // NOLINT(modernize-use-ranges)
					if(!interacts(seed, a, k, dist)) continue;
					const auto b = layout.at(k);
					const double dx = interval_distance(a.x, flaps[seed].width, b.x, flaps[k].width);
					const double dy = interval_distance(a.y, flaps[seed].height, b.y, flaps[k].height);
					const auto area = junction_area(flaps[seed], a, flaps[k], b, dist);
					ranked.push_back({.flap = k, .area = area, .slack = sqrt(dx * dx + dy * dy) - dist});
				}
			}
			stable_sort(ranked.begin(), ranked.end(), [](const Ranked &a, const Ranked &b) { // NOLINT(modernize-use-ranges)
				return a.area != b.area ? a.area > b.area : a.slack < b.slack;
			});
			for(const auto &r: ranked) {
				if(group.size() >= GROUP_SIZE) break;
				if(find(group.begin(), group.end(), r.flap) == group.end()) group.push_back(r.flap); // NOLINT(modernize-use-ranges)
			}
		}

		/**
		 * Re-arrange the given group of flaps optimally in terms of the proxy (with the others fixed),
		 * and keep the result only if the actual objective improves from the given value.
		 * Returns the resulting objective.
		 *
		 * If `kick` is given, the windows of the first few flaps of the group are centered at the given
		 * locations instead of their current ones (and the current arrangement is not the incumbent).
		 */
		Score improve(const vector<int> &group, const Score current, const bool use_covering, const vector<Candidate> *kick) {
			vector<bool> in_group(Shared::flap_count, false);
			for(const int i: group) in_group[i] = true;

			setup_weights(use_covering);
			build_vars(group, in_group, kick);
			build_arcs();

			// The current arrangement is the incumbent, if it is among the candidates
			vector<int> values(vars.size());
			bool has_incumbent = true;
			for(int v = 0; v < vars.size(); v++) {
				values[v] = vars[v].current;
				if(values[v] < 0) has_incumbent = false;
			}
			best = has_incumbent ? evaluate(values) : INT64_MAX;
			best_values = values;
			if(best == 0) return current;

			vector<Mask> dom(vars.size());
			for(int v = 0; v < vars.size(); v++) {
				if(vars[v].values.empty()) return current; // No feasible location at all
				dom[v] = full_mask(vars[v].values.size());
			}
			fill(values.begin(), values.end(), -1); // NOLINT(modernize-use-ranges)
			nodes = 0;
			search(dom, values, 0);
			if(best == INT64_MAX) return current; // No feasible arrangement found

			bool changed = false;
			for(int v = 0; v < vars.size(); v++) {
				if(best_values[v] != vars[v].current) changed = true;
			}
			if(!changed) return current;

			const GridLayout backup = layout;
			apply(best_values);
			const Score result = objective(&group);
			if(result < current) return result;

			// The proxy is only a proxy; revert if the actual objective doesn't improve
			layout = backup;
			objective(&group); // Restore the covering state and the contours
			return current;
		}

		void apply(const vector<int> &values) {
			for(int v = 0; v < vars.size(); v++) {
				const auto &c = vars[v].values[values[v]];
				layout.grid[vars[v].flap * 2] = c.x;
				layout.grid[vars[v].flap * 2 + 1] = c.y;
			}
		}

		/** Total cost (junction area involving the group) of a complete assignment. */
		int64_t evaluate(const vector<int> &values) const {
			int64_t result = 0;
			for(int v = 0; v < vars.size(); v++) result += vars[v].unary[values[v]];
			for(const auto &arc: arcs) result += arc.at(values[arc.i], values[arc.j]);
			return result;
		}

		void build_vars(const vector<int> &group, const vector<bool> &in_group, const vector<Candidate> *kick) {
			vars.clear();
			for(int s = 0; s < group.size(); s++) {
				const int i = group[s];
				const auto center = kick && s < kick->size() ? (*kick)[s] : layout.at(i);
				vars.push_back(make_var(i, center, in_group));
			}
		}

		/** Collect the candidate locations of flap i within the window around the given center, along with their unary costs. */
		Var make_var(const int i, const Candidate &center, const vector<bool> &in_group) const {
			Var var = {.flap = i, .current = -1};
			const auto p = layout.at(i);

			// The fixed flaps that could interact with i
			vector<Neighbor> fixed;
			for(const auto &nb: adj[i]) {
				if(!in_group[nb.flap] && interacts(i, center, nb.flap, nb.dist)) fixed.push_back(nb);
			}

			for(int x = center.x - RADIUS; x <= center.x + RADIUS; x++) {
				for(int y = center.y - RADIUS; y <= center.y + RADIUS; y++) {
					const Candidate c = {.x = x, .y = y};
					if(!sheet->int_contains(x, y, flaps[i], layout.size)) continue;
					const auto unary = unary_cost(i, c, fixed);
					if(unary < 0) continue;
					if(x == p.x && y == p.y) var.current = var.values.size();
					var.values.push_back(c);
					var.unary.push_back(unary);
				}
			}
			return var;
		}

		/**
		 * Total junction area between flap i at location c and the given fixed flaps,
		 * or -1 if the location violates the distance constraint with any of them.
		 */
		int64_t unary_cost(const int i, const Candidate &c, const vector<Neighbor> &fixed) const {
			int64_t result = 0;
			for(const auto &[j, dist]: fixed) {
				const auto q = layout.at(j);
				if(!compatible(flaps[i], c, flaps[j], q, dist)) return -1;
				result += proxy_cost(i, c, j, q, dist);
			}
			return result;
		}

		void build_arcs() {
			arcs.clear();
			for(int v = 0; v < vars.size(); v++) {
				for(int w = v + 1; w < vars.size(); w++) {
					auto arc = make_arc(v, w);
					if(!arc) continue;
					vars[v].arcs.push_back(arcs.size());
					vars[w].arcs.push_back(arcs.size());
					arcs.push_back(std::move(*arc));
				}
			}
		}

		/** The tree distance between two flaps. */
		int distance(const int i, const int j) const {
			for(const auto &nb: adj[i]) {
				if(nb.flap == j) return nb.dist;
			}
			return -1; // Not expected
		}

		/**
		 * Build the arc between vars v and w, with the support tables and the cost table.
		 * Returns nothing if the two can neither conflict nor form a junction within their windows.
		 */
		optional<Arc> make_arc(const int v, const int w) const {
			const int i = vars[v].flap;
			const int j = vars[w].flap;
			const int dist = distance(i, j);
			if(dist < 0) return nullopt;

			const auto &vi = vars[v].values;
			const auto &vj = vars[w].values;
			Arc arc = {
				.i = v,
				.j = w,
				.sup_i = vector<Mask>(vi.size(), 0),
				.sup_j = vector<Mask>(vj.size(), 0),
				.cost = vector<int64_t>(vi.size() * vj.size(), 0),
				.nj = static_cast<int>(vj.size()),
			};
			// Both the compatibility and the cost depend only on the relative offset of the two candidates,
			// and there are far fewer distinct offsets than pairs of candidates, so we memoize by offset
			// (in a flat table covering the range of all possible offsets).
			struct Entry {
				bool known = false;
				bool compatible = false;
				int64_t cost = 0;
			};
			const auto [ai, aj] = make_pair(bounding_box(vi), bounding_box(vj));
			const int dx0 = aj.x1 - ai.x2, dx1 = aj.x2 - ai.x1; // NOLINT(readability-isolate-declaration)
			const int dy0 = aj.y1 - ai.y2, dy1 = aj.y2 - ai.y1; // NOLINT(readability-isolate-declaration)
			const int stride = dy1 - dy0 + 1;
			vector<Entry> memo((dx1 - dx0 + 1) * stride);
			auto lookup = [&](const Candidate &a, const Candidate &b) -> const Entry & {
				auto &entry = memo[(b.x - a.x - dx0) * stride + (b.y - a.y - dy0)];
				if(!entry.known) {
					entry.known = true;
					entry.compatible = compatible(flaps[i], a, flaps[j], b, dist);
					if(entry.compatible) entry.cost = proxy_cost(i, a, j, b, dist);
				}
				return entry;
			};

			bool trivial = true;
			int64_t min_cost = -1;
			for(int a = 0; a < vi.size(); a++) {
				for(int b = 0; b < vj.size(); b++) {
					const auto &entry = lookup(vi[a], vj[b]);
					if(!entry.compatible) {
						trivial = false;
						continue;
					}
					arc.sup_i[a] |= bit(b);
					arc.sup_j[b] |= bit(a);
					arc.cost[a * arc.nj + b] = entry.cost;
					if(entry.cost > 0) trivial = false;
					if(min_cost < 0 || entry.cost < min_cost) min_cost = entry.cost;
				}
			}
			if(trivial) return nullopt;
			arc.min_cost = max<int64_t>(min_cost, 0);
			return arc;
		}

		/////////////////////////////////////////////////////////////////////////////////////////////////////
		// Branch-and-bound
		/////////////////////////////////////////////////////////////////////////////////////////////////////

		static bool revise(Mask &di, const Mask dj, const vector<Mask> &sup) {
			Mask result = 0;
			for(Mask rest = di; rest; rest &= rest - 1) {
				const int a = countr_zero(rest);
				if(sup[a] & dj) result |= bit(a);
			}
			di = result;
			return result != 0;
		}

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

		/** The minimal cost of assigning candidate a to var v, given the currently assigned vars. */
		int64_t marginal(const int v, const int a, const vector<int> &values) const {
			int64_t result = vars[v].unary[a];
			for(const int index: vars[v].arcs) {
				const auto &arc = arcs[index];
				const int w = arc.i == v ? arc.j : arc.i;
				if(values[w] < 0) continue;
				result += arc.i == v ? arc.at(a, values[w]) : arc.at(values[w], a);
			}
			return result;
		}

		/** Lower bound of the total cost, given the current partial assignment. */
		int64_t lower_bound(const vector<Mask> &dom, const vector<int> &values, const int64_t cost) const {
			int64_t result = cost;
			for(int v = 0; v < vars.size(); v++) {
				if(values[v] >= 0) continue;
				int64_t min_cost = -1;
				for(Mask rest = dom[v]; rest; rest &= rest - 1) {
					const auto c = marginal(v, countr_zero(rest), values);
					if(min_cost < 0 || c < min_cost) min_cost = c;
				}
				result += min_cost;
			}
			// The costs between pairs of unassigned vars are not counted above
			for(const auto &arc: arcs) {
				if(values[arc.i] < 0 && values[arc.j] < 0) result += arc.min_cost;
			}
			return result;
		}

		void search(const vector<Mask> &dom, vector<int> &values, const int64_t cost) {
			if(nodes > NODE_LIMIT) return;
			nodes++;

			// Pick the unassigned var with the smallest domain
			int v = -1;
			for(int u = 0; u < vars.size(); u++) {
				if(values[u] >= 0) continue;
				if(v == -1 || popcount(dom[u]) < popcount(dom[v])) v = u;
			}
			if(v == -1) {
				if(cost < best) {
					best = cost;
					best_values = values;
				}
				return;
			}

			// Try the candidates in the order of their marginal costs
			vector<pair<int64_t, int>> order;
			for(Mask rest = dom[v]; rest; rest &= rest - 1) {
				const int a = countr_zero(rest);
				order.emplace_back(marginal(v, a, values), a);
			}
			sort(order.begin(), order.end()); // NOLINT(modernize-use-ranges)

			vector<Mask> copy;
			vector<int> queue;
			for(const auto &[c, a]: order) {
				if(cost + c >= best) break; // The rest can only be worse
				copy = dom;
				copy[v] = bit(a);
				values[v] = a;
				queue.assign(1, v);
				if(propagate(copy, queue) && lower_bound(copy, values, cost + c) < best) {
					search(copy, values, cost + c);
				}
				values[v] = -1;
				if(nodes > NODE_LIMIT) return;
			}
		}

		/////////////////////////////////////////////////////////////////////////////////////////////////////
		// Reporting
		/////////////////////////////////////////////////////////////////////////////////////////////////////

		void report(const Score &current) const {
			cout << R"({"event": "tidy", "data": [)" << initial.vertices << ", " << current.vertices << "]}" << endl;
		}
	};

} // namespace

void tidy_layout(GridLayout &layout, const Hierarchy *hierarchy) {
	const GridLayout backup = layout;
	Tidy(layout, hierarchy).run();
	if(!verify_layout(layout, hierarchy)) {
		cout << "Tidy: verification failed, reverting" << endl; // Not expected
		layout = backup;
	}
}
