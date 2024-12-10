
#pragma once

#include "constraint/constraint.h"
#include "global/global.h"
#include "optimizeResult.h"

using namespace std;

/** Callback function for SLSQP */
using cfunc = void (*)(int);

OptimizeResult pack(vector<double> x, const ConstraintList &cons, cfunc callback);
