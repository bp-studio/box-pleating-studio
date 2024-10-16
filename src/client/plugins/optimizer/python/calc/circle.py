import numpy as np

from . import CONS_WEIGHT


def constraint(x: list[float], i: int, j: int, dist: int) -> float:
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


def jacobian(x: list[float], i: int, j: int, dist: int):
	"""Jacobian vector of constraint."""
	vec: list[float] = [0] * len(x)
	dx = x[i * 2] - x[j * 2]
	dy = x[i * 2 + 1] - x[j * 2 + 1]
	vec[i * 2] = 2 * dx
	vec[j * 2] = -2 * dx
	vec[i * 2 + 1] = 2 * dy
	vec[j * 2 + 1] = -2 * dy
	vec[-1] = -2 * dist * dist * x[-1]
	return np.array(vec) * CONS_WEIGHT


def make(i: int, j: int, dist: int):
	return {
		"type": "ineq",
		"fun": constraint,
		"jac": jacobian,
		"args": [i, j, dist],
	}
