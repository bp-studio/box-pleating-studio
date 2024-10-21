import math
from typing import Optional

import numpy as np

from .calc import ConstraintDict, circle, rect, rounded, set_scale
from .calc.infer import infer_scale
from .problem import Hierarchy


MIN_SHEET_SIZE = 4
MAX_SHEET_SIZE = 8192
MAX_INIT_SCALE = 1024


def generate_constraints(hierarchy: Hierarchy, fixed: Optional[list[bool]] = None) -> list[ConstraintDict]:
	cons: list[ConstraintDict] = []
	rect.add_bounds(cons, hierarchy.flaps, fixed)

	for entry in hierarchy.dist_map:
		[i, j, dist] = entry

		# Omit the constraint if both flaps are fixed.
		if fixed and fixed[i] and fixed[j]:
			continue

		if hierarchy.flaps[i].has_dimension() or hierarchy.flaps[j].has_dimension():
			cons.append(rounded.make(i, j, dist, hierarchy.flaps))
		else:
			cons.append(circle.make(i, j, dist))
	return cons


def select_initial_scale(x0: np.ndarray, hierarchy: Hierarchy) -> np.ndarray:
	grid = MIN_SHEET_SIZE
	for entry in hierarchy.dist_map:
		[i, j, dist] = entry
		s = infer_scale(x0, i, j, dist, hierarchy.flaps)
		if s > MAX_INIT_SCALE:
			grid = MAX_INIT_SCALE  # Proceed regardlessly
			break
		grid = max(math.ceil(s), grid)
	set_scale(x0, grid)
	return x0


def check_constraints(x, n: int, fixed: list[bool], hierarchy: Hierarchy) -> bool:
	if not rect.check_bounds(x, n, hierarchy.flaps):
		return False

	for entry in hierarchy.dist_map:
		[i, j, dist] = entry
		if i == n and fixed[j] or j == n and fixed[i]:
			# if fixed[i] and fixed[j]:
			if rounded.exact(x, i, j, dist, hierarchy.flaps) < 0:
				return False
	return True
