import math
from abc import ABC, abstractmethod
from typing import Any, Optional, TypedDict, Callable, Union, cast

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


class Flap:
	def __init__(self, data: dict):
		self.id = cast(int, data["id"])
		self.width = cast(int, data["width"])
		self.height = cast(int, data["height"])

	def has_dimension(self) -> bool:
		return self.height != 0 or self.width != 0


class Sheet(ABC):
	@staticmethod
	@abstractmethod
	def add_bounds(cons: list[ConstraintDict], flaps: list[Flap], fixed: Optional[list[bool]] = None):
		pass

	@staticmethod
	@abstractmethod
	def check_bounds(xk: Array, n: int, flaps: list[Flap]) -> bool:
		pass

	@staticmethod
	@abstractmethod
	def get_offset() -> float:
		pass

	@staticmethod
	@abstractmethod
	def output(solution: Array) -> list[int]:
		pass
