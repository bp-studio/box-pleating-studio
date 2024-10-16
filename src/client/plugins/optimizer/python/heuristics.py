import math
import random
import numpy as np

from .solver import objective, pack
from .constraints import generate_constraints, select_initial_scale
from .problem import Circle, Hierarchy


def generate_candidate(target: int, hierarchies: list[Hierarchy]):
	vectors = []
	try:
		growth = target ** (1 / len(hierarchies))
		num = growth
		total = estimate_total(target, growth, len(hierarchies))
		generated = 0

		def callback():
			nonlocal generated
			generated += 1
			print(f'{{"event": "candidate", "data": [{generated}, {total}]}}')

		last_hierarchy = None
		for hierarchy in hierarchies:
			constraints = generate_constraints(hierarchy)
			if len(vectors) == 0:
				vectors = generate_candidate_core(math.floor(num), constraints, hierarchy, callback)
			else:
				next_vec = []
				num_per_vec = round(num / len(vectors))
				for vec in vectors:
					circles = make_circles(vec, hierarchy, last_hierarchy)
					n = min(num_per_vec, target - len(next_vec))
					vec = generate_candidate_core(n, constraints, hierarchy, callback, circles)
					next_vec.extend(vec)
				vectors = next_vec
			last_hierarchy = hierarchy
			num *= growth
	except KeyboardInterrupt:
		pass

	vectors.sort(key=objective)
	return vectors[:target]


def estimate_total(target: int, growth: float, rounds: int) -> int:
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


def make_circles(vec, hierarchy: Hierarchy, last_hierarchy: Hierarchy):
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


def generate_candidate_core(target: int, constraints, hierarchy: Hierarchy, callback, circles=None):
	vectors = []
	while len(vectors) < target:
		if circles is None:
			vec = np.random.rand(len(hierarchy.flaps) * 2 + 1)
		else:
			vec = np.array(generate_in_circles(circles))
		select_initial_scale(vec, hierarchy)
		result = pack(vec, constraints)
		if result.success:
			vectors.append(result.x)
			callback()
	return vectors


def generate_in_circles(circles: list[Circle]):
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
