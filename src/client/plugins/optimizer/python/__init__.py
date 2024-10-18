import sys
import signal

from .heuristics import generate_candidate
from .problem import Hierarchy, Problem
from .constraints import MAX_SHEET_SIZE, generate_constraints, select_initial_scale
from .solver import basin_hopping, pack, pack_int, solve_global
from .branching.greedy import greedy_solve_integer


def abort_handler(_, __):
	print("Abort operation")
	raise StopAsyncIteration


signal.signal(signal.SIGABRT, abort_handler)


def convert_vector(vec, hierarchy: Hierarchy):
	vec = [coord for point in vec for coord in (point["x"], point["y"])] + [0]
	return select_initial_scale(vec, hierarchy)


def main(args):
	data = args.to_py()
	problem = Problem(data.get("problem"))
	hierarchy = problem.hierarchies[-1]
	flap_count = len(hierarchy.flaps)

	try:
		constraints = generate_constraints(hierarchy)
		best_solution = pre_solve(data, problem, constraints)
		if best_solution is None:
			return None

		# print(best_solution)
		integer_solution = greedy_solve_integer(constraints, best_solution, hierarchy)
		coordinates = integer_solution[0 : flap_count * 2]
		grid = max(coordinates)
		return {
			"width": grid,
			"height": grid,
			"flaps": hierarchy.restore(coordinates),
		}
	except StopAsyncIteration:
		return None


def pre_solve(data, problem, constraints):
	layout: str = data.get("layout")
	hierarchy = problem.hierarchies[-1]

	if layout == "view":
		x0 = convert_vector(data.get("vec"), hierarchy)
		if data.get("useBH"):
			result = basin_hopping(x0, constraints, 1, MAX_SHEET_SIZE)
		else:
			result = pack(x0, constraints)
	else:
		initial_vectors = generate_candidate(data.get("random"), problem.hierarchies)
		# print(initial_vectors)
		result = solve_global(initial_vectors, constraints)

	return None if result is None else result.x


def try_pack_int(solution, constraints):
	try:
		int_result = pack_int(solution, constraints)
		if int_result.success:
			x = int_result.x
			output = [round(v, 4) for v in (x[:-1] / x[-1]).tolist()]
			print(f'{{"event": "log", "data": {output}}}')
			return x
		print('{"event": "log", "data": "int failed"}')
		return solution
	except KeyboardInterrupt:
		return solution


def get_error():
	return str(sys.last_value)
