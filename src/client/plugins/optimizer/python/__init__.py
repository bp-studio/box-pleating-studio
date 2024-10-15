import sys
import signal
import numpy as np

from .heuristics import generate_candidate
from .problem import Hierarchy, Problem
from .calc import get_scale, int_scale
from .constraints import MAX_SHEET_SIZE, generate_constraints, select_initial_scale
from .solver import basin_hopping, pack, solve_global
from .branching import greedy_solve_integer, solve_integer


def abort_handler(_, __):
	print("Abort operation")
	raise StopAsyncIteration


signal.signal(signal.SIGABRT, abort_handler)


def convert_vector(vec, hierarchy: Hierarchy):
	vec = [coord for point in vec for coord in (point["x"], point["y"])] + [0]
	return select_initial_scale(vec, hierarchy)


async def main(args):
	data = args.to_py()
	fit: str = data.get("fit")
	problem = Problem(data.get("problem"))
	hierarchy = problem.hierarchies[-1]
	flap_count = len(hierarchy.flaps)

	try:
		constraints = generate_constraints(hierarchy)
		best_solution = pre_solve(data, problem, constraints)
		if best_solution is None:
			return None

		# print(best_solution)
		grid = int_scale(get_scale(best_solution))
		if fit == "quick":
			integer_solution = None
			while integer_solution is None:
				integer_solution = greedy_solve_integer(constraints, best_solution, grid, hierarchy)
				grid += 1
		else:
			integer_solution = None
			while integer_solution is None:
				integer_solution = solve_integer(constraints, best_solution, grid, hierarchy)
				grid += 1

		grid = round(get_scale(integer_solution))
		coordinates = [round(v * grid) for v in integer_solution[0 : flap_count * 2]]
		grid = max(coordinates)
		return {
			"width": grid,
			"height": grid,
			"flaps": hierarchy.restore(coordinates),
		}
	except StopAsyncIteration:
		return None


async def pre_solve(data, problem, constraints):
	layout: str = data.get("layout")
	check_interrupt = data.get("checkInterrupt")
	hierarchy = problem.hierarchies[-1]

	if layout == "view":
		x0 = convert_vector(data.get("vec"), hierarchy)
		if data.get("useBH"):
			print('{"event": "bh", "data": 0}')
			result = basin_hopping(x0, constraints, 1, MAX_SHEET_SIZE)
		else:
			result = pack(x0, constraints)
	else:
		initial_vectors = await generate_candidate(data.get("random"), problem.hierarchies, check_interrupt)
		# print(initial_vectors)
		result = await solve_global(initial_vectors, constraints, check_interrupt)

	return result if result is None or isinstance(result, np.ndarray) else result.x


def get_error():
	return str(sys.last_value)
