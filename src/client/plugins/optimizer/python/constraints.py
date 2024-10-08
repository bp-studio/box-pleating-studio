from .calc import circle, rect, rounded, set_scale
from .problem import Problem


MIN_SHEET_SIZE = 4
MAX_SHEET_SIZE = 8192
MAX_INIT_SCALE = 1024


def generate_constraints(problem: Problem):
	cons = []
	rect.add_bounds(cons, problem.flaps)

	for entry in problem.dist_map:
		[i, j, dist] = entry
		if problem.flaps[i].has_dimension() or problem.flaps[j].has_dimension():
			cons.append(rounded.make(i, j, dist, problem.flaps))
		else:
			cons.append(circle.make(i, j, dist))
	return cons


def select_initial_scale(x, problem: Problem):
	grid = MIN_SHEET_SIZE
	set_scale(x, grid)
	for entry in problem.dist_map:
		[i, j, dist] = entry
		while rounded.constraint(x, i, j, dist, problem.flaps) < 0:
			grid += 1
			set_scale(x, grid)
			if grid >= MAX_INIT_SCALE:
				return x  # Proceed regardlessly
	return x


def check_constraints(x, n, fix, problem: Problem) -> bool:
	if not rect.check_bounds(x, n, problem.flaps):
		return False

	for entry in problem.dist_map:
		[i, j, dist] = entry
		if i == n and fix[j] or j == n and fix[i]:
			if rounded.exact(x, i, j, dist, problem.flaps) < 0:
				return False
	return True
