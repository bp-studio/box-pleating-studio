from typing import Optional

import numpy as np

from . import ConstraintDict, Array, Sheet, Flap


def _bound(x: Array, i: int, dim: int) -> float:
	return 1 - x[i] - dim * x[-1]


def _jacobian(x: Array, i: int, dim: int) -> np.ndarray:
	vec: list[float] = [0] * len(x)
	vec[i] = -1
	vec[-1] = -dim
	return np.array(vec)


class Rect(Sheet):
	@staticmethod
	def add_bounds(cons: list[ConstraintDict], flaps: list[Flap], fixed: Optional[list[bool]] = None):
		for i, flap in enumerate(flaps):
			if fixed and fixed[i]:
				continue
			if flap.width != 0:
				cons.append({"type": "ineq", "fun": _bound, "jac": _jacobian, "args": [i * 2, flap.width]})
			if flap.height != 0:
				cons.append({"type": "ineq", "fun": _bound, "jac": _jacobian, "args": [i * 2 + 1, flap.height]})

	@staticmethod
	def check_bounds(xk: Array, n: int, flaps: list[Flap]) -> bool:
		return xk[n * 2] >= 0 and xk[n * 2 + 1] >= 0

	@staticmethod
	def get_offset() -> float:
		return 0  # No offset

	@staticmethod
	def output(solution: Array) -> list[int]:
		coords = [round(v) for v in solution[:-1]]
		return coords + [max(coords)]
