from typing import Optional

import numpy as np

from ..problem import Flap
from . import ConstraintDict, Array


def _bound(x: Array, i: int, dim: int) -> float:
	return 1 - x[i] - dim * x[-1]


def _exact(x: Array, i: int, dim: int) -> float:
	return x[-1] - x[i] - dim


def _jacobian(x: Array, i: int, dim: int) -> np.ndarray:
	vec: list[float] = [0] * len(x)
	vec[i] = -1
	vec[-1] = -dim
	return np.array(vec)


def add_bounds(cons: list[ConstraintDict], flaps: list[Flap], fixed: Optional[list[bool]] = None):
	for i, flap in enumerate(flaps):
		if fixed and fixed[i]:
			continue
		if flap.width != 0:
			cons.append({"type": "ineq", "fun": _bound, "jac": _jacobian, "args": [i * 2, flap.width]})
		if flap.height != 0:
			cons.append({"type": "ineq", "fun": _bound, "jac": _jacobian, "args": [i * 2 + 1, flap.height]})


def check_bounds(x: Array, n: int, flaps: list[Flap]) -> bool:
	flap = flaps[n]
	if flap.width != 0 and _exact(x, n * 2, flap.width) < 0:
		return False
	if flap.height != 0 and _exact(x, n * 2 + 1, flap.height) < 0:
		return False
	return True
