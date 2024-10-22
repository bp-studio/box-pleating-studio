import math

import numpy as np

from ..solver import pack
from ..problem import Hierarchy
from ..calc import get_scale, int_scale
from . import BranchingContext, meg


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


def greedy_solve_integer(x0: np.ndarray, hierarchy: Hierarchy) -> list[int]:
	"""
	For now this is the only reliable fitting algorithm I came up,
	in the sense that it is guaranteed to find a valid fitting on grids for any circle packing.
	For that reason, I currently do not provide alternative options for the users.
	"""
	context = BranchingContext(x0, hierarchy)
	depth = 0
	try:
		while depth < context.flap_count:
			print(f'{{"event": "greedy", "data": [{int_scale(context.solution[-1])}, {depth}]}}')
			branch_at = _select_lower_left(context)
			context.fixed[branch_at] = True
			context.solution = context.to_grid(_branch(branch_at, context))
			depth += 1
			# print(("info", hierarchy.lookup[branch_at], context.solution[branch_at * 2 : branch_at * 2 + 2]))

	except KeyboardInterrupt:
		pass

	return context.output()


def _branch(branch_at: int, context: BranchingContext) -> np.ndarray:
	children: list[np.ndarray] = []
	x, y = context.get(branch_at)

	# Try branching towards the 4 closest grid points.
	for q in range(4):
		xk = context.branch(x, y, branch_at, q)
		if xk is None:
			continue
		constraints = context.generate_constraints(xk)
		solution = pack(context.to_float(xk), constraints)
		if solution.success:
			children.append(solution.x)

	if len(children) > 0:
		# As a greedy algorithm, we don't do any backtracking.
		# We always navigate only the most promising branch.
		children.sort(key=get_scale)
		return children[0]

	# In some cases, the flap to be branched could get stuck by fixed flaps,
	# and none of the branch direction works.
	# The best we can do then is to find the closest spot that does work and continue.
	rx, ry = round(x), round(y)
	r = 1
	while True:
		pts = [(rx + dx, ry + dy) for dx, dy in annulus(r)]
		pts.sort(key=lambda t: meg(t[0] - x, t[1] - y)) # sorted by the distance to the original point
		for ox, oy in pts:
			xk = context.make_xk(ox, oy, branch_at)
			if xk is None:
				continue
			constraints = context.generate_constraints(xk)
			solution = pack(context.to_float(xk), constraints)
			if solution.success:
				print(("Fallback", [ox, oy]))  # Print debug message
				return solution.x
		r += 1


def annulus(r: int) -> list[tuple[int, int]]:
	"""
	Returns all grid points of distance [r, r+1) from the origin.
	"""
	result = []
	for x in range(-r, r + 1):
		low = math.ceil(math.sqrt(r * r - x * x))
		high = math.ceil(math.sqrt((r + 1) * (r + 1) - x * x))
		for y in range(low, high):
			result.append((x, y))
			if y > 0:
				result.append((x, -y))
	return result
