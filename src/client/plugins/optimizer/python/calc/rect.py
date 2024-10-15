import numpy as np

from . import get_scale
from ..problem import Flap


def bound(x: list[float], i: int, dim: int):
	return 1 - x[i] - dim * x[-1]


def exact(x: list[float], i: int, dim: int):
	return get_scale(x) - round(x[i] / x[-1]) - dim


def jacobian(x: list[float], i: int, dim: int):
	vec: list[float] = [0] * len(x)
	vec[i] = -1
	vec[-1] = -dim
	return np.array(vec)


def add_bounds(cons, flaps: list[Flap]):
	for i, flap in enumerate(flaps):
		if flap.width != 0:
			cons.append({"type": "ineq", "fun": bound, "jac": jacobian, "args": [i * 2, flap.width]})
		if flap.height != 0:
			cons.append({"type": "ineq", "fun": bound, "jac": jacobian, "args": [i * 2 + 1, flap.height]})


def check_bounds(x, n: int, flaps: list[Flap]):
	flap = flaps[n]
	if flap.width != 0 and exact(x, n * 2, flap.width) < 0:
		return False
	if flap.height != 0 and exact(x, n * 2 + 1, flap.height) < 0:
		return False
	return True
