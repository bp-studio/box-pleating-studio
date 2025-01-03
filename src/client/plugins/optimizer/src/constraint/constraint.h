
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
	virtual void add_to(nlopt_opt opt) = 0;
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
};

class ScalarConstraint: public Constraint {
  public:
	void add_to(nlopt_opt opt) override;

  protected:
	ScalarConstraint(Type type): Constraint(type) {}
	virtual double constraint(const double *x, double *grad) const = 0;
	static double constraint_wrapper(unsigned n, const double *x, double *grad, void *data);
};

class VectorConstraint: public Constraint {
  public:
	void add_to(nlopt_opt opt) override;

  protected:
	VectorConstraint(Type type, unsigned m): Constraint(type), dim(m) {}
	const unsigned dim;
	virtual void constraint(double *result, const double *x, double *grad) const = 0;
	static void constraint_wrapper(unsigned m, double *result, unsigned n, const double *x, double *grad, void *data);

  private:
	static const vector<double> tol;
};

using ConstraintList = vector<unique_ptr<Constraint>>;
