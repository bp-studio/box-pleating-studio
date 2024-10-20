import math


GRID_ERROR = 1e-4


def int_scale(s: float):
	return math.ceil(s - GRID_ERROR)


def get_scale(x: list[float]):
	return 1 / x[-1]


def set_scale(x: list[float], s: float):
	x[-1] = 1 / s  # Denoted as `m`
