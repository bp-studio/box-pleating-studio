import math
import random
import signal
from typing import Callable, cast

import numpy as np

from .calc import ConstraintDict, get_scale
from .solver import objective, pack
from .constraints import generate_constraints, select_initial_scale
from .problem import Circle, Hierarchy


def generate_candidate(target: int, hierarchies: list[Hierarchy]) -> list[np.ndarray]:
	vectors: list[np.ndarray] = []
	growth = target ** (1 / len(hierarchies))
	num = growth
	total = _estimate_total(target, growth, len(hierarchies))
	generated = 0

	def callback():
		nonlocal generated
		print(f'{{"event": "candidate", "data": [{generated}, {total}]}}')
		generated += 1

	context = GenerateContext(callback)
	handler = signal.signal(signal.SIGINT, context.handler)

	callback()
	last_hierarchy = None
	for hierarchy in hierarchies:
		context.set_hierarchy(hierarchy)
		if len(vectors) == 0:
			vectors = _generate_candidate(math.floor(num), context)
		elif last_hierarchy:
			vectors = _generate_next_level(vectors, context, last_hierarchy, num, target)
		last_hierarchy = hierarchy
		num *= growth

	vectors.sort(key=objective)
	signal.signal(signal.SIGINT, handler)
	return vectors[:target]


class GenerateContext:
	def __init__(self, callback: Callable):
		self.hierarchy: Hierarchy
		self.constraints: list[ConstraintDict] = []
		self.callback = callback
		self.interrupted = False

	def set_hierarchy(self, hierarchy: Hierarchy):
		self.hierarchy = hierarchy
		self.constraints = generate_constraints(hierarchy)

	def handler(self, _, __):
		self.interrupted = True


def _generate_next_level(
	vectors: list[np.ndarray], context: GenerateContext, last_hierarchy: Hierarchy, num: float, target: int
) -> list[np.ndarray]:
	next_vec: list[np.ndarray] = []
	num_per_vec = round(num / len(vectors))
	for vec in vectors:
		circles = _make_circles(vec, context.hierarchy, last_hierarchy)
		n = min(num_per_vec, target - len(next_vec))
		candidates = _generate_candidate(n, context, circles)
		next_vec.extend(candidates)
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


def _make_circles(vec, hierarchy: Hierarchy, last_hierarchy: Hierarchy) -> list[Circle]:
	circles: list[Circle] = []
	for f in hierarchy.flaps:
		parent = hierarchy.parent_map.get(f.id, None)
		if parent is not None:
			n = next(i for i, x in enumerate(last_hierarchy.flaps) if x.id == parent.id)
			circles.append(Circle(vec[n * 2], vec[n * 2 + 1], parent.radius * vec[-1]))
		else:
			n = next(i for i, x in enumerate(last_hierarchy.flaps) if x.id == f.id)
			circles.append(Circle(vec[n * 2], vec[n * 2 + 1], 0))
	return circles


def _generate_candidate(target: int, context: GenerateContext, circles=None) -> list[np.ndarray]:
	vectors: list[np.ndarray] = []
	while len(vectors) < target:
		vec = _generate_random_candidate(context.hierarchy, circles)
		if not context.interrupted:
			result = pack(vec, context.constraints)
			if not result.success:
				continue
			vec = result.x
		vectors.append(vec)
		context.callback()
	return vectors


def _generate_random_candidate(hierarchy: Hierarchy, circles) -> np.ndarray:
	result = None
	for _ in range(4):
		if circles is None:
			vec: np.ndarray = np.random.rand(len(hierarchy.flaps) * 2 + 1)
		else:
			vec = np.array(_generate_in_circles(circles))
		select_initial_scale(vec, hierarchy)
		if result is None or get_scale(vec) < get_scale(result):
			result = vec
	return cast(np.ndarray, result)


def _generate_in_circles(circles: list[Circle]) -> list[float]:
	vec: list[float] = []
	for c in circles:
		if c.radius == 0:
			vec += [c.x, c.y]
		else:
			theta = random.uniform(0, 2 * math.pi)
			r = c.radius * math.sqrt(random.uniform(0, 1))  # uniform with respect to area
			vec += [c.x + r * math.cos(theta), c.y + r * math.sin(theta)]
	vec += [0]
	return vec
