import numpy as np


def _constraint(x: list[float], i: int, v: float) -> float:
	return x[i] - v * x[-1]


def _jacobian(x: list[float], i: int, v: float):
	vec: list[float] = [0] * len(x)
	vec[i] = 1
	vec[-1] = -v
	return np.array(vec)


def make(i: int, v: float):
	return {
		"type": "eq",
		"fun": _constraint,
		"jac": _jacobian,
		"args": [i, v],
	}
