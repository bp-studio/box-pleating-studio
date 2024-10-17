from ..solver import pack
from ..calc import GRID_ERROR, get_scale, int_scale
from ..problem import Hierarchy
from . import BranchingContext, meg, to_float


def _get_offset(x: float):
	return abs(round(x) - x)


def _select_max_offset(context: BranchingContext) -> int:
	"""Select next branching flap by the maximal offset."""
	max_offset = 0
	max_n = 0
	flap_count = len(context.fixed)
	for n in range(flap_count):
		if context.fixed[n]:
			continue
		ox = _get_offset(context.solution[n * 2])
		oy = _get_offset(context.solution[n * 2 + 1])
		offset = meg(ox, oy)
		if offset > max_offset:
			max_offset = offset
			max_n = n
	return max_n


def solve_integer(constraints, x0, grid, hierarchy: Hierarchy):
	"""
	This is a more standard implementation of the branch-and-bound algorithm.

	In each iteration, it branches at the flap that is the most "non-integral",
	navigates the branch with the minimal scale,
	and backtracks if all branches leads to a scale larger than the target grid size.
	"""
	stack = []
	context = BranchingContext(constraints, x0, hierarchy, grid)
	backtrack_count = 0
	try:
		while len(stack) < context.flap_count:
			if len(stack) > 0:
				state = stack[-1]
				index = state["index"]
				if index >= len(state["children"]):
					context.fixed[state["fix"]] = False
					stack.pop()
					backtrack_count += 1
					# To avoid wasting too much time backtracking, we set a limit here
					if len(stack) == 0 or backtrack_count == context.flap_count:
						return None
					stack[-1]["index"] += 1
					continue
				progress = [s["index"] for s in stack]
				print(f'{{"event": "fit", "data": [{grid}, {progress}]}}')
				context.solution = state["children"][index]

			branch_at = _select_max_offset(context)
			context.fixed[branch_at] = True
			children = _branch(branch_at, context, grid)

			if len(children) == 0:
				if len(stack) == 0:
					return None
				context.fixed[branch_at] = False
				state["index"] += 1
				continue

			children.sort(key=get_scale)
			stack.append(
				{
					"fix": branch_at,
					"index": 0,
					"children": [context.to_grid(c, grid) for c in children],
				}
			)
	except KeyboardInterrupt:
		return context.round()

	solution = stack[-1]["children"][0]
	solution[-1] = int_scale(solution[-1])
	return solution


def _branch(branch_at, context: BranchingContext, grid):
	children = []
	x, y = context.get(branch_at)
	for q in range(4):
		xk = context.branch(x, y, branch_at, q)
		if xk is None:
			continue

		solution = pack(to_float(xk), context.constraints, context.fixed)
		ok = solution.success and get_scale(solution.x) <= grid + GRID_ERROR
		if ok:
			children.append(solution.x)

	return children
