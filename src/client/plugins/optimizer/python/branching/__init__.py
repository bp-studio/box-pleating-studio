import math
import numpy as np

from ..constraints import check_constraints
from ..problem import Hierarchy
from ..calc import get_scale


def meg(x: float, y: float):
	return math.sqrt(x * x + y * y)


def _branch(x: float, direction: int):
	return math.floor(x) if direction == 0 else math.ceil(x)


def to_grid(x: list[float], fixed: list[bool], grid=None) -> list[float]:
	grid = grid or get_scale(x)
	return [coord for i, fix in enumerate(fixed) for coord in _to_grid_core(x, i, fix, grid)] + [grid]


def to_float(x):
	result = x[:-1] / x[-1]
	return np.append(result, [1 / x[-1]])


class BranchingContext:
	def __init__(self, constraints, x0, hierarchy: Hierarchy, grid=None):
		self.constraints = constraints
		self.hierarchy = hierarchy
		self.flap_count = (len(x0) - 1) >> 1
		self.fixed = [False] * self.flap_count
		self.current_solution = to_grid(x0, self.fixed, grid)

	def get(self, i: int):
		return (
			_convert_if_almost_integer(self.current_solution[i * 2]),
			_convert_if_almost_integer(self.current_solution[i * 2 + 1]),
		)

	def branch(self, x, y, i: int, q: int):
		xk = np.copy(self.current_solution)
		xk[i * 2] = _branch(x, q & 1)
		xk[i * 2 + 1] = _branch(y, q >> 1)
		return xk

	def check_constraints(self, xk, branch_at):
		return check_constraints(xk, branch_at, self.fixed, self.hierarchy)


def _convert_if_almost_integer(x: float):
	rnd = round(x)
	return float(rnd) if abs(x - rnd) < 1e-5 else x


def _to_grid_core(x: list[float], i: int, fix: bool, grid: int):
	return (_round_if_fix(coord * grid, fix) for coord in x[i * 2 : i * 2 + 2])


def _round_if_fix(v: float, fix: bool):
	return round(v) if fix else v
