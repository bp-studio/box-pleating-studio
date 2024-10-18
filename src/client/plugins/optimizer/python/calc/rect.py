import numpy as np

from ..problem import Flap


def _bound(x: list[float], i: int, dim: int):
	return 1 - x[i] - dim * x[-1]


def _exact(x: list[float], i: int, dim: int):
	return x[-1] - x[i] - dim


def _jacobian(x: list[float], i: int, dim: int):
	vec: list[float] = [0] * len(x)
	vec[i] = -1
	vec[-1] = -dim
	return np.array(vec)


def add_bounds(cons, flaps: list[Flap], fixed=None):
	for i, flap in enumerate(flaps):
		if fixed and fixed[i]:
			continue
		if flap.width != 0:
			cons.append({"type": "ineq", "fun": _bound, "jac": _jacobian, "args": [i * 2, flap.width]})
		if flap.height != 0:
			cons.append({"type": "ineq", "fun": _bound, "jac": _jacobian, "args": [i * 2 + 1, flap.height]})


def check_bounds(x, n: int, flaps: list[Flap]):
	flap = flaps[n]
	if flap.width != 0 and _exact(x, n * 2, flap.width) < 0:
		return False
	if flap.height != 0 and _exact(x, n * 2 + 1, flap.height) < 0:
		return False
	return True
