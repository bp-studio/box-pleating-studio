import numpy as np

from .problem import Flap, Problem


MIN_SHEET_SIZE = 4
MAX_SHEET_SIZE = 8192
MAX_INIT_SCALE = 1024

CONS_WEIGHT = 3  # This reduces constraint violations.


def get_scale(x: list[float]):
	return 1 / x[-1]


def set_scale(x: list[float], s: float):
	x[-1] = 1 / s


def interval_distance(l1: float, w1: float, l2: float, w2: float) -> float:
	"""
	Signed-distance between two intervals, represented by the left endpoint and width.

	The formula is `max(l1 - r2, 0) + min(r1 - l2, 0)`.
	"""
	return max(l1 - l2 - w2, 0) + min(l1 + w1 - l2, 0)


def dist_constraint(x: list[float], i: int, j: int, dist: int) -> float:
	"""
	Corresponding to the formula `(x1 - x2)^2 + (y1 - y2)^2 >= (s d)^2`.

	I've also tried moving s to left side of the inequality,
	but the current version performs better (in terms of both the quality of the solutions,
	and the basin-hopping stability) in practice.
	"""
	d = dist * x[-1]
	dx = x[i * 2] - x[j * 2]
	dy = x[i * 2 + 1] - x[j * 2 + 1]
	return (dx * dx + dy * dy - d * d) * CONS_WEIGHT


def strict_constraint(x: list[float], i: int, j: int, dist: int) -> int:
	"""Like dist_constraint, but without floating error."""
	s = x[-1]
	dx = round(x[i * 2] / s) - round(x[j * 2] / s)
	dy = round(x[i * 2 + 1] / s) - round(x[j * 2 + 1] / s)
	return dx * dx + dy * dy - dist * dist


def dist_jacobian(x: list[float], i: int, j: int, dist: int):
	"""Jacobian vector of dist_constraint."""
	vec: list[float] = [0] * len(x)
	dx = x[i * 2] - x[j * 2]
	dy = x[i * 2 + 1] - x[j * 2 + 1]
	vec[i * 2] = 2 * dx
	vec[j * 2] = -2 * dx
	vec[i * 2 + 1] = 2 * dy
	vec[j * 2 + 1] = -2 * dy
	vec[-1] = -2 * dist * dist * x[-1]
	return np.array(vec) * CONS_WEIGHT


def dim_dist_constraint(x: list[float], i: int, j: int, dist: int, flaps: list[Flap]) -> float:
	"""Like dist_constraint, but with flap dimensions."""
	s = x[-1]
	d = dist * s
	dx = interval_distance(x[i * 2], s * flaps[i].width, x[j * 2], s * flaps[j].width)
	dy = interval_distance(x[i * 2 + 1], s * flaps[i].height, x[j * 2 + 1], s * flaps[j].height)
	return (dx * dx + dy * dy - d * d) * CONS_WEIGHT


def dim_dist_jacobian(x: list[float], i: int, j: int, dist: int, flaps: list[Flap]):
	"""Jacobian vector of dim_dist_constraint."""
	vec: list[float] = [0] * len(x)
	s = x[-1]
	dx = interval_distance(x[i * 2], s * flaps[i].width, x[j * 2], s * flaps[j].width)
	dy = interval_distance(x[i * 2 + 1], s * flaps[i].height, x[j * 2 + 1], s * flaps[j].height)
	dx_s = -flaps[j].width if dx > 0 else flaps[i].width if dx < 0 else 0
	dy_s = -flaps[j].height if dy > 0 else flaps[i].height if dy < 0 else 0
	vec[i * 2] = 2 * dx
	vec[j * 2] = -2 * dx
	vec[i * 2 + 1] = 2 * dy
	vec[j * 2 + 1] = -2 * dy
	vec[-1] = 2 * dx * dx_s + 2 * dy * dy_s - 2 * dist * dist * s
	return np.array(vec) * CONS_WEIGHT


def dim_strict_constraint(x: list[float], i: int, j: int, dist: int, flaps: list[Flap]) -> int:
	"""Like dim_dist_constraint, but without floating error."""
	s = x[-1]
	dx = interval_distance(round(x[i * 2] / s), flaps[i].width, round(x[j * 2] / s), flaps[j].width)
	dy = interval_distance(round(x[i * 2 + 1] / s), flaps[i].height, round(x[j * 2 + 1] / s), flaps[j].height)
	return dx * dx + dy * dy - dist * dist


def has_dimension(flaps: list[Flap], i: int, j: int) -> bool:
	"""If either `flaps[i]` or `flaps[j]` has non-zero dimension."""
	return flaps[i].has_dimension() or flaps[i].has_dimension()


def dim_bound(x: list[float], i: int, dim: int):
	return 1 - x[i] - dim * x[-1]


def dim_jacobian(x: list[float], i: int, dim: int):
	vec: list[float] = [0] * len(x)
	vec[i] = -1
	vec[-1] = -dim
	return np.array(vec)


def generate_constraints(problem: Problem):
	cons = []
	for i in range(len(problem.flaps)):
		flap = problem.flaps[i]
		if flap.width != 0:
			cons.append({"type": "ineq", "fun": dim_bound, "jac": dim_jacobian, "args": [i * 2, flap.width]})
		if flap.height != 0:
			cons.append({"type": "ineq", "fun": dim_bound, "jac": dim_jacobian, "args": [i * 2 + 1, flap.height]})

	for entry in problem.dist_map:
		[i, j, dist] = entry
		if has_dimension(problem.flaps, i, j):
			cons.append(
				{
					"type": "ineq",
					"fun": dim_dist_constraint,
					"jac": dim_dist_jacobian,
					"args": [i, j, dist, problem.flaps],
				}
			)
		else:
			cons.append(
				{
					"type": "ineq",
					"fun": dist_constraint,
					"jac": dist_jacobian,
					"args": [i, j, dist],
				}
			)
	return cons


def select_initial_scale(x, problem: Problem):
	grid = MIN_SHEET_SIZE
	set_scale(x, grid)
	for entry in problem.dist_map:
		[i, j, dist] = entry
		while dim_dist_constraint(x, i, j, dist, problem.flaps) < 0:
			grid += 1
			set_scale(x, grid)
			if grid >= MAX_INIT_SCALE:
				return x  # Proceed regardlessly
	return x


def check_constraints(x, n, fix, problem: Problem) -> bool:
	for entry in problem.dist_map:
		[i, j, dist] = entry
		if i == n and fix[j] or j == n and fix[i]:
			if dim_strict_constraint(x, i, j, dist, problem.flaps) < 0:
				return False
	return True
