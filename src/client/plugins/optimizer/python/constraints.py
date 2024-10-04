import numpy as np


MIN_SHEET_SIZE = 4
MAX_SHEET_SIZE = 8192

CONS_WEIGHT = 3  # This reduces constraint violations.


def get_scale(x: list[float]):
	return 1 / x[-1]


def set_scale(x: list[float], s: float):
	x[-1] = 1 / s


def interval_distance(l1: float, w1: float, l2: float, w2: float) -> float:
	"""Signed-distance between two intervals, represented by the left endpoint and width."""
	return max(l1 - l2 - w2, 0) + min(l1 + w1 - l2)


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
	vec: list[float] = [0] * len(x)
	dx = x[i * 2] - x[j * 2]
	dy = x[i * 2 + 1] - x[j * 2 + 1]
	vec[i * 2] = 2 * dx
	vec[j * 2] = -2 * dx
	vec[i * 2 + 1] = 2 * dy
	vec[j * 2 + 1] = -2 * dy
	vec[-1] = -2 * dist * dist * x[-1]
	# print(("jac", vec))
	return np.array(vec) * CONS_WEIGHT


def generate_constraints(type, flaps, dist_map):
	cons = []
	for entry in dist_map:
		[i, j, dist] = entry
		cons.append(
			{
				"type": "ineq",
				"fun": dist_constraint,
				"jac": dist_jacobian,
				"args": [i, j, dist],
			}
		)
	return cons


def select_initial_scale(x, dist_map):
	grid = MIN_SHEET_SIZE
	set_scale(x, grid)
	for entry in dist_map:
		[i, j, dist] = entry
		while dist_constraint(x, i, j, dist) < 0:
			grid += 1
			set_scale(x, grid)
	return x


def check_constraints(x, n, fix, dist_map) -> bool:
	for entry in dist_map:
		[i, j, dist] = entry
		if i == n and fix[j] or j == n and fix[i]:
			if strict_constraint(x, i, j, dist) < 0:
				return False
	return True
