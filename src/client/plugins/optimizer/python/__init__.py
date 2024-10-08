import math
import sys
import signal

from .problem import Problem
from .calc import get_scale
from .constraints import generate_constraints, select_initial_scale
from .solver import basin_hopping, generate_candidate, pack, solve_global
from .branching import greedy_solve_integer, solve_integer


def abort_handler(sig_num, frame):
	print("Abort operation")
	raise StopAsyncIteration


signal.signal(signal.SIGABRT, abort_handler)


def convert_vector(vec, problem: Problem):
	vec = [coord for point in vec for coord in (point["x"], point["y"])] + [0]
	return select_initial_scale(vec, problem)


async def main(args):
	data = args.to_py()
	checkInterrupt = data.get("checkInterrupt")
	useBH = data.get("useBH")
	layout: str = data.get("layout")
	fit: str = data.get("fit")
	problem = Problem(data.get("problem"))
	flap_count = len(problem.flaps)

	try:
		constraints = generate_constraints(problem)

		if layout == "view":
			x0 = convert_vector(data.get("vec"), problem)
			if useBH:
				print('{"event": "bh", "data": 0}')
				result = basin_hopping(x0, constraints)
			else:
				result = pack(x0, constraints)
		else:
			initial_vectors = await generate_candidate(data.get("random"), problem, checkInterrupt)
			# print(initial_vectors)
			result = await solve_global(initial_vectors, constraints, checkInterrupt)

		if result is None:
			return None
		best_solution = result.x

		# print(best_solution)
		grid = math.ceil(get_scale(best_solution) - 0.001)  # The offset is for handling floating error
		if fit == "quick":
			integer_solution = None
			while integer_solution is None:
				integer_solution = greedy_solve_integer(constraints, best_solution, grid, problem)
				grid += 1
		else:
			integer_solution = None
			while integer_solution is None:
				integer_solution = solve_integer(constraints, best_solution, grid, problem)
				grid += 1

		grid = round(get_scale(integer_solution))
		coordinates = [round(v * grid) for v in integer_solution[0 : flap_count * 2]]
		grid = max(coordinates)
		return {
			"width": grid,
			"height": grid,
			"flaps": [{"x": x, "y": y} for x, y in zip(coordinates[::2], coordinates[1::2])],
		}
	except StopAsyncIteration:
		return None


def get_error():
	return str(sys.last_value)
