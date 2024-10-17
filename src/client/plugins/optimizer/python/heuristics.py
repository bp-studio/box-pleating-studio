import math
import random
import numpy as np

from .calc import get_scale
from .solver import objective, pack
from .constraints import generate_constraints, select_initial_scale
from .problem import Circle, Hierarchy


def generate_candidate(target: int, hierarchies: list[Hierarchy]):
	vectors = []
	try:
		growth = target ** (1 / len(hierarchies))
		num = growth
		total = _estimate_total(target, growth, len(hierarchies))
		generated = 0

		def callback():
			nonlocal generated
			print(f'{{"event": "candidate", "data": [{generated}, {total}]}}')
			generated += 1

		callback()
		last_hierarchy = None
		for hierarchy in hierarchies:
			context = GenerateContext(hierarchy, callback)
			if len(vectors) == 0:
				vectors = _generate_candidate(math.floor(num), context)
			else:
				vectors = _generate_next_level(vectors, context, last_hierarchy, num, target)
			last_hierarchy = hierarchy
			num *= growth
	except KeyboardInterrupt:
		pass

	vectors.sort(key=objective)
	return vectors[:target]


class GenerateContext:
	def __init__(self, hierarchy, callback):
		self.hierarchy = hierarchy
		self.constraints = generate_constraints(hierarchy)
		self.callback = callback


def _generate_next_level(vectors, context: GenerateContext, last_hierarchy: Hierarchy, num, target):
	next_vec = []
	num_per_vec = round(num / len(vectors))
	for vec in vectors:
		circles = _make_circles(vec, context.hierarchy, last_hierarchy)
		n = min(num_per_vec, target - len(next_vec))
		vec = _generate_candidate(n, context, circles)
		next_vec.extend(vec)
	return next_vec


def _estimate_total(target: int, growth: float, rounds: int) -> int:
	total = 0
	vectors = 0
	num = growth
	for i in range(rounds):
		if i == 0:
			vectors = math.floor(num)
		else:
			next_vec = 0
			num_per_vec = round(num / vectors)
			for _ in range(vectors):
				n = min(num_per_vec, target - next_vec)
				next_vec += n
			vectors = next_vec
		total += vectors
		num *= growth
	return total


def _make_circles(vec, hierarchy: Hierarchy, last_hierarchy: Hierarchy):
	circles = []
	for f in hierarchy.flaps:
		parent = hierarchy.parent_map.get(f.id, None)
		if parent is not None:
			n = next(i for i, x in enumerate(last_hierarchy.flaps) if x.id == parent.id)
			circles.append(Circle(vec[n * 2], vec[n * 2 + 1], parent.radius * vec[-1]))
		else:
			n = next(i for i, x in enumerate(last_hierarchy.flaps) if x.id == f.id)
			circles.append(Circle(vec[n * 2], vec[n * 2 + 1], 0))
	return circles


def _generate_candidate(target: int, context: GenerateContext, circles=None):
	vectors = []
	while len(vectors) < target:
		vec = _generate_random_candidate(context.hierarchy, circles)
		result = pack(vec, context.constraints)
		if result.success:
			vectors.append(result.x)
			context.callback()
	return vectors


def _generate_random_candidate(hierarchy: Hierarchy, circles):
	result = None
	for _ in range(10):
		if circles is None:
			vec = np.random.rand(len(hierarchy.flaps) * 2 + 1)
		else:
			vec = np.array(_generate_in_circles(circles))
		select_initial_scale(vec, hierarchy)
		if result is None or get_scale(vec) < get_scale(result):
			result = vec
	return result


def _generate_in_circles(circles: list[Circle]):
	vec = []
	for c in circles:
		if c.radius == 0:
			vec += [c.x, c.y]
		else:
			theta = random.uniform(0, 2 * math.pi)
			r = c.radius * math.sqrt(random.uniform(0, 1))  # uniform with respect to area
			vec += [c.x + r * math.cos(theta), c.y + r * math.sin(theta)]
	vec += [0]
	return vec
