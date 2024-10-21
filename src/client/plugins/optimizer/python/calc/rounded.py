import numpy as np

from ..problem import Flap
from . import ConstraintDict, Array


def _interval_distance(l1: float, w1: float, l2: float, w2: float) -> float:
	"""
	Signed-distance between two intervals, represented by the left endpoint and width.

	The formula is `max(l1 - r2, 0) + min(r1 - l2, 0)`.
	"""
	return max(l1 - l2 - w2, 0) + min(l1 + w1 - l2, 0)


def constraint(x: Array, i: int, j: int, dist: int, flaps: list[Flap]) -> float:
	m = x[-1]
	d = dist * m
	dx = _interval_distance(x[i * 2], m * flaps[i].width, x[j * 2], m * flaps[j].width)
	dy = _interval_distance(x[i * 2 + 1], m * flaps[i].height, x[j * 2 + 1], m * flaps[j].height)
	return dx * dx + dy * dy - d * d


def _jacobian(x: Array, i: int, j: int, dist: int, flaps: list[Flap]) -> np.ndarray:
	"""Jacobian vector of constraint."""
	vec: list[float] = [0] * len(x)
	m = x[-1]
	dx = _interval_distance(x[i * 2], m * flaps[i].width, x[j * 2], m * flaps[j].width)
	dy = _interval_distance(x[i * 2 + 1], m * flaps[i].height, x[j * 2 + 1], m * flaps[j].height)
	dx_s = -flaps[j].width if dx > 0 else flaps[i].width if dx < 0 else 0
	dy_s = -flaps[j].height if dy > 0 else flaps[i].height if dy < 0 else 0
	vec[i * 2] = 2 * dx
	vec[j * 2] = -2 * dx
	vec[i * 2 + 1] = 2 * dy
	vec[j * 2 + 1] = -2 * dy
	vec[-1] = 2 * dx * dx_s + 2 * dy * dy_s - 2 * dist * dist * m
	return np.array(vec)


def exact(x: Array, i: int, j: int, dist: int, flaps: list[Flap]) -> float:
	"""Like constraint, but without floating error."""
	dx = _interval_distance(x[i * 2], flaps[i].width, x[j * 2], flaps[j].width)
	dy = _interval_distance(x[i * 2 + 1], flaps[i].height, x[j * 2 + 1], flaps[j].height)
	return dx * dx + dy * dy - dist * dist


def make(i: int, j: int, dist: int, flaps: list[Flap]) -> ConstraintDict:
	return {
		"type": "ineq",
		"fun": constraint,
		"jac": _jacobian,
		"args": [i, j, dist, flaps],
	}
