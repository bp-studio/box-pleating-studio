
#pragma once

#include "constraint/constraint.h"
#include "global/global.h"
#include "optimizeResult.h"

using namespace std;

OptimizeResult pack(vector<double> x, const ConstraintList &cons);
