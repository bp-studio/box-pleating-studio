import math
from typing import Any, TypedDict, Callable, Union

import numpy as np

GRID_ERROR = 1e-4

NArray = np.ndarray[tuple[int], np.dtype[np.float32]]
Array = Union[NArray, list[float]]


def int_scale(s: float) -> int:
	return math.ceil(s - GRID_ERROR)


def get_scale(x: Array) -> float:
	return 1 / x[-1]


def set_scale(x: Array, s: float):
	x[-1] = 1 / s  # Denoted as `m`


class ConstraintDict(TypedDict):
	type: str
	fun: Callable
	jac: Callable
	args: list[Any]
