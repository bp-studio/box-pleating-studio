
#pragma once

#include "global/global.h"

#include <vector>

using namespace std;

// forward declaration
struct nlopt_opt_s;
using nlopt_opt = nlopt_opt_s *;

/**
 * Base class of the constraints.
 */
class Constraint {
  public:
	void add_to(nlopt_opt opt);
	virtual ~Constraint() = default;

	/**
	 * Reset all entries to zero, except for the last entry,
	 * which is assigned to the given value.
	 */
	static void reset(double *grad, double s) {
		for(int i = 0; i < Shared::last; i++) grad[i] = 0;
		grad[Shared::last] = s;
	}

  protected:
	enum Type : std::uint8_t {
		equality,
		inequality,
	};

	Constraint(Type type): type(type) {}
	Type type;

	virtual double constraint(const double *x, double *grad) const = 0;

	static double constraint_wrapper(unsigned n, const double *x, double *grad, void *data);
};

using ConstraintList = vector<unique_ptr<Constraint>>;
