from ..branching.greedy import greedy_solve_integer
from ..branching.standard import solve_integer
from ..solver import pack
from ..calc import get_scale
from ..constraints import generate_constraints, select_initial_scale
from ..problem import Problem


def test_optimizer():
	problem = Problem(
		{
			"type": "rect",
			"flaps": [
				{"id": 1, "width": 0, "height": 0},
				{"id": 2, "width": 0, "height": 0},
				{"id": 4, "width": 0, "height": 0},
			],
			"hierarchies": [
				{
					"leaves": [1, 2, 4],
					"distMap": [[1, 2, 16], [1, 4, 16], [2, 4, 12]],
					"parents": [],
				}
			],
		}
	)
	hierarchy = problem.hierarchies[-1]
	constraints = generate_constraints(hierarchy)
	x0 = [0.3, 0.3, 0.4, 0.5, 0.5, 0.4, 0]
	select_initial_scale(x0, hierarchy)
	assert get_scale(x0) == 85.0
	result = pack(x0, constraints)
	assert result.success
	x = result.x
	solution = greedy_solve_integer(constraints, x, round(get_scale(x)), hierarchy)
	assert solution == [0, 0, 6, 15, 15, 6, 15]

	solution = solve_integer(constraints, x, round(get_scale(x)), hierarchy)
	assert solution == [0, 0, 6, 15, 15, 6, 15]
