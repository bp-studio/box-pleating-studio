from ..solver import pack
from ..calc import get_scale
from ..constraints import generate_constraints, select_initial_scale
from ..problem import Problem


def test_optimizer():
	problem = Problem(
		{
			"type": "rect",
			"flaps": [
				{"width": 0, "height": 0},
				{"width": 0, "height": 0},
				{"width": 0, "height": 0},
			],
			"distMap": [[0, 1, 16], [0, 2, 16], [1, 2, 12]],
		}
	)
	constraints = generate_constraints(problem)
	x0 = [0.3, 0.3, 0.4, 0.5, 0.5, 0.4, 0]
	select_initial_scale(x0, problem)
	assert get_scale(x0) == 85.0
	result = pack(x0, constraints)
	assert result.success
	x = result.x
	grid = round(get_scale(x))
	assert grid == 15
	coordinates = [round(v * grid) for v in x[:-1]]
	assert coordinates == [0, 0, 6, 15, 15, 6]
