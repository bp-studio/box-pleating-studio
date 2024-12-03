
#pragma once

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

  protected:
	enum Type {
		equality,
		inequality,
	};

	Constraint(Type type) : type(type) {}
	Type type;

	virtual double constraint(const vector<double> &x, vector<double> &grad) const = 0;

	static inline double constraint_wrapper(const vector<double> &x, vector<double> &grad, void *data);
};

using ConstraintList = vector<unique_ptr<Constraint>>;
