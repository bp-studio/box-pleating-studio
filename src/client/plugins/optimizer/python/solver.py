from typing import Optional

import numpy as np
from scipy.optimize import minimize, basinhopping, OptimizeResult

from .calc import ConstraintDict, get_scale, int_scale
from .constraints import MIN_SHEET_SIZE, MAX_SHEET_SIZE


TOL = 1e-6
MINIMIZE_OPTION = {
	"maxiter": 200,
	"ftol": 1e-5,
}

FLAP_BOUND = (0, 1)
SCALE_BOUND = (1 / MAX_SHEET_SIZE, 1 / MIN_SHEET_SIZE)


def objective(x: np.ndarray) -> float:
	return -x[-1]


def jacobian(x: np.ndarray) -> np.ndarray:
	return np.array([0] * (len(x) - 1) + [-1])


def pack(x0, cons: list[ConstraintDict], fixed: Optional[list[bool]] = None) -> OptimizeResult:
	"""Pack the flaps as continuous problem."""
	flap_count = (len(x0) - 1) >> 1
	bounds: list[tuple[float, float]] = []
	for n in range(flap_count):
		if fixed and fixed[n]:
			x = x0[n * 2]
			y = x0[n * 2 + 1]
			bounds += [(x, x), (y, y)]
		else:
			bounds += [FLAP_BOUND, FLAP_BOUND]
	bounds.append(SCALE_BOUND)
	return minimize(objective, x0, bounds=bounds, constraints=cons, jac=jacobian, tol=TOL, options=MINIMIZE_OPTION)


def solve_global(initial_vectors: list[np.ndarray], cons: list[ConstraintDict]) -> Optional[OptimizeResult]:
	best_s: float = MAX_SHEET_SIZE
	best_result = None

	trials = 0
	for vec in initial_vectors:
		trials += 1
		result = basin_hopping(vec, cons, trials, best_s)
		if not result.success:
			continue

		s = get_scale(result.x)
		if s < best_s:
			best_result = result
			best_s = s

		if "interrupt" in result:
			break

	return best_result


def basin_hopping(x0: np.ndarray, cons: list[ConstraintDict], trials: int, best_s: float) -> OptimizeResult:
	bounds = [FLAP_BOUND] * (len(x0) - 1) + [SCALE_BOUND]

	best_temp_f = 0
	best_temp_x = None
	step = 0

	def callback(x, f, _):
		nonlocal best_temp_f, best_temp_x, step
		if f < best_temp_f:
			best_temp_f = f
			best_temp_x = x
		assert best_temp_x is not None
		best = int_scale(min(best_s, get_scale(best_temp_x)))
		print(f'{{"event": "cont", "data": [{trials}, {step}, {best}]}}')  # report progress
		step += 1

	try:
		return basinhopping(
			objective,
			x0,
			interval=5,
			niter=50,
			niter_success=16,
			stepsize=max(0.01, x0[-1] * 2),  # two grid size
			T=0.01,
			callback=callback,
			minimizer_kwargs={
				"method": "SLSQP",
				"bounds": bounds,
				"constraints": cons,
				"jac": jacobian,
				"tol": TOL,
				"options": MINIMIZE_OPTION,
			},
		)
	except KeyboardInterrupt:
		if best_temp_x is None:
			best_temp_x = x0
		result = OptimizeResult()
		result.x = best_temp_x
		result.success = True
		result["interrupt"] = True
		return result
