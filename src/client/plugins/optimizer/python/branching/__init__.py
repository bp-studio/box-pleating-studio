import math
import numpy as np

from ..constraints import check_constraints
from ..problem import Hierarchy
from ..calc import get_scale


def meg(x: float, y: float):
	return math.sqrt(x * x + y * y)


def _branch(x: float, direction: int):
	return math.floor(x) if direction == 0 else math.ceil(x)


def to_float(x):
	return np.append(x[:-1], [1]) / x[-1]


class BranchingContext:
	def __init__(self, constraints, x0, hierarchy: Hierarchy, grid=None):
		self.constraints = constraints
		self.hierarchy = hierarchy
		self.flap_count = (len(x0) - 1) >> 1
		self.fixed = [False] * self.flap_count
		self.solution = self.to_grid(x0, grid)
		"""The current integral solution."""

	def get(self, i: int):
		return (
			_convert_if_almost_integer(self.solution[i * 2]),
			_convert_if_almost_integer(self.solution[i * 2 + 1]),
		)

	def branch(self, x, y, i: int, q: int):
		if x.is_integer() and q % 2 == 1 or y.is_integer() and q > 1:
			return None
		xk = np.copy(self.solution)
		xk[i * 2] = _branch(x, q & 1)
		xk[i * 2 + 1] = _branch(y, q >> 1)
		return xk if check_constraints(xk, i, self.fixed, self.hierarchy) else None

	def round(self):
		"""Used for interruption. Return the current progress regardlessly."""
		return [round(v) for v in self.solution]

	def to_grid(self, x: list[float], grid=None) -> list[float]:
		grid = grid or get_scale(x)
		return [coord for i, fix in enumerate(self.fixed) for coord in _to_grid_core(x, i, fix, grid)] + [grid]


def _convert_if_almost_integer(x: float):
	rnd = round(x)
	return float(rnd) if abs(x - rnd) < 1e-5 else x


def _to_grid_core(x: list[float], i: int, fix: bool, grid: int):
	return (_round_if_fix(coord * grid, fix) for coord in x[i * 2 : i * 2 + 2])


def _round_if_fix(v: float, fix: bool):
	return round(v) if fix else v
