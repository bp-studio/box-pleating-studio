import numpy as np

from . import ConstraintDict, Array


def _constraint(x: Array, i: int, j: int, dist: int) -> float:
	"""
	Corresponding to the formula `(x1 - x2)^2 + (y1 - y2)^2 >= (m d)^2`.

	I've also tried moving m to left side of the inequality,
	but the current version performs better (in terms of both the quality of the solutions,
	and the basin-hopping stability) in practice.
	"""
	d = dist * x[-1]
	dx = x[i * 2] - x[j * 2]
	dy = x[i * 2 + 1] - x[j * 2 + 1]
	return dx * dx + dy * dy - d * d


def _jacobian(x: Array, i: int, j: int, dist: int) -> np.ndarray:
	"""Jacobian vector of constraint."""
	vec: list[float] = [0] * len(x)
	dx = x[i * 2] - x[j * 2]
	dy = x[i * 2 + 1] - x[j * 2 + 1]
	vec[i * 2] = 2 * dx
	vec[j * 2] = -2 * dx
	vec[i * 2 + 1] = 2 * dy
	vec[j * 2 + 1] = -2 * dy
	vec[-1] = -2 * dist * dist * x[-1]
	return np.array(vec)


def make(i: int, j: int, dist: int) -> ConstraintDict:
	return {
		"type": "ineq",
		"fun": _constraint,
		"jac": _jacobian,
		"args": [i, j, dist],
	}
