#include <array>
#include <emscripten.h>
#include <emscripten/bind.h>
#include <iostream>
#include <nlopt.h>
#include <vector>

#include "branching/greedy.h"
#include "class/problem.h"
#include "constraint/circleConstraint.h"
#include "math/basinHopping.h"
#include "math/heuristics.h"
#include "math/scale.h"
#include "math/solver.h"

using namespace std;

vector<double> read_initial_vector(const emscripten::val &data, const Hierarchy &hierarchy) {
	vector<double> x;
	x.reserve(Shared::dim);
	for(int i = 0; i < Shared::flap_count; i++) {
		auto p = data["vec"][i];
		x.push_back(p["x"].as<double>());
		x.push_back(p["y"].as<double>());
	}
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
	for(const auto &vec: initial_vectors) {
		trials++;
		auto result = basin_hopping(vec, cons, trials, bhp, best_s);
		if(result.success) {
			auto s = get_scale(result.x);
			if(s < best_s) {
				best_result = std::move(result);
				best_s = s;
			}
		}
		if(result.interrupted) break;
	}
	return best_result;
}

/**
 * Setup and print welcome message to indicate that the WASM is ready.
 */
void init(bool async) {
	Shared::async = async;
	int major;
	int minor;
	int bugfix;
	nlopt_version(&major, &minor, &bugfix);
	cout << "NLopt version: " << major << "." << minor << "." << bugfix << endl;
}

/**
 * The entry function for optimizing.
 */
vector<int> solve(const emscripten::val &data, unsigned int seed) {
	cout << R"({"event": "start", "data": null})" << endl;
	vector<int> result;

	// Initialize random number generator.
	// This improves performance and makes it easier to reproduce issues if any.
	std::srand(seed);
	cout << "Random seed: " << seed << endl;

	Problem problem(data);
	Hierarchy &main = problem.hierarchies.back();
	auto cons = main.generate_constraints(nullptr);

	OptimizeResult sol;
	bool useView = data["useView"].as<bool>();
	if(useView) {
		auto x0 = read_initial_vector(data, main);
		bool useBH = data["useBH"].as<bool>();
		if(useBH) {
			cout << R"({"event": "cont", "data": [0, 0, 0]})" << endl;
			sol = basin_hopping(x0, cons, 1, bhp, MAX_SHEET_SIZE);
		} else {
			cout << R"({"event": "pack", "data": 0})" << endl;
			sol = pack(x0, cons, [](int step) {
				cout << R"({"event": "pack", "data": )" << step << "}" << endl;
			});
		}
	} else {
		int random = data["random"].as<int>();
		auto initial_vectors = generate_candidate(random, problem.hierarchies);
		sol = solve_global(initial_vectors, cons);
	}

	if(sol.success) {
		auto int_sol = greedy_solve_integer(sol.x, &main);
		for(int i = 0; i < Shared::dim; i++) result.push_back(int_sol[i]);
	}
	return result;
}

EMSCRIPTEN_BINDINGS(main) {
	emscripten::register_vector<int>("VectorInt");
	emscripten::function("init", &init);
	emscripten::function("solve", &solve);
}
