CONS_WEIGHT = 3  # This reduces constraint violations.


def get_scale(x: list[float]):
	return 1 / x[-1]


def set_scale(x: list[float], s: float):
	x[-1] = 1 / s
