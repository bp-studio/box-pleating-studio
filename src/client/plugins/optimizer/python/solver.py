import numpy as np
from scipy.optimize import minimize, basinhopping

from .constraints import MAX_SHEET_SIZE, get_scale, select_initial_scale


TOL = 1e-8
MINIMIZE_OPTION = {
	"maxiter": 200,
	"ftol": 1e-5,
}

FLAP_BOUND = (0, 1)
SCALE_BOUND = (0, 1)


def objective(x):
	return -x[-1]


def jacobian(x):
	return np.array([0] * (len(x) - 1) + [-1])


def pack(x0, cons, fix=None):
	"""Pack a set of flaps with given lengths using scipy's solver."""
	flap_count = (len(x0) - 1) >> 1
	bounds = []
	for n in range(flap_count):
		if (fix is not None) and fix[n]:
			x = x0[n * 2]
			y = x0[n * 2 + 1]
			bounds += [(x, x), (y, y)]
		else:
			bounds += [FLAP_BOUND, FLAP_BOUND]
	bounds.append(SCALE_BOUND)
	return minimize(objective, x0, bounds=bounds, constraints=cons, jac=jacobian, tol=TOL, options=MINIMIZE_OPTION)


async def generate_candidate(target: int, flap_count: int, dist_map, checkInterrupt):
	vectors = []
	for i in range(target * 100):
		vec = np.random.rand(flap_count * 2 + 1)
		select_initial_scale(vec, dist_map)
		vectors.append(vec)
		if i % 10 == 0:
			print(f'{{"event": "candidate", "data": {i/100}}}')
		if i % 100 == 0:
			interrupt = await checkInterrupt()
			if interrupt > 0:
				break

	vectors.sort(key=objective)
	return vectors[:target]


async def solve_global(initial_vectors: int, cons, checkInterrupt):
	best_s = MAX_SHEET_SIZE
	best_result = None

	trials = 0
	for vec in initial_vectors:
		trials += 1
		print(f'{{"event": "bh", "data": {trials}}}')  # report progress
		result = basin_hopping(vec, cons)
		if not result.success:
			continue

		interrupt = await checkInterrupt()
		if interrupt > 0:
			break

		s = get_scale(result.x)
		if s < best_s:
			best_result = result
			best_s = s

	return best_result


def basin_hopping(x0, cons):
	bounds = [FLAP_BOUND] * (len(x0) - 1) + [SCALE_BOUND]
	return basinhopping(
		objective,
		x0,
		interval=5,
		niter=50,
		niter_success=8,
		stepsize=0.1,
		T=0.01,
		disp=True,
		minimizer_kwargs={"method": "SLSQP", "bounds": bounds, "constraints": cons, "jac": jacobian, "tol": TOL, "options": MINIMIZE_OPTION},
	)
