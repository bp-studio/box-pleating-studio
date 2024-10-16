import math

from ..solver import pack
from ..problem import Hierarchy
from ..calc import GRID_ERROR, get_scale, int_scale, set_scale
from . import BranchingContext, to_float, to_grid, meg


def _select_lower_left(context: BranchingContext) -> int:
	min_meg = 2 * context.current_solution[-1]
	min_n = 0
	flap_count = len(context.fixed)
	for n in range(flap_count):
		if context.fixed[n]:
			continue
		m = meg(context.current_solution[n * 2], context.current_solution[n * 2 + 1])
		if m < min_meg:
			min_meg = m
			min_n = n
	return min_n


def greedy_solve_integer(constraints, x0, grid, hierarchy: Hierarchy):
	context = BranchingContext(constraints, x0, hierarchy)
	f_grid = grid
	depth = 0
	try:
		while depth < context.flap_count:
			print(f'{{"event": "greedy", "data": [{grid}, {depth}]}}')

			branch_at = _select_lower_left(context)
			context.fixed[branch_at] = True
			# print(("branch", branch_at))

			children = _branch(branch_at, context, f_grid)
			if len(children) == 0:
				return None

			# In greedy mode, we don't do any backtracking.
			# We always navigate only the most promising branch.
			children.sort(key=get_scale)
			current_solution = to_grid(children[0], context.fixed)

			# What if even the best solution requires larger sheet?
			# No problem! Just enlarge the sheet and keep going.
			current_grid = current_solution[-1]
			if current_grid > f_grid + GRID_ERROR:
				current_solution[-1] = f_grid = current_grid
				grid = max(math.ceil(f_grid), grid)
				# We don't report new grid size here, since the increase could be an illusion.

			depth += 1

	except KeyboardInterrupt:
		pass

	current_solution[-1] = int_scale(current_solution[-1])
	return current_solution


def _branch(branch_at, context: BranchingContext, f_grid):
	children = []
	x, y = context.get(branch_at)
	for q in range(4):
		if x.is_integer() and q % 2 == 1 or y.is_integer() and q > 1:
			continue
		xk = context.branch(x, y, branch_at, q)
		if not context.check_constraints(xk, branch_at):
			continue

		xk = to_float(xk)
		set_scale(xk, f_grid)
		if q == 0:
			children.append(xk)
			break  # greedy

		solution = pack(xk, context.constraints, context.fixed)
		if solution.success:
			children.append(solution.x)

	return children
