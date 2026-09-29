
#pragma once

#include "class/flap.h"
#include "constraint/constraint.h"
#include "global/global.h"
#include <vector>

using namespace std;

class Sheet {
  public:
	Sheet(const double offset): offset(offset) {}
	virtual ~Sheet() = default;

	/** The origin of the grid coordinates, in the normalized coordinates of the continuous problem. */
	const double offset;

	/** Add the bound constraints of the continuous problem. */
	virtual void add_bounds(ConstraintList &cons, const vector<Flap> &flaps) const = 0;

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Integer grid interface (used by the CSP fitter)
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	/** The increment of sheet size when searching for integral solutions (2 for diagonal sheets). */
	virtual int size_step() const = 0;

	/** Round the given (real) sheet size up to the next admissible integral size. */
	virtual int ceil_size(const double size) const = 0;

	/**
	 * Whether the given flap can be placed at the integer grid location (x, y) on a sheet of the given size.
	 * The grid coordinates are the normalized coordinates minus {@link offset}, scaled by the size.
	 */
	virtual bool int_contains(const int x, const int y, const Flap &flap, const int size) const = 0;

	/**
	 * Convert an integral grid solution (2 entries per flap, no scale) to the output format,
	 * i.e. the coordinates of the flaps followed by the sheet size.
	 */
	virtual vector<int> int_output(const vector<int> &grid, const vector<Flap> &flaps) const = 0;
};
