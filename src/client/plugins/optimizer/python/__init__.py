import sys
import signal
from typing import Optional, cast

import numpy as np

from .calc import ConstraintDict
from .heuristics import generate_candidate
from .problem import Hierarchy, Problem
from .constraints import MAX_SHEET_SIZE, generate_constraints, select_initial_scale
from .solver import basin_hopping, pack, solve_global
from .branching.greedy import greedy_solve_integer


def abort_handler(_, __):
	print("Abort operation")
	raise StopAsyncIteration


signal.signal(signal.SIGABRT, abort_handler)


def convert_vector(vec, hierarchy: Hierarchy) -> np.ndarray:
	vec = np.array([coord for point in vec for coord in (point["x"], point["y"])] + [0])
	return select_initial_scale(vec, hierarchy)


def main(args) -> Optional[dict]:
	data: dict = args.to_py()
	problem = Problem(cast(dict, data.get("problem")))
	hierarchy = problem.hierarchies[-1]
	flap_count = len(hierarchy.flaps)

	try:
		constraints = generate_constraints(hierarchy)
		best_solution = pre_solve(data, problem, constraints)
		if best_solution is None:
			return None

		# print(best_solution)
		integer_solution = greedy_solve_integer(best_solution, hierarchy)
		coordinates = integer_solution[0 : flap_count * 2]
		grid = max(coordinates)
		return {
			"width": grid,
			"height": grid,
			"flaps": hierarchy.restore(coordinates),
		}
	except StopAsyncIteration:
		return None


def pre_solve(data: dict, problem: Problem, constraints: list[ConstraintDict]) -> Optional[np.ndarray]:
	layout = cast(str, data.get("layout"))
	hierarchy = problem.hierarchies[-1]

	if layout == "view":
		x0 = convert_vector(data.get("vec"), hierarchy)
		if data.get("useBH"):
			result = basin_hopping(x0, constraints, 1, MAX_SHEET_SIZE)
		else:
			result = pack(x0, constraints)
	else:
		random = cast(int, data.get("random"))
		initial_vectors = generate_candidate(random, problem.hierarchies)
		# print(initial_vectors)
		result = solve_global(initial_vectors, constraints)

	return None if result is None else result.x


def get_error() -> str:
	return str(sys.last_value)
