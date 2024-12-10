#include <array>
#include <emscripten.h>
#include <iostream>
#include <nlopt.hpp>
#include <vector>

#include "branching/greedy.h"
#include "class/problem.h"
#include "constraint/circleConstraint.h"
#include "math/basinHopping.h"
#include "math/heuristics.h"
#include "math/scale.h"
#include "math/solver.h"

using namespace std;

#define EXPORT extern "C" EMSCRIPTEN_KEEPALIVE

struct Output {
	int size;
	int *ptr;
};

Output output;
vector<int> result;

vector<double> read_initial_vector(double *&ptr, const Hierarchy &hierarchy) {
	vector<double> x;
	x.reserve(Shared::dim);
	for (int i = 0; i < Shared::last; i++) x.push_back(read(ptr));
	x.push_back(0);
	setup_initial_scale(x, &hierarchy);
	return x;
}

BasinHoppingParams bhp = {
	.niter = 50,
	.niter_success = 16,
	.T = 0.01,
	.stepsize = 0.01,
	.step = {.interval = 5}
};

/**
 * Run Basin-hopping for each of the randomly generated layouts.
 */
OptimizeResult solve_global(const vector<vector<double>> &initial_vectors, const ConstraintList &cons) {
	double best_s = MAX_SHEET_SIZE;
	OptimizeResult best_result = {.success = false};
	int trials = 0;
	for (auto &vec : initial_vectors) {
		trials++;
		auto result = basin_hopping(vec, cons, trials, bhp, best_s);
		if (result.success) {
			auto s = get_scale(result.x);
			if (s < best_s) {
				best_result = std::move(result);
				best_s = s;
			}
		}
		if (result.interrupted) break;
	}
	return best_result;
}

/**
 * Setup and print welcome message to indicate that the WASM is ready.
 */
EXPORT void init(bool async) {
	Shared::async = async;
	int major, minor, bugfix;
	nlopt::version(major, minor, bugfix);
	cout << "NLopt version: " << major << "." << minor << "." << bugfix << endl;
}

/**
 * The entry function for optimizing.
 */
EXPORT Output *solve(double *ptr, unsigned int seed) {
	cout << R"({"event": "start", "data": null})" << endl;
	result.clear();

	// Initialize random number generator.
	// This improves performance and makes it easier to reproduce issues if any.
	std::srand(seed);
	cout << "Random seed: " << seed << endl;

	Problem problem(ptr);
	Hierarchy &main = problem.hierarchies.back();
	auto cons = main.generate_constraints(nullptr);

	OptimizeResult sol;
	bool useView = read(ptr);
	if (useView) {
		auto x0 = read_initial_vector(ptr, main);
		bool useBH = read(ptr);
		if (useBH) {
			cout << R"({"event": "cont", "data": [0, 0, 0]})" << endl;
			sol = basin_hopping(x0, cons, 1, bhp, MAX_SHEET_SIZE);
		} else {
			cout << R"({"event": "pack", "data": 0})" << endl;
			sol = pack(x0, cons, [](int step) {
				cout << R"({"event": "pack", "data": )" << step << "}" << endl;
			});
		}
	} else {
		int random = read(ptr);
		auto initial_vectors = generate_candidate(random, problem.hierarchies);
		sol = solve_global(initial_vectors, cons);
	}

	if (sol.success) {
		auto int_sol = greedy_solve_integer(sol.x, &main);
		for (int i = 0; i < Shared::dim; i++) result.push_back(int_sol[i]);
	}
	output.size = result.size();
	output.ptr = result.data();
	return &output;
}
