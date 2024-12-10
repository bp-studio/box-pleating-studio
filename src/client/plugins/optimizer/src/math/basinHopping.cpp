
#include "basinHopping.h"
#include "global/interrupt.h"
#include "scale.h"
#include "solver.h"

#include <emscripten.h>
#include <iostream>

/**
 * Class used to store the lowest energy structure.
 */
class Storage {
  public:
	Storage(OptimizeResult &minres) : _minres(minres) {}

	bool update(OptimizeResult &minres) {
		if (minres.success && (minres.fun < _minres.fun || !_minres.success)) {
			add(minres);
			return true;
		} else {
			return false;
		}
	}

	OptimizeResult &get_lowest() {
		return _minres;
	}

  private:
	void add(OptimizeResult &minres) {
		_minres = minres;
	}

	OptimizeResult _minres;
};

/**
 * Add a random displacement of maximum size `stepsize` to each coordinate
 * (except for the last one).
 *
 * Calling this updates `x` in-place.
 */
class RandomDisplacement {
  public:
	RandomDisplacement(double stepsize = 0.5) : stepsize(stepsize) {}

	void displace(vector<double> &x) {
		// We strategically leave the last one untouched.
		for (int i = 0; i < Shared::last; i++) {
			x[i] += random01() * 2 * stepsize - stepsize;
		}
	}

	void increase(double factor) {
		stepsize /= factor;
	}

	void decrease(double factor) {
		stepsize *= factor;
	}

  private:
	double stepsize;
};

/**
 * Class to implement adaptive stepsize.
 *
 * This class wraps the step taking class and modifies the stepsize to
 * ensure the true acceptance rate is as close as possible to the target.
 */
class AdaptiveStepSize {
  public:
	AdaptiveStepSize(RandomDisplacement *takeStep, const AdaptiveStepSizeParam params)
		: takeStep(takeStep), params(params) {}

	vector<double> take_step(vector<double> x) { // copy here
		nstep++;
		nstep_tot++;
		if (nstep % params.interval == 0) adjust_step_size();
		takeStep->displace(x);
		return x;
	}

	/** Called by basin-hopping to report the result of the step. */
	void report(bool accept) {
		if (accept) naccept++;
	}

  private:
	RandomDisplacement *takeStep;
	AdaptiveStepSizeParam params;
	int nstep{0};
	int nstep_tot{0};
	int naccept{0};

	inline void adjust_step_size() {
		auto accept_rate = (double)naccept / nstep;
		if (accept_rate > params.accept_rate) {
			// We're accepting too many steps. This generally means we're
			// trapped in a basin. Take bigger steps.
			takeStep->increase(params.factor);
		} else {
			// We're not accepting enough steps. Take smaller steps.
			takeStep->decrease(params.factor);
		}
	}
};

using mfunc = OptimizeResult (*)(vector<double>, const ConstraintList &, cfunc);

/**
 * Wrap a minimizer function as a minimizer class.
 */
class MinimizerWrapper {
  public:
	MinimizerWrapper(mfunc minimizer, const ConstraintList *cons)
		: minimizer(minimizer), cons(cons) {}

	OptimizeResult operator()(vector<double> &x) {
		return (*minimizer)(x, *cons, nullptr);
	}

  private:
	mfunc minimizer;
	const ConstraintList *cons;
};

/**
 * Metropolis acceptance criterion.
 */
class Metropolis {
  public:
	Metropolis(double T) {
		beta = T != 0 ? 1.0 / T : numeric_limits<double>::infinity();
	}

	/**
	 * Assuming the local search underlying res_new was successful:
	 * If new energy is lower than old, it will always be accepted.
	 * If new is higher than old, there is a chance it will be accepted,
	 * less likely for larger differences.
	 */
	bool accept_reject(const OptimizeResult &res_new, const OptimizeResult &res_old) {
		auto prod = -(res_new.fun - res_old.fun) * beta;
		auto w = exp(min(0.0, prod));
		auto rand = random01();
		return w >= rand && (res_new.success || !res_old.success);
	}

  private:
	double beta;
};

/**
 * This class implements the core of the basin-hopping algorithm.
 */
class BasinHoppingRunner {
  public:
	BasinHoppingRunner(vector<double> &x0, MinimizerWrapper *minimizer, AdaptiveStepSize *step_taking, Metropolis *accept_test)
		: minimizer(minimizer), step_taking(step_taking), accept_test(accept_test), res() {
		auto minres = (*minimizer)(x0);
		if (!minres.success) cout << "Minimize failed" << endl;

		x = minres.x;
		energy = minres.fun;
		incumbent_minres = minres;
		storage = make_unique<Storage>(minres);
	}

	OptimizeResult res;
	unique_ptr<Storage> storage;

	/** Do one cycle of the basin-hopping algorithm. */
	bool one_cycle() {
		nstep++;
		bool new_global_min = false;
		bool accept = true;
		auto minres = monte_carlo_step(accept);
		if (accept) {
			energy = minres.fun;
			x = minres.x;
			incumbent_minres = minres;
			new_global_min = storage->update(minres);
		}
		return new_global_min;
	}

  private:
	int nstep{0};
	double energy;
	OptimizeResult incumbent_minres;
	vector<double> x;
	MinimizerWrapper *minimizer;
	AdaptiveStepSize *step_taking;
	Metropolis *accept_test;

	/**
	 * Do one Monte Carlo iteration.
	 *
	 * Randomly displace the coordinates, minimize, and decide whether or not to accept the new coordinates.
	 */
	OptimizeResult monte_carlo_step(bool &accept) {
		// Take a random step.
		// Make a copy of x because the step_taking algorithm might change x in place.
		auto x_after_step = step_taking->take_step(x);

		// do a local minimization
		auto minres = (*minimizer)(x_after_step);
		auto x_after_quench = minres.x;
		auto entergy_after_quench = minres.fun;
		if (!minres.success) cout << "Minimize failed" << endl;

		auto test_result = accept_test->accept_reject(minres, incumbent_minres);
		if (!test_result) accept = false;
		step_taking->report(accept);

		return minres;
	}
};

OptimizeResult basin_hopping(vector<double> x0, const ConstraintList &cons, int trials, const BasinHoppingParams &params, double best_s) {
	// set up
	auto wrapped_minimizer = MinimizerWrapper(&pack, &cons);
	auto displacer = RandomDisplacement(params.stepsize);
	auto take_step = AdaptiveStepSize(&displacer, params.step);
	auto metropolis = Metropolis(params.T);
	auto bh = BasinHoppingRunner(x0, &wrapped_minimizer, &take_step, &metropolis);

	// start main iteration loop
	int count = 0;
	for (int i = 0; i < params.niter; i++) {
		auto new_global_min = bh.one_cycle();

		// progress report
		auto &min_result = bh.storage->get_lowest();
		auto best = int_scale(min(best_s, get_scale(min_result.x)));
		cout << R"({"event": "cont", "data": [)" << trials << ", " << i << ", " << best << ", " << count << "]}" << endl;
		if (check_interrupt()) {
			min_result.interrupted = true;
			break;
		}

		count++;
		if (new_global_min) count = 0;
		else if (count > params.niter_success) break;
	}

	return bh.storage->get_lowest();
}
