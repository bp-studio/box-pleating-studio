from ..solver import pack
from ..problem import Hierarchy
from ..calc import GRID_ERROR, get_scale
from . import BranchingContext, to_float, meg


def _select_lower_left(context: BranchingContext) -> int:
	min_meg = 2 * context.solution[-1]
	min_n = 0
	flap_count = len(context.fixed)
	for n in range(flap_count):
		if context.fixed[n]:
			continue
		m = meg(context.solution[n * 2], context.solution[n * 2 + 1])
		if m < min_meg:
			min_meg = m
			min_n = n
	return min_n


def greedy_solve_integer(constraints, x0, grid, hierarchy: Hierarchy):
	context = BranchingContext(constraints, x0, hierarchy, grid)
	depth = 0
	try:
		while depth < context.flap_count:
			# print(f'{{"event": "log", "data": {context.solution}}}')
			print(f'{{"event": "greedy", "data": [{grid}, {depth}]}}')

			branch_at = _select_lower_left(context)
			context.fixed[branch_at] = True
			# print(("branch", branch_at))

			children = _branch(branch_at, context)
			if len(children) == 0:
				return None

			# In greedy mode, we don't do any backtracking.
			# We always navigate only the most promising branch.
			children.sort(key=get_scale)

			if get_scale(children[0]) > grid + GRID_ERROR:
				return None

			context.solution = context.to_grid(children[0], grid)
			depth += 1

	except KeyboardInterrupt:
		context.solution = context.round()

	return context.solution


def _branch(branch_at, context: BranchingContext):
	children = []
	x, y = context.get(branch_at)
	for q in range(4):
		xk = context.branch(x, y, branch_at, q)
		if xk is None:
			continue

		xk = to_float(xk)
		solution = pack(xk, context.constraints, context.fixed)
		if solution.success:
			children.append(solution.x)

	return children
