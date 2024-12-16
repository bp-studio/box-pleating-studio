
#pragma once

#include "global/global.h"

#include <vector>

using namespace std;

// forward declaration
namespace nlopt {
	class opt;
}

/**
 * Base class of the constraints.
 */
class Constraint {
  public:
	void add_to(nlopt::opt &opt);
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

	// Using std::vector<double> functions with NLopt will result in copying memory,
	// therefore it is better to use the C-flavored function signature.
	// We don't need the array size parameter here since it is already known.
	virtual double constraint(const double *x, double *grad) const = 0;

	static double constraint_wrapper(unsigned n, const double *x, double *grad, void *data);
};

using ConstraintList = vector<unique_ptr<Constraint>>;
