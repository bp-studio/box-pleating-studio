import math
import numpy as np

from .solver import pack
from .constraints import check_constraints, get_scale, set_scale


def _meg(x: float, y: float):
	return math.sqrt(x * x + y * y)


def _get_offset(x: float):
	return abs(round(x) - x)


def _branch(x: float, dir: int):
	if dir == 0:
		return math.floor(x)
	else:
		return math.ceil(x)


def _select_max_offset(fix: list[bool], current_solution: list[float], grid: int) -> int:
	"""Select next branching flap by the maximal offset."""
	max_offset = 0
	max_n = 0
	flap_count = len(fix)
	for n in range(flap_count):
		if fix[n]:
			continue
		ox = _get_offset(current_solution[n * 2] * grid)
		oy = _get_offset(current_solution[n * 2 + 1] * grid)
		offset = _meg(ox, oy)
		if offset > max_offset:
			max_offset = offset
			max_n = n
	return max_n


def _select_lower_left(fix: list[bool], current_solution: list[float]) -> int:
	min_meg = 2
	min_n = 0
	flap_count = len(fix)
	for n in range(flap_count):
		if fix[n]:
			continue
		meg = _meg(current_solution[n * 2], current_solution[n * 2 + 1])
		if meg < min_meg:
			min_meg = meg
			min_n = n
	return min_n


MAX_BACKTRACK = 10


def solve_integer(constraints, x0, grid, dist_map):
	print(f'{{"event": "grid", "data": {grid}}}')
	stack = []
	flap_count = (len(x0) - 1) >> 1
	fix = [False] * flap_count

	backtrack_count = 0

	while len(stack) < flap_count:
		depth = len(stack)
		if depth == 0:
			current_solution = x0
		else:
			state = stack[-1]
			index = state["index"]
			child_count = len(state["children"])
			if index >= child_count:
				fix[state["fix"]] = False
				stack.pop()
				backtrack_count += 1
				if len(stack) == 0 or backtrack_count == MAX_BACKTRACK:
					return None
				else:
					stack[-1]["index"] += 1
				continue
			progress = [s["index"] for s in stack]
			print(f'{{"event": "fit", "data": {progress}}}')
			current_solution = state["children"][state["index"]]

		branch_at = _select_max_offset(fix, current_solution, grid)
		fix[branch_at] = True

		children = []
		i = branch_at * 2
		x = current_solution[i] * grid
		y = current_solution[i + 1] * grid
		for q in range(4):
			if x.is_integer() and q % 2 == 1 or y.is_integer() and q > 1:
				continue
			xk = np.copy(current_solution)
			xk[i] = _branch(x, q & 1) / grid
			xk[i + 1] = _branch(y, q >> 1) / grid
			set_scale(xk, grid)
			if not check_constraints(xk, branch_at, fix, dist_map):
				continue
			solution = pack(xk, constraints, fix)
			ok = solution.success and get_scale(solution.x) <= grid
			if ok:
				children.append(solution.x)

		if len(children) == 0:
			if depth == 0:
				return None
			fix[branch_at] = False
			state["index"] += 1
			continue

		children.sort(key=get_scale)
		stack.append(
			{
				"fix": branch_at,
				"index": 0,
				"children": children,
			}
		)

	return stack[-1]["children"][0]


def greedy_solve_integer(constraints, x0, grid, dist_map):
	print(f'{{"event": "grid", "data": {grid}}}')
	flap_count = (len(x0) - 1) >> 1
	fix = [False] * flap_count
	f_grid = grid

	depth = 0
	current_solution = x0
	while depth < flap_count:
		print(f'{{"event": "greedy", "data": {depth}}}')

		branch_at = _select_lower_left(fix, current_solution)
		fix[branch_at] = True
		# print(("branch", branch_at))

		children = []
		i = branch_at * 2
		x = current_solution[i] * f_grid
		y = current_solution[i + 1] * f_grid
		for q in range(4):
			if x.is_integer() and q % 2 == 1 or y.is_integer() and q > 1:
				continue
			xk = np.copy(current_solution)
			xk[i] = _branch(x, q & 1) / f_grid
			xk[i + 1] = _branch(y, q >> 1) / f_grid
			set_scale(xk, f_grid)

			if not check_constraints(xk, branch_at, fix, dist_map):
				continue

			solution = pack(xk, constraints, fix)
			if solution.success:
				children.append(solution.x)

		if len(children) == 0:
			return None

		# In greedy mode, we don't do any backtracking.
		# We always navigate only the most promising branch.
		children.sort(key=get_scale)
		current_solution = children[0]

		# What if even the best solution requires larger sheet?
		# No problem! Just enlarge the sheet and keep going.
		current_grid = get_scale(current_solution)
		if current_grid > f_grid:
			current_solution = resize_solution(current_solution, current_grid)
			f_grid = current_grid
			if math.ceil(f_grid) > grid:
				grid = math.ceil(f_grid)
				# We don't report new grid size here, since the increase could be an illusion.

		depth += 1

	if f_grid != grid:  # Make one more resizing if needed
		current_solution = resize_solution(current_solution, grid)

	return current_solution


def resize_solution(solution, new):
	old = get_scale(solution)
	vec = [v * old / new for v in solution[:-1]] + [0]
	set_scale(vec, new)
	return vec
