import numpy as np

from . import ConstraintDict, Array


def _constraint(x: Array, i: int, v: float, offset: float) -> float:
	return x[i] - offset - v * x[-1]


def _jacobian(x: Array, i: int, v: float, _) -> np.ndarray:
	vec: list[float] = [0] * len(x)
	vec[i] = 1
	vec[-1] = -v
	return np.array(vec)


def make(i: int, v: float, offset: float) -> ConstraintDict:
	return {
		"type": "eq",
		"fun": _constraint,
		"jac": _jacobian,
		"args": [i, v, offset],
	}
