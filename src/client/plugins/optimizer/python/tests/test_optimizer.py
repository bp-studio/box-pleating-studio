import numpy as np
import pytest

from ..calc.infer import infer_scale
from ..branching.greedy import greedy_solve_integer, annulus
from ..solver import pack
from ..calc import get_scale
from ..constraints import generate_constraints, select_initial_scale
from ..problem import Flap, Problem


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
	x0 = np.array([0.3, 0.3, 0.4, 0.5, 0.5, 0.4, 0])
	select_initial_scale(x0, hierarchy)
	assert get_scale(x0) == 85.0
	result = pack(x0, constraints)
	assert result.success
	x = result.x
	solution = greedy_solve_integer(x, hierarchy)
	assert solution == pytest.approx([0, 0, 6, 15, 15, 7, 15])


def test_annulus():
	assert len(annulus(1)) == 8
	assert len(annulus(2)) == 16
	assert len(annulus(3)) == 20


def test_infer_scale():
	flaps = [Flap({"id": 0, "width": 2, "height": 1}), Flap({"id": 1, "width": 0, "height": 0})]
	assert infer_scale([0.1, 0.1, 0.7, 0.5], 0, 1, 5, flaps) == 10
	assert infer_scale([0.1, 0.1, 0.2, 0.7], 0, 1, 5, flaps) == 10
	assert infer_scale([0.1, 0.1, 0.8, 0.1], 0, 1, 5, flaps) == pytest.approx(10)
