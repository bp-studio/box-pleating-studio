import math
from typing import Optional
import numpy as np

from ..constraints import check_constraints, generate_constraints
from ..problem import Hierarchy
from ..calc import ConstraintDict, get_scale, fixed, int_scale, Array


def meg(x: float, y: float) -> float:
	return math.sqrt(x * x + y * y)


def _branch(x: float, direction: int) -> float:
	return math.floor(x) if direction == 0 else math.ceil(x)


def to_float(x: np.ndarray) -> np.ndarray:
	return np.append(x[:-1], [1]) / x[-1]


class BranchingContext:
	def __init__(self, x0: np.ndarray, hierarchy: Hierarchy):
		self.hierarchy = hierarchy
		self.flap_count = (len(x0) - 1) >> 1
		self.fixed = [False] * self.flap_count
		self.solution = self.to_grid(x0)
		"""The current integral solution."""

	def get(self, i: int) -> tuple[float, float]:
		return (
			_convert_if_almost_integer(self.solution[i * 2]),
			_convert_if_almost_integer(self.solution[i * 2 + 1]),
		)

	def branch(self, x: float, y: float, i: int, q: int) -> Optional[np.ndarray]:
		if x.is_integer() and q % 2 == 1 or y.is_integer() and q > 1:
			return None
		return self.make_xk(_branch(x, q & 1), _branch(y, q >> 1), i)

	def make_xk(self, x: float, y: float, i: int) -> Optional[np.ndarray]:
		if x < 0 or y < 0:
			return None
		xk = np.copy(self.solution)
		xk[i * 2] = x
		xk[i * 2 + 1] = y
		return xk if check_constraints(xk, i, self.fixed, self.hierarchy) else None

	def round(self) -> list[int]:
		"""Used for interruption. Return the current progress regardlessly."""
		return [round(v) for v in self.solution[:-1]] + [int_scale(self.solution[-1])]

	def to_grid(self, x: Array) -> list[float]:
		grid = get_scale(x)
		return [coord for i, fix in enumerate(self.fixed) for coord in _to_grid_core(x, i, fix, grid)] + [grid]

	def generate_constraints(self, solution: np.ndarray) -> list[ConstraintDict]:
		"""
		Generate a new set of constraints by the current fixing status.
		Each fixed flap will contribute equality constraints for its coordinates,
		and distance constraints between a pair of fixed flaps will be omitted.
		"""
		result = generate_constraints(self.hierarchy, self.fixed)
		result.extend(fixed.make(i * 2 + j, solution[i * 2 + j]) for i, fix in enumerate(self.fixed) if fix for j in range(2))
		return result


def _convert_if_almost_integer(x: float) -> float:
	rnd = round(x)
	return float(rnd) if abs(x - rnd) < 1e-5 else x


def _to_grid_core(x: Array, i: int, fix: bool, grid: float):
	return (_round_if_fix(coord * grid, fix) for coord in x[i * 2 : i * 2 + 2])


def _round_if_fix(v: float, fix: bool):
	return round(v) if fix else v
