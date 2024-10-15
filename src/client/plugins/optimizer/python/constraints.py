from .calc import circle, rect, rounded, set_scale
from .problem import Hierarchy


MIN_SHEET_SIZE = 4
MAX_SHEET_SIZE = 8192
MAX_INIT_SCALE = 1024


def generate_constraints(hierarchy: Hierarchy):
	cons = []
	rect.add_bounds(cons, hierarchy.flaps)

	for entry in hierarchy.dist_map:
		[i, j, dist] = entry
		if hierarchy.flaps[i].has_dimension() or hierarchy.flaps[j].has_dimension():
			cons.append(rounded.make(i, j, dist, hierarchy.flaps))
		else:
			cons.append(circle.make(i, j, dist))
	return cons


def select_initial_scale(x, hierarchy: Hierarchy):
	grid = MIN_SHEET_SIZE
	set_scale(x, grid)
	for entry in hierarchy.dist_map:
		[i, j, dist] = entry
		while rounded.constraint(x, i, j, dist, hierarchy.flaps) < 0:
			grid += 1
			set_scale(x, grid)
			if grid >= MAX_INIT_SCALE:
				return x  # Proceed regardlessly
	return x


def check_constraints(x, n, fix, hierarchy: Hierarchy) -> bool:
	if not rect.check_bounds(x, n, hierarchy.flaps):
		return False

	for entry in hierarchy.dist_map:
		[i, j, dist] = entry
		if i == n and fix[j] or j == n and fix[i]:
			if rounded.exact(x, i, j, dist, hierarchy.flaps) < 0:
				return False
	return True
