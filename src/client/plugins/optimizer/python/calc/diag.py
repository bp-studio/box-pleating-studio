from typing import Optional

import numpy as np

from . import ConstraintDict, Array, Sheet, Flap


def _bound(x: Array, i: int, fx: int, fy: int, offset: int, v: float) -> float:
	return fx * x[i * 2] + fy * x[i * 2 + 1] + offset * x[-1] + v


def _jacobian(x: Array, i: int, fx: int, fy: int, offset: int, _) -> np.ndarray:
	vec: list[float] = [0] * len(x)
	vec[i * 2] = fx
	vec[i * 2 + 1] = fy
	vec[-1] = offset
	return np.array(vec)


def _make(i: int, fx: int, fy: int, offset: int, v: float):
	return {"type": "ineq", "fun": _bound, "jac": _jacobian, "args": [i, fx, fy, offset, v]}


class Diag(Sheet):
	@staticmethod
	def add_bounds(cons: list[ConstraintDict], flaps: list[Flap], fixed: Optional[list[bool]] = None):
		for i, flap in enumerate(flaps):
			if fixed and fixed[i]:
				continue

			offset = min(flap.width, flap.height)
			cons.append(_make(i, 1, 1, offset, -0.5))  # LL
			cons.append(_make(i, -1, -1, -offset, 1.5))  # UR
			cons.append(_make(i, 1, -1, -offset, 0.5))  # UL
			cons.append(_make(i, -1, 1, -offset, 0.5))  # LR

	@staticmethod
	def check_bounds(xk: Array, n: int, flaps: list[Flap]) -> bool:
		return True  # For diagonal sheet there's nothing to check

	@staticmethod
	def get_offset() -> float:
		return 0.5  # Use the center of the sheet as origin

	@staticmethod
	def output(solution: Array) -> list[int]:
		# For diagonal sheet, we only output even grid size
		coords = [round(v) for v in solution[:-1]]
		grid = max(abs(x) + abs(y) for x, y in zip(coords[::2], coords[1::2]))
		return [v + grid for v in coords] + [2 * grid]
