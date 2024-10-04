import math

from .constraints import generate_constraints, get_scale, select_initial_scale
from .solver import generate_candidate, pack, solve_global
from .branching import greedy_solve_integer, solve_integer


def convert_vector(vec, dist_map):
	vec = [coord for point in vec for coord in (point["x"], point["y"])] + [0]
	return select_initial_scale(vec, dist_map)


async def main(args):
	data = args.to_py()
	checkInterrupt = data.get("checkInterrupt")
	layout: str = data.get("layout")
	fit: str = data.get("fit")
	type: str = data.get("type")
	flaps = data.get("flaps")
	dist_map = data.get("distMap")
	flap_count = len(flaps)

	# print(initial_vectors)
	constraints = generate_constraints(type, flaps, dist_map)

	if layout == "view":
		x0 = convert_vector(data.get("vec"), dist_map)
		result = pack(x0, constraints)
	else:
		initial_vectors = await generate_candidate(data.get("random"), len(flaps), dist_map, checkInterrupt)
		print(initial_vectors)
		result = await solve_global(initial_vectors, constraints, checkInterrupt)

	if result is None:
		return None
	best_solution = result.x

	# print(best_solution)
	grid = math.ceil(get_scale(best_solution))
	if fit == "quick":
		integer_solution = None
		while integer_solution is None:
			integer_solution = greedy_solve_integer(constraints, best_solution, grid, dist_map)
			grid += 1
	else:
		integer_solution = None
		while integer_solution is None:
			integer_solution = solve_integer(constraints, best_solution, grid, dist_map)
			grid += 1

	grid = round(get_scale(integer_solution))
	coordinates = [round(v * grid) for v in integer_solution[0 : flap_count * 2]]
	grid = max(coordinates)
	return {
		"width": grid,
		"height": grid,
		"flaps": [{"x": x, "y": y} for x, y in zip(coordinates[::2], coordinates[1::2])],
	}
